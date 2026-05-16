# Kumulative Playwright-API-Auswertung

## Quellen

- `playwright-recorder/captures/api-summary-2026-05-14T15-13-50-246Z.json`
- `playwright-recorder/captures/api-summary-2026-05-14T21-08-32-142Z.json`
- `playwright-recorder/captures/api-summary-2026-05-14T21-45-34-045Z.json`
- `playwright-recorder/captures/api-summary-2026-05-15T21-44-01-437Z.json`
- `playwright-recorder/captures/api-summary-2026-05-15T22-00-18-479Z.json`
- `playwright-recorder/captures/api-summary-2026-05-15T22-30-43-925Z.json`
- `playwright-recorder/captures/api-summary-2026-05-15T22-45-05-656Z.json`

## Ergebnis

- Aufnahmen: 7
- Eindeutige Endpunkte: 137
- Methoden: GET 99, POST 34, PUT 2, HEAD 1, PATCH 1
- Statuscodes: 200 842, 201 10, 404 1

## Service-Gruppen

- `/apigateway/wawi`: 19 Endpunkte
- `/apigateway/sales`: 11 Endpunkte
- `/apigateway/article-tenant`: 9 Endpunkte
- `/apigateway/document`: 8 Endpunkte
- `/apigateway/kunden`: 8 Endpunkte
- `/apigateway/supplier`: 8 Endpunkte
- `/apigateway/kostentraeger-tenant`: 6 Endpunkte
- `/apigateway/userservice`: 6 Endpunkte
- `/apigateway/filiale`: 5 Endpunkte
- `/apigateway/hilfsmittel`: 5 Endpunkte
- `/apigateway/salesprocessservice`: 5 Endpunkte
- `/apigateway/user`: 5 Endpunkte
- `/apigateway/accounting`: 4 Endpunkte
- `/apigateway/arzt-tenant`: 4 Endpunkte
- `/apigateway/wawiservice`: 4 Endpunkte
- `/apigateway/file-archive`: 3 Endpunkte
- `/apigateway/firma`: 3 Endpunkte
- `/apigateway/articletenantservice`: 2 Endpunkte
- `/apigateway/communicatorservice`: 2 Endpunkte
- `/apigateway/ekv`: 2 Endpunkte
- `/apigateway/formservice`: 2 Endpunkte
- `/apigateway/mail`: 2 Endpunkte
- `/apigateway/notification`: 2 Endpunkte
- `/apigateway/task`: 2 Endpunkte
- `/apigateway/audit`: 1 Endpunkte
- `/apigateway/country`: 1 Endpunkte
- `/apigateway/customerservice`: 1 Endpunkte
- `/apigateway/department`: 1 Endpunkte
- `/apigateway/enum-service`: 1 Endpunkte
- `/apigateway/navigation`: 1 Endpunkte
- `/apigateway/navigationservice`: 1 Endpunkte
- `/apigateway/pricingservice`: 1 Endpunkte
- `/apigateway/user-details`: 1 Endpunkte
- `/apigateway/vatrates`: 1 Endpunkte

## Endpunkte

### /apigateway/accounting

- `GET` `/apigateway/accounting/fibu-accounts/settings` (2 Calls, 200 2)
  - Query: `active`
  - Response: `{ active: boolean; accountNumberType: string; rangeMin: integer; rangeMax: integer; id: string }[]`
- `GET` `/apigateway/accounting/material-groups` (1 Calls, 200 1)
  - Query: `size`
  - Response: `{ content: { id: string; number: string; description: string; active: boolean; hmvRanges: { id: integer; hmvFrom: string; hmvTo: string }[]; accounts: { accountType: string; vatRatePercentage: integer; vatRateKey: string; accountId: string; filialeId: null }[]; stockRequiredFields: unknown[]; hmvRequiredFields: unknown[]; useBranchAccounts: boolean }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[];...`
- `GET` `/apigateway/accounting/material-groups/{uuid}` (1 Calls, 200 1)
  - Response: `{ id: string; number: string; description: string; active: boolean; hmvRanges: { id: integer; hmvFrom: string; hmvTo: string }[]; accounts: { accountType: string; vatRatePercentage: integer; vatRateKey: string; accountId: string; filialeId: null }[]; stockRequiredFields: unknown[]; hmvRequiredFields: unknown[]; useBranchAccounts: boolean }`
- `GET` `/apigateway/accounting/payment-terms` (22 Calls, 200 22)
  - Query: `active`, `paymentTypes`, `size`
  - Response: `{ pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { title: string; paymentTarget: integer; active: boolean; defaultPaymentTerm: boolean; paymentTypes: string[]; cashDiscountDays1: null; cashDiscountDays2: null; cashDiscountPercentage1: null; cashDiscountPercentage2: null; hasDiscount: boolean; id: string }[]; number: integer; sort: unknown[]; totalElements: integer; totalPages: integer; numberOfElem...`

### /apigateway/article-tenant

- `GET` `/apigateway/article-tenant/articles/{uuid}` (3 Calls, 200 3)
  - Response: `{ migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: string; producer: { label: string; id: string }; color: string; side: null; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: integer; sellingPrice: null; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: integer; purchasePriceActual: integer; comp...`
- `GET` `/apigateway/article-tenant/articles/{uuid}/computed-order-value/{id}` (2 Calls, 200 2)
  - Query: `supplierId`, `unit`
  - Response: `{ articleId: string; supplierId: null; quantity: integer; purchasePrice: null; purchasePriceActual: null; discount: null; bulkPrices: unknown[]; orderValue: null; unitPriceNet: null; minimumBulkQuantityInUnit: null; orderQuantityUnitSize: null }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/details/{uuid}` (1 Calls, 404 1)
  - Response: `{ id: string; severity: string; correlationId: string; timestamp: string; messageKey: string; message: string; details: unknown[] }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/merchandise-management-setting` (8 Calls, 200 8)
  - Response: `{ enabled: boolean; articleId: string }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/price-data` (1 Calls, 200 1)
  - Response: `{ suggestedRetailPrice: null; sellingPrice: number; vatRateKey: string; quantityUnit: null; wirtschaftlicheAufzahlung: boolean; purchasePrice: null; purchasePriceActual: null; computePurchasePriceActual: boolean; unitSell: null; discount: null; vatRateBuy: null; minimumBulkQuantity: null; unitBuy: null; unitSize: null; base: string; computeBulkPurchasePrice: boolean; bulkPrices: unknown[]; hasBulkPrices: boolean; alternativeSellingPrices: unknown[]; id: string; ... }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/supplier-assignments` (1 Calls, 200 1)
  - Query: `size`
  - Response: `{ content: unknown[]; pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/article-tenant/articles/merchandise-management-setting` (24 Calls, 200 24)
  - Request: `string[]`
  - Response: `{ content: { enabled: boolean; articleId: string }[]; pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/article-tenant/articles/search` (3 Calls, 200 3)
  - Query: `page`, `size`
  - Request: `{ listType: string; size: integer; dataOrigin: string[]; keywords: string; active: boolean }`
  - Response: `{ content: { migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: string; producer: { label: string; id: string }; color: string; side: null; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: integer; sellingPrice: null; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: integer; purchasePriceActual: in...`
- `GET` `/apigateway/article-tenant/label-configurations/{uuid}` (1 Calls, 200 1)
  - Response: `{ width: integer; height: integer; leftBorder: number; labels: { name: string; positionX: integer; positionY: integer }[]; id: string; companyProfileId: string }`

### /apigateway/articletenantservice

- `GET` `/apigateway/articletenantservice/articles/{uuid}` (1 Calls, 200 1)
  - Response: `{ migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: string; producer: { label: string; id: string }; color: string; side: null; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: integer; sellingPrice: null; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: integer; purchasePriceActual: integer; comp...`
- `GET` `/apigateway/articletenantservice/articles/search/{id}` (5 Calls, 200 5)
  - Response: `{ migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: null; producer: { label: string; id: string }; color: null; side: null; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: null; sellingPrice: number; vatRateKey: string; quantityUnit: null; wirtschaftlicheAufzahlung: boolean; purchasePrice: null; purchasePriceActual: null; computePurchasePr...`

### /apigateway/arzt-tenant

- `GET` `/apigateway/arzt-tenant/aerzte` (1 Calls, 200 1)
  - Query: `active`, `keywords`, `page`, `size`, `sort`
  - Response: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { lanr: string; nbsnrs: unknown[]; bsnr: string; title: string; shortTitle: string; firstName: string; lastName: string; phoneNumbers: { phoneNumber: string; phoneType: string; isCloudReferenced: boolean }[]; email: null; faxConnection:...`
- `GET` `/apigateway/arzt-tenant/aerzte/{uuid}` (5 Calls, 200 5)
  - Response: `{ lanr: string; nbsnrs: unknown[]; bsnr: string; title: string; shortTitle: string; firstName: string; lastName: string; phoneNumbers: { phoneNumber: string; phoneType: string; isCloudReferenced: boolean }[]; email: null; faxConnection: string; active: boolean; address: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; mainAddress: boolean; active: boolean; id: string; addressType: string; countryId: string; stateId: string }; validation:...`
- `GET` `/apigateway/arzt-tenant/aerzte/{uuid}/addresses` (2 Calls, 200 2)
  - Query: `size`
  - Response: `{ content: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; mainAddress: boolean; active: boolean; id: string; addressType: string; countryId: string; stateId: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalEleme...`
- `GET` `/apigateway/arzt-tenant/aerzte/{uuid}/notes` (2 Calls, 200 2)
  - Query: `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`

### /apigateway/audit

- `GET` `/apigateway/audit/changelogs` (1 Calls, 200 1)
  - Query: `active`, `contextId`, `contextType`, `keywords`, `page`, `size`, `sort`
  - Response: `{ pageable: { sort: { empty: boolean; unsorted: boolean; sorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { number: integer; user: string; date: string; service: string; object: null; attribute: string; oldValue: null; newValue: string; note: string }[]; number: integer; sort: { empty: boolean; unsorted: boolean; sorted: boolean }; totalPages: integer; totalElements: integer; numberOfElements: integer; first: ...`

### /apigateway/communicatorservice

- `GET` `/apigateway/communicatorservice/reminders/dbopt` (7 Calls, 200 7)
  - Query: `endDate`, `startDate`, `userId`
  - Response: `unknown[]`
- `GET` `/apigateway/communicatorservice/tasks/by-process/count` (1 Calls, 200 1)
  - Query: `salesProcessId`
  - Response: `integer`

### /apigateway/country

- `GET` `/apigateway/country/countries` (6 Calls, 200 6)
  - Query: `hasState`, `size`
  - Response: `{ content: { name: string; stateName: string; iso3166: string; iso3166Alpha3: string; states: { name: string; id: string }[]; dakotaCountry: string; id: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/customerservice

- `GET` `/apigateway/customerservice/customers/{uuid}` (1 Calls, 200 1)
  - Response: `{ customerNumber: integer; title: null; salutation: string; firstName: string; lastName: string; dateOfBirth: string; birthName: null; versichertennummer: string; migratedId: null; phoneNumbers: unknown[]; email: null; faxConnection: null; dateOfDeath: null; fiBuAccountNumber: integer; gdprSigned: boolean; active: boolean; taxIdentificationNumber: null; employee: boolean; shoeSize: null; insolesSize: null; ... }`

### /apigateway/department

- `GET` `/apigateway/department/departments` (17 Calls, 200 17)
  - Query: `filialeId`, `size`
  - Response: `{ pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; mainUserId: string; number: integer; name: string; mainUserName: string; active: boolean; departmentFilialeNames: string; departmentFilialeLeads: string; departmentFilialeHeads: { filialeName: null; userName: string; activ...`

### /apigateway/document

- `GET` `/apigateway/document/documents/{uuid}/png-preview` (1 Calls, 200 1)
  - Response: `string[]`
- `POST` `/apigateway/document/documents/boilerplates/search` (2 Calls, 200 2)
  - Query: `page`, `size`, `sort`
  - Request: `{ keywords: string; active: boolean; documentType: string }`
  - Response: `{ pageable: { sort: { empty: boolean; sorted: boolean; unsorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; documentType: string; position: string; text: string; active: boolean; standard: boolean; id: string }[]; number: integer; sort: { empty: boolean; sorted: boolean; unsorted: boolean }; totalElements: integer; totalPages: integer; numberOfElements: integer; first: boolean; last: boole...`
- `GET` `/apigateway/document/stored-documents` (13 Calls, 200 13)
  - Query: `availableTo.entityIds`, `availableTo.type`, `entityArticle`, `entityCustomer`, `entityOrder`, `entitySalesProcess`, `entitySupplier`, `size`
  - Response: `{ content: unknown[]; pageable: { sort: { empty: boolean; sorted: boolean; unsorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { empty: boolean; sorted: boolean; unsorted: boolean }; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/document/stored-documents` (1 Calls, 201 1)
  - Request: `{ id: null; entityId: string; entityType: string; entityDescription: string; name: string; createdDate: null; documentType: string; fileFormat: null; formType: string; mipDocumentType: null; documentResourceId: string; fileId: string; filename: string; storageLocations: { storageLocationType: string; storageLocationId: string }[]; dataElements: unknown[]; metaData: {  }; availableTo: unknown[]; storageLocation: string; formularData: { pdfBackground: string; formData: { schemas: { Feld1: { type: ...`
  - Response: `{ mipDocumentType: null; entityType: string; availableTo: unknown[]; entityDescription: string; createdDate: string; modifiedDate: string; name: string; filename: string; documentType: string; formType: string; storageLocations: { storageLocationType: string; storageLocationId: string }[]; metaData: {  }; formularData: { pdfBackground: string; formData: { schemas: { Feld1: { type: string; width: number; height: number; rotate: integer; fieldId: string; fontName: string; fontSize: integer; positi...`
- `GET` `/apigateway/document/stored-documents/{uuid}` (3 Calls, 200 3)
  - Response: `{ mipDocumentType: null; entityType: string; availableTo: unknown[]; entityDescription: string; createdDate: string; modifiedDate: string; name: string; filename: string; documentType: string; formType: string; storageLocations: { storageLocationType: string; storageLocationId: string }[]; metaData: {  }; formularData: { formData: { columns: string[]; schemas: { Feld1: { type: string; width: number; height: number; rotate: integer; fieldId: string; fontName: string; fontSize: integer; position: ...`
- `PUT` `/apigateway/document/stored-documents/{uuid}` (1 Calls, 200 1)
  - Request: `{ id: string; entityId: string; entityType: string; entityDescription: string; name: string; createdDate: null; documentType: string; fileFormat: null; formType: string; mipDocumentType: null; documentResourceId: string; fileId: string; filename: string; storageLocations: { storageLocationType: string; storageLocationId: string }[]; dataElements: unknown[]; metaData: {  }; availableTo: unknown[]; storageLocation: string; formularData: { pdfBackground: string; formData: { columns: string[]; schem...`
  - Response: `{ mipDocumentType: null; entityType: string; availableTo: unknown[]; entityDescription: string; createdDate: string; modifiedDate: string; name: string; filename: string; documentType: string; formType: string; storageLocations: { storageLocationType: string; storageLocationId: string }[]; metaData: {  }; formularData: { pdfBackground: string; formData: { columns: string[]; schemas: { Feld1: { type: string; width: number; height: number; rotate: integer; fieldId: string; fontName: string; fontSi...`
- `GET` `/apigateway/document/stored-documents/{uuid}/audit` (1 Calls, 200 1)
  - Query: `page`, `size`, `sort`
  - Response: `{ content: { storedDocumentAuditFileUuid: string; storedDocumentAuditUpdatedBy: string; storedDocumentAuditUserName: string; storedDocumentAuditUpdatedDate: string }[]; pageable: { sort: { empty: boolean; sorted: boolean; unsorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { empty: boolean; sorted: boolean; unsorted: boolean }; numberOfEl...`
- `POST` `/apigateway/document/stored-documents/search` (1 Calls, 200 1)
  - Query: `page`, `size`, `sort`
  - Request: `{ entityCustomer: string[]; entitySalesProcess: string[]; entityDauerversorgung: string[]; entityOrder: string[]; keywords: string; storageLocationTypes: string[] }`
  - Response: `{ content: unknown[]; pageable: { sort: { empty: boolean; sorted: boolean; unsorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { empty: boolean; sorted: boolean; unsorted: boolean }; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/ekv

- `GET` `/apigateway/ekv/cost-estimates` (4 Calls, 200 4)
  - Query: `kvResource`, `resourceId`, `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/ekv/cost-estimates/latest-approved` (2 Calls, 200 2)
  - Query: `kvResource`, `resourceId`
  - Response: `unknown[]`

### /apigateway/enum-service

- `GET` `/apigateway/enum-service/enums` (6 Calls, 200 6)
  - Response: `{ enumType: string; data: { key: string; label: string; tvalue: null }[] }[]`

### /apigateway/file-archive

- `GET` `/apigateway/file-archive/file-archive/load/files/{uuid}` (8 Calls, 200 8)
  - Query: `apiHash`
- `HEAD` `/apigateway/file-archive/file-archive/load/files/{uuid}` (8 Calls, 200 8)
- `POST` `/apigateway/file-archive/file-archive/upload/files` (2 Calls, 201 2)
  - Response: `{ fileId: string }`

### /apigateway/filiale

- `GET` `/apigateway/filiale/filialen` (31 Calls, 200 31)
  - Query: `permissions`, `size`, `userId`
  - Response: `{ content: { id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; ... }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCas...`
- `GET` `/apigateway/filiale/filialen/{uuid}` (13 Calls, 200 13)
  - Response: `{ id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; ... }`
- `GET` `/apigateway/filiale/filialen/{uuid}/addresses` (9 Calls, 200 9)
  - Query: `size`
  - Response: `{ content: { id: string; street: string; streetNumber: string; zipCode: string; city: string; state: null; country: null; addressAdditional: null; poBox: null; mainAddress: boolean; dateValidFrom: string; dateValidTo: null; active: boolean; stateId: string; countryId: string; addressType: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integ...`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen` (7 Calls, 200 7)
  - Query: `size`
  - Response: `{ content: { institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer;...`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen/{uuid}` (6 Calls, 200 6)
  - Response: `{ institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }`

### /apigateway/firma

- `GET` `/apigateway/firma/companies/contact-opportunities` (7 Calls, 200 7)
  - Response: `{ phoneNumbers: { filialeId: null; filialeName: null; filialeNumber: null; phoneNumber: string }[]; faxConnections: { filialeId: null; filialeName: null; filialeNumber: null; faxConnection: string }[]; emails: { filialeId: null; filialeName: null; filialeNumber: null; email: string }[] }`
- `GET` `/apigateway/firma/companies/details` (1 Calls, 200 1)
  - Response: `{ name: string; phoneNumber: string; faxConnection: string; email: string; taxIdentificationNumber: string; eoriNumber: null; commercialRegisterNumber: string; lawCourt: string; id: string }`
- `GET` `/apigateway/firma/companies/details/accountings` (3 Calls, 200 3)
  - Query: `size`
  - Response: `{ id: string; paymentReminder: string; reminderBeforeFirstDunning: boolean; dueDaysPrivateInsurances: integer; dueDaysCostCarrierInvoices: integer; dunningLevel: integer; minimumDunningAmount: null; firstDunningHeader: null; firstDunningFooter: string; secondDunningHeader: null; secondDunningFooter: null; thirdDunningHeader: null; thirdDunningFooter: null; firstDunningDeadline: integer; firstDunningFee: null; secondDunningDeadline: integer; secondDunningFee: integer; thirdDunningDeadline: intege...`

### /apigateway/formservice

- `GET` `/apigateway/formservice/formulare/mandant/{uuid}` (2 Calls, 200 2)
  - Response: `{ nr: string; lastModified: string; lastModifiedBy: string; description: string; active: boolean; published: boolean; mandatory: boolean; availableTo: string; hmvNr: unknown[]; legs: unknown[]; serviceType: unknown[]; config: { pdfBackground: string; formData: { schemas: { Feld1: { type: string; width: number; height: number; rotate: integer; fieldId: string; fontName: string; fontSize: integer; position: { x: integer; y: number }; alignment: string; fontColor: string; lineHeight: integer; backg...`
- `POST` `/apigateway/formservice/formulare/search` (4 Calls, 200 4)
  - Request: `{ salesProcessId: string; hilfsmittelnummer: string; leistungsart: string; legs: string; departmentId: null }[]`
  - Response: `{ nr: null; formType: string; formSubType: string; active: boolean; published: boolean; description: string; availableTo: string; mandatory: boolean; legsCommaSeparated: null; hmvNrCommaSeparated: null; serviceTypeCommaSeparated: null; lastModifiedBy: null; lastModified: null; created: boolean; departmentIds: null; departmentNames: null; id: string }[]`

### /apigateway/hilfsmittel

- `POST` `/apigateway/hilfsmittel/arten/search` (1 Calls, 200 1)
  - Query: `page`, `size`, `sort`
  - Request: `{ active: boolean }`
  - Response: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageSize: integer; pageNumber: integer; unpaged: boolean; paged: boolean }; size: integer; content: { description: string; active: boolean; id: string }[]; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; totalElements: integer; totalP...`
- `GET` `/apigateway/hilfsmittel/hilfsmittel/retrieval` (1 Calls, 200 1)
  - Query: `customerId`, `keywords`, `page`, `size`, `sort`
  - Response: `{ content: { id: string; hilfsmittelId: string; active: boolean; dateOfRetrieval: null; hilfsmittelDescription: string; lfdNr: string; internalNumber: null; hmvNumber: string; materialGroupId: string; materialGroupDescription: string; hilfsmittelArtId: string; hilfsmittelArtDescription: string; stockState: string; condition: string; salesProcessId: string; salesProcessNumber: integer; salesProcessStatusId: string; versorgungStartDate: null; versorgungEndDate: null; leistungsart: string; ... }[];...`
- `GET` `/apigateway/hilfsmittel/hilfsmittel/termine` (10 Calls, 200 10)
  - Query: `dateFrom`, `dateTo`, `done`, `keywords`, `page`, `size`, `sort`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageSize: integer; pageNumber: integer; unpaged: boolean; paged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/hilfsmittel/hilfsmittel/traits` (1 Calls, 200 1)
  - Query: `size`
  - Response: `{ content: { key: string; label: string; type: string; inputType: string; options: { key: string; value: string }[]; regexPattern: null }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageSize: integer; pageNumber: integer; unpaged: boolean; paged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; pr...`
- `GET` `/apigateway/hilfsmittel/route-plannings` (2 Calls, 200 2)
  - Query: `salesProcessNumber`
  - Response: `{ content: unknown[]; pageable: { sort: unknown[]; offset: integer; pageSize: integer; pageNumber: integer; unpaged: boolean; paged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/kostentraeger-tenant

- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}` (8 Calls, 200 8)
  - Response: `{ type: string; ik: string; ekvIk: null; name: string; fiBuAccountNumber: integer; phoneNumbers: unknown[]; faxConnection: string; email: null; active: boolean; kvPrintEkv: boolean; billingIk: boolean; zuzahlungsbefreit: boolean; dataOrigin: string; address: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; description: null; kostentraegerDescription: string; ik: null; linked: boolean; linkedLocked: boolean; mainAddress: boolean; active: ...`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}/addresses` (2 Calls, 200 2)
  - Query: `size`
  - Response: `{ content: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; description: null; kostentraegerDescription: string; ik: null; linked: boolean; linkedLocked: boolean; mainAddress: boolean; active: boolean; kostentraegerIk: string; id: string; addressType: string; countryId: string; stateId: string; linkedId: null; kostentraegerId: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ...`
- `POST` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}/addresses/conditional-prioritized-addresses` (1 Calls, 200 1)
  - Request: `{ addressTypes: string[]; kostentraegerDataOrigin: string }`
  - Response: `{ street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; description: null; kostentraegerDescription: null; ik: null; linked: boolean; linkedLocked: boolean; mainAddress: boolean; active: boolean; kostentraegerIk: null; id: string; addressType: string; countryId: null; stateId: null; linkedId: null; kostentraegerId: null }[]`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}/contacts` (2 Calls, 200 2)
  - Query: `size`
  - Response: `{ content: { type: string; firstName: string; lastName: string; description: string; active: boolean; phoneNumbers: { phoneNumber: string; phoneType: string; isCloudReferenced: boolean }[]; email: null; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer...`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}/notes` (8 Calls, 200 8)
  - Query: `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/cloud-status` (7 Calls, 200 7)
  - Query: `ik`
  - Response: `{ exists: boolean }`

### /apigateway/kunden

- `GET` `/apigateway/kunden/customers/{uuid}` (9 Calls, 200 9)
  - Response: `{ customerNumber: integer; title: null; salutation: string; firstName: string; lastName: string; dateOfBirth: string; birthName: null; versichertennummer: string; migratedId: null; phoneNumbers: unknown[]; email: null; faxConnection: null; dateOfDeath: null; fiBuAccountNumber: integer; gdprSigned: boolean; active: boolean; taxIdentificationNumber: null; employee: boolean; shoeSize: null; insolesSize: null; ... }`
- `GET` `/apigateway/kunden/customers/{uuid}/addresses` (14 Calls, 200 14)
  - Query: `size`
  - Response: `{ content: { mainAddress: boolean; firstName: string; lastName: string; street: string; houseNumber: string; zipCode: string; poBox: null; city: string; alpha3CountryCode: null; addressAdditional: null; dateValidFrom: string; dateValidTo: null; room: null; area: null; active: boolean; stateName: null; countryName: string; countryStateName: null; id: string; addressType: string; ... }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending...`
- `GET` `/apigateway/kunden/customers/{uuid}/addresses/{uuid}` (1 Calls, 200 1)
  - Response: `{ mainAddress: boolean; firstName: null; lastName: null; street: string; houseNumber: string; zipCode: string; poBox: null; city: string; alpha3CountryCode: null; addressAdditional: string; dateValidFrom: string; dateValidTo: null; room: null; area: null; active: boolean; stateName: null; countryName: null; countryStateName: null; id: string; addressType: string; ... }`
- `GET` `/apigateway/kunden/customers/{uuid}/arzt` (11 Calls, 200 11)
  - Query: `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/kunden/customers/{uuid}/contacts` (4 Calls, 200 4)
  - Query: `size`
  - Response: `{ content: { title: string; lastName: string; firstName: string; street: string; streetNumber: string; zipCode: string; city: string; poBox: null; familyRelationship: null; active: boolean; addressAdditional: string; hasBillingAddress: boolean; phoneNumbers: { phoneType: string; phoneNumber: string }[]; phoneNumber: string; email: string; id: string; contactType: string; salutation: string; addressType: string; countryId: null; ... }[]; pageable: { sort: { direction: string; property: string; ig...`
- `GET` `/apigateway/kunden/customers/{uuid}/kostentraeger` (13 Calls, 200 13)
  - Query: `size`
  - Response: `{ content: { id: string; kostentraegerId: string; kostentraegerDataOrigin: string; kostentraegerType: string; kostentraegerName: string; kostentraegerIk: string; kostentraegerStreet: string; kostentraegerStreetNumber: string; kostentraegerZipCode: string; kostentraegerCity: string; versichertennummer: null; dateValidFrom: string; dateValidTo: string; dateExemptFrom: null; dateExemptTo: null; active: boolean; zuzahlungsbefreit: boolean; versichertenstatus: null; customerId: string }[]; pageable: ...`
- `GET` `/apigateway/kunden/customers/{uuid}/notes` (8 Calls, 200 8)
  - Query: `showHint`, `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/kunden/customers/search` (3 Calls, 200 3)
  - Query: `active`, `keywords`, `page`, `size`
  - Response: `{ content: { type: string; customerNumber: integer; title: null; firstName: string; lastName: string; dateOfBirth: string; formattedDateOfBirth: string; birthName: null; versichertennummer: string; phoneNumber: null; phoneNumberMobile: null; email: null; fiBuAccountNumber: string; faxConnection: null; dateOfDeath: null; gdprSigned: boolean; active: boolean; addressStreet: null; addressHouseNumber: null; addressZipCode: null; ... }[]; pageable: { sort: { direction: string; property: string; ignor...`

### /apigateway/mail

- `GET` `/apigateway/mail/gateway-configurations/user-mail-addresses` (6 Calls, 200 6)
  - Response: `unknown[]`
- `GET` `/apigateway/mail/mails/unread-number` (36 Calls, 200 36)
  - Response: `unknown[]`

### /apigateway/navigation

- `GET` `/apigateway/navigation/navigations/details` (6 Calls, 200 6)
  - Response: `{ identifier: string; parentIdentifier: null; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: { identifier: string; parentIdentifier: string; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: unknown[] }[] }[]`

### /apigateway/navigationservice

- `GET` `/apigateway/navigationservice/external/countries` (1 Calls, 200 1)
  - Response: `{ name: string; stateName: string; iso3166: string; iso3166Alpha3: string; states: { name: string; id: string }[]; dakotaCountry: string; id: string }[]`

### /apigateway/notification

- `GET` `/apigateway/notification/notifications` (6 Calls, 200 6)
  - Response: `{ date: string; type: string; data: { severity: string; downloadableFiles: { fileId: string; fileName: string; saveWithoutView: boolean }[]; requestId: string; icon: string; title: string; clickToClose: boolean; note: string }; id: string; readStatus: boolean; notificationCenter: boolean }[]`
- `PATCH` `/apigateway/notification/notifications/{uuid}/true` (2 Calls, 200 2)

### /apigateway/pricingservice

- `POST` `/apigateway/pricingservice/sales-positions` (5 Calls, 200 5)
  - Request: `{ searchId: string; hilfsmittelId: null; variante: null; leistungsdatum: string; prescriptionDate: string; kostentraegerIk: string; leistungserbringerIk: string; articleDataOrigin: null; customerDateOfBirth: string; customerId: string; zuzahlungBefreit: boolean; mainPosition: null; parentPosition: null; producerId: null; branchId: string; amount: null; unit: null; notfallversorgung: boolean; salesProcessType: string; customHilfsmittelkennzeichen: boolean; ... }[]`
  - Response: `{ content: { amount: integer; unitPrice: integer; unitPriceNet: number; unit: string; vatAmount: number; vatRatePercentage: number; totalPrice: integer; positionType: null; discountAmount: null; discountVatAmount: null; totalDiscount: null; discountComment: null; hilfsmittelNummer: string; hilfsmittelPositionsNummer: null; gesetzlicheZuzahlung: integer; zuzahlungRequired: string; zuzahlungCalculation: string; wirtschaftlicheAufzahlung: null; eigenanteil: null; privatanteil: null; ... }[]; pageab...`

### /apigateway/sales

- `POST` `/apigateway/sales/art/search` (9 Calls, 200 9)
  - Query: `page`, `size`, `sort`
  - Request: `{ active: boolean; ids: null }`
  - Response: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; active: boolean; materialPositionen: boolean; id: string }[]; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; t...`
- `POST` `/apigateway/sales/salesprocesses` (3 Calls, 201 3)
  - Request: `{ active: boolean; vorgangssperre: boolean; id: null; salesProcessType: string; number: null; editorId: string; editorType: string; editorName: string; customerId: string; customerName: string; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; ... }`
  - Response: `{ salesProcessType: string; totalGross: integer; totalNet: integer; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: integer; totalVat: integer; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmi...`
- `GET` `/apigateway/sales/salesprocesses/{uuid}` (2 Calls, 200 2)
  - Response: `{ salesProcessType: string; totalGross: number; totalNet: number; totalGrossCustomerPortion: number; totalGrossKostentraegerPortion: number; totalVat: number; totalCoupon: integer; totalPrice: number; totalZuzahlung: number; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: number; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPosi...`
- `PUT` `/apigateway/sales/salesprocesses/{uuid}` (17 Calls, 200 17)
  - Query: `withCollectiveInvoiceValidation`
  - Request: `{ active: boolean; vorgangssperre: boolean; id: string; salesProcessType: string; number: integer; editorId: string; editorType: string; editorName: string; customerId: string; customerName: null; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; ... }`
  - Response: `{ salesProcessType: string; totalGross: integer; totalNet: number; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: integer; totalVat: number; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmitt...`
- `POST` `/apigateway/sales/salesprocesses/{uuid}/delivery-notes` (2 Calls, 201 2)
  - Request: `{ formId: string; positionFilter: null; preview: boolean; headerBoilerplateId: null; footerBoilerplateId: null }`
  - Response: `{ createdDate: string; storageLocations: { storageLocationType: string; storageLocationId: string }[]; name: string; filename: string; documentType: string; formType: null; dataElements: unknown[]; mipDocumentType: null; metaData: { form.businessstationery.fileid: string }; formularData: null; formularInputsData: null; formularLockEdit: null; formularSaveTemporary: null; id: null; fileId: string; documentResourceId: string }`
- `GET` `/apigateway/sales/salesprocesses/{uuid}/invoices` (2 Calls, 200 2)
  - Query: `invoiceType`
  - Response: `unknown[]`
- `GET` `/apigateway/sales/salesprocesses/{uuid}/notes` (6 Calls, 200 6)
  - Query: `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `POST` `/apigateway/sales/salesprocesses/{uuid}/notes` (1 Calls, 201 1)
  - Request: `{ authorId: null; authorName: string; createdDate: null; editorId: null; editorName: string; id: null; showHint: null; text: string; updatedDate: null }`
  - Response: `{ createdDate: string; updatedDate: string; text: string; showHint: boolean; id: string; authorId: string; authorName: string; editorId: null; editorName: string }`
- `POST` `/apigateway/sales/salesprocesses/calculate-prices` (6 Calls, 200 6)
  - Request: `{ active: boolean; vorgangssperre: boolean; id: string; salesProcessType: string; number: integer; editorId: string; editorType: string; editorName: string; customerId: string; customerName: string; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; ... }`
  - Response: `{ salesProcessType: string; totalGross: integer; totalNet: number; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: integer; totalVat: number; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmitt...`
- `GET` `/apigateway/sales/salesprocesses/kpi-statistics` (10 Calls, 200 10)
  - Response: `{ sum: integer; statusId: string }[]`
- `POST` `/apigateway/sales/salesprocesses/search` (12 Calls, 200 12)
  - Query: `page`, `size`, `sort`
  - Request: `{ status: string[]; keywords: string; active: boolean; editor: { editorIds: string[] } }`
  - Response: `{ content: { number: integer; dvNumber: null; editorName: string; editorType: string; customerName: string; customerLastName: string; customerFirstName: string; customerDateOfBirth: string; customerStreet: string; customerHouseNumber: string; customerZipCode: string; customerCity: string; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDateScheduled: null; deliveryDate: string; active: boolean; zuzahlungsbefreit: boolea...`

### /apigateway/salesprocessservice

- `GET` `/apigateway/salesprocessservice/dv-data/customer/{uuid}/dv-ids` (1 Calls, 200 1)
  - Response: `string[]`
- `POST` `/apigateway/salesprocessservice/invoices/search` (6 Calls, 200 6)
  - Query: `page`, `size`
  - Request: `{ customerInvoiceFilter: { number: string }; invoiceFilter: { types: string[]; statuses: string[] } }`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/salesprocessservice/recommendations` (4 Calls, 200 4)
  - Query: `filialeId`
  - Response: `{ key: string; label: string }[]`
- `GET` `/apigateway/salesprocessservice/salesprocesses/customer/{uuid}/vorgang-ids` (1 Calls, 200 1)
  - Response: `string[]`
- `POST` `/apigateway/salesprocessservice/status/search` (16 Calls, 200 16)
  - Query: `size`
  - Request: `{  }`
  - Response: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; comment: null; active: boolean; standardDv: boolean; standardVersorgung: boolean; standardSales: boolean; closedSales: boolean; correspondingSalesState: null; enabled: string[]; enabledCommaSeparated: string; stan...`

### /apigateway/supplier

- `GET` `/apigateway/supplier/suppliers` (18 Calls, 200 18)
  - Query: `active`, `size`, `sort`
  - Response: `{ content: { name: string; industryId: null; website: null; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: string; fiBuAccountNumber: null; producerIds: unknown[]; orderingPlatforms: unknown[]; supplierAddresses: { zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplier...`
- `GET` `/apigateway/supplier/suppliers/{uuid}` (6 Calls, 200 6)
  - Response: `{ name: string; industryId: string; website: null; email: string; faxConnection: string; commercialRegisterNumber: string; taxIdentificationNumber: string; active: boolean; additionalInfo: string; fiBuAccountNumber: null; producerIds: string[]; orderingPlatforms: unknown[]; supplierAddresses: { zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: st...`
- `GET` `/apigateway/supplier/suppliers/{uuid}/addresses` (7 Calls, 200 7)
  - Query: `size`
  - Response: `{ zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: string; countryId: string; stateId: string }[]`
- `GET` `/apigateway/supplier/suppliers/{uuid}/contact-opportunities` (7 Calls, 200 7)
  - Response: `{ emails: { email: string; contactType: null; supplierId: string; contactId: null }[]; phoneNumbers: { phoneType: string; phoneNumber: string; firstName: null; lastName: null; contactType: null; id: string }[] }`
- `GET` `/apigateway/supplier/suppliers/{uuid}/contacts` (7 Calls, 200 7)
  - Query: `size`
  - Response: `{ type: string; firstName: string; lastName: string; email: null; description: string; active: boolean; phoneNumbers: { phoneType: string; phoneNumber: string; id: string; supplierContactId: string }[]; id: string; supplierId: string }[]`
- `GET` `/apigateway/supplier/suppliers/{uuid}/customers` (7 Calls, 200 7)
  - Query: `singleDisplay`
  - Response: `unknown[]`
- `POST` `/apigateway/supplier/suppliers/list` (1 Calls, 200 1)
  - Request: `unknown[]`
  - Response: `unknown[]`
- `GET` `/apigateway/supplier/suppliers/search` (1 Calls, 200 1)
  - Query: `active`, `keywords`, `page`, `size`, `sort`
  - Response: `{ content: { name: string; industryId: null; website: null; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: string; producers: unknown[]; phoneNumber: string; addressZipCode: string; addressCity: string; addressStreet: string; addressHouseNumber: string; addressAdditional: null; addressRoom: null; addressPoBox: null; addressType: string; id: string; ... }[]; pageable: { sort: { direction: string; property: stri...`

### /apigateway/task

- `GET` `/apigateway/task/tasks/reminder-count` (6 Calls, 200 6)
  - Response: `integer`
- `GET` `/apigateway/task/tasks/task-count` (36 Calls, 200 36)
  - Response: `integer`

### /apigateway/user

- `GET` `/apigateway/user/generic-list-column-states` (6 Calls, 200 6)
  - Response: `{ salesprocesses-customer-history: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: string }[] }; collectiveInvoiceSalesProcesses-collective-invoice: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIn...`
- `GET` `/apigateway/user/users` (8 Calls, 200 8)
  - Query: `size`
  - Response: `{ pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; username: string; active: boolean; standardPassword: boolean; firstName: string; lastName: string; email: null; salutation: string; phoneNumber: null; mobilePhoneNumber: null; userNumber: integer; favoriteAppIds: unknown[]; dashboardId: null; profileImageId: null; versichertennummer: null; twoFactorAuthentication: null; notificationForA...`
- `GET` `/apigateway/user/users/{uuid}` (4 Calls, 200 4)
  - Response: `{ id: string; username: string; active: boolean; standardPassword: boolean; firstName: string; lastName: string; email: string; salutation: string; phoneNumber: string; mobilePhoneNumber: null; userNumber: integer; favoriteAppIds: string[]; dashboardId: null; profileImageId: null; versichertennummer: null; twoFactorAuthentication: null; notificationForAssignments: null; passwordExpireDate: string; password: null; tenant: string; ... }`
- `GET` `/apigateway/user/users/{uuid}/dashboards` (6 Calls, 200 6)
  - Response: `{ id: string; configuration: string }`
- `GET` `/apigateway/user/users/search` (11 Calls, 200 11)
  - Query: `active`, `keywords`, `page`, `size`, `sort`
  - Response: `{ pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; username: string; active: boolean; standardPassword: boolean; firstName: string; lastName: string; email: null; salutation: string; phoneNumber: null; mobilePhoneNumber: null; userNumber: integer; favoriteAppIds: unknown[]...`

### /apigateway/user-details

- `GET` `/apigateway/user-details` (6 Calls, 200 6)
  - Response: `{ userId: string; tenantId: string; permissions: string[]; messageBrokerHost: string; messageBrokerPort: string; firstName: string; lastName: string; email: string; dashboardId: null; profileImageId: null; status: string; favoriteAppIds: string[]; messageBrokerUser: string; messageBrokerSecret: string; userResponseQueue: string; workspaceId: string; workspaceFilialeId: string; workspaceStandardIkId: string }`

### /apigateway/userservice

- `GET` `/apigateway/userservice/companies/details/preferences` (7 Calls, 200 7)
  - Response: `{ rezeptTaxierenTypes: string[]; ekCalculationType: string; businessStationery: boolean; merchandiseManagementActive: boolean; inventurbewertungAgeGroups: boolean; grossRevenue: boolean; includeWirtschaftlicheAufzahlung: boolean; hideCloudArticles: boolean; autoAssignMaterialGroup: boolean; globalInvoiceNumbers: boolean; globalCollectiveInvoiceNumbers: boolean; businessStationeryUploaded: boolean; opticaArz: boolean; pzn: boolean; artFreitext: boolean; articlesUpdateType: string; updateOwnArticl...`
- `GET` `/apigateway/userservice/feature-toggles` (6 Calls, 200 6)
  - Response: `{ activeFeatureToggles: string[]; inactiveFeatureToggles: string[]; navigationIdentifiersToHideIfFeatureDisabled: { DAUERVERSORGUNG: string[]; ELEARNING: string[]; FILE_STORAGE_OPTIONAL: unknown[]; COLLECTIVE_INVOICE: string[]; TI_KIM: string[]; HMV: string[]; FORMULAR_GENERATOR_MANDANT: string[]; ARCHIVED_SALES_PROCESS: string[]; PZN: string[]; GUTSCHEIN: string[]; VORGANGSSTATISTIK: string[] }; toggleType: { MERCHANDISE_MANAGEMENT_PAKET4: string; COLLECTIVE_INVOICE: string; MAHNWESEN: string; ...`
- `POST` `/apigateway/userservice/metrics/user-login` (10 Calls, 200 10)
  - Request: `{ username: string; tenantId: string; tokenDuration: number; userDetailsDuration: number; totalDuration: number }`
- `GET` `/apigateway/userservice/user/preferences` (5 Calls, 200 5)
  - Response: `{ flags: { multiWordSearch: boolean } }`
- `GET` `/apigateway/userservice/workspaces/{uuid}` (6 Calls, 200 6)
  - Query: `withTseSummary`
  - Response: `{ autoOpenCashDrawer: boolean; barverkaufAccountId: null; brandName: null; cashSystemActive: boolean; certificate: null; dakotaActive: boolean; dakotaExePath: null; dakotaInputDirectory: null; defaultLineDisplayText: null; filialeId: string; id: string; isLineDisplayConnected: boolean; kasseneinnahmenAccountId: null; kassenentnahmenAccountId: null; kassenfehlbetraegeId: null; kassenueberschuesseId: null; medilogicActive: boolean; medilogicAppPath: null; medilogicFilename: null; medilogicTransfer...`
- `POST` `/apigateway/userservice/workspaces/log` (6 Calls, 200 6)
  - Request: `{ electronVersion: string; hostname: string; ip: string; startup: string; username: string }`

### /apigateway/vatrates

- `GET` `/apigateway/vatrates/vatrates` (6 Calls, 200 6)
  - Query: `all`
  - Response: `{ content: { uuid: string; validFrom: string; validTill: string; key: string; rate: integer }[]; pageable: string; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/wawi

- `GET` `/apigateway/wawi/cost-centers` (14 Calls, 200 14)
  - Query: `size`
  - Response: `{ content: { costCenterNumber: string; description: string; comment: null; active: boolean; branches: { id: string; name: string }[]; branchesNames: string; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: intege...`
- `GET` `/apigateway/wawi/delivery-terms/search` (16 Calls, 200 16)
  - Query: `active`, `keywords`, `paged`, `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `POST` `/apigateway/wawi/incoming-invoices/search` (5 Calls, 200 5)
  - Query: `size`
  - Request: `{ orderId: string }`
  - Response: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; size: integer; content: unknown[]; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; totalPages: integer; totalElements: integer; fir...`
- `POST` `/apigateway/wawi/order-arrival/search` (23 Calls, 200 23)
  - Query: `page`, `size`, `sort`
  - Request: `{ keywords: string; active: boolean; orderNr: string; arrivalBookingState: string }`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `POST` `/apigateway/wawi/order-proposals` (1 Calls, 201 1)
  - Request: `{ id: null; articleId: string; articleNumber: null; articleDescription: null; articleSize: null; articleColor: null; articleSide: null; articleProducerDescription: null; supplierId: string; supplierName: null; filialeId: string; filialeName: null; orderQuantity: integer; orderQuantityUnit: string; orderValue: integer; stockQuantity: null; overallStockQuantity: null; articleMinQuantity: null; articleMaxQuantity: null; storageLocationId: null; ... }`
  - Response: `{ id: string; filialeId: string; filialeName: string; articleId: string; articleOrigin: string; articleNumber: string; articleDescription: string; articleProducerId: string; articleProducerDescription: string; supplierId: string; supplierName: string; salesProcessId: string; salesProcessNumber: integer; customerId: string; customerFirstName: string; customerLastName: string; customerName: string; orderQuantity: integer; orderQuantityUnit: string; orderValue: integer; ... }`
- `POST` `/apigateway/wawi/order-proposals/search` (2 Calls, 200 2)
  - Query: `page`, `size`, `sort`
  - Request: `{ keywords: string; active: boolean }`
  - Response: `{ content: { id: string; filialeId: string; filialeName: string; articleId: string; articleOrigin: string; articleNumber: string; articleDescription: string; articleProducerId: string; articleProducerDescription: string; supplierId: string; supplierName: string; salesProcessId: string; salesProcessNumber: integer; customerId: string; customerFirstName: string; customerLastName: string; customerName: string; orderQuantity: integer; orderQuantityUnit: string; orderValue: integer; ... }[]; pageable...`
- `POST` `/apigateway/wawi/order-proposals/search/sums` (2 Calls, 200 2)
  - Request: `{ keywords: string; active: boolean }`
  - Response: `{ orderQuantity: { PIECE: integer; PACK: integer }; orderValue: number; sumOrderQuantity: integer }`
- `POST` `/apigateway/wawi/order-proposals/to-order` (2 Calls, 200 2)
  - Request: `{ includeAll: boolean; selections: string[]; filters: null }`
  - Response: `unknown[]`
- `GET` `/apigateway/wawi/order-states` (13 Calls, 200 13)
  - Query: `active`, `keywords`, `page`, `size`, `sort`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/wawi/orders/{uuid}` (8 Calls, 200 8)
  - Response: `{ active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: null; orderQuantity: integer; orderValue: integer; deliveryDate: null; deliveryDateScheduled: null; filialeName: string; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; ... }`
- `POST` `/apigateway/wawi/orders/{uuid}/email` (1 Calls, 200 1)
  - Request: `{ createMailFile: boolean; documentIds: string[] }`
  - Response: `{ subject: string; mailBody: string; receivers: string[]; documents: { name: string; mimeType: string; id: string }[]; mailFileId: string }`
- `GET` `/apigateway/wawi/orders/{uuid}/positions` (18 Calls, 200 18)
  - Response: `{ rowPosition: integer; orderNr: null; orderQuantity: integer; orderQuantityUnit: string; orderValue: integer; orderQuantityUnitSize: integer; kvNumber: null; unitPriceNet: integer; customerName: string; salesProcessNumber: integer; salesProcessDate: string; articleArticleNr: string; articleDescription: string; articleEanCode: string; articleBarcodeNr: null; articleColor: null; articleArticleSize: null; articleSide: null; articleProducerLabel: string; articleStockRequiredFields: unknown[]; ... }...`
- `POST` `/apigateway/wawi/orders/{uuid}/process-order` (1 Calls, 200 1)
  - Request: `{ orderState: null; orderDate: string; markProposalsAsOrdered: boolean; printOptions: { stationery: boolean; prices: boolean; emailHeader: boolean; emailFooter: boolean; showSalesProcessNumber: boolean } }`
  - Response: `{ orderDocumentId: string }`
- `POST` `/apigateway/wawi/orders/from-proposal` (2 Calls, 200 2)
  - Request: `{ proposals: { includeAll: boolean; selections: string[]; filters: null } }`
  - Response: `{ active: boolean; timestampCreated: null; timestampUpdated: null; number: string; supplierName: null; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: null; orderDate: null; orderQuantity: null; orderValue: null; deliveryDate: null; deliveryDateScheduled: null; filialeName: null; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; ... }`
- `POST` `/apigateway/wawi/orders/search` (3 Calls, 200 3)
  - Query: `page`, `size`, `sort`
  - Request: `{ keywords: string; active: boolean }`
  - Response: `{ content: { active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: string; orderQuantity: integer; orderValue: integer; deliveryDate: null; deliveryDateScheduled: null; filialeName: string; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; ... }[]; pageable: { sort: { di...`
- `GET` `/apigateway/wawi/producers` (11 Calls, 200 11)
  - Query: `active`, `page`, `size`, `sort`
  - Response: `{ content: { abbreviation: string; description: string; cloud: boolean; active: boolean; systemappActive: boolean; label: string; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: strin...`
- `GET` `/apigateway/wawi/stock-items` (2 Calls, 200 2)
  - Query: `articleId`, `filialeId`, `size`
  - Response: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElement...`
- `GET` `/apigateway/wawi/storage-locations` (15 Calls, 200 15)
  - Query: `filialeIds`, `size`
  - Response: `{ content: { displayId: string; description: string; branches: { id: string; name: string }[]; stockType: string; stockTypeLabel: string; active: boolean; reserved: boolean; id: string; filialeIds: string[] }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last:...`
- `GET` `/apigateway/wawi/storage-locations/{uuid}` (1 Calls, 200 1)
  - Response: `{ displayId: string; description: string; branches: { id: string; name: string }[]; stockType: string; stockTypeLabel: string; active: boolean; reserved: boolean; id: string; filialeIds: string[] }`

### /apigateway/wawiservice

- `POST` `/apigateway/wawiservice/order-arrival/book` (1 Calls, 200 1)
  - Request: `{ orderNumber: string; deliveryDate: string; deliveryNr: string; filialeId: string; storageLocationId: string; applyToAllFiliale: boolean; quantity: integer; salesProcessStatusId: null; versorgungsStatusId: null; comment: null; editorId: string; zeroRemainingAmount: boolean; performGoodsReceipt: boolean; filteredSelection: { includeAll: boolean; selections: string[]; filters: null } }`
  - Response: `{ active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: string; orderQuantity: integer; orderValue: integer; deliveryDate: null; deliveryDateScheduled: null; filialeName: string; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; ... }[]`
- `POST` `/apigateway/wawiservice/order-arrival/book-recorded` (1 Calls, 200 1)
  - Request: `{ salesProcessStatusId: string; versorgungsStatusId: null; orderStateId: null; filteredSelection: { includeAll: boolean; filters: { externalFilter: { externalFilter: { deliveryDateFrom: null; deliveryDateTo: null; deliveryDateScheduledFrom: null; deliveryDateScheduledTo: null; filialeIds: string[]; orderDateFrom: string; orderDateTo: string; orderId: string; orderStateIds: null; storageLocationIds: null; supplierCustomerIds: null; supplierId: string }; externalFilterFormHeader: { deliveryDate: n...`
  - Response: `{ active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: string; orderQuantity: integer; orderValue: number; deliveryDate: string; deliveryDateScheduled: null; filialeName: null; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: string; comment: null; invoiceStatus: null; ... }[]`
- `GET` `/apigateway/wawiservice/orders/customer/{uuid}/order-ids` (1 Calls, 200 1)
  - Response: `string[]`
- `POST` `/apigateway/wawiservice/stock-items/count-article-quantities` (6 Calls, 200 6)
  - Request: `{ articleIds: string[]; filialeId: string; includeReserved: boolean }`
  - Response: `{ articleId: string; quantity: integer }[]`

