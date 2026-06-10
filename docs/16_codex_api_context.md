# Codex API Context

Generiert: 2026-06-08T08:55:37.799Z

Hinweis: Dieser Report ist ein verdichteter Arbeitskontext fuer Codex. Er enthaelt keine Request-/Response-Rohwerte, sondern nur Methoden, Pfade, Statuscodes, UI-Hinweise, Feldstruktur-Hinweise und Recording-Kommandos.

## Kurzfassung

- Bekannte Endpunkte: 501
- Beobachtete Endpunkte: 163
- Beobachtet aus Inventar: 128
- Fehlende bekannte Endpunkte: 373
- Coverage: 25.55 %
- Fokusbereiche: Kunden/Vorgaenge, Filialen/Mandant, Abrechnung/Kasse, Artikel/Warenbestand, Hilfsmittel

## Codex Prompt

```text
Nutze diesen API-Kontext als Arbeitsgrundlage.
Priorisiere fehlende Endpunkte in diesen Bereichen: Kunden/Vorgaenge, Filialen/Mandant, Abrechnung/Kasse, Artikel/Warenbestand, Hilfsmittel.
Top fehlende Endpunkte: POST /sales-positions/calculate-single-position, POST /sales-positions/eigenanteil, POST /sales-positions/unit-prices, GET /sales-positions/vertragsdaten, POST /sales-positions/zuzahlungen, GET /salesprocesses/{id}/billing-documents, POST /salesprocesses/{salesProcessId}/bons/{documentId}/cancellations, GET /salesprocesses/{salesProcessId}/documents.
Plane neue Aufnahmen so, dass jeder fehlende Endpoint einem UI-Ort, einem erwarteten Zweck, einem Request-/Response-Schema und einem sicheren Testobjekt zugeordnet wird.
Bei schreibenden Endpunkten nur mit Max Mustermann/Musterartikel, expliziten IDs, includeAll:false und Read-back arbeiten.
```

## Priorisierte Fehlende Endpunkte

### HIGH POST `/sales-positions/calculate-single-position`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Schreibt oder berechnet Daten im Bereich Kunden/Vorgaenge.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/sales-positions/eigenanteil`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Schreibt oder berechnet Daten im Bereich Kunden/Vorgaenge.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/sales-positions/unit-prices`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Schreibt oder berechnet Daten im Bereich Kunden/Vorgaenge.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH GET `/sales-positions/vertragsdaten`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Liest Detail- oder Referenzdaten im Bereich Kunden/Vorgaenge.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Ohne GET-Readback fehlen Status, Response-Struktur und UI-Zuordnung.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/sales-positions/zuzahlungen`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Schreibt oder berechnet Daten im Bereich Kunden/Vorgaenge.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH GET `/salesprocesses/{id}/billing-documents`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Ohne GET-Readback fehlen Status, Response-Struktur und UI-Zuordnung.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessId}/bons/{documentId}/cancellations`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH GET `/salesprocesses/{salesProcessId}/documents`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Ohne GET-Readback fehlen Status, Response-Struktur und UI-Zuordnung.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessId}/documents`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessId}/invoices/{invoiceId}/payments`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessId}/payments`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/delivery-notes`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/gutschrift`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/invoice-previews`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/invoices`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/invoices/{invoiceUuid}/cancellation-previews`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/invoices/{invoiceUuid}/cancellations`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/invoices/{invoiceUuid}/update`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/sendToInfox`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/versorgungsanzeigen`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/workshop-orders`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Erzeugt oder verarbeitet Bestellungen.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{salesProcessUuid}/zahlungserinnerung`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH GET `/salesprocesses/{uuid}/invoices`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Ohne GET-Readback fehlen Status, Response-Struktur und UI-Zuordnung.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/{uuid}/notes`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH GET `/salesprocesses//invoices/{invoiceUuid}`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Ohne GET-Readback fehlen Status, Response-Struktur und UI-Zuordnung.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/collective-invoice-report/search/{reportId}`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Such-/Info-POSTs sind meist read-like und koennen gefahrlos gezielt aufgenommen werden.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/collective-invoice-validation`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/collective-invoice-validation/{reportId}/pdf-export`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md, tmp/api2-token-resolution.json
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

### HIGH POST `/salesprocesses/collective-invoices`

- Bereich: Kunden/Vorgaenge
- Vermuteter Zweck: Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
- Warum relevant: Im Bereich wurden bereits 5 verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch. Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.
- Quelle: docs/api2-backend-paths.md
- UI-Hinweise: `UI-Zeile [REDACTED]`, `App-Menue`, `Notizen`, `Historie`, `Kostenträgerdaten`
- Datenmodell-Hinweise: salesprocesses: [], [].statusId, [].sum, accidentDate, accidentLocation, active, art, art[].active; customers: active, addressAdditional, addressType, alpha3CountryCode, area, arztBetriebsstaettenNr, arztCity, arztDataOrigin; status: active, content, content[].active, content[].closedSales, content[].comment, content[].correspondingSalesState, content[].description, content[].enabled; kostentraeger-tenant: [].active, [].addressAdditional, [].addressType, [].city, [].countryId, [].description, [].houseNumber, [].id
- Sequenz-Hinweise: Kommunikation/Aufgaben -> Kunden/Vorgaenge (92x); Kunden/Vorgaenge -> User/Workspace (53x); User/Workspace -> Kunden/Vorgaenge (40x); Kunden/Vorgaenge -> Hilfsmittel (21x)
- Verwandte beobachtete Endpunkte:
  - GET `/apigateway/kunden/customers/search` (163x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
  - POST `/apigateway/sales/salesprocesses/search` (148x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - POST `/apigateway/salesprocessservice/status/search` (117x, 200, 500) - Sucht oder listet Daten im Bereich Kunden/Vorgaenge.
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (56x, 200) - Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.
  - GET `/apigateway/kunden/customers/{param}` (43x, 200) - Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.
- Naechster Recording-Befehl:
  - Kundenstamm und Vorgangsdetails aufnehmen
```bash
node tools/recording-workflow.ts --mode auto --url https://api2.optica-omnia.de --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20 --start-path "/master-data/customers" --expect-endpoint "GET /customers/{customerId}/arzt/{relationId}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/{kostentraegerUuid}" --expect-endpoint "GET /customers/{customerUuid}/kostentraeger/has-valid-kostentraeger"
```

## Beobachtete Endpunkte Fuer Orientierung

| Bereich | Methode | Pfad | Status | Anzahl | Zweck | Schritte |
|---|---|---|---|---:|---|---|
| Kommunikation/Aufgaben | GET | `/apigateway/mail/mails/unread-number` | 200 | 562 | Liest Detail- oder Referenzdaten im Bereich Kommunikation/Aufgaben. | 1., 11. Ansprechpartner, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 20. Kundendaten, 25. Kundendaten, 26. Notizen, 27. Kundendaten, 9. Kassenverwaltung, DV-Historie pruefen, Download pruefen, Ergebnis pruefen, Export ausloesen, Export konfigurieren, Export-Menue oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Login/Workspace pruefen, Start, UI-Zeile [REDACTED], Vorgaenge oeffnen, Vorgang detail oeffnen, Vorgangsliste pruefen, [REDACTED] navigieren, [REDACTED] suchen |
| Kommunikation/Aufgaben | GET | `/apigateway/task/tasks/task-count` | 200 | 560 | Liest Detail- oder Referenzdaten im Bereich Kommunikation/Aufgaben. | 1., 11. Ansprechpartner, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 20. Kundendaten, 25. Kundendaten, 26. Notizen, 27. Kundendaten, 9. Kassenverwaltung, DV-Historie pruefen, Download pruefen, Ergebnis pruefen, Export ausloesen, Export konfigurieren, Export-Menue oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Login/Workspace pruefen, Start, UI-Zeile [REDACTED], Vorgaenge oeffnen, Vorgang detail oeffnen, Vorgangsliste pruefen, [REDACTED] navigieren, [REDACTED] suchen |
| Kommunikation/Aufgaben | GET | `/apigateway/task/tasks/reminder-count` | 200 | 223 | Liest Detail- oder Referenzdaten im Bereich Kommunikation/Aufgaben. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen, Start |
| Kommunikation/Aufgaben | GET | `/apigateway/communicatorservice/reminders/dbopt` | 200 | 214 | Liest Detail- oder Referenzdaten im Bereich Kommunikation/Aufgaben. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, DV-Historie pruefen, Export konfigurieren, Export-Quelle oeffnen, Kundendetail oeffnen, Start, [REDACTED] suchen |
| User/Workspace | GET | `/apigateway/userservice/feature-toggles` | 200 | 183 | Liest Detail- oder Referenzdaten im Bereich User/Workspace. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, DV-Historie pruefen, Export-Quelle oeffnen, Kundendetail oeffnen, Start |
| Filialen/Mandant | GET | `/apigateway/userservice/companies/details/preferences` | 200 | 166 | Liest Detail- oder Referenzdaten im Bereich Filialen/Mandant. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 3. Kunden / Artikel, 9. Kassenverwaltung, Artikel: Preisdaten laden, Export-Menue oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Musterartikel eindeutig aufloesen, Start |
| Kunden/Vorgaenge | GET | `/apigateway/kunden/customers/search` | 200 | 163 | Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext. | 1., 1. Kunden / Artikel, 13. Kunden / Artikel, 21. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, DV-Historie pruefen, Export ausloesen, Exportbereich oeffnen, Musterkunde fuer Positionsflow pruefen, Musterkunde suchen, Neuer Vorgang aus Kundenhistorie starten, Start, Testkunde eindeutig aufloesen, UI-Zeile [REDACTED], [REDACTED] navigieren |
| Abrechnung/Kasse | GET | `/apigateway/vatrates/vatrates` | 200 | 155 | Liest Detail- oder Referenzdaten im Bereich Abrechnung/Kasse. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| User/Workspace | GET | `/apigateway/user/generic-list-column-states` | 200 | 155 | Sucht oder listet Daten im Bereich User/Workspace. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| User/Workspace | GET | `/apigateway/userservice/workspaces/{param}` | 200 | 155 | Liest Detail- oder Referenzdaten im Bereich User/Workspace. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Filialen/Mandant | GET | `/apigateway/filiale/filialen/{param}/institutionskennzeichen/{param}` | 200 | 154 | Liest Detail- oder Referenzdaten im Bereich Filialen/Mandant. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Kommunikation/Aufgaben | GET | `/apigateway/mail/gateway-configurations/user-mail-addresses` | 200 | 154 | Liest Detail- oder Referenzdaten im Bereich Kommunikation/Aufgaben. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Referenzdaten | GET | `/apigateway/country/countries` | 200 | 154 | Liest Detail- oder Referenzdaten im Bereich Referenzdaten. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Referenzdaten | GET | `/apigateway/enum-service/enums` | 200 | 154 | Liest Detail- oder Referenzdaten im Bereich Referenzdaten. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| User/Workspace | GET | `/apigateway/user/users/{param}/dashboards` | 200 | 154 | Liest Detail- oder Referenzdaten im Bereich User/Workspace. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Kommunikation/Aufgaben | GET | `/apigateway/notification/notifications` | 200 | 153 | Liest Detail- oder Referenzdaten im Bereich Kommunikation/Aufgaben. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Kunden/Vorgaenge | POST | `/apigateway/sales/salesprocesses/search` | 200 | 148 | Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug. | 1., 1. Kunden / Artikel, 11. Ansprechpartner, 17. Hilfsmittelhistorie, 19. Historie, 22. Historie, 24. Historie, DV-Historie pruefen, Export-Quelle oeffnen, Kunde-Historie oeffnen, Musterkunde suchen, Neuen Vorgang eindeutig ermitteln, Sales-Process- und Filial-Kontext zum Musterkunden laden, Start, Testkunde eindeutig aufloesen, Vorgaenge oeffnen, Vorgang zum Musterkunden auswaehlen, Vorgang zum Testkunden laden, [REDACTED] merken, [REDACTED] navigieren |
| Filialen/Mandant | GET | `/apigateway/filiale/filialen` | 200 | 145 | Liest Detail- oder Referenzdaten im Bereich Filialen/Mandant. | 1., 11. Ansprechpartner, 11. Kassenbuch, 17. Hilfsmittelhistorie, 17. Warenwirtschaft, 18. Hilfsmittelhistorie, 2. Kunden / Artikel, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 3. App-Menue, 3. Kunden / Artikel, 4. Detail oeffnen, 6. Hilfsmittelnavigator, Artikel: Warenwirtschaftsdaten laden, DV-Historie pruefen, Export-Quelle oeffnen, Kasse: Bons und Kassenbuchlisten laden, Musterartikel eindeutig aufloesen, Neuer Vorgang aus Kundenhistorie starten, Start, Vorgaenge oeffnen, Vorgangsliste pruefen, [REDACTED] navigieren |
| Filialen/Mandant | GET | `/apigateway/filiale/filialen/{param}/receipt-settings` | 200 | 142 | Liest Detail- oder Referenzdaten im Bereich Filialen/Mandant. | 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Kundendetail oeffnen |
| User/Workspace | GET | `/apigateway/navigation/navigations/details` | 200 | 142 | Liest Detail- oder Referenzdaten im Bereich User/Workspace. | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen |
| Dokumente/Archiv | GET | `/apigateway/file-archive/file-archive/load/files/{param}` | 200 | 119 | Liest Detail- oder Referenzdaten im Bereich Dokumente/Archiv. | 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 2. App-Menue, 2. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, 9. Kassenverwaltung, DV-Historie pruefen, Kundendetail oeffnen, Start |
| Kunden/Vorgaenge | POST | `/apigateway/salesprocessservice/status/search` | 200, 500 | 117 | Sucht oder listet Daten im Bereich Kunden/Vorgaenge. | 1., 1. Kunden / Artikel, 11. Ansprechpartner, 14. DV-Historie, 14. Terminübersicht, 16. DV-Historie, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 19. DV-Historie, 2. Kunden / Artikel, 20. Hilfsmittelhistorie, 21. DV-Historie, 22. Hilfsmittelhistorie, 6. Hilfsmittelnavigator, DV-Historie pruefen, Export-Quelle oeffnen, Kunde-Historie oeffnen, Musterartikel eindeutig aufloesen, Start, Vorgaenge oeffnen, Vorgangsliste pruefen, [REDACTED] navigieren |
| User/Workspace | POST | `/apigateway/userservice/workspaces/log` | 200, 500 | 116 | Schreibt oder berechnet Daten im Bereich User/Workspace. | DV-Historie pruefen, Export-Quelle oeffnen, Kundendetail oeffnen, Start |
| Filialen/Mandant | GET | `/apigateway/department/departments` | 200 | 92 | Liest Detail- oder Referenzdaten im Bereich Filialen/Mandant. | 1., 11. Ansprechpartner, 17. Hilfsmittelhistorie, 4. Detail oeffnen, DV-Historie pruefen, Export-Quelle oeffnen, Neuer Vorgang aus Kundenhistorie starten, Start, Vorgaenge oeffnen, Vorgangsliste pruefen, [REDACTED] navigieren |
| User/Workspace | POST | `/apigateway/userservice/metrics/user-login` | 200 | 68 | Schreibt oder berechnet Daten im Bereich User/Workspace. | 1., Export-Quelle oeffnen, Start, Vorgaenge oeffnen, [REDACTED] navigieren |
| User/Workspace | GET | `/apigateway/user-details` | 200 | 67 | Liest Detail- oder Referenzdaten im Bereich User/Workspace. | Export-Quelle oeffnen |
| Artikel/Warenbestand | POST | `/apigateway/articletenantservice/articles/simple-search` | 200 | 58 | Sucht oder liest Artikelstamm, Preise, Lieferanten, Bestand oder Muster. | 3. Kunden / Artikel, Export ausloesen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Musterartikel fuer Vorgangsposition suchen, Musterartikel suchen und Kontext laden, Start |
| Kunden/Vorgaenge | GET | `/apigateway/sales/salesprocesses/kpi-statistics` | 200 | 56 | Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug. | 1., 11. Ansprechpartner, 18. App-Menue, Export-Quelle oeffnen, Musterkunde suchen, Start, Vorgaenge oeffnen, [REDACTED] navigieren, [REDACTED]: orderNr leerer Suchtext |
| Abrechnung/Kasse | GET | `/apigateway/accounting/payment-terms` | 200 | 53 | Liest Detail- oder Referenzdaten im Bereich Abrechnung/Kasse. | 2. App-Menue, 2. Kunden / Artikel, 25. Kundendaten, 27. Kundendaten, 3. Kunden / Artikel, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Start, UI-Zeile [REDACTED] |
| Warenwirtschaft/Bestellung | GET | `/apigateway/wawi/storage-locations` | 200 | 47 | Liest Detail- oder Referenzdaten im Bereich Warenwirtschaft/Bestellung. | 2. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, DV-Historie pruefen, Musterartikel eindeutig aufloesen, Start, Wareneingang buchen, [REDACTED] navigieren |

