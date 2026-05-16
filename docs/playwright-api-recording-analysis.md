# Playwright-Aufzeichnung: API-Auswertung

Quelle: `playwright-recorder/captures/api-summary-2026-05-16T15-12-38-151Z.json` und `playwright-recorder/captures/api-traffic-2026-05-16T15-12-38-151Z.jsonl`

Aufzeichnungszeit: `2026-05-16T15:20:22.402Z`

## Ergebnis

- Eindeutige Endpunkte: 98
- Requests/Responses im Traffic-Log: 398/388
- Methoden: GET 70, POST 24, HEAD 1, PUT 2, DELETE 1
- Statuscodes: 200 383, 201 2, 404 1, 500 2

## Services

- `/apigateway/wawi`: 20 Endpunkte
- `/apigateway/article-tenant`: 9 Endpunkte
- `/apigateway/sales`: 8 Endpunkte
- `/apigateway/supplier`: 8 Endpunkte
- `/apigateway/kunden`: 6 Endpunkte
- `/apigateway/userservice`: 6 Endpunkte
- `/apigateway/filiale`: 5 Endpunkte
- `/apigateway/user`: 4 Endpunkte
- `/apigateway/accounting`: 3 Endpunkte
- `/apigateway/firma`: 3 Endpunkte
- `/apigateway/kostentraeger-tenant`: 3 Endpunkte
- `/apigateway/salesprocessservice`: 3 Endpunkte
- `/apigateway/file-archive`: 2 Endpunkte
- `/apigateway/mail`: 2 Endpunkte
- `/apigateway/task`: 2 Endpunkte
- `/apigateway/wawiservice`: 2 Endpunkte
- `/apigateway/articletenantservice`: 1 Endpunkte
- `/apigateway/communicatorservice`: 1 Endpunkte
- `/apigateway/country`: 1 Endpunkte
- `/apigateway/department`: 1 Endpunkte
- `/apigateway/document`: 1 Endpunkte
- `/apigateway/enum-service`: 1 Endpunkte
- `/apigateway/hilfsmittel`: 1 Endpunkte
- `/apigateway/navigation`: 1 Endpunkte
- `/apigateway/notification`: 1 Endpunkte
- `/apigateway/pricingservice`: 1 Endpunkte
- `/apigateway/user-details`: 1 Endpunkte
- `/apigateway/vatrates`: 1 Endpunkte

## Endpunkte

### /apigateway/accounting

- `GET` `/apigateway/accounting/material-groups` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: { id: string; number: string; description: string; active: boolean; hmvRanges: { id: integer; hmvFrom: string; hmvTo: string }[]; accounts: { accountType: string; vatRatePercentage: integer; vatRateKey: string; accountId: string; filialeId: null }[]; stockRequiredFields: unknown[]; hmvRequiredFields: unknown[]; useBranchAccounts: boolean }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalE...`
- `GET` `/apigateway/accounting/material-groups/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ id: string; number: string; description: string; active: boolean; hmvRanges: { id: integer; hmvFrom: string; hmvTo: string }[]; accounts: { accountType: string; vatRatePercentage: integer; vatRateKey: string; accountId: string; filialeId: null }[]; stockRequiredFields: unknown[]; hmvRequiredFields: unknown[]; useBranchAccounts: boolean }`
- `GET` `/apigateway/accounting/payment-terms` (11 Calls, 200 11)
  Query: `active`, `paymentTypes`, `size`
  Response-Schema: `{ pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { title: string; paymentTarget: integer; active: boolean; defaultPaymentTerm: boolean; paymentTypes: string[]; cashDiscountDays1: null; cashDiscountDays2: null; cashDiscountPercentage1: null; cashDiscountPercentage2: null; hasDiscount: boolean; id: string }[]; number: integer; sort: unknown[]; totalElements: integer; totalPages: integer; numberOfElements: integer; first: boolean; last: boolean; empty: boolean }`

### /apigateway/article-tenant

- `GET` `/apigateway/article-tenant/articles/{uuid}` (3 Calls, 200 3)
  Response-Schema: `{ migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: string; producer: { label: string; id: string }; color: string; side: string; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: integer; sellingPrice: integer; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: number; purchasePriceActual: integer; computePurchasePriceActual: boolean; unitSell: string; discount: null; vatRateBuy: string; minimumBu...`
- `GET` `/apigateway/article-tenant/articles/{uuid}/computed-order-value/{id}` (1 Calls, 200 1)
  Query: `supplierId`, `unit`
  Response-Schema: `{ articleId: string; supplierId: string; quantity: integer; purchasePrice: number; purchasePriceActual: number; discount: null; bulkPrices: unknown[]; orderValue: number; unitPriceNet: number; minimumBulkQuantityInUnit: integer; orderQuantityUnitSize: integer }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/details/{uuid}` (1 Calls, 404 1)
  Response-Schema: `{ id: string; severity: string; correlationId: string; timestamp: string; messageKey: string; message: string; details: unknown[] }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/merchandise-management-setting` (2 Calls, 200 2)
  Response-Schema: `{ enabled: boolean; articleId: string }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/price-data` (1 Calls, 200 1)
  Response-Schema: `{ suggestedRetailPrice: integer; sellingPrice: integer; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: number; purchasePriceActual: integer; computePurchasePriceActual: boolean; unitSell: string; discount: null; vatRateBuy: string; minimumBulkQuantity: null; unitBuy: string; unitSize: null; base: string; computeBulkPurchasePrice: boolean; bulkPrices: unknown[]; hasBulkPrices: boolean; alternativeSellingPrices: unknown[]; id: string; articleId: string }`
- `GET` `/apigateway/article-tenant/articles/{uuid}/supplier-assignments` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: { mainSupplier: boolean; pricesActive: boolean; orderNr: null; purchasePrice: number; purchasePriceActual: number; computePurchasePriceActual: boolean; unitSell: string; discount: null; vatRateBuy: null; minimumBulkQuantity: null; unitBuy: null; unitSize: null; base: string; computeBulkPurchasePrice: boolean; bulkPrices: unknown[]; hasBulkPrices: boolean; id: string; articleId: string; supplierId: string }[]; pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boo...`
- `POST` `/apigateway/article-tenant/articles/merchandise-management-setting` (4 Calls, 200 4)
  Request-Schema: `string[]`
  Response-Schema: `{ content: { enabled: boolean; articleId: string }[]; pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/article-tenant/articles/search` (4 Calls, 200 4)
  Query: `page`, `size`
  Request-Schema: `{ listType: string; size: integer; dataOrigin: string[]; keywords: string; active: boolean }`
  Response-Schema: `{ content: { migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: string; producer: { label: string; id: string }; color: string; side: null; barcodeNr: null; pzn: null; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: integer; sellingPrice: integer; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: number; purchasePriceActual: integer; computePurchasePriceActual: boolean; unitSell: string; discount: null; vatRateBuy: string; mi...`
- `GET` `/apigateway/article-tenant/label-configurations/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ width: integer; height: integer; leftBorder: number; labels: { name: string; positionX: integer; positionY: integer }[]; id: string; companyProfileId: string }`

### /apigateway/articletenantservice

- `GET` `/apigateway/articletenantservice/articles/search/{id}` (1 Calls, 200 1)
  Response-Schema: `{ migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: string; producer: { label: string; id: string }; color: string; side: string; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: integer; sellingPrice: integer; vatRateKey: string; quantityUnit: string; wirtschaftlicheAufzahlung: boolean; purchasePrice: number; purchasePriceActual: integer; computePurchasePriceActual: boolean; unitSell: string; discount: null; vatRateBuy: string; minimumBu...`

### /apigateway/communicatorservice

- `GET` `/apigateway/communicatorservice/reminders/dbopt` (2 Calls, 200 2)
  Query: `endDate`, `startDate`, `userId`
  Response-Schema: `unknown[]`

### /apigateway/country

- `GET` `/apigateway/country/countries` (1 Calls, 200 1)
  Query: `hasState`, `size`
  Response-Schema: `{ content: { name: string; stateName: string; iso3166: string; iso3166Alpha3: string; states: { name: string; id: string }[]; dakotaCountry: string; id: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/department

- `GET` `/apigateway/department/departments` (6 Calls, 200 6)
  Query: `filialeId`, `size`
  Response-Schema: `{ pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; mainUserId: string; number: integer; name: string; mainUserName: string; active: boolean; departmentFilialeNames: string; departmentFilialeLeads: string; departmentFilialeHeads: { filialeName: null; userName: string; active: boolean; filialeId: string; userId: null }[]; departmentFilialeUsers: { filialeName: null; userNa...`

### /apigateway/document

- `GET` `/apigateway/document/stored-documents` (2 Calls, 200 2)
  Query: `availableTo.entityIds`, `availableTo.type`, `entityOrder`, `entitySupplier`, `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { empty: boolean; sorted: boolean; unsorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { empty: boolean; sorted: boolean; unsorted: boolean }; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/enum-service

- `GET` `/apigateway/enum-service/enums` (1 Calls, 200 1)
  Response-Schema: `{ enumType: string; data: { key: string; label: string; tvalue: null }[] }[]`

### /apigateway/file-archive

- `GET` `/apigateway/file-archive/file-archive/load/files/{uuid}` (2 Calls, 200 2)
  Query: `apiHash`
- `HEAD` `/apigateway/file-archive/file-archive/load/files/{uuid}` (2 Calls, 200 2)

### /apigateway/filiale

- `GET` `/apigateway/filiale/filialen` (27 Calls, 200 27)
  Query: `permissions`, `size`, `userId`
  Response-Schema: `{ content: { id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; addressId: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset:...`
- `GET` `/apigateway/filiale/filialen/{uuid}` (2 Calls, 200 2)
  Response-Schema: `{ id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; addressId: string }`
- `GET` `/apigateway/filiale/filialen/{uuid}/addresses` (4 Calls, 200 4)
  Query: `size`
  Response-Schema: `{ content: { id: string; street: string; streetNumber: string; zipCode: string; city: string; state: null; country: null; addressAdditional: null; poBox: null; mainAddress: boolean; dateValidFrom: string; dateValidTo: null; active: boolean; stateId: string; countryId: string; addressType: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; ...`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: { institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreC...`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }`

### /apigateway/firma

- `GET` `/apigateway/firma/companies/contact-opportunities` (8 Calls, 200 8)
  Response-Schema: `{ phoneNumbers: { filialeId: null; filialeName: null; filialeNumber: null; phoneNumber: string }[]; faxConnections: { filialeId: null; filialeName: null; filialeNumber: null; faxConnection: string }[]; emails: { filialeId: null; filialeName: null; filialeNumber: null; email: string }[] }`
- `GET` `/apigateway/firma/companies/details` (1 Calls, 200 1)
  Response-Schema: `{ name: string; phoneNumber: string; faxConnection: string; email: string; taxIdentificationNumber: string; eoriNumber: null; commercialRegisterNumber: string; lawCourt: string; id: string }`
- `GET` `/apigateway/firma/companies/details/addresses` (4 Calls, 200 4)
  Query: `size`
  Response-Schema: `{ content: { street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; poBox: string; mainAddress: boolean; dateValidFrom: string; dateValidTo: null; active: boolean; id: string; addressType: string; stateId: null; countryId: null }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer...`

### /apigateway/hilfsmittel

- `GET` `/apigateway/hilfsmittel/hilfsmittel/termine` (4 Calls, 200 4)
  Query: `dateFrom`, `dateTo`, `done`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageSize: integer; pageNumber: integer; unpaged: boolean; paged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/kostentraeger-tenant

- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ type: string; ik: string; ekvIk: null; name: string; fiBuAccountNumber: integer; phoneNumbers: unknown[]; faxConnection: string; email: null; active: boolean; kvPrintEkv: boolean; billingIk: boolean; zuzahlungsbefreit: boolean; dataOrigin: string; address: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; description: null; kostentraegerDescription: string; ik: null; linked: boolean; linkedLocked: boolean; mainAddress: boolean; active: boolean; kostentraegerIk: string; id: string; addressType: string; countryId: string; stateId: strin...`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}/notes` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/cloud-status` (1 Calls, 200 1)
  Query: `ik`
  Response-Schema: `{ exists: boolean }`

### /apigateway/kunden

- `GET` `/apigateway/kunden/customers/{uuid}` (2 Calls, 200 2)
  Response-Schema: `{ customerNumber: integer; title: null; salutation: string; firstName: string; lastName: string; dateOfBirth: string; birthName: null; versichertennummer: string; migratedId: null; phoneNumbers: unknown[]; email: null; faxConnection: null; dateOfDeath: null; fiBuAccountNumber: integer; gdprSigned: boolean; active: boolean; taxIdentificationNumber: null; employee: boolean; shoeSize: null; insolesSize: null; height: null; weight: null; leistennummer: null; id: string; kundenbetreuerId: null; paymentTermsId: string; deliveryTermsId: null; employeeId: null }`
- `GET` `/apigateway/kunden/customers/{uuid}/addresses` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: { mainAddress: boolean; firstName: string; lastName: string; street: string; houseNumber: string; zipCode: string; poBox: null; city: string; alpha3CountryCode: null; addressAdditional: null; dateValidFrom: string; dateValidTo: null; room: null; area: null; active: boolean; stateName: null; countryName: string; countryStateName: null; id: string; addressType: string; countryId: string; stateId: null }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer...`
- `GET` `/apigateway/kunden/customers/{uuid}/arzt` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/kunden/customers/{uuid}/kostentraeger` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: { id: string; kostentraegerId: string; kostentraegerDataOrigin: string; kostentraegerType: string; kostentraegerName: string; kostentraegerIk: string; kostentraegerStreet: string; kostentraegerStreetNumber: string; kostentraegerZipCode: string; kostentraegerCity: string; versichertennummer: null; dateValidFrom: string; dateValidTo: string; dateExemptFrom: null; dateExemptTo: null; active: boolean; zuzahlungsbefreit: boolean; versichertenstatus: null; customerId: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending...`
- `GET` `/apigateway/kunden/customers/{uuid}/notes` (2 Calls, 200 2)
  Query: `showHint`, `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/kunden/customers/search` (1 Calls, 200 1)
  Query: `active`, `keywords`, `page`, `size`
  Response-Schema: `{ content: { type: string; customerNumber: integer; title: null; firstName: string; lastName: string; dateOfBirth: string; formattedDateOfBirth: string; birthName: null; versichertennummer: string; phoneNumber: null; phoneNumberMobile: null; email: null; fiBuAccountNumber: string; faxConnection: null; dateOfDeath: null; gdprSigned: boolean; active: boolean; addressStreet: null; addressHouseNumber: null; addressZipCode: null; addressPoBox: null; addressCity: null; addressAdditional: null; addressDateValidFrom: null; addressDateValidTo: null; addressRoom: null; addressArea: null; kostentraegerTy...`

### /apigateway/mail

- `GET` `/apigateway/mail/gateway-configurations/user-mail-addresses` (1 Calls, 200 1)
  Response-Schema: `unknown[]`
- `GET` `/apigateway/mail/mails/unread-number` (11 Calls, 200 11)
  Response-Schema: `unknown[]`

### /apigateway/navigation

- `GET` `/apigateway/navigation/navigations/details` (1 Calls, 200 1)
  Response-Schema: `{ identifier: string; parentIdentifier: null; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: { identifier: string; parentIdentifier: string; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: unknown[] }[] }[]`

### /apigateway/notification

- `GET` `/apigateway/notification/notifications` (1 Calls, 200 1)
  Response-Schema: `{ date: string; type: string; data: { severity: string; downloadableFiles: { fileId: string; fileName: string; saveWithoutView: boolean }[]; requestId: string; icon: string; title: string; clickToClose: boolean; note: string }; id: string; readStatus: boolean; notificationCenter: boolean }[]`

### /apigateway/pricingservice

- `POST` `/apigateway/pricingservice/sales-positions` (2 Calls, 200 2)
  Request-Schema: `{ searchId: string; hilfsmittelId: null; variante: null; leistungsdatum: string; prescriptionDate: null; kostentraegerIk: string; leistungserbringerIk: string; articleDataOrigin: null; customerDateOfBirth: string; customerId: string; zuzahlungBefreit: boolean; mainPosition: null; parentPosition: null; producerId: null; branchId: string; amount: null; unit: null; notfallversorgung: boolean; salesProcessType: string; customHilfsmittelkennzeichen: boolean; preisermittlung: string; alternativeSellingPriceAvailable: boolean; selectedSellingPriceId: null }[]`
  Response-Schema: `{ content: { amount: integer; unitPrice: integer; unitPriceNet: integer; unit: string; vatAmount: integer; vatRatePercentage: number; totalPrice: integer; positionType: null; discountAmount: null; discountVatAmount: null; totalDiscount: null; discountComment: null; hilfsmittelNummer: string; hilfsmittelPositionsNummer: string; gesetzlicheZuzahlung: integer; zuzahlungRequired: string; zuzahlungCalculation: string; wirtschaftlicheAufzahlung: null; eigenanteil: null; privatanteil: null; privat: boolean; articleSide: null; leistungsart: string; legs: string; articleNumber: string; articleDescripti...`

### /apigateway/sales

- `POST` `/apigateway/sales/art/search` (1 Calls, 200 1)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ active: boolean; ids: null }`
  Response-Schema: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; active: boolean; materialPositionen: boolean; id: string }[]; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; totalElements: integer; totalPages: integer; numberOfElements: integer; first: boolean; last: boolean...`
- `POST` `/apigateway/sales/salesprocesses` (1 Calls, 201 1)
  Request-Schema: `{ active: boolean; vorgangssperre: boolean; id: null; salesProcessType: string; number: null; editorId: string; editorType: string; editorName: string; customerId: string; customerName: string; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDate: null; deliveryDateScheduled: null; versorgungStartDate: null; versorgungEndDate:...`
  Response-Schema: `{ salesProcessType: string; totalGross: integer; totalNet: integer; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: integer; totalVat: integer; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; custome...`
- `GET` `/apigateway/sales/salesprocesses/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ salesProcessType: string; totalGross: number; totalNet: number; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: number; totalVat: number; totalCoupon: integer; totalPrice: number; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: number; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; customerFirst...`
- `PUT` `/apigateway/sales/salesprocesses/{uuid}` (2 Calls, 200 2)
  Query: `withCollectiveInvoiceValidation`
  Request-Schema: `{ fakturiertPrivat: boolean; fakturiertKostentraeger: boolean; fakturiertKostentraegerBelegnummer: null; fakturiertPrivatBelegnummer: null; fakturiertPrivatBelegnummerTief: null; fakturiertKostentraegerBySammelbeleg: boolean; fakturiertPrivatByBon: boolean; active: boolean; vorgangssperre: boolean; id: string; salesProcessType: string; number: integer; editorId: string; editorType: string; editorName: string; customerId: string; customerName: null; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: n...`
  Response-Schema: `{ salesProcessType: string; totalGross: number; totalNet: number; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: number; totalVat: number; totalCoupon: integer; totalPrice: number; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: number; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; customerFirst...`
- `GET` `/apigateway/sales/salesprocesses/{uuid}/notes` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/sales/salesprocesses/calculate-prices` (4 Calls, 200 4)
  Request-Schema: `{ active: boolean; vorgangssperre: boolean; id: string; salesProcessType: string; number: integer; editorId: string; editorType: string; editorName: string; customerId: string; customerName: string; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDate: null; deliveryDateScheduled: null; versorgungStartDate: string; versorgungE...`
  Response-Schema: `{ salesProcessType: string; totalGross: integer; totalNet: integer; totalGrossCustomerPortion: integer; totalGrossKostentraegerPortion: integer; totalVat: integer; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: integer; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; custome...`
- `GET` `/apigateway/sales/salesprocesses/kpi-statistics` (5 Calls, 200 5)
  Response-Schema: `{ sum: integer; statusId: string }[]`
- `POST` `/apigateway/sales/salesprocesses/search` (5 Calls, 200 5)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ status: string[]; keywords: string; active: boolean; editor: { editorIds: string[] } }`
  Response-Schema: `{ content: { number: integer; dvNumber: null; editorName: string; editorType: string; customerName: string; customerLastName: string; customerFirstName: string; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDateScheduled: null; deliveryDate: null; active: boolean; zuzahlungsbefreit: boolean; kostentraegerNameCity: string; kostentraegerName: string; kostentraegerCity: string; kostentraegerType: str...`

### /apigateway/salesprocessservice

- `POST` `/apigateway/salesprocessservice/invoices/search` (1 Calls, 200 1)
  Query: `page`, `size`
  Request-Schema: `{ customerInvoiceFilter: { number: string }; invoiceFilter: { types: string[]; statuses: string[] } }`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/salesprocessservice/recommendations` (1 Calls, 200 1)
  Query: `filialeId`
  Response-Schema: `{ key: string; label: string }[]`
- `POST` `/apigateway/salesprocessservice/status/search` (6 Calls, 200 6)
  Query: `size`
  Request-Schema: `{  }`
  Response-Schema: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; comment: null; active: boolean; standardDv: boolean; standardVersorgung: boolean; standardSales: boolean; closedSales: boolean; correspondingSalesState: null; enabled: string[]; enabledCommaSeparated: string; standardCommaSeparated: string; hidden: boolean; id: string }[]; number: integer; sort: { direction: str...`

### /apigateway/supplier

- `GET` `/apigateway/supplier/suppliers` (22 Calls, 200 22)
  Query: `active`, `size`, `sort`
  Response-Schema: `{ content: { name: string; industryId: null; website: null; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: string; fiBuAccountNumber: null; producerIds: unknown[]; orderingPlatforms: unknown[]; supplierAddresses: { zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: string; countryId: string; stateId: null }[]; phoneNumbers: { phoneType: string; phoneNumber: st...`
- `GET` `/apigateway/supplier/suppliers/{uuid}` (3 Calls, 200 3)
  Response-Schema: `{ name: string; industryId: null; website: string; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: null; fiBuAccountNumber: null; producerIds: unknown[]; orderingPlatforms: unknown[]; supplierAddresses: { zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: string; countryId: string; stateId: null }[]; phoneNumbers: { phoneType: string; phoneNumber: string; id: s...`
- `GET` `/apigateway/supplier/suppliers/{uuid}/addresses` (8 Calls, 200 8)
  Query: `size`
  Response-Schema: `{ zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: string; countryId: string; stateId: null }[]`
- `GET` `/apigateway/supplier/suppliers/{uuid}/contact-opportunities` (8 Calls, 200 8)
  Response-Schema: `{ emails: { email: string; contactType: null; supplierId: string; contactId: null }[]; phoneNumbers: { phoneType: string; phoneNumber: string; firstName: null; lastName: null; contactType: null; id: string }[] }`
- `GET` `/apigateway/supplier/suppliers/{uuid}/contacts` (8 Calls, 200 8)
  Query: `size`
  Response-Schema: `unknown[]`
- `GET` `/apigateway/supplier/suppliers/{uuid}/customers` (8 Calls, 200 8)
  Query: `singleDisplay`
  Response-Schema: `{ customerNumber: string; creditLine: null; filialeIds: unknown[]; description: null; minimumOrderValue: null; minimumOrderQuantity: null; freeOfChargeDeliveryValue: null; freeOfChargeDeliveryQuantity: null; customerNumberSani: null; customerNumberOrtho: null; customerNumberReha: null; customerNumberCare: null; customerNumberEkTeam: null; customerNumberEkTeamPlus: null; customerNumberSmile: null; id: string; supplierId: string; deliveryTermsId: null; paymentTermsId: null }[]`
- `POST` `/apigateway/supplier/suppliers/list` (1 Calls, 200 1)
  Request-Schema: `string[]`
  Response-Schema: `{ name: string; industryId: null; website: string; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: null; fiBuAccountNumber: null; producerIds: unknown[]; orderingPlatforms: unknown[]; supplierAddresses: { zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: string; countryId: string; stateId: null }[]; phoneNumbers: { phoneType: string; phoneNumber: string; id: s...`
- `GET` `/apigateway/supplier/suppliers/search` (1 Calls, 200 1)
  Query: `active`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ content: { name: string; industryId: null; website: null; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: string; producers: unknown[]; phoneNumber: string; addressZipCode: string; addressCity: string; addressStreet: string; addressHouseNumber: string; addressAdditional: null; addressRoom: null; addressPoBox: null; addressType: string; id: string; addressCountryId: string; addressStateId: null }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending...`

### /apigateway/task

- `GET` `/apigateway/task/tasks/reminder-count` (1 Calls, 200 1)
  Response-Schema: `integer`
- `GET` `/apigateway/task/tasks/task-count` (11 Calls, 200 11)
  Response-Schema: `integer`

### /apigateway/user

- `GET` `/apigateway/user/generic-list-column-states` (1 Calls, 200 1)
  Response-Schema: `{ salesprocesses-customer-history: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: string }[] }; collectiveInvoiceSalesProcesses-collective-invoice: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: strin...`
- `GET` `/apigateway/user/users` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; username: string; active: boolean; standardPassword: boolean; firstName: string; lastName: string; email: null; salutation: string; phoneNumber: null; mobilePhoneNumber: null; userNumber: integer; favoriteAppIds: unknown[]; dashboardId: null; profileImageId: null; versichertennummer: null; twoFactorAuthentication: null; notificationForAssignments: null; passwordExpireDate: string; password: null; tenant: null; filialeIds: unknown[]; c...`
- `GET` `/apigateway/user/users/{uuid}/dashboards` (1 Calls, 200 1)
  Response-Schema: `{ id: string; configuration: string }`
- `GET` `/apigateway/user/users/search` (14 Calls, 200 14)
  Query: `active`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; username: string; active: boolean; standardPassword: boolean; firstName: string; lastName: string; email: null; salutation: string; phoneNumber: null; mobilePhoneNumber: null; userNumber: integer; favoriteAppIds: unknown[]; dashboardId: null; profileImageId: null; versichertennummer: null; twoFactorAuthentication: null; ...`

### /apigateway/user-details

- `GET` `/apigateway/user-details` (1 Calls, 200 1)
  Response-Schema: `{ userId: string; tenantId: string; permissions: string[]; messageBrokerHost: string; messageBrokerPort: string; firstName: string; lastName: string; email: string; dashboardId: null; profileImageId: null; status: string; favoriteAppIds: string[]; messageBrokerUser: string; messageBrokerSecret: string; userResponseQueue: string; workspaceId: string; workspaceFilialeId: string; workspaceStandardIkId: string }`

### /apigateway/userservice

- `GET` `/apigateway/userservice/companies/details/preferences` (1 Calls, 200 1)
  Response-Schema: `{ rezeptTaxierenTypes: string[]; ekCalculationType: string; businessStationery: boolean; merchandiseManagementActive: boolean; inventurbewertungAgeGroups: boolean; grossRevenue: boolean; includeWirtschaftlicheAufzahlung: boolean; hideCloudArticles: boolean; autoAssignMaterialGroup: boolean; globalInvoiceNumbers: boolean; globalCollectiveInvoiceNumbers: boolean; businessStationeryUploaded: boolean; opticaArz: boolean; pzn: boolean; artFreitext: boolean; articlesUpdateType: string; updateOwnArticles: boolean; kostentraegerUpdateType: string; orderMailClient: string; defaultOrderingPlatform: stri...`
- `GET` `/apigateway/userservice/feature-toggles` (1 Calls, 200 1)
  Response-Schema: `{ activeFeatureToggles: string[]; inactiveFeatureToggles: string[]; navigationIdentifiersToHideIfFeatureDisabled: { DAUERVERSORGUNG: string[]; ELEARNING: string[]; FILE_STORAGE_OPTIONAL: unknown[]; COLLECTIVE_INVOICE: string[]; TI_KIM: string[]; HMV: string[]; FORMULAR_GENERATOR_MANDANT: string[]; ARCHIVED_SALES_PROCESS: string[]; PZN: string[]; GUTSCHEIN: string[]; VORGANGSSTATISTIK: string[] }; toggleType: { MERCHANDISE_MANAGEMENT_PAKET4: string; COLLECTIVE_INVOICE: string; MAHNWESEN: string; CHATBOT: string; DAKOTA: string; TOUR_PRINT: string; SKIP_EXPLICIT_CASH_DRAWER: string; DAUERVERSORG...`
- `POST` `/apigateway/userservice/metrics/user-login` (5 Calls, 200 5)
  Request-Schema: `{ username: string; tenantId: string; tokenDuration: number; userDetailsDuration: number; totalDuration: number }`
- `GET` `/apigateway/userservice/user/preferences` (1 Calls, 200 1)
  Response-Schema: `{ flags: { multiWordSearch: boolean } }`
- `GET` `/apigateway/userservice/workspaces/{uuid}` (1 Calls, 200 1)
  Query: `withTseSummary`
  Response-Schema: `{ autoOpenCashDrawer: boolean; barverkaufAccountId: null; brandName: null; cashSystemActive: boolean; certificate: null; dakotaActive: boolean; dakotaExePath: null; dakotaInputDirectory: null; defaultLineDisplayText: null; filialeId: string; id: string; isLineDisplayConnected: boolean; kasseneinnahmenAccountId: null; kassenentnahmenAccountId: null; kassenfehlbetraegeId: null; kassenueberschuesseId: null; medilogicActive: boolean; medilogicAppPath: null; medilogicFilename: null; medilogicTransferDirectory: null; modelName: null; prescriptionPosPrinterName: null; prescriptionPrinterId: null; pre...`
- `POST` `/apigateway/userservice/workspaces/log` (1 Calls, 200 1)
  Request-Schema: `{ electronVersion: string; hostname: string; ip: string; startup: string; username: string }`

### /apigateway/vatrates

- `GET` `/apigateway/vatrates/vatrates` (1 Calls, 200 1)
  Query: `all`
  Response-Schema: `{ content: { uuid: string; validFrom: string; validTill: string; key: string; rate: integer }[]; pageable: string; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/wawi

- `GET` `/apigateway/wawi/cost-centers` (9 Calls, 200 9)
  Query: `size`
  Response-Schema: `{ content: { costCenterNumber: string; description: string; comment: null; active: boolean; branches: { id: string; name: string }[]; branchesNames: string; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descendin...`
- `GET` `/apigateway/wawi/delivery-terms/search` (9 Calls, 200 9)
  Query: `active`, `keywords`, `paged`, `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/wawi/incoming-invoices/search` (2 Calls, 200 2)
  Query: `size`
  Request-Schema: `{ orderId: string }`
  Response-Schema: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; size: integer; content: unknown[]; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; totalPages: integer; totalElements: integer; first: boolean; last: boolean; empty: boolean }`
- `POST` `/apigateway/wawi/order-arrival/search` (17 Calls, 200 17)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ keywords: string; active: boolean; orderNr: string; arrivalBookingState: string }`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/wawi/order-proposals` (1 Calls, 201 1)
  Request-Schema: `{ id: null; articleId: string; articleNumber: null; articleDescription: null; articleSize: null; articleColor: null; articleSide: null; articleProducerDescription: null; supplierId: string; supplierName: null; filialeId: string; filialeName: null; orderQuantity: integer; orderQuantityUnit: string; orderValue: number; stockQuantity: null; overallStockQuantity: null; articleMinQuantity: null; articleMaxQuantity: null; storageLocationId: null; articleOrigin: string; articleProducerId: null; articleMengenGebinde: null; purchasePriceActual: null; overallOrderQuantity: null; overallOrderValue: null;...`
  Response-Schema: `{ id: string; filialeId: string; filialeName: string; articleId: string; articleOrigin: string; articleNumber: string; articleDescription: string; articleProducerId: string; articleProducerDescription: string; supplierId: string; supplierName: string; salesProcessId: string; salesProcessNumber: integer; customerId: string; customerFirstName: string; customerLastName: string; customerName: string; orderQuantity: integer; orderQuantityUnit: string; orderValue: number; orderDateUntil: null; orderDate: null; comment: null; kindOfOrderProposal: string; changedDate: string; changedBy: string; create...`
- `DELETE` `/apigateway/wawi/order-proposals/{uuid}` (2 Calls, 200 2)
- `POST` `/apigateway/wawi/order-proposals/search` (4 Calls, 200 4)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ keywords: string; active: boolean }`
  Response-Schema: `{ content: { id: string; filialeId: string; filialeName: string; articleId: string; articleOrigin: string; articleNumber: string; articleDescription: string; articleProducerId: string; articleProducerDescription: string; supplierId: null; supplierName: null; salesProcessId: string; salesProcessNumber: integer; customerId: string; customerFirstName: string; customerLastName: string; customerName: string; orderQuantity: integer; orderQuantityUnit: string; orderValue: number; orderDateUntil: null; orderDate: null; comment: string; kindOfOrderProposal: string; changedDate: string; changedBy: strin...`
- `POST` `/apigateway/wawi/order-proposals/search/sums` (4 Calls, 200 4)
  Request-Schema: `{ keywords: string; active: boolean }`
  Response-Schema: `{ orderQuantity: { PIECE: integer }; orderValue: number; sumOrderQuantity: integer }`
- `POST` `/apigateway/wawi/order-proposals/to-order` (5 Calls, 200 5)
  Request-Schema: `{ includeAll: boolean; selections: string[]; filters: null }`
  Response-Schema: `string[]`
- `GET` `/apigateway/wawi/order-states` (15 Calls, 200 15)
  Query: `active`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/wawi/orders/{uuid}` (9 Calls, 200 9)
  Response-Schema: `{ active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: null; orderQuantity: integer; orderValue: integer; deliveryDate: null; deliveryDateScheduled: null; filialeName: null; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; sumInvoiceAmountNet: null; orderingPlatform: string; orderType: null; supplierDivision: null; desiredDate: null; wheelitId: null; trackingNumber: ...`
- `PUT` `/apigateway/wawi/orders/{uuid}` (1 Calls, 200 1)
  Request-Schema: `{ id: string; number: string; active: boolean; orderingPlatform: string; orderType: string; billingAddressId: null; deliveryAddressId: null; deliveryDate: null; deliveryDateScheduled: null; deliveryTermsId: null; deliveryNumber: null; editorId: string; editorName: null; filialeId: null; filialeName: null; mailFooter: null; mailHeader: null; orderDate: null; timestampUpdated: null; orderQuantity: null; orderStateDescription: null; orderStateId: null; orderValue: null; paymentTermsId: null; stockLocationId: null; supplierAddressId: null; supplierContactId: null; supplierCustomerCustomerNumber: n...`
  Response-Schema: `{ active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: null; orderQuantity: integer; orderValue: integer; deliveryDate: null; deliveryDateScheduled: null; filialeName: null; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; sumInvoiceAmountNet: null; orderingPlatform: string; orderType: null; supplierDivision: null; desiredDate: null; wheelitId: null; trackingNumber: ...`
- `POST` `/apigateway/wawi/orders/{uuid}/email` (1 Calls, 200 1)
  Request-Schema: `{ createMailFile: boolean; documentIds: string[] }`
  Response-Schema: `{ subject: string; mailBody: string; receivers: string[]; documents: { name: string; mimeType: string; id: string }[]; mailFileId: string }`
- `GET` `/apigateway/wawi/orders/{uuid}/positions` (13 Calls, 200 13)
  Response-Schema: `unknown[]`
- `POST` `/apigateway/wawi/orders/{uuid}/process-order` (1 Calls, 200 1)
  Request-Schema: `{ orderState: null; orderDate: string; markProposalsAsOrdered: boolean; printOptions: { stationery: boolean; prices: boolean; emailHeader: boolean; emailFooter: boolean; showSalesProcessNumber: boolean } }`
  Response-Schema: `{ orderDocumentId: string }`
- `POST` `/apigateway/wawi/orders/from-proposal` (4 Calls, 200 2, 500 2)
  Request-Schema: `{ proposals: { includeAll: boolean; selections: string[]; filters: null }; resolveUnitMismatch: boolean }`
  Response-Schema: `{ timestamp: string; status: integer; error: string; path: string }`
- `POST` `/apigateway/wawi/orders/search` (5 Calls, 200 5)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ keywords: string; active: boolean }`
  Response-Schema: `{ content: { active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: null; orderQuantity: integer; orderValue: integer; deliveryDate: null; deliveryDateScheduled: null; filialeName: null; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; sumInvoiceAmountNet: null; orderingPlatform: string; orderType: null; supplierDivision: null; desiredDate: null; wheelitId: null; track...`
- `GET` `/apigateway/wawi/producers` (9 Calls, 200 9)
  Query: `active`, `page`, `size`, `sort`
  Response-Schema: `{ content: { abbreviation: string; description: string; cloud: boolean; active: boolean; systemappActive: boolean; label: string; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: bool...`
- `GET` `/apigateway/wawi/storage-locations` (16 Calls, 200 16)
  Query: `filialeIds`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ content: { displayId: string; description: string; branches: { id: string; name: string }[]; stockType: string; stockTypeLabel: string; active: boolean; reserved: boolean; id: string; filialeIds: string[] }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: b...`
- `GET` `/apigateway/wawi/storage-locations/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ displayId: string; description: string; branches: { id: string; name: string }[]; stockType: string; stockTypeLabel: string; active: boolean; reserved: boolean; id: string; filialeIds: string[] }`

### /apigateway/wawiservice

- `POST` `/apigateway/wawiservice/order-arrival/book` (1 Calls, 200 1)
  Request-Schema: `{ orderNumber: string; deliveryDate: string; deliveryNr: string; filialeId: string; storageLocationId: string; applyToAllFiliale: boolean; quantity: integer; salesProcessStatusId: null; versorgungsStatusId: null; comment: null; editorId: string; zeroRemainingAmount: boolean; performGoodsReceipt: boolean; filteredSelection: { includeAll: boolean; selections: string[]; filters: null } }`
  Response-Schema: `{ active: boolean; timestampCreated: string; timestampUpdated: string; number: string; supplierName: string; supplierCustomerCustomerNumber: null; orderStateDescription: null; editorName: string; orderDate: string; orderQuantity: integer; orderValue: number; deliveryDate: string; deliveryDateScheduled: null; filialeName: string; mailHeader: null; mailFooter: null; orderArrivalBookingState: string; deliveryNumber: null; comment: null; invoiceStatus: null; sumInvoiceAmountNet: null; orderingPlatform: string; orderType: null; supplierDivision: null; desiredDate: null; wheelitId: null; trackingNum...`
- `POST` `/apigateway/wawiservice/stock-items/count-article-quantities` (1 Calls, 200 1)
  Request-Schema: `{ articleIds: string[]; filialeId: string; includeReserved: boolean }`
  Response-Schema: `{ articleId: string; quantity: integer }[]`

