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
const defaultOutputFile = path.join(workspaceRoot, "docs", "10_omnia_knowledge.md");

export type OmniaKnowledgeOptions = {
  outputFile: string;
  generatedAt?: Date;
};

export type KnowledgeEndpoint = {
  key: string;
  method: string;
  path: string;
  count: number;
  statuses: number[];
  steps: string[];
};

export type KnowledgeDomainCoverage = {
  knownEndpoints: number;
  observedKnownEndpoints: number;
  missingKnownEndpoints: number;
  coveragePercent: number;
  missingExamples: KnownEndpoint[];
};

export type KnowledgeDomain = {
  area: string;
  responseCount: number;
  endpointCount: number;
  coverage: KnowledgeDomainCoverage;
  statusCounts: Array<{ status: number; count: number }>;
  steps: string[];
  endpoints: KnowledgeEndpoint[];
  platformCandidate: string;
  knowledgeGap: string;
};

export type OmniaKnowledgeReport = {
  generatedAt: string;
  totalResponses: number;
  endpointCount: number;
  knownEndpointCount: number;
  observedKnownEndpointCount: number;
  missingKnownEndpointCount: number;
  coveragePercent: number;
  domainCount: number;
  domains: KnowledgeDomain[];
};

if (isMainModule()) {
  const options = parseOmniaKnowledgeArgs(process.argv.slice(2));
  const records = resolveInputFiles(process.argv.slice(2)).flatMap(readJsonLines);
  const knownEndpoints = process.argv.includes("--no-inventory") ? [] : loadKnownEndpoints();
  const report = buildOmniaKnowledge(records, { ...options, knownEndpoints });
  writeOmniaKnowledge(report, options.outputFile);
  console.log(`Omnia-Knowledge-Report: ${options.outputFile}`);
  console.log(`Domains: ${report.domainCount}`);
  console.log(`Responses: ${report.totalResponses}`);
  console.log(`Endpunkte: ${report.endpointCount}`);
}

export function parseOmniaKnowledgeArgs(argv: string[]): OmniaKnowledgeOptions {
  return {
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
  };
}

export function buildOmniaKnowledge(
  records: Record<string, unknown>[],
  options: { generatedAt?: Date; knownEndpoints?: KnownEndpoint[] } = {},
): OmniaKnowledgeReport {
  const domainGroups = new Map<string, {
    responseCount: number;
    statuses: Map<number, number>;
    steps: Set<string>;
    endpoints: Map<string, KnowledgeEndpoint & { statusesSet: Set<number>; stepsSet: Set<string> }>;
  }>();

  for (const record of records) {
    if (record.type !== "response") continue;
    if (!isApiTrafficRecord(record)) continue;

    const url = parseUrl(String(record.url || ""));
    const endpointPath = normalizeObservedPath(url.pathname || "/");
    const method = normalizeMethod(record.method);
    if (!method) continue;

    const area = classifyEndpointArea(endpointPath);
    const status = normalizeStatus(record.status);
    const step = String(record.step || "").trim();
    const domain = domainGroups.get(area) || {
      responseCount: 0,
      statuses: new Map<number, number>(),
      steps: new Set<string>(),
      endpoints: new Map<string, KnowledgeEndpoint & { statusesSet: Set<number>; stepsSet: Set<string> }>(),
    };

    domain.responseCount += 1;
    if (status > 0) domain.statuses.set(status, (domain.statuses.get(status) || 0) + 1);
    if (step) domain.steps.add(step);

    const key = `${method} ${endpointPath}`;
    const endpoint = domain.endpoints.get(key) || {
      key,
      method,
      path: endpointPath,
      count: 0,
      statuses: [],
      steps: [],
      statusesSet: new Set<number>(),
      stepsSet: new Set<string>(),
    };
    endpoint.count += 1;
    if (status > 0) endpoint.statusesSet.add(status);
    if (step) endpoint.stepsSet.add(step);
    domain.endpoints.set(key, endpoint);
    domainGroups.set(area, domain);
  }

  const coverageReport = options.knownEndpoints && options.knownEndpoints.length > 0
    ? buildCoverageReport(options.knownEndpoints, records, { generatedAt: options.generatedAt })
    : null;
  const coverageByArea = buildCoverageByArea(options.knownEndpoints || [], coverageReport?.missing || []);
  const domainAreas = new Set([...domainGroups.keys(), ...coverageByArea.keys()]);

  const domains = [...domainAreas]
    .map((area) => {
      const group = domainGroups.get(area) || {
        responseCount: 0,
        statuses: new Map<number, number>(),
        steps: new Set<string>(),
        endpoints: new Map<string, KnowledgeEndpoint & { statusesSet: Set<number>; stepsSet: Set<string> }>(),
      };
      const endpoints = [...group.endpoints.values()]
        .map((endpoint) => ({
          key: endpoint.key,
          method: endpoint.method,
          path: endpoint.path,
          count: endpoint.count,
          statuses: [...endpoint.statusesSet].sort((a, b) => a - b),
          steps: [...endpoint.stepsSet].sort(),
        }))
        .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

      return {
        area,
        responseCount: group.responseCount,
        endpointCount: endpoints.length,
        coverage: coverageByArea.get(area) || emptyCoverage(),
        statusCounts: [...group.statuses.entries()]
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => a.status - b.status),
        steps: [...group.steps].sort(),
        endpoints,
        platformCandidate: platformCandidate(area),
        knowledgeGap: knowledgeGap(area, endpoints.length, group.steps.size),
      };
    })
    .sort((a, b) => a.area.localeCompare(b.area));

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    totalResponses: domains.reduce((sum, domain) => sum + domain.responseCount, 0),
    endpointCount: domains.reduce((sum, domain) => sum + domain.endpointCount, 0),
    knownEndpointCount: coverageReport?.knownCount || 0,
    observedKnownEndpointCount: coverageReport?.observedKnownCount || 0,
    missingKnownEndpointCount: coverageReport?.missing.length || 0,
    coveragePercent: coverageReport?.coveragePercent || 0,
    domainCount: domains.length,
    domains,
  };
}

export function buildOmniaKnowledgeMarkdown(report: OmniaKnowledgeReport): string {
  const lines = [
    "# Omnia-Knowledge-Report",
    "",
    `Generiert: ${report.generatedAt}`,
    "",
    "Hinweis: Dieser Report nutzt ausschliesslich bereits redaktierte API-Records. Er beschreibt beobachtete Struktur und Zusammenhaenge, keine Rohwerte.",
    "",
    "## Zusammenfassung",
    "",
    `- Fachbereiche: ${report.domainCount}`,
    `- API-Responses: ${report.totalResponses}`,
    `- Eindeutige Endpunkte: ${report.endpointCount}`,
    `- Inventar-Coverage: ${formatPercent(report.coveragePercent)} %`,
    `- Known/Observed/Missing: ${report.knownEndpointCount} / ${report.observedKnownEndpointCount} / ${report.missingKnownEndpointCount}`,
    "",
    "## Plattform-Kandidaten",
    "",
  ];

  if (report.domains.length === 0) {
    lines.push("- Keine beobachteten API-Domaenen.", "");
  } else {
    for (const domain of report.domains) {
      lines.push(`- ${domain.area}: ${domain.platformCandidate}`);
    }
    lines.push("");
  }

  lines.push("## Beobachtete Fachbereiche", "");
  for (const domain of report.domains) {
    lines.push(`### ${domain.area}`, "");
    lines.push(`- Responses: ${domain.responseCount}`);
    lines.push(`- Endpunkte: ${domain.endpointCount}`);
    lines.push(`- Inventar-Coverage: ${formatPercent(domain.coverage.coveragePercent)} %`);
    lines.push(`- Known/Observed/Missing: ${domain.coverage.knownEndpoints} / ${domain.coverage.observedKnownEndpoints} / ${domain.coverage.missingKnownEndpoints}`);
    lines.push(`- Plattform-Kandidat: ${domain.platformCandidate}`);
    lines.push(`- Wissensluecke: ${domain.knowledgeGap}`);
    lines.push(`- Schritte: ${domain.steps.length > 0 ? domain.steps.map((step) => `\`${escapeBackticks(step)}\``).join(", ") : "Ohne Marker"}`);
    lines.push("- Statuscodes:");
    if (domain.statusCounts.length === 0) {
      lines.push("  - keine");
    } else {
      for (const item of domain.statusCounts) lines.push(`  - ${item.status}: ${item.count}`);
    }
    lines.push("- Top-Endpunkte:");
    for (const endpoint of domain.endpoints.slice(0, 12)) {
      const statuses = endpoint.statuses.join(", ") || "ohne Status";
      const steps = endpoint.steps.length > 0 ? `; Schritte: ${endpoint.steps.map((step) => escapeBackticks(step)).join(", ")}` : "";
      lines.push(`  - ${endpoint.method} \`${endpoint.path}\` (${endpoint.count}x, ${statuses}${steps})`);
    }
    lines.push("- Fehlende Inventar-Beispiele:");
    if (domain.coverage.missingExamples.length === 0) {
      lines.push("  - keine");
    } else {
      for (const endpoint of domain.coverage.missingExamples.slice(0, 8)) {
        lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writeOmniaKnowledge(report: OmniaKnowledgeReport, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildOmniaKnowledgeMarkdown(report));
  return outputFile;
}

function buildCoverageByArea(knownEndpoints: KnownEndpoint[], missingEndpoints: KnownEndpoint[]): Map<string, KnowledgeDomainCoverage> {
  const knownByArea = new Map<string, KnownEndpoint[]>();
  const missingByArea = new Map<string, KnownEndpoint[]>();

  for (const endpoint of knownEndpoints) {
    const area = classifyEndpointArea(endpoint.path);
    const items = knownByArea.get(area) || [];
    items.push(endpoint);
    knownByArea.set(area, items);
  }

  for (const endpoint of missingEndpoints) {
    const area = classifyEndpointArea(endpoint.path);
    const items = missingByArea.get(area) || [];
    items.push(endpoint);
    missingByArea.set(area, items);
  }

  const result = new Map<string, KnowledgeDomainCoverage>();
  for (const area of new Set([...knownByArea.keys(), ...missingByArea.keys()])) {
    const known = knownByArea.get(area) || [];
    const missing = (missingByArea.get(area) || []).sort(compareKnownEndpoints);
    const observedKnown = Math.max(0, known.length - missing.length);
    result.set(area, {
      knownEndpoints: known.length,
      observedKnownEndpoints: observedKnown,
      missingKnownEndpoints: missing.length,
      coveragePercent: known.length === 0 ? 0 : roundPercent((observedKnown / known.length) * 100),
      missingExamples: missing.slice(0, 8),
    });
  }

  return result;
}

function emptyCoverage(): KnowledgeDomainCoverage {
  return {
    knownEndpoints: 0,
    observedKnownEndpoints: 0,
    missingKnownEndpoints: 0,
    coveragePercent: 0,
    missingExamples: [],
  };
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

function platformCandidate(area: string): string {
  if (area === "Kunden/Vorgaenge") return "CRM/Kundenakte mit Vorgangs- und Kostentraeger-Kontext.";
  if (area === "Artikel/Warenbestand") return "Artikelkatalog, Preislogik und Lager-/Bestandsmodell.";
  if (area === "Warenwirtschaft/Bestellung") return "Beschaffung, Bestellvorschlaege, Bestellung und Wareneingang.";
  if (area === "Abrechnung/Kasse") return "Abrechnung, Kasse, Zahlungsbedingungen und DATEV-nahe Ausleitung.";
  if (area === "Dokumente/Archiv") return "Dokumentenablage, Vorlagen, Druck/PDF und Archivzugriff.";
  if (area === "Kommunikation/Aufgaben") return "Kommunikationshub, Aufgaben, Reminder und Benachrichtigungen.";
  if (area === "Touren/Routenplanung") return "Tourenplanung, Stopps und Export-/Logistikdaten.";
  if (area === "Auth/Identity") return "Login, Token-Lifecycle, User- und Workspace-Kontext.";
  if (area === "User/Workspace") return "Mandant, Rechte, Feature-Toggles und Navigation.";
  if (area === "Filialen/Mandant") return "Filial-, Unternehmens- und Organisationsstammdaten.";
  if (area === "Hilfsmittel") return "Hilfsmittelverwaltung, Termine und versorgungsnahe Fachlisten.";
  if (area === "Referenzdaten") return "Laender, Enums und fachliche Lookup-/Konfigurationsdaten.";
  return `Eigenes Plattformmodul fuer ${area} pruefen.`;
}

function knowledgeGap(area: string, endpointCount: number, stepCount: number): string {
  if (endpointCount === 0) return "Noch keine verwertbaren Endpunkte beobachtet.";
  if (stepCount === 0) return "Endpunkte beobachtet, aber ohne Flow-Marker; fachliche Aktion nachrecorden.";
  if (endpointCount < 3) return `Nur ${endpointCount} Endpunkt(e) beobachtet; Bereich ${area} gezielt vertiefen.`;
  return "Grundstruktur beobachtet; naechster Schritt ist Fehler-, Export- und Schreibvarianten aufnehmen.";
}

function normalizeMethod(value: unknown): string {
  const method = String(value || "").trim().toUpperCase();
  return /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method) ? method : "";
}

function normalizeStatus(value: unknown): number {
  const status = Number(value || 0);
  return Number.isInteger(status) && status > 0 ? status : 0;
}

function compareKnownEndpoints(a: KnownEndpoint, b: KnownEndpoint): number {
  return a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
