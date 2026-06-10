# Omnia `/apigateway` Quickstart

Status: reverse-engineered working notes, not an official vendor contract.

This directory is the entry point for making the real Omnia gateway API easier to use. It sits above the raw extraction files and turns the observed API into a smaller, safer developer surface.

## Source Of Truth

- Base URL: `https://api2.optica-omnia.de`
- API prefix: `/apigateway/*`
- Raw path inventory: [`../api2-backend-paths.md`](../api2-backend-paths.md)
- Cumulative recording analysis: [`../playwright-api-cumulative-analysis.md`](../playwright-api-cumulative-analysis.md)
- Raw generated OpenAPI: [`../openapi.cumulative.json`](../openapi.cumulative.json)
- Focused contract seed: [`gateway-contract.json`](gateway-contract.json)
- Canonical human catalog: [`catalog.md`](catalog.md)
- Workflow recipes: [`workflows.md`](workflows.md)
- Error model and guardrails: [`errors-and-guardrails.md`](errors-and-guardrails.md)

## What Is Known

The gateway accepts authenticated requests against `https://api2.optica-omnia.de/apigateway/...`. The captured OpenAPI uses HTTP Bearer auth with `bearerFormat: JWT`.

The project currently has no captured `/apigateway` login route. Token acquisition is therefore still outside the curated contract. Existing notes only prove that valid Omnia app sessions can call the gateway and that unauthenticated service bases return `401`.

The gateway path names are not uniform. The Angular bundle contains internal service paths such as `/customers/...`, while live traffic uses aliases such as `/apigateway/kunden/...`. Always prefer paths from the cumulative recording analysis when a live alias exists.

## First Read-Only Calls

Use these after obtaining a valid Bearer token from a real Omnia session:

```bash
export OMNIA_BASE_URL="https://api2.optica-omnia.de"
export OMNIA_TOKEN="<bearer-token>"

curl -sS \
  -H "Authorization: Bearer ${OMNIA_TOKEN}" \
  "${OMNIA_BASE_URL}/apigateway/user-details"
```

Then try a small lookup/search call:

```bash
curl -sS \
  -H "Authorization: Bearer ${OMNIA_TOKEN}" \
  "${OMNIA_BASE_URL}/apigateway/kunden/customers/search?active=true&keywords=Muster&page=0&size=5"
```

For POST search endpoints, keep pagination in the query string when the recordings show `page`, `size`, or `sort` as query parameters:

```bash
curl -sS \
  -X POST \
  -H "Authorization: Bearer ${OMNIA_TOKEN}" \
  -H "Content-Type: application/json" \
  "${OMNIA_BASE_URL}/apigateway/sales/salesprocesses/search?page=0&size=5&sort=number,desc" \
  --data '{"status":[],"keywords":"Muster","active":true,"editor":{"editorIds":[]}}'
```

## Recommended Developer Surface

Do not expose raw gateway calls directly to users. Start with a curated facade around these stable categories:

1. Read-only lookups: current user, branches, payment terms, suppliers, storage locations.
2. Search: customers, sales processes, articles, order proposals, orders, order arrivals.
3. Hydration: order by ID, order positions, customer details, supplier context.
4. Workflow actions: create order from supplier proposals, process order, prepare order mail, book goods receipt.
5. Documents: stored-document metadata, file-archive download.

The focused operation list is maintained in [`gateway-contract.json`](gateway-contract.json). Treat it as a seed for generated clients and contract tests, not as a complete API.

## Data Protection

Recordings can contain patient, insurance, prescription, and commercial data. Keep raw captures out of git and out of shared chats. The recorder redacts sensitive headers, but bodies can still contain protected data.

## Next Work

The highest-value improvements are:

1. Add the missing auth/token acquisition notes once they are verified.
2. Generate a browsable reference from `gateway-contract.json`.
3. Add redacted request/response examples to the focused contract.
4. Add contract tests for the five high-risk search/workflow operations.
5. Expand negative recordings for expired token, missing permission, validation error, unit mismatch, and missing supplier/PZN.
