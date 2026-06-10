# Playwright-Aufzeichnung: API-Auswertung

Quelle: `playwright-recorder/captures/api-summary-2026-05-25T16-45-30-595Z.json` und `playwright-recorder/captures/api-traffic-2026-05-25T16-45-30-595Z.jsonl`

Aufzeichnungszeit: `2026-05-25T16:49:36.362Z`

## Ergebnis

- Eindeutige Endpunkte: 58
- Requests/Responses im Traffic-Log: 108/101
- Methoden: GET 46, POST 10, PATCH 1, PUT 1
- Statuscodes: 200 101

## Services

- `/apigateway/sales`: 7 Endpunkte
- `/apigateway/userservice`: 6 Endpunkte
- `/apigateway/filiale`: 4 Endpunkte
- `/apigateway/kunden`: 4 Endpunkte
- `/apigateway/kostentraeger-tenant`: 3 Endpunkte
- `/apigateway/salesprocessservice`: 3 Endpunkte
- `/apigateway/user`: 3 Endpunkte
- `/apigateway/wawi`: 3 Endpunkte
- `/apigateway/article-tenant`: 2 Endpunkte
- `/apigateway/arzt-tenant`: 2 Endpunkte
- `/apigateway/communicatorservice`: 2 Endpunkte
- `/apigateway/mail`: 2 Endpunkte
- `/apigateway/notification`: 2 Endpunkte
- `/apigateway/task`: 2 Endpunkte
- `/apigateway/accounting`: 1 Endpunkte
- `/apigateway/articletenantservice`: 1 Endpunkte
- `/apigateway/country`: 1 Endpunkte
- `/apigateway/customerservice`: 1 Endpunkte
- `/apigateway/department`: 1 Endpunkte
- `/apigateway/document`: 1 Endpunkte
- `/apigateway/enum-service`: 1 Endpunkte
- `/apigateway/hilfsmittel`: 1 Endpunkte
- `/apigateway/navigation`: 1 Endpunkte
- `/apigateway/pricingservice`: 1 Endpunkte
- `/apigateway/user-details`: 1 Endpunkte
- `/apigateway/vatrates`: 1 Endpunkte
- `/apigateway/wawiservice`: 1 Endpunkte

## Endpunkte

### /apigateway/accounting

- `GET` `/apigateway/accounting/payment-terms` (1 Calls, 200 1)
  Query: `active`, `paymentTypes`, `size`
  Response-Schema: `{ pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { title: string; paymentTarget: integer; active: boolean; defaultPaymentTerm: boolean; paymentTypes: string[]; cashDiscountDays1: null; cashDiscountDays2: null; cashDiscountPercentage1: null; cashDiscountPercentage2: null; hasDiscount: boolean; id: string }[]; number: integer; sort: unknown[]; totalElements: integer; totalPages: integer; numberOfElements: integer; first: boolean; last: boolean; empty: boolean }`

### /apigateway/article-tenant

- `GET` `/apigateway/article-tenant/articles/{uuid}/merchandise-management-setting` (2 Calls, 200 2)
  Response-Schema: `{ enabled: boolean; articleId: string }`
- `POST` `/apigateway/article-tenant/articles/merchandise-management-setting` (9 Calls, 200 9)
  Request-Schema: `string[]`
  Response-Schema: `{ content: { enabled: boolean; articleId: string }[]; pageable: { sort: unknown[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/articletenantservice

- `GET` `/apigateway/articletenantservice/articles/search/{id}` (1 Calls, 200 1)
  Response-Schema: `{ migratedId: null; articleNumber: string; dataOrigin: string; description: string; cloudDescription: null; producer: { label: string; id: string }; color: null; side: null; barcodeNr: null; pzn: string; active: boolean; hmvNr: string; eanCode: string; serviceTypes: unknown[]; validation: null; priceData: { suggestedRetailPrice: null; sellingPrice: number; vatRateKey: string; quantityUnit: null; wirtschaftlicheAufzahlung: boolean; purchasePrice: null; purchasePriceActual: null; computePurchasePriceActual: boolean; unitSell: null; discount: null; vatRateBuy: null; minimumBulkQuantity: null; uni...`

### /apigateway/arzt-tenant

- `GET` `/apigateway/arzt-tenant/aerzte/{uuid}` (2 Calls, 200 2)
  Response-Schema: `{ lanr: string; nbsnrs: unknown[]; bsnr: string; title: string; shortTitle: string; firstName: string; lastName: string; phoneNumbers: { phoneNumber: string; phoneType: string; isCloudReferenced: boolean }[]; email: null; faxConnection: string; active: boolean; address: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; mainAddress: boolean; active: boolean; id: string; addressType: string; countryId: string; stateId: string }; validation: null; hasCloudUpdate: boolean; id: string; salutation: string; contractType: null; specialities: { ...`
- `GET` `/apigateway/arzt-tenant/aerzte/{uuid}/notes` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/communicatorservice

- `GET` `/apigateway/communicatorservice/reminders/dbopt` (1 Calls, 200 1)
  Query: `endDate`, `startDate`, `userId`
  Response-Schema: `unknown[]`
- `GET` `/apigateway/communicatorservice/tasks/by-process/count` (1 Calls, 200 1)
  Query: `salesProcessId`
  Response-Schema: `integer`

### /apigateway/country

- `GET` `/apigateway/country/countries` (1 Calls, 200 1)
  Query: `hasState`, `size`
  Response-Schema: `{ content: { name: string; stateName: string; iso3166: string; iso3166Alpha3: string; states: { name: string; id: string }[]; dakotaCountry: string; id: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/customerservice

- `GET` `/apigateway/customerservice/customers/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ customerNumber: integer; title: null; salutation: string; firstName: string; lastName: string; dateOfBirth: string; birthName: null; versichertennummer: string; migratedId: null; phoneNumbers: unknown[]; email: null; faxConnection: null; dateOfDeath: null; fiBuAccountNumber: integer; gdprSigned: boolean; active: boolean; taxIdentificationNumber: null; employee: boolean; shoeSize: null; insolesSize: null; height: null; weight: null; leistennummer: null; id: string; kundenbetreuerId: null; paymentTermsId: string; deliveryTermsId: null; employeeId: null }`

### /apigateway/department

- `GET` `/apigateway/department/departments` (3 Calls, 200 3)
  Query: `filialeId`, `size`
  Response-Schema: `{ pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; mainUserId: string; number: integer; name: string; mainUserName: string; active: boolean; departmentFilialeNames: string; departmentFilialeLeads: string; departmentFilialeHeads: { filialeName: null; userName: string; active: boolean; filialeId: string; userId: null }[]; departmentFilialeUsers: { filialeName: null; userNa...`

### /apigateway/document

- `GET` `/apigateway/document/stored-documents` (1 Calls, 200 1)
  Query: `entityArticle`, `entityCustomer`, `entitySalesProcess`, `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { empty: boolean; unsorted: boolean; sorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { empty: boolean; unsorted: boolean; sorted: boolean }; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/enum-service

- `GET` `/apigateway/enum-service/enums` (1 Calls, 200 1)
  Response-Schema: `{ enumType: string; data: { key: string; label: string; tvalue: null }[] }[]`

### /apigateway/filiale

- `GET` `/apigateway/filiale/filialen` (2 Calls, 200 2)
  Query: `permissions`, `size`, `userId`
  Response-Schema: `{ content: { id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; addressId: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset:...`
- `GET` `/apigateway/filiale/filialen/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; addressId: string }`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: { institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreC...`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }`

### /apigateway/hilfsmittel

- `GET` `/apigateway/hilfsmittel/hilfsmittel/termine` (1 Calls, 200 1)
  Query: `dateFrom`, `dateTo`, `done`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; first: boolean; numberOfElements: integer; empty: boolean }`

### /apigateway/kostentraeger-tenant

- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}` (2 Calls, 200 2)
  Response-Schema: `{ type: string; ik: string; ekvIk: null; name: string; fiBuAccountNumber: null; phoneNumbers: unknown[]; faxConnection: null; email: null; active: boolean; kvPrintEkv: boolean; billingIk: boolean; zuzahlungsbefreit: boolean; dataOrigin: string; address: { street: string; houseNumber: string; addressAdditional: null; zipCode: string; city: string; poBox: null; description: null; kostentraegerDescription: string; ik: null; linked: boolean; linkedLocked: boolean; mainAddress: boolean; active: boolean; kostentraegerIk: string; id: string; addressType: string; countryId: string; stateId: string; li...`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/{uuid}/notes` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/kostentraeger-tenant/kostentraeger/cloud-status` (2 Calls, 200 2)
  Query: `ik`
  Response-Schema: `{ exists: boolean }`

### /apigateway/kunden

- `GET` `/apigateway/kunden/customers/{uuid}/addresses` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: { mainAddress: boolean; firstName: string; lastName: string; street: string; houseNumber: string; zipCode: string; poBox: null; city: string; alpha3CountryCode: null; addressAdditional: null; dateValidFrom: string; dateValidTo: null; room: null; area: null; active: boolean; stateName: null; countryName: string; countryStateName: null; id: string; addressType: string; countryId: string; stateId: null }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer...`
- `GET` `/apigateway/kunden/customers/{uuid}/arzt` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: { id: string; arztId: string; arztRelation: string; arztSalutation: string; arztDataOrigin: string; arztTitle: string; arztLastName: string; arztFirstName: string; arztStreet: string; arztStreetNumber: string; arztZipCode: string; arztCity: string; arztLebenslangeArztNr: string; arztBetriebsstaettenNr: string; arztFachrichtung: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPage...`
- `GET` `/apigateway/kunden/customers/{uuid}/kostentraeger` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: { id: string; kostentraegerId: string; kostentraegerDataOrigin: string; kostentraegerType: string; kostentraegerName: string; kostentraegerIk: string; kostentraegerStreet: string; kostentraegerStreetNumber: string; kostentraegerZipCode: string; kostentraegerCity: string; versichertennummer: null; dateValidFrom: string; dateValidTo: string; dateExemptFrom: null; dateExemptTo: null; active: boolean; zuzahlungsbefreit: boolean; versichertenstatus: null; customerId: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending...`
- `GET` `/apigateway/kunden/customers/{uuid}/notes` (1 Calls, 200 1)
  Query: `showHint`, `size`
  Response-Schema: `{ content: { showHint: boolean; userName: string; date: string; text: string; id: string; userId: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; ...`

### /apigateway/mail

- `GET` `/apigateway/mail/gateway-configurations/user-mail-addresses` (1 Calls, 200 1)
  Response-Schema: `unknown[]`
- `GET` `/apigateway/mail/mails/unread-number` (4 Calls, 200 4)
  Response-Schema: `unknown[]`

### /apigateway/navigation

- `GET` `/apigateway/navigation/navigations/details` (1 Calls, 200 1)
  Response-Schema: `{ identifier: string; parentIdentifier: null; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: { identifier: string; parentIdentifier: string; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: unknown[] }[] }[]`

### /apigateway/notification

- `GET` `/apigateway/notification/notifications` (1 Calls, 200 1)
  Response-Schema: `{ date: string; type: string; data: { severity: string; downloadableFiles: { fileId: string; fileName: string; saveWithoutView: boolean }[]; requestId: string; icon: string; title: string; clickToClose: boolean; note: string }; id: string; readStatus: boolean; notificationCenter: boolean }[]`
- `PATCH` `/apigateway/notification/notifications/{uuid}/true` (1 Calls, 200 1)

### /apigateway/pricingservice

- `POST` `/apigateway/pricingservice/sales-positions` (2 Calls, 200 2)
  Request-Schema: `{ searchId: string; hilfsmittelId: null; variante: null; leistungsdatum: string; prescriptionDate: null; kostentraegerIk: string; leistungserbringerIk: string; articleDataOrigin: null; customerDateOfBirth: string; customerId: string; zuzahlungBefreit: boolean; mainPosition: null; parentPosition: null; producerId: null; branchId: string; amount: null; unit: null; notfallversorgung: boolean; salesProcessType: string; customHilfsmittelkennzeichen: boolean; preisermittlung: string; alternativeSellingPriceAvailable: boolean; selectedSellingPriceId: null }[]`
  Response-Schema: `{ content: { amount: integer; unitPrice: integer; unitPriceNet: integer; unit: string; vatAmount: integer; vatRatePercentage: number; totalPrice: integer; positionType: null; discountAmount: null; discountVatAmount: null; totalDiscount: null; discountComment: null; hilfsmittelNummer: string; hilfsmittelPositionsNummer: null; gesetzlicheZuzahlung: integer; zuzahlungRequired: null; zuzahlungCalculation: null; wirtschaftlicheAufzahlung: null; eigenanteil: null; privatanteil: null; privat: boolean; articleSide: null; leistungsart: string; legs: null; articleNumber: string; articleDescription: stri...`

### /apigateway/sales

- `POST` `/apigateway/sales/art/search` (2 Calls, 200 2)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ active: boolean; ids: null }`
  Response-Schema: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; active: boolean; materialPositionen: boolean; id: string }[]; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; totalElements: integer; totalPages: integer; numberOfElements: integer; first: boolean; last: boolean...`
- `GET` `/apigateway/sales/salesprocesses/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ salesProcessType: string; totalGross: number; totalNet: number; totalGrossCustomerPortion: number; totalGrossKostentraegerPortion: integer; totalVat: number; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: number; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; customerFirs...`
- `PUT` `/apigateway/sales/salesprocesses/{uuid}` (8 Calls, 200 8)
  Query: `withCollectiveInvoiceValidation`
  Request-Schema: `{ active: boolean; vorgangssperre: boolean; id: string; salesProcessType: string; number: integer; editorId: string; editorType: string; editorName: string; customerId: string; customerName: null; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDate: null; deliveryDateScheduled: null; versorgungStartDate: null; versorgungEndDa...`
  Response-Schema: `{ salesProcessType: string; totalGross: number; totalNet: number; totalGrossCustomerPortion: number; totalGrossKostentraegerPortion: integer; totalVat: number; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: number; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; customerFirs...`
- `GET` `/apigateway/sales/salesprocesses/{uuid}/notes` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `POST` `/apigateway/sales/salesprocesses/calculate-prices` (4 Calls, 200 4)
  Request-Schema: `{ active: boolean; vorgangssperre: boolean; id: string; salesProcessType: string; number: integer; editorId: string; editorType: string; editorName: string; customerId: string; customerName: string; customerLastName: string; customerFirstName: string; customerTitle: null; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDate: null; deliveryDateScheduled: null; versorgungStartDate: null; versorgungEnd...`
  Response-Schema: `{ salesProcessType: string; totalGross: number; totalNet: number; totalGrossCustomerPortion: number; totalGrossKostentraegerPortion: integer; totalVat: number; totalCoupon: integer; totalPrice: integer; totalZuzahlung: integer; totalEigenanteil: integer; totalWirtschaftlicheAufzahlung: integer; totalGrossPrivatePositions: integer; totalGrossKostentraegerPositions: integer; totalPositionsDiscount: number; totalPositionsVoucher: integer; zulage: integer; zuzahlungsbefreit: boolean; useHilfsmittelPositionsNummer: boolean; consultantName: string; rezeptDate: null; customerTitle: null; customerFirs...`
- `GET` `/apigateway/sales/salesprocesses/kpi-statistics` (1 Calls, 200 1)
  Response-Schema: `{ sum: integer; statusId: string }[]`
- `POST` `/apigateway/sales/salesprocesses/search` (4 Calls, 200 4)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ status: string[]; keywords: string; active: boolean; editor: { editorIds: string[] } }`
  Response-Schema: `{ content: { number: integer; dvNumber: null; editorName: string; editorType: string; customerName: string; customerLastName: string; customerFirstName: string; customerDateOfBirth: string; customerStreet: string; customerHouseNumber: string; customerZipCode: string; customerCity: string; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDateScheduled: null; deliveryDate: null; active: boolean; zuzahlungsbefreit: boolean; kostentraegerNameCity: string; kostentraegerName: string; kostentraegerCity: string; kostentraegerT...`

### /apigateway/salesprocessservice

- `POST` `/apigateway/salesprocessservice/invoices/search` (1 Calls, 200 1)
  Query: `page`, `size`
  Request-Schema: `{ customerInvoiceFilter: { number: string }; invoiceFilter: { types: string[]; statuses: string[] } }`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/salesprocessservice/recommendations` (1 Calls, 200 1)
  Query: `filialeId`
  Response-Schema: `{ key: string; label: string }[]`
- `POST` `/apigateway/salesprocessservice/status/search` (3 Calls, 200 3)
  Query: `size`
  Request-Schema: `{  }`
  Response-Schema: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; comment: null; active: boolean; standardDv: boolean; standardVersorgung: boolean; standardSales: boolean; closedSales: boolean; correspondingSalesState: null; enabled: string[]; enabledCommaSeparated: string; standardCommaSeparated: string; hidden: boolean; id: string }[]; number: integer; sort: { direction: str...`

### /apigateway/task

- `GET` `/apigateway/task/tasks/reminder-count` (1 Calls, 200 1)
  Response-Schema: `integer`
- `GET` `/apigateway/task/tasks/task-count` (4 Calls, 200 4)
  Response-Schema: `integer`

### /apigateway/user

- `GET` `/apigateway/user/generic-list-column-states` (1 Calls, 200 1)
  Response-Schema: `{ salesprocesses-customer-history: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: string }[] }; collectiveInvoiceSalesProcesses-collective-invoice: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: strin...`
- `GET` `/apigateway/user/users` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; username: string; active: boolean; standardPassword: boolean; firstName: string; lastName: string; email: null; salutation: string; phoneNumber: null; mobilePhoneNumber: null; userNumber: integer; favoriteAppIds: unknown[]; dashboardId: null; profileImageId: null; versichertennummer: null; twoFactorAuthentication: null; notificationForAssignments: null; passwordExpireDate: string; password: null; tenant: null; filialeIds: unknown[]; c...`
- `GET` `/apigateway/user/users/{uuid}/dashboards` (1 Calls, 200 1)
  Response-Schema: `{ id: string; configuration: string }`

### /apigateway/user-details

- `GET` `/apigateway/user-details` (1 Calls, 200 1)
  Response-Schema: `{ userId: string; tenantId: string; permissions: string[]; messageBrokerHost: string; messageBrokerPort: string; firstName: string; lastName: string; email: string; dashboardId: null; profileImageId: null; status: string; favoriteAppIds: string[]; messageBrokerUser: string; messageBrokerSecret: string; userResponseQueue: string; workspaceId: string; workspaceFilialeId: string; workspaceStandardIkId: string }`

### /apigateway/userservice

- `GET` `/apigateway/userservice/companies/details/preferences` (1 Calls, 200 1)
  Response-Schema: `{ rezeptTaxierenTypes: string[]; ekCalculationType: string; businessStationery: boolean; merchandiseManagementActive: boolean; inventurbewertungAgeGroups: boolean; grossRevenue: boolean; includeWirtschaftlicheAufzahlung: boolean; hideCloudArticles: boolean; autoAssignMaterialGroup: boolean; globalInvoiceNumbers: boolean; globalCollectiveInvoiceNumbers: boolean; businessStationeryUploaded: boolean; opticaArz: boolean; pzn: boolean; artFreitext: boolean; articlesUpdateType: string; updateOwnArticles: boolean; kostentraegerUpdateType: string; orderMailClient: string; defaultOrderingPlatform: stri...`
- `GET` `/apigateway/userservice/feature-toggles` (1 Calls, 200 1)
  Response-Schema: `{ activeFeatureToggles: string[]; inactiveFeatureToggles: string[]; navigationIdentifiersToHideIfFeatureDisabled: { COLLECTIVE_INVOICE: string[]; VORGANGSSTATISTIK: string[]; HMV: string[]; DAUERVERSORGUNG: string[]; GUTSCHEIN: string[]; FORMULAR_GENERATOR_MANDANT: string[]; ELEARNING: string[]; PZN: string[]; TI_KIM: string[]; FILE_STORAGE_OPTIONAL: unknown[]; ARCHIVED_SALES_PROCESS: string[] }; toggleType: { COMPACT_INVOICE: string; FORMULAR_GENERATOR: string; CALENDAR_OPTIMIZATION: string; ART_SUCHFELD: string; FAKTURIERT_AUFGERAEUMT: string; ARCHIVE_DOCUMENTS: string; LEISTENVERWALTUNG: st...`
- `POST` `/apigateway/userservice/metrics/user-login` (1 Calls, 200 1)
  Request-Schema: `{ username: string; tenantId: string; tokenDuration: number; userDetailsDuration: number; totalDuration: integer }`
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

- `GET` `/apigateway/wawi/cost-centers` (2 Calls, 200 2)
  Query: `size`
  Response-Schema: `{ content: { costCenterNumber: string; description: string; comment: null; active: boolean; branches: { id: string; name: string }[]; branchesNames: string; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descendin...`
- `GET` `/apigateway/wawi/delivery-terms/search` (1 Calls, 200 1)
  Query: `active`, `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/wawi/stock-items` (1 Calls, 200 1)
  Query: `articleId`, `filialeId`, `size`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/wawiservice

- `POST` `/apigateway/wawiservice/stock-items/count-article-quantities` (1 Calls, 200 1)
  Request-Schema: `{ articleIds: string[]; filialeId: string; includeReserved: boolean }`
  Response-Schema: `{ articleId: string; quantity: integer }[]`

