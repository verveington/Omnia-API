import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const capturesRoot = path.join(projectRoot, "captures");
const docsRoot = path.join(repoRoot, "docs");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;

const summaries = fs.readdirSync(capturesRoot)
  .filter((name) => /^api-summary-.*\.json$/.test(name))
  .map((name) => path.join(capturesRoot, name))
  .sort();

const endpoints = new Map();

for (const summaryPath of summaries) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  for (const endpoint of summary.endpoints || []) {
    mergeEndpoint({
      method: endpoint.method,
      path: normalizePath(endpoint.path),
      calls: endpoint.calls || 0,
      statuses: endpoint.statuses || {},
      source: path.basename(summaryPath),
    });
  }

  if (!summary.trafficFile || !fs.existsSync(summary.trafficFile)) continue;
  const traffic = fs.readFileSync(summary.trafficFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  for (const record of traffic) {
    const endpoint = mergeEndpoint({
      method: record.method,
      path: normalizePath(record.normalizedPath || record.path),
      calls: 0,
      statuses: record.type === "response" && record.status ? { [record.status]: 0 } : {},
      source: path.basename(summaryPath),
    });

    for (const queryKey of queryKeys(record.url)) endpoint.queryParams.add(queryKey);

    const payload = record.type === "request" ? record.postData : record.requestPostData;
    if (payload !== null && payload !== undefined) pushUnique(endpoint.requestSchemas, toJsonSchema(payload));

    if (record.type === "response") {
      endpoint.statuses[record.status] = endpoint.statuses[record.status] || 0;
      const body = readJsonBody(record.bodyFile);
      if (body !== undefined) {
        const statusKey = String(record.status || "default");
        if (!endpoint.responseSchemas.has(statusKey)) endpoint.responseSchemas.set(statusKey, []);
        pushUnique(endpoint.responseSchemas.get(statusKey), toJsonSchema(body));
      }
    }
  }
}

const endpointList = [...endpoints.values()]
  .filter((endpoint) => endpoint.path && endpoint.path !== "undefined")
  .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

fs.mkdirSync(docsRoot, { recursive: true });
const markdownOut = path.join(docsRoot, "playwright-api-cumulative-analysis.md");
const openapiOut = path.join(docsRoot, "openapi.cumulative.json");

fs.writeFileSync(markdownOut, renderMarkdown(endpointList));
fs.writeFileSync(openapiOut, JSON.stringify(renderOpenApi(endpointList), null, 2));

const methods = countBy(endpointList, (endpoint) => endpoint.method);
const statuses = {};
for (const endpoint of endpointList) {
  for (const [status, count] of Object.entries(endpoint.statuses)) {
    statuses[status] = (statuses[status] || 0) + count;
  }
}

console.log(`Summaries: ${summaries.length}`);
console.log(`Endpoints: ${endpointList.length}`);
console.log(`Paths: ${Object.keys(renderOpenApi(endpointList).paths).length}`);
console.log(`Methods: ${formatCounts(methods)}`);
console.log(`Statuses: ${formatCounts(statuses)}`);
console.log(`Markdown: ${markdownOut}`);
console.log(`OpenAPI: ${openapiOut}`);

function mergeEndpoint({ method, path: endpointPath, calls, statuses, source }) {
  const key = `${method} ${endpointPath}`;
  if (!endpoints.has(key)) {
    endpoints.set(key, {
      method,
      path: endpointPath,
      calls: 0,
      statuses: {},
      queryParams: new Set(),
      requestSchemas: [],
      responseSchemas: new Map(),
      sources: new Set(),
    });
  }
  const endpoint = endpoints.get(key);
  endpoint.calls += calls;
  endpoint.sources.add(source);
  for (const [status, count] of Object.entries(statuses || {})) {
    endpoint.statuses[status] = (endpoint.statuses[status] || 0) + count;
  }
  return endpoint;
}

function renderMarkdown(endpointList) {
  const methods = countBy(endpointList, (endpoint) => endpoint.method);
  const statuses = {};
  const groups = groupBy(endpointList, (endpoint) => serviceName(endpoint.path));

  for (const endpoint of endpointList) {
    for (const [status, count] of Object.entries(endpoint.statuses)) {
      statuses[status] = (statuses[status] || 0) + count;
    }
  }

  let md = "# Kumulative Playwright-API-Auswertung\n\n";
  md += "## Quellen\n\n";
  for (const summary of summaries) md += `- \`${path.relative(repoRoot, summary)}\`\n`;
  md += "\n## Ergebnis\n\n";
  md += `- Aufnahmen: ${summaries.length}\n`;
  md += `- Eindeutige Endpunkte: ${endpointList.length}\n`;
  md += `- Methoden: ${formatCounts(methods)}\n`;
  md += `- Statuscodes: ${formatCounts(statuses)}\n\n`;
  md += "## Service-Gruppen\n\n";
  for (const [service, items] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
    md += `- \`${service}\`: ${items.length} Endpunkte\n`;
  }
  md += "\n## Endpunkte\n\n";
  for (const [service, items] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    md += `### ${service}\n\n`;
    for (const endpoint of items) {
      md += `- \`${endpoint.method}\` \`${endpoint.path}\` (${endpoint.calls} Calls, ${formatCounts(endpoint.statuses)})\n`;
      if (endpoint.queryParams.size) md += `  - Query: ${[...endpoint.queryParams].sort().map((x) => `\`${x}\``).join(", ")}\n`;
      if (endpoint.requestSchemas.length) md += `  - Request: \`${schemaPreview(endpoint.requestSchemas[0])}\`\n`;
      const responseSchema = firstSchema(endpoint.responseSchemas);
      if (responseSchema) md += `  - Response: \`${schemaPreview(responseSchema)}\`\n`;
    }
    md += "\n";
  }
  return md;
}

function renderOpenApi(endpointList) {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Optica Omnia API - Cumulative Playwright Discovery",
      version: "0.1.0",
      description: "Kumulative Rohfassung aus allen lokalen Playwright-Aufzeichnungen.",
    },
    servers: [{ url: "https://api2.optica-omnia.de" }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    paths: {},
  };

  for (const endpoint of endpointList) {
    document.paths[endpoint.path] ||= {};
    const operation = {
      tags: [serviceName(endpoint.path)],
      operationId: operationId(endpoint.method, endpoint.path),
      parameters: [
        ...pathParameters(endpoint.path),
        ...[...endpoint.queryParams].sort().map((name) => ({
          name,
          in: "query",
          required: false,
          schema: { type: "string" },
        })),
      ],
      responses: {},
    };

    if (endpoint.requestSchemas.length && !["GET", "HEAD"].includes(endpoint.method)) {
      operation.requestBody = {
        required: true,
        content: { "application/json": { schema: endpoint.requestSchemas[0] } },
      };
    }

    for (const [status, schemas] of endpoint.responseSchemas.entries()) {
      operation.responses[status] = responseObject(schemas[0]);
    }
    for (const status of Object.keys(endpoint.statuses)) operation.responses[status] ||= responseObject();
    if (!Object.keys(operation.responses).length) operation.responses.default = responseObject();

    document.paths[endpoint.path][endpoint.method.toLowerCase()] = operation;
  }

  return document;
}

function normalizePath(pathname) {
  const normalized = (pathname || "")
    .split("/")
    .map((segment) => {
      if (UUID_RE.test(segment)) return "{uuid}";
      if (NUMERIC_RE.test(segment)) return "{id}";
      return segment;
    })
    .join("/");

  return normalized.replace(
    /\/apigateway\/articletenantservice\/articles\/search\/[^/]+$/,
    "/apigateway/articletenantservice/articles/search/{id}",
  );
}

function toJsonSchema(value) {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) return { type: "array", items: value.length ? toJsonSchema(value[0]) : {} };
  if (typeof value === "object") {
    const properties = {};
    const required = [];
    for (const [key, child] of Object.entries(value)) {
      properties[key] = toJsonSchema(child);
      if (child !== null && child !== undefined) required.push(key);
    }
    const schema = { type: "object", properties };
    if (required.length) schema.required = required;
    return schema;
  }
  if (typeof value === "number") return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
  if (typeof value === "boolean") return { type: "boolean" };
  return { type: "string" };
}

function queryKeys(url) {
  try {
    return [...new URL(url).searchParams.keys()];
  } catch {
    return [];
  }
}

function readJsonBody(file) {
  if (!file || !fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function pathParameters(pathname) {
  return [...new Set([...pathname.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]))].map((name) => ({
    name,
    in: "path",
    required: true,
    schema: name === "uuid" ? { type: "string", format: "uuid" } : { type: "string" },
  }));
}

function responseObject(schema) {
  const response = { description: "Recorded response" };
  if (schema) response.content = { "application/json": { schema } };
  return response;
}

function serviceName(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return `/${parts.slice(0, 2).join("/")}`;
}

function operationId(method, pathname) {
  return `${method.toLowerCase()}-${pathname
    .replace(/^\/apigateway\//, "")
    .replace(/\{([^}]+)\}/g, "by-$1")
    .split("/")
    .filter(Boolean)
    .join("-")}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function groupBy(items, fn) {
  const result = new Map();
  for (const item of items) {
    const key = fn(item);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(item);
  }
  return result;
}

function countBy(items, fn) {
  const result = {};
  for (const item of items) {
    const key = fn(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function formatCounts(counts) {
  return Object.entries(counts).map(([key, count]) => `${key} ${count}`).join(", ") || "-";
}

function pushUnique(list, schema) {
  const signature = JSON.stringify(schema);
  if (!list.some((item) => JSON.stringify(item) === signature)) list.push(schema);
}

function firstSchema(responseSchemas) {
  for (const schemas of responseSchemas.values()) {
    if (schemas.length) return schemas[0];
  }
  return null;
}

function schemaPreview(schema) {
  const compact = compactSchema(schema);
  return compact.slice(0, 500) + (compact.length > 500 ? "..." : "");
}

function compactSchema(schema) {
  if (!schema) return "";
  if (schema.type === "array") return `${compactSchema(schema.items || {})}[]`;
  if (schema.type === "object") {
    const entries = Object.entries(schema.properties || {}).slice(0, 20);
    const suffix = Object.keys(schema.properties || {}).length > 20 ? "; ..." : "";
    return `{ ${entries.map(([key, value]) => `${key}: ${compactSchema(value)}`).join("; ")}${suffix} }`;
  }
  return schema.type || "unknown";
}
