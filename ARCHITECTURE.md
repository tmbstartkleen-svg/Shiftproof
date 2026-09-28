# ShiftProof ONE v6 Architecture

## Current local stack

Browser / PWA shell -> Python HTTP application -> SQLite -> local evidence storage.

The local build remains dependency-light and easy to test while the data model evolves toward a cloud architecture.

## v6 commercial layers

### Enterprise layer
`companies`, `facilities`, `memberships`, and the Enterprise Command endpoint support cross-facility oversight.

### Authorization layer
`role_permissions` stores explicit capabilities such as `enterprise.view`, `integrations.manage`, `roles.manage`, and department write permissions.

### Integration layer
`integrations` stores connector registrations. Token-protected `/api/webhook/<integration_id>` endpoints record inbound events in `webhook_events` and the audit trail.

### Notification layer
`notification_deliveries` separates operational notifications from the eventual transport provider. v6 simulates/logs delivery locally; later cloud builds can bind SMS, email, push, Slack/Teams, or customer-specific channels.

### AI layer
Ask the Plant first derives a grounded deterministic answer and evidence references. If an external LLM adapter is configured through environment variables, the system can send a compact plant snapshot to that provider. Provider failure falls back to grounded logic.

### PWA layer
`manifest.webmanifest` and `sw.js` provide installable app metadata and shell caching. Sensitive API data is never intentionally cached by the service worker.

## Recommended cloud evolution

Next.js/Vercel web tier -> managed authentication -> Postgres -> object storage -> background workflows/events -> notification providers -> integration workers -> model gateway.

The SQLite/local build should remain as a field-demo and offline-capable reference implementation.