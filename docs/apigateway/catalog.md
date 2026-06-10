# Canonical Gateway Catalog

Status: curated seed based on local Playwright recordings and the cumulative OpenAPI raw file.

This catalog intentionally covers the first useful slice of `/apigateway/*`, not the full extracted surface. The goal is to make known-good operations easy to find and to mark risky operations before anyone builds directly against them.

## Conventions

- `canonicalPath` means the live gateway path observed in recordings.
- `knownAliases` means related static bundle paths or alternate live prefixes that should not be guessed at runtime.
- `risk` is about integration risk, not clinical or business risk.
- POST search endpoints use query pagination where recordings show `page`, `size`, or `sort` as query parameters.
- `includeAll: false` with explicit `selections` is preferred for workflow actions.

## Core Operations

| Operation | Method | Canonical path | Input shape | Response shape | Risk | Notes |
|---|---:|---|---|---|---|---|
| Get current user context | GET | `/apigateway/user-details` | Bearer token only | User/session context with tenant, workspace, permissions | Medium | Good smoke test after auth, but response includes broker and workspace internals. |
| Search customers | GET | `/apigateway/kunden/customers/search` | Query: `active`, `keywords`, `page`, `size` | Spring page of customer search rows | Low | Prefer this over static `/customers/search` because live alias is observed. |
| Get customer | GET | `/apigateway/kunden/customers/{uuid}` | Path: `uuid` | Customer details | Medium | Contains protected personal and insurance data. |
| Get customer addresses | GET | `/apigateway/kunden/customers/{uuid}/addresses` | Path: `uuid`; query `size` | Spring page of addresses | Medium | Hydration call after customer selection. |
| Search sales processes | POST | `/apigateway/sales/salesprocesses/search` | Query: `page`, `size`, `sort`; body search filters | Spring page of case rows | Medium | Keep query/body split exactly as observed. |
| Get sales process | GET | `/apigateway/sales/salesprocesses/{uuid}` | Path: `uuid` | Full sales process aggregate | High | Large mutable aggregate; treat as read model unless workflow requires update. |
| Search articles | POST | `/apigateway/article-tenant/articles/search` | Query: `page`, `size`; body article filters | Spring page of articles | Medium | Related alias `/apigateway/articletenantservice` also exists. Do not merge roles yet. |
| Get article | GET | `/apigateway/article-tenant/articles/{uuid}` | Path: `uuid` | Article details | Medium | Article detail fallback path exists under `articletenantservice`. |
| Search suppliers | GET | `/apigateway/supplier/suppliers/search` | Query filters | Spring page of suppliers | Low | Use for lookup UI. |
| Get supplier context | GET group | `/apigateway/supplier/suppliers/{uuid}` plus `/addresses`, `/contacts`, `/contact-opportunities`, `/customers` | Path: `uuid` | Supplier detail and related arrays | Medium | Hydrate before order creation or export. |
| Search order proposals | POST | `/apigateway/wawi/order-proposals/search` | Query: `page`, `size`, `sort`; body filters | Spring page of proposals | Medium | Supplier and unit fields can be null in some recordings; validate before ordering. |
| Sum order proposals | POST | `/apigateway/wawi/order-proposals/search/sums` | Body filters | Quantity/value summary | Low | Use alongside proposal search for UI totals. |
| Prepare proposals for order | POST | `/apigateway/wawi/order-proposals/to-order` | `{ includeAll, selections, filters }` | Observed as array/unknown | High | Use explicit `selections`; never automate broad `includeAll`. |
| Create order from proposals | POST | `/apigateway/wawi/orders/from-proposal` | `{ proposals, supplierId }` | Created order object | High | Successful recordings use explicit `supplierId`; `resolveUnitMismatch` produced `500`. |
| Get order | GET | `/apigateway/wawi/orders/{uuid}` | Path: `uuid` | Order details | Medium | Mandatory post-read after order creation or processing. |
| Get order positions | GET | `/apigateway/wawi/orders/{uuid}/positions` | Path: `uuid` | Position array | Medium | Verify supplier, quantity, unit, and value after write calls. |
| Process order | POST | `/apigateway/wawi/orders/{uuid}/process-order` | Path: `uuid`; body order date, proposal flag, print options | `{ orderDocumentId }` | High | This is the UI "Bestellung erstellen" step, not just CRUD. |
| Prepare order mail | POST | `/apigateway/wawi/orders/{uuid}/email` | `{ createMailFile, documentIds }` | Subject, body, receivers, documents, `mailFileId` | Medium | Prepares local mail/PDF context. It does not prove server-side mail delivery. |
| Search orders | POST | `/apigateway/wawi/orders/search` | Query: `page`, `size`, `sort`; body filters | Spring page of orders | Medium | Useful post-action verification. |
| Search order arrivals | POST | `/apigateway/wawi/order-arrival/search` | Query: `page`, `size`, `sort`; body filters | Spring page of order arrivals | Medium | Use a narrow filter from a known order. |
| Book goods receipt | POST | `/apigateway/wawiservice/order-arrival/book` | Delivery data plus explicit filtered selection | Updated order array | High | Use explicit position selection and post-read. |
| Mark goods receipt recorded | POST | `/apigateway/wawiservice/order-arrival/book-recorded` | Status IDs plus nested filter selection | Updated order array | High | Some recordings complete via `book` only; call conditionally after reading state. |
| Search stored documents | GET | `/apigateway/document/stored-documents` | Entity query parameters | Document metadata page | Medium | Query parameters are entity-specific and verbose. |
| Create stored document | POST | `/apigateway/document/stored-documents` | Document metadata/upload reference | Stored document metadata | High | Not yet safe without upload and file-archive recipe. |
| Download archived file | GET | `/apigateway/file-archive/file-archive/load/files/{uuid}` | Path: `uuid`; optional `apiHash` | Binary file | Medium | Use metadata first; avoid blind file access. |

## Known Alias Hotspots

| Domain | Observed live paths | Static/internal paths | Guidance |
|---|---|---|---|
| Customers | `/apigateway/kunden/...`, `/apigateway/customerservice/...` | `/customers/...` | Prefer `/apigateway/kunden` for customer workflows seen in recordings. |
| Articles | `/apigateway/article-tenant/...`, `/apigateway/articletenantservice/...` | `/articles/...` | Keep both live prefixes separate until their roles are fully mapped. |
| Wawi | `/apigateway/wawi/...`, `/apigateway/wawiservice/...` | `/orders`, `/order-arrival`, `/stock-items` | Use the exact live prefix from the workflow recipe. |
| Sales process | `/apigateway/sales/...`, `/apigateway/salesprocessservice/...` | `/salesprocesses`, `/status`, `/invoices` | Treat `/sales` as the mutable process surface; verify `salesprocessservice` per operation. |
| Documents | `/apigateway/document/...`, `/apigateway/file-archive/...` | `/stored-documents`, `/file-archive` | Metadata and binary file access are separate surfaces. |

## Stability Ratings

- Low risk: read-only lookup or search, observed repeatedly, simple parameters.
- Medium risk: read-only detail or search over protected data, or response shape has nullability/alias concerns.
- High risk: write call, multi-step workflow, large aggregate update, or observed failure without actionable error payload.

## Maintenance Rule

When a new recording confirms an operation, update both this file and [`gateway-contract.json`](gateway-contract.json). If a recording contradicts this catalog, keep the safer behavior and add the contradiction explicitly.
