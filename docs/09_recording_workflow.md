# Recording-Workflow

Ziel: Omnia bedienen, redacted Netzwerkverkehr und UI-Snapshots mitschneiden und danach automatisch API-Katalog, OpenAPI, Coverage, Impact, Relationship-Map, Data-Model, UI-Map, Scoreboard und Plattform-Blueprint aktualisieren.
Der Knowledge-Report verdichtet die beobachteten API-Records zusaetzlich zu Fachbereichen, Schritten, Endpunkten, Inventar-Coverage und Plattform-Kandidaten.
Der Flow-Report ist die schnelle API/UI-Timeline pro Aufnahme: Er zeigt relative Offsets ab Aufnahmebeginn, API-Responses, Download-Events, UI-Struktur-Snapshots, Browser-Navigationen sowie redaktierte Console-/Page-Error-Diagnosen. Das Flow-Mapping beruecksichtigt manuelle Schrittmarker und automatische Explorer-Ziele, zeigt pro Schritt API-Responses sowie UI-Struktur und bleibt dadurch auch bei UI-only-Schritten nutzbar.
Die Relationship-Map zeigt beobachtete Reihenfolgen zwischen Fachbereichen und macht Schnittstellenkanten fuer Plattform-Module sichtbar.
Das Data-Model leitet aus redacted Bodies beobachtete Entity-Kandidaten, Feldnamen und Typen ab.
Die UI-Map fuehrt geklickte Explorer-Ziele und offene UI-Ziele aus Workflow-Manifesten zusammen, verdichtet `ui-snapshot`-Records zu UI-Surfaces mit Route, Titel, Ueberschriften, Aktionen, Formularlabels und Tabellenkoepfen, verknuepft UI-Ziele und UI-Surfaces mit beobachteten API-Bereichen/Endpunkten aus demselben Schritt und erzeugt Nachfahr-Kommandos fuer manuelle Aufnahmen. Nachfahrten entstehen auch fuer geklickte UI-Ziele, bei denen noch kein API-Verkehr eindeutig zugeordnet wurde.
Der Impact-Report beantwortet pro einzelner Aufnahme, welche Endpunkte, Domaenen und Coverage-Beitraege sie gegenueber den anderen Logs neu gebracht hat.
Das Recording-Scoreboard zeigt ueber alle Aufnahmen chronologisch, welchen Zweck eine Aufnahme hatte, welche Aufnahme den Wissensstand erweitert hat, ob geplante Ziel-Endpunkte aus Workflow-Manifesten oder Summaries tatsaechlich gesehen wurden, wie viele Auto-Explorer-Ziele geklickt, uebersprungen oder blockiert wurden und welche Logs wegen fehlender API-Responses, Timeline-Marker oder UI-Struktur-Snapshots nachgefahren werden sollten. Fuer aktuelle Workflow-Laeufe nutzt es Zweck und Impact-Kurzbilanz aus dem Run-Manifest als Primaerquelle; dadurch bleiben Summary, Scoreboard und Campaign konsistent. Neben Markdown schreibt es `recording-scoreboard.json` als maschinenlesbaren Lernstand fuer Autopilot-/Dashboard-Verbraucher.
Der Plattform-Blueprint leitet daraus Module, MVP-Reihenfolge, Kernobjekte, beobachtete Datenobjekte, UI-Surfaces inklusive Snapshot-Struktur und API-Endpunkten, Schnittstellen, Funktionen und API-Luecken fuer die Zielplattform ab.

## Empfohlener Einstieg

Standard-Ablauf fuer eine verwertbare Aufnahme:

0. CLI-Hilfe nur als Help-only-Aufruf nutzen:

```bash
node tools/recording-workflow.ts --help
```

Der Help-Aufruf startet keinen Browser, schreibt keine Preflight-Dateien und erzeugt keine Aufnahme-Artefakte. Fuer echte Aufnahmen immer erst den Preflight darunter ausfuehren.
Unbekannte CLI-Optionen brechen ebenfalls vor dem Preflight ab. Dadurch loesen Tippfehler wie `--hlep` keine versehentliche Aufnahme aus.

1. Preflight ausfuehren und blockierende Probleme beheben.
2. Recording starten.
3. Omnia entweder manuell mit Schrittmarkern bedienen oder im Auto-Modus read-only erkunden lassen.
4. Nach dem Stop erzeugt der Workflow Flow-Report, API-Katalog, observed OpenAPI, Coverage, Knowledge, UI-Map, Impact, Scoreboard, Audit und Campaign.

Konkreter manueller Standard-Workflow:

```bash
node tools/recording-workflow.ts \
  --url https://api2.optica-omnia.de \
  --mode manual \
  --stub \
  --wait-for-login \
  --capture-bodies \
  --max-body-bytes 2000000 \
  --steps "Login/Workspace pruefen,Fachbereich oeffnen,Aktion ausloesen,Ergebnis pruefen"
```

Dieser Befehl startet Chromium aus dem Workflow heraus, loggt redaktierten API-Verkehr nach `logs/network/<timestamp>-workflow.jsonl` und katalogisiert danach automatisch die beobachteten Endpunkte in `docs/03_api_catalog.md` sowie `openapi/omnia-observed.openapi.yaml`. Omnia wird dabei erst nach dem manuellen Login und den Schrittmarkern bedient; der Mitschnitt bleibt durch Flow-Report, UI-Snapshots und API-Records zusammenfuehrbar.

Konkreter automatischer Read-only-Workflow:

```bash
node tools/recording-workflow.ts \
  --url https://api2.optica-omnia.de \
  --mode auto \
  --stub \
  --wait-for-login \
  --capture-bodies \
  --max-body-bytes 2000000 \
  --max-steps 180 \
  --max-minutes 20
```

Der Auto-Modus bedient nur sichere read-only Ziele, blockiert schreibende Requests und erzeugt zusaetzlich Explorer-Report, UI-Map-Followups und Scoreboard-Daten fuer die naechste gezielte Aufnahme.

Ein-Kommando-Autopilot fuer wiederholte automatische Erkundung:

```bash
node tools/recording-autopilot.ts --help
node tools/recording-autopilot.ts --url https://api2.optica-omnia.de --history-jsonl docs/recordings/recording-autopilot-history.jsonl
node tools/recording-autopilot.ts --url https://api2.optica-omnia.de --preflight --history-jsonl docs/recordings/recording-autopilot-history.jsonl
node tools/recording-autopilot.ts --url https://api2.optica-omnia.de --run --runs 3 --history-jsonl docs/recordings/recording-autopilot-history.jsonl
node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --history-jsonl docs/recordings/recording-autopilot-history.jsonl
node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run --history-jsonl docs/recordings/recording-autopilot-history.jsonl
```

Der Autopilot ist standardmaessig ein sicherer Dry-Run: Er aktualisiert die Recording-Campaign, nimmt nur automatisch ausfuehrbare Empfehlungen (`--auto-only`) und schreibt den Next-Report nach `docs/recordings/recording-autopilot-report.md/json`. `--help` ist Help-only und schreibt keine Sidecars. Unbekannte CLI-Optionen brechen vor jedem Report-/Outcome-Update ab, damit Tippfehler wie `--contine-from` keine Default-Dry-Runs ausloesen. `--preflight` prueft die naechste Workflow-Aufnahme ohne Live-Recording. Erst `--run` startet echte Aufnahmen; `--runs N` begrenzt die Wiederholungen. Nach jedem echten Lauf greift das `runEvidence`-Gate aus `recording-next`: Fehlen Netzwerk-Log, API-Responses, Timeline-Marker oder UI-Snapshots, stoppt der Autopilot statt schwache Aufnahmen blind fortzusetzen. Der Autopilot liest anschliessend den JSON-Report und gibt eine kompakte Outcome-Entscheidung aus: `ready`, `needs-review`, `blocked` oder `missing`, inklusive Grund, Findings und naechstem Automationsbefehl. Wenn eine gated Fortsetzung verfuegbar ist, zeigt die CLI `Recording-Autopilot-Next-Command` als `--continue-from <outcome.json> --run`-Fortsetzung und den direkten Workflow-Befehl nur separat als `Recording-Autopilot-Workflow-Command`. Dieselbe Entscheidung steht im eigenen Outcome-Sidecar `docs/recordings/recording-autopilot-outcome.json`; ein anderer Pfad ist mit `--outcome-json <datei>` moeglich. Mit `--history-jsonl <datei>` schreibt jeder Dry-Run, Preflight, echte Lauf und jede Continue-Preview zusaetzlich eine append-only JSONL-Zeile mit Zeitstempel, Modus, Status, Grund, Findings, Outcome-Datei, Next-Report und Kommando. Bei `ready` schreibt die History auch `continueCommand` und `continueArgs`; der History-Report priorisiert diese Autopilot-Fortsetzung als naechsten Befehl, damit keine Automation versehentlich direkt den Workflow ohne Gates startet. Direkt danach aktualisiert der Autopilot den lesbaren History-Report neben der JSONL-Datei (`recording-autopilot-history.md/json`); ein anderer Markdown-Pfad ist mit `--history-report <datei>` moeglich. Wenn der Next-Report eine echte Workflow-Aufnahme enthaelt, uebernimmt die History auch `workflowRun`, `runEvidence` und `learning`; damit wird sie zum chronologischen Aufnahme-Index mit Netzwerk-Log, Manifest, Impact, neuen Endpunkten, Coverage-Delta und Qualitaetsgate. Bei `ready` enthaelt der Sidecar zusaetzlich `continueCommand` als sichtbare `--continue-from`-Fortsetzung und `continueArgs` als interne Run-Args; Automationen sollen diese Autopilot-Fortsetzung nutzen, nicht den direkten Workflow-Befehl, damit Gates, Repeat-Limit, Outcome-Sidecar, History und History-Report aktiv bleiben. `--continue-from <outcome.json>` liest diesen Sidecar und zeigt die Fortsetzung nur an; erst `--continue-from <outcome.json> --run` fuehrt sie aus. Continue-Preview und History schreiben zusaetzlich `Recording-Autopilot-Outcome-Fresh`, `Recording-Autopilot-Outcome-Age-Minutes` und `Recording-Autopilot-Outcome-Max-Age-Minutes`, damit Automationen ohne Dateistat-Logik erkennen, ob der Sidecar noch startfaehig ist. Vor einer echten Fortsetzung muss der Outcome-Sidecar frisch sein; Standardlimit sind 120 Minuten, abweichend steuerbar mit `--max-outcome-age-minutes <n>`. Ist der Sidecar zu alt, wird `--run` blockiert und zuerst ein neuer Autopilot-Preflight oder Dry-Run erwartet, damit keine Aufnahme mit veralteten Artefaktpfaden startet. Ist der Sidecar `needs-review`, `blocked` oder `missing`, wird auch mit `--run` nicht fortgesetzt. Exit-Code `0` bedeutet `ready`, Exit-Code `2` bedeutet `needs-review`, Exit-Code `1` bedeutet `blocked` oder `missing`. Manuelle Missionen werden nur beruecksichtigt, wenn zusaetzlich `--include-manual` gesetzt ist; wirklich ausfuehren lassen sie sich erst mit `--allow-manual`.

Den Autopilot-Verlauf manuell neu als lesbaren Aufnahme-Index ausgeben:

```bash
node tools/recording-autopilot-report.ts --help
node tools/recording-autopilot-report.ts
node tools/recording-autopilot-report.ts --require-runnable
node tools/recording-autopilot-report.ts --require-runnable --max-outcome-age-minutes 120
```

Der Report liest `docs/recordings/recording-autopilot-history.jsonl` und schreibt `docs/recordings/recording-autopilot-history.md/json`. Der Autopilot aktualisiert ihn bei `--history-jsonl` bereits automatisch; dieses Script dient zum Regenerieren oder fuer abweichende Pfade. `--help` ist Help-only und schreibt keine Reports. Unbekannte CLI-Optionen brechen vor jedem Report-Update ab. Er zeigt Timeline, Statuszaehler, Workflow-Artefakte, Run-Evidence, Lernempfehlung, neue Endpunkte, Coverage-Delta und Review-Blocker aus allen Autopilot-Durchlaeufen. `Startfreigabe-Grund` erklaert kompakt, ob die gated Fortsetzung frisch ist, stale ist, fehlt oder wegen Status `needs-review`/`blocked` nicht gestartet werden darf. Der neueste Outcome-Sidecar wird anhand der Dateizeit revalidiert; `--max-outcome-age-minutes <n>` steuert das Frischelimit, Standard sind 120 Minuten. Das JSON-Sidecar enthaelt `latestContinueArgs` und `latestOutcomeJsonFile`, damit Automationen die gated Fortsetzung shellfrei starten koennen, statt `Naechster Befehl` zu parsen. Mit `--require-runnable` wird der Report zum Scheduler-Gate: Exit-Code `0` nur bei `Startfreigabe: ja`, sonst Exit-Code `1`, ohne eine Live-Aufnahme zu starten.

Preflight ohne Live-Aufnahme:

```bash
node tools/recording-workflow.ts \
  --preflight \
  --mode auto \
  --stub \
  --wait-for-login \
  --capture-bodies \
  --max-body-bytes 2000000
```

Der Preflight oeffnet Omnia nicht. Er schreibt `docs/recordings/<timestamp>-workflow-preflight.md` und den JSON-Sidecar `docs/recordings/<timestamp>-workflow-preflight.json`, prueft Ziel, Body-Capture, Nachauswertung, Audit und Artefaktpfade. Beide Preflight-Artefakte enthalten den passenden Startbefehl ohne `--preflight`, aber mit denselben Log- und Reportpfaden. Der Prozess endet nur bei `blocked` mit Exit-Code 1; `warning` bleibt fuer Automationen ausfuehrbar, aber im JSON maschinenlesbar sichtbar.
Mit `--purpose <coverage|quality-baseline|bootstrap|manual>` wird der Zweck des Recordings in Preflight, Summary und Run-Manifest geschrieben. Das Scoreboard uebernimmt diesen Zweck in Markdown und JSON; `recording-next` spiegelt ihn beim letzten Recording in `learning.lastRecording.purpose` und in `--print-learning`. Der Next-Autopilot setzt bei `automationDecision: bootstrap-recording` automatisch `--purpose bootstrap` und bei `automationDecision: record-quality-baseline` automatisch `--purpose quality-baseline` in den echten `--run`-/`--preflight`-Args sowie im ausgegebenen Automationsbefehl, damit spaetere Scoreboards und Reviews den Lauf nicht nur ueber Dateinamen oder Kommandotext erkennen muessen.

Manueller Fachflow mit Schrittmarkern:

```bash
node tools/recording-workflow.ts \
  --mode manual \
  --stub \
  --wait-for-login \
  --capture-bodies \
  --max-body-bytes 2000000 \
  --steps "Login/Workspace pruefen,Kunde suchen,Fachbereich oeffnen,Aktion ausfuehren,Ergebnis pruefen"
```

Im manuellen Modus schreibt der Workflow nach jedem abgeschlossenen Schritt neben dem `flow-marker` auch einen redaktierten `ui-snapshot`. Damit bleiben API-Timeline und sichtbare UI-Struktur auch bei Handbedienung zusammenfuehrbar.

Automatische Read-only-Erkundung:

```bash
node tools/recording-workflow.ts \
  --mode auto \
  --stub \
  --wait-for-login \
  --capture-bodies \
  --max-body-bytes 2000000 \
  --max-steps 180 \
  --max-minutes 20
```

Der Auto-Modus schreibt neben Summary und Flow-Report zusaetzlich einen Explorer-Report nach `docs/recordings/<timestamp>-workflow-explorer.md`. Darin stehen geklickte Ziele, ein UI-Zielinventar aus sicher entdeckten offenen und bereits geklickten Zielen, redaktionsarme UI-Struktur-Snapshots mit Route, Titel, Ueberschriften, Aktionen, Formularlabels und Tabellenkoepfen, blockierte Requests und uebersprungene Kandidaten. Ein eigener Pfad ist mit `--explorer-report <datei>` moeglich.
Jeder Workflow schreibt vor dem Browserstart Preflight-Markdown und Preflight-JSON sowie danach ein maschinenlesbares Run-Manifest nach `docs/recordings/<timestamp>-workflow-manifest.json`. Im Preflight steht `runCommand` als direkt ausfuehrbarer Startbefehl fuer Menschen und `runArgs` als shellfrei ausfuehrbares Argument-Array fuer Automationen. Im Manifest stehen Modus, Zweck, Status, Stop-Grund, Preflight-Status/Checks, Audit-Status, alle erzeugten Artefakte, die Ergebnisse der erwarteten Ziel-Endpunkte, die Impact-Kurzbilanz mit neuen Endpunkten/Coverage-Delta und bei Auto-Laeufen die Explorer-Kennzahlen fuer geklickte, entdeckte, offene, uebersprungene und blockierte Ziele. Recording-Scoreboard und Recording-Campaign verwenden dieses Manifest als Primaerquelle; die Markdown-Summary bleibt Fallback fuer aeltere Aufnahmen.

Coverage-getriebene Recording-Kampagne planen:

```bash
node tools/recording-campaign.ts --help
node tools/recording-campaign.ts
```

Die Kampagne liest die aktuellen JSONL-Logs, den Knowledge-Report, die Relationship-Map, Workflow-Manifeste/Summaries, UI-Map-Followups, Quality-Reruns und das statische API-Inventar, waehlt die wichtigsten automatisch aufnehmbaren Coverage-Luecken aus und schreibt `docs/recordings/recording-campaign.md` sowie `docs/recordings/recording-campaign-next.json`. `--help` ist Help-only und schreibt keine Campaign-/Next-Sidecars. Unbekannte CLI-Optionen brechen vor jedem Datei-Update ab, damit Tippfehler wie `--prit-next` keinen falschen Kampagnenstand erzeugen. Ohne `--run` wird nichts live gestartet. `Naechste Aufnahme` zeigt den aktuell priorisierten Recording-Befehl; das JSON-Sidecar enthaelt dieselbe Empfehlung mit `priority`, `label`, `reason`, `mode`, `command` und shellfrei nutzbaren `args`. Generierte Recording-Kommandos tragen `--url` explizit; die Ziel-URL kommt aus `--url`, sonst `OMNIA_URL`, sonst `environment.json.url`, sonst dem bekannten Omnia-Host. Der Abschnitt `Endpoint-Missions` nennt einzelne offene Export-, Such-, Detail- und Listen-Endpunkte mit manuellen Schrittmarkern fuer gezielte Nachaufnahmen. Der Abschnitt `Retry-Missions` nimmt erwartete Endpunkte wieder auf, die in einem Workflow-Manifest oder einer Workflow-Summary als `fehlt` bewertet wurden und laut aktueller Coverage weiterhin fehlen. `Explorer-Followups` plant manuelle Nachfahrten fuer Auto-Laeufe, die blockiert wurden, keinen Klick geschafft haben oder aus einem problematischen Stop-Grund endeten; `UI-Map-Followups` plant konkrete UI-Ziele nach, die offen sind oder noch keinen API-Link haben; `Quality-Reruns` plant Aufnahmen nach, deren Logs keine API-Responses, keine Flow-/Explorer-Marker oder keine UI-Struktur-Snapshots enthalten.
Den priorisierten Befehl kann man ohne Markdown-Parsing direkt ausgeben:

```bash
node tools/recording-campaign.ts --print-next
```

Den naechsten Schritt sicher aus dem JSON-Sidecar pruefen:

```bash
node tools/recording-next.ts --help
node tools/recording-next.ts
```

Der Next-Runner ist standardmaessig ein Dry-Run. `--help` ist Help-only und schreibt keinen Next-Report. Unbekannte CLI-Optionen brechen vor jedem Report-Update ab, damit Tippfehler wie `--refesh-campaign` keinen irrefuehrenden Dry-Run-Report erzeugen. Mit `--refresh-campaign` baut er vorher die Campaign neu; `--url <omnia-url>` wird dabei an die Campaign weitergereicht und landet auch im Next-JSON-Report. Fuer automatische Erkundung trotz manueller Quality-Reruns nutzt `--auto-only` das Auto-Sidecar `docs/recordings/recording-campaign-next-auto.json` und blockiert manuelle Empfehlungen immer. Mit `--preflight` fuehrt er nur den Preflight der empfohlenen Workflow-Args aus, haengt dafuer automatisch `--preflight`, `--preflight-out` und `--preflight-json` an und startet keine Live-Aufnahme. Die Workflow-Preflight-Artefakte werden vom Next-Reportpfad abgeleitet, z. B. `recording-next-report-workflow-preflight.md/json`, und im Markdown-/JSON-Report mit Status verlinkt; eigene Pfade sind mit `--workflow-preflight-out <datei>` und `--workflow-preflight-json <datei>` moeglich. Nach einem Next-Preflight steht der echte Aufnahmebefehl ohne `--preflight` als `workflowPreflight.runCommand` und `nextAction.runCommand` im JSON-Report sowie als `Workflow-Startbefehl` im Markdown. `--print-run-command` gibt denselben freigegebenen Live-Befehl direkt in der CLI aus; bei geblockten oder manuell nicht freigegebenen Empfehlungen steht dort `-`. Fuer Automationen stehen dieselben Startparameter shellfrei als `workflowPreflight.runArgs`, `nextAction.runArgs`, `nextAction.automationRunArgs` und `nextAction.automationRunCommand` bereit; `--print-automation-command` gibt genau diesen Autopilot-Befehl direkt in der CLI aus. Wenn `nextAction.automationDecision` `bootstrap-recording` ist, enthalten die tatsaechlich ausgefuehrten Workflow-Args, `automationRunCommand` und `automationRunArgs` zusaetzlich `--purpose bootstrap`; bei `record-quality-baseline` enthalten sie `--purpose quality-baseline`. `nextAction.targetUrl` enthaelt den Ziel-Host und `summary.campaignRefreshed` zeigt, ob vorher neu geplant wurde. Nach einem echten `--run` liest der Next-Runner das erzeugte Workflow-Manifest und schreibt eine kompakte `workflowRun`-Bilanz in `results[]`, `summary.lastWorkflowRun` und `nextAction.workflowRun`: Manifest, Log, Summary, Impact-Dateien, Status, Zweck, Audit-Status, neue Endpunkte, Inventar-Coverage-Delta, erwartete Endpoint-Treffer und Explorer-Kennzahlen. Zusaetzlich bewertet `runEvidence` die Aufnahme-Evidenz als `ok`, `needs-review` oder `missing`; sie nutzt dieselben Netzwerklog-Qualitaetskriterien wie das Recording-Audit und prueft neben Manifest-Feldern, ob das Netzwerk-Log wirklich existiert, ob das JSONL-Log API-`response`-Records enthaelt und ob Flow-/Explorer-Marker sowie UI-Struktur-Snapshots vorhanden sind. Findings wie `workflow-manifest-missing`, `no-api-response`, `no-timeline-marker`, `no-ui-snapshot`, `network-log-missing` und `expected-endpoints-missing` stehen in `results[]`, `summary.lastRunEvidence` und `nextAction.runEvidence`. Wenn `runEvidence` nicht `ok` ist, setzt der Next-Report `nextAction.runnable` auf `false`, `gate` auf `blocked` und `automationDecision` auf `blocked`, damit Automationen nicht erneut starten, bevor die Aufnahmequalitaet geklaert ist. Der JSON-Report liest zusaetzlich `docs/recordings/recording-scoreboard.json` und schreibt eine kompakte `learning`-Sektion mit `status` (`ok`, `needs-review`, `missing`), `recommendedAction` (`continue-coverage-recording`, `record-quality-baseline`, `bootstrap-recording`), Coverage, Recording-Zaehlern, Review-Bedarf, Explorer-Kennzahlen sowie Datei, Zweck und Beitrag des letzten Recordings; ein anderer Scoreboard-Sidecar kann mit `--scoreboard-json <datei>` angegeben werden. Dieselbe Lernentscheidung steht direkt in `nextAction.learningStatus`, `nextAction.learningRecommendedAction` und `nextAction.learningRecommendedReason`, damit Automationen Start-Gate und fachliche Empfehlung ohne eigene JSON-Zusammenfuehrung lesen koennen. `nextAction.qualityGate` trennt technische Startbarkeit von Wissensqualitaet: `ready` bei verwertbarem Scoreboard, `needs-review` bei nachzufahrenden Recordings und `missing-learning`, wenn noch kein Lernstand existiert; `qualityGateReason` enthaelt die Begruendung. `nextAction.automationDecision` fuehrt technisches Gate und Lernstand zu einer direkten Autopilot-Aktion zusammen: `run`, `record-quality-baseline`, `bootstrap-recording` oder `blocked`. `--print-learning` gibt diese Lernbilanz inklusive letztem Recording-Zweck zusaetzlich als kurze CLI-Zeile aus. Ist der Workflow-Preflight `blocked`, setzt der Next-Report `nextAction.runnable` auf `false` und `gate` auf `blocked`, damit ein Autopilot die Aufnahme nicht startet. Auch wenn der Workflow-Prozess dabei mit Exit-Code 1 endet, bleibt der Next-Report schreibbar, solange das Workflow-Preflight-JSON den Blocker enthaelt. Ausfuehren geht nur mit `--run`; manuelle Aufnahmen bleiben dabei blockiert, bis zusaetzlich `--allow-manual` gesetzt ist. Mit `--repeat N` kann der Runner mehrere Auto-Aufnahmen nacheinander ausfuehren; ohne `--run` oder mit `--preflight` bleibt auch `--repeat` eine Ein-Schritt-Pruefung, weil ohne echten Lauf keine neue Coverage entsteht. Wenn die neu berechnete Campaign dieselben shellfreien `args` erneut liefert, stoppt die Schleife als `stalled`, damit kein Bereich wirkungslos doppelt aufgenommen wird; dieser Vergleich ignoriert Command-Formatierung und automatisch gesetzte `--purpose`-Unterschiede. Nach einem ausgefuehrten Run mit `runEvidence` ungleich `ok` stoppt `--repeat` ebenfalls sofort, damit der Autopilot nicht blind mehrere schwache oder nicht auswertbare Aufnahmen erzeugt. Jeder Lauf schreibt `docs/recordings/recording-next-report.md` und `docs/recordings/recording-next-report.json` mit Iterationsstatus, Ziel, Grund und Befehl; der JSON-Report enthaelt zusaetzlich `summary` mit Zaehlwerten, Stop-Status, Stop-Grund, letztem Befehl, letzter Workflow-Run-Bilanz und letzter Run-Evidenz sowie `nextAction` mit Startpfad, Limits, erwarteten Endpunkten, `runCommand`, `runArgs`, `automationRunCommand`, `automationRunArgs`, `targetUrl`, `runnable`, `gate`, `qualityGate`, `automationDecision`, `workflowRun`, `runEvidence` und Lernempfehlung ohne Shell-Parsing. Eigene Pfade sind mit `--report <datei>` und `--report-json <datei>` moeglich.

```bash
node tools/recording-next.ts --auto-only
node tools/recording-next.ts --auto-only --preflight
node tools/recording-next.ts --refresh-campaign --auto-only --url https://api2.optica-omnia.de
node tools/recording-next.ts --auto-only --repeat 3
node tools/recording-next.ts --auto-only --repeat 3 --report tmp/next-dry-run.md
node tools/recording-next.ts --auto-only --repeat 3 --report-json tmp/next-dry-run.json
node tools/recording-next.ts --refresh-campaign --auto-only --preflight --print-run-command --print-automation-command --print-learning --url https://api2.optica-omnia.de
node tools/recording-next.ts --refresh-campaign --auto-only --run
node tools/recording-next.ts --refresh-campaign --auto-only --run --repeat 3
node tools/recording-next.ts --refresh-campaign --run
node tools/recording-next.ts --refresh-campaign --run --allow-manual
```

Coverage-getriebene Auto-Runs adaptiv ausfuehren:

```bash
node tools/recording-campaign.ts --run --limit 3
```

Bei `--run` plant die Kampagne nach jedem abgeschlossenen Auto-Run aus den dann aktuellen JSONL-Logs neu und ueberspringt bereits ausgefuehrte Bereiche. Manuelle Bereiche wie Dokumente/Archiv oder unbekannte Fachbereiche werden standardmaessig nur geplant und nicht automatisch gestartet. Der Abschnitt `Domain-Backlog` zeigt dafuer konkrete manuelle Recording-Kommandos mit Missing-Beispielen aus dem Inventar. Der Abschnitt `Relationship-Missions` plant zusaetzlich Uebergangsaufnahmen zwischen beobachteten Fachbereichen, damit Modul-Schnittstellen gezielt nachrecordet werden. `Explorer-Followups` werden auch erzeugt, wenn ein Auto-Lauf offene sichere UI-Ziele im Manifest hinterlassen hat. Mit `--include-manual` werden manuelle Prioritaeten und Quality-Reruns in die Kampagne aufgenommen; diese Runs halten an den interaktiven Schrittmarkern.

Scoreboard aus allen vorhandenen Logs neu bauen:

```bash
node tools/recording-scoreboard.ts
```

Relationship-Map aus allen vorhandenen Logs neu bauen:

```bash
node tools/omnia-relationships.ts
```

Data-Model aus allen vorhandenen Logs neu bauen:

```bash
node tools/omnia-data-model.ts
```

Der Workflow startet bei Bedarf einen eigenen Chromium-Kontext und schreibt daraus redaktierte Netzwerk-Logs sowie UI-Snapshots.

Gezielte Missionen koennen erwartete Endpunkte mitgeben:

```bash
node tools/recording-workflow.ts \
  --mode manual \
  --stub \
  --wait-for-login \
  --capture-bodies \
  --max-body-bytes 2000000 \
  --expect-endpoint "POST /salesprocesses/csv-export" \
  --steps "Exportkontext oeffnen,Export ausloesen,API-Response und Download-Metadaten pruefen,Exportdaten ohne Klarwerte pruefen"
```

Nach dem Lauf schreibt der Workflow im Run-Manifest und in der Summary, ob jeder Ziel-Endpunkt im JSONL-Mitschnitt gesehen wurde.

## Ablauf

1. Preflight prueft Ziel, Body-Capture, Nachauswertung, Audit und Artefaktpfade und schreibt Markdown/JSON; bei `blocked` startet kein Browser.
2. Browser mit Electron-Stub starten.
3. Netzwerk-Recorder aktivieren.
4. Bei `--wait-for-login` auf manuelles Login warten.
5. Omnia bedienen:
   - `--mode manual`: Schrittmarker werden interaktiv gesetzt; nach jedem Schritt wird ein UI-Struktur-Snapshot geschrieben.
   - `--mode auto`: Read-only-Explorer klickt sichere Ziele, blockiert gefaehrliche Requests, sammelt UI-Struktur-Snapshots, schreibt den Explorer-Report und legt Kennzahlen im Run-Manifest ab.
6. Recording stoppen.
7. Flow-Mapping und Flow-Report schreiben; der Flow-Report enthaelt relative Offsets fuer API-/Download-Events, UI-Struktur-Snapshots, Browser-Navigationen und redaktierte Browser-Diagnosen, das Mapping enthaelt manuelle Schritte und Auto-Explorer-Ziele mit API-Responses und UI-Struktur je Schritt.
8. API-Katalog und observed OpenAPI aus allen JSONL-Logs neu bauen.
9. Coverage-Report gegen statisches API-Inventar aktualisieren.
10. Omnia-Knowledge-Report aus den redacted API-Records und dem statischen Inventar aktualisieren.
11. Omnia-Relationship-Map aus den chronologischen API-Records aktualisieren.
12. Omnia-Data-Model aus strukturierten redacted Bodies aktualisieren.
13. Omnia-UI-Map aus Explorer-Markern, UI-Struktur-Snapshots und Workflow-Manifesten aktualisieren.
14. Plattform-Blueprint aus Knowledge-Report, Relationship-Map, Data-Model und frisch aktualisierten UI-Map-Surfaces aktualisieren.
15. Recording-Impact fuer die einzelne Aufnahme gegen alle anderen Logs schreiben.
16. Summary-Datei und Run-Manifest mit allen bis dahin bekannten Artefakten schreiben.
17. Recording-Scoreboard ueber alle Logs aktualisieren; dabei sind Zweck und Impact des aktuellen Run-Manifests bereits sichtbar und das JSON-Sidecar `recording-scoreboard.json` wird mitgeschrieben.
18. Recording-Audit auf Pflichtartefakte inklusive Summary/Run-Manifest/UI-Map und offensichtliche Token-/Cookie-/PII-Leaks ausfuehren.
19. Summary-Datei und Run-Manifest mit Audit-Status final aktualisieren.
20. Recording-Campaign aus den aktualisierten Logs, Reports und Workflow-Manifesten/Summaries neu bauen.

## Artefakte

- Netzwerk-Log: `logs/network/<timestamp>-workflow.jsonl`
- Preflight-Report: `docs/recordings/<timestamp>-workflow-preflight.md`
- Preflight-JSON: `docs/recordings/<timestamp>-workflow-preflight.json`
- Run-Manifest: `docs/recordings/<timestamp>-workflow-manifest.json` mit Zweck, Artefakten, Ziel-Endpunkten und Auto-Explorer-Kennzahlen
- Explorer-Report: `docs/recordings/<timestamp>-workflow-explorer.md` mit geklickten Zielen, UI-Zielinventar, UI-Struktur-Snapshots, blockierten Requests und uebersprungenen Kandidaten
- UI-Struktur-Snapshots: `ui-snapshot`-Records im Netzwerk-Log, bei Auto-Laeufen aus dem Explorer und bei manuellen Laeufen nach jedem abgeschlossenen Schritt
- Flow-Report: `docs/recordings/<timestamp>-flow.md` mit API/UI-Timeline, Downloads, UI-Struktur-Snapshots, Navigationen und Browser-Diagnosen
- Flow-Mapping: `docs/04_flow_to_api_mapping.md` mit API-Responses und UI-Struktur je manuellem Schritt oder Explorer-Ziel
- API-Katalog: `docs/03_api_catalog.md`
- OpenAPI: `openapi/omnia-observed.openapi.yaml`
- Coverage-Report: `docs/08_api_coverage_report.md`
- Knowledge-Report: `docs/10_omnia_knowledge.md`
- Relationship-Map: `docs/12_omnia_relationships.md`
- Data-Model: `docs/13_omnia_data_model.md`
- UI-Map: `docs/14_omnia_ui_map.md` mit UI-Zielen, UI-Surfaces, API-Bereichen, Endpunkten pro UI-Ziel/Surface und Nachfahr-Kommandos fuer offene oder API-unverknuepfte UI-Ziele
- Plattform-Blueprint: `docs/11_platform_blueprint.md` mit Modulen, UI-Surfaces inklusive Ueberschriften/Aktionen/Formularfeldern/Tabellenkoepfen/API-Endpunkten, Datenobjekten, Schnittstellen und API-Luecken
- Impact-Report: `docs/recordings/<timestamp>-workflow-impact.md`
- Impact-JSON: `docs/recordings/<timestamp>-workflow-impact.json` mit maschinenlesbarer Lernbilanz, neuen Endpunkten, Fachbereichen, Coverage-Delta und Downloads
- Recording-Scoreboard: `docs/recordings/recording-scoreboard.md`
- Recording-Scoreboard-JSON: `docs/recordings/recording-scoreboard.json` mit maschinenlesbarer Lernkurve, Recording-Zweck, Recording-Qualitaet, Coverage, erwarteten Endpunkten und Explorer-Kennzahlen
- Recording-Campaign inkl. Domain-Backlog, Retry-Missions, Endpoint-Missions, Explorer-Followups, UI-Map-Followups und Quality-Reruns: `docs/recordings/recording-campaign.md`
- Naechster Recording-Schritt fuer Automationen: `docs/recordings/recording-campaign-next.json`
- Naechster automatisch ausfuehrbarer Recording-Schritt: `docs/recordings/recording-campaign-next-auto.json`
- Autopilot-History: `docs/recordings/recording-autopilot-history.jsonl` mit append-only Entscheidungen, Gruenden, Findings, Fortsetzungsbefehlen, Workflow-Artefakten, Run-Evidence und Lernstand
- Autopilot-History-Report: `docs/recordings/recording-autopilot-history.md/json` mit Timeline, Statuszaehlern, Artefaktindex, Lernempfehlung und Review-Blockern
- Recording-Audit: `docs/recordings/<timestamp>-workflow-audit.md`
- Workflow-Summary: `docs/recordings/<timestamp>-workflow-summary.md`

## Sicherheitsregeln

- Auto-Modus ist Read-only und blockiert PUT, PATCH, DELETE sowie nicht read-like POSTs.
- Manueller Modus kann echte Writes mitschneiden; schreibende Aktionen nur mit Testdaten ausfuehren.
- Bodies werden redacted, bevor sie in JSONL, Katalog oder Reports landen.
- Der Knowledge-Report arbeitet nur mit redacted API-Records und dem statischen Endpoint-Inventar; er fasst keine Rohwerte zusammen.
- Die Relationship-Map arbeitet nur mit redacted API-Records und rekonstruiert keine Rohwerte.
- Das Data-Model arbeitet nur mit redacted Bodies und dokumentiert Feldnamen/Typen statt Werte.
- UI-Struktur-Snapshots erfassen nur strukturierende UI-Texte wie Titel, Ueberschriften, Aktionen, Formularlabels und Tabellenkoepfe; Suchwerte, Tokens und offensichtliche Personenwerte werden redacted.
- Die UI-Map arbeitet nur mit Explorer-Markern, UI-Struktur-Snapshots und Workflow-Manifesten; sie nutzt Labels/Pfade/Strukturtexte, keine Roh-Bodies.
- Der Plattform-Blueprint ist eine Ableitung aus Knowledge/Coverage, Relationship-Map und Data-Model und ersetzt keine fachliche Abnahme.
- Der Impact-Report vergleicht eine einzelne Aufnahme mit den uebrigen redacted Logs; er rekonstruiert keine Rohwerte.
- Das Recording-Scoreboard arbeitet nur mit redacted Logs und bewertet Endpoint-Zuwachs, keine Rohdaten.
- Der Recording-Audit prueft Textartefakte inklusive Workflow-Summary, Run-Manifest und Impact-JSON auf offensichtliche Bearer-/JWT-/Cookie-/Passwort-/E-Mail-/KVNR-Leaks. Fuer Netzwerk-Logs bewertet er zusaetzlich, ob API-Responses, Flow-/Explorer-Marker und UI-Struktur-Snapshots vorhanden sind; dadurch fallen leere oder fuer API-/UI-Zuordnung schwache Recordings sofort auf.
- Keine Tokens, Cookies oder Patientendaten committen.
- `--no-catalog`, `--no-coverage`, `--no-knowledge`, `--no-relationships`, `--no-data-model`, `--no-blueprint`, `--no-ui-map`, `--no-scoreboard`, `--no-impact` und `--no-audit` nur fuer gezielte Debug-Laeufe verwenden.
