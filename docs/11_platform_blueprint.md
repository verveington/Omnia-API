# Plattform-Blueprint

Generiert: 2026-06-09T20:51:35.065Z
Knowledge-Stand: 2026-06-09T20:51:34.886Z

Hinweis: Dieser Blueprint ist eine Ableitung aus redacted API-Aufzeichnungen und statischem Endpoint-Inventar. Er ist eine Bau- und Recording-Priorisierung, keine fertige Fachspezifikation.

## Zusammenfassung

- Module: 33
- Inventar-Coverage: 26.35 %
- Known/Observed/Missing: 501 / 132 / 369

## MVP-Reihenfolge

| Reihenfolge | Stufe | Modul | Fachbereich | Confidence | Known/Observed/Missing | Warum |
|---:|---|---|---|---|---|---|
| 1 | foundation | Mandant, Benutzer und Rechte | User/Workspace | high | 17 / 11 / 6 | Ausreichend beobachtet fuer ersten Plattform-Schnitt. |
| 2 | foundation | Organisation und Filialen | Filialen/Mandant | high | 67 / 11 / 56 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 3 | foundation | Referenzdaten und Konfiguration | Referenzdaten | high | 3 / 3 / 0 | Ausreichend beobachtet fuer ersten Plattform-Schnitt. |
| 4 | mvp | Kundenakte und Vorgangsmanagement | Kunden/Vorgaenge | high | 102 / 34 / 68 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 5 | mvp | Beschaffung und Bestellung | Warenwirtschaft/Bestellung | high | 34 / 17 / 17 | Ausreichend beobachtet fuer ersten Plattform-Schnitt. |
| 6 | mvp | Abrechnung und Kasse | Abrechnung/Kasse | high | 41 / 5 / 36 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 7 | mvp | Artikelkatalog und Bestand | Artikel/Warenbestand | high | 49 / 15 / 34 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 8 | later | Kommunikation und Aufgaben | Kommunikation/Aufgaben | high | 26 / 10 / 16 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 9 | later | Dokumente und Archiv | Dokumente/Archiv | high | 38 / 8 / 30 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 10 | later | apigateway | apigateway | high | 0 / 0 / 0 | Ausreichend beobachtet fuer ersten Plattform-Schnitt. |
| 11 | later | Hilfsmittelverwaltung | Hilfsmittel | high | 39 / 5 / 34 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 12 | later | dv-data | dv-data | medium | 9 / 3 / 6 | Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig. |
| 13 | discovery | Touren/Routenplanung | Touren/Routenplanung | low | 11 / 1 / 10 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 14 | discovery | hmvhelper | hmvhelper | low | 9 / 0 / 9 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 15 | discovery | meetings | meetings | low | 9 / 0 / 9 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 16 | discovery | stocktaking-lists | stocktaking-lists | low | 8 / 1 / 7 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 17 | discovery | inventurbewertung | inventurbewertung | low | 4 / 0 / 4 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 18 | discovery | rezepte | rezepte | low | 4 / 0 / 4 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 19 | discovery | stock-bookings | stock-bookings | low | 5 / 2 / 3 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 20 | discovery | datev-export | datev-export | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 21 | discovery | dv-batch-report | dv-batch-report | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 22 | discovery | external | external | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 23 | discovery | order-arrival-protocol | order-arrival-protocol | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 24 | discovery | route-planning-items | route-planning-items | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 25 | discovery | stocktaking-articles | stocktaking-articles | low | 3 / 1 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 26 | discovery | stocktaking-logs | stocktaking-logs | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 27 | discovery | vertragsdokumente | vertragsdokumente | low | 2 / 0 / 2 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 28 | discovery | aerzte | aerzte | low | 4 / 3 / 1 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 29 | discovery | connector | connector | low | 1 / 0 / 1 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 30 | discovery | hilfsmittel-viability | hilfsmittel-viability | low | 1 / 0 / 1 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 31 | discovery | p-300-update-reports | p-300-update-reports | low | 1 / 0 / 1 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 32 | discovery | gateway-configurations | gateway-configurations | low | 1 / 1 / 0 | Noch nicht beobachtet; zuerst gezielt recorden. |
| 33 | discovery | generic-list-column-states | generic-list-column-states | low | 1 / 1 / 0 | Noch nicht beobachtet; zuerst gezielt recorden. |

## Module

### Mandant, Benutzer und Rechte

- Fachbereich: User/Workspace
- Stufe: foundation
- Confidence: high
- Observed Responses/Endpoints: 1167 / 14
- Inventar-Coverage: 64.71 %
- Known/Observed/Missing: 17 / 11 / 6
- Begruendung: Ausreichend beobachtet fuer ersten Plattform-Schnitt.
- Kernobjekte: Benutzer, Workspace, FeatureToggle, Navigation, Praeferenz
- Beobachtete Datenobjekte:
  - user (394 Samples, 187 Felder) - Quellen: request, response
  - workspaces (347 Samples, 131 Felder) - Quellen: request, response
  - feature-toggles (184 Samples, 122 Felder) - Quellen: response
  - navigation (139 Samples, 40 Felder) - Quellen: response
  - metrics (81 Samples, 5 Felder) - Quellen: request
  - user-details (65 Samples, 20 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - Kommunikation/Aufgaben (incoming 333, outgoing 273)
  - Filialen/Mandant (incoming 169, outgoing 194)
  - Abrechnung/Kasse (incoming 115, outgoing 132)
  - Referenzdaten (incoming 29, outgoing 68)
  - Kunden/Vorgaenge (incoming 54, outgoing 41)
  - Warenwirtschaft/Bestellung (incoming 21, outgoing 32)
  - Artikel/Warenbestand (incoming 19, outgoing 13)
  - Dokumente/Archiv (incoming 13, outgoing 10)
  - ... 3 weitere
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - Terminübersicht - route `/hilfsmittelverwaltung/schedule-overview` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - Tourenplanung - route `/hilfsmittelverwaltung/route-planning` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (5x)
  - Vorgangsliste - route `/transactions/list` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - Kassenverwaltung - route `/cash-till/register` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rezeptdruck - route `/cash-till/receipt` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - ... 6 weitere
- Erwartete Funktionen:
  - Login-Kontext
  - Rechte und Feature-Toggles
  - Navigation
  - Benutzerpraeferenzen
- Wichtigste API-Luecken:
  - PATCH `/user/preferences`
  - PUT `/workspaces/{uuid}`
  - GET `/workspaces/{workspaceUuid}/scanner-settings`
  - PUT `/workspaces/{workspaceUuid}/tse-initialization`
  - GET `/workspaces/scanner-settings/{workspaceScannerSettingUuid}`
  - PUT `/workspaces/scanner-settings/{workspaceScannerSettingUuid}`

### Organisation und Filialen

- Fachbereich: Filialen/Mandant
- Stufe: foundation
- Confidence: high
- Observed Responses/Endpoints: 887 / 13
- Inventar-Coverage: 16.42 %
- Known/Observed/Missing: 67 / 11 / 56
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Firma, Filiale, Abteilung, IK, Mandantenpraeferenz
- Beobachtete Datenobjekte:
  - filialen (524 Samples, 80 Felder) - Quellen: response
  - companies (227 Samples, 122 Felder) - Quellen: response
  - department (93 Samples, 50 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - Kommunikation/Aufgaben (incoming 243, outgoing 246)
  - User/Workspace (incoming 194, outgoing 169)
  - Kunden/Vorgaenge (incoming 101, outgoing 111)
  - Referenzdaten (incoming 83, outgoing 84)
  - Warenwirtschaft/Bestellung (incoming 86, outgoing 69)
  - Artikel/Warenbestand (incoming 37, outgoing 50)
  - Dokumente/Archiv (incoming 15, outgoing 62)
  - Abrechnung/Kasse (incoming 24, outgoing 19)
  - ... 2 weitere
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - Terminübersicht - route `/hilfsmittelverwaltung/schedule-overview` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - Tourenplanung - route `/hilfsmittelverwaltung/route-planning` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (5x)
  - Vorgangsliste - route `/transactions/list` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - Kassenverwaltung - route `/cash-till/register` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rezeptdruck - route `/cash-till/receipt` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - ... 12 weitere
- Erwartete Funktionen:
  - Filialstruktur
  - Firmenprofil
  - Abteilungen
  - Mandantenkonfiguration
- Wichtigste API-Luecken:
  - POST `/companies`
  - PUT `/companies/details`
  - PUT `/companies/details/accountings`
  - GET `/companies/details/azure-storage-settings`
  - POST `/companies/details/azure-storage-settings`
  - DELETE `/companies/details/infox-ftp-settings`
  - GET `/companies/details/infox-ftp-settings`
  - POST `/companies/details/infox-ftp-settings`

### Referenzdaten und Konfiguration

- Fachbereich: Referenzdaten
- Stufe: foundation
- Confidence: high
- Observed Responses/Endpoints: 327 / 3
- Inventar-Coverage: 100 %
- Known/Observed/Missing: 3 / 3 / 0
- Begruendung: Ausreichend beobachtet fuer ersten Plattform-Schnitt.
- Kernobjekte: Enum, Land, Steuersatz, Materialgruppe
- Beobachtete Datenobjekte:
  - country (154 Samples, 26 Felder) - Quellen: response
  - enum-service (154 Samples, 5 Felder) - Quellen: response
  - navigationservice (13 Samples, 9 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - Kommunikation/Aufgaben (incoming 77, outgoing 123)
  - Filialen/Mandant (incoming 84, outgoing 83)
  - User/Workspace (incoming 68, outgoing 29)
  - Kunden/Vorgaenge (incoming 13, outgoing 7)
  - Abrechnung/Kasse (incoming 1, outgoing 0)
  - Dokumente/Archiv (incoming 0, outgoing 1)
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Terminübersicht - route `/hilfsmittelverwaltung/schedule-overview` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - Tourenplanung - route `/hilfsmittelverwaltung/route-planning` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (5x)
  - Vorgangsliste - route `/transactions/list` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Kassenverwaltung - route `/cash-till/register` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rezeptdruck - route `/cash-till/receipt` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rückholansicht - route `/hilfsmittelverwaltung/retrieval-overview` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Vorgangsnavigator - route `/transactions/navigator` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - ... 1 weitere
- Erwartete Funktionen:
  - Lookup-Daten
  - Enums
  - Laender
  - Steuer-/Materialgruppen
- Wichtigste API-Luecken:
  - keine aus dem Inventar offen

### Kundenakte und Vorgangsmanagement

- Fachbereich: Kunden/Vorgaenge
- Stufe: mvp
- Confidence: high
- Observed Responses/Endpoints: 874 / 39
- Inventar-Coverage: 33.33 %
- Known/Observed/Missing: 102 / 34 / 68
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Kunde, Vorgang, Kostentraeger, Arztbezug, Notiz
- Beobachtete Datenobjekte:
  - salesprocesses (462 Samples, 558 Felder) - Quellen: request, response
  - customers (361 Samples, 212 Felder) - Quellen: request, response
  - status (232 Samples, 49 Felder) - Quellen: request, response
  - kostentraeger-tenant (55 Samples, 127 Felder) - Quellen: request, response
  - art (32 Samples, 35 Felder) - Quellen: request, response
  - pricingservice (15 Samples, 156 Felder) - Quellen: request, response
  - ekv (10 Samples, 69 Felder) - Quellen: request, response
  - recommendations (2 Samples, 2 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - Filialen/Mandant (incoming 111, outgoing 101)
  - Kommunikation/Aufgaben (incoming 100, outgoing 32)
  - Abrechnung/Kasse (incoming 50, outgoing 62)
  - Warenwirtschaft/Bestellung (incoming 46, outgoing 50)
  - User/Workspace (incoming 41, outgoing 54)
  - Artikel/Warenbestand (incoming 19, outgoing 40)
  - apigateway (incoming 23, outgoing 32)
  - Dokumente/Archiv (incoming 24, outgoing 16)
  - ... 3 weitere
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - Terminübersicht - route `/hilfsmittelverwaltung/schedule-overview` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - Vorgangsliste - route `/transactions/list` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - UI-Zeile [REDACTED] - row `-` (13 API-Endpunkte, clicked 81, offen 70)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/document/stored-documents` (4x)
  - Hilfsmittelhistorie - tab `-` (12 API-Endpunkte, clicked 6, offen 4)
    - APIs: GET `/apigateway/accounting/material-groups` (6x), GET `/apigateway/wawi/producers` (6x), POST `/apigateway/sales/dv-data/search` (3x), GET `/apigateway/department/departments` (1x)
  - Kundendaten - tab `-` (9 API-Endpunkte, clicked 3, offen 4)
    - APIs: GET `/apigateway/accounting/payment-terms` (3x), POST `/apigateway/salesprocessservice/invoices/search` (3x), GET `/apigateway/accounting/fibu-accounts/settings` (3x), GET `/apigateway/firma/companies/details/accountings` (3x)
  - ... 20 weitere
- Erwartete Funktionen:
  - Suchen und filtern
  - Kundenakte lesen
  - Vorgangshistorie anzeigen
  - Kostentraeger- und Arztkontext verknuepfen
- Wichtigste API-Luecken:
  - GET `/customers/{customerId}/arzt/{relationId}`
  - POST `/customers/{customerId}/documents`
  - PUT `/customers/{customerId}/documents/{documentId}`
  - GET `/customers/{customerUuid}/kostentraeger/{kostentraegerUuid}`
  - GET `/customers/{customerUuid}/kostentraeger/has-valid-kostentraeger`
  - GET `/customers/{customerUuid}/rothballer`
  - GET `/customers/{customerUuid}/versichertennummer`
  - GET `/customers/{id}/addresses/has-main-address/{addressTypeKey}`

### Beschaffung und Bestellung

- Fachbereich: Warenwirtschaft/Bestellung
- Stufe: mvp
- Confidence: high
- Observed Responses/Endpoints: 582 / 37
- Inventar-Coverage: 50 %
- Known/Observed/Missing: 34 / 17 / 17
- Begruendung: Ausreichend beobachtet fuer ersten Plattform-Schnitt.
- Kernobjekte: Bestellvorschlag, Bestellung, Wareneingang, Lieferant, Lagerort
- Beobachtete Datenobjekte:
  - orders (158 Samples, 213 Felder) - Quellen: request, response
  - order-arrival (140 Samples, 251 Felder) - Quellen: request, response
  - supplier (135 Samples, 187 Felder) - Quellen: request, response
  - order-proposals (126 Samples, 126 Felder) - Quellen: request, response
  - storage-locations (76 Samples, 53 Felder) - Quellen: response
  - order-states (48 Samples, 35 Felder) - Quellen: response
  - delivery-terms (47 Samples, 29 Felder) - Quellen: response
  - cost-centers (29 Samples, 38 Felder) - Quellen: response
  - ... 1 weitere
- Beobachtete Schnittstellen:
  - Filialen/Mandant (incoming 69, outgoing 86)
  - Kunden/Vorgaenge (incoming 50, outgoing 46)
  - Artikel/Warenbestand (incoming 49, outgoing 33)
  - User/Workspace (incoming 32, outgoing 21)
  - Abrechnung/Kasse (incoming 14, outgoing 34)
  - Kommunikation/Aufgaben (incoming 16, outgoing 12)
  - Dokumente/Archiv (incoming 7, outgoing 7)
  - apigateway (incoming 4, outgoing 8)
  - ... 1 weitere
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - UI-Zeile [REDACTED] - row `-` (13 API-Endpunkte, clicked 81, offen 70)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/document/stored-documents` (4x)
  - Kundendaten - tab `-` (9 API-Endpunkte, clicked 3, offen 4)
    - APIs: GET `/apigateway/accounting/payment-terms` (3x), POST `/apigateway/salesprocessservice/invoices/search` (3x), GET `/apigateway/accounting/fibu-accounts/settings` (3x), GET `/apigateway/firma/companies/details/accountings` (3x)
  - Dokumente - tab `-` (5 API-Endpunkte, clicked 7, offen 5)
    - APIs: GET `/apigateway/document/stored-documents` (1x), POST `/apigateway/document/stored-documents/search` (9x), GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (11x), GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (11x)
  - Lieferanten - tab `-` (2 API-Endpunkte, clicked 1, offen 0)
    - APIs: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (1x), POST `/apigateway/supplier/suppliers/list` (1x)
- Erwartete Funktionen:
  - Bestellvorschlaege
  - Bestellung erzeugen
  - Wareneingang
  - Lager- und Lieferantenbezug
- Wichtigste API-Luecken:
  - POST `/order-arrival/book-recorded`
  - POST `/orders/{orderUuid}/add-proposals`
  - POST `/orders/{orderUuid}/check-proposals`
  - POST `/orders/{orderUuid}/positions`
  - PUT `/orders/{orderUuid}/positions`
  - DELETE `/orders/{orderUuid}/positions/{positionUuid}`
  - PUT `/orders/{orderUuid}/positions/{positionUuid}`
  - POST `/orders/collect-proposal-order-infos`

### Abrechnung und Kasse

- Fachbereich: Abrechnung/Kasse
- Stufe: mvp
- Confidence: high
- Observed Responses/Endpoints: 301 / 8
- Inventar-Coverage: 12.20 %
- Known/Observed/Missing: 41 / 5 / 36
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Rechnung, Bon, Kassenbuch, Zahlungsbedingung, DATEV-Export
- Beobachtete Datenobjekte:
  - vatrates (154 Samples, 16 Felder) - Quellen: response
  - invoices (85 Samples, 36 Felder) - Quellen: request, response
  - payment-terms (66 Samples, 53 Felder) - Quellen: response
  - material-groups (19 Samples, 46 Felder) - Quellen: response
  - cash-book-entries (3 Samples, 7 Felder) - Quellen: response
  - bons (3 Samples, 4 Felder) - Quellen: response
  - cash-books (3 Samples, 4 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - User/Workspace (incoming 132, outgoing 115)
  - Kunden/Vorgaenge (incoming 62, outgoing 50)
  - Kommunikation/Aufgaben (incoming 8, outgoing 54)
  - Warenwirtschaft/Bestellung (incoming 34, outgoing 14)
  - Filialen/Mandant (incoming 19, outgoing 24)
  - apigateway (incoming 12, outgoing 21)
  - Hilfsmittel (incoming 14, outgoing 8)
  - Artikel/Warenbestand (incoming 12, outgoing 7)
  - ... 2 weitere
- Beobachtete UI-Surfaces:
  - [REDACTED] - surface `/merchandise-management/order-management/orders` (53 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Filter
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps
    - Formularfelder: Lieferant, Kunden-Nr., [REDACTED] anzeigen, Kunden / Artikel, Suche
    - Tabellen: Bestell-Nr., Lieferant, Kunden-Nr., Status, Bestelldatum, Bestellmenge
    - APIs: GET `/apigateway/accounting/payment-terms` (4x), GET `/apigateway/audit/changelogs` (1x), POST `/apigateway/wawi/incoming-invoices/search` (1x), GET `/apigateway/article-tenant/articles/[REDACTED]` (2x)
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - [REDACTED] - surface `/merchandise-management/order-management/order-arrival` (39 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Einstellungen, Finanzbuchhaltung, Hilfsmittelverwaltung, Aufgaben, E-Mail, Kalender
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps
    - Formularfelder: Kunden / Artikel, Lieferschein-Nr., Filiale, Lieferdatum, Lagerort, [REDACTED] anzeigen
    - Tabellen: Bestell-Nr, Status, Lieferant, Artikel-Nr., Artikel-Bestell-Nr., Bezeichnung
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), GET `/apigateway/article-tenant/articles/[REDACTED]` (1x), GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (6x), POST `/apigateway/articletenantservice/articles/simple-search` (2x)
  - [REDACTED] - surface `/master-data/customers/{uuid}` (33 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Einstellungen, Finanzbuchhaltung, Hilfsmittelverwaltung, Aufgaben, E-Mail, Kalender
    - Aktionen: chevron_left, chevron_right, star, Clear, [REDACTED] keyboard_arrow_down, notifications
    - Formularfelder: Kundennummer, Anrede, Titel, Vorname, Firmenbezeichnung, Geburtstag
    - Tabellen: Adressart, Straße, Nr., Hauptadresse, Adresszusatz, PLZ
    - APIs: GET `/apigateway/accounting/material-groups` (5x), GET `/apigateway/accounting/payment-terms` (19x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - [REDACTED] - surface `/merchandise-management/order-management/orders/{uuid}` (28 API-Endpunkte, clicked 0, offen 0)
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps
    - Formularfelder: Bestell-Nr., Status, Rechnungsadresse, Bestellportal, Lieferant, Lieferadresse
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (1x), GET `/apigateway/wawi/producers` (2x), GET `/apigateway/department/departments` (2x)
  - [REDACTED] - surface `/transactions/{uuid}` (25 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Versorgung, Privat-/Eigenanteil:, Kostenträgeranteil, Privat-/Eigenanteil
    - Aktionen: chevron_left, chevron_right, star, Clear, [REDACTED] keyboard_arrow_down, notifications
    - Formularfelder: Vorgangsnummer, Status, Versorgungsstatus, Filiale, Bereich, Kostenstelle
    - APIs: POST `/apigateway/salesprocessservice/invoices/search` (2x), GET `/apigateway/arzt-tenant/aerzte/[REDACTED]` (2x), GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (2x), GET `/apigateway/department/departments` (2x)
  - [REDACTED] - surface `/merchandise-management/article-management/articles` (23 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Einstellungen, Finanzbuchhaltung, Hilfsmittelverwaltung, Aufgaben, E-Mail, Kalender
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications 8, apps
    - Formularfelder: Kunden / Artikel, Suche, Deaktivierte Artikel anzeigen
    - Tabellen: Artikel-Nr., Herkunft, Bezeichnung, Hersteller, Farbe, Größe
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/article-tenant/article/generate-labels/[REDACTED]/articles/[REDACTED]` (2x), GET `/apigateway/article-tenant/articles/[REDACTED]` (2x), GET `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` (2x)
  - ... 26 weitere
- Erwartete Funktionen:
  - Rechnungen suchen
  - Kassenbuch
  - Zahlungsbedingungen
  - DATEV-nahe Ausleitung
- Wichtigste API-Luecken:
  - POST `/bons`
  - GET `/bons/{bonUuid}`
  - GET `/cash-book-entries/csv`
  - GET `/cash-books/{cashBookUuid}/cash-book-entries`
  - POST `/cash-books/{cashBookUuid}/cash-book-entries`
  - DELETE `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}`
  - GET `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}`
  - PUT `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}/finish-transaction`

### Artikelkatalog und Bestand

- Fachbereich: Artikel/Warenbestand
- Stufe: mvp
- Confidence: high
- Observed Responses/Endpoints: 293 / 22
- Inventar-Coverage: 30.61 %
- Known/Observed/Missing: 49 / 15 / 34
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Artikel, Artikelkit, Lieferantenzuordnung, Preis, Bestand
- Beobachtete Datenobjekte:
  - articles (242 Samples, 255 Felder) - Quellen: request, response
  - producers (47 Samples, 36 Felder) - Quellen: response
  - label-configurations (22 Samples, 9 Felder) - Quellen: response
  - article-kits (14 Samples, 45 Felder) - Quellen: request, response
  - bits-articles (8 Samples, 0 Felder) - Quellen: response
  - article (2 Samples, 7 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - Filialen/Mandant (incoming 50, outgoing 37)
  - Warenwirtschaft/Bestellung (incoming 33, outgoing 49)
  - Kunden/Vorgaenge (incoming 40, outgoing 19)
  - User/Workspace (incoming 13, outgoing 19)
  - Abrechnung/Kasse (incoming 7, outgoing 12)
  - Hilfsmittel (incoming 5, outgoing 13)
  - Kommunikation/Aufgaben (incoming 10, outgoing 6)
  - Dokumente/Archiv (incoming 4, outgoing 7)
  - ... 1 weitere
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - [REDACTED] - surface `/merchandise-management/order-management/order-proposals` (21 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Filter, Summen, Einstellungen, Finanzbuchhaltung, Hilfsmittelverwaltung, Aufgaben
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications 8, apps
    - Formularfelder: bestellte Artikel anzeigen, Kunden / Artikel, Suche in der Liste der Bestellvorschläge, Filiale, Artikel-Nr., Bezeichnung
    - Tabellen: Filiale, Artikel-Nr., Bezeichnung, Hersteller, Lieferant, Einheit
    - APIs: GET `/apigateway/article-tenant/articles/[REDACTED]` (4x), GET `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` (1x), GET `/apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]` (3x), GET `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` (4x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - [REDACTED] - surface `/merchandise-management/article-management/articles/{uuid}` (13 API-Endpunkte, clicked 0, offen 0)
    - Ueberschriften: Einkauf, Einstellungen, Finanzbuchhaltung, Hilfsmittelverwaltung, Aufgaben, E-Mail
    - Aktionen: chevron_left, chevron_right, star, Clear, [REDACTED] keyboard_arrow_down, notifications
    - Formularfelder: Artikel-Nr., HMV-Nr., Herkunft, PZN, Artikelbezeichnung des Herstellers, EAN-Code
    - Tabellen: Speicherort, Bezeichnung, Dokumentenart, Erstellt am, more_vert, Lieferant
    - APIs: GET `/apigateway/article-tenant/articles/[REDACTED]` (1x), GET `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` (1x), GET `/apigateway/article-tenant/articles/[REDACTED]/price-data` (1x), GET `/apigateway/article-tenant/articles/[REDACTED]/quantities` (1x)
  - Hilfsmittelhistorie - tab `-` (12 API-Endpunkte, clicked 6, offen 4)
    - APIs: GET `/apigateway/accounting/material-groups` (6x), GET `/apigateway/wawi/producers` (6x), POST `/apigateway/sales/dv-data/search` (3x), GET `/apigateway/department/departments` (1x)
  - Hilfsmittelnavigator - route `/hilfsmittelverwaltung/navigator` (6 API-Endpunkte, clicked 5, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (5x), GET `/apigateway/wawi/producers` (5x), GET `/apigateway/filiale/filialen` (5x), POST `/apigateway/hilfsmittel/arten/search` (5x)
  - [REDACTED] - surface `/merchandise-management/article-management/article-kits` (4 API-Endpunkte, clicked 0, offen 0)
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps
    - Formularfelder: [REDACTED] anzeigen, Kunden / Artikel, Suche
    - Tabellen: Muster-Nr., Musterbezeichnung, Artikel-Nr., Bezeichnung, Aktiv, Filialen
    - APIs: POST `/apigateway/article-tenant/article-kits/search` (2x), GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (2x), POST `/apigateway/articletenantservice/article-kits/search` (2x), GET `/apigateway/firma/companies/details` (2x)
  - ... 5 weitere
- Erwartete Funktionen:
  - Artikelsuche
  - Preis- und Lieferantenkontext
  - Bestandsanzeige
  - Artikelkits
- Wichtigste API-Luecken:
  - GET `/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}`
  - PUT `/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions`
  - POST `/article-kits/{articleKitId}/article-kit-material-positions`
  - PUT `/article-kits/{articleKitId}/article-kit-material-positions`
  - DELETE `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`

### Kommunikation und Aufgaben

- Fachbereich: Kommunikation/Aufgaben
- Stufe: later
- Confidence: high
- Observed Responses/Endpoints: 1954 / 9
- Inventar-Coverage: 38.46 %
- Known/Observed/Missing: 26 / 10 / 16
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Mail, Aufgabe, Reminder, Notification
- Beobachtete Datenobjekte:
  - mail (733 Samples, 0 Felder) - Quellen: response
  - reminders (217 Samples, 0 Felder) - Quellen: response
  - notifications (154 Samples, 59 Felder) - Quellen: response
- Beobachtete Schnittstellen:
  - User/Workspace (incoming 273, outgoing 333)
  - Filialen/Mandant (incoming 246, outgoing 243)
  - Referenzdaten (incoming 123, outgoing 77)
  - Kunden/Vorgaenge (incoming 32, outgoing 100)
  - Dokumente/Archiv (incoming 80, outgoing 43)
  - Abrechnung/Kasse (incoming 54, outgoing 8)
  - Warenwirtschaft/Bestellung (incoming 12, outgoing 16)
  - Artikel/Warenbestand (incoming 6, outgoing 10)
  - ... 3 weitere
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Terminübersicht - route `/hilfsmittelverwaltung/schedule-overview` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - Tourenplanung - route `/hilfsmittelverwaltung/route-planning` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (5x)
  - Vorgangsliste - route `/transactions/list` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Kassenverwaltung - route `/cash-till/register` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rezeptdruck - route `/cash-till/receipt` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rückholansicht - route `/hilfsmittelverwaltung/retrieval-overview` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Vorgangsnavigator - route `/transactions/navigator` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - ... 6 weitere
- Erwartete Funktionen:
  - Inbox-Zaehler
  - Aufgaben
  - Reminder
  - Benachrichtigungen
- Wichtigste API-Luecken:
  - DELETE `/kim/mails/{messageId}`
  - POST `/kim/mails/{uid}/attachments`
  - GET `/kim/mails/available-connections`
  - POST `/kim/mails/check-pop3-connection`
  - POST `/kim/mails/check-smtp-connection`
  - POST `/kim/mails/retrieve-new-mails`
  - POST `/kim/mails/send-mail`
  - DELETE `/mails`

### Dokumente und Archiv

- Fachbereich: Dokumente/Archiv
- Stufe: later
- Confidence: high
- Observed Responses/Endpoints: 166 / 8
- Inventar-Coverage: 21.05 %
- Known/Observed/Missing: 38 / 8 / 30
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Dokument, Vorlage, Archivdatei, Druckauftrag
- Beobachtete Datenobjekte:
  - stored-documents (29 Samples, 56 Felder) - Quellen: request, response
  - archive-documents (19 Samples, 38 Felder) - Quellen: request, response
  - documents (5 Samples, 34 Felder) - Quellen: request, response
  - formservice (4 Samples, 22 Felder) - Quellen: request, response
- Beobachtete Schnittstellen:
  - Kommunikation/Aufgaben (incoming 43, outgoing 80)
  - Filialen/Mandant (incoming 62, outgoing 15)
  - Kunden/Vorgaenge (incoming 16, outgoing 24)
  - User/Workspace (incoming 10, outgoing 13)
  - Warenwirtschaft/Bestellung (incoming 7, outgoing 7)
  - Artikel/Warenbestand (incoming 7, outgoing 4)
  - apigateway (incoming 0, outgoing 2)
  - Abrechnung/Kasse (incoming 0, outgoing 1)
  - ... 1 weitere
- Beobachtete UI-Surfaces:
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - Terminübersicht - route `/hilfsmittelverwaltung/schedule-overview` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (3x)
  - Tourenplanung - route `/hilfsmittelverwaltung/route-planning` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (5x)
  - Vorgangsliste - route `/transactions/list` (19 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - Kassenverwaltung - route `/cash-till/register` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rezeptdruck - route `/cash-till/receipt` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - Rückholansicht - route `/hilfsmittelverwaltung/retrieval-overview` (18 API-Endpunkte, clicked 2, offen 1)
    - APIs: GET `/apigateway/vatrates/vatrates` (3x), GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (5x), GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (3x), GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (7x)
  - ... 9 weitere
- Erwartete Funktionen:
  - Dokumentensuche
  - Archivzugriff
  - Vorlagen
  - PDF/Druck vorbereiten
- Wichtigste API-Luecken:
  - POST `/dv-batch-report/{reportId}/documents/merge`
  - GET `/dv-batch-report/{reportId}/documents/zip`
  - GET `/file-archive/cloud/load/files/{fileId}`
  - GET `/file-archive/cloud/load/files/{serviceName}/{templateName}`
  - GET `/file-archive/cloud/load/files/templates`
  - POST `/file-archive/cloud/upload/files`
  - POST `/file-archive/files/metainfos`
  - GET `/file-archive/load/files/{fileId}/checksum`

### apigateway

- Fachbereich: apigateway
- Stufe: later
- Confidence: high
- Observed Responses/Endpoints: 73 / 11
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 0 / 0 / 0
- Begruendung: Ausreichend beobachtet fuer ersten Plattform-Schnitt.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - arzt-tenant (32 Samples, 103 Felder) - Quellen: response
  - fibu-accounts (27 Samples, 5 Felder) - Quellen: response
  - archived-salesprocess (10 Samples, 33 Felder) - Quellen: request, response
  - incoming-invoices (4 Samples, 30 Felder) - Quellen: request, response
  - audit (3 Samples, 32 Felder) - Quellen: response
  - stock-bookings (1 Samples, 71 Felder) - Quellen: response
  - price-position (1 Samples, 52 Felder) - Quellen: response
  - stocktaking-lists (1 Samples, 43 Felder) - Quellen: response
  - ... 1 weitere
- Beobachtete Schnittstellen:
  - Kunden/Vorgaenge (incoming 32, outgoing 23)
  - Abrechnung/Kasse (incoming 21, outgoing 12)
  - Filialen/Mandant (incoming 5, outgoing 25)
  - Warenwirtschaft/Bestellung (incoming 8, outgoing 4)
  - User/Workspace (incoming 1, outgoing 4)
  - Kommunikation/Aufgaben (incoming 1, outgoing 2)
  - Artikel/Warenbestand (incoming 1, outgoing 1)
  - Dokumente/Archiv (incoming 2, outgoing 0)
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Kunden / Artikel - search `-` (28 API-Endpunkte, clicked 45, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (3x), GET `/apigateway/accounting/payment-terms` (5x), POST `/apigateway/salesprocessservice/invoices/search` (4x), GET `/apigateway/accounting/fibu-accounts/settings` (4x)
  - App-Menue - menu `-` (18 API-Endpunkte, clicked 18, offen 13)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/wawi/producers` (1x)
  - UI-Zeile [REDACTED] - row `-` (13 API-Endpunkte, clicked 81, offen 70)
    - APIs: GET `/apigateway/accounting/payment-terms` (1x), POST `/apigateway/salesprocessservice/invoices/search` (1x), GET `/apigateway/accounting/fibu-accounts/settings` (1x), GET `/apigateway/document/stored-documents` (4x)
  - Kundendaten - tab `-` (9 API-Endpunkte, clicked 3, offen 4)
    - APIs: GET `/apigateway/accounting/payment-terms` (3x), POST `/apigateway/salesprocessservice/invoices/search` (3x), GET `/apigateway/accounting/fibu-accounts/settings` (3x), GET `/apigateway/firma/companies/details/accountings` (3x)
  - Historie (Archiv) - tab `-` (1 API-Endpunkte, clicked 4, offen 5)
    - APIs: POST `/apigateway/sales/archived-salesprocess/search` (7x)
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - keine aus dem Inventar offen

### Hilfsmittelverwaltung

- Fachbereich: Hilfsmittel
- Stufe: later
- Confidence: high
- Observed Responses/Endpoints: 51 / 6
- Inventar-Coverage: 12.82 %
- Known/Observed/Missing: 39 / 5 / 34
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: Hilfsmittel, Art, Termin, Trait, Route
- Beobachtete Datenobjekte:
  - hilfsmittel (58 Samples, 70 Felder) - Quellen: request, response
- Beobachtete Schnittstellen:
  - Kunden/Vorgaenge (incoming 21, outgoing 12)
  - Abrechnung/Kasse (incoming 8, outgoing 14)
  - Artikel/Warenbestand (incoming 13, outgoing 5)
  - Filialen/Mandant (incoming 4, outgoing 11)
  - User/Workspace (incoming 1, outgoing 6)
  - dv-data (incoming 3, outgoing 0)
  - Kommunikation/Aufgaben (incoming 0, outgoing 2)
- Beobachtete UI-Surfaces:
  - Detail oeffnen - detail `-` (42 API-Endpunkte, clicked 22, offen 3)
    - APIs: GET `/apigateway/accounting/payment-terms` (19x), GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x), POST `/apigateway/salesprocessservice/invoices/search` (20x), GET `/apigateway/accounting/fibu-accounts/settings` (19x)
  - Hilfsmittelhistorie - tab `-` (12 API-Endpunkte, clicked 6, offen 4)
    - APIs: GET `/apigateway/accounting/material-groups` (6x), GET `/apigateway/wawi/producers` (6x), POST `/apigateway/sales/dv-data/search` (3x), GET `/apigateway/department/departments` (1x)
  - Hilfsmittelnavigator - route `/hilfsmittelverwaltung/navigator` (6 API-Endpunkte, clicked 5, offen 0)
    - APIs: GET `/apigateway/accounting/material-groups` (5x), GET `/apigateway/wawi/producers` (5x), GET `/apigateway/filiale/filialen` (5x), POST `/apigateway/hilfsmittel/arten/search` (5x)
  - Transactions - route `/transactions` (1 API-Endpunkte, clicked 5, offen 1)
    - APIs: POST `/apigateway/hilfsmittel/hilfsmittel/search` (1x)
  - [REDACTED] - surface `/hilfsmittelverwaltung` (0 API-Endpunkte, clicked 0, offen 0)
    - Aktionen: chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications 8, apps
    - Formularfelder: Kunden / Artikel
- Erwartete Funktionen:
  - Hilfsmittel suchen
  - Termine
  - Arten
  - Traits und Routenbezug
- Wichtigste API-Luecken:
  - GET `/hilfsmittel/{id}`
  - POST `/hilfsmittel/{id}`
  - PUT `/hilfsmittel/{id}`
  - GET `/hilfsmittel/{id}/documents`
  - POST `/hilfsmittel/{id}/documents`
  - DELETE `/hilfsmittel/{id}/documents/{documentId}`
  - GET `/hilfsmittel/{id}/documents/{documentId}`
  - PUT `/hilfsmittel/{id}/documents/{documentId}`

### dv-data

- Fachbereich: dv-data
- Stufe: later
- Confidence: medium
- Observed Responses/Endpoints: 16 / 2
- Inventar-Coverage: 33.33 %
- Known/Observed/Missing: 9 / 3 / 6
- Begruendung: Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - dv-data (27 Samples, 276 Felder) - Quellen: request, response
- Beobachtete Schnittstellen:
  - Kunden/Vorgaenge (incoming 15, outgoing 3)
  - Warenwirtschaft/Bestellung (incoming 0, outgoing 7)
  - Hilfsmittel (incoming 0, outgoing 3)
  - Kommunikation/Aufgaben (incoming 0, outgoing 1)
  - User/Workspace (incoming 0, outgoing 1)
- Beobachtete UI-Surfaces:
  - Hilfsmittelhistorie - tab `-` (12 API-Endpunkte, clicked 6, offen 4)
    - APIs: GET `/apigateway/accounting/material-groups` (6x), GET `/apigateway/wawi/producers` (6x), POST `/apigateway/sales/dv-data/search` (3x), GET `/apigateway/department/departments` (1x)
  - Dokumente - tab `-` (5 API-Endpunkte, clicked 7, offen 5)
    - APIs: GET `/apigateway/document/stored-documents` (1x), POST `/apigateway/document/stored-documents/search` (9x), GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (11x), GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (11x)
  - DV-Historie - tab `-` (2 API-Endpunkte, clicked 7, offen 3)
    - APIs: POST `/apigateway/sales/dv-data/search` (9x), POST `/apigateway/salesprocessservice/status/search` (18x)
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/dv-data/{dvDataId}`
  - PUT `/dv-data/{dvDataId}`
  - POST `/dv-data/{dvDataId}/collective-invoice-validation`
  - POST `/dv-data/{dvDataId}/create-sales-processes`
  - POST `/dv-data/{dvDataId}/versorgungsanzeigen`
  - POST `/dv-data/calculate-prices`

### Touren/Routenplanung

- Fachbereich: Touren/Routenplanung
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 9.09 %
- Known/Observed/Missing: 11 / 1 / 10
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/route-plannings`
  - GET `/route-plannings/{id}/stops`
  - DELETE `/route-plannings/{routePlanningUuid}`
  - GET `/route-plannings/{routePlanningUuid}`
  - PUT `/route-plannings/{routePlanningUuid}`
  - GET `/route-plannings/{routePlanningUuid}/exports`
  - POST `/route-plannings/{routePlanningUuid}/route-planning-document`
  - DELETE `/route-plannings/{routePlanningUuid}/stops/{stopUuid}`

### hmvhelper

- Fachbereich: hmvhelper
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 9 / 0 / 9
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/hmvhelper`
  - GET `/hmvhelper/{productGroup}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}/{productType}`
  - GET `/hmvhelper/external/search`
  - POST `/hmvhelper/list`
  - POST `/hmvhelper/search`

### meetings

- Fachbereich: meetings
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 9 / 0 / 9
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/meetings`
  - POST `/meetings`
  - PUT `/meetings`
  - PUT `/meetings/{meetingUuid}`
  - GET `/meetings/{meetingUuid}/{calendarId}`
  - PUT `/meetings/{meetingUuid}/cancel`
  - POST `/meetings/conflicting-meetings`
  - GET `/meetings/dbopt`

### stocktaking-lists

- Fachbereich: stocktaking-lists
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 12.50 %
- Known/Observed/Missing: 8 / 1 / 7
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/stocktaking-lists`
  - GET `/stocktaking-lists/{stocktakingListUuid}`
  - PUT `/stocktaking-lists/{stocktakingListUuid}`
  - POST `/stocktaking-lists/{stocktakingListUuid}/import`
  - POST `/stocktaking-lists/{stocktakingListUuid}/pdf`
  - POST `/stocktaking-lists/{stocktakingListUuid}/takeover`
  - POST `/stocktaking-lists/csv`

### inventurbewertung

- Fachbereich: inventurbewertung
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 4 / 0 / 4
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/inventurbewertung/altersgruppen`
  - GET `/inventurbewertung/altersgruppen/{uuid}`
  - PUT `/inventurbewertung/altersgruppen/{uuid}`
  - POST `/inventurbewertung/altersgruppen/search`

### rezepte

- Fachbereich: rezepte
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 4 / 0 / 4
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/rezepte`
  - GET `/rezepte/pdf`
  - GET `/rezepte/point-of-service`
  - GET `/rezepte/xml`

### stock-bookings

- Fachbereich: stock-bookings
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 40 %
- Known/Observed/Missing: 5 / 2 / 3
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/stock-bookings`
  - POST `/stock-bookings/outflow`
  - POST `/stock-bookings/pdf`

### datev-export

- Fachbereich: datev-export
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/datev-export/account-records`
  - POST `/datev-export/debitoren-kreditoren`

### dv-batch-report

- Fachbereich: dv-batch-report
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/dv-batch-report/{reportId}/pdf-export`
  - POST `/dv-batch-report/{reportId}/search`

### external

- Fachbereich: external
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/external/product`
  - GET `/external/product-groups`

### order-arrival-protocol

- Fachbereich: order-arrival-protocol
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/order-arrival-protocol/{arrivalBookingUuid}/cancel`
  - POST `/order-arrival-protocol/search`

### route-planning-items

- Fachbereich: route-planning-items
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/route-planning-items`
  - POST `/route-planning-items/search`

### stocktaking-articles

- Fachbereich: stocktaking-articles
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 33.33 %
- Known/Observed/Missing: 3 / 1 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/stocktaking-articles`
  - PUT `/stocktaking-articles/{stocktakingArticleUuid}`

### stocktaking-logs

- Fachbereich: stocktaking-logs
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/stocktaking-logs`
  - POST `/stocktaking-logs/{stocktakingListUuid}/pdf`

### vertragsdokumente

- Fachbereich: vertragsdokumente
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/vertragsdokumente`
  - GET `/vertragsdokumente/{legs}`

### aerzte

- Fachbereich: aerzte
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 75 %
- Known/Observed/Missing: 4 / 3 / 1
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/aerzte/{uuid}/addresses`

### connector

- Fachbereich: connector
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 1 / 0 / 1
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/connector/vzd/search`

### hilfsmittel-viability

- Fachbereich: hilfsmittel-viability
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 1 / 0 / 1
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - POST `/hilfsmittel-viability`

### p-300-update-reports

- Fachbereich: p-300-update-reports
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 1 / 0 / 1
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - GET `/p-300-update-reports`

### gateway-configurations

- Fachbereich: gateway-configurations
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 100 %
- Known/Observed/Missing: 1 / 1 / 0
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - keine aus dem Inventar offen

### generic-list-column-states

- Fachbereich: generic-list-column-states
- Stufe: discovery
- Confidence: low
- Observed Responses/Endpoints: 0 / 0
- Inventar-Coverage: 100 %
- Known/Observed/Missing: 1 / 1 / 0
- Begruendung: Noch nicht beobachtet; zuerst gezielt recorden.
- Kernobjekte: noch offen
- Beobachtete Datenobjekte:
  - keine strukturierten Bodies beobachtet
- Beobachtete Schnittstellen:
  - keine Domaenen-Kanten beobachtet
- Beobachtete UI-Surfaces:
  - keine UI-Ziele mit API-Bezug beobachtet
- Erwartete Funktionen:
  - Liste/Suche
  - Detailansicht
  - Export/Weiterverarbeitung pruefen
- Wichtigste API-Luecken:
  - keine aus dem Inventar offen

