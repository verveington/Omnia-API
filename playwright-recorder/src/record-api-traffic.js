import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const captureRoot = path.join(projectRoot, "captures");
const bodiesRoot = path.join(captureRoot, "bodies");

loadEnvFile(path.join(projectRoot, ".env.local"));

const config = {
  url: process.env.OMNIA_URL || "https://api2.optica-omnia.de",
  captureBodies: process.env.OMNIA_CAPTURE_BODIES !== "0",
  redactHeaders: process.env.OMNIA_REDACT_HEADERS !== "0",
  machineId: process.env.OMNIA_MACHINE_ID || "",
  tenantId: process.env.OMNIA_TENANT_ID || "",
  appVersion: process.env.OMNIA_APP_VERSION || "stub-0.0.0",
  opticaSignPath: process.env.OMNIA_OPTICA_SIGN_PATH || "",
  username: process.env.OMNIA_USERNAME || "",
  password: process.env.OMNIA_PASSWORD || "",
  usernameSelector: process.env.OMNIA_USERNAME_SELECTOR || "",
  passwordSelector: process.env.OMNIA_PASSWORD_SELECTOR || "",
  submitSelector: process.env.OMNIA_SUBMIT_SELECTOR || "",
  windowWidth: parsePositiveInt(process.env.OMNIA_WINDOW_WIDTH, 1440),
  windowHeight: parsePositiveInt(process.env.OMNIA_WINDOW_HEIGHT, 900),
  viewportWidth: parsePositiveInt(process.env.OMNIA_VIEWPORT_WIDTH, 1440),
  viewportHeight: parsePositiveInt(process.env.OMNIA_VIEWPORT_HEIGHT, 820),
};

if (config.opticaSignPath && fs.existsSync(config.opticaSignPath)) {
  try {
    const raw = fs.readFileSync(config.opticaSignPath, "utf8").trim();
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (!config.machineId && decoded.machineId) config.machineId = decoded.machineId;
    if (!config.tenantId && decoded.tenantId) config.tenantId = decoded.tenantId;
    console.log(`Loaded optica.sign: machineId=${config.machineId?.slice(0, 8)}..., tenantId=${config.tenantId?.slice(0, 8)}...`);
  } catch (err) {
    console.warn("optica.sign konnte nicht gelesen werden:", err.message);
  }
}

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-auth-token",
  "x-csrf-token",
  "proxy-authorization",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;

fs.mkdirSync(captureRoot, { recursive: true });
if (config.captureBodies) {
  fs.mkdirSync(bodiesRoot, { recursive: true });
}

const startedAt = new Date().toISOString().replace(/[:.]/g, "-");
const trafficFile = path.join(captureRoot, `api-traffic-${startedAt}.jsonl`);
const summaryFile = path.join(captureRoot, `api-summary-${startedAt}.json`);

const seen = new Map();
const requestById = new Map();

const browser = await chromium.launch({
  headless: false,
  slowMo: 50,
  args: [
    `--window-size=${config.windowWidth},${config.windowHeight}`,
    "--window-position=20,20",
  ],
});

const context = await browser.newContext({
  viewport: { width: config.viewportWidth, height: config.viewportHeight },
  ignoreHTTPSErrors: true,
});

const stubScript = fs.readFileSync(path.join(import.meta.dirname, "electron-ipc-stub.js"), "utf8");
const stubConfig = {
  machineId: config.machineId,
  tenantId: config.tenantId,
  version: config.appVersion,
  url: config.url,
};
await context.addInitScript({
  content: `window.__OMNIA_STUB__ = ${JSON.stringify(stubConfig)};\n${stubScript}`,
});

if (!config.machineId || !config.tenantId) {
  console.warn(
    "[!] OMNIA_MACHINE_ID / OMNIA_TENANT_ID nicht gesetzt — Login wird vermutlich scheitern.",
  );
  console.warn(
    "    Setze die Werte in .env.local oder zeige per OMNIA_OPTICA_SIGN_PATH auf eine optica.sign-Datei.",
  );
}

const page = await context.newPage();

page.on("request", (request) => {
  const url = request.url();
  if (!isApiUrl(url)) return;

  const record = {
    type: "request",
    time: new Date().toISOString(),
    method: request.method(),
    url,
    path: toPath(url),
    resourceType: request.resourceType(),
    headers: redactHeaders(request.headers()),
    postData: safeJson(request.postData()),
  };

  requestById.set(request, record);
  appendJsonLine(trafficFile, record);
});

page.on("response", async (response) => {
  const url = response.url();
  if (!isApiUrl(url)) return;

  const request = response.request();
  const requestRecord = requestById.get(request);
  const method = request.method();
  const status = response.status();
  const headers = response.headers();
  const contentType = headers["content-type"] || "";
  const rawPath = toPath(url);
  const normalizedPath = normalizePath(rawPath);
  const endpointKey = `${method} ${normalizedPath}`;

  const responseRecord = {
    type: "response",
    time: new Date().toISOString(),
    method,
    url,
    path: rawPath,
    normalizedPath,
    status,
    statusText: response.statusText(),
    contentType,
    responseHeaders: redactHeaders(headers),
    requestPostData: requestRecord?.postData ?? null,
  };

  if (config.captureBodies && contentType.includes("application/json")) {
    responseRecord.bodyFile = await persistResponseBody(response, method, url);
  }

  appendJsonLine(trafficFile, responseRecord);

  const current = seen.get(endpointKey) || {
    method,
    path: normalizedPath,
    calls: 0,
    statuses: {},
    examples: [],
  };
  current.calls += 1;
  current.statuses[status] = (current.statuses[status] || 0) + 1;
  if (current.examples.length < 3) {
    current.examples.push({
      url,
      status,
      postData: requestRecord?.postData ?? null,
      bodyFile: responseRecord.bodyFile ?? null,
    });
  }
  seen.set(endpointKey, current);
  requestById.delete(request);
});

printDsgvoWarning();

console.log(`Opening ${config.url}`);
console.log(
  `Chromium window ${config.windowWidth}x${config.windowHeight}, viewport ${config.viewportWidth}x${config.viewportHeight}`,
);
await page.goto(config.url, { waitUntil: "domcontentloaded" });

if (hasAutomatedLoginConfig(config)) {
  await page.fill(config.usernameSelector, config.username);
  await page.fill(config.passwordSelector, config.password);
  await page.click(config.submitSelector);
  await page.waitForLoadState("networkidle").catch(() => {});
  console.log("Automated login submitted.");
} else {
  console.log("Logge dich im Browserfenster normal ein.");
  console.log("Druecke danach hier Enter, dann laeuft die API-Aufzeichnung weiter.");
  const rl = readline.createInterface({ input, output });
  await rl.question("");
  rl.close();
}

console.log("Recording active. Navigiere in der App durch die Funktionen, die du dokumentieren willst.");
console.log("Druecke Enter, um die Aufzeichnung zu beenden und eine Zusammenfassung zu schreiben.");

const rl = readline.createInterface({ input, output });
await rl.question("");
rl.close();

const summary = {
  generatedAt: new Date().toISOString(),
  url: config.url,
  trafficFile,
  endpointCount: seen.size,
  endpoints: [...seen.values()].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
};

fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

console.log(`Traffic: ${trafficFile}`);
console.log(`Summary: ${summaryFile}`);

await browser.close();

function isApiUrl(url) {
  return url.includes("/apigateway/");
}

function toPath(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

function normalizePath(p) {
  const normalized = p
    .split("/")
    .map((seg) => {
      if (!seg) return seg;
      if (UUID_RE.test(seg)) return "{uuid}";
      if (NUMERIC_RE.test(seg)) return "{id}";
      return seg;
    })
    .join("/");

  return normalized.replace(
    /\/apigateway\/articletenantservice\/articles\/search\/[^/]+$/,
    "/apigateway/articletenantservice/articles/search/{id}",
  );
}

function redactHeaders(headers) {
  if (!headers) return headers;
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (config.redactHeaders && SENSITIVE_HEADER_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

function printDsgvoWarning() {
  const line = "=".repeat(72);
  console.log(line);
  console.log("DSGVO-HINWEIS: Diese Aufzeichnung kann personenbezogene und");
  console.log("Gesundheitsdaten enthalten (Kunden, Versichertennummern,");
  console.log("Rezepte, Diagnosen). Captures NICHT unverschluesselt teilen");
  console.log("oder in Repos commiten. captures/ ist per .gitignore");
  console.log("ausgeschlossen. Sensible Header werden standardmaessig");
  console.log("redacted (OMNIA_REDACT_HEADERS=0 deaktiviert das).");
  console.log(line);
}

function appendJsonLine(file, data) {
  fs.appendFileSync(file, `${JSON.stringify(data)}\n`);
}

function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function persistResponseBody(response, method, url) {
  try {
    const body = await response.text();
    if (!body) return null;
    const file = `${method.toLowerCase()}-${hash(`${method} ${url} ${Date.now()}`)}.json`;
    const filepath = path.join(bodiesRoot, file);
    fs.writeFileSync(filepath, body);
    return filepath;
  } catch {
    return null;
  }
}

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function hasAutomatedLoginConfig(value) {
  return Boolean(
    value.username &&
      value.password &&
      value.usernameSelector &&
      value.passwordSelector &&
      value.submitSelector,
  );
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
