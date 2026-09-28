# ShiftProof ONE v6

ShiftProof ONE is a local-first plant operations intelligence platform connecting Production, Sanitation, Quality, Maintenance, contractors, and management in one operating record.

## v6 additions

- Enterprise Command across multiple facilities
- Configurable role/capability matrix
- Integration registry for ERP, MES, CMMS, QA, HRIS and generic webhooks
- Token-protected inbound webhook endpoints with event history
- Notification delivery log and test dispatch workflow
- Progressive Web App manifest and service worker for installable/mobile use
- Optional cloud LLM adapter for Ask the Plant / Shift Commander
- Safe grounded-rules fallback when no LLM provider is configured or a provider fails
- Existing v5 production optimization, QR assets, OEE, sanitation forecasting, evidence, root-cause memory and SKU cost modeling retained

## Run locally

Double-click `START_ShiftProof.command`, or run:

```bash
python3 -m pip install -r requirements.txt
python3 server.py
```

Then open `http://127.0.0.1:4788`.

## Demo Plant Manager

- Email: `plantmanager@demo.local`
- PIN: `1111`

The Plant Manager demo account can access three seeded facilities so Enterprise Command can be exercised immediately.

## Optional cloud AI

ShiftProof works without a cloud model. To enable the v6 provider adapter, define:

- `SHIFTPROOF_LLM_URL`
- `SHIFTPROOF_LLM_KEY`
- `SHIFTPROOF_LLM_MODEL`

If the provider is not configured or cannot return a usable answer, ShiftProof automatically falls back to its plant-grounded deterministic reasoning.

## Integration webhook

Create an integration in the Integrations screen. ShiftProof generates an endpoint and token. External systems post JSON to the endpoint and include the token in the `X-ShiftProof-Token` header.

## Security note

v6 is still a development prototype. Production deployment should use managed identity, encrypted secret storage, TLS, a managed relational database, object storage, centralized audit retention, rate limiting, signed webhook verification, and enterprise authorization policies.