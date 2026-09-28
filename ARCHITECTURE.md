# ShiftProof ONE v5 Architecture

## Runtime

- Python standard-library HTTP server
- SQLite local operations database
- HTML/CSS/vanilla JavaScript client
- qrcode/Pillow used only to render equipment QR images
- Local evidence storage in `uploads/`

## Intelligence layer

v5 adds deterministic, traceable plant intelligence rather than an opaque chatbot. `Ask the Plant` routes questions into plant-specific calculations and returns the entity IDs that support its answer.

Key engines:

- OEE component model: Availability / Performance / Quality
- sanitation labor and ETA forecast
- allergen-aware sequence optimizer
- automatic Production -> Sanitation planning
- root-cause memory
- threshold-based escalation rules
- SKU sanitation cost modeling

## Physical plant layer

Each asset can render a QR code pointing to `/#asset=<asset_id>`. Scanning the code opens the asset-focused application view. Scan events can be written to the audit log.

## Data additions in v5

- `sku_costs`
- `root_causes`
- `escalation_rules`
- `asset_scans`

## Cloud migration target

The local architecture is intentionally separable into:

1. web/mobile client
2. authenticated application API
3. relational operations database
4. evidence object storage
5. intelligence/agent services
6. integration adapters for ERP/MES/CMMS/HRIS/LIMS/PLC sources

A future cloud build should move SQLite to managed Postgres, uploads to object storage, sessions to a production auth provider, and deterministic Shift Commander tools behind an LLM orchestration layer with strict plant/facility authorization.