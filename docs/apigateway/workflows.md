# Gateway Workflow Recipes

Status: practical recipes derived from recordings. They are meant for a facade/client implementation, not for exposing raw gateway forms to end users.

## General Pattern

Every workflow should follow this shape:

1. Read current user/context.
2. Search narrowly.
3. Hydrate selected records.
4. Validate required fields before writes.
5. Execute one write step.
6. Read back the resulting resource.
7. Compare the result with the intended selection.
8. Log the gateway call, request fingerprint, response IDs, and correlation ID when present.

## Workflow: Customer And Case Search

Purpose: find a customer or sales process without mutating data.

1. `GET /apigateway/kunden/customers/search?active=true&keywords=<text>&page=0&size=10`
2. Optional hydration:
   - `GET /apigateway/kunden/customers/{customerId}`
   - `GET /apigateway/kunden/customers/{customerId}/addresses?size=20`
   - `GET /apigateway/kunden/customers/{customerId}/kostentraeger?size=20`
   - `GET /apigateway/kunden/customers/{customerId}/arzt?size=20`
3. Case search:

```http
POST /apigateway/sales/salesprocesses/search?page=0&size=25&sort=number,desc
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": [],
  "keywords": "<text>",
  "active": true,
  "editor": {
    "editorIds": []
  }
}
```

Guardrails:

- Do not log full customer payloads.
- Keep search terms and page sizes small during exploration.
- Treat missing `customerId`, `kostentraeger`, or address data as an explicit incomplete-context state.

## Workflow: Article Search And Selection

Purpose: find an article and hydrate enough context for order proposals.

1. `POST /apigateway/article-tenant/articles/search?page=0&size=20`

```json
{
  "listType": "ARTICLE",
  "size": 20,
  "dataOrigin": [],
  "keywords": "<article-or-pzn>",
  "active": true
}
```

2. `GET /apigateway/article-tenant/articles/{articleId}`
3. Optional supplier/order context:
   - `GET /apigateway/article-tenant/articles/{articleId}/supplier-assignments?size=50`
   - `GET /apigateway/article-tenant/articles/{articleId}/computed-order-value/{id}?supplierId=<supplierId>&unit=<unit>`

Guardrails:

- Keep `/apigateway/article-tenant` and `/apigateway/articletenantservice` separate until a recording proves they are interchangeable for the specific operation.
- Validate PZN, supplier, unit, and quantity before creating order proposals.

## Workflow: Create Order From Supplier Proposals

Purpose: convert selected order proposals into an Omnia order.

Preconditions:

- All proposal IDs belong to one supplier group.
- `supplierId` is known and explicit.
- PZN, article number, unit, and quantity are present for every proposal.
- Any unit mismatch is shown to the user instead of auto-resolved.

Sequence:

1. Search proposals:

```http
POST /apigateway/wawi/order-proposals/search?page=0&size=25&sort=supplierName,asc
Authorization: Bearer <token>
Content-Type: application/json

{
  "keywords": "<case-or-customer>",
  "active": true
}
```

2. Optional totals:

```http
POST /apigateway/wawi/order-proposals/search/sums
Authorization: Bearer <token>
Content-Type: application/json

{
  "keywords": "<case-or-customer>",
  "active": true
}
```

3. Mark selected proposals for order:

```http
POST /apigateway/wawi/order-proposals/to-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "includeAll": false,
  "selections": ["<proposalId>"],
  "filters": null
}
```

4. Create the order:

```http
POST /apigateway/wawi/orders/from-proposal
Authorization: Bearer <token>
Content-Type: application/json

{
  "proposals": {
    "includeAll": false,
    "selections": ["<proposalId>"],
    "filters": null
  },
  "supplierId": "<supplierId>"
}
```

5. Read back:
   - `GET /apigateway/wawi/orders/{orderId}`
   - `GET /apigateway/wawi/orders/{orderId}/positions`

Guardrails:

- Never use `includeAll: true` for automation until filter behavior is exhaustively tested.
- Do not use `resolveUnitMismatch: true` automatically. Recordings observed this route producing `500`.
- Treat `200` from `orders/from-proposal` as "created but must be verified", not as final success.
- Compare supplier, position count, quantities, units, and value after the read-back.

## Workflow: Process Order And Prepare Mail/PDF

Purpose: perform the UI-equivalent "Bestellung erstellen" action and prepare local mail/PDF context.

1. Process the order:

```http
POST /apigateway/wawi/orders/{orderId}/process-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderState": null,
  "orderDate": "2026-05-21T12:00:00.000Z",
  "markProposalsAsOrdered": true,
  "printOptions": {
    "stationery": true,
    "prices": true,
    "emailHeader": false,
    "emailFooter": false,
    "showSalesProcessNumber": true
  }
}
```

2. Capture `orderDocumentId` from the response.
3. Prepare mail/PDF context:

```http
POST /apigateway/wawi/orders/{orderId}/email
Authorization: Bearer <token>
Content-Type: application/json

{
  "createMailFile": true,
  "documentIds": ["<orderDocumentId>"]
}
```

4. Read the order again:
   - `GET /apigateway/wawi/orders/{orderId}`
   - `GET /apigateway/wawi/orders/{orderId}/positions`

Guardrails:

- `orders/{uuid}/email` prepares local mail/PDF data. Do not label it as server-side mail delivery.
- Log `orderDocumentId` and `mailFileId`.
- If `process-order` changes state, reflect that from the post-read response, not from assumptions.

## Workflow: Goods Receipt

Purpose: book a received delivery against an Omnia order.

Preconditions:

- Order exists and positions were loaded.
- Storage location and branch are known.
- Delivery number and delivery date are provided by the user.
- The exact arrival/order position selection is explicit.

Sequence:

1. Search order arrivals:

```http
POST /apigateway/wawi/order-arrival/search?page=0&size=25&sort=number,desc
Authorization: Bearer <token>
Content-Type: application/json

{
  "keywords": "",
  "active": true,
  "orderNr": "<orderNumber>",
  "arrivalBookingState": ""
}
```

2. Hydrate lookup data as needed:
   - `GET /apigateway/wawi/storage-locations?filialeIds=<filialeId>&page=0&size=50`
   - `GET /apigateway/wawi/storage-locations/{storageLocationId}`
   - `GET /apigateway/article-tenant/articles/{articleId}`
   - `GET /apigateway/accounting/material-groups/{materialGroupId}`

3. Book receipt:

```http
POST /apigateway/wawiservice/order-arrival/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderNumber": "<orderNumber>",
  "deliveryDate": "2026-05-21T12:00:00.000Z",
  "deliveryNr": "<deliveryNumber>",
  "filialeId": "<filialeId>",
  "storageLocationId": "<storageLocationId>",
  "applyToAllFiliale": false,
  "quantity": 1,
  "salesProcessStatusId": null,
  "versorgungsStatusId": null,
  "comment": null,
  "editorId": "<editorId>",
  "zeroRemainingAmount": false,
  "performGoodsReceipt": true,
  "filteredSelection": {
    "includeAll": false,
    "selections": ["<arrivalPositionId>"],
    "filters": null
  }
}
```

4. Read/search again and inspect `orderArrivalBookingState`.
5. If Omnia still requires a recorded step, call `POST /apigateway/wawiservice/order-arrival/book-recorded` with status IDs and a narrow filter selection copied from the current search context.

Guardrails:

- Never create `book-recorded` filters by hand from stale UI state.
- Use one selected arrival position unless a multi-position recording proves the bulk case.
- A single `book` call can complete the workflow in some recordings; decide from response state.

## Workflow: Documents And File Archive

Purpose: list document metadata and download the corresponding file.

1. Query metadata:

```http
GET /apigateway/document/stored-documents?availableTo.type=<entityType>&availableTo.entityIds=<entityId>&size=25
Authorization: Bearer <token>
```

2. Pick a document/file ID from metadata.
3. Optionally check file availability:

```http
HEAD /apigateway/file-archive/file-archive/load/files/{fileId}
Authorization: Bearer <token>
```

4. Download:

```http
GET /apigateway/file-archive/file-archive/load/files/{fileId}
Authorization: Bearer <token>
```

Guardrails:

- Enforce explicit document permissions in the facade.
- Do not expose blind file ID downloads.
- Keep document content out of logs and recordings unless redaction is guaranteed.
