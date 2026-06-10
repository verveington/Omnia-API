import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import {
  buildCoverageReport,
  classifyEndpointArea,
  loadKnownEndpoints,
  type KnownEndpoint,
  type RecordingCommand,
} from "./coverage-report.ts";
import {
  buildOmniaDataModel,
  type OmniaDataModel,
} from "./omnia-data-model.ts";
import {
  buildOmniaKnowledge,
  type OmniaKnowledgeReport,
} from "./omnia-knowledge.ts";
import {
  buildOmniaRelationships,
  type OmniaRelationshipMap,
} from "./omnia-relationships.ts";
import {
  buildOmniaUiMap,
  type OmniaUiMap,
  type OmniaUiMapInput,
} from "./omnia-ui-map.ts";
import { redactUiLabel } from "./redact.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "16_codex_api_context.md");
const defaultJsonOutputFile = path.join(workspaceRoot, "docs", "16_codex_api_context.json");

export type CodexApiContextOptions = {
  outputFile: string;
  jsonOutputFile: string;
  recordingUrl?: string;
  noInventory?: boolean;
  top: number;
  generatedAt?: Date | string;
};

export type CodexApiContextInput = {
  records: Record<string, unknown>[];
  knownEndpoints?: KnownEndpoint[];
  logInputs?: OmniaUiMapInput[];
  uiMap?: Partial<OmniaUiMap>;
  dataModel?: OmniaDataModel;
  knowledge?: OmniaKnowledgeReport;
  relationships?: OmniaRelationshipMap;
};

export type CodexObservedEndpoint = {
  key: string;
  method: string;
  path: string;
  area: string;
  purpose: string;
  count: number;
  statuses: number[];
  steps: string[];
};

export type CodexMissingEndpoint = {
  key: string;
  method: string;
  path: string;
  area: string;
  purpose: string;
  priority: "high" | "medium" | "low";
  reason: string;
  source: string;
  relatedObserved: CodexObservedEndpoint[];
  uiHints: string[];
  dataHints: string[];
  relationshipHints: string[];
  recordingCommands: RecordingCommand[];
};

export type CodexApiContext = {
  generatedAt: string;
  summary: {
    knownEndpoints: number;
    observedEndpoints: number;
    observedKnownEndpoints: number;
    missingKnownEndpoints: number;
    coveragePercent: number;
    focusAreas: string[];
  };
  missingEndpoints: CodexMissingEndpoint[];
  observedEndpoints: CodexObservedEndpoint[];
  codexPrompt: string;
};

type ObservedEndpointMutable = CodexObservedEndpoint & {
  statusSet: Set<number>;
  stepSet: Set<string>;
};

if (isMainModule()) {
  const options = parseCodexApiContextArgs(process.argv.slice(2));
  const logFiles = resolveInputFiles(process.argv.slice(2));
  const logInputs = logFiles.map((logFile) => ({
    logFile,
    records: readJsonLines(logFile),
    manifestFile: workflowManifestFileForLog(logFile),
    manifest: readJsonFile(workflowManifestFileForLog(logFile)),
  }));
  const records = logInputs.flatMap((input) => input.records);
  const knownEndpoints = options.noInventory ? [] : loadKnownEndpoints();
  const context = buildCodexApiContext({ records, knownEndpoints, logInputs }, options);
  writeCodexApiContext(context, options.outputFile, options.jsonOutputFile);
  console.log(`Codex-API-Kontext: ${options.outputFile}`);
  console.log(`Codex-API-Kontext JSON: ${options.jsonOutputFile}`);
  console.log(`Missing Known Endpoints: ${context.summary.missingKnownEndpoints}`);
  console.log(`Coverage: ${formatPercent(context.summary.coveragePercent)} %`);
}

export function parseCodexApiContextArgs(argv: string[]): CodexApiContextOptions {
  const outputFile = path.resolve(valueAfter(argv, "--out") || defaultOutputFile);
  return {
    outputFile,
    jsonOutputFile: path.resolve(valueAfter(argv, "--json-out") || defaultJsonOutputFileFor(outputFile)),
    recordingUrl: valueAfter(argv, "--url") || undefined,
    noInventory: hasFlag(argv, "--no-inventory"),
    top: positiveInteger(valueAfter(argv, "--top"), 30),
  };
}

export function buildCodexApiContext(
  input: CodexApiContextInput,
  options: { generatedAt?: Date | string; recordingUrl?: string; top?: number } = {},
): CodexApiContext {
  const generatedAtDate = normalizedDate(options.generatedAt);
  const generatedAt = generatedAtDate.toISOString();
  const records = input.records || [];
  const knownEndpoints = input.knownEndpoints || [];
  const coverage = buildCoverageReport(knownEndpoints, records, {
    generatedAt: generatedAtDate,
    recordingUrl: options.recordingUrl,
  });
  const observedEndpoints = collectObservedEndpoints(records);
  const uiMap = input.uiMap || (input.logInputs ? buildOmniaUiMap(input.logInputs, {
    generatedAt: generatedAtDate,
    recordingUrl: options.recordingUrl,
  }) : undefined);
  const dataModel = input.dataModel || buildOmniaDataModel(records, { generatedAt: generatedAtDate });
  const knowledge = input.knowledge || buildOmniaKnowledge(records, { generatedAt: generatedAtDate, knownEndpoints });
  const relationships = input.relationships || buildOmniaRelationships(records, { generatedAt: generatedAtDate });
  const top = options.top ?? 30;
  const recordingCommandsByArea = new Map(coverage.recordingPriorities.map((priority) => [priority.area, priority.commands]));

  const missingEndpoints = coverage.missing
    .map((endpoint) => {
      const area = classifyEndpointArea(endpoint.path);
      const relatedObserved = relatedObservedEndpoints(observedEndpoints, area);
      const purpose = endpointPurpose(endpoint.method, endpoint.path, area);
      return {
        key: endpointKey(endpoint),
        method: endpoint.method,
        path: endpoint.path,
        area,
        purpose,
        priority: missingPriority(endpoint.method, endpoint.path, area),
        reason: missingReason(endpoint, area, relatedObserved),
        source: endpoint.source,
        relatedObserved,
        uiHints: uiHintsForArea(uiMap, area),
        dataHints: dataHintsForArea(dataModel, area),
        relationshipHints: relationshipHintsForArea(relationships, area),
        recordingCommands: recordingCommandsByArea.get(area) || [],
      } satisfies CodexMissingEndpoint;
    })
    .sort(compareMissingEndpoints)
    .slice(0, top);

  const focusAreas = [...new Set([
    ...missingEndpoints.slice(0, 8).map((endpoint) => endpoint.area),
    ...knowledge.domains
      .filter((domain) => domain.coverage.missingKnownEndpoints > 0)
      .sort((a, b) => b.coverage.missingKnownEndpoints - a.coverage.missingKnownEndpoints)
      .slice(0, 5)
      .map((domain) => domain.area),
  ])].slice(0, 8);

  const context: CodexApiContext = {
    generatedAt,
    summary: {
      knownEndpoints: coverage.knownCount,
      observedEndpoints: observedEndpoints.length,
      observedKnownEndpoints: coverage.observedKnownCount,
      missingKnownEndpoints: coverage.missing.length,
      coveragePercent: coverage.coveragePercent,
      focusAreas,
    },
    missingEndpoints,
    observedEndpoints: observedEndpoints.slice(0, top),
    codexPrompt: "",
  };
  context.codexPrompt = buildCodexPrompt(context);
  return context;
}

export function buildCodexApiContextMarkdown(context: CodexApiContext): string {
  const lines = [
    "# Codex API Context",
    "",
    `Generiert: ${context.generatedAt}`,
    "",
    "Hinweis: Dieser Report ist ein verdichteter Arbeitskontext fuer Codex. Er enthaelt keine Request-/Response-Rohwerte, sondern nur Methoden, Pfade, Statuscodes, UI-Hinweise, Feldstruktur-Hinweise und Recording-Kommandos.",
    "",
    "## Kurzfassung",
    "",
    `- Bekannte Endpunkte: ${context.summary.knownEndpoints}`,
    `- Beobachtete Endpunkte: ${context.summary.observedEndpoints}`,
    `- Beobachtet aus Inventar: ${context.summary.observedKnownEndpoints}`,
    `- Fehlende bekannte Endpunkte: ${context.summary.missingKnownEndpoints}`,
    `- Coverage: ${formatPercent(context.summary.coveragePercent)} %`,
    `- Fokusbereiche: ${context.summary.focusAreas.join(", ") || "-"}`,
    "",
    "## Codex Prompt",
    "",
    "```text",
    context.codexPrompt,
    "```",
    "",
    "## Priorisierte Fehlende Endpunkte",
    "",
  ];

  if (context.missingEndpoints.length === 0) {
    lines.push("- Keine fehlenden bekannten Endpunkte im Kontext.", "");
  } else {
    for (const endpoint of context.missingEndpoints) {
      lines.push(`### ${endpoint.priority.toUpperCase()} ${endpoint.method} \`${endpoint.path}\``, "");
      lines.push(`- Bereich: ${endpoint.area}`);
      lines.push(`- Vermuteter Zweck: ${endpoint.purpose}`);
      lines.push(`- Warum relevant: ${endpoint.reason}`);
      lines.push(`- Quelle: ${endpoint.source}`);
      lines.push(`- UI-Hinweise: ${endpoint.uiHints.length > 0 ? endpoint.uiHints.map((hint) => `\`${escapeBackticks(hint)}\``).join(", ") : "-"}`);
      lines.push(`- Datenmodell-Hinweise: ${endpoint.dataHints.length > 0 ? endpoint.dataHints.join("; ") : "-"}`);
      lines.push(`- Sequenz-Hinweise: ${endpoint.relationshipHints.length > 0 ? endpoint.relationshipHints.join("; ") : "-"}`);
      lines.push("- Verwandte beobachtete Endpunkte:");
      if (endpoint.relatedObserved.length === 0) {
        lines.push("  - keine");
      } else {
        for (const observed of endpoint.relatedObserved) {
          lines.push(`  - ${observed.method} \`${observed.path}\` (${observed.count}x, ${observed.statuses.join(", ") || "ohne Status"}) - ${observed.purpose}`);
        }
      }
      if (endpoint.recordingCommands.length > 0) {
        lines.push("- Naechster Recording-Befehl:");
        for (const command of endpoint.recordingCommands.slice(0, 2)) {
          lines.push(`  - ${command.label}`);
          lines.push("```bash");
          lines.push(command.command);
          lines.push("```");
        }
      }
      lines.push("");
    }
  }

  lines.push("## Beobachtete Endpunkte Fuer Orientierung", "");
  if (context.observedEndpoints.length === 0) {
    lines.push("- Keine beobachteten API-Endpunkte.", "");
  } else {
    lines.push("| Bereich | Methode | Pfad | Status | Anzahl | Zweck | Schritte |");
    lines.push("|---|---|---|---|---:|---|---|");
    for (const endpoint of context.observedEndpoints) {
      lines.push(`| ${escapeTable(endpoint.area)} | ${endpoint.method} | \`${escapeTable(endpoint.path)}\` | ${endpoint.statuses.join(", ") || "-"} | ${endpoint.count} | ${escapeTable(endpoint.purpose)} | ${endpoint.steps.map(escapeTable).join(", ") || "-"} |`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writeCodexApiContext(
  context: CodexApiContext,
  outputFile = defaultOutputFile,
  jsonOutputFile = defaultJsonOutputFileFor(outputFile),
): { markdownFile: string; jsonFile: string } {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildCodexApiContextMarkdown(context));
  fs.mkdirSync(path.dirname(jsonOutputFile), { recursive: true });
  fs.writeFileSync(jsonOutputFile, `${JSON.stringify(context, null, 2)}\n`);
  return { markdownFile: outputFile, jsonFile: jsonOutputFile };
}

function collectObservedEndpoints(records: Record<string, unknown>[]): CodexObservedEndpoint[] {
  const byKey = new Map<string, ObservedEndpointMutable>();
  for (const record of records) {
    if (record.type !== "response") continue;
    if (!isApiTrafficRecord(record)) continue;
    const method = normalizeMethod(record.method);
    if (!method) continue;
    const pathName = canonicalPath(normalizeObservedPath(parseUrl(String(record.url || "")).pathname));
    const area = classifyEndpointArea(pathName);
    const key = `${method} ${pathName}`;
    const existing = byKey.get(key) || {
      key,
      method,
      path: pathName,
      area,
      purpose: endpointPurpose(method, pathName, area),
      count: 0,
      statuses: [],
      steps: [],
      statusSet: new Set<number>(),
      stepSet: new Set<string>(),
    };
    existing.count += 1;
    const status = Number(record.status || 0);
    if (Number.isInteger(status) && status > 0) existing.statusSet.add(status);
    const step = redactStepLabel(record.step);
    if (step) existing.stepSet.add(step);
    byKey.set(key, existing);
  }
  return [...byKey.values()]
    .map(({ statusSet, stepSet, ...endpoint }) => ({
      ...endpoint,
      statuses: [...statusSet].sort((a, b) => a - b),
      steps: [...stepSet].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area) || a.path.localeCompare(b.path));
}

function relatedObservedEndpoints(observed: CodexObservedEndpoint[], area: string): CodexObservedEndpoint[] {
  return observed
    .filter((endpoint) => endpoint.area === area)
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
    .slice(0, 5);
}

function uiHintsForArea(uiMap: Partial<OmniaUiMap> | undefined, area: string): string[] {
  if (!uiMap) return [];
  const targetHints = (uiMap.targets || [])
    .filter((target: any) => Array.isArray(target.apiAreas) && target.apiAreas.includes(area))
    .map((target: any) => [target.label, target.path].filter(Boolean).join(" @ "))
    .filter(Boolean);
  const surfaceHints = (uiMap.surfaces || [])
    .filter((surface: any) => Array.isArray(surface.apiAreas) && surface.apiAreas.includes(area))
    .map((surface: any) => [surface.title || surface.key, surface.path].filter(Boolean).join(" @ "))
    .filter(Boolean);
  return uniqueStrings([...targetHints, ...surfaceHints]).slice(0, 5);
}

function dataHintsForArea(dataModel: OmniaDataModel | undefined, area: string): string[] {
  if (!dataModel) return [];
  return dataModel.entities
    .filter((entity) => entity.area === area)
    .sort((a, b) => b.sampleCount - a.sampleCount)
    .slice(0, 4)
    .map((entity) => `${entity.name}: ${entity.fields.slice(0, 8).map((field) => field.path).join(", ") || "keine Felder"}`);
}

function relationshipHintsForArea(relationships: OmniaRelationshipMap | undefined, area: string): string[] {
  if (!relationships) return [];
  return relationships.transitions
    .filter((transition) => transition.fromArea === area || transition.toArea === area)
    .slice(0, 4)
    .map((transition) => `${transition.fromArea} -> ${transition.toArea} (${transition.count}x)`);
}

function missingReason(endpoint: KnownEndpoint, area: string, relatedObserved: CodexObservedEndpoint[]): string {
  const relation = relatedObserved.length > 0
    ? `Im Bereich wurden bereits ${relatedObserved.length} verwandte Endpunkte beobachtet; dieser konkrete Pfad fehlt noch.`
    : "Im Bereich fehlt bislang ein direkt verwandter beobachteter Endpunkt.";
  if (endpoint.method === "GET") return `${relation} Ohne GET-Readback fehlen Status, Response-Struktur und UI-Zuordnung.`;
  if (endpoint.method === "POST" && /search|list|position-info/i.test(endpoint.path)) {
    return `${relation} Such-/Info-POSTs sind meist read-like und koennen gefahrlos gezielt aufgenommen werden.`;
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method)) {
    return `${relation} Schreibender Endpoint: nur mit Testobjekt, expliziter Selection und Read-back aufnehmen.`;
  }
  return relation;
}

function missingPriority(method: string, endpointPath: string, area: string): "high" | "medium" | "low" {
  const lowerPath = endpointPath.toLowerCase();
  if (area === "Warenwirtschaft/Bestellung" || area === "Kunden/Vorgaenge") {
    if (/order-proposals|orders|salesprocesses|positions|calculate-prices/.test(lowerPath)) return "high";
  }
  if (method === "GET" || /search|position-info|sums/.test(lowerPath)) return "medium";
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) return "medium";
  return "low";
}

function compareMissingEndpoints(a: CodexMissingEndpoint, b: CodexMissingEndpoint): number {
  const priorityDelta = priorityRank(a.priority) - priorityRank(b.priority);
  return priorityDelta || a.area.localeCompare(b.area) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
}

function priorityRank(priority: "high" | "medium" | "low"): number {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function endpointPurpose(method: string, endpointPath: string, area: string): string {
  const pathName = endpointPath.toLowerCase();
  if (pathName.includes("order-proposals/to-order")) return "Bereitet explizit ausgewaehlte Bestellvorschlaege fuer eine Bestellung vor.";
  if (pathName.includes("orders/from-proposal")) return "Erzeugt eine Bestellung aus explizit ausgewaehlten Bestellvorschlaegen.";
  if (pathName.includes("order-proposals")) return method === "POST" && !pathName.includes("search")
    ? "Legt einen Bestellvorschlag fuer Artikel, Kunde, Vorgang und Lieferant an."
    : "Sucht oder liest Bestellvorschlaege mit Artikel-, Kunden-, Lieferanten- und Mengenbezug.";
  if (pathName.includes("order-arrival")) return "Liest oder bucht Wareneingangsstatus und Wareneingangspositionen.";
  if (pathName.includes("orders") && pathName.includes("positions")) return method === "POST"
    ? "Legt oder aktualisiert Bestellpositionen innerhalb einer Bestellung."
    : "Liest Bestellpositionen, Mengen, Artikelbezug und Wareneingangsstatus.";
  if (pathName.includes("orders")) return method === "POST"
    ? "Erzeugt oder verarbeitet Bestellungen."
    : "Liest Bestellungen, Lieferant, Filiale, Status und Belegkontext.";
  if (pathName.includes("salesprocesses/calculate-prices")) return "Berechnet Preise und Positionen eines Vorgangs vor dem Speichern.";
  if (pathName.includes("salesprocesses") && method === "PUT") return "Speichert ein Vorgangsaggregat inklusive Verkaufs- und Materialpositionen.";
  if (pathName.includes("salesprocesses")) return "Sucht oder liest Vorgaenge mit Kunden-, Status-, Positions- und Filialbezug.";
  if (pathName.includes("customers")) return "Sucht oder liest Kundenstamm, Kontakt-, Adress- und Versicherungskontext.";
  if (pathName.includes("articles") || pathName.includes("article")) return "Sucht oder liest Artikelstamm, Preise, Lieferanten, Bestand oder Muster.";
  if (pathName.includes("export") || pathName.includes("csv")) return "Liefert Exportdaten oder Export-Metadaten.";
  if (/search|simple-search|list/.test(pathName)) return `Sucht oder listet Daten im Bereich ${area}.`;
  if (method === "GET") return `Liest Detail- oder Referenzdaten im Bereich ${area}.`;
  if (["POST", "PUT", "PATCH"].includes(method)) return `Schreibt oder berechnet Daten im Bereich ${area}.`;
  if (method === "DELETE") return `Loescht Daten im Bereich ${area}; nur manuell und nie im Auto-Lauf verwenden.`;
  return `Endpoint im Bereich ${area}.`;
}

function buildCodexPrompt(context: CodexApiContext): string {
  const topMissing = context.missingEndpoints.slice(0, 8).map((endpoint) => `${endpoint.method} ${endpoint.path}`).join(", ");
  return [
    "Nutze diesen API-Kontext als Arbeitsgrundlage.",
    `Priorisiere fehlende Endpunkte in diesen Bereichen: ${context.summary.focusAreas.join(", ") || "keine"}.`,
    `Top fehlende Endpunkte: ${topMissing || "keine"}.`,
    "Plane neue Aufnahmen so, dass jeder fehlende Endpoint einem UI-Ort, einem erwarteten Zweck, einem Request-/Response-Schema und einem sicheren Testobjekt zugeordnet wird.",
    "Bei schreibenden Endpunkten nur mit Max Mustermann/Musterartikel, expliziten IDs, includeAll:false und Read-back arbeiten.",
  ].join("\n");
}

function endpointKey(endpoint: { method: string; path: string }): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function canonicalPath(value: string): string {
  return String(value || "")
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment === "{uuid}" || segment === "{id}" || segment === "[REDACTED]" || /^\{[^}]+\}$/.test(segment)) return "{param}";
      if (/^\d+$/.test(segment)) return "{param}";
      return segment;
    })
    .join("/");
}

function redactStepLabel(value: unknown): string {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  const redacted = redactUiLabel(raw).trim();
  if (!redacted) return "";
  if (redacted.includes("[REDACTED]") && looksLikeUiRowStep(raw)) return "UI-Zeile [REDACTED]";
  return redacted;
}

function looksLikeUiRowStep(value: string): boolean {
  return /^\d+[\.)]\s+/.test(value) || /\d{3,}/.test(value);
}

function normalizeMethod(value: unknown): string {
  const method = String(value || "").trim().toUpperCase();
  return /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method) ? method : "";
}

function parseUrl(url: string): URL {
  try {
    return new URL(url, "https://api2.optica-omnia.de");
  } catch {
    return new URL("https://api2.optica-omnia.de");
  }
}

function resolveInputFiles(argv: string[]): string[] {
  const explicit = argv.filter((arg) => arg.endsWith(".jsonl"));
  if (explicit.length > 0) return explicit.map((file) => path.resolve(file)).filter((file) => fs.existsSync(file));

  const logDir = path.join(workspaceRoot, "logs", "network");
  if (!fs.existsSync(logDir)) return [];
  return fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(logDir, file))
    .sort();
}

function workflowManifestFileForLog(logFile: string): string {
  const basename = path.basename(logFile).replace(/\.jsonl$/, "");
  const recordingsDir = path.join(workspaceRoot, "docs", "recordings");
  const candidate = path.join(recordingsDir, `${basename.replace(/-workflow$/, "")}-workflow-manifest.json`);
  return fs.existsSync(candidate) ? candidate : "";
}

function readJsonLines(file: string): Record<string, unknown>[] {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "parse-error" };
      }
    });
}

function readJsonFile(file: string): unknown {
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function valueAfter(argv: string[], flag: string): string {
  const index = argv.indexOf(flag);
  if (index < 0) return "";
  return argv[index + 1] || "";
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function positiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizedDate(value: Date | string | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function defaultJsonOutputFileFor(outputFile: string): string {
  if (path.resolve(outputFile) === path.resolve(defaultOutputFile)) return defaultJsonOutputFile;
  return outputFile.replace(/\.md$/i, ".json");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function escapeBackticks(value: string): string {
  return String(value).replace(/`/g, "\\`");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
