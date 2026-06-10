# Omnia Hands-off Explorer Design

## Ziel

Ein lokales Analyse-Tool soll Omnia moeglichst weitgehend automatisch erkunden, parallel den Netzwerkverkehr fuer API-Verstaendnis aufzeichnen und daraus redacted Dokumentation erzeugen. Das Tool darf fuer normale Exploration keine produktiven Fachaktionen ausloesen. Schreibende Tests laufen nur in einem klar getrennten Sandbox-Modus mit Testaccount, Musterkunden und Musterartikeln.

## Nicht-Ziele

- Keine Umgehung von Schutzmechanismen.
- Keine Veraenderung von Originaldateien der ERP.
- Keine echten Patientendaten, Tokens, Cookies oder Zugangsdaten in Logs, Markdown oder OpenAPI.
- Kein frei laufender Auto-Writer, der beliebige Buttons anklickt.
- Kein Commit von Logs, Storage-State, HAR-Dateien oder `.env`.

## Gewaehlter Ansatz

Das System wird in zwei Modi getrennt:

1. **Hands-off Read-only Explorer**
   - startet Omnia lokal ueber Playwright/Chromium mit Electron-Stub oder verbindet sich per CDP mit einer laufenden Electron-/Chromium-Instanz
   - wartet optional auf manuellen Login
   - erkundet Navigation, App-Menue, Tabs, Listen, Such- und Detailansichten
   - zeichnet Requests, Responses und WebSocket-Frames mit bestehender Redaction auf
   - blockiert gefaehrliche Methoden und UI-Aktionen
   - erzeugt API-Katalog, Flow-Mapping, OpenAPI-Vorbereitung und Explorer-Report

2. **Sandbox Writer**
   - wird spaeter separat gebaut
   - nutzt nur einen Testaccount und explizit markierte Musterkunden/Musterartikel
   - fuehrt nur feste Playbooks aus, keine freie UI-Erkundung
   - schreibt vor jeder fachlichen Schreibaktion Marker in den Log
   - validiert danach, ob die Aktion sichtbar rueckgaengig gemacht oder sauber deaktiviert werden kann

Der Read-only Explorer ist der Default. Der Sandbox Writer muss explizit gestartet werden.

## Komponenten

### `tools/explore-hands-off.ts`

CLI-Orchestrator fuer vollautomatische Read-only-Erkundung. Verantwortlich fuer:

- Start/Connect: `--stub --url ...` oder `--cdp ...`
- Login-Wartepunkt: `--wait-for-login`
- Laufgrenzen: `--max-steps`, `--max-minutes`, `--max-depth`
- Network Logger aktivieren
- Exploration starten
- Reports und Kataloge am Ende neu erzeugen

### `tools/explorer/policies.ts`

Zentrale Sicherheitsregeln:

- erlaubte UI-Ziele
- blockierte UI-Labels
- blockierte Routen
- erlaubte Read-like-POSTs
- blockierte Telemetrie- und Schreibrequests
- spaetere Sandbox-Write-Allowlist

Diese Regeln muessen ohne Browser testbar sein.

### `tools/explorer/state.ts`

Crawler-Zustand:

- besuchte Routen
- geklickte Ziele
- uebersprungene Ziele
- blockierte Requests
- erkannte Screens
- Zuordnung von UI-Schritt zu API-Requests

### `tools/explorer/candidates.ts`

DOM-Sammlung und Bewertung sichtbarer UI-Ziele:

- Links
- Tabs
- App-Menue
- App-Kacheln
- Filter-/Suchmasken ohne Speichern
- Detail-Links nur, wenn sie als read-only klassifiziert sind

### `tools/explorer/report.ts`

Erzeugt redacted Artefakte:

- `docs/06_auto_explore_report.md`
- `docs/04_flow_to_api_mapping.md`
- aktualisiert `docs/03_api_catalog.md`
- aktualisiert `openapi/omnia-observed.openapi.yaml`

### `tools/explorer/scenarios/*.ts`

Spaetere Playbooks fuer den Sandbox Writer. Beispiele:

- `customer-search.ts`
- `open-sample-customer.ts`
- `article-search.ts`
- `add-sample-article-to-sample-process.ts`
- `deactivate-or-cleanup-sample-change.ts`

Playbooks enthalten keine Zugangsdaten und keine echten Patientendaten.

## Datenfluss

1. Tool startet Browser oder verbindet sich per CDP.
2. Electron-Stub wird bei lokalem Chromium vor dem App-Bundle injiziert.
3. User loggt sich manuell ein oder ein lokales, ignoriertes Testprofil ist bereits angemeldet.
4. Network Logger startet JSONL-Aufzeichnung unter `logs/network/`.
5. Crawler sammelt sichtbare Kandidaten.
6. Policy klassifiziert Kandidaten als erlaubt, blockiert oder unbekannt.
7. Vor jedem Klick wird ein Flow-Marker geschrieben.
8. Network Guard bewertet jeden Request vor Ausfuehrung.
9. Unerlaubte Requests werden abgebrochen und dokumentiert.
10. Nach Laufende werden Reports/Katalog/OpenAPI aus redacted Logs neu erzeugt.

## Sicherheitsregeln

- Read-only bleibt Standard.
- `PUT`, `PATCH`, `DELETE` sind im Read-only-Modus immer blockiert.
- `POST` ist nur fuer Auth, Suche, Listen, Zaehler, Lookups und Konfiguration erlaubt.
- Telemetrie-POSTs werden blockiert und dokumentiert.
- Labels wie `Speichern`, `Loeschen`, `Buchen`, `Senden`, `Anlegen`, `Neu`, `Hinzufuegen`, `Uebernehmen`, `Stornieren`, `Abschliessen`, `Bestellen`, `Drucken`, `Import`, `Export` bleiben blockiert.
- Body-Capture ist standardmaessig aus.
- API-Kataloge enthalten keine Body-Beispiele.
- Alle Logs werden vor jeder Doku-Generierung erneut redacted.
- Testaccount-Zugangsdaten duerfen nur in lokaler `.env` oder per interaktivem Login genutzt werden.

## Sandbox Writer Regeln

Der Sandbox Writer wird erst nach erfolgreichem Read-only-Ausbau gebaut.

- Start nur mit Flag wie `--sandbox-write`.
- Erfordert lokale Config mit eindeutigen Musterkennungen, zum Beispiel Musterkunden-ID oder Suchbegriff.
- Fuehrt nur Playbooks aus, die einen erwarteten Startscreen und erwartete UI-Labels pruefen.
- Jede Schreibaktion schreibt vorher und nachher einen Marker.
- Jede Aktion muss eine Validierung haben, die den neuen Zustand als Muster-/Testzustand erkennt.
- Cleanup oder Deaktivierung wird als eigener Schritt dokumentiert.
- Wenn ein erwartetes Element fehlt oder ein unerwarteter Schreibrequest entsteht, stoppt das Tool.

## Fehlerbehandlung

- Bei unerwartetem Schreibrequest: Request abbrechen, Marker schreiben, Report erzeugen, Lauf stoppen.
- Bei Login-Timeout: keine Exploration starten, Report mit Stop-Grund erzeugen.
- Bei unbekanntem Screen: Screenshot nur optional und lokal unter ignoriertem `logs/`, keine Einbettung in Markdown ohne Pruefung.
- Bei Redaction-Warnung: Katalog/OpenAPI nicht aktualisieren.
- Bei Playwright-Timeout: Ziel als skipped markieren und fortfahren, solange keine Schreibgefahr besteht.

## Tests

Pflichttests:

- Policy: UI-Labels und Routen werden korrekt erlaubt/blockiert.
- Policy: Read-like-POSTs werden erlaubt, mutierende Methoden blockiert.
- Redaction: CamelCase-Personenfelder, Header, Query, Body und Freitext werden maskiert.
- Reporter: keine Body-Beispiele und keine sensiblen Werte in Markdown.
- Orchestrator: Login-Wartepunkt, Laufgrenzen und Stop-Gruende.

Manuelle Verifikation:

- lokaler Stub-Lauf mit `--wait-for-login`
- CDP-Lauf gegen sichtbare VM-Instanz
- Redaction-Scan ueber `docs/`, `openapi/` und neue JSONL-Datei

## Umsetzungsetappen

1. Bestehenden `tools/explore-app.ts` in kleinere Module unter `tools/explorer/` aufteilen, ohne Verhalten zu aendern.
2. `tools/explore-hands-off.ts` als Orchestrator ueber diesen Modulen bauen.
3. Exploration verbessern: App-Menue tiefer crawlen, Detailseiten konservativ erlauben, Suchmasken read-only verwenden.
4. Reporting erweitern: Screens, Schritte, blockierte Requests, Endpunktgruppen und Coverage.
5. Sandbox Writer separat planen und erst danach implementieren.

## Akzeptanzkriterien

- Der Read-only-Orchestrator kann lokal mit Stub und optional per CDP laufen.
- Ein Lauf erzeugt JSONL, Explorer-Report, API-Katalog und OpenAPI-Vorbereitung.
- Unerwartete Schreibrequests werden vor Ausfuehrung abgebrochen.
- Markdown/OpenAPI enthalten keine Secrets, Tokens, Cookies, Namen, Geburtsdaten, Versicherungsnummern, Telefonnummern, E-Mail-Adressen oder Adressen.
- Tests fuer Policy, Redaction und Report laufen lokal erfolgreich.
- Sandbox-Schreiblogik ist nicht im Read-only-Orchestrator aktivierbar.
