import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { RecordingNextRecommendation } from "./recording-campaign.ts";
import { evaluateNetworkLogQuality } from "./recording-audit.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultNextFile = path.join(workspaceRoot, "docs", "recordings", "recording-campaign-next.json");
const defaultNextAutoFile = path.join(workspaceRoot, "docs", "recordings", "recording-campaign-next-auto.json");
const defaultReportFile = path.join(workspaceRoot, "docs", "recordings", "recording-next-report.md");
const defaultReportJsonFile = path.join(workspaceRoot, "docs", "recordings", "recording-next-report.json");
const defaultScoreboardJsonFile = path.join(workspaceRoot, "docs", "recordings", "recording-scoreboard.json");

export type RecordingNextOptions = {
  file: string;
  reportFile: string;
  reportJsonFile: string;
  scoreboardJsonFile: string;
  workflowPreflightFile: string;
  workflowPreflightJsonFile: string;
  recordingUrl?: string;
  run: boolean;
  preflight: boolean;
  allowManual: boolean;
  refreshCampaign: boolean;
  autoOnly: boolean;
  printRunCommand: boolean;
  printAutomationCommand: boolean;
  printLearning: boolean;
  repeat: number;
};

export type RecordingNextResult = {
  status: "dry-run" | "preflighted" | "executed" | "blocked" | "missing" | "stalled";
  reason: string;
  command: string;
  recommendation: RecordingNextRecommendation | null;
  workflowPreflight?: RecordingNextWorkflowPreflight;
  workflowRun?: RecordingNextWorkflowRun;
  runEvidence?: RecordingNextRunEvidence;
};

export type RecordingNextWorkflowPreflight = {
  file: string;
  jsonFile: string;
  status?: string;
  runCommand?: string;
  runArgs?: string[];
};

export type RecordingNextWorkflowRun = {
  manifestFile: string;
  mode?: string;
  purpose?: string;
  status?: string;
  auditStatus?: string;
  logFile?: string;
  summaryFile?: string;
  impactFile?: string;
  impactJsonFile?: string;
  targetResponses?: number;
  targetEndpointCount?: number;
  newEndpointCount?: number;
  newKnownInventoryCount?: number;
  coverageDeltaPercent?: number;
  downloads?: number;
  topAreas?: string[];
  expectedEndpoints?: Array<{ method: string; path: string; source?: string; observed: boolean }>;
  expectedEndpointsTotal?: number;
  expectedEndpointsObserved?: number;
  expectedEndpointsMissing?: number;
  explorerClickedTargets?: number;
  explorerOpenTargets?: number;
  explorerBlockedRequests?: number;
  explorerStopReason?: string;
};

export type RecordingNextRunEvidence = {
  status: "ok" | "needs-review" | "missing";
  reason: string;
  findings: string[];
  manifestFile?: string;
  logFile?: string;
  targetResponses?: number;
  expectedEndpointsObserved?: number;
  expectedEndpointsMissing?: number;
};

export type RecordingNextLoopResult = {
  status: RecordingNextResult["status"];
  results: RecordingNextResult[];
};

export type RecordingNextHooks = {
  execute?: (args: string[]) => Promise<void> | void;
  refreshCampaign?: (args: string[]) => Promise<void> | void;
  workflowPreflightFile?: string;
  workflowPreflightJsonFile?: string;
};

export type RecordingNextReportOptions = {
  generatedAt?: Date;
  run: boolean;
  preflight?: boolean;
  autoOnly: boolean;
  allowManual?: boolean;
  refreshCampaign?: boolean;
  repeat: number;
  sourceFile: string;
  jsonFile?: string;
  scoreboardJsonFile?: string;
  recordingUrl?: string;
};

export type RecordingNextActionGate = "ready" | "manual-approval-required" | "auto-only-blocked" | "blocked" | "stalled" | "missing";
export type RecordingNextQualityGate = "ready" | "needs-review" | "missing-learning";
export type RecordingNextAutomationDecision = "run" | "record-quality-baseline" | "bootstrap-recording" | "blocked";

export type RecordingNextAction = {
  available: boolean;
  runnable?: boolean;
  gate?: RecordingNextActionGate;
  gateReason?: string;
  qualityGate?: RecordingNextQualityGate;
  qualityGateReason?: string;
  automationDecision?: RecordingNextAutomationDecision;
  automationDecisionReason?: string;
  learningStatus?: RecordingNextLearningState["status"];
  learningRecommendedAction?: RecordingNextLearningState["recommendedAction"];
  learningRecommendedReason?: string;
  status?: RecordingNextResult["status"];
  priority?: string;
  label?: string;
  reason?: string;
  mode?: "auto" | "manual";
  command?: string;
  runCommand?: string;
  runArgs?: string[];
  automationRunCommand?: string;
  automationRunArgs?: string[];
  targetUrl?: string;
  args?: string[];
  startPath?: string;
  maxSteps?: number;
  maxMinutes?: number;
  expectedEndpoints?: Array<{ method: string; path: string }>;
};

export type RecordingNextLearningState = {
  status: "ok" | "needs-review" | "missing";
  recommendedAction: "bootstrap-recording" | "record-quality-baseline" | "continue-coverage-recording";
  recommendedReason: string;
  sourceFile: string;
  recordingCount: number;
  recordingsNeedingReview: number;
  finalCoveragePercent: number;
  totalNewEndpoints: number;
  totalNewKnownInventoryEndpoints: number;
  expectedEndpointHitRatePercent: number;
  totalExplorerClickedTargets: number;
  totalExplorerOpenTargets: number;
  lastRecording?: {
    file: string;
    purpose?: string;
    qualityStatus: string;
    newEndpoints: number;
    newKnownInventoryEndpoints: number;
    coverageDeltaPercent: number;
    expectedEndpointsObserved: number;
    expectedEndpointsMissing: number;
    explorerClickedTargets: number;
    explorerOpenTargets: number;
    topAreas: string[];
  };
};

type RunNextRecordingOptions = RecordingNextOptions & {
  seenCommands?: Set<string>;
};

const recordingNextValueFlags = new Set([
  "--file",
  "--repeat",
  "--report",
  "--report-json",
  "--scoreboard-json",
  "--url",
  "--workflow-preflight-json",
  "--workflow-preflight-out",
]);

const recordingNextBooleanFlags = new Set([
  "--allow-manual",
  "--auto-only",
  "--help",
  "--preflight",
  "--print-automation-command",
  "--print-learning",
  "--print-run-command",
  "--refresh-campaign",
  "--run",
  "-h",
]);

if (isMainModule()) {
  runRecordingNextCli(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}

export function isRecordingNextHelpRequest(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

export function buildRecordingNextHelp(): string {
  return [
    "Recording-Next",
    "",
    "Liest die naechste Recording-Empfehlung, prueft Gates und schreibt den maschinenlesbaren Next-Report.",
    "",
    "Dry-Run mit frischer Campaign:",
    "  node tools/recording-next.ts --refresh-campaign --auto-only --url https://api2.optica-omnia.de",
    "",
    "Preflight ohne Live-Aufnahme:",
    "  node tools/recording-next.ts --refresh-campaign --auto-only --preflight --print-run-command --print-automation-command",
    "",
    "Ausfuehrung nur bei freigegebenem Gate:",
    "  node tools/recording-next.ts --refresh-campaign --auto-only --run --repeat 3",
    "",
    "Wichtige Optionen:",
    "  --file <datei>                  Recommendation-Sidecar",
    "  --auto-only                     manuelle Empfehlungen blockieren",
    "  --refresh-campaign              Campaign vor der Entscheidung neu bauen",
    "  --preflight                     nur Workflow-Preflight ausfuehren",
    "  --run                           freigegebenen Workflow wirklich starten",
    "  --repeat <n>                    mehrere Auto-Laeufe mit Gate zwischen Iterationen",
    "  --report <datei>                Markdown-Report",
    "  --report-json <datei>           JSON-Report, default recording-next-report.json",
    "  --scoreboard-json <datei>       Lernstand fuer Quality-Gates",
    "  --print-run-command             freigegebenen Workflow-Befehl ausgeben",
    "  --print-automation-command      Automationsbefehl ausgeben",
    "  --print-learning                kompakte Lernbilanz ausgeben",
    "",
    "Hinweis: Der Autopilot ruft diesen Runner mit Gate- und Evidence-Pruefung auf.",
  ].join("\n");
}

export function parseRecordingNextArgs(argv: string[]): RecordingNextOptions {
  validateRecordingNextArgs(argv);
  const autoOnly = argv.includes("--auto-only");
  const reportFile = path.resolve(valueAfter(argv, "--report") || defaultReportFile);
  return {
    file: path.resolve(valueAfter(argv, "--file") || (autoOnly ? defaultNextAutoFile : defaultNextFile)),
    reportFile,
    reportJsonFile: path.resolve(valueAfter(argv, "--report-json") || reportJsonFileFor(reportFile)),
    scoreboardJsonFile: path.resolve(valueAfter(argv, "--scoreboard-json") || defaultScoreboardJsonFile),
    workflowPreflightFile: path.resolve(valueAfter(argv, "--workflow-preflight-out") || workflowPreflightFileFor(reportFile)),
    workflowPreflightJsonFile: path.resolve(valueAfter(argv, "--workflow-preflight-json") || workflowPreflightJsonFileFor(reportFile)),
    recordingUrl: valueAfter(argv, "--url"),
    run: argv.includes("--run"),
    preflight: argv.includes("--preflight"),
    allowManual: argv.includes("--allow-manual"),
    refreshCampaign: argv.includes("--refresh-campaign"),
    autoOnly,
    printRunCommand: argv.includes("--print-run-command"),
    printAutomationCommand: argv.includes("--print-automation-command"),
    printLearning: argv.includes("--print-learning"),
    repeat: intArg(argv, "--repeat", 1, 20),
  };
}

export function loadNextRecordingRecommendation(file = defaultNextFile): RecordingNextRecommendation {
  if (!fs.existsSync(file)) {
    throw new Error(`Next-Recording-Datei fehlt: ${file}`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  return validateRecommendation(parsed);
}

export async function runRecordingNextCli(argv: string[]): Promise<RecordingNextResult> {
  if (isRecordingNextHelpRequest(argv)) {
    const result: RecordingNextResult = {
      status: "dry-run",
      reason: "Help-only: kein Report geschrieben und keine Aufnahme gestartet.",
      command: "",
      recommendation: null,
    };
    console.log(buildRecordingNextHelp());
    process.exitCode = 0;
    return result;
  }

  const options = parseRecordingNextArgs(argv);
  const loop = await runNextRecordingLoop(options);
  const result = loop.results.at(-1) || {
    status: "missing" as const,
    reason: "Keine Next-Recording-Empfehlung verfuegbar.",
    command: "",
    recommendation: null,
  };
  const reportOptions = {
    run: options.run,
    preflight: options.preflight,
    autoOnly: options.autoOnly,
    allowManual: options.allowManual,
    refreshCampaign: options.refreshCampaign,
    repeat: options.repeat,
    sourceFile: options.file,
    jsonFile: options.reportJsonFile,
    scoreboardJsonFile: options.scoreboardJsonFile,
    recordingUrl: options.recordingUrl,
  };
  writeRecordingNextReport(loop, options.reportFile, reportOptions);
  console.log(formatRecordingNextLoopResult(loop));
  if (options.printRunCommand) {
    console.log(`Recording-Run-Command: ${formatRecordingNextRunCommand(loop, reportOptions) || "-"}`);
  }
  if (options.printAutomationCommand) {
    console.log(`Recording-Automation-Command: ${formatRecordingNextAutomationCommand(loop, reportOptions) || "-"}`);
  }
  if (options.printLearning) {
    console.log(`Recording-Learning: ${formatRecordingNextLearning(options.scoreboardJsonFile) || "-"}`);
  }
  console.log(`Recording-Next-Report: ${options.reportFile}`);
  console.log(`Recording-Next-Report-JSON: ${options.reportJsonFile}`);
  if (result.status === "blocked") process.exitCode = 1;
  return result;
}

function validateRecordingNextArgs(argv: string[]): void {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-")) continue;
    if (recordingNextValueFlags.has(arg)) {
      index += 1;
      continue;
    }
    if (recordingNextBooleanFlags.has(arg)) continue;
    throw new Error(`Unbekannte Recording-Next-Option: ${arg}. Hilfe: node tools/recording-next.ts --help`);
  }
}

export function formatRecordingNextLoopResult(loop: RecordingNextLoopResult): string {
  if (loop.results.length === 0) return "Keine Next-Recording-Empfehlung verfuegbar.";
  if (loop.results.length === 1) return formatRecordingNextResult(loop.results[0]);
  return loop.results.map((result, index) => `${index + 1}. ${formatRecordingNextResult(result)}`).join("\n");
}

export function formatRecordingNextResult(result: RecordingNextResult): string {
  if (result.status === "blocked" || result.status === "missing" || result.status === "stalled") return result.reason;
  return result.command || result.reason;
}

export function formatRecordingNextRunCommand(loop: RecordingNextLoopResult, options: RecordingNextReportOptions): string {
  const action = recordingNextAction(loop, options);
  if (!action.runnable) return "";
  if (action.runCommand) return action.runCommand;
  if (action.status === "preflighted") return "";
  return action.command || "";
}

export function formatRecordingNextAutomationCommand(loop: RecordingNextLoopResult, options: RecordingNextReportOptions): string {
  const action = recordingNextAction(loop, options, recordingNextLearningState(options.scoreboardJsonFile));
  return action.automationRunCommand || "";
}

export function formatRecordingNextLearning(scoreboardJsonFile: string | undefined): string {
  const learning = recordingNextLearningState(scoreboardJsonFile);
  if (!learning) return "";
  const last = learning.lastRecording;
  const purposeText = last?.purpose ? `, Zweck ${last.purpose}` : "";
  const lastText = last
    ? `letzter Beitrag ${last.newEndpoints}/${last.newKnownInventoryEndpoints}, Delta ${formatNumber(last.coverageDeltaPercent)} %, Qualitaet ${last.qualityStatus || "-"}${purposeText}`
    : "letzter Beitrag -";
  return [
    `Status ${learning.status}`,
    `Aktion ${learning.recommendedAction}`,
    `Coverage ${formatNumber(learning.finalCoveragePercent)} %`,
    `Recordings ${learning.recordingCount}`,
    `Review ${learning.recordingsNeedingReview}`,
    `neue Endpunkte ${learning.totalNewEndpoints}`,
    `Inventar ${learning.totalNewKnownInventoryEndpoints}`,
    lastText,
  ].join(", ");
}

export function buildRecordingNextReportMarkdown(loop: RecordingNextLoopResult, options: RecordingNextReportOptions): string {
  const lines = [
    "# Recording-Next-Report",
    "",
    `Generiert: ${(options.generatedAt || new Date()).toISOString()}`,
    `Status: ${loop.status}`,
    `Modus: ${options.preflight ? "preflight" : options.run ? "run" : "dry-run"}`,
    `Auto-only: ${options.autoOnly ? "ja" : "nein"}`,
    `Repeat-Limit: ${options.repeat}`,
    `Quelle: \`${options.sourceFile}\``,
    "",
    "## Iterationen",
    "",
  ];

  if (loop.results.length === 0) {
    lines.push("- Keine Next-Recording-Empfehlung verfuegbar.", "");
  } else {
    for (const [index, result] of loop.results.entries()) {
      lines.push(`### ${index + 1}. ${result.recommendation?.label || "-"}`, "");
      lines.push(`- Status: ${result.status}`);
      lines.push(`- Prioritaet: ${result.recommendation?.priority || "-"}`);
      lines.push(`- Modus: ${result.recommendation?.mode || "-"}`);
      lines.push(`- Grund: ${result.reason}`);
      if (result.workflowPreflight) {
        lines.push(`- Workflow-Preflight-Status: ${result.workflowPreflight.status || "unbekannt"}`);
        lines.push(`- Workflow-Preflight-Report: \`${result.workflowPreflight.file}\``);
        lines.push(`- Workflow-Preflight-JSON: \`${result.workflowPreflight.jsonFile}\``);
        if (result.workflowPreflight.runCommand) {
          lines.push("- Workflow-Startbefehl:");
          lines.push("```bash");
          lines.push(result.workflowPreflight.runCommand);
          lines.push("```");
        }
      }
      if (result.workflowRun) {
        lines.push("- Workflow-Run:");
        lines.push(`  - Manifest: \`${result.workflowRun.manifestFile}\``);
        lines.push(`  - Status: ${result.workflowRun.status || "-"}`);
        lines.push(`  - Netzwerk-Log: \`${result.workflowRun.logFile || "-"}\``);
        if (typeof result.workflowRun.targetResponses === "number") lines.push(`  - API-Responses: ${result.workflowRun.targetResponses}`);
        if (typeof result.workflowRun.newEndpointCount === "number") lines.push(`  - Neue Endpunkte: ${result.workflowRun.newEndpointCount}`);
        if (typeof result.workflowRun.newKnownInventoryCount === "number") lines.push(`  - Neue bekannte Inventar-Endpunkte: ${result.workflowRun.newKnownInventoryCount}`);
        if (typeof result.workflowRun.coverageDeltaPercent === "number") lines.push(`  - Coverage-Delta: ${formatNumber(result.workflowRun.coverageDeltaPercent)} %`);
        if (typeof result.workflowRun.expectedEndpointsTotal === "number") {
          lines.push(`  - Erwartete Endpunkte: ${result.workflowRun.expectedEndpointsObserved || 0}/${result.workflowRun.expectedEndpointsTotal} gesehen`);
        }
      }
      if (result.runEvidence) {
        lines.push("- Run-Evidenz:");
        lines.push(`  - Status: ${result.runEvidence.status}`);
        lines.push(`  - Grund: ${result.runEvidence.reason}`);
        lines.push(`  - Findings: ${result.runEvidence.findings.join(", ") || "-"}`);
      }
      if (result.command) {
        lines.push("- Next-Befehl:");
        lines.push("```bash");
        lines.push(result.command);
        lines.push("```");
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function writeRecordingNextReport(
  loop: RecordingNextLoopResult,
  outputFile: string,
  options: RecordingNextReportOptions,
): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildRecordingNextReportMarkdown(loop, options));
  const jsonFile = options.jsonFile || reportJsonFileFor(outputFile);
  fs.mkdirSync(path.dirname(jsonFile), { recursive: true });
  fs.writeFileSync(jsonFile, `${JSON.stringify(recordingNextReportJson(loop, options), null, 2)}\n`);
  return outputFile;
}

export async function runNextRecordingLoop(
  options: RecordingNextOptions,
  hooks: RecordingNextHooks = {},
): Promise<RecordingNextLoopResult> {
  const results: RecordingNextResult[] = [];
  const seenCommands = new Set<string>();
  const iterations = options.run && !options.preflight ? options.repeat : 1;

  for (let index = 0; index < iterations; index += 1) {
    const result = await runNextRecording({
      ...options,
      refreshCampaign: options.refreshCampaign || index > 0,
      seenCommands,
    }, hooks);
    results.push(result);
    const recommendationKey = result.recommendation ? recordingRecommendationKey(result.recommendation) : "";
    if (result.status === "executed" && recommendationKey) seenCommands.add(recommendationKey);
    if (result.status === "executed" && result.runEvidence?.status !== "ok") break;
    if (result.status !== "executed") break;
  }

  return {
    status: results.at(-1)?.status || "missing",
    results,
  };
}

export async function runNextRecording(
  options: RunNextRecordingOptions,
  hooks: RecordingNextHooks = {},
): Promise<RecordingNextResult> {
  if (options.refreshCampaign) {
    await (hooks.refreshCampaign || defaultRefreshCampaign)(refreshCampaignArgs(options));
  }

  if (!fs.existsSync(options.file)) {
    return {
      status: "missing",
      reason: `Next-Recording-Datei fehlt: ${options.file}`,
      command: "",
      recommendation: null,
    };
  }

  const recommendation = loadNextRecordingRecommendation(options.file);
  const blocked = executionBlocker(options, recommendation);
  if (blocked && (options.run || options.preflight)) return blocked;
  const executionArgs = recordingNextExecutionArgs(recommendation.args, options);
  const executionCommand = commandFromArgs(executionArgs);

  if (options.preflight) {
    const workflowPreflightFile = hooks.workflowPreflightFile || options.workflowPreflightFile;
    const workflowPreflightJsonFile = hooks.workflowPreflightJsonFile || options.workflowPreflightJsonFile;
    const args = preflightArgs(executionArgs, {
      file: workflowPreflightFile,
      jsonFile: workflowPreflightJsonFile,
    });
    let executeError: unknown;
    try {
      await (hooks.execute || defaultExecute)(args);
    } catch (error) {
      executeError = error;
    }
    const workflowPreflight = readWorkflowPreflight(workflowPreflightFile, workflowPreflightJsonFile);
    if (executeError) {
      if (workflowPreflight.status === "blocked") {
        return {
          status: "blocked",
          reason: "Workflow-Preflight ist blockiert; Aufnahme nicht starten.",
          command: commandFromArgs(args),
          recommendation,
          workflowPreflight,
        };
      }
      throw executeError;
    }
    return {
      status: "preflighted",
      reason: "Next-Recording-Preflight wurde ausgefuehrt.",
      command: commandFromArgs(args),
      recommendation,
      workflowPreflight,
    };
  }

  if (!options.run) {
    return {
      status: "dry-run",
      reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
      command: recommendation.command,
      recommendation,
    };
  }

  const recommendationKey = recordingRecommendationKey(recommendation);
  if (options.seenCommands?.has(recommendationKey)) {
    return {
      status: "stalled",
      reason: "Auto-Pilot gestoppt: Campaign liefert erneut dieselbe Recording-Empfehlung.",
      command: executionCommand,
      recommendation,
    };
  }

  const manifestSnapshot = snapshotWorkflowManifests();
  await (hooks.execute || defaultExecute)(executionArgs);
  const workflowRun = readWorkflowRun(executionArgs, manifestSnapshot);
  const runEvidence = recordingRunEvidence(workflowRun);
  return {
    status: "executed",
    reason: "Next-Recording wurde ausgefuehrt.",
    command: executionCommand,
    recommendation,
    ...(workflowRun ? { workflowRun } : {}),
    runEvidence,
  };
}

function recordingRecommendationKey(recommendation: RecordingNextRecommendation): string {
  return JSON.stringify(withoutFlagValue(recommendation.args, "--purpose"));
}

function recordingNextExecutionArgs(args: string[], options: Pick<RecordingNextOptions, "scoreboardJsonFile">): string[] {
  const purpose = recordingPurposeForLearning(recordingNextLearningState(options.scoreboardJsonFile));
  return purpose ? withFlagValue(args, "--purpose", purpose) : args;
}

function recordingPurposeForLearning(learning: RecordingNextLearningState | undefined): string | undefined {
  const status = learning?.status || "missing";
  if (status === "missing") return recordingPurposeForDecision("bootstrap-recording");
  if (status === "needs-review") return recordingPurposeForDecision("record-quality-baseline");
  return undefined;
}

function validateRecommendation(value: unknown): RecordingNextRecommendation {
  if (!isRecord(value)) throw new Error("Next-Recording-Empfehlung ist kein Objekt.");

  const priority = stringField(value, "priority");
  const label = stringField(value, "label");
  const reason = stringField(value, "reason");
  const mode = stringField(value, "mode");
  const command = stringField(value, "command");
  const args = arrayOfStrings(value.args);

  if (mode !== "auto" && mode !== "manual") {
    throw new Error(`Ungueltiger Recording-Modus: ${mode}`);
  }
  if (args[0] !== "tools/recording-workflow.ts") {
    throw new Error("Next-Recording darf nur tools/recording-workflow.ts ausfuehren.");
  }

  return { priority, label, reason, mode, command, args };
}

function defaultExecute(args: string[]): void {
  execFileSync(process.execPath, args, { cwd: workspaceRoot, stdio: "inherit" });
}

function defaultRefreshCampaign(args: string[]): void {
  execFileSync(process.execPath, args, { cwd: workspaceRoot, stdio: "inherit" });
}

function executionBlocker(
  options: Pick<RecordingNextOptions, "autoOnly" | "allowManual">,
  recommendation: RecordingNextRecommendation,
): RecordingNextResult | null {
  if (options.autoOnly && recommendation.mode !== "auto") {
    return {
      status: "blocked",
      reason: "Auto-only-Modus fuehrt keine manuellen Aufnahmen aus.",
      command: recommendation.command,
      recommendation,
    };
  }

  if (recommendation.mode === "manual" && !options.allowManual) {
    return {
      status: "blocked",
      reason: "Manuelle Aufnahme nur mit --allow-manual ausfuehren.",
      command: recommendation.command,
      recommendation,
    };
  }

  return null;
}

function preflightArgs(args: string[], files: { file: string; jsonFile: string }): string[] {
  let next = args.includes("--preflight") ? [...args] : [...args, "--preflight"];
  next = withFlagValue(next, "--preflight-out", files.file);
  next = withFlagValue(next, "--preflight-json", files.jsonFile);
  return next;
}

function refreshCampaignArgs(options: Pick<RecordingNextOptions, "recordingUrl">): string[] {
  const args = ["tools/recording-campaign.ts"];
  if (options.recordingUrl) args.push("--url", options.recordingUrl);
  return args;
}

function commandFromArgs(args: string[]): string {
  return ["node", ...args.map(shellArg)].join(" ");
}

function readWorkflowPreflight(file: string, jsonFile: string): RecordingNextWorkflowPreflight {
  const result: RecordingNextWorkflowPreflight = { file, jsonFile };
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8")) as unknown;
    if (isRecord(parsed)) {
      if (typeof parsed.status === "string") result.status = parsed.status;
      if (typeof parsed.runCommand === "string" && parsed.runCommand) result.runCommand = parsed.runCommand;
      if (Array.isArray(parsed.runArgs) && parsed.runArgs.every((item) => typeof item === "string")) {
        result.runArgs = parsed.runArgs;
      }
    }
  } catch {
    // Der Workflow-Prozess kann einen Fehler vor dem Schreiben des JSON melden.
  }
  return result;
}

function readWorkflowRun(args: string[], manifestSnapshot: Map<string, number>): RecordingNextWorkflowRun | undefined {
  const manifestFile = valueAfter(args, "--manifest") || latestChangedWorkflowManifest(manifestSnapshot);
  if (!manifestFile || !fs.existsSync(manifestFile)) return undefined;
  const parsed = readJsonFile(manifestFile);
  if (!isRecord(parsed)) return undefined;
  const artifacts = isRecord(parsed.artifacts) ? parsed.artifacts : {};
  const impact = isRecord(parsed.impact) ? parsed.impact : {};
  const explorer = isRecord(parsed.explorer) ? parsed.explorer : {};
  const expectedEndpoints = compactExpectedEndpoints(parsed.expectedEndpoints);
  const expectedEndpointsObserved = expectedEndpoints.filter((endpoint) => endpoint.observed).length;

  return {
    manifestFile,
    ...stringProperty(parsed, "mode"),
    ...stringProperty(parsed, "purpose"),
    ...stringProperty(parsed, "status"),
    ...stringProperty(parsed, "auditStatus"),
    ...artifactProperty(artifacts, "logFile"),
    ...artifactProperty(artifacts, "summaryFile"),
    ...artifactProperty(artifacts, "impactFile"),
    ...artifactProperty(artifacts, "impactJsonFile"),
    ...numberProperty(impact, "targetResponses"),
    ...numberProperty(impact, "targetEndpointCount"),
    ...numberProperty(impact, "newEndpointCount"),
    ...numberProperty(impact, "newKnownInventoryCount"),
    ...numberProperty(impact, "coverageDeltaPercent"),
    ...numberProperty(impact, "downloads"),
    ...topAreasProperty(impact),
    ...(expectedEndpoints.length > 0
      ? {
          expectedEndpoints,
          expectedEndpointsTotal: expectedEndpoints.length,
          expectedEndpointsObserved,
          expectedEndpointsMissing: expectedEndpoints.length - expectedEndpointsObserved,
        }
      : {}),
    ...renamedNumberProperty(explorer, "clickedTargets", "explorerClickedTargets"),
    ...renamedNumberProperty(explorer, "openTargets", "explorerOpenTargets"),
    ...renamedNumberProperty(explorer, "blockedRequests", "explorerBlockedRequests"),
    ...renamedStringProperty(explorer, "stopReason", "explorerStopReason"),
  };
}

function recordingRunEvidence(workflowRun: RecordingNextWorkflowRun | undefined): RecordingNextRunEvidence {
  if (!workflowRun) {
    return {
      status: "missing",
      reason: "Workflow-Manifest wurde nach dem Run nicht gefunden.",
      findings: ["workflow-manifest-missing"],
    };
  }

  const findings: string[] = [];
  const logFileReady = Boolean(workflowRun.logFile && fileExistsWithContent(workflowRun.logFile));
  const logQuality = logFileReady ? evaluateNetworkLogQuality(readJsonLineRecords(workflowRun.logFile || "")) : undefined;
  const targetResponses = logQuality ? logQuality.apiResponseCount : workflowRun.targetResponses;
  if (workflowRun.status && workflowRun.status !== "completed") findings.push("workflow-not-completed");
  if (!logFileReady) findings.push("network-log-missing");
  for (const finding of logQuality?.findings || []) findings.push(finding.pattern);
  if ((workflowRun.expectedEndpointsMissing || 0) > 0) findings.push("expected-endpoints-missing");

  return {
    status: findings.length > 0 ? "needs-review" : "ok",
    reason: findings.length > 0
      ? `Workflow-Run braucht Review: ${findings.join(", ")}.`
      : "Workflow-Run hat verwertbare Aufnahme-Evidenz geliefert.",
    findings,
    manifestFile: workflowRun.manifestFile,
    ...(workflowRun.logFile ? { logFile: workflowRun.logFile } : {}),
    ...(typeof targetResponses === "number" ? { targetResponses } : {}),
    ...(typeof workflowRun.expectedEndpointsObserved === "number" ? { expectedEndpointsObserved: workflowRun.expectedEndpointsObserved } : {}),
    ...(typeof workflowRun.expectedEndpointsMissing === "number" ? { expectedEndpointsMissing: workflowRun.expectedEndpointsMissing } : {}),
  };
}

function fileExistsWithContent(file: string): boolean {
  try {
    return fs.statSync(file).size > 0;
  } catch {
    return false;
  }
}

function readJsonLineRecords(file: string): Record<string, unknown>[] {
  try {
    return fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => {
        if (!line.trim()) return false;
        try {
          const parsed = JSON.parse(line) as unknown;
          return isRecord(parsed) ? parsed : false;
        } catch {
          return false;
        }
      })
      .filter((record): record is Record<string, unknown> => Boolean(record));
  } catch {
    return [];
  }
}

function snapshotWorkflowManifests(): Map<string, number> {
  const snapshot = new Map<string, number>();
  for (const file of workflowManifestFiles()) {
    try {
      snapshot.set(file, fs.statSync(file).mtimeMs);
    } catch {
      // Datei kann zwischen Directory-Read und stat verschwinden.
    }
  }
  return snapshot;
}

function latestChangedWorkflowManifest(snapshot: Map<string, number>): string | undefined {
  const changed = workflowManifestFiles()
    .map((file) => {
      try {
        return { file, mtimeMs: fs.statSync(file).mtimeMs };
      } catch {
        return null;
      }
    })
    .filter((item): item is { file: string; mtimeMs: number } => Boolean(item))
    .filter((item) => !snapshot.has(item.file) || item.mtimeMs > (snapshot.get(item.file) || 0))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return changed[0]?.file;
}

function workflowManifestFiles(): string[] {
  const dir = path.join(workspaceRoot, "docs", "recordings");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith("-workflow-manifest.json"))
    .map((file) => path.join(dir, file));
}

function compactExpectedEndpoints(value: unknown): Array<{ method: string; path: string; source?: string; observed: boolean }> {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((endpoint) => ({
    method: typeof endpoint.method === "string" ? endpoint.method : "",
    path: typeof endpoint.path === "string" ? endpoint.path : "",
    ...(typeof endpoint.source === "string" ? { source: endpoint.source } : {}),
    observed: endpoint.observed === true,
  })).filter((endpoint) => endpoint.method && endpoint.path);
}

function artifactProperty(record: Record<string, unknown>, key: keyof RecordingNextWorkflowRun): Partial<RecordingNextWorkflowRun> {
  const value = record[key];
  return typeof value === "string" && value ? { [key]: value } : {};
}

function stringProperty(record: Record<string, unknown>, key: keyof RecordingNextWorkflowRun): Partial<RecordingNextWorkflowRun> {
  const value = record[key];
  return typeof value === "string" && value ? { [key]: value } : {};
}

function renamedStringProperty(record: Record<string, unknown>, sourceKey: string, targetKey: keyof RecordingNextWorkflowRun): Partial<RecordingNextWorkflowRun> {
  const value = record[sourceKey];
  return typeof value === "string" && value ? { [targetKey]: value } : {};
}

function numberProperty(record: Record<string, unknown>, key: keyof RecordingNextWorkflowRun): Partial<RecordingNextWorkflowRun> {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? { [key]: value } : {};
}

function renamedNumberProperty(record: Record<string, unknown>, sourceKey: string, targetKey: keyof RecordingNextWorkflowRun): Partial<RecordingNextWorkflowRun> {
  const value = record[sourceKey];
  return typeof value === "number" && Number.isFinite(value) ? { [targetKey]: value } : {};
}

function topAreasProperty(impact: Record<string, unknown>): Partial<RecordingNextWorkflowRun> {
  if (!Array.isArray(impact.topAreas)) return {};
  const topAreas = impact.topAreas
    .filter(isRecord)
    .map((area) => (typeof area.area === "string" ? area.area : ""))
    .filter(Boolean)
    .slice(0, 5);
  return topAreas.length > 0 ? { topAreas } : {};
}

function withFlagValue(args: string[], flag: string, value: string): string[] {
  const index = args.indexOf(flag);
  if (index >= 0) {
    const next = [...args];
    next[index + 1] = value;
    return next;
  }
  return [...args, flag, value];
}

function withoutFlagValue(args: string[], flag: string): string[] {
  const result: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag) {
      index += 1;
      continue;
    }
    result.push(args[index]);
  }
  return result;
}

function shellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) return value;
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function stringField(record: Record<string, unknown>, key: string): string {
  if (typeof record[key] !== "string" || record[key] === "") {
    throw new Error(`Next-Recording-Feld fehlt oder ist ungueltig: ${key}`);
  }
  return record[key] as string;
}

function arrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string")) {
    throw new Error("Next-Recording-Feld fehlt oder ist ungueltig: args");
  }
  return value;
}

function valueAfter(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function recordingNextReportJson(loop: RecordingNextLoopResult, options: RecordingNextReportOptions): Record<string, unknown> {
  const learning = recordingNextLearningState(options.scoreboardJsonFile);
  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    status: loop.status,
    summary: recordingNextReportSummary(loop, options),
    nextAction: recordingNextAction(loop, options, learning),
    ...(learning ? { learning } : {}),
    options: {
      run: options.run,
      preflight: options.preflight,
      autoOnly: options.autoOnly,
      allowManual: Boolean(options.allowManual),
      refreshCampaign: Boolean(options.refreshCampaign),
      repeat: options.repeat,
      sourceFile: options.sourceFile,
      ...(options.scoreboardJsonFile ? { scoreboardJsonFile: options.scoreboardJsonFile } : {}),
      ...(options.recordingUrl ? { recordingUrl: options.recordingUrl } : {}),
    },
    results: loop.results,
  };
}

function recordingNextLearningState(scoreboardJsonFile: string | undefined): RecordingNextLearningState | undefined {
  if (!scoreboardJsonFile || !fs.existsSync(scoreboardJsonFile)) return undefined;
  const parsed = readJsonFile(scoreboardJsonFile);
  if (!isRecord(parsed)) return undefined;
  const entries = Array.isArray(parsed.entries) ? parsed.entries.filter(isRecord) : [];
  const last = entries.at(-1);
  const recordingCount = numberValue(parsed.recordingCount);
  const recordingsNeedingReview = numberValue(parsed.recordingsNeedingReview);
  const status = recordingLearningStatus(recordingCount, recordingsNeedingReview);
  const recommendation = recordingLearningRecommendation(status);
  return {
    status,
    recommendedAction: recommendation.action,
    recommendedReason: recommendation.reason,
    sourceFile: scoreboardJsonFile,
    recordingCount,
    recordingsNeedingReview,
    finalCoveragePercent: numberValue(parsed.finalCoveragePercent),
    totalNewEndpoints: numberValue(parsed.totalNewEndpoints),
    totalNewKnownInventoryEndpoints: numberValue(parsed.totalNewKnownInventoryEndpoints),
    expectedEndpointHitRatePercent: numberValue(parsed.expectedEndpointHitRatePercent),
    totalExplorerClickedTargets: numberValue(parsed.totalExplorerClickedTargets),
    totalExplorerOpenTargets: numberValue(parsed.totalExplorerOpenTargets),
    ...(last ? { lastRecording: recordingNextLastRecording(last) } : {}),
  };
}

function recordingNextLastRecording(entry: Record<string, unknown>): RecordingNextLearningState["lastRecording"] {
  return {
    file: typeof entry.file === "string" ? entry.file : "",
    ...(typeof entry.purpose === "string" ? { purpose: entry.purpose } : {}),
    qualityStatus: typeof entry.qualityStatus === "string" ? entry.qualityStatus : "",
    newEndpoints: numberValue(entry.newEndpoints),
    newKnownInventoryEndpoints: numberValue(entry.newKnownInventoryEndpoints),
    coverageDeltaPercent: numberValue(entry.coverageDeltaPercent),
    expectedEndpointsObserved: numberValue(entry.expectedEndpointsObserved),
    expectedEndpointsMissing: numberValue(entry.expectedEndpointsMissing),
    explorerClickedTargets: numberValue(entry.explorerClickedTargets),
    explorerOpenTargets: numberValue(entry.explorerOpenTargets),
    topAreas: Array.isArray(entry.topAreas) ? entry.topAreas.filter((area) => typeof area === "string").slice(0, 5) : [],
  };
}

function recordingLearningStatus(recordingCount: number, recordingsNeedingReview: number): RecordingNextLearningState["status"] {
  if (recordingCount <= 0) return "missing";
  return recordingsNeedingReview > 0 ? "needs-review" : "ok";
}

function recordingLearningRecommendation(status: RecordingNextLearningState["status"]): { action: RecordingNextLearningState["recommendedAction"]; reason: string } {
  if (status === "missing") {
    return {
      action: "bootstrap-recording",
      reason: "Noch kein Recording-Lernstand; erste Aufnahme mit UI-Snapshots starten.",
    };
  }
  if (status === "needs-review") {
    return {
      action: "record-quality-baseline",
      reason: "Recordings brauchen Review; neue Aufnahme mit UI-Snapshots priorisieren.",
    };
  }
  return {
    action: "continue-coverage-recording",
    reason: "Lernstand ist verwertbar; naechste Coverage-Luecke aufnehmen.",
  };
}

function recordingNextAction(
  loop: RecordingNextLoopResult,
  options: Pick<RecordingNextReportOptions, "autoOnly" | "allowManual" | "recordingUrl">,
  learning?: RecordingNextLearningState,
): RecordingNextAction {
  const current = loop.results.at(-1);
  const recommendation = current?.recommendation;
  if (!current || !recommendation) {
    return {
      available: false,
      runnable: false,
      gate: "missing",
      gateReason: "Keine Next-Recording-Empfehlung verfuegbar.",
      automationDecision: "blocked",
      automationDecisionReason: "Keine Next-Recording-Empfehlung verfuegbar.",
    };
  }
  const gate = nextActionGate(current, recommendation, options);
  const targetUrl = recordingTargetUrl(current, recommendation, options);
  const decision = recordingNextAutomationDecision(gate, learning);
  const automationRun = recordingNextAutomationRun(current, recommendation, decision.automationDecision);
  return {
    available: true,
    runnable: gate.gate === "ready",
    gate: gate.gate,
    ...(gate.reason ? { gateReason: gate.reason } : {}),
    qualityGate: decision.qualityGate,
    qualityGateReason: decision.qualityGateReason,
    automationDecision: decision.automationDecision,
    automationDecisionReason: decision.automationDecisionReason,
    ...(automationRun.command ? { automationRunCommand: automationRun.command } : {}),
    ...(automationRun.args ? { automationRunArgs: automationRun.args } : {}),
    ...(learning
      ? {
          learningStatus: learning.status,
          learningRecommendedAction: learning.recommendedAction,
          learningRecommendedReason: learning.recommendedReason,
        }
      : {}),
    status: current.status,
    priority: recommendation.priority,
    label: recommendation.label,
    reason: recommendation.reason,
    mode: recommendation.mode,
    command: current.command || recommendation.command,
    ...(current.workflowPreflight?.runCommand ? { runCommand: current.workflowPreflight.runCommand } : {}),
    ...(current.workflowPreflight?.runArgs ? { runArgs: current.workflowPreflight.runArgs } : {}),
    ...(targetUrl ? { targetUrl } : {}),
    ...(current.workflowRun ? { workflowRun: current.workflowRun } : {}),
    ...(current.runEvidence ? { runEvidence: current.runEvidence } : {}),
    args: recommendation.args,
    startPath: valueAfter(recommendation.args, "--start-path"),
    maxSteps: intValue(valueAfter(recommendation.args, "--max-steps")),
    maxMinutes: intValue(valueAfter(recommendation.args, "--max-minutes")),
    expectedEndpoints: parseExpectedEndpointArgs(recommendation.args),
  };
}

function recordingNextAutomationRun(
  result: RecordingNextResult,
  recommendation: RecordingNextRecommendation,
  decision: RecordingNextAutomationDecision,
): { command?: string; args?: string[] } {
  if (decision === "blocked") return {};
  const purpose = recordingPurposeForDecision(decision);
  if (result.workflowPreflight?.runCommand) {
    if (result.workflowPreflight.runArgs && purpose) {
      const args = withFlagValue(result.workflowPreflight.runArgs, "--purpose", purpose);
      return {
        command: commandFromArgs(args),
        args,
      };
    }
    return {
      command: result.workflowPreflight.runCommand,
      ...(result.workflowPreflight.runArgs ? { args: result.workflowPreflight.runArgs } : {}),
    };
  }
  if (result.status === "preflighted") return {};
  const args = purpose ? withFlagValue(recommendation.args, "--purpose", purpose) : recommendation.args;
  return {
    command: purpose ? commandFromArgs(args) : (result.command || recommendation.command),
    args,
  };
}

function recordingPurposeForDecision(decision: RecordingNextAutomationDecision): string | undefined {
  if (decision === "bootstrap-recording") return "bootstrap";
  return decision === "record-quality-baseline" ? "quality-baseline" : undefined;
}

function recordingNextAutomationDecision(
  gate: { gate: RecordingNextActionGate; reason?: string },
  learning?: RecordingNextLearningState,
): {
  qualityGate: RecordingNextQualityGate;
  qualityGateReason: string;
  automationDecision: RecordingNextAutomationDecision;
  automationDecisionReason: string;
} {
  const learningRecommendation = learning ? undefined : recordingLearningRecommendation("missing");
  const learningStatus = learning?.status || "missing";
  const qualityGate = recordingNextQualityGate(learningStatus);
  const qualityGateReason = learning?.recommendedReason || learningRecommendation?.reason || "";
  if (gate.gate !== "ready") {
    return {
      qualityGate,
      qualityGateReason,
      automationDecision: "blocked",
      automationDecisionReason: gate.reason || "Recording-Gate ist nicht bereit.",
    };
  }
  if (learningStatus === "ok") {
    return {
      qualityGate,
      qualityGateReason,
      automationDecision: "run",
      automationDecisionReason: "Technik und Lernstand sind bereit; Recording kann gestartet werden.",
    };
  }
  return {
    qualityGate,
    qualityGateReason,
    automationDecision: learningStatus === "missing" ? "bootstrap-recording" : "record-quality-baseline",
    automationDecisionReason: qualityGateReason,
  };
}

function recordingNextQualityGate(status: RecordingNextLearningState["status"]): RecordingNextQualityGate {
  if (status === "ok") return "ready";
  if (status === "missing") return "missing-learning";
  return "needs-review";
}

function nextActionGate(
  result: RecordingNextResult,
  recommendation: RecordingNextRecommendation,
  options: Pick<RecordingNextReportOptions, "autoOnly" | "allowManual">,
): { gate: RecordingNextActionGate; reason?: string } {
  if (result.status === "blocked") return { gate: "blocked", reason: result.reason };
  if (result.status === "stalled") return { gate: "stalled", reason: result.reason };
  if (result.status === "missing") return { gate: "missing", reason: result.reason };
  if (result.status === "executed" && result.runEvidence?.status !== "ok") {
    const findings = result.runEvidence?.findings?.join(", ") || "run-evidence-missing";
    return { gate: "blocked", reason: `Run-Evidenz blockiert Autopilot: ${findings}.` };
  }
  if (result.workflowPreflight?.status === "blocked") {
    return { gate: "blocked", reason: "Workflow-Preflight ist blockiert; Aufnahme nicht starten." };
  }
  if (options.autoOnly && recommendation.mode !== "auto") {
    return { gate: "auto-only-blocked", reason: "Auto-only-Modus fuehrt keine manuellen Aufnahmen aus." };
  }
  if (recommendation.mode === "manual" && !options.allowManual) {
    return { gate: "manual-approval-required", reason: "Manuelle Aufnahme nur mit --allow-manual ausfuehren." };
  }
  return { gate: "ready" };
}

function recordingNextReportSummary(loop: RecordingNextLoopResult, options: Pick<RecordingNextReportOptions, "refreshCampaign"> = {}): Record<string, unknown> {
  const last = loop.results.at(-1);
  return {
    iterationCount: loop.results.length,
    campaignRefreshed: Boolean(options.refreshCampaign),
    executedCount: countStatus(loop, "executed"),
    dryRunCount: countStatus(loop, "dry-run"),
    preflightedCount: countStatus(loop, "preflighted"),
    blockedCount: countStatus(loop, "blocked"),
    stalledCount: countStatus(loop, "stalled"),
    missingCount: countStatus(loop, "missing"),
    stopStatus: last?.status || "missing",
    stopReason: last?.reason || "Keine Next-Recording-Empfehlung verfuegbar.",
    lastCommand: last?.command || "",
    ...(last?.workflowRun ? { lastWorkflowRun: last.workflowRun } : {}),
    ...(last?.runEvidence ? { lastRunEvidence: last.runEvidence } : {}),
  };
}

function countStatus(loop: RecordingNextLoopResult, status: RecordingNextResult["status"]): number {
  return loop.results.filter((result) => result.status === status).length;
}

function parseExpectedEndpointArgs(args: string[]): Array<{ method: string; path: string }> {
  const endpoints: Array<{ method: string; path: string }> = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== "--expect-endpoint") continue;
    const parsed = parseEndpointArg(args[index + 1]);
    if (parsed) endpoints.push(parsed);
  }
  return endpoints;
}

function recordingTargetUrl(
  result: RecordingNextResult,
  recommendation: RecordingNextRecommendation,
  options: Pick<RecordingNextReportOptions, "recordingUrl">,
): string | undefined {
  return (
    valueAfter(result.workflowPreflight?.runArgs || [], "--url")
    || valueAfter(recommendation.args, "--url")
    || options.recordingUrl
  );
}

function parseEndpointArg(value: string | undefined): { method: string; path: string } | null {
  if (!value) return null;
  const match = value.trim().match(/^([A-Za-z]+)\s+(.+)$/);
  if (!match) return null;
  return { method: match[1].toUpperCase(), path: match[2] };
}

function intValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function reportJsonFileFor(reportFile: string): string {
  if (reportFile === defaultReportFile) return defaultReportJsonFile;
  return path.join(path.dirname(reportFile), `${path.basename(reportFile, path.extname(reportFile))}.json`);
}

function workflowPreflightFileFor(reportFile: string): string {
  return path.join(path.dirname(reportFile), `${path.basename(reportFile, path.extname(reportFile))}-workflow-preflight.md`);
}

function workflowPreflightJsonFileFor(reportFile: string): string {
  return path.join(path.dirname(reportFile), `${path.basename(reportFile, path.extname(reportFile))}-workflow-preflight.json`);
}

function intArg(argv: string[], name: string, fallback: number, max: number): number {
  const raw = valueAfter(argv, name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMainModule(): boolean {
  return process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;
}
