# Statische API- und Netzwerk-Fundstellen

Stand: 2026-05-21

Scope: `tmp/app-asar-unpacked` ohne `node_modules`. Die Tabelle dokumentiert die relevanten Treffer der angefragten Suchbegriffe. Reine JSDoc-/Typ-Wiederholungen und kompilierte JS-Duplikate wurden zusammengefasst; die TypeScript-Quelle ist jeweils bevorzugt angegeben.

## Suchbilanz

| Suchbegriff | Treffer | Bewertung |
|---|---:|---|
| `fetch(` | 0 | Kein direkter Fetch im lokalen ASAR-Code. |
| `axios` | 0 | Kein Axios im lokalen ASAR-Code. |
| `XMLHttpRequest` | 0 | Kein direkter XHR im lokalen ASAR-Code. |
| `WebSocket` | 0 | Keine statische WebSocket-Nutzung im lokalen ASAR-Code. |
| `graphql` | 0 | Keine statische GraphQL-Nutzung im lokalen ASAR-Code. |
| `/api/` | 0 | Kein exakt passender Pfad; API-Hinweise laufen ueber Host und `/apigateway/`. |
| `ipcRenderer` | 3 | Preload exponiert `ipcRenderer` an `window`. |
| `ipcMain` | 172 | Viele IPC-Typ-/Handler-Treffer; zentrale Registrierung in `electron-main.class.ts`. |
| `contextBridge` | 0 | Kein `contextBridge`; passt zu `contextIsolation: false`. |
| `authorization` | 61 | Hauptsaechlich `AuthorizationHandler` fuer Arbeitsplatz-/Tenantdaten. |
| `bearer` | 0 | Keine statischen Bearer-Literale gefunden. |
| `token` | 0 | Keine statischen Token-Literale gefunden. |
| `cookie` | 15 | Cookie-Nutzung fuer Electron-Session und Legacy-Downloads. |

## Detailfunde

| Datei | Zeile | Fundtyp | Vermutete Funktion | Risiko/Sensibilität | Offene Fragen |
|---|---:|---|---|---|---|
| `tmp/app-asar-unpacked/package.json` | 2 | Electron Main | `main.js` ist App-Einstiegspunkt. | Niedrig | Keine. |
| `tmp/app-asar-unpacked/main.js` | 3-10 | Electron Start | TSE-Konfiguration setzen und `ElectronMain.run()` starten. | Mittel, Hardware/TSE-Kontext | Keine produktiven TSE-Daten loggen. |
| `tmp/app-asar-unpacked/preload.js` | 2 | `ipcRenderer` | Importiert Electron-IPC im Preload. | Hoch | Welche Renderer-Calls existieren nur remote? |
| `tmp/app-asar-unpacked/preload.js` | 7 | `ipcRenderer` | Hängt `ipcRenderer` an `window`. | Hoch | Remote Renderer muss separat beobachtet werden. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 7 | `ipcMain` | Importiert `ipcMain`. | Mittel | Keine. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 101-178 | IPC-Kanalkatalog | Zentrale Liste aller Main-Process-Handler. | Hoch bei Datei-/Hardware-/Auth-Kanaelen | Request-/Response-Formen pro Kanal separat dokumentieren. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 179-185 | Preload/Security | `nodeIntegration: false`, `contextIsolation: false`, `preload`. | Hoch | Langfristig `contextBridge`-Migration pruefen, nicht Teil dieser Analyse. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 385-390 | API-Basis-URL | Liest `environment.json.url` als Stage-URL. | Mittel | Runtime-Datei kann je Installation abweichen. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 711-715 | `ipcMain.on` | Registriert alle IPC-Kanaele. | Hoch | Kanalnutzung im Renderer per CDP/Flow-Recorder beobachten. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 745-748 | Session Storage | Loescht `webContents.session.clearStorageData()`. | Mittel | Welche Storage-Arten nutzt die Remote-App vor dem Loeschen? |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 774-794 | Renderer Load | Erstellt Fenster und lädt Stage-URL. | Mittel | Remote Bundles/API-Calls nur dynamisch sichtbar. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 839-863 | `webRequest` | Interceptet Response-Header fuer Download-Handling. | Mittel | Nur MIP-URL wird speziell behandelt. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 867-873 | Download Event | Fängt `will-download` ab und oeffnet native Viewer. | Mittel | Keine Datei-Inhalte loggen. |
| `tmp/app-asar-unpacked/src/classes/electron-main.class.ts` | 926-928 | `/apigateway/` Hinweis | `_isAppUrl` behandelt URLs mit `apigateway` als nicht reine App-URL. | Mittel | Konkrete Gateway-Endpunkte aus Netzwerklogs ableiten. |
| `tmp/app-asar-unpacked/src/shared/enums/electron-channel.enum.ts` | 7-61 | IPC-Kanaele | Liste der IPC-Kanalnamen. | Hoch, da Auth/Peripherie/Dateien enthalten | Payloads dynamisch mappen. |
| `tmp/app-asar-unpacked/src/message-handler/authorization.handler.ts` | 34-58 | Authorization | Liest/erstellt Machine-File und sendet Daten per IPC. | Hoch, Machine-/Tenantdaten | Werte redakten, nie dokumentieren. |
| `tmp/app-asar-unpacked/src/message-handler/authorization.handler.ts` | 61-70 | Fingerprint | Sendet Version, Hostname, IP, Username, Startup. | Hoch, personen-/geraetebezogen | Nicht in Logs uebernehmen. |
| `tmp/app-asar-unpacked/src/message-handler/authorization.handler.ts` | 94-112 | Tenant Write | Schreibt Tenant-ID in Machine-File. | Hoch, Schreiboperation | Nicht automatisieren ohne explizite Freigabe. |
| `tmp/app-asar-unpacked/src/message-handler/authorization.handler.ts` | 159-174 | Machine-ID | Erzeugt MD5-basierten Machine-Identifier aus lokalen Geraetedaten. | Hoch | Keine echten Machine-IDs persistieren. |
| `tmp/app-asar-unpacked/src/message-handler/authorization.handler.ts` | 210-218 | Machine-File Read | Decodiert base64 JSON aus `optica.sign`. | Hoch | Nur strukturell dokumentieren. |
| `tmp/app-asar-unpacked/src/shared/utilities.ts` | 154-158 | Cookie | Holt Cookies aus Electron-Session fuer Legacy-Download. | Hoch | Cookie-Werte immer redakten. |
| `tmp/app-asar-unpacked/src/shared/utilities.ts` | 166-183 | HTTP(S) Download | Nutzt `http`/`https.get` und setzt Cookie-Header. | Hoch | Response kann Dokumente enthalten; Body nur redacted speichern. |
| `tmp/app-asar-unpacked/src/shared/utilities.ts` | 191-194 | Redirect | Folgt Redirects bei Legacy-Downloads. | Mittel | Redirect-Ziele redakten, wenn Querydaten enthalten sind. |
| `tmp/app-asar-unpacked/src/configuration.ts` | 33-38 | Config/API URL | Liest `environment.json`, schreibt in ConfigStore. | Mittel | `environment.json` installationsspezifisch. |
| `tmp/app-asar-unpacked/src/configuration.ts` | 66-68 | Externe URL | MIP-Download-URL fuer nativen Viewer. | Mittel | Nur URL, keine Inhalte speichern. |
| `tmp/app-asar-unpacked/src/classes/customer-migrations.ts` | 30-37 | API Migration | Migriert `api.optica-omnia.de` zu `api2.optica-omnia.de`. | Mittel | Nur fuer aufgefuehrte Tenants; Tenantliste nicht als produktive Daten behandeln. |
| `tmp/app-asar-unpacked/src/message-handler/update.handler.ts` | 191-204 | Update URL | Waehlt Update-Feed anhand API-Host. | Niedrig bis Mittel | Kein Fach-API-Endpunkt. |
| `tmp/app-asar-unpacked/odclient.js` | 20-21 | HTTP(S) | Legacy-Node-Client importiert `http`/`https`. | Hoch, lokale Peripherie | Nur lokal analysieren; keine Aktionen ausloesen. |
| `tmp/app-asar-unpacked/odclient.js` | 50-116 | JSON Command Router | Fuehrt lokale Aktionen nach `jsonObj.action` aus. | Hoch, Dateisystem/Exec/Hardware | Nicht fuer produktive Tests verwenden. |
| `tmp/app-asar-unpacked/odclient.js` | 63-78 | `runExe`/`runJS` | Kann lokale Exe starten bzw. JS evaluieren. | Hoch | Nicht ausfuehren. Nur dokumentieren. |
| `tmp/app-asar-unpacked/odclient.js` | 155-166 | HTTP Download | `http.get(url)` schreibt Datei lokal. | Hoch | Keine echten Dokumente ziehen/loggen. |
| `tmp/app-asar-unpacked/odclient.js` | 586-607 | Lokaler HTTP-Server | Lauscht auf Port `9080`. | Hoch, lokale Angriffs-/Automationsoberflaeche | Runtime-Zugriff nur isoliert pruefen. |
| `tmp/app-asar-unpacked/odclient.js` | 611-633 | Lokaler HTTPS-Server | Lauscht auf Port `9090`, wenn Zertifikate vorhanden sind. | Hoch | Zertifikate nicht kopieren/loggen. |

## Relevante IPC-Kanaele

Die folgenden Kanalnamen wurden in `electron-channel.enum.ts` beobachtet und sollten bei dynamischer Analyse priorisiert werden:

`get-electron-config`, `get-machine-file-data`, `get-fingerprint-info`, `create-machine-file-data`, `navigation-structure-data`, `navigate-from-menu`, `view-document`, `save-document`, `save-all-documents`, `save-html-as-pdf`, `scanner`, `scanner-2021`, `ocr-scanner`, `signpad`, `signpad-multi-signature`, `telecash`, `tse-unit`, `dakota-send`, `execute-medilogic`, `execute-rothballer`.

## Vorlaeufige Schlussfolgerung

Der lokale ASAR-Code enthaelt vor allem die Electron-Huelle, IPC- und Peripherie-Bridge. Die fachliche HTTP-API-Kommunikation liegt sehr wahrscheinlich in der remote geladenen Renderer-App unter `https://api2.optica-omnia.de` und muss dynamisch ueber Playwright/CDP beobachtet werden. Konkrete Endpunkte duerfen erst aus redacted Network-Logs in den API-Katalog uebernommen werden.
