import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  runRecordingNextCli,
  type RecordingNextResult,
} from "./recording-next.ts";
import {
  buildRecordingAutopilotHistoryReport,
  readRecordingAutopilotHistory,
  writeRecordingAutopilotHistoryReport,
} from "./recording-autopilot-report.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultReportFile = path.join(workspaceRoot, "docs", "recordings", "recording-autopilot-report.md");
const defaultMaxOutcomeAgeMinutes = 120;

export type RecordingAutopilotOptions = {
  run: boolean;
  preflight: boolean;
  autoOnly: boolean;
  allowManual: boolean;
  refreshCampaign: boolean;
  repeat: number;
  reportFile: string;
  reportJsonFile: string;
  outcomeJsonFile: string;
  historyJsonlFile?: string;
  historyReportFile?: string;
  continueFromFile?: string;
  scoreboardJsonFile?: string;
  recordingUrl?: string;
  maxOutcomeAgeMinutes: number;
};

export type RecordingAutopilotResult = {
  mode: "dry-run" | "preflight" | "run";
  command: string;
  nextArgs: string[];
  nextResult: RecordingNextResult;
  outcome: RecordingAutopilotOutcome;
  outcomeJsonFile: string;
  continueCommand?: string;
  continueArgs?: string[];
  outcomeAgeMinutes?: number;
  outcomeMaxAgeMinutes?: number;
  outcomeFresh?: boolean;
  historyJsonlFile?: string;
  historyReportFile?: string;
};

export type RecordingAutopilotOutcomeStatus = "ready" | "needs-review" | "blocked" | "missing";

export type RecordingAutopilotOutcome = {
  status: RecordingAutopilotOutcomeStatus;
  reason: string;
  findings: string[];
  reportJsonFile?: string;
  nextCommand?: string;
};

export type RecordingAutopilotHooks = {
  runNext?: (args: string[]) => Promise<RecordingNextResult> | RecordingNextResult;
};

type RecordingAutopilotOutcomeSidecar = RecordingAutopilotOutcome & {
  continueArgs?: string[];
  continueCommand?: string;
  nextReportJsonFile?: string;
  nextArgs?: string[];
};

type RecordingAutopilotContinuation = {
  command: string;
  args: string[];
  runCommand: string;
  runArgs: string[];
};

type RecordingAutopilotHistoryContext = {
  workflowRun?: Record<string, unknown>;
  runEvidence?: Record<string, unknown>;
  learning?: Record<string, unknown>;
};

type RecordingAutopilotOutcomeFreshness = {
  ageMinutes: number;
  maxAgeMinutes: number;
  fresh: boolean;
};

const recordingAutopilotValueFlags = new Set([
  "--continue-from",
  "--history-jsonl",
  "--history-report",
  "--max-outcome-age-minutes",
  "--outcome-json",
  "--repeat",
  "--report",
  "--report-json",
  "--runs",
  "--scoreboard-json",
  "--url",
]);

const recordingAutopilotBooleanFlags = new Set([
  "--allow-manual",
  "--help",
  "--include-manual",
  "--no-refresh",
  "--preflight",
  "--run",
  "-h",
]);

if (isMainModule()) {
  runRecordingAutopilotCli(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}

export function isRecordingAutopilotHelpRequest(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

export function buildRecordingAutopilotHelp(): string {
  return [
    "Recording-Autopilot",
    "",
    "Plant und startet gated Omnia-Recording-Laeufe ueber recording-next. Ohne --run bleibt der Autopilot ein Dry-Run.",
    "",
    "Sicherer Preflight ohne Live-Aufnahme:",
    "  node tools/recording-autopilot.ts --url https://api2.optica-omnia.de --preflight --history-jsonl docs/recordings/recording-autopilot-history.jsonl",
    "",
    "Naechsten freigegebenen Lauf nur anzeigen:",
    "  node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json",
    "",
    "Naechsten freigegebenen Lauf ausfuehren:",
    "  node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run",
    "",
    "Wichtige Optionen:",
    "  --run                         fuehrt eine ready-Fortsetzung oder Next-Empfehlung aus",
    "  --preflight                   prueft die naechste Workflow-Aufnahme ohne Live-Aufnahme",
    "  --continue-from <datei>       liest ein Outcome-Sidecar, typischerweise recording-autopilot-outcome.json",
    "  --history-jsonl <datei>       schreibt den append-only Aufnahmeverlauf",
    "  --history-report <datei>      schreibt den lesbaren History-Report",
    `  --max-outcome-age-minutes <n> Live-Fortsetzung nur mit frischem Outcome-Sidecar; Standard ${defaultMaxOutcomeAgeMinutes}`,
    "  --url <omnia-url>             Ziel-URL fuer Campaign/Next/Workflow",
    "  --runs <n>                    maximale Wiederholungen",
    "  --include-manual              manuelle Empfehlungen in die Planung aufnehmen",
    "  --allow-manual                manuelle Empfehlungen wirklich ausfuehrbar machen",
    "",
    "Hinweis: Automationen sollen die Autopilot-Fortsetzung aus dem Outcome nutzen, nicht den direkten recording-workflow-Befehl.",
  ].join("\n");
}

export function parseRecordingAutopilotArgs(argv: string[]): RecordingAutopilotOptions {
  validateRecordingAutopilotArgs(argv);
  if (argv.includes("--run") && argv.includes("--preflight")) {
    throw new Error("--run und --preflight duerfen nicht gemeinsam gesetzt werden.");
  }

  const reportFile = path.resolve(valueAfter(argv, "--report") || defaultReportFile);
  const historyJsonlFile = valueAfter(argv, "--history-jsonl")
    ? path.resolve(valueAfter(argv, "--history-jsonl") || "")
    : undefined;
  const includeManual = argv.includes("--include-manual");
  return {
    run: argv.includes("--run"),
    preflight: argv.includes("--preflight"),
    autoOnly: !includeManual,
    allowManual: argv.includes("--allow-manual"),
    refreshCampaign: !argv.includes("--no-refresh"),
    repeat: intArg(argv, "--runs", intArg(argv, "--repeat", 3, 20), 20),
    reportFile,
    reportJsonFile: path.resolve(valueAfter(argv, "--report-json") || reportJsonFileFor(reportFile)),
    outcomeJsonFile: path.resolve(valueAfter(argv, "--outcome-json") || defaultOutcomeJsonFileFor(reportFile)),
    ...(historyJsonlFile ? { historyJsonlFile } : {}),
    ...(historyJsonlFile ? { historyReportFile: path.resolve(valueAfter(argv, "--history-report") || defaultHistoryReportFileFor(historyJsonlFile)) } : {}),
    continueFromFile: valueAfter(argv, "--continue-from") ? path.resolve(valueAfter(argv, "--continue-from") || "") : undefined,
    scoreboardJsonFile: valueAfter(argv, "--scoreboard-json") ? path.resolve(valueAfter(argv, "--scoreboard-json") || "") : undefined,
    recordingUrl: valueAfter(argv, "--url"),
    maxOutcomeAgeMinutes: intArg(argv, "--max-outcome-age-minutes", defaultMaxOutcomeAgeMinutes, 7 * 24 * 60),
  };
}

export function recordingAutopilotNextArgs(options: RecordingAutopilotOptions): string[] {
  const args: string[] = [];
  if (options.refreshCampaign) args.push("--refresh-campaign");
  if (options.autoOnly) args.push("--auto-only");
  if (options.preflight) args.push("--preflight");
  if (options.run) args.push("--run");
  if (options.allowManual) args.push("--allow-manual");
  args.push("--repeat", String(options.repeat));
  if (options.recordingUrl) args.push("--url", options.recordingUrl);
  args.push("--report", options.reportFile);
  args.push("--report-json", options.reportJsonFile);
  if (options.scoreboardJsonFile) args.push("--scoreboard-json", options.scoreboardJsonFile);
  args.push("--print-run-command", "--print-automation-command", "--print-learning");
  return args;
}

export async function runRecordingAutopilot(
  options: RecordingAutopilotOptions,
  hooks: RecordingAutopilotHooks = {},
): Promise<RecordingAutopilotResult> {
  if (options.continueFromFile) return runRecordingAutopilotFromOutcome(options, hooks);

  const nextArgs = recordingAutopilotNextArgs(options);
  const nextResult = await (hooks.runNext || runRecordingNextCli)(nextArgs);
  const outcome = readRecordingAutopilotOutcome(options.reportJsonFile);
  const continuation = recordingAutopilotContinuation(outcome, options);
  writeRecordingAutopilotOutcome(outcome, options, nextArgs, continuation);
  const result: RecordingAutopilotResult = {
    mode: options.run ? "run" : options.preflight ? "preflight" : "dry-run",
    command: commandFromArgs(["tools/recording-next.ts", ...nextArgs]),
    nextArgs,
    nextResult,
    outcome,
    outcomeJsonFile: options.outcomeJsonFile,
    ...(continuation ? { continueCommand: continuation.command, continueArgs: continuation.args } : {}),
    ...(options.historyJsonlFile ? { historyJsonlFile: options.historyJsonlFile } : {}),
    ...(options.historyReportFile ? { historyReportFile: options.historyReportFile } : {}),
  };
  appendRecordingAutopilotHistory(result, options.reportJsonFile, continuation);
  return result;
}

export async function runRecordingAutopilotCli(argv: string[]): Promise<RecordingAutopilotResult> {
  if (isRecordingAutopilotHelpRequest(argv)) {
    const outcome: RecordingAutopilotOutcome = {
      status: "ready",
      reason: "Help-only: keine Aufnahme und keine Sidecars geschrieben.",
      findings: [],
    };
    const result: RecordingAutopilotResult = {
      mode: "dry-run",
      command: "",
      nextArgs: [],
      nextResult: {
        status: "dry-run",
        reason: outcome.reason,
        command: "",
        recommendation: null,
      },
      outcome,
      outcomeJsonFile: "",
    };
    console.log(buildRecordingAutopilotHelp());
    process.exitCode = 0;
    return result;
  }

  const options = parseRecordingAutopilotArgs(argv);
  const result = await runRecordingAutopilot(options);
  for (const line of formatRecordingAutopilotCliLines(result)) console.log(line);
  process.exitCode = recordingAutopilotExitCode(result.outcome);
  return result;
}

export function formatRecordingAutopilotCliLines(result: RecordingAutopilotResult): string[] {
  const lines = [
    `Recording-Autopilot-Status: ${result.outcome.status}`,
    `Recording-Autopilot-Grund: ${result.outcome.reason}`,
  ];
  if (result.outcome.findings.length > 0) {
    lines.push(`Recording-Autopilot-Findings: ${result.outcome.findings.join(", ")}`);
  }
  if (result.continueCommand) {
    lines.push(`Recording-Autopilot-Next-Command: ${result.continueCommand}`);
    if (result.outcome.nextCommand) lines.push(`Recording-Autopilot-Workflow-Command: ${result.outcome.nextCommand}`);
  } else if (result.outcome.nextCommand) {
    lines.push(`Recording-Autopilot-Next-Command: ${result.outcome.nextCommand}`);
  }
  lines.push(`Recording-Autopilot-Outcome-JSON: ${result.outcomeJsonFile}`);
  if (result.historyJsonlFile) lines.push(`Recording-Autopilot-History-JSONL: ${result.historyJsonlFile}`);
  if (result.historyReportFile) lines.push(`Recording-Autopilot-History-Report: ${result.historyReportFile}`);
  if (typeof result.outcomeFresh === "boolean") lines.push(`Recording-Autopilot-Outcome-Fresh: ${result.outcomeFresh}`);
  if (typeof result.outcomeAgeMinutes === "number") lines.push(`Recording-Autopilot-Outcome-Age-Minutes: ${result.outcomeAgeMinutes}`);
  if (typeof result.outcomeMaxAgeMinutes === "number") lines.push(`Recording-Autopilot-Outcome-Max-Age-Minutes: ${result.outcomeMaxAgeMinutes}`);
  lines.push(`Recording-Autopilot-Command: ${result.command}`);
  return lines;
}

function validateRecordingAutopilotArgs(argv: string[]): void {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-")) continue;
    if (recordingAutopilotValueFlags.has(arg)) {
      index += 1;
      continue;
    }
    if (recordingAutopilotBooleanFlags.has(arg)) continue;
    throw new Error(`Unbekannte Recording-Autopilot-Option: ${arg}. Hilfe: node tools/recording-autopilot.ts --help`);
  }
}

async function runRecordingAutopilotFromOutcome(
  options: RecordingAutopilotOptions,
  hooks: RecordingAutopilotHooks,
): Promise<RecordingAutopilotResult> {
  const outcome = readRecordingAutopilotOutcomeSidecar(options.continueFromFile || "");
  const continuationArgs = validAutopilotContinuationArgs(outcome.continueArgs) ? outcome.continueArgs : [];
  const continuationCommand = outcome.continueCommand || (continuationArgs.length > 0 ? commandFromArgs(continuationArgs) : "");
  const freshness = recordingAutopilotOutcomeFreshness(options.continueFromFile || "", options.maxOutcomeAgeMinutes);
  const freshnessResult = recordingAutopilotOutcomeFreshnessResult(freshness);

  if (outcome.status !== "ready" || continuationArgs.length === 0) {
    const blockedOutcome: RecordingAutopilotOutcome = outcome.status === "ready"
      ? {
          status: "blocked",
          reason: "Autopilot-Fortsetzung fehlt oder ist ungueltig.",
          findings: ["continue-args-missing"],
          ...(outcome.reportJsonFile ? { reportJsonFile: outcome.reportJsonFile } : {}),
        }
      : outcome;
    const result: RecordingAutopilotResult = {
      mode: options.run ? "run" : "dry-run",
      command: continuationCommand,
      nextArgs: continuationArgs,
      nextResult: {
        status: "blocked",
        reason: blockedOutcome.reason,
        command: continuationCommand,
        recommendation: null,
      },
      outcome: blockedOutcome,
      outcomeJsonFile: options.continueFromFile || options.outcomeJsonFile,
      ...(continuationArgs.length > 0 ? { continueCommand: continuationCommand, continueArgs: continuationArgs } : {}),
      ...freshnessResult,
      ...(options.historyJsonlFile ? { historyJsonlFile: options.historyJsonlFile } : {}),
      ...(options.historyReportFile ? { historyReportFile: options.historyReportFile } : {}),
    };
    appendRecordingAutopilotHistory(result, outcome.nextReportJsonFile || outcome.reportJsonFile);
    return result;
  }

  if (!options.run) {
    const continuation = recordingAutopilotContinueFromContinuation(options, continuationCommand, continuationArgs);
    const result: RecordingAutopilotResult = {
      mode: "dry-run",
      command: continuationCommand,
      nextArgs: continuationArgs,
      nextResult: {
        status: "dry-run",
        reason: "Continue-From: Fortsetzung wurde nicht ausgefuehrt.",
        command: continuationCommand,
        recommendation: null,
      },
      outcome,
      outcomeJsonFile: options.continueFromFile || options.outcomeJsonFile,
      continueCommand: continuation.command,
      continueArgs: continuation.args,
      ...freshnessResult,
      ...(options.historyJsonlFile ? { historyJsonlFile: options.historyJsonlFile } : {}),
      ...(options.historyReportFile ? { historyReportFile: options.historyReportFile } : {}),
    };
    appendRecordingAutopilotHistory(result, outcome.nextReportJsonFile || outcome.reportJsonFile, continuation);
    return result;
  }

  if (freshness && !freshness.fresh) {
    const blockedOutcome: RecordingAutopilotOutcome = {
      status: "blocked",
      reason: `Outcome-Sidecar ist zu alt (${freshness.ageMinutes} Minuten, Limit ${freshness.maxAgeMinutes} Minuten). Fuehre zuerst einen neuen Autopilot-Preflight oder Dry-Run aus.`,
      findings: ["continue-outcome-stale"],
      ...(outcome.reportJsonFile ? { reportJsonFile: outcome.reportJsonFile } : {}),
    };
    const result: RecordingAutopilotResult = {
      mode: "run",
      command: continuationCommand,
      nextArgs: continuationArgs,
      nextResult: {
        status: "blocked",
        reason: blockedOutcome.reason,
        command: continuationCommand,
        recommendation: null,
      },
      outcome: blockedOutcome,
      outcomeJsonFile: options.continueFromFile || options.outcomeJsonFile,
      ...freshnessResult,
      ...(options.historyJsonlFile ? { historyJsonlFile: options.historyJsonlFile } : {}),
      ...(options.historyReportFile ? { historyReportFile: options.historyReportFile } : {}),
    };
    appendRecordingAutopilotHistory(result, outcome.nextReportJsonFile || outcome.reportJsonFile);
    return result;
  }

  const continuationOptions = parseRecordingAutopilotArgs(continuationArgs.slice(1));
  if (options.historyJsonlFile) continuationOptions.historyJsonlFile = options.historyJsonlFile;
  if (options.historyReportFile) continuationOptions.historyReportFile = options.historyReportFile;
  return runRecordingAutopilot(continuationOptions, hooks);
}

export function recordingAutopilotExitCode(outcome: RecordingAutopilotOutcome): number {
  if (outcome.status === "ready") return 0;
  return outcome.status === "needs-review" ? 2 : 1;
}

export function buildRecordingAutopilotOutcome(report: unknown, reportJsonFile?: string): RecordingAutopilotOutcome {
  if (!isRecord(report)) {
    return {
      status: "missing",
      reason: "Recording-Next-Report-JSON fehlt oder ist ungueltig.",
      findings: ["next-report-json-missing"],
      ...(reportJsonFile ? { reportJsonFile } : {}),
    };
  }

  const summary = isRecord(report.summary) ? report.summary : {};
  const nextAction = isRecord(report.nextAction) ? report.nextAction : {};
  const runEvidence = isRecord(nextAction.runEvidence) ? nextAction.runEvidence : {};
  const findings = arrayOfStrings(runEvidence.findings);
  const evidenceStatus = typeof runEvidence.status === "string" ? runEvidence.status : "";
  const evidenceReason = typeof runEvidence.reason === "string" ? runEvidence.reason : "";
  const gateReason = typeof nextAction.gateReason === "string" ? nextAction.gateReason : "";
  const stopReason = typeof summary.stopReason === "string" ? summary.stopReason : "";
  const nextCommand = typeof nextAction.automationRunCommand === "string" && nextAction.automationRunCommand
    ? nextAction.automationRunCommand
    : undefined;

  if (evidenceStatus === "needs-review" || evidenceStatus === "missing") {
    return {
      status: "needs-review",
      reason: evidenceReason || gateReason || stopReason || "Recording-Evidenz braucht Review.",
      findings,
      ...(reportJsonFile ? { reportJsonFile } : {}),
    };
  }

  if (nextAction.runnable === true) {
    return {
      status: "ready",
      reason: stopReason || "Autopilot ist bereit fuer die naechste Aufnahme.",
      findings,
      ...(reportJsonFile ? { reportJsonFile } : {}),
      ...(nextCommand ? { nextCommand } : {}),
    };
  }

  const gate = typeof nextAction.gate === "string" ? nextAction.gate : "";
  return {
    status: gate === "missing" ? "missing" : "blocked",
    reason: gateReason || stopReason || "Autopilot ist blockiert.",
    findings,
    ...(reportJsonFile ? { reportJsonFile } : {}),
  };
}

function readRecordingAutopilotOutcome(reportJsonFile: string): RecordingAutopilotOutcome {
  try {
    return buildRecordingAutopilotOutcome(JSON.parse(fs.readFileSync(reportJsonFile, "utf8")) as unknown, reportJsonFile);
  } catch {
    return buildRecordingAutopilotOutcome(undefined, reportJsonFile);
  }
}

function readRecordingAutopilotOutcomeSidecar(file: string): RecordingAutopilotOutcomeSidecar {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    if (!isRecord(parsed)) return missingOutcomeSidecar(file);
    const status = recordingAutopilotOutcomeStatus(parsed.status);
    return {
      status,
      reason: typeof parsed.reason === "string" && parsed.reason ? parsed.reason : "Autopilot-Sidecar gelesen.",
      findings: arrayOfStrings(parsed.findings),
      ...(typeof parsed.reportJsonFile === "string" ? { reportJsonFile: parsed.reportJsonFile } : {}),
      ...(typeof parsed.nextCommand === "string" ? { nextCommand: parsed.nextCommand } : {}),
      ...(typeof parsed.continueCommand === "string" ? { continueCommand: parsed.continueCommand } : {}),
      ...(Array.isArray(parsed.continueArgs) ? { continueArgs: arrayOfStrings(parsed.continueArgs) } : {}),
      ...(typeof parsed.nextReportJsonFile === "string" ? { nextReportJsonFile: parsed.nextReportJsonFile } : {}),
      ...(Array.isArray(parsed.nextArgs) ? { nextArgs: arrayOfStrings(parsed.nextArgs) } : {}),
    };
  } catch {
    return missingOutcomeSidecar(file);
  }
}

function missingOutcomeSidecar(file: string): RecordingAutopilotOutcomeSidecar {
  return {
    status: "missing",
    reason: `Autopilot-Outcome-Sidecar fehlt oder ist ungueltig: ${file}`,
    findings: ["outcome-sidecar-missing"],
  };
}

function recordingAutopilotOutcomeFreshness(file: string, maxAgeMinutes: number): RecordingAutopilotOutcomeFreshness | null {
  try {
    const stat = fs.statSync(file);
    const ageMinutes = Math.max(0, Math.ceil((Date.now() - stat.mtimeMs) / 60000));
    return { ageMinutes, maxAgeMinutes, fresh: ageMinutes <= maxAgeMinutes };
  } catch {
    return null;
  }
}

function recordingAutopilotOutcomeFreshnessResult(
  freshness: RecordingAutopilotOutcomeFreshness | null,
): Pick<RecordingAutopilotResult, "outcomeAgeMinutes" | "outcomeMaxAgeMinutes" | "outcomeFresh"> {
  return freshness
    ? {
        outcomeAgeMinutes: freshness.ageMinutes,
        outcomeMaxAgeMinutes: freshness.maxAgeMinutes,
        outcomeFresh: freshness.fresh,
      }
    : {};
}

function recordingAutopilotOutcomeStatus(value: unknown): RecordingAutopilotOutcomeStatus {
  return value === "ready" || value === "needs-review" || value === "blocked" || value === "missing" ? value : "missing";
}

function validAutopilotContinuationArgs(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string") && value[0] === "tools/recording-autopilot.ts";
}

function writeRecordingAutopilotOutcome(
  outcome: RecordingAutopilotOutcome,
  options: RecordingAutopilotOptions,
  nextArgs: string[],
  continuation = recordingAutopilotContinuation(outcome, options),
): void {
  fs.mkdirSync(path.dirname(options.outcomeJsonFile), { recursive: true });
  fs.writeFileSync(options.outcomeJsonFile, `${JSON.stringify({
    ...outcome,
    nextReportJsonFile: options.reportJsonFile,
    nextArgs,
    ...(continuation ? { continueCommand: continuation.command, continueArgs: continuation.runArgs } : {}),
  }, null, 2)}\n`);
}

function appendRecordingAutopilotHistory(
  result: RecordingAutopilotResult,
  nextReportJsonFile?: string,
  continuation?: RecordingAutopilotContinuation | null,
): void {
  if (!result.historyJsonlFile) return;
  const context = nextReportJsonFile ? readRecordingAutopilotHistoryContext(nextReportJsonFile) : {};
  fs.mkdirSync(path.dirname(result.historyJsonlFile), { recursive: true });
  fs.appendFileSync(result.historyJsonlFile, `${JSON.stringify({
    timestamp: new Date().toISOString(),
    mode: result.mode,
    status: result.outcome.status,
    reason: result.outcome.reason,
    findings: result.outcome.findings,
    command: result.command,
    outcomeJsonFile: result.outcomeJsonFile,
    ...(nextReportJsonFile ? { nextReportJsonFile } : {}),
    ...(result.outcome.nextCommand ? { nextCommand: result.outcome.nextCommand } : {}),
    ...(typeof result.outcomeFresh === "boolean" ? { outcomeFresh: result.outcomeFresh } : {}),
    ...(typeof result.outcomeAgeMinutes === "number" ? { outcomeAgeMinutes: result.outcomeAgeMinutes } : {}),
    ...(typeof result.outcomeMaxAgeMinutes === "number" ? { outcomeMaxAgeMinutes: result.outcomeMaxAgeMinutes } : {}),
    ...(continuation ? { continueCommand: continuation.command, continueArgs: continuation.args } : {}),
    ...context,
    ...(result.nextArgs.length > 0 ? { nextArgs: result.nextArgs } : {}),
  })}\n`);
  refreshRecordingAutopilotHistoryReport(result.historyJsonlFile, result.historyReportFile);
}

function refreshRecordingAutopilotHistoryReport(historyJsonlFile: string, historyReportFile?: string): void {
  if (!historyReportFile) return;
  writeRecordingAutopilotHistoryReport(
    buildRecordingAutopilotHistoryReport(readRecordingAutopilotHistory(historyJsonlFile)),
    historyReportFile,
  );
}

function readRecordingAutopilotHistoryContext(reportJsonFile: string): RecordingAutopilotHistoryContext {
  const parsed = readJsonFile(reportJsonFile);
  if (!isRecord(parsed)) return {};
  const summary = isRecord(parsed.summary) ? parsed.summary : {};
  const nextAction = isRecord(parsed.nextAction) ? parsed.nextAction : {};
  const workflowRun = firstRecord(nextAction.workflowRun, summary.lastWorkflowRun);
  const runEvidence = firstRecord(nextAction.runEvidence, summary.lastRunEvidence);
  const learning = isRecord(parsed.learning) ? parsed.learning : undefined;
  return {
    ...(workflowRun ? { workflowRun } : {}),
    ...(runEvidence ? { runEvidence } : {}),
    ...(learning ? { learning } : {}),
  };
}

function firstRecord(...values: unknown[]): Record<string, unknown> | undefined {
  return values.find(isRecord);
}

function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  } catch {
    return undefined;
  }
}

function recordingAutopilotContinuation(
  outcome: RecordingAutopilotOutcome,
  options: RecordingAutopilotOptions,
): RecordingAutopilotContinuation | null {
  if (outcome.status !== "ready") return null;
  const runArgs = ["tools/recording-autopilot.ts", "--run", "--runs", String(options.repeat)];
  if (options.recordingUrl) runArgs.push("--url", options.recordingUrl);
  runArgs.push("--report", options.reportFile);
  runArgs.push("--report-json", options.reportJsonFile);
  runArgs.push("--outcome-json", options.outcomeJsonFile);
  if (!options.refreshCampaign) runArgs.push("--no-refresh");
  if (!options.autoOnly) runArgs.push("--include-manual");
  if (options.allowManual) runArgs.push("--allow-manual");
  if (options.scoreboardJsonFile) runArgs.push("--scoreboard-json", options.scoreboardJsonFile);
  if (options.historyJsonlFile) runArgs.push("--history-jsonl", options.historyJsonlFile);
  if (options.historyReportFile) runArgs.push("--history-report", options.historyReportFile);
  if (options.maxOutcomeAgeMinutes !== defaultMaxOutcomeAgeMinutes) runArgs.push("--max-outcome-age-minutes", String(options.maxOutcomeAgeMinutes));

  const args = ["tools/recording-autopilot.ts", "--continue-from", options.outcomeJsonFile, "--run"];
  if (options.historyJsonlFile) args.push("--history-jsonl", options.historyJsonlFile);
  if (options.historyReportFile) args.push("--history-report", options.historyReportFile);
  if (options.maxOutcomeAgeMinutes !== defaultMaxOutcomeAgeMinutes) args.push("--max-outcome-age-minutes", String(options.maxOutcomeAgeMinutes));

  return {
    command: commandFromArgs(args),
    args,
    runCommand: commandFromArgs(runArgs),
    runArgs,
  };
}

function recordingAutopilotContinueFromContinuation(
  options: RecordingAutopilotOptions,
  command: string,
  runArgs: string[],
): RecordingAutopilotContinuation {
  const args = ["tools/recording-autopilot.ts", "--continue-from", options.continueFromFile || options.outcomeJsonFile, "--run"];
  if (options.historyJsonlFile) args.push("--history-jsonl", options.historyJsonlFile);
  if (options.historyReportFile) args.push("--history-report", options.historyReportFile);
  if (options.maxOutcomeAgeMinutes !== defaultMaxOutcomeAgeMinutes) args.push("--max-outcome-age-minutes", String(options.maxOutcomeAgeMinutes));
  return {
    command: command || commandFromArgs(args),
    args,
    runCommand: commandFromArgs(runArgs),
    runArgs,
  };
}

function reportJsonFileFor(reportFile: string): string {
  return path.join(path.dirname(reportFile), `${path.basename(reportFile, path.extname(reportFile))}.json`);
}

function defaultOutcomeJsonFileFor(reportFile: string): string {
  if (reportFile === defaultReportFile) {
    return path.join(path.dirname(defaultReportFile), "recording-autopilot-outcome.json");
  }
  return path.join(path.dirname(reportFile), `${path.basename(reportFile, path.extname(reportFile))}-outcome.json`);
}

function defaultHistoryReportFileFor(historyJsonlFile: string): string {
  return path.join(path.dirname(historyJsonlFile), `${path.basename(historyJsonlFile, path.extname(historyJsonlFile))}.md`);
}

function intArg(argv: string[], name: string, fallback: number, max: number): number {
  const raw = valueAfter(argv, name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function valueAfter(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function commandFromArgs(args: string[]): string {
  return ["node", ...args.map(shellArg)].join(" ");
}

function shellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) return value;
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
