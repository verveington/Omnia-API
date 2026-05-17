# Omnia Internal Orchestrator MVP Design

## Ziel

Der Omnia Internal Orchestrator ist die naechste Ausbaustufe der bestehenden Companion-App. Er ermoeglicht internen Mitarbeitern, Omnia-Workflows per Chat und spaeter per Sprache zu steuern, ohne dass Chat, Sprachmodell oder Frontend direkt gegen Omnia schreiben.

Der MVP ist bewusst intern. Ein Kundenportal wird spaeter auf denselben Workflow-APIs aufgebaut, bekommt aber eigene Authentifizierung, eigene Rechte und zunaechst nur Draft-/Upload-/Statusfunktionen.

## Ausgangslage

Im Repository existieren bereits drei verwertbare Bausteine:

- `companion-app`: Web-App mit BFF, Session-Store, Omnia-Client, Workflow-Service, Procurement-Service und Export-Service.
- `playwright-recorder`: Native-CDP-/Voice-Server, gelernter Befehlskatalog und Parser fuer Omnia-UI-Befehle.
- Chat-/Companion-Specs: vorhandene Design- und Planungsdokumente fuer Chat, lokale KI, BFF und Procurement-Flows.

Der Orchestrator erweitert deshalb die `companion-app` statt ein neues Produkt daneben zu starten. Der Playwright-Recorder bleibt als UI-Automation-Adapter fuer Funktionen, die noch nicht stabil ueber eine Omnia-API abbildbar sind.

## Produktentscheidung

Wir bauen Variante A: interner Orchestrator als sichere Workflow-Schicht.

Der Mitarbeiter arbeitet in einer Companion-Oberflaeche mit:

- linker Modulnavigation fuer Vorgang, Bestellung, Wareneingang, Aufgaben und Integrationen,
- zentralem Chat-/Voice-Arbeitsbereich,
- rechter Kontextspalte fuer aktuellen Kunden, Vorgang, Bestellung, Validierungen, offene Rueckfragen und naechste Aktionen,
- Audit-Stream fuer ausgefuehrte, blockierte und bestaetigte Aktionen.

Der Chat ist kein freier Agent mit direktem Omnia-Zugriff. Er erzeugt nur strukturierte Absichten, die das Backend validiert und in registrierte Tools uebersetzt.

## MVP-Scope

### Interne Chat-Steuerung

Der MVP unterstuetzt zuerst Text-Chat. Sprache wird danach ueber dieselben Backend-Endpunkte angeschlossen.

Unterstuetzte interne Beispielbefehle:

- "Suche Kunde Mueller"
- "Zeig Vorgang 18581"
- "Fasse den aktuellen Vorgang zusammen"
- "Bereite Bestellung fuer Lieferant MedComplett vor"
- "Erstelle eine Nextcloud-Aufgabe fuer Rueckruf morgen"
- "Lege einen Nextcloud-Termin fuer die Anprobe an"
- "Oeffne das in Omnia"
- "Starte gelernte Omnia-Aktion Dokumente anzeigen"

Der Chat muss klar unterscheiden, ob eine Aktion gelesen, vorbereitet, bestaetigt, ausgefuehrt, blockiert oder nur in Omnia geoeffnet wurde.

### Voice Layer

Sprache besteht aus drei getrennten Adaptern:

- Speech-to-Text: wandelt Sprache in Text um.
- Chat/Intent: verarbeitet den Text wie eine normale Chateingabe.
- Text-to-Speech: liest die Backend-Antwort oder Rueckfrage vor.

Fuer den MVP reicht Browser-Speech als Demo-Adapter, wenn lokal verfuegbar. Fuer den produktiven Betrieb wird eine lokale oder kontrolliert betriebene STT/TTS-Loesung bevorzugt, weil Kunden-, Gesundheits- und Versicherungsdaten verarbeitet werden koennen.

### Tool Registry

Alle ausfuehrbaren Aktionen werden serverseitig als Tools registriert.

Jedes Tool definiert:

- stabilen Namen,
- Beschreibung fuer Chat/LLM,
- Eingabeschema,
- Ausgabeschema,
- Aktionstyp: read, draft, write, external, ui-automation,
- erforderliche Rolle,
- ob Bestaetigung erforderlich ist,
- Audit-Kategorie,
- Adapter: Omnia API, Omnia UI, Nextcloud, Supplier, Mock.

Beispiele:

- `omnia.searchCustomers`
- `omnia.searchCases`
- `omnia.getCaseSummary`
- `omnia.prepareSupplierOrder`
- `omnia.openEntity`
- `nextcloud.createTask`
- `nextcloud.createCalendarEvent`
- `supplier.exportOrderPackage`
- `ui.executeLearnedCommand`

Das Frontend darf Tools nicht frei aufrufen. Es sendet Benutzerabsichten an das BFF, das daraus erlaubte Tool-Ausfuehrungen erzeugt.

### Action Cards

Schreibende oder externe Aktionen werden nie sofort durch eine Chatantwort ausgefuehrt. Das Backend erzeugt eine Action Card mit:

- Titel,
- Aktionstyp,
- betroffenen Entitaeten,
- fachlicher Zusammenfassung,
- Validierungsergebnis,
- Risiken oder fehlenden Pflichtdaten,
- Button "Bestaetigen",
- Button "Abbrechen".

Beispiele fuer bestaetigungspflichtige Aktionen:

- Bestellung erzeugen oder an Lieferanten uebergeben,
- Nextcloud-Termin erstellen,
- Nextcloud-Aufgabe erstellen,
- UI-Automation mit schreibendem Effekt ausfuehren,
- spaeter: Vorgang in Omnia anlegen oder speichern.

Lesende Aktionen wie Suchen, Zusammenfassungen und Statusabfragen duerfen ohne Bestaetigung laufen.

### Audit

Jede relevante Aktion erzeugt ein Audit-Event:

- Zeit,
- interner Benutzer,
- Session,
- Intent,
- Toolname,
- Aktionstyp,
- Zielobjekte,
- Status: suggested, confirmed, executed, blocked, failed, cancelled,
- technische Korrelations-ID,
- gekuerzte Fehlermeldung oder Ergebniszusammenfassung.

Das Audit speichert keine kompletten sensiblen Prompts, keine vollstaendigen Patientenakten und keine Dokumentinhalte.

## Architektur

### Frontend

Die bestehende Companion-App bekommt ein Orchestrator-Modul.

Vorgeschlagene Struktur:

- `src/features/orchestrator/`: Chat, Voice Controls, Action Cards, Kontextspalte.
- `src/features/audit/`: Audit-Anzeige, sofern noch nicht zentral vorhanden.
- `src/api/client.ts`: neue BFF-Endpunkte fuer Orchestrator-Chat, Actions und Integrationen.
- `src/core/types.ts`: gemeinsame Typen fuer ToolResult, ActionCard, AuditEvent und IntegrationStatus.

Die Oberflaeche bleibt ein Arbeitswerkzeug, keine Landingpage. Sie priorisiert schnelle Bedienung, klare Zustaende, sichtbare Validierung und geringe Ablenkung.

### BFF

Das BFF bleibt die einzige Stelle fuer Auth, Sessions, Tool-Auswahl, Validierung, Integrationen und Omnia-Zugriffe.

Neue serverseitige Module:

- `server/lib/orchestrator-service.mjs`: verarbeitet Chat-Nachrichten, Kontext und Action Cards.
- `server/lib/tool-registry.mjs`: registriert und validiert Tools.
- `server/lib/action-store.mjs`: verwaltet pending/confirmed/cancelled Actions.
- `server/lib/llm-gateway.mjs`: provider-neutraler Intent-/Antwort-Adapter.
- `server/lib/voice-adapters.mjs`: optionale STT-/TTS-Konfiguration, wenn serverseitig genutzt.
- `server/lib/nextcloud-client.mjs`: WebDAV-/CalDAV-/Deck-Adapter.
- `server/lib/supplier-connectors.mjs`: Export- und spaetere Lieferantenadapter.
- `server/lib/ui-automation-client.mjs`: Adapter zum Playwright Voice/CDP Server.

Neue BFF-Endpunkte:

- `POST /api/orchestrator/chat`
- `GET /api/orchestrator/context`
- `GET /api/orchestrator/tools`
- `POST /api/orchestrator/actions/{actionId}/confirm`
- `POST /api/orchestrator/actions/{actionId}/cancel`
- `GET /api/orchestrator/audit`
- `GET /api/integrations/status`

### LLM- und Intent-Schicht

Der Orchestrator nutzt ein provider-neutrales Gateway:

- `rule-based`: deterministischer Parser fuer Tests und Offline-Betrieb.
- `local-openai-compatible`: lokale oder selbst betriebene Chat-Completions-Schnittstelle.

Die KI darf nur strukturierte Vorschlaege liefern:

```json
{
  "intent": "nextcloud.createTask",
  "confidence": 0.83,
  "arguments": {
    "title": "Rueckruf Kunde Mueller",
    "due": "2026-05-18",
    "caseNumber": "18581"
  },
  "requiresConfirmation": true,
  "assistantText": "Ich bereite eine Aufgabe fuer den Rueckruf vor."
}
```

Das Backend validiert den Vorschlag gegen Tool-Schemas. Ungueltige oder unsichere Vorschlaege erzeugen eine Rueckfrage statt einer Aktion.

### Omnia API Adapter

Der vorhandene `omnia-client` bleibt die technische Basis fuer echte API-Calls. Fachliche Workflows laufen ueber Services wie Workflow, Procurement und neue Orchestrator-Tools.

Prioritaet:

1. echte Omnia-API verwenden,
2. vorhandene Companion-Workflow-Fassade verwenden,
3. UI-Automation nur fuer Luecken oder "in Omnia oeffnen".

### Omnia UI Automation Adapter

Der Playwright Voice/CDP Server wird nicht direkt vom Chat neu implementiert. Stattdessen bekommt der Orchestrator einen schmalen Client, der Befehle an den bestehenden Voice-Server sendet oder spaeter dieselbe Command-Engine als Library nutzt.

Regeln:

- UI-Automation ist als `ui-automation` Tooltyp markiert.
- Schreibende UI-Automation braucht Bestaetigung.
- Gelernte Befehle muessen im Katalog sichtbar sein.
- Nicht eindeutig aufgeloeste Befehle werden blockiert und fragen nach.
- UI-Automation darf sensible Eingaben nicht dauerhaft im Katalog speichern.

### Nextcloud Adapter

Nextcloud ist die erste echte Drittanbieterintegration.

MVP-Funktionen:

- Verbindungstest und Statusanzeige.
- Aufgabe erstellen.
- Kalendertermin erstellen.
- optional Dokumentordner pro Vorgang anlegen.
- optional Dokumente aus Companion-Exports in Nextcloud ablegen.

Technische Basis:

- WebDAV fuer Dateien unter `/remote.php/dav`.
- CalDAV fuer Kalender und Aufgaben.
- optional Deck REST API fuer Board-/Karten-Workflows.

Credentials werden nicht im Frontend gehalten. Fuer lokale Nutzung reicht zunaechst eine Serverkonfiguration mit App-Passwort. Spaeter kann pro Mitarbeiter ein eigener Nextcloud-Account angebunden werden.

### Supplier Adapter

HARTMANN Supply und andere Bestellplattformen werden als Supplier Connectors modelliert.

MVP:

- standardisiertes Exportpaket pro Lieferant erzeugen,
- CSV/XLSX/PDF aus vorhandenen Procurement-Daten,
- Lieferant, PZN, Artikelnummer, Menge, Einheit, Kunde/Vorgang soweit fachlich noetig,
- keine automatische Portaluebergabe ohne bestaetigte Schnittstelle.

Spaeter:

- HARTMANN API, OCI, EDI oder Portal-Upload, wenn verfuegbar und vertraglich geklaert,
- weitere Plattformen ueber dieselbe Connector-Schnittstelle.

## Datenmodell

Neue zentrale Typen:

- `ConversationSession`: Benutzer, aktive Entitaeten, Nachrichten, Kontext.
- `OrchestratorMessage`: Rolle, Text, Zeit, optionale Toolreferenz.
- `ToolDefinition`: Name, Schema, Rechte, Adapter, Bestaetigungsregel.
- `ToolInvocation`: Toolname, Arguments, Status, Ergebnis, Fehler.
- `ActionCard`: pending Action mit Summary, Validation, Target, Confirm/Cancel.
- `AuditEvent`: technische und fachliche Protokollierung.
- `IntegrationConnection`: Anbieter, Status, Konfiguration, letzter Check.
- `ExternalReference`: Link auf Nextcloud-Datei, Kalendertermin, Aufgabe oder Lieferantenexport.

Dauerhaft gespeichert werden nur:

- technische Session-Metadaten,
- Action- und Audit-Eintraege,
- Integrationskonfiguration,
- externe Referenzen,
- gekuerzte Ergebniszusammenfassungen.

Nicht dauerhaft gespeichert werden:

- komplette Patientenakten,
- komplette Chatverlaeufe mit sensiblen Daten, sofern nicht explizit erforderlich,
- Versicherungsnummern in Audit-Freitexten,
- Dokumentinhalte ausserhalb expliziter Export-/Nextcloud-Flows.

## Sicherheitsregeln

- Alle BFF-Endpunkte erfordern eine interne Companion-Session.
- Alle Tools pruefen Rolle und Aktionstyp serverseitig.
- Schreibende Aktionen brauchen Action Card und Bestaetigung.
- Cloud-KI ist fuer produktive personenbezogene Daten nicht Standard.
- Tool-Ergebnisse werden vor LLM-Antworten minimiert.
- Audit speichert Aktionen und IDs, nicht komplette sensible Inhalte.
- UI-Automation ist Fallback, nicht Primaerpfad.
- Kundenportal-Accounts duerfen spaeter nie interne Tools direkt aufrufen.

## Kundenportal-Vorbereitung

Das Kundenportal ist nicht Teil des MVP, beeinflusst aber die Schnittgrenzen.

Spaeterer Portal-Layer:

- eigene Authentifizierung,
- eigene Rollen: Kunde, Bevollmaechtigter, interner Bearbeiter,
- Case Drafts statt direkter Omnia-Vorgaenge,
- Dokumentupload,
- Status- und Rueckfragenansicht,
- interne Pruefung vor Uebernahme nach Omnia.

Dafuer muessen Orchestrator-Tools schon jetzt zwischen internen Aktionen und externen Draft-Aktionen unterscheiden.

## Demo- und Teststrategie

Der MVP muss ohne echte KI und ohne echte Drittanbieter laufen:

- rule-based Intent Parser fuer reproduzierbare Tests,
- Mock-Nextcloud fuer Unit-Tests,
- Mock-Supplier-Connector fuer Exporttests,
- Mock-UI-Automation fuer Command-Tests,
- echte Integration nur ueber explizite lokale Konfiguration.

Wichtige Tests:

- Chat-Intent erzeugt korrektes Tool.
- Ungueltige Toolargumente werden blockiert.
- Schreibende Aktion erzeugt Action Card statt Direktausfuehrung.
- Confirm fuehrt genau die gespeicherte Action aus.
- Audit wird bei Erfolg, Blockade und Fehler geschrieben.
- Nextcloud-Aufgabe und Termin werden gegen Adaptervertrag getestet.
- UI-Automation wird nur ueber registrierte Commands ausgefuehrt.

## Nicht-Ziele MVP

- Kundenportal.
- Direkte Omnia-Schreibaktionen ohne Bestaetigung.
- Vollstaendige Omnia-Ersetzung.
- Vollautomatische HARTMANN-Portalsteuerung ohne geklaerte Schnittstelle.
- Cloud-LLM-Pflicht.
- Vollstaendige Rollenverwaltung unabhaengig von Companion/Omnia.
- Dauerhafte Spiegelung kompletter Patienten-, Vorgangs- oder Dokumentdaten.

## Erfolgskriterien

- Interner Mitarbeiter kann per Chat Kunden und Vorgaenge suchen.
- Aktiver Kontext wird sichtbar und fuer Folgeaktionen genutzt.
- Chat kann eine Aktion vorbereiten, aber nicht unbestaetigt schreiben.
- Nextcloud-Aufgabe oder Termin kann nach Bestaetigung erzeugt werden.
- Procurement-Export oder Bestellvorbereitung laeuft ueber registrierte Tools.
- Omnia-Oeffnung oder gelernte UI-Aktion kann kontrolliert gestartet werden.
- Jede relevante Aktion erscheint im Audit.
- Die Architektur laesst spaeter ein Kundenportal auf Draft-Workflows aufsetzen.

## Offene Entscheidungen vor Implementierung

- Welche Nextcloud-Variante zuerst: nur Tasks/Kalender oder zusaetzlich Dateien/Deck?
- Soll STT/TTS im ersten MVP schon produktiv oder nur Demo sein?
- Werden LLM/Intent lokal ueber Ollama, LM Studio oder einen anderen OpenAI-kompatiblen Dienst betrieben?
- Soll der Playwright Voice Server als separater Prozess bleiben oder als Library in den Orchestrator integriert werden?
- Welche internen Rollen reichen fuer MVP: Mitarbeiter und Admin oder feinere Rechte?
