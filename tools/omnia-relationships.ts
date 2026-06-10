import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import { classifyEndpointArea } from "./coverage-report.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "12_omnia_relationships.md");

export type OmniaRelationshipsOptions = {
  outputFile: string;
  generatedAt?: Date;
};

export type RelationshipEndpoint = {
  method: string;
  path: string;
  area: string;
  status: number;
};

export type RelationshipTransition = {
  fromArea: string;
  toArea: string;
  count: number;
  steps: string[];
  examples: Array<{
    from: RelationshipEndpoint;
    to: RelationshipEndpoint;
  }>;
};

type MutableRelationshipTransition = RelationshipTransition & {
  firstSeen: number;
};

export type RelationshipStepFlow = {
  step: string;
  responseCount: number;
  domains: string[];
  endpoints: RelationshipEndpoint[];
};

export type OmniaRelationshipMap = {
  generatedAt: string;
  responseCount: number;
  domainCount: number;
  stepCount: number;
  transitions: RelationshipTransition[];
  stepFlows: RelationshipStepFlow[];
};

type Observation = RelationshipEndpoint & {
  step: string;
  timestamp: string;
};

if (isMainModule()) {
  const options = parseOmniaRelationshipsArgs(process.argv.slice(2));
  const records = resolveInputFiles(process.argv.slice(2)).flatMap(readJsonLines);
  const report = buildOmniaRelationships(records, options);
  writeOmniaRelationships(report, options.outputFile);
  console.log(`Omnia-Relationship-Map: ${options.outputFile}`);
  console.log(`Responses: ${report.responseCount}`);
  console.log(`Domain-Kanten: ${report.transitions.length}`);
}

export function parseOmniaRelationshipsArgs(argv: string[]): OmniaRelationshipsOptions {
  return {
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
  };
}

export function buildOmniaRelationships(
  records: Record<string, unknown>[],
  options: { generatedAt?: Date } = {},
): OmniaRelationshipMap {
  const observations = collectObservations(records);
  const stepFlows = buildStepFlows(observations);
  const transitions = buildTransitions(observations);

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    responseCount: observations.length,
    domainCount: new Set(observations.map((item) => item.area)).size,
    stepCount: stepFlows.length,
    transitions,
    stepFlows,
  };
}

export function buildOmniaRelationshipsMarkdown(report: OmniaRelationshipMap): string {
  const lines = [
    "# Omnia-Relationship-Map",
    "",
    `Generiert: ${report.generatedAt}`,
    "",
    "Hinweis: Diese Karte nutzt ausschliesslich redaktierte API-Records. Sie zeigt beobachtete Reihenfolgen und Domaenen-Kanten, keine Rohwerte.",
    "",
    "## Zusammenfassung",
    "",
    `- API-Responses: ${report.responseCount}`,
    `- Fachbereiche: ${report.domainCount}`,
    `- Schritte mit API-Kontext: ${report.stepCount}`,
    `- Domaenen-Kanten: ${report.transitions.length}`,
    "",
    "## Domaenen-Graph",
    "",
  ];

  if (report.transitions.length === 0) {
    lines.push("- Keine Domaenen-Wechsel beobachtet.", "");
  } else {
    lines.push("```mermaid");
    lines.push("graph LR");
    for (const transition of report.transitions.slice(0, 20)) {
      lines.push(`  ${mermaidNode(transition.fromArea)} -->|${transition.count}| ${mermaidNode(transition.toArea)}`);
    }
    lines.push("```", "");
  }

  lines.push("## Wichtigste Domaenen-Kanten", "");
  if (report.transitions.length === 0) {
    lines.push("- Keine.", "");
  } else {
    lines.push("| Von | Nach | Anzahl | Schritte | Beispiel |");
    lines.push("|---|---|---:|---|---|");
    for (const transition of report.transitions) {
      const example = transition.examples[0];
      lines.push(
        `| ${escapeTable(transition.fromArea)} | ${escapeTable(transition.toArea)} | ${transition.count} | ${transition.steps.map(escapeTable).join(", ") || "-"} | ${formatEndpoint(example.from)} -> ${formatEndpoint(example.to)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Step-Flows", "");
  if (report.stepFlows.length === 0) {
    lines.push("- Keine Schrittmarker oder API-Responses beobachtet.", "");
  } else {
    for (const flow of report.stepFlows) {
      lines.push(`### ${flow.step}`, "");
      lines.push(`- Responses: ${flow.responseCount}`);
      lines.push(`- Domaenenfolge: ${formatDomainSequence(flow.domains)}`);
      lines.push("- Endpunkte:");
      for (const endpoint of flow.endpoints.slice(0, 12)) {
        lines.push(`  - ${endpoint.area}: ${endpoint.method} \`${endpoint.path}\` (${endpoint.status || "ohne Status"})`);
      }
      if (flow.endpoints.length > 12) lines.push(`  - ... ${flow.endpoints.length - 12} weitere`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

export function writeOmniaRelationships(report: OmniaRelationshipMap, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildOmniaRelationshipsMarkdown(report));
  return outputFile;
}

function collectObservations(records: Record<string, unknown>[]): Observation[] {
  return records
    .filter((record) => record.type === "response")
    .filter((record) => isApiTrafficRecord(record))
    .map((record) => {
      const url = parseUrl(String(record.url || ""));
      const pathName = normalizeObservedPath(url.pathname || "/");
      const method = normalizeMethod(record.method);
      return {
        method,
        path: pathName,
        area: classifyEndpointArea(pathName),
        status: normalizeStatus(record.status),
        step: String(record.step || "Ohne Marker").trim() || "Ohne Marker",
        timestamp: String(record.timestamp || ""),
      };
    })
    .filter((item) => Boolean(item.method))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function buildStepFlows(observations: Observation[]): RelationshipStepFlow[] {
  const byStep = new Map<string, Observation[]>();
  for (const item of observations) {
    const items = byStep.get(item.step) || [];
    items.push(item);
    byStep.set(item.step, items);
  }

  return [...byStep.entries()].map(([step, items]) => ({
    step,
    responseCount: items.length,
    domains: compactSequence(items.map((item) => item.area)),
    endpoints: items.map(({ method, path, area, status }) => ({ method, path, area, status })),
  }));
}

function buildTransitions(observations: Observation[]): RelationshipTransition[] {
  const transitions = new Map<string, MutableRelationshipTransition>();
  for (let index = 1; index < observations.length; index += 1) {
    const from = observations[index - 1];
    const to = observations[index];
    if (from.area === to.area) continue;
    const key = `${from.area} -> ${to.area}`;
    const transition = transitions.get(key) || {
      fromArea: from.area,
      toArea: to.area,
      count: 0,
      firstSeen: index,
      steps: [],
      examples: [],
    };
    transition.count += 1;
    transition.steps = [...new Set([...transition.steps, from.step, to.step].filter(Boolean))].sort();
    if (transition.examples.length < 3) {
      transition.examples.push({
        from: endpointFromObservation(from),
        to: endpointFromObservation(to),
      });
    }
    transitions.set(key, transition);
  }

  return [...transitions.values()]
    .sort((a, b) => a.firstSeen - b.firstSeen)
    .map(({ firstSeen, ...transition }) => transition);
}

function endpointFromObservation(item: Observation): RelationshipEndpoint {
  return {
    method: item.method,
    path: item.path,
    area: item.area,
    status: item.status,
  };
}

function compactSequence(values: string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (!value || result.at(-1) === value) continue;
    result.push(value);
  }
  return result;
}

function formatDomainSequence(domains: string[]): string {
  if (domains.length === 0) return "keine";
  const maxDomains = 18;
  if (domains.length <= maxDomains) return domains.join(" -> ");
  return `${domains.slice(0, maxDomains).join(" -> ")} -> ... ${domains.length - maxDomains} weitere`;
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

function formatEndpoint(endpoint: RelationshipEndpoint): string {
  return `${endpoint.method} \`${escapeBackticks(endpoint.path)}\``;
}

function mermaidNode(value: string): string {
  return `"${value.replace(/"/g, "'")}"`;
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
