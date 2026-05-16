# Extrahierte Backend-Pfade aus api2.optica-omnia.de

Quelle: `tmp/api2-assets/main.8a0dd4ca3e39df01.js` (Angular-Frontend-Bundle).

Stand: Minifizierte Routen (`/{$t}`, `/{he}`, ...) wurden über Template-Literal-Backtracking im Bundle aufgelöst und in ihre fachliche Gruppe einsortiert. Pfad-Parameter sind als `{name}` wiedergegeben (entsprechen dem `encodeParam`-Aufruf im Bundle).

Hinweis: Die Liste ist statisch aus dem Frontend extrahiert. Ohne gueltiges Login/Token antworten die Service-Basen mit `401`. Lokale Hardware-IPC-Funktionen sind hier nicht enthalten.

## Gateway-Service-Basen

- `/apigateway/articletenantservice`
- `/apigateway/auditservice`
- `/apigateway/communicatorservice`
- `/apigateway/customerservice`
- `/apigateway/datevservice`
- `/apigateway/document`
- `/apigateway/file-archive`
- `/apigateway/formservice`
- `/apigateway/hilfsmittel`
- `/apigateway/invoiceservice`
- `/apigateway/mail`
- `/apigateway/navigationservice`
- `/apigateway/pricingservice`
- `/apigateway/printservice`
- `/apigateway/sales`
- `/apigateway/salesprocessservice`
- `/apigateway/telematik`
- `/apigateway/userservice`
- `/apigateway/wawiservice`

## Live-Gateway-Prefixe (aus Recording)

Stand: Playwright-Recording vom 14. Mai 2026 (78 Endpoints, 205 Calls, 100 % 2xx).
Beobachtetes Routing: das Frontend baut URLs mit Service-internen Pfaden (z. B. `/customers/...`), das Gateway routet diese unter externen Aliassen (z. B. `/apigateway/kunden/...`).

| Top-Segment | Gateway-Prefix(e) im Live-Verkehr |
|---|---|
| `/aerzte` | `/apigateway/arzt-tenant` |
| `/art` | `/apigateway/sales` |
| `/articles` | `/apigateway/article-tenant`, `/apigateway/articletenantservice` |
| `/companies` | `/apigateway/firma`, `/apigateway/userservice` |
| `/cost-centers` | `/apigateway/wawi` |
| `/cost-estimates` | `/apigateway/ekv` |
| `/countries` | `/apigateway/country` |
| `/customers` | `/apigateway/kunden` |
| `/delivery-terms` | `/apigateway/wawi` |
| `/departments` | `/apigateway/department` |
| `/enums` | `/apigateway/enum-service` |
| `/feature-toggles` | `/apigateway/userservice` |
| `/file-archive` | `/apigateway/file-archive` |
| `/filialen` | `/apigateway/filiale` |
| `/formulare` | `/apigateway/formservice` |
| `/gateway-configurations` | `/apigateway/mail` |
| `/generic-list-column-states` | `/apigateway/user` |
| `/hilfsmittel` | `/apigateway/hilfsmittel` |
| `/invoices` | `/apigateway/salesprocessservice` |
| `/kostentraeger` | `/apigateway/kostentraeger-tenant` |
| `/mails` | `/apigateway/mail` |
| `/metrics` | `/apigateway/userservice` |
| `/navigations` | `/apigateway/navigation` |
| `/notifications` | `/apigateway/notification` |
| `/payment-terms` | `/apigateway/accounting` |
| `/recommendations` | `/apigateway/salesprocessservice` |
| `/reminders` | `/apigateway/communicatorservice` |
| `/sales-positions` | `/apigateway/pricingservice` |
| `/salesprocesses` | `/apigateway/sales` |
| `/status` | `/apigateway/salesprocessservice` |
| `/stock-items` | `/apigateway/wawi`, `/apigateway/wawiservice` |
| `/stored-documents` | `/apigateway/document` |
| `/tasks` | `/apigateway/task` |
| `/user` | `/apigateway/userservice` |
| `/users` | `/apigateway/user` |
| `/vatrates` | `/apigateway/vatrates` |
| `/workspaces` | `/apigateway/userservice` |

## Erkannte Routen

### /archive-documents

- `POST` `/archive-documents/search`

### /article

- `GET` `/article/generate-labels/{companyProfileId}/articles/{articleId}`

### /article-kit

- `GET` `/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}`

### /article-kits

- `POST` `/article-kits`
- `POST` `/article-kits/search`
- `GET` `/article-kits/search/{searchId}`
- `GET PUT` `/article-kits/{articleKitId}`
- `GET POST PUT` `/article-kits/{articleKitId}/article-kit-material-positions`
- `DELETE GET PUT` `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`
- `GET POST` `/article-kits/{articleKitId}/article-kit-positions`
- `GET` `/article-kits/{articleKitId}/article-kit-positions/has-main-position`
- `DELETE GET PUT` `/article-kits/{articleKitId}/article-kit-positions/{articleKitPositionId}`

### /articles

- `POST` `/articles`
- `POST` `/articles/extended/search`
- `POST` `/articles/list`
- `POST` `/articles/merchandise-management-setting`
- `POST` `/articles/search`
- `GET` `/articles/search/list`
- `GET` `/articles/search/{searchId}`
- `POST` `/articles/simple-search`
- `GET PUT` `/articles/{articleId}`
- `POST PUT` `/articles/{articleId}/cloud-copy`
- `GET` `/articles/{articleId}/details/{filialeId}`
- `GET PUT` `/articles/{articleId}/merchandise-management-setting`
- `GET POST` `/articles/{articleId}/price-data`
- `GET` `/articles/{articleId}/price-data/alternative-selling-prices`
- `PUT` `/articles/{articleId}/price-data/{priceDataId}`
- `GET` `/articles/{articleId}/stock-data`
- `POST` `/articles/{articleTenantUuid}/cloud-update`

### /bits-articles

- `GET` `/bits-articles/article/{id}`
- `GET` `/bits-articles/producer-list`

### /bons

- `GET POST` `/bons`
- `GET` `/bons/{bonUuid}`

### /calculation-rules-pzn

- `POST` `/calculation-rules-pzn`
- `POST` `/calculation-rules-pzn/resolve`
- `POST` `/calculation-rules-pzn/search`
- `GET PUT` `/calculation-rules-pzn/{calculationRulePznUuid}`

### /cash-book-entries

- `GET` `/cash-book-entries/csv`
- `GET` `/cash-book-entries/search`

### /cash-books

- `GET` `/cash-books/cash-book-entries/{salesProcessUuid}`
- `GET` `/cash-books/cash-books/{cashBookUuid}/cash-book-entries/{invoiceNumber}/notice/{documentNumber}`
- `GET` `/cash-books/customer/{customerId}/cash-book-entry-ids`
- `GET POST` `/cash-books/{cashBookUuid}/cash-book-entries`
- `DELETE GET` `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}`
- `PUT` `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}/finish-transaction`

### /collective-invoices

- `POST` `/collective-invoices/abrechnungszentrum-create`
- `POST` `/collective-invoices/abrechnungszentrum-create/selected`
- `POST` `/collective-invoices/direktabrechnung-create`
- `POST` `/collective-invoices/direktabrechnung-create/selected`
- `POST` `/collective-invoices/edifact/begleitzettel-create`
- `POST` `/collective-invoices/edifact/create-edifact`
- `GET` `/collective-invoices/edifact/{collectiveInvoiceUuid}/kostentraeger-assignment`
- `GET` `/collective-invoices/edifact/{collectiveInvoiceUuid}/maintenance`
- `GET` `/collective-invoices/edifact/{id}/maintenance`
- `GET` `/collective-invoices/locked`
- `GET PUT` `/collective-invoices/numbers`
- `POST` `/collective-invoices/omes-transfer`
- `GET` `/collective-invoices/sales-process/{salesProcessUuid}`
- `POST` `/collective-invoices/sales-processes/search`
- `POST` `/collective-invoices/search`
- `POST` `/collective-invoices/sums`
- `POST` `/collective-invoices/validate/abrechnungszentrum`
- `POST` `/collective-invoices/validate/abrechnungszentrum/selected`
- `POST` `/collective-invoices/validate/direktabrechnung`
- `POST` `/collective-invoices/validate/direktabrechnung/selected`
- `POST` `/collective-invoices/{collectiveInvoiceUuid}/cancellations`
- `POST` `/collective-invoices/{collectiveInvoiceUuid}/payments`
- `GET` `/collective-invoices/{collectiveInvoiceUuid}/sales-processes`
- `POST` `/collective-invoices/{id}/cancellations`
- `POST` `/collective-invoices/{id}/payments`
- `GET` `/collective-invoices/{id}/sales-processes`

### /companies

- `POST` `/companies`
- `GET PUT` `/companies/details`
- `GET PUT` `/companies/details/accountings`
- `GET POST` `/companies/details/azure-storage-settings`
- `DELETE GET POST PUT` `/companies/details/infox-ftp-settings`
- `GET PUT` `/companies/details/preferences`
- `GET POST` `/companies/details/printer-settings`
- `GET PUT` `/companies/details/printer-settings/{uuid}`
- `GET PUT` `/companies/details/stationery/preferences`
- `POST` `/companies/details/stationery/upload`
- `PUT` `/companies/details/test-infox-ftp-settings`
- `DELETE GET POST PUT` `/companies/details/wheelit`

### /connector

- `POST` `/connector/vzd/search`

### /customers

- `GET POST` `/customers`
- `POST` `/customers/duplicate-check`
- `POST` `/customers/find-by-migratedids`
- `POST` `/customers/kostentraeger`
- `GET` `/customers/list`
- `GET` `/customers/sales-processes/{salesProcessUuid}/rothballer`
- `GET` `/customers/search`
- `GET` `/customers/{customerId}/arzt/{relationId}`
- `POST` `/customers/{customerId}/documents`
- `PUT` `/customers/{customerId}/documents/{documentId}`
- `GET` `/customers/{customerId}/kostentraeger/{kostentraegerId}`
- `GET PUT` `/customers/{customerUuid}`
- `GET` `/customers/{customerUuid}/contacts`
- `GET POST` `/customers/{customerUuid}/kostentraeger`
- `GET` `/customers/{customerUuid}/kostentraeger/has-valid-kostentraeger`
- `GET PUT` `/customers/{customerUuid}/kostentraeger/{kostentraegerUuid}`
- `GET` `/customers/{customerUuid}/rothballer`
- `GET` `/customers/{customerUuid}/versichertennummer`
- `GET PUT` `/customers/{id}`
- `GET` `/customers/{id}/addresses`
- `GET` `/customers/{id}/addresses/has-main-address/{addressTypeKey}`
- `GET POST` `/customers/{id}/arzt`
- `DELETE PUT` `/customers/{id}/arzt/{arztRelationId}`
- `GET` `/customers/{id}/contacts`
- `GET` `/customers/{id}/documents`
- `GET POST` `/customers/{id}/kostentraeger`
- `PUT` `/customers/{id}/kostentraeger/{customerKostentraegerId}`

### /datev-export

- `POST` `/datev-export/account-records`
- `POST` `/datev-export/debitoren-kreditoren`

### /dv-batch-report

- `POST` `/dv-batch-report/{reportId}/documents/merge`
- `GET` `/dv-batch-report/{reportId}/documents/zip`
- `POST` `/dv-batch-report/{reportId}/pdf-export`
- `POST` `/dv-batch-report/{reportId}/search`

### /dv-data

- `POST` `/dv-data`
- `POST` `/dv-data/calculate-prices`
- `GET` `/dv-data/customer/{customerId}/dv-ids`
- `POST` `/dv-data/search`
- `GET PUT` `/dv-data/{dvDataId}`
- `POST` `/dv-data/{dvDataId}/collective-invoice-validation`
- `POST` `/dv-data/{dvDataId}/create-sales-processes`
- `POST` `/dv-data/{dvDataId}/versorgungsanzeigen`

### /external

- `GET` `/external/countries`
- `GET` `/external/product`
- `GET` `/external/product-groups`

### /feature-toggles

- `GET` `/feature-toggles`

### /file-archive

- `GET` `/file-archive/cloud/load/files/templates`
- `GET` `/file-archive/cloud/load/files/{fileId}`
- `GET` `/file-archive/cloud/load/files/{serviceName}/{templateName}`
- `POST` `/file-archive/cloud/upload/files`
- `POST` `/file-archive/files/metainfos`
- `GET` `/file-archive/load/files`
- `GET` `/file-archive/load/files/{fileId}`
- `GET` `/file-archive/load/files/{fileId}/checksum`
- `GET` `/file-archive/load/files/{serviceName}/{templateName}`
- `POST` `/file-archive/upload/files`
- `POST` `/file-archive/upload/files/binary`
- `POST` `/file-archive/upload/largefiles/block`
- `POST` `/file-archive/upload/largefiles/commit`
- `POST` `/file-archive/upload/largefiles/start`

### /filialen

- `GET POST` `/filialen`
- `GET` `/filialen/addresses/{addressUuid}`
- `GET` `/filialen/institutionskennzeichen`
- `GET POST` `/filialen/institutionskennzeichen-settings`
- `DELETE GET PUT` `/filialen/institutionskennzeichen-settings/{uuid}`
- `POST` `/filialen/list`
- `GET` `/filialen/names`
- `POST` `/filialen/sani-aktuell/company-settings`
- `POST` `/filialen/sani-aktuell/divisions`
- `GET` `/filialen/users`
- `DELETE GET POST PUT` `/filialen/{branchUuid}/infox-ftp-settings`
- `PUT` `/filialen/{branchUuid}/test-infox-ftp-settings`
- `GET PUT` `/filialen/{filialeUuid}`
- `GET POST` `/filialen/{filialeUuid}/addresses`
- `GET` `/filialen/{filialeUuid}/addresses/has-main-address/{addressTypeKey}`
- `GET PUT` `/filialen/{filialeUuid}/addresses/{addressUuid}`
- `GET POST` `/filialen/{filialeUuid}/institutionskennzeichen`
- `GET PUT` `/filialen/{filialeUuid}/institutionskennzeichen/{ikUuid}`
- `GET` `/filialen/{filialeUuid}/invoice-settings`
- `PUT` `/filialen/{filialeUuid}/invoice-settings/{invoiceUuid}`
- `GET` `/filialen/{filialeUuid}/receipt-settings`
- `PUT` `/filialen/{filialeUuid}/receipt-settings/{receiptUuid}`
- `DELETE GET POST PUT` `/filialen/{filialeUuid}/sani-aktuell`
- `DELETE GET PUT` `/filialen/{filialeUuid}/users`

### /formulare

- `POST` `/formulare/mandant`
- `POST` `/formulare/mandant/search`
- `DELETE GET PUT` `/formulare/mandant/{uuid}`
- `POST` `/formulare/search`
- `POST` `/formulare/vertrag`
- `POST` `/formulare/vertrag/search`
- `DELETE GET PUT` `/formulare/vertrag/{uuid}`

### /hilfsmittel

- `POST` `/hilfsmittel`
- `POST` `/hilfsmittel/batch`
- `POST` `/hilfsmittel/rechnungsabgrenzung/export`
- `POST` `/hilfsmittel/rechnungsabgrenzung/export/csv`
- `GET POST` `/hilfsmittel/retrieval`
- `POST` `/hilfsmittel/search`
- `GET` `/hilfsmittel/termine`
- `GET` `/hilfsmittel/termine/possible-types`
- `GET` `/hilfsmittel/traits`
- `GET PUT` `/hilfsmittel/traits/{id}`
- `GET` `/hilfsmittel/udi/{udi}`
- `GET POST PUT` `/hilfsmittel/{id}`
- `GET POST` `/hilfsmittel/{id}/documents`
- `DELETE GET PUT` `/hilfsmittel/{id}/documents/{documentId}`
- `GET POST` `/hilfsmittel/{id}/expenditures`
- `GET` `/hilfsmittel/{id}/expenditures/expenses`
- `DELETE PUT` `/hilfsmittel/{id}/expenditures/{expenditureId}`
- `POST` `/hilfsmittel/{id}/hilfsmitteldatenblatt`
- `GET POST` `/hilfsmittel/{id}/notes`
- `DELETE GET PUT` `/hilfsmittel/{id}/notes/{noteId}`
- `GET POST` `/hilfsmittel/{id}/termine`
- `GET` `/hilfsmittel/{id}/termine/possible-types`
- `DELETE GET PUT` `/hilfsmittel/{id}/termine/{terminId}`
- `GET` `/hilfsmittel/{id}/usage`

### /hilfsmittel-viability

- `POST` `/hilfsmittel-viability`
- `GET` `/hilfsmittel-viability/articles`
- `GET` `/hilfsmittel-viability/producers`

### /hmvhelper

- `GET` `/hmvhelper`
- `GET` `/hmvhelper/external/search`
- `POST` `/hmvhelper/list`
- `POST` `/hmvhelper/search`
- `GET` `/hmvhelper/search/{productGroup}/{applicationSite}/{subGroup}/{productType}`
- `GET` `/hmvhelper/{productGroup}`
- `GET` `/hmvhelper/{productGroup}/{applicationSite}`
- `GET` `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}`
- `GET` `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}/{productType}`

### /inventurbewertung

- `POST` `/inventurbewertung/altersgruppen`
- `POST` `/inventurbewertung/altersgruppen/search`
- `GET PUT` `/inventurbewertung/altersgruppen/{uuid}`

### /invoices

- `POST` `/invoices/mahnlauf`
- `POST` `/invoices/search`
- `POST` `/invoices/sum`

### /kim

- `GET` `/kim/mails/available-connections`
- `POST` `/kim/mails/check-pop3-connection`
- `POST` `/kim/mails/check-smtp-connection`
- `POST` `/kim/mails/retrieve-new-mails`
- `POST` `/kim/mails/send-mail`
- `DELETE` `/kim/mails/{messageId}`
- `POST` `/kim/mails/{uid}/attachments`

### /mails

- `DELETE GET POST PUT` `/mails`
- `PUT` `/mails/move-to-folder`

### /meetings

- `GET POST PUT` `/meetings`
- `POST` `/meetings/conflicting-meetings`
- `GET` `/meetings/dbopt`
- `POST` `/meetings/reply`
- `PUT` `/meetings/{meetingUuid}`
- `PUT` `/meetings/{meetingUuid}/cancel`
- `GET` `/meetings/{meetingUuid}/{calendarId}`

### /order-arrival

- `POST` `/order-arrival/book`
- `POST` `/order-arrival/book-recorded`
- `POST` `/order-arrival/position-info`
- `POST` `/order-arrival/search`

### /order-arrival-protocol

- `POST` `/order-arrival-protocol/search`
- `POST` `/order-arrival-protocol/{arrivalBookingUuid}/cancel`

### /orders

- `POST` `/orders`
- `POST` `/orders/collect-proposal-order-infos`
- `GET` `/orders/customer/{customerId}/order-ids`
- `POST` `/orders/from-proposal`
- `POST` `/orders/search`
- `POST` `/orders/search-with-column-filters`
- `GET PUT` `/orders/{orderUuid}`
- `POST` `/orders/{orderUuid}/add-proposals`
- `POST` `/orders/{orderUuid}/check-proposals`
- `POST` `/orders/{orderUuid}/email`
- `GET POST PUT` `/orders/{orderUuid}/positions`
- `DELETE PUT` `/orders/{orderUuid}/positions/{positionUuid}`
- `POST` `/orders/{orderUuid}/process-order`

### /p-300-update-reports

- `GET` `/p-300-update-reports`

### /recommendations

- `GET` `/recommendations`

### /reminders

- `GET PUT` `/reminders`
- `GET` `/reminders/dbopt`

### /rezepte

- `GET` `/rezepte`
- `GET` `/rezepte/pdf`
- `GET` `/rezepte/point-of-service`
- `GET` `/rezepte/xml`

### /route-planning-items

- `GET` `/route-planning-items`
- `POST` `/route-planning-items/search`

### /route-plannings

- `GET POST` `/route-plannings`
- `DELETE GET PUT` `/route-plannings/{id}`
- `GET` `/route-plannings/{id}/stops`
- `DELETE PUT` `/route-plannings/{routePlanningId}/stops/{routePlanningItemId}`
- `DELETE GET PUT` `/route-plannings/{routePlanningUuid}`
- `GET` `/route-plannings/{routePlanningUuid}/exports`
- `POST` `/route-plannings/{routePlanningUuid}/route-planning-document`
- `POST` `/route-plannings/{routePlanningUuid}/stops/search`
- `DELETE PUT` `/route-plannings/{routePlanningUuid}/stops/{stopUuid}`

### /sales-positions

- `POST` `/sales-positions`
- `POST` `/sales-positions/calculate-single-position`
- `POST` `/sales-positions/eigenanteil`
- `POST` `/sales-positions/unit-prices`
- `GET` `/sales-positions/vertragsdaten`
- `POST` `/sales-positions/zuzahlungen`

### /salesprocesses

- `POST` `/salesprocesses`
- `GET` `/salesprocesses//invoices/{invoiceUuid}`
- `POST` `/salesprocesses/calculate-prices`
- `POST` `/salesprocesses/collective-invoice-report/search/{reportId}`
- `POST` `/salesprocesses/collective-invoice-validation`
- `POST` `/salesprocesses/collective-invoice-validation/{reportId}/pdf-export`
- `POST` `/salesprocesses/collective-invoices`
- `POST` `/salesprocesses/collective-invoices/fakturierung`
- `PUT` `/salesprocesses/collective-invoices/{collectiveInvoiceUuid}`
- `POST` `/salesprocesses/csv-export`
- `GET` `/salesprocesses/current-figures`
- `GET` `/salesprocesses/customer/{customerId}/open-count`
- `GET` `/salesprocesses/customer/{customerId}/vorgang-ids`
- `GET` `/salesprocesses/ekv-inputs`
- `GET` `/salesprocesses/invoice/current`
- `PUT` `/salesprocesses/invoice/current/{invoiceNumber}`
- `GET` `/salesprocesses/kpi-departments`
- `GET` `/salesprocesses/kpi-statistics`
- `POST` `/salesprocesses/search`
- `POST` `/salesprocesses/search/by-uuid`
- `POST` `/salesprocesses/sendToInfox/batch`
- `GET` `/salesprocesses/vouchers/booking/{filialeUuid}`
- `POST` `/salesprocesses/vouchers/create`
- `POST` `/salesprocesses/vouchers/document`
- `GET` `/salesprocesses/vouchers/latest-number`
- `GET` `/salesprocesses/vouchers/number`
- `GET` `/salesprocesses/vouchers/number/{voucherNumber}`
- `GET` `/salesprocesses/vouchers/scan/{keywords}`
- `POST` `/salesprocesses/vouchers/search`
- `GET PUT` `/salesprocesses/vouchers/{voucherUuid}`
- `GET POST PUT` `/salesprocesses/{id}`
- `GET` `/salesprocesses/{id}/billing-documents`
- `POST` `/salesprocesses/{id}/gutschrift`
- `POST` `/salesprocesses/{salesProcessId}/bons/{documentId}/cancellations`
- `POST` `/salesprocesses/{salesProcessId}/delivery-notes`
- `GET POST` `/salesprocesses/{salesProcessId}/documents`
- `POST` `/salesprocesses/{salesProcessId}/invoices/{invoiceId}/payments`
- `POST` `/salesprocesses/{salesProcessId}/payments`
- `POST` `/salesprocesses/{salesProcessId}/versorgungsanzeigen`
- `POST` `/salesprocesses/{salesProcessId}/workshop-orders`
- `POST` `/salesprocesses/{salesProcessId}/zahlungserinnerung`
- `GET POST PUT` `/salesprocesses/{salesProcessUuid}`
- `POST` `/salesprocesses/{salesProcessUuid}/delivery-notes`
- `POST` `/salesprocesses/{salesProcessUuid}/gutschrift`
- `POST` `/salesprocesses/{salesProcessUuid}/invoice-previews`
- `GET POST` `/salesprocesses/{salesProcessUuid}/invoices`
- `POST` `/salesprocesses/{salesProcessUuid}/invoices/{invoiceUuid}/cancellation-previews`
- `POST` `/salesprocesses/{salesProcessUuid}/invoices/{invoiceUuid}/cancellations`
- `POST` `/salesprocesses/{salesProcessUuid}/invoices/{invoiceUuid}/update`
- `POST` `/salesprocesses/{salesProcessUuid}/sendToInfox`
- `POST` `/salesprocesses/{salesProcessUuid}/versorgungsanzeigen`
- `POST` `/salesprocesses/{salesProcessUuid}/workshop-orders`
- `POST` `/salesprocesses/{salesProcessUuid}/zahlungserinnerung`

### /status

- `POST` `/status`
- `POST` `/status/search`
- `GET PUT` `/status/{statusId}`

### /stock-bookings

- `GET POST` `/stock-bookings`
- `POST` `/stock-bookings/outflow`
- `POST` `/stock-bookings/pdf`
- `GET` `/stock-bookings/search`

### /stock-items

- `GET` `/stock-items`
- `POST` `/stock-items/count-article-quantities`
- `POST` `/stock-items/pdf`
- `GET` `/stock-items/search`
- `GET` `/stock-items/{stockItemUuid}`

### /stocktaking-articles

- `GET POST` `/stocktaking-articles`
- `PUT` `/stocktaking-articles/{stocktakingArticleUuid}`

### /stocktaking-lists

- `GET POST` `/stocktaking-lists`
- `POST` `/stocktaking-lists/csv`
- `GET PUT` `/stocktaking-lists/{stocktakingListUuid}`
- `POST` `/stocktaking-lists/{stocktakingListUuid}/import`
- `POST` `/stocktaking-lists/{stocktakingListUuid}/pdf`
- `GET` `/stocktaking-lists/{stocktakingListUuid}/storage-locations`
- `POST` `/stocktaking-lists/{stocktakingListUuid}/takeover`

### /stocktaking-logs

- `GET` `/stocktaking-logs`
- `POST` `/stocktaking-logs/{stocktakingListUuid}/pdf`

### /stored-documents

- `GET POST` `/stored-documents`
- `POST` `/stored-documents/exists`
- `POST` `/stored-documents/search`
- `DELETE GET PUT` `/stored-documents/{documentUuid}`
- `GET` `/stored-documents/{documentUuid}/audit`
- `DELETE` `/stored-documents/{entityUuid}/{fileUuid}`
- `DELETE GET PUT` `/stored-documents/{id}`

### /suppliers

- `POST` `/suppliers/{supplierId}/addresses`
- `PUT` `/suppliers/{supplierId}/addresses/{addressDetailsId}`
- `GET` `/suppliers/{supplierId}/addresses/{addressId}`
- `GET PUT` `/suppliers/{supplierUuid}/wheelit`

### /tasks

- `GET POST` `/tasks`
- `GET` `/tasks/by-process`
- `GET` `/tasks/by-process/count`
- `GET` `/tasks/reminder-count`
- `GET` `/tasks/task-count`
- `GET PUT` `/tasks/{uuid}`
- `POST` `/tasks/{uuid}/attachment`

### /user

- `GET PATCH` `/user/preferences`

### /vertragsdokumente

- `GET` `/vertragsdokumente`
- `GET` `/vertragsdokumente/{legs}`

### /workspaces

- `GET POST` `/workspaces`
- `POST` `/workspaces/log`
- `GET PUT` `/workspaces/scanner-settings/{workspaceScannerSettingUuid}`
- `PUT` `/workspaces/{uuid}`
- `GET` `/workspaces/{workspaceUuid}`
- `GET` `/workspaces/{workspaceUuid}/scanner-settings`
- `PUT` `/workspaces/{workspaceUuid}/tse-initialization`

## Im Recording beobachtete Endpoints, die NICHT in der statischen Extraktion stehen

Gefunden durch Playwright-Recorder: **50 Endpoints** in 25 Gruppen.
Diese Routen wurden im Bundle entweder gar nicht (anderes Code-Pfad) oder nur als minifizierte Tokens ohne aufloesbare Suffixe erfasst.

### /aerzte

- `GET` `/aerzte`
- `GET` `/aerzte/{uuid}`
- `GET` `/aerzte/{uuid}/addresses`
- `GET` `/aerzte/{uuid}/notes`

### /art

- `POST` `/art/search`

### /articles

- `GET` `/articles/search/{id}`
- `GET` `/articles/{uuid}/merchandise-management-setting`

### /cost-centers

- `GET` `/cost-centers`

### /cost-estimates

- `GET` `/cost-estimates`
- `GET` `/cost-estimates/latest-approved`

### /countries

- `GET` `/countries`

### /customers

- `GET` `/customers/{uuid}`
- `GET` `/customers/{uuid}/addresses`
- `GET` `/customers/{uuid}/arzt`
- `GET` `/customers/{uuid}/contacts`
- `GET` `/customers/{uuid}/kostentraeger`
- `GET` `/customers/{uuid}/notes`

### /delivery-terms

- `GET` `/delivery-terms/search`

### /departments

- `GET` `/departments`

### /enums

- `GET` `/enums`

### /file-archive

- `GET` `/file-archive/load/files/{uuid}`
- `HEAD` `/file-archive/load/files/{uuid}`

### /filialen

- `GET` `/filialen/{uuid}`
- `GET` `/filialen/{uuid}/addresses`
- `GET` `/filialen/{uuid}/institutionskennzeichen`
- `GET` `/filialen/{uuid}/institutionskennzeichen/{uuid}`

### /gateway-configurations

- `GET` `/gateway-configurations/user-mail-addresses`

### /generic-list-column-states

- `GET` `/generic-list-column-states`

### /kostentraeger

- `GET` `/kostentraeger/cloud-status`
- `GET` `/kostentraeger/{uuid}`
- `GET` `/kostentraeger/{uuid}/addresses`
- `GET` `/kostentraeger/{uuid}/contacts`
- `GET` `/kostentraeger/{uuid}/notes`

### /mails

- `GET` `/mails/unread-number`

### /metrics

- `POST` `/metrics/user-login`

### /navigations

- `GET` `/navigations/details`

### /notifications

- `GET` `/notifications`

### /payment-terms

- `GET` `/payment-terms`

### /salesprocesses

- `GET` `/salesprocesses/{uuid}/invoices`
- `GET` `/salesprocesses/{uuid}/notes`
- `POST` `/salesprocesses/{uuid}/notes`
- `PUT` `/salesprocesses/{uuid}`

### /stored-documents

- `GET` `/stored-documents/{uuid}`
- `GET` `/stored-documents/{uuid}/audit`
- `PUT` `/stored-documents/{uuid}`

### /users

- `GET` `/users`
- `GET` `/users/{uuid}`
- `GET` `/users/{uuid}/dashboards`

### /vatrates

- `GET` `/vatrates`

### /workspaces

- `GET` `/workspaces/{uuid}`
