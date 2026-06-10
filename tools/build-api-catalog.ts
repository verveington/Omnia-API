import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import { redactRecord, redactUiLabel } from "./redact.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutput = path.join(workspaceRoot, "docs", "03_api_catalog.md");
const defaultOpenApiOutput = path.join(workspaceRoot, "openapi", "omnia-observed.openapi.yaml");

export type ApiCatalogEndpoint = {
  host: string;
  path: string;
  method: string;
  statuses: Set<number>;
  count: number;
  steps: Set<string>;
  resourceTypes: Set<string>;
  sampleRequest: Record<string, unknown> | null;
  sampleResponse: Record<string, unknown> | null;
};

if (isMainModule()) {
  const args = process.argv.slice(2);
  const inputFiles = resolveInputFiles(args);
  const outputFile = valueAfter(args, "--out") || defaultOutput;
  const openApiOutputFile = valueAfter(args, "--openapi-out") || defaultOpenApiOutput;

  const records = inputFiles.flatMap((file) => readJsonLines(file).map((record) => ({ ...record, __file: file })));
  const catalog = buildApiCatalog(records);
  writeCatalogMarkdown(catalog, outputFile, inputFiles);
  writeObservedOpenApi(catalog, openApiOutputFile);

  console.log(`API-Katalog: ${outputFile}`);
  console.log(`OpenAPI-Vorbereitung: ${openApiOutputFile}`);
  console.log(`Eingelesene JSONL-Dateien: ${inputFiles.length}`);
  console.log(`Beobachtete Endpunktgruppen: ${catalog.length}`);
}

export function buildApiCatalog(records: Record<string, unknown>[]): ApiCatalogEndpoint[] {
  const requestsById = new Map<string, Record<string, unknown>>();
  const groups = new Map<string, ApiCatalogEndpoint>();

  for (const record of records) {
    if (record.type === "request" && record.requestId) {
      if (!isApiTrafficRecord(record)) continue;
      requestsById.set(String(record.requestId), redactRecord(record) as Record<string, unknown>);
      continue;
    }

    if (record.type !== "response") continue;
    if (!isApiTrafficRecord(record)) continue;
    const url = parseUrl(String(record.url || ""));
    if (!url.host) continue;

    const method = String(record.method || "GET").toUpperCase();
    const normalizedPath = normalizeObservedPath(url.pathname);
    const key = `${url.host}\0${normalizedPath}\0${method}`;
    const group = groups.get(key) || {
      host: url.host,
      path: normalizedPath,
      method,
      statuses: new Set<number>(),
      count: 0,
      steps: new Set<string>(),
      resourceTypes: new Set<string>(),
      sampleRequest: null,
      sampleResponse: null,
    };

    const status = Number(record.status || 0);
    if (Number.isInteger(status) && status > 0) group.statuses.add(status);
    if (record.step) group.steps.add(String(record.step));
    if (record.resourceType) group.resourceTypes.add(String(record.resourceType));
    group.count += 1;

    const request = record.requestId ? requestsById.get(String(record.requestId)) || null : null;
    if (!group.sampleRequest && request) group.sampleRequest = compactSample(request);
    if (!group.sampleResponse) group.sampleResponse = compactSample(redactRecord(record) as Record<string, unknown>);

    groups.set(key, group);
  }

  return [...groups.values()].sort(
    (a, b) => a.host.localeCompare(b.host) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );
}

export function writeCatalogMarkdown(catalog: ApiCatalogEndpoint[], outputFile: string, inputFiles: string[]): void {
  const lines = [
    "# API-Katalog",
    "",
    `Generiert: ${new Date().toISOString()}`,
    "",
    "Quelle: redacted JSONL-Netzwerklogs aus `logs/network/` oder explizit uebergebene Dateien.",
    "",
  ];

  if (inputFiles.length === 0) {
    lines.push(
      "Status: TODO - Es wurden noch keine JSONL-Logs unter `logs/network/` gefunden.",
      "",
      "Naechster Schritt: `node tools/record-network.ts --cdp http://127.0.0.1:9222` starten, fachliche Schritte ausfuehren und danach dieses Skript erneut ausfuehren.",
      "",
    );
  } else {
    lines.push("Eingelesene Dateien:", "");
    for (const file of inputFiles) lines.push(`- \`${path.relative(workspaceRoot, file)}\``);
    lines.push("");
  }

  if (catalog.length === 0) {
    lines.push("Keine beobachteten HTTP-Responses im erwarteten JSONL-Format gefunden.", "");
  }

  let currentHost = "";
  for (const endpoint of catalog) {
    if (endpoint.host !== currentHost) {
      currentHost = endpoint.host;
      lines.push(`## Host: ${currentHost}`, "");
    }

    const statuses = [...endpoint.statuses].sort((a, b) => a - b).join(", ") || "TODO";
    const steps = formatObservedSteps(endpoint.steps) || inferProcess(endpoint.path);
    const resourceTypes = [...endpoint.resourceTypes].sort().join(", ") || "TODO";

    lines.push(`### ${endpoint.method} \`${endpoint.path}\``, "");
    lines.push(`- Statuscodes: ${statuses}`);
    lines.push(`- Haeufigkeit: ${endpoint.count}`);
    lines.push(`- Resource-Type: ${resourceTypes}`);
    lines.push(`- Vermuteter Fachprozess: ${steps}`);
    lines.push("");
    lines.push("Beispiel-Request:");
    lines.push("```json");
    lines.push(formatSample(endpoint.sampleRequest));
    lines.push("```");
    lines.push("");
    lines.push("Beispiel-Response:");
    lines.push("```json");
    lines.push(formatSample(endpoint.sampleResponse));
    lines.push("```");
    lines.push("");
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${lines.join("\n")}\n`);
}

function writeObservedOpenApi(catalog: ApiCatalogEndpoint[], outputFile: string): void {
  const lines = [
    "openapi: 3.1.0",
    "info:",
    "  title: Optica Omnia Observed API",
    "  version: 0.0.0-observed",
    "  description: Beobachtete, redacted Endpunkte aus lokalen Playwright-Logs. Unsichere Schemas bleiben TODO.",
    "servers:",
  ];

  const hosts = [...new Set(catalog.map((endpoint) => endpoint.host))].sort();
  if (hosts.length === 0) {
    lines.push("  - url: https://api2.optica-omnia.de");
    lines.push("    description: TODO - aus environment.json, noch kein Log beobachtet");
  } else {
    for (const host of hosts) {
      lines.push(`  - url: https://${host}`);
      lines.push("    description: Observed host");
    }
  }

  lines.push("paths:");
  if (catalog.length === 0) {
    lines.push("  {}");
  } else {
    const byPath = new Map<string, ApiCatalogEndpoint[]>();
    for (const endpoint of catalog) {
      const list = byPath.get(endpoint.path) || [];
      list.push(endpoint);
      byPath.set(endpoint.path, list);
    }

    for (const [observedPath, endpoints] of [...byPath.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`  ${quoteYaml(observedPath)}:`);
      for (const endpoint of endpoints.sort((a, b) => a.method.localeCompare(b.method))) {
        lines.push(`    ${endpoint.method.toLowerCase()}:`);
        lines.push(`      summary: "TODO: beobachteten Fachprozess bestaetigen (${inferProcess(endpoint.path)})"`);
        lines.push("      x-observed:");
        lines.push(`        host: ${quoteYaml(endpoint.host)}`);
        lines.push(`        count: ${endpoint.count}`);
        lines.push(`        statuses: [${[...endpoint.statuses].sort((a, b) => a - b).join(", ")}]`);
        lines.push("      responses:");
        for (const status of [...endpoint.statuses].sort((a, b) => a - b)) {
          lines.push(`        "${status}":`);
          lines.push("          description: TODO - Schema aus weiteren redacted Logs ableiten");
        }
        if (endpoint.statuses.size === 0) {
          lines.push('        "default":');
          lines.push("          description: TODO - Statuscode noch nicht beobachtet");
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${lines.join("\n")}\n`);
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

function compactSample(record: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!record) return null;
  const {
    type,
    timestamp,
    method,
    url,
    status,
    resourceType,
    headers,
  } = record;
  return redactRecord({
    type,
    timestamp,
    method,
    url,
    status,
    resourceType,
    headers,
    body: null,
    bodyOmittedReason: "omitted-by-api-catalog",
  }) as Record<string, unknown>;
}

function formatSample(sample: Record<string, unknown> | null): string {
  if (!sample) return JSON.stringify({ TODO: "Kein Beispiel beobachtet" }, null, 2);
  const text = JSON.stringify(sample, null, 2);
  return text.length > 1800 ? `${text.slice(0, 1800)}\n... [TRUNCATED]` : text;
}

function formatObservedSteps(steps: Set<string>): string {
  return [...steps]
    .sort()
    .map(redactObservedStep)
    .filter(Boolean)
    .join(", ");
}

function redactObservedStep(step: string): string {
  return redactUiLabel(step);
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}

function inferProcess(pathname: string): string {
  const value = pathname.toLowerCase();
  if (value.includes("kunden") || value.includes("customer")) return "TODO: Kunde/Kundensuche verifizieren";
  if (value.includes("sales") || value.includes("auftrag")) return "TODO: Auftrag/Vorgang verifizieren";
  if (value.includes("prescription") || value.includes("rezept")) return "TODO: Rezeptprozess verifizieren";
  if (value.includes("article") || value.includes("artikel")) return "TODO: Artikel/Warenwirtschaft verifizieren";
  if (value.includes("order")) return "TODO: Bestellung/Warenwirtschaft verifizieren";
  if (value.includes("auth") || value.includes("user")) return "TODO: Authentifizierung/Sitzung verifizieren";
  return "TODO: Fachprozess aus Flow-Marker ableiten";
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? path.resolve(argv[index + 1]) : null;
}

function quoteYaml(value: string): string {
  return JSON.stringify(value);
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
