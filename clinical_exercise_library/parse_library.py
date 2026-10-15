import json
import re

source_path = "/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/agent_reports/2026-10-12_comprehensive_yoga_hydrotherapy_routine_library.md"

with open(source_path, "r", encoding="utf-8") as f:
    text = f.read()

# Let's extract metadata, sections, and routines
print(f"Read {len(text)} characters from source.")
