# Omnia Companion App V1 Design

## Ziel

Version 1 ist eine mehrbenutzerfaehige Web-App als Workflow-Companion fuer Omnia. Sie arbeitet produktiv mit echten Omnia-Benutzern, kapselt Omnia-API-Aufrufe serverseitig und fokussiert auf zwei Fachbereiche: Vorgang sowie Bestellung/Wareneingang.

## Scope V1

### Plattform-Kern

- Login mit eigenen Omnia-Zugangsdaten.
- Server-seitige Session- und Token-Verwaltung pro Benutzer.
- Keine gemeinsame technische Omnia-Identitaet.
- Audit-Log fuer produktive Companion-Workflows.
- Zentrale Omnia-Connector-Schicht, keine direkten Omnia-API-Calls aus dem Frontend.
- Lokaler Betrieb in Version 1, spaeter Cloud/VPS-faehig.

### Modul Vorgang

- Kunden und Vorgaenge suchen.
- Vorgang oeffnen und Kontext hydrieren.
- Neuen Vorgang anlegen.
- Artikelposition hinzufuegen.
- Preisberechnung ausfuehren.
- Vorgang speichern.
- Lieferschein erzeugen und PDF/Vorschau anzeigen.

### Modul Bestellung

- Bestellvorschlaege suchen und erzeugen.
- Bestellvorschlag in Bestellung umwandeln.
- Bestellung suchen und oeffnen.
- Bestellung ueber `process-order` verarbeiten.
- PDF-/Maildaten ueber `orders/{uuid}/email` vorbereiten und lokalen Mailclient oeffnen lassen. Kein serverseitiger Omnia-Versand.

### Modul Wareneingang

- Wareneingaenge suchen.
- Wareneingang erfassen.
- Wareneingang durchfuehren/abschliessen.
- Statusauswahl gefuehrt anbieten.
- Pflichtfelder vor API-Calls validieren.

## Nicht-Ziele V1

- Kein vollstaendiger Omnia-Ersatz.
- Keine lokale Hardwareintegration fuer Scanner, Drucker, TSE, Telecash oder Dakota.
- Keine eigene Rollenverwaltung; wer gueltige Omnia-Zugangsdaten hat, darf die Companion-App gemaess Omnia-Rechten nutzen.
- Keine dauerhafte Spiegelung vollstaendiger Patienten-, Vorgangs-, Dokument- oder Bestelldaten.
- Kein serverseitiger E-Mail-Versand fuer Bestellungen.

## Architektur

Die App besteht aus Frontend, Companion Backend und Omnia Connector.

- Frontend: modulare Web-App mit App Shell, Navigation, Workflow-Oberflaechen und Dokument-/Statusanzeigen.
- Backend: Backend-for-Frontend fuer Auth, Sessions, Workflow-Fassaden, Validierung, Audit und Fehlernormalisierung.
- Omnia Connector: interne Adapter fuer beobachtete Omnia-Endpunkte.
- Storage: kleine lokale DB fuer Sessions, Audit-Events und technische Workflow-Protokolle.

## Modularitaet

Jedes Fachmodul besteht aus:

- eigener Route,
- eigener Backend-Workflow-Fassade,
- eigenen UI-Komponenten,
- eigenen Types,
- eigenen Tests,
- eigenen Audit-Events.

Der Plattform-Kern stellt gemeinsame Bausteine bereit: Session, API Client, Audit, Tabellen, Suche, Dialoge, Status-Badges, Fehleranzeigen und Validierungsregeln.

## Daten- und Sicherheitsmodell

Dauerhaft gespeichert werden nur:

- Session-Metadaten,
- technisch notwendiges verschluesseltes Sessionmaterial,
- Audit-Events,
- technische Workflow-Protokolle ohne unnoetige Patientendetails,
- App-Konfiguration.

Nicht dauerhaft gespeichert werden:

- komplette Patientenakten,
- Versichertennummern,
- Diagnosen und Rezeptdaten,
- komplette Vorgangs- oder Bestellobjekte,
- Dokumentinhalte/PDFs ausser temporaer fuer Vorschau/Download.

## Produktive Aktionen

Jede schreibende Aktion wird als expliziter Workflow ausgefuehrt:

- Frontend validiert Pflichtfelder.
- Backend validiert erneut.
- Backend schreibt ein Audit-Event.
- Omnia Connector ruft die beobachteten Omnia-Endpunkte in Reihenfolge auf.
- Fehler werden normalisiert und mit technischer Detail-ID an das Frontend gemeldet.

## Erste sichtbare Frontend-Version

Die erste UI zeigt die Zielstruktur mit Mockdaten:

- Plattform-Shell mit Benutzerkontext und Audit-Stream.
- Modulnavigation fuer Vorgang, Bestellung und Wareneingang.
- Vorgangsmodul mit Such-/Detail-/Workflowbereich.
- Bestellmodul mit Vorschlaegen, Bestellungen und E-Mail/PDF-Vorbereitung.
- Wareneingangsmodul mit Pflichtfeldformular und Abschlussflow.

Diese Version dient als modularer UI-Prototyp. Echte Omnia-Calls werden anschliessend hinter dieselben Workflow-Schnittstellen gehangen.
