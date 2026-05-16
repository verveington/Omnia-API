# Omnia Chat Platform Demo Design

## Ziel

Die neue Plattform ist ein separates Webprojekt fuer einen Omnia-Chatbot. Der Demo-MVP arbeitet zuerst mit Mockdaten und simulierten Omnia-Tools. Er soll zeigen, wie Benutzer per Chat Kunden, Vorgaenge und Bestellungen suchen oder vorbereiten koennen, ohne sofort produktiv gegen Omnia zu schreiben.

Die Chat-KI soll lokal betreibbar sein. Der MVP darf nicht von einer Cloud-KI abhaengen.

## Produktentscheidung

Wir starten mit Variante B: Chat mit Omnia-Kontext-Cockpit.

Die Oberflaeche besteht aus drei klaren Bereichen:

- Linke Navigation fuer Fachbereiche: Kunden, Vorgaenge, Bestellungen, Wareneingang.
- Zentrale Chatflaeche fuer natuerliche Eingaben und Rueckfragen.
- Rechte Kontextspalte fuer aktuell erkannte Kunden, Vorgaenge, Bestellungen, Validierungen und naechste Aktionen.

Diese Struktur ist bewusst kontrollierter als ein reiner Chat. Der Benutzer soll immer sehen, worauf sich der Chat gerade bezieht, bevor eine Aktion bestaetigt wird.

## MVP-Funktionen

### Chat

Der Chat versteht fuer den Demo-MVP feste Intent-Muster und soll optional ueber eine lokale Chat-KI laufen:

- Kunden suchen: "Suche Kunde Mustermann"
- Vorgang suchen: "Zeig mir Vorgang 18581"
- Bestellung suchen: "Zeig offene Bestellungen"
- Bestellvorschlaege anzeigen: "Welche Bestellvorschlaege gibt es?"
- Bestellung vorbereiten: "Erzeuge Bestellung fuer MedComplett"
- Omnia-Oeffnung simulieren: "In Omnia oeffnen"

Der Chat soll nicht behaupten, dass eine echte Omnia-Aktion ausgefuehrt wurde, solange er im Demo-Modus laeuft.

Wenn die lokale KI nicht verfuegbar ist, soll der MVP mit einem regelbasierten Intent-Parser weiter funktionieren.

### Kontext-Cockpit

Die rechte Spalte zeigt immer den aktuellen Arbeitskontext:

- ausgewaehlter Kunde
- ausgewaehlter Vorgang
- Lieferadresse
- offene Bestellvorschlaege
- Lieferantengruppe
- Validierungsstatus
- vorgeschlagene naechste Aktion

Wenn keine Entitaet aktiv ist, zeigt die Kontextspalte eine neutrale leere Arbeitsflaeche mit Einstiegsvorschlaegen.

### Aktionskarten

Schreibende Aktionen werden nie direkt aus einer Chatantwort heraus ausgefuehrt. Der Chat erzeugt stattdessen eine Aktionskarte:

- Titel der Aktion
- betroffene Entitaeten
- fachliche Zusammenfassung
- Validierungscheck
- Button "Bestaetigen"
- Button "Abbrechen"

Im Demo-MVP fuehrt "Bestaetigen" nur eine simulierte Aktion aus und schreibt einen Audit-Eintrag.

### Audit

Jede relevante Aktion erzeugt einen Audit-Eintrag:

- Zeit
- Benutzer
- Intent
- betroffene Entitaet
- Ergebnis: simuliert, blockiert oder bestaetigt

## Demo-Datenmodell

Der Demo-MVP braucht lokale Daten fuer:

- `Customer`: Kundennummer, Vorname, Nachname, Geburtsdatum optional ausgeblendet, Adresse.
- `Case`: Vorgangsnummer, Kunde, Status, Lieferadresse.
- `Proposal`: Artikelnummer, PZN, Beschreibung, Lieferant, Menge, Einheit, Bestellbereitschaft.
- `SupplierOrder`: Bestellnummer, Lieferant, Positionen, Status.
- `ChatMessage`: Rolle, Text, Zeit, optionale Toolreferenz.
- `ToolResult`: Toolname, Status, Daten oder Validierungsfehler.
- `AuditEvent`: Benutzer, Aktion, Ziel, Status, Zeit.

Gesundheits- und Versicherungsdaten werden im Demo-MVP nicht benoetigt.

## Tool-Schicht

Der Chatbot darf nicht direkt auf Daten schreiben. Er ruft serverseitige Tools auf:

- `searchCustomers(query)`
- `createCustomerDraft(input)`
- `searchCases(query)`
- `createCaseDraft(customerId, input)`
- `searchOrderProposals(query)`
- `createSupplierOrderDraft(caseId, supplierId)`
- `confirmAction(actionId)`
- `openInOmnia(entityType, entityId)`

Im Demo-MVP sind alle Tools deterministisch und mockbasiert. Spaeter koennen dieselben Toolnamen auf die echte Omnia-BFF-Schicht gemappt werden.

## Lokale KI-Schicht

Die KI-Anbindung wird provider-neutral gebaut. Der Chat-Server spricht gegen ein lokales, OpenAI-kompatibles Chat-Endpoint oder einen lokalen Adapter. Geeignete lokale Laufzeiten sind z. B. Ollama, LM Studio oder ein eigener lokaler Inferenzdienst.

Die lokale KI darf nur Vorschlaege machen:

- Intent erkennen
- Suchbegriffe extrahieren
- Entitaeten aus Benutzereingaben strukturieren
- eine naechste Aktion vorschlagen
- Rueckfragen formulieren

Die lokale KI darf keine Omnia-Aktion direkt ausfuehren. Jede Tool-Ausfuehrung laeuft ueber das Backend und wird gegen feste Schemas validiert.

### Lokales LLM-Gateway

Das BFF bekommt ein `llm-gateway` mit austauschbarer Implementierung:

- `local-openai-compatible`: sendet an eine lokale `/v1/chat/completions`-Schnittstelle.
- `rule-based`: fallback fuer Demo und Tests ohne KI-Modell.

Konfiguration:

- `CHAT_LLM_PROVIDER=rule-based|local-openai-compatible`
- `CHAT_LLM_BASE_URL=http://127.0.0.1:11434/v1` oder ein anderer lokaler Endpoint
- `CHAT_LLM_MODEL=<lokales-modell>`

Der Rest der Anwendung spricht nur mit dem Gateway und kennt den konkreten lokalen KI-Anbieter nicht.

### Strukturierte KI-Ausgabe

Die KI soll kein freies Tool-JSON ungeprueft ausfuehren. Erwartet wird ein strikt validiertes Format:

```json
{
  "intent": "search_cases",
  "confidence": 0.82,
  "arguments": {
    "query": "18581"
  },
  "requiresConfirmation": false,
  "assistantText": "Ich suche nach Vorgang 18581."
}
```

Wenn die Ausgabe ungueltig ist, nutzt der Chatbot eine Rueckfrage statt einer Aktion.

### Datenschutz

Bei lokaler KI bleiben Chatverlauf und Omnia-Kontext lokal. Fuer den spaeteren Live-Betrieb gilt:

- keine Cloud-Uebertragung von Gesundheits-, Kunden- oder Versicherungsdaten
- lokaler Modellprozess und BFF laufen im selben lokalen Netzwerk oder auf demselben Rechner
- Tool-Ergebnisse werden vor der KI-Antwort auf das notwendige Minimum reduziert
- Audit speichert Aktionen, nicht komplette sensible Prompts

## Omnia-Oeffnung

"In Omnia oeffnen" wird im Demo-MVP als Link-/Deep-Link-Platzhalter modelliert. Die UI zeigt:

- welches Objekt geoeffnet wuerde
- welche Omnia-ID oder Vorgangsnummer verwendet wird
- dass im Demo-Modus kein echtes Omnia-Fenster gesteuert wird

Spaeter kann daraus ein echter Deep-Link, Playwright-gesteuerte Navigation oder ein Electron-Bridge-Mechanismus werden.

## Sicherheitsregeln

- Alle Schreibaktionen brauchen eine sichtbare Bestaetigungskarte.
- Bestellungen werden immer pro Lieferantengruppe erzeugt.
- Fehlende PZN blockiert die Bestellung.
- Der Chat darf keine Loeschaktionen im MVP ausfuehren.
- Demo-Modus muss deutlich sichtbar bleiben.
- Benutzeraktionen werden im Audit protokolliert.

## Architektur

Das neue Projekt wird separat aufgebaut, z. B. `omnia-chat-platform/`.

Vorgeschlagene Struktur:

- `src/app/`: App-Komposition, Routing, Layout.
- `src/features/chat/`: Chatverlauf, Eingabe, Nachrichten, Aktionskarten.
- `src/features/context/`: Omnia-Kontext-Cockpit.
- `src/features/audit/`: Auditliste.
- `src/server/`: lokales BFF fuer Chat-API und Tool-Ausfuehrung.
- `src/server/tools/`: mockbasierte Omnia-Tools.
- `src/data/`: Demo-Daten.
- `src/core/`: gemeinsame Typen.

Frontend und BFF laufen fuer den Demo-MVP lokal. Das BFF bleibt die einzige Stelle, die spaeter echte Omnia-Zugriffe bekommen darf.

## UX-Grundsaetze

- Kein Marketing-/Landingpage-Start, sondern sofort Arbeitsoberflaeche.
- Chat ist zentral, aber nicht blind: Kontext und Aktionskarten sind gleichwertig.
- Schreibaktionen muessen visuell von Such-/Leseantworten unterscheidbar sein.
- Fehler muessen fachlich formuliert werden, z. B. "PZN fehlt fuer ART-30003".
- Der Benutzer soll aus Chatantworten direkt zu Suchergebnissen, Vorschlaegen und Entitaeten springen koennen.

## Demo-Flows

### Flow 1: Kunde suchen

1. Benutzer schreibt: "Suche Kunde Mustermann".
2. Chat ruft `searchCustomers`.
3. Treffer erscheinen im Chat und in der Kontextspalte.
4. Benutzer waehlt einen Treffer.
5. Kontextspalte zeigt Kundendaten und naechste Aktionen.

### Flow 2: Vorgang suchen

1. Benutzer schreibt: "Zeig mir Vorgang 18581".
2. Chat ruft `searchCases`.
3. Kontextspalte zeigt Vorgang, Kunde und Lieferadresse.
4. Chat bietet Aktionen an: Bestellvorschlaege anzeigen, in Omnia oeffnen.

### Flow 3: Bestellung vorbereiten

1. Benutzer schreibt: "Erzeuge Bestellung fuer MedComplett".
2. Chat prueft den aktiven Vorgang und Lieferanten.
3. Tool `createSupplierOrderDraft` prueft PZN, Artikelnummer, Menge, Einheit und Lieferant.
4. Bei Erfolg zeigt der Chat eine Bestaetigungskarte.
5. Nach Bestaetigung erzeugt Demo-Tool eine simulierte Bestellnummer.
6. Kontextspalte zeigt die Bestellung.

### Flow 4: Blockierte Bestellung

1. Benutzer will eine Bestellung mit fehlender PZN erzeugen.
2. Tool blockiert die Aktion.
3. Chat erklaert den Fehler.
4. Kontextspalte zeigt den blockierten Artikel.

## Nicht im MVP

- echte Omnia-Schreibzugriffe
- Cloud-LLM-Pflicht
- echte Benutzerverwaltung
- echter E-Mail-Versand
- Wareneingang buchen
- Loeschen von Omnia-Daten
- Versicherungs- oder Abrechnungsprozesse

## Erfolgskriterien

- Benutzer kann per Chat Kunden und Vorgaenge in Demo-Daten suchen.
- Kontextspalte aktualisiert sich passend zum Chat.
- Chat laeuft ohne Cloud-KI ueber regelbasierten Parser oder lokale KI-Konfiguration.
- Eine Bestellung kann aus einer bestellbereiten Lieferantengruppe simuliert erzeugt werden.
- Eine Bestellung mit fehlender PZN wird blockiert.
- Jede bestaetigte oder blockierte Aktion erscheint im Audit.
- Die Plattform ist getrennt von `companion-app`, kann aber spaeter die gleiche Omnia-BFF-Logik uebernehmen.

## Offene Entscheidungen vor Implementierung

- Projektname: vorgeschlagen `omnia-chat-platform`.
- Lokale KI-Laufzeit fuer die erste echte KI-Anbindung: Ollama, LM Studio oder anderer OpenAI-kompatibler lokaler Dienst.
- Soll die UI zuerst Desktop-only sein oder sofort mobil nutzbar?
