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

- **Framework**: React 18 SPA on Vite (TypeScript).
- **Styling**: Rumble OS Glassmorphism theme with animated background orbs and neon accents.
- **Port & Host**: Listens on port 3000 (`0.0.0.0:3000`).
- **Live Weather**: Direct live Wangaratta (-36.3536, 146.3225) forecast via Open-Meteo with automated 2-day washing schedule calculation.
- **Exercise & Rehab Database**: 34+ clinical-grade routines across Yoga, Pilates, Mobility Stretches, Spine Rehab, and Hydrotherapy.
- **State & Persistence**: LocalStorage persistence with offline support and live synchronization.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production
npm run build
```

## Documentation Source of Truth

- `CONTEXT.md`: System architecture, deployment state, and data invariants.
- `AGENTS.md`: Agent rules, integrations, and instructions.
- `SOUL.md`: Dynamic memory and persona.
- `agent/instructions.md`: The primary intelligence agent instructions.

## License

MIT
