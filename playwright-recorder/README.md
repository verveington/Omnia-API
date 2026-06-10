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

## Chat-first Voice Control

Stage 1 startet das Chat-/Voice-Panel mit:

```bash
npm run native:voice
```

Default-URL:

```text
http://127.0.0.1:8787/
```

Der lokale Server kann auch ohne Omnia-Verbindung starten. Die Verbindung
zur nativen App wird danach im Panel gewaehlt oder per Env-Var
vorgegeben:

- `none`: ohne lokale App starten.
- `launch`: lokale Omnia-App in der VM starten.
- `attach`: an eine bereits laufende Debug-App andocken.

```env
OMNIA_NATIVE_AUTOCONNECT=none|launch|attach
```

Lokale KI-Konfiguration, z. B. fuer Ollama oder eine kompatible
OpenAI-API:

```env
OMNIA_AI_BASE_URL=http://127.0.0.1:11434/v1
OMNIA_AI_MODEL=qwen2.5:7b
OMNIA_AI_API_KEY=ollama
OMNIA_AI_TIMEOUT_MS=8000
```

`OMNIA_AI_TIMEOUT_MS` ist optional und begrenzt die Wartezeit auf die
lokale KI-Antwort.

Sicherheitsverhalten in Stage 1:

- Sichere Navigationen und Ansichten werden direkt ausgefuehrt.
- Formularfuellung, Speichern, Loeschen, OK/Weiter/Ja, Beenden,
  Passwort und Mandantennummer werden als Action Card geblockt.
- `Trotzdem ausfuehren` sendet exakt den erkannten Befehl an
  `/api/command`; es gibt dabei keine zweite KI-Entscheidung.

Wenn Omnia verbunden ist, lernt der Recorder UI-Aktionen und
`/apigateway/`-API-Verkehr parallel. API-Beobachtungen werden als
`apiObservations` am gelernten Befehl gespeichert. Sie sind noch keine
automatischen API-Schreibaktionen.

## Native Windows-App per CDP testen

Die installierte Windows-/Electron-App kann kontrolliert mit einem
Chrome-DevTools-Port gestartet werden. Das Script startet dafuer eine
separate Omnia-Instanz in der Parallels-VM, setzt temporaer eine Windows
`portproxy`-Weiterleitung und verbindet Playwright vom Mac aus.

Einmaliger Probe-Lauf:

```bash
npm run native:probe
```

Interaktive Session, die offen bleibt bis Enter im Terminal gedrueckt wird:

```bash
npm run native:session
```

In der Session gibt es zunaechst eine textbasierte Befehlszeile. Diese
ist die Vorstufe fuer Spracheingabe: Ein Speech-to-Text/Intent-Layer
muss spaeter nur dieselben Befehle erzeugen.

Aktuelle Befehle:

```text
hilfe
status
fokus loginfeld
benutzername
passwort
tippe <text>
tippe mandantennummer
enter
tab weiter
tab zurueck
escape
feld leeren
klick anmelden
klick <button oder sichtbarer text>
gehe zu <navigationseintrag>
wechsel zu <tab>
waehle <option>
zeige <bereich>
starte <aktion>
oeffne <sichtbarer text>  # Alias, wenn es sprachlich passt
fuelle <feld> mit <text>
suche <text>
suche kunde <text>
zurueck
vorwaerts
neu laden
scroll runter
scroll hoch
beenden
```

Beispiel:

```text
omnia> benutzername
omnia> tippe test@example.local
omnia> passwort
omnia> beenden
```

## Spracheingabe testen

Das Voice-Panel startet dieselbe native Omnia-CDP-Verbindung und oeffnet
zusaetzlich einen lokalen Webserver. Die Spracheingabe laeuft im Browser
ueber die Web Speech API; dieselben Befehle koennen auch in ein Textfeld
getippt werden.

```bash
npm run native:voice
```

Dann im Browser oeffnen:

```text
http://127.0.0.1:8787
```

Das Panel hat Buttons fuer haeufige Befehle, ein Textfeld und einen
Start/Stop-Knopf fuer das Mikrofon. Chrome/Edge unterstuetzen die Web
Speech API am zuverlaessigsten; Safari kann je nach Version und
Berechtigung eingeschraenkt sein.

Im Panel kann ausserdem ein Lernmodus gestartet werden. Er laeuft
waehrend der normalen Arbeit in der echten Omnia-App weiter und baut aus
Klicks, Tabs, Auswahllisten, Eingaben und Enter/Tab/Escape einen
Befehls-Katalog auf:

1. `Lernmodus starten` klicken.
2. In der echten Omnia-App klicken, tippen oder Enter/Tab/Escape nutzen.
3. Das Panel aktualisiert alle paar Sekunden die neu erkannten Befehle.
4. `Lernmodus stoppen` beendet die Aufzeichnung, der Katalog bleibt erhalten.

Der Katalog enthaelt kontextbezogene Sprachbefehle wie
   `gehe zu Vorgaenge`, `wechsel zu Historie`, `waehle Bitte waehlen`,
   `klick Speichern`, `fuelle Nachname mit <text>` oder `enter`.
Diese Befehle koennen danach auch natuerlicher formuliert werden, z. B.
`geh bitte zu den Vorgaengen`, `zeig mir die Dokumente`,
`speichere das bitte` oder `leg eine neue Notiz an`.

Gespeichert werden nur abgeleitete Befehle und Aliase, nicht die rohen
Recorder-Events. Eingabewerte werden nicht dauerhaft als konkrete
Befehle vorgeschlagen; Ausnahme ist die bekannte Mandantennummer
`502753`, die als `tippe mandantennummer` erkannt wird. Der Standardpfad
fuer den Katalog ist `captures/native-command-catalog.json`.

Der Button `Dashboard-Explorer starten` fuehrt denselben Lernvorgang
selbststaendig aus. Der Explorer startet standardmaessig beim Dashboard,
oeffnet dort sichere Menues und verfolgt sichtbare interne
Navigationspunkte und Unterpunkte.

- erlaubt sind Tabs, das App-Menue und interne Routen.
- dynamische Detailseiten sowie Pfade mit `new`, `create`, `edit`,
  `delete`, `remove`, `login` oder `logout` werden blockiert.
- der Explorer tippt nichts ein.
- Aktionsbuttons wie Speichern, Neu, OK, Weiter, Loeschen oder
  Abbrechen werden nicht geklickt.
- Nach dem Lauf versucht der Explorer, zur urspruenglichen Seite
  zurueckzukehren.

## KI-Konversation Stufe 1

Das Voice-Panel schickt natuerliche Sprache zuerst an ein lokales oder
per SSH getunneltes KI-Modell. Der Server nutzt eine OpenAI-kompatible
Chat-Completions-API, bleibt aber unabhaengig von Cloud-Anbietern. Der
Default ist Ollama lokal:

```env
OMNIA_AI_BASE_URL=http://127.0.0.1:11434/v1
OMNIA_AI_MODEL=qwen2.5:7b
OMNIA_AI_API_KEY=ollama
OMNIA_AI_TIMEOUT_MS=8000
```

Lokaler Start:

```bash
ollama pull qwen2.5:7b
ollama serve
npm run native:voice
```

Auf einem kostenlosen eigenen SSH-/GPU-Server kann derselbe Port auf den
Mac getunnelt werden:

```bash
ssh -L 11434:127.0.0.1:11434 user@server
```

Danach spricht der Omnia-Server weiterhin mit
`http://127.0.0.1:11434/v1/chat/completions`, waehrend das Modell auf
dem Server laeuft. Alternativ funktionieren vLLM, llama.cpp oder LM
Studio, solange sie eine kompatible `/v1/chat/completions`-Route
bereitstellen. Falls der Pfad abweicht, kann er direkt gesetzt werden:

```env
OMNIA_AI_CHAT_ENDPOINT=http://127.0.0.1:8000/v1/chat/completions
OMNIA_AI_MODEL=qwen2.5:14b
OMNIA_AI_API_KEY=local-secret
```

Empfehlung:

- `qwen2.5:7b` als Standard fuer lokale Rechner: gut fuer deutsche
  Intent-Erkennung und schnell genug fuer Stufe 1.
- `qwen2.5:14b` auf einem staerkeren SSH-/GPU-Server: bessere
  Dialogqualitaet und robustere Zuordnung gelernter Befehle.
- kleinere Qwen-/Llama-Varianten nur, wenn RAM oder CPU knapp sind.

Stufe 1 fuehrt nur sichere Navigations- und Ansichtsaktionen aus. Tippen,
Formularfuellung, Speichern, Loeschen, OK/Weiter/Ja und Beenden werden
erkannt, aber zuerst als Action Card geblockt und erklaert. Ueber
`Trotzdem ausfuehren` kann der exakt erkannte Befehl trotzdem direkt an
`/api/command` geschickt werden.

Wenn die Omnia-Instanz bereits laeuft und eingeloggt ist, kann der
Server ohne Neustart der Windows-App wieder an das bestehende CDP-Target
andocken:

```bash
OMNIA_NATIVE_AUTOCONNECT=attach npm run native:voice
```

Wichtige Eigenschaften:

- Die bestehende normale Omnia-Instanz wird nicht beendet.
- Gesteuert wird nur die Instanz mit dem konfigurierten
  `--remote-debugging-port`.
- Standardmaessig wird ein isoliertes Windows-Profil unter
  `C:\Temp\omnia-cdp-profile` verwendet.
- Beim Beenden entfernt das Script Debug-Prozess, `portproxy`,
  Firewall-Regel und das temporaere Profil wieder.

Konfiguration per `.env.local`:

```env
OMNIA_VM_NAME=Windows 11
OMNIA_VM_IP=
OMNIA_NATIVE_APP_PATH=C:\Users\christophschernthane\AppData\Local\Programs\Optica Omnia\Optica Omnia.exe
OMNIA_NATIVE_PROFILE_PATH=C:\Temp\omnia-cdp-profile
OMNIA_NATIVE_GUEST_DEBUG_PORT=9225
OMNIA_NATIVE_HOST_DEBUG_PORT=9226
```

Wenn `OMNIA_VM_IP` leer ist, liest das Script die IP aus
`prlctl list -i "<VM-Name>"`. Die Weiterleitung ist noetig, weil Electron
den DevTools-Port in Windows nur an `127.0.0.1` bindet.

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
