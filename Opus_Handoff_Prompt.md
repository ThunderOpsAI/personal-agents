# Opus Handoff Prompt

You are an autonomous AI agent (Opus) tasked with wiring up the **Rumble Personal Orchestrator** dashboard and backend to work seamlessly.

## Goals
1. **Integrate NLP Intent Parsing** in `server.py`:
   - `LOG_PAIN`: Extract pain scores, mood, and anatomical percentages (lumbar, cervical, knee, shoulder) from voice or chat. Save to `data/pain.json` and trigger high‑pain rehab adaptation.
   - `ADD_EXPENSE`: Extract merchant, amount, and apply auto‑categorization rules (Coles/Woolies → Groceries, Chemist Warehouse → Medical, Ampol/BP → Fuel). Update `data/budget.json`.
   - `ADD_TASK`: Parse follow‑up directives into `data/agenda.json`.
   - `MEDICAL_TRIAGE`: Read `agent_reports/MEDICAL_CONTEXT.md` and generate concise advice for the user’s condition.
2. **Dynamic UI Refresh** in `dashboard/app.js`:
   - Auto‑re‑render Chart.js trend graphs, rehab warnings, and budget tables when a backend operation completes.
   - Ensure responses are prefixed correctly (`RUMBLE:`) without duplication.
3. **Endpoints Verification**:
   - `/healthz` → `200 OK` with `{"status": "ok"}`.
   - `POST /api/v1/rumble/chat` → `200 OK` with a JSON reply.
   - `POST /api/v1/voice/parse`, `GET /api/weather`, `GET /api/agenda` all functional.
4. **Deployment**:
   - Run the FastAPI server via `.venv/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8000`.
   - Verify no other process occupies port 8000.
5. **Testing**:
   - Use curl or browser to hit the endpoints and confirm responses.
   - Test voice input on the dashboard, ensuring the backend processes the payload and updates the UI.

## Execution Instructions
```bash
# Activate virtual environment
source .venv/bin/activate
# Install dependencies if needed
pip install -r requirements.txt
# Launch server
.venv/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
```

After completing the steps, verify the dashboard at `http://localhost:8000` and the health endpoint at `http://localhost:8000/healthz`.
