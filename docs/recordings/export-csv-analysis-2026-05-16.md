# CSV-Exportanalyse 2026-05-16

## Quellen

- `/Users/christophschernthaner/Downloads/Vorgangsliste.csv`
- `/Users/christophschernthaner/Downloads/Bestellvorschläge.csv`
- `/Users/christophschernthaner/Downloads/Kunden.csv`
- `/Users/christophschernthaner/Downloads/Mustermann.csv`
- `/Users/christophschernthaner/Downloads/Vorgang 13457.csv`
- `/Users/christophschernthaner/Downloads/Material 13457.csv`

Die Listenexporte sind UTF-8 mit BOM, Semikolon-getrennt und verwenden CRLF-Zeilenenden. Die Detail-Exports `Vorgang 13457.csv` und `Material 13457.csv` sind komma-getrennt und enthalten fuehrende/trailing technische Leerspalten.

## Struktur

| Datei | Datenzeilen | Spalten | Auffaelligkeiten |
| --- | ---: | ---: | --- |
| `Vorgangsliste.csv` | 8291 | 75 | sehr breiter Vorgangsexport mit Kunden-, Kostentraeger-, Positions-, Preis-, KV- und Faktura-Feldern |
| `Bestellvorschläge.csv` | 2 | 24 | hat eine fuehrende und eine trailing Leerspalte; keine PZN-Spalte; Lieferant kann leer sein |
| `Kunden.csv` | 6164 | 19 | Stammdatenexport mit vielen personenbezogenen Feldern; fuer Lieferantenexport nicht geeignet |
| `Mustermann.csv` | 42 | 29 | kundenbezogene Vorgangshistorie; enthaelt Vorgangsnummern und Status-/Summenfelder |
| `Vorgang 13457.csv` | 18 | 32 | Positionsdetail zum Vorgang; PZN- und Artikelnummer-Spalten vorhanden, aber in diesem Beispiel leer |
| `Material 13457.csv` | 1 | 19 | Material-/Bestellzeile mit Artikelnummer, Bestellnummer, Groesse, Farbe, Seite und Verfuegbarkeit |

## Relevante Spalten

### Bestellvorschlaege

- `Filiale`
- `Artikel-Nr.`
- `Bezeichnung`
- `Größe`
- `Farbe`
- `Seite`
- `Hersteller`
- `Lieferant`
- `Einheit`
- `Bestellmenge`
- `Bestellwert`
- `Lagerbestand`
- `Gesamtlagerbestand`
- `Mindestmenge`
- `Maximalmenge`
- `Bestellung bis`
- `Bestellt am`
- `Vorgangs-Nr.`
- `Kunde`
- `Bemerkung`
- `Erfasser`
- `Art`

Nicht enthalten:

- PZN
- Omnia-UUIDs (`salesProcessId`, `articleId`, `supplierId`)
- Lieferadresse
- strukturierte Kundendaten

### Vorgangsliste

Die Vorgangsliste enthaelt unter anderem:

- `Vorgangs-Nr.`
- `Status`
- `Filiale`
- `Bereich`
- `Art`
- `Beschreibung`
- `Kunden-Nr.`
- `Kunde`
- `Adresse`
- `Versicherten-Nr.`
- `Geburtsdatum`
- `Kostenträger`
- `Vorgangsdatum`
- `Lieferdatum geplant`
- `Lieferdatum`
- `Lieferadresse`
- `DV-Nr.`
- `Artikel-Nr.`
- `HMV-Nr.`
- `Warengruppe`
- `Bezeichnung`
- `Material Artikel Nr`
- `Material Bestell Nr`
- `Material Bezeichnung`
- `Hersteller`
- `KV-Status`
- `Versorgungsstatus`

Fuer die Companion-App ist diese Datei als Referenz fuer Vorgangs-/Positionsspalten hilfreich, aber wegen personenbezogener und Versicherungsdaten nicht als Lieferantenexport-Basis geeignet.

### Kunden

Der Kundenexport enthaelt:

- Name, Adresse, Geburtsdatum
- Krankenkasse
- Versichertennummer
- Telefon, Mobiltelefon, E-Mail
- FiBu-Konto und DSGVO-Status

Diese Datei ist fuer Datenschutzregeln wichtig: Sie zeigt genau die Felder, die in Lieferantenexporten nicht landen duerfen.

## Detailbeispiel Vorgang 13457

Mit den Zusatzdateien ist ein konsistenteres Beispiel fuer Vorgang `13457` vorhanden:

- `Bestellvorschläge.csv` enthaelt fuer `13457` eine Bestellvorschlagszeile.
- `Mustermann.csv` enthaelt denselben Vorgang als Vorgangshistorienzeile.
- `Material 13457.csv` enthaelt dieselbe Materialposition mit derselben Artikelnummer.
- `Vorgang 13457.csv` enthaelt 18 Positionszeilen zum Vorgang, aber in diesem Export sind `Artikel-Nr.` und `PZN` in allen 18 Zeilen leer.

Relevante nicht-personenbezogene Felder aus dem konsistenten Beispiel:

| Quelle | Feld | Wert/Eigenschaft |
| --- | --- | --- |
| `Bestellvorschläge.csv` | `Vorgangs-Nr.` | `13457` |
| `Bestellvorschläge.csv` | `Artikel-Nr.` | vorhanden |
| `Bestellvorschläge.csv` | `Lieferant` | vorhanden |
| `Bestellvorschläge.csv` | `Bestellmenge` / `Einheit` | vorhanden |
| `Bestellvorschläge.csv` | `Bestellwert` | vorhanden |
| `Material 13457.csv` | `Artikel-Nr.` / `Bestellnummer` | vorhanden |
| `Material 13457.csv` | `Größe`, `Farbe`, `Seite` | vorhanden |
| `Material 13457.csv` | `Verfügbar` | vorhanden |
| `Vorgang 13457.csv` | `HMV-Nr. / Leistungsart` | in 10 von 18 Positionszeilen vorhanden |
| `Vorgang 13457.csv` | `PZN` | leer |

Fachlich heisst das: Fuer die Bestellplattform ist `Bestellvorschläge.csv` beziehungsweise live `order-proposals/search` die beste Quelle fuer den Lieferanten- und Bestellkontext. Die Vorgangsdetails ergaenzen den internen Kontext, liefern aber nicht zwingend die bestellrelevante Artikelnummer/PZN.

## Abgleich Bestellvorschlag zu Vorgangsliste

Die Nummern aus `Bestellvorschläge.csv` wurden in der breiten `Vorgangsliste.csv` nicht gefunden. `Vorgang 13457` ist aber in der kundenbezogenen Datei `Mustermann.csv` enthalten. Damit sind die CSVs als Exportmuster hilfreich, aber keine gemeinsame, vollstaendige Datenbankkopie.

Folge: Fuer die Live-Companion-App sollte der Join nicht ueber CSV-Exporte gebaut werden. Stattdessen muss der BFF direkt gegen Omnia lesen:

- `POST /apigateway/wawi/order-proposals/search`
- `POST /apigateway/wawi/order-proposals/search/sums`
- `GET /apigateway/sales/salesprocesses/{uuid}`
- `GET /apigateway/kunden/customers/{uuid}`
- `GET /apigateway/kunden/customers/{uuid}/addresses`
- `GET /apigateway/supplier/suppliers` oder `GET /apigateway/supplier/suppliers/{uuid}` falls verfuegbar
- Artikel-Detail-Endpunkt fuer PZN-Anreicherung, weil PZN im Bestellvorschlaege-CSV fehlt

## Auswirkungen auf das Companion-Datenmodell

Das bestehende Modell bleibt richtig, braucht aber fuer Live-Daten klare Fallbacks:

- `articleNumber`: direkt aus `Artikel-Nr.` bzw. `articleNumber`
- `pzn`: nicht aus CSV ableitbar; muss per Artikel-Detail angereichert oder leer angezeigt werden
- `description`: aus `Bezeichnung` bzw. `articleDescription`
- `supplier`: im CSV optional/leer; per `supplierId` aus der API oder ueber Artikellieferant anreichern
- `quantity`: aus `Bestellmenge` bzw. `orderQuantity`
- `unit`: aus `Einheit` bzw. `orderQuantityUnit`
- `value`: aus `Bestellwert` bzw. `orderValue`
- `caseNumber`: aus `Vorgangs-Nr.` bzw. `salesProcessNumber`
- `materialOrderNumber`: aus `Bestellnummer`, sofern Materialdetail vorhanden
- `size` / `color` / `side`: aus Bestellvorschlag oder Materialdetail
- `stockAvailable`: aus `Verfügbar` beziehungsweise API-Bestandsdaten
- `commission`: fuer Lieferantenexport weiterhin nur Nachname aus Kundendaten

## Exportregeln fuer V1

- Lieferantenexporte duerfen nicht auf `Kunden.csv`-Breite basieren.
- Lieferantenexport bekommt nur:
  - Kommission, nur Nachname
  - Vorgangsnummer
  - Artikelnummer
  - PZN, falls angereichert
  - Beschreibung
  - Menge
  - Einheit
  - optional Wert
- Vorgangsexport darf Kunden- und Lieferadressdaten enthalten, weil er im internen Vorgangskontext bleibt.

## Technische Empfehlung

Die CSVs bestaetigen den aktuellen BFF-Ansatz:

1. Live-Daten ueber API lesen, nicht ueber Omnia-CSV-Export importieren.
2. BFF normalisiert in ein stabiles Procurement-Aggregat.
3. BFF erzeugt CSV/XLSX/PDF selbst.
4. Fehlende Felder wie PZN und Lieferant werden serverseitig angereichert oder transparent als leer/unknown markiert.
