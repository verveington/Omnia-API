import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadKnownEndpoints, type KnownEndpoint } from "./coverage-report.ts";
import { evaluateNetworkLogQuality } from "./recording-audit.ts";
import { buildRecordingImpact } from "./recording-impact.ts";
import { redactUiLabel } from "./redact.ts";
import type { RecordingExplorerOpenTarget, RecordingExplorerStats, RecordingWorkflowImpactSummary, RecordingWorkflowManifest } from "./recording-workflow.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "recordings", "recording-scoreboard.md");

export type RecordingScoreboardOptions = {
  outputFile: string;
  generatedAt?: Date;
};

export type RecordingLogInput = {
  file: string;
  records: Record<string, unknown>[];
};

export type RecordingScoreboardEntry = {
  index: number;
  file: string;
  purpose?: string;
  responses: number;
  endpointCount: number;
  qualityStatus: "ok" | "needs-review";
  qualityApiResponses: number;
  qualityTimelineMarkers: number;
  qualityUiSnapshots: number;
  qualityFindings: string[];
  newEndpoints: number;
  newKnownInventoryEndpoints: number;
  expectedEndpoints: number;
  expectedEndpointsObserved: number;
  expectedEndpointsMissing: number;
  expectedEndpointHitRatePercent: number;
  explorerClickedTargets: number | null;
  explorerSkippedTargets: number | null;
  explorerBlockedRequests: number | null;
  explorerDiscoveredTargets: number | null;
  explorerOpenTargets: number | null;
  explorerTopOpenTargets: RecordingExplorerOpenTarget[];
  explorerStopReason: string;
  coverageBeforePercent: number;
  coverageAfterPercent: number;
  coverageDeltaPercent: number;
  topAreas: string[];
};

export type RecordingScoreboard = {
  generatedAt: string;
  recordingCount: number;
  recordingsNeedingReview: number;
  finalCoveragePercent: number;
  totalNewEndpoints: number;
  totalNewKnownInventoryEndpoints: number;
  expectedEndpoints: number;
  expectedEndpointsObserved: number;
  expectedEndpointsMissing: number;
  expectedEndpointHitRatePercent: number;
  totalExplorerClickedTargets: number;
  totalExplorerSkippedTargets: number;
  totalExplorerBlockedRequests: number;
  totalExplorerDiscoveredTargets: number;
  totalExplorerOpenTargets: number;
  entries: RecordingScoreboardEntry[];
};

export type ExpectedEndpointResult = {
  method: string;
  path: string;
  observed: boolean;
};

type RecordingScoreboardManifestImpact = RecordingWorkflowImpactSummary & {
  coverageBeforePercent?: number;
  coverageAfterPercent?: number;
};

if (isMainModule()) {
  const options = parseRecordingScoreboardArgs(process.argv.slice(2));
  const logs = resolveInputFiles(process.argv.slice(2)).map((file) => ({ file, records: readJsonLines(file) }));
  const scoreboard = buildRecordingScoreboard(logs, loadKnownEndpoints(), {
    ...options,
    manifestByLogFile: loadWorkflowManifests(logs.map((log) => log.file)),
    summaryMarkdownByLogFile: loadWorkflowSummaries(logs.map((log) => log.file)),
  });
  writeRecordingScoreboard(scoreboard, options.outputFile);
  console.log(`Recording-Scoreboard: ${options.outputFile}`);
  console.log(`Recording-Scoreboard-JSON: ${jsonSidecarPath(options.outputFile)}`);
  console.log(`Recordings: ${scoreboard.recordingCount}`);
  console.log(`Finale Coverage: ${formatPercent(scoreboard.finalCoveragePercent)} %`);
}

export function parseRecordingScoreboardArgs(argv: string[]): RecordingScoreboardOptions {
  return {
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
  };
}

export function buildRecordingScoreboard(
  logs: RecordingLogInput[],
  knownEndpoints: KnownEndpoint[],
  options: {
    generatedAt?: Date;
    manifestByLogFile?: Record<string, unknown>;
    summaryMarkdownByLogFile?: Record<string, string>;
  } = {},
): RecordingScoreboard {
  const entries: RecordingScoreboardEntry[] = [];
  const previousRecords: Record<string, unknown>[] = [];

  const orderedLogs = [...logs].sort((a, b) => a.file.localeCompare(b.file));
  for (const log of orderedLogs) {
    const impact = buildRecordingImpact(log.records, previousRecords, knownEndpoints, {
      generatedAt: options.generatedAt,
      sourceLogFile: log.file,
    });
    const manifestResults = parseExpectedEndpointResultsFromManifest(options.manifestByLogFile?.[log.file]);
    const expectedResults = manifestResults.length > 0
      ? manifestResults
      : parseExpectedEndpointResultsFromMarkdown(options.summaryMarkdownByLogFile?.[log.file] || "");
    const expectedEndpointsObserved = expectedResults.filter((result) => result.observed).length;
    const expectedEndpointsMissing = expectedResults.length - expectedEndpointsObserved;
    const explorer = parseExplorerStatsFromManifest(options.manifestByLogFile?.[log.file]);
    const manifestImpact = parseImpactSummaryFromManifest(options.manifestByLogFile?.[log.file]);
    const purpose = parsePurposeFromManifest(options.manifestByLogFile?.[log.file]);
    const quality = evaluateNetworkLogQuality(log.records);
    entries.push({
      index: entries.length + 1,
      file: log.file,
      ...(purpose ? { purpose } : {}),
      responses: manifestImpact?.targetResponses ?? impact.targetResponses,
      endpointCount: manifestImpact?.targetEndpointCount ?? impact.targetEndpointCount,
      qualityStatus: quality.findings.length === 0 ? "ok" : "needs-review",
      qualityApiResponses: quality.apiResponseCount,
      qualityTimelineMarkers: quality.timelineMarkerCount,
      qualityUiSnapshots: quality.uiSnapshotCount,
      qualityFindings: quality.findings.map((finding) => finding.pattern),
      newEndpoints: manifestImpact?.newEndpointCount ?? impact.newEndpointCount,
      newKnownInventoryEndpoints: manifestImpact?.newKnownInventoryCount ?? impact.newKnownInventoryCount,
      expectedEndpoints: expectedResults.length,
      expectedEndpointsObserved,
      expectedEndpointsMissing,
      expectedEndpointHitRatePercent: roundPercent(expectedResults.length === 0 ? 0 : (expectedEndpointsObserved / expectedResults.length) * 100),
      explorerClickedTargets: explorer?.clickedTargets ?? null,
      explorerSkippedTargets: explorer?.skippedTargets ?? null,
      explorerBlockedRequests: explorer?.blockedRequests ?? null,
      explorerDiscoveredTargets: explorer?.discoveredTargets ?? null,
      explorerOpenTargets: explorer?.openTargets ?? null,
      explorerTopOpenTargets: explorer?.topOpenTargets || [],
      explorerStopReason: explorer?.stopReason || "",
      coverageBeforePercent: manifestImpact?.coverageBeforePercent ?? impact.coverageBeforePercent,
      coverageAfterPercent: manifestImpact?.coverageAfterPercent ?? impact.coverageAfterPercent,
      coverageDeltaPercent: manifestImpact?.coverageDeltaPercent ?? impact.coverageDeltaPercent,
      topAreas: manifestImpact
        ? manifestImpact.topAreas.map((area) => area.area).filter(Boolean).slice(0, 4)
        : impact.domainImpacts.filter((domain) => domain.newEndpointCount > 0).map((domain) => domain.area).slice(0, 4),
    });
    previousRecords.push(...log.records);
  }

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    recordingCount: entries.length,
    recordingsNeedingReview: entries.filter((entry) => entry.qualityStatus === "needs-review").length,
    finalCoveragePercent: entries.at(-1)?.coverageAfterPercent || 0,
    totalNewEndpoints: entries.reduce((sum, entry) => sum + entry.newEndpoints, 0),
    totalNewKnownInventoryEndpoints: entries.reduce((sum, entry) => sum + entry.newKnownInventoryEndpoints, 0),
    expectedEndpoints: entries.reduce((sum, entry) => sum + entry.expectedEndpoints, 0),
    expectedEndpointsObserved: entries.reduce((sum, entry) => sum + entry.expectedEndpointsObserved, 0),
    expectedEndpointsMissing: entries.reduce((sum, entry) => sum + entry.expectedEndpointsMissing, 0),
    expectedEndpointHitRatePercent: roundPercent(
      entries.reduce((sum, entry) => sum + entry.expectedEndpoints, 0) === 0
        ? 0
        : (entries.reduce((sum, entry) => sum + entry.expectedEndpointsObserved, 0) / entries.reduce((sum, entry) => sum + entry.expectedEndpoints, 0)) * 100,
    ),
    totalExplorerClickedTargets: entries.reduce((sum, entry) => sum + (entry.explorerClickedTargets || 0), 0),
    totalExplorerSkippedTargets: entries.reduce((sum, entry) => sum + (entry.explorerSkippedTargets || 0), 0),
    totalExplorerBlockedRequests: entries.reduce((sum, entry) => sum + (entry.explorerBlockedRequests || 0), 0),
    totalExplorerDiscoveredTargets: entries.reduce((sum, entry) => sum + (entry.explorerDiscoveredTargets || 0), 0),
    totalExplorerOpenTargets: entries.reduce((sum, entry) => sum + (entry.explorerOpenTargets || 0), 0),
    entries,
  };
}

export function buildRecordingScoreboardMarkdown(scoreboard: RecordingScoreboard): string {
  const recordingsNeedingReview = scoreboard.recordingsNeedingReview || 0;
  const lines = [
    "# Recording-Scoreboard",
    "",
    `Generiert: ${scoreboard.generatedAt}`,
    "",
    "Hinweis: Das Scoreboard bewertet redaktierte Logs in chronologischer Reihenfolge. Es zeigt, welche Aufnahme den kumulierten Wissensstand erweitert hat.",
    "",
    "## Zusammenfassung",
    "",
    `- Recordings: ${scoreboard.recordingCount}`,
    `- Recording-Qualitaet: ${scoreboard.recordingCount - recordingsNeedingReview} / ${scoreboard.recordingCount} ok, ${recordingsNeedingReview} pruefen`,
    `- Finale Coverage: ${formatPercent(scoreboard.finalCoveragePercent)} %`,
    `- Neue Endpunkte gesamt: ${scoreboard.totalNewEndpoints}`,
    `- Neue bekannte Inventar-Endpunkte gesamt: ${scoreboard.totalNewKnownInventoryEndpoints}`,
    `- Ziel-Endpunkte: ${scoreboard.expectedEndpointsObserved} / ${scoreboard.expectedEndpoints} gesehen (${formatPercent(scoreboard.expectedEndpointHitRatePercent)} %)`,
    `- Auto-Explorer: ${scoreboard.totalExplorerClickedTargets} geklickt, ${scoreboard.totalExplorerSkippedTargets} uebersprungen, ${scoreboard.totalExplorerBlockedRequests} blockiert`,
    `- Auto-Explorer UI-Ziele: ${scoreboard.totalExplorerDiscoveredTargets || 0} UI-Ziele entdeckt, ${scoreboard.totalExplorerOpenTargets || 0} offen`,
    "",
    "## Lernkurve",
    "",
  ];

  if (scoreboard.entries.length === 0) {
    lines.push("- Keine Recording-Logs gefunden.", "");
  } else {
    lines.push("| # | Log | Zweck | Qualitaet | UI-Snapshots | Responses | Endpunkte | Neue Endpunkte | Neue bekannte Inventar-Endpunkte | Ziel-Endpunkte | Explorer | Offene UI-Ziele | Coverage vorher/nachher | Delta | Top-Bereiche |");
    lines.push("|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---:|---|");
    for (const entry of scoreboard.entries) {
      lines.push(
        `| ${entry.index} | \`${escapeBackticks(entry.file)}\` | ${formatPurpose(entry)} | ${formatQuality(entry)} | ${entry.qualityUiSnapshots ?? 0} | ${entry.responses} | ${entry.endpointCount} | ${entry.newEndpoints} | ${entry.newKnownInventoryEndpoints} | ${entry.expectedEndpointsObserved}/${entry.expectedEndpoints} (${formatPercent(entry.expectedEndpointHitRatePercent)} %) | ${formatExplorerStats(entry)} | ${formatTopOpenTargets(entry)} | ${formatPercent(entry.coverageBeforePercent)} -> ${formatPercent(entry.coverageAfterPercent)} % | ${formatPercent(entry.coverageDeltaPercent)} % | ${entry.topAreas.map(escapeTable).join(", ") || "-"} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Nachaufnahme-Kandidaten", "");
  const needsReview = scoreboard.entries.filter((entry) => entry.qualityStatus === "needs-review");
  if (needsReview.length === 0) {
    lines.push("- Keine Recording-Logs mit schwacher Qualitaet gefunden.", "");
  } else {
    for (const entry of needsReview.slice(0, 20)) {
      lines.push(`- \`${escapeBackticks(entry.file)}\`: ${entry.qualityFindings.join(", ") || "needs-review"}; API-Responses ${entry.qualityApiResponses}, Marker ${entry.qualityTimelineMarkers}, UI-Snapshots ${entry.qualityUiSnapshots ?? 0}.`);
    }
    lines.push("");
  }

  lines.push("## Beste Aufnahmen Nach Inventar-Zuwachs", "");
  const best = [...scoreboard.entries]
    .filter((entry) => entry.newKnownInventoryEndpoints > 0 || entry.newEndpoints > 0)
    .sort((a, b) => b.newKnownInventoryEndpoints - a.newKnownInventoryEndpoints || b.newEndpoints - a.newEndpoints || b.coverageDeltaPercent - a.coverageDeltaPercent)
    .slice(0, 10);

  if (best.length === 0) {
    lines.push("- Keine Aufnahme mit neuem Endpoint-Beitrag gefunden.", "");
  } else {
    for (const entry of best) {
      lines.push(`- \`${escapeBackticks(entry.file)}\`: ${entry.newKnownInventoryEndpoints} bekannte Inventar-Endpunkte, ${entry.newEndpoints} neue Endpunkte, Delta ${formatPercent(entry.coverageDeltaPercent)} %, Bereiche ${entry.topAreas.join(", ") || "-"}.`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}`;
}

export function parseExpectedEndpointResultsFromMarkdown(markdown: string): ExpectedEndpointResult[] {
  const results: ExpectedEndpointResult[] = [];
  const rowRe = /^\|\s*([A-Z]+)\s+`([^`]+)`\s*\|\s*(gesehen|fehlt)\s*\|/gm;
  for (const match of markdown.matchAll(rowRe)) {
    results.push({
      method: match[1],
      path: match[2],
      observed: match[3] === "gesehen",
    });
  }
  return results;
}

export function parseExpectedEndpointResultsFromManifest(manifest: unknown): ExpectedEndpointResult[] {
  if (!isWorkflowManifestLike(manifest)) return [];
  return manifest.expectedEndpoints
    .map((endpoint) => {
      const method = typeof endpoint.method === "string" ? endpoint.method.toUpperCase() : "";
      const pathValue = typeof endpoint.path === "string" ? endpoint.path : "";
      if (!method || !pathValue.startsWith("/")) return null;
      return {
        method,
        path: pathValue,
        observed: endpoint.observed === true,
      };
    })
    .filter(Boolean) as ExpectedEndpointResult[];
}

export function parseExplorerStatsFromManifest(manifest: unknown): RecordingExplorerStats | null {
  if (!isWorkflowManifestLike(manifest)) return null;
  const explorer = manifest.explorer;
  if (!explorer || typeof explorer !== "object") return null;
  const candidate = explorer as Partial<RecordingExplorerStats>;
  const clickedTargets = toNonNegativeNumber(candidate.clickedTargets);
  const skippedTargets = toNonNegativeNumber(candidate.skippedTargets);
  const blockedRequests = toNonNegativeNumber(candidate.blockedRequests);
  const discoveredTargets = toNonNegativeNumber(candidate.discoveredTargets) ?? 0;
  const openTargets = toNonNegativeNumber(candidate.openTargets) ?? 0;
  if (clickedTargets === null || skippedTargets === null || blockedRequests === null) return null;
  return {
    startUrl: typeof candidate.startUrl === "string" ? candidate.startUrl : "",
    finalUrl: typeof candidate.finalUrl === "string" ? candidate.finalUrl : "",
    stopReason: typeof candidate.stopReason === "string" ? candidate.stopReason : "",
    clickedTargets,
    skippedTargets,
    blockedRequests,
    discoveredTargets,
    openTargets,
    topOpenTargets: readOpenTargets(candidate.topOpenTargets),
  };
}

export function parseImpactSummaryFromManifest(manifest: unknown): RecordingScoreboardManifestImpact | null {
  if (!isWorkflowManifestLike(manifest)) return null;
  const impact = (manifest as { impact?: unknown }).impact;
  if (!impact || typeof impact !== "object" || Array.isArray(impact)) return null;
  const candidate = impact as Record<string, unknown>;
  const targetResponses = toNonNegativeNumber(candidate.targetResponses);
  const targetEndpointCount = toNonNegativeNumber(candidate.targetEndpointCount);
  const newEndpointCount = toNonNegativeNumber(candidate.newEndpointCount);
  const newKnownInventoryCount = toNonNegativeNumber(candidate.newKnownInventoryCount);
  const coverageDeltaPercent = toFiniteNumber(candidate.coverageDeltaPercent);
  if (
    targetResponses === null
    || targetEndpointCount === null
    || newEndpointCount === null
    || newKnownInventoryCount === null
    || coverageDeltaPercent === null
  ) {
    return null;
  }
  return {
    targetResponses,
    targetEndpointCount,
    newEndpointCount,
    newKnownInventoryCount,
    coverageBeforePercent: toFiniteNumber(candidate.coverageBeforePercent) ?? undefined,
    coverageAfterPercent: toFiniteNumber(candidate.coverageAfterPercent) ?? undefined,
    coverageDeltaPercent,
    downloads: toNonNegativeNumber(candidate.downloads) ?? 0,
    topAreas: readImpactAreas(candidate.topAreas),
  };
}

export function parsePurposeFromManifest(manifest: unknown): string {
  if (!isWorkflowManifestLike(manifest)) return "";
  const purpose = (manifest as { purpose?: unknown }).purpose;
  return typeof purpose === "string" ? purpose : "";
}

export function writeRecordingScoreboard(scoreboard: RecordingScoreboard, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildRecordingScoreboardMarkdown(scoreboard));
  fs.writeFileSync(jsonSidecarPath(outputFile), `${JSON.stringify(scoreboard, null, 2)}\n`);
  return outputFile;
}

function jsonSidecarPath(file: string): string {
  return path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.json`);
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

function loadWorkflowSummaries(logFiles: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const logFile of logFiles) {
    const summaryFile = workflowSummaryFileForLog(logFile);
    if (!summaryFile || !fs.existsSync(summaryFile)) continue;
    result[logFile] = fs.readFileSync(summaryFile, "utf8");
  }
  return result;
}

function loadWorkflowManifests(logFiles: string[]): Record<string, RecordingWorkflowManifest> {
  const result: Record<string, RecordingWorkflowManifest> = {};
  for (const logFile of logFiles) {
    const manifestFile = workflowManifestFileForLog(logFile);
    if (!manifestFile || !fs.existsSync(manifestFile)) continue;
    const manifest = readJsonFile(manifestFile);
    if (!isWorkflowManifestLike(manifest)) continue;
    result[logFile] = manifest;
  }
  return result;
}

function workflowSummaryFileForLog(logFile: string): string {
  const baseName = path.basename(logFile, ".jsonl");
  return path.join(workspaceRoot, "docs", "recordings", `${baseName}-summary.md`);
}

function workflowManifestFileForLog(logFile: string): string {
  const baseName = path.basename(logFile, ".jsonl");
  return path.join(workspaceRoot, "docs", "recordings", `${baseName}-manifest.json`);
}

function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function isWorkflowManifestLike(value: unknown): value is RecordingWorkflowManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { expectedEndpoints?: unknown };
  return Array.isArray(candidate.expectedEndpoints);
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function formatExplorerStats(entry: RecordingScoreboardEntry): string {
  if (entry.explorerClickedTargets === null || entry.explorerSkippedTargets === null || entry.explorerBlockedRequests === null) {
    return "-";
  }
  const stopReason = entry.explorerStopReason ? ` ${escapeTable(entry.explorerStopReason)}` : "";
  const openTargets = entry.explorerOpenTargets === null ? 0 : entry.explorerOpenTargets;
  return `${entry.explorerClickedTargets}/${entry.explorerSkippedTargets}/${entry.explorerBlockedRequests}/${openTargets}${stopReason}`;
}

function formatTopOpenTargets(entry: RecordingScoreboardEntry): string {
  if (entry.explorerOpenTargets === null) return "-";
  const targets = entry.explorerTopOpenTargets
    .slice(0, 3)
    .map((target) => `${target.label}${target.path ? ` (${target.path})` : ""}`)
    .map(escapeTable);
  return `${entry.explorerOpenTargets} offen${targets.length > 0 ? `: ${targets.join(", ")}` : ""}`;
}

function formatQuality(entry: RecordingScoreboardEntry): string {
  const status = entry.qualityStatus || "ok";
  const findings = entry.qualityFindings || [];
  const suffix = findings.length > 0 ? ` ${findings.map(escapeTable).join(", ")}` : "";
  return `${status}${suffix}`;
}

function formatPurpose(entry: RecordingScoreboardEntry): string {
  return entry.purpose ? escapeTable(entry.purpose) : "-";
}

function readOpenTargets(value: unknown): RecordingExplorerOpenTarget[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((target) => {
      if (!target || typeof target !== "object") return null;
      const candidate = target as Record<string, unknown>;
      const label = typeof candidate.label === "string" ? redactUiLabel(candidate.label) : "";
      if (!label) return null;
      return {
        kind: typeof candidate.kind === "string" ? candidate.kind : "",
        label,
        path: typeof candidate.path === "string" ? candidate.path : "",
        seenCount: toNonNegativeNumber(candidate.seenCount) ?? 0,
      };
    })
    .filter(Boolean) as RecordingExplorerOpenTarget[];
}

function readImpactAreas(value: unknown): RecordingWorkflowImpactSummary["topAreas"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const candidate = item as Record<string, unknown>;
      const area = typeof candidate.area === "string" ? candidate.area : "";
      if (!area) return null;
      return {
        area,
        endpointCount: toNonNegativeNumber(candidate.endpointCount) ?? 0,
        newEndpointCount: toNonNegativeNumber(candidate.newEndpointCount) ?? 0,
        responseCount: toNonNegativeNumber(candidate.responseCount) ?? 0,
      };
    })
    .filter(Boolean) as RecordingWorkflowImpactSummary["topAreas"];
}

function toNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
