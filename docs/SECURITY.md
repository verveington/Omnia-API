# Sicherheitsregeln

## Grundregeln

- Keine echten Patientendaten committen.
- Keine Tokens, Cookies, Sessiondaten, Machine-IDs, Tenant-IDs oder Zugangsdaten committen.
- Keine Originaldateien der ERP veraendern.
- Analyse- und Dokumentationsdateien separat halten.
- Logs bleiben lokal und werden nicht geteilt.
- Redaction ist Pflicht vor jeder Dokumentation.

## Logging

- Network-Logs nur unter `logs/network/` schreiben.
- Raw-HAR-Dateien nicht committen.
- Response-Bodies nur speichern, wenn sie vorher durch `tools/redact.ts` laufen.
- Bei Unsicherheit Body-Erfassung mit `--no-bodies` deaktivieren.
- Vor jeder manuellen Uebernahme in Markdown nochmals redakten.
- Auswertungen duerfen statische Assets nicht als API-Endpunkte behandeln; Kataloge und Flow-Reports filtern auf API-nahe `fetch`-/`xhr`-Records.

## Playwright

- Nur berechtigte eigene Test-/Analyseumgebungen verwenden.
- Keine produktiven ERP-Daten veraendern.
- Schreibende Fachprozesse nur nach expliziter manueller Freigabe ausfuehren.
- Flow-Marker nutzen, damit Requests nachvollziehbar bleiben.

## Read-only Auto-Explorer

- `tools/explore-hands-off.ts` ist der bevorzugte Einstiegspunkt fuer hands-off Read-only-Erkundung.
- `tools/explore-app.ts` bleibt als Kompatibilitaetsalias erhalten und nutzt dieselben Sicherheitsregeln.
- Read-only-Explorer nur mit aktivem Write-Guard verwenden.
- PUT, PATCH und DELETE muessen blockiert bleiben.
- POST darf nur fuer read-like Endpunkte wie Suche, Listen, Zaehler oder Konfiguration erlaubt werden.
- Telemetrie-POSTs werden abgebrochen und dokumentiert.
- Request- und Response-Bodies bleiben im Explorer standardmaessig deaktiviert.
- Erste Schreibversuche mit Musterkunden oder Musterartikeln muessen in einem separaten, manuell bestaetigten Write-Lab laufen.

## Write-Lab

- `tools/write-lab.ts` darf schreibende Wawi-Flows nur mit eindeutig aufgeloestem Testkunden und Testartikel ausfuehren.
- Standard-Testobjekte sind `Max Mustermann` und `Musterartikel`; bei 0 oder mehreren Treffern bricht der Runner vor dem ersten Write ab.
- Selection-Writes muessen `includeAll: false` und konkrete IDs verwenden.
- Deletes, Stornos, Imports, Uploads, externe E-Mail und automatische Unit-Mismatch-Aufloesung bleiben blockiert.
- Nach jedem Write muss ein Read-back erfolgen; `process-order` laeuft erst nach eindeutiger Bestellung-/Positionspruefung.
- Wareneingang bleibt optional und darf nur mit eindeutigem Liefer-, Lager- und Positionskontext gebucht werden.

## Gitignore-Pflicht

Folgende Muster muessen ignoriert bleiben:

- `logs/`
- `*.har`
- `*.sqlite`
- `*.db`
- `.env`
- `session*`
- `storageState.json`

## Umgang mit Funden

- API-Endpunkte nur dokumentieren, wenn sie beobachtet wurden.
- Unsichere Interpretationen als TODO markieren.
- Keine Annahmen als Fakten formulieren.
- Keine personenbezogenen Beispielwerte in `docs/` oder `openapi/` uebernehmen.
