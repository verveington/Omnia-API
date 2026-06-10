import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultHistoryJsonlFile = path.join(workspaceRoot, "docs", "recordings", "recording-autopilot-history.jsonl");
const defaultOutputFile = path.join(workspaceRoot, "docs", "recordings", "recording-autopilot-history.md");
const defaultMaxOutcomeAgeMinutes = 120;

const recordingAutopilotReportValueFlags = new Set([
  "--history-jsonl",
  "--max-outcome-age-minutes",
  "--out",
]);

const recordingAutopilotReportBooleanFlags = new Set([
  "--help",
  "--require-runnable",
  "-h",
]);

export type RecordingAutopilotReportOptions = {
  historyJsonlFile: string;
  outputFile: string;
  requireRunnable: boolean;
  maxOutcomeAgeMinutes: number;
};

export type RecordingAutopilotHistoryEntry = {
  timestamp?: string;
  mode?: string;
  status?: string;
  reason?: string;
  findings?: string[];
  command?: string;
  outcomeJsonFile?: string;
  nextReportJsonFile?: string;
  nextCommand?: string;
  continueCommand?: string;
  continueArgs?: string[];
  outcomeFresh?: boolean;
  outcomeAgeMinutes?: number;
  outcomeMaxAgeMinutes?: number;
  workflowRun?: Record<string, unknown>;
  runEvidence?: Record<string, unknown>;
  learning?: Record<string, unknown>;
};

export type RecordingAutopilotHistoryTimelineEntry = {
  index: number;
  timestamp: string;
  mode: string;
  status: string;
  reason: string;
  purpose: string;
  qualityStatus: string;
  learningStatus: string;
  learningAction: string;
  findings: string[];
  command: string;
  nextCommand: string;
  continueCommand: string;
  continueArgs: string[];
  outcomeJsonFile: string;
  outcomeFresh: boolean | null;
  outcomeAgeMinutes: number | null;
  outcomeMaxAgeMinutes: number | null;
  logFile: string;
  manifestFile: string;
  impactFile: string;
  targetResponses: number | null;
  newEndpointCount: number;
  newKnownInventoryCount: number;
  coverageDeltaPercent: number | null;
  coveragePercent: number | null;
};

export type RecordingAutopilotHistoryReport = {
  generatedAt: string;
  entryCount: number;
  runCount: number;
  workflowRunCount: number;
  readyCount: number;
  needsReviewCount: number;
  blockedCount: number;
  missingCount: number;
  runEvidenceOkCount: number;
  runEvidenceReviewCount: number;
  runEvidenceMissingCount: number;
  totalNewEndpoints: number;
  totalNewKnownInventoryEndpoints: number;
  latestCoveragePercent: number | null;
  latestStatus: string;
  latestCommand: string;
  latestContinueArgs: string[];
  latestOutcomeJsonFile: string;
  latestOutcomeFresh: boolean | null;
  latestOutcomeAgeMinutes: number | null;
  latestOutcomeMaxAgeMinutes: number | null;
  latestRunnable: boolean;
  latestRunnableReason: string;
  entries: RecordingAutopilotHistoryTimelineEntry[];
  reviewEntries: RecordingAutopilotHistoryTimelineEntry[];
};

export type RecordingAutopilotHistoryReportBuildOptions = {
  maxOutcomeAgeMinutes?: number;
};

if (isMainModule()) {
  if (isRecordingAutopilotReportHelpRequest(process.argv.slice(2))) {
    console.log(buildRecordingAutopilotReportHelp());
    process.exitCode = 0;
  } else {
    const options = parseRecordingAutopilotReportArgs(process.argv.slice(2));
    const report = buildRecordingAutopilotHistoryReport(readRecordingAutopilotHistory(options.historyJsonlFile), new Date(), {
      maxOutcomeAgeMinutes: options.maxOutcomeAgeMinutes,
    });
    writeRecordingAutopilotHistoryReport(report, options.outputFile);
    for (const line of formatRecordingAutopilotReportCliLines(report, options.outputFile)) console.log(line);
    process.exitCode = recordingAutopilotReportExitCode(report, options);
  }
}

export function isRecordingAutopilotReportHelpRequest(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

export function buildRecordingAutopilotReportHelp(): string {
  return [
    "Recording-Autopilot-History-Report",
    "",
    "Regeneriert den Autopilot-Verlauf aus der History-JSONL und kann als Scheduler-Gate genutzt werden.",
    "",
    "Standard-Report:",
    "  node tools/recording-autopilot-report.ts",
    "",
    "Scheduler-Gate ohne Live-Aufnahme:",
    "  node tools/recording-autopilot-report.ts --require-runnable",
    "",
    "Wichtige Optionen:",
    "  --history-jsonl <datei>     History-JSONL lesen",
    "  --out <datei>               Markdown-Report schreiben; JSON-Sidecar wird daneben geschrieben",
    "  --require-runnable          Exit-Code 0 nur bei Startfreigabe: ja, sonst 1",
    `  --max-outcome-age-minutes <n> Outcome-Sidecar-Frischelimit; Standard ${defaultMaxOutcomeAgeMinutes}`,
    "  --help, -h                  Hilfe anzeigen, ohne Reports zu schreiben",
  ].join("\n");
}

export function parseRecordingAutopilotReportArgs(argv: string[]): RecordingAutopilotReportOptions {
  validateRecordingAutopilotReportArgs(argv);
  return {
    historyJsonlFile: path.resolve(valueAfter(argv, "--history-jsonl") || defaultHistoryJsonlFile),
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
    requireRunnable: argv.includes("--require-runnable"),
    maxOutcomeAgeMinutes: intArg(argv, "--max-outcome-age-minutes", defaultMaxOutcomeAgeMinutes, 7 * 24 * 60),
  };
}

function validateRecordingAutopilotReportArgs(argv: string[]): void {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-")) continue;
    if (recordingAutopilotReportValueFlags.has(arg)) {
      index += 1;
      continue;
    }
    if (recordingAutopilotReportBooleanFlags.has(arg)) continue;
    throw new Error(`Unbekannte Recording-Autopilot-Report-Option: ${arg}. Hilfe: node tools/recording-autopilot-report.ts --help`);
  }
}

export function recordingAutopilotReportExitCode(
  report: Pick<RecordingAutopilotHistoryReport, "latestRunnable">,
  options: Pick<RecordingAutopilotReportOptions, "requireRunnable">,
): number {
  return options.requireRunnable && !report.latestRunnable ? 1 : 0;
}

export function readRecordingAutopilotHistory(file: string): RecordingAutopilotHistoryEntry[] {
  try {
    return fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => parseHistoryLine(line))
      .filter((entry): entry is RecordingAutopilotHistoryEntry => Boolean(entry));
  } catch {
    return [];
  }
}

export function buildRecordingAutopilotHistoryReport(
  entries: RecordingAutopilotHistoryEntry[],
  generatedAt = new Date(),
  options: RecordingAutopilotHistoryReportBuildOptions = {},
): RecordingAutopilotHistoryReport {
  const timeline = refreshLatestOutcomeFreshness(
    entries.map((entry, index) => timelineEntry(entry, index + 1)),
    generatedAt,
    options.maxOutcomeAgeMinutes ?? defaultMaxOutcomeAgeMinutes,
  );
  const latest = timeline.at(-1);
  const latestCoverage = [...timeline].reverse().find((entry) => typeof entry.coveragePercent === "number")?.coveragePercent ?? null;
  const latestRunnable = Boolean(latest && latest.status === "ready" && latest.continueCommand && latest.outcomeFresh === true);
  return {
    generatedAt: generatedAt.toISOString(),
    entryCount: timeline.length,
    runCount: timeline.filter((entry) => entry.mode === "run").length,
    workflowRunCount: timeline.filter((entry) => entry.manifestFile || entry.logFile).length,
    readyCount: timeline.filter((entry) => entry.status === "ready").length,
    needsReviewCount: timeline.filter((entry) => entry.status === "needs-review").length,
    blockedCount: timeline.filter((entry) => entry.status === "blocked").length,
    missingCount: timeline.filter((entry) => entry.status === "missing").length,
    runEvidenceOkCount: timeline.filter((entry) => entry.qualityStatus === "ok").length,
    runEvidenceReviewCount: timeline.filter((entry) => entry.qualityStatus === "needs-review").length,
    runEvidenceMissingCount: timeline.filter((entry) => entry.qualityStatus === "missing").length,
    totalNewEndpoints: timeline.reduce((sum, entry) => sum + entry.newEndpointCount, 0),
    totalNewKnownInventoryEndpoints: timeline.reduce((sum, entry) => sum + entry.newKnownInventoryCount, 0),
    latestCoveragePercent: latestCoverage,
    latestStatus: latest?.status || "",
    latestCommand: latest?.continueCommand || latest?.nextCommand || latest?.command || "",
    latestContinueArgs: latest?.continueArgs || [],
    latestOutcomeJsonFile: latest?.outcomeJsonFile || "",
    latestOutcomeFresh: latest?.outcomeFresh ?? null,
    latestOutcomeAgeMinutes: latest?.outcomeAgeMinutes ?? null,
    latestOutcomeMaxAgeMinutes: latest?.outcomeMaxAgeMinutes ?? null,
    latestRunnable,
    latestRunnableReason: latestRunnableReason(latest, latestRunnable),
    entries: timeline,
    reviewEntries: timeline.filter((entry) => entry.status !== "ready" || entry.qualityStatus === "needs-review" || entry.qualityStatus === "missing"),
  };
}

export function buildRecordingAutopilotHistoryMarkdown(report: RecordingAutopilotHistoryReport): string {
  const lines = [
    "# Recording-Autopilot-History",
    "",
    `Generiert: ${report.generatedAt}`,
    "",
    "## Zusammenfassung",
    "",
    `- Eintraege: ${report.entryCount}`,
    `- Live-Runs: ${report.runCount}`,
    `- Workflow-Artefakte: ${report.workflowRunCount}`,
    `- Status: ${report.readyCount} ready, ${report.needsReviewCount} needs-review, ${report.blockedCount} blocked, ${report.missingCount} missing`,
    `- Run-Evidence: ${report.runEvidenceOkCount} ok, ${report.runEvidenceReviewCount} needs-review, ${report.runEvidenceMissingCount} missing`,
    `- Neue Endpunkte gesamt: ${report.totalNewEndpoints}`,
    `- Neue bekannte Inventar-Endpunkte gesamt: ${report.totalNewKnownInventoryEndpoints}`,
    `- Letzte Coverage: ${formatNullablePercent(report.latestCoveragePercent)} %`,
    `- Letzter Status: ${report.latestStatus || "-"}`,
    `- Startfreigabe: ${report.latestRunnable ? "ja" : "nein"}`,
    `- Startfreigabe-Grund: ${report.latestRunnableReason}`,
    `- Outcome-Sidecar: ${report.latestOutcomeJsonFile ? code(report.latestOutcomeJsonFile) : "-"}`,
    `- Outcome-Fortsetzung: ${formatOutcomeFreshness({
      outcomeFresh: report.latestOutcomeFresh,
      outcomeAgeMinutes: report.latestOutcomeAgeMinutes,
      outcomeMaxAgeMinutes: report.latestOutcomeMaxAgeMinutes,
    })}`,
    `- Naechste Args: ${report.latestContinueArgs.length > 0 ? code(report.latestContinueArgs.join(" ")) : "-"}`,
    `- Lernempfehlung: ${latestLearningAction(report) || "-"}`,
    `- Naechster Befehl: ${report.latestCommand ? `\`${escapeBackticks(report.latestCommand)}\`` : "-"}`,
    "",
    "## Timeline",
    "",
  ];

  if (report.entries.length === 0) {
    lines.push("- Keine Autopilot-History gefunden.", "");
  } else {
    lines.push("| # | Zeit | Modus | Status | Outcome | Zweck | Qualitaet | Lernen | Responses | Neue Endpunkte | Delta | Log |");
    lines.push("|---:|---|---|---|---|---|---|---|---:|---:|---:|---|");
    for (const entry of report.entries) {
      lines.push([
        entry.index,
        code(entry.timestamp || "-"),
        entry.mode || "-",
        entry.status || "-",
        formatOutcomeFreshness(entry),
        entry.purpose || "-",
        entry.qualityStatus || "-",
        entry.learningAction || entry.learningStatus || "-",
        entry.targetResponses ?? "-",
        entry.newEndpointCount,
        formatNullablePercent(entry.coverageDeltaPercent),
        entry.logFile ? code(path.basename(entry.logFile)) : "-",
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    lines.push("");
  }

  lines.push("## Review/Blocker", "");
  if (report.reviewEntries.length === 0) {
    lines.push("- Keine Review-Blocker im Autopilot-Verlauf.", "");
  } else {
    for (const entry of report.reviewEntries) {
      const findings = entry.findings.length > 0 ? entry.findings.join(", ") : entry.reason || "-";
      lines.push(`- ${code(entry.timestamp)} ${entry.status}/${entry.qualityStatus}: ${findings}`);
      if (entry.logFile || entry.manifestFile) {
        lines.push(`  - Artefakte: Log ${entry.logFile ? code(path.basename(entry.logFile)) : "-"}, Manifest ${entry.manifestFile ? code(path.basename(entry.manifestFile)) : "-"}`);
      }
      const command = entry.continueCommand || entry.nextCommand || entry.command;
      if (entry.learningStatus || entry.learningAction) {
        lines.push(`  - Lernen: ${entry.learningStatus || "-"} / ${entry.learningAction || "-"}`);
      }
      if (command) lines.push(`  - Befehl: ${code(command)}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function formatRecordingAutopilotReportCliLines(
  report: RecordingAutopilotHistoryReport,
  outputFile: string,
): string[] {
  return [
    `Recording-Autopilot-History: ${outputFile}`,
    `Recording-Autopilot-History-JSON: ${jsonSidecarPath(outputFile)}`,
    `Eintraege: ${report.entryCount}`,
    `Letzter Status: ${report.latestStatus || "-"}`,
    `Startfreigabe: ${report.latestRunnable ? "ja" : "nein"}`,
    `Startfreigabe-Grund: ${report.latestRunnableReason}`,
    `Outcome-Sidecar: ${report.latestOutcomeJsonFile || "-"}`,
    `Outcome-Fortsetzung: ${formatOutcomeFreshness({
      outcomeFresh: report.latestOutcomeFresh,
      outcomeAgeMinutes: report.latestOutcomeAgeMinutes,
      outcomeMaxAgeMinutes: report.latestOutcomeMaxAgeMinutes,
    })}`,
    `Naechste Args: ${report.latestContinueArgs.length > 0 ? report.latestContinueArgs.join(" ") : "-"}`,
    `Naechster Befehl: ${report.latestCommand || "-"}`,
  ];
}

export function writeRecordingAutopilotHistoryReport(
  report: RecordingAutopilotHistoryReport,
  outputFile: string,
): void {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildRecordingAutopilotHistoryMarkdown(report));
  fs.writeFileSync(jsonSidecarPath(outputFile), `${JSON.stringify(report, null, 2)}\n`);
}

function timelineEntry(entry: RecordingAutopilotHistoryEntry, index: number): RecordingAutopilotHistoryTimelineEntry {
  const workflowRun = isRecord(entry.workflowRun) ? entry.workflowRun : {};
  const runEvidence = isRecord(entry.runEvidence) ? entry.runEvidence : {};
  const learning = isRecord(entry.learning) ? entry.learning : {};
  const findings = [...arrayOfStrings(entry.findings), ...arrayOfStrings(runEvidence.findings)];
  return {
    index,
    timestamp: entry.timestamp || "",
    mode: entry.mode || "",
    status: entry.status || "",
    reason: entry.reason || "",
    purpose: stringField(workflowRun, "purpose"),
    qualityStatus: stringField(runEvidence, "status"),
    learningStatus: stringField(learning, "status"),
    learningAction: stringField(learning, "recommendedAction"),
    findings: [...new Set(findings)],
    command: entry.command || "",
    nextCommand: entry.nextCommand || "",
    continueCommand: entry.continueCommand || "",
    continueArgs: Array.isArray(entry.continueArgs) ? entry.continueArgs.filter((item): item is string => typeof item === "string") : [],
    outcomeJsonFile: entry.outcomeJsonFile || "",
    outcomeFresh: typeof entry.outcomeFresh === "boolean" ? entry.outcomeFresh : null,
    outcomeAgeMinutes: typeof entry.outcomeAgeMinutes === "number" && Number.isFinite(entry.outcomeAgeMinutes) ? entry.outcomeAgeMinutes : null,
    outcomeMaxAgeMinutes: typeof entry.outcomeMaxAgeMinutes === "number" && Number.isFinite(entry.outcomeMaxAgeMinutes) ? entry.outcomeMaxAgeMinutes : null,
    logFile: stringField(workflowRun, "logFile") || stringField(runEvidence, "logFile"),
    manifestFile: stringField(workflowRun, "manifestFile") || stringField(runEvidence, "manifestFile"),
    impactFile: stringField(workflowRun, "impactFile"),
    targetResponses: numberField(workflowRun, "targetResponses") ?? numberField(runEvidence, "targetResponses") ?? null,
    newEndpointCount: numberField(workflowRun, "newEndpointCount") || 0,
    newKnownInventoryCount: numberField(workflowRun, "newKnownInventoryCount") || 0,
    coverageDeltaPercent: numberField(workflowRun, "coverageDeltaPercent") ?? null,
    coveragePercent: numberField(learning, "finalCoveragePercent") ?? null,
  };
}

function refreshLatestOutcomeFreshness(
  timeline: RecordingAutopilotHistoryTimelineEntry[],
  generatedAt: Date,
  maxOutcomeAgeMinutes: number,
): RecordingAutopilotHistoryTimelineEntry[] {
  const latest = timeline.at(-1);
  if (!latest?.outcomeJsonFile) return timeline;
  const freshness = outcomeFreshnessFromFile(latest.outcomeJsonFile, generatedAt, maxOutcomeAgeMinutes);
  if (!freshness) {
    return timeline.map((entry) => entry.index === latest.index
      ? {
          ...entry,
          outcomeFresh: null,
          outcomeAgeMinutes: null,
          outcomeMaxAgeMinutes: maxOutcomeAgeMinutes,
        }
      : entry);
  }
  return timeline.map((entry) => entry.index === latest.index
    ? {
        ...entry,
        outcomeFresh: freshness.fresh,
        outcomeAgeMinutes: freshness.ageMinutes,
        outcomeMaxAgeMinutes: freshness.maxAgeMinutes,
      }
    : entry);
}

function outcomeFreshnessFromFile(
  file: string,
  generatedAt: Date,
  maxAgeMinutes: number,
): { fresh: boolean; ageMinutes: number; maxAgeMinutes: number } | null {
  try {
    const stat = fs.statSync(file);
    const ageMinutes = Math.max(0, Math.ceil((generatedAt.getTime() - stat.mtimeMs) / 60000));
    return { fresh: ageMinutes <= maxAgeMinutes, ageMinutes, maxAgeMinutes };
  } catch {
    return null;
  }
}

function parseHistoryLine(line: string): RecordingAutopilotHistoryEntry | null {
  if (!line.trim()) return null;
  try {
    const parsed = JSON.parse(line) as unknown;
    if (!isRecord(parsed)) return null;
    return {
      ...(typeof parsed.timestamp === "string" ? { timestamp: parsed.timestamp } : {}),
      ...(typeof parsed.mode === "string" ? { mode: parsed.mode } : {}),
      ...(typeof parsed.status === "string" ? { status: parsed.status } : {}),
      ...(typeof parsed.reason === "string" ? { reason: parsed.reason } : {}),
      findings: arrayOfStrings(parsed.findings),
      ...(typeof parsed.command === "string" ? { command: parsed.command } : {}),
      ...(typeof parsed.outcomeJsonFile === "string" ? { outcomeJsonFile: parsed.outcomeJsonFile } : {}),
      ...(typeof parsed.nextReportJsonFile === "string" ? { nextReportJsonFile: parsed.nextReportJsonFile } : {}),
      ...(typeof parsed.nextCommand === "string" ? { nextCommand: parsed.nextCommand } : {}),
      ...(typeof parsed.continueCommand === "string" ? { continueCommand: parsed.continueCommand } : {}),
      ...(Array.isArray(parsed.continueArgs) ? { continueArgs: arrayOfStrings(parsed.continueArgs) } : {}),
      ...(typeof parsed.outcomeFresh === "boolean" ? { outcomeFresh: parsed.outcomeFresh } : {}),
      ...(typeof parsed.outcomeAgeMinutes === "number" && Number.isFinite(parsed.outcomeAgeMinutes) ? { outcomeAgeMinutes: parsed.outcomeAgeMinutes } : {}),
      ...(typeof parsed.outcomeMaxAgeMinutes === "number" && Number.isFinite(parsed.outcomeMaxAgeMinutes) ? { outcomeMaxAgeMinutes: parsed.outcomeMaxAgeMinutes } : {}),
      ...(isRecord(parsed.workflowRun) ? { workflowRun: parsed.workflowRun } : {}),
      ...(isRecord(parsed.runEvidence) ? { runEvidence: parsed.runEvidence } : {}),
      ...(isRecord(parsed.learning) ? { learning: parsed.learning } : {}),
    };
  } catch {
    return null;
  }
}

function latestRunnableReason(
  latest: RecordingAutopilotHistoryTimelineEntry | undefined,
  latestRunnable: boolean,
): string {
  if (!latest) return "Keine Autopilot-History gefunden.";
  if (latestRunnable) return "Ready-Fortsetzung ist frisch und gated.";
  if (latest.status !== "ready") return `Letzter Status ist ${latest.status || "-"}; nur ready ist startfaehig.`;
  if (!latest.continueCommand) return "Keine gated Autopilot-Fortsetzung vorhanden.";
  if (latest.outcomeFresh === false) return `Outcome-Fortsetzung ist ${formatOutcomeFreshness(latest)}.`;
  return "Outcome-Fortsetzung hat keine Frische-Information.";
}

function latestLearningAction(report: RecordingAutopilotHistoryReport): string {
  const latest = [...report.entries].reverse().find((entry) => entry.learningAction || entry.learningStatus);
  if (!latest) return "";
  return latest.learningAction || latest.learningStatus;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function valueAfter(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function intArg(argv: string[], name: string, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const value = valueAfter(argv, name);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function jsonSidecarPath(file: string): string {
  return path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.json`);
}

function formatNullablePercent(value: number | null): string {
  return typeof value === "number" ? formatNumber(value) : "-";
}

function formatOutcomeFreshness(entry: Pick<RecordingAutopilotHistoryTimelineEntry, "outcomeFresh" | "outcomeAgeMinutes" | "outcomeMaxAgeMinutes">): string {
  if (typeof entry.outcomeFresh !== "boolean") return "-";
  const age = typeof entry.outcomeAgeMinutes === "number" ? formatNumber(entry.outcomeAgeMinutes) : "?";
  const max = typeof entry.outcomeMaxAgeMinutes === "number" ? formatNumber(entry.outcomeMaxAgeMinutes) : "?";
  return `${entry.outcomeFresh ? "frisch" : "stale"} (${age}/${max} min)`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function code(value: string): string {
  return `\`${escapeBackticks(value)}\``;
}

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
