# Omnia-Knowledge-Report

Generiert: 2026-06-09T20:51:31.458Z

Hinweis: Dieser Report nutzt ausschliesslich bereits redaktierte API-Records. Er beschreibt beobachtete Struktur und Zusammenhaenge, keine Rohwerte.

## Zusammenfassung

- Fachbereiche: 33
- API-Responses: 6691
- Eindeutige Endpunkte: 172
- Inventar-Coverage: 26.35 %
- Known/Observed/Missing: 501 / 132 / 369

## Plattform-Kandidaten

- Abrechnung/Kasse: Abrechnung, Kasse, Zahlungsbedingungen und DATEV-nahe Ausleitung.
- aerzte: Eigenes Plattformmodul fuer aerzte pruefen.
- apigateway: Eigenes Plattformmodul fuer apigateway pruefen.
- Artikel/Warenbestand: Artikelkatalog, Preislogik und Lager-/Bestandsmodell.
- connector: Eigenes Plattformmodul fuer connector pruefen.
- datev-export: Eigenes Plattformmodul fuer datev-export pruefen.
- Dokumente/Archiv: Dokumentenablage, Vorlagen, Druck/PDF und Archivzugriff.
- dv-batch-report: Eigenes Plattformmodul fuer dv-batch-report pruefen.
- dv-data: Eigenes Plattformmodul fuer dv-data pruefen.
- external: Eigenes Plattformmodul fuer external pruefen.
- Filialen/Mandant: Filial-, Unternehmens- und Organisationsstammdaten.
- gateway-configurations: Eigenes Plattformmodul fuer gateway-configurations pruefen.
- generic-list-column-states: Eigenes Plattformmodul fuer generic-list-column-states pruefen.
- Hilfsmittel: Hilfsmittelverwaltung, Termine und versorgungsnahe Fachlisten.
- hilfsmittel-viability: Eigenes Plattformmodul fuer hilfsmittel-viability pruefen.
- hmvhelper: Eigenes Plattformmodul fuer hmvhelper pruefen.
- inventurbewertung: Eigenes Plattformmodul fuer inventurbewertung pruefen.
- Kommunikation/Aufgaben: Kommunikationshub, Aufgaben, Reminder und Benachrichtigungen.
- Kunden/Vorgaenge: CRM/Kundenakte mit Vorgangs- und Kostentraeger-Kontext.
- meetings: Eigenes Plattformmodul fuer meetings pruefen.
- order-arrival-protocol: Eigenes Plattformmodul fuer order-arrival-protocol pruefen.
- p-300-update-reports: Eigenes Plattformmodul fuer p-300-update-reports pruefen.
- Referenzdaten: Laender, Enums und fachliche Lookup-/Konfigurationsdaten.
- rezepte: Eigenes Plattformmodul fuer rezepte pruefen.
- route-planning-items: Eigenes Plattformmodul fuer route-planning-items pruefen.
- stock-bookings: Eigenes Plattformmodul fuer stock-bookings pruefen.
- stocktaking-articles: Eigenes Plattformmodul fuer stocktaking-articles pruefen.
- stocktaking-lists: Eigenes Plattformmodul fuer stocktaking-lists pruefen.
- stocktaking-logs: Eigenes Plattformmodul fuer stocktaking-logs pruefen.
- Touren/Routenplanung: Tourenplanung, Stopps und Export-/Logistikdaten.
- User/Workspace: Mandant, Rechte, Feature-Toggles und Navigation.
- vertragsdokumente: Eigenes Plattformmodul fuer vertragsdokumente pruefen.
- Warenwirtschaft/Bestellung: Beschaffung, Bestellvorschlaege, Bestellung und Wareneingang.

## Beobachtete Fachbereiche

### Abrechnung/Kasse

- Responses: 301
- Endpunkte: 8
- Inventar-Coverage: 12.20 %
- Known/Observed/Missing: 41 / 5 / 36
- Plattform-Kandidat: Abrechnung, Kasse, Zahlungsbedingungen und DATEV-nahe Ausleitung.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `12. Rezeptdruck`, `13. Rückholansicht`, `14. Terminübersicht`, `15. Tourenplanung`, `16. Vorgangsliste`, `17. Hilfsmittelhistorie`, `17. Vorgangsnavigator`, `18. Hilfsmittelhistorie`, `18. Vorgangsnavigator (Archiv)`, `2. App-Menue`, `2. Kunden / Artikel`, `20. Hilfsmittelhistorie`, `22. Hilfsmittelhistorie`, `24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein`, `25. Kundendaten`, `27. Kundendaten`, `3. Kunden / Artikel`, `4. Detail oeffnen`, `6. Detail oeffnen`, `6. Hilfsmittelnavigator`, `9. Kassenverwaltung`, `Bestellung verarbeiten und Bestellt-Status lesen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Export-Menue oeffnen`, `Export-Quelle oeffnen`, `Kasse: Bons und Kassenbuchlisten laden`, `Kundendetail oeffnen`, `Login/Workspace pruefen`, `Musterartikel eindeutig aufloesen`, `Neuer Vorgang aus Kundenhistorie starten`, `Start`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`, `Vorgangsliste pruefen`, `Wareneingang oeffnen und offenen Status lesen`
- Statuscodes:
  - 200: 292
  - 400: 3
  - 404: 3
  - 500: 3
- Top-Endpunkte:
  - GET `/apigateway/vatrates/vatrates` (158x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/accounting/payment-terms` (66x, 200; Schritte: 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 3. Kunden / Artikel, 4. Detail oeffnen, 6. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Kundendetail oeffnen, Login/Workspace pruefen, Neuer Vorgang aus Kundenhistorie starten, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
  - POST `/apigateway/salesprocessservice/invoices/search` (43x, 200; Schritte: 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/accounting/material-groups` (24x, 200; Schritte: 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 3. Kunden / Artikel, 6. Hilfsmittelnavigator, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Start)
  - GET `/apigateway/accounting/bons` (3x, 404; Schritte: Kasse: Bons und Kassenbuchlisten laden)
  - GET `/apigateway/accounting/cash-book-entries/search` (3x, 400; Schritte: Kasse: Bons und Kassenbuchlisten laden)
  - GET `/apigateway/accounting/cash-books` (3x, 500; Schritte: Kasse: Bons und Kassenbuchlisten laden)
  - GET `/apigateway/accounting/payment-terms/[REDACTED]` (1x, 200; Schritte: 6. Detail oeffnen)
- Fehlende Inventar-Beispiele:
  - POST `/bons`
  - GET `/bons/{bonUuid}`
  - GET `/cash-book-entries/csv`
  - GET `/cash-books/{cashBookUuid}/cash-book-entries`
  - POST `/cash-books/{cashBookUuid}/cash-book-entries`
  - DELETE `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}`
  - GET `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}`
  - PUT `/cash-books/{cashBookUuid}/cash-book-entries/{cashBookEntryUuid}/finish-transaction`

### aerzte

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 75 %
- Known/Observed/Missing: 4 / 3 / 1
- Plattform-Kandidat: Eigenes Plattformmodul fuer aerzte pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/aerzte/{uuid}/addresses`

### apigateway

- Responses: 73
- Endpunkte: 11
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 0 / 0 / 0
- Plattform-Kandidat: Eigenes Plattformmodul fuer apigateway pruefen.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `2. App-Menue`, `2. Kunden / Artikel`, `23. Historie (Archiv)`, `24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein`, `25. Historie (Archiv)`, `25. Kundendaten`, `27. Kundendaten`, `4. Detail oeffnen`, `6. Detail oeffnen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Kundendetail oeffnen`, `Neuen Vorgang eindeutig ermitteln`, `Neuen Vorgangsentwurf speichern`, `Neuer Vorgang aus Kundenhistorie starten`, `Start`, `Vorgangsliste pruefen`
- Statuscodes:
  - 200: 73
- Top-Endpunkte:
  - GET `/apigateway/accounting/fibu-accounts/settings` (27x, 200; Schritte: 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen)
  - GET `/apigateway/arzt-tenant/aerzte/[REDACTED]` (16x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (15x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Neuen Vorgang eindeutig ermitteln, Neuen Vorgangsentwurf speichern, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - POST `/apigateway/sales/archived-salesprocess/search` (5x, 200; Schritte: 23. Historie (Archiv), 25. Historie (Archiv))
  - GET `/apigateway/audit/changelogs` (3x, 200; Schritte: DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Start)
  - POST `/apigateway/wawi/incoming-invoices/search` (2x, 200; Schritte: Endstatus in Bestellliste und Detail pruefen, Start)
  - GET `/apigateway/arzt-tenant/aerzte` (1x, 200)
  - GET `/apigateway/price-position/price-positions/search` (1x, 200; Schritte: Start)
  - GET `/apigateway/wawi/stocktaking-articles` (1x, 200; Schritte: Start)
  - GET `/apigateway/wawiservice/stock-bookings/search` (1x, 200; Schritte: Start)
  - GET `/apigateway/wawiservice/stocktaking-lists` (1x, 200; Schritte: Start)
- Fehlende Inventar-Beispiele:
  - keine

### Artikel/Warenbestand

- Responses: 293
- Endpunkte: 22
- Inventar-Coverage: 30.61 %
- Known/Observed/Missing: 49 / 15 / 34
- Plattform-Kandidat: Artikelkatalog, Preislogik und Lager-/Bestandsmodell.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `1.`, `11. Artikeldaten`, `14. Lieferanten`, `16. Preisdaten`, `17. Hilfsmittelhistorie`, `17. Warenwirtschaft`, `18. Hilfsmittelhistorie`, `2. Kunden / Artikel`, `20. Hilfsmittelhistorie`, `22. Hilfsmittelhistorie`, `3. App-Menue`, `3. Kunden / Artikel`, `6. Detail oeffnen`, `6. Hilfsmittelnavigator`, `Artikel: Lieferantendaten laden`, `Artikel: Musterartikel-Kit suchen`, `Artikel: Preisdaten laden`, `Artikel: Stammdaten laden`, `Artikel: Warenwirtschaftsdaten laden`, `Bestellung verarbeiten und Bestellt-Status lesen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Export ausloesen`, `Export-Menue oeffnen`, `Login/Workspace pruefen`, `Musterartikel eindeutig aufloesen`, `Musterartikel fuer Vorgangsposition suchen`, `Musterartikel suchen und Kontext laden`, `Start`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`, `Wareneingang oeffnen und offenen Status lesen`, `Wareneingang teilweise oder voll buchen und Status lesen`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 283
  - 400: 1
  - 404: 9
- Top-Endpunkte:
  - POST `/apigateway/articletenantservice/articles/simple-search` (58x, 200; Schritte: 3. Kunden / Artikel, Export ausloesen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Musterartikel fuer Vorgangsposition suchen, Musterartikel suchen und Kontext laden, Start)
  - GET `/apigateway/wawi/producers` (55x, 200; Schritte: 11. Artikeldaten, 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 3. App-Menue, 3. Kunden / Artikel, 6. Detail oeffnen, 6. Hilfsmittelnavigator, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Export-Menue oeffnen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (27x, 200; Schritte: 1., 2. Kunden / Artikel, 3. Kunden / Artikel, 6. Detail oeffnen, Artikel: Musterartikel-Kit suchen, Bestellung verarbeiten und Bestellt-Status lesen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Start, Wareneingang oeffnen und offenen Status lesen)
  - POST `/apigateway/article-tenant/articles/merchandise-management-setting` (25x, 200; Schritte: DV-Historie pruefen)
  - GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (22x, 200; Schritte: 14. Lieferanten, 6. Detail oeffnen, Artikel: Lieferantendaten laden, Musterartikel suchen und Kontext laden, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - GET `/apigateway/articletenantservice/articles/[REDACTED]` (14x, 200; Schritte: Musterartikel fuer Vorgangsposition suchen, Musterartikel suchen und Kontext laden)
  - GET `/apigateway/article-tenant/articles/[REDACTED]` (13x, 200; Schritte: 6. Detail oeffnen, Artikel: Stammdaten laden, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang teilweise oder voll buchen und Status lesen)
  - GET `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` (13x, 200; Schritte: 6. Detail oeffnen, Artikel: Warenwirtschaftsdaten laden, DV-Historie pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - GET `/apigateway/article-tenant/articles/[REDACTED]/price-data` (11x, 200; Schritte: 16. Preisdaten, 6. Detail oeffnen, Artikel: Preisdaten laden, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - GET `/apigateway/articletenantservice/bits-articles/producer-list` (11x, 200; Schritte: 3. Kunden / Artikel, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Start)
  - GET `/apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]` (7x, 404; Schritte: 6. Detail oeffnen, Artikel: Warenwirtschaftsdaten laden, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - GET `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` (6x, 200; Schritte: 6. Detail oeffnen, Artikel: Warenwirtschaftsdaten laden, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
- Fehlende Inventar-Beispiele:
  - GET `/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}`
  - PUT `/article-kits/{articleKitId}`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions`
  - POST `/article-kits/{articleKitId}/article-kit-material-positions`
  - PUT `/article-kits/{articleKitId}/article-kit-material-positions`
  - DELETE `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`
  - GET `/article-kits/{articleKitId}/article-kit-material-positions/{articleKitMaterialPositionId}`

### connector

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 1 / 0 / 1
- Plattform-Kandidat: Eigenes Plattformmodul fuer connector pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/connector/vzd/search`

### datev-export

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer datev-export pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/datev-export/account-records`
  - POST `/datev-export/debitoren-kreditoren`

### Dokumente/Archiv

- Responses: 166
- Endpunkte: 8
- Inventar-Coverage: 21.05 %
- Known/Observed/Missing: 38 / 8 / 30
- Plattform-Kandidat: Dokumentenablage, Vorlagen, Druck/PDF und Archivzugriff.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `1. input`, `10. Dokumente`, `12. Dokumente (Archiv)`, `12. Rezeptdruck`, `13. Rückholansicht`, `14. Dokumente (Archiv)`, `14. Terminübersicht`, `15. Tourenplanung`, `16. Suche Dokument`, `16. Vorgangsliste`, `17. Dokumente (Archiv)`, `17. Vorgangsnavigator`, `18. Suche Dokument`, `18. Vorgangsnavigator (Archiv)`, `19. Dokumente (Archiv)`, `2. App-Menue`, `2. Kunden / Artikel`, `20. 18582 Max Mustermann [REDACTED] AOK Bayern Nein Abholbereit [REDACTED] Christoph Schernthaner 0,00 € 0,00 € 0,00 € 0,00`, `21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86`, `3. App-Menue`, `3. Kunden / Artikel`, `8. Dokumente`, `9. Kassenverwaltung`, `Artikel: Dokumente suchen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Kundendetail oeffnen`, `Start`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`
- Statuscodes:
  - 200: 165
  - 400: 1
- Top-Endpunkte:
  - GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (122x, 200; Schritte: 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 2. App-Menue, 2. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, 9. Kassenverwaltung, DV-Historie pruefen, Kundendetail oeffnen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - GET `/apigateway/document/stored-documents` (16x, 200; Schritte: 20. 18582 Max Mustermann [REDACTED] AOK Bayern Nein Abholbereit [REDACTED] Christoph Schernthaner 0,00 € 0,00 € 0,00 € 0,00, 21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86, 8. Dokumente, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Start)
  - POST `/apigateway/document/archive-documents/search` (10x, 200, 400; Schritte: 12. Dokumente (Archiv), 14. Dokumente (Archiv), 17. Dokumente (Archiv), 19. Dokumente (Archiv), Artikel: Dokumente suchen)
  - POST `/apigateway/document/stored-documents/search` (7x, 200; Schritte: 10. Dokumente, 16. Suche Dokument, 18. Suche Dokument)
  - HEAD `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (6x, 200; Schritte: DV-Historie pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - POST `/apigateway/document/documents/boilerplates/search` (2x, 200; Schritte: DV-Historie pruefen)
  - POST `/apigateway/formservice/formulare/search` (2x, 200)
  - GET `/apigateway/document/documents/[REDACTED]/png-preview` (1x, 200)
- Fehlende Inventar-Beispiele:
  - POST `/dv-batch-report/{reportId}/documents/merge`
  - GET `/dv-batch-report/{reportId}/documents/zip`
  - GET `/file-archive/cloud/load/files/{fileId}`
  - GET `/file-archive/cloud/load/files/{serviceName}/{templateName}`
  - GET `/file-archive/cloud/load/files/templates`
  - POST `/file-archive/cloud/upload/files`
  - POST `/file-archive/files/metainfos`
  - GET `/file-archive/load/files/{fileId}/checksum`

### dv-batch-report

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer dv-batch-report pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/dv-batch-report/{reportId}/pdf-export`
  - POST `/dv-batch-report/{reportId}/search`

### dv-data

- Responses: 16
- Endpunkte: 2
- Inventar-Coverage: 33.33 %
- Known/Observed/Missing: 9 / 3 / 6
- Plattform-Kandidat: Eigenes Plattformmodul fuer dv-data pruefen.
- Wissensluecke: Nur 2 Endpunkt(e) beobachtet; Bereich dv-data gezielt vertiefen.
- Schritte: `10. Dokumente`, `14. DV-Historie`, `15. Dokumente`, `17. Dokumente`, `17. Hilfsmittelhistorie`, `20. Hilfsmittelhistorie`, `22. Hilfsmittelhistorie`
- Statuscodes:
  - 200: 16
- Top-Endpunkte:
  - POST `/apigateway/sales/dv-data/search` (9x, 200; Schritte: 14. DV-Historie, 17. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie)
  - GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (7x, 200; Schritte: 10. Dokumente, 15. Dokumente, 17. Dokumente)
- Fehlende Inventar-Beispiele:
  - GET `/dv-data/{dvDataId}`
  - PUT `/dv-data/{dvDataId}`
  - POST `/dv-data/{dvDataId}/collective-invoice-validation`
  - POST `/dv-data/{dvDataId}/create-sales-processes`
  - POST `/dv-data/{dvDataId}/versorgungsanzeigen`
  - POST `/dv-data/calculate-prices`

### external

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer external pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/external/product`
  - GET `/external/product-groups`

### Filialen/Mandant

- Responses: 887
- Endpunkte: 13
- Inventar-Coverage: 16.42 %
- Known/Observed/Missing: 67 / 11 / 56
- Plattform-Kandidat: Filial-, Unternehmens- und Organisationsstammdaten.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `1.`, `1. input`, `11. Ansprechpartner`, `11. Kassenbuch`, `12. Rezeptdruck`, `13. Rückholansicht`, `14. Terminübersicht`, `15. Tourenplanung`, `16. Vorgangsliste`, `17. Hilfsmittelhistorie`, `17. Vorgangsnavigator`, `17. Warenwirtschaft`, `18. Hilfsmittelhistorie`, `18. Vorgangsnavigator (Archiv)`, `2. App-Menue`, `2. Kunden / Artikel`, `20. Hilfsmittelhistorie`, `22. Hilfsmittelhistorie`, `24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein`, `25. Kundendaten`, `27. Kundendaten`, `3. App-Menue`, `3. Kunden / Artikel`, `4. Detail oeffnen`, `6. Detail oeffnen`, `6. Hilfsmittelnavigator`, `9. Kassenverwaltung`, `Artikel: Musterartikel-Kit suchen`, `Artikel: Preisdaten laden`, `Artikel: Warenwirtschaftsdaten laden`, `Bestellung verarbeiten und Bestellt-Status lesen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Export-Menue oeffnen`, `Export-Quelle oeffnen`, `Kasse: Bons und Kassenbuchlisten laden`, `Kundendetail oeffnen`, `Login/Workspace pruefen`, `Musterartikel eindeutig aufloesen`, `Neuer Vorgang aus Kundenhistorie starten`, `Start`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`, `Vorgaenge oeffnen`, `Vorgangsliste pruefen`, `Wareneingang oeffnen und offenen Status lesen`, `Wareneingang teilweise oder voll buchen und Status lesen`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 887
- Top-Endpunkte:
  - GET `/apigateway/filiale/filialen` (193x, 200; Schritte: 1., 11. Ansprechpartner, 11. Kassenbuch, 17. Hilfsmittelhistorie, 17. Warenwirtschaft, 18. Hilfsmittelhistorie, 2. Kunden / Artikel, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 3. App-Menue, 3. Kunden / Artikel, 4. Detail oeffnen, 6. Hilfsmittelnavigator, Artikel: Warenwirtschaftsdaten laden, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Kasse: Bons und Kassenbuchlisten laden, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Neuer Vorgang aus Kundenhistorie starten, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgaenge oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/userservice/companies/details/preferences` (169x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 3. Kunden / Artikel, 9. Kassenverwaltung, Artikel: Preisdaten laden, Export-Menue oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Musterartikel eindeutig aufloesen, Start)
  - GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (157x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (142x, 200; Schritte: 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Kundendetail oeffnen)
  - GET `/apigateway/department/departments` (102x, 200; Schritte: 1., 11. Ansprechpartner, 17. Hilfsmittelhistorie, 4. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Neuer Vorgang aus Kundenhistorie starten, Start, Vorgaenge oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/firma/companies/details` (28x, 200; Schritte: 2. Kunden / Artikel, 3. Kunden / Artikel, 6. Detail oeffnen, Artikel: Musterartikel-Kit suchen, Bestellung verarbeiten und Bestellt-Status lesen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Start, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/firma/companies/details/accountings` (27x, 200; Schritte: 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen)
  - GET `/apigateway/filiale/filialen/[REDACTED]` (24x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Start, Vorgangsliste pruefen, Wareneingang teilweise oder voll buchen und Status lesen)
  - GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen` (16x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/firma/companies/contact-opportunities` (14x, 200; Schritte: Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/filiale/filialen/[REDACTED]/addresses` (13x, 200; Schritte: Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/filiale/filialen/names` (1x, 200)
- Fehlende Inventar-Beispiele:
  - POST `/companies`
  - PUT `/companies/details`
  - PUT `/companies/details/accountings`
  - GET `/companies/details/azure-storage-settings`
  - POST `/companies/details/azure-storage-settings`
  - DELETE `/companies/details/infox-ftp-settings`
  - GET `/companies/details/infox-ftp-settings`
  - POST `/companies/details/infox-ftp-settings`

### gateway-configurations

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 100 %
- Known/Observed/Missing: 1 / 1 / 0
- Plattform-Kandidat: Eigenes Plattformmodul fuer gateway-configurations pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - keine

### generic-list-column-states

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 100 %
- Known/Observed/Missing: 1 / 1 / 0
- Plattform-Kandidat: Eigenes Plattformmodul fuer generic-list-column-states pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - keine

### Hilfsmittel

- Responses: 51
- Endpunkte: 6
- Inventar-Coverage: 12.82 %
- Known/Observed/Missing: 39 / 5 / 34
- Plattform-Kandidat: Hilfsmittelverwaltung, Termine und versorgungsnahe Fachlisten.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `17. Hilfsmittelhistorie`, `18. Hilfsmittelhistorie`, `20. Hilfsmittelhistorie`, `22. Hilfsmittelhistorie`, `6. Detail oeffnen`, `6. Hilfsmittelnavigator`, `7. Transactions`, `Export ausloesen`, `Export-Quelle oeffnen`, `Route: Planungen zum Vorgang laden`, `Start`, `Testkunde eindeutig aufloesen`, `Vorgang zum Testkunden laden`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 51
- Top-Endpunkte:
  - POST `/apigateway/hilfsmittel/arten/search` (16x, 200; Schritte: 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 6. Detail oeffnen, 6. Hilfsmittelnavigator, Export ausloesen, Start)
  - GET `/apigateway/hilfsmittel/hilfsmittel/traits` (12x, 200; Schritte: 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 6. Hilfsmittelnavigator)
  - GET `/apigateway/hilfsmittel/hilfsmittel/termine` (11x, 200; Schritte: Export-Quelle oeffnen, Zum Datenbereich navigieren)
  - GET `/apigateway/hilfsmittel/hilfsmittel/retrieval` (6x, 200; Schritte: 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie)
  - GET `/apigateway/hilfsmittel/route-plannings` (5x, 200; Schritte: Route: Planungen zum Vorgang laden, Testkunde eindeutig aufloesen, Vorgang zum Testkunden laden)
  - POST `/apigateway/hilfsmittel/hilfsmittel/search` (1x, 200; Schritte: 7. Transactions)
- Fehlende Inventar-Beispiele:
  - GET `/hilfsmittel/{id}`
  - POST `/hilfsmittel/{id}`
  - PUT `/hilfsmittel/{id}`
  - GET `/hilfsmittel/{id}/documents`
  - POST `/hilfsmittel/{id}/documents`
  - DELETE `/hilfsmittel/{id}/documents/{documentId}`
  - GET `/hilfsmittel/{id}/documents/{documentId}`
  - PUT `/hilfsmittel/{id}/documents/{documentId}`

### hilfsmittel-viability

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 1 / 0 / 1
- Plattform-Kandidat: Eigenes Plattformmodul fuer hilfsmittel-viability pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/hilfsmittel-viability`

### hmvhelper

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 9 / 0 / 9
- Plattform-Kandidat: Eigenes Plattformmodul fuer hmvhelper pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/hmvhelper`
  - GET `/hmvhelper/{productGroup}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}`
  - GET `/hmvhelper/{productGroup}/{applicationSite}/{subGroup}/{productType}`
  - GET `/hmvhelper/external/search`
  - POST `/hmvhelper/list`
  - POST `/hmvhelper/search`

### inventurbewertung

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 4 / 0 / 4
- Plattform-Kandidat: Eigenes Plattformmodul fuer inventurbewertung pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/inventurbewertung/altersgruppen`
  - GET `/inventurbewertung/altersgruppen/{uuid}`
  - PUT `/inventurbewertung/altersgruppen/{uuid}`
  - POST `/inventurbewertung/altersgruppen/search`

### Kommunikation/Aufgaben

- Responses: 1954
- Endpunkte: 9
- Inventar-Coverage: 38.46 %
- Known/Observed/Missing: 26 / 10 / 16
- Plattform-Kandidat: Kommunikationshub, Aufgaben, Reminder und Benachrichtigungen.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `1.`, `11. Ansprechpartner`, `11. saniPEP Sanitätshaus GmbH & Co. KG. HR1680770 MoliCare Pad 4 Tropfen 30 ST Paul-Hartmann-AG, Heidenheim Stück [REDACTED]`, `12. Rezeptdruck`, `13. Rückholansicht`, `14. Terminübersicht`, `15. Tourenplanung`, `16. Vorgangsliste`, `17. Hilfsmittelhistorie`, `17. Vorgangsnavigator`, `18. Vorgangsnavigator (Archiv)`, `20. Kundendaten`, `25. Kundendaten`, `26. Notizen`, `27. Kundendaten`, `4. Detail oeffnen`, `9. Kassenverwaltung`, `Bestellung verarbeiten und Bestellt-Status lesen`, `DV-Historie pruefen`, `Download pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Ergebnis pruefen`, `Export ausloesen`, `Export konfigurieren`, `Export-Menue oeffnen`, `Export-Quelle oeffnen`, `Kundendetail oeffnen`, `Login/Workspace pruefen`, `Max Mustermann suchen`, `Start`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`, `Vorgaenge oeffnen`, `Vorgang detail oeffnen`, `Vorgangsliste pruefen`, `Wareneingang oeffnen und offenen Status lesen`, `Wareneingang teilweise oder voll buchen und Status lesen`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 1954
- Top-Endpunkte:
  - GET `/apigateway/mail/mails/unread-number` (595x, 200; Schritte: 1., 11. Ansprechpartner, 11. saniPEP Sanitätshaus GmbH & Co. KG. HR1680770 MoliCare Pad 4 Tropfen 30 ST Paul-Hartmann-AG, Heidenheim Stück [REDACTED], 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 20. Kundendaten, 25. Kundendaten, 26. Notizen, 27. Kundendaten, 9. Kassenverwaltung, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Download pruefen, Endstatus in Bestellliste und Detail pruefen, Ergebnis pruefen, Export ausloesen, Export konfigurieren, Export-Menue oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Login/Workspace pruefen, Max Mustermann suchen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgaenge oeffnen, Vorgang detail oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/task/tasks/task-count` (593x, 200; Schritte: 1., 11. Ansprechpartner, 11. saniPEP Sanitätshaus GmbH & Co. KG. HR1680770 MoliCare Pad 4 Tropfen 30 ST Paul-Hartmann-AG, Heidenheim Stück [REDACTED], 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 20. Kundendaten, 25. Kundendaten, 26. Notizen, 27. Kundendaten, 9. Kassenverwaltung, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Download pruefen, Endstatus in Bestellliste und Detail pruefen, Ergebnis pruefen, Export ausloesen, Export konfigurieren, Export-Menue oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Login/Workspace pruefen, Max Mustermann suchen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgaenge oeffnen, Vorgang detail oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/task/tasks/reminder-count` (227x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen, Login/Workspace pruefen, Start)
  - GET `/apigateway/communicatorservice/reminders/dbopt` (220x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, DV-Historie pruefen, Export konfigurieren, Export-Quelle oeffnen, Kundendetail oeffnen, Max Mustermann suchen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen)
  - GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (157x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/notification/notifications` (156x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/communicatorservice/tasks/by-process/count` (4x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Vorgangsliste pruefen)
  - PATCH `/apigateway/notification/notifications/[REDACTED]/true` (1x, 200)
  - GET `/apigateway/notification/notifications/all` (1x, 200; Schritte: Export ausloesen)
- Fehlende Inventar-Beispiele:
  - DELETE `/kim/mails/{messageId}`
  - POST `/kim/mails/{uid}/attachments`
  - GET `/kim/mails/available-connections`
  - POST `/kim/mails/check-pop3-connection`
  - POST `/kim/mails/check-smtp-connection`
  - POST `/kim/mails/retrieve-new-mails`
  - POST `/kim/mails/send-mail`
  - DELETE `/mails`

### Kunden/Vorgaenge

- Responses: 874
- Endpunkte: 39
- Inventar-Coverage: 33.33 %
- Known/Observed/Missing: 102 / 34 / 68
- Plattform-Kandidat: CRM/Kundenakte mit Vorgangs- und Kostentraeger-Kontext.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `1.`, `1. Kunden / Artikel`, `10. Detail oeffnen`, `10. Dokumente`, `11. Ansprechpartner`, `11. Vermittler`, `13. Ansprechpartner`, `13. Kunden / Artikel`, `14. Arztdaten`, `14. DV-Historie`, `14. Terminübersicht`, `15. Dokumente`, `16. Arztdaten`, `16. DV-Historie`, `16. Vorgangsliste`, `17. Dokumente`, `17. Hilfsmittelhistorie`, `18. App-Menue`, `18. Hilfsmittelhistorie`, `19. DV-Historie`, `19. Historie`, `2. App-Menue`, `2. Cash Till`, `2. Kunden / Artikel`, `20. 18582 Max Mustermann [REDACTED] AOK Bayern Nein Abholbereit [REDACTED] Christoph Schernthaner 0,00 € 0,00 € 0,00 € 0,00`, `20. Firma Osteoporose Selbsthilfegruppe München Ost 15192 [REDACTED]-6 81737 München Nein`, `20. Hilfsmittelhistorie`, `21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86`, `21. DV-Historie`, `21. Kunden / Artikel`, `22. Hilfsmittelhistorie`, `22. Historie`, `24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein`, `24. Historie`, `24. Kostenträgerdaten`, `25. Kundendaten`, `26. Adressdaten`, `26. Kostenträgerdaten`, `26. Notizen`, `27. Kundendaten`, `28. Detail oeffnen`, `28. Notizen`, `3. Adressdaten`, `3. App-Menue`, `3. Kunden / Artikel`, `30. Kostenvoranschlag Adresse Musterbereich 123 Nein 81737 Musterstadt [REDACTED]`, `4. Detail oeffnen`, `4. Gutscheine`, `5. Arzt`, `5. Hilfsmittelverwaltung`, `6. Adressdaten`, `6. Bearbeiter*`, `6. Detail oeffnen`, `6. Hilfsmittelnavigator`, `7. Ansprechpartner`, `7. Berater*`, `8. Adressdaten`, `8. Detail oeffnen`, `8. Erfasser*`, `9. Arztdaten`, `9. Kostenträger`, `Bestellung verarbeiten und Bestellt-Status lesen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Export ausloesen`, `Export-Quelle oeffnen`, `Exportbereich oeffnen`, `Kunde-Historie oeffnen`, `Kunde: [REDACTED]`, `Kundendetail oeffnen`, `Musterartikel eindeutig aufloesen`, `Musterartikel-Position berechnen`, `Musterkunde fuer Positionsflow pruefen`, `Musterkunde suchen`, `Neuen Vorgang eindeutig ermitteln`, `Neuen Vorgang vor Positionswrite laden`, `Neuen Vorgang zuruecklesen`, `Neuen Vorgangsentwurf speichern`, `Neuer Vorgang aus Kundenhistorie starten`, `Sales-Process- und Filial-Kontext zum Musterkunden laden`, `Start`, `Testkunde eindeutig aufloesen`, `Vorgaenge oeffnen`, `Vorgang detail laden`, `Vorgang mit Musterartikel speichern`, `Vorgang mit Musterartikel zuruecklesen`, `Vorgang unveraendert speichern`, `Vorgang zum Musterkunden auswaehlen`, `Vorgang zum Testkunden laden`, `Vorgang zuruecklesen und No-op verifizieren`, `Vorgangsliste pruefen`, `Vorgangspreise mit Musterartikel berechnen`, `Vorhandene Vorgangsliste merken`, `Wareneingang Probe: orderNr leerer Suchtext`, `Wareneingang oeffnen und offenen Status lesen`, `Wareneingang teilweise oder voll buchen und Status lesen`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 857
  - 201: 14
  - 400: 2
  - 500: 1
- Top-Endpunkte:
  - GET `/apigateway/kunden/customers/search` (166x, 200; Schritte: 1., 1. Kunden / Artikel, 13. Kunden / Artikel, 2. Cash Till, 20. Firma Osteoporose Selbsthilfegruppe München Ost 15192 [REDACTED]-6 81737 München Nein, 21. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, DV-Historie pruefen, Export ausloesen, Exportbereich oeffnen, Musterkunde fuer Positionsflow pruefen, Musterkunde suchen, Neuer Vorgang aus Kundenhistorie starten, Start, Testkunde eindeutig aufloesen, Zum Datenbereich navigieren)
  - POST `/apigateway/sales/salesprocesses/search` (158x, 200; Schritte: 1., 1. Kunden / Artikel, 11. Ansprechpartner, 17. Hilfsmittelhistorie, 19. Historie, 22. Historie, 24. Historie, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Kunde-Historie oeffnen, Musterkunde suchen, Neuen Vorgang eindeutig ermitteln, Sales-Process- und Filial-Kontext zum Musterkunden laden, Start, Testkunde eindeutig aufloesen, Vorgaenge oeffnen, Vorgang zum Musterkunden auswaehlen, Vorgang zum Testkunden laden, Vorhandene Vorgangsliste merken, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - POST `/apigateway/salesprocessservice/status/search` (124x, 200, 500; Schritte: 1., 1. Kunden / Artikel, 11. Ansprechpartner, 14. DV-Historie, 14. Terminübersicht, 16. DV-Historie, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 19. DV-Historie, 2. Kunden / Artikel, 20. Hilfsmittelhistorie, 21. DV-Historie, 22. Hilfsmittelhistorie, 6. Hilfsmittelnavigator, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Kunde-Historie oeffnen, Musterartikel eindeutig aufloesen, Start, Vorgaenge oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/sales/salesprocesses/kpi-statistics` (65x, 200; Schritte: 1., 11. Ansprechpartner, 18. App-Menue, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Musterkunde suchen, Start, Vorgaenge oeffnen, Wareneingang Probe: orderNr leerer Suchtext, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/kunden/customers/[REDACTED]` (45x, 200; Schritte: 11. Vermittler, 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 5. Arzt, 6. Bearbeiter*, 6. Detail oeffnen, 7. Berater*, 8. Erfasser*, 9. Kostenträger, DV-Historie pruefen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Start)
  - GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (33x, 200; Schritte: 24. Kostenträgerdaten, 26. Kostenträgerdaten, 30. Kostenvoranschlag Adresse Musterbereich 123 Nein 81737 Musterstadt [REDACTED], 4. Detail oeffnen, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/kunden/customers/[REDACTED]/addresses` (31x, 200; Schritte: 26. Adressdaten, 3. Adressdaten, 6. Adressdaten, 8. Adressdaten, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten)
  - GET `/apigateway/kunden/customers/[REDACTED]/arzt` (24x, 200; Schritte: 14. Arztdaten, 16. Arztdaten, 4. Detail oeffnen, 9. Arztdaten, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/kunden/customers/[REDACTED]/notes` (23x, 200; Schritte: 26. Notizen, 28. Notizen, 4. Detail oeffnen, DV-Historie pruefen, Neuen Vorgang eindeutig ermitteln, Neuen Vorgangsentwurf speichern, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/sales/salesprocesses/[REDACTED]` (21x, 200; Schritte: 20. 18582 Max Mustermann [REDACTED] AOK Bayern Nein Abholbereit [REDACTED] Christoph Schernthaner 0,00 € 0,00 € 0,00 € 0,00, 21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Neuen Vorgang vor Positionswrite laden, Neuen Vorgang zuruecklesen, Vorgang detail laden, Vorgang mit Musterartikel zuruecklesen, Vorgang zuruecklesen und No-op verifizieren, Vorgangsliste pruefen)
  - GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]` (20x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
  - GET `/apigateway/kostentraeger-tenant/kostentraeger/cloud-status` (18x, 200; Schritte: 4. Detail oeffnen, DV-Historie pruefen, Neuer Vorgang aus Kundenhistorie starten, Vorgangsliste pruefen)
- Fehlende Inventar-Beispiele:
  - GET `/customers/{customerId}/arzt/{relationId}`
  - POST `/customers/{customerId}/documents`
  - PUT `/customers/{customerId}/documents/{documentId}`
  - GET `/customers/{customerUuid}/kostentraeger/{kostentraegerUuid}`
  - GET `/customers/{customerUuid}/kostentraeger/has-valid-kostentraeger`
  - GET `/customers/{customerUuid}/rothballer`
  - GET `/customers/{customerUuid}/versichertennummer`
  - GET `/customers/{id}/addresses/has-main-address/{addressTypeKey}`

### meetings

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 9 / 0 / 9
- Plattform-Kandidat: Eigenes Plattformmodul fuer meetings pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/meetings`
  - POST `/meetings`
  - PUT `/meetings`
  - PUT `/meetings/{meetingUuid}`
  - GET `/meetings/{meetingUuid}/{calendarId}`
  - PUT `/meetings/{meetingUuid}/cancel`
  - POST `/meetings/conflicting-meetings`
  - GET `/meetings/dbopt`

### order-arrival-protocol

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer order-arrival-protocol pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/order-arrival-protocol/{arrivalBookingUuid}/cancel`
  - POST `/order-arrival-protocol/search`

### p-300-update-reports

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 1 / 0 / 1
- Plattform-Kandidat: Eigenes Plattformmodul fuer p-300-update-reports pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/p-300-update-reports`

### Referenzdaten

- Responses: 327
- Endpunkte: 3
- Inventar-Coverage: 100 %
- Known/Observed/Missing: 3 / 3 / 0
- Plattform-Kandidat: Laender, Enums und fachliche Lookup-/Konfigurationsdaten.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `10. Detail oeffnen`, `12. Rezeptdruck`, `13. Rückholansicht`, `14. Terminübersicht`, `15. Tourenplanung`, `16. Vorgangsliste`, `17. Vorgangsnavigator`, `18. Vorgangsnavigator (Archiv)`, `28. Detail oeffnen`, `6. Detail oeffnen`, `8. Detail oeffnen`, `9. Kassenverwaltung`, `Export-Quelle oeffnen`, `Kundendetail oeffnen`
- Statuscodes:
  - 200: 327
- Top-Endpunkte:
  - GET `/apigateway/country/countries` (157x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/enum-service/enums` (157x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/navigationservice/external/countries` (13x, 200; Schritte: 10. Detail oeffnen, 28. Detail oeffnen, 6. Detail oeffnen, 8. Detail oeffnen)
- Fehlende Inventar-Beispiele:
  - keine

### rezepte

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 4 / 0 / 4
- Plattform-Kandidat: Eigenes Plattformmodul fuer rezepte pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/rezepte`
  - GET `/rezepte/pdf`
  - GET `/rezepte/point-of-service`
  - GET `/rezepte/xml`

### route-planning-items

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer route-planning-items pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/route-planning-items`
  - POST `/route-planning-items/search`

### stock-bookings

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 40 %
- Known/Observed/Missing: 5 / 2 / 3
- Plattform-Kandidat: Eigenes Plattformmodul fuer stock-bookings pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/stock-bookings`
  - POST `/stock-bookings/outflow`
  - POST `/stock-bookings/pdf`

### stocktaking-articles

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 33.33 %
- Known/Observed/Missing: 3 / 1 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer stocktaking-articles pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/stocktaking-articles`
  - PUT `/stocktaking-articles/{stocktakingArticleUuid}`

### stocktaking-lists

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 12.50 %
- Known/Observed/Missing: 8 / 1 / 7
- Plattform-Kandidat: Eigenes Plattformmodul fuer stocktaking-lists pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/stocktaking-lists`
  - GET `/stocktaking-lists/{stocktakingListUuid}`
  - PUT `/stocktaking-lists/{stocktakingListUuid}`
  - POST `/stocktaking-lists/{stocktakingListUuid}/import`
  - POST `/stocktaking-lists/{stocktakingListUuid}/pdf`
  - POST `/stocktaking-lists/{stocktakingListUuid}/takeover`
  - POST `/stocktaking-lists/csv`

### stocktaking-logs

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer stocktaking-logs pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/stocktaking-logs`
  - POST `/stocktaking-logs/{stocktakingListUuid}/pdf`

### Touren/Routenplanung

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 9.09 %
- Known/Observed/Missing: 11 / 1 / 10
- Plattform-Kandidat: Tourenplanung, Stopps und Export-/Logistikdaten.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - POST `/route-plannings`
  - GET `/route-plannings/{id}/stops`
  - DELETE `/route-plannings/{routePlanningUuid}`
  - GET `/route-plannings/{routePlanningUuid}`
  - PUT `/route-plannings/{routePlanningUuid}`
  - GET `/route-plannings/{routePlanningUuid}/exports`
  - POST `/route-plannings/{routePlanningUuid}/route-planning-document`
  - DELETE `/route-plannings/{routePlanningUuid}/stops/{stopUuid}`

### User/Workspace

- Responses: 1167
- Endpunkte: 14
- Inventar-Coverage: 64.71 %
- Known/Observed/Missing: 17 / 11 / 6
- Plattform-Kandidat: Mandant, Rechte, Feature-Toggles und Navigation.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `1.`, `11. Kassenbuch`, `12. Rezeptdruck`, `13. Rückholansicht`, `14. Terminübersicht`, `15. Tourenplanung`, `16. Vorgangsliste`, `17. Vorgangsnavigator`, `18. Vorgangsnavigator (Archiv)`, `2. App-Menue`, `2. Kunden / Artikel`, `24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein`, `25. Kundendaten`, `27. Kundendaten`, `3. App-Menue`, `3. Kunden / Artikel`, `4. Detail oeffnen`, `6. Detail oeffnen`, `9. Kassenverwaltung`, `Bestellung verarbeiten und Bestellt-Status lesen`, `DV-Historie pruefen`, `Endstatus in Bestellliste und Detail pruefen`, `Export-Menue oeffnen`, `Export-Quelle oeffnen`, `Kasse: Bons und Kassenbuchlisten laden`, `Kundendetail oeffnen`, `Login/Workspace pruefen`, `Musterartikel eindeutig aufloesen`, `Start`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`, `Testkunde eindeutig aufloesen`, `Vorgaenge oeffnen`, `Vorgang zum Testkunden laden`, `Vorgangsliste pruefen`, `Wareneingang oeffnen und offenen Status lesen`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 1165
  - 201: 1
  - 500: 1
- Top-Endpunkte:
  - GET `/apigateway/userservice/feature-toggles` (187x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, DV-Historie pruefen, Export-Quelle oeffnen, Kundendetail oeffnen, Start, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/user/generic-list-column-states` (158x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/userservice/workspaces/[REDACTED]` (158x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/user/users/[REDACTED]/dashboards` (157x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - GET `/apigateway/navigation/navigations/details` (145x, 200; Schritte: 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen)
  - POST `/apigateway/userservice/workspaces/log` (120x, 200, 500; Schritte: DV-Historie pruefen, Export-Quelle oeffnen, Kundendetail oeffnen, Start, Wareneingang oeffnen und offenen Status lesen)
  - POST `/apigateway/userservice/metrics/user-login` (77x, 200; Schritte: 1., Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Start, Vorgaenge oeffnen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/user-details` (70x, 200; Schritte: Export-Quelle oeffnen)
  - GET `/apigateway/user/users/search` (42x, 200; Schritte: 15. Tourenplanung, 3. App-Menue, 3. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Testkunde eindeutig aufloesen, Vorgang zum Testkunden laden, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/user/users` (32x, 200; Schritte: 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen, Vorgangsliste pruefen)
  - GET `/apigateway/userservice/user/preferences` (14x, 200; Schritte: 3. Kunden / Artikel, 6. Detail oeffnen, DV-Historie pruefen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen)
  - GET `/apigateway/userservice/workspaces` (5x, 200; Schritte: 11. Kassenbuch, Kasse: Bons und Kassenbuchlisten laden)
- Fehlende Inventar-Beispiele:
  - PATCH `/user/preferences`
  - PUT `/workspaces/{uuid}`
  - GET `/workspaces/{workspaceUuid}/scanner-settings`
  - PUT `/workspaces/{workspaceUuid}/tse-initialization`
  - GET `/workspaces/scanner-settings/{workspaceScannerSettingUuid}`
  - PUT `/workspaces/scanner-settings/{workspaceScannerSettingUuid}`

### vertragsdokumente

- Responses: 0
- Endpunkte: 0
- Inventar-Coverage: 0 %
- Known/Observed/Missing: 2 / 0 / 2
- Plattform-Kandidat: Eigenes Plattformmodul fuer vertragsdokumente pruefen.
- Wissensluecke: Noch keine verwertbaren Endpunkte beobachtet.
- Schritte: Ohne Marker
- Statuscodes:
  - keine
- Top-Endpunkte:
- Fehlende Inventar-Beispiele:
  - GET `/vertragsdokumente`
  - GET `/vertragsdokumente/{legs}`

### Warenwirtschaft/Bestellung

- Responses: 582
- Endpunkte: 37
- Inventar-Coverage: 50 %
- Known/Observed/Missing: 34 / 17 / 17
- Plattform-Kandidat: Beschaffung, Bestellvorschlaege, Bestellung und Wareneingang.
- Wissensluecke: Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.
- Schritte: `10. Dokumente`, `14. Lieferanten`, `15. Dokumente`, `17. Dokumente`, `2. App-Menue`, `2. Kunden / Artikel`, `24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein`, `25. Kundendaten`, `27. Kundendaten`, `3. App-Menue`, `3. Kunden / Artikel`, `4. Detail oeffnen`, `6. Detail oeffnen`, `Bestellung aus Vorschlag erzeugen`, `Bestellung und Positionen zuruecklesen`, `Bestellung verarbeiten`, `Bestellung verarbeiten und Bestellt-Status lesen`, `Bestellvorschlag per selection vorbereiten`, `DV-Historie pruefen`, `Datenabruf ausloesen`, `Endstatus in Bestellliste und Detail pruefen`, `Kundendetail oeffnen`, `Login/Workspace pruefen`, `Musterartikel eindeutig aufloesen`, `Musterartikel suchen und Kontext laden`, `Neuer Vorgang aus Kundenhistorie starten`, `PDF/Mail lokal vorbereiten`, `Passenden Bestellvorschlag suchen`, `Start`, `Test-Bestellvorschlag anlegen`, `Testbestellung anlegen oder suchen und Ausgangsstatus lesen`, `Vorgangsliste pruefen`, `Wareneingang Probe: keywords Bestellnummer`, `Wareneingang Probe: nur leerer Filter`, `Wareneingang Probe: nur orderNr`, `Wareneingang Probe: orderNr leerer Suchtext`, `Wareneingang Probe: orderNumber leerer Suchtext`, `Wareneingang Probe: wawiservice orderNr`, `Wareneingang buchen`, `Wareneingang oeffnen und offenen Status lesen`, `Wareneingang teilweise oder voll buchen und Status lesen`, `Wareneingangskandidaten suchen`, `Wawi: Wareneingang Kandidaten suchen`, `Wawi: Wareneingang Position-Info laden`, `Zum Datenbereich navigieren`
- Statuscodes:
  - 200: 563
  - 201: 10
  - 400: 1
  - 500: 8
- Top-Endpunkte:
  - GET `/apigateway/wawi/storage-locations` (73x, 200; Schritte: 2. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang buchen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Zum Datenbereich navigieren)
  - POST `/apigateway/wawi/order-arrival/search` (64x, 200, 500; Schritte: 2. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang Probe: keywords Bestellnummer, Wareneingang Probe: nur leerer Filter, Wareneingang Probe: nur orderNr, Wareneingang Probe: orderNr leerer Suchtext, Wareneingang Probe: orderNumber leerer Suchtext, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Wareneingangskandidaten suchen, Wawi: Wareneingang Kandidaten suchen)
  - GET `/apigateway/supplier/suppliers` (59x, 200; Schritte: 3. App-Menue, 3. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/wawi/delivery-terms/search` (48x, 200; Schritte: 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Kundendetail oeffnen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/wawi/order-states` (48x, 200; Schritte: 3. App-Menue, 3. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren)
  - POST `/apigateway/wawi/order-proposals/search` (31x, 200; Schritte: 3. App-Menue, 3. Kunden / Artikel, Datenabruf ausloesen, Passenden Bestellvorschlag suchen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Zum Datenbereich navigieren)
  - GET `/apigateway/wawi/cost-centers` (30x, 200; Schritte: 4. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Neuer Vorgang aus Kundenhistorie starten, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/wawi/orders/[REDACTED]` (27x, 200; Schritte: 2. Kunden / Artikel, Bestellung und Positionen zuruecklesen, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Wareneingangskandidaten suchen)
  - GET `/apigateway/wawi/orders/[REDACTED]/positions` (26x, 200; Schritte: Bestellung und Positionen zuruecklesen, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang buchen, Wareneingang oeffnen und offenen Status lesen)
  - POST `/apigateway/wawi/orders/search` (21x, 200; Schritte: Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/supplier/suppliers/[REDACTED]/addresses` (13x, 200; Schritte: Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
  - GET `/apigateway/supplier/suppliers/[REDACTED]/contact-opportunities` (13x, 200; Schritte: Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen)
- Fehlende Inventar-Beispiele:
  - POST `/order-arrival/book-recorded`
  - POST `/orders/{orderUuid}/add-proposals`
  - POST `/orders/{orderUuid}/check-proposals`
  - POST `/orders/{orderUuid}/positions`
  - PUT `/orders/{orderUuid}/positions`
  - DELETE `/orders/{orderUuid}/positions/{positionUuid}`
  - PUT `/orders/{orderUuid}/positions/{positionUuid}`
  - POST `/orders/collect-proposal-order-infos`

