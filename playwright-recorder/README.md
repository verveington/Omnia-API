# Omnia Playwright Recorder

Zeichnet API-Verkehr von `https://api2.optica-omnia.de` auf, indem ein
sichtbares Chromium die Web-App steuert. Der Renderer wird mit einem
Stub gefuettert, der den echten Electron-Wrapper imitiert — sonst
verweigert die App den Login mit "Arbeitsplatzkennung kann nicht
bestimmt werden".

## Setup

```bash
npm install
npm run install:browsers
cp .env.example .env.local
```

`.env.local` ausfuellen — siehe Abschnitt **Pflicht-Konfiguration**.

## Aufzeichnung

```bash
npm run record
```

1. DSGVO-Banner erscheint im Terminal — Recording enthaelt Gesundheitsdaten, Captures nicht teilen.
2. Chromium oeffnet `https://api2.optica-omnia.de`. Wenn der Stub korrekt geladen wurde, kommt direkt das Anmelde-Formular (sonst der Fehler "Arbeitsplatzkennung konnte nicht bestimmt werden").
3. Manuell einloggen.
4. Enter im Terminal → Recording wird aktiv.
5. In der App navigieren — jeder API-Call wird mitgeschrieben.
6. Enter im Terminal → Aufzeichnung beenden, Summary wird geschrieben, Browser schliesst.

## Pflicht-Konfiguration

Die App prueft eine Arbeitsplatzkennung. Du brauchst eine bestehende
Optica-Omnia-Installation (z. B. die Windows-VM unter Parallels), um die
Werte einmalig zu extrahieren.

Auf Windows liegt die Datei `optica.sign` an einem von zwei Orten:

- `C:\ProgramData\Optica_Omnia\optica.sign` (geteilte Installation)
- `%APPDATA%\Optica Omnia\optica.sign` (User-spezifisch)

Inhalt ist base64-codiertes JSON: `{"machineId":"...","tenantId":"..."}`.

Drei Optionen, das in den Recorder zu fuettern:

**Option A — Datei lokal mounten und Pfad referenzieren** (Standard, wenn die Parallels-VM gemountet ist):
```env
OMNIA_OPTICA_SIGN_PATH=/Volumes/.../AppData/Roaming/optica-omnia/optica.sign
```

**Option B — Datei kopieren und Pfad setzen:**
```env
OMNIA_OPTICA_SIGN_PATH=/Users/<dein-user>/some/path/optica.sign
```

**Option C — Werte direkt eintragen** (PowerShell-Dekodierung in der VM):
```powershell
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((Get-Content "C:\ProgramData\Optica_Omnia\optica.sign" -Raw)))
```
Output ins `.env.local`:
```env
OMNIA_MACHINE_ID=68e2b6df...
OMNIA_TENANT_ID=502753
```

## Optionale Konfiguration

| Env-Var | Default | Zweck |
|---|---|---|
| `OMNIA_URL` | `https://api2.optica-omnia.de` | Ziel-URL |
| `OMNIA_APP_VERSION` | `stub-0.0.0` | Vorgegaukelte Electron-App-Version |
| `OMNIA_CAPTURE_BODIES` | `1` | `0` deaktiviert das Speichern von JSON-Response-Bodies |
| `OMNIA_REDACT_HEADERS` | `1` | `0` deaktiviert das Maskieren sensibler Header (`Authorization`, `Cookie`, `Set-Cookie`, `X-Auth-Token`, `X-CSRF-Token`) |
| `OMNIA_WINDOW_WIDTH` / `OMNIA_WINDOW_HEIGHT` | `1440` / `900` | Groesse des sichtbaren Chromium-Fensters |
| `OMNIA_VIEWPORT_WIDTH` / `OMNIA_VIEWPORT_HEIGHT` | `1440` / `820` | Content-Viewport der Omnia-Web-App; niedrigere Hoehe hilft, wenn untere Bedienelemente abgeschnitten sind |
| `OMNIA_USERNAME` / `OMNIA_PASSWORD` / `OMNIA_*_SELECTOR` | — | Wenn alle 5 gesetzt: Auto-Login statt manuelles Einloggen |

## Wie der Stub funktioniert

Die Web-App ist als Electron-App gebaut. Im Renderer prueft sie
`window.isElectron` und ruft ueber `window.ipcRenderer` Daten ab, die
ein echter Electron-Main-Process via IPC liefern wuerde. In Playwright
gibt es keinen Electron-Main — deshalb injiziert
[src/electron-ipc-stub.js](src/electron-ipc-stub.js) vor dem
Angular-Bundle ein gefaelschtes `window.ipcRenderer`-Objekt, das die
relevanten Kanaele beantwortet:

| Kanal | Antwort |
|---|---|
| `get-machine-file-data` | `{machineId, tenantId}` aus `.env.local` |
| `get-fingerprint-info` | Stub-Fingerprint |
| `get-electron-config` (sync) | `{url, clearCache:false, version}` |
| `create-machine-file-data` | Echo, aktualisiert `tenantId` im Stub |
| `electron-log`, `logout` | No-Op |
| Hardware-Channels (Drucker, Scanner, TSE, Signpad, Telecash) | No-Op — funktionieren nicht in Playwright, das brauchen wir fuer reines API-Recording auch nicht |

`window.isElectron` wird auf `true` gesetzt, sonst nutzt der Renderer den Fallback und sendet z. B. `machineId: null`, was die Web-App ablehnt.

## Output (`captures/`)

Pro Run drei Artefakte mit Timestamp:

- `api-traffic-<ts>.jsonl` — Roh-Stream, eine Zeile pro Request, eine pro Response. Felder:
  - `type`, `time`, `method`, `url`, `path` (roh), `normalizedPath` (UUIDs/IDs → `{uuid}`/`{id}`)
  - `headers` / `responseHeaders` (sensible redacted)
  - `postData` / `requestPostData` (parsed JSON falls moeglich)
  - `status`, `statusText`, `contentType`, `bodyFile`-Referenz
- `api-summary-<ts>.json` — aggregiert pro `METHOD normalizedPath`:
  - `calls`, `statuses` (Verteilung), bis zu 3 Beispiele mit echten URLs/Bodies
- `bodies/<method>-<hash>.json` — JSON-Response-Bodies einzeln abgelegt (nur wenn `OMNIA_CAPTURE_BODIES=1`)

## Aggregation

Im Summary werden `/customers/abc-uuid-...` und `/customers/def-uuid-...`
zu einer Zeile `GET /customers/{uuid}` zusammengefasst. Die echten
URLs bleiben in `examples[]` und im JSONL erhalten — keine
Informationsverlust, nur ein lesbares Aggregat.

## Captures in die Doku zurueckfuehren

Nach jeder Aufnahme kannst du die Doku und eine OpenAPI-Rohfassung
automatisch aktualisieren:

```bash
npm run analyze
```

Ohne Argument nimmt das Script die neueste `captures/api-summary-*.json`.
Mit Argument kannst du eine bestimmte Aufnahme auswerten:

```bash
npm run analyze -- captures/api-summary-2026-05-14T21-08-32-142Z.json
```

Output:

- [../docs/playwright-api-recording-analysis.md](../docs/playwright-api-recording-analysis.md) — lesbare API-Auswertung mit Services, Pfaden, Methoden, Query-Keys und groben Schemas
- [../docs/openapi.generated.json](../docs/openapi.generated.json) — OpenAPI-3.1-Rohfassung fuer Tools, Mocking oder Client-Generierung

Die Pfad-Dokumentation [../docs/api2-backend-paths.md](../docs/api2-backend-paths.md) bleibt die groessere statische Gesamtliste aus dem Angular-Bundle. Die Playwright-Analyse zeigt dagegen nur Endpunkte, die in echten Workflows erfolgreich aufgerufen wurden.

## DSGVO

Captures koennen Patientendaten, Versichertennummern, Diagnosen,
Rezeptdaten enthalten. `captures/` ist per `.gitignore` ausgeschlossen.
Sensible Header werden standardmaessig redacted. **Captures niemals
unverschluesselt teilen oder in Repos committen.**

## Bekannte Limits

- Filter `isApiUrl(url)` erfasst nur Pfade, die `/apigateway/` enthalten. Auth-Endpoints oder CDN-Assets werden ignoriert.
- WebSocket-Verkehr wird nicht aufgezeichnet.
- Hardware-Channels (Drucker, Scanner, TSE) sind im Stub No-Ops — Funktionen, die diese voraussetzen, werden in der Aufzeichnung Fehler werfen. Reines API-Discovery funktioniert trotzdem.
- Bei harten `requestfailed`-Events ohne Response erscheint der Request im JSONL, aber keine Response-Zeile. Status-Diagnose dann nur am Browser-DevTools.
