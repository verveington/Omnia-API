# Fokus-Coverage: Stammdaten, Vorgaenge, Warenwirtschaft

Generiert: 2026-06-07T15:37:54.497Z
Input-JSONL-Dateien: 92
Record-Filter ab: 2026-06-06

Hinweis: Der Report betrachtet nur die drei aktuell freigeschalteten Hauptmodule. Endpunkte aus frueheren Aufnahmen werden nur beruecksichtigt, wenn sie in den gelesenen JSONL-Dateien enthalten sind. Mit `--since YYYY-MM-DD` kann ein frischer Testuser-Zeitraum isoliert werden.

## Zusammenfassung

- Bekannte Fokus-Endpunkte: 261
- Beobachtet aus bekanntem Inventar: 69
- Coverage: 26.44 %
- Fehlend: 192
- Fehlende Read-like Endpunkte: 87
- Fehlende Write-Endpunkte: 105

| Modul | Bekannt | Beobachtet | Coverage | Fehlend | Read-like offen | Write offen | Statuscodes |
|---|---:|---:|---:|---:|---:|---:|---|
| Stammdaten | 39 | 20 | 51.28 % | 19 | 12 | 7 | 200, 201 |
| Vorgaenge | 115 | 19 | 16.52 % | 96 | 41 | 55 | 200, 201, 500 |
| Warenwirtschaft | 107 | 30 | 28.04 % | 77 | 34 | 43 | 200, 201, 404 |

## Fehlende Endpunkte Je Modul

### Stammdaten

- Beobachtete API-Endpunkte im Modul: 26
- Fehlende Read-like Endpunkte: 12
  - GET `/aerzte/{uuid}/addresses`
  - GET `/customers/{customerId}/arzt/{relationId}`
  - GET `/customers/{customerUuid}/kostentraeger/{kostentraegerUuid}`
  - GET `/customers/{customerUuid}/kostentraeger/has-valid-kostentraeger`
  - GET `/customers/{customerUuid}/rothballer`
  - GET `/customers/{customerUuid}/versichertennummer`
  - GET `/customers/{id}/addresses/has-main-address/{addressTypeKey}`
  - GET `/customers/{id}/documents`
  - GET `/customers/list`
  - GET `/customers/sales-processes/{salesProcessUuid}/rothballer`
  - GET `/kostentraeger/{uuid}/addresses`
  - GET `/kostentraeger/{uuid}/contacts`
- Fehlende Write-Endpunkte: 7
  - POST `/customers/{customerId}/documents`
  - PUT `/customers/{customerId}/documents/{documentId}`
  - DELETE `/customers/{id}/arzt/{arztRelationId}`
  - PUT `/customers/{id}/arzt/{arztRelationId}`
  - PUT `/customers/{id}/kostentraeger/{customerKostentraegerId}`
  - POST `/customers/find-by-migratedids`
  - POST `/customers/kostentraeger`

### Vorgaenge

- Beobachtete API-Endpunkte im Modul: 18
- Fehlende Read-like Endpunkte: 41
  - GET `/cost-estimates/latest-approved`
  - GET `/dv-data/{dvDataId}`
  - GET `/hilfsmittel/{id}`
  - GET `/hilfsmittel/{id}/documents`
  - GET `/hilfsmittel/{id}/documents/{documentId}`
  - GET `/hilfsmittel/{id}/expenditures`
  - GET `/hilfsmittel/{id}/expenditures/expenses`
  - GET `/hilfsmittel/{id}/notes`
  - GET `/hilfsmittel/{id}/notes/{noteId}`
  - GET `/hilfsmittel/{id}/termine`
  - GET `/hilfsmittel/{id}/termine/{terminId}`
  - GET `/hilfsmittel/{id}/termine/possible-types`
- Fehlende Write-Endpunkte: 55
  - PUT `/dv-data/{dvDataId}`
  - POST `/dv-data/{dvDataId}/collective-invoice-validation`
  - POST `/dv-data/{dvDataId}/create-sales-processes`
  - POST `/dv-data/{dvDataId}/versorgungsanzeigen`
  - POST `/dv-data/calculate-prices`
  - POST `/hilfsmittel/{id}`
  - PUT `/hilfsmittel/{id}`
  - POST `/hilfsmittel/{id}/documents`
  - DELETE `/hilfsmittel/{id}/documents/{documentId}`
  - PUT `/hilfsmittel/{id}/documents/{documentId}`
  - POST `/hilfsmittel/{id}/expenditures`
  - DELETE `/hilfsmittel/{id}/expenditures/{expenditureId}`

### Warenwirtschaft

- Beobachtete API-Endpunkte im Modul: 45
- Fehlende Read-like Endpunkte: 34
  - GET `/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`
  - GET `/article-kits/{articleKitId}/article-kit-positions`
  - GET `/article-kits/{articleKitId}/article-kit-positions/{articleKitPositionId}`
  - GET `/article-kits/{articleKitId}/article-kit-positions/has-main-position`
  - GET `/article-kits/search/{searchId}`
  - GET `/article/generate-labels/{companyProfileId}/articles/{articleId}`
  - GET `/articles/{articleId}/price-data/alternative-selling-prices`
  - GET `/articles/{articleId}/stock-data`
  - POST `/articles/extended/search`
- Fehlende Write-Endpunkte: 43
  - PUT `/article-kits/{articleKitId}`
  - POST `/article-kits/{articleKitId}/article-kit-material-positions`
  - PUT `/article-kits/{articleKitId}/article-kit-material-positions`
  - DELETE `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`
  - PUT `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`
  - POST `/article-kits/{articleKitId}/article-kit-positions`
  - DELETE `/article-kits/{articleKitId}/article-kit-positions/{articleKitPositionId}`
  - PUT `/article-kits/{articleKitId}/article-kit-positions/{articleKitPositionId}`
  - PUT `/articles/{articleId}`
  - POST `/articles/{articleId}/cloud-copy`
  - PUT `/articles/{articleId}/cloud-copy`
  - PUT `/articles/{articleId}/merchandise-management-setting`

## Naechste Recording-Kommandos

### Stammdaten

```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 220 --max-minutes 25 --start-path /master-data/customers --test-customer "Max Mustermann" --expect-endpoint "GET /aerzte/{uuid}/addresses" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}"
```

### Vorgaenge

```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 220 --max-minutes 25 --start-path /transactions/list --test-customer "Max Mustermann" --expect-endpoint "GET /cost-estimates/latest-approved" --expect-endpoint "GET /dv-data/{dvDataId}" --expect-endpoint "GET /hilfsmittel/{id}"
```

### Warenwirtschaft

```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 220 --max-minutes 25 --start-path /merchandise-management/order-management/order-proposals --test-customer "Max Mustermann" --test-article Musterartikel --expect-endpoint "GET /article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}" --expect-endpoint "GET /article-kits/{articleKitId}" --expect-endpoint "GET /article-kits/{articleKitId}/article-kit-material-positions"
```

## Beobachtete Beispiele

### Stammdaten

- GET `/apigateway/arzt-tenant/aerzte` (200, 1x)
- GET `/apigateway/arzt-tenant/aerzte/[REDACTED]` (200, 9x)
- GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (200, 7x)
- GET `/apigateway/customerservice/customers/[REDACTED]` (200, 4x)
- GET `/apigateway/kostentraeger-tenant/kostentraeger` (200, 2x)
- GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]` (200, 12x)
- POST `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/addresses/conditional-prioritized-addresses` (200, 1x)
- GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/notes` (200, 7x)
- GET `/apigateway/kostentraeger-tenant/kostentraeger/cloud-status` (200, 10x)
- GET `/apigateway/kunden/customers/[REDACTED]` (200, 14x)
- PUT `/apigateway/kunden/customers/[REDACTED]` (200, 2x)
- GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200, 11x)

### Vorgaenge

- GET `/apigateway/ekv/cost-estimates` (200, 6x)
- POST `/apigateway/ekv/cost-estimates` (201, 1x)
- POST `/apigateway/hilfsmittel/arten/search` (200, 3x)
- GET `/apigateway/hilfsmittel/hilfsmittel/retrieval` (200, 2x)
- GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200, 2x)
- POST `/apigateway/pricingservice/sales-positions` (200, 4x)
- POST `/apigateway/sales/art/search` (200, 8x)
- POST `/apigateway/sales/dv-data/search` (200, 3x)
- POST `/apigateway/sales/salesprocesses` (201, 1x)
- GET `/apigateway/sales/salesprocesses/[REDACTED]` (200, 4x)
- PUT `/apigateway/sales/salesprocesses/[REDACTED]` (200, 6x)
- GET `/apigateway/sales/salesprocesses/[REDACTED]/notes` (200, 6x)

### Warenwirtschaft

- GET `/apigateway/article-tenant/articles/[REDACTED]` (200, 2x)
- GET `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` (200, 1x)
- GET `/apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]` (404, 1x)
- GET `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` (200, 2x)
- GET `/apigateway/article-tenant/articles/[REDACTED]/price-data` (200, 1x)
- GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (200, 1x)
- POST `/apigateway/article-tenant/articles/merchandise-management-setting` (200, 14x)
- POST `/apigateway/article-tenant/articles/search` (200, 1x)
- GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200, 5x)
- POST `/apigateway/articletenantservice/article-kits/search` (200, 1x)
- POST `/apigateway/articletenantservice/articles/simple-search` (200, 16x)
- GET `/apigateway/articletenantservice/bits-articles/producer-list` (200, 1x)

