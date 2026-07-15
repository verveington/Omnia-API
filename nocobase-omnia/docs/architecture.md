# Architektur

## Zielbild

```mermaid
flowchart LR
  B[Browser] -->|NocoBase Session, /api/omniaCustomers:*| N[NocoBase]
  N -->|HTTP GET, keine Omnia-Credentials| A[Lokaler FastAPI-Adapter]
  A -->|Bearer Token nur im Adapterprozess| O[Omnia API]
  N --> P[(PostgreSQL)]
```

Der Browser kennt weder die Omnia-Adresse noch die Adapter-Adresse. Das eigene
Plugin stellt zwei authentifizierte NocoBase-Actions bereit:

- `GET /api/omniaCustomers:search?q=...`
- `GET /api/omniaCustomers:summary?customerId=...`

Nur der serverseitige Plugin-Teil ruft den vorhandenen Adapter auf:

- `GET /customers/search?q=...`
- `GET /customers/{customer_id}/summary`

## Sicherheitsgrenzen

- Das Plugin implementiert ausschließlich GET-Lesezugriffe.
- Die beiden NocoBase-Actions sind nur für angemeldete Benutzer freigegeben.
- Omnia-Token und Login-Daten bleiben im FastAPI-Adapter und werden nicht an
  NocoBase übergeben.
- Suchbegriffe, Kunden-IDs, Antwortkörper und Authorization-Header werden vom
  Plugin nicht geloggt.
- Adapter-Antworten werden nur für die aktuelle Anfrage gehalten und nicht in
  PostgreSQL gespeichert.
- Adapterfehler werden auf generische Fehlercodes reduziert. Upstream-Inhalte
  werden weder an den Browser noch in Logs kopiert.
- `OMNIA_ADAPTER_URL` akzeptiert nur HTTP(S)-URLs ohne eingebettete Credentials.

## Versionsentscheidung

Stand 15. Juli 2026 ist `2.0.60` die aktuelle stabile NocoBase-Version. Das
Compose-Setup pinnt diese Version, damit Aktualisierungen bewusst erfolgen.
Die offizielle Dokumentation empfiehlt Docker für Self-Hosting und einen festen
Versions-Tag für produktionsnahe Installationen.

Ein eigenes Full-Stack-Plugin ist mit der Community Edition möglich: Der
Serverteil registriert eigene Resource-Actions, der Clientteil eine React-Seite.
Damit ist der kostenpflichtige REST-Datenquellen-Connector für diesen Slice nicht
erforderlich.

## Lokaler Start

1. `.env.example` nach `.env` übertragen und alle Platzhalter ersetzen.
2. Den FastAPI-Adapter auf dem Host an Port `8890` starten.
3. `docker compose build app` ausführen.
4. `docker compose up -d` ausführen.
5. Einmalig `docker compose exec app yarn nocobase install` ausführen.
6. Das Plugin aktivieren: `docker compose exec app yarn pm enable @omnia/plugin-customer-search`.
7. `http://localhost:13000/omnia/customers` öffnen und anmelden.

## Verifikation

```sh
node --test packages/plugins/@omnia/plugin-customer-search/test/*.test.js
docker compose --env-file .env.example config --quiet
curl -fsS http://127.0.0.1:8890/health
```

Für den End-to-End-Test: Suche mit einem freigegebenen Testkunden durchführen,
einen Treffer öffnen und parallel Browser-Netzwerk sowie NocoBase-Logs prüfen.
Im Browser dürfen nur NocoBase-Requests erscheinen. Logs dürfen weder Suchtext,
Kunden-ID, Kundendaten noch Token enthalten.

## Nächste Schritte

1. Plugin-Actions explizit auf eine interne NocoBase-Rolle beschränken.
2. Einen Playwright-Test mit anonymisierten Adapter-Fixtures ergänzen.
3. Responsive Verhalten der zweispaltigen Ansicht für schmale Viewports ergänzen.
4. Health- und Timeout-Metriken ohne Request- oder Kundendaten ergänzen.
5. Backup, Upgrade und Restore für PostgreSQL und NocoBase dokumentieren und testen.

## Offizielle Quellen

- [Docker-Installation](https://docs.nocobase.com/get-started/installation/docker)
- [Plugin-Projektstruktur](https://docs.nocobase.com/plugin-development/project-structure)
- [Serverseitige Plugin-Entwicklung](https://docs.nocobase.com/plugin-development/server)
- [ResourceManager](https://docs.nocobase.com/plugin-development/server/resource-manager)
- [Client-Router](https://docs.nocobase.com/plugin-development/client/router)
- [NocoBase Releases](https://github.com/nocobase/nocobase/releases)
