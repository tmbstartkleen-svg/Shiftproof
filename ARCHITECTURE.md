# ShiftProof ONE v4 Architecture

## Local runtime
- Python 3 standard-library HTTP server
- SQLite operational database (`shiftproof_v4.db`)
- Single-page HTML/CSS/JavaScript client
- Local `uploads/` evidence store
- HttpOnly session cookie
- PBKDF2-HMAC-SHA256 demo PIN hashes
- Append-only application audit events
- SHA-256 evidence fingerprints

## v4 domain model
Core execution:
- companies, facilities, users, memberships, sessions
- lines, assets, people, shifts
- production_orders
- downtime
- changeovers
- labor_assignments
- sanitation, qa, mss
- tickets, issues, handoffs
- proofs, notifications, audit_log
- sla_metrics
- plant_nodes

## Intelligence layer
The v4 Shift Commander computes deterministic operational signals from the live dataset:
- Plant Execution Score (PXS)
- ProofScore
- average line attainment
- modeled OEE
- recorded downtime minutes
- modeled sanitation minutes remaining
- risk statements
- next-action recommendations
- data-grounded handoff draft

## Cloud path
The local model is intentionally separable from the UI. A production cloud build can migrate:
- SQLite -> managed PostgreSQL
- local uploads -> object storage
- local sessions -> managed identity/auth
- rule-based commander -> LLM/tool agent with source-grounded recommendations
- manual production inputs -> ERP/MES/PLC/SCADA integrations
- local plant nodes -> floor-plan/digital-twin service
- browser polling -> event/notification architecture