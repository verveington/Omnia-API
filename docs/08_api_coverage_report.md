# API-Coverage-Report

Generiert: 2026-06-09T20:51:30.612Z

Hinweis: Der Report vergleicht statisch bekannte Frontend-Pfade mit redacted JSONL-Aufzeichnungen. Gateway-Aliasse wie `/apigateway/kunden/customers/search` werden ueber den statischen Suffix `/customers/search` abgeglichen.

## Zusammenfassung

- Bekannte Endpunkte: 501
- Beobachtete API-Endpunkte: 172
- Beobachtet aus bekanntem Inventar: 132
- Coverage: 26.35 %
- Fehlende bekannte Endpunkte: 369
- Beobachtete, nicht statisch erkannte Endpunkte: 34

## Naechste Recording-Prioritaeten

### Kunden/Vorgaenge

- Grund: 68 fehlende Kunden-/Vorgangs-Endpunkte; Kundenstamm, Vorgangssuche und Detailseiten aufnehmen.
- Beispiele:
  - GET `/customers/{customerId}/arzt/{relationId}`
  - POST `/customers/{customerId}/documents`
  - PUT `/customers/{customerId}/documents/{documentId}`
  - GET `/customers/{customerUuid}/kostentraeger/{kostentraegerUuid}`
  - GET `/customers/{customerUuid}/kostentraeger/has-valid-kostentraeger`
- Empfohlener Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### Filialen/Mandant

- Grund: 56 fehlende Endpunkte; diesen Bereich in einer eigenen Aufnahme erkunden.
- Beispiele:
  - POST `/companies`
  - PUT `/companies/details`
  - PUT `/companies/details/accountings`
  - GET `/companies/details/azure-storage-settings`
  - POST `/companies/details/azure-storage-settings`
- Empfohlener Recording-Befehl:
  - Filialen/Mandant manuell aufnehmen
```bash
node tools/recording-workflow.ts --mode manual --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --steps "Bereich Filialen/Mandant oeffnen,Listen, Suche und Detailansichten lesen,Keine Schreibaktion ausfuehren" --expect-endpoint "POST /companies" --expect-endpoint "PUT /companies/details" --expect-endpoint "PUT /companies/details/accountings"
```

### Abrechnung/Kasse

- Grund: 36 fehlende Abrechnungs-Endpunkte; Rechnung, Sammelrechnung, Kasse und Zahlungsflows aufnehmen.
- Beispiele:
  - POST `/bons`
  - GET `/bons/{bonUuid}`
  - GET `/cash-book-entries/csv`
  - GET `/cash-books/{cashBookUuid}/cash-book-entries`
  - POST `/cash-books/{cashBookUuid}/cash-book-entries`
- Empfohlener Recording-Befehl:
  - Abrechnung und Kasse aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/accounting/payment-terms" --expect-endpoint "GET /bons/{bonUuid}" --expect-endpoint "GET /cash-book-entries/csv" --expect-endpoint "GET /cash-books/{cashBookUuid}/cash-book-entries"
```

### Artikel/Warenbestand

- Grund: 34 fehlende Artikel-/Bestands-Endpunkte; Artikelsuche, Details, Preis- und Lagerdaten aufnehmen.
- Beispiele:
  - GET `/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}`
  - PUT `/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions`
  - POST `/article-kits/{articleKitId}/article-kit-material-positions`
- Empfohlener Recording-Befehl:
  - Artikelverwaltung mit Musterartikel aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/merchandise-management/article-management/articles" --expect-endpoint "GET /article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}" --expect-endpoint "GET /article-kits/{articleKitId}" --expect-endpoint "GET /article-kits/{articleKitId}/article-kit-material-positions"
```

### Hilfsmittel

- Grund: 34 fehlende Endpunkte; diesen Bereich in einer eigenen Aufnahme erkunden.
- Beispiele:
  - GET `/hilfsmittel/{id}`
  - POST `/hilfsmittel/{id}`
  - PUT `/hilfsmittel/{id}`
  - GET `/hilfsmittel/{id}/documents`
  - POST `/hilfsmittel/{id}/documents`
- Empfohlener Recording-Befehl:
  - Hilfsmittel manuell aufnehmen
```bash
node tools/recording-workflow.ts --mode manual --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --steps "Bereich Hilfsmittel oeffnen,Listen, Suche und Detailansichten lesen,Keine Schreibaktion ausfuehren" --expect-endpoint "GET /hilfsmittel/{id}" --expect-endpoint "POST /hilfsmittel/{id}" --expect-endpoint "PUT /hilfsmittel/{id}"
```

### Dokumente/Archiv

- Grund: 30 fehlende Dokument-Endpunkte; Dokumentanzeige, Archiv, Druck/PDF und Dateizugriffe aufnehmen.
- Beispiele:
  - POST `/dv-batch-report/{reportId}/documents/merge`
  - GET `/dv-batch-report/{reportId}/documents/zip`
  - GET `/file-archive/cloud/load/files/{fileId}`
  - GET `/file-archive/cloud/load/files/{serviceName}/{templateName}`
  - GET `/file-archive/cloud/load/files/templates`
- Empfohlener Recording-Befehl:
  - Dokumente und Archiv manuell aufnehmen
```bash
node tools/recording-workflow.ts --mode manual --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --steps "Dokumentbereich oeffnen,Vorhandenes Testdokument anzeigen,Druck oder PDF nur vorbereiten" --expect-endpoint "POST /dv-batch-report/{reportId}/documents/merge" --expect-endpoint "GET /dv-batch-report/{reportId}/documents/zip" --expect-endpoint "GET /file-archive/cloud/load/files/{fileId}"
```

### Warenwirtschaft/Bestellung

- Grund: 17 fehlende Wawi-Endpunkte; gezielt Bestellvorschlaege, Bestellungen, Lager und Wareneingang aufzeichnen.
- Beispiele:
  - POST `/order-arrival/book-recorded`
  - POST `/orders/{orderUuid}/add-proposals`
  - POST `/orders/{orderUuid}/check-proposals`
  - POST `/orders/{orderUuid}/positions`
  - PUT `/orders/{orderUuid}/positions`
- Empfohlener Recording-Befehl:
  - Wawi-Bestellvorschlaege read-only aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/merchandise-management/order-management/order-proposals"
```

### Kommunikation/Aufgaben

- Grund: 16 fehlende Kommunikations-Endpunkte; Mail, Reminder, Aufgaben und Benachrichtigungen aufnehmen.
- Beispiele:
  - DELETE `/kim/mails/{messageId}`
  - POST `/kim/mails/{uid}/attachments`
  - GET `/kim/mails/available-connections`
  - POST `/kim/mails/check-pop3-connection`
  - POST `/kim/mails/check-smtp-connection`
- Empfohlener Recording-Befehl:
  - Kommunikation und Aufgaben manuell aufnehmen
```bash
node tools/recording-workflow.ts --mode manual --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --steps "Aufgaben oder Mailbereich oeffnen,Vorhandene Testobjekte lesen,Keine externe Nachricht senden" --expect-endpoint "DELETE /kim/mails/{messageId}" --expect-endpoint "POST /kim/mails/{uid}/attachments" --expect-endpoint "GET /kim/mails/available-connections"
```

### Touren/Routenplanung

- Grund: 10 fehlende Routen-Endpunkte; Tourenplanung und Exportpfade aufnehmen.
- Beispiele:
  - POST `/route-plannings`
  - GET `/route-plannings/{id}/stops`
  - DELETE `/route-plannings/{routePlanningUuid}`
  - GET `/route-plannings/{routePlanningUuid}`
  - PUT `/route-plannings/{routePlanningUuid}`
- Empfohlener Recording-Befehl:
  - Routenplanung und Exportpfade aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/route-planning" --expect-endpoint "GET /route-plannings/{id}/stops" --expect-endpoint "GET /route-plannings/{routePlanningUuid}"
```

### hmvhelper

- Grund: 9 fehlende Endpunkte; diesen Bereich in einer eigenen Aufnahme erkunden.
- Beispiele:
  - GET `/hmvhelper`
  - GET `/hmvhelper/{productGroup}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}/{productType}`
- Empfohlener Recording-Befehl:
  - hmvhelper manuell aufnehmen
```bash
node tools/recording-workflow.ts --mode manual --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --steps "Bereich hmvhelper oeffnen,Listen, Suche und Detailansichten lesen,Keine Schreibaktion ausfuehren" --expect-endpoint "GET /hmvhelper" --expect-endpoint "GET /hmvhelper/{productGroup}" --expect-endpoint "GET /hmvhelper/{productGroup}/{applicationSite}"
```

## Fehlende Endpunkte Nach Bereich

| Bereich | Fehlend | Beispiele |
|---|---:|---|
| Kunden/Vorgaenge | 68 | GET `/customers/{customerId}/arzt/{relationId}`<br>POST `/customers/{customerId}/documents`<br>PUT `/customers/{customerId}/documents/{documentId}`<br>GET `/customers/{customerUuid}/kostentraeger/{kostentraegerUuid}`<br>GET `/customers/{customerUuid}/kostentraeger/has-valid-kostentraeger` |
| Filialen/Mandant | 56 | POST `/companies`<br>PUT `/companies/details`<br>PUT `/companies/details/accountings`<br>GET `/companies/details/azure-storage-settings`<br>POST `/companies/details/azure-storage-settings` |
| Abrechnung/Kasse | 36 | POST `/bons`<br>GET `/bons/{bonUuid}`<br>GET `/cash-book-entries/csv`<br>GET `/cash-books/{cashBookUuid}/cash-book-entries`<br>POST `/cash-books/{cashBookUuid}/cash-book-entries` |
| Artikel/Warenbestand | 34 | GET `/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}`<br>GET `/article-kits/{articleKitId}`<br>PUT `/article-kits/{articleKitId}`<br>GET `/article-kits/{articleKitId}/article-kit-material-positions`<br>POST `/article-kits/{articleKitId}/article-kit-material-positions` |
| Hilfsmittel | 34 | GET `/hilfsmittel/{id}`<br>POST `/hilfsmittel/{id}`<br>PUT `/hilfsmittel/{id}`<br>GET `/hilfsmittel/{id}/documents`<br>POST `/hilfsmittel/{id}/documents` |
| Dokumente/Archiv | 30 | POST `/dv-batch-report/{reportId}/documents/merge`<br>GET `/dv-batch-report/{reportId}/documents/zip`<br>GET `/file-archive/cloud/load/files/{fileId}`<br>GET `/file-archive/cloud/load/files/{serviceName}/{templateName}`<br>GET `/file-archive/cloud/load/files/templates` |
| Warenwirtschaft/Bestellung | 17 | POST `/order-arrival/book-recorded`<br>POST `/orders/{orderUuid}/add-proposals`<br>POST `/orders/{orderUuid}/check-proposals`<br>POST `/orders/{orderUuid}/positions`<br>PUT `/orders/{orderUuid}/positions` |
| Kommunikation/Aufgaben | 16 | DELETE `/kim/mails/{messageId}`<br>POST `/kim/mails/{uid}/attachments`<br>GET `/kim/mails/available-connections`<br>POST `/kim/mails/check-pop3-connection`<br>POST `/kim/mails/check-smtp-connection` |
| Touren/Routenplanung | 10 | POST `/route-plannings`<br>GET `/route-plannings/{id}/stops`<br>DELETE `/route-plannings/{routePlanningUuid}`<br>GET `/route-plannings/{routePlanningUuid}`<br>PUT `/route-plannings/{routePlanningUuid}` |
| hmvhelper | 9 | GET `/hmvhelper`<br>GET `/hmvhelper/{productGroup}`<br>GET `/hmvhelper/{productGroup}/{applicationSite}`<br>GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}`<br>GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}/{productType}` |
| meetings | 9 | GET `/meetings`<br>POST `/meetings`<br>PUT `/meetings`<br>PUT `/meetings/{meetingUuid}`<br>GET `/meetings/{meetingUuid}/{calendarId}` |
| stocktaking-lists | 7 | POST `/stocktaking-lists`<br>GET `/stocktaking-lists/{stocktakingListUuid}`<br>PUT `/stocktaking-lists/{stocktakingListUuid}`<br>POST `/stocktaking-lists/{stocktakingListUuid}/import`<br>POST `/stocktaking-lists/{stocktakingListUuid}/pdf` |
| dv-data | 6 | GET `/dv-data/{dvDataId}`<br>PUT `/dv-data/{dvDataId}`<br>POST `/dv-data/{dvDataId}/collective-invoice-validation`<br>POST `/dv-data/{dvDataId}/create-sales-processes`<br>POST `/dv-data/{dvDataId}/versorgungsanzeigen` |
| User/Workspace | 6 | PATCH `/user/preferences`<br>PUT `/workspaces/{uuid}`<br>GET `/workspaces/{workspaceUuid}/scanner-settings`<br>PUT `/workspaces/{workspaceUuid}/tse-initialization`<br>GET `/workspaces/scanner-settings/{workspaceScannerSettingUuid}` |
| inventurbewertung | 4 | POST `/inventurbewertung/altersgruppen`<br>GET `/inventurbewertung/altersgruppen/{uuid}`<br>PUT `/inventurbewertung/altersgruppen/{uuid}`<br>POST `/inventurbewertung/altersgruppen/search` |
| rezepte | 4 | GET `/rezepte`<br>GET `/rezepte/pdf`<br>GET `/rezepte/point-of-service`<br>GET `/rezepte/xml` |
| stock-bookings | 3 | POST `/stock-bookings`<br>POST `/stock-bookings/outflow`<br>POST `/stock-bookings/pdf` |
| datev-export | 2 | POST `/datev-export/account-records`<br>POST `/datev-export/debitoren-kreditoren` |
| dv-batch-report | 2 | POST `/dv-batch-report/{reportId}/pdf-export`<br>POST `/dv-batch-report/{reportId}/search` |
| external | 2 | GET `/external/product`<br>GET `/external/product-groups` |
| order-arrival-protocol | 2 | POST `/order-arrival-protocol/{arrivalBookingUuid}/cancel`<br>POST `/order-arrival-protocol/search` |
| route-planning-items | 2 | GET `/route-planning-items`<br>POST `/route-planning-items/search` |
| stocktaking-articles | 2 | POST `/stocktaking-articles`<br>PUT `/stocktaking-articles/{stocktakingArticleUuid}` |
| stocktaking-logs | 2 | GET `/stocktaking-logs`<br>POST `/stocktaking-logs/{stocktakingListUuid}/pdf` |
| vertragsdokumente | 2 | GET `/vertragsdokumente`<br>GET `/vertragsdokumente/{legs}` |
| aerzte | 1 | GET `/aerzte/{uuid}/addresses` |
| connector | 1 | POST `/connector/vzd/search` |
| hilfsmittel-viability | 1 | POST `/hilfsmittel-viability` |
| p-300-update-reports | 1 | GET `/p-300-update-reports` |

## Beobachtete Nicht-Inventar-Endpunkte

- GET `/apigateway/accounting/cash-books` (500, 3x)
- GET `/apigateway/accounting/fibu-accounts/settings` (200, 27x)
- GET `/apigateway/accounting/material-groups` (200, 24x)
- GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200, 27x)
- GET `/apigateway/audit/changelogs` (200, 3x)
- GET `/apigateway/document/documents/[REDACTED]/png-preview` (200, 1x)
- POST `/apigateway/document/documents/boilerplates/search` (200, 2x)
- POST `/apigateway/ekv/cost-estimates` (201, 1x)
- GET `/apigateway/firma/companies/contact-opportunities` (200, 14x)
- GET `/apigateway/kostentraeger-tenant/kostentraeger` (200, 2x)
- POST `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/addresses/conditional-prioritized-addresses` (200, 1x)
- PATCH `/apigateway/notification/notifications/[REDACTED]/true` (200, 1x)
- GET `/apigateway/price-position/price-positions/search` (200, 1x)
- POST `/apigateway/sales/archived-salesprocess/search` (200, 5x)
- GET `/apigateway/supplier/suppliers` (200, 59x)
- GET `/apigateway/supplier/suppliers/[REDACTED]` (200, 3x)
- GET `/apigateway/supplier/suppliers/[REDACTED]/addresses` (200, 13x)
- GET `/apigateway/supplier/suppliers/[REDACTED]/contact-opportunities` (200, 13x)
- GET `/apigateway/supplier/suppliers/[REDACTED]/contacts` (200, 13x)
- POST `/apigateway/supplier/suppliers/list` (200, 9x)
- GET `/apigateway/supplier/suppliers/search` (200, 7x)
- GET `/apigateway/user-details` (200, 70x)
- PUT `/apigateway/user/users/[REDACTED]/passwords` (200, 1x)
- POST `/apigateway/wawi/incoming-invoices/search` (200, 2x)
- POST `/apigateway/wawi/order-proposals` (201, 10x)
- GET `/apigateway/wawi/order-proposals/[REDACTED]` (200, 3x)
- PUT `/apigateway/wawi/order-proposals/[REDACTED]` (200, 1x)
- POST `/apigateway/wawi/order-proposals/search` (200, 31x)
- POST `/apigateway/wawi/order-proposals/search/sums` (200, 10x)
- POST `/apigateway/wawi/order-proposals/to-order` (200, 10x)
- GET `/apigateway/wawi/order-states` (200, 48x)
- GET `/apigateway/wawi/producers` (200, 55x)
- GET `/apigateway/wawi/storage-locations` (200, 73x)
- GET `/apigateway/wawi/storage-locations/[REDACTED]` (200, 3x)

