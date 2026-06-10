import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCoverageReport,
  classifyEndpointArea,
  loadKnownEndpoints,
  type CoverageReport,
  type KnownEndpoint,
  type RecordingPriority,
} from "./coverage-report.ts";
import {
  buildOmniaKnowledge,
  type KnowledgeDomain,
  type OmniaKnowledgeReport,
} from "./omnia-knowledge.ts";
import {
  buildOmniaRelationships,
  type OmniaRelationshipMap,
} from "./omnia-relationships.ts";
import {
  buildOmniaUiMap,
  type OmniaUiFollowupCommand,
} from "./omnia-ui-map.ts";
import {
  recordingWorkflowBaseArgs,
  type RecordingCommandTargetOptions,
  withRecordingUrlArg,
} from "./recording-command.ts";
import { moduleScopePath } from "./explorer/policies.ts";
import { evaluateNetworkLogQuality } from "./recording-audit.ts";
import type { RecordingExplorerOpenTarget, RecordingWorkflowManifest } from "./recording-workflow.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "recordings", "recording-campaign.md");

export type RecordingCampaignOptions = {
  run: boolean;
  limit: number;
  includeManual: boolean;
  printNext: boolean;
  outputFile: string;
  recordingUrl?: string;
  generatedAt?: Date;
};

export type RecordingCampaignStep = {
  index: number;
  area: string;
  reason: string;
  label: string;
  mode: "auto" | "manual";
  command: string;
  args: string[];
  examples: KnownEndpoint[];
};

export type RecordingDomainBacklogItem = {
  area: string;
  knownEndpoints: number;
  observedKnownEndpoints: number;
  missingKnownEndpoints: number;
  coveragePercent: number;
  reason: string;
  command: string;
  args: string[];
  examples: KnownEndpoint[];
};

export type RecordingRelationshipMission = {
  transition: string;
  fromArea: string;
  toArea: string;
  transitionCount: number;
  missingKnownEndpoints: number;
  reason: string;
  command: string;
  args: string[];
  examples: KnownEndpoint[];
};

export type RecordingEndpointMissionIntent = "export" | "search" | "detail" | "list";

export type RecordingEndpointMission = {
  area: string;
  intent: RecordingEndpointMissionIntent;
  endpoint: KnownEndpoint;
  mode: "manual";
  reason: string;
  command: string;
  args: string[];
};

export type RecordingExpectedEndpointMiss = {
  endpoint: KnownEndpoint;
  summaryFile: string;
};

export type RecordingRetryMission = RecordingEndpointMission & {
  attempts: number;
  summaryFiles: string[];
};

export type RecordingExplorerFollowupMission = {
  manifestFile: string;
  logFile?: string;
  summaryFile?: string;
  explorerReportFile?: string;
  startPath?: string;
  startUrl: string;
  finalUrl: string;
  stopReason: string;
  clickedTargets: number;
  skippedTargets: number;
  blockedRequests: number;
  discoveredTargets: number;
  openTargets: number;
  expectedEndpointCount?: number;
  expectedObservedCount?: number;
  topOpenTargets: RecordingExplorerOpenTarget[];
  reason: string;
  command: string;
  args: string[];
};

export type RecordingQualityRerunMission = {
  logFile: string;
  findings: string[];
  apiResponses: number;
  timelineMarkers: number;
  uiSnapshots?: number;
  reason: string;
  command: string;
  args: string[];
};

export type RecordingCampaignPlan = {
  generatedAt: string;
  mode: "dry-run" | "run";
  coveragePercent: number;
  knownCount: number;
  observedKnownCount: number;
  missingCount: number;
  steps: RecordingCampaignStep[];
  skippedManual: RecordingPriority[];
  domainBacklog: RecordingDomainBacklogItem[];
  relationshipMissions: RecordingRelationshipMission[];
  retryMissions: RecordingRetryMission[];
  explorerFollowupMissions: RecordingExplorerFollowupMission[];
  uiMapFollowupMissions: OmniaUiFollowupCommand[];
  qualityRerunMissions: RecordingQualityRerunMission[];
  endpointMissions: RecordingEndpointMission[];
};

export type RecordingCampaignRunResult = {
  area: string;
  status: string;
};

export type RecordingNextRecommendation = {
  priority: string;
  label: string;
  reason: string;
  mode: "auto" | "manual";
  command: string;
  args: string[];
};

const recordingCampaignValueFlags = new Set([
  "--limit",
  "--out",
  "--url",
]);

const recordingCampaignBooleanFlags = new Set([
  "--help",
  "--include-manual",
  "--print-next",
  "--run",
  "-h",
]);

const successfulExplorerStopReasons = new Set(["completed", "no-more-targets"]);

if (isMainModule()) {
  runRecordingCampaignCli(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}

export function isRecordingCampaignHelpRequest(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

export function buildRecordingCampaignHelp(): string {
  return [
    "Recording-Campaign",
    "",
    "Plant coverage-getriebene Omnia-Recording-Missionen aus Logs, Inventar, UI-Map, Scoreboard und Quality-Reruns.",
    "",
    "Plan nur schreiben:",
    "  node tools/recording-campaign.ts --url https://api2.optica-omnia.de",
    "",
    "Naechste Empfehlung ausgeben:",
    "  node tools/recording-campaign.ts --print-next --url https://api2.optica-omnia.de",
    "",
    "Auto-Runs adaptiv ausfuehren:",
    "  node tools/recording-campaign.ts --run --limit 3 --url https://api2.optica-omnia.de",
    "",
    "Wichtige Optionen:",
    "  --run                fuehrt geplante Auto-Missionen aus",
    "  --limit <n>          begrenzt geplante oder ausgefuehrte Schritte",
    "  --include-manual     manuelle Missionen und Quality-Reruns einbeziehen",
    "  --print-next         naechste Empfehlung fuer recording-next ausgeben",
    "  --out <datei>        Markdown-Report, daneben recording-campaign-next.json",
    "  --url <omnia-url>    Ziel-URL fuer generierte Workflow-Kommandos",
    "",
    "Ergebnisse:",
    "  docs/recordings/recording-campaign.md",
    "  docs/recordings/recording-campaign-next.json",
    "  docs/recordings/recording-campaign-next-auto.json",
  ].join("\n");
}

export function parseRecordingCampaignArgs(argv: string[]): RecordingCampaignOptions {
  validateRecordingCampaignArgs(argv);
  return {
    run: argv.includes("--run"),
    limit: intArg(argv, "--limit", 5),
    includeManual: argv.includes("--include-manual"),
    printNext: argv.includes("--print-next"),
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
    recordingUrl: valueAfter(argv, "--url") || undefined,
  };
}

function validateRecordingCampaignArgs(argv: string[]): void {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-")) continue;
    if (recordingCampaignValueFlags.has(arg)) {
      index += 1;
      continue;
    }
    if (recordingCampaignBooleanFlags.has(arg)) continue;
    throw new Error(`Unbekannte Recording-Campaign-Option: ${arg}. Hilfe: node tools/recording-campaign.ts --help`);
  }
}

export function buildRecordingCampaignPlan(
  report: CoverageReport,
  options: Pick<RecordingCampaignOptions, "limit" | "includeManual" | "generatedAt"> & {
    run?: boolean;
    knowledgeReport?: OmniaKnowledgeReport;
    relationships?: OmniaRelationshipMap;
    expectedEndpointMisses?: RecordingExpectedEndpointMiss[];
    explorerFollowupMissions?: RecordingExplorerFollowupMission[];
    uiMapFollowupMissions?: OmniaUiFollowupCommand[];
    qualityRerunMissions?: RecordingQualityRerunMission[];
  } & RecordingCommandTargetOptions,
): RecordingCampaignPlan {
  const steps: RecordingCampaignStep[] = [];
  const skippedManual: RecordingPriority[] = [];

  for (const priority of report.recordingPriorities) {
    const command = priority.commands[0];
    if (!command) continue;

    if (command.mode === "manual" && !options.includeManual) {
      skippedManual.push(priority);
      continue;
    }

    const args = withRecordingUrlArg(command.args, options);
    steps.push({
      index: steps.length + 1,
      area: priority.area,
      reason: priority.reason,
      label: command.label,
      mode: command.mode,
      command: formatNodeCommand(args),
      args,
      examples: priority.examples,
    });

    if (steps.length >= options.limit) break;
  }

  const retryMissions = buildRetryMissions(options.expectedEndpointMisses || [], report.missing, options);
  const explorerFollowupMissions = [...(options.explorerFollowupMissions || [])]
    .sort(compareExplorerFollowupMissions)
    .slice(0, 12);
  const uiMapFollowupMissions = [...(options.uiMapFollowupMissions || [])]
    .sort(compareUiMapFollowupMissions)
    .slice(0, 12);
  const qualityRerunMissions = [...(options.qualityRerunMissions || [])]
    .sort(compareQualityRerunMissions)
    .slice(0, 12);
  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    mode: options.run ? "run" : "dry-run",
    coveragePercent: report.coveragePercent,
    knownCount: report.knownCount,
    observedKnownCount: report.observedKnownCount,
    missingCount: report.missing.length,
    steps,
    skippedManual,
    domainBacklog: buildDomainBacklog(options.knowledgeReport, new Set(steps.map((step) => step.area)), options),
    relationshipMissions: buildRelationshipMissions(options.relationships, options.knowledgeReport, options),
    retryMissions,
    explorerFollowupMissions,
    uiMapFollowupMissions,
    qualityRerunMissions,
    endpointMissions: buildEndpointMissions(report.missing, new Set(retryMissions.map((mission) => endpointKey(mission.endpoint))), options),
  };
}

export function buildAdaptiveCampaignRunSequence(options: {
  knownEndpoints: KnownEndpoint[];
  limit: number;
  includeManual: boolean;
  recordsForIteration: (iteration: number) => Record<string, unknown>[];
  generatedAt?: Date;
} & RecordingCommandTargetOptions): RecordingCampaignStep[] {
  const sequence: RecordingCampaignStep[] = [];
  const executedAreas = new Set<string>();

  for (let iteration = 0; iteration < options.limit; iteration += 1) {
    const report = buildCoverageReport(options.knownEndpoints, options.recordsForIteration(iteration), {
      generatedAt: options.generatedAt,
      recordingUrl: options.recordingUrl,
    });
    const plan = buildRecordingCampaignPlan(report, {
      generatedAt: options.generatedAt,
      limit: options.limit,
      includeManual: options.includeManual,
      recordingUrl: options.recordingUrl,
    });
    const next = plan.steps.find((step) => !executedAreas.has(step.area));
    if (!next) break;
    executedAreas.add(next.area);
    sequence.push({ ...next, index: sequence.length + 1 });
  }

  return sequence;
}

export async function runAdaptiveCampaignSteps(options: {
  knownEndpoints: KnownEndpoint[];
  limit: number;
  includeManual: boolean;
  recordsForIteration: (iteration: number) => Record<string, unknown>[];
  executeStep: (step: RecordingCampaignStep) => Promise<void> | void;
  generatedAt?: Date;
  expectedEndpointMisses?: RecordingExpectedEndpointMiss[];
  qualityRerunMissions?: RecordingQualityRerunMission[];
} & RecordingCommandTargetOptions): Promise<{ steps: RecordingCampaignStep[]; results: RecordingCampaignRunResult[] }> {
  const steps: RecordingCampaignStep[] = [];
  const results: RecordingCampaignRunResult[] = [];
  const executedAreas = new Set<string>();

  if (options.includeManual) {
    for (const mission of options.qualityRerunMissions || []) {
      if (steps.length >= options.limit) break;
      const step = qualityRerunStep(mission, steps.length + 1);
      steps.push(step);
      try {
        await options.executeStep(step);
        results.push({ area: step.area, status: "completed" });
      } catch (error) {
        results.push({ area: step.area, status: `failed: ${errorMessage(error)}` });
        return { steps, results };
      }
    }
  }

  for (let iteration = 0; steps.length < options.limit; iteration += 1) {
    const report = buildCoverageReport(options.knownEndpoints, options.recordsForIteration(iteration), {
      generatedAt: options.generatedAt,
      recordingUrl: options.recordingUrl,
    });
    const plan = buildRecordingCampaignPlan(report, {
      generatedAt: options.generatedAt,
      limit: options.limit,
      includeManual: options.includeManual,
      expectedEndpointMisses: options.expectedEndpointMisses,
      recordingUrl: options.recordingUrl,
    });
    const next = plan.steps.find((step) => !executedAreas.has(step.area));
    if (!next) break;

    const step = { ...next, index: steps.length + 1 };
    steps.push(step);
    executedAreas.add(step.area);

    try {
      await options.executeStep(step);
      results.push({ area: step.area, status: "completed" });
    } catch (error) {
      results.push({ area: step.area, status: `failed: ${errorMessage(error)}` });
      break;
    }
  }

  return { steps, results };
}

export function buildRecordingCampaignMarkdown(plan: RecordingCampaignPlan, results: Array<{ area: string; status: string }> = []): string {
  const lines = [
    "# Recording-Campaign",
    "",
    `Generiert: ${plan.generatedAt}`,
    `Modus: ${plan.mode}`,
    "",
    "## Coverage-Basis",
    "",
    `- Bekannte Endpunkte: ${plan.knownCount}`,
    `- Beobachtet aus bekanntem Inventar: ${plan.observedKnownCount}`,
    `- Coverage: ${formatPercent(plan.coveragePercent)} %`,
    `- Fehlende bekannte Endpunkte: ${plan.missingCount}`,
    "",
  ];

  lines.push("## Naechste Aufnahme", "");
  const nextRecording = selectNextRecordingRecommendation(plan);
  if (!nextRecording) {
    lines.push("- Keine konkrete Aufnahme aus dem aktuellen Plan ableitbar.", "");
  } else {
    lines.push(`- Prioritaet: ${nextRecording.priority}`);
    lines.push(`- Ziel: ${nextRecording.label}`);
    lines.push(`- Grund: ${nextRecording.reason}`);
    lines.push("```bash");
    lines.push(nextRecording.command);
    lines.push("```");
    lines.push("");
  }

  lines.push("## Geplante Recording-Runs", "");

  if (plan.steps.length === 0) {
    lines.push("- Keine automatisch ausfuehrbaren Recording-Runs aus den aktuellen Prioritaeten ableitbar.", "");
  } else {
    for (const step of plan.steps) {
      lines.push(`### ${step.index}. ${step.area}`, "");
      lines.push(`- Label: ${step.label}`);
      lines.push(`- Modus: ${step.mode}`);
      lines.push(`- Grund: ${step.reason}`);
      lines.push("- Beispiele:");
      for (const endpoint of step.examples) {
        lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
      }
      lines.push("```bash");
      lines.push(step.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Manuell uebersprungene Bereiche", "");
  if (plan.skippedManual.length === 0) {
    lines.push("- Keine.", "");
  } else {
    for (const priority of plan.skippedManual) {
      lines.push(`- ${priority.area}: ${priority.reason}`);
    }
    lines.push("");
  }

  if (results.length > 0) {
    lines.push("## Ausfuehrung", "");
    for (const result of results) {
      lines.push(`- ${result.area}: ${result.status}`);
    }
    lines.push("");
  }

  lines.push("## Relationship-Missions", "");
  if (plan.relationshipMissions.length === 0) {
    lines.push("- Keine zusaetzlichen Uebergangsmissionen aus der Relationship-Map ableitbar.", "");
  } else {
    for (const mission of plan.relationshipMissions) {
      lines.push(`### ${mission.transition}`, "");
      lines.push(`- Grund: ${mission.reason}`);
      lines.push(`- Beobachtete Kanten: ${mission.transitionCount}`);
      lines.push(`- Fehlende bekannte Endpunkte in beiden Bereichen: ${mission.missingKnownEndpoints}`);
      lines.push("- Fehlende Beispiele:");
      for (const endpoint of mission.examples) {
        lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
      }
      lines.push("```bash");
      lines.push(mission.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Retry-Missions", "");
  if (plan.retryMissions.length === 0) {
    lines.push("- Keine fehlgeschlagenen erwarteten Endpunkte aus Workflow-Manifesten oder Summaries erneut einzuplanen.", "");
  } else {
    for (const mission of plan.retryMissions) {
      lines.push(`### ${mission.area}: ${mission.intent}`, "");
      lines.push(`- Endpoint: ${mission.endpoint.method} \`${mission.endpoint.path}\``);
      lines.push(`- Versuche: ${mission.attempts}`);
      lines.push(`- Grund: ${mission.reason}`);
      lines.push("- Vorherige Artefakte:");
      for (const file of mission.summaryFiles) {
        lines.push(`  - \`${file}\``);
      }
      lines.push("```bash");
      lines.push(mission.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Explorer-Followups", "");
  if (plan.explorerFollowupMissions.length === 0) {
    lines.push("- Keine blockierten oder wirkungslosen Auto-Explorer-Laeufe aus Workflow-Manifesten nachzufahren.", "");
  } else {
    for (const mission of plan.explorerFollowupMissions) {
      lines.push(`### ${path.basename(mission.manifestFile)}`, "");
      lines.push(`- Stop-Grund: ${mission.stopReason}`);
      lines.push(`- Auto-Explorer: ${mission.clickedTargets} geklickt, ${mission.skippedTargets} uebersprungen, ${mission.blockedRequests} blockiert, ${mission.openTargets} offen`);
      lines.push(`- Grund: ${mission.reason}`);
      if (mission.topOpenTargets.length > 0) {
        lines.push("- Offene UI-Ziele:");
        for (const target of mission.topOpenTargets.slice(0, 6)) {
          lines.push(`  - ${target.kind || "target"} \`${target.path || "-"}\` ${target.label} (${target.seenCount} Sichtung(en))`);
        }
      }
      lines.push("- Vorherige Artefakte:");
      lines.push(`  - \`${mission.manifestFile}\``);
      if (mission.summaryFile) lines.push(`  - \`${mission.summaryFile}\``);
      if (mission.explorerReportFile) lines.push(`  - \`${mission.explorerReportFile}\``);
      if (mission.logFile) lines.push(`  - \`${mission.logFile}\``);
      lines.push("```bash");
      lines.push(mission.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## UI-Map-Followups", "");
  if (plan.uiMapFollowupMissions.length === 0) {
    lines.push("- Keine offenen oder API-unverknuepften UI-Ziele aus der UI-Map nachzufahren.", "");
  } else {
    for (const mission of plan.uiMapFollowupMissions) {
      lines.push(`### ${mission.target.label}`, "");
      lines.push(`- Ziel: ${mission.target.kind || "target"} \`${mission.target.path || "-"}\``);
      lines.push(`- Grund: ${mission.reason}`);
      lines.push(`- Sichtungen: ${mission.target.seenCount}`);
      lines.push(`- Geklickt/Offen/API-Endpunkte: ${mission.target.clickedCount} / ${mission.target.openCount} / ${mission.target.apiEndpointCount}`);
      if (mission.target.sources.length > 0) {
        lines.push("- Quellen:");
        for (const source of mission.target.sources.slice(0, 4)) {
          lines.push(`  - \`${source}\``);
        }
      }
      lines.push("```bash");
      lines.push(mission.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Quality-Reruns", "");
  if (plan.qualityRerunMissions.length === 0) {
    lines.push("- Keine schwachen Recording-Logs aus dem Qualitaetscheck nachzufahren.", "");
  } else {
    for (const mission of plan.qualityRerunMissions) {
      lines.push(`### ${path.basename(mission.logFile)}`, "");
      lines.push(`- Grund: ${mission.reason}`);
      lines.push(`- Findings: ${mission.findings.join(", ") || "-"}`);
      lines.push(`- API-Responses: ${mission.apiResponses}`);
      lines.push(`- Timeline-Marker: ${mission.timelineMarkers}`);
      lines.push(`- UI-Snapshots: ${mission.uiSnapshots ?? 0}`);
      lines.push(`- Vorheriges Log: \`${mission.logFile}\``);
      lines.push("```bash");
      lines.push(mission.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Endpoint-Missions", "");
  if (plan.endpointMissions.length === 0) {
    lines.push("- Keine konkreten Export-/Such-/Detailmissionen aus offenen Endpunkten ableitbar.", "");
  } else {
    for (const mission of plan.endpointMissions) {
      lines.push(`### ${mission.area}: ${mission.intent}`, "");
      lines.push(`- Endpoint: ${mission.endpoint.method} \`${mission.endpoint.path}\``);
      lines.push(`- Modus: ${mission.mode}`);
      lines.push(`- Grund: ${mission.reason}`);
      lines.push("```bash");
      lines.push(mission.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Domain-Backlog", "");
  if (plan.domainBacklog.length === 0) {
    lines.push("- Keine zusaetzlichen Domaenenluecken aus dem Knowledge-Report ableitbar.", "");
  } else {
    for (const item of plan.domainBacklog) {
      lines.push(`### ${item.area}`, "");
      lines.push(`- Grund: ${item.reason}`);
      lines.push(`- Inventar-Coverage: ${formatPercent(item.coveragePercent)} %`);
      lines.push(`- Known/Observed/Missing: ${item.knownEndpoints} / ${item.observedKnownEndpoints} / ${item.missingKnownEndpoints}`);
      lines.push("- Fehlende Beispiele:");
      for (const endpoint of item.examples) {
        lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
      }
      lines.push("```bash");
      lines.push(item.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## Verwendung", "");
  lines.push("- Ohne `--run` schreibt dieses Tool nur den Plan.");
  lines.push("- Mit `--run` wird nach jedem abgeschlossenen Auto-Run neu aus den aktuellen JSONL-Logs geplant; Login/Workspace bleiben ueber `--wait-for-login` kontrolliert.");
  lines.push("- Manuelle Bereiche und Quality-Reruns werden nur mit `--include-manual` ausgefuehrt.");
  lines.push("");

  return `${lines.join("\n")}`;
}

export async function runRecordingCampaignCli(argv: string[]): Promise<RecordingCampaignPlan> {
  if (isRecordingCampaignHelpRequest(argv)) {
    console.log(buildRecordingCampaignHelp());
    process.exitCode = 0;
    return emptyRecordingCampaignPlan();
  }

  const options = parseRecordingCampaignArgs(argv);
  const known = loadKnownEndpoints();
  const inputFiles = resolveInputFiles(argv);
  const records = inputFiles.flatMap(readJsonLines);
  const report = buildCoverageReport(known, records, { recordingUrl: options.recordingUrl });
  const knowledgeReport = buildOmniaKnowledge(records, { knownEndpoints: known });
  const relationships = buildOmniaRelationships(records);
  const recordingsDir = path.dirname(defaultOutputFile);
  const expectedEndpointMisses = loadExpectedEndpointMisses(recordingsDir);
  const explorerFollowupMissions = loadExplorerFollowupMissions(recordingsDir, options);
  const uiMapFollowupMissions = loadUiMapFollowupMissions(inputFiles, options);
  const qualityRerunMissions = loadQualityRerunMissions(inputFiles, options);
  let plan = buildRecordingCampaignPlan(report, {
    ...options,
    knowledgeReport,
    relationships,
    expectedEndpointMisses,
    explorerFollowupMissions,
    uiMapFollowupMissions,
    qualityRerunMissions,
  });
  let results: RecordingCampaignRunResult[] = [];

  if (options.run) {
    const adaptive = await runAdaptiveCampaignSteps({
      knownEndpoints: known,
      limit: options.limit,
      includeManual: options.includeManual,
      expectedEndpointMisses,
      qualityRerunMissions,
      recordingUrl: options.recordingUrl,
      recordsForIteration: () => resolveInputFiles(argv).flatMap(readJsonLines),
      executeStep: (step) => execFileSync(process.execPath, step.args, { cwd: workspaceRoot, stdio: "inherit" }),
    });
    const refreshedRecords = resolveInputFiles(argv).flatMap(readJsonLines);
    const refreshedReport = buildCoverageReport(known, refreshedRecords, { recordingUrl: options.recordingUrl });
    const refreshedKnowledge = buildOmniaKnowledge(refreshedRecords, { knownEndpoints: known });
    const refreshedRelationships = buildOmniaRelationships(refreshedRecords);
    const refreshedInputFiles = resolveInputFiles(argv);
    plan = {
      ...buildRecordingCampaignPlan(refreshedReport, {
        ...options,
        knowledgeReport: refreshedKnowledge,
        relationships: refreshedRelationships,
        expectedEndpointMisses: loadExpectedEndpointMisses(recordingsDir),
        explorerFollowupMissions: loadExplorerFollowupMissions(recordingsDir, options),
        uiMapFollowupMissions: loadUiMapFollowupMissions(refreshedInputFiles, options),
        qualityRerunMissions: loadQualityRerunMissions(refreshedInputFiles, options),
      }),
      steps: adaptive.steps,
    };
    results = adaptive.results;
  }

  writeRecordingCampaign(plan, options.outputFile, results);
  if (options.printNext) {
    console.log(selectNextRecordingRecommendation(plan)?.command || "");
    return plan;
  }
  console.log(`Recording-Campaign: ${options.outputFile}`);
  console.log(`Modus: ${plan.mode}`);
  console.log(`Geplante Runs: ${plan.steps.length}`);
  console.log(`Manuell uebersprungen: ${plan.skippedManual.length}`);
  return plan;
}

function emptyRecordingCampaignPlan(): RecordingCampaignPlan {
  return {
    generatedAt: new Date().toISOString(),
    mode: "dry-run",
    coveragePercent: 0,
    knownCount: 0,
    observedKnownCount: 0,
    missingCount: 0,
    steps: [],
    skippedManual: [],
    domainBacklog: [],
    relationshipMissions: [],
    retryMissions: [],
    explorerFollowupMissions: [],
    uiMapFollowupMissions: [],
    qualityRerunMissions: [],
    endpointMissions: [],
  };
}

export function writeRecordingCampaign(
  plan: RecordingCampaignPlan,
  outputFile = defaultOutputFile,
  results: Array<{ area: string; status: string }> = [],
): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildRecordingCampaignMarkdown(plan, results));
  fs.writeFileSync(nextRecordingFile(outputFile), `${JSON.stringify(selectNextRecordingRecommendation(plan), null, 2)}\n`);
  fs.writeFileSync(nextAutoRecordingFile(outputFile), `${JSON.stringify(selectNextAutoRecordingRecommendation(plan), null, 2)}\n`);
  return outputFile;
}

export function selectNextRecordingRecommendation(plan: RecordingCampaignPlan): RecordingNextRecommendation | null {
  return nextRecordingRecommendations(plan)[0] || null;
}

export function selectNextAutoRecordingRecommendation(plan: RecordingCampaignPlan): RecordingNextRecommendation | null {
  const planned = selectNextAutoStep(plan);
  if (!planned) return null;
  return {
    priority: "Geplanter Recording-Run",
    label: planned.label,
    reason: planned.reason,
    mode: planned.mode,
    command: planned.command,
    args: planned.args,
  };
}

function nextRecordingRecommendations(plan: RecordingCampaignPlan): RecordingNextRecommendation[] {
  const recommendations: RecordingNextRecommendation[] = [];
  const qualityRerun = plan.qualityRerunMissions[0];
  if (qualityRerun) {
    recommendations.push({
      priority: "Quality-Rerun",
      label: path.basename(qualityRerun.logFile),
      reason: qualityRerun.reason,
      mode: "manual",
      command: qualityRerun.command,
      args: qualityRerun.args,
    });
  }

  const planned = plan.steps[0];
  if (planned) {
    recommendations.push({
      priority: "Geplanter Recording-Run",
      label: planned.label,
      reason: planned.reason,
      mode: planned.mode,
      command: planned.command,
      args: planned.args,
    });
  }

  const retry = plan.retryMissions[0];
  if (retry) {
    recommendations.push({
      priority: "Retry-Mission",
      label: `${retry.endpoint.method} ${retry.endpoint.path}`,
      reason: retry.reason,
      mode: retry.mode,
      command: retry.command,
      args: retry.args,
    });
  }

  const uiFollowup = plan.uiMapFollowupMissions[0];
  if (uiFollowup) {
    recommendations.push({
      priority: "UI-Map-Followup",
      label: uiFollowup.target.label,
      reason: uiFollowup.reason,
      mode: "manual",
      command: uiFollowup.command,
      args: uiFollowup.args,
    });
  }

  const explorerFollowup = plan.explorerFollowupMissions[0];
  if (explorerFollowup) {
    recommendations.push({
      priority: "Explorer-Followup",
      label: path.basename(explorerFollowup.manifestFile),
      reason: explorerFollowup.reason,
      mode: "manual",
      command: explorerFollowup.command,
      args: explorerFollowup.args,
    });
  }

  const endpoint = plan.endpointMissions[0];
  if (endpoint) {
    recommendations.push({
      priority: "Endpoint-Mission",
      label: `${endpoint.endpoint.method} ${endpoint.endpoint.path}`,
      reason: endpoint.reason,
      mode: endpoint.mode,
      command: endpoint.command,
      args: endpoint.args,
    });
  }

  const relationship = plan.relationshipMissions[0];
  if (relationship) {
    recommendations.push({
      priority: "Relationship-Mission",
      label: relationship.transition,
      reason: relationship.reason,
      mode: "manual",
      command: relationship.command,
      args: relationship.args,
    });
  }

  const backlog = plan.domainBacklog[0];
  if (backlog) {
    recommendations.push({
      priority: "Domain-Backlog",
      label: backlog.area,
      reason: backlog.reason,
      mode: "manual",
      command: backlog.command,
      args: backlog.args,
    });
  }

  return recommendations;
}

function selectNextAutoStep(plan: RecordingCampaignPlan): RecordingCampaignStep | null {
  const autoSteps = plan.steps.filter((step) => step.mode === "auto");
  if (autoSteps.length === 0) return null;

  const ineffectivePaths = ineffectiveAutoStartPaths(plan.explorerFollowupMissions);
  return autoSteps.find((step) => !ineffectivePaths.has(startPathOfStep(step))) || null;
}

function ineffectiveAutoStartPaths(missions: RecordingExplorerFollowupMission[]): Set<string> {
  const paths = new Set<string>();
  for (const mission of missions) {
    if (!isIneffectiveAutoMission(mission)) continue;
    const pathName = mission.startPath || pathnameFromUrl(mission.finalUrl) || pathnameFromUrl(mission.startUrl);
    if (pathName) paths.add(pathName);
  }
  return paths;
}

function isIneffectiveAutoMission(mission: RecordingExplorerFollowupMission): boolean {
  const openTargets = effectiveOpenTargetCount(mission);
  if (mission.clickedTargets === 0 && openTargets === 0) return true;
  return mission.clickedTargets > 0
    && openTargets === 0
    && missionStayedInStartScope(mission)
    && successfulExplorerStopReasons.has(mission.stopReason)
    && (mission.expectedEndpointCount || 0) > 0
    && (mission.expectedObservedCount || 0) === 0;
}

function missionStayedInStartScope(mission: RecordingExplorerFollowupMission): boolean {
  if (!mission.startPath) return true;
  const scopePath = moduleScopePath(mission.startPath);
  const finalPath = pathnameFromUrl(mission.finalUrl);
  if (!scopePath || !finalPath) return true;
  return pathIsInScope(finalPath, scopePath);
}

function effectiveOpenTargetCount(mission: RecordingExplorerFollowupMission): number {
  if (!mission.startPath || mission.topOpenTargets.length === 0) return mission.openTargets;
  const scopePath = moduleScopePath(mission.startPath);
  if (!scopePath) return mission.openTargets;
  return mission.topOpenTargets.filter((target) => !target.path || pathIsInScope(target.path, scopePath)).length;
}

function pathIsInScope(pathName: string, scopePath: string): boolean {
  return pathName === scopePath || pathName.startsWith(`${scopePath}/`);
}

function startPathOfStep(step: RecordingCampaignStep): string {
  return valueAfter(step.args, "--start-path") || "";
}

function pathnameFromUrl(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return "";
  }
}

function nextRecordingFile(outputFile: string): string {
  return path.join(path.dirname(outputFile), `${path.basename(outputFile, path.extname(outputFile))}-next.json`);
}

function nextAutoRecordingFile(outputFile: string): string {
  return path.join(path.dirname(outputFile), `${path.basename(outputFile, path.extname(outputFile))}-next-auto.json`);
}

function buildDomainBacklog(
  knowledgeReport: OmniaKnowledgeReport | undefined,
  plannedAreas: Set<string>,
  options: RecordingCommandTargetOptions = {},
): RecordingDomainBacklogItem[] {
  if (!knowledgeReport) return [];

  return knowledgeReport.domains
    .filter((domain) => domain.coverage.missingKnownEndpoints > 0)
    .filter((domain) => !plannedAreas.has(domain.area))
    .map((domain) => {
      const args = domainBacklogArgs(domain, options);
      return {
        area: domain.area,
        knownEndpoints: domain.coverage.knownEndpoints,
        observedKnownEndpoints: domain.coverage.observedKnownEndpoints,
        missingKnownEndpoints: domain.coverage.missingKnownEndpoints,
        coveragePercent: domain.coverage.coveragePercent,
        reason: domainBacklogReason(domain),
        command: formatNodeCommand(args),
        args,
        examples: domain.coverage.missingExamples,
      };
    })
    .sort((a, b) => b.missingKnownEndpoints - a.missingKnownEndpoints || a.coveragePercent - b.coveragePercent || a.area.localeCompare(b.area))
    .slice(0, 12);
}

function buildRelationshipMissions(
  relationships: OmniaRelationshipMap | undefined,
  knowledgeReport: OmniaKnowledgeReport | undefined,
  options: RecordingCommandTargetOptions = {},
): RecordingRelationshipMission[] {
  if (!relationships || !knowledgeReport) return [];

  const domainsByArea = new Map(knowledgeReport.domains.map((domain) => [domain.area, domain]));
  return relationships.transitions
    .map((transition) => {
      const fromDomain = domainsByArea.get(transition.fromArea);
      const toDomain = domainsByArea.get(transition.toArea);
      const missing = [
        ...(fromDomain?.coverage.missingExamples || []),
        ...(toDomain?.coverage.missingExamples || []),
      ];
      const missingKnownEndpoints = (fromDomain?.coverage.missingKnownEndpoints || 0) + (toDomain?.coverage.missingKnownEndpoints || 0);
      if (missingKnownEndpoints <= 0) return null;
      const args = relationshipMissionArgs(transition.fromArea, transition.toArea, options);
      return {
        transition: `${transition.fromArea} -> ${transition.toArea}`,
        fromArea: transition.fromArea,
        toArea: transition.toArea,
        transitionCount: transition.count,
        missingKnownEndpoints,
        reason: `${transition.count} beobachtete Uebergang(e), aber ${missingKnownEndpoints} bekannte Endpunkte in den beteiligten Bereichen fehlen noch.`,
        command: formatNodeCommand(args),
        args,
        examples: missing.slice(0, 8),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.transitionCount - a.transitionCount || b.missingKnownEndpoints - a.missingKnownEndpoints || a.transition.localeCompare(b.transition))
    .slice(0, 8) as RecordingRelationshipMission[];
}

function buildRetryMissions(
  misses: RecordingExpectedEndpointMiss[],
  missingEndpoints: KnownEndpoint[],
  options: RecordingCommandTargetOptions = {},
): RecordingRetryMission[] {
  const stillMissing = new Set(missingEndpoints.map(endpointKey));
  const grouped = new Map<string, { endpoint: KnownEndpoint; summaryFiles: Set<string>; attempts: number }>();

  for (const miss of misses) {
    const key = endpointKey(miss.endpoint);
    if (!stillMissing.has(key)) continue;
    if (!endpointMissionIntent(miss.endpoint)) continue;
    const group = grouped.get(key) || { endpoint: miss.endpoint, summaryFiles: new Set<string>(), attempts: 0 };
    group.summaryFiles.add(miss.summaryFile);
    group.attempts += 1;
    grouped.set(key, group);
  }

  return [...grouped.values()]
    .map((group) => {
      const intent = endpointMissionIntent(group.endpoint);
      if (!intent) return null;
      const area = classifyEndpointArea(group.endpoint.path);
      const args = endpointMissionArgs(area, group.endpoint, intent, options);
      return {
        area,
        intent,
        endpoint: group.endpoint,
        mode: "manual" as const,
        reason: "Ein vorheriges Workflow-Manifest oder eine Workflow-Summary meldete den erwarteten Endpoint als fehlt; aktuelles Coverage-Inventar sieht ihn weiterhin nicht.",
        command: formatNodeCommand(args),
        args,
        attempts: group.attempts,
        summaryFiles: [...group.summaryFiles].sort(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.attempts - a.attempts || compareEndpointMissions(a, b))
    .slice(0, 12) as RecordingRetryMission[];
}

function buildEndpointMissions(
  missing: KnownEndpoint[],
  excludedKeys = new Set<string>(),
  options: RecordingCommandTargetOptions = {},
): RecordingEndpointMission[] {
  return missing
    .filter((endpoint) => !excludedKeys.has(endpointKey(endpoint)))
    .map((endpoint) => {
      const intent = endpointMissionIntent(endpoint);
      if (!intent) return null;
      const area = classifyEndpointArea(endpoint.path);
      const args = endpointMissionArgs(area, endpoint, intent, options);
      return {
        area,
        intent,
        endpoint,
        mode: "manual" as const,
        reason: endpointMissionReason(endpoint, intent),
        command: formatNodeCommand(args),
        args,
      };
    })
    .filter(Boolean)
    .sort(compareEndpointMissions)
    .slice(0, 18) as RecordingEndpointMission[];
}

function qualityRerunStep(mission: RecordingQualityRerunMission, index: number): RecordingCampaignStep {
  return {
    index,
    area: "Recording-Qualitaet",
    reason: mission.reason,
    label: `Quality-Rerun ${path.basename(mission.logFile)}`,
    mode: "manual",
    command: mission.command,
    args: mission.args,
    examples: [],
  };
}

export function parseExpectedEndpointMissesFromMarkdown(markdown: string, summaryFile: string): RecordingExpectedEndpointMiss[] {
  const misses: RecordingExpectedEndpointMiss[] = [];
  const rowRe = /^\|\s*([A-Z]+)\s+`([^`]+)`\s*\|\s*fehlt\s*\|/gm;
  for (const match of markdown.matchAll(rowRe)) {
    misses.push({
      endpoint: {
        method: match[1],
        path: match[2],
        source: "expected-endpoint-miss",
      },
      summaryFile,
    });
  }
  return misses;
}

export function parseExpectedEndpointMissesFromManifest(manifest: unknown, manifestFile: string): RecordingExpectedEndpointMiss[] {
  if (!isWorkflowManifestLike(manifest)) return [];
  return manifest.expectedEndpoints
    .filter((endpoint) => endpoint.observed !== true)
    .map((endpoint) => {
      const method = typeof endpoint.method === "string" ? endpoint.method.toUpperCase() : "";
      const endpointPath = typeof endpoint.path === "string" ? endpoint.path : "";
      if (!method || !endpointPath.startsWith("/")) return null;
      return {
        endpoint: {
          method,
          path: endpointPath,
          source: "expected-endpoint-miss",
        },
        summaryFile: manifestFile,
      };
    })
    .filter(Boolean) as RecordingExpectedEndpointMiss[];
}

export function parseExplorerFollowupFromManifest(
  manifest: unknown,
  manifestFile: string,
  options: RecordingCommandTargetOptions = {},
): RecordingExplorerFollowupMission | null {
  if (!isWorkflowManifestLike(manifest)) return null;
  if (manifest.mode !== "auto") return null;
  const explorer = readExplorerStats(manifest.explorer);
  const expectedEndpointCount = manifest.expectedEndpoints.length;
  const expectedObservedCount = manifest.expectedEndpoints.filter((endpoint) => endpoint.observed === true).length;
  if (!explorer || !needsExplorerFollowup(explorer, { expectedEndpointCount, expectedObservedCount })) return null;

  const args = explorerFollowupArgs(options);
  const artifacts = manifest.artifacts && typeof manifest.artifacts === "object" ? manifest.artifacts : {};
  const preflightJsonFile = artifactString(artifacts, "preflightJsonFile");
  return {
    manifestFile,
    logFile: artifactString(artifacts, "logFile"),
    summaryFile: artifactString(artifacts, "summaryFile"),
    explorerReportFile: artifactString(artifacts, "explorerReportFile"),
    startPath: startPathFromPreflightJsonFile(preflightJsonFile),
    startUrl: explorer.startUrl,
    finalUrl: explorer.finalUrl,
    stopReason: explorer.stopReason,
    clickedTargets: explorer.clickedTargets,
    skippedTargets: explorer.skippedTargets,
    blockedRequests: explorer.blockedRequests,
    discoveredTargets: explorer.discoveredTargets,
    openTargets: explorer.openTargets,
    expectedEndpointCount,
    expectedObservedCount,
    topOpenTargets: explorer.topOpenTargets,
    reason: explorerFollowupReason(explorer, { expectedEndpointCount, expectedObservedCount }),
    command: formatNodeCommand(args),
    args,
  };
}

function loadExpectedEndpointMisses(recordingsDir: string): RecordingExpectedEndpointMiss[] {
  const manifestFiles = listWorkflowManifestFiles(recordingsDir);
  const manifestMisses = manifestFiles.flatMap((fullPath) => parseExpectedEndpointMissesFromManifest(readJsonFile(fullPath), fullPath));
  const manifestBaseNames = new Set(manifestFiles.map((file) => path.basename(file).replace(/-manifest\.json$/, "")));
  if (!fs.existsSync(recordingsDir)) return manifestMisses;
  const markdownMisses = fs
    .readdirSync(recordingsDir)
    .filter((file) => file.endsWith(".md") && file.includes("workflow-summary"))
    .filter((file) => !manifestBaseNames.has(file.replace(/-summary\.md$/, "")))
    .flatMap((file) => {
      const fullPath = path.join(recordingsDir, file);
      return parseExpectedEndpointMissesFromMarkdown(fs.readFileSync(fullPath, "utf8"), fullPath);
    });
  return [...manifestMisses, ...markdownMisses];
}

function loadExplorerFollowupMissions(
  recordingsDir: string,
  options: RecordingCommandTargetOptions = {},
): RecordingExplorerFollowupMission[] {
  return listWorkflowManifestFiles(recordingsDir)
    .map((fullPath) => parseExplorerFollowupFromManifest(readJsonFile(fullPath), fullPath, options))
    .filter(Boolean) as RecordingExplorerFollowupMission[];
}

function loadUiMapFollowupMissions(logFiles: string[], options: RecordingCommandTargetOptions = {}): OmniaUiFollowupCommand[] {
  if (logFiles.length === 0) return [];
  return buildOmniaUiMap(logFiles.map((logFile) => ({
    logFile,
    records: readJsonLines(logFile),
    manifestFile: workflowManifestFileForLog(logFile),
    manifest: readJsonFile(workflowManifestFileForLog(logFile)),
  })), options).followupCommands;
}

function loadQualityRerunMissions(logFiles: string[], options: RecordingCommandTargetOptions = {}): RecordingQualityRerunMission[] {
  return logFiles
    .map((logFile) => qualityRerunMissionForLog(logFile, readJsonLines(logFile), options))
    .filter(Boolean) as RecordingQualityRerunMission[];
}

function qualityRerunMissionForLog(
  logFile: string,
  records: Record<string, unknown>[],
  options: RecordingCommandTargetOptions = {},
): RecordingQualityRerunMission | null {
  const quality = evaluateNetworkLogQuality(records);
  if (quality.findings.length === 0) return null;
  const findings = quality.findings.map((finding) => finding.pattern);
  const args = qualityRerunArgs(logFile, findings, options);
  return {
    logFile,
    findings,
    apiResponses: quality.apiResponseCount,
    timelineMarkers: quality.timelineMarkerCount,
    uiSnapshots: quality.uiSnapshotCount,
    reason: `Recording-Qualitaet schwach: ${findings.join(", ")}.`,
    command: formatNodeCommand(args),
    args,
  };
}

function listWorkflowManifestFiles(recordingsDir: string): string[] {
  if (!fs.existsSync(recordingsDir)) return [];
  return fs
    .readdirSync(recordingsDir)
    .filter((file) => file.endsWith(".json") && file.includes("workflow-manifest"))
    .map((file) => path.join(recordingsDir, file))
    .sort();
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

function readExplorerStats(value: unknown): RecordingExplorerStats | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const startUrl = stringValue(candidate.startUrl);
  const finalUrl = stringValue(candidate.finalUrl);
  const stopReason = stringValue(candidate.stopReason);
  const clickedTargets = numberValue(candidate.clickedTargets);
  const skippedTargets = numberValue(candidate.skippedTargets);
  const blockedRequests = numberValue(candidate.blockedRequests);
  const discoveredTargets = numberValue(candidate.discoveredTargets) ?? 0;
  const openTargets = numberValue(candidate.openTargets) ?? 0;
  if (!startUrl || !finalUrl || !stopReason) return null;
  if (clickedTargets === null || skippedTargets === null || blockedRequests === null) return null;
  return {
    startUrl,
    finalUrl,
    stopReason,
    clickedTargets,
    skippedTargets,
    blockedRequests,
    discoveredTargets,
    openTargets,
    topOpenTargets: readOpenTargets(candidate.topOpenTargets),
  };
}

function needsExplorerFollowup(
  explorer: RecordingExplorerStats,
  expected: { expectedEndpointCount: number; expectedObservedCount: number } = {
    expectedEndpointCount: 0,
    expectedObservedCount: 0,
  },
): boolean {
  return explorer.blockedRequests > 0
    || explorer.openTargets > 0
    || explorer.clickedTargets === 0
    || !successfulExplorerStopReasons.has(explorer.stopReason)
    || exhaustedExpectedEndpoints(explorer, expected);
}

function explorerFollowupReason(
  explorer: RecordingExplorerStats,
  expected: { expectedEndpointCount: number; expectedObservedCount: number } = {
    expectedEndpointCount: 0,
    expectedObservedCount: 0,
  },
): string {
  const reasons: string[] = [];
  if (explorer.blockedRequests > 0) reasons.push(`${explorer.blockedRequests} blockierte Request(s)`);
  if (explorer.openTargets > 0) reasons.push(`${explorer.openTargets} offene UI-Ziel(e)`);
  if (explorer.clickedTargets === 0) reasons.push("kein geklicktes Ziel");
  if (!successfulExplorerStopReasons.has(explorer.stopReason)) reasons.push(`Stop-Grund ${explorer.stopReason}`);
  if (exhaustedExpectedEndpoints(explorer, expected)) {
    reasons.push(`${expected.expectedEndpointCount} erwartete Endpunkt(e) nicht erreicht`);
  }
  return `Auto-Explorer braucht manuelle Nacharbeit: ${reasons.join(", ")}.`;
}

function exhaustedExpectedEndpoints(
  explorer: RecordingExplorerStats,
  expected: { expectedEndpointCount: number; expectedObservedCount: number },
): boolean {
  return expected.expectedEndpointCount > 0
    && expected.expectedObservedCount === 0
    && explorer.clickedTargets > 0
    && explorer.openTargets === 0
    && successfulExplorerStopReasons.has(explorer.stopReason);
}

function explorerFollowupArgs(options: RecordingCommandTargetOptions = {}): string[] {
  return [
    ...recordingWorkflowBaseArgs("manual", options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--steps",
    [
      "Auto-Explorer-Lauf manuell nachfahren",
      "Blockierte oder uebersprungene Ziele kontrolliert oeffnen",
      "API-Responses und Downloads gegen API-/UI-Timeline pruefen",
      "Abbruchgrund und fehlende Endpunkte dokumentieren",
    ].join(","),
  ];
}

function compareExplorerFollowupMissions(a: RecordingExplorerFollowupMission, b: RecordingExplorerFollowupMission): number {
  return (
    b.blockedRequests - a.blockedRequests ||
    a.clickedTargets - b.clickedTargets ||
    a.stopReason.localeCompare(b.stopReason) ||
    a.manifestFile.localeCompare(b.manifestFile)
  );
}

function compareUiMapFollowupMissions(a: OmniaUiFollowupCommand, b: OmniaUiFollowupCommand): number {
  return (
    b.target.openCount - a.target.openCount ||
    b.target.seenCount - a.target.seenCount ||
    b.target.clickedCount - a.target.clickedCount ||
    a.target.label.localeCompare(b.target.label, "de") ||
    a.target.path.localeCompare(b.target.path)
  );
}

function compareQualityRerunMissions(a: RecordingQualityRerunMission, b: RecordingQualityRerunMission): number {
  return (
    qualityFindingRank(b.findings) - qualityFindingRank(a.findings) ||
    a.apiResponses - b.apiResponses ||
    a.timelineMarkers - b.timelineMarkers ||
    (a.uiSnapshots ?? 0) - (b.uiSnapshots ?? 0) ||
    a.logFile.localeCompare(b.logFile)
  );
}

function qualityFindingRank(findings: string[]): number {
  let rank = 0;
  if (findings.includes("empty-network-log")) rank += 4;
  if (findings.includes("no-api-response")) rank += 3;
  if (findings.includes("no-timeline-marker")) rank += 2;
  if (findings.includes("no-ui-snapshot")) rank += 1;
  return rank;
}

function qualityRerunArgs(
  logFile: string,
  findings: string[],
  options: RecordingCommandTargetOptions = {},
): string[] {
  return [
    ...recordingWorkflowBaseArgs("manual", options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--steps",
    [
      `Aufnahme ${path.basename(logFile)} nachfahren`,
      qualityRerunFocusStep(findings),
      "Flow-Schrittmarker setzen und API-/UI-Timeline pruefen",
      "Recording-Audit nach dem Lauf kontrollieren",
    ].join(","),
  ];
}

function qualityRerunFocusStep(findings: string[]): string {
  if (findings.includes("no-api-response")) return "Zielbereich erneut oeffnen und API-Responses ausloesen";
  if (findings.includes("no-timeline-marker")) return "Fachaktion mit eindeutigen Schrittmarkern wiederholen";
  if (findings.includes("no-ui-snapshot")) return "Zielbereich erneut oeffnen und UI-Struktur-Snapshots erzeugen";
  return "Aufnahme mit verwertbarem UI- und API-Kontext wiederholen";
}

function workflowManifestFileForLog(logFile: string): string {
  const baseName = path.basename(logFile, ".jsonl");
  return path.join(workspaceRoot, "docs", "recordings", `${baseName}-manifest.json`);
}

function artifactString(artifacts: object, key: string): string | undefined {
  const value = (artifacts as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
}

function startPathFromPreflightJsonFile(file: string | undefined): string | undefined {
  if (!file) return undefined;
  const preflight = readJsonFile(file);
  if (!preflight || typeof preflight !== "object") return undefined;
  const runArgs = (preflight as Record<string, unknown>).runArgs;
  if (!Array.isArray(runArgs) || !runArgs.every((arg) => typeof arg === "string")) return undefined;
  return valueAfter(runArgs, "--start-path") || undefined;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readOpenTargets(value: unknown): RecordingExplorerOpenTarget[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((target) => {
      if (!target || typeof target !== "object") return null;
      const candidate = target as Record<string, unknown>;
      const label = typeof candidate.label === "string" ? candidate.label : "";
      if (!label) return null;
      return {
        kind: typeof candidate.kind === "string" ? candidate.kind : "",
        label,
        path: typeof candidate.path === "string" ? candidate.path : "",
        seenCount: numberValue(candidate.seenCount) ?? 0,
      };
    })
    .filter(Boolean) as RecordingExplorerOpenTarget[];
}

function endpointMissionIntent(endpoint: KnownEndpoint): RecordingEndpointMissionIntent | null {
  const method = endpoint.method.toUpperCase();
  const lowerPath = endpoint.path.toLowerCase();
  if (method === "DELETE" || method === "PUT" || method === "PATCH") return null;
  if (lowerPath.includes("export") || lowerPath.endsWith("/csv") || lowerPath.includes("/csv/")) return "export";
  if ((method === "GET" || method === "POST") && /(?:^|\/)search(?:\/|$)/.test(lowerPath)) return "search";
  if (method === "GET" && /\{[^}]+\}/.test(endpoint.path)) return "detail";
  if (method === "GET") return "list";
  return null;
}

function endpointMissionReason(endpoint: KnownEndpoint, intent: RecordingEndpointMissionIntent): string {
  const labels: Record<RecordingEndpointMissionIntent, string> = {
    export: "Export-/Download-Endpunkt gezielt ausloesen und Body/Download-Metadaten abgleichen.",
    search: "Such- oder Listen-Endpunkt mit Filterkontext aufnehmen.",
    detail: "Detail-Endpunkt mit eindeutigem Testobjekt oeffnen und Read-back pruefen.",
    list: "Listen-Endpunkt ueber die passende Uebersicht aufnehmen.",
  };
  return `${labels[intent]} Fehlend: ${endpoint.method} ${endpoint.path}.`;
}

function endpointMissionArgs(
  area: string,
  endpoint: KnownEndpoint,
  intent: RecordingEndpointMissionIntent,
  options: RecordingCommandTargetOptions = {},
): string[] {
  return [
    ...recordingWorkflowBaseArgs("manual", options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--steps",
    endpointMissionSteps(area, endpoint, intent).join(","),
    "--expect-endpoint",
    `${endpoint.method} ${endpoint.path}`,
  ];
}

function endpointMissionSteps(
  area: string,
  endpoint: KnownEndpoint,
  intent: RecordingEndpointMissionIntent,
): string[] {
  const target = `${endpoint.method} ${endpoint.path}`;
  if (intent === "export") {
    return [
      `${area} Exportkontext fuer ${target} oeffnen`,
      `Export ausloesen fuer ${target}`,
      "API-Response und Download-Metadaten pruefen",
      "Exportdaten ohne Klarwerte pruefen",
    ];
  }
  if (intent === "search") {
    return [
      `${area} Suchkontext fuer ${target} oeffnen`,
      `Suche oder Filter fuer ${target} ausloesen`,
      "Trefferliste und Paging lesen",
      "Read-back ohne Klarwerte pruefen",
    ];
  }
  if (intent === "detail") {
    return [
      `${area} Testobjekt fuer ${target} eindeutig waehlen`,
      `Detailansicht fuer ${target} oeffnen`,
      "Detailfelder und abhaengige Requests lesen",
      "Read-back ohne Klarwerte pruefen",
    ];
  }
  return [
    `${area} Uebersicht fuer ${target} oeffnen`,
    `Liste fuer ${target} laden`,
    "Paging oder Sortierung lesen",
    "Read-back ohne Klarwerte pruefen",
  ];
}

function compareEndpointMissions(a: RecordingEndpointMission, b: RecordingEndpointMission): number {
  return (
    endpointIntentRank(a.intent) - endpointIntentRank(b.intent) ||
    a.area.localeCompare(b.area) ||
    a.endpoint.path.localeCompare(b.endpoint.path) ||
    a.endpoint.method.localeCompare(b.endpoint.method)
  );
}

function endpointIntentRank(intent: RecordingEndpointMissionIntent): number {
  const ranks: Record<RecordingEndpointMissionIntent, number> = {
    export: 0,
    search: 1,
    detail: 2,
    list: 3,
  };
  return ranks[intent];
}

function relationshipMissionArgs(
  fromArea: string,
  toArea: string,
  options: RecordingCommandTargetOptions = {},
): string[] {
  return [
    ...recordingWorkflowBaseArgs("manual", options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--steps",
    [
      `${fromArea} Ausgangskontext oeffnen`,
      `Uebergang zu ${toArea} ausloesen`,
      `${toArea} Folgeansicht lesen`,
      "Read-back oder Export nur vorbereitet pruefen",
    ].join(","),
  ];
}

function domainBacklogReason(domain: KnowledgeDomain): string {
  if (domain.responseCount === 0) {
    return `${domain.coverage.missingKnownEndpoints} bekannte Endpunkte, aber noch kein API-Traffic beobachtet.`;
  }
  return `${domain.coverage.missingKnownEndpoints} bekannte Endpunkte fehlen trotz ${domain.responseCount} beobachteter Response(s).`;
}

function domainBacklogArgs(domain: KnowledgeDomain, options: RecordingCommandTargetOptions = {}): string[] {
  return [
    ...recordingWorkflowBaseArgs("manual", options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--steps",
    domainBacklogSteps(domain).join(","),
  ];
}

function domainBacklogSteps(domain: KnowledgeDomain): string[] {
  return [
    `${domain.area} oeffnen`,
    "Liste oder Suche ausloesen",
    "Detailansicht eines Testobjekts oeffnen",
    "Export oder Fehlerfall nur vorbereitet pruefen",
  ];
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

function intArg(argv: string[], flag: string, fallback: number): number {
  const value = valueAfter(argv, flag);
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function endpointKey(endpoint: Pick<KnownEndpoint, "method" | "path">): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
