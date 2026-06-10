# Auto-Explore Read-only Report

Generiert: 2026-05-21T22:11:33.497Z
Start: https://api2.optica-omnia.de/login
Ende: https://api2.optica-omnia.de/transactions/dauerversorgung
Stop-Grund: no-more-targets
JSONL-Log: `logs/network/2026-05-22_00-11-explore.jsonl`

## Geklickte Ziele

| # | Typ | Label | Pfad | URL danach |
|---:|---|---|---|---|
| 1 | route |  | `/search` | https://api2.optica-omnia.de/search |
| 2 | route | Cash Till | `/cash-till` | https://api2.optica-omnia.de/cash-till |
| 3 | route | Barverkauf | `/cash-till/cash-sale` | https://api2.optica-omnia.de/cash-till |
| 4 | route | Gutscheine | `/cash-till/vouchers` | https://api2.optica-omnia.de/cash-till/vouchers |
| 5 | route | Hilfsmittelverwaltung | `/hilfsmittelverwaltung` | https://api2.optica-omnia.de/hilfsmittelverwaltung |
| 6 | route | Hilfsmittelnavigator | `/hilfsmittelverwaltung/navigator` | https://api2.optica-omnia.de/hilfsmittelverwaltung/navigator |
| 7 | route | Transactions | `/transactions` | https://api2.optica-omnia.de/transactions |
| 8 | route | Dauerversorgungen | `/transactions/dauerversorgung` | https://api2.optica-omnia.de/transactions/dauerversorgung |

## Blockierte Requests

| Methode | URL | Grund | Resource |
|---|---|---|---|
| POST | https://api2.optica-omnia.de/apigateway/userservice/workspaces/log | telemetry-post | xhr |
| POST | https://api2.optica-omnia.de/apigateway/userservice/metrics/user-login | telemetry-post | xhr |

## Uebersprungene Ziele

| Label | Pfad | Grund |
|---|---|---|
| text_snippet Neuer Gutschein | `/` | dangerous-label |
| Vorgangsbearbeitung | `/transactions/new` | dangerous-route |
| Neue Dauerversorgung | `/` | dangerous-label |

## Hinweise

- Das Tool klickt nur klassifizierte Navigationsziele, Tabs, App-Menue-Eintraege und App-Kacheln.
- PUT, PATCH und DELETE werden blockiert. POST wird nur fuer read-like Endpunkte wie Suche, Listen und Zaehler erlaubt.
- Telemetrie-POSTs werden abgebrochen und dokumentiert, fuehren aber nicht allein zum Abbruch des Crawls.
- Request- und Response-Bodies sind beim Explorer standardmaessig deaktiviert.
