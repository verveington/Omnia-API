# Write-Lab Report

Szenario: `sales-process-add-article-position`
Status: completed
Start: 2026-06-07T17:15:13.856Z
Ende: 2026-06-07T17:15:29.084Z
Testkunde: [REDACTED]
Testartikel: Musterartikel

## Ergebnis

- Abbruchgrund: keiner
- Erzeugte IDs: `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","salesPositionId":"1026d330-ef93-4edb-903d-f19943ccc680","salesMaterialPositionId":"bf82c1ea-4932-44d2-ab5d-b58a06be8518","proposalId":"91170f8e-[REDACTED]-822f-dee2420bc608","orderId":"065d83b4-a0ba-4e6d-9668-f91718bf638b","orderDocumentId":"86e7622b-b6ec-43d0-9faf-830389292c9e"}`

## Schritte

| Schritt | Endpoint | Status | Testobjekt-Zuordnung | Erzeugte IDs | Read-back | Abbruchgrund |
|---|---|---|---|---|---|---|
| [REDACTED] | - | ok | `{}` | `{}` | Aktive Omnia-Sitzung wird fuer authentifizierte Browser-Requests und UI-Klicks verwendet. | - |
| [REDACTED] | GET /apigateway/kunden/customers/search | ok | `{"customerId":"[REDACTED]","match":"exact","lookupKeyword":"[REDACTED]","candidateCount":1}` | `{}` | Kunde eindeutig aufgeloest. | - |
| [REDACTED] | POST /apigateway/sales/salesprocesses/search | ok | `{"customerId":"[REDACTED]","beforeCount":20}` | `{"beforeSalesProcessIds":["df73d98d-c4dd-4cc0-b595-e74dbe7ffe4e","5e0d7737-22e4-4eb4-9efa-43270bbc733f","289eff6f-1aa9-4baa-a556-3d9bdb4b44f0","aeced16d-8aa2-4848-997c-0271ed1ac33f","b8371490-8e1d-418f-abd5-63d82721300c","e5711505-fd0d-4ac4-8291-f3c37ea914fa","ebc800d7-94f8-4a54-b4bb-c05b68f111a5","3ef5b6e0-f181-[REDACTED]-be5842a077fe","6635c742-9c08-4c6e-a693-52ada7f2905e","33f766ba-98c5-4ae7-b43c-80236774115b","a5ad6206-7c26-40b3-bdf7-02151daddc51","40f6ec5f-d4a7-444c-a5d9-f5e95b30ec87","a81fe53e-bb57-499d-9694-91a6353e5d69","edd0977d-4aaa-48be-b5b9-104385f397ee","9a835e1c-bb4a-4c12-88a7-96b281bf5943","d8f6f7cb-7ad7-4f97-a792-77c02b35a810","7b24c0cc-e7ac-4d7c-8d8b-79f4a550f2a3","9fc7702c-ce22-4410-b1cd-de87f284a0d3","a6bb0421-be24-4881-a978-0c8730260f51","8d504e46-8cb7-499b-b857-3d9bb4ac7fd3"]}` | Vorheriger Vorgangsbestand fuer den Musterkunden wurde gemerkt. | - |
| [REDACTED] | /master-data/customers/08901aa6-8c23-4e1b-8c61-109a8573feeb | ok | `{"customerId":"[REDACTED]"}` | `{}` | Kundendetail wurde vor dem Write-Klick geoeffnet. | - |
| [REDACTED] | UI tab Historie | ok | `{"customerId":"[REDACTED]"}` | `{}` | Historie-Tab des Musterkunden ist aktiv. | - |
| [REDACTED] | UI button Neuer Vorgang | ok | `{"customerId":"[REDACTED]","beforeCount":20}` | `{}` | Der UI-Write-Klick wurde nur im eindeutig geoeffneten Musterkunden-Kontext ausgefuehrt. | - |
| [REDACTED] | UI button Speichern & schließen | ok | `{"customerId":"[REDACTED]"}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc"}` | Der neue Vorgangsentwurf wurde gespeichert; die Create-Response-ID wurde gemerkt. | - |
| [REDACTED] | POST /apigateway/sales/salesprocesses/search | ok | `{"customerId":"[REDACTED]","responseSalesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc"}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc"}` | Neuer Vorgang wurde ueber die Create-Response erkannt. | - |
| [REDACTED] | GET /apigateway/sales/salesprocesses/48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc | ok | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","customerId":"[REDACTED]","filialeId":"7e9cb8bf-e1c0-48d6-89c2-b05f3c2713f9","positionCount":0,"materialPositionCount":0}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc"}` | Read-back bestaetigt den Kundenbezug des neu erkannten Vorgangs. | - |
| [REDACTED] | GET /apigateway/kunden/customers/search | ok | `{"customerId":"[REDACTED]","match":"exact","lookupKeyword":"[REDACTED]","candidateCount":1}` | `{}` | Kunde vor dem Positionswrite erneut eindeutig aufgeloest. | - |
| [REDACTED] | GET /apigateway/sales/salesprocesses/48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc | ok | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","customerId":"[REDACTED]","filialeId":"7e9cb8bf-e1c0-48d6-89c2-b05f3c2713f9","positionCount":0,"materialPositionCount":0}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc"}` | Neu angelegter Vorgang ist leer und gehoert zum Musterkunden. | - |
| [REDACTED] | POST /apigateway/articletenantservice/articles/simple-search | ok | `{"articleId":"710f2668-3802-47d2-960a-059483daf5ad","articleNumber":"Musterartikel","match":"exact"}` | `{}` | Artikel eindeutig fuer den Vorgang aufgeloest. | - |
| [REDACTED] | POST /apigateway/pricingservice/sales-positions | ok | `{"salesPositionId":"710f2668-3802-47d2-960a-059483daf5ad","articleId":"710f2668-3802-47d2-960a-059483daf5ad","articleNumber":"Musterartikel","amount":5,"unit":"PIECE","rowPosition":0}` | `{}` | Pricingservice hat genau eine Musterartikel-Position geliefert. | - |
| [REDACTED] | POST /apigateway/sales/salesprocesses/calculate-prices | ok | `{"salesPositionId":"bb585f9c-77b2-45e4-8989-cdf1d5f5e6a6","articleId":"710f2668-3802-47d2-960a-059483daf5ad","articleNumber":"Musterartikel","amount":5,"unit":"PIECE","rowPosition":0}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","quantity":5}` | Preisberechnung enthaelt genau die Musterartikel-Position mit Menge 5 und eine Materialposition. | - |
| [REDACTED] | PUT /apigateway/sales/salesprocesses/48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc | ok | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","customerId":"[REDACTED]","filialeId":"7e9cb8bf-e1c0-48d6-89c2-b05f3c2713f9","positionCount":1,"materialPositionCount":1}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc"}` | Vorgang wurde erst nach Preisberechnung und Testobjekt-Pruefung gespeichert. | - |
| [REDACTED] | GET /apigateway/sales/salesprocesses/48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc | ok | `{"salesPositionId":"1026d330-ef93-4edb-903d-f19943ccc680","articleId":"710f2668-3802-47d2-960a-059483daf5ad","articleNumber":"Musterartikel","amount":5,"unit":"PIECE","rowPosition":0}` | `{"salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","salesPositionId":"1026d330-ef93-4edb-903d-f19943ccc680","salesMaterialPositionId":"bf82c1ea-4932-44d2-ab5d-b58a06be8518"}` | Read-back bestaetigt Musterkunde, Musterartikel, Menge 5 und Materialposition. | - |
| [REDACTED] | - | ok | `{}` | `{}` | Aktive Omnia-Sitzung wird fuer authentifizierte Browser-Requests verwendet. | - |
| [REDACTED] | GET /apigateway/kunden/customers/search | ok | `{"customerId":"[REDACTED]","match":"exact","lookupKeyword":"[REDACTED]","candidateCount":1}` | `{}` | Kunde eindeutig aufgeloest. | - |
| [REDACTED] | POST /apigateway/sales/salesprocesses/search | ok | `{"customerId":"[REDACTED]","salesProcessId":"48e0a5a7-ebc1-4f80-9213-dcd6f0b556bc","filialeId":"7e9cb8bf-e1c0-48d6-89c2-b05f3c2713f9","candidateCount":10,"selectionStrategy":"preferred-sales-process"}` | `{}` | Mehrere Testkunden-Vorgaenge gefunden; neuester aktiver Vorgang mit Filiale wurde deterministisch gewaehlt. | - |
| [REDACTED] | POST /apigateway/articletenantservice/articles/simple-search | ok | `{"articleId":"710f2668-3802-47d2-960a-059483daf5ad","match":"exact","supplierId":"f38f0e8b-c90d-4fd0-b5b4-849abb72ab17","pzn":"","unit":""}` | `{}` | Artikel eindeutig aufgeloest; Detailkontext wurde soweit moeglich geladen. | - |
| [REDACTED] | POST /apigateway/wawi/order-proposals/search | skipped | `{}` | `{}` | Kein bestehender Bestellvorschlag fuer Musterkunde und Musterartikel gefunden. | - |
| [REDACTED] | POST /apigateway/wawi/order-proposals | ok | `{"proposalId":"91170f8e-[REDACTED]-822f-dee2420bc608","customerId":"[REDACTED]","articleId":"710f2668-3802-47d2-960a-059483daf5ad","supplierId":"f38f0e8b-c90d-4fd0-b5b4-849abb72ab17","pzn":"","unit":"PIECE","quantity":5}` | `{"proposalId":"91170f8e-[REDACTED]-822f-dee2420bc608"}` | Test-Bestellvorschlag wurde erzeugt. | - |
| [REDACTED] | - | ok | `{"proposalId":"91170f8e-[REDACTED]-822f-dee2420bc608","customerId":"[REDACTED]","articleId":"710f2668-3802-47d2-960a-059483daf5ad","supplierId":"f38f0e8b-c90d-4fd0-b5b4-849abb72ab17","pzn":"","unit":"PIECE","quantity":5}` | `{}` | Lieferant, PZN, Einheit, Menge und Testobjekt-Bezug sind plausibel. | - |
| [REDACTED] | POST /apigateway/wawi/order-proposals/to-order | ok | `{}` | `{"proposalIds":["91170f8e-[REDACTED]-822f-dee2420bc608"]}` | Omnia hat die explizite Vorschlagsauswahl vorbereitet. | - |
| [REDACTED] | POST /apigateway/wawi/orders/from-proposal | ok | `{}` | `{"orderId":"065d83b4-a0ba-4e6d-9668-f91718bf638b"}` | Bestellung erzeugt; Read-back steht noch aus. | - |
| [REDACTED] | GET /apigateway/wawi/orders/065d83b4-a0ba-4e6d-9668-f91718bf638b | ok | `{}` | `{"orderId":"065d83b4-a0ba-4e6d-9668-f91718bf638b","positionCount":1}` | Bestellung und Positionen passen zum Musterartikel und zur Lieferantengruppe. | - |
| [REDACTED] | POST /apigateway/wawi/orders/065d83b4-a0ba-4e6d-9668-f91718bf638b/process-order | ok | `{}` | `{"orderId":"065d83b4-a0ba-4e6d-9668-f91718bf638b","orderDocumentId":"86e7622b-b6ec-43d0-9faf-830389292c9e"}` | process-order wurde erst nach eindeutigem Read-back ausgefuehrt. | - |
| [REDACTED] | POST /apigateway/wawi/orders/065d83b4-a0ba-4e6d-9668-f91718bf638b/email | skipped | `{}` | `{}` | Uebersprungen, weil --prepare-mail nicht gesetzt ist. | - |
| [REDACTED] | POST /apigateway/wawi/order-arrival/search | skipped | `{}` | `{}` | Uebersprungen, weil --allow-goods-receipt nicht gesetzt ist. | - |

## Guardrails

- Keine Deletes, Stornos, Imports oder Uploads.
- Selection-Writes nur mit `includeAll:false` und expliziten IDs.
- Keine externe E-Mail; Mail/PDF nur lokale Vorbereitung mit expliziter Freigabe.
- `process-order` erst nach eindeutigem Read-back der erzeugten Bestellung.
