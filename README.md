# ShiftProof ONE v4 — Operations Intelligence Build

ShiftProof ONE v4 is a local-first plant operating system prototype for production, sanitation, quality, maintenance, labor and contractor/customer handoffs.

## Start on macOS
1. Unzip the folder.
2. Double-click `START_ShiftProof.command`.
3. Open `http://127.0.0.1:4788` if the browser does not open automatically.

No Python packages are required beyond a normal Python 3 installation. The server uses Python standard-library HTTP + SQLite.

## Demo accounts
- Plant Manager: `plantmanager@demo.local` / `1111`
- Production Supervisor: `production@demo.local` / `2222`
- Sanitation Site Manager: `sanitation@demo.local` / `3333`
- QA Manager: `qa@demo.local` / `4444`
- Maintenance Lead: `maintenance@demo.local` / `5555`

## New in v4
- Production orders and SKU sequencing
- Allergen-aware changeover records
- Downtime/loss capture by category, line and asset
- Modeled OEE from entered plant data
- Live labor assignments with qualification-match checks
- Labor-reallocation recommendations
- Modeled sanitation completion ETA
- Customer + contractor SLA scorecards
- AI-style data-grounded handoff draft generation
- Lightweight plant/digital-twin map with operational nodes
- Plant Execution Score + ProofScore + OEE on one command layer
- Production, sanitation, QA, maintenance, corrective action, proof, MSS and signed handoff features from v3
- SQLite persistence, server sessions, SHA-256 evidence fingerprints and audit trail

## Important MVP limitations
This is a local development prototype. The "AI Shift Commander" is deterministic/rules-based reasoning over stored operational data, not a connected LLM yet. OEE and forecast values are modeled from entered MVP data and should not be treated as validated production KPIs until PLC/MES/ERP/quality integrations and site-specific formulas are configured. Evidence storage is local and is not a regulated immutable archive.

## Reset demo
Double-click `RESET_ShiftProof.command`, type `RESET`, then restart the app.