# Gateway Error Model And Guardrails

Status: proposed normalization layer for clients/facades using `/apigateway/*`.

The raw gateway currently shows multiple error styles in recordings. API consumers should not handle those directly. Normalize them at the first client boundary.

## Observed Error Shapes

Spring-style technical error:

```json
{
  "timestamp": "2026-05-16T15:18:00.000Z",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/apigateway/wawi/orders/from-proposal"
}
```

Service error with correlation metadata:

```json
{
  "id": "error-id",
  "severity": "ERROR",
  "correlationId": "correlation-id",
  "timestamp": "2026-05-16T15:18:00.000Z",
  "messageKey": "message.key",
  "message": "Human readable message",
  "details": []
}
```

Auth failures are known to happen (`401` without a valid token), but the exact response body is not yet captured in the curated contract.

## Normalized Error Shape

Every facade/client should expose this shape:

```json
{
  "code": "OMNIA_GATEWAY_ERROR",
  "message": "Gateway request failed.",
  "status": 500,
  "correlationId": "correlation-id-or-null",
  "details": [],
  "retryable": false,
  "path": "/apigateway/wawi/orders/from-proposal",
  "method": "POST"
}
```

Recommended fields:

- `code`: stable application code, not the raw Omnia message key.
- `message`: user-facing message suitable for logs/UI after privacy review.
- `status`: HTTP status.
- `correlationId`: from raw payload if present.
- `details`: structured details, redacted.
- `retryable`: true only for explicit transient failures.
- `path` and `method`: endpoint context.

## Known Mappings

| Condition | Raw signal | Normalized code | Retryable | Client action |
|---|---|---|---:|---|
| Missing or expired token | `401` | `AUTH_REQUIRED` | false | Re-authenticate; do not retry silently. |
| Permission missing | `403` if observed | `PERMISSION_DENIED` | false | Show missing access and operation name. |
| Record not found | `404` | `NOT_FOUND` | false | Refresh search results or ask user to select again. |
| Article detail fallback failed | `404` on article details path | `ARTICLE_DETAILS_NOT_FOUND` | false | Try confirmed article detail path if available; continue only with complete required data. |
| Order from proposal unit mismatch path | `500` on `orders/from-proposal` with `resolveUnitMismatch` | `UNIT_MISMATCH_REQUIRES_USER_DECISION` | false | Stop and ask user to resolve unit/supplier manually. |
| Unknown server failure | `500` without useful message | `OMNIA_INTERNAL_ERROR` | maybe | Read back related resource once; do not repeat write blindly. |
| Validation-like failure | `400` or `422` if observed | `VALIDATION_FAILED` | false | Surface field-level details. More negative recordings needed. |

## Guardrails For All Writes

- Require a valid user/session context before write calls.
- Prefer explicit IDs over filters.
- Use `includeAll: false` for selection-based operations.
- Store request fingerprints, not raw protected payloads.
- Read back the changed resource after every write.
- Compare post-read state with intended state.
- Never retry non-idempotent writes automatically.
- Do not send broad search filters from stale UI state.
- Keep raw request/response bodies out of logs unless redacted and approved.

## Guardrails For Order Creation

- Group proposals by one `supplierId`.
- Require PZN, article number, unit, quantity, and supplier for each proposal.
- Pass `supplierId` explicitly to `POST /apigateway/wawi/orders/from-proposal`.
- Do not use `resolveUnitMismatch` automatically.
- After creation, read order and positions and verify supplier, position count, quantities, units, and value.

## Guardrails For Goods Receipt

- Search current arrival candidates directly before booking.
- Book only explicitly selected arrival positions.
- Confirm `filialeId`, `storageLocationId`, delivery date, delivery number, quantity, and editor ID.
- Decide whether `book-recorded` is required from the latest response state.
- Do not hand-build nested `book-recorded` filters without a current search context.

## Guardrails For Documents

- Resolve document metadata before file download.
- Enforce entity context and permissions at the facade boundary.
- Never log file contents.
- Treat file IDs and `apiHash` as sensitive.

## Missing Negative Recordings

Add recordings for:

1. Expired token.
2. Missing permission.
3. Invalid payload on a safe endpoint.
4. Missing PZN.
5. Missing supplier.
6. Unit mismatch.
7. Empty search result.
8. Document download without permission.
