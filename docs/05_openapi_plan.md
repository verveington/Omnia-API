# OpenAPI-Vorbereitung

Ziel: Aus redacted Playwright-Netzwerklogs eine beobachtete OpenAPI-Spezifikation ableiten, ohne Endpunkte oder Schemas zu raten.

## Datenquelle

- Primaere Quelle: `logs/network/*.jsonl`, erzeugt mit `tools/record-network.ts` oder bevorzugt `tools/record-flow.ts`, wenn fachliche Zusammenhaenge verstanden werden sollen.
- Jede JSONL-Zeile muss bereits redacted sein.
- Bodies duerfen nur uebernommen werden, wenn `tools/redact.ts` angewendet wurde.
- Katalog und Flow-Reports werten nur API-nahe `fetch`-/`xhr`-Records aus; statische Assets wie Bilder, Fonts, JavaScript und CSS bleiben ausserhalb der API-Dokumentation.
- Bestehende Alt-Captures unter `playwright-recorder/captures/` nur nach manueller Datenschutzpruefung verwenden.

## Ableitungsschritte

1. Logs erzeugen:
   - Pro fachlichem Flow eine getrennte Session aufnehmen.
   - Mit `tools/record-flow.ts` Schrittmarker setzen, damit Endpunkte Fachprozessen zugeordnet werden koennen.
   - Nach der Session den automatisch erzeugten Bericht unter `docs/recordings/<timestamp>-flow.md` pruefen: Sequenz, neue Endpunkte, Statuscodes und vermutete Funktion.
2. Katalog bauen:
   - `node tools/build-api-catalog.ts` gruppiert nach Host, Pfad, Methode und Statuscode.
   - Ergebnis: `docs/03_api_catalog.md`.
3. Pfade normalisieren:
   - UUID-Segmente als `{uuid}` markieren.
   - Rein numerische Segmente als `{id}` markieren.
   - Nur normalisieren, wenn das Segment in beobachteten URLs vorkam.
4. Methoden und Statuscodes uebernehmen:
   - Nur beobachtete HTTP-Methoden eintragen.
   - Nur beobachtete Statuscodes eintragen.
5. Schemas ableiten:
   - Gemeinsame Felder aus mehreren redacted Beispielen extrahieren.
   - Unsichere oder nur einmal beobachtete Felder als `TODO` markieren.
   - Personenbezogene Beispielwerte niemals in `examples` uebernehmen.
6. Fachprozesse verknuepfen:
   - Flow-Marker aus `tools/record-flow.ts` als `x-observed-flow` oder Beschreibung uebernehmen.
   - Ohne Marker nur heuristische TODOs notieren.

## Regeln fuer `openapi/omnia-observed.openapi.yaml`

- Keine geratenen Endpunkte.
- Keine geratenen Request-Bodies.
- Keine echten Tokens, Cookies, Namen, Geburtsdaten, Versichertennummern, Telefonnummern, E-Mails oder Adressen.
- Unsichere Schemas bleiben `TODO`.
- Schreiboperationen zusaetzlich mit `x-risk: high` markieren, sobald beobachtet.
- Binary-/Dokument-Responses nur als `application/octet-stream` oder TODO beschreiben, keine Inhalte speichern.

## Aktueller Stand

`openapi/omnia-observed.openapi.yaml` ist eine beobachtungsbasierte Arbeitsdatei. Wenn noch keine neuen `logs/network/*.jsonl` existieren, enthaelt sie nur ein leeres `paths`-Objekt und den bekannten Host aus der lokalen Konfiguration als TODO-Server.

Naechster Schritt: Eine redacted Flow-Aufzeichnung erzeugen und danach `node tools/build-api-catalog.ts` erneut ausfuehren.
