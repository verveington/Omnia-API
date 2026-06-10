# Omnia-Data-Model

Generiert: 2026-06-09T20:51:33.177Z

Hinweis: Dieser Report nutzt ausschliesslich redaktierte Request-/Response-Bodies. Er dokumentiert Feldnamen, Typen und beobachtete Objektformen, keine Rohwerte.

## Zusammenfassung

- Entity-Kandidaten: 60
- Body-Samples: 6302

## Entity-Kandidaten

| Fachbereich | Entity | Samples | Quellen | Endpunkte | Felder |
|---|---|---:|---|---:|---:|
| Abrechnung/Kasse | vatrates | 154 | response | 1 | 16 |
| Abrechnung/Kasse | invoices | 85 | request, response | 1 | 36 |
| Abrechnung/Kasse | payment-terms | 66 | response | 2 | 53 |
| Abrechnung/Kasse | material-groups | 19 | response | 1 | 46 |
| Abrechnung/Kasse | bons | 3 | response | 1 | 4 |
| Abrechnung/Kasse | cash-book-entries | 3 | response | 1 | 7 |
| Abrechnung/Kasse | cash-books | 3 | response | 1 | 4 |
| apigateway | arzt-tenant | 32 | response | 3 | 103 |
| apigateway | fibu-accounts | 27 | response | 1 | 5 |
| apigateway | archived-salesprocess | 10 | request, response | 1 | 33 |
| apigateway | incoming-invoices | 4 | request, response | 1 | 30 |
| apigateway | audit | 3 | response | 1 | 32 |
| apigateway | price-position | 1 | response | 1 | 52 |
| apigateway | stock-bookings | 1 | response | 1 | 71 |
| apigateway | stocktaking-articles | 1 | response | 1 | 31 |
| apigateway | stocktaking-lists | 1 | response | 1 | 43 |
| Artikel/Warenbestand | articles | 242 | request, response | 15 | 255 |
| Artikel/Warenbestand | producers | 47 | response | 1 | 36 |
| Artikel/Warenbestand | label-configurations | 22 | response | 1 | 9 |
| Artikel/Warenbestand | article-kits | 14 | request, response | 2 | 45 |
| Artikel/Warenbestand | bits-articles | 8 | response | 1 | 0 |
| Artikel/Warenbestand | article | 2 | response | 1 | 7 |
| Dokumente/Archiv | stored-documents | 29 | request, response | 2 | 56 |
| Dokumente/Archiv | archive-documents | 19 | request, response | 1 | 38 |
| Dokumente/Archiv | documents | 5 | request, response | 2 | 34 |
| Dokumente/Archiv | formservice | 4 | request, response | 1 | 22 |
| dv-data | dv-data | 27 | request, response | 2 | 276 |
| Filialen/Mandant | filialen | 524 | response | 6 | 80 |
| Filialen/Mandant | companies | 227 | response | 5 | 122 |
| Filialen/Mandant | department | 93 | response | 1 | 50 |
| Hilfsmittel | hilfsmittel | 58 | request, response | 6 | 70 |
| Kommunikation/Aufgaben | mail | 733 | response | 2 | 0 |
| Kommunikation/Aufgaben | reminders | 217 | response | 1 | 0 |
| Kommunikation/Aufgaben | notifications | 154 | response | 2 | 59 |
| Kunden/Vorgaenge | salesprocesses | 462 | request, response | 10 | 558 |
| Kunden/Vorgaenge | customers | 361 | request, response | 17 | 212 |
| Kunden/Vorgaenge | status | 232 | request, response | 1 | 49 |
| Kunden/Vorgaenge | kostentraeger-tenant | 55 | request, response | 5 | 127 |
| Kunden/Vorgaenge | art | 32 | request, response | 1 | 35 |
| Kunden/Vorgaenge | pricingservice | 15 | request, response | 1 | 156 |
| Kunden/Vorgaenge | ekv | 10 | request, response | 3 | 69 |
| Kunden/Vorgaenge | recommendations | 2 | response | 1 | 2 |
| Referenzdaten | country | 154 | response | 1 | 26 |
| Referenzdaten | enum-service | 154 | response | 1 | 5 |
| Referenzdaten | navigationservice | 13 | response | 1 | 9 |
| User/Workspace | user | 394 | request, response | 6 | 187 |
| User/Workspace | workspaces | 347 | request, response | 4 | 131 |
| User/Workspace | feature-toggles | 184 | response | 1 | 122 |
| User/Workspace | navigation | 139 | response | 1 | 40 |
| User/Workspace | metrics | 81 | request | 1 | 5 |
| User/Workspace | user-details | 65 | response | 1 | 20 |
| Warenwirtschaft/Bestellung | orders | 158 | request, response | 11 | 213 |
| Warenwirtschaft/Bestellung | order-arrival | 140 | request, response | 4 | 251 |
| Warenwirtschaft/Bestellung | supplier | 135 | request, response | 8 | 187 |
| Warenwirtschaft/Bestellung | order-proposals | 126 | request, response | 6 | 126 |
| Warenwirtschaft/Bestellung | storage-locations | 76 | response | 2 | 53 |
| Warenwirtschaft/Bestellung | order-states | 48 | response | 1 | 35 |
| Warenwirtschaft/Bestellung | delivery-terms | 47 | response | 1 | 29 |
| Warenwirtschaft/Bestellung | cost-centers | 29 | response | 1 | 38 |
| Warenwirtschaft/Bestellung | stock-items | 5 | request, response | 3 | 62 |

### Abrechnung/Kasse: vatrates

- Samples: 154
- Quellen: response
- Endpunkte:
  - GET /apigateway/vatrates/vatrates
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 154 |
  | content[].key | string | 770 |
  | content[].rate | number | 770 |
  | content[].uuid | string | 770 |
  | content[].validFrom | string | 770 |
  | content[].validTill | string | 770 |
  | empty | boolean | 154 |
  | first | boolean | 154 |
  | last | boolean | 154 |
  | number | number | 154 |
  | numberOfElements | number | 154 |
  | pageable | string | 154 |
  | size | number | 154 |
  | sort | array | 154 |
  | totalElements | number | 154 |
  | totalPages | number | 154 |

### Abrechnung/Kasse: invoices

- Samples: 85
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/salesprocessservice/invoices/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 42 |
  | customerInvoiceFilter | object, string | 43 |
  | customerInvoiceFilter.number | string | 42 |
  | empty | boolean | 42 |
  | first | boolean | 42 |
  | invoiceFilter | object | 43 |
  | invoiceFilter.statuses | array | 43 |
  | invoiceFilter.statuses[] | string | 86 |
  | invoiceFilter.types | array | 43 |
  | invoiceFilter.types[] | string | 43 |
  | last | boolean | 42 |
  | number | number | 42 |
  | numberOfElements | number | 42 |
  | pageable | object | 42 |
  | pageable.offset | number | 42 |
  | pageable.paged | boolean | 42 |
  | pageable.pageNumber | number | 42 |
  | pageable.pageSize | number | 42 |
  | pageable.sort | array | 42 |
  | pageable.sort[].ascending | boolean | 42 |
  | pageable.sort[].descending | boolean | 42 |
  | pageable.sort[].direction | string | 42 |
  | pageable.sort[].ignoreCase | boolean | 42 |
  | pageable.sort[].nullHandling | string | 42 |
  | pageable.sort[].property | string | 42 |
  | pageable.unpaged | boolean | 42 |
  | size | number | 42 |
  | sort | array | 42 |
  | sort[].ascending | boolean | 42 |
  | sort[].descending | boolean | 42 |
  | sort[].direction | string | 42 |
  | sort[].ignoreCase | boolean | 42 |
  | sort[].nullHandling | string | 42 |
  | sort[].property | string | 42 |
  | totalElements | number | 42 |
  | totalPages | number | 42 |

### Abrechnung/Kasse: payment-terms

- Samples: 66
- Quellen: response
- Endpunkte:
  - GET /apigateway/accounting/payment-terms
  - GET /apigateway/accounting/payment-terms/[REDACTED]
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 1 |
  | cashDiscountDays1 | null | 1 |
  | cashDiscountDays2 | null | 1 |
  | cashDiscountPercentage1 | null | 1 |
  | cashDiscountPercentage2 | null | 1 |
  | content | array | 65 |
  | content[].active | boolean | 153 |
  | content[].cashDiscountDays1 | null | 153 |
  | content[].cashDiscountDays2 | null | 153 |
  | content[].cashDiscountPercentage1 | null | 153 |
  | content[].cashDiscountPercentage2 | null | 153 |
  | content[].defaultPaymentTerm | boolean | 153 |
  | content[].hasDiscount | boolean | 153 |
  | content[].id | string | 153 |
  | content[].paymentTarget | null, number | 153 |
  | content[].paymentTypes | array | 153 |
  | content[].paymentTypes[] | string | 153 |
  | content[].title | string | 153 |
  | defaultPaymentTerm | boolean | 1 |
  | empty | boolean | 65 |
  | first | boolean | 65 |
  | hasDiscount | boolean | 1 |
  | id | string | 1 |
  | last | boolean | 65 |
  | number | number | 65 |
  | numberOfElements | number | 65 |
  | pageable | object | 65 |
  | pageable.offset | number | 65 |
  | pageable.paged | boolean | 65 |
  | pageable.pageNumber | number | 65 |
  | pageable.pageSize | number | 65 |
  | pageable.sort | array | 65 |
  | pageable.sort[].ascending | boolean | 1 |
  | pageable.sort[].descending | boolean | 1 |
  | pageable.sort[].direction | string | 1 |
  | pageable.sort[].ignoreCase | boolean | 1 |
  | pageable.sort[].nullHandling | string | 1 |
  | pageable.sort[].property | string | 1 |
  | pageable.unpaged | boolean | 65 |
  | paymentTarget | null | 1 |
  | ... | 13 weitere | |

### Abrechnung/Kasse: material-groups

- Samples: 19
- Quellen: response
- Endpunkte:
  - GET /apigateway/accounting/material-groups
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 19 |
  | content[].accounts | array | 95 |
  | content[].accounts[].accountId | string | 475 |
  | content[].accounts[].accountType | string | 475 |
  | content[].accounts[].filialeId | null | 475 |
  | content[].accounts[].vatRateKey | string | 475 |
  | content[].accounts[].vatRatePercentage | number | 475 |
  | content[].active | boolean | 95 |
  | content[].description | string | 95 |
  | content[].hmvRanges | array | 95 |
  | content[].hmvRanges[].hmvFrom | string | 95 |
  | content[].hmvRanges[].hmvTo | string | 95 |
  | content[].hmvRanges[].id | number | 95 |
  | content[].hmvRequiredFields | array | 95 |
  | content[].id | string | 95 |
  | content[].number | string | 95 |
  | content[].stockRequiredFields | array | 95 |
  | content[].useBranchAccounts | boolean | 95 |
  | empty | boolean | 19 |
  | first | boolean | 19 |
  | last | boolean | 19 |
  | number | number | 19 |
  | numberOfElements | number | 19 |
  | pageable | object | 19 |
  | pageable.offset | number | 19 |
  | pageable.paged | boolean | 19 |
  | pageable.pageNumber | number | 19 |
  | pageable.pageSize | number | 19 |
  | pageable.sort | array | 19 |
  | pageable.sort[].ascending | boolean | 19 |
  | pageable.sort[].descending | boolean | 19 |
  | pageable.sort[].direction | string | 19 |
  | pageable.sort[].ignoreCase | boolean | 19 |
  | pageable.sort[].nullHandling | string | 19 |
  | pageable.sort[].property | string | 19 |
  | pageable.unpaged | boolean | 19 |
  | size | number | 19 |
  | sort | array | 19 |
  | sort[].ascending | boolean | 19 |
  | sort[].descending | boolean | 19 |
  | ... | 6 weitere | |

### Abrechnung/Kasse: bons

- Samples: 3
- Quellen: response
- Endpunkte:
  - GET /apigateway/accounting/bons
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | error | string | 3 |
  | path | string | 3 |
  | status | number | 3 |
  | timestamp | string | 3 |

### Abrechnung/Kasse: cash-book-entries

- Samples: 3
- Quellen: response
- Endpunkte:
  - GET /apigateway/accounting/cash-book-entries/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | correlationId | string | 3 |
  | details | array | 3 |
  | id | string | 3 |
  | message | string | 3 |
  | messageKey | string | 3 |
  | severity | string | 3 |
  | timestamp | string | 3 |

### Abrechnung/Kasse: cash-books

- Samples: 3
- Quellen: response
- Endpunkte:
  - GET /apigateway/accounting/cash-books
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | error | string | 3 |
  | path | string | 3 |
  | status | number | 3 |
  | timestamp | string | 3 |

### apigateway: arzt-tenant

- Samples: 32
- Quellen: response
- Endpunkte:
  - GET /apigateway/arzt-tenant/aerzte
  - GET /apigateway/arzt-tenant/aerzte/[REDACTED]
  - GET /apigateway/arzt-tenant/aerzte/[REDACTED]/notes
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 16 |
  | address | null, object | 16 |
  | address.active | boolean | 15 |
  | address.addressAdditional | null | 15 |
  | address.addressType | string | 15 |
  | address.city | string | 15 |
  | address.countryId | string | 15 |
  | address.houseNumber | string | 15 |
  | address.id | string | 15 |
  | address.mainAddress | boolean | 15 |
  | address.poBox | null | 15 |
  | address.stateId | string | 15 |
  | address.street | string | 15 |
  | address.zipCode | string | 15 |
  | bsnr | string | 16 |
  | content | array | 16 |
  | content[].active | boolean | 1 |
  | content[].address | object | 1 |
  | content[].address.active | boolean | 1 |
  | content[].address.addressAdditional | null | 1 |
  | content[].address.addressType | string | 1 |
  | content[].address.city | string | 1 |
  | content[].address.countryId | string | 1 |
  | content[].address.houseNumber | string | 1 |
  | content[].address.id | string | 1 |
  | content[].address.mainAddress | boolean | 1 |
  | content[].address.poBox | null | 1 |
  | content[].address.stateId | string | 1 |
  | content[].address.street | string | 1 |
  | content[].address.zipCode | string | 1 |
  | content[].bsnr | string | 1 |
  | content[].contractType | null | 1 |
  | content[].doctorOrigin | string | 1 |
  | content[].email | null | 1 |
  | content[].faxConnection | string | 1 |
  | content[].firstName | string | 1 |
  | content[].hasCloudUpdate | boolean | 1 |
  | content[].id | string | 1 |
  | content[].isCloudReferenced | boolean | 1 |
  | content[].lanr | string | 1 |
  | ... | 63 weitere | |

### apigateway: fibu-accounts

- Samples: 27
- Quellen: response
- Endpunkte:
  - GET /apigateway/accounting/fibu-accounts/settings
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].accountNumberType | string | 81 |
  | [].active | boolean | 81 |
  | [].id | string | 81 |
  | [].rangeMax | number | 81 |
  | [].rangeMin | number | 81 |

### apigateway: archived-salesprocess

- Samples: 10
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/sales/archived-salesprocess/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 5 |
  | content | array | 5 |
  | customer | object | 5 |
  | customer.customerId | string | 5 |
  | empty | boolean | 5 |
  | first | boolean | 5 |
  | keywords | string | 5 |
  | last | boolean | 5 |
  | number | number | 5 |
  | numberOfElements | number | 5 |
  | pageable | object | 5 |
  | pageable.offset | number | 5 |
  | pageable.paged | boolean | 5 |
  | pageable.pageNumber | number | 5 |
  | pageable.pageSize | number | 5 |
  | pageable.sort | array | 5 |
  | pageable.sort[].ascending | boolean | 5 |
  | pageable.sort[].descending | boolean | 5 |
  | pageable.sort[].direction | string | 5 |
  | pageable.sort[].ignoreCase | boolean | 5 |
  | pageable.sort[].nullHandling | string | 5 |
  | pageable.sort[].property | string | 5 |
  | pageable.unpaged | boolean | 5 |
  | size | number | 5 |
  | sort | array | 5 |
  | sort[].ascending | boolean | 5 |
  | sort[].descending | boolean | 5 |
  | sort[].direction | string | 5 |
  | sort[].ignoreCase | boolean | 5 |
  | sort[].nullHandling | string | 5 |
  | sort[].property | string | 5 |
  | totalElements | number | 5 |
  | totalPages | number | 5 |

### apigateway: incoming-invoices

- Samples: 4
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/wawi/incoming-invoices/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 2 |
  | empty | boolean | 2 |
  | first | boolean | 2 |
  | last | boolean | 2 |
  | number | number | 2 |
  | numberOfElements | number | 2 |
  | orderId | string | 2 |
  | pageable | object | 2 |
  | pageable.offset | number | 2 |
  | pageable.paged | boolean | 2 |
  | pageable.pageNumber | number | 2 |
  | pageable.pageSize | number | 2 |
  | pageable.sort | array | 2 |
  | pageable.sort[].ascending | boolean | 2 |
  | pageable.sort[].descending | boolean | 2 |
  | pageable.sort[].direction | string | 2 |
  | pageable.sort[].ignoreCase | boolean | 2 |
  | pageable.sort[].nullHandling | string | 2 |
  | pageable.sort[].property | string | 2 |
  | pageable.unpaged | boolean | 2 |
  | size | number | 2 |
  | sort | array | 2 |
  | sort[].ascending | boolean | 2 |
  | sort[].descending | boolean | 2 |
  | sort[].direction | string | 2 |
  | sort[].ignoreCase | boolean | 2 |
  | sort[].nullHandling | string | 2 |
  | sort[].property | string | 2 |
  | totalElements | number | 2 |
  | totalPages | number | 2 |

### apigateway: audit

- Samples: 3
- Quellen: response
- Endpunkte:
  - GET /apigateway/audit/changelogs
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 3 |
  | content[].attribute | string | 15 |
  | content[].date | string | 15 |
  | content[].newValue | string | 15 |
  | content[].note | string | 15 |
  | content[].number | number | 15 |
  | content[].object | string | 15 |
  | content[].oldValue | null, string | 15 |
  | content[].service | string | 15 |
  | content[].user | string | 15 |
  | empty | boolean | 3 |
  | first | boolean | 3 |
  | last | boolean | 3 |
  | number | number | 3 |
  | numberOfElements | number | 3 |
  | pageable | object | 3 |
  | pageable.offset | number | 3 |
  | pageable.paged | boolean | 3 |
  | pageable.pageNumber | number | 3 |
  | pageable.pageSize | number | 3 |
  | pageable.sort | object | 3 |
  | pageable.sort.empty | boolean | 3 |
  | pageable.sort.sorted | boolean | 3 |
  | pageable.sort.unsorted | boolean | 3 |
  | pageable.unpaged | boolean | 3 |
  | size | number | 3 |
  | sort | object | 3 |
  | sort.empty | boolean | 3 |
  | sort.sorted | boolean | 3 |
  | sort.unsorted | boolean | 3 |
  | totalElements | number | 3 |
  | totalPages | number | 3 |

### apigateway: price-position

- Samples: 1
- Quellen: response
- Endpunkte:
  - GET /apigateway/price-position/price-positions/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 1 |
  | content[].abrechnungspositionsNr | null | 1 |
  | content[].active | boolean | 1 |
  | content[].additionalPayment | number | 1 |
  | content[].aufschlagAbschlag | null | 1 |
  | content[].consumptionType | string | 1 |
  | content[].description | string | 1 |
  | content[].freigrenze | null | 1 |
  | content[].grossUnitPrice | number | 1 |
  | content[].id | string | 1 |
  | content[].kostentraegerAddressCity | string | 1 |
  | content[].kostentraegerAddressCountryId | string | 1 |
  | content[].kostentraegerAddressHouseNumber | string | 1 |
  | content[].kostentraegerAddressStateId | string | 1 |
  | content[].kostentraegerAddressStreet | string | 1 |
  | content[].kostentraegerAddressZipCode | string | 1 |
  | content[].kostentraegerIk | string | 1 |
  | content[].kostentraegerName | string | 1 |
  | content[].kostentraegerType | string | 1 |
  | content[].legs | string | 1 |
  | content[].netPurchasePrice | null | 1 |
  | content[].netUnitPrice | number | 1 |
  | content[].netWorkTimeAllowance | null | 1 |
  | content[].netWorkTimeFactor | null | 1 |
  | content[].productSpecificFeature | null | 1 |
  | content[].serviceType | string | 1 |
  | content[].type | string | 1 |
  | content[].variant | null | 1 |
  | content[].vatRateKey | string | 1 |
  | content[].workTimeMinutes | null | 1 |
  | empty | boolean | 1 |
  | first | boolean | 1 |
  | last | boolean | 1 |
  | number | number | 1 |
  | numberOfElements | number | 1 |
  | pageable | object | 1 |
  | pageable.offset | number | 1 |
  | pageable.paged | boolean | 1 |
  | pageable.pageNumber | number | 1 |
  | pageable.pageSize | number | 1 |
  | ... | 12 weitere | |

### apigateway: stock-bookings

- Samples: 1
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawiservice/stock-bookings/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 1 |
  | content[].articleActive | boolean | 5 |
  | content[].articleColor | string | 5 |
  | content[].articleDescription | string | 5 |
  | content[].articleEanCode | string | 5 |
  | content[].articleId | string | 5 |
  | content[].articleMerchandiseGroupId | string | 5 |
  | content[].articleNumber | string | 5 |
  | content[].articleOrigin | string | 5 |
  | content[].articleSide | null | 5 |
  | content[].articleSize | string | 5 |
  | content[].bookingDate | string | 5 |
  | content[].bookingQuantity | number | 5 |
  | content[].charge | null | 5 |
  | content[].comment | string | 5 |
  | content[].createdBy | string | 5 |
  | content[].createdDate | string | 5 |
  | content[].creatorFullName | string | 5 |
  | content[].currentCharge | null | 5 |
  | content[].customerFirstName | string | 5 |
  | content[].customerFullName | string | 5 |
  | content[].customerId | string | 5 |
  | content[].customerLastName | string | 5 |
  | content[].dateBestBefore | null | 5 |
  | content[].deliveryNumber | null | 5 |
  | content[].destStorageLocationDescription | null | 5 |
  | content[].destStorageLocationDisplayId | null | 5 |
  | content[].destStorageLocationFilialeId | null | 5 |
  | content[].destStorageLocationId | null | 5 |
  | content[].entryYear | number | 5 |
  | content[].id | string | 5 |
  | content[].netPurchasingPrice | number | 5 |
  | content[].newQuantity | number | 5 |
  | content[].salesProcessId | string | 5 |
  | content[].salesProcessNumber | number | 5 |
  | content[].serialNumber | null | 5 |
  | content[].stockQuantity | number | 5 |
  | content[].storageLocationDescription | string | 5 |
  | content[].storageLocationDisplayId | string | 5 |
  | content[].storageLocationFilialeId | string | 5 |
  | ... | 31 weitere | |

### apigateway: stocktaking-articles

- Samples: 1
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawi/stocktaking-articles
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].articleColor | null | 5 |
  | [].articleDescription | string | 5 |
  | [].articleId | string | 5 |
  | [].articleNumber | string | 5 |
  | [].articleOrigin | string | 5 |
  | [].articleQuantityCharge | null | 5 |
  | [].articleQuantityDateBestBefore | null | 5 |
  | [].articleQuantityId | string | 5 |
  | [].articleQuantityTargetQuantity | number | 5 |
  | [].articleSerialNumber | null | 5 |
  | [].articleSide | null | 5 |
  | [].articleSize | null | 5 |
  | [].articleUnit | null | 5 |
  | [].articleWgr | null, string | 5 |
  | [].articleWgrUuid | null, string | 5 |
  | [].barcodeNr | null | 5 |
  | [].comment | null | 5 |
  | [].eanCode | null, string | 5 |
  | [].entryYear | number | 5 |
  | [].id | string | 5 |
  | [].producerName | string | 5 |
  | [].stocktakingArticleRecordState | string | 5 |
  | [].stocktakingInputType | null | 5 |
  | [].stocktakingListId | string | 5 |
  | [].stocktakingQuantity | null, number | 5 |
  | [].stocktakingRecordingDate | null, string | 5 |
  | [].stocktakingRecordingType | null, string | 5 |
  | [].stocktakingTypist | null, string | 5 |
  | [].storageLocationDescription | string | 5 |
  | [].storageLocationDisplayId | string | 5 |
  | [].storageLocationDisplayIdWithDescription | string | 5 |

### apigateway: stocktaking-lists

- Samples: 1
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawiservice/stocktaking-lists
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 1 |
  | content[].articleColor | null | 5 |
  | content[].articleSide | null | 5 |
  | content[].articleSize | null | 5 |
  | content[].createdDate | string | 5 |
  | content[].filialeId | string | 5 |
  | content[].id | string | 5 |
  | content[].name | string | 5 |
  | content[].showTargetQuantity | boolean | 5 |
  | content[].sorting | string | 5 |
  | content[].stocktakingStarted | boolean, null | 5 |
  | content[].stocktakingTakeover | null, string | 5 |
  | content[].storageLocationIds | array | 5 |
  | content[].storageLocationIds[] | string | 5 |
  | content[].year | number | 5 |
  | empty | boolean | 1 |
  | first | boolean | 1 |
  | last | boolean | 1 |
  | number | number | 1 |
  | numberOfElements | number | 1 |
  | pageable | object | 1 |
  | pageable.offset | number | 1 |
  | pageable.paged | boolean | 1 |
  | pageable.pageNumber | number | 1 |
  | pageable.pageSize | number | 1 |
  | pageable.sort | array | 1 |
  | pageable.sort[].ascending | boolean | 1 |
  | pageable.sort[].descending | boolean | 1 |
  | pageable.sort[].direction | string | 1 |
  | pageable.sort[].ignoreCase | boolean | 1 |
  | pageable.sort[].nullHandling | string | 1 |
  | pageable.sort[].property | string | 1 |
  | pageable.unpaged | boolean | 1 |
  | size | number | 1 |
  | sort | array | 1 |
  | sort[].ascending | boolean | 1 |
  | sort[].descending | boolean | 1 |
  | sort[].direction | string | 1 |
  | sort[].ignoreCase | boolean | 1 |
  | sort[].nullHandling | string | 1 |
  | ... | 3 weitere | |

### Artikel/Warenbestand: articles

- Samples: 242
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/article-tenant/articles/[REDACTED]
  - GET /apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}
  - GET /apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]
  - GET /apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting
  - GET /apigateway/article-tenant/articles/[REDACTED]/price-data
  - GET /apigateway/article-tenant/articles/[REDACTED]/price-data/alternative-selling-prices
  - GET /apigateway/article-tenant/articles/[REDACTED]/quantities
  - GET /apigateway/article-tenant/articles/[REDACTED]/stock-data
  - GET /apigateway/article-tenant/articles/[REDACTED]/supplier-assignments
  - GET /apigateway/article-tenant/articles/[REDACTED]/supplier-assignments/has-main-supplier
  - ... 5 weitere
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | null, string | 48 |
  | [].active | boolean | 2 |
  | [].articleId | string | 3 |
  | [].base | string | 3 |
  | [].bulkPrices | array | 3 |
  | [].computeBulkPurchasePrice | boolean | 3 |
  | [].computePurchasePriceActual | boolean | 3 |
  | [].description | string | 2 |
  | [].discount | null | 3 |
  | [].hasBulkPrices | boolean | 3 |
  | [].id | null, string | 5 |
  | [].mainSupplier | boolean | 3 |
  | [].minimumBulkQuantity | null | 3 |
  | [].orderNr | null | 3 |
  | [].pricesActive | boolean | 3 |
  | [].purchasePrice | null, number | 3 |
  | [].purchasePriceActual | null, number | 3 |
  | [].rowPosition | number | 2 |
  | [].sellingPrice | number | 2 |
  | [].supplier | null | 2 |
  | [].supplierId | string | 3 |
  | [].unitBuy | null | 3 |
  | [].unitSell | null, string | 3 |
  | [].unitSize | null | 3 |
  | [].vatRateBuy | null | 3 |
  | active | boolean | 88 |
  | alternativeSellingPrices | array | 8 |
  | articleHints | array | 25 |
  | articleId | string | 25 |
  | articleNumber | string | 25 |
  | articleSize | null, string | 25 |
  | barcodeNr | null | 25 |
  | base | string | 9 |
  | bulkPrices | array | 15 |
  | catalog | null, string | 25 |
  | checksum | number | 25 |
  | cloudDescription | null, string | 25 |
  | cloudUpdatedAt | null | 25 |
  | color | null, string | 25 |
  | computeBulkPurchasePrice | boolean | 9 |
  | ... | 215 weitere | |

### Artikel/Warenbestand: producers

- Samples: 47
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawi/producers
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 47 |
  | content[].abbreviation | string | 235 |
  | content[].active | boolean | 235 |
  | content[].cloud | boolean | 235 |
  | content[].description | string | 235 |
  | content[].id | string | 235 |
  | content[].label | string | 235 |
  | content[].systemappActive | boolean | 235 |
  | empty | boolean | 47 |
  | first | boolean | 47 |
  | last | boolean | 47 |
  | number | number | 47 |
  | numberOfElements | number | 47 |
  | pageable | object | 47 |
  | pageable.offset | number | 47 |
  | pageable.paged | boolean | 47 |
  | pageable.pageNumber | number | 47 |
  | pageable.pageSize | number | 47 |
  | pageable.sort | array | 47 |
  | pageable.sort[].ascending | boolean | 47 |
  | pageable.sort[].descending | boolean | 47 |
  | pageable.sort[].direction | string | 47 |
  | pageable.sort[].ignoreCase | boolean | 47 |
  | pageable.sort[].nullHandling | string | 47 |
  | pageable.sort[].property | string | 47 |
  | pageable.unpaged | boolean | 47 |
  | size | number | 47 |
  | sort | array | 47 |
  | sort[].ascending | boolean | 47 |
  | sort[].descending | boolean | 47 |
  | sort[].direction | string | 47 |
  | sort[].ignoreCase | boolean | 47 |
  | sort[].nullHandling | string | 47 |
  | sort[].property | string | 47 |
  | totalElements | number | 47 |
  | totalPages | number | 47 |

### Artikel/Warenbestand: label-configurations

- Samples: 22
- Quellen: response
- Endpunkte:
  - GET /apigateway/article-tenant/label-configurations/[REDACTED]
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | companyProfileId | string | 22 |
  | height | number | 22 |
  | id | string | 22 |
  | labels | array | 22 |
  | labels[].name | string | 110 |
  | labels[].positionX | number | 110 |
  | labels[].positionY | number | 110 |
  | leftBorder | number | 22 |
  | width | number | 22 |

### Artikel/Warenbestand: article-kits

- Samples: 14
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/article-tenant/article-kits/search
  - POST /apigateway/articletenantservice/article-kits/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 7 |
  | content | array | 7 |
  | content[].active | boolean | 8 |
  | content[].articleDescription | string | 8 |
  | content[].articleKitNumber | string | 8 |
  | content[].articleNr | string | 8 |
  | content[].description | string | 8 |
  | content[].filialeNames | array | 8 |
  | content[].filialeNames[] | string | 8 |
  | content[].id | string | 8 |
  | content[].materialPositionsPresent | boolean | 8 |
  | content[].positionsPresent | boolean | 8 |
  | content[].producerIds | array | 8 |
  | content[].producerIds[] | string | 8 |
  | content[].targetPrice | null | 8 |
  | content[].type | string | 8 |
  | empty | boolean | 7 |
  | first | boolean | 7 |
  | keywords | string | 7 |
  | last | boolean | 7 |
  | number | number | 7 |
  | numberOfElements | number | 7 |
  | pageable | object | 7 |
  | pageable.offset | number | 7 |
  | pageable.paged | boolean | 7 |
  | pageable.pageNumber | number | 7 |
  | pageable.pageSize | number | 7 |
  | pageable.sort | array | 7 |
  | pageable.sort[].ascending | boolean | 7 |
  | pageable.sort[].descending | boolean | 7 |
  | pageable.sort[].direction | string | 7 |
  | pageable.sort[].ignoreCase | boolean | 7 |
  | pageable.sort[].nullHandling | string | 7 |
  | pageable.sort[].property | string | 7 |
  | pageable.unpaged | boolean | 7 |
  | size | number | 7 |
  | sort | array | 7 |
  | sort[].ascending | boolean | 7 |
  | sort[].descending | boolean | 7 |
  | sort[].direction | string | 7 |
  | ... | 5 weitere | |

### Artikel/Warenbestand: bits-articles

- Samples: 8
- Quellen: response
- Endpunkte:
  - GET /apigateway/articletenantservice/bits-articles/producer-list
- Felder:
  - keine

### Artikel/Warenbestand: article

- Samples: 2
- Quellen: response
- Endpunkte:
  - GET /apigateway/article-tenant/article/generate-labels/[REDACTED]/articles/[REDACTED]
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | correlationId | string | 2 |
  | details | array | 2 |
  | id | string | 2 |
  | message | string | 2 |
  | messageKey | string | 2 |
  | severity | string | 2 |
  | timestamp | string | 2 |

### Dokumente/Archiv: stored-documents

- Samples: 29
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/document/stored-documents
  - POST /apigateway/document/stored-documents/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 22 |
  | content[].availableTo | array | 8 |
  | content[].createdDate | string | 8 |
  | content[].documentResourceId | null, string | 8 |
  | content[].documentType | string | 8 |
  | content[].entityDescription | string | 8 |
  | content[].entityId | string | 8 |
  | content[].entityType | string | 8 |
  | content[].fileId | string | 8 |
  | content[].filename | string | 8 |
  | content[].formType | null | 8 |
  | content[].formularLockEdit | boolean, null | 8 |
  | content[].formularSaveTemporary | boolean, null | 8 |
  | content[].id | string | 8 |
  | content[].metaData | object | 8 |
  | content[].metaData.costestimate.businessstationery.fileid | string | 3 |
  | content[].metaData.form.businessstationery.fileid | string | 3 |
  | content[].mipDocumentType | null | 8 |
  | content[].modifiedDate | string | 8 |
  | content[].name | string | 8 |
  | content[].storageLocations | array | 8 |
  | content[].storageLocations[].storageLocationId | string | 8 |
  | content[].storageLocations[].storageLocationType | string | 8 |
  | empty | boolean | 22 |
  | entityCustomer | array | 7 |
  | entityCustomer[] | string | 7 |
  | entityDauerversorgung | array | 7 |
  | entityDauerversorgung[] | string | 15 |
  | entityOrder | array | 7 |
  | entityOrder[] | string | 22 |
  | entitySalesProcess | array | 7 |
  | entitySalesProcess[] | string | 31 |
  | first | boolean | 22 |
  | keywords | string | 7 |
  | last | boolean | 22 |
  | number | number | 22 |
  | numberOfElements | number | 22 |
  | pageable | object | 22 |
  | pageable.offset | number | 22 |
  | pageable.paged | boolean | 22 |
  | ... | 16 weitere | |

### Dokumente/Archiv: archive-documents

- Samples: 19
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/document/archive-documents/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 9 |
  | correlationId | string | 1 |
  | description | object | 9 |
  | description.type | string | 9 |
  | details | array | 1 |
  | empty | boolean | 9 |
  | fileName | object | 9 |
  | fileName.type | string | 9 |
  | first | boolean | 9 |
  | id | string | 1 |
  | keywords | string | 9 |
  | last | boolean | 9 |
  | message | string | 1 |
  | messageKey | string | 1 |
  | migratedId | null | 9 |
  | module | string | 9 |
  | number | number | 9 |
  | numberOfElements | number | 9 |
  | pageable | object | 9 |
  | pageable.offset | number | 9 |
  | pageable.paged | boolean | 9 |
  | pageable.pageNumber | number | 9 |
  | pageable.pageSize | number | 9 |
  | pageable.sort | object | 9 |
  | pageable.sort.empty | boolean | 9 |
  | pageable.sort.sorted | boolean | 9 |
  | pageable.sort.unsorted | boolean | 9 |
  | pageable.unpaged | boolean | 9 |
  | severity | string | 1 |
  | size | number | 18 |
  | sort | array, object | 18 |
  | sort.empty | boolean | 9 |
  | sort.sorted | boolean | 9 |
  | sort.unsorted | boolean | 9 |
  | sort[] | string | 9 |
  | timestamp | string | 1 |
  | totalElements | number | 9 |
  | totalPages | number | 9 |

### Dokumente/Archiv: documents

- Samples: 5
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/document/documents/[REDACTED]/png-preview
  - POST /apigateway/document/documents/boilerplates/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | string | 1 |
  | active | boolean | 2 |
  | content | array | 2 |
  | content[].active | boolean | 4 |
  | content[].description | string | 4 |
  | content[].documentType | string | 4 |
  | content[].id | string | 4 |
  | content[].position | string | 4 |
  | content[].standard | boolean | 4 |
  | content[].text | string | 4 |
  | documentType | string | 2 |
  | empty | boolean | 2 |
  | first | boolean | 2 |
  | keywords | string | 2 |
  | last | boolean | 2 |
  | number | number | 2 |
  | numberOfElements | number | 2 |
  | pageable | object | 2 |
  | pageable.offset | number | 2 |
  | pageable.paged | boolean | 2 |
  | pageable.pageNumber | number | 2 |
  | pageable.pageSize | number | 2 |
  | pageable.sort | object | 2 |
  | pageable.sort.empty | boolean | 2 |
  | pageable.sort.sorted | boolean | 2 |
  | pageable.sort.unsorted | boolean | 2 |
  | pageable.unpaged | boolean | 2 |
  | size | number | 2 |
  | sort | object | 2 |
  | sort.empty | boolean | 2 |
  | sort.sorted | boolean | 2 |
  | sort.unsorted | boolean | 2 |
  | totalElements | number | 2 |
  | totalPages | number | 2 |

### Dokumente/Archiv: formservice

- Samples: 4
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/formservice/formulare/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].active | boolean | 10 |
  | [].availableTo | string | 10 |
  | [].created | boolean | 10 |
  | [].departmentId | null | 2 |
  | [].departmentIds | null | 10 |
  | [].departmentNames | null | 10 |
  | [].description | string | 10 |
  | [].formSubType | null, string | 10 |
  | [].formType | string | 10 |
  | [].hilfsmittelnummer | null | 2 |
  | [].hmvNrCommaSeparated | null | 10 |
  | [].id | string | 10 |
  | [].lastModified | null, string | 10 |
  | [].lastModifiedBy | null, string | 10 |
  | [].legs | null | 2 |
  | [].legsCommaSeparated | null | 10 |
  | [].leistungsart | string | 2 |
  | [].mandatory | boolean | 10 |
  | [].nr | null, string | 10 |
  | [].published | boolean | 10 |
  | [].salesProcessId | string | 2 |
  | [].serviceTypeCommaSeparated | null | 10 |

### dv-data: dv-data

- Samples: 27
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids
  - POST /apigateway/sales/dv-data/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | string | 15 |
  | active | boolean | 11 |
  | content | array | 9 |
  | content[].active | boolean | 12 |
  | content[].approvalEnd | null | 12 |
  | content[].art | null | 12 |
  | content[].artFreitext | null | 12 |
  | content[].artIds | array | 12 |
  | content[].artIds[] | string | 12 |
  | content[].arztBetriebsstaettenNr | null, string | 12 |
  | content[].arztCity | null, string | 12 |
  | content[].arztDataOrigin | null, string | 12 |
  | content[].arztDescription | null, string | 12 |
  | content[].arztFirstName | null, string | 12 |
  | content[].arztId | null, string | 12 |
  | content[].arztLastName | null, string | 12 |
  | content[].arztLebenslangeArztNummer | null, string | 12 |
  | content[].arztName | string | 12 |
  | content[].arztSalutation | null, string | 12 |
  | content[].arztTitle | null, string | 12 |
  | content[].authorId | string | 12 |
  | content[].authorName | string | 12 |
  | content[].commaSeparatedArt | null, string | 12 |
  | content[].consultantId | string | 12 |
  | content[].consultantName | string | 12 |
  | content[].consumedPauschale | number | 12 |
  | content[].costCenterId | null | 12 |
  | content[].costCenterName | null | 12 |
  | content[].costCenterNumber | null | 12 |
  | content[].customerAddress | string | 12 |
  | content[].customerCity | null | 12 |
  | content[].customerDateOfBirth | string | 12 |
  | content[].customerFirstName | string | 12 |
  | content[].customerHouseNumber | null | 12 |
  | content[].customerId | string | 12 |
  | content[].customerLastName | string | 12 |
  | content[].customerName | string | 12 |
  | content[].customerNumber | number | 12 |
  | content[].customerStreet | null | 12 |
  | content[].customerTitle | null | 12 |
  | ... | 236 weitere | |

### Filialen/Mandant: filialen

- Samples: 524
- Quellen: response
- Endpunkte:
  - GET /apigateway/filiale/filialen
  - GET /apigateway/filiale/filialen/[REDACTED]
  - GET /apigateway/filiale/filialen/[REDACTED]/addresses
  - GET /apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen
  - GET /apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]
  - GET /apigateway/filiale/filialen/[REDACTED]/receipt-settings
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 177 |
  | addressAdditional | null | 23 |
  | addressId | string | 23 |
  | bitsFilialNumber | null | 23 |
  | cancellationReceiptFooter | string | 142 |
  | cancellationReceiptHeader | null | 142 |
  | city | string | 23 |
  | content | array | 205 |
  | content[].active | boolean | 205 |
  | content[].addressAdditional | null | 190 |
  | content[].addressId | null, string | 177 |
  | content[].addressType | string | 13 |
  | content[].bitsFilialNumber | null | 177 |
  | content[].city | string | 190 |
  | content[].country | null | 13 |
  | content[].countryId | string | 13 |
  | content[].countryUuid | null, string | 177 |
  | content[].dateValidFrom | null, string | 28 |
  | content[].dateValidTo | null | 28 |
  | content[].email | string | 177 |
  | content[].employee | null | 177 |
  | content[].faxConnection | string | 177 |
  | content[].filialeId | string | 15 |
  | content[].filialeName | string | 15 |
  | content[].id | string | 205 |
  | content[].ik | string | 177 |
  | content[].institutionsKennzeichen | string | 15 |
  | content[].label | null | 15 |
  | content[].logo | null | 177 |
  | content[].mainAddress | boolean | 13 |
  | content[].managerIds | array | 177 |
  | content[].managerIds[] | string | 177 |
  | content[].mipMd5Key | string | 15 |
  | content[].name | string | 177 |
  | content[].number | number | 177 |
  | content[].phoneNumber | string | 177 |
  | content[].poBox | null | 13 |
  | content[].prequalification | boolean | 15 |
  | content[].state | null | 13 |
  | content[].stateId | string | 13 |
  | ... | 40 weitere | |

### Filialen/Mandant: companies

- Samples: 227
- Quellen: response
- Endpunkte:
  - GET /apigateway/firma/companies/contact-opportunities
  - GET /apigateway/firma/companies/details
  - GET /apigateway/firma/companies/details/accountings
  - GET /apigateway/firma/companies/details/addresses
  - GET /apigateway/userservice/companies/details/preferences
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | accounts | array | 27 |
  | accounts[].accountId | string | 135 |
  | accounts[].accountType | string | 135 |
  | accounts[].vatRateKey | string | 135 |
  | accounts[].vatRatePercentage | number | 135 |
  | artFreitext | boolean | 163 |
  | articlesUpdateType | string | 163 |
  | assignLeistungskennzeichenAutomatically | boolean | 163 |
  | assignUniqueAccountNo | boolean | 27 |
  | assignUniqueAccountNoCreditor | boolean | 27 |
  | autoAssignMaterialGroup | boolean | 163 |
  | billingTypes | array | 163 |
  | billingTypes[] | string | 163 |
  | bitsInterfaceActive | boolean | 163 |
  | businessStationery | boolean | 163 |
  | businessStationeryUploaded | boolean | 163 |
  | commercialRegisterNumber | string | 22 |
  | compactInvoice | boolean | 163 |
  | content | array | 1 |
  | content[].active | boolean | 3 |
  | content[].addressAdditional | null | 3 |
  | content[].addressType | string | 3 |
  | content[].city | string | 3 |
  | content[].countryId | null | 3 |
  | content[].dateValidFrom | string | 3 |
  | content[].dateValidTo | null | 3 |
  | content[].id | string | 3 |
  | content[].mainAddress | boolean | 3 |
  | content[].poBox | string | 3 |
  | content[].stateId | null | 3 |
  | content[].street | string | 3 |
  | content[].streetNumber | string | 3 |
  | content[].zipCode | string | 3 |
  | costCenterRequirements | array | 163 |
  | customerBadges | array | 163 |
  | customerBadges[] | string | 326 |
  | defaultOrderingPlatform | string | 163 |
  | defaultPreisermittlungType | string | 163 |
  | directBillingAccompanyingNote | null | 163 |
  | doctorsUpdateType | string | 163 |
  | ... | 82 weitere | |

### Filialen/Mandant: department

- Samples: 93
- Quellen: response
- Endpunkte:
  - GET /apigateway/department/departments
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 93 |
  | content[].active | boolean | 465 |
  | content[].departmentFilialeHeads | array | 465 |
  | content[].departmentFilialeHeads[].active | boolean | 465 |
  | content[].departmentFilialeHeads[].filialeId | string | 465 |
  | content[].departmentFilialeHeads[].filialeName | null | 465 |
  | content[].departmentFilialeHeads[].userId | null, string | 465 |
  | content[].departmentFilialeHeads[].userName | string | 465 |
  | content[].departmentFilialeLeads | string | 465 |
  | content[].departmentFilialeNames | string | 465 |
  | content[].departmentFilialeUsers | array | 465 |
  | content[].departmentFilialeUsers[].active | boolean | 1674 |
  | content[].departmentFilialeUsers[].filialeId | string | 1674 |
  | content[].departmentFilialeUsers[].filialeName | null | 1674 |
  | content[].departmentFilialeUsers[].userId | string | 1674 |
  | content[].departmentFilialeUsers[].userName | string | 1674 |
  | content[].departmentUsers | array | 465 |
  | content[].id | string | 465 |
  | content[].mainUserId | string | 465 |
  | content[].mainUserName | string | 465 |
  | content[].name | string | 465 |
  | content[].number | number | 465 |
  | empty | boolean | 93 |
  | first | boolean | 93 |
  | last | boolean | 93 |
  | number | number | 93 |
  | numberOfElements | number | 93 |
  | pageable | object | 93 |
  | pageable.offset | number | 93 |
  | pageable.paged | boolean | 93 |
  | pageable.pageNumber | number | 93 |
  | pageable.pageSize | number | 93 |
  | pageable.sort | array | 93 |
  | pageable.sort[].ascending | boolean | 93 |
  | pageable.sort[].descending | boolean | 93 |
  | pageable.sort[].direction | string | 93 |
  | pageable.sort[].ignoreCase | boolean | 93 |
  | pageable.sort[].nullHandling | string | 93 |
  | pageable.sort[].property | string | 93 |
  | pageable.unpaged | boolean | 93 |
  | ... | 10 weitere | |

### Hilfsmittel: hilfsmittel

- Samples: 58
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/hilfsmittel/hilfsmittel/retrieval
  - GET /apigateway/hilfsmittel/hilfsmittel/termine
  - GET /apigateway/hilfsmittel/hilfsmittel/traits
  - GET /apigateway/hilfsmittel/route-plannings
  - POST /apigateway/hilfsmittel/arten/search
  - POST /apigateway/hilfsmittel/hilfsmittel/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 17 |
  | content | array | 41 |
  | content[].active | boolean | 70 |
  | content[].condition | string | 5 |
  | content[].customerFullName | string | 5 |
  | content[].customerId | string | 5 |
  | content[].dateOfRetrieval | null | 5 |
  | content[].deliveryAddressId | string | 5 |
  | content[].deliveryDate | null, string | 5 |
  | content[].description | string | 65 |
  | content[].filialeId | string | 5 |
  | content[].filialeName | string | 5 |
  | content[].hilfsmittelArtDescription | null, string | 5 |
  | content[].hilfsmittelArtId | null, string | 5 |
  | content[].hilfsmittelDescription | string | 5 |
  | content[].hilfsmittelId | string | 5 |
  | content[].hmvNumber | null, string | 5 |
  | content[].id | string | 70 |
  | content[].inputType | string | 50 |
  | content[].internalNumber | null | 5 |
  | content[].key | string | 50 |
  | content[].label | string | 50 |
  | content[].leistungsart | null, string | 5 |
  | content[].lfdNr | string | 5 |
  | content[].materialGroupDescription | null, string | 5 |
  | content[].materialGroupId | null, string | 5 |
  | content[].options | array | 50 |
  | content[].options[].key | string | 100 |
  | content[].options[].value | string | 100 |
  | content[].ownerName | null | 5 |
  | content[].ownerType | string | 5 |
  | content[].regexPattern | null, string | 50 |
  | content[].retrievable | boolean | 5 |
  | content[].salesProcessId | string | 5 |
  | content[].salesProcessNumber | number | 5 |
  | content[].salesProcessStatusId | string | 5 |
  | content[].stockLocationId | null, string | 5 |
  | content[].stockState | string | 5 |
  | content[].type | string | 50 |
  | content[].versorgungEndDate | null, string | 5 |
  | ... | 30 weitere | |

### Kommunikation/Aufgaben: mail

- Samples: 733
- Quellen: response
- Endpunkte:
  - GET /apigateway/mail/gateway-configurations/user-mail-addresses
  - GET /apigateway/mail/mails/unread-number
- Felder:
  - keine

### Kommunikation/Aufgaben: reminders

- Samples: 217
- Quellen: response
- Endpunkte:
  - GET /apigateway/communicatorservice/reminders/dbopt
- Felder:
  - keine

### Kommunikation/Aufgaben: notifications

- Samples: 154
- Quellen: response
- Endpunkte:
  - GET /apigateway/notification/notifications
  - GET /apigateway/notification/notifications/all
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].data | object | 185 |
  | [].data.clickToClose | boolean | 185 |
  | [].data.downloadableFiles | array | 185 |
  | [].data.downloadableFiles[].fileId | string | 185 |
  | [].data.downloadableFiles[].fileName | string | 185 |
  | [].data.downloadableFiles[].saveWithoutView | boolean | 185 |
  | [].data.icon | string | 185 |
  | [].data.note | string | 185 |
  | [].data.requestId | string | 185 |
  | [].data.severity | string | 185 |
  | [].data.title | string | 185 |
  | [].date | string | 185 |
  | [].id | string | 185 |
  | [].notificationCenter | boolean | 185 |
  | [].readStatus | boolean | 185 |
  | [].type | string | 185 |
  | content | array | 1 |
  | content[].data | object | 5 |
  | content[].data.clickToClose | boolean | 4 |
  | content[].data.downloadableFiles | array | 4 |
  | content[].data.downloadableFiles[].fileId | string | 4 |
  | content[].data.downloadableFiles[].fileName | string | 4 |
  | content[].data.downloadableFiles[].saveWithoutView | boolean | 4 |
  | content[].data.event | boolean | 1 |
  | content[].data.hasError | boolean | 1 |
  | content[].data.icon | string | 4 |
  | content[].data.note | string | 5 |
  | content[].data.reportId | string | 1 |
  | content[].data.requestId | string | 4 |
  | content[].data.severity | string | 4 |
  | content[].data.title | string | 5 |
  | content[].data.typePrefix | string | 1 |
  | content[].date | string | 5 |
  | content[].id | string | 5 |
  | content[].notificationCenter | boolean | 5 |
  | content[].readStatus | boolean | 5 |
  | content[].type | string | 5 |
  | empty | boolean | 1 |
  | first | boolean | 1 |
  | last | boolean | 1 |
  | ... | 19 weitere | |

### Kunden/Vorgaenge: salesprocesses

- Samples: 462
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/sales/salesprocesses/[REDACTED]
  - GET /apigateway/sales/salesprocesses/[REDACTED]/notes
  - GET /apigateway/sales/salesprocesses/kpi-statistics
  - GET /apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids
  - POST /apigateway/sales/salesprocesses
  - POST /apigateway/sales/salesprocesses/[REDACTED]/delivery-notes
  - POST /apigateway/sales/salesprocesses/calculate-prices
  - POST /apigateway/sales/salesprocesses/search
  - POST /apigateway/salesprocessservice/salesprocesses/vouchers/search
  - PUT /apigateway/sales/salesprocesses/[REDACTED]
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | string | 31 |
  | [].statusId | string | 300 |
  | [].sum | number | 300 |
  | accidentDate | null | 75 |
  | accidentLocation | null | 75 |
  | active | boolean | 239 |
  | annotation | null | 1 |
  | art | array, null | 50 |
  | art[].active | boolean | 31 |
  | art[].description | string | 31 |
  | art[].id | string | 31 |
  | art[].materialPositionen | boolean | 31 |
  | artFreitext | null | 75 |
  | artGesamt | null | 25 |
  | artIds | array | 75 |
  | artIds[] | string | 122 |
  | arzt | null, string | 25 |
  | arztBetriebsstaettenNr | null, string | 75 |
  | arztCity | null, string | 75 |
  | arztDataOrigin | null, string | 75 |
  | arztDescription | null, string | 75 |
  | arztFirstName | null, string | 75 |
  | arztId | null, string | 75 |
  | arztIk | null | 50 |
  | arztLastName | null, string | 75 |
  | arztLebenslangeArztNummer | null, string | 75 |
  | arztSalutation | null, string | 75 |
  | arztTitle | null, string | 75 |
  | attachments | boolean, null | 75 |
  | authorId | string | 75 |
  | authorName | string | 75 |
  | businessStationary | boolean | 1 |
  | cancellation | boolean, null | 75 |
  | collectiveInvoiceValidationErrors | array, null | 75 |
  | commaSeparatedArt | null | 25 |
  | consultantId | string | 75 |
  | consultantName | string | 75 |
  | consumedPauschale | null, number | 75 |
  | content | array | 152 |
  | content[].active | boolean | 478 |
  | ... | 518 weitere | |

### Kunden/Vorgaenge: customers

- Samples: 361
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/customerservice/customers/[REDACTED]
  - GET /apigateway/kunden/customers/[REDACTED]
  - GET /apigateway/kunden/customers/[REDACTED]/addresses
  - GET /apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]
  - GET /apigateway/kunden/customers/[REDACTED]/arzt
  - GET /apigateway/kunden/customers/[REDACTED]/contacts
  - GET /apigateway/kunden/customers/[REDACTED]/kostentraeger
  - GET /apigateway/kunden/customers/[REDACTED]/notes
  - GET /apigateway/kunden/customers/[REDACTED]/notes/[REDACTED]
  - GET /apigateway/kunden/customers/search
  - ... 7 weitere
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 69 |
  | addressAdditional | null | 14 |
  | addressType | string | 14 |
  | alpha3CountryCode | null | 13 |
  | area | null | 14 |
  | arztBetriebsstaettenNr | string | 2 |
  | arztCity | string | 2 |
  | arztDataOrigin | string | 2 |
  | arztFachrichtung | string | 2 |
  | arztFirstName | string | 2 |
  | arztId | string | 2 |
  | arztLastName | string | 2 |
  | arztLebenslangeArztNr | string | 2 |
  | arztRelation | null | 2 |
  | arztSalutation | string | 2 |
  | arztStreet | string | 2 |
  | arztStreetNumber | string | 2 |
  | arztTitle | string | 2 |
  | arztZipCode | string | 2 |
  | birthName | null | 53 |
  | city | string | 14 |
  | content | array | 284 |
  | content[].active | boolean | 692 |
  | content[].addressAdditional | null, string | 572 |
  | content[].addressArea | null | 446 |
  | content[].addressCity | null, string | 446 |
  | content[].addressCountryId | null, string | 446 |
  | content[].addressDateValidFrom | null, string | 446 |
  | content[].addressDateValidTo | null | 446 |
  | content[].addressHouseNumber | null, string | 446 |
  | content[].addressId | null, string | 446 |
  | content[].addressPoBox | null | 446 |
  | content[].addressRoom | null | 446 |
  | content[].addressStateId | null, string | 446 |
  | content[].addressStreet | null, string | 446 |
  | content[].addressType | null, string | 572 |
  | content[].addressZipCode | null, string | 446 |
  | content[].alpha3CountryCode | null | 119 |
  | content[].area | null | 119 |
  | content[].arztBetriebsstaettenNr | string | 20 |
  | ... | 172 weitere | |

### Kunden/Vorgaenge: status

- Samples: 232
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/salesprocessservice/status/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 9 |
  | content | array | 110 |
  | content[].active | boolean | 550 |
  | content[].closedSales | boolean | 550 |
  | content[].comment | null, string | 550 |
  | content[].correspondingSalesState | null, string | 550 |
  | content[].description | string | 550 |
  | content[].enabled | array | 550 |
  | content[].enabled[] | string | 577 |
  | content[].enabledCommaSeparated | string | 550 |
  | content[].hidden | boolean | 550 |
  | content[].id | string | 550 |
  | content[].standardCommaSeparated | string | 550 |
  | content[].standardDv | boolean | 550 |
  | content[].standardSales | boolean | 550 |
  | content[].standardVersorgung | boolean | 550 |
  | empty | boolean | 110 |
  | error | string | 1 |
  | first | boolean | 110 |
  | last | boolean | 110 |
  | number | number | 110 |
  | numberOfElements | number | 110 |
  | pageable | object | 110 |
  | pageable.offset | number | 110 |
  | pageable.paged | boolean | 110 |
  | pageable.pageNumber | number | 110 |
  | pageable.pageSize | number | 110 |
  | pageable.sort | array | 110 |
  | pageable.sort[].ascending | boolean | 110 |
  | pageable.sort[].descending | boolean | 110 |
  | pageable.sort[].direction | string | 110 |
  | pageable.sort[].ignoreCase | boolean | 110 |
  | pageable.sort[].nullHandling | string | 110 |
  | pageable.sort[].property | string | 110 |
  | pageable.unpaged | boolean | 110 |
  | path | string | 1 |
  | requestId | string | 1 |
  | size | number | 110 |
  | sort | array | 110 |
  | sort[].ascending | boolean | 110 |
  | ... | 9 weitere | |

### Kunden/Vorgaenge: kostentraeger-tenant

- Samples: 55
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/kostentraeger-tenant/kostentraeger
  - GET /apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]
  - GET /apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/notes
  - GET /apigateway/kostentraeger-tenant/kostentraeger/cloud-status
  - POST /apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/addresses/conditional-prioritized-addresses
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].active | boolean | 1 |
  | [].addressAdditional | null | 1 |
  | [].addressType | string | 1 |
  | [].city | string | 1 |
  | [].countryId | null | 1 |
  | [].description | null | 1 |
  | [].houseNumber | string | 1 |
  | [].id | string | 1 |
  | [].ik | null | 1 |
  | [].kostentraegerDescription | null | 1 |
  | [].kostentraegerId | null | 1 |
  | [].kostentraegerIk | null | 1 |
  | [].linked | boolean | 1 |
  | [].linkedId | null | 1 |
  | [].linkedLocked | boolean | 1 |
  | [].mainAddress | boolean | 1 |
  | [].poBox | null | 1 |
  | [].stateId | null | 1 |
  | [].street | string | 1 |
  | [].zipCode | string | 1 |
  | active | boolean | 19 |
  | address | object | 19 |
  | address.active | boolean | 19 |
  | address.addressAdditional | null | 19 |
  | address.addressType | string | 19 |
  | address.city | string | 19 |
  | address.countryId | string | 19 |
  | address.description | null | 19 |
  | address.houseNumber | string | 19 |
  | address.id | string | 19 |
  | address.ik | null | 19 |
  | address.kostentraegerDescription | string | 19 |
  | address.kostentraegerId | string | 19 |
  | address.kostentraegerIk | string | 19 |
  | address.linked | boolean | 19 |
  | address.linkedId | null, string | 19 |
  | address.linkedLocked | boolean | 19 |
  | address.mainAddress | boolean | 19 |
  | address.poBox | null | 19 |
  | address.stateId | string | 19 |
  | ... | 87 weitere | |

### Kunden/Vorgaenge: art

- Samples: 32
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/sales/art/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 17 |
  | content | array | 15 |
  | content[].active | boolean | 75 |
  | content[].description | string | 75 |
  | content[].id | string | 75 |
  | content[].materialPositionen | boolean | 75 |
  | empty | boolean | 15 |
  | first | boolean | 15 |
  | ids | null | 17 |
  | last | boolean | 15 |
  | number | number | 15 |
  | numberOfElements | number | 15 |
  | pageable | object | 15 |
  | pageable.offset | number | 15 |
  | pageable.paged | boolean | 15 |
  | pageable.pageNumber | number | 15 |
  | pageable.pageSize | number | 15 |
  | pageable.sort | array | 15 |
  | pageable.sort[].ascending | boolean | 15 |
  | pageable.sort[].descending | boolean | 15 |
  | pageable.sort[].direction | string | 15 |
  | pageable.sort[].ignoreCase | boolean | 15 |
  | pageable.sort[].nullHandling | string | 15 |
  | pageable.sort[].property | string | 15 |
  | pageable.unpaged | boolean | 15 |
  | size | number | 15 |
  | sort | array | 15 |
  | sort[].ascending | boolean | 15 |
  | sort[].descending | boolean | 15 |
  | sort[].direction | string | 15 |
  | sort[].ignoreCase | boolean | 15 |
  | sort[].nullHandling | string | 15 |
  | sort[].property | string | 15 |
  | totalElements | number | 15 |
  | totalPages | number | 15 |

### Kunden/Vorgaenge: pricingservice

- Samples: 15
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/pricingservice/sales-positions
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].alternativeSellingPriceAvailable | boolean | 8 |
  | [].amount | null, number | 8 |
  | [].articleDataOrigin | null, string | 8 |
  | [].branchId | string | 6 |
  | [].content | array | 7 |
  | [].content[].aepNetto | null | 11 |
  | [].content[].alternativeSellingPriceAvailable | boolean | 11 |
  | [].content[].amount | number | 11 |
  | [].content[].arbeitszeitPreisEnabled | boolean | 11 |
  | [].content[].articleColor | null, string | 11 |
  | [].content[].articleDataOrigin | string | 11 |
  | [].content[].articleDescription | string | 11 |
  | [].content[].articleEanCode | null, string | 11 |
  | [].content[].articleEkNetto | number | 11 |
  | [].content[].articleId | string | 11 |
  | [].content[].articleKitId | null | 11 |
  | [].content[].articleKitTargetPrice | null | 11 |
  | [].content[].articleMigratedId | null | 11 |
  | [].content[].articleMwStEk | null, number | 11 |
  | [].content[].articleMwStVkPrivat | null, number | 11 |
  | [].content[].articleNumber | string | 11 |
  | [].content[].articleSide | null | 11 |
  | [].content[].articleSize | null, string | 11 |
  | [].content[].articleVkPrivat | null, number | 11 |
  | [].content[].avkBrutto | null | 11 |
  | [].content[].consumptionHmv | null | 11 |
  | [].content[].customPositionAssignment | boolean | 11 |
  | [].content[].discount | null | 11 |
  | [].content[].discountAmount | null | 11 |
  | [].content[].discountComment | null | 11 |
  | [].content[].discountProducer | null | 11 |
  | [].content[].discountVatAmount | null | 11 |
  | [].content[].effectiveEkCalculationType | string | 11 |
  | [].content[].eigenanteil | null | 11 |
  | [].content[].ekPreisEnabled | boolean | 11 |
  | [].content[].gesetzlicheZuzahlung | number | 11 |
  | [].content[].hilfsmittelId | null | 11 |
  | [].content[].hilfsmittelNummer | null, string | 11 |
  | [].content[].hilfsmittelPositionsNummer | null, string | 11 |
  | [].content[].id | null | 11 |
  | ... | 116 weitere | |

### Kunden/Vorgaenge: ekv

- Samples: 10
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/ekv/cost-estimates
  - GET /apigateway/ekv/cost-estimates/latest-approved
  - POST /apigateway/ekv/cost-estimates
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | accepted | boolean | 1 |
  | amount | number | 2 |
  | answerDate | null | 2 |
  | approvalAmount | null | 2 |
  | approvalDate | null | 2 |
  | approvalEnd | null | 2 |
  | approvalNumber | null | 2 |
  | attachments | array | 2 |
  | computeDuration | boolean | 2 |
  | content | array | 6 |
  | correlationId | string | 2 |
  | costEstimateAddressId | string | 2 |
  | costEstimateNumber | null, number | 2 |
  | costEstimateType | string | 2 |
  | createdDate | string | 2 |
  | details | array | 2 |
  | durationInMonths | null | 2 |
  | ekv | boolean | 2 |
  | empty | boolean | 6 |
  | first | boolean | 6 |
  | footerBoilerplateId | string | 2 |
  | hasBeenPrinted | boolean, null | 2 |
  | hasBeenSent | boolean, null | 2 |
  | headerBoilerplateId | null | 1 |
  | id | null, string | 4 |
  | kostentraegerComments | null | 2 |
  | kostentraegerIk | null, string | 2 |
  | kvPrintEkv | boolean | 2 |
  | kvResource | string | 2 |
  | last | boolean | 6 |
  | message | string | 2 |
  | messageKey | string | 2 |
  | mipRequestId | null | 2 |
  | number | number | 6 |
  | numberOfElements | number | 6 |
  | ownComments | null | 2 |
  | pageable | object | 6 |
  | pageable.offset | number | 6 |
  | pageable.paged | boolean | 6 |
  | pageable.pageNumber | number | 6 |
  | ... | 29 weitere | |

### Kunden/Vorgaenge: recommendations

- Samples: 2
- Quellen: response
- Endpunkte:
  - GET /apigateway/salesprocessservice/recommendations
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].key | string | 10 |
  | [].label | string | 10 |

### Referenzdaten: country

- Samples: 154
- Quellen: response
- Endpunkte:
  - GET /apigateway/country/countries
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 154 |
  | content[].dakotaCountry | string | 770 |
  | content[].id | string | 770 |
  | content[].iso3166 | string | 770 |
  | content[].iso3166Alpha3 | string | 770 |
  | content[].name | string | 770 |
  | content[].stateName | string | 770 |
  | content[].states | array | 770 |
  | content[].states[].id | string | 3850 |
  | content[].states[].name | string | 3850 |
  | empty | boolean | 154 |
  | first | boolean | 154 |
  | last | boolean | 154 |
  | number | number | 154 |
  | numberOfElements | number | 154 |
  | pageable | object | 154 |
  | pageable.offset | number | 154 |
  | pageable.paged | boolean | 154 |
  | pageable.pageNumber | number | 154 |
  | pageable.pageSize | number | 154 |
  | pageable.sort | array | 154 |
  | pageable.unpaged | boolean | 154 |
  | size | number | 154 |
  | sort | array | 154 |
  | totalElements | number | 154 |
  | totalPages | number | 154 |

### Referenzdaten: enum-service

- Samples: 154
- Quellen: response
- Endpunkte:
  - GET /apigateway/enum-service/enums
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].data | array | 770 |
  | [].data[].key | string | 2772 |
  | [].data[].label | string | 2772 |
  | [].data[].tvalue | null | 2772 |
  | [].enumType | string | 770 |

### Referenzdaten: navigationservice

- Samples: 13
- Quellen: response
- Endpunkte:
  - GET /apigateway/navigationservice/external/countries
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].dakotaCountry | string | 65 |
  | [].id | string | 65 |
  | [].iso3166 | string | 65 |
  | [].iso3166Alpha3 | string | 65 |
  | [].name | string | 65 |
  | [].stateName | string | 65 |
  | [].states | array | 65 |
  | [].states[].id | string | 325 |
  | [].states[].name | string | 325 |

### User/Workspace: user

- Samples: 394
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/user/generic-list-column-states
  - GET /apigateway/user/users
  - GET /apigateway/user/users/[REDACTED]/dashboards
  - GET /apigateway/user/users/search
  - GET /apigateway/userservice/user/preferences
  - PUT /apigateway/user/users/[REDACTED]/passwords
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | collectiveInvoiceSalesProcesses-collective-invoice | object | 37 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState | array | 37 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].aggFunc | null | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].colId | string | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].flex | null | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].hide | boolean | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].pinned | null, string | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].pivot | boolean | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].pivotIndex | null | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].rowGroup | boolean | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].rowGroupIndex | null | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].sort | null | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].sortIndex | null | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.columnState[].width | number | 185 |
  | collectiveInvoiceSalesProcesses-collective-invoice.sortModel | array | 37 |
  | collectiveInvoiceSalesProcesses-collective-invoice.sortModel[].colId | string | 37 |
  | collectiveInvoiceSalesProcesses-collective-invoice.sortModel[].sort | string | 37 |
  | configuration | string | 154 |
  | content | array | 72 |
  | content[].active | boolean | 360 |
  | content[].clientRoles | null | 360 |
  | content[].dashboardId | null | 360 |
  | content[].email | null, string | 360 |
  | content[].favoriteAppIds | array | 360 |
  | content[].filialeIds | array | 360 |
  | content[].firstName | string | 360 |
  | content[].id | string | 360 |
  | content[].lastName | string | 360 |
  | content[].mobilePhoneNumber | null | 360 |
  | content[].notificationForAssignments | null | 360 |
  | content[].password | null | 360 |
  | content[].passwordExpireDate | string | 360 |
  | content[].phoneNumber | null, string | 360 |
  | content[].profileImageId | null | 360 |
  | content[].roles | null | 360 |
  | content[].salutation | string | 360 |
  | content[].standardPassword | boolean | 360 |
  | content[].tenant | null | 360 |
  | content[].twoFactorAuthentication | null | 360 |
  | content[].username | string | 360 |
  | ... | 147 weitere | |

### User/Workspace: workspaces

- Samples: 347
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/userservice/workspaces
  - GET /apigateway/userservice/workspaces/[REDACTED]
  - POST /apigateway/userservice/workspaces/log
  - POST /apigateway/workspaces
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | autoOpenCashDrawer | boolean | 154 |
  | barverkaufAccountId | null | 154 |
  | brandName | null | 154 |
  | cashSystemActive | boolean | 154 |
  | certificate | null | 154 |
  | content | array | 5 |
  | content[].autoOpenCashDrawer | boolean | 25 |
  | content[].barverkaufAccountId | null, string | 25 |
  | content[].brandName | null, string | 25 |
  | content[].cashSystemActive | boolean | 25 |
  | content[].certificate | null | 25 |
  | content[].dakotaActive | boolean | 25 |
  | content[].dakotaExePath | null | 25 |
  | content[].dakotaInputDirectory | null | 25 |
  | content[].defaultLineDisplayText | null | 25 |
  | content[].filialeId | string | 25 |
  | content[].id | string | 25 |
  | content[].isLineDisplayConnected | boolean | 25 |
  | content[].kasseneinnahmenAccountId | null | 25 |
  | content[].kassenentnahmenAccountId | null | 25 |
  | content[].kassenfehlbetraegeId | null | 25 |
  | content[].kassenueberschuesseId | null | 25 |
  | content[].medilogicActive | boolean | 25 |
  | content[].medilogicAppPath | null | 25 |
  | content[].medilogicFilename | null | 25 |
  | content[].medilogicTransferDirectory | null | 25 |
  | content[].modelName | null, string | 25 |
  | content[].prescriptionPosPrinterName | null | 25 |
  | content[].prescriptionPrinterId | null, string | 25 |
  | content[].prescriptionPrinterName | null, string | 25 |
  | content[].printerConnectionType | null | 25 |
  | content[].receiptPosPrinterName | null | 25 |
  | content[].receiptPrinterId | null, string | 25 |
  | content[].receiptPrinterName | null, string | 25 |
  | content[].rothballerActive | boolean | 25 |
  | content[].rothballerAppPath | null | 25 |
  | content[].rothballerAutoimportImages | boolean | 25 |
  | content[].rothballerCustomerGroups | string | 25 |
  | content[].rothballerFilename | null | 25 |
  | content[].rothballerTransferDirectory | null | 25 |
  | ... | 91 weitere | |

### User/Workspace: feature-toggles

- Samples: 184
- Quellen: response
- Endpunkte:
  - GET /apigateway/userservice/feature-toggles
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | activeFeatureToggles | array | 184 |
  | activeFeatureToggles[] | string | 920 |
  | contextAdditionalHide | object | 184 |
  | contextAdditionalHide.FILE_STORAGE_OPTIONAL | array | 184 |
  | contextAdditionalHide.FILE_STORAGE_OPTIONAL[] | array | 184 |
  | contextAdditionalHide.FILE_STORAGE_OPTIONAL[][] | string | 368 |
  | contextAdditionalHide.GUTSCHEIN | array | 184 |
  | contextAdditionalHide.GUTSCHEIN[] | array | 184 |
  | contextAdditionalHide.GUTSCHEIN[][] | string | 368 |
  | contextAdditionalHide.PZN | array | 184 |
  | contextAdditionalHide.PZN[] | array | 184 |
  | contextAdditionalHide.PZN[][] | string | 368 |
  | inactiveFeatureToggles | array | 184 |
  | inactiveFeatureToggles[] | string | 920 |
  | navigationIdentifiersToHideIfFeatureDisabled | object | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.ARCHIVED_SALES_PROCESS | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.ARCHIVED_SALES_PROCESS[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.COLLECTIVE_INVOICE | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.COLLECTIVE_INVOICE[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.CONTRACTS_READ | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.CONTRACTS_READ[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.DAUERVERSORGUNG | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.DAUERVERSORGUNG[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.ELEARNING | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.ELEARNING[] | string | 368 |
  | navigationIdentifiersToHideIfFeatureDisabled.FILE_STORAGE_OPTIONAL | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.FORMULAR_GENERATOR_MANDANT | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.FORMULAR_GENERATOR_MANDANT[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.GUTSCHEIN | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.GUTSCHEIN[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.HMV | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.HMV[] | string | 368 |
  | navigationIdentifiersToHideIfFeatureDisabled.PZN | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.PZN[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.TI_KIM | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.TI_KIM[] | string | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.VORGANGSSTATISTIK | array | 184 |
  | navigationIdentifiersToHideIfFeatureDisabled.VORGANGSSTATISTIK[] | string | 184 |
  | toggleType | object | 184 |
  | toggleType.AGE_GROUPS | string | 184 |
  | ... | 82 weitere | |

### User/Workspace: navigation

- Samples: 139
- Quellen: response
- Endpunkte:
  - GET /apigateway/navigation/navigations/details
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].app | boolean | 417 |
  | [].backgroundClass | string | 417 |
  | [].children | array | 417 |
  | [].children[].app | boolean | 695 |
  | [].children[].backgroundClass | string | 695 |
  | [].children[].children | array | 695 |
  | [].children[].children[].app | boolean | 2085 |
  | [].children[].children[].backgroundClass | string | 2085 |
  | [].children[].children[].children | array | 2085 |
  | [].children[].children[].children[].app | boolean | 695 |
  | [].children[].children[].children[].backgroundClass | string | 695 |
  | [].children[].children[].children[].children | array | 695 |
  | [].children[].children[].children[].icon | string | 695 |
  | [].children[].children[].children[].iconClass | string | 695 |
  | [].children[].children[].children[].identifier | string | 695 |
  | [].children[].children[].children[].name | string | 695 |
  | [].children[].children[].children[].parentIdentifier | string | 695 |
  | [].children[].children[].children[].permissionIdentifier | string | 695 |
  | [].children[].children[].children[].url | string | 695 |
  | [].children[].children[].icon | string | 2085 |
  | [].children[].children[].iconClass | string | 2085 |
  | [].children[].children[].identifier | string | 2085 |
  | [].children[].children[].name | string | 2085 |
  | [].children[].children[].parentIdentifier | string | 2085 |
  | [].children[].children[].permissionIdentifier | string | 2085 |
  | [].children[].children[].url | string | 2085 |
  | [].children[].icon | string | 695 |
  | [].children[].iconClass | string | 695 |
  | [].children[].identifier | string | 695 |
  | [].children[].name | string | 695 |
  | [].children[].parentIdentifier | string | 695 |
  | [].children[].permissionIdentifier | string | 695 |
  | [].children[].url | string | 695 |
  | [].icon | string | 417 |
  | [].iconClass | string | 417 |
  | [].identifier | string | 417 |
  | [].name | string | 417 |
  | [].parentIdentifier | null | 417 |
  | [].permissionIdentifier | null, string | 417 |
  | [].url | string | 417 |

### User/Workspace: metrics

- Samples: 81
- Quellen: request
- Endpunkte:
  - POST /apigateway/userservice/metrics/user-login
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | tenantId | string | 81 |
  | tokenDuration | number, string | 81 |
  | totalDuration | number | 81 |
  | userDetailsDuration | number | 81 |
  | username | string | 81 |

### User/Workspace: user-details

- Samples: 65
- Quellen: response
- Endpunkte:
  - GET /apigateway/user-details
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | dashboardId | null | 65 |
  | email | null, string | 65 |
  | favoriteAppIds | array | 65 |
  | favoriteAppIds[] | string | 48 |
  | firstName | string | 65 |
  | lastName | string | 65 |
  | messageBrokerHost | string | 65 |
  | messageBrokerPort | string | 65 |
  | messageBrokerSecret | string | 65 |
  | messageBrokerUser | string | 65 |
  | permissions | array | 65 |
  | permissions[] | string | 325 |
  | profileImageId | null | 65 |
  | status | string | 65 |
  | tenantId | string | 65 |
  | userId | string | 65 |
  | userResponseQueue | string | 65 |
  | workspaceFilialeId | string | 65 |
  | workspaceId | string | 65 |
  | workspaceStandardIkId | string | 65 |

### Warenwirtschaft/Bestellung: orders

- Samples: 158
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/wawi/orders/[REDACTED]
  - GET /apigateway/wawi/orders/[REDACTED]/positions
  - GET /apigateway/wawi/orders/{uuid}
  - GET /apigateway/wawi/orders/{uuid}/positions
  - GET /apigateway/wawiservice/orders/customer/[REDACTED]/order-ids
  - POST /apigateway/wawi/orders/[REDACTED]/email
  - POST /apigateway/wawi/orders/[REDACTED]/process-order
  - POST /apigateway/wawi/orders/from-proposal
  - POST /apigateway/wawi/orders/search
  - POST /apigateway/wawi/orders/{uuid}/process-order
  - ... 1 weitere
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | string | 22 |
  | [].arrivalBookingState | string | 35 |
  | [].articleArticleNr | string | 35 |
  | [].articleArticleSize | null, string | 35 |
  | [].articleBarcodeNr | null | 35 |
  | [].articleColor | null, string | 35 |
  | [].articleDescription | string | 35 |
  | [].articleEanCode | null, string | 35 |
  | [].articleId | string | 35 |
  | [].articleMaterialGroupId | null, string | 35 |
  | [].articleProducerLabel | string | 35 |
  | [].articleSide | null | 35 |
  | [].articleStockRequiredFields | array | 35 |
  | [].costCenterDescription | null | 35 |
  | [].costCenterId | null | 35 |
  | [].costCenterNumber | null | 35 |
  | [].customerId | null, string | 35 |
  | [].customerName | null, string | 35 |
  | [].filialeId | string | 35 |
  | [].filialeName | string | 35 |
  | [].id | string | 35 |
  | [].immutable | boolean | 35 |
  | [].kvNumber | null | 35 |
  | [].orderArrivalDate | null, string | 35 |
  | [].orderId | string | 35 |
  | [].orderNr | null, string | 35 |
  | [].orderProposalIds | array | 35 |
  | [].orderProposalIds[] | string | 24 |
  | [].orderQuantity | number | 35 |
  | [].orderQuantityUnit | string | 35 |
  | [].orderQuantityUnitSize | number | 35 |
  | [].orderValue | number | 35 |
  | [].priceData | object | 35 |
  | [].priceData.bulkPrices | array | 35 |
  | [].priceData.discount | null | 35 |
  | [].priceData.purchasePrice | null, number | 35 |
  | [].priceData.purchasePriceActual | null, number | 35 |
  | [].remainingInvoiceQuantity | number | 35 |
  | [].remainingQuantity | number | 35 |
  | [].rowPosition | number | 35 |
  | ... | 173 weitere | |

### Warenwirtschaft/Bestellung: order-arrival

- Samples: 140
- Quellen: request, response
- Endpunkte:
  - POST /apigateway/wawi/order-arrival/position-info
  - POST /apigateway/wawi/order-arrival/search
  - POST /apigateway/wawiservice/order-arrival/book
  - POST /apigateway/wawiservice/order-arrival/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [].active | boolean | 3 |
  | [].billingAddressId | null | 3 |
  | [].comment | null | 3 |
  | [].companyEmail | null | 3 |
  | [].companyEmailBranchId | null | 3 |
  | [].companyFaxConnection | null | 3 |
  | [].companyFaxConnectionBranchId | null | 3 |
  | [].companyPhoneNumber | null | 3 |
  | [].companyPhoneNumberBranchId | null | 3 |
  | [].costCenterId | null | 3 |
  | [].customerDeliveryAddressId | null | 3 |
  | [].customerId | null | 3 |
  | [].customerPhoneNumber | null | 3 |
  | [].deliveryAddressId | null | 3 |
  | [].deliveryDate | null, string | 3 |
  | [].deliveryDateScheduled | null | 3 |
  | [].deliveryNumber | null | 3 |
  | [].deliveryTermsId | null | 3 |
  | [].desiredDate | null | 3 |
  | [].editorId | string | 3 |
  | [].editorName | string | 3 |
  | [].filialeId | string | 3 |
  | [].filialeName | string | 3 |
  | [].id | string | 3 |
  | [].invoiceStatus | null | 3 |
  | [].mailFooter | null | 3 |
  | [].mailHeader | null | 3 |
  | [].number | string | 3 |
  | [].orderArrivalBookingState | string | 3 |
  | [].orderDate | string | 3 |
  | [].orderingPlatform | string | 3 |
  | [].orderQuantity | number | 3 |
  | [].orderStateDescription | null, string | 3 |
  | [].orderStateId | null, string | 3 |
  | [].orderType | null | 3 |
  | [].orderValue | number | 3 |
  | [].paymentTermsId | null | 3 |
  | [].stockLocationId | null | 3 |
  | [].sumInvoiceAmountNet | null | 3 |
  | [].supplierAddressId | null | 3 |
  | ... | 211 weitere | |

### Warenwirtschaft/Bestellung: supplier

- Samples: 135
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/supplier/suppliers
  - GET /apigateway/supplier/suppliers/[REDACTED]
  - GET /apigateway/supplier/suppliers/[REDACTED]/addresses
  - GET /apigateway/supplier/suppliers/[REDACTED]/contact-opportunities
  - GET /apigateway/supplier/suppliers/[REDACTED]/contacts
  - GET /apigateway/supplier/suppliers/[REDACTED]/customers
  - GET /apigateway/supplier/suppliers/search
  - POST /apigateway/supplier/suppliers/list
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | string | 4 |
  | [].active | boolean | 29 |
  | [].additionalInfo | string | 3 |
  | [].addressAdditional | null | 13 |
  | [].addressType | string | 13 |
  | [].city | string | 13 |
  | [].commercialRegisterNumber | null | 3 |
  | [].countryId | string | 13 |
  | [].creditLine | null | 13 |
  | [].customerNumber | string | 13 |
  | [].customerNumberCare | null | 13 |
  | [].customerNumberEkTeam | null | 13 |
  | [].customerNumberEkTeamPlus | null | 13 |
  | [].customerNumberOrtho | null | 13 |
  | [].customerNumberReha | null | 13 |
  | [].customerNumberSani | null | 13 |
  | [].customerNumberSmile | null | 13 |
  | [].deliveryTermsId | null | 13 |
  | [].description | null, string | 26 |
  | [].email | string | 16 |
  | [].faxConnection | string | 3 |
  | [].fiBuAccountNumber | null | 3 |
  | [].filialeIds | array | 13 |
  | [].filialeIds[] | string | 2 |
  | [].firstName | string | 13 |
  | [].freeOfChargeDeliveryQuantity | null | 13 |
  | [].freeOfChargeDeliveryValue | null | 13 |
  | [].houseNumber | string | 13 |
  | [].id | string | 42 |
  | [].industryId | null | 3 |
  | [].lastName | string | 13 |
  | [].mainAddress | boolean | 13 |
  | [].minimumOrderQuantity | null | 13 |
  | [].minimumOrderValue | null, number | 13 |
  | [].name | string | 3 |
  | [].orderingPlatforms | array | 3 |
  | [].paymentTermsId | null | 13 |
  | [].phoneNumbers | array | 16 |
  | [].phoneNumbers[].id | string | 16 |
  | [].phoneNumbers[].phoneNumber | string | 16 |
  | ... | 147 weitere | |

### Warenwirtschaft/Bestellung: order-proposals

- Samples: 126
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/wawi/order-proposals/[REDACTED]
  - POST /apigateway/wawi/order-proposals
  - POST /apigateway/wawi/order-proposals/search
  - POST /apigateway/wawi/order-proposals/search/sums
  - POST /apigateway/wawi/order-proposals/to-order
  - PUT /apigateway/wawi/order-proposals/[REDACTED]
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | [] | string | 10 |
  | active | boolean | 41 |
  | articleColor | null | 16 |
  | articleDescription | null, string | 16 |
  | articleId | string | 24 |
  | articleMaxQuantity | null | 16 |
  | articleMengenGebinde | null | 3 |
  | articleMinQuantity | null | 16 |
  | articleNumber | null, string | 16 |
  | articleOrigin | string | 24 |
  | articleProducerDescription | null, string | 16 |
  | articleProducerId | null, string | 16 |
  | articleSide | null | 16 |
  | articleSize | null | 16 |
  | changeDate | null | 3 |
  | changedBy | string | 13 |
  | changedDate | string | 13 |
  | changeUser | null | 3 |
  | comment | null, string | 24 |
  | content | array | 31 |
  | content[].articleColor | null, string | 28 |
  | content[].articleDescription | string | 28 |
  | content[].articleId | string | 28 |
  | content[].articleMaxQuantity | null | 28 |
  | content[].articleMinQuantity | null, number | 28 |
  | content[].articleNumber | string | 28 |
  | content[].articleOrigin | string | 28 |
  | content[].articleProducerDescription | null, string | 28 |
  | content[].articleProducerId | null, string | 28 |
  | content[].articleSide | null | 28 |
  | content[].articleSize | null, string | 28 |
  | content[].changedBy | string | 28 |
  | content[].changedDate | string | 28 |
  | content[].comment | null, string | 28 |
  | content[].createdBy | string | 28 |
  | content[].createdDate | string | 28 |
  | content[].customerFirstName | string | 28 |
  | content[].customerId | string | 28 |
  | content[].customerLastName | string | 28 |
  | content[].customerName | string | 28 |
  | ... | 86 weitere | |

### Warenwirtschaft/Bestellung: storage-locations

- Samples: 76
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawi/storage-locations
  - GET /apigateway/wawi/storage-locations/[REDACTED]
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | active | boolean | 3 |
  | branches | array | 3 |
  | branches[].id | string | 3 |
  | branches[].name | string | 3 |
  | content | array | 73 |
  | content[].active | boolean | 73 |
  | content[].branches | array | 73 |
  | content[].branches[].id | string | 73 |
  | content[].branches[].name | string | 73 |
  | content[].description | string | 73 |
  | content[].displayId | string | 73 |
  | content[].filialeIds | array | 73 |
  | content[].filialeIds[] | string | 73 |
  | content[].id | string | 73 |
  | content[].reserved | boolean | 73 |
  | content[].stockType | string | 73 |
  | content[].stockTypeLabel | string | 73 |
  | description | string | 3 |
  | displayId | string | 3 |
  | empty | boolean | 73 |
  | filialeIds | array | 3 |
  | filialeIds[] | string | 3 |
  | first | boolean | 73 |
  | id | string | 3 |
  | last | boolean | 73 |
  | number | number | 73 |
  | numberOfElements | number | 73 |
  | pageable | object | 73 |
  | pageable.offset | number | 73 |
  | pageable.paged | boolean | 73 |
  | pageable.pageNumber | number | 73 |
  | pageable.pageSize | number | 73 |
  | pageable.sort | array | 73 |
  | pageable.sort[].ascending | boolean | 73 |
  | pageable.sort[].descending | boolean | 73 |
  | pageable.sort[].direction | string | 73 |
  | pageable.sort[].ignoreCase | boolean | 73 |
  | pageable.sort[].nullHandling | string | 73 |
  | pageable.sort[].property | string | 73 |
  | pageable.unpaged | boolean | 73 |
  | ... | 13 weitere | |

### Warenwirtschaft/Bestellung: order-states

- Samples: 48
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawi/order-states
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 48 |
  | content[].active | boolean | 152 |
  | content[].comment | null, string | 152 |
  | content[].description | string | 152 |
  | content[].hidden | boolean | 152 |
  | content[].id | string | 152 |
  | content[].standard | boolean | 152 |
  | empty | boolean | 48 |
  | first | boolean | 48 |
  | last | boolean | 48 |
  | number | number | 48 |
  | numberOfElements | number | 48 |
  | pageable | object | 48 |
  | pageable.offset | number | 48 |
  | pageable.paged | boolean | 48 |
  | pageable.pageNumber | number | 48 |
  | pageable.pageSize | number | 48 |
  | pageable.sort | array | 48 |
  | pageable.sort[].ascending | boolean | 48 |
  | pageable.sort[].descending | boolean | 48 |
  | pageable.sort[].direction | string | 48 |
  | pageable.sort[].ignoreCase | boolean | 48 |
  | pageable.sort[].nullHandling | string | 48 |
  | pageable.sort[].property | string | 48 |
  | pageable.unpaged | boolean | 48 |
  | size | number | 48 |
  | sort | array | 48 |
  | sort[].ascending | boolean | 48 |
  | sort[].descending | boolean | 48 |
  | sort[].direction | string | 48 |
  | sort[].ignoreCase | boolean | 48 |
  | sort[].nullHandling | string | 48 |
  | sort[].property | string | 48 |
  | totalElements | number | 48 |
  | totalPages | number | 48 |

### Warenwirtschaft/Bestellung: delivery-terms

- Samples: 47
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawi/delivery-terms/search
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 47 |
  | empty | boolean | 47 |
  | first | boolean | 47 |
  | last | boolean | 47 |
  | number | number | 47 |
  | numberOfElements | number | 47 |
  | pageable | object | 47 |
  | pageable.offset | number | 47 |
  | pageable.paged | boolean | 47 |
  | pageable.pageNumber | number | 47 |
  | pageable.pageSize | number | 47 |
  | pageable.sort | array | 47 |
  | pageable.sort[].ascending | boolean | 47 |
  | pageable.sort[].descending | boolean | 47 |
  | pageable.sort[].direction | string | 47 |
  | pageable.sort[].ignoreCase | boolean | 47 |
  | pageable.sort[].nullHandling | string | 47 |
  | pageable.sort[].property | string | 47 |
  | pageable.unpaged | boolean | 47 |
  | size | number | 47 |
  | sort | array | 47 |
  | sort[].ascending | boolean | 47 |
  | sort[].descending | boolean | 47 |
  | sort[].direction | string | 47 |
  | sort[].ignoreCase | boolean | 47 |
  | sort[].nullHandling | string | 47 |
  | sort[].property | string | 47 |
  | totalElements | number | 47 |
  | totalPages | number | 47 |

### Warenwirtschaft/Bestellung: cost-centers

- Samples: 29
- Quellen: response
- Endpunkte:
  - GET /apigateway/wawi/cost-centers
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | content | array | 29 |
  | content[].active | boolean | 29 |
  | content[].branches | array | 29 |
  | content[].branches[].id | string | 29 |
  | content[].branches[].name | string | 29 |
  | content[].branchesNames | string | 29 |
  | content[].comment | null | 29 |
  | content[].costCenterNumber | string | 29 |
  | content[].description | string | 29 |
  | content[].id | string | 29 |
  | empty | boolean | 29 |
  | first | boolean | 29 |
  | last | boolean | 29 |
  | number | number | 29 |
  | numberOfElements | number | 29 |
  | pageable | object | 29 |
  | pageable.offset | number | 29 |
  | pageable.paged | boolean | 29 |
  | pageable.pageNumber | number | 29 |
  | pageable.pageSize | number | 29 |
  | pageable.sort | array | 29 |
  | pageable.sort[].ascending | boolean | 29 |
  | pageable.sort[].descending | boolean | 29 |
  | pageable.sort[].direction | string | 29 |
  | pageable.sort[].ignoreCase | boolean | 29 |
  | pageable.sort[].nullHandling | string | 29 |
  | pageable.sort[].property | string | 29 |
  | pageable.unpaged | boolean | 29 |
  | size | number | 29 |
  | sort | array | 29 |
  | sort[].ascending | boolean | 29 |
  | sort[].descending | boolean | 29 |
  | sort[].direction | string | 29 |
  | sort[].ignoreCase | boolean | 29 |
  | sort[].nullHandling | string | 29 |
  | sort[].property | string | 29 |
  | totalElements | number | 29 |
  | totalPages | number | 29 |

### Warenwirtschaft/Bestellung: stock-items

- Samples: 5
- Quellen: request, response
- Endpunkte:
  - GET /apigateway/wawi/stock-items
  - GET /apigateway/wawi/stock-items/search
  - POST /apigateway/wawiservice/stock-items/count-article-quantities
- Felder:
  | Feld | Typen | Samples |
  |---|---|---:|
  | articleIds | array | 1 |
  | articleIds[] | string | 2 |
  | content | array | 4 |
  | content[].active | boolean | 15 |
  | content[].articleColor | null | 15 |
  | content[].articleComment | null, string | 15 |
  | content[].articleDateBestBefore | null | 15 |
  | content[].articleDescription | string | 15 |
  | content[].articleEanCode | null, string | 15 |
  | content[].articleId | string | 15 |
  | content[].articleMaterialGroupDescription | null, string | 15 |
  | content[].articleMaterialGroupId | null, string | 15 |
  | content[].articleMaterialGroupNumber | null, string | 15 |
  | content[].articleNumber | string | 15 |
  | content[].articleOrigin | string | 15 |
  | content[].articleQuantityEntryYearsList | array | 15 |
  | content[].articleQuantityEntryYearsList[].entryYear | number | 15 |
  | content[].articleQuantityEntryYearsList[].id | string | 15 |
  | content[].articleQuantityEntryYearsList[].quantity | number | 15 |
  | content[].articleQuantityId | string | 15 |
  | content[].articleSide | null | 15 |
  | content[].articleSize | null | 15 |
  | content[].charge | null | 15 |
  | content[].netPurchasingPrice | null, number | 15 |
  | content[].quantity | number | 15 |
  | content[].serialNumber | null | 15 |
  | content[].storageLocationDescription | string | 15 |
  | content[].storageLocationDisplayId | string | 15 |
  | content[].storageLocationFiliale | object | 15 |
  | content[].storageLocationFiliale.id | string | 15 |
  | content[].storageLocationFiliale.name | string | 15 |
  | content[].storageLocationId | string | 15 |
  | empty | boolean | 4 |
  | filialeId | string | 1 |
  | first | boolean | 4 |
  | includeReserved | boolean | 1 |
  | last | boolean | 4 |
  | number | number | 4 |
  | numberOfElements | number | 4 |
  | pageable | object | 4 |
  | ... | 22 weitere | |

