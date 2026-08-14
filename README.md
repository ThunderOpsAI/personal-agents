# Personal Agents

> Multi-agent medical advisory system powered by [Agno](https://github.com/agno-agi/agno).

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   CMO Orchestrator                   │
│  (Chief Medical Officer — Lead Agent)                │
│                                                      │
│  System Prompt: Expert Medical Research Analyst      │
│  Output Schema: PersonalAdvisorBrief (Pydantic v2)   │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │           PersonalAdvisorBrief                 │  │
│  │  ├── primary_synthesis                        │  │
│  │  ├── direct_recommendations[]                 │  │
│  │  │   └── RankedRecommendation                 │  │
│  │  │       ├── name                             │  │
│  │  │       ├── recommendation_level (enum)      │  │
│  │  │       ├── rationale                        │  │
│  │  │       ├── pros[]                           │  │
│  │  │       └── cons[]                           │  │
│  │  ├── contraindications_and_risks[]            │  │
│  │  │   └── ContraindicationFlag                 │  │
│  │  │       ├── title                            │  │
│  │  │       ├── severity (enum)                  │  │
│  │  │       ├── description                      │  │
│  │  │       └── affected_items[]                 │  │
│  │  ├── questions_for_doctor[]?                  │  │
│  │  │   └── DoctorQuestion                       │  │
│  │  │       ├── question                         │  │
│  │  │       ├── context                          │  │
│  │  │       └── priority                         │  │
│  │  └── disclaimer                               │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone & enter the project
git clone https://github.com/ThunderOpsAI/personal-agents.git
cd personal-agents

# 2. Create a virtual environment
python -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 5a. Dry-run test (no API key needed — validates schema round-trip)
python scripts/test_cmo_harness.py --dry-run

# 5b. Live test (requires GEMINI_API_KEY in .env)
python scripts/test_cmo_harness.py

# 5c. Custom query
python scripts/test_cmo_harness.py --query "What supplements help with sleep quality?"
```

## Project Structure

```
personal-agents/
├── pyproject.toml              # Project metadata & dependencies
├── requirements.txt            # Flat pip requirements
├── .env.example                # Environment variable template
├── .gitignore
├── README.md
├── src/
│   ├── __init__.py
│   ├── config.py               # .env loading & validation
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── cmo.py              # CMO agent factory (create_cmo_agent)
│   │   └── prompts.py          # CMO system prompt definition
│   └── schemas/
│       ├── __init__.py
│       └── medical.py          # PersonalAdvisorBrief & supporting models
└── scripts/
    └── test_cmo_harness.py     # CLI test script (--dry-run / --live)
```

## Schema Reference

| Model | Purpose |
|---|---|
| `PersonalAdvisorBrief` | Root output — every CMO response is serialised into this |
| `RankedRecommendation` | A single ranked intervention with pros/cons |
| `ContraindicationFlag` | Drug/supplement/condition interaction warning |
| `DoctorQuestion` | Appointment-prep question with context |
| `RecommendationLevel` | Enum: Highly Recommended · Consider with Caution · Experimental |
| `RiskSeverity` | Enum: Low · Moderate · High · Critical |

## License

MIT
