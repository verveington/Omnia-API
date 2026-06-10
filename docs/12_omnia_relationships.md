# Omnia-Relationship-Map

Generiert: 2026-06-09T20:51:32.270Z

Hinweis: Diese Karte nutzt ausschliesslich redaktierte API-Records. Sie zeigt beobachtete Reihenfolgen und Domaenen-Kanten, keine Rohwerte.

## Zusammenfassung

- API-Responses: 6691
- Fachbereiche: 12
- Schritte mit API-Kontext: 157
- Domaenen-Kanten: 97

## Domaenen-Graph

```mermaid
graph LR
  "User/Workspace" -->|132| "Abrechnung/Kasse"
  "Abrechnung/Kasse" -->|54| "Kommunikation/Aufgaben"
  "Kommunikation/Aufgaben" -->|243| "Filialen/Mandant"
  "Filialen/Mandant" -->|84| "Referenzdaten"
  "Referenzdaten" -->|83| "Filialen/Mandant"
  "Filialen/Mandant" -->|246| "Kommunikation/Aufgaben"
  "Kommunikation/Aufgaben" -->|333| "User/Workspace"
  "User/Workspace" -->|194| "Filialen/Mandant"
  "Kommunikation/Aufgaben" -->|100| "Kunden/Vorgaenge"
  "Kunden/Vorgaenge" -->|54| "User/Workspace"
  "User/Workspace" -->|41| "Kunden/Vorgaenge"
  "Kunden/Vorgaenge" -->|21| "Hilfsmittel"
  "Hilfsmittel" -->|12| "Kunden/Vorgaenge"
  "Kunden/Vorgaenge" -->|32| "Kommunikation/Aufgaben"
  "Filialen/Mandant" -->|19| "Abrechnung/Kasse"
  "Abrechnung/Kasse" -->|50| "Kunden/Vorgaenge"
  "Kunden/Vorgaenge" -->|50| "Warenwirtschaft/Bestellung"
  "Warenwirtschaft/Bestellung" -->|46| "Kunden/Vorgaenge"
  "Kunden/Vorgaenge" -->|101| "Filialen/Mandant"
  "Filialen/Mandant" -->|111| "Kunden/Vorgaenge"
```

## Wichtigste Domaenen-Kanten

| Von | Nach | Anzahl | Schritte | Beispiel |
|---|---|---:|---|---|
| User/Workspace | Abrechnung/Kasse | 132 | 11. Kassenbuch, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, DV-Historie pruefen, Export-Quelle oeffnen, Kasse: Bons und Kassenbuchlisten laden, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/user/users/[REDACTED]/dashboards` -> GET `/apigateway/vatrates/vatrates` |
| Abrechnung/Kasse | Kommunikation/Aufgaben | 54 | 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 25. Kundendaten, 26. Notizen, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/vatrates/vatrates` -> GET `/apigateway/mail/gateway-configurations/user-mail-addresses` |
| Kommunikation/Aufgaben | Filialen/Mandant | 243 | 1. input, 11. Ansprechpartner, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Hilfsmittelhistorie, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker, Start, Wareneingang oeffnen und offenen Status lesen | GET `/apigateway/mail/gateway-configurations/user-mail-addresses` -> GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` |
| Filialen/Mandant | Referenzdaten | 84 | 12. Rezeptdruck, 13. Rückholansicht, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` -> GET `/apigateway/enum-service/enums` |
| Referenzdaten | Filialen/Mandant | 83 | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/country/countries` -> GET `/apigateway/userservice/companies/details/preferences` |
| Filialen/Mandant | Kommunikation/Aufgaben | 246 | 11. Ansprechpartner, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker, Start, Wareneingang teilweise oder voll buchen und Status lesen | GET `/apigateway/userservice/companies/details/preferences` -> GET `/apigateway/task/tasks/task-count` |
| Kommunikation/Aufgaben | User/Workspace | 333 | 11. saniPEP Sanitätshaus GmbH & Co. KG. HR1680770 MoliCare Pad 4 Tropfen 30 ST Paul-Hartmann-AG, Heidenheim Stück [REDACTED], 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 20. Kundendaten, 9. Kassenverwaltung, DV-Historie pruefen, Download pruefen, Endstatus in Bestellliste und Detail pruefen, Ergebnis pruefen, Export ausloesen, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker, Vorgaenge oeffnen, Wareneingang oeffnen und offenen Status lesen | GET `/apigateway/communicatorservice/reminders/dbopt` -> GET `/apigateway/navigation/navigations/details` |
| User/Workspace | Filialen/Mandant | 194 | 1., 11. Kassenbuch, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 18. Vorgangsnavigator (Archiv), 3. Kunden / Artikel, 4. Detail oeffnen, 9. Kassenverwaltung, Artikel: Musterartikel-Kit suchen, Endstatus in Bestellliste und Detail pruefen, Export-Menue oeffnen, Kundendetail oeffnen, Musterartikel eindeutig aufloesen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | GET `/apigateway/navigation/navigations/details` -> GET `/apigateway/filiale/filialen` |
| Kommunikation/Aufgaben | Kunden/Vorgaenge | 100 | 1., 11. Ansprechpartner, 25. Kundendaten, 26. Notizen, 27. Kundendaten, 4. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export ausloesen, Export konfigurieren, Export-Quelle oeffnen, Exportbereich oeffnen, Login/Workspace pruefen, Ohne Marker, Start, Testkunde eindeutig aufloesen, Vorgaenge oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | GET `/apigateway/mail/mails/unread-number` -> POST `/apigateway/salesprocessservice/status/search` |
| Kunden/Vorgaenge | User/Workspace | 54 | 1. Kunden / Artikel, 11. Vermittler, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 21. Kunden / Artikel, 26. Notizen, 28. Notizen, 3. App-Menue, 3. Kunden / Artikel, 30. Kostenvoranschlag Adresse Musterbereich 123 Nein 81737 Musterstadt [REDACTED], DV-Historie pruefen, Musterkunde suchen, Neuen Vorgang zuruecklesen, Ohne Marker, Testkunde eindeutig aufloesen, Vorgang zuruecklesen und No-op verifizieren | POST `/apigateway/salesprocessservice/status/search` -> POST `/apigateway/userservice/metrics/user-login` |
| User/Workspace | Kunden/Vorgaenge | 41 | 1. Kunden / Artikel, 14. Terminübersicht, 16. Vorgangsliste, DV-Historie pruefen, Kunde-Historie oeffnen, Kundendetail oeffnen, Musterkunde suchen, Ohne Marker, Testkunde eindeutig aufloesen, Vorgang zum Testkunden laden | POST `/apigateway/userservice/metrics/user-login` -> GET `/apigateway/sales/salesprocesses/kpi-statistics` |
| Kunden/Vorgaenge | Hilfsmittel | 21 | 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 4. Gutscheine, 5. Hilfsmittelverwaltung, 6. Hilfsmittelnavigator, Export-Quelle oeffnen, Ohne Marker, Testkunde eindeutig aufloesen, Vorgang zum Testkunden laden, Zum Datenbereich navigieren | POST `/apigateway/sales/salesprocesses/search` -> GET `/apigateway/hilfsmittel/hilfsmittel/termine` |
| Hilfsmittel | Kunden/Vorgaenge | 12 | 18. Hilfsmittelhistorie, 19. Historie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 22. Historie, 24. Historie, 6. Hilfsmittelnavigator, Ohne Marker, Testkunde eindeutig aufloesen, Zum Datenbereich navigieren | GET `/apigateway/hilfsmittel/hilfsmittel/termine` -> POST `/apigateway/sales/salesprocesses/search` |
| Kunden/Vorgaenge | Kommunikation/Aufgaben | 32 | 26. Kostenträgerdaten, 27. Kundendaten, 4. Detail oeffnen, DV-Historie pruefen, Export ausloesen, Exportbereich oeffnen, Login/Workspace pruefen, Max Mustermann suchen, Neuen Vorgang eindeutig ermitteln, Ohne Marker, Start, Vorgaenge oeffnen, Vorgangsliste pruefen | GET `/apigateway/sales/salesprocesses/[REDACTED]` -> GET `/apigateway/communicatorservice/tasks/by-process/count` |
| Filialen/Mandant | Abrechnung/Kasse | 19 | DV-Historie pruefen, Kasse: Bons und Kassenbuchlisten laden, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Vorgangsliste pruefen | GET `/apigateway/filiale/filialen/[REDACTED]` -> POST `/apigateway/salesprocessservice/invoices/search` |
| Abrechnung/Kasse | Kunden/Vorgaenge | 50 | 1., 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 26. Adressdaten, 27. Kundendaten, 28. Notizen, 3. Adressdaten, 4. Detail oeffnen, 6. Adressdaten, 6. Detail oeffnen, 8. Adressdaten, DV-Historie pruefen, Kunde-Historie oeffnen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Vorgangsliste pruefen | POST `/apigateway/salesprocessservice/invoices/search` -> GET `/apigateway/customerservice/customers/[REDACTED]` |
| Kunden/Vorgaenge | Warenwirtschaft/Bestellung | 50 | 1. Kunden / Artikel, 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 24. Kostenträgerdaten, 25. Kundendaten, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start, Wareneingang Probe: keywords Bestellnummer, Wareneingang Probe: orderNr leerer Suchtext, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen | GET `/apigateway/customerservice/customers/[REDACTED]` -> GET `/apigateway/wawi/cost-centers` |
| Warenwirtschaft/Bestellung | Kunden/Vorgaenge | 46 | 1., 10. Dokumente, 15. Dokumente, 17. Dokumente, 2. Kunden / Artikel, 25. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, Bestellung verarbeiten, DV-Historie pruefen, Kundendetail oeffnen, Musterartikel eindeutig aufloesen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, PDF/Mail lokal vorbereiten, Passenden Bestellvorschlag suchen, Start, Testkunde eindeutig aufloesen, Vorgangsliste pruefen, Wareneingang Probe: orderNr leerer Suchtext, Wareneingang Probe: orderNumber leerer Suchtext, Wareneingangskandidaten suchen | GET `/apigateway/wawi/cost-centers` -> POST `/apigateway/sales/art/search` |
| Kunden/Vorgaenge | Filialen/Mandant | 101 | 11. Ansprechpartner, 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 4. Detail oeffnen, 6. Hilfsmittelnavigator, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Kunde-Historie oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start, Vorgaenge oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` -> GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen` |
| Filialen/Mandant | Kunden/Vorgaenge | 111 | 11. Ansprechpartner, 17. Hilfsmittelhistorie, 18. App-Menue, 2. Kunden / Artikel, 4. Detail oeffnen, 5. Arzt, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Musterkunde suchen, Neuen Vorgangsentwurf speichern, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start, Vorgaenge oeffnen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | GET `/apigateway/filiale/filialen` -> GET `/apigateway/kostentraeger-tenant/kostentraeger/cloud-status` |
| Warenwirtschaft/Bestellung | Abrechnung/Kasse | 34 | 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 27. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Kundendetail oeffnen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Wawi: Wareneingang Position-Info laden | GET `/apigateway/wawi/delivery-terms/search` -> GET `/apigateway/accounting/payment-terms` |
| Abrechnung/Kasse | Hilfsmittel | 8 | 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 6. Hilfsmittelnavigator, 7. Transactions, Ohne Marker | GET `/apigateway/accounting/payment-terms` -> GET `/apigateway/hilfsmittel/route-plannings` |
| Hilfsmittel | Artikel/Warenbestand | 5 | Export ausloesen, Export-Menue oeffnen, Export-Quelle oeffnen, Ohne Marker, Start | GET `/apigateway/hilfsmittel/route-plannings` -> POST `/apigateway/article-tenant/articles/merchandise-management-setting` |
| Artikel/Warenbestand | User/Workspace | 19 | 3. App-Menue, 3. Kunden / Artikel, 6. Detail oeffnen, Artikel: Musterartikel-Kit suchen, Bestellung verarbeiten und Bestellt-Status lesen, Export-Menue oeffnen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Zum Datenbereich navigieren | POST `/apigateway/article-tenant/articles/merchandise-management-setting` -> GET `/apigateway/userservice/user/preferences` |
| Kunden/Vorgaenge | Artikel/Warenbestand | 40 | 18. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 6. Detail oeffnen, DV-Historie pruefen, Musterartikel eindeutig aufloesen, Musterartikel fuer Vorgangsposition suchen, Musterartikel suchen und Kontext laden, Musterkunde suchen, Neuen Vorgang vor Positionswrite laden, Ohne Marker, Sales-Process- und Filial-Kontext zum Musterkunden laden, Start, Zum Datenbereich navigieren | GET `/apigateway/kunden/customers/[REDACTED]/addresses` -> POST `/apigateway/article-tenant/articles/merchandise-management-setting` |
| Artikel/Warenbestand | Dokumente/Archiv | 7 | 11. Artikeldaten, 12. Dokumente (Archiv), 6. Detail oeffnen, 8. Dokumente, Artikel: Dokumente suchen, Artikel: Lieferantendaten laden, DV-Historie pruefen, Ohne Marker | POST `/apigateway/article-tenant/articles/merchandise-management-setting` -> GET `/apigateway/document/stored-documents` |
| Dokumente/Archiv | Artikel/Warenbestand | 4 | 11. Artikeldaten, 12. Dokumente (Archiv), 14. Lieferanten, 3. Kunden / Artikel, 8. Dokumente, Ohne Marker | GET `/apigateway/document/stored-documents` -> POST `/apigateway/article-tenant/articles/merchandise-management-setting` |
| Artikel/Warenbestand | Warenwirtschaft/Bestellung | 49 | 14. Lieferanten, 2. Kunden / Artikel, 6. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Musterartikel suchen und Kontext laden, Ohne Marker, Passenden Bestellvorschlag suchen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | POST `/apigateway/article-tenant/articles/merchandise-management-setting` -> POST `/apigateway/wawiservice/stock-items/count-article-quantities` |
| Warenwirtschaft/Bestellung | Artikel/Warenbestand | 33 | 14. Lieferanten, 16. Preisdaten, 2. Kunden / Artikel, 3. Kunden / Artikel, 6. Detail oeffnen, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Musterartikel suchen und Kontext laden, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | POST `/apigateway/wawiservice/stock-items/count-article-quantities` -> GET `/apigateway/articletenantservice/articles/search/[REDACTED]` |
| Artikel/Warenbestand | Kunden/Vorgaenge | 19 | 6. Detail oeffnen, DV-Historie pruefen, Musterartikel fuer Vorgangsposition suchen, Musterartikel suchen und Kontext laden, Musterartikel-Position berechnen, Musterkunde suchen, Ohne Marker, Start, Wareneingang teilweise oder voll buchen und Status lesen | POST `/apigateway/article-tenant/articles/merchandise-management-setting` -> PUT `/apigateway/sales/salesprocesses/[REDACTED]` |
| Hilfsmittel | Filialen/Mandant | 11 | 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 6. Detail oeffnen, 6. Hilfsmittelnavigator, Ohne Marker | GET `/apigateway/hilfsmittel/hilfsmittel/termine` -> GET `/apigateway/firma/companies/details` |
| Filialen/Mandant | Artikel/Warenbestand | 50 | 1., 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 3. App-Menue, 3. Kunden / Artikel, 6. Detail oeffnen, 6. Hilfsmittelnavigator, Artikel: Musterartikel-Kit suchen, Artikel: Preisdaten laden, Artikel: Warenwirtschaftsdaten laden, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Export-Menue oeffnen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Zum Datenbereich navigieren | GET `/apigateway/firma/companies/details` -> GET `/apigateway/articletenantservice/bits-articles/producer-list` |
| Artikel/Warenbestand | Filialen/Mandant | 37 | 17. Warenwirtschaft, 18. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 3. Kunden / Artikel, Artikel: Preisdaten laden, Artikel: Warenwirtschaftsdaten laden, Endstatus in Bestellliste und Detail pruefen, Export-Menue oeffnen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Musterartikel suchen und Kontext laden, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen | GET `/apigateway/articletenantservice/bits-articles/producer-list` -> GET `/apigateway/userservice/companies/details/preferences` |
| Artikel/Warenbestand | Abrechnung/Kasse | 12 | 1., 3. Kunden / Artikel, Artikel: Musterartikel-Kit suchen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Ohne Marker, Start | GET `/apigateway/article-tenant/label-configurations/[REDACTED]` -> GET `/apigateway/accounting/material-groups` |
| Abrechnung/Kasse | Artikel/Warenbestand | 7 | 3. Kunden / Artikel, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Ohne Marker, Start | GET `/apigateway/accounting/material-groups` -> POST `/apigateway/articletenantservice/articles/simple-search` |
| Filialen/Mandant | Hilfsmittel | 4 | 18. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, Ohne Marker | GET `/apigateway/firma/companies/details` -> POST `/apigateway/hilfsmittel/arten/search` |
| Artikel/Warenbestand | Kommunikation/Aufgaben | 6 | 11. saniPEP Sanitätshaus GmbH & Co. KG. HR1680770 MoliCare Pad 4 Tropfen 30 ST Paul-Hartmann-AG, Heidenheim Stück [REDACTED], 6. Detail oeffnen, Export ausloesen, Export-Menue oeffnen, Ohne Marker, Start | GET `/apigateway/article-tenant/label-configurations/[REDACTED]` -> GET `/apigateway/task/tasks/task-count` |
| User/Workspace | Kommunikation/Aufgaben | 273 | 1., 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Bestellung verarbeiten und Bestellt-Status lesen, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker, Start, Vorgaenge oeffnen, Vorgang detail oeffnen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | POST `/apigateway/userservice/metrics/user-login` -> GET `/apigateway/mail/mails/unread-number` |
| Kommunikation/Aufgaben | Artikel/Warenbestand | 10 | Artikel: Musterartikel-Kit suchen, Export-Menue oeffnen, Musterartikel eindeutig aufloesen, Ohne Marker, Start, Wareneingang teilweise oder voll buchen und Status lesen | GET `/apigateway/mail/mails/unread-number` -> GET `/apigateway/articletenantservice/bits-articles/producer-list` |
| Warenwirtschaft/Bestellung | Kommunikation/Aufgaben | 12 | 2. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, Datenabruf ausloesen, Ergebnis pruefen, Login/Workspace pruefen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Zum Datenbereich navigieren | POST `/apigateway/supplier/suppliers/list` -> GET `/apigateway/mail/mails/unread-number` |
| Filialen/Mandant | User/Workspace | 169 | 1., 11. Kassenbuch, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 17. Warenwirtschaft, 18. Vorgangsnavigator (Archiv), 2. App-Menue, 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 25. Kundendaten, 27. Kundendaten, 3. Kunden / Artikel, 4. Detail oeffnen, 6. Detail oeffnen, 9. Kassenverwaltung, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Export-Quelle oeffnen, Kasse: Bons und Kassenbuchlisten laden, Kundendetail oeffnen, Login/Workspace pruefen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen | GET `/apigateway/filiale/filialen/names` -> POST `/apigateway/workspaces` |
| Referenzdaten | Kommunikation/Aufgaben | 123 | 11. Ansprechpartner, 12. Rezeptdruck, 13. Rückholansicht, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 20. Kundendaten, 8. Detail oeffnen, 9. Kassenverwaltung, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/enum-service/enums` -> GET `/apigateway/mail/mails/unread-number` |
| Artikel/Warenbestand | Hilfsmittel | 13 | 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 6. Detail oeffnen, 6. Hilfsmittelnavigator, Export ausloesen, Ohne Marker, Start | GET `/apigateway/wawi/producers` -> GET `/apigateway/hilfsmittel/hilfsmittel/traits` |
| Hilfsmittel | Abrechnung/Kasse | 14 | 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie, 22. Hilfsmittelhistorie, 6. Hilfsmittelnavigator, Ohne Marker | GET `/apigateway/hilfsmittel/hilfsmittel/traits` -> GET `/apigateway/accounting/material-groups` |
| Hilfsmittel | User/Workspace | 6 | 18. Hilfsmittelhistorie, 7. Transactions, Ohne Marker, Route: Planungen zum Vorgang laden, Testkunde eindeutig aufloesen | POST `/apigateway/hilfsmittel/hilfsmittel/search` -> GET `/apigateway/userservice/feature-toggles` |
| Kommunikation/Aufgaben | Referenzdaten | 77 | 12. Rezeptdruck, 15. Tourenplanung, 9. Kassenverwaltung, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/communicatorservice/reminders/dbopt` -> GET `/apigateway/country/countries` |
| Abrechnung/Kasse | User/Workspace | 115 | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 6. Detail oeffnen, 6. Hilfsmittelnavigator, 9. Kassenverwaltung, Export-Quelle oeffnen, Kasse: Bons und Kassenbuchlisten laden, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/accounting/material-groups` -> GET `/apigateway/userservice/feature-toggles` |
| Referenzdaten | User/Workspace | 29 | 6. Detail oeffnen, 8. Detail oeffnen, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/country/countries` -> GET `/apigateway/user/users/[REDACTED]/dashboards` |
| User/Workspace | Referenzdaten | 68 | 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, Export-Quelle oeffnen, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/user/users/[REDACTED]/dashboards` -> GET `/apigateway/enum-service/enums` |
| Hilfsmittel | Kommunikation/Aufgaben | 2 | Login/Workspace pruefen, Ohne Marker, Zum Datenbereich navigieren | GET `/apigateway/hilfsmittel/hilfsmittel/termine` -> GET `/apigateway/task/tasks/task-count` |
| Kommunikation/Aufgaben | Warenwirtschaft/Bestellung | 16 | Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Datenabruf ausloesen, Login/Workspace pruefen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang teilweise oder voll buchen und Status lesen, Zum Datenbereich navigieren | GET `/apigateway/mail/mails/unread-number` -> GET `/apigateway/wawi/storage-locations` |
| Filialen/Mandant | Warenwirtschaft/Bestellung | 69 | 2. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Vorgangsliste pruefen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | GET `/apigateway/filiale/filialen` -> GET `/apigateway/supplier/suppliers` |
| Warenwirtschaft/Bestellung | User/Workspace | 21 | 6. Detail oeffnen, Bestellung verarbeiten, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang Probe: wawiservice orderNr, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | POST `/apigateway/wawi/order-proposals/search` -> POST `/apigateway/userservice/metrics/user-login` |
| Warenwirtschaft/Bestellung | Filialen/Mandant | 86 | 2. Kunden / Artikel, 3. App-Menue, Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang buchen, Wareneingang oeffnen und offenen Status lesen, Wareneingang teilweise oder voll buchen und Status lesen, Wareneingangskandidaten suchen, Zum Datenbereich navigieren | GET `/apigateway/wawi/order-states` -> GET `/apigateway/filiale/filialen` |
| User/Workspace | Warenwirtschaft/Bestellung | 32 | 3. App-Menue, 3. Kunden / Artikel, Bestellung verarbeiten und Bestellt-Status lesen, Endstatus in Bestellliste und Detail pruefen, Kundendetail oeffnen, Login/Workspace pruefen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen, Zum Datenbereich navigieren | GET `/apigateway/user/users/search` -> GET `/apigateway/supplier/suppliers` |
| Kommunikation/Aufgaben | Dokumente/Archiv | 43 | 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 3. App-Menue, 9. Kassenverwaltung, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/task/tasks/reminder-count` -> GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` |
| Dokumente/Archiv | User/Workspace | 13 | 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 2. App-Menue, Artikel: Dokumente suchen, Ohne Marker | GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` -> GET `/apigateway/userservice/feature-toggles` |
| Filialen/Mandant | Dokumente/Archiv | 62 | 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 2. App-Menue, 2. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, 9. Kassenverwaltung, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` -> GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` |
| Dokumente/Archiv | Kommunikation/Aufgaben | 80 | 1. input, 12. Rezeptdruck, 13. Rückholansicht, 14. Terminübersicht, 15. Tourenplanung, 16. Vorgangsliste, 17. Vorgangsnavigator, 18. Vorgangsnavigator (Archiv), 9. Kassenverwaltung, DV-Historie pruefen, Kundendetail oeffnen, Ohne Marker, Testbestellung anlegen oder suchen und Ausgangsstatus lesen | GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` -> GET `/apigateway/task/tasks/reminder-count` |
| Kommunikation/Aufgaben | Abrechnung/Kasse | 8 | 12. Rezeptdruck, 13. Rückholansicht, 16. Vorgangsliste, Kasse: Bons und Kassenbuchlisten laden, Ohne Marker | GET `/apigateway/mail/gateway-configurations/user-mail-addresses` -> GET `/apigateway/vatrates/vatrates` |
| Dokumente/Archiv | Filialen/Mandant | 15 | 12. Rezeptdruck, 13. Rückholansicht, 2. Kunden / Artikel, 9. Kassenverwaltung, Ohne Marker | GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` -> GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` |
| User/Workspace | Artikel/Warenbestand | 13 | 6. Detail oeffnen, DV-Historie pruefen, Login/Workspace pruefen, Musterartikel eindeutig aufloesen, Ohne Marker, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen | GET `/apigateway/userservice/user/preferences` -> GET `/apigateway/articletenantservice/bits-articles/producer-list` |
| Abrechnung/Kasse | Referenzdaten | 1 | 17. Vorgangsnavigator | GET `/apigateway/vatrates/vatrates` -> GET `/apigateway/country/countries` |
| Kunden/Vorgaenge | Abrechnung/Kasse | 62 | 16. Vorgangsliste, 17. Vorgangsnavigator, 2. Kunden / Artikel, 4. Detail oeffnen, DV-Historie pruefen, Kunde: [REDACTED], Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Testkunde eindeutig aufloesen, Vorhandene Vorgangsliste merken | POST `/apigateway/salesprocessservice/status/search` -> GET `/apigateway/vatrates/vatrates` |
| User/Workspace | Dokumente/Archiv | 10 | Kundendetail oeffnen, Ohne Marker | POST `/apigateway/userservice/workspaces/log` -> GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` |
| Abrechnung/Kasse | apigateway | 21 | 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 27. Kundendaten, 4. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker | GET `/apigateway/accounting/payment-terms` -> GET `/apigateway/accounting/fibu-accounts/settings` |
| apigateway | Filialen/Mandant | 25 | 2. Kunden / Artikel, 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein, 27. Kundendaten, 4. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start, Vorgangsliste pruefen | GET `/apigateway/accounting/fibu-accounts/settings` -> GET `/apigateway/firma/companies/details/accountings` |
| Kunden/Vorgaenge | Referenzdaten | 13 | 10. Detail oeffnen, 28. Detail oeffnen, 6. Detail oeffnen, 8. Detail oeffnen, Ohne Marker | GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` -> GET `/apigateway/navigationservice/external/countries` |
| Referenzdaten | Dokumente/Archiv | 1 | 14. Dokumente (Archiv), 8. Detail oeffnen | GET `/apigateway/navigationservice/external/countries` -> POST `/apigateway/document/archive-documents/search` |
| Dokumente/Archiv | Kunden/Vorgaenge | 24 | 12. Dokumente (Archiv), 14. DV-Historie, 14. Dokumente (Archiv), 16. DV-Historie, 17. Dokumente (Archiv), 19. DV-Historie, 19. Dokumente (Archiv), 2. App-Menue, 2. Kunden / Artikel, 21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86, 21. DV-Historie, 3. App-Menue, 3. Kunden / Artikel, DV-Historie pruefen, Ohne Marker | POST `/apigateway/document/archive-documents/search` -> POST `/apigateway/salesprocessservice/status/search` |
| Kunden/Vorgaenge | dv-data | 15 | 10. Dokumente, 14. Arztdaten, 14. DV-Historie, 15. Dokumente, 16. Arztdaten, 16. DV-Historie, 17. Dokumente, 17. Hilfsmittelhistorie, 19. DV-Historie, 20. Hilfsmittelhistorie, 21. DV-Historie, 22. Hilfsmittelhistorie, 9. Arztdaten, Ohne Marker | POST `/apigateway/salesprocessservice/status/search` -> POST `/apigateway/sales/dv-data/search` |
| dv-data | Kunden/Vorgaenge | 3 | 14. DV-Historie, 17. Hilfsmittelhistorie, 18. Hilfsmittelhistorie, 20. Hilfsmittelhistorie | POST `/apigateway/sales/dv-data/search` -> POST `/apigateway/salesprocessservice/status/search` |
| Kunden/Vorgaenge | apigateway | 32 | 2. Kunden / Artikel, 21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86, 22. Historie, 23. Historie (Archiv), 24. Historie, 25. Historie (Archiv), 25. Kundendaten, 4. Detail oeffnen, DV-Historie pruefen, Neuen Vorgang eindeutig ermitteln, Neuen Vorgangsentwurf speichern, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Vorgangsliste pruefen | GET `/apigateway/kunden/customers/[REDACTED]` -> GET `/apigateway/accounting/fibu-accounts/settings` |
| apigateway | Abrechnung/Kasse | 12 | 2. App-Menue, 2. Kunden / Artikel, 25. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kundendetail oeffnen, Ohne Marker | GET `/apigateway/accounting/fibu-accounts/settings` -> GET `/apigateway/accounting/payment-terms` |
| Abrechnung/Kasse | Filialen/Mandant | 24 | 2. App-Menue, 2. Kunden / Artikel, 25. Kundendaten, 4. Detail oeffnen, 6. Detail oeffnen, DV-Historie pruefen, Kasse: Bons und Kassenbuchlisten laden, Kundendetail oeffnen, Login/Workspace pruefen, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Start | GET `/apigateway/accounting/payment-terms` -> GET `/apigateway/firma/companies/details/accountings` |
| Referenzdaten | Kunden/Vorgaenge | 7 | 10. Detail oeffnen, 11. Ansprechpartner, 13. Ansprechpartner, 28. Detail oeffnen, 30. Kostenvoranschlag Adresse Musterbereich 123 Nein 81737 Musterstadt [REDACTED], 6. Detail oeffnen, 7. Ansprechpartner, 8. Detail oeffnen | GET `/apigateway/navigationservice/external/countries` -> GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` |
| Dokumente/Archiv | Warenwirtschaft/Bestellung | 7 | 2. Kunden / Artikel, 3. App-Menue, 3. Kunden / Artikel, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen | GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` -> GET `/apigateway/wawi/delivery-terms/search` |
| dv-data | Warenwirtschaft/Bestellung | 7 | 10. Dokumente, 15. Dokumente, 17. Dokumente, Ohne Marker | GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` -> GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` |
| Kunden/Vorgaenge | Dokumente/Archiv | 16 | 10. Dokumente, 15. Dokumente, 16. Suche Dokument, 17. Dokumente, 18. Suche Dokument, 20. 18582 Max Mustermann [REDACTED] AOK Bayern Nein Abholbereit [REDACTED] Christoph Schernthaner 0,00 € 0,00 € 0,00 € 0,00, DV-Historie pruefen, Ohne Marker | GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` -> POST `/apigateway/document/stored-documents/search` |
| dv-data | Hilfsmittel | 3 | 14. DV-Historie, 18. Hilfsmittelhistorie, 22. Hilfsmittelhistorie | POST `/apigateway/sales/dv-data/search` -> POST `/apigateway/hilfsmittel/arten/search` |
| Warenwirtschaft/Bestellung | Dokumente/Archiv | 7 | 10. Dokumente, Endstatus in Bestellliste und Detail pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen | GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` -> POST `/apigateway/document/stored-documents/search` |
| dv-data | User/Workspace | 1 | 14. DV-Historie, Ohne Marker | POST `/apigateway/sales/dv-data/search` -> GET `/apigateway/userservice/feature-toggles` |
| apigateway | Kunden/Vorgaenge | 23 | 23. Historie (Archiv), 24. Kostenträgerdaten, 25. Historie (Archiv), 26. Kostenträgerdaten, 4. Detail oeffnen, DV-Historie pruefen, Neuen Vorgang eindeutig ermitteln, Neuen Vorgangsentwurf speichern, Neuer Vorgang aus Kundenhistorie starten, Ohne Marker, Vorgangsliste pruefen | POST `/apigateway/sales/archived-salesprocess/search` -> GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` |
| Warenwirtschaft/Bestellung | apigateway | 8 | 2. App-Menue, Endstatus in Bestellliste und Detail pruefen, Kundendetail oeffnen, Ohne Marker, Start | GET `/apigateway/wawi/delivery-terms/search` -> GET `/apigateway/accounting/fibu-accounts/settings` |
| User/Workspace | apigateway | 1 | 6. Detail oeffnen | GET `/apigateway/user/users` -> GET `/apigateway/accounting/fibu-accounts/settings` |
| Dokumente/Archiv | Abrechnung/Kasse | 1 | 3. Kunden / Artikel | GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` -> GET `/apigateway/accounting/payment-terms` |
| User/Workspace | Hilfsmittel | 1 | Testkunde eindeutig aufloesen | GET `/apigateway/user/users/search` -> GET `/apigateway/hilfsmittel/route-plannings` |
| Filialen/Mandant | apigateway | 5 | 4. Detail oeffnen, DV-Historie pruefen | GET `/apigateway/firma/companies/details/accountings` -> GET `/apigateway/accounting/fibu-accounts/settings` |
| apigateway | User/Workspace | 4 | 4. Detail oeffnen, Ohne Marker | GET `/apigateway/accounting/fibu-accounts/settings` -> GET `/apigateway/user/users` |
| dv-data | Kommunikation/Aufgaben | 1 | Ohne Marker | POST `/apigateway/sales/dv-data/search` -> GET `/apigateway/task/tasks/reminder-count` |
| Kommunikation/Aufgaben | apigateway | 1 | Ohne Marker | GET `/apigateway/mail/mails/unread-number` -> POST `/apigateway/sales/archived-salesprocess/search` |
| apigateway | Kommunikation/Aufgaben | 2 | DV-Historie pruefen, Start | GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` -> GET `/apigateway/task/tasks/task-count` |
| Abrechnung/Kasse | Warenwirtschaft/Bestellung | 14 | Bestellung verarbeiten und Bestellt-Status lesen, DV-Historie pruefen, Endstatus in Bestellliste und Detail pruefen, Login/Workspace pruefen, Start, Testbestellung anlegen oder suchen und Ausgangsstatus lesen, Wareneingang oeffnen und offenen Status lesen | GET `/apigateway/accounting/payment-terms` -> GET `/apigateway/wawi/delivery-terms/search` |
| apigateway | Artikel/Warenbestand | 1 | DV-Historie pruefen | GET `/apigateway/audit/changelogs` -> POST `/apigateway/article-tenant/articles/merchandise-management-setting` |
| apigateway | Warenwirtschaft/Bestellung | 4 | Endstatus in Bestellliste und Detail pruefen, Start | POST `/apigateway/wawi/incoming-invoices/search` -> GET `/apigateway/wawi/orders/[REDACTED]/positions` |
| Dokumente/Archiv | apigateway | 2 | Endstatus in Bestellliste und Detail pruefen, Start | GET `/apigateway/document/stored-documents` -> GET `/apigateway/audit/changelogs` |
| Artikel/Warenbestand | apigateway | 1 | Start | POST `/apigateway/articletenantservice/articles/simple-search` -> GET `/apigateway/price-position/price-positions/search` |

## Step-Flows

### Ohne Marker

- Responses: 4018
- Domaenenfolge: User/Workspace -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> Filialen/Mandant -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> User/Workspace -> Kunden/Vorgaenge -> Hilfsmittel -> Kunden/Vorgaenge -> Kommunikation/Aufgaben -> Filialen/Mandant -> Abrechnung/Kasse -> ... 2358 weitere
- Endpunkte:
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - User/Workspace: POST `/apigateway/userservice/workspaces/log` (200)
  - User/Workspace: GET `/apigateway/user-details` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - ... 4006 weitere

### 1.

- Responses: 13
- Domaenenfolge: Filialen/Mandant -> User/Workspace -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Kunden/Vorgaenge
- Endpunkte:
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)
  - User/Workspace: POST `/apigateway/userservice/metrics/user-login` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - ... 1 weitere

### 2. Cash Till

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)

### 5. Hilfsmittelverwaltung

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/salesprocesses/vouchers/search` (200)

### 6. Hilfsmittelnavigator

- Responses: 28
- Domaenenfolge: Hilfsmittel -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> Abrechnung/Kasse -> Hilfsmittel -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> Abrechnung/Kasse -> Kunden/Vorgaenge -> Hilfsmittel -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> Abrechnung/Kasse -> Hilfsmittel -> Kunden/Vorgaenge -> ... 10 weitere
- Endpunkte:
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - ... 16 weitere

### 7. Transactions

- Responses: 1
- Domaenenfolge: Hilfsmittel
- Endpunkte:
  - Hilfsmittel: POST `/apigateway/hilfsmittel/hilfsmittel/search` (200)

### 4. Gutscheine

- Responses: 4
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/salesprocesses/vouchers/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/salesprocesses/vouchers/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/salesprocesses/vouchers/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/salesprocesses/vouchers/search` (200)

### Export-Quelle oeffnen

- Responses: 27
- Domaenenfolge: User/Workspace -> Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> Referenzdaten -> User/Workspace -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> User/Workspace -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Hilfsmittel
- Endpunkte:
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - User/Workspace: GET `/apigateway/user-details` (200)
  - User/Workspace: POST `/apigateway/userservice/workspaces/log` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - ... 15 weitere

### Export-Menue oeffnen

- Responses: 10
- Domaenenfolge: Artikel/Warenbestand -> User/Workspace -> Filialen/Mandant -> Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand -> Abrechnung/Kasse -> Artikel/Warenbestand -> Kommunikation/Aufgaben
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/articletenantservice/bits-articles/producer-list` (200)
  - User/Workspace: GET `/apigateway/userservice/user/preferences` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)

### Export ausloesen

- Responses: 51
- Domaenenfolge: Artikel/Warenbestand -> Hilfsmittel -> Artikel/Warenbestand -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Kommunikation/Aufgaben
- Endpunkte:
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - ... 39 weitere

### Download pruefen

- Responses: 2
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### Zum Datenbereich navigieren

- Responses: 29
- Domaenenfolge: Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> User/Workspace -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> User/Workspace -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Hilfsmittel -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> ... 2 weitere
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search/sums` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - User/Workspace: POST `/apigateway/userservice/metrics/user-login` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - ... 17 weitere

### Datenabruf ausloesen

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)

### Ergebnis pruefen

- Responses: 2
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### Login/Workspace pruefen

- Responses: 104
- Domaenenfolge: Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> User/Workspace -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> User/Workspace -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> ... 36 weitere
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/reminder-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - ... 92 weitere

### Exportbereich oeffnen

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)

### Export konfigurieren

- Responses: 3
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/communicatorservice/reminders/dbopt` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### 9. Kassenverwaltung

- Responses: 39
- Domaenenfolge: Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> User/Workspace -> Referenzdaten -> Kommunikation/Aufgaben -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kommunikation/Aufgaben -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> Abrechnung/Kasse -> User/Workspace -> ... 16 weitere
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - ... 27 weitere

### 11. Kassenbuch

- Responses: 4
- Domaenenfolge: Filialen/Mandant -> User/Workspace -> Filialen/Mandant -> User/Workspace
- Endpunkte:
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces` (200)

### 12. Rezeptdruck

- Responses: 38
- Domaenenfolge: Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Referenzdaten -> Kommunikation/Aufgaben -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> Abrechnung/Kasse -> User/Workspace -> ... 14 weitere
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - ... 26 weitere

### 13. Rückholansicht

- Responses: 39
- Domaenenfolge: Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> User/Workspace -> Filialen/Mandant -> Referenzdaten -> Filialen/Mandant -> Referenzdaten -> Kommunikation/Aufgaben -> Dokumente/Archiv -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> Abrechnung/Kasse -> ... 12 weitere
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - ... 27 weitere

### 14. Terminübersicht

- Responses: 38
- Domaenenfolge: Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> User/Workspace -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> Kunden/Vorgaenge -> User/Workspace -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> ... 13 weitere
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - ... 26 weitere

### 15. Tourenplanung

- Responses: 38
- Domaenenfolge: User/Workspace -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> User/Workspace -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> ... 9 weitere
- Endpunkte:
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - ... 26 weitere

### 16. Vorgangsliste

- Responses: 41
- Domaenenfolge: User/Workspace -> Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kommunikation/Aufgaben -> Dokumente/Archiv -> User/Workspace -> Kunden/Vorgaenge -> User/Workspace -> Abrechnung/Kasse -> ... 15 weitere
- Endpunkte:
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - ... 29 weitere

### 17. Vorgangsnavigator

- Responses: 36
- Domaenenfolge: User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Abrechnung/Kasse -> Referenzdaten -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> User/Workspace -> ... 8 weitere
- Endpunkte:
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - ... 24 weitere

### 18. Vorgangsnavigator (Archiv)

- Responses: 37
- Domaenenfolge: Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Referenzdaten -> Kommunikation/Aufgaben -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> Abrechnung/Kasse -> User/Workspace -> Kommunikation/Aufgaben -> ... 11 weitere
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - ... 25 weitere

### Musterkunde suchen

- Responses: 89
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - ... 77 weitere

### Musterartikel suchen und Kontext laden

- Responses: 38
- Domaenenfolge: Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: GET `/apigateway/articletenantservice/articles/[REDACTED]` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: GET `/apigateway/articletenantservice/articles/[REDACTED]` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers/search` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (400)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: GET `/apigateway/articletenantservice/articles/[REDACTED]` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers/search` (200)
  - ... 26 weitere

### Passenden Bestellvorschlag suchen

- Responses: 20
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - ... 8 weitere

### Sales-Process- und Filial-Kontext zum Musterkunden laden

- Responses: 11
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### Test-Bestellvorschlag anlegen

- Responses: 8
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals` (201)

### Bestellvorschlag per selection vorbereiten

- Responses: 8
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/to-order` (200)

### Bestellung aus Vorschlag erzeugen

- Responses: 8
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/from-proposal` (200)

### Bestellung und Positionen zuruecklesen

- Responses: 16
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]/positions` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]/positions` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]/positions` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]/positions` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]/positions` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/{uuid}` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/{uuid}/positions` (200)
  - ... 4 weitere

### Bestellung verarbeiten

- Responses: 8
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/{uuid}/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/process-order` (200)

### Vorgang zum Musterkunden auswaehlen

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### Vorgang detail laden

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### Vorgang unveraendert speichern

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: PUT `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### Vorgang zuruecklesen und No-op verifizieren

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### 1. Kunden / Artikel

- Responses: 16
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - ... 4 weitere

### 4. Detail oeffnen

- Responses: 56
- Domaenenfolge: Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Abrechnung/Kasse -> apigateway -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> apigateway -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> apigateway -> Abrechnung/Kasse -> ... 32 weitere
- Endpunkte:
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - User/Workspace: GET `/apigateway/user/users` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - ... 44 weitere

### 6. Adressdaten

- Responses: 5
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)

### 8. Detail oeffnen

- Responses: 10
- Domaenenfolge: Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)

### 20. Kundendaten

- Responses: 2
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### 14. Dokumente (Archiv)

- Responses: 1
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)

### 16. DV-Historie

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)

### 17. Hilfsmittelhistorie

- Responses: 12
- Domaenenfolge: dv-data -> Kunden/Vorgaenge -> Hilfsmittel -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kunden/Vorgaenge -> Filialen/Mandant
- Endpunkte:
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)

### 18. App-Menue

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)

### 21. Kunden / Artikel

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)

### 11. Ansprechpartner

- Responses: 8
- Domaenenfolge: Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Filialen/Mandant -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kunden/Vorgaenge
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)

### 13. Kunden / Artikel

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)

### 20. Firma Osteoporose Selbsthilfegruppe München Ost 15192 [REDACTED]-6 81737 München Nein

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)

### 24. Herr Abdullah Saglam 11058 [REDACTED] 81735 München [REDACTED] AOK Bayern [REDACTED] [REDACTED] [REDACTED] Nein

- Responses: 7
- Domaenenfolge: Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> apigateway -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - User/Workspace: GET `/apigateway/user/users` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)

### 26. Adressdaten

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)

### 28. Detail oeffnen

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge -> Referenzdaten
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)

### 30. Kostenvoranschlag Adresse Musterbereich 123 Nein 81737 Musterstadt [REDACTED]

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (200)

### 3. App-Menue

- Responses: 11
- Domaenenfolge: Dokumente/Archiv -> Kunden/Vorgaenge -> Dokumente/Archiv -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Artikel/Warenbestand -> User/Workspace -> Warenwirtschaft/Bestellung
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search/sums` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)

### 1. input

- Responses: 10
- Domaenenfolge: Dokumente/Archiv -> Filialen/Mandant -> Dokumente/Archiv -> Filialen/Mandant -> Dokumente/Archiv -> Filialen/Mandant -> Dokumente/Archiv -> Filialen/Mandant
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)

### 3. Kunden / Artikel

- Responses: 24
- Domaenenfolge: Dokumente/Archiv -> Kunden/Vorgaenge -> Dokumente/Archiv -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Filialen/Mandant -> User/Workspace -> Warenwirtschaft/Bestellung -> Dokumente/Archiv -> Kunden/Vorgaenge -> Dokumente/Archiv -> Artikel/Warenbestand -> User/Workspace -> Filialen/Mandant -> Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand -> Abrechnung/Kasse -> ... 3 weitere
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search/sums` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - ... 12 weitere

### 2. Kunden / Artikel

- Responses: 45
- Domaenenfolge: Dokumente/Archiv -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> apigateway -> Abrechnung/Kasse -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Dokumente/Archiv -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> apigateway -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Dokumente/Archiv -> Kunden/Vorgaenge -> ... 22 weitere
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - User/Workspace: GET `/apigateway/user/users` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - ... 33 weitere

### 3. Adressdaten

- Responses: 5
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)

### 6. Detail oeffnen

- Responses: 47
- Domaenenfolge: Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Kunden/Vorgaenge -> Referenzdaten -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Artikel/Warenbestand -> User/Workspace -> Artikel/Warenbestand -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> ... 20 weitere
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-proposals/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - ... 35 weitere

### 7. Ansprechpartner

- Responses: 4
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)

### 9. Arztdaten

- Responses: 4
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/arzt` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/arzt` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/arzt` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/arzt` (200)

### 10. Dokumente

- Responses: 16
- Domaenenfolge: dv-data -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Dokumente/Archiv -> Kunden/Vorgaenge -> dv-data -> Warenwirtschaft/Bestellung -> Dokumente/Archiv -> dv-data -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Dokumente/Archiv -> dv-data -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Dokumente/Archiv
- Endpunkte:
  - dv-data: GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` (200)
  - Kunden/Vorgaenge: GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (200)
  - Dokumente/Archiv: POST `/apigateway/document/stored-documents/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (200)
  - dv-data: GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` (200)
  - Dokumente/Archiv: POST `/apigateway/document/stored-documents/search` (200)
  - dv-data: GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` (200)
  - Kunden/Vorgaenge: GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (200)
  - Dokumente/Archiv: POST `/apigateway/document/stored-documents/search` (200)
  - ... 4 weitere

### 12. Dokumente (Archiv)

- Responses: 5
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)

### 14. DV-Historie

- Responses: 8
- Domaenenfolge: Kunden/Vorgaenge -> dv-data -> Kunden/Vorgaenge -> dv-data -> Kunden/Vorgaenge -> dv-data -> Kunden/Vorgaenge -> dv-data
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)

### 18. Hilfsmittelhistorie

- Responses: 21
- Domaenenfolge: Hilfsmittel -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Filialen/Mandant -> Hilfsmittel -> Abrechnung/Kasse -> Hilfsmittel -> Kunden/Vorgaenge -> Hilfsmittel -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> Abrechnung/Kasse -> Hilfsmittel -> Kunden/Vorgaenge -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> ... 2 weitere
- Endpunkte:
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/retrieval` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - ... 9 weitere

### 19. Historie

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### 20. 18582 Max Mustermann [REDACTED] AOK Bayern Nein Abholbereit [REDACTED] Christoph Schernthaner 0,00 € 0,00 € 0,00 € 0,00

- Responses: 4
- Domaenenfolge: Kunden/Vorgaenge -> Dokumente/Archiv -> Kunden/Vorgaenge -> Dokumente/Archiv
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Dokumente/Archiv: GET `/apigateway/document/stored-documents` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Dokumente/Archiv: GET `/apigateway/document/stored-documents` (200)

### 21. 18587 Max Mustermann [REDACTED] AOK Bayern Ja Warten auf (e)KV [REDACTED] Christoph Schernthaner [REDACTED],00 € 163,86

- Responses: 4
- Domaenenfolge: Dokumente/Archiv -> Kunden/Vorgaenge -> Dokumente/Archiv -> Kunden/Vorgaenge
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/document/stored-documents` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Dokumente/Archiv: GET `/apigateway/document/stored-documents` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### 23. Historie (Archiv)

- Responses: 3
- Domaenenfolge: apigateway
- Endpunkte:
  - apigateway: POST `/apigateway/sales/archived-salesprocess/search` (200)
  - apigateway: POST `/apigateway/sales/archived-salesprocess/search` (200)
  - apigateway: POST `/apigateway/sales/archived-salesprocess/search` (200)

### 24. Kostenträgerdaten

- Responses: 3
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (200)

### 26. Notizen

- Responses: 5
- Domaenenfolge: Kunden/Vorgaenge -> Kommunikation/Aufgaben -> Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)

### 2. App-Menue

- Responses: 9
- Domaenenfolge: Dokumente/Archiv -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> apigateway -> Abrechnung/Kasse -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - User/Workspace: GET `/apigateway/user/users` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)
  - Dokumente/Archiv: GET `/apigateway/file-archive/file-archive/load/files/[REDACTED]` (200)

### 25. Kundendaten

- Responses: 16
- Domaenenfolge: Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> apigateway -> Abrechnung/Kasse -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> apigateway -> Abrechnung/Kasse -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse
- Endpunkte:
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - User/Workspace: GET `/apigateway/user/users` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - ... 4 weitere

### Vorhandene Vorgangsliste merken

- Responses: 8
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### Kundendetail oeffnen

- Responses: 207
- Domaenenfolge: Abrechnung/Kasse -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> User/Workspace -> Filialen/Mandant -> Referenzdaten -> Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Dokumente/Archiv -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Dokumente/Archiv -> Kommunikation/Aufgaben -> User/Workspace -> ... 166 weitere
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/vatrates/vatrates` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/gateway-configurations/user-mail-addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces/[REDACTED]` (200)
  - User/Workspace: GET `/apigateway/user/generic-list-column-states` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/receipt-settings` (200)
  - User/Workspace: GET `/apigateway/user/users/[REDACTED]/dashboards` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/country/countries` (200)
  - Referenzdaten: GET `/apigateway/enum-service/enums` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - User/Workspace: GET `/apigateway/userservice/feature-toggles` (200)
  - ... 195 weitere

### Kunde-Historie oeffnen

- Responses: 14
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - ... 2 weitere

### Neuer Vorgang aus Kundenhistorie starten

- Responses: 111
- Domaenenfolge: Filialen/Mandant -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Abrechnung/Kasse -> Kunden/Vorgaenge -> Abrechnung/Kasse -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Filialen/Mandant -> Abrechnung/Kasse -> apigateway -> Filialen/Mandant -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> ... 68 weitere
- Endpunkte:
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/cost-centers` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/art/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]` (200)
  - ... 99 weitere

### Neuen Vorgang eindeutig ermitteln

- Responses: 9
- Domaenenfolge: Kunden/Vorgaenge -> apigateway -> Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/notes` (200)
  - apigateway: GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### Neuen Vorgangsentwurf speichern

- Responses: 17
- Domaenenfolge: Kunden/Vorgaenge -> apigateway -> Kunden/Vorgaenge -> apigateway -> Kunden/Vorgaenge -> apigateway -> Kunden/Vorgaenge -> apigateway -> Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/notes` (200)
  - apigateway: GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses` (201)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/notes` (200)
  - apigateway: GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses` (201)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kostentraeger-tenant/kostentraeger/[REDACTED]/notes` (200)
  - apigateway: GET `/apigateway/arzt-tenant/aerzte/[REDACTED]/notes` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses` (201)
  - ... 5 weitere

### Neuen Vorgang zuruecklesen

- Responses: 4
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### PDF/Mail lokal vorbereiten

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/[REDACTED]/email` (200)

### Wareneingangskandidaten suchen

- Responses: 4
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (200)

### Wareneingang Probe: orderNr leerer Suchtext

- Responses: 2
- Domaenenfolge: Warenwirtschaft/Bestellung -> Kunden/Vorgaenge
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)

### Wareneingang Probe: orderNumber leerer Suchtext

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)

### Wareneingang Probe: keywords Bestellnummer

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)

### Wareneingang Probe: nur orderNr

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)

### Wareneingang Probe: nur leerer Filter

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (500)

### Wareneingang Probe: wawiservice orderNr

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawiservice/order-arrival/search` (500)

### Wareneingang buchen

- Responses: 3
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawiservice/order-arrival/book` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/orders/[REDACTED]/positions` (200)

### 8. Adressdaten

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)

### 10. Detail oeffnen

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge -> Referenzdaten
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses/[REDACTED]` (200)
  - Referenzdaten: GET `/apigateway/navigationservice/external/countries` (200)

### 13. Ansprechpartner

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)

### 16. Arztdaten

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/arzt` (200)

### 17. Dokumente

- Responses: 3
- Domaenenfolge: dv-data -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge
- Endpunkte:
  - dv-data: GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` (200)
  - Kunden/Vorgaenge: GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (200)

### 18. Suche Dokument

- Responses: 1
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/stored-documents/search` (200)

### 19. Dokumente (Archiv)

- Responses: 1
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)

### 21. DV-Historie

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)

### 22. Hilfsmittelhistorie

- Responses: 8
- Domaenenfolge: dv-data -> Hilfsmittel -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Filialen/Mandant -> Hilfsmittel -> Abrechnung/Kasse -> Hilfsmittel
- Endpunkte:
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/retrieval` (200)

### 24. Historie

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### 25. Historie (Archiv)

- Responses: 1
- Domaenenfolge: apigateway
- Endpunkte:
  - apigateway: POST `/apigateway/sales/archived-salesprocess/search` (200)

### 26. Kostenträgerdaten

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/kostentraeger` (200)

### 27. Kundendaten

- Responses: 9
- Domaenenfolge: Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> apigateway -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - apigateway: GET `/apigateway/accounting/fibu-accounts/settings` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details/accountings` (200)
  - User/Workspace: GET `/apigateway/user/users` (200)
  - Abrechnung/Kasse: POST `/apigateway/salesprocessservice/invoices/search` (200)

### 28. Notizen

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/notes` (200)

### 8. Dokumente

- Responses: 1
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: GET `/apigateway/document/stored-documents` (200)

### 11. Artikeldaten

- Responses: 1
- Domaenenfolge: Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)

### 14. Lieferanten

- Responses: 2
- Domaenenfolge: Artikel/Warenbestand -> Warenwirtschaft/Bestellung
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/supplier/suppliers/list` (200)

### 16. Preisdaten

- Responses: 1
- Domaenenfolge: Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/price-data` (200)

### 17. Warenwirtschaft

- Responses: 2
- Domaenenfolge: Artikel/Warenbestand -> Filialen/Mandant
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/quantities` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)

### 11. saniPEP Sanitätshaus GmbH & Co. KG. HR1680770 MoliCare Pad 4 Tropfen 30 ST Paul-Hartmann-AG, Heidenheim Stück [REDACTED]

- Responses: 2
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### Testkunde eindeutig aufloesen

- Responses: 31
- Domaenenfolge: Kunden/Vorgaenge -> User/Workspace -> Hilfsmittel -> Kunden/Vorgaenge -> User/Workspace -> Kunden/Vorgaenge -> Hilfsmittel -> Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/route-plannings` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - ... 19 weitere

### Artikel: Musterartikel-Kit suchen

- Responses: 12
- Domaenenfolge: Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/article-kits/search` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/article-kits/search` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/article-kits/search` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/article-kits/search` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/article-kits/search` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/article-kits/search` (200)

### Musterartikel eindeutig aufloesen

- Responses: 54
- Domaenenfolge: Filialen/Mandant -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Artikel/Warenbestand -> ... 15 weitere
- Endpunkte:
  - Filialen/Mandant: GET `/apigateway/firma/companies/details` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/label-configurations/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers` (200)
  - ... 42 weitere

### Kasse: Bons und Kassenbuchlisten laden

- Responses: 15
- Domaenenfolge: Abrechnung/Kasse -> Filialen/Mandant -> Abrechnung/Kasse -> User/Workspace -> Abrechnung/Kasse -> Filialen/Mandant -> User/Workspace -> Abrechnung/Kasse -> Filialen/Mandant -> Abrechnung/Kasse -> User/Workspace
- Endpunkte:
  - Abrechnung/Kasse: GET `/apigateway/accounting/bons` (404)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/cash-book-entries/search` (400)
  - Abrechnung/Kasse: GET `/apigateway/accounting/cash-books` (500)
  - User/Workspace: GET `/apigateway/userservice/workspaces` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/bons` (404)
  - Abrechnung/Kasse: GET `/apigateway/accounting/cash-book-entries/search` (400)
  - Abrechnung/Kasse: GET `/apigateway/accounting/cash-books` (500)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - User/Workspace: GET `/apigateway/userservice/workspaces` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/bons` (404)
  - Abrechnung/Kasse: GET `/apigateway/accounting/cash-book-entries/search` (400)
  - ... 3 weitere

### Kunde: [REDACTED]

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/ekv/cost-estimates` (400)
  - Kunden/Vorgaenge: GET `/apigateway/ekv/cost-estimates/latest-approved` (400)

### Wawi: Wareneingang Kandidaten suchen

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/search` (200)

### Wawi: Wareneingang Position-Info laden

- Responses: 1
- Domaenenfolge: Warenwirtschaft/Bestellung
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-arrival/position-info` (400)

### Vorgang zum Testkunden laden

- Responses: 3
- Domaenenfolge: User/Workspace -> Kunden/Vorgaenge -> Hilfsmittel
- Endpunkte:
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/route-plannings` (200)

### Route: Planungen zum Vorgang laden

- Responses: 1
- Domaenenfolge: Hilfsmittel
- Endpunkte:
  - Hilfsmittel: GET `/apigateway/hilfsmittel/route-plannings` (200)

### Artikel: Stammdaten laden

- Responses: 2
- Domaenenfolge: Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]` (200)

### Artikel: Preisdaten laden

- Responses: 8
- Domaenenfolge: Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/price-data` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/price-data/alternative-selling-prices` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/article/generate-labels/[REDACTED]/articles/[REDACTED]` (404)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/price-data` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/price-data/alternative-selling-prices` (200)
  - Filialen/Mandant: GET `/apigateway/userservice/companies/details/preferences` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/article/generate-labels/[REDACTED]/articles/[REDACTED]` (404)

### Artikel: Warenwirtschaftsdaten laden

- Responses: 12
- Domaenenfolge: Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand -> Filialen/Mandant -> Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/stock-data` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/quantities` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]` (404)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/merchandise-management-setting` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/stock-data` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/quantities` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/details/[REDACTED]` (404)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/computed-order-value/{id}` (200)

### Artikel: Lieferantendaten laden

- Responses: 4
- Domaenenfolge: Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments/has-main-supplier` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]/supplier-assignments/has-main-supplier` (200)

### Artikel: Dokumente suchen

- Responses: 2
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (400)
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)

### 14. Arztdaten

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/arzt` (200)

### 15. Dokumente

- Responses: 3
- Domaenenfolge: dv-data -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge
- Endpunkte:
  - dv-data: GET `/apigateway/salesprocessservice/dv-data/customer/[REDACTED]/dv-ids` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawiservice/orders/customer/[REDACTED]/order-ids` (200)
  - Kunden/Vorgaenge: GET `/apigateway/salesprocessservice/salesprocesses/customer/[REDACTED]/vorgang-ids` (200)

### 16. Suche Dokument

- Responses: 1
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/stored-documents/search` (200)

### 17. Dokumente (Archiv)

- Responses: 1
- Domaenenfolge: Dokumente/Archiv
- Endpunkte:
  - Dokumente/Archiv: POST `/apigateway/document/archive-documents/search` (200)

### 19. DV-Historie

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)

### 20. Hilfsmittelhistorie

- Responses: 8
- Domaenenfolge: dv-data -> Kunden/Vorgaenge -> Hilfsmittel -> Filialen/Mandant -> Artikel/Warenbestand -> Hilfsmittel -> Abrechnung/Kasse -> Hilfsmittel
- Endpunkte:
  - dv-data: POST `/apigateway/sales/dv-data/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Hilfsmittel: POST `/apigateway/hilfsmittel/arten/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/traits` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/material-groups` (200)
  - Hilfsmittel: GET `/apigateway/hilfsmittel/hilfsmittel/retrieval` (200)

### 22. Historie

- Responses: 1
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)

### 5. Arzt

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)

### 6. Bearbeiter*

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)

### 7. Berater*

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)

### 8. Erfasser*

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)

### 9. Kostenträger

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)

### 11. Vermittler

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/contacts` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]` (200)

### Start

- Responses: 316
- Domaenenfolge: Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> User/Workspace -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> User/Workspace -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Artikel/Warenbestand -> User/Workspace -> Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> ... 157 weitere
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/reminder-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/order-proposals/search/sums` (200)
  - ... 304 weitere

### Vorgaenge oeffnen

- Responses: 10
- Domaenenfolge: User/Workspace -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Kommunikation/Aufgaben
- Endpunkte:
  - User/Workspace: POST `/apigateway/userservice/metrics/user-login` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### Max Mustermann suchen

- Responses: 3
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/communicatorservice/reminders/dbopt` (200)

### Vorgangsliste pruefen

- Responses: 26
- Domaenenfolge: Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> Filialen/Mandant -> Abrechnung/Kasse -> Kunden/Vorgaenge -> apigateway -> Kunden/Vorgaenge -> apigateway -> Filialen/Mandant -> User/Workspace -> Filialen/Mandant -> User/Workspace
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/communicatorservice/tasks/by-process/count` (200)
  - Kunden/Vorgaenge: GET `/apigateway/customerservice/customers/[REDACTED]` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/cost-centers` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/art/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen/[REDACTED]/institutionskennzeichen` (200)
  - ... 14 weitere

### Vorgang detail oeffnen

- Responses: 2
- Domaenenfolge: Kommunikation/Aufgaben
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)

### DV-Historie pruefen

- Responses: 195
- Domaenenfolge: Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> Kunden/Vorgaenge -> User/Workspace -> Artikel/Warenbestand -> Kunden/Vorgaenge -> Artikel/Warenbestand -> Dokumente/Archiv -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Filialen/Mandant -> Kommunikation/Aufgaben -> User/Workspace -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Kunden/Vorgaenge -> ... 118 weitere
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (500)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/delivery-terms/search` (200)
  - Abrechnung/Kasse: GET `/apigateway/accounting/payment-terms` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/[REDACTED]/addresses` (200)
  - User/Workspace: GET `/apigateway/userservice/user/preferences` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/articles/merchandise-management-setting` (200)
  - Kunden/Vorgaenge: GET `/apigateway/salesprocessservice/recommendations` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/articles/merchandise-management-setting` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/articles/merchandise-management-setting` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/articles/merchandise-management-setting` (200)
  - Artikel/Warenbestand: POST `/apigateway/article-tenant/articles/merchandise-management-setting` (200)
  - Dokumente/Archiv: GET `/apigateway/document/stored-documents` (200)
  - ... 183 weitere

### Musterkunde fuer Positionsflow pruefen

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/kunden/customers/search` (200)

### Neuen Vorgang vor Positionswrite laden

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### Musterartikel fuer Vorgangsposition suchen

- Responses: 4
- Domaenenfolge: Artikel/Warenbestand
- Endpunkte:
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: GET `/apigateway/articletenantservice/articles/[REDACTED]` (200)
  - Artikel/Warenbestand: POST `/apigateway/articletenantservice/articles/simple-search` (200)
  - Artikel/Warenbestand: GET `/apigateway/articletenantservice/articles/[REDACTED]` (200)

### Musterartikel-Position berechnen

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/pricingservice/sales-positions` (200)
  - Kunden/Vorgaenge: POST `/apigateway/pricingservice/sales-positions` (200)

### Vorgangspreise mit Musterartikel berechnen

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/calculate-prices` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/calculate-prices` (200)

### Vorgang mit Musterartikel speichern

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: PUT `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kunden/Vorgaenge: PUT `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### Vorgang mit Musterartikel zuruecklesen

- Responses: 2
- Domaenenfolge: Kunden/Vorgaenge
- Endpunkte:
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/[REDACTED]` (200)

### Testbestellung anlegen oder suchen und Ausgangsstatus lesen

- Responses: 108
- Domaenenfolge: Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung -> User/Workspace -> Artikel/Warenbestand -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> Warenwirtschaft/Bestellung -> User/Workspace -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> ... 44 weitere
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - User/Workspace: GET `/apigateway/user/users/search` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/supplier/suppliers` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/search` (200)
  - ... 96 weitere

### Bestellung verarbeiten und Bestellt-Status lesen

- Responses: 63
- Domaenenfolge: Warenwirtschaft/Bestellung -> Filialen/Mandant -> User/Workspace -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> User/Workspace -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> User/Workspace -> ... 17 weitere
- Endpunkte:
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/search` (200)
  - Warenwirtschaft/Bestellung: POST `/apigateway/wawi/orders/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)
  - User/Workspace: POST `/apigateway/userservice/metrics/user-login` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - ... 51 weitere

### Wareneingang oeffnen und offenen Status lesen

- Responses: 71
- Domaenenfolge: Kommunikation/Aufgaben -> User/Workspace -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> User/Workspace -> Kommunikation/Aufgaben -> Filialen/Mandant -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> ... 23 weitere
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - User/Workspace: POST `/apigateway/userservice/metrics/user-login` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Filialen/Mandant: GET `/apigateway/firma/companies/details` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - ... 59 weitere

### Wareneingang teilweise oder voll buchen und Status lesen

- Responses: 21
- Domaenenfolge: Kommunikation/Aufgaben -> Artikel/Warenbestand -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> Kommunikation/Aufgaben -> Warenwirtschaft/Bestellung
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/communicatorservice/reminders/dbopt` (200)
  - Artikel/Warenbestand: GET `/apigateway/article-tenant/articles/[REDACTED]` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/storage-locations` (200)
  - ... 9 weitere

### Endstatus in Bestellliste und Detail pruefen

- Responses: 69
- Domaenenfolge: Kommunikation/Aufgaben -> User/Workspace -> Filialen/Mandant -> Kommunikation/Aufgaben -> Kunden/Vorgaenge -> Filialen/Mandant -> Kunden/Vorgaenge -> Warenwirtschaft/Bestellung -> Artikel/Warenbestand -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> User/Workspace -> Filialen/Mandant -> Warenwirtschaft/Bestellung -> Abrechnung/Kasse -> Warenwirtschaft/Bestellung -> Filialen/Mandant -> User/Workspace -> ... 26 weitere
- Endpunkte:
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - User/Workspace: POST `/apigateway/userservice/metrics/user-login` (200)
  - Filialen/Mandant: GET `/apigateway/filiale/filialen` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/task/tasks/task-count` (200)
  - Kommunikation/Aufgaben: GET `/apigateway/mail/mails/unread-number` (200)
  - Kunden/Vorgaenge: POST `/apigateway/salesprocessservice/status/search` (200)
  - Filialen/Mandant: GET `/apigateway/department/departments` (200)
  - Kunden/Vorgaenge: POST `/apigateway/sales/salesprocesses/search` (200)
  - Kunden/Vorgaenge: GET `/apigateway/sales/salesprocesses/kpi-statistics` (200)
  - Warenwirtschaft/Bestellung: GET `/apigateway/wawi/order-states` (200)
  - Artikel/Warenbestand: GET `/apigateway/wawi/producers` (200)
  - ... 57 weitere

