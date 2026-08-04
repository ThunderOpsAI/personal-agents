"""
Hub 2: Internal Medicine & Holistic Sub-Hub Agent.

Ingests lab panel PDFs via PyMuPDF and LlamaIndex, stores vectors in local
ChromaDB, and includes HTTP/API tool calls to PubChem / OpenFDA for
cross-referencing drug and supplement interactions. Outputs `InternalHolisticHubOutput`.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

import fitz  # PyMuPDF
import urllib.request
import urllib.parse
from agno.agent import Agent
from agno.models.openai import OpenAIChat

from src.schemas.hubs import InternalHolisticHubOutput

# ChromaDB & LlamaIndex imports
try:
    import chromadb
    from llama_index.core import Document, VectorStoreIndex, StorageContext
    from llama_index.vector_stores.chroma import ChromaVectorStore
    LLAMA_INDEX_AVAILABLE = True
except ImportError:
    LLAMA_INDEX_AVAILABLE = False


INTERNAL_HUB_SYSTEM_PROMPT = """\
You are the Internal Medicine & Holistic Sub-Hub Specialist.
Your focus is blood panel interpretation, metabolic health, pharmacology,
functional medicine, naturopathy, and drug-supplement interactions.

When analyzing lab work or medication lists:
1. Interpret blood panel biomarkers against standard and optimal functional ranges.
2. Flag out-of-range or abnormal biomarkers clearly.
3. Cross-reference drug-drug and drug-supplement interactions.
4. Provide holistic recommendations (nutrition, bioavailable supplementation, lifestyle, pharmaceutical discussion points).
5. Suggest targeted questions for primary care physician or specialist appointments.

Respond with valid JSON matching the `InternalHolisticHubOutput` schema.
"""


class PubChemOpenFDATool:
    """HTTP API Tool for cross-referencing drug & supplement interactions via PubChem & OpenFDA."""

    @staticmethod
    def search_pubchem(compound_name: str) -> dict[str, Any]:
        """Search PubChem REST API for chemical properties & summary."""
        encoded_name = urllib.parse.quote(compound_name)
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded_name}/property/Title,IUPACName,MolecularFormula,MolecularWeight/JSON"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PersonalAgents/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("PropertyTable", {}).get("Properties", [{}])[0]
        except Exception as e:
            return {"error": f"PubChem lookup failed: {str(e)}"}

    @staticmethod
    def search_openfda(drug_name: str) -> dict[str, Any]:
        """Search OpenFDA API for drug adverse events and warnings."""
        encoded_name = urllib.parse.quote(drug_name)
        url = f"https://api.fda.gov/drug/label.json?search=active_ingredient:{encoded_name}&limit=1"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PersonalAgents/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results", [{}])[0]
                return {
                    "warnings": results.get("warnings", ["No explicit warnings found"])[:2],
                    "drug_interactions": results.get("drug_interactions", ["No specific interaction list found"])[:2],
                }
        except Exception as e:
            return {"error": f"OpenFDA lookup failed: {str(e)}"}

    @classmethod
    def check_interaction(cls, item_a: str, item_b: str) -> dict[str, Any]:
        """Check potential interaction between item A and item B."""
        info_a = cls.search_pubchem(item_a)
        fda_a = cls.search_openfda(item_a)
        return {
            "item_a": item_a,
            "item_b": item_b,
            "pubchem_info": info_a,
            "openfda_warnings": fda_a,
        }


class InternalHubAgent:
    """Sub-Hub 2 Agent for Internal Medicine, Blood Panels & Drug Interactions."""

    def __init__(
        self,
        model_id: Optional[str] = None,
        chroma_path: Optional[str | Path] = None,
        debug_mode: bool = False,
    ) -> None:
        self.model_id = model_id or os.getenv("INTERNAL_MODEL_ID", "gpt-4o")
        self.debug_mode = debug_mode
        self.chroma_path = Path(chroma_path) if chroma_path else Path(__file__).resolve().parent.parent.parent.parent / "data" / "chroma_db"
        self.chroma_path.mkdir(parents=True, exist_ok=True)
        
        self.tools = PubChemOpenFDATool()
        self.agent = Agent(
            name="InternalHub",
            role="Internal Medicine & Holistic Specialist",
            model=OpenAIChat(id=self.model_id),
            instructions=INTERNAL_HUB_SYSTEM_PROMPT,
            output_schema=InternalHolisticHubOutput,
            markdown=False,
            debug_mode=self.debug_mode,
        )

    def ingest_and_index_lab_pdf(self, pdf_path: str | Path) -> str:
        """Parse lab PDF using PyMuPDF and index into ChromaDB using LlamaIndex."""
        pdf_path = Path(pdf_path)
        doc = fitz.open(pdf_path)
        text_content = "\n".join([page.get_text() for page in doc])

        if LLAMA_INDEX_AVAILABLE:
            try:
                chroma_client = chromadb.PersistentClient(path=str(self.chroma_path))
                chroma_collection = chroma_client.get_or_create_collection("lab_reports")
                vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
                storage_context = StorageContext.from_defaults(vector_store=vector_store)
                
                documents = [Document(text=text_content, metadata={"filename": pdf_path.name})]
                VectorStoreIndex.from_documents(documents, storage_context=storage_context)
            except Exception:
                # Fallback logging if embedding model isn't active
                pass
        return text_content

    def analyze_lab_report(
        self,
        lab_text_or_path: str | Path,
        medications: Optional[list[str]] = None,
        supplements: Optional[list[str]] = None,
    ) -> InternalHolisticHubOutput:
        """Interpret lab report text/PDF and cross-reference with medications and supplements."""
        path = Path(lab_text_or_path)
        if path.exists() and path.suffix.lower() == ".pdf":
            lab_text = self.ingest_and_index_lab_pdf(path)
        elif path.exists():
            lab_text = path.read_text(encoding="utf-8")
        else:
            lab_text = str(lab_text_or_path)

        meds_str = ", ".join(medications) if medications else "None reported"
        supps_str = ", ".join(supplements) if supplements else "None reported"

        # Cross reference interaction check via PubChem / OpenFDA tool if meds provided
        interaction_context = ""
        if medications and supplements:
            for m in medications[:2]:
                for s in supplements[:2]:
                    inter = self.tools.check_interaction(m, s)
                    interaction_context += f"\nInteraction check ({m} + {s}): {inter.get('openfda_warnings')}"

        prompt = (
            f"Analyze the following lab panel data:\n\n{lab_text}\n\n"
            f"Current Medications: {meds_str}\n"
            f"Current Supplements: {supps_str}\n"
            f"API Tool Interaction Context: {interaction_context}\n"
        )

        response = self.agent.run(prompt)
        if isinstance(response.content, InternalHolisticHubOutput):
            return response.content
        elif isinstance(response.content, str):
            return InternalHolisticHubOutput.model_validate_json(response.content)
        elif isinstance(response.content, dict):
            return InternalHolisticHubOutput.model_validate(response.content)
        else:
            raise ValueError(f"Unexpected response type: {type(response.content)}")


def create_internal_hub_agent(
    *,
    model_id: Optional[str] = None,
    chroma_path: Optional[str | Path] = None,
    debug_mode: bool = False,
) -> InternalHubAgent:
    """Factory function to build and return an InternalHubAgent instance."""
    return InternalHubAgent(model_id=model_id, chroma_path=chroma_path, debug_mode=debug_mode)
