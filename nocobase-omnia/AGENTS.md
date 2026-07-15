# NocoBase Omnia UI

## Scope

- Keep this project read-only until a separate write design is approved.
- The browser must only call NocoBase APIs. It must never call Omnia or the FastAPI adapter directly.
- The NocoBase server plugin may call only `OMNIA_ADAPTER_URL`.
- Never log authorization headers, tokens, search terms, customer identifiers, or response bodies.
- Keep customer data transient. Do not persist adapter responses in the NocoBase database.

## Development

- Pin NocoBase to the version in `.env.example` and `docker-compose.yml`.
- Put custom code under `packages/plugins/@omnia`.
- Add narrow contract tests for adapter calls and error handling.
- Verify with `docker compose config`, plugin tests, and an end-to-end browser check when Docker is available.

