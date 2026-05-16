# API-Plan fuer Optica Omnia

Quelle: Benutzerhandbuch "Branchensoftware Optica Omnia", Stand August 2022.

## 1. Zielbild

Die API sollte die fachlichen Arbeitsablaeufe von Optica Omnia abbilden, nicht nur einzelne Tabellen freilegen. Der zentrale fachliche Anker ist der Vorgang. Ueber ihn laufen Kunde, Arzt, Kostentraeger, Filiale, IK, Positionen, Kostenvoranschlag, Zahlung, Rechnung, Dokumente und Historie zusammen.

Empfohlener Stil:

- REST API fuer Stammdaten, Listen, Dokumente und Administrationsfunktionen.
- Workflow-Endpunkte fuer fachliche Aktionen wie Rechnung erstellen, Zahlung buchen, eKV senden, Sammelbeleg erzeugen oder Bon stornieren.
- Event-/Webhook-Schicht fuer externe Integrationen wie MIP/eKV, DATEV, E-Mail, Scanner, Drucker, Telecash und TSE.
- Strikte Mandanten-, Filial-, Rollen- und Rechtepruefung bei jedem Request.

## 2. Fachliche Module

### Stammdaten

Verwaltet die Grunddaten fuer operative Prozesse:

- Aerzte: LANR, BSNR, NBSNR, Fachbereiche, Vertragsarten, Adressen, Telefonarten, Aktivstatus, Notizen.
- Kostentraeger: Art, IK, EKV-IK, FiBu-Konto, Kontaktwege, Adressen inklusive Kostenvoranschlagsadresse, Ansprechpartner, Notizen.
- Kunden: Kundennummer, Anrede, Name, Geburtsdaten, Versichertennummer, Betreuer, FiBu-Konto, Kontaktwege, Zahlungs- und Lieferbedingungen, DSGVO-Status, Mitarbeiterzuordnung, Koerperdaten, Adressen, Kostentraegerzuordnungen, Arztzuordnungen, Ansprechpartner, Notizen, Dokumente, Historie.
- Vermittler: Vermittlerdaten, Adressen und Pflichtfelder fuer Vor-/Nachname je nach Typ.

### Vorgang

Der Vorgang ist der wichtigste Aggregat-Root:

- Vorgangsdaten: Vorgangsnummer, Status, Kunde, Kostentraeger, Arzt, Vermittler, Filiale, Bereich, IK, Erfasser, Bearbeiter, Berater, Vorgangsdatum, Rezeptdatum, Lieferdaten, Rezeptpflicht, Zuzahlungsbefreiung, Notfallversorgung, Sammelbeleg-Freigabe, Tourenplanung, Versorgungszeitraum.
- Weitere Vorgangsdaten: Zahlungsbedingungen, Lieferbedingungen, Debitorennummer, Hausbesuch, Versorgung von/bis, Storno, Dauerverordnung, Dauergenehmigung.
- Positionen: Artikel oder Muster, HMV-Nr., privat/Kostentraeger, Menge, Einheit, MwSt., Preise, Zuzahlung, Eigenanteil, wirtschaftliche Aufzahlung, Rabatt, Leistungsart, LEGS, UDI, Seriennummer, Reha-Servernummer, WE-Anfrage-Nr.
- Kostenvoranschlaege: Privat oder Kostentraeger, Papier oder eKV, Status, Genehmigungsnummer, MIP-Anfrage-ID, Betrag, Genehmigungssumme, Anhaenge.
- Zahlungen: Bar, Telecash, Storno ueber Kassenbon.
- Rechnungen: Privat-/Eigenanteilsrechnung und Kostentraegerrechnung.
- Notizen, Dokumente und Aenderungshistorie.

### Ladenkasse

- Rezeptdruck inklusive Taxierung und Dokumentuebernahme.
- Barverkauf.
- Kassenverwaltung mit Einnahmen, Entnahmen, Kassenbuch.
- Bon- und Stornobon-Erzeugung.
- TSE-/Kassen-Integrationspunkte.

### Preisfindung

- Privatpreisregeln.
- Wirtschaftliche Aufzahlungsregeln.
- Vertragspreise und Preispositionen pro Kostentraeger.
- Preisermittlung fuer Vorgangspositionen inklusive Notfallversorgung, Leistungsart, MwSt., EK-/Arbeitszeitkalkulation und manueller Ueberschreibung.

### Finanzbuchhaltung

- Kontenrahmen mit SKR03/SKR04, Steuerschluessel, Aktivstatus.
- Warengruppen mit HMV-Bereich, Einkaufs- und Erloeskonten je MwSt.-Satz.
- Zahlungsbedingungen.
- Buchungen, DATEV-Buchungsexport, DATEV-Stammdatenexport.
- Protokollierung FiBu-relevanter Aenderungen.
- Rechnungsverwaltung und Sammelbelege.

### Warenwirtschaft

- Artikelstamm mit Artikelnummer, Bezeichnung, Hersteller, Farbe, Groesse, Seite, Barcode, HMV-Nr., EAN, Warengruppe, Leistungsart, Preisdaten, Warenwirtschaftsdaten und Lieferantenzuordnungen.
- Bestellvorschlaege.
- Inventur.
- Lieferanten und Lieferbedingungen.
- Lagerorte, Lageruebersicht, Lagerjournal und Lagerbewegungen.
- Preispositionen und Muster.

### Hilfsmittelverwaltung

- Hilfsmittel aus Artikelstamm uebernehmen.
- Lagerstatus, Zustand, Garantiezeitraum, Eigentuemer, Lager, MIP-Nr., Vorgangssperre, Aktivstatus.
- Merkmale, Notizen, Dokumente, Vorgangshistorie.
- Termine mit Terminart, Intervall, naechstem Termin, Erledigt-Status.
- Werteermittlung mit Reparatur-/Instandhaltungskosten und Garantiepruefung.
- Tourenplanung und Rueckholansicht.

### Kommunikation

- E-Mail-Client mit Versand, Empfang und Vorgangsverknuepfung.
- Aufgaben mit Zuweisung an Mitarbeiter und Verknuepfung zu Vorgaengen.
- Kalender mit Einzel-, Serien- und gemeinsamen Kalendern.
- Kommunikator fuer interne Chats und Gruppenunterhaltungen.

### Einstellungen und Identitaet

- Arbeitsplatzeinstellungen: Standard-IK, Filiale, Peripherie, Scanner, Drucker, Rezeptdrucker.
- Unternehmensprofil: Firmendaten, Adressen, E-Mail-Signatur, E-Mail-Gateway, Etiketten, Briefpapier.
- Filialen: Filialdaten, IKs, Adressen, Bon-/Rechnungstexte, Nummernkreise.
- Mandanteneinstellungen: Warenwirtschaft aktiv, Rezept-/Briefpapieroptionen, Aktualisierung von Stammdaten, FiBu-Konten, Kostenstellenart, Nummernkreise, Abrechnungszentren.
- Bereiche, Mitarbeiter, Rollen, Gruppen und Taetigkeiten.

## 3. Kernressourcen

Empfohlene Kernmodelle:

- `Tenant`, `Branch`, `BranchIk`, `Department`, `Workstation`
- `User`, `Employee`, `Role`, `Permission`, `Group`
- `Address`, `ContactMethod`, `ContactPerson`, `Note`, `Document`, `AuditLog`
- `Doctor`, `Payer`, `Customer`, `Broker`
- `CustomerPayerAssignment`, `CustomerDoctorAssignment`
- `Case`, `CasePosition`, `CasePositionPrice`, `CaseStatusHistory`
- `CostEstimate`, `CostEstimateAttachment`, `MipRequest`
- `Payment`, `Receipt`, `Invoice`, `InvoicePosition`, `CollectiveInvoice`
- `Account`, `ProductGroup`, `PaymentTerm`, `Booking`, `DatevExport`
- `Article`, `Supplier`, `DeliveryTerm`, `StockLocation`, `StockMovement`, `InventoryList`, `OrderProposal`
- `PricePosition`, `PrivatePriceRule`, `CopaymentRule`, `Template`
- `AssistiveDevice`, `AssistiveDeviceAppointment`, `AssistiveDeviceCost`, `Route`, `Pickup`
- `EmailMessage`, `Task`, `CalendarEvent`, `ChatConversation`, `ChatMessage`

Querschnittsfelder fuer fast alle Ressourcen:

- `id`, `tenantId`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- `active`
- `version` fuer optimistic locking
- `source` fuer Cloud-/eigene Datensaetze, z. B. `cloud` oder `local`

## 4. API-Schnitt

### Auth und Kontext

```http
POST /auth/login
POST /auth/logout
GET  /auth/me
GET  /tenants/current
GET  /branches
GET  /workstations/current
```

Jeder fachliche Endpunkt braucht implizit oder explizit:

- `tenantId`
- aktuelle Filiale
- Arbeitsplatz
- Benutzerrechte
- optional Bereich und Standard-IK

### Stammdaten

```http
GET    /doctors
POST   /doctors
GET    /doctors/{doctorId}
PATCH  /doctors/{doctorId}
POST   /doctors/{doctorId}/addresses
POST   /doctors/{doctorId}/notes

GET    /payers
POST   /payers
GET    /payers/{payerId}
PATCH  /payers/{payerId}
POST   /payers/{payerId}/addresses
POST   /payers/{payerId}/contacts
POST   /payers/{payerId}/notes

GET    /customers
POST   /customers
GET    /customers/{customerId}
PATCH  /customers/{customerId}
POST   /customers/{customerId}/addresses
POST   /customers/{customerId}/payer-assignments
POST   /customers/{customerId}/doctor-assignments
POST   /customers/{customerId}/contacts
POST   /customers/{customerId}/notes
POST   /customers/{customerId}/documents
GET    /customers/{customerId}/history
GET    /customers/{customerId}/assistive-devices

GET    /brokers
POST   /brokers
GET    /brokers/{brokerId}
PATCH  /brokers/{brokerId}
```

### Vorgang

```http
GET    /cases
POST   /cases
GET    /cases/{caseId}
PATCH  /cases/{caseId}
POST   /cases/{caseId}/status-transitions

GET    /cases/{caseId}/positions
POST   /cases/{caseId}/positions
PATCH  /cases/{caseId}/positions/{positionId}
DELETE /cases/{caseId}/positions/{positionId}
POST   /cases/{caseId}/positions/{positionId}/discount
POST   /cases/{caseId}/positions/{positionId}/reprice

GET    /cases/{caseId}/cost-estimates
POST   /cases/{caseId}/cost-estimates
POST   /cases/{caseId}/cost-estimates/{costEstimateId}/send
POST   /cases/{caseId}/cost-estimates/{costEstimateId}/refresh
PATCH  /cases/{caseId}/cost-estimates/{costEstimateId}

POST   /cases/{caseId}/payments/cash
POST   /cases/{caseId}/payments/card
POST   /cases/{caseId}/receipts/{receiptId}/void

POST   /cases/{caseId}/invoices
GET    /cases/{caseId}/documents
POST   /cases/{caseId}/documents
POST   /cases/{caseId}/documents/scan
POST   /cases/{caseId}/notes
GET    /cases/{caseId}/audit-log
```

Listenfilter fuer `/cases`:

- `assigneeId`
- `status`
- `kvStatus`
- `customerName`, `customerInsuranceNumber`, `customerCity`
- `doctorName`, `doctorCity`
- `brokerType`, `brokerName`
- `payerType`, `payerName`
- `caseDateFrom`, `caseDateTo`
- `branchId`, `departmentId`

### Preisfindung

```http
POST /pricing/calculate-case-position
POST /pricing/calculate-case
GET  /price-positions
POST /price-positions
PATCH /price-positions/{pricePositionId}
GET  /private-price-rules
POST /private-price-rules
GET  /copayment-rules
POST /copayment-rules
```

Wichtig: Preisermittlung sollte als eigene Domain-Operation modelliert werden. Sie muss erklaeren koennen, welche Regel oder welcher Vertrag angewendet wurde.

### Finanzbuchhaltung

```http
GET  /accounts
POST /accounts
GET  /product-groups
POST /product-groups
GET  /payment-terms
POST /payment-terms

GET  /bookings
POST /datev/booking-exports
POST /datev/master-data-exports
GET  /finance/audit-log

GET  /invoices
GET  /invoices/{invoiceId}
POST /invoices/{invoiceId}/settlements
POST /invoices/{invoiceId}/void
POST /invoices/{invoiceId}/print

GET  /collective-invoices
POST /collective-invoices/preview
POST /collective-invoices
POST /collective-invoices/{collectiveInvoiceId}/settlements
POST /collective-invoices/{collectiveInvoiceId}/void
```

### Warenwirtschaft

```http
GET    /articles
POST   /articles
GET    /articles/{articleId}
PATCH  /articles/{articleId}
POST   /articles/{articleId}/stock-settings
POST   /articles/{articleId}/suppliers
POST   /articles/{articleId}/labels/print

GET    /suppliers
POST   /suppliers
GET    /delivery-terms
POST   /delivery-terms

GET    /stock-locations
POST   /stock-locations
GET    /stock
GET    /stock-movements
POST   /stock-movements

GET    /inventory-lists
POST   /inventory-lists
PATCH  /inventory-lists/{inventoryListId}

GET    /order-proposals
POST   /order-proposals

GET    /templates
POST   /templates
POST   /templates/{templateId}/positions
```

### Hilfsmittelverwaltung

```http
GET    /assistive-devices
POST   /assistive-devices
GET    /assistive-devices/{deviceId}
PATCH  /assistive-devices/{deviceId}
POST   /assistive-devices/{deviceId}/lock-for-cases
POST   /assistive-devices/{deviceId}/unlock-for-cases

GET    /assistive-devices/{deviceId}/case-history
POST   /assistive-devices/{deviceId}/cases
GET    /assistive-devices/{deviceId}/appointments
POST   /assistive-devices/{deviceId}/appointments
POST   /assistive-devices/{deviceId}/appointments/{appointmentId}/complete
POST   /assistive-devices/{deviceId}/documents
POST   /assistive-devices/{deviceId}/costs
GET    /assistive-devices/{deviceId}/valuation
GET    /assistive-devices/{deviceId}/audit-log

GET    /routes
POST   /routes
PATCH  /routes/{routeId}
POST   /routes/{routeId}/complete
GET    /pickups
```

### Kommunikation

```http
GET  /emails
POST /emails
POST /emails/{emailId}/link-case

GET  /tasks
POST /tasks
PATCH /tasks/{taskId}

GET  /calendar/events
POST /calendar/events
PATCH /calendar/events/{eventId}

GET  /chat/conversations
POST /chat/conversations
POST /chat/conversations/{conversationId}/messages
POST /chat/conversations/{conversationId}/deactivate
POST /chat/conversations/{conversationId}/activate
```

### Einstellungen

```http
GET   /settings/workstation
PATCH /settings/workstation

GET   /company-profile
PATCH /company-profile
POST  /company-profile/addresses
PATCH /company-profile/email-gateway
POST  /company-profile/letterheads
POST  /company-profile/labels

GET   /branches
POST  /branches
PATCH /branches/{branchId}
POST  /branches/{branchId}/addresses
PATCH /branches/{branchId}/receipt-template
PATCH /branches/{branchId}/invoice-template
PATCH /branches/{branchId}/number-ranges

GET   /tenant-settings
PATCH /tenant-settings
GET   /billing-centers
POST  /billing-centers

GET   /departments
POST  /departments
GET   /employees
POST  /employees
PATCH /employees/{employeeId}
POST  /employees/{employeeId}/reset-password

GET   /roles
POST  /roles/{roleId}/copy
PATCH /roles/{roleId}
GET   /permissions
PATCH /permissions/{permissionId}/roles
GET   /groups
POST  /groups
```

## 5. Wichtige Workflows

### Vorgang anlegen und abrechnen

1. `POST /cases` mit Kunde, Filiale, IK, Bearbeiter, Vorgangsdatum und Pflichtfeldern.
2. `POST /cases/{caseId}/positions` fuer Artikel, Muster, Textpositionen oder Hilfsmittel.
3. `POST /pricing/calculate-case` oder automatische Preisermittlung beim Speichern.
4. Wenn Vertragspreis fehlt: `POST /cases/{caseId}/cost-estimates`.
5. Optional: `POST /cases/{caseId}/cost-estimates/{id}/send` fuer eKV.
6. Zahlung direkt per Bar/Telecash oder Rechnungserstellung.
7. Dokumente, Bon, Rechnung und Buchungen werden erzeugt.
8. Audit-Log und FiBu-Protokoll werden geschrieben.

### eKV

1. Voraussetzung: Rezeptdokument am Vorgang und Kostentraegerposition ohne Vertragspreis.
2. KV-Art wird automatisch anhand der Positionen vorgeschlagen.
3. Bei aktiver MIP-Schnittstelle wird `ekv=true`.
4. Dateianhaenge erhalten MIP-Dokumententypen.
5. `send` startet externen Genehmigungsworkflow.
6. `refresh` oder Webhook aktualisiert Status, Genehmigungsnummer, Genehmigungssumme und Dokumente.

### Rechnung und FiBu

1. Rechnung wird aus Vorgang erzeugt.
2. Privat-/Eigenanteilsrechnung und Kostentraegerrechnung koennen getrennt aktiviert werden.
3. Rechnungsadresse, Zahlungsbedingungen und Lieferbedingungen werden aus Stammdaten/Vorgang vorbelegt.
4. Rechnung erzeugt Dokument und Buchungssaetze.
5. Teilzahlungen und Vollzahlungen werden als Settlements gebucht.
6. Storno erzeugt Stornorechnung, Buchungskorrektur und Protokolleintrag.

### Sammelbeleg

1. Filter nach Filiale, IK, Kostentraeger und Vorgangszeitraum.
2. Nur Vorgaenge mit `releasedForCollectiveInvoice=true` werden angeboten.
3. Ausgewaehlte Vorgaenge werden in Sammelbeleg uebernommen.
4. Abrechnungszentrum, Zielstatus, Briefpapier und Buchungserzeugung werden festgelegt.
5. Sammelbeleg wird als Dokument und Finanzobjekt erzeugt.

### Hilfsmittel

1. Hilfsmittel wird aus Artikelstamm angelegt.
2. Lager, Eigentuemer, Zustand, Garantie und Merkmale werden gepflegt.
3. Hilfsmittel kann fuer Vorgangsbearbeitung gesperrt werden.
4. Aus Hilfsmittel kann ein neuer Vorgang mit Kunde, Kostentraeger und Arzt gestartet werden.
5. Termine, Dokumente, Kosten und Werteermittlung laufen am Hilfsmittel zusammen.

## 6. Statusmodelle

### Vorgang

Das Handbuch nennt `Neu` als Standardstatus und beschreibt manuelle Statuspflege sowie automatische Statusaenderung bei eKV. Die konkrete Statusliste fuer Vorgaenge muss aus dem System oder aus vorhandenen Daten ermittelt werden. API-seitig sollte Statuswechsel trotzdem ueber eine Transition laufen:

```http
POST /cases/{caseId}/status-transitions
```

Payload:

```json
{
  "targetStatus": "IN_PROGRESS",
  "reason": "optional",
  "effectiveAt": "2026-04-27T12:00:00Z"
}
```

### Kostenvoranschlag

Bekannte Status:

- `NEW`
- `APPROVED`
- `REJECTED`
- `IN_PROGRESS`
- `CANCELLED`
- `SUBMITTED`

### Rechnung und Sammelbeleg

Bekannte Status fuer Sammelbelegfilter:

- `OPEN`
- `PAID`
- `CANCELLED`
- `CANCELLATION_DOCUMENT`
- `PARTIALLY_PAID`

Diese Status sollten auch fuer Rechnungen geprueft und harmonisiert werden.

## 7. Validierungsregeln

Wichtige Regeln aus dem Handbuch:

- Pflichtfelder muessen vor dem Speichern validiert werden.
- Vorgangsnummer, Kundennummer, Rechnungsnummer, KV-ID und Buchungsnummer werden systemseitig erzeugt.
- Kunde und Arzt duerfen in Vorgaengen nur aus vorhandenen Stammdaten kommen; Arzt wird Pflichtfeld, wenn Rezept notwendig ist.
- IK ist ein Pflichtfeld im Vorgang und kommt aus der Filiale bzw. Arbeitsplatz-Standard-IK.
- Rezeptdatum aelter als 28 Tage erzeugt Warnung mit Bestaetigung.
- Je Adressart darf es nur eine Hauptadresse geben.
- Kunden-Kostentraegerzuordnung braucht Zeitraum, Versichertennummer/Aktenzeichen, Versichertenstatus und optional Befreiungszeitraum.
- Zuzahlungsbefreiung wird aus Kunden-Kostentraegerdaten vorbelegt.
- FiBu-Kontonummer fuer Debitoren/Kreditoren liegt bei manueller Vergabe im Bereich 10000 bis 69999.
- Kontenrahmen darf keine Konto-Neuanlage in DATEV-reservierten Debitoren-/Kreditorenbereichen zulassen.
- Kostentraeger-KV braucht Rezeptdokument und Kostentraegerposition ohne Vertragspreis.
- eKV braucht MIP-Schnittstelle.
- Verkauf/Storno erfolgt ueber Kassenbon, nicht ueber DIN-A4-Bon.
- Hilfsmittel mit Vorgangssperre darf in der Vorgangsbearbeitung nicht gefunden werden.
- Garantiezeitraum beeinflusst Hilfsmittel-Instandhaltungskosten.

## 8. Integrationen

### Muss-Integrationen

- MIP/eKV: Senden, Status abrufen, Genehmigungsdokumente empfangen.
- DATEV: Buchungen ASCII exportieren, Debitoren/Kreditoren CSV exportieren.
- Dokumentendienst: Upload, Scan, Formularerzeugung, Druck.
- Kasse/TSE: Barverkauf, Bon, Storno, Kassenbuch.
- Telecash: Kartenzahlung, ggf. angebundenes Terminal, manueller Fallback.
- E-Mail Gateway: IMAP/POP3/SMTP, SSL/TLS, Benutzerpostfaecher.
- Drucker/Scanner/Rezeptdrucker: Arbeitsplatz- und filialbezogene Konfiguration.

### Webhooks/Eventing

```http
POST /webhooks/mip/status-updated
POST /webhooks/telecash/payment-result
POST /webhooks/scanner/document-created
POST /webhooks/email/message-received
```

Interne Events:

- `case.created`
- `case.position.added`
- `case.priced`
- `costEstimate.submitted`
- `costEstimate.approved`
- `payment.booked`
- `invoice.created`
- `invoice.voided`
- `booking.created`
- `assistiveDevice.appointmentDue`

## 9. Sicherheit und Rechte

Die API muss Rechte nicht nur global, sondern kontextbezogen pruefen:

- Mandant
- Filiale
- Bereich
- Rolle
- Gruppe
- Taetigkeit/Permission
- Datensatzstatus, z. B. inaktiv, storniert, gesperrt

Empfehlung:

- JWT oder Session-Token fuer Benutzeridentitaet.
- Server-seitige Permission-Pruefung pro Endpoint und fachlicher Aktion.
- Audit-Log fuer alle kritischen Aenderungen.
- FiBu-relevante Aenderungen separat protokollieren.
- Dokumentzugriff mit expliziten Berechtigungen und Viren-/Dateityppruefung.

## 10. Versionierung und technische Leitplanken

- Basis: `/api/v1`
- Idempotency-Key fuer Zahlungen, Rechnungserstellung, Sammelbelege, eKV-Versand und Exporte.
- Pagination nach Cursor oder `page/size` fuer grosse Tabellen.
- Einheitliche Filter-, Sortier- und Include-Parameter.
- Optimistic locking mit `version` oder `If-Match`.
- Keine direkten Deletes fuer fachliche Belege; stattdessen Storno, Deaktivierung oder Historisierung.
- Einheitliches Fehlerformat:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Pflichtfelder fehlen.",
    "fields": [
      {
        "path": "doctorId",
        "message": "Arzt ist erforderlich, wenn Rezept notwendig ist."
      }
    ],
    "traceId": "..."
  }
}
```

## 11. Empfohlene Umsetzungsreihenfolge

1. Auth, Mandant, Filiale, Mitarbeiter, Rollen/Rechte.
2. Gemeinsame Bausteine: Adressen, Kontaktwege, Notizen, Dokumente, Audit-Log.
3. Stammdaten: Kunden, Aerzte, Kostentraeger, Vermittler.
4. Vorgang-Grundmodell mit Suche, Filtern und Statuswechseln.
5. Artikel, Preispositionen und Preisermittlung.
6. Vorgangspositionen und Kostenvoranschlaege.
7. Dokumente, Rezept, Scan/Upload/Druck.
8. Zahlung, Bon, Kasse, Telecash, Storno.
9. Rechnung, Buchungen, DATEV und Sammelbeleg.
10. Warenwirtschaft und Hilfsmittelverwaltung.
11. Kommunikation, Kalender, Aufgaben und Chat.
12. Statistiken und Exporte.

## 12. Offene Punkte

Diese Punkte muessen vor einer finalen OpenAPI-Spezifikation geklaert werden:

- Soll die API eine bestehende Datenbank ersetzen, erweitern oder nur integrieren?
- Zielplattform: neues Backend, bestehendes Optica-Backend oder Wrapper um lokale Electron-App?
- Welche externen Schnittstellen sind tatsaechlich verfuegbar: MIP, DATEV, TSE, Telecash, Scanner, Drucker?
- Vollstaendige Vorgangsstatusliste und erlaubte Statusuebergaenge.
- Vollstaendige Dokumentarten und erlaubte Dateiformate.
- Datenschutzanforderungen fuer Gesundheits- und Versicherungsdaten.
- Mandantenmodell: ein Betrieb pro Mandant oder mehrere Firmen/Filialgruppen?
- Offlinefaehigkeit und Synchronisation mit Cloud-Stammdaten.
