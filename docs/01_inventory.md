# Projektinventar

Stand: 2026-05-21

## Scope

Analysiert wurde der lokale Workspace `/Users/christophschernthaner/Optica Omnia` mit Fokus auf die extrahierte Electron-App unter `tmp/app-asar-unpacked`. Originaldateien der ERP wurden nur gelesen, nicht veraendert.

## Struktur

| Pfad | Rolle | Hinweis |
|---|---|---|
| `tmp/app-asar-unpacked/` | Extrahierter `app.asar`-Inhalt | Enthält Electron-Main, Preload, TypeScript-Quellen und kompilierte JS-Dateien. |
| `resources/app.asar` | Original-ASAR | Nicht veraendert. |
| `environment.json` | Runtime-Konfiguration | Enthält die Stage-/App-URL `https://api2.optica-omnia.de`. |
| `resources/app-update.yml` | Auto-Update-Konfiguration | Verweist auf `https://eupdate.optica-omnia.de/prod2`. |
| `playwright-recorder/` | Bereits vorhandenes internes Analyse-/Recorder-Tooling | Separat von der ERP-App. Enthält CDP- und API-Recorder-Logik. |
| `companion-app/` | Bereits vorhandene interne Companion-App | Separates internes Projekt, nicht Teil des extrahierten ASAR. |

## Vermuteter App-Einstiegspunkt

| Datei | Beobachtung | Status |
|---|---|---|
| `tmp/app-asar-unpacked/package.json` | `"main": "main.js"` | Vermuteter Electron-Einstiegspunkt. |
| `tmp/app-asar-unpacked/main.js` | Initialisiert TSE-Pfade und ruft `new ElectronMain().run()` auf. | Bestaetigt fuer lokalen ASAR-Code. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | Erstellt `BrowserWindow`, setzt IPC-Handler und lädt `ElectronMain._getStageURL()`. | Zentrale Main-Process-Klasse. |

## Renderer-Bundles

| Fund | Bewertung |
|---|---|
| Kein lokales Renderer-Bundle im extrahierten ASAR gefunden. | Die App-Huelle lädt offenbar die Renderer-Web-App remote ueber `environment.json.url`. |
| Keine Source-Maps ausserhalb `node_modules` gefunden. | Keine lokalen Source-Maps fuer die Remote-Renderer-App beobachtet. |
| `ElectronMain.win.loadURL(ElectronMain._getStageURL())` | Remote-Renderer-Einstieg; Stage-URL kommt aus `environment.json`. |

TODO: Falls die Remote-Renderer-Bundles im Chromium-Cache oder ueber die laufende App geladen werden, separat ueber Playwright/CDP inventarisieren. Dabei keine echten Nutzdaten speichern.

## Preload

| Datei | Beobachtung | Sensibilität |
|---|---|---|
| `tmp/app-asar-unpacked/preload.js` | Setzt `window.isElectron = true` und exponiert `window.ipcRenderer = ipcRenderer`. | Hoch, weil Renderer direkten Zugriff auf IPC bekommt. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | `contextIsolation: false`, `nodeIntegration: false`, `preload: .../preload.js`. | `contextIsolation: false` erhoeht die Relevanz sauberer IPC-Dokumentation. |

## IPC-Hinweise

IPC wird zentral ueber `ElectronMain.ipcChannels` registriert und spaeter mit `ipcMain.on(channel[0], channel[1])` aktiviert.

Beobachtete Kanalgruppen:

- Auth/Arbeitsplatz: `get-electron-config`, `get-machine-file-data`, `get-fingerprint-info`, `create-machine-file-data`
- Navigation/Fenster: `navigation-structure-data`, `navigate-from-menu`, `enable-new-window`, `new-window-available`, `logout`
- Dokumente/Downloads: `view-document`, `custom_window`, `save-document`, `save-all-documents`, `save-html-as-pdf`, `save-dsfinvk-export`
- Peripherie: Drucker, Scanner, Signpad, Card Reader, Cash Drawer, Line Display, Telecash, TSE
- Externe Fachmodule: Dakota, Medilogic, Rothballer

## Erkannte API-Basis-URLs

| URL / Host | Quelle | Bedeutung | Status |
|---|---|---|---|
| `https://api2.optica-omnia.de` | `environment.json`, `configuration.ts`, Migration | Remote-App/API-Host der laufenden App. | Beobachtet in lokaler Konfiguration. |
| `https://api.optica-omnia.de` | `customer-migrations.ts`, `update.handler.ts` | Legacy-/Prod-Host, Migration nach `api2`. | Nur statisch beobachtet. |
| `/apigateway/` | `electron-main.class.ts` und bestehendes Recorder-Tooling | API-Gateway-Pfad auf dem App-Host. | Indirekter Hinweis; konkrete Endpunkte aus Logs ableiten. |
| `https://eupdate.optica-omnia.de/prod`, `/prod2` | `update.handler.ts`, `resources/app-update.yml` | Electron-Auto-Update. | Statisch beobachtet. |
| `https://www.mip-ekv.de/KSV/MSM/anhang_downloadKvdImg.php` | `configuration.ts` | Externer Download, wird an nativen Viewer weitergereicht. | Statisch beobachtet. |
| `http://localhost:9080`, `https://localhost:9090` | `odclient.js` | Legacy-lokaler Node-Client fuer Peripherie-/Dateiaktionen. | Statisch beobachtet. |

## Auth-/Session-Hinweise

| Fund | Quelle | Bewertung |
|---|---|---|
| `optica.sign` enthält base64-kodierte Arbeitsplatzdaten (`machineId`, `tenantId`). | `authorization.handler.ts`, `configuration.ts` | Sensibel; nie in Logs oder Markdown uebernehmen. |
| Fingerprint-Daten enthalten Electron-Version, Hostname, IP, Username und Startup-Zeit. | `authorization.handler.ts` | Personen-/Geraetebezug; redakten. |
| Electron-Cookies werden fuer Legacy-Dateidownloads aus `session.defaultSession.cookies.get({ url })` gelesen und als `cookie`-Header weitergegeben. | `shared/utilities.ts` | Hoch sensibel; Cookie-Header immer redakten. |
| Sessiondaten werden beim Fensterstart mit `clearStorageData()` geloescht. | `electron-main.class.ts` | Runtime-Speicher ist relevant, aber nicht im ASAR enthalten. |

## Speicherorte

| Speicherort | Quelle | Inhalt / Vermutung | Status |
|---|---|---|---|
| `app.getPath("userData")` | `configuration.ts` | Electron-UserData, lokale `optica.sign`, `migrations.json`, Signpad-Temp. | Runtime-Pfad, nicht im ASAR enthalten. |
| `%ALLUSERSPROFILE%/Optica_Omnia` | `configuration.ts` | Machine-File, Electron-Log, Migrationsdaten. | Windows-Runtime-Pfad. |
| `C:\optica_direkt` | `configuration.ts`, `odclient.js` | Legacy-Peripheriepfad, Logs, Zertifikate, Importdateien. | Windows-Runtime-Pfad. |
| Electron `defaultSession` | `electron-main.class.ts`, `shared/utilities.ts` | Cookies, Cache, StorageData. | Runtime-Speicher; keine lokalen DB-Dateien im ASAR gefunden. |
| SQLite/LevelDB/IndexedDB | Dateisuche im extrahierten ASAR | Keine `.sqlite`, `.db`, LevelDB-Manifeste oder IndexedDB-Dateien im extrahierten Codebaum gefunden. | TODO: Laufzeitprofil pruefen, falls erforderlich. |
