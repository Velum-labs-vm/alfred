# ALFRED Privacy

## Defaults

- Offline/local-first on first launch.
- No cloud dependency required for base assistant operation.

## Connector rules

- External connector must be explicitly enabled.
- Minimal context should be sent for remote calls.
- Sensitive full payloads (SMS bodies, contact database, full calendar bodies) should not be sent by default.

## Audit log

External requests should be logged with:

- timestamp
- endpoint
- query length
- context fields sent
- response length

Current baseline implementation: `PrivacyGuard` local audit records.
