# Optica Omnia API Workspace

Dieses Repo ist der Arbeitsstand fuer Optica-Omnia-API-Analyse,
Recorder-Automation, OpenAPI-Aufbereitung und eine interne
Companion-App. Es enthaelt weiterhin Hinweise auf die installierte
Electron-Distribution, ist aber nicht mehr nur ein ASAR-/Bundle-Ablageort.

## Schnelleinstieg

| Ziel | Einstieg |
|---|---|
| Echte `/apigateway/*`-API nutzen | [docs/apigateway/README.md](docs/apigateway/README.md) |
| Beobachtete OpenAPI-Spezifikation lesen | [openapi/omnia-observed.openapi.yaml](openapi/omnia-observed.openapi.yaml) |
| API-Katalog und Endpunkte verstehen | [docs/03_api_catalog.md](docs/03_api_catalog.md), [docs/api2-backend-paths.md](docs/api2-backend-paths.md) |
| Live-Verkehr aufnehmen | [playwright-recorder/README.md](playwright-recorder/README.md) |
| Native Electron-App per CDP/Voice steuern | [playwright-recorder/README.md#native-windows-app-per-cdp-testen](playwright-recorder/README.md#native-windows-app-per-cdp-testen) |
| Companion-App starten oder erweitern | [companion-app/](companion-app/) |
| Sicherheitsregeln pruefen | [docs/SECURITY.md](docs/SECURITY.md) |

## Repo-Struktur

```text
.
|-- README.md                         Dieser Einstieg
|-- environment.json                  Backend-Basis-URL
|-- openapi/
|   `-- omnia-observed.openapi.yaml   Beobachteter OpenAPI-Stand
|-- docs/                             Laufende Analyse- und Plattform-Doku
|   |-- 01_inventory.md ... 16_codex_api_context.md
|   |-- apigateway/                   Gateway-Kontrakt, Workflows, Guardrails
|   |-- openapi.generated.json        Generierter API-Zwischenstand
|   `-- openapi.cumulative.json       Kumulierte Recording-Ergebnisse
|-- tools/                            TS-/MJS-Toolchain fuer Analyse und Reports
|   |-- explore-hands-off.ts          Read-only Auto-Explorer
|   |-- write-lab.ts                  Manuell freigegebene Write-Flows
|   |-- build-api-catalog.ts          API-Katalog-Generator
|   |-- recording-*.ts                Recording-Auswertung und Planung
|   `-- *_pos_*.ps1                   POS-/Hardware-Testskripte
|-- playwright-recorder/              Web-Recorder, Native-CDP und Voice-Stack
|   |-- src/record-api-traffic.js
|   |-- src/native-cdp-*.js
|   |-- src/native-cdp-voice-*.js
|   `-- captures/                     Lokale Captures, nicht committen
|-- companion-app/                    React/Vite-App plus lokaler BFF
|   |-- src/
|   `-- server/
`-- tmp/                              Lokale Extrakte und Arbeitsdateien
```

Die originale Windows-/Electron-Distribution (`Optica Omnia.exe`,
`resources/app.asar`, DLLs, Chromium-Dateien) kann lokal neben diesen
Arbeitsdateien liegen. Diese grossen oder binaeren Artefakte sind nicht
der primare Einstieg und werden weitgehend ignoriert.

## Arbeitsbereiche

### API-Dokumentation

Die API-Doku entsteht aus statischer Bundle-Analyse, OpenAPI-Generatoren
und Live-Recordings. Der nutzbare Gateway-Einstieg liegt unter
[docs/apigateway/](docs/apigateway/); die beobachtete maschinenlesbare
Spezifikation liegt in [openapi/omnia-observed.openapi.yaml](openapi/omnia-observed.openapi.yaml).

Wichtige Zusatzdateien:

- [docs/api2-backend-paths.md](docs/api2-backend-paths.md): historischer Pfadkatalog aus Bundle und Recording.
- [docs/openapi.generated.json](docs/openapi.generated.json): generierter Zwischenstand.
- [docs/openapi.cumulative.json](docs/openapi.cumulative.json): kumulierte Beobachtungen aus Recordings.
- [docs/swagger-ui.html](docs/swagger-ui.html): lokale OpenAPI-Ansicht.

### Recorder und Native-CDP

[playwright-recorder/](playwright-recorder/) enthaelt den klassischen
Web-Recorder, Analyse-Skripte und den Native-CDP-Stack fuer die echte
Windows-/Electron-App. Der Recorder injiziert einen Electron-IPC-Stub,
damit der Web-Renderer ausserhalb der Electron-Huelle starten kann.

```bash
cd playwright-recorder
npm install
npm run install:browsers
npm run record
```

Weitere wichtige Skripte:

- `npm run native:probe`: einmaliger CDP-Verbindungstest.
- `npm run native:session`: interaktive Native-CDP-Session.
- `npm run native:voice`: lokales Chat-/Voice-Panel auf `http://127.0.0.1:8787/`.
- `npm run analyze` und `npm run analyze:all`: Capture-Auswertung.
- `npm test`: Node-Testlauf fuer Recorder-Module.

### Toolchain

[tools/](tools/) ist die zentrale Analyse-Toolchain. Sie baut Kataloge,
wertet Recordings aus, erstellt Reports, steuert read-only Exploration
und kapselt das Write-Lab. Die Testdateien liegen direkt daneben als
`*.test.ts` oder `*.test.mjs`.

Typische Einstiegspunkte:

- `tools/explore-hands-off.ts`: sichere Read-only-Erkundung mit Write-Guard.
- `tools/record-network.ts` und `tools/record-flow.ts`: Netzwerk- und Flow-Aufzeichnung.
- `tools/build-api-catalog.ts`: Kataloggenerierung.
- `tools/coverage-report.ts`, `tools/focus-module-coverage.ts`: Coverage-Auswertung.
- `tools/write-lab.ts`: schreibende Testflows nur mit expliziter Freigabe.
- `tools/redact.ts`: Redaction vor Dokumentation oder Sharing.

### Companion-App

[companion-app/](companion-app/) ist eine React/Vite-App mit lokalem
Node-BFF. Sie nutzt die beobachteten API-Strukturen fuer interne
Workflows und Exportfunktionen.

```bash
cd companion-app
npm install
npm run dev
```

In einem zweiten Terminal:

```bash
cd companion-app
npm run api
```

Weitere Skripte:

- `npm run build`: TypeScript- und Vite-Build.
- `npm run preview`: gebautes Frontend lokal ansehen.
- `npm run test:bff`: Node-Tests fuer den BFF.

## Doku-Lesepfad

Die nummerierten Dokumente in [docs/](docs/) bilden den aktuellen
Lesepfad. Wer frisch einsteigt, liest in dieser Reihenfolge:

1. [Projektinventar](docs/01_inventory.md)
2. [Statische API- und Netzwerk-Fundstellen](docs/02_static_api_findings.md)
3. [API-Katalog](docs/03_api_catalog.md)
4. [Flow-to-API-Mapping](docs/04_flow_to_api_mapping.md)
5. [OpenAPI-Vorbereitung](docs/05_openapi_plan.md)
6. [Auto-Explore Read-only Report](docs/06_auto_explore_report.md)
7. [Write-Lab Report](docs/07_write_lab_report.md)
8. [API-Coverage-Report](docs/08_api_coverage_report.md)
9. [Recording-Workflow](docs/09_recording_workflow.md)
10. [Omnia-Knowledge-Report](docs/10_omnia_knowledge.md)
11. [Plattform-Blueprint](docs/11_platform_blueprint.md)
12. [Omnia-Relationship-Map](docs/12_omnia_relationships.md)
13. [Omnia-Data-Model](docs/13_omnia_data_model.md)
14. [Omnia-UI-Map](docs/14_omnia_ui_map.md)
15. [Fokus-Coverage: Stammdaten, Vorgaenge, Warenwirtschaft](docs/15_focus_module_coverage.md)
16. [Codex API Context](docs/16_codex_api_context.md)

Danach sind [docs/apigateway/README.md](docs/apigateway/README.md) und
[openapi/omnia-observed.openapi.yaml](openapi/omnia-observed.openapi.yaml)
die praktischen Referenzen fuer Implementierung und Integration.

## Sicherheit

Recordings koennen Gesundheits-, Versicherungs-, Session- und
Zugangsdaten enthalten. Vor jeder Aufnahme, Auswertung oder Uebernahme in
Dokumentation gelten die Regeln in [docs/SECURITY.md](docs/SECURITY.md).

Wichtig:

- Keine echten Patientendaten, Tokens, Cookies, Machine-IDs, Tenant-IDs
  oder Zugangsdaten committen.
- Captures, HARs, SQLite-/DB-Dateien, Sessions und Playwright
  `storageState.json` bleiben lokal und sind per `.gitignore` blockiert.
- Response-Bodies nur speichern oder dokumentieren, wenn sie vorher durch
  `tools/redact.ts` gelaufen sind.
- Schreibende Fachprozesse gehoeren ins Write-Lab und brauchen explizite
  manuelle Freigabe.
