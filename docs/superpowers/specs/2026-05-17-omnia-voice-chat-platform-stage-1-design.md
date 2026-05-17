# Omnia Voice Chat Platform Stage 1 Design

## Ziel

Die bestehende Omnia Voice-Control-Oberflaeche im `playwright-recorder` wird zu einer Chatplattform umgebaut. Der Benutzer soll Omnia wie mit einem lokalen Sprachassistenten steuern koennen: per Text, per Sprache und spaeter ueber gelernte API-Rezepte.

Stufe 1 bleibt lokal, kostenlos und provider-neutral. Das lokale Modell laeuft ueber Ollama oder einen kompatiblen lokalen `/v1/chat/completions`-Endpoint. In der aktuellen Umgebung ist `qwen2.5:7b` ueber Ollama konfiguriert.

## Produktentscheidung

Wir bauen Variante A: Chat zuerst.

Die Startseite ist keine Button-Konsole mehr, sondern eine Assistenten-Chatflaeche. Der Chatverlauf ist die Hauptoberflaeche. Befehle, Rueckfragen, blockierte Aktionen, Ausfuehrungen, Lernereignisse und Systemstatus erscheinen als Nachrichten oder Aktionskarten.

Die bestehende Voice-Control-Mechanik bleibt erhalten, wird aber in die Chatlogik integriert:

- Textnachrichten laufen ueber `/api/conversation`.
- Spracheingabe erzeugt dieselbe Art von User-Nachricht wie getippter Text.
- direkte, bestaetigte Ausfuehrungen laufen ueber den bestehenden `/api/command`-Endpoint.
- Lernmodus und Auto-Explorer bleiben vorhanden, erscheinen aber als Werkzeuge im Chat.

## Stufe-1-Scope

### Enthalten

- Chat-first UI im bestehenden Voice-Panel.
- lokaler Sitzungsverlauf im Browser, ohne dauerhafte Chat-Speicherung.
- Text- und Spracheingabe als gleichwertige Eingabewege.
- sichere Navigation und Ansichtswechsel direkt ausfuehren.
- riskante Aktionen zuerst blockieren und erklaeren.
- Button "Trotzdem ausfuehren" fuer blockierte Aktionen.
- gelernte Befehle kompakt in einem aufklappbaren Bereich anzeigen.
- waehlbarer Omnia-Modus: lokale App starten, an laufende App anhaengen, ohne lokale App starten.
- Lernkatalog so erweitern, dass UI-Befehle spaeter API-Rezepte bekommen koennen.
- API-Verkehr mitschreiben und mit UI-Aktionen korrelieren, wenn lokale Omnia-App verbunden ist.

### Nicht enthalten

- dauerhafte Speicherung vollstaendiger Chatverlaeufe.
- automatische Omnia-API-Schreibaktionen.
- Cloud-LLM-Pflicht.
- Multi-User-Chat, Benutzerverwaltung oder Chatraeume.
- produktive API-Rezeptausfuehrung fuer schreibende Aktionen.

## Chat-Erlebnis

Die Seite besteht aus:

- Kopfzeile mit Omnia-Verbindungsstatus, Modellstatus, Sprachstatus und Modusauswahl.
- Chatverlauf mit Rollen: Benutzer, Assistent, System, Aktion.
- Eingabezeile mit Textfeld, Senden-Button und Mikrofon-Button.
- kompakter Drawer fuer gelernte Befehle und Lernwerkzeuge.

Nachrichtenarten:

- normale Benutzerfrage oder Benutzerbefehl.
- Assistentenantwort ohne Aktion.
- erkannter sicherer Befehl mit Ausfuehrungsergebnis.
- blockierte Aktionskarte mit Bestaetigungsbutton.
- Lernereignis, z. B. "5 neue Befehle gelernt".
- Fehlerkarte, wenn Omnia, CDP, Ollama oder die lokale KI nicht erreichbar ist.

Der Chat soll immer klar sagen, ob etwas ausgefuehrt, nur erkannt, blockiert, vorbereitet oder nicht verstanden wurde.

## Sicherheitsmodell

Stufe 1 fuehrt nur sichere Navigations- und Ansichtsaktionen direkt aus.

Riskante Aktionen werden als blockierte Aktionskarte angezeigt:

- Tippen und Formularfuellung.
- Speichern.
- Loeschen oder Entfernen.
- OK, Weiter, Ja und aehnliche Abschlussaktionen.
- Beenden.
- sensible Eingaben wie Passwort oder Mandantennummer.

Jede blockierte Karte enthaelt:

- kurze Begruendung.
- exakt erkannter Befehl.
- Button "Trotzdem ausfuehren".

Der Bestaetigungsbutton ruft nicht erneut die KI auf. Er fuehrt genau den bereits erkannten Befehl ueber `/api/command` aus. Damit ist die Ausfuehrung reproduzierbar und nicht von einer zweiten Modellantwort abhaengig.

## Omnia-Modi

Die Chatplattform soll nicht immer automatisch lokale Omnia starten. Der Benutzer waehlt im Kopfbereich oder beim Start einen Modus:

- **Lokale Omnia-App starten**: startet Omnia in der Windows-VM mit CDP-Port und verbindet Playwright.
- **An laufende Omnia-App anhaengen**: nutzt eine bereits gestartete Debug-Instanz.
- **Ohne lokale Omnia-App starten**: Chatplattform laeuft ohne UI-Verbindung. Sie kann Modell, Lernkatalog, erkannte Befehle und spaeter API-Rezepte nutzen, fuehrt aber keine UI-Aktionen aus.

Daraus folgt eine technische Aenderung: Der lokale Webserver muss starten koennen, auch wenn Omnia nicht erreichbar ist. Omnia-Verbindung wird ein expliziter Betriebszustand statt eine Startvoraussetzung.

## Lernkatalog

Die Lernpunkte dienen nicht nur als Liste von UI-Klicks. Sie werden die Grundlage fuer komplette Omnia-Fernsteuerung.

Jeder gelernte Eintrag soll langfristig enthalten:

- natuerliche Formulierungen und Aliase.
- Ziel oder Intent.
- Aktionstyp: Navigation, Ansicht, Suche, Formular, Aktion.
- Executor: `ui`, `api` oder `hybrid`.
- Sicherheitsstufe: sicher, bestaetigungspflichtig, blockiert.
- Kontextsignale: Route, sichtbarer Bereich, Zieltext, Tab oder Modul.
- optionale API-Beobachtungen.

Stufe 1 muss die vorhandenen Katalogeintraege nicht vollstaendig migrieren. Sie soll die Struktur so erweitern, dass neue Lernereignisse API-Hinweise aufnehmen koennen, ohne bestehende Befehle zu brechen.

## Playwright-Lernen Fuer UI Und API

Wenn Chatplattform und lokale Omnia-App gleichzeitig laufen, lernt Playwright zweigleisig:

- **UI-Spur**: Klicks, Navigation, Tabs, Eingaben, Tastatur und sichtbare Ziele.
- **API-Spur**: Requests und Responses der Omnia-App, besonders `/apigateway/`.
- **Korrelation**: UI-Aktion und API-Verkehr werden in einem Zeitfenster zusammengefuehrt.

Beispiel:

1. Benutzer klickt in Omnia auf "Vorgaenge".
2. Recorder sieht den UI-Klick und die Zielroute.
3. API-Recorder sieht die Requests im direkten zeitlichen Umfeld.
4. Lernkatalog merkt: dieser UI-Befehl hat API-Kandidaten fuer "Vorgaenge laden".

Stufe 1 erzeugt daraus noch keine automatische API-Schreibausfuehrung. Sie sammelt und strukturiert Beobachtungen, damit spaeter zuerst lesende API-Rezepte und danach bestaetigte Schreibrezepte entstehen koennen.

## Technische Architektur

### Bestehende Bausteine

- `native-cdp-voice-server.js`: lokaler HTTP-Server, Omnia-CDP-Verbindung, Lernmodus, Auto-Explorer.
- `native-cdp-voice-ui.js`: aktuell HTML/CSS/JS fuer Voice-Control-Panel.
- `native-cdp-conversation.js`: lokale OpenAI-kompatible Chat-Completions-Integration.
- `native-cdp-command-catalog.js`: gelernte Befehle und natuerliche Aufloesung.
- `native-cdp-action-recorder.js`: UI-Aktionsaufzeichnung.
- bestehende API-Recording-Logik im Projekt.

### Geplante Struktur In Stufe 1

Backend:

- Chatserver startet auch ohne sofortige Omnia-Verbindung.
- Omnia-Verbindungszustand wird explizit verwaltet.
- neue oder erweiterte Endpunkte:
  - `GET /api/status`: Chat- und Omnia-Status, auch wenn Omnia getrennt ist.
  - `POST /api/omnia/connect`: lokale App starten oder anhaengen.
  - `POST /api/omnia/disconnect`: Verbindung loesen, Server bleibt an.
  - `POST /api/conversation`: natuerliche Konversation.
  - `POST /api/command`: direkte bestaetigte Ausfuehrung.
  - `GET /api/learning/commands`: Lernkatalog.
  - `POST /api/learning/start`: UI- und API-Lernen starten, wenn Omnia verbunden ist.
  - `POST /api/learning/stop`: Lernen stoppen und Katalog aktualisieren.

Frontend:

- `createVoicePanelHtml()` rendert Chat-first UI.
- JavaScript wird in klare Funktionen gegliedert:
  - Nachrichten rendern.
  - Text/Sprache als User-Nachricht senden.
  - Konversationsantwort rendern.
  - blockierte Aktion bestaetigen.
  - Omnia-Modus verbinden.
  - Lernstatus und gelernte Befehle anzeigen.

## Fehlerbehandlung

- Ollama nicht erreichbar: Chat zeigt lokale KI nicht erreichbar und nutzt vorhandene regel-/katalogbasierte Fallbacks, soweit moeglich.
- Omnia nicht verbunden: sichere UI-Aktionen werden nicht ausgefuehrt; Chat bietet Verbindung an.
- Omnia-CDP verliert Verbindung: Status wechselt auf getrennt, Chat bleibt nutzbar.
- Modell liefert ungueltiges JSON: Chat fragt nach oder nutzt Fallback.
- API-Lernen ohne Omnia-Verbindung: Lernstart wird blockiert und erklaert.
- Riskante Aktion ohne Bestaetigung: wird nicht ausgefuehrt.

## Tests

Unit-/HTML-Tests:

- HTML enthaelt Chatverlauf, Eingabezeile, Mikrofonsteuerung, Status und Omnia-Modus.
- Text- und Sprachpfad senden an `/api/conversation`.
- blockierte Antwort rendert eine Aktionskarte mit "Trotzdem ausfuehren".
- Bestaetigungsbutton sendet genau den erkannten Befehl an `/api/command`.
- gelernte Befehle werden im Drawer gerendert.
- Lern- und Explorer-Endpunkte bleiben erreichbar.

Backend-Tests:

- Serverkonfiguration erlaubt Chatstart ohne Omnia-Verbindung.
- Konversation blockiert riskante Befehle und gibt bestaetigbare Payloads zurueck.
- bestaetigte Ausfuehrung nutzt direkte Command-Ausfuehrung.
- API-Beobachtungen koennen Lernereignissen zugeordnet werden.
- Fallback funktioniert, wenn lokales Modell nicht erreichbar ist.

Manuelle QA:

- Panel laedt ohne leere Seite.
- Chatnachricht "zeige Vorgaenge" erzeugt sichtbare Antwort.
- riskanter Befehl "tippe mandantennummer" wird blockiert und laesst sich bewusst bestaetigen.
- Spracheingabe schreibt eine normale Chatnachricht.
- Lernmodus zeigt neue Befehle als Chatereignis.
- Modus "ohne lokale Omnia-App" laesst Chat starten, blockiert aber UI-Ausfuehrung sauber.

## Offene Erweiterungen Nach Stufe 1

- persistenter, lokal verschluesselter Chatverlauf.
- echte API-Rezeptausfuehrung fuer lesende Omnia-Workflows.
- bestaetigte API-Schreibrezepte mit Audit.
- bessere lokale STT/TTS-Modelle.
- separates Backend-Modul, falls die UI weiter waechst.
