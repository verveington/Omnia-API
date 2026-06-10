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
} from "./coverage-report.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

export type RecordingImpactOptions = {
  logFile: string;
  outputFile: string;
  generatedAt?: Date;
};

export type ImpactEndpoint = {
  key: string;
  method: string;
  path: string;
  area: string;
  count: number;
  statuses: number[];
  steps: string[];
};

export type ImpactDomain = {
  area: string;
  endpointCount: number;
  newEndpointCount: number;
  responseCount: number;
};

export type ImpactDownload = {
  step: string;
  url: string;
  extension: string;
};

export type RecordingImpactReport = {
  generatedAt: string;
  sourceLogFile: string;
  targetResponses: number;
  targetEndpointCount: number;
  newEndpointCount: number;
  newKnownInventoryCount: number;
  coverageBeforePercent: number;
  coverageAfterPercent: number;
  coverageDeltaPercent: number;
  endpoints: ImpactEndpoint[];
  newEndpoints: ImpactEndpoint[];
  domainImpacts: ImpactDomain[];
  downloads: ImpactDownload[];
};

if (isMainModule()) {
  const options = parseRecordingImpactArgs(process.argv.slice(2));
  const targetRecords = readJsonLines(options.logFile);
  const comparisonRecords = resolveComparisonFiles(options.logFile).flatMap(readJsonLines);
  const report = buildRecordingImpact(targetRecords, comparisonRecords, loadKnownEndpoints(), {
    generatedAt: options.generatedAt,
    sourceLogFile: options.logFile,
  });
  writeRecordingImpact(report, options.outputFile);
  console.log(`Recording-Impact: ${options.outputFile}`);
  console.log(`Neue Endpunkte: ${report.newEndpointCount}`);
  console.log(`Coverage-Delta: ${formatPercent(report.coverageDeltaPercent)} %`);
}

export function parseRecordingImpactArgs(argv: string[]): RecordingImpactOptions {
  const logFile = path.resolve(valueAfter(argv, "--log") || latestNetworkLogFile());
  const outputFile = path.resolve(
    valueAfter(argv, "--out") || path.join(workspaceRoot, "docs", "recordings", `${path.basename(logFile, ".jsonl")}-impact.md`),
  );

  return { logFile, outputFile };
}

export function buildRecordingImpact(
  targetRecords: Record<string, unknown>[],
  comparisonRecords: Record<string, unknown>[],
  knownEndpoints: KnownEndpoint[],
  options: { generatedAt?: Date; sourceLogFile?: string } = {},
): RecordingImpactReport {
  const endpoints = collectImpactEndpoints(targetRecords);
  const previousKeys = new Set(collectImpactEndpoints(comparisonRecords).map((endpoint) => endpoint.key));
  const newEndpoints = endpoints.filter((endpoint) => !previousKeys.has(endpoint.key));

  const previousCoverage = buildCoverageReport(knownEndpoints, comparisonRecords, { generatedAt: options.generatedAt });
  const combinedCoverage = buildCoverageReport(knownEndpoints, [...comparisonRecords, ...targetRecords], { generatedAt: options.generatedAt });

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    sourceLogFile: options.sourceLogFile || "",
    targetResponses: targetRecords.filter((record) => record.type === "response" && isApiTrafficRecord(record)).length,
    targetEndpointCount: endpoints.length,
    newEndpointCount: newEndpoints.length,
    newKnownInventoryCount: Math.max(0, combinedCoverage.observedKnownCount - previousCoverage.observedKnownCount),
    coverageBeforePercent: previousCoverage.coveragePercent,
    coverageAfterPercent: combinedCoverage.coveragePercent,
    coverageDeltaPercent: roundPercent(combinedCoverage.coveragePercent - previousCoverage.coveragePercent),
    endpoints,
    newEndpoints,
    domainImpacts: buildDomainImpacts(endpoints, new Set(newEndpoints.map((endpoint) => endpoint.key))),
    downloads: collectDownloads(targetRecords),
  };
}

export function buildRecordingImpactMarkdown(report: RecordingImpactReport): string {
  const lines = [
    "# Recording-Impact",
    "",
    `Quelle: \`${report.sourceLogFile || "unbekannt"}\``,
    `Generiert: ${report.generatedAt}`,
    "",
    "Hinweis: Der Report nutzt ausschliesslich redaktierte JSONL-Records. Er bewertet, was diese einzelne Aufnahme gegenueber den uebrigen Logs beigetragen hat.",
    "",
    "## Zusammenfassung",
    "",
    `- API-Responses: ${report.targetResponses}`,
    `- Eindeutige Endpunkte in Aufnahme: ${report.targetEndpointCount}`,
    `- Neue Endpunkte gegenueber anderen Logs: ${report.newEndpointCount}`,
    `- Neue bekannte Inventar-Endpunkte: ${report.newKnownInventoryCount}`,
    `- Coverage vorher: ${formatPercent(report.coverageBeforePercent)} %`,
    `- Coverage nachher: ${formatPercent(report.coverageAfterPercent)} %`,
    `- Coverage-Delta: ${formatPercent(report.coverageDeltaPercent)} %`,
    `- Downloads: ${report.downloads.length}`,
    "",
    "## Betroffene Fachbereiche",
    "",
  ];

  if (report.domainImpacts.length === 0) {
    lines.push("- Keine API-Domaenen beobachtet.", "");
  } else {
    lines.push("| Fachbereich | Endpunkte | Neue Endpunkte | Responses |");
    lines.push("|---|---:|---:|---:|");
    for (const domain of report.domainImpacts) {
      lines.push(`| ${escapeTable(domain.area)} | ${domain.endpointCount} | ${domain.newEndpointCount} | ${domain.responseCount} |`);
    }
    lines.push("");
  }

  lines.push("## Neue Endpunkte", "");
  if (report.newEndpoints.length === 0) {
    lines.push("- Keine neuen Endpunkte gegenueber den anderen Logs.", "");
  } else {
    for (const endpoint of report.newEndpoints) {
      lines.push(`- ${endpoint.method} \`${endpoint.path}\` (${endpoint.area}; ${endpoint.count}x; ${endpoint.statuses.join(", ") || "ohne Status"})`);
    }
    lines.push("");
  }

  lines.push("## Alle Endpunkte Der Aufnahme", "");
  if (report.endpoints.length === 0) {
    lines.push("- Keine API-Endpunkte beobachtet.", "");
  } else {
    for (const endpoint of report.endpoints) {
      const steps = endpoint.steps.length > 0 ? `; Schritte: ${endpoint.steps.map(escapeBackticks).join(", ")}` : "";
      lines.push(`- ${endpoint.method} \`${endpoint.path}\` (${endpoint.area}; ${endpoint.count}x; ${endpoint.statuses.join(", ") || "ohne Status"}${steps})`);
    }
    lines.push("");
  }

  lines.push("## Downloads", "");
  if (report.downloads.length === 0) {
    lines.push("- Keine Download-Events beobachtet.", "");
  } else {
    for (const download of report.downloads) {
      lines.push(`- ${download.extension || "unbekannt"} \`${escapeBackticks(download.url)}\` (${escapeBackticks(download.step || "Ohne Marker")})`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}`;
}

export function writeRecordingImpact(report: RecordingImpactReport, outputFile: string): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildRecordingImpactMarkdown(report));
  fs.writeFileSync(jsonSidecarPath(outputFile), `${JSON.stringify(report, null, 2)}\n`);
  return outputFile;
}

function jsonSidecarPath(file: string): string {
  return path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.json`);
}

function collectImpactEndpoints(records: Record<string, unknown>[]): ImpactEndpoint[] {
  const groups = new Map<string, ImpactEndpoint & { statusesSet: Set<number>; stepsSet: Set<string> }>();
  for (const record of records) {
    if (record.type !== "response") continue;
    if (!isApiTrafficRecord(record)) continue;

    const url = parseUrl(String(record.url || ""));
    const method = normalizeMethod(record.method);
    if (!method) continue;
    const endpointPath = normalizeObservedPath(url.pathname || "/");
    const key = `${method} ${endpointPath}`;
    const area = classifyEndpointArea(endpointPath);
    const group = groups.get(key) || {
      key,
      method,
      path: endpointPath,
      area,
      count: 0,
      statuses: [],
      steps: [],
      statusesSet: new Set<number>(),
      stepsSet: new Set<string>(),
    };

    group.count += 1;
    const status = normalizeStatus(record.status);
    if (status > 0) group.statusesSet.add(status);
    const step = String(record.step || "").trim();
    if (step) group.stepsSet.add(step);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({
      key: group.key,
      method: group.method,
      path: group.path,
      area: group.area,
      count: group.count,
      statuses: [...group.statusesSet].sort((a, b) => a - b),
      steps: [...group.stepsSet].sort(),
    }))
    .sort((a, b) => a.area.localeCompare(b.area) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function buildDomainImpacts(endpoints: ImpactEndpoint[], newEndpointKeys: Set<string>): ImpactDomain[] {
  const groups = new Map<string, ImpactDomain>();
  for (const endpoint of endpoints) {
    const group = groups.get(endpoint.area) || {
      area: endpoint.area,
      endpointCount: 0,
      newEndpointCount: 0,
      responseCount: 0,
    };
    group.endpointCount += 1;
    group.responseCount += endpoint.count;
    if (newEndpointKeys.has(endpoint.key)) group.newEndpointCount += 1;
    groups.set(endpoint.area, group);
  }
  return [...groups.values()].sort((a, b) => b.newEndpointCount - a.newEndpointCount || b.responseCount - a.responseCount || a.area.localeCompare(b.area));
}

function collectDownloads(records: Record<string, unknown>[]): ImpactDownload[] {
  return records
    .filter((record) => record.type === "download")
    .map((record) => ({
      step: String(record.step || ""),
      url: String(record.url || ""),
      extension: String(record.suggestedFileExtension || ""),
    }));
}

function resolveComparisonFiles(logFile: string): string[] {
  const target = path.resolve(logFile);
  const logDir = path.join(workspaceRoot, "logs", "network");
  if (!fs.existsSync(logDir)) return [];
  return fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(logDir, file))
    .filter((file) => path.resolve(file) !== target)
    .sort();
}

function readJsonLines(file: string): Record<string, unknown>[] {
  if (!fs.existsSync(file)) return [];
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

function latestNetworkLogFile(): string {
  const logDir = path.join(workspaceRoot, "logs", "network");
  if (!fs.existsSync(logDir)) return "";
  const files = fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(logDir, file))
    .sort();
  return files.at(-1) || "";
}

function normalizeMethod(value: unknown): string {
  const method = String(value || "").trim().toUpperCase();
  return /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method) ? method : "";
}

function normalizeStatus(value: unknown): number {
  const status = Number(value || 0);
  return Number.isInteger(status) && status > 0 ? status : 0;
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
