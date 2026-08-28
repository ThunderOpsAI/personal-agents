# Rumble OS

> Rumble OS is a proactive, self-learning personal life manager and physical recovery platform built on the Vercel Eve architecture.

## Key Features

- **Automated Scraping**: Automated 6am/2pm email and calendar scraping.
- **Universal Intent Capture UI**: Every button delegates to Rumble Chat.
- **Adaptive Yoga Routines**: Daily 9am Yoga routines adapted to your active pain logs (using Neon PostgreSQL).
- **Weather-optimized Washing Schedules**: Smart scheduling using an options model (selecting exactly 2 optimal washing days per week based on live Wangaratta forecasts).
- **Daily Learning Modules**: Curated daily learning content.
- **`SOUL.md` Architecture**: Persistent agent memory and persona management.

## Architecture & Tech Stack

- **Framework**: Next.js App Router (TypeScript).
- **Agent Framework**: Vercel Eve, running on Vercel's Edge Network for automatic serverless scaling.
- **Database (Production)**: Neon PostgreSQL.
- **Vector Database (Dev/Staging)**: ChromaDB is currently designated for local-disk dev/staging only, with vector-similarity ranking explicitly deferred as a deliberate architectural decision (relational logging in Neon is the production path for now).
- **No Legacy Python**: The legacy FastAPI backend, Agno integrations, and `uvicorn` entrypoints have been entirely removed.

## Quick Start

```bash
# 1. Clone & enter the project
git clone https://github.com/ThunderOpsAI/personal-agents.git
cd personal-agents

# 2. Install dependencies (workspace root delegates to dashboard)
npm install
npm install --prefix dashboard

# 3. Configure environment variables
cp .env.example .env
# Edit .env to add your API keys and NEON_DATABASE_URL

# 4. Run the development server
npm run dev
```

## Documentation Source of Truth

- `CONTEXT.md`: System architecture, deployment state, and data invariants.
- `AGENTS.md`: Agent rules, integrations, and instructions.
- `SOUL.md`: Dynamic memory and persona.
- `agent/instructions.md`: The primary intelligence agent instructions.

## License

MIT
