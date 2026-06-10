import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import { classifyEndpointArea } from "./coverage-report.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "13_omnia_data_model.md");

export type OmniaDataModelOptions = {
  outputFile: string;
  generatedAt?: Date;
};

export type DataModelField = {
  path: string;
  types: string[];
  count: number;
};

export type DataModelEntity = {
  name: string;
  area: string;
  sampleCount: number;
  sourceKinds: string[];
  endpoints: string[];
  fields: DataModelField[];
};

export type OmniaDataModel = {
  generatedAt: string;
  entityCount: number;
  sampleCount: number;
  entities: DataModelEntity[];
};

type MutableEntity = {
  name: string;
  area: string;
  sampleCount: number;
  sourceKinds: Set<string>;
  endpoints: Set<string>;
  fields: Map<string, { path: string; types: Set<string>; count: number }>;
};

if (isMainModule()) {
  const options = parseOmniaDataModelArgs(process.argv.slice(2));
  const records = resolveInputFiles(process.argv.slice(2)).flatMap(readJsonLines);
  const model = buildOmniaDataModel(records, options);
  writeOmniaDataModel(model, options.outputFile);
  console.log(`Omnia-Data-Model: ${options.outputFile}`);
  console.log(`Entities: ${model.entityCount}`);
  console.log(`Body-Samples: ${model.sampleCount}`);
}

export function parseOmniaDataModelArgs(argv: string[]): OmniaDataModelOptions {
  return {
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
  };
}

export function buildOmniaDataModel(
  records: Record<string, unknown>[],
  options: { generatedAt?: Date } = {},
): OmniaDataModel {
  const entities = new Map<string, MutableEntity>();
  let sampleCount = 0;

  for (const record of records) {
    if (record.type !== "request" && record.type !== "response") continue;
    if (!isApiTrafficRecord(record)) continue;
    const body = normalizeBody(record.body);
    if (!body) continue;

    const url = parseUrl(String(record.url || ""));
    const endpointPath = normalizeObservedPath(url.pathname || "/");
    const method = normalizeMethod(record.method);
    if (!method) continue;

    const area = classifyEndpointArea(endpointPath);
    const name = entityNameFromPath(endpointPath);
    const key = `${area}\0${name}`;
    const entity = entities.get(key) || {
      name,
      area,
      sampleCount: 0,
      sourceKinds: new Set<string>(),
      endpoints: new Set<string>(),
      fields: new Map<string, { path: string; types: Set<string>; count: number }>(),
    };

    sampleCount += 1;
    entity.sampleCount += 1;
    entity.sourceKinds.add(String(record.type));
    entity.endpoints.add(`${method} ${endpointPath}`);
    for (const field of collectFields(body)) {
      const existing = entity.fields.get(field.path) || {
        path: field.path,
        types: new Set<string>(),
        count: 0,
      };
      existing.types.add(field.type);
      existing.count += 1;
      entity.fields.set(field.path, existing);
    }
    entities.set(key, entity);
  }

  const result = [...entities.values()]
    .map((entity) => ({
      name: entity.name,
      area: entity.area,
      sampleCount: entity.sampleCount,
      sourceKinds: [...entity.sourceKinds].sort(),
      endpoints: [...entity.endpoints].sort(),
      fields: [...entity.fields.values()]
        .map((field) => ({
          path: field.path,
          types: [...field.types].sort(),
          count: field.count,
        }))
        .sort((a, b) => a.path.localeCompare(b.path)),
    }))
    .sort((a, b) => a.area.localeCompare(b.area) || b.sampleCount - a.sampleCount || a.name.localeCompare(b.name));

  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    entityCount: result.length,
    sampleCount,
    entities: result,
  };
}

export function buildOmniaDataModelMarkdown(model: OmniaDataModel): string {
  const lines = [
    "# Omnia-Data-Model",
    "",
    `Generiert: ${model.generatedAt}`,
    "",
    "Hinweis: Dieser Report nutzt ausschliesslich redaktierte Request-/Response-Bodies. Er dokumentiert Feldnamen, Typen und beobachtete Objektformen, keine Rohwerte.",
    "",
    "## Zusammenfassung",
    "",
    `- Entity-Kandidaten: ${model.entityCount}`,
    `- Body-Samples: ${model.sampleCount}`,
    "",
    "## Entity-Kandidaten",
    "",
  ];

  if (model.entities.length === 0) {
    lines.push("- Keine strukturierten API-Bodies beobachtet.", "");
  } else {
    lines.push("| Fachbereich | Entity | Samples | Quellen | Endpunkte | Felder |");
    lines.push("|---|---|---:|---|---:|---:|");
    for (const entity of model.entities) {
      lines.push(
        `| ${escapeTable(entity.area)} | ${escapeTable(entity.name)} | ${entity.sampleCount} | ${entity.sourceKinds.join(", ")} | ${entity.endpoints.length} | ${entity.fields.length} |`,
      );
    }
    lines.push("");
  }

  for (const entity of model.entities) {
    lines.push(`### ${entity.area}: ${entity.name}`, "");
    lines.push(`- Samples: ${entity.sampleCount}`);
    lines.push(`- Quellen: ${entity.sourceKinds.join(", ")}`);
    lines.push("- Endpunkte:");
    for (const endpoint of entity.endpoints.slice(0, 10)) lines.push(`  - ${endpoint}`);
    if (entity.endpoints.length > 10) lines.push(`  - ... ${entity.endpoints.length - 10} weitere`);
    lines.push("- Felder:");
    if (entity.fields.length === 0) {
      lines.push("  - keine");
    } else {
      lines.push("  | Feld | Typen | Samples |");
      lines.push("  |---|---|---:|");
      for (const field of entity.fields.slice(0, 40)) {
        lines.push(`  | ${escapeTable(field.path)} | ${field.types.join(", ")} | ${field.count} |`);
      }
      if (entity.fields.length > 40) lines.push(`  | ... | ${entity.fields.length - 40} weitere | |`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writeOmniaDataModel(model: OmniaDataModel, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildOmniaDataModelMarkdown(model));
  return outputFile;
}

function collectFields(value: unknown, prefix = ""): Array<{ path: string; type: string }> {
  if (Array.isArray(value)) {
    const result = prefix ? [{ path: prefix, type: "array" }] : [];
    const childPrefix = prefix ? `${prefix}[]` : "[]";
    for (const item of value.slice(0, 5)) result.push(...collectFields(item, childPrefix));
    return result;
  }
  if (isPlainObject(value)) {
    const result = prefix && !prefix.endsWith("[]") ? [{ path: prefix, type: "object" }] : [];
    for (const [key, child] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
      const childPath = prefix ? `${prefix}.${key}` : key;
      result.push(...collectFields(child, childPath));
    }
    return result;
  }
  if (!prefix) return [];
  return [{ path: prefix, type: valueType(value) }];
}

function normalizeBody(value: unknown): unknown | null {
  if (isPlainObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return isPlainObject(parsed) || Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function entityNameFromPath(endpointPath: string): string {
  const skip = new Set([
    "apigateway",
    "api",
    "auth",
    "keycloak",
    "kunden",
    "customer",
    "customerservice",
    "sales",
    "salesprocessservice",
    "articletenantservice",
    "article-tenant",
    "wawi",
    "wawiservice",
    "userservice",
    "filiale",
    "firma",
    "accounting",
    "communicatorservice",
    "notification",
    "task",
    "document",
  ]);
  const ignoredActions = new Set([
    "search",
    "simple-search",
    "list",
    "details",
    "count",
    "counts",
    "log",
  ]);
  const segments = endpointPath.split("/").filter(Boolean);
  const candidate = segments.find((segment) => !skip.has(segment) && !ignoredActions.has(segment) && !isTemplateSegment(segment));
  return candidate || segments.find((segment) => !isTemplateSegment(segment)) || "unknown";
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (isPlainObject(value)) return "object";
  return typeof value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTemplateSegment(value: string): boolean {
  return /^\{[^}]+\}$/.test(value) || value === "[REDACTED]" || value === "%5BREDACTED%5D";
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

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
