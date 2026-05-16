# Playwright-Aufzeichnung: API-Auswertung

Quelle: `playwright-recorder/captures/api-summary-2026-05-16T13-01-14-850Z.json` und `playwright-recorder/captures/api-traffic-2026-05-16T13-01-14-850Z.jsonl`

Aufzeichnungszeit: `2026-05-16T13:11:34.018Z`

## Ergebnis

- Eindeutige Endpunkte: 34
- Requests/Responses im Traffic-Log: 93/92
- Methoden: GET 28, POST 6
- Statuscodes: 200 92

## Services

- `/apigateway/userservice`: 5 Endpunkte
- `/apigateway/wawi`: 5 Endpunkte
- `/apigateway/user`: 3 Endpunkte
- `/apigateway/filiale`: 2 Endpunkte
- `/apigateway/mail`: 2 Endpunkte
- `/apigateway/notification`: 2 Endpunkte
- `/apigateway/sales`: 2 Endpunkte
- `/apigateway/task`: 2 Endpunkte
- `/apigateway/communicatorservice`: 1 Endpunkte
- `/apigateway/country`: 1 Endpunkte
- `/apigateway/department`: 1 Endpunkte
- `/apigateway/enum-service`: 1 Endpunkte
- `/apigateway/hilfsmittel`: 1 Endpunkte
- `/apigateway/kunden`: 1 Endpunkte
- `/apigateway/navigation`: 1 Endpunkte
- `/apigateway/salesprocessservice`: 1 Endpunkte
- `/apigateway/supplier`: 1 Endpunkte
- `/apigateway/user-details`: 1 Endpunkte
- `/apigateway/vatrates`: 1 Endpunkte

## Endpunkte

### /apigateway/communicatorservice

- `GET` `/apigateway/communicatorservice/reminders/dbopt` (1 Calls, 200 1)
  Query: `endDate`, `startDate`, `userId`
  Response-Schema: `unknown[]`

### /apigateway/country

- `GET` `/apigateway/country/countries` (1 Calls, 200 1)
  Query: `hasState`, `size`
  Response-Schema: `{ content: { name: string; stateName: string; iso3166: string; iso3166Alpha3: string; states: { name: string; id: string }[]; dakotaCountry: string; id: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: unknown[]; offset: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: unknown[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/department

- `GET` `/apigateway/department/departments` (3 Calls, 200 3)
  Query: `size`
  Response-Schema: `{ pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset: integer; paged: boolean; unpaged: boolean }; size: integer; content: { id: string; mainUserId: string; number: integer; name: string; mainUserName: string; active: boolean; departmentFilialeNames: string; departmentFilialeLeads: string; departmentFilialeHeads: { filialeName: null; userName: string; active: boolean; filialeId: string; userId: null }[]; departmentFilialeUsers: { filialeName: null; userNa...`

### /apigateway/enum-service

- `GET` `/apigateway/enum-service/enums` (1 Calls, 200 1)
  Response-Schema: `{ enumType: string; data: { key: string; label: string; tvalue: null }[] }[]`

### /apigateway/filiale

- `GET` `/apigateway/filiale/filialen` (4 Calls, 200 4)
  Query: `size`, `userId`
  Response-Schema: `{ content: { id: string; number: integer; name: string; active: boolean; phoneNumber: string; faxConnection: string; email: string; logo: null; employee: null; ik: string; taxIdentificationNumber: string; street: string; streetNumber: string; zipCode: string; city: string; addressAdditional: null; countryUuid: string; bitsFilialNumber: null; userIds: string[]; managerIds: string[]; addressId: string }[]; pageable: { pageNumber: integer; pageSize: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; ascending: boolean; descending: boolean }[]; offset:...`
- `GET` `/apigateway/filiale/filialen/{uuid}/institutionskennzeichen/{uuid}` (1 Calls, 200 1)
  Response-Schema: `{ institutionsKennzeichen: string; label: null; mipMd5Key: string; active: boolean; filialeName: string; prequalification: boolean; dateValidFrom: null; dateValidTo: null; id: string; filialeId: string }`

### /apigateway/hilfsmittel

- `GET` `/apigateway/hilfsmittel/hilfsmittel/termine` (3 Calls, 200 3)
  Query: `dateFrom`, `dateTo`, `done`, `keywords`, `page`, `size`, `sort`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageSize: integer; pageNumber: integer; unpaged: boolean; paged: boolean }; totalElements: integer; totalPages: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`

### /apigateway/kunden

- `GET` `/apigateway/kunden/customers/search` (32 Calls, 200 32)
  Query: `active`, `keywords`, `page`, `size`
  Response-Schema: `{ content: { type: string; customerNumber: integer; title: null; firstName: string; lastName: string; dateOfBirth: null; formattedDateOfBirth: string; birthName: null; versichertennummer: null; phoneNumber: null; phoneNumberMobile: null; email: null; fiBuAccountNumber: null; faxConnection: null; dateOfDeath: null; gdprSigned: boolean; active: boolean; addressStreet: string; addressHouseNumber: string; addressZipCode: string; addressPoBox: null; addressCity: string; addressAdditional: null; addressDateValidFrom: string; addressDateValidTo: null; addressRoom: null; addressArea: null; kostentraeg...`

### /apigateway/mail

- `GET` `/apigateway/mail/gateway-configurations/user-mail-addresses` (1 Calls, 200 1)
  Response-Schema: `unknown[]`
- `GET` `/apigateway/mail/mails/unread-number` (5 Calls, 200 5)
  Response-Schema: `unknown[]`

### /apigateway/navigation

- `GET` `/apigateway/navigation/navigations/details` (1 Calls, 200 1)
  Response-Schema: `{ identifier: string; parentIdentifier: null; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: { identifier: string; parentIdentifier: string; permissionIdentifier: string; icon: string; backgroundClass: string; iconClass: string; name: string; url: string; app: boolean; children: unknown[] }[] }[]`

### /apigateway/notification

- `GET` `/apigateway/notification/notifications` (1 Calls, 200 1)
  Response-Schema: `{ date: string; type: string; data: { severity: string; downloadableFiles: { fileId: string; fileName: string; saveWithoutView: boolean }[]; requestId: string; icon: string; title: string; clickToClose: boolean; note: string }; id: string; readStatus: boolean; notificationCenter: boolean }[]`
- `GET` `/apigateway/notification/notifications/all` (5 Calls, 200 5)
  Query: `notificationCenter`, `page`, `readStatus`, `size`
  Response-Schema: `{ content: { date: string; type: string; data: { severity: string; downloadableFiles: { fileId: string; fileName: string; saveWithoutView: boolean }[]; requestId: string; icon: string; title: string; clickToClose: boolean; note: string }; id: string; readStatus: boolean; notificationCenter: boolean }[]; pageable: { sort: { empty: boolean; unsorted: boolean; sorted: boolean }; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { empty: boolean; unsorted: bo...`

### /apigateway/sales

- `GET` `/apigateway/sales/salesprocesses/kpi-statistics` (3 Calls, 200 3)
  Response-Schema: `{ sum: integer; statusId: string }[]`
- `POST` `/apigateway/sales/salesprocesses/search` (3 Calls, 200 3)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ status: string[]; keywords: string; active: boolean; editor: { editorIds: string[] } }`
  Response-Schema: `{ content: { number: integer; dvNumber: null; editorName: string; editorType: string; customerName: string; customerLastName: string; customerFirstName: string; customerDateOfBirth: string; customerStreet: null; customerHouseNumber: null; customerZipCode: null; customerCity: null; customerVersichertennummer: string; customerPhoneNumberPrivate: null; customerPhoneNumberMobile: null; date: string; deliveryDateScheduled: null; deliveryDate: null; active: boolean; zuzahlungsbefreit: boolean; kostentraegerNameCity: string; kostentraegerName: string; kostentraegerCity: string; kostentraegerType: str...`

### /apigateway/salesprocessservice

- `POST` `/apigateway/salesprocessservice/status/search` (2 Calls, 200 2)
  Query: `size`
  Request-Schema: `{  }`
  Response-Schema: `{ pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; paged: boolean; unpaged: boolean }; size: integer; content: { description: string; comment: null; active: boolean; standardDv: boolean; standardVersorgung: boolean; standardSales: boolean; closedSales: boolean; correspondingSalesState: null; enabled: string[]; enabledCommaSeparated: string; standardCommaSeparated: string; hidden: boolean; id: string }[]; number: integer; sort: { direction: str...`

### /apigateway/supplier

- `GET` `/apigateway/supplier/suppliers` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: { name: string; industryId: null; website: null; email: string; faxConnection: string; commercialRegisterNumber: null; taxIdentificationNumber: null; active: boolean; additionalInfo: string; fiBuAccountNumber: null; producerIds: unknown[]; orderingPlatforms: unknown[]; supplierAddresses: { zipCode: string; city: string; street: string; houseNumber: string; addressAdditional: null; room: null; poBox: null; addressType: string; active: boolean; mainAddress: boolean; id: string; supplierId: string; countryId: string; stateId: null }[]; phoneNumbers: { phoneType: string; phoneNumber: st...`

### /apigateway/task

- `GET` `/apigateway/task/tasks/reminder-count` (1 Calls, 200 1)
  Response-Schema: `integer`
- `GET` `/apigateway/task/tasks/task-count` (5 Calls, 200 5)
  Response-Schema: `integer`

### /apigateway/user

- `GET` `/apigateway/user/generic-list-column-states` (1 Calls, 200 1)
  Response-Schema: `{ salesprocesses-customer-history: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: string }[] }; collectiveInvoiceSalesProcesses-collective-invoice: { columnState: { colId: string; width: integer; hide: boolean; pinned: string; sort: null; sortIndex: null; aggFunc: null; rowGroup: boolean; rowGroupIndex: null; pivot: boolean; pivotIndex: null; flex: null }[]; sortModel: { colId: string; sort: strin...`
- `GET` `/apigateway/user/users/{uuid}/dashboards` (1 Calls, 200 1)
  Response-Schema: `{ id: string; configuration: string }`
- `GET` `/apigateway/user/users/search` (1 Calls, 200 1)
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
- `POST` `/apigateway/userservice/metrics/user-login` (3 Calls, 200 3)
  Request-Schema: `{ username: string; tenantId: string; tokenDuration: number; userDetailsDuration: number; totalDuration: number }`
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

- `POST` `/apigateway/wawi/order-proposals/search` (2 Calls, 200 2)
  Query: `page`, `size`, `sort`
  Request-Schema: `{ keywords: string; active: boolean }`
  Response-Schema: `{ content: { id: string; filialeId: string; filialeName: string; articleId: string; articleOrigin: string; articleNumber: string; articleDescription: string; articleProducerId: string; articleProducerDescription: string; supplierId: null; supplierName: null; salesProcessId: string; salesProcessNumber: integer; customerId: string; customerFirstName: string; customerLastName: string; customerName: string; orderQuantity: integer; orderQuantityUnit: string; orderValue: number; orderDateUntil: null; orderDate: null; comment: string; kindOfOrderProposal: string; changedDate: string; changedBy: strin...`
- `POST` `/apigateway/wawi/order-proposals/search/sums` (1 Calls, 200 1)
  Request-Schema: `{ keywords: string; active: boolean }`
  Response-Schema: `{ orderQuantity: { PIECE: integer }; orderValue: number; sumOrderQuantity: integer }`
- `GET` `/apigateway/wawi/order-states` (1 Calls, 200 1)
  Query: `active`, `page`, `size`, `sort`
  Response-Schema: `{ content: unknown[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; numberOfElements: integer; first: boolean; empty: boolean }`
- `GET` `/apigateway/wawi/producers` (1 Calls, 200 1)
  Query: `active`, `page`, `size`, `sort`
  Response-Schema: `{ content: { abbreviation: string; description: string; cloud: boolean; active: boolean; systemappActive: boolean; label: string; id: string }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: bool...`
- `GET` `/apigateway/wawi/storage-locations` (1 Calls, 200 1)
  Query: `size`
  Response-Schema: `{ content: { displayId: string; description: string; branches: { id: string; name: string }[]; stockType: string; stockTypeLabel: string; active: boolean; reserved: boolean; id: string; filialeIds: string[] }[]; pageable: { sort: { direction: string; property: string; ignoreCase: boolean; nullHandling: string; descending: boolean; ascending: boolean }[]; offset: integer; pageNumber: integer; pageSize: integer; unpaged: boolean; paged: boolean }; totalPages: integer; totalElements: integer; last: boolean; size: integer; number: integer; sort: { direction: string; property: string; ignoreCase: b...`

