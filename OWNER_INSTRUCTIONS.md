# Rumble OS Cloud Evolution: Deployment & Setup Guide

This document provides step-by-step instructions for configuring and deploying **Rumble OS** to a 100% free cloud stack:
- **Database & Vector Storage**: Neon Serverless Postgres (`pgvector` enabled)
- **Backend API Service**: Render Free Tier (FastAPI + Agno Multi-Agent Framework)
- **Frontend Dashboard**: Vercel Free Tier (Static / Next.js Glassmorphism UI)

---

## 1. Neon Serverless Postgres Setup

1. Sign up or log into [Neon](https://neon.tech).
2. Click **Create Project** and name it `rumble-os-db`.
3. In the project dashboard, navigate to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy your Connection String from the Neon dashboard under **Connection Details**:
   ```
   postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this connection string as `NEON_DATABASE_URL`.

---

## 2. Render Backend Deployment

1. Sign up or log into [Render](https://render.com).
2. Connect your GitHub account and click **New +** -> **Blueprint**.
3. Select the `ThunderOpsAI/personal-agents` repository. Render will automatically detect `render.yaml`.
4. Alternatively, create a **Web Service** manually:
   - **Name**: `rumble-os-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.api.server:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/healthz`
5. In **Environment Variables**, add:
   - `NEON_DATABASE_URL`: (Your Neon PostgreSQL URL from Step 1)
   - `TELEGRAM_BOT_TOKEN`: (Optional Telegram Bot Token for push alerts)
   - `TELEGRAM_CHAT_ID`: (Optional Telegram Chat ID)
   - `NTFY_TOPIC`: `rumble_os_alerts`
   - `OPENAI_API_KEY`: (Optional OpenAI Key for LLM features)
6. Click **Deploy Web Service**. Once deployed, copy your backend URL (e.g. `https://rumble-os-backend.onrender.com`).

---

## 3. Vercel Frontend Deployment

1. Sign up or log into [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project** and import `ThunderOpsAI/personal-agents`.
3. Set **Framework Preset** to `Other` or `Next.js` and **Root Directory** to `./`.
4. In **Environment Variables**, set:
   - `NEXT_PUBLIC_API_URL`: `https://rumble-os-backend.onrender.com`
5. Click **Deploy**. Vercel will build the frontend using `dashboard/` and apply `vercel.json` rewrites.

---

## 4. Local Development Execution

To run Rumble OS locally on your machine:

1. **Activate Virtual Environment**:
   ```bash
   source .venv/bin/activate
   ```
2. **Start Backend API Server**:
   ```bash
   uvicorn src.api.server:app --host 127.0.0.1 --port 8000 --reload
   ```
3. **Start Dashboard HTTP Server**:
   ```bash
   python -m http.server 3000 --directory dashboard
   ```
4. **Access Applications**:
   - Dashboard UI: `http://localhost:3000`
   - Backend API Health: `http://localhost:8000/healthz`
   - Interactive OpenAPI Docs: `http://localhost:8000/docs`

---

## 5. Automated Data Migration (SQLite to Neon)

To lift your local SQLite data (`data/life_os.db`) into your cloud Neon Postgres database:

```bash
export NEON_DATABASE_URL="your_neon_connection_string"
python scripts/migrate_sqlite_to_neon.py
```
