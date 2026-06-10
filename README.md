# Optica Omnia — Reverse-Engineering-Workspace

Dieses Verzeichnis hat zwei Naturen:

1. **Installierte Electron-Distribution** der Branchensoftware Optica Omnia (Windows-Build, `.exe` + DLLs + `resources/app.asar`). Auf macOS nicht direkt lauffaehig — nur ueber Parallels.
2. **Reverse-Engineering-Workspace**, der die API hinter der App dokumentiert und einen Recorder bereitstellt, um den Verkehr live nachzuvollziehen.

## Wo was liegt

```
.
├── README.md                       ← Du bist hier
├── environment.json                ← Backend-Basis-URL (api2.optica-omnia.de)
├── Optica Omnia.exe + DLLs         ← Windows-Build der App
├── resources/app.asar              ← Electron-Renderer-Bundle (gepackt)
├── tools/                          ← Hardware-Treiber (Drucker, TSE, Kartenleser, Signpad)
├── locales/                        ← Chromium-Sprachpakete
│
├── docs/                           ← Dokumentation (lebt)
│   ├── api2-backend-paths.md       ← Vollstaendige API-Pfad-Doku (Quelle: Bundle + Recording)
│   └── omnia-api-plan.md           ← Ursprueglicher Soll-Plan aus dem Benutzerhandbuch
│
├── tmp/                            ← Arbeitsdateien (nicht in Git)
│   ├── api2-assets/                ← Aus Frontend extrahierte JS/CSS-Bundles
│   ├── app-asar-unpacked/          ← Entpackter Inhalt von resources/app.asar (Electron-Quelle)
│   ├── app-asar-tools/             ← Hilfswerkzeuge zum asar-Entpacken
│   ├── api2-backend-paths.json     ← Strukturierte Pfad-Daten
│   ├── api2-token-resolution.json  ← Aufgeloeste minifizierte Tokens
│   └── live-gateway-mapping.json   ← Service-internal-Path → Live-Gateway-Prefix
│
└── playwright-recorder/            ← API-Recorder fuer macOS (mit Electron-IPC-Stub)
    ├── README.md                   ← Setup-, Bedien- und Stub-Doku
    ├── src/record-api-traffic.js
    ├── src/electron-ipc-stub.js
    ├── .env.example
    └── captures/                   ← Recording-Output (NICHT in Git)
```

## Einstiegspunkte je nach Ziel

| Du willst … | Lies / Mach |
|---|---|
| Einen nutzbaren Einstieg in die echte `/apigateway/*`-API | [docs/apigateway/README.md](docs/apigateway/README.md) |
| Verstehen, welche API-Endpoints existieren | [docs/api2-backend-paths.md](docs/api2-backend-paths.md) |
| Wissen, wie die API fachlich gedacht ist | [docs/omnia-api-plan.md](docs/omnia-api-plan.md) |
| Live-Verkehr mitschneiden | [playwright-recorder/README.md](playwright-recorder/README.md) |
| Den Electron-Wrapper-Code lesen | [tmp/app-asar-unpacked/](tmp/app-asar-unpacked/) |
| Den Renderer-Code (Angular-Bundle) lesen | [tmp/api2-assets/main.8a0dd4ca3e39df01.js](tmp/api2-assets/main.8a0dd4ca3e39df01.js) (8 MB, minifiziert) |

## Methodik — wie die API-Doku entstanden ist

Die Pfad-Doku in [docs/api2-backend-paths.md](docs/api2-backend-paths.md) ist aus drei Quellen kombiniert:

1. **Statische String-Extraktion** aus dem minifizierten Angular-Bundle (`tmp/api2-assets/main.*.js`). Liefert Pfade, die als String-Literal im Bundle stehen.

2. **Minifizierte Token aufgeloest** — die OpenAPI-generierten Services nutzen
   ```js
   .httpClient.request("get", `${this.configuration.basePath}${_e}`, …)
   ```
   wobei `_e` eine modul-lokale Konstante ist mit dem eigentlichen Pfad-Template wie
   ```js
   `/customers/${this.configuration.encodeParam({name:"customerUuid",…})}`.
   ```
   Wir scannen das Bundle nach jeder solchen `basePath`-URL-Stelle, suchen rueckwaerts im selben Modul nach der Zuweisung des Tokens, und uebersetzen `encodeParam({name:"X",…})` zu `{X}`. Ergebnis: [tmp/api2-token-resolution.json](tmp/api2-token-resolution.json).

3. **Live-Recording** ueber den Playwright-Recorder. Dieser oeffnet die Web-App in Chromium, faelscht das Electron-IPC-Bridge so, dass die App glaubt, sie laeuft in der echten Electron-Huelle (siehe naechster Abschnitt), und protokolliert alle `/apigateway/`-Calls. Ergebnis: aktuelle Gateway-Prefixe und ~50 Endpoints, die aus den Bundle-Quellen nicht extrahierbar waren.

## Warum der Stub noetig ist

Die Web-App prueft beim Start `window.isElectron` und ruft via
`window.ipcRenderer.send("get-machine-file-data")` eine
Arbeitsplatzkennung ab, die normalerweise vom Electron-Main-Process aus
einer `optica.sign`-Datei kommt (MD5-Hash aus MAC + Hostname + Platform
+ CPU). Ohne IPC bricht der Renderer mit "Arbeitsplatzkennung kann
nicht bestimmt werden" ab.

Der Recorder injiziert deshalb [playwright-recorder/src/electron-ipc-stub.js](playwright-recorder/src/electron-ipc-stub.js)
vor dem Angular-Bundle. Der Stub spielt nur die Channels nach, die fuer
den Login-Pfad relevant sind. machineId und tenantId stammen aus einer
echten optica.sign-Datei einer bestehenden Installation (z. B. der
Windows-VM unter Parallels).

## Voraussetzungen fuer den Recorder

- Eine bestehende, registrierte Optica-Omnia-Installation, deren `optica.sign` zugaenglich ist (typischerweise die Windows-VM).
- Login-Credentials.
- Node.js + Playwright-Chromium.

Details: [playwright-recorder/README.md](playwright-recorder/README.md).

## DSGVO-Hinweis

Recordings koennen Gesundheits- und Versicherungsdaten enthalten. Der
Recorder warnt beim Start, schliesst `captures/` per `.gitignore` aus
und maskiert sensible Header. Captures gehoeren nicht in Repos, in
Cloud-Speicher oder in Chats.
