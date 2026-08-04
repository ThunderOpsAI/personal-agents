# Domain Context: Rumble OS

## Glossary

### Dashboard Layout & Surface Architecture
- **Executive Command Center**: The unified dashboard interface for managing personal ops, schedule, health monitoring, and rehabilitation protocols.
- **Hybrid Sidebar & Timeline Layout**: The canonical layout model combining a persistent left Quick-Log Sidebar with a right-hand Chronological Timeline Stream.
- **Persistent Quick-Log Sidebar**: A 360px left sidebar enabling instant pain logging, generator tracking, doctor report exports, and pipeline sync without context switching.
- **Chronological Timeline Stream**: A time-ordered stream on the main canvas grouping daily actions into 3-hour protocol blocks (09:00 AM, 12:00 PM, 03:00 PM, 09:00 PM).

### Health & Recovery
- **Pain Generator**: The primary anatomical structure or region (e.g., Right Lumbar, Cervical Spine) identified as causing the dominant symptom load, assigned a percentage weight contribution.
- **Symptom Log**: A periodic (3-hour interval) record of overall pain severity (1-10 scale), active anatomical hotkey locations, primary pain generator, and generator weight.
- **Physio Routine**: A structured, time-bounded physical therapy protocol (e.g., Lumbar Core Stability, Shoulder Ergonomics) designed for rehabilitation.
- **Doctor Report**: A synthesized Markdown export compiling recent pain logs, primary generator trends, and physio compliance for medical specialists.

### Operations & Tasks
- **Chief Rumble Officer Assessment**: Top-level executive synthesis summarizing system health, active alerts, and immediate operational priorities.
- **Active Alert**: An urgent notification requiring immediate user attention or action.
- **Action Item**: A prioritized operational task or follow-up item derived from multi-agent ingestion.
- **Pipeline Ingest**: The automated synchronization process connecting Google Calendar, Gmail ESM/IT tickets, and agent outputs into SQLite storage.
