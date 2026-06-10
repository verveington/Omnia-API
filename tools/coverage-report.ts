import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import {
  recordingWorkflowBaseArgs,
  type RecordingCommandTargetOptions,
} from "./recording-command.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultTokenResolutionFile = path.join(workspaceRoot, "tmp", "api2-token-resolution.json");
const defaultBackendPathFile = path.join(workspaceRoot, "docs", "api2-backend-paths.md");
const defaultOutputFile = path.join(workspaceRoot, "docs", "08_api_coverage_report.md");

export type KnownEndpoint = {
  method: string;
  path: string;
  source: string;
};

export type ObservedEndpoint = {
  method: string;
  path: string;
  statuses: Set<number>;
  count: number;
};

export type RecordingCommand = {
  label: string;
  mode: "auto" | "manual";
  command: string;
  args: string[];
};

export type RecordingPriority = {
  area: string;
  reason: string;
  examples: KnownEndpoint[];
  commands: RecordingCommand[];
};

export type CoverageReport = {
  generatedAt: string;
  knownCount: number;
  observedCount: number;
  observedKnownCount: number;
  coveragePercent: number;
  known: KnownEndpoint[];
  observed: ObservedEndpoint[];
  missing: KnownEndpoint[];
  observedUnknown: ObservedEndpoint[];
  missingByArea: Array<{ area: string; count: number; examples: KnownEndpoint[] }>;
  recordingPriorities: RecordingPriority[];
};

if (isMainModule()) {
  const args = process.argv.slice(2);
  const outputFile = valueAfter(args, "--out") || defaultOutputFile;
  const known = loadKnownEndpoints({
    tokenResolutionFile: valueAfter(args, "--token-resolution") || defaultTokenResolutionFile,
    backendPathFile: valueAfter(args, "--backend-paths") || defaultBackendPathFile,
  });
  const records = resolveInputFiles(args).flatMap(readJsonLines);
  const report = buildCoverageReport(known, records);
  writeCoverageReport(report, outputFile);
  console.log(`API-Coverage-Report: ${outputFile}`);
  console.log(`Bekannte Endpunkte: ${report.knownCount}`);
  console.log(`Beobachtet aus bekanntem Inventar: ${report.observedKnownCount}`);
  console.log(`Coverage: ${formatPercent(report.coveragePercent)} %`);
}

export function loadKnownEndpoints(options: { tokenResolutionFile?: string; backendPathFile?: string } = {}): KnownEndpoint[] {
  return dedupeKnownEndpoints([
    ...parseTokenResolution(readJsonFile(options.tokenResolutionFile || defaultTokenResolutionFile)),
    ...parseBackendPathMarkdown(readTextFile(options.backendPathFile || defaultBackendPathFile)),
  ]);
}

export function parseTokenResolution(value: unknown): KnownEndpoint[] {
  const endpoints: KnownEndpoint[] = [];
  const root = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  for (const entries of Object.values(root)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const record = asRecord(entry);
      const method = normalizeMethod(record.method);
      const endpointPath = normalizeDisplayPath(String(record.path || ""));
      if (!method || !endpointPath) continue;
      endpoints.push({ method, path: endpointPath, source: "tmp/api2-token-resolution.json" });
    }
  }

  return dedupeKnownEndpoints(endpoints);
}

export function parseBackendPathMarkdown(markdown: string): KnownEndpoint[] {
  const endpoints: KnownEndpoint[] = [];
  const lineRe = /^-\s+`([A-Z ]+)`\s+`([^`]+)`/gm;
  for (const match of markdown.matchAll(lineRe)) {
    const methods = match[1].trim().split(/\s+/).map(normalizeMethod).filter(Boolean);
    const endpointPath = normalizeDisplayPath(match[2]);
    if (!endpointPath) continue;
    for (const method of methods) {
      endpoints.push({ method, path: endpointPath, source: "docs/api2-backend-paths.md" });
    }
  }
  return dedupeKnownEndpoints(endpoints);
}

export function buildCoverageReport(
  knownInput: KnownEndpoint[],
  records: Record<string, unknown>[],
  options: { generatedAt?: Date } & RecordingCommandTargetOptions = {},
): CoverageReport {
  const known = dedupeKnownEndpoints(knownInput).sort(compareKnownEndpoints);
  const observed = collectObservedEndpoints(records);
  const observedKnownKeys = new Set<string>();
  const missing: KnownEndpoint[] = [];

  for (const endpoint of known) {
    const matched = observed.some((item) => endpointsMatch(endpoint, item));
    if (matched) {
      observedKnownKeys.add(endpointKey(endpoint));
    } else {
      missing.push(endpoint);
    }
  }

  const observedUnknown = observed.filter((item) => !known.some((endpoint) => endpointsMatch(endpoint, item)));
  const observedKnownCount = observedKnownKeys.size;
  const coveragePercent = known.length === 0 ? 0 : roundPercent((observedKnownCount / known.length) * 100);
  const missingByArea = groupMissingByArea(missing);

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    knownCount: known.length,
    observedCount: observed.length,
    observedKnownCount,
    coveragePercent,
    known,
    observed,
    missing,
    observedUnknown,
    missingByArea,
    recordingPriorities: buildRecordingPriorities(missingByArea, options),
  };
}

export function buildCoverageReportMarkdown(report: CoverageReport): string {
  const lines = [
    "# API-Coverage-Report",
    "",
    `Generiert: ${report.generatedAt}`,
    "",
    "Hinweis: Der Report vergleicht statisch bekannte Frontend-Pfade mit redacted JSONL-Aufzeichnungen. Gateway-Aliasse wie `/apigateway/kunden/customers/search` werden ueber den statischen Suffix `/customers/search` abgeglichen.",
    "",
    "## Zusammenfassung",
    "",
    `- Bekannte Endpunkte: ${report.knownCount}`,
    `- Beobachtete API-Endpunkte: ${report.observedCount}`,
    `- Beobachtet aus bekanntem Inventar: ${report.observedKnownCount}`,
    `- Coverage: ${formatPercent(report.coveragePercent)} %`,
    `- Fehlende bekannte Endpunkte: ${report.missing.length}`,
    `- Beobachtete, nicht statisch erkannte Endpunkte: ${report.observedUnknown.length}`,
    "",
    "## Naechste Recording-Prioritaeten",
    "",
  ];

  if (report.recordingPriorities.length === 0) {
    lines.push("- Keine offenen Prioritaeten aus dem statischen Inventar ableitbar.", "");
  } else {
    for (const priority of report.recordingPriorities) {
      lines.push(`### ${priority.area}`, "");
      lines.push(`- Grund: ${priority.reason}`);
      lines.push("- Beispiele:");
      for (const endpoint of priority.examples) {
        lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
      }
      if (priority.commands.length > 0) {
        lines.push("- Empfohlener Recording-Befehl:");
        for (const command of priority.commands) {
          lines.push(`  - ${command.label}`);
          lines.push("```bash");
          lines.push(command.command);
          lines.push("```");
        }
      }
      lines.push("");
    }
  }

  lines.push("## Fehlende Endpunkte Nach Bereich", "");
  if (report.missingByArea.length === 0) {
    lines.push("- Keine fehlenden bekannten Endpunkte.", "");
  } else {
    lines.push("| Bereich | Fehlend | Beispiele |");
    lines.push("|---|---:|---|");
    for (const group of report.missingByArea) {
      lines.push(
        `| ${escapeTable(group.area)} | ${group.count} | ${group.examples.map((endpoint) => `${endpoint.method} \`${endpoint.path}\``).join("<br>")} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Beobachtete Nicht-Inventar-Endpunkte", "");
  if (report.observedUnknown.length === 0) {
    lines.push("- Keine.", "");
  } else {
    for (const endpoint of report.observedUnknown.slice(0, 50)) {
      lines.push(`- ${endpoint.method} \`${endpoint.path}\` (${[...endpoint.statuses].sort((a, b) => a - b).join(", ") || "ohne Status"}, ${endpoint.count}x)`);
    }
    if (report.observedUnknown.length > 50) lines.push(`- ... ${report.observedUnknown.length - 50} weitere`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writeCoverageReport(report: CoverageReport, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildCoverageReportMarkdown(report));
  return outputFile;
}

function collectObservedEndpoints(records: Record<string, unknown>[]): ObservedEndpoint[] {
  const groups = new Map<string, ObservedEndpoint>();
  for (const record of records) {
    if (record.type !== "response") continue;
    if (!isApiTrafficRecord(record)) continue;
    const url = parseUrl(String(record.url || ""));
    const method = normalizeMethod(record.method);
    if (!method) continue;
    const endpointPath = normalizeDisplayPath(normalizeObservedPath(url.pathname));
    const key = `${method} ${endpointPath}`;
    const group = groups.get(key) || { method, path: endpointPath, statuses: new Set<number>(), count: 0 };
    const status = Number(record.status || 0);
    if (Number.isInteger(status) && status > 0) group.statuses.add(status);
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()].sort(compareObservedEndpoints);
}

function endpointsMatch(known: KnownEndpoint, observed: ObservedEndpoint): boolean {
  if (known.method !== observed.method) return false;
  const knownSegments = pathSegments(known.path);
  const observedSegments = pathSegments(observed.path);
  if (knownSegments.length === 0 || observedSegments.length === 0) return false;

  for (let start = 0; start <= observedSegments.length - knownSegments.length; start += 1) {
    let ok = true;
    for (let index = 0; index < knownSegments.length; index += 1) {
      if (!segmentsMatch(knownSegments[index], observedSegments[start + index])) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  return false;
}

function segmentsMatch(known: string, observed: string): boolean {
  if (known === "{param}") return observed === "{param}";
  return known === observed;
}

function groupMissingByArea(missing: KnownEndpoint[]): Array<{ area: string; count: number; examples: KnownEndpoint[] }> {
  const groups = new Map<string, KnownEndpoint[]>();
  for (const endpoint of missing) {
    const area = inferArea(endpoint.path);
    const items = groups.get(area) || [];
    items.push(endpoint);
    groups.set(area, items);
  }

  return [...groups.entries()]
    .map(([area, items]) => ({
      area,
      count: items.length,
      examples: items.sort(compareKnownEndpoints).slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area));
}

function buildRecordingPriorities(
  missingByArea: Array<{ area: string; count: number; examples: KnownEndpoint[] }>,
  options: RecordingCommandTargetOptions = {},
): RecordingPriority[] {
  return missingByArea.slice(0, 10).map((group) => ({
    area: group.area,
    reason: recordingReason(group.area, group.count),
    examples: group.examples,
    commands: recordingCommands(group.area, group.examples, options),
  }));
}

function recordingCommands(area: string, examples: KnownEndpoint[], options: RecordingCommandTargetOptions = {}): RecordingCommand[] {
  const profile = recordingProfile(area);
  const mode = profile.startPath ? "auto" : "manual";
  const args = [
    ...recordingWorkflowBaseArgs(mode, options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
  ];

  if (mode === "auto") {
    args.push("--max-steps", "180", "--max-minutes", "20");
  }
  if (profile.startPath) {
    args.push("--start-path", profile.startPath);
  }
  if (mode === "manual" && profile.steps.length > 0) {
    args.push("--steps", profile.steps.join(","));
  }
  for (const endpoint of expectedEndpointCandidates(examples, mode).slice(0, 3)) {
    args.push("--expect-endpoint", `${endpoint.method} ${endpoint.path}`);
  }

  return [
    {
      label: profile.label,
      mode,
      command: formatNodeCommand(args),
      args,
    },
  ];
}

function expectedEndpointCandidates(examples: KnownEndpoint[], mode: "auto" | "manual"): KnownEndpoint[] {
  if (mode === "manual") return examples;
  return examples.filter(isSafeExpectedEndpointForAuto);
}

function isSafeExpectedEndpointForAuto(endpoint: KnownEndpoint): boolean {
  const method = endpoint.method.toUpperCase();
  const lowerPath = endpoint.path.toLowerCase();
  if (method === "GET" || method === "HEAD") return true;
  if (method !== "POST") return false;
  return /(?:^|\/)(search|list|simple-search|extended\/search|csv|export|pdf-export|validation|position-info)(?:\/|$)/.test(lowerPath);
}

function recordingProfile(area: string): { label: string; startPath?: string; steps: string[] } {
  if (area === "Kunden/Vorgaenge") {
    return {
      label: "Kundenstamm und Vorgangsdetails aufnehmen",
      startPath: "/master-data/customers",
      steps: ["Stammdaten Kunden oeffnen", "Max Mustermann suchen", "Kundendetail oeffnen", "Adressen, Kostentraeger und Vorgaenge pruefen"],
    };
  }
  if (area === "Artikel/Warenbestand") {
    return {
      label: "Artikelverwaltung mit Musterartikel aufnehmen",
      startPath: "/merchandise-management/article-management/articles",
      steps: ["Artikelverwaltung oeffnen", "Musterartikel suchen", "Artikeldetail oeffnen", "Preis-, Lager- und Wawi-Kontext pruefen"],
    };
  }
  if (area === "Warenwirtschaft/Bestellung") {
    return {
      label: "Wawi-Bestellvorschlaege read-only aufnehmen",
      startPath: "/merchandise-management/order-management/order-proposals",
      steps: ["Bestellvorschlaege oeffnen", "Max Mustermann und Musterartikel filtern", "Vorschlag, Bestellung und Wareneingang nur lesend pruefen"],
    };
  }
  if (area === "Abrechnung/Kasse") {
    return {
      label: "Abrechnung und Kasse aufnehmen",
      startPath: "/accounting/payment-terms",
      steps: ["Abrechnung oeffnen", "Zahlungsbedingungen, Rechnungen und Kasse lesen", "Keine Buchung abschliessen"],
    };
  }
  if (area === "Touren/Routenplanung") {
    return {
      label: "Routenplanung und Exportpfade aufnehmen",
      startPath: "/route-planning",
      steps: ["Routenplanung oeffnen", "Vorhandene Tour lesen", "Export vorbereiten und abbrechen, falls Download extern blockiert"],
    };
  }
  if (area === "Dokumente/Archiv") {
    return {
      label: "Dokumente und Archiv manuell aufnehmen",
      steps: ["Dokumentbereich oeffnen", "Vorhandenes Testdokument anzeigen", "Druck oder PDF nur vorbereiten"],
    };
  }
  if (area === "Kommunikation/Aufgaben") {
    return {
      label: "Kommunikation und Aufgaben manuell aufnehmen",
      steps: ["Aufgaben oder Mailbereich oeffnen", "Vorhandene Testobjekte lesen", "Keine externe Nachricht senden"],
    };
  }
  if (area === "User/Workspace") {
    return {
      label: "Workspace- und User-Kontext aufnehmen",
      steps: ["Workspace- und Benutzerbereich oeffnen", "Mandant, Rechte und Feature-Toggles lesen"],
    };
  }
  return {
    label: `${area} manuell aufnehmen`,
    steps: [`Bereich ${area} oeffnen`, "Listen, Suche und Detailansichten lesen", "Keine Schreibaktion ausfuehren"],
  };
}

function recordingReason(area: string, count: number): string {
  if (area === "Warenwirtschaft/Bestellung") return `${count} fehlende Wawi-Endpunkte; gezielt Bestellvorschlaege, Bestellungen, Lager und Wareneingang aufzeichnen.`;
  if (area === "Kunden/Vorgaenge") return `${count} fehlende Kunden-/Vorgangs-Endpunkte; Kundenstamm, Vorgangssuche und Detailseiten aufnehmen.`;
  if (area === "Artikel/Warenbestand") return `${count} fehlende Artikel-/Bestands-Endpunkte; Artikelsuche, Details, Preis- und Lagerdaten aufnehmen.`;
  if (area === "Abrechnung/Kasse") return `${count} fehlende Abrechnungs-Endpunkte; Rechnung, Sammelrechnung, Kasse und Zahlungsflows aufnehmen.`;
  if (area === "Dokumente/Archiv") return `${count} fehlende Dokument-Endpunkte; Dokumentanzeige, Archiv, Druck/PDF und Dateizugriffe aufnehmen.`;
  if (area === "Kommunikation/Aufgaben") return `${count} fehlende Kommunikations-Endpunkte; Mail, Reminder, Aufgaben und Benachrichtigungen aufnehmen.`;
  if (area === "Touren/Routenplanung") return `${count} fehlende Routen-Endpunkte; Tourenplanung und Exportpfade aufnehmen.`;
  return `${count} fehlende Endpunkte; diesen Bereich in einer eigenen Aufnahme erkunden.`;
}

export function classifyEndpointArea(endpointPath: string): string {
  return inferArea(endpointPath);
}

function inferArea(endpointPath: string): string {
  const segments = pathSegments(endpointPath);
  const first = firstDomainSegment(segments) || segments[0] || "unknown";
  if (["auth", "identity", "oauth", "oauth2", "connect", "realms"].includes(first)) return "Auth/Identity";
  if (["orders", "order-proposals", "order-arrival", "order-states", "stock-items", "storage-locations", "suppliers", "delivery-terms", "cost-centers"].includes(first)) {
    return "Warenwirtschaft/Bestellung";
  }
  if (["customers", "salesprocesses", "sales-positions", "cost-estimates", "kostentraeger", "recommendations", "status", "art"].includes(first)) return "Kunden/Vorgaenge";
  if (["articles", "article", "article-kits", "bits-articles", "calculation-rules-pzn", "producers", "label-configurations"].includes(first)) return "Artikel/Warenbestand";
  if (["collective-invoices", "invoices", "cash-books", "cash-book-entries", "payment-terms", "bons", "datev", "material-groups", "vatrates"].includes(first)) return "Abrechnung/Kasse";
  if (["documents", "document", "stored-documents", "archive-documents", "file-archive", "formulare", "forms", "print"].includes(first)) return "Dokumente/Archiv";
  if (["mails", "mail", "reminders", "tasks", "notifications", "communicator"].includes(first)) return "Kommunikation/Aufgaben";
  if (["route-plannings", "routes"].includes(first)) return "Touren/Routenplanung";
  if (["filialen", "companies", "departments"].includes(first)) return "Filialen/Mandant";
  if (["hilfsmittel"].includes(first)) return "Hilfsmittel";
  if (["countries", "enums"].includes(first)) return "Referenzdaten";
  if (["users", "user", "user-details", "workspaces", "feature-toggles", "metrics", "navigations"].includes(first)) return "User/Workspace";
  return first;
}

function firstDomainSegment(segments: string[]): string {
  const knownRoots = new Set([
    "archive-documents",
    "article",
    "article-kits",
    "articles",
    "auth",
    "bits-articles",
    "bons",
    "calculation-rules-pzn",
    "cash-book-entries",
    "cash-books",
    "collective-invoices",
    "connect",
    "cost-centers",
    "cost-estimates",
    "customers",
    "datev",
    "delivery-terms",
    "document",
    "documents",
    "dv-data",
    "feature-toggles",
    "file-archive",
    "filialen",
    "formulare",
    "forms",
    "companies",
    "countries",
    "departments",
    "identity",
    "invoices",
    "enums",
    "hilfsmittel",
    "label-configurations",
    "art",
    "kostentraeger",
    "mail",
    "mails",
    "material-groups",
    "metrics",
    "navigations",
    "notifications",
    "oauth",
    "oauth2",
    "order-arrival",
    "order-proposals",
    "order-states",
    "orders",
    "payment-terms",
    "print",
    "producers",
    "realms",
    "recommendations",
    "reminders",
    "route-plannings",
    "routes",
    "sales-positions",
    "salesprocesses",
    "status",
    "stock-items",
    "storage-locations",
    "stored-documents",
    "suppliers",
    "tasks",
    "user",
    "user-details",
    "users",
    "vatrates",
    "workspaces",
  ]);
  return segments.find((segment) => knownRoots.has(segment)) || "";
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

function dedupeKnownEndpoints(endpoints: KnownEndpoint[]): KnownEndpoint[] {
  const byKey = new Map<string, KnownEndpoint>();
  for (const endpoint of endpoints) {
    const method = normalizeMethod(endpoint.method);
    const endpointPath = normalizeDisplayPath(endpoint.path);
    if (!method || !endpointPath) continue;
    const key = `${method} ${canonicalPathTemplate(endpointPath)}`;
    const existing = byKey.get(key);
    byKey.set(key, {
      method,
      path: endpointPath,
      source: existing ? mergeSource(existing.source, endpoint.source) : endpoint.source,
    });
  }
  return [...byKey.values()].sort(compareKnownEndpoints);
}

function mergeSource(left: string, right: string): string {
  return [...new Set([left, right].flatMap((value) => value.split(", ")).filter(Boolean))].sort().join(", ");
}

function endpointKey(endpoint: { method: string; path: string }): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function normalizeMethod(value: unknown): string {
  const method = String(value || "").trim().toUpperCase();
  return /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method) ? method : "";
}

function normalizeDisplayPath(value: string): string {
  const clean = String(value || "").trim();
  if (!clean.startsWith("/")) return "";
  return clean;
}

function canonicalPathTemplate(value: string): string {
  const clean = normalizeDisplayPath(value);
  if (!clean) return "";
  return clean
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment === "[REDACTED]" || segment === "%5BREDACTED%5D") return "{param}";
      if (/^\{[^}]+\}$/.test(segment)) return "{param}";
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return "{param}";
      if (/^\d+$/.test(segment)) return "{param}";
      return segment;
    })
    .join("/");
}

function pathSegments(value: string): string[] {
  return canonicalPathTemplate(value).split("/").filter(Boolean);
}

function compareKnownEndpoints(a: KnownEndpoint, b: KnownEndpoint): number {
  return a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
}

function compareObservedEndpoints(a: ObservedEndpoint, b: ObservedEndpoint): number {
  return a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function readTextFile(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, "\\|");
}

function formatNodeCommand(args: string[]): string {
  return ["node", ...args].map((arg) => (needsShellQuote(arg) ? shellQuote(arg) : arg)).join(" ");
}

function needsShellQuote(value: string): boolean {
  return value.startsWith("/") || /[\s"'`$\\,]/.test(value);
}

function shellQuote(value: string): string {
  return `"${String(value).replace(/(["\\$`])/g, "\\$1")}"`;
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? path.resolve(argv[index + 1]) : null;
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
