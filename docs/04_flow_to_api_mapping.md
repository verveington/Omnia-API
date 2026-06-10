# Flow-to-API-Mapping

Quelle: `logs/network/2026-06-09_22-31-workflow.jsonl`
Generiert: 2026-06-09T20:51:28.638Z

Hinweis: Beispiele stammen ausschliesslich aus redacted JSONL-Logs. Fehlende Schritte bedeuten, dass noch keine Requests beobachtet wurden oder kein Marker aktiv war. UI-Struktur zeigt nur redaktierte Strukturtexte.

## Login/Workspace pruefen

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 2 |

### UI-Struktur

| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |
|---|---|---|---|---|---|
| `/dashboard` | [REDACTED] | [REDACTED], Vorgangsübersicht | chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps | [REDACTED] anzeigen, Kunden / Artikel | Vorgangs-Nr., Kunde, Ort, Vorgangsdatum, Kostenträger, (e)KV/KV |

## Testbestellung anlegen oder suchen und Ausgangsstatus lesen

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/accounting/payment-terms` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]` | 404 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]/price-data` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/article-tenant/articles/search` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/communicatorservice/reminders/dbopt` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/file-archive/file-archive/load/files/[REDACTED]` | 200 | xhr | 2 |
| HEAD | api2.optica-omnia.de | `/apigateway/file-archive/file-archive/load/files/[REDACTED]` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen` | 200 | xhr | 10 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen/[REDACTED]/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/contact-opportunities` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/details/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers` | 200 | xhr | 8 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contact-opportunities` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contacts` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/customers` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/supplier/suppliers/list` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/user/users/search` | 200 | xhr | 6 |
| GET | api2.optica-omnia.de | `/apigateway/userservice/user/preferences` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/cost-centers` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/delivery-terms/search` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-arrival/search` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-proposals` | 201 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/order-proposals/[REDACTED]` | 200 | xhr | 1 |
| PUT | api2.optica-omnia.de | `/apigateway/wawi/order-proposals/[REDACTED]` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-proposals/search` | 200 | xhr | 3 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-proposals/search/sums` | 200 | xhr | 3 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-proposals/to-order` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/order-states` | 200 | xhr | 7 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]` | 200 | xhr | 2 |
| PUT | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]/email` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]/positions` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]/process-order` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/from-proposal` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/search` | 200 | xhr | 3 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/producers` | 200 | xhr | 5 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/storage-locations` | 200 | xhr | 5 |

### UI-Struktur

| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |
|---|---|---|---|---|---|
| `/merchandise-management/order-management/orders` | [REDACTED] | Filter | chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps | Lieferant, Kunden-Nr., [REDACTED] anzeigen, Kunden / Artikel, Suche | Bestell-Nr., Lieferant, Kunden-Nr., Status, Bestelldatum, Bestellmenge |

## Bestellung verarbeiten und Bestellt-Status lesen

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/accounting/payment-terms` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/label-configurations/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/department/departments` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen` | 200 | xhr | 8 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen/[REDACTED]/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/contact-opportunities` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/details` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/kpi-statistics` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/search` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/salesprocessservice/status/search` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers` | 200 | xhr | 5 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contact-opportunities` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contacts` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/customers` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/user/users/search` | 200 | xhr | 3 |
| POST | api2.optica-omnia.de | `/apigateway/userservice/metrics/user-login` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/cost-centers` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/delivery-terms/search` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-arrival/search` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/order-states` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]/positions` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/search` | 200 | xhr | 5 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/producers` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/storage-locations` | 200 | xhr | 6 |

### UI-Struktur

| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |
|---|---|---|---|---|---|
| `/merchandise-management/order-management/orders/{uuid}` | [REDACTED] | - | chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps | Bestell-Nr., Status, Rechnungsadresse, Bestellportal, Lieferant, Lieferadresse | - |

## Wareneingang oeffnen und offenen Status lesen

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/accounting/payment-terms` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/label-configurations/[REDACTED]` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/communicatorservice/reminders/dbopt` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/department/departments` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen` | 200 | xhr | 7 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen/[REDACTED]/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/contact-opportunities` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/details` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/kpi-statistics` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/search` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/salesprocessservice/status/search` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contact-opportunities` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contacts` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/customers` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/user/users/search` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/userservice/feature-toggles` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/userservice/metrics/user-login` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/userservice/workspaces/log` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/cost-centers` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/delivery-terms/search` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-arrival/search` | 200 | xhr | 9 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/order-states` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]/positions` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/search` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/producers` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/storage-locations` | 200 | xhr | 7 |

### UI-Struktur

| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |
|---|---|---|---|---|---|
| `/merchandise-management/order-management/order-arrival` | [REDACTED] | - | chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps | Lieferschein-Nr., Filiale, Lieferdatum, Lagerort, [REDACTED] anzeigen, Kunden / Artikel | Bestell-Nr, Status, Lieferant, Artikel-Nr., Artikel-Bestell-Nr., Bezeichnung |

## Wareneingang teilweise oder voll buchen und Status lesen

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/article-tenant/articles/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/communicatorservice/reminders/dbopt` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 5 |
| POST | api2.optica-omnia.de | `/apigateway/salesprocessservice/status/search` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 5 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-arrival/search` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/storage-locations` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/storage-locations/[REDACTED]` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawiservice/order-arrival/book` | 200 | xhr | 1 |

### UI-Struktur

| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |
|---|---|---|---|---|---|
| `/merchandise-management/order-management/order-arrival` | [REDACTED] | - | chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps | Lieferschein-Nr., Filiale, Lieferdatum, Lagerort, [REDACTED] anzeigen, Kunden / Artikel | Bestell-Nr, Status, Lieferant, Artikel-Nr., Artikel-Bestell-Nr., Bezeichnung |

## Endstatus in Bestellliste und Detail pruefen

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/accounting/payment-terms` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/audit/changelogs` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/department/departments` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/document/stored-documents` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen` | 200 | xhr | 7 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen/[REDACTED]/addresses` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/firma/companies/contact-opportunities` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/kpi-statistics` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/search` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/salesprocessservice/status/search` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers` | 200 | xhr | 6 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/addresses` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contact-opportunities` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/contacts` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/supplier/suppliers/[REDACTED]/customers` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/user/users/search` | 200 | xhr | 4 |
| POST | api2.optica-omnia.de | `/apigateway/userservice/metrics/user-login` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/cost-centers` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/delivery-terms/search` | 200 | xhr | 2 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/incoming-invoices/search` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/order-arrival/search` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/order-states` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]` | 200 | xhr | 2 |
| PUT | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/orders/[REDACTED]/positions` | 200 | xhr | 4 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/search` | 200 | xhr | 2 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/producers` | 200 | xhr | 3 |
| GET | api2.optica-omnia.de | `/apigateway/wawi/storage-locations` | 200 | xhr | 3 |

### UI-Struktur

| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |
|---|---|---|---|---|---|
| `/merchandise-management/order-management/orders` | [REDACTED] | Filter | chevron_left, chevron_right, star, [REDACTED] keyboard_arrow_down, notifications, apps | Lieferant, Kunden-Nr., [REDACTED] anzeigen, Kunden / Artikel, Suche | Bestell-Nr., Lieferant, Kunden-Nr., Status, Bestelldatum, Bestellmenge |

## Ohne Marker

| Methode | Host | Pfad | Status | Resource | Anzahl |
|---|---|---|---:|---|---:|
| GET | api2.optica-omnia.de | `/apigateway/communicatorservice/reminders/dbopt` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/country/countries` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/department/departments` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/enum-service/enums` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/mail/gateway-configurations/user-mail-addresses` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/mail/mails/unread-number` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/navigation/navigations/details` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/notification/notifications` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/kpi-statistics` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/sales/salesprocesses/search` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/salesprocessservice/status/search` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/reminder-count` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/task/tasks/task-count` | 200 | xhr | 4 |
| GET | api2.optica-omnia.de | `/apigateway/user-details` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/user/generic-list-column-states` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/user/users/[REDACTED]/dashboards` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/userservice/companies/details/preferences` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/userservice/feature-toggles` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/userservice/metrics/user-login` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/userservice/workspaces/[REDACTED]` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/userservice/workspaces/log` | 200 | xhr | 1 |
| GET | api2.optica-omnia.de | `/apigateway/vatrates/vatrates` | 200 | xhr | 1 |
| POST | api2.optica-omnia.de | `/apigateway/wawi/orders/search` | 200 | xhr | 1 |

