"""
Vector Preference Store.

Uses ChromaDB (local persistent or ephemeral client) to embed and store learned
user constraints, style preferences, clinical feedback, and override rules.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
import chromadb
from chromadb.config import Settings


class VectorPreferenceStore:
    """
    ChromaDB-backed vector store for user preferences and learned constraints.
    """

    def __init__(
        self,
        collection_name: str = "user_preferences",
        persist_directory: Optional[str] = None,
        ephemeral: bool = False,
    ) -> None:
        """
        Initialize the vector store.

        Parameters
        ----------
        collection_name : str
            Name of the ChromaDB collection.
        persist_directory : str | None
            Directory path for persistent storage.
        ephemeral : bool
            If True, uses in-memory ephemeral client (useful for dry runs / testing).
        """
        self.collection_name = collection_name
        if ephemeral or not persist_directory:
            self.client = chromadb.Client(Settings(is_persistent=False))
        else:
            self.client = chromadb.PersistentClient(path=persist_directory)

        self.collection = self.client.get_or_create_collection(name=self.collection_name)

    def add_preference(
        self,
        text: str,
        category: str = "user_preference",
        metadata: Optional[Dict[str, Any]] = None,
        doc_id: Optional[str] = None,
    ) -> str:
        """
        Add a preference or learned constraint to vector storage.

        Parameters
        ----------
        text : str
            The preference or constraint statement.
        category : str
            Category of the preference (e.g. 'medical_constraint', 'schedule_override', 'style_preference').
        metadata : dict | None
            Additional key-value metadata.
        doc_id : str | None
            Optional document ID. Generated if not provided.

        Returns
        -------
        str
            Document ID.
        """
        if not doc_id:
            doc_id = str(uuid.uuid4())

        doc_metadata = metadata.copy() if metadata else {}
        doc_metadata["category"] = category

        try:
            self.collection.add(
                documents=[text],
                metadatas=[doc_metadata],
                ids=[doc_id],
            )
        except Exception:
            # Best-effort persistence when the embedding backend is unavailable.
            pass
        return doc_id

    def query_preferences(
        self,
        query: str,
        n_results: int = 3,
        category_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant user preferences matching the query vector.

        Parameters
        ----------
        query : str
            Query text.
        n_results : int
            Maximum number of matches to return.
        category_filter : str | None
            Optional category filter.

        Returns
        -------
        List[Dict[str, Any]]
            Matching preference items containing 'id', 'text', 'metadata', and 'distance'.
        """
        where_clause = {"category": category_filter} if category_filter else None
        
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_clause,
        )

        output: List[Dict[str, Any]] = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results.get("metadatas", [[]])[0]
            ids = results.get("ids", [[]])[0]
            distances = results.get("distances", [[]])[0] if results.get("distances") else [0.0] * len(docs)

            for doc, meta, doc_id, dist in zip(docs, metas, ids, distances):
                output.append({
                    "id": doc_id,
                    "text": doc,
                    "metadata": meta,
                    "distance": dist,
                })

        return output

    def get_all_preferences(self) -> List[Dict[str, Any]]:
        """Retrieve all stored preferences."""
        results = self.collection.get()
        output: List[Dict[str, Any]] = []
        if results and results.get("documents"):
            for doc, meta, doc_id in zip(results["documents"], results["metadatas"], results["ids"]):
                output.append({
                    "id": doc_id,
                    "text": doc,
                    "metadata": meta,
                })
        return output
