import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import { classifyEndpointArea } from "./coverage-report.ts";
import {
  recordingWorkflowBaseArgs,
  type RecordingCommandTargetOptions,
} from "./recording-command.ts";
import { redactUiLabel } from "./redact.ts";
import type { RecordingExplorerOpenTarget, RecordingWorkflowManifest } from "./recording-workflow.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "14_omnia_ui_map.md");

export type OmniaUiMapOptions = {
  outputFile: string;
  recordingUrl?: string;
  generatedAt?: Date;
};

export type OmniaUiMapInput = {
  logFile: string;
  records: Record<string, unknown>[];
  manifestFile?: string;
  manifest?: unknown;
};

export type OmniaUiTarget = {
  key: string;
  kind: string;
  label: string;
  path: string;
  clickedCount: number;
  openCount: number;
  seenCount: number;
  apiEndpointCount: number;
  apiAreas: string[];
  apiEndpoints: OmniaUiApiEndpoint[];
  sources: string[];
};

export type OmniaUiApiEndpoint = {
  method: string;
  path: string;
  area: string;
  count: number;
  statuses: number[];
};

export type OmniaUiFollowupCommand = {
  target: OmniaUiTarget;
  reason: string;
  command: string;
  args: string[];
};

export type OmniaUiSurface = {
  key: string;
  path: string;
  title: string;
  headings: string[];
  actions: string[];
  formLabels: string[];
  tableHeaders: string[];
  apiEndpointCount: number;
  apiAreas: string[];
  apiEndpoints: OmniaUiApiEndpoint[];
  steps: string[];
  sources: string[];
  sourceCount: number;
};

export type OmniaUiMap = {
  generatedAt: string;
  recordingCount: number;
  targetCount: number;
  surfaceCount: number;
  clickedTargetCount: number;
  openTargetCount: number;
  apiLinkedTargetCount: number;
  apiUnlinkedClickedTargetCount: number;
  apiEndpointCount: number;
  targets: OmniaUiTarget[];
  surfaces: OmniaUiSurface[];
  followupCommands: OmniaUiFollowupCommand[];
};

if (isMainModule()) {
  const options = parseOmniaUiMapArgs(process.argv.slice(2));
  const inputs = resolveInputFiles(process.argv.slice(2)).map((logFile) => ({
    logFile,
    records: readJsonLines(logFile),
    manifestFile: workflowManifestFileForLog(logFile),
    manifest: readJsonFile(workflowManifestFileForLog(logFile)),
  }));
  const report = buildOmniaUiMap(inputs, options);
  writeOmniaUiMap(report, options.outputFile);
  console.log(`Omnia-UI-Map: ${options.outputFile}`);
  console.log(`UI-Ziele: ${report.targetCount}`);
  console.log(`Offene UI-Ziele: ${report.openTargetCount}`);
}

export function parseOmniaUiMapArgs(argv: string[]): OmniaUiMapOptions {
  return {
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
    recordingUrl: valueAfter(argv, "--url") || undefined,
  };
}

export function buildOmniaUiMap(
  inputs: OmniaUiMapInput[],
  options: { generatedAt?: Date } & RecordingCommandTargetOptions = {},
): OmniaUiMap {
  const targetsByKey = new Map<string, OmniaUiTarget>();
  const surfacesByKey = new Map<string, OmniaUiSurface>();

  for (const input of inputs) {
    const targetKeyByStep = new Map<string, string>();
    const surfaceKeysByStep = new Map<string, Set<string>>();
    const apiEndpointsByStep = new Map<string, OmniaUiApiEndpoint[]>();
    for (const record of input.records) {
      const surface = surfaceFromRecord(record);
      if (surface) {
        const mergedSurface = mergeSurface(surfacesByKey, surface, input.logFile);
        const step = String(record.step || "").trim();
        if (step) {
          const keys = surfaceKeysByStep.get(step) || new Set<string>();
          keys.add(mergedSurface.key);
          surfaceKeysByStep.set(step, keys);
          for (const endpoint of apiEndpointsByStep.get(step) || []) mergeApiEndpoint(mergedSurface, endpoint);
        }
        continue;
      }

      const startedTarget = targetFromExploreMarker(record, "target-start");
      if (startedTarget) {
        const target = mergeTarget(targetsByKey, startedTarget, {
          clickedCount: 0,
          openCount: 0,
          seenCount: 1,
          source: input.logFile,
        });
        const step = String(record.step || "").trim();
        if (step) targetKeyByStep.set(step, target.key);
        continue;
      }

      const target = targetFromExploreMarker(record);
      if (target) {
        const alreadySeen = targetsByKey.has(targetKey(target));
        mergeTarget(targetsByKey, target, {
          clickedCount: 1,
          openCount: 0,
          seenCount: alreadySeen ? 0 : 1,
          source: input.logFile,
        });
        continue;
      }

      const step = String(record.step || "").trim();
      const apiEndpoint = endpointFromRecord(record);
      if (!apiEndpoint) continue;
      if (!apiEndpointsByStep.has(step)) apiEndpointsByStep.set(step, []);
      apiEndpointsByStep.get(step)?.push(apiEndpoint);
      const targetKeyForStep = step ? targetKeyByStep.get(step) : "";
      const existingTarget = targetKeyForStep ? targetsByKey.get(targetKeyForStep) : null;
      if (existingTarget) mergeApiEndpoint(existingTarget, apiEndpoint);
      for (const surfaceKey of surfaceKeysByStep.get(step) || []) {
        const existingSurface = surfacesByKey.get(surfaceKey);
        if (existingSurface) mergeApiEndpoint(existingSurface, apiEndpoint);
      }
    }

    const manifest = isWorkflowManifestLike(input.manifest) ? input.manifest : null;
    const openTargets = manifest?.explorer?.topOpenTargets || [];
    for (const target of openTargets) {
      mergeTarget(targetsByKey, {
        kind: target.kind,
        label: redactUiLabel(target.label),
        path: target.path,
      }, {
        clickedCount: 0,
        openCount: 1,
        seenCount: target.seenCount,
        source: input.manifestFile || input.logFile,
      });
    }
  }

  const targets = [...targetsByKey.values()].sort(compareTargets);
  const surfaces = [...surfacesByKey.values()].sort(compareSurfaces);
  const followupCommands = targets
    .map((target) => ({ target, reason: followupReason(target) }))
    .filter((item): item is { target: OmniaUiTarget; reason: string } => Boolean(item.reason))
    .slice(0, 20)
    .map(({ target, reason }) => {
      const args = followupArgs(target, reason, options);
      return {
        target,
        reason,
        command: formatNodeCommand(args),
        args,
      };
    });

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    recordingCount: inputs.length,
    targetCount: targets.length,
    surfaceCount: surfaces.length,
    clickedTargetCount: targets.filter((target) => target.clickedCount > 0).length,
    openTargetCount: targets.filter((target) => target.openCount > 0).length,
    apiLinkedTargetCount: targets.filter((target) => target.apiEndpointCount > 0).length,
    apiUnlinkedClickedTargetCount: targets.filter((target) => target.clickedCount > 0 && target.apiEndpointCount === 0).length,
    apiEndpointCount: new Set(targets.flatMap((target) => target.apiEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`))).size,
    targets,
    surfaces,
    followupCommands,
  };
}

export function buildOmniaUiMapMarkdown(report: OmniaUiMap): string {
  const lines = [
    "# Omnia-UI-Map",
    "",
    `Generiert: ${report.generatedAt}`,
    "",
    "Hinweis: Diese Karte nutzt redaktierte Explorer-Marker und Workflow-Manifeste. Sie beschreibt UI-Struktur und Nachfahrziele, keine Rohwerte.",
    "",
    "## Zusammenfassung",
    "",
    `- Recordings: ${report.recordingCount}`,
    `- UI-Ziele: ${report.targetCount}`,
    `- UI-Surfaces: ${report.surfaceCount}`,
    `- Geklickte UI-Ziele: ${report.clickedTargetCount}`,
    `- Offene UI-Ziele: ${report.openTargetCount}`,
    `- API-Verknuepfte UI-Ziele: ${report.apiLinkedTargetCount}`,
    `- Geklickte UI-Ziele ohne API-Link: ${report.apiUnlinkedClickedTargetCount}`,
    `- API-Endpunkte hinter UI-Zielen: ${report.apiEndpointCount}`,
    "",
    "## UI-Ziele",
    "",
  ];

  if (report.targets.length === 0) {
    lines.push("- Keine UI-Ziele aus Explorer-Markern oder Workflow-Manifesten ableitbar.", "");
  } else {
    lines.push("| Status | Typ | Label | Pfad | Geklickt | Offen | Sichtungen | API-Bereiche | API-Endpunkte | Quellen |");
    lines.push("|---|---|---|---|---:|---:|---:|---|---:|---|");
    for (const target of report.targets.slice(0, 200)) {
      lines.push(`| ${target.openCount > 0 ? "offen" : "geklickt"} | ${escapeTable(target.kind)} | ${escapeTable(target.label)} | \`${escapeTable(target.path || "-")}\` | ${target.clickedCount} | ${target.openCount} | ${target.seenCount} | ${target.apiAreas.map(escapeTable).join(", ") || "-"} | ${target.apiEndpointCount} | ${target.sources.map(escapeTable).join(", ")} |`);
    }
    if (report.targets.length > 200) {
      lines.push(`| ... | ... | ... | ... | ... | ... | ... | ${report.targets.length - 200} weitere ausgeblendet |`);
    }
    lines.push("");
  }

  lines.push("## UI-Surfaces", "");
  if (report.surfaces.length === 0) {
    lines.push("- Keine UI-Struktur-Snapshots aus Recording-Logs ableitbar.", "");
  } else {
    lines.push("| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe | Schritte | Quellen |");
    lines.push("|---|---|---|---|---|---|---|---:|");
    for (const surface of report.surfaces.slice(0, 120)) {
      lines.push(`| \`${escapeTable(surface.path || "-")}\` | ${escapeTable(surface.title || "-")} | ${joinSurfaceItems(surface.headings)} | ${joinSurfaceItems(surface.actions)} | ${joinSurfaceItems(surface.formLabels)} | ${joinSurfaceItems(surface.tableHeaders)} | ${joinSurfaceItems(surface.steps)} | ${surface.sourceCount} |`);
    }
    if (report.surfaces.length > 120) {
      lines.push(`| ... | ... | ... | ... | ... | ... | ... | ${report.surfaces.length - 120} weitere ausgeblendet |`);
    }
    lines.push("");
  }

  lines.push("## API-Verknuepfte UI-Ziele", "");
  const apiLinkedTargets = report.targets.filter((target) => target.apiEndpointCount > 0);
  if (apiLinkedTargets.length === 0) {
    lines.push("- Keine API-Responses eindeutig einem UI-Ziel zugeordnet.", "");
  } else {
    for (const target of apiLinkedTargets.slice(0, 50)) {
      lines.push(`### ${target.label}`, "");
      lines.push(`- Ziel: ${target.kind} \`${target.path || "-"}\``);
      lines.push(`- API-Bereiche: ${target.apiAreas.map(escapeTable).join(", ") || "-"}`);
      lines.push("- Endpunkte:");
      for (const endpoint of target.apiEndpoints.slice(0, 12)) {
        lines.push(`  - ${endpoint.area}: ${endpoint.method} \`${endpoint.path}\` (${endpoint.count}x, Status ${endpoint.statuses.join(", ") || "-"})`);
      }
      if (target.apiEndpoints.length > 12) lines.push(`  - ... ${target.apiEndpoints.length - 12} weitere`);
      lines.push("");
    }
  }

  lines.push("## API-Verknuepfte UI-Surfaces", "");
  const apiLinkedSurfaces = report.surfaces.filter((surface) => surface.apiEndpointCount > 0);
  if (apiLinkedSurfaces.length === 0) {
    lines.push("- Keine API-Responses eindeutig einer UI-Surface zugeordnet.", "");
  } else {
    for (const surface of apiLinkedSurfaces.slice(0, 50)) {
      lines.push(`### ${surface.title || surface.path}`, "");
      lines.push(`- UI: \`${surface.path || "-"}\``);
      lines.push(`- Schritte: ${joinSurfaceItems(surface.steps)}`);
      lines.push(`- API-Bereiche: ${surface.apiAreas.map(escapeTable).join(", ") || "-"}`);
      lines.push("- Endpunkte:");
      for (const endpoint of surface.apiEndpoints.slice(0, 12)) {
        lines.push(`  - ${endpoint.area}: ${endpoint.method} \`${endpoint.path}\` (${endpoint.count}x, Status ${endpoint.statuses.join(", ") || "-"})`);
      }
      if (surface.apiEndpoints.length > 12) lines.push(`  - ... ${surface.apiEndpoints.length - 12} weitere`);
      lines.push("");
    }
  }

  lines.push("## Nachfahr-Kommandos", "");
  if (report.followupCommands.length === 0) {
    lines.push("- Keine offenen oder API-unverknuepften UI-Ziele fuer manuelle Nachfahrten.", "");
  } else {
    for (const item of report.followupCommands) {
      lines.push(`### ${item.target.label}`, "");
      lines.push(`- Ziel: ${item.target.kind} \`${item.target.path || "-"}\``);
      lines.push(`- Grund: ${item.reason}`);
      lines.push(`- Sichtungen: ${item.target.seenCount}`);
      lines.push("```bash");
      lines.push(item.command);
      lines.push("```");
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

export function writeOmniaUiMap(report: OmniaUiMap, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildOmniaUiMapMarkdown(report));
  return outputFile;
}

function targetFromExploreMarker(record: Record<string, unknown>, marker = "target-end"): Pick<OmniaUiTarget, "kind" | "label" | "path"> | null {
  if (record.type !== "explore-marker" || record.marker !== marker) return null;
  const target = record.target;
  if (!target || typeof target !== "object") return null;
  const candidate = target as Record<string, unknown>;
  const label = typeof candidate.label === "string" ? redactUiLabel(candidate.label) : "";
  if (!label) return null;
  return {
    kind: typeof candidate.kind === "string" ? candidate.kind : "",
    label,
    path: typeof candidate.path === "string" ? candidate.path : "",
  };
}

function mergeTarget(
  targetsByKey: Map<string, OmniaUiTarget>,
  target: Pick<OmniaUiTarget, "kind" | "label" | "path">,
  counts: { clickedCount: number; openCount: number; seenCount: number; source: string },
): OmniaUiTarget {
  const key = targetKey(target);
  const existing = targetsByKey.get(key) || {
    key,
    kind: target.kind,
    label: target.label,
    path: target.path,
    clickedCount: 0,
    openCount: 0,
    seenCount: 0,
    apiEndpointCount: 0,
    apiAreas: [],
    apiEndpoints: [],
    sources: [],
  };
  existing.clickedCount += counts.clickedCount;
  existing.openCount += counts.openCount;
  existing.seenCount += counts.seenCount;
  if (counts.source && !existing.sources.includes(counts.source)) existing.sources.push(counts.source);
  targetsByKey.set(key, existing);
  return existing;
}

function endpointFromRecord(record: Record<string, unknown>): OmniaUiApiEndpoint | null {
  if (record.type !== "response" || !isApiTrafficRecord(record)) return null;
  const method = String(record.method || "").toUpperCase();
  if (!method) return null;
  const url = parseUrl(String(record.url || ""));
  const endpointPath = normalizeObservedPath(url.pathname || "/");
  return {
    method,
    path: endpointPath,
    area: classifyEndpointArea(endpointPath),
    count: 1,
    statuses: normalizeStatus(record.status) > 0 ? [normalizeStatus(record.status)] : [],
  };
}

function mergeApiEndpoint(target: Pick<OmniaUiTarget, "apiEndpointCount" | "apiAreas" | "apiEndpoints">, endpoint: OmniaUiApiEndpoint): void {
  const existing = target.apiEndpoints.find((item) => item.method === endpoint.method && item.path === endpoint.path);
  if (existing) {
    existing.count += 1;
    existing.statuses = [...new Set([...existing.statuses, ...endpoint.statuses])].sort((a, b) => a - b);
  } else {
    target.apiEndpoints.push(endpoint);
  }
  target.apiEndpoints.sort((a, b) => a.area.localeCompare(b.area) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  target.apiEndpointCount = target.apiEndpoints.length;
  target.apiAreas = [...new Set(target.apiEndpoints.map((item) => item.area))].sort();
}

function surfaceFromRecord(
  record: Record<string, unknown>,
): Omit<OmniaUiSurface, "key" | "sources" | "sourceCount" | "apiEndpointCount" | "apiAreas" | "apiEndpoints"> | null {
  if (record.type !== "ui-snapshot") return null;
  const pathName = stringField(record, "path") || pathFromUrl(stringField(record, "url"));
  if (!pathName) return null;
  return {
    path: pathName,
    title: stringField(record, "title"),
    headings: stringList(record.headings),
    actions: stringList(record.actions),
    formLabels: stringList(record.formLabels),
    tableHeaders: stringList(record.tableHeaders),
    steps: stringField(record, "step") ? [stringField(record, "step")] : [],
  };
}

function mergeSurface(
  surfacesByKey: Map<string, OmniaUiSurface>,
  surface: Omit<OmniaUiSurface, "key" | "sources" | "sourceCount" | "apiEndpointCount" | "apiAreas" | "apiEndpoints">,
  source: string,
): OmniaUiSurface {
  const key = surface.path;
  const existing = surfacesByKey.get(key) || {
    key,
    path: surface.path,
    title: "",
    headings: [],
    actions: [],
    formLabels: [],
    tableHeaders: [],
    apiEndpointCount: 0,
    apiAreas: [],
    apiEndpoints: [],
    steps: [],
    sources: [],
    sourceCount: 0,
  };

  if (!existing.title && surface.title) existing.title = surface.title;
  existing.headings = mergeStrings(existing.headings, surface.headings);
  existing.actions = mergeStrings(existing.actions, surface.actions);
  existing.formLabels = mergeStrings(existing.formLabels, surface.formLabels);
  existing.tableHeaders = mergeStrings(existing.tableHeaders, surface.tableHeaders);
  existing.steps = mergeStrings(existing.steps, surface.steps);
  if (source && !existing.sources.includes(source)) {
    existing.sources.push(source);
    existing.sourceCount = existing.sources.length;
  }
  surfacesByKey.set(key, existing);
  return existing;
}

function targetKey(target: Pick<OmniaUiTarget, "kind" | "label" | "path">): string {
  if (target.path) return `${target.kind}:${target.path}`;
  return `${target.kind}:${target.label}`;
}

function compareTargets(a: OmniaUiTarget, b: OmniaUiTarget): number {
  return (
    b.openCount - a.openCount ||
    b.seenCount - a.seenCount ||
    b.clickedCount - a.clickedCount ||
    a.label.localeCompare(b.label, "de") ||
    a.path.localeCompare(b.path)
  );
}

function compareSurfaces(a: OmniaUiSurface, b: OmniaUiSurface): number {
  return a.path.localeCompare(b.path) || a.title.localeCompare(b.title, "de");
}

function followupReason(target: OmniaUiTarget): string {
  if (target.openCount > 0) return "offenes UI-Ziel aus Auto-Explorer-Inventar";
  if (target.clickedCount > 0 && target.apiEndpointCount === 0) return "geklickt, aber kein API-Verkehr eindeutig zugeordnet";
  return "";
}

function followupArgs(
  target: OmniaUiTarget,
  reason: string,
  options: RecordingCommandTargetOptions = {},
): string[] {
  const targetName = `${target.label}${target.path ? ` ${target.path}` : ""}`;
  const firstStep = reason.startsWith("offenes")
    ? `Offenes UI-Ziel ${targetName} oeffnen`
    : `UI-Ziel ${targetName} erneut oeffnen`;
  return [
    ...recordingWorkflowBaseArgs("manual", options),
    "--stub",
    "--wait-for-login",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--steps",
    [
      firstStep,
      "API-Responses und UI-Timeline pruefen",
      "Abhaengige Listen, Tabs oder Detailbereiche lesen",
      "Fehlende Endpunkte und UI-Zusammenhang dokumentieren",
    ].join(","),
  ];
}

function isWorkflowManifestLike(value: unknown): value is RecordingWorkflowManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { expectedEndpoints?: unknown };
  return Array.isArray(candidate.expectedEndpoints);
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

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}

function pathFromUrl(value: string): string {
  if (!value) return "";
  try {
    return new URL(value).pathname;
  } catch {
    return "";
  }
}

function normalizeStatus(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringField(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === "string" ? record[key] as string : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "").slice(0, 24);
}

function mergeStrings(left: string[], right: string[], limit = 32): string[] {
  const seen = new Set(left);
  const result = [...left];
  for (const value of right) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
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

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function joinSurfaceItems(values: string[]): string {
  return values.length > 0 ? values.slice(0, 8).map(escapeTable).join(", ") : "-";
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
