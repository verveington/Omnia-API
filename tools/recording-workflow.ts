import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

import { runReadOnlyExplorer } from "./explorer/orchestrator.ts";
import { writeExplorerReport } from "./explorer/report.ts";
import type { ExplorerResult } from "./explorer/state.ts";
import { collectUiSnapshot } from "./explorer/ui-snapshot.ts";
import { createBrowserApiClient } from "./browser-api-client.ts";
import { writeFlowMapping, writeFlowReport } from "./flow-report.ts";
import {
  appendMarker,
  attachNetworkLogger,
  connectOrLaunchPage,
  parseCommonArgs,
  waitForSettledNetwork,
  type RecorderOptions,
} from "./network-recorder.ts";
import {
  createAutomatedClickThrottle,
  runThrottledAutomatedClick,
  type AutomatedClickThrottle,
} from "./automated-clicks.ts";
import {
  auditRecordingArtifacts,
  writeRecordingAudit,
  type RecordingAuditFile,
  type RecordingAuditResult,
} from "./recording-audit.ts";
import {
  buildCoverageReport,
  type KnownEndpoint,
} from "./coverage-report.ts";
import { runTargetedAutoFlow, targetedAutoFlowNames } from "./targeted-auto-flows.ts";
import { REDACTED, redactUiLabel } from "./redact.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const defaultSteps = [
  "Login/Workspace pruefen",
  "Zielbereich oeffnen",
  "Fachaktion ausfuehren",
  "Ergebnis/Download pruefen",
];
const defaultCatalogFile = path.join(workspaceRoot, "docs", "03_api_catalog.md");
const defaultOpenApiFile = path.join(workspaceRoot, "openapi", "omnia-observed.openapi.yaml");
const defaultCoverageReportFile = path.join(workspaceRoot, "docs", "08_api_coverage_report.md");
const defaultKnowledgeReportFile = path.join(workspaceRoot, "docs", "10_omnia_knowledge.md");
const defaultRelationshipsFile = path.join(workspaceRoot, "docs", "12_omnia_relationships.md");
const defaultDataModelFile = path.join(workspaceRoot, "docs", "13_omnia_data_model.md");
const defaultBlueprintFile = path.join(workspaceRoot, "docs", "11_platform_blueprint.md");
const defaultUiMapFile = path.join(workspaceRoot, "docs", "14_omnia_ui_map.md");
const defaultScoreboardFile = path.join(workspaceRoot, "docs", "recordings", "recording-scoreboard.md");
const defaultCampaignFile = path.join(workspaceRoot, "docs", "recordings", "recording-campaign.md");
const defaultMappingFile = path.join(workspaceRoot, "docs", "04_flow_to_api_mapping.md");
const defaultRecordingsDir = path.join(workspaceRoot, "docs", "recordings");
const preflightSensitiveValueFlags = new Set([
  "--password",
  "--new-password",
  "--search-term",
  "--tenant",
  "--test-customer",
  "--username",
]);

export type RecordingWorkflowMode = "manual" | "auto";
export type RecordingWorkflowPurpose = "coverage" | "quality-baseline" | "bootstrap" | "manual";
export type RecordingWorkflowPreflightStatus = "ready" | "warning" | "blocked";

export type RecordingWorkflowPreflightCheck = {
  name: string;
  status: RecordingWorkflowPreflightStatus;
  detail: string;
};

export type RecordingWorkflowPreflight = {
  generatedAt: string;
  status: RecordingWorkflowPreflightStatus;
  mode: RecordingWorkflowMode;
  purpose?: RecordingWorkflowPurpose;
  target: string;
  runCommand: string;
  runArgs: string[];
  captureBodies: boolean;
  postProcessingEnabled: boolean;
  artifacts: Record<string, string>;
  checks: RecordingWorkflowPreflightCheck[];
};

export type RecordingWorkflowOptions = RecorderOptions & {
  mode: RecordingWorkflowMode;
  purpose?: RecordingWorkflowPurpose;
  preflightOnly: boolean;
  preflightFile: string;
  preflightJsonFile: string;
  waitForLogin: boolean;
  loginTimeoutMs: number;
  steps: string[];
  autoFlow?: string;
  maxSteps: number;
  maxMinutes: number;
  settleMs: number;
  startPath?: string;
  logFile: string;
  summaryFile: string;
  manifestFile: string;
  explorerReportFile: string;
  flowMappingFile: string;
  recordingsDir: string;
  catalogFile: string;
  openApiFile: string;
  coverageReportFile: string;
  knowledgeReportFile: string;
  relationshipsFile: string;
  dataModelFile: string;
  blueprintFile: string;
  uiMapFile: string;
  scoreboardFile: string;
  campaignFile: string;
  impactFile: string;
  auditFile: string;
  rebuildCatalog: boolean;
  rebuildCoverageReport: boolean;
  rebuildKnowledgeReport: boolean;
  rebuildRelationships: boolean;
  rebuildDataModel: boolean;
  rebuildBlueprint: boolean;
  rebuildUiMap: boolean;
  rebuildScoreboard: boolean;
  rebuildCampaign: boolean;
  writeImpactReport: boolean;
  runAudit: boolean;
  allowReadLikePosts: boolean;
  restoreStartUrl: boolean;
  testCustomer?: string;
  testArticle?: string;
  genericSearchTerm?: string;
  strictTestObject?: boolean;
  resolveTestCustomer?: boolean;
  expectedEndpoints: KnownEndpoint[];
};

export type AutomatedLoginConfig = {
  tenant: string;
  username: string;
  password: string;
  newPassword: string;
  tenantSelector: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  changeOldPasswordSelector: string;
  changeNewPasswordSelector: string;
  changeConfirmPasswordSelector: string;
  changeSubmitSelector: string;
};

export type RecordingExpectedEndpointResult = {
  endpoint: KnownEndpoint;
  observed: boolean;
};

export type RecordingExplorerStats = {
  startUrl: string;
  finalUrl: string;
  stopReason: string;
  clickedTargets: number;
  skippedTargets: number;
  blockedRequests: number;
  discoveredTargets: number;
  openTargets: number;
  topOpenTargets: RecordingExplorerOpenTarget[];
};

export type RecordingExplorerOpenTarget = {
  kind: string;
  label: string;
  path: string;
  seenCount: number;
};

export type RecordingWorkflowResult = {
  mode: RecordingWorkflowMode;
  purpose?: RecordingWorkflowPurpose;
  status: "completed" | "aborted";
  startedAt: string;
  completedAt: string;
  logFile: string;
  preflightFile?: string;
  preflightJsonFile?: string;
  preflightStatus?: RecordingWorkflowPreflightStatus;
  preflight?: RecordingWorkflowPreflight;
  manifestFile?: string;
  explorerReportFile?: string;
  flowReportFile?: string;
  flowMappingFile?: string;
  catalogFile?: string;
  openApiFile?: string;
  coverageReportFile?: string;
  knowledgeReportFile?: string;
  relationshipsFile?: string;
  dataModelFile?: string;
  blueprintFile?: string;
  uiMapFile?: string;
  scoreboardFile?: string;
  campaignFile?: string;
  impactFile?: string;
  impact?: RecordingWorkflowImpactSummary;
  auditFile?: string;
  auditStatus?: RecordingAuditResult["status"];
  explorer?: RecordingExplorerStats;
  expectedEndpointResults?: RecordingExpectedEndpointResult[];
  summaryFile?: string;
  stopReason?: string;
};

export type RecordingWorkflowImpactSummary = {
  targetResponses: number;
  targetEndpointCount: number;
  newEndpointCount: number;
  newKnownInventoryCount: number;
  coverageDeltaPercent: number;
  downloads: number;
  topAreas: Array<{
    area: string;
    endpointCount: number;
    newEndpointCount: number;
    responseCount: number;
  }>;
};

export type RecordingWorkflowPostProcessingStepId =
  | "api-catalog"
  | "coverage-report"
  | "knowledge-report"
  | "relationships"
  | "data-model"
  | "ui-map"
  | "platform-blueprint"
  | "recording-impact"
  | "recording-scoreboard"
  | "recording-campaign";

export type RecordingWorkflowPostProcessingPhase = "before-manifest" | "after-manifest" | "after-audit";

export type RecordingWorkflowPostProcessingStep = {
  id: RecordingWorkflowPostProcessingStepId;
  phase: RecordingWorkflowPostProcessingPhase;
};

export type RecordingWorkflowManifest = {
  schemaVersion: 1;
  mode: RecordingWorkflowMode;
  purpose?: RecordingWorkflowPurpose;
  status: RecordingWorkflowResult["status"];
  startedAt: string;
  completedAt: string;
  stopReason?: string;
  auditStatus?: RecordingAuditResult["status"];
  artifacts: Record<string, string | null>;
  preflight?: RecordingWorkflowPreflight;
  expectedEndpoints: Array<{
    method: string;
    path: string;
    source?: string;
    observed: boolean;
  }>;
  impact?: RecordingWorkflowImpactSummary;
  explorer?: RecordingExplorerStats;
};

const recordingWorkflowValueFlags = new Set([
  "--audit",
  "--auto-flow",
  "--blueprint",
  "--campaign",
  "--catalog",
  "--cdp",
  "--coverage",
  "--data-model",
  "--expect-endpoint",
  "--explorer-report",
  "--impact",
  "--knowledge",
  "--login-timeout-ms",
  "--manifest",
  "--mapping",
  "--max-body-bytes",
  "--max-minutes",
  "--max-steps",
  "--mode",
  "--openapi",
  "--out",
  "--preflight-json",
  "--preflight-out",
  "--purpose",
  "--recordings-dir",
  "--relationships",
  "--report",
  "--scoreboard",
  "--settle-ms",
  "--start-path",
  "--steps",
  "--search-term",
  "--summary",
  "--test-article",
  "--test-customer",
  "--ui-map",
  "--url",
]);

const recordingWorkflowBooleanFlags = new Set([
  "--auto",
  "--capture-bodies",
  "--headless",
  "--help",
  "--no-audit",
  "--no-blueprint",
  "--no-bodies",
  "--no-campaign",
  "--no-catalog",
  "--no-coverage",
  "--no-data-model",
  "--no-impact",
  "--no-knowledge",
  "--no-relationships",
  "--no-scoreboard",
  "--no-ui-map",
  "--preflight",
  "--restore-start",
  "--resolve-test-customer",
  "--strict-get-only",
  "--strict-test-customer",
  "--strict-test-object",
  "--stub",
  "--wait-for-login",
  "-h",
]);

export function isRecordingWorkflowHelpRequest(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

export function buildRecordingWorkflowHelp(): string {
  return [
    "Recording-Workflow",
    "",
    "Startet einen Omnia-Aufnahmelauf mit redaktiertem API-Log, Flow-Markern, UI-Snapshots und Nachauswertung.",
    "",
    "Sichere Vorpruefung ohne Browserstart:",
    "  node tools/recording-workflow.ts --preflight --url https://api2.optica-omnia.de --mode manual --stub --wait-for-login --capture-bodies --max-body-bytes 2000000",
    "",
    "Manuelle Aufnahme mit Schrittmarkern:",
    "  node tools/recording-workflow.ts --url https://api2.optica-omnia.de --mode manual --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --steps \"Login/Workspace pruefen,Bereich oeffnen,Aktion ausloesen,Ergebnis pruefen\"",
    "",
    "Automatische Read-only-Erkundung:",
    "  node tools/recording-workflow.ts --url https://api2.optica-omnia.de --mode auto --stub --wait-for-login --capture-bodies --max-body-bytes 2000000 --max-steps 180 --max-minutes 20",
    "",
    "Gezielter Modul-Auto-Flow:",
    "  node tools/recording-workflow.ts --url https://api2.optica-omnia.de --mode auto --auto-flow all-targeted-read --stub --wait-for-login --capture-bodies --max-body-bytes 2000000",
    "",
    "Wichtige Optionen:",
    "  --preflight                  prueft Ziel, Bodies, Audit und Artefaktpfade ohne Aufnahme",
    "  --mode manual|auto           manual fuer Handbedienung, auto fuer sicheren Read-only-Explorer",
    "  --wait-for-login             wartet nach Browserstart auf manuelles Login",
    "  --stub                       installiert den Electron-IPC-Stub fuer Web-Aufnahmen",
    "  --capture-bodies             schreibt redaktierte Request-/Response-Bodies mit",
    "  --max-body-bytes <bytes>     Body-Cap fuer die Aufzeichnung",
    "  --steps \"A,B,C\"              manuelle Schrittmarker fuer API-/UI-Timeline",
    "  --expect-endpoint \"M P\"      erwarteten Endpunkt im Manifest und Summary pruefen",
    "  --start-path <pfad>          Startpfad fuer den Auto-Explorer",
    `  --auto-flow <name>          gezielter Modul-Flow statt generischem Explorer (${targetedAutoFlowNames.join(", ")})`,
    "  --test-customer <name>       Suchwert fuer Kunden-/Vorgangslisten im Auto-Explorer",
    "  --test-article <text>        Suchwert fuer Artikel-/Wawi-Listen im Auto-Explorer",
    "  --search-term <text>         Fallback-Suchwert, wenn kein Modulkontext erkannt wird",
    "  --strict-test-object         klickt bei Kundensuche keine Nicht-Testobjekt-Rows",
    "  --resolve-test-customer      loest den Testkunden read-only per API auf und startet nur dessen Detailroute",
    "",
    "Auto-Login fuer Testuser:",
    "  OMNIA_TEST_MANDANT, OMNIA_TEST_USERNAME, OMNIA_TEST_PASSWORD in .env.local oder Shell-Env setzen.",
    "  OMNIA_TEST_NEW_PASSWORD bedient einen erzwungenen Testuser-Passwortwechsel.",
    "  Optional: OMNIA_TEST_*_SELECTOR fuer abweichende Login-Felder.",
    "",
    "Ergebnisse:",
    "  logs/network/<timestamp>-workflow.jsonl",
    "  docs/recordings/<timestamp>-workflow-summary.md",
    "  docs/recordings/<timestamp>-workflow-manifest.json",
    "  docs/03_api_catalog.md              API-Katalog",
    "  openapi/omnia-observed.openapi.yaml  Observed OpenAPI",
    "",
  ].join("\n");
}

export function parseRecordingWorkflowArgs(argv: string[]): RecordingWorkflowOptions {
  validateRecordingWorkflowArgs(argv);
  const common = parseCommonArgs(argv);
  const logFile = path.resolve(common.outputFile || createRecordingWorkflowLogPath());
  const summaryFile = path.resolve(
    valueAfter(argv, "--summary") || path.join(defaultRecordingsDir, `${path.basename(logFile, ".jsonl")}-summary.md`),
  );
  const manifestFile = path.resolve(
    valueAfter(argv, "--manifest") || path.join(defaultRecordingsDir, `${path.basename(logFile, ".jsonl")}-manifest.json`),
  );
  const explorerReportFile = path.resolve(
    valueAfter(argv, "--explorer-report")
      || valueAfter(argv, "--report")
      || path.join(defaultRecordingsDir, `${path.basename(logFile, ".jsonl")}-explorer.md`),
  );
  const preflightFile = path.resolve(
    valueAfter(argv, "--preflight-out") || path.join(defaultRecordingsDir, `${path.basename(logFile, ".jsonl")}-preflight.md`),
  );
  const preflightJsonFile = path.resolve(
    valueAfter(argv, "--preflight-json") || jsonSidecarPath(preflightFile),
  );
  const auditFile = path.resolve(
    valueAfter(argv, "--audit") || path.join(defaultRecordingsDir, `${path.basename(logFile, ".jsonl").replace(/-workflow$/, "")}-workflow-audit.md`),
  );
  const impactFile = path.resolve(
    valueAfter(argv, "--impact") || path.join(defaultRecordingsDir, `${path.basename(logFile, ".jsonl")}-impact.md`),
  );
  const mode = parseMode(valueAfter(argv, "--mode") || (argv.includes("--auto") ? "auto" : "manual"));

  return {
    ...common,
    mode,
    purpose: parseWorkflowPurpose(valueAfter(argv, "--purpose")),
    preflightOnly: argv.includes("--preflight"),
    preflightFile,
    preflightJsonFile,
    waitForLogin: argv.includes("--wait-for-login"),
    loginTimeoutMs: intArg(argv, "--login-timeout-ms", 10 * 60 * 1000),
    steps: parseSteps(argv) || defaultSteps,
    autoFlow: valueAfter(argv, "--auto-flow") || undefined,
    maxSteps: intArg(argv, "--max-steps", 180),
    maxMinutes: intArg(argv, "--max-minutes", 20),
    settleMs: intArg(argv, "--settle-ms", 900),
    startPath: valueAfter(argv, "--start-path") || undefined,
    logFile,
    outputFile: logFile,
    summaryFile,
    manifestFile,
    explorerReportFile,
    flowMappingFile: path.resolve(valueAfter(argv, "--mapping") || defaultMappingFile),
    recordingsDir: path.resolve(valueAfter(argv, "--recordings-dir") || defaultRecordingsDir),
    catalogFile: path.resolve(valueAfter(argv, "--catalog") || defaultCatalogFile),
    openApiFile: path.resolve(valueAfter(argv, "--openapi") || defaultOpenApiFile),
    coverageReportFile: path.resolve(valueAfter(argv, "--coverage") || defaultCoverageReportFile),
    knowledgeReportFile: path.resolve(valueAfter(argv, "--knowledge") || defaultKnowledgeReportFile),
    relationshipsFile: path.resolve(valueAfter(argv, "--relationships") || defaultRelationshipsFile),
    dataModelFile: path.resolve(valueAfter(argv, "--data-model") || defaultDataModelFile),
    blueprintFile: path.resolve(valueAfter(argv, "--blueprint") || defaultBlueprintFile),
    uiMapFile: path.resolve(valueAfter(argv, "--ui-map") || defaultUiMapFile),
    scoreboardFile: path.resolve(valueAfter(argv, "--scoreboard") || defaultScoreboardFile),
    campaignFile: path.resolve(valueAfter(argv, "--campaign") || defaultCampaignFile),
    impactFile,
    auditFile,
    rebuildCatalog: !argv.includes("--no-catalog"),
    rebuildCoverageReport: !argv.includes("--no-coverage"),
    rebuildKnowledgeReport: !argv.includes("--no-knowledge"),
    rebuildRelationships: !argv.includes("--no-relationships"),
    rebuildDataModel: !argv.includes("--no-data-model"),
    rebuildBlueprint: !argv.includes("--no-blueprint"),
    rebuildUiMap: !argv.includes("--no-ui-map"),
    rebuildScoreboard: !argv.includes("--no-scoreboard"),
    rebuildCampaign: !argv.includes("--no-campaign"),
    writeImpactReport: !argv.includes("--no-impact"),
    runAudit: !argv.includes("--no-audit"),
    allowReadLikePosts: !argv.includes("--strict-get-only"),
    restoreStartUrl: argv.includes("--restore-start"),
    testCustomer: valueAfter(argv, "--test-customer") || "Max Mustermann",
    testArticle: valueAfter(argv, "--test-article") || "Musterartikel",
    genericSearchTerm: valueAfter(argv, "--search-term") || "",
    strictTestObject: argv.includes("--strict-test-object") || argv.includes("--strict-test-customer"),
    resolveTestCustomer: argv.includes("--resolve-test-customer"),
    expectedEndpoints: parseExpectedEndpoints(argv),
    captureBodies: common.captureBodies !== false,
  };
}

function validateRecordingWorkflowArgs(argv: string[]): void {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-")) continue;
    if (recordingWorkflowValueFlags.has(arg)) {
      index += 1;
      continue;
    }
    if (recordingWorkflowBooleanFlags.has(arg)) continue;
    throw new Error(`Unbekannte Recording-Workflow-Option: ${arg}. Hilfe: node tools/recording-workflow.ts --help`);
  }
}

export function createRecordingWorkflowLogPath(date = new Date()): string {
  const dir = path.join(workspaceRoot, "logs", "network");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${formatLocalTimestamp(date)}-workflow.jsonl`);
}

export async function runRecordingWorkflowCli(argv = process.argv.slice(2)): Promise<RecordingWorkflowResult> {
  if (isRecordingWorkflowHelpRequest(argv)) {
    const now = new Date().toISOString();
    console.log(buildRecordingWorkflowHelp());
    process.exitCode = 0;
    return {
      mode: "manual",
      status: "completed",
      startedAt: now,
      completedAt: now,
      stopReason: "help",
      logFile: "",
    };
  }

  const options = parseRecordingWorkflowArgs(argv);
  const startedAt = new Date().toISOString();
  const preflight = buildRecordingWorkflowPreflight(options);
  writeRecordingWorkflowPreflight(options.preflightFile, preflight, options.preflightJsonFile);

  if (options.preflightOnly) {
    console.log(buildRecordingWorkflowPreflightMarkdown(preflight));
    console.log(`Recording-Preflight: ${options.preflightFile}`);
    console.log(`Recording-Preflight-JSON: ${options.preflightJsonFile}`);
    process.exitCode = recordingWorkflowPreflightExitCode(preflight);
    return {
      mode: options.mode,
      status: preflight.status === "blocked" ? "aborted" : "completed",
      startedAt,
      completedAt: new Date().toISOString(),
      stopReason: "preflight-only",
      logFile: options.logFile,
      preflightFile: options.preflightFile,
      preflightJsonFile: options.preflightJsonFile,
      preflightStatus: preflight.status,
      preflight,
    };
  }

  if (preflight.status === "blocked") {
    process.exitCode = 1;
    return {
      mode: options.mode,
      status: "aborted",
      startedAt,
      completedAt: new Date().toISOString(),
      stopReason: "preflight-blocked",
      logFile: options.logFile,
      preflightFile: options.preflightFile,
      preflightJsonFile: options.preflightJsonFile,
      preflightStatus: preflight.status,
      preflight,
    };
  }

  let connection: Awaited<ReturnType<typeof connectOrLaunchPage>> | null = null;
  let recorder: ReturnType<typeof attachNetworkLogger> | null = null;
  let currentStep: string | null = null;
  let status: RecordingWorkflowResult["status"] = "completed";
  let stopReason = "completed";
  let explorerResult: ExplorerResult | null = null;

  try {
    connection = await connectOrLaunchPage(options);
    recorder = attachNetworkLogger(connection.page, {
      ...options,
      outputFile: options.logFile,
      getCurrentStep: () => currentStep,
    });

    printWorkflowStart(options, recorder.logFile);
    if (options.waitForLogin) await waitForLoginGate(connection.page, options.loginTimeoutMs);

    if (options.mode === "auto") {
      if (options.autoFlow) {
        const client = createBrowserApiClient(connection.page, { baseUrl: options.url });
        explorerResult = await runTargetedAutoFlow({
          flowName: options.autoFlow,
          client,
          page: connection.page,
          logFile: recorder.logFile,
          sessionId: recorder.sessionId,
          settleMs: options.settleMs,
          testCustomer: options.testCustomer || "Max Mustermann",
          testArticle: options.testArticle || "Musterartikel",
          setCurrentStep: (step) => {
            currentStep = step;
          },
        });
      } else {
        explorerResult = await runReadOnlyExplorer(connection.page, {
          ...options,
          reportFile: options.explorerReportFile,
          sessionId: recorder.sessionId,
          logFile: recorder.logFile,
          setCurrentStep: (step) => {
            currentStep = step;
          },
        });
      }
      stopReason = explorerResult.stopReason;
      if (options.restoreStartUrl && explorerResult.startUrl && explorerResult.startUrl !== connection.page.url()) {
        await connection.page.goto(explorerResult.startUrl, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
        await waitForSettledNetwork(connection.page, options.settleMs);
      }
    } else {
      await runManualWorkflowSteps(connection.page, recorder.logFile, recorder.sessionId, options, (step) => {
        currentStep = step;
      });
    }
  } catch (error) {
    status = "aborted";
    stopReason = errorMessage(error);
    console.error(stopReason);
    process.exitCode = 1;
  } finally {
    recorder?.stop();
    await connection?.close();
  }

  const result = finalizeWorkflow({
    options,
    startedAt,
    status,
    stopReason,
    explorerResult,
    preflight,
  });

  printWorkflowResult(result);
  return result;
}

export function buildRecordingWorkflowPreflight(
  options: RecordingWorkflowOptions,
  generatedAt = new Date(),
): RecordingWorkflowPreflight {
  const target = options.cdpEndpoint ? `CDP ${options.cdpEndpoint}` : (options.url || "");
  const runArgs = redactPreflightRunArgs(buildRecordingWorkflowRunArgs(options));
  const checks: RecordingWorkflowPreflightCheck[] = [
    target
      ? { name: "Ziel", status: "ready", detail: target }
      : { name: "Ziel", status: "blocked", detail: "Weder --url noch --cdp ist gesetzt." },
    options.captureBodies === false
      ? { name: "Bodies", status: "warning", detail: "Request-/Response-Bodies werden nicht mitgeschnitten." }
      : { name: "Bodies", status: "ready", detail: `Bodies aktiv, max ${options.maxBodyBytes || 0} Bytes pro Body.` },
    postProcessingPreflightCheck(options),
    options.runAudit
      ? { name: "Audit", status: "ready", detail: `Audit-Report: ${options.auditFile}` }
      : { name: "Audit", status: "warning", detail: "Recording-Audit ist deaktiviert." },
    { name: "Artefakte", status: "ready", detail: `JSONL: ${options.logFile}` },
  ];

  return {
    generatedAt: generatedAt.toISOString(),
    status: aggregatePreflightStatus(checks),
    mode: options.mode,
    ...(options.purpose ? { purpose: options.purpose } : {}),
    target,
    runCommand: buildNodeCommand(runArgs),
    runArgs,
    captureBodies: options.captureBodies !== false,
    postProcessingEnabled: postProcessingEnabled(options),
    artifacts: {
      logFile: options.logFile,
      summaryFile: options.summaryFile,
      manifestFile: options.manifestFile,
      flowMappingFile: options.flowMappingFile,
      catalogFile: options.catalogFile,
      openApiFile: options.openApiFile,
      coverageReportFile: options.coverageReportFile,
      knowledgeReportFile: options.knowledgeReportFile,
      relationshipsFile: options.relationshipsFile,
      dataModelFile: options.dataModelFile,
      blueprintFile: options.blueprintFile,
      uiMapFile: options.uiMapFile,
      scoreboardFile: options.scoreboardFile,
      campaignFile: options.campaignFile,
      auditFile: options.auditFile,
    },
    checks,
  };
}

export function buildRecordingWorkflowPreflightMarkdown(preflight: RecordingWorkflowPreflight): string {
  const lines = [
    "# Recording-Preflight",
    "",
    `Generiert: ${preflight.generatedAt}`,
    `Status: ${preflight.status}`,
    `Modus: ${preflight.mode}`,
    ...(preflight.purpose ? [`Zweck: ${preflight.purpose}`] : []),
    `Ziel: ${preflight.target || "-"}`,
    `Bodies: ${preflight.captureBodies ? "aktiv" : "deaktiviert"}`,
    `Nachauswertung: ${preflight.postProcessingEnabled ? "vollstaendig" : "teilweise deaktiviert"}`,
    "",
    "## Startbefehl",
    "",
    "```bash",
    preflight.runCommand,
    "```",
    "",
    "## Checks",
    "",
    "| Check | Status | Detail |",
    "|---|---|---|",
  ];

  for (const check of preflight.checks) {
    lines.push(`| ${check.name} | ${check.status} | ${check.detail} |`);
  }

  lines.push("", "## Artefakte", "");
  for (const [name, file] of Object.entries(preflight.artifacts)) {
    lines.push(`- ${artifactLabel(name)}: \`${file || "-"}\``);
  }

  return `${lines.join("\n")}\n`;
}

export function writeRecordingWorkflowPreflight(file: string, preflight: RecordingWorkflowPreflight, jsonFile?: string): string {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buildRecordingWorkflowPreflightMarkdown(preflight));
  if (jsonFile) {
    fs.mkdirSync(path.dirname(jsonFile), { recursive: true });
    fs.writeFileSync(jsonFile, `${JSON.stringify(preflight, null, 2)}\n`);
  }
  return file;
}

export function recordingWorkflowPreflightExitCode(preflight: Pick<RecordingWorkflowPreflight, "status">): number {
  return preflight.status === "blocked" ? 1 : 0;
}

export function buildRecordingWorkflowRunCommand(options: RecordingWorkflowOptions): string {
  return buildNodeCommand(buildRecordingWorkflowRunArgs(options));
}

export function buildRecordingWorkflowRunArgs(options: RecordingWorkflowOptions): string[] {
  const args = [
    "tools/recording-workflow.ts",
    "--mode",
    options.mode,
  ];

  appendFlagValue(args, "--purpose", options.purpose);
  appendFlagValue(args, "--url", options.url);
  appendFlagValue(args, "--cdp", options.cdpEndpoint);
  if (options.useElectronStub) args.push("--stub");
  if (options.headless) args.push("--headless");
  if (options.waitForLogin) args.push("--wait-for-login");
  appendFlagValue(args, "--login-timeout-ms", String(options.loginTimeoutMs));
  if (options.captureBodies === false) {
    args.push("--no-bodies");
  } else {
    args.push("--capture-bodies");
  }
  appendFlagValue(args, "--max-body-bytes", String(options.maxBodyBytes || 0));
  appendFlagValue(args, "--out", commandPath(options.logFile));
  appendFlagValue(args, "--summary", commandPath(options.summaryFile));
  appendFlagValue(args, "--manifest", commandPath(options.manifestFile));
  appendFlagValue(args, "--preflight-out", commandPath(options.preflightFile));
  appendFlagValue(args, "--preflight-json", commandPath(options.preflightJsonFile));
  appendFlagValue(args, "--explorer-report", commandPath(options.explorerReportFile));
  appendFlagValue(args, "--mapping", commandPath(options.flowMappingFile));
  appendFlagValue(args, "--catalog", commandPath(options.catalogFile));
  appendFlagValue(args, "--openapi", commandPath(options.openApiFile));
  appendFlagValue(args, "--coverage", commandPath(options.coverageReportFile));
  appendFlagValue(args, "--knowledge", commandPath(options.knowledgeReportFile));
  appendFlagValue(args, "--relationships", commandPath(options.relationshipsFile));
  appendFlagValue(args, "--data-model", commandPath(options.dataModelFile));
  appendFlagValue(args, "--blueprint", commandPath(options.blueprintFile));
  appendFlagValue(args, "--ui-map", commandPath(options.uiMapFile));
  appendFlagValue(args, "--scoreboard", commandPath(options.scoreboardFile));
  appendFlagValue(args, "--campaign", commandPath(options.campaignFile));
  appendFlagValue(args, "--impact", commandPath(options.impactFile));
  appendFlagValue(args, "--audit", commandPath(options.auditFile));

  if (!options.rebuildCatalog) args.push("--no-catalog");
  if (!options.rebuildCoverageReport) args.push("--no-coverage");
  if (!options.rebuildKnowledgeReport) args.push("--no-knowledge");
  if (!options.rebuildRelationships) args.push("--no-relationships");
  if (!options.rebuildDataModel) args.push("--no-data-model");
  if (!options.rebuildBlueprint) args.push("--no-blueprint");
  if (!options.rebuildUiMap) args.push("--no-ui-map");
  if (!options.rebuildScoreboard) args.push("--no-scoreboard");
  if (!options.rebuildCampaign) args.push("--no-campaign");
  if (!options.writeImpactReport) args.push("--no-impact");
  if (!options.runAudit) args.push("--no-audit");
  if (!options.allowReadLikePosts) args.push("--strict-get-only");
  if (options.restoreStartUrl) args.push("--restore-start");

  if (options.mode === "auto") {
    appendFlagValue(args, "--auto-flow", options.autoFlow);
    appendFlagValue(args, "--max-steps", String(options.maxSteps));
    appendFlagValue(args, "--max-minutes", String(options.maxMinutes));
    appendFlagValue(args, "--settle-ms", String(options.settleMs));
    appendFlagValue(args, "--start-path", options.startPath);
    appendFlagValue(args, "--test-customer", options.testCustomer);
    appendFlagValue(args, "--test-article", options.testArticle);
    appendFlagValue(args, "--search-term", options.genericSearchTerm);
    if (options.strictTestObject) args.push("--strict-test-object");
    if (options.resolveTestCustomer) args.push("--resolve-test-customer");
  } else {
    appendFlagValue(args, "--steps", options.steps.join(","));
    appendFlagValue(args, "--settle-ms", String(options.settleMs));
  }

  for (const endpoint of options.expectedEndpoints) {
    appendFlagValue(args, "--expect-endpoint", `${endpoint.method} ${endpoint.path}`);
  }

  return args;
}

export function buildRecordingWorkflowSummaryMarkdown(result: RecordingWorkflowResult): string {
  const lines = [
    "# Recording-Workflow",
    "",
    `Modus: ${result.mode}`,
    ...(result.purpose ? [`Zweck: ${result.purpose}`] : []),
    `Status: ${result.status}`,
    `Start: ${result.startedAt}`,
    `Ende: ${result.completedAt}`,
    result.stopReason ? `Stop-Grund: ${result.stopReason}` : "Stop-Grund: completed",
    "",
    "## Artefakte",
    "",
    `- Netzwerk-Log: \`${result.logFile}\``,
    `- Preflight-Report: \`${result.preflightFile || "nicht erzeugt"}\``,
    `- Preflight-JSON: \`${result.preflightJsonFile || "nicht erzeugt"}\``,
    `- Preflight-Status: ${result.preflightStatus || "nicht ausgefuehrt"}`,
    `- Run-Manifest: \`${result.manifestFile || "nicht erzeugt"}\``,
    `- Explorer-Report: \`${result.explorerReportFile || "nicht erzeugt"}\``,
    `- Flow-Report: \`${result.flowReportFile || "nicht erzeugt"}\``,
    `- Flow-Mapping: \`${result.flowMappingFile || "nicht erzeugt"}\``,
    `- API-Katalog: \`${result.catalogFile || "nicht aktualisiert"}\``,
    `- OpenAPI: \`${result.openApiFile || "nicht aktualisiert"}\``,
    `- Coverage-Report: \`${result.coverageReportFile || "nicht aktualisiert"}\``,
    `- Knowledge-Report: \`${result.knowledgeReportFile || "nicht aktualisiert"}\``,
    `- Relationship-Map: \`${result.relationshipsFile || "nicht aktualisiert"}\``,
    `- Data-Model: \`${result.dataModelFile || "nicht aktualisiert"}\``,
    `- Plattform-Blueprint: \`${result.blueprintFile || "nicht aktualisiert"}\``,
    `- UI-Map: \`${result.uiMapFile || "nicht aktualisiert"}\``,
    `- Recording-Scoreboard: \`${result.scoreboardFile || "nicht aktualisiert"}\``,
    `- Recording-Campaign: \`${result.campaignFile || "nicht aktualisiert"}\``,
    `- Impact-Report: \`${result.impactFile || "nicht erzeugt"}\``,
    `- Recording-Audit: \`${result.auditFile || "nicht ausgefuehrt"}\``,
    `- Audit-Status: ${result.auditStatus || "nicht ausgefuehrt"}`,
    "",
  ];

  if (result.expectedEndpointResults && result.expectedEndpointResults.length > 0) {
    lines.push("## Erwartete Endpunkte", "");
    lines.push("| Endpoint | Ergebnis |");
    lines.push("|---|---|");
    for (const item of result.expectedEndpointResults) {
      lines.push(`| ${item.endpoint.method} \`${item.endpoint.path}\` | ${item.observed ? "gesehen" : "fehlt"} |`);
    }
    lines.push("");
  }

  if (result.impact) {
    lines.push("## Impact", "");
    lines.push(`- API-Responses: ${result.impact.targetResponses}`);
    lines.push(`- Eindeutige Endpunkte: ${result.impact.targetEndpointCount}`);
    lines.push(`- Neue Endpunkte: ${result.impact.newEndpointCount}`);
    lines.push(`- Neue bekannte Inventar-Endpunkte: ${result.impact.newKnownInventoryCount}`);
    lines.push(`- Coverage-Delta: ${formatPercent(result.impact.coverageDeltaPercent)} %`);
    lines.push(`- Downloads: ${result.impact.downloads}`);
    if (result.impact.topAreas.length > 0) {
      lines.push("- Top-Fachbereiche:");
      for (const area of result.impact.topAreas) {
        lines.push(`  - ${area.area}: ${area.newEndpointCount} neue / ${area.endpointCount} Endpunkte, ${area.responseCount} Responses`);
      }
    }
    lines.push("");
  }

  if (result.explorer) {
    const topOpenTargets = result.explorer.topOpenTargets || [];
    lines.push("## Auto-Explorer", "");
    lines.push(`- Explorer-Stop-Grund: ${result.explorer.stopReason}`);
    lines.push(`- Start-URL: \`${result.explorer.startUrl}\``);
    lines.push(`- Final-URL: \`${result.explorer.finalUrl}\``);
    lines.push(`- Geklickte Ziele: ${result.explorer.clickedTargets}`);
    lines.push(`- Entdeckte UI-Ziele: ${result.explorer.discoveredTargets || 0}`);
    lines.push(`- Offene UI-Ziele: ${result.explorer.openTargets || 0}`);
    lines.push(`- Uebersprungene Ziele: ${result.explorer.skippedTargets}`);
    lines.push(`- Blockierte Requests: ${result.explorer.blockedRequests}`);
    if (topOpenTargets.length > 0) {
      lines.push("- Top offene UI-Ziele:");
      for (const target of topOpenTargets) {
        lines.push(`  - ${target.kind} \`${target.path || "-"}\` ${target.label} (${target.seenCount} Sichtung(en))`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## Ablauf",
    "",
    "1. Browser/Omnia-Kontext gestartet.",
    "2. Netzwerk-Recorder gestartet.",
    "3. Omnia wurde manuell per Schrittmarker oder automatisch per Read-only-Explorer/Auto-Flow bedient.",
    "4. JSONL-Log wurde in Flow-Report, Mapping, Impact-Report, API-Katalog, OpenAPI, Coverage, Knowledge-Report, Relationship-Map, Data-Model, Plattform-Blueprint, Scoreboard und Recording-Campaign ausgewertet.",
    "",
  );
  return `${lines.join("\n")}`;
}

export function buildRecordingWorkflowManifest(result: RecordingWorkflowResult): RecordingWorkflowManifest {
  return {
    schemaVersion: 1,
    mode: result.mode,
    ...(result.purpose ? { purpose: result.purpose } : {}),
    status: result.status,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    stopReason: result.stopReason,
    auditStatus: result.auditStatus,
    artifacts: compactArtifacts({
      logFile: result.logFile,
      preflightFile: result.preflightFile,
      preflightJsonFile: result.preflightJsonFile,
      manifestFile: result.manifestFile,
      explorerReportFile: result.explorerReportFile,
      flowReportFile: result.flowReportFile,
      flowMappingFile: result.flowMappingFile,
      catalogFile: result.catalogFile,
      openApiFile: result.openApiFile,
      coverageReportFile: result.coverageReportFile,
      knowledgeReportFile: result.knowledgeReportFile,
      relationshipsFile: result.relationshipsFile,
      dataModelFile: result.dataModelFile,
      blueprintFile: result.blueprintFile,
      uiMapFile: result.uiMapFile,
      scoreboardFile: result.scoreboardFile,
      scoreboardJsonFile: result.scoreboardFile ? jsonSidecarPath(result.scoreboardFile) : undefined,
      campaignFile: result.campaignFile,
      impactFile: result.impactFile,
      impactJsonFile: result.impactFile ? jsonSidecarPath(result.impactFile) : undefined,
      auditFile: result.auditFile,
      summaryFile: result.summaryFile,
    }),
    preflight: result.preflight,
    expectedEndpoints: (result.expectedEndpointResults || []).map((item) => ({
      method: item.endpoint.method,
      path: item.endpoint.path,
      source: item.endpoint.source,
      observed: item.observed,
    })),
    impact: result.impact,
    explorer: result.explorer,
  };
}

export function buildRecordingExplorerStats(result: ExplorerResult): RecordingExplorerStats {
  const discoveredTargets = result.discoveredTargets || [];
  const topOpenTargets = discoveredTargets
    .filter((target) => !target.clicked)
    .sort((left, right) => right.seenCount - left.seenCount || left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label, "de"))
    .slice(0, 12)
    .map((target) => ({
      kind: target.kind,
      label: redactUiLabel(target.label),
      path: target.path,
      seenCount: target.seenCount,
    }));
  return {
    startUrl: result.startUrl,
    finalUrl: result.finalUrl,
    stopReason: result.stopReason,
    clickedTargets: result.clicked.length,
    skippedTargets: result.skipped.length,
    blockedRequests: result.blockedRequests.length,
    discoveredTargets: discoveredTargets.length,
    openTargets: discoveredTargets.filter((target) => !target.clicked).length,
    topOpenTargets,
  };
}

export function buildRecordingWorkflowAuditFiles(input: {
  logFile: string;
  preflightFile?: string;
  preflightJsonFile?: string;
  summaryFile: string;
  manifestFile: string;
  explorerReportFile?: string;
  flowReportFile?: string;
  flowMappingFile?: string;
  catalogFile: string;
  openApiFile: string;
  coverageReportFile: string;
  knowledgeReportFile: string;
  relationshipsFile?: string;
  dataModelFile?: string;
  blueprintFile: string;
  uiMapFile?: string;
  scoreboardFile?: string;
  impactFile?: string;
  rebuildCatalog: boolean;
  rebuildCoverageReport: boolean;
  rebuildKnowledgeReport: boolean;
  rebuildBlueprint: boolean;
  rebuildUiMap: boolean;
}): RecordingAuditFile[] {
  return [
    { role: "Netzwerk-Log", file: input.logFile, required: true },
    { role: "Preflight-Report", file: input.preflightFile || "", required: Boolean(input.preflightFile) },
    { role: "Preflight-JSON", file: input.preflightJsonFile || "", required: Boolean(input.preflightJsonFile) },
    { role: "Workflow-Summary", file: input.summaryFile, required: true },
    { role: "Run-Manifest", file: input.manifestFile, required: true },
    { role: "Explorer-Report", file: input.explorerReportFile || "", required: Boolean(input.explorerReportFile) },
    { role: "Flow-Report", file: input.flowReportFile || "", required: Boolean(input.flowReportFile) },
    { role: "Flow-Mapping", file: input.flowMappingFile || "", required: Boolean(input.flowMappingFile) },
    { role: "API-Katalog", file: input.catalogFile, required: input.rebuildCatalog },
    { role: "OpenAPI", file: input.openApiFile, required: input.rebuildCatalog },
    { role: "Coverage-Report", file: input.coverageReportFile, required: input.rebuildCoverageReport },
    { role: "Knowledge-Report", file: input.knowledgeReportFile, required: input.rebuildKnowledgeReport },
    { role: "Relationship-Map", file: input.relationshipsFile || "", required: Boolean(input.relationshipsFile) },
    { role: "Data-Model", file: input.dataModelFile || "", required: Boolean(input.dataModelFile) },
    { role: "Plattform-Blueprint", file: input.blueprintFile, required: input.rebuildBlueprint },
    { role: "UI-Map", file: input.uiMapFile || "", required: input.rebuildUiMap },
    { role: "Recording-Scoreboard", file: input.scoreboardFile || "", required: Boolean(input.scoreboardFile) },
    { role: "Recording-Scoreboard-JSON", file: input.scoreboardFile ? jsonSidecarPath(input.scoreboardFile) : "", required: Boolean(input.scoreboardFile) },
    { role: "Impact-Report", file: input.impactFile || "", required: Boolean(input.impactFile) },
    { role: "Impact-JSON", file: input.impactFile ? jsonSidecarPath(input.impactFile) : "", required: Boolean(input.impactFile) },
  ].filter((item) => item.required || item.file) as RecordingAuditFile[];
}

export function buildRecordingWorkflowPostProcessingPlan(
  options: Pick<
    RecordingWorkflowOptions,
    | "rebuildCatalog"
    | "rebuildCoverageReport"
    | "rebuildKnowledgeReport"
    | "rebuildRelationships"
    | "rebuildDataModel"
    | "rebuildUiMap"
    | "rebuildBlueprint"
    | "writeImpactReport"
    | "rebuildScoreboard"
    | "rebuildCampaign"
  >,
  context: { hasNetworkLog: boolean },
): RecordingWorkflowPostProcessingStep[] {
  const steps: RecordingWorkflowPostProcessingStep[] = [];
  if (options.rebuildCatalog) steps.push({ id: "api-catalog", phase: "before-manifest" });
  if (options.rebuildCoverageReport) steps.push({ id: "coverage-report", phase: "before-manifest" });
  if (options.rebuildKnowledgeReport) steps.push({ id: "knowledge-report", phase: "before-manifest" });
  if (options.rebuildRelationships) steps.push({ id: "relationships", phase: "before-manifest" });
  if (options.rebuildDataModel) steps.push({ id: "data-model", phase: "before-manifest" });
  if (options.rebuildUiMap) steps.push({ id: "ui-map", phase: "after-manifest" });
  if (options.rebuildBlueprint) steps.push({ id: "platform-blueprint", phase: "after-manifest" });
  if (options.writeImpactReport && context.hasNetworkLog) steps.push({ id: "recording-impact", phase: "after-manifest" });
  if (options.rebuildScoreboard) steps.push({ id: "recording-scoreboard", phase: "after-manifest" });
  if (options.rebuildCampaign) steps.push({ id: "recording-campaign", phase: "after-audit" });
  return steps;
}

export function evaluateExpectedEndpoints(
  expectedEndpoints: KnownEndpoint[],
  records: Record<string, unknown>[],
): RecordingExpectedEndpointResult[] {
  const report = buildCoverageReport(expectedEndpoints, records);
  const missingKeys = new Set(report.missing.map(endpointKey));
  return expectedEndpoints.map((endpoint) => ({
    endpoint,
    observed: !missingKeys.has(endpointKey(endpoint)),
  }));
}

export async function appendWorkflowUiSnapshot(
  page: any,
  input: { logFile: string; sessionId: string; step: string; timestamp?: Date },
): Promise<void> {
  try {
    const snapshot = await collectUiSnapshot(page, { step: input.step, timestamp: input.timestamp });
    appendMarker(input.logFile, {
      type: "ui-snapshot",
      sessionId: input.sessionId,
      ...snapshot,
    });
  } catch (error) {
    appendMarker(input.logFile, {
      type: "flow-marker",
      sessionId: input.sessionId,
      marker: "ui-snapshot-error",
      step: input.step,
      timestamp: (input.timestamp || new Date()).toISOString(),
      message: errorMessage(error),
    });
  }
}

async function runManualWorkflowSteps(
  page: any,
  logFile: string,
  sessionId: string,
  options: RecordingWorkflowOptions,
  setCurrentStep: (step: string | null) => void,
): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    for (const step of options.steps) {
      await rl.question(`Bereit fuer "${step}"? Enter schreibt den Marker.`);
      setCurrentStep(step);
      appendMarker(logFile, {
        type: "flow-marker",
        sessionId,
        marker: "step-start",
        step,
        timestamp: new Date().toISOString(),
      });
      await rl.question(`Fuehre "${step}" in Omnia aus. Enter, wenn der Schritt abgeschlossen ist.`);
      await waitForSettledNetwork(page, options.settleMs);
      await appendWorkflowUiSnapshot(page, { logFile, sessionId, step });
      appendMarker(logFile, {
        type: "flow-marker",
        sessionId,
        marker: "step-end",
        step,
        timestamp: new Date().toISOString(),
      });
      setCurrentStep(null);
    }
  } finally {
    rl.close();
    setCurrentStep(null);
  }
}

export async function waitForLoginGate(page: any, timeoutMs: number): Promise<void> {
  loadLocalEnvFile(path.join(workspaceRoot, ".env.local"));
  const loginConfig = automatedLoginConfigFromEnv(process.env);
  if (loginConfig) {
    const success = await tryAutomatedLogin(page, loginConfig, timeoutMs);
    if (success) return;
    console.log("Auto-Login nicht abgeschlossen; manueller Login bleibt als Fallback aktiv.");
  }
  await waitForManualLogin();
}

async function waitForManualLogin(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    await rl.question("In Omnia einloggen und Workspace pruefen. Enter setzt den Workflow fort.");
  } finally {
    rl.close();
  }
}

export function automatedLoginConfigFromEnv(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AutomatedLoginConfig | null {
  const username = env.OMNIA_TEST_USERNAME || env.OMNIA_USERNAME || "";
  const password = env.OMNIA_TEST_PASSWORD || env.OMNIA_PASSWORD || "";
  if (!username || !password) return null;

  return {
    tenant: env.OMNIA_TEST_MANDANT || env.OMNIA_TEST_TENANT || env.OMNIA_MANDANT || env.OMNIA_TENANT_NUMBER || "",
    username,
    password,
    newPassword: env.OMNIA_TEST_NEW_PASSWORD || env.OMNIA_NEW_PASSWORD || "",
    tenantSelector: env.OMNIA_TEST_MANDANT_SELECTOR || env.OMNIA_TENANT_SELECTOR || "",
    usernameSelector: env.OMNIA_TEST_USERNAME_SELECTOR || env.OMNIA_USERNAME_SELECTOR || "",
    passwordSelector: env.OMNIA_TEST_PASSWORD_SELECTOR || env.OMNIA_PASSWORD_SELECTOR || "",
    submitSelector: env.OMNIA_TEST_SUBMIT_SELECTOR || env.OMNIA_SUBMIT_SELECTOR || "",
    changeOldPasswordSelector: env.OMNIA_TEST_CHANGE_OLD_PASSWORD_SELECTOR || env.OMNIA_CHANGE_OLD_PASSWORD_SELECTOR || "",
    changeNewPasswordSelector: env.OMNIA_TEST_CHANGE_NEW_PASSWORD_SELECTOR || env.OMNIA_CHANGE_NEW_PASSWORD_SELECTOR || "",
    changeConfirmPasswordSelector: env.OMNIA_TEST_CHANGE_CONFIRM_PASSWORD_SELECTOR || env.OMNIA_CHANGE_CONFIRM_PASSWORD_SELECTOR || "",
    changeSubmitSelector: env.OMNIA_TEST_CHANGE_SUBMIT_SELECTOR || env.OMNIA_CHANGE_SUBMIT_SELECTOR || "",
  };
}

async function tryAutomatedLogin(page: any, config: AutomatedLoginConfig, timeoutMs: number): Promise<boolean> {
  try {
    console.log("Auto-Login fuer Testuser ist konfiguriert.");
    const clickThrottle = createAutomatedClickThrottle();
    await fillOptionalTenant(page, config, clickThrottle);
    await fillFirstMatching(page, loginUsernameSelectors(config), config.username);
    await fillFirstMatching(page, loginPasswordSelectors(config), config.password);
    await clickFirstMatching(page, loginSubmitSelectors(config), clickThrottle);
    await waitForSettledNetwork(page, 1500);
    if (await passwordChangePromptVisible(page)) {
      if (!config.newPassword) {
        console.log("Auto-Login verlangt Passwortwechsel; OMNIA_TEST_NEW_PASSWORD ist nicht gesetzt.");
        return false;
      }
      console.log("Auto-Login bearbeitet Pflichtdialog Passwort aendern.");
      await submitRequiredPasswordChange(page, config, clickThrottle);
      config.password = config.newPassword;
      process.env.OMNIA_TEST_PASSWORD = config.newPassword;
      await waitForSettledNetwork(page, 1500);
    }
    await waitUntilNotLoginPage(page, Math.min(timeoutMs, 60000));
    return !isWorkflowLoginUrl(page.url?.() || "");
  } catch {
    return false;
  }
}

async function fillOptionalTenant(page: any, config: AutomatedLoginConfig, clickThrottle: AutomatedClickThrottle): Promise<void> {
  if (!config.tenant) return;
  await fillFirstMatching(page, loginTenantSelectors(config), config.tenant).catch(() => {});
  await clickFirstMatching(page, loginSubmitSelectors(config), clickThrottle).catch(() => {});
  await waitForSettledNetwork(page, 1500);
}

async function fillFirstMatching(page: any, selectors: string[], value: string): Promise<void> {
  for (const selector of selectors) {
    const locator = page.locator?.(selector).first?.() || page.locator?.(selector);
    if (!locator) continue;
    try {
      await locator.fill(value, { timeout: 2500 });
      return;
    } catch {
      continue;
    }
  }
  throw new Error("Kein Login-Feld gefunden.");
}

async function clickFirstMatching(
  page: any,
  selectors: string[],
  clickThrottle: AutomatedClickThrottle,
): Promise<void> {
  for (const selector of selectors) {
    const locator = page.locator?.(selector).first?.() || page.locator?.(selector);
    if (!locator) continue;
    try {
      await runThrottledAutomatedClick(page, clickThrottle, async () => {
        await locator.click({ timeout: 2500 });
      });
      return;
    } catch {
      continue;
    }
  }
  throw new Error("Kein Login-Submit gefunden.");
}

async function passwordChangePromptVisible(page: any): Promise<boolean> {
  try {
    const passwordInputs = page.locator?.(visiblePasswordInputSelector());
    if (passwordInputs && await passwordInputs.count() >= 3) return true;
  } catch {
    // Sichtbarkeitstests sind rein diagnostisch; der Login-Fallback entscheidet danach.
  }

  for (const selector of [
    "text=/Passwort\\s+aendern/i",
    "text=/Passwort\\s+ändern/i",
    "text=/Kennwort\\s+aendern/i",
    "text=/Kennwort\\s+ändern/i",
  ]) {
    try {
      const locator = page.locator?.(selector).first?.() || page.locator?.(selector);
      if (locator && await locator.isVisible({ timeout: 500 })) return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function submitRequiredPasswordChange(
  page: any,
  config: AutomatedLoginConfig,
  clickThrottle: AutomatedClickThrottle,
): Promise<void> {
  await fillPasswordChangeField(page, passwordChangeOldSelectors(config), 0, config.password);
  await fillPasswordChangeField(page, passwordChangeNewSelectors(config), 1, config.newPassword);
  await fillPasswordChangeField(page, passwordChangeConfirmSelectors(config), 2, config.newPassword);
  await clickFirstMatching(page, passwordChangeSubmitSelectors(config), clickThrottle);
}

async function fillPasswordChangeField(page: any, selectors: string[], fallbackIndex: number, value: string): Promise<void> {
  if (selectors.length) {
    try {
      await fillFirstMatching(page, selectors, value);
      return;
    } catch {
      // Danach stabiler Fallback auf die sichtbare Passwortfeld-Reihenfolge.
    }
  }

  const passwordInputs = page.locator?.(visiblePasswordInputSelector());
  if (!passwordInputs) throw new Error("Kein Passwortwechsel-Feld gefunden.");
  await passwordInputs.nth(fallbackIndex).fill(value, { timeout: 2500 });
}

function visiblePasswordInputSelector(): string {
  return "input[type='password']:visible";
}

function loginTenantSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.tenantSelector,
    "input[name='tenant']",
    "input[name='mandant']",
    "input[name='mandantennummer']",
    "input[id*='tenant' i]",
    "input[id*='mandant' i]",
    "input[placeholder*='Mandant' i]",
    "input[aria-label*='Mandant' i]",
    "input[type='text']",
  ].filter(Boolean);
}

function loginUsernameSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.usernameSelector,
    "input[name='username']",
    "input#username",
    "input[name='user']",
    "input[type='email']",
    "input[autocomplete='username']",
    "input[placeholder*='Benutzer' i]",
    "input[aria-label*='Benutzer' i]",
    "input[type='text']",
  ].filter(Boolean);
}

function loginPasswordSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.passwordSelector,
    "input[name='password']",
    "input#password",
    "input[type='password']",
    "input[autocomplete='current-password']",
  ].filter(Boolean);
}

function loginSubmitSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.submitSelector,
    "button[type='submit']",
    "input[type='submit']",
    "button:has-text('Weiter')",
    "button:has-text('Anmelden')",
    "button:has-text('Login')",
    "button:has-text('Einloggen')",
  ].filter(Boolean);
}

function passwordChangeOldSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.changeOldPasswordSelector,
    "input[name='oldPassword']:visible",
    "input[name='currentPassword']:visible",
    "input[autocomplete='current-password']:visible",
  ].filter(Boolean);
}

function passwordChangeNewSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.changeNewPasswordSelector,
    "input[name='newPassword']:visible",
    "input[autocomplete='new-password']:visible",
  ].filter(Boolean);
}

function passwordChangeConfirmSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.changeConfirmPasswordSelector,
    "input[name='confirmPassword']:visible",
    "input[name='passwordConfirmation']:visible",
  ].filter(Boolean);
}

function passwordChangeSubmitSelectors(config: AutomatedLoginConfig): string[] {
  return [
    config.changeSubmitSelector,
    "button:has-text('Neues Passwort speichern')",
    "button:has-text('Passwort speichern')",
    "button:has-text('Speichern')",
    "button[type='submit']",
  ].filter(Boolean);
}

async function waitUntilNotLoginPage(page: any, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isWorkflowLoginUrl(page.url?.() || "")) return;
    await page.waitForTimeout?.(500).catch(() => {});
  }
}

function isWorkflowLoginUrl(value: string): boolean {
  try {
    return /\/login(?:\/|$)/i.test(new URL(value).pathname);
  } catch {
    return /\/login(?:\/|$)/i.test(value);
  }
}

function loadLocalEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = unquoteEnvValue(match[2]);
  }
}

function unquoteEnvValue(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function finalizeWorkflow(input: {
  options: RecordingWorkflowOptions;
  startedAt: string;
  status: RecordingWorkflowResult["status"];
  stopReason: string;
  explorerResult: ExplorerResult | null;
  preflight: RecordingWorkflowPreflight;
}): RecordingWorkflowResult {
  const { options } = input;
  let explorerReportFile = "";
  let flowReportFile = "";
  let flowMappingFile = "";
  let impactFile = "";
  let scoreboardFile = "";
  let relationshipsFile = "";
  let dataModelFile = "";
  let uiMapFile = "";
  let auditFile = "";
  let auditStatus: RecordingAuditResult["status"] | undefined;
  const hasNetworkLog = fs.existsSync(options.logFile);
  const postProcessingPlan = buildRecordingWorkflowPostProcessingPlan(options, { hasNetworkLog });
  const explorer = input.explorerResult ? buildRecordingExplorerStats(input.explorerResult) : undefined;
  const expectedEndpointResults = options.expectedEndpoints.length > 0
    ? evaluateExpectedEndpoints(options.expectedEndpoints, hasNetworkLog ? readJsonLines(options.logFile) : [])
    : [];

  if (input.explorerResult) {
    explorerReportFile = options.explorerReportFile;
    writeExplorerReport(options.explorerReportFile, input.explorerResult, workspaceRoot);
  }

  if (hasNetworkLog) {
    flowMappingFile = options.flowMappingFile;
    writeFlowMapping(options.logFile, options.flowMappingFile);
    flowReportFile = writeFlowReport(options.logFile, options.recordingsDir, {
      knownCatalogFile: options.catalogFile,
    });
  }

  relationshipsFile = options.rebuildRelationships ? options.relationshipsFile : "";
  dataModelFile = options.rebuildDataModel ? options.dataModelFile : "";
  uiMapFile = options.rebuildUiMap ? options.uiMapFile : "";
  impactFile = options.writeImpactReport && hasNetworkLog ? options.impactFile : "";
  scoreboardFile = options.rebuildScoreboard ? options.scoreboardFile : "";

  for (const step of postProcessingPlan.filter((item) => item.phase === "before-manifest")) {
    runRecordingWorkflowPostProcessingStep(step, options);
  }

  const result: RecordingWorkflowResult = {
    mode: options.mode,
    purpose: options.purpose,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    stopReason: input.stopReason,
    logFile: options.logFile,
    preflightFile: options.preflightFile,
    preflightJsonFile: options.preflightJsonFile,
    preflightStatus: input.preflight.status,
    preflight: input.preflight,
    manifestFile: options.manifestFile,
    explorerReportFile: explorerReportFile || undefined,
    flowReportFile: flowReportFile || undefined,
    flowMappingFile: flowMappingFile || undefined,
    catalogFile: options.rebuildCatalog ? options.catalogFile : undefined,
    openApiFile: options.rebuildCatalog ? options.openApiFile : undefined,
    coverageReportFile: options.rebuildCoverageReport ? options.coverageReportFile : undefined,
    knowledgeReportFile: options.rebuildKnowledgeReport ? options.knowledgeReportFile : undefined,
    relationshipsFile: relationshipsFile || undefined,
    dataModelFile: dataModelFile || undefined,
    blueprintFile: options.rebuildBlueprint ? options.blueprintFile : undefined,
    uiMapFile: uiMapFile || undefined,
    scoreboardFile: scoreboardFile || undefined,
    campaignFile: options.rebuildCampaign ? options.campaignFile : undefined,
    impactFile: impactFile || undefined,
    auditFile: auditFile || undefined,
    auditStatus,
    explorer,
    expectedEndpointResults: expectedEndpointResults.length > 0 ? expectedEndpointResults : undefined,
    summaryFile: options.summaryFile,
  };

  writeWorkflowSummaryAndManifest(result, options);

  for (const step of postProcessingPlan.filter((item) => item.phase === "after-manifest")) {
    runRecordingWorkflowPostProcessingStep(step, options);
    if (step.id === "ui-map") result.uiMapFile = uiMapFile;
    if (step.id === "recording-impact" && impactFile) {
      result.impact = readWorkflowImpactSummary(jsonSidecarPath(impactFile));
      writeWorkflowSummaryAndManifest(result, options);
    }
  }

  if (options.runAudit) {
    const audit = auditRecordingArtifacts({
      files: buildRecordingWorkflowAuditFiles({
        logFile: options.logFile,
        preflightFile: options.preflightFile,
        preflightJsonFile: options.preflightJsonFile,
        summaryFile: options.summaryFile,
        manifestFile: options.manifestFile,
        explorerReportFile,
        flowReportFile,
        flowMappingFile,
        catalogFile: options.catalogFile,
        openApiFile: options.openApiFile,
        coverageReportFile: options.coverageReportFile,
        knowledgeReportFile: options.knowledgeReportFile,
        relationshipsFile,
        dataModelFile,
        blueprintFile: options.blueprintFile,
        uiMapFile,
        scoreboardFile,
        impactFile,
        rebuildCatalog: options.rebuildCatalog,
        rebuildCoverageReport: options.rebuildCoverageReport,
        rebuildKnowledgeReport: options.rebuildKnowledgeReport,
        rebuildBlueprint: options.rebuildBlueprint,
        rebuildUiMap: options.rebuildUiMap,
      }),
    });
    auditFile = writeRecordingAudit(audit, options.auditFile);
    auditStatus = audit.status;
    result.auditFile = auditFile;
    result.auditStatus = auditStatus;
    writeWorkflowSummaryAndManifest(result, options);
  }

  for (const step of postProcessingPlan.filter((item) => item.phase === "after-audit")) {
    runRecordingWorkflowPostProcessingStep(step, options);
  }

  return result;
}

function runRecordingWorkflowPostProcessingStep(
  step: RecordingWorkflowPostProcessingStep,
  options: RecordingWorkflowOptions,
): void {
  switch (step.id) {
    case "api-catalog":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "build-api-catalog.ts"),
        "--out",
        options.catalogFile,
        "--openapi-out",
        options.openApiFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "coverage-report":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "coverage-report.ts"),
        "--out",
        options.coverageReportFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "knowledge-report":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "omnia-knowledge.ts"),
        "--out",
        options.knowledgeReportFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "relationships":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "omnia-relationships.ts"),
        "--out",
        options.relationshipsFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "data-model":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "omnia-data-model.ts"),
        "--out",
        options.dataModelFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "ui-map":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "omnia-ui-map.ts"),
        "--out",
        options.uiMapFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "platform-blueprint":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "platform-blueprint.ts"),
        "--out",
        options.blueprintFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "recording-impact":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "recording-impact.ts"),
        "--log",
        options.logFile,
        "--out",
        options.impactFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "recording-scoreboard":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "recording-scoreboard.ts"),
        "--out",
        options.scoreboardFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
    case "recording-campaign":
      execFileSync(process.execPath, [
        path.join(workspaceRoot, "tools", "recording-campaign.ts"),
        "--out",
        options.campaignFile,
      ], { cwd: workspaceRoot, stdio: "inherit" });
      return;
  }
}

function aggregatePreflightStatus(checks: RecordingWorkflowPreflightCheck[]): RecordingWorkflowPreflightStatus {
  if (checks.some((check) => check.status === "blocked")) return "blocked";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "ready";
}

function postProcessingPreflightCheck(options: RecordingWorkflowOptions): RecordingWorkflowPreflightCheck {
  if (postProcessingEnabled(options)) {
    return { name: "Nachauswertung", status: "ready", detail: "Katalog, OpenAPI, Coverage, Knowledge, Graphen, Scoreboard und Campaign aktiv." };
  }
  return { name: "Nachauswertung", status: "warning", detail: "Mindestens ein Nachauswertungsmodul ist deaktiviert." };
}

function postProcessingEnabled(options: RecordingWorkflowOptions): boolean {
  return [
    options.rebuildCatalog,
    options.rebuildCoverageReport,
    options.rebuildKnowledgeReport,
    options.rebuildRelationships,
    options.rebuildDataModel,
    options.rebuildBlueprint,
    options.rebuildUiMap,
    options.rebuildScoreboard,
    options.rebuildCampaign,
    options.writeImpactReport,
  ].every(Boolean);
}

function artifactLabel(name: string): string {
  const labels: Record<string, string> = {
    logFile: "Netzwerk-Log",
    summaryFile: "Workflow-Summary",
    manifestFile: "Run-Manifest",
    flowMappingFile: "Flow-Mapping",
    catalogFile: "API-Katalog",
    openApiFile: "OpenAPI",
    coverageReportFile: "Coverage-Report",
    knowledgeReportFile: "Knowledge-Report",
    relationshipsFile: "Relationship-Map",
    dataModelFile: "Data-Model",
    blueprintFile: "Plattform-Blueprint",
    uiMapFile: "UI-Map",
    scoreboardFile: "Recording-Scoreboard",
    campaignFile: "Recording-Campaign",
    auditFile: "Recording-Audit",
  };
  return labels[name] || name;
}

function jsonSidecarPath(file: string): string {
  return path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.json`);
}

function writeWorkflowSummaryAndManifest(
  result: RecordingWorkflowResult,
  options: Pick<RecordingWorkflowOptions, "summaryFile" | "manifestFile">,
): void {
  fs.mkdirSync(path.dirname(options.summaryFile), { recursive: true });
  fs.writeFileSync(options.summaryFile, buildRecordingWorkflowSummaryMarkdown(result));
  fs.mkdirSync(path.dirname(options.manifestFile), { recursive: true });
  fs.writeFileSync(options.manifestFile, `${JSON.stringify(buildRecordingWorkflowManifest(result), null, 2)}\n`);
}

function printWorkflowStart(options: RecordingWorkflowOptions, logFile: string): void {
  console.log("=".repeat(72));
  console.log("Recording-Workflow aktiv.");
  console.log(`Modus: ${options.mode}`);
  console.log(`JSONL: ${logFile}`);
  console.log(`Run-Manifest: ${options.manifestFile}`);
  if (options.mode === "auto") console.log(`Explorer-Report: ${options.explorerReportFile}`);
  if (options.mode === "auto" && options.autoFlow) console.log(`Auto-Flow: ${options.autoFlow}`);
  console.log(`Nachauswertung: Katalog=${options.rebuildCatalog ? "ja" : "nein"}, Coverage=${options.rebuildCoverageReport ? "ja" : "nein"}, Knowledge=${options.rebuildKnowledgeReport ? "ja" : "nein"}, Relationships=${options.rebuildRelationships ? "ja" : "nein"}, DataModel=${options.rebuildDataModel ? "ja" : "nein"}, Blueprint=${options.rebuildBlueprint ? "ja" : "nein"}, UIMap=${options.rebuildUiMap ? "ja" : "nein"}, Scoreboard=${options.rebuildScoreboard ? "ja" : "nein"}, Campaign=${options.rebuildCampaign ? "ja" : "nein"}, Impact=${options.writeImpactReport ? "ja" : "nein"}`);
  console.log(`Audit: ${options.runAudit ? options.auditFile : "deaktiviert"}`);
  if (options.expectedEndpoints.length > 0) {
    console.log(`Erwartete Endpunkte: ${options.expectedEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`).join(", ")}`);
  }
  console.log("=".repeat(72));
}

function printWorkflowResult(result: RecordingWorkflowResult): void {
  console.log(`Summary: ${result.summaryFile}`);
  console.log(`JSONL: ${result.logFile}`);
  if (result.manifestFile) console.log(`Run-Manifest: ${result.manifestFile}`);
  if (result.preflightFile) console.log(`Preflight: ${result.preflightFile}`);
  if (result.preflightJsonFile) console.log(`Preflight-JSON: ${result.preflightJsonFile}`);
  if (result.explorerReportFile) console.log(`Explorer-Report: ${result.explorerReportFile}`);
  if (result.flowReportFile) console.log(`Flow-Report: ${result.flowReportFile}`);
  if (result.impactFile) console.log(`Impact: ${result.impactFile}`);
  if (result.coverageReportFile) console.log(`Coverage: ${result.coverageReportFile}`);
  if (result.knowledgeReportFile) console.log(`Knowledge: ${result.knowledgeReportFile}`);
  if (result.relationshipsFile) console.log(`Relationships: ${result.relationshipsFile}`);
  if (result.dataModelFile) console.log(`Data-Model: ${result.dataModelFile}`);
  if (result.blueprintFile) console.log(`Blueprint: ${result.blueprintFile}`);
  if (result.uiMapFile) console.log(`UI-Map: ${result.uiMapFile}`);
  if (result.scoreboardFile) console.log(`Scoreboard: ${result.scoreboardFile}`);
  if (result.campaignFile) console.log(`Campaign: ${result.campaignFile}`);
  if (result.auditFile) console.log(`Audit: ${result.auditFile} (${result.auditStatus})`);
  if (result.expectedEndpointResults && result.expectedEndpointResults.length > 0) {
    const observed = result.expectedEndpointResults.filter((item) => item.observed).length;
    console.log(`Erwartete Endpunkte: ${observed}/${result.expectedEndpointResults.length} gesehen`);
  }
}

function parseSteps(argv: string[]): string[] | null {
  const raw = valueAfter(argv, "--steps");
  if (!raw) return null;
  const steps = raw.split(",").map((step) => step.trim()).filter(Boolean);
  return steps.length > 0 ? steps : null;
}

function buildNodeCommand(args: string[]): string {
  return ["node", ...args.map(shellArg)].join(" ");
}

function redactPreflightRunArgs(args: string[]): string[] {
  return args.map((arg, index) => {
    const previous = args[index - 1];
    return previous && preflightSensitiveValueFlags.has(previous) ? REDACTED : arg;
  });
}

function parseExpectedEndpoints(argv: string[]): KnownEndpoint[] {
  const endpoints: KnownEndpoint[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--expect-endpoint" || !argv[index + 1]) continue;
    const raw = argv[index + 1].trim();
    const match = raw.match(/^([A-Za-z]+)\s+(.+)$/);
    if (match) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        source: "recording-workflow",
      });
    }
    index += 1;
  }
  return endpoints;
}

function parseMode(value: string): RecordingWorkflowMode {
  return value === "auto" ? "auto" : "manual";
}

function parseWorkflowPurpose(value: string | undefined): RecordingWorkflowPurpose | undefined {
  if (!value) return undefined;
  if (value === "coverage" || value === "quality-baseline" || value === "bootstrap" || value === "manual") return value;
  throw new Error(`Unbekannter Recording-Zweck: ${value}`);
}

function appendFlagValue(args: string[], flag: string, value: string | undefined): void {
  if (!value) return;
  args.push(flag, value);
}

function commandPath(file: string): string {
  const relative = path.relative(workspaceRoot, file);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? relative : file;
}

function shellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) return value;
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function valueAfter(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function intArg(argv: string[], name: string, fallback: number): number {
  const raw = valueAfter(argv, name);
  const parsed = Number.parseInt(raw || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function endpointKey(endpoint: KnownEndpoint): string {
  return `${endpoint.method.toUpperCase()} ${endpoint.path}`;
}

function compactArtifacts(input: Record<string, string | null | undefined>): Record<string, string | null> {
  const output: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output;
}

function readWorkflowImpactSummary(file: string): RecordingWorkflowImpactSummary | undefined {
  if (!fs.existsSync(file)) return undefined;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    if (!isRecord(parsed)) return undefined;
    return {
      targetResponses: numberField(parsed, "targetResponses"),
      targetEndpointCount: numberField(parsed, "targetEndpointCount"),
      newEndpointCount: numberField(parsed, "newEndpointCount"),
      newKnownInventoryCount: numberField(parsed, "newKnownInventoryCount"),
      coverageDeltaPercent: numberField(parsed, "coverageDeltaPercent"),
      downloads: Array.isArray(parsed.downloads) ? parsed.downloads.length : 0,
      topAreas: Array.isArray(parsed.domainImpacts)
        ? parsed.domainImpacts
          .filter(isRecord)
          .slice(0, 5)
          .map((item) => ({
            area: String(item.area || ""),
            endpointCount: numberField(item, "endpointCount"),
            newEndpointCount: numberField(item, "newEndpointCount"),
            responseCount: numberField(item, "responseCount"),
          }))
        : [],
    };
  } catch {
    return undefined;
  }
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = Number(record[key] || 0);
  return Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function readJsonLines(file: string): Record<string, unknown>[] {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Record<string, unknown>[];
}

function formatLocalTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${min}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMainModule(): boolean {
  return process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;
}

if (isMainModule()) {
  runRecordingWorkflowCli().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
