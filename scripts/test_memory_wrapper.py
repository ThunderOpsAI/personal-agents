#!/usr/bin/env python3
"""
Test script for Self-Improving Memory Wrapper.

Demonstrates:
  1. Creating/wrapping an agent instance (e.g. CMO agent).
  2. Logging a user override / preference.
  3. Querying & retrieving the preference via ChromaDB vector search.
  4. Asserting that system prompt dynamically mutates with `[Learned User Preferences]`.
  5. Validating `--dry-run` and live modes.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from rich.console import Console
from rich.panel import Panel

from src.agents.cmo import create_cmo_agent
from src.agents.prompts import CMO_SYSTEM_PROMPT
from src.memory.wrapper import MemoryWrappedAgent
from src.memory.vector_store import VectorPreferenceStore

console = Console()

SAMPLE_OVERRIDE = "Never schedule physical therapy on high-pain days."
QUERY_CONTEXT = "What physical therapy schedule is recommended for back recovery?"


def run_dry_run() -> None:
    """Run test script in dry-run mode without LLM calls."""
    console.print("[bold green]✅ DRY-RUN MODE[/] — Self-Improving Memory Wrapper Test\n")

    # 1. Instantiate base agent
    base_agent = create_cmo_agent()
    
    # 2. Wrap agent with ephemeral vector store
    vector_store = VectorPreferenceStore(ephemeral=True)
    wrapped_agent = MemoryWrappedAgent(agent=base_agent, vector_store=vector_store)

    console.print(f"[bold cyan]1. Original System Prompt Length:[/] {len(wrapped_agent.agent.instructions)} chars")
    assert "[Learned User Preferences]" not in wrapped_agent.agent.instructions

    # 3. Log user override / constraint
    console.print(f"\n[bold yellow]2. Logging User Override:[/] \"{SAMPLE_OVERRIDE}\"")
    doc_id = wrapped_agent.log_user_override(SAMPLE_OVERRIDE, category="medical_constraint")
    console.print(f"Logged Document ID: [dim]{doc_id}[/]")
    assert doc_id != ""

    # 4. Perform vector search retrieval
    console.print(f"\n[bold yellow]3. Querying Vector Store with context:[/] \"{QUERY_CONTEXT}\"")
    matches = vector_store.query_preferences(QUERY_CONTEXT, n_results=1)
    console.print(f"Retrieved Matches: {len(matches)}")
    assert len(matches) > 0
    assert matches[0]["text"] == SAMPLE_OVERRIDE
    console.print(f"Retrieved Text: [italic]\"{matches[0]['text']}\"[/]")

    # 5. Mutate prompt and assert mutation structure
    mutated_prompt = wrapped_agent.prompt_mutator.mutate_prompt(
        base_prompt=wrapped_agent.base_instructions,
        query=QUERY_CONTEXT,
    )

    console.print(f"\n[bold cyan]4. Mutated System Prompt Length:[/] {len(mutated_prompt)} chars")
    
    # Assertions
    assert CMO_SYSTEM_PROMPT in mutated_prompt, "Base prompt must be preserved!"
    assert "[Learned User Preferences]" in mutated_prompt, "Dynamic prompt section missing!"
    assert SAMPLE_OVERRIDE in mutated_prompt, "Logged preference text missing from mutated prompt!"

    console.print()
    console.print(Panel(
        mutated_prompt[-500:],
        title="[bold magenta]Tail of Mutated System Prompt[/]",
        border_style="magenta",
    ))

    console.print("\n[bold green]All assertions passed successfully! ✅[/]")


def run_live(query: str, debug: bool = False) -> None:
    """Run test script in live mode calling LLM."""
    from src.config import get_openai_api_key
    get_openai_api_key()

    console.print("[bold cyan]🔗 LIVE MODE[/] — Self-Improving Memory Wrapper Test\n")

    base_agent = create_cmo_agent(debug_mode=debug)
    wrapped_agent = MemoryWrappedAgent(agent=base_agent, ephemeral=True)

    console.print(f"[bold yellow]Logging Override:[/] \"{SAMPLE_OVERRIDE}\"")
    wrapped_agent.log_user_override(SAMPLE_OVERRIDE, category="medical_constraint")

    console.print(f"[bold cyan]Running Wrapped Agent Query:[/] \"{query}\"")
    response = wrapped_agent.run(query)

    console.print("\n[bold green]Agent Response Received Successfully![/]")
    console.print(str(response.content))


def main() -> None:
    parser = argparse.ArgumentParser(description="Test script for Self-Improving Memory Wrapper.")
    parser.add_argument("--dry-run", action="store_true", help="Run test assertions without LLM call.")
    parser.add_argument("--query", type=str, default=QUERY_CONTEXT, help="Query for live test.")
    parser.add_argument("--debug", action="store_true", help="Enable verbose debug mode.")
    args = parser.parse_args()

    if args.dry_run:
        run_dry_run()
    else:
        run_live(args.query, debug=args.debug)


if __name__ == "__main__":
    main()
