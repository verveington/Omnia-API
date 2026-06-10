import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCoverageReport,
  loadKnownEndpoints,
  type KnownEndpoint,
  type ObservedEndpoint,
} from "./coverage-report.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "15_focus_module_coverage.md");

export type FocusModuleId = "stammdaten" | "vorgaenge" | "warenwirtschaft";

export type FocusModuleCoverage = {
  id: FocusModuleId;
  label: string;
  knownCount: number;
  observedKnownCount: number;
  missingCount: number;
  coveragePercent: number;
  missingReadCount: number;
  missingWriteCount: number;
  observedEndpointCount: number;
  observedStatuses: number[];
  missingExamples: KnownEndpoint[];
  missingReadExamples: KnownEndpoint[];
  missingWriteExamples: KnownEndpoint[];
  observedExamples: ObservedEndpoint[];
};

export type FocusCoverageReport = {
  generatedAt: string;
  since?: string;
  inputFileCount: number;
  totals: {
    known: number;
    observedKnown: number;
    missing: number;
    coveragePercent: number;
    missingRead: number;
    missingWrite: number;
  };
  modules: Record<FocusModuleId, FocusModuleCoverage>;
};

const focusModuleOrder: FocusModuleId[] = ["stammdaten", "vorgaenge", "warenwirtschaft"];

const focusModuleLabels: Record<FocusModuleId, string> = {
  stammdaten: "Stammdaten",
  vorgaenge: "Vorgaenge",
  warenwirtschaft: "Warenwirtschaft",
};

const focusRoots: Record<FocusModuleId, Set<string>> = {
  stammdaten: new Set([
    "aerzte",
    "arzt",
    "contacts",
    "customers",
    "kostentraeger",
    "recommendations",
  ]),
  vorgaenge: new Set([
    "art",
    "cost-estimates",
    "dv-data",
    "ekv",
    "hilfsmittel",
    "sales-positions",
    "salesprocesses",
    "status",
  ]),
  warenwirtschaft: new Set([
    "article",
    "article-kits",
    "articles",
    "bits-articles",
    "calculation-rules-pzn",
    "cost-centers",
    "delivery-terms",
    "inventurbewertung",
    "label-configurations",
    "order-arrival",
    "order-arrival-protocol",
    "order-proposals",
    "order-states",
    "orders",
    "producers",
    "stock-bookings",
    "stock-items",
    "stocktaking-articles",
    "stocktaking-lists",
    "stocktaking-logs",
    "storage-locations",
    "suppliers",
  ]),
};

if (isMainModule()) {
  const args = process.argv.slice(2);
  const outputFile = valueAfter(args, "--out") || defaultOutputFile;
  const since = valueAfterRaw(args, "--since") || undefined;
  const inputFiles = resolveInputFiles(args);
  const records = inputFiles.flatMap(readJsonLines);
  const report = buildFocusModuleCoverage(loadKnownEndpoints(), records, {
    generatedAt: new Date(),
    since,
    inputFileCount: inputFiles.length,
  });
  writeFocusModuleCoverage(report, outputFile);
  console.log(`Fokus-Coverage-Report: ${outputFile}`);
  console.log(`Input-JSONL-Dateien: ${inputFiles.length}`);
  console.log(`Bekannte Fokus-Endpunkte: ${report.totals.known}`);
  console.log(`Beobachtet: ${report.totals.observedKnown}`);
  console.log(`Coverage: ${formatPercent(report.totals.coveragePercent)} %`);
}

export function buildFocusModuleCoverage(
  knownInput: KnownEndpoint[],
  recordsInput: Record<string, unknown>[],
  options: { generatedAt?: Date; since?: string; inputFileCount?: number } = {},
): FocusCoverageReport {
  const records = filterRecordsSince(recordsInput, options.since);
  const baseReport = buildCoverageReport(knownInput, records, { generatedAt: options.generatedAt });
  const missingKeys = new Set(baseReport.missing.map(endpointKey));
  const modules = Object.fromEntries(
    focusModuleOrder.map((id) => {
      const known = baseReport.known.filter((endpoint) => classifyFocusModule(endpoint.path) === id);
      const missing = known.filter((endpoint) => missingKeys.has(endpointKey(endpoint))).sort(compareEndpoints);
      const observed = baseReport.observed.filter((endpoint) => classifyFocusModule(endpoint.path) === id);
      const observedKnownCount = known.length - missing.length;
      const missingRead = missing.filter((endpoint) => !isWriteEndpoint(endpoint));
      const missingWrite = missing.filter(isWriteEndpoint);
      const statuses = uniqueSortedNumbers(observed.flatMap((endpoint) => [...endpoint.statuses]));
      return [
        id,
        {
          id,
          label: focusModuleLabels[id],
          knownCount: known.length,
          observedKnownCount,
          missingCount: missing.length,
          coveragePercent: known.length === 0 ? 0 : roundPercent((observedKnownCount / known.length) * 100),
          missingReadCount: missingRead.length,
          missingWriteCount: missingWrite.length,
          observedEndpointCount: observed.length,
          observedStatuses: statuses,
          missingExamples: missing.slice(0, 12),
          missingReadExamples: missingRead.slice(0, 12),
          missingWriteExamples: missingWrite.slice(0, 12),
          observedExamples: observed.slice(0, 12),
        },
      ];
    }),
  ) as Record<FocusModuleId, FocusModuleCoverage>;

  const totalKnown = sumModules(modules, "knownCount");
  const totalObservedKnown = sumModules(modules, "observedKnownCount");
  const totalMissing = sumModules(modules, "missingCount");

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    since: options.since,
    inputFileCount: options.inputFileCount ?? 0,
    totals: {
      known: totalKnown,
      observedKnown: totalObservedKnown,
      missing: totalMissing,
      coveragePercent: totalKnown === 0 ? 0 : roundPercent((totalObservedKnown / totalKnown) * 100),
      missingRead: sumModules(modules, "missingReadCount"),
      missingWrite: sumModules(modules, "missingWriteCount"),
    },
    modules,
  };
}

export function classifyFocusModule(endpointPath: string): FocusModuleId | null {
  const segments = pathSegments(endpointPath);
  for (const segment of segments) {
    for (const moduleId of focusModuleOrder) {
      if (focusRoots[moduleId].has(segment)) return moduleId;
    }
  }
  return null;
}

export function isWriteEndpoint(endpoint: Pick<KnownEndpoint, "method" | "path">): boolean {
  const method = endpoint.method.toUpperCase();
  if (method === "PUT" || method === "PATCH" || method === "DELETE") return true;
  if (method !== "POST") return false;
  return !isReadLikePostPath(endpoint.path);
}

export function buildFocusModuleCoverageMarkdown(report: FocusCoverageReport): string {
  const lines = [
    "# Fokus-Coverage: Stammdaten, Vorgaenge, Warenwirtschaft",
    "",
    `Generiert: ${report.generatedAt}`,
    `Input-JSONL-Dateien: ${report.inputFileCount}`,
  ];
  if (report.since) lines.push(`Record-Filter ab: ${report.since}`);
  lines.push(
    "",
    "Hinweis: Der Report betrachtet nur die drei aktuell freigeschalteten Hauptmodule. Endpunkte aus frueheren Aufnahmen werden nur beruecksichtigt, wenn sie in den gelesenen JSONL-Dateien enthalten sind. Mit `--since YYYY-MM-DD` kann ein frischer Testuser-Zeitraum isoliert werden.",
    "",
    "## Zusammenfassung",
    "",
    `- Bekannte Fokus-Endpunkte: ${report.totals.known}`,
    `- Beobachtet aus bekanntem Inventar: ${report.totals.observedKnown}`,
    `- Coverage: ${formatPercent(report.totals.coveragePercent)} %`,
    `- Fehlend: ${report.totals.missing}`,
    `- Fehlende Read-like Endpunkte: ${report.totals.missingRead}`,
    `- Fehlende Write-Endpunkte: ${report.totals.missingWrite}`,
    "",
    "| Modul | Bekannt | Beobachtet | Coverage | Fehlend | Read-like offen | Write offen | Statuscodes |",
    "|---|---:|---:|---:|---:|---:|---:|---|",
  );

  for (const moduleId of focusModuleOrder) {
    const module = report.modules[moduleId];
    lines.push(
      `| ${module.label} | ${module.knownCount} | ${module.observedKnownCount} | ${formatPercent(module.coveragePercent)} % | ${module.missingCount} | ${module.missingReadCount} | ${module.missingWriteCount} | ${module.observedStatuses.join(", ") || "-"} |`,
    );
  }

  lines.push("", "## Fehlende Endpunkte Je Modul", "");
  for (const moduleId of focusModuleOrder) {
    const module = report.modules[moduleId];
    lines.push(`### ${module.label}`, "");
    lines.push(`- Beobachtete API-Endpunkte im Modul: ${module.observedEndpointCount}`);
    lines.push(`- Fehlende Read-like Endpunkte: ${module.missingReadCount}`);
    appendEndpointList(lines, module.missingReadExamples, 12);
    lines.push(`- Fehlende Write-Endpunkte: ${module.missingWriteCount}`);
    appendEndpointList(lines, module.missingWriteExamples, 12);
    lines.push("");
  }

  lines.push("## Naechste Recording-Kommandos", "");
  for (const moduleId of focusModuleOrder) {
    const module = report.modules[moduleId];
    const command = recordingCommandForModule(module);
    lines.push(`### ${module.label}`, "");
    lines.push("```bash");
    lines.push(command);
    lines.push("```", "");
  }

  lines.push("## Beobachtete Beispiele", "");
  for (const moduleId of focusModuleOrder) {
    const module = report.modules[moduleId];
    lines.push(`### ${module.label}`, "");
    appendObservedList(lines, module.observedExamples, 12);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writeFocusModuleCoverage(report: FocusCoverageReport, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildFocusModuleCoverageMarkdown(report));
  return outputFile;
}

function appendEndpointList(lines: string[], endpoints: KnownEndpoint[], limit: number): void {
  if (endpoints.length === 0) {
    lines.push("  - Keine.");
    return;
  }
  for (const endpoint of endpoints.slice(0, limit)) {
    lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
  }
}

function appendObservedList(lines: string[], endpoints: ObservedEndpoint[], limit: number): void {
  if (endpoints.length === 0) {
    lines.push("- Keine.");
    return;
  }
  for (const endpoint of endpoints.slice(0, limit)) {
    const statuses = [...endpoint.statuses].sort((a, b) => a - b).join(", ") || "ohne Status";
    lines.push(`- ${endpoint.method} \`${endpoint.path}\` (${statuses}, ${endpoint.count}x)`);
  }
}

function recordingCommandForModule(module: FocusModuleCoverage): string {
  const base = [
    "node",
    "tools/recording-workflow.ts",
    "--mode",
    "auto",
    "--url",
    "https://api2.optica-omnia.de",
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--max-steps",
    "220",
    "--max-minutes",
    "25",
  ];
  if (module.id === "stammdaten") {
    base.push("--start-path", "/master-data/customers", "--test-customer", "Max Mustermann");
  } else if (module.id === "vorgaenge") {
    base.push("--start-path", "/transactions/list", "--test-customer", "Max Mustermann");
  } else {
    base.push("--start-path", "/merchandise-management/order-management/order-proposals", "--test-customer", "Max Mustermann", "--test-article", "Musterartikel");
  }
  for (const endpoint of module.missingReadExamples.filter((item) => !isWriteEndpoint(item)).slice(0, 3)) {
    base.push("--expect-endpoint", `${endpoint.method} ${endpoint.path}`);
  }
  return base.map(shellArg).join(" ");
}

function filterRecordsSince(records: Record<string, unknown>[], since?: string): Record<string, unknown>[] {
  if (!since) return records;
  const sinceMs = Date.parse(since);
  if (!Number.isFinite(sinceMs)) return records;
  return records.filter((record) => {
    const timestampMs = Date.parse(String(record.timestamp || ""));
    return Number.isFinite(timestampMs) && timestampMs >= sinceMs;
  });
}

function isReadLikePostPath(endpointPath: string): boolean {
  return /(?:^|\/)(search|simple-search|list|sums|count|counts|csv|export|pdf|pdf-export|validation|position-info|preview|available|check)(?:\/|$)/i.test(endpointPath);
}

function pathSegments(value: string): string[] {
  return String(value || "")
    .split(/[?#]/)[0]
    .split("/")
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean)
    .map((segment) => segment.replace(/^%5bredacted%5d$/i, "[redacted]"));
}

function endpointKey(endpoint: Pick<KnownEndpoint, "method" | "path">): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function compareEndpoints(a: KnownEndpoint, b: KnownEndpoint): number {
  return a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
}

function sumModules(modules: Record<FocusModuleId, FocusModuleCoverage>, key: keyof Pick<FocusModuleCoverage, "knownCount" | "observedKnownCount" | "missingCount" | "missingReadCount" | "missingWriteCount">): number {
  return focusModuleOrder.reduce((sum, moduleId) => sum + Number(modules[moduleId][key] || 0), 0);
}

function uniqueSortedNumbers(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isInteger(value)))].sort((a, b) => a - b);
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function valueAfter(argv: string[], flag: string): string | null {
  const value = valueAfterRaw(argv, flag);
  return value ? path.resolve(value) : null;
}

function valueAfterRaw(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function shellArg(value: string): string {
  return /[\s"'`$\\]/.test(value) ? `"${value.replace(/(["\\$`])/g, "\\$1")}"` : value;
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
