# ShiftProof ONE v5

ShiftProof ONE is a local-first plant operations intelligence prototype connecting Production, Sanitation, Quality, Maintenance, and Management in one operating record.

## v5 highlights

- Ask the Plant: grounded answers from entered plant records with evidence entity IDs
- OEE components: modeled Availability, Performance, Quality, and combined OEE
- QR asset workflows: each equipment record has a scannable QR that opens its asset view
- Asset scan audit history
- Production sequence optimizer with allergen-aware ordering
- Automatic Production -> Sanitation work planning
- Sanitation labor-minutes and completion ETA modeling
- Root-cause memory tied to downtime records
- Configurable escalation rules and live triggers
- SKU sanitation cost models covering labor, chemicals, changeover time, and allergen complexity
- Configurable Plant Twin node coordinates
- Existing v4 features retained: proof ledger, SHA-256 evidence fingerprints, signed handoffs, QA release/reclean, MSS, maintenance routing, labor qualifications, SLA scorecards, audit log, SQLite persistence, and role-based sessions

## Run on macOS

1. Download or clone the repo.
2. Double-click `START_ShiftProof.command`, or run `./START_ShiftProof.command`.
3. Open `http://127.0.0.1:4788`.

The launcher installs `qrcode`/Pillow if QR support is not already present.

## Demo users

- Plant Manager: `plantmanager@demo.local` / `1111`
- Production: `production@demo.local` / `2222`
- Sanitation: `sanitation@demo.local` / `3333`
- QA: `qa@demo.local` / `4444`
- Maintenance: `maintenance@demo.local` / `5555`

## Important prototype boundaries

The v5 Shift Commander is deterministic and plant-data-grounded; it is not yet a connected large language model. OEE, sanitation ETA, sequence savings, and SKU cost outputs are modeled from entered/demo data and should not be treated as validated production KPIs until the plant's actual calculation rules and source systems are connected.

Evidence is stored on the local machine and SHA-256 fingerprinted. This is not yet a regulated immutable/WORM archive.