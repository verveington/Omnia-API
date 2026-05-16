import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const capturesRoot = path.join(projectRoot, "captures");
const docsRoot = path.join(repoRoot, "docs");

const inputSummary = process.argv[2] ? path.resolve(process.argv[2]) : findLatestSummary();
if (!inputSummary) {
  console.error("Keine api-summary-*.json unter captures/ gefunden.");
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(inputSummary, "utf8"));
const trafficFile = summary.trafficFile || summary.trafficPath || inferTrafficPath(inputSummary);
const traffic = fs.existsSync(trafficFile)
  ? fs.readFileSync(trafficFile, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
  : [];

fs.mkdirSync(docsRoot, { recursive: true });

const endpoints = buildEndpointIndex(summary, traffic);
const markdown = renderMarkdown(summary, inputSummary, trafficFile, endpoints);
const openapi = renderOpenApi(summary, endpoints);

const markdownOut = path.join(docsRoot, "playwright-api-recording-analysis.md");
const openapiOut = path.join(docsRoot, "openapi.generated.json");

fs.writeFileSync(markdownOut, markdown);
fs.writeFileSync(openapiOut, JSON.stringify(openapi, null, 2));

console.log(`Summary: ${inputSummary}`);
console.log(`Traffic: ${trafficFile}`);
console.log(`Markdown: ${markdownOut}`);
console.log(`OpenAPI: ${openapiOut}`);
console.log(`Endpoints: ${endpoints.length}`);

function findLatestSummary() {
  if (!fs.existsSync(capturesRoot)) return null;
  return fs.readdirSync(capturesRoot)
    .filter((name) => /^api-summary-.*\.json$/.test(name))
    .map((name) => path.join(capturesRoot, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
}

function inferTrafficPath(summaryPath) {
  return summaryPath.replace("/api-summary-", "/api-traffic-").replace(/\.json$/, ".jsonl");
}

function buildEndpointIndex(summary, traffic) {
  const map = new Map();

  for (const endpoint of summary.endpoints || []) {
    const normalizedEndpointPath = normalizePath(endpoint.path);
    map.set(`${endpoint.method} ${normalizedEndpointPath}`, {
      method: endpoint.method,
      path: normalizedEndpointPath,
      calls: endpoint.calls || 0,
      statuses: endpoint.statuses || {},
      queryParams: new Set(),
      requestSchemas: [],
      responseSchemas: new Map(),
    });
  }

  for (const record of traffic) {
    const normalizedPath = normalizePath(record.normalizedPath || record.path || "");
    const key = `${record.method} ${normalizedPath}`;
    if (!map.has(key)) {
      map.set(key, {
        method: record.method,
        path: normalizedPath,
        calls: 0,
        statuses: {},
        queryParams: new Set(),
        requestSchemas: [],
        responseSchemas: new Map(),
      });
    }

    const endpoint = map.get(key);
    for (const queryKey of queryKeys(record.url)) endpoint.queryParams.add(queryKey);

    const requestPayload = record.type === "request" ? record.postData : record.requestPostData;
    if (requestPayload !== null && requestPayload !== undefined) {
      pushUniqueSchema(endpoint.requestSchemas, toJsonSchema(requestPayload), "request");
    }

    if (record.type === "response") {
      endpoint.statuses[record.status] = endpoint.statuses[record.status] || 0;
      const body = readJsonBody(record.bodyFile);
      if (body !== undefined) {
        const statusKey = String(record.status || "default");
        if (!endpoint.responseSchemas.has(statusKey)) endpoint.responseSchemas.set(statusKey, []);
        pushUniqueSchema(endpoint.responseSchemas.get(statusKey), toJsonSchema(body), `response-${statusKey}`);
      }
    }
  }

  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function renderMarkdown(summary, summaryPath, trafficPath, endpoints) {
  const methods = countBy(endpoints, (endpoint) => endpoint.method);
  const statuses = {};
  for (const endpoint of endpoints) {
    for (const [status, count] of Object.entries(endpoint.statuses)) {
      statuses[status] = (statuses[status] || 0) + count;
    }
  }

  const groups = groupBy(endpoints, (endpoint) => serviceName(endpoint.path));
  let md = "# Playwright-Aufzeichnung: API-Auswertung\n\n";
  md += `Quelle: \`${relative(summaryPath)}\``;
  if (trafficPath) md += ` und \`${relative(trafficPath)}\``;
  md += "\n\n";
  md += `Aufzeichnungszeit: \`${summary.generatedAt || "unbekannt"}\`\n\n`;
  md += "## Ergebnis\n\n";
  md += `- Eindeutige Endpunkte: ${endpoints.length}\n`;
  md += `- Requests/Responses im Traffic-Log: ${traffic.filter((x) => x.type === "request").length}/${traffic.filter((x) => x.type === "response").length}\n`;
  md += `- Methoden: ${formatCounts(methods)}\n`;
  md += `- Statuscodes: ${formatCounts(statuses)}\n\n`;

  md += "## Services\n\n";
  for (const [service, items] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
    md += `- \`${service}\`: ${items.length} Endpunkte\n`;
  }

  md += "\n## Endpunkte\n\n";
  for (const [service, items] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    md += `### ${service}\n\n`;
    for (const endpoint of items) {
      md += `- \`${endpoint.method}\` \`${endpoint.path}\` (${endpoint.calls} Calls, ${formatCounts(endpoint.statuses)})\n`;
      if (endpoint.queryParams.size) md += `  Query: ${[...endpoint.queryParams].sort().map((x) => `\`${x}\``).join(", ")}\n`;
      if (endpoint.requestSchemas.length) md += `  Request-Schema: \`${schemaPreview(endpoint.requestSchemas[0])}\`\n`;
      const firstResponse = firstSchema(endpoint.responseSchemas);
      if (firstResponse) md += `  Response-Schema: \`${schemaPreview(firstResponse)}\`\n`;
    }
    md += "\n";
  }

  return md;
}

function renderOpenApi(summary, endpoints) {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Optica Omnia API - Playwright Discovery",
      version: "0.1.0",
      description: "Automatisch aus Playwright-Aufzeichnungen abgeleitete Rohfassung. Nicht als vollstaendige Hersteller-Spezifikation verstehen.",
    },
    servers: [{ url: summary.url || "https://api2.optica-omnia.de" }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    paths: {},
  };

  for (const endpoint of endpoints) {
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
        content: {
          "application/json": { schema: endpoint.requestSchemas[0] },
        },
      };
    }

    for (const [status, schemas] of endpoint.responseSchemas.entries()) {
      operation.responses[status] = responseObject(schemas[0]);
    }
    for (const status of Object.keys(endpoint.statuses)) {
      operation.responses[status] ||= responseObject();
    }
    if (!Object.keys(operation.responses).length) operation.responses.default = responseObject();

    document.paths[endpoint.path][endpoint.method.toLowerCase()] = operation;
  }

  return document;
}

function toJsonSchema(value) {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length ? toJsonSchema(value[0]) : {},
    };
  }
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

function readJsonBody(file) {
  if (!file || !fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function queryKeys(url) {
  try {
    return [...new URL(url).searchParams.keys()];
  } catch {
    return [];
  }
}

function normalizePath(pathname) {
  const normalized = pathname
    .split("/")
    .map((segment) => {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return "{uuid}";
      if (/^\d+$/.test(segment)) return "{id}";
      return segment;
    })
    .join("/");

  return normalized.replace(
    /\/apigateway\/articletenantservice\/articles\/search\/[^/]+$/,
    "/apigateway/articletenantservice/articles/search/{id}",
  );
}

function pathParameters(pathname) {
  const names = [...pathname.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  return [...new Set(names)].map((name) => ({
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
  const clean = pathname
    .replace(/^\/apigateway\//, "")
    .replace(/\{([^}]+)\}/g, "by-$1")
    .split("/")
    .filter(Boolean)
    .join("-");
  return `${method.toLowerCase()}-${clean}`.replace(/[^a-zA-Z0-9_-]/g, "-");
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

function pushUniqueSchema(list, schema) {
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
  return compactSchema(schema).slice(0, 600) + (compactSchema(schema).length > 600 ? "..." : "");
}

function compactSchema(schema) {
  if (!schema) return "";
  if (schema.type === "array") return `${compactSchema(schema.items || {})}[]`;
  if (schema.type === "object") {
    const entries = Object.entries(schema.properties || {}).slice(0, 30);
    const suffix = Object.keys(schema.properties || {}).length > 30 ? "; ..." : "";
    return `{ ${entries.map(([key, value]) => `${key}: ${compactSchema(value)}`).join("; ")}${suffix} }`;
  }
  return schema.type || "unknown";
}

function relative(file) {
  return path.relative(repoRoot, file);
}
