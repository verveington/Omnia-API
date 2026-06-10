import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(TOOL_DIR, "..");

export const DEFAULT_BASE_URL = "https://api2.optica-omnia.de";
export const DEFAULT_ENDPOINT_PATH = "/apigateway/articletenantservice/articles/simple-search";
export const DEFAULT_REFERER_PATH = "/merchandise-management/article-management/articles";
export const DEFAULT_REALM = "502753";
export const CAPTURED_AUTH_FILE = path.resolve(WORKSPACE_ROOT, "tmp", "omnia-export-auth.json");
export const EXPORT_DATA_FILE = path.resolve(WORKSPACE_ROOT, "tmp", "omnia-export-data.json");
export const ORDER_PROPOSALS_DATA_FILE = path.resolve(WORKSPACE_ROOT, "tmp", "omnia-order-proposals-data.json");
export const DEFAULT_EXPORT_BODY = Object.freeze({
  dataOrigin: ["LOCAL"],
  keywords: "*",
  active: true,
  useDescriptionOnlyMultiKeywords: true,
});
export const ORDER_PROPOSALS_EXPORT_BODY = Object.freeze({
  keywords: "*",
  active: true,
});

const EXPORT_PRESETS = Object.freeze({
  articles: Object.freeze({
    id: "articles",
    label: "Artikel",
    buttonLabel: "Artikeldaten abrufen",
    endpointPath: DEFAULT_ENDPOINT_PATH,
    refererPath: DEFAULT_REFERER_PATH,
    sort: "",
    body: DEFAULT_EXPORT_BODY,
    saveFile: EXPORT_DATA_FILE,
  }),
  orderProposals: Object.freeze({
    id: "orderProposals",
    label: "Bestellvorschlaege",
    buttonLabel: "Bestellvorschlaege abrufen",
    endpointPath: "/apigateway/wawi/order-proposals/search",
    refererPath: "/merchandise-management/order-management/order-proposals",
    sort: "articleDescription,desc",
    body: ORDER_PROPOSALS_EXPORT_BODY,
    saveFile: ORDER_PROPOSALS_DATA_FILE,
  }),
});

const DEFAULT_PORT = 4177;

export function getExportPreset(dataset) {
  return EXPORT_PRESETS[String(dataset || "").trim()] || EXPORT_PRESETS.articles;
}

export function exportDataFileForDataset(dataset) {
  return getExportPreset(dataset).saveFile;
}

export function buildExportPageRequest(config) {
  const baseUrl = normalizeBaseUrl(config.baseUrl || DEFAULT_BASE_URL);
  const endpointPath = config.endpointPath || DEFAULT_ENDPOINT_PATH;
  const auth = parseAuthInput(config.authInput || config.cookie || "");
  const url = new URL(endpointPath, `${baseUrl}/`);
  url.searchParams.set("page", String(config.page ?? 0));
  url.searchParams.set("size", String(config.pageSize || 200));
  if (String(config.sort || "").trim()) {
    url.searchParams.set("sort", String(config.sort).trim());
  }

  const referer = new URL(config.refererPath || DEFAULT_REFERER_PATH, `${baseUrl}/`);
  return {
    url: url.toString(),
    options: {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: baseUrl,
        referer: referer.toString(),
        cookie: auth.cookie,
        ...(auth.authorization ? { authorization: auth.authorization } : {}),
      },
      body: JSON.stringify(config.body || DEFAULT_EXPORT_BODY),
    },
  };
}

export function buildLoginRequest(config) {
  const baseUrl = normalizeBaseUrl(config.baseUrl || DEFAULT_BASE_URL);
  const realm = encodeURIComponent(String(config.realm || DEFAULT_REALM));
  const url = new URL(`/keycloak/auth/realms/${realm}/protocol/openid-connect/token`, `${baseUrl}/`);
  const body = new URLSearchParams({
    username: String(config.username || ""),
    password: String(config.password || ""),
    grant_type: "password",
  });
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
    origin: baseUrl,
    referer: new URL("/login", `${baseUrl}/`).toString(),
    ...(config.clientAuthorization ? { authorization: String(config.clientAuthorization) } : {}),
    ...(config.workspace ? { "x-workspace": String(config.workspace) } : {}),
  };

  return {
    url: url.toString(),
    options: {
      method: "POST",
      headers,
      body: body.toString(),
    },
  };
}

export function parseAuthInput(value) {
  const input = String(value || "").trim();
  if (!input) return { cookie: "", authorization: "" };

  let cookie = "";
  let authorization = "";
  for (const rawLine of input.split(/\r?\n/)) {
    const line = unwrapHeaderLine(rawLine.trim());
    const header = line.match(/^([A-Za-z-]+)\s*:\s*(.+)$/);
    if (!header) continue;
    const key = header[1].toLowerCase();
    const headerValue = header[2].trim();
    if (key === "cookie") cookie = headerValue;
    if (key === "authorization") authorization = headerValue;
  }

  if (!cookie && !authorization && looksLikeCookie(input)) {
    cookie = input;
  }

  return { cookie, authorization };
}

export function readCapturedAuthInput(file = CAPTURED_AUTH_FILE) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return typeof parsed.authInput === "string" ? parsed.authInput : "";
  } catch {
    return "";
  }
}

export function writeExportDataFile(result, file = EXPORT_DATA_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const persisted = {
    generatedAt: new Date().toISOString(),
    source: {
      dataset: result.dataset,
      endpoint: result.endpoint,
      sort: result.sort,
      pageSize: result.pageSize,
      pages: Array.isArray(result.pages) ? result.pages.length : 0,
      itemCount: typeof result.itemCount === "number" ? result.itemCount : Array.isArray(result.items) ? result.items.length : 0,
      stoppedReason: result.stoppedReason,
    },
    pages: Array.isArray(result.pages) ? result.pages : [],
    items: Array.isArray(result.items) ? result.items : [],
  };
  fs.writeFileSync(file, JSON.stringify(persisted, null, 2), { mode: 0o600 });
  fs.chmodSync(file, 0o600);
  return file;
}

export async function fetchExportData(config, fetchImpl = globalThis.fetch) {
  const pageSize = positiveInt(config.pageSize, 200, 1, 1000);
  const maxPages = positiveInt(config.maxPages, 50, 1, 500);
  const authInput = await resolveAuthInput(config, fetchImpl);
  const pages = [];
  const items = [];

  for (let page = 0; page < maxPages; page += 1) {
    const request = buildExportPageRequest({
      ...config,
      authInput,
      page,
      pageSize,
    });
    const response = await fetchImpl(request.url, request.options);
    if (!response.ok) {
      throw new Error(`Export request failed on page ${page}: ${response.status} ${response.statusText}`);
    }

    const pageData = await response.json();
    const content = Array.isArray(pageData?.content) ? pageData.content : [];
    items.push(...content);
    pages.push({
      page,
      number: typeof pageData?.number === "number" ? pageData.number : page,
      size: typeof pageData?.size === "number" ? pageData.size : pageSize,
      numberOfElements: typeof pageData?.numberOfElements === "number" ? pageData.numberOfElements : content.length,
      first: Boolean(pageData?.first),
      last: Boolean(pageData?.last),
      empty: Boolean(pageData?.empty),
    });

    if (pageData?.last === true) {
      return buildResult(config, pageSize, pages, items, "last-page");
    }
  }

  return buildResult(config, pageSize, pages, items, "max-pages");
}

async function resolveAuthInput(config, fetchImpl) {
  if (String(config.authInput || config.cookie || "").trim()) {
    return String(config.authInput || config.cookie || "");
  }
  if (!config.username || !config.password) return "";

  const request = buildLoginRequest(config);
  const response = await fetchImpl(request.url, request.options);
  if (!response.ok) {
    const missing = [];
    if (!config.clientAuthorization) missing.push("Client Authorization");
    if (!config.workspace) missing.push("X-Workspace");
    const suffix = missing.length > 0 ? ` Missing/empty: ${missing.join(", ")}.` : "";
    throw new Error(`Login failed: ${response.status} ${response.statusText}.${suffix} Copy these headers from a successful Omnia login request or paste an active Cookie/Authorization header instead.`);
  }

  const json = await response.json();
  const authorization = json?.access_token ? `Bearer ${json.access_token}` : "";
  const cookie = extractSetCookieHeader(response.headers);
  return [
    cookie ? `Cookie: ${cookie}` : "",
    authorization ? `Authorization: ${authorization}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createServer(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  return http.createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/") {
        sendHtml(response, renderHtml());
        return;
      }

      if (request.method === "POST" && request.url === "/api/export") {
        const payload = await readJson(request);
        const normalizedPayload = normalizePayload(payload);
        const result = await fetchExportData(normalizedPayload, fetchImpl);
        const savedFile = writeExportDataFile(result, exportDataFileForDataset(normalizedPayload.dataset));
        sendJson(response, 200, {
          ...result,
          savedTo: path.relative(WORKSPACE_ROOT, savedFile),
        });
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      sendJson(response, 500, { error: safeErrorMessage(error) });
    }
  });
}

function buildResult(config, pageSize, pages, items, stoppedReason) {
  return {
    dataset: config.dataset || getExportPreset().id,
    endpoint: config.endpointPath || DEFAULT_ENDPOINT_PATH,
    sort: config.sort || "",
    pageSize,
    pages,
    items,
    itemCount: items.length,
    stoppedReason,
    generatedAt: new Date().toISOString(),
  };
}

function normalizePayload(payload) {
  const preset = getExportPreset(payload.dataset);
  const username = String(payload.username || "");
  const password = String(payload.password || "");
  const explicitAuthInput = String(payload.authInput || payload.cookie || "").trim();
  const authInput = explicitAuthInput || (username || password ? "" : readCapturedAuthInput());
  return {
    dataset: preset.id,
    baseUrl: String(payload.baseUrl || DEFAULT_BASE_URL),
    endpointPath: String(payload.endpointPath || preset.endpointPath),
    refererPath: String(payload.refererPath || preset.refererPath || DEFAULT_REFERER_PATH),
    sort: String(payload.sort ?? preset.sort ?? "").trim(),
    pageSize: positiveInt(payload.pageSize, 200, 1, 1000),
    maxPages: positiveInt(payload.maxPages, 50, 1, 500),
    authInput,
    realm: String(payload.realm || DEFAULT_REALM),
    username,
    password,
    workspace: String(payload.workspace || ""),
    clientAuthorization: String(payload.clientAuthorization || ""),
    body: parseBody(payload.body, preset.body),
  };
}

function parseBody(value, fallback = DEFAULT_EXPORT_BODY) {
  if (!value) return fallback;
  if (typeof value === "string") return JSON.parse(value);
  return value;
}

function positiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function unwrapHeaderLine(line) {
  return line
    .replace(/^curl\s+/i, "")
    .replace(/^-H\s+/i, "")
    .replace(/^--header\s+/i, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function looksLikeCookie(value) {
  return /^[^:=\s]+=[^;\r\n]*(?:;\s*[^:=\s]+=[^;\r\n]*)*$/.test(value);
}

function extractSetCookieHeader(headers) {
  const getSetCookie = headers?.getSetCookie?.();
  if (Array.isArray(getSetCookie) && getSetCookie.length > 0) {
    return getSetCookie.map((value) => value.split(";")[0]).join("; ");
  }

  const single = headers?.get?.("set-cookie");
  return single ? single.split(";")[0] : "";
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON request"));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  response.end(body);
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "content-length": Buffer.byteLength(html),
    "cache-control": "no-store",
  });
  response.end(html);
}

function renderHtml() {
  const defaultPreset = getExportPreset("articles");
  const defaultBody = JSON.stringify(defaultPreset.body, null, 2);
  const presetOptions = Object.values(EXPORT_PRESETS)
    .map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.label)}</option>`)
    .join("");
  const clientPresets = JSON.stringify(clientPresetConfig());
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Omnia Export Data Tester</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f2933;
      --muted: #5f6b7a;
      --line: #d8dde6;
      --accent: #0f766e;
      --accent-strong: #115e59;
      --warn: #8a5a00;
      --code: #111827;
      --soft: #edf7f5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      letter-spacing: 0;
    }
    header {
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      padding: 16px 24px;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      line-height: 1.2;
      font-weight: 650;
    }
    main {
      display: grid;
      grid-template-columns: minmax(360px, 440px) minmax(0, 1fr);
      gap: 16px;
      padding: 16px;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
    }
    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 650;
    }
    .form {
      display: grid;
      gap: 12px;
      padding: 16px;
    }
    label {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
    }
    input, select, textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 9px 10px;
      color: var(--text);
      background: #fff;
      font: inherit;
      letter-spacing: 0;
    }
    textarea {
      min-height: 86px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.45;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 2px;
    }
    button {
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 9px 12px;
      font: inherit;
      font-weight: 650;
      background: var(--accent);
      color: #fff;
      cursor: pointer;
    }
    button.secondary {
      background: #fff;
      border-color: var(--line);
      color: var(--text);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .hint {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .status {
      min-height: 22px;
      color: var(--muted);
    }
    .status.error { color: #9f1239; }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid var(--line);
      background: var(--soft);
    }
    .metric {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
    }
    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 4px;
    }
    .metric strong {
      font-size: 20px;
      line-height: 1;
    }
    .results {
      display: grid;
      gap: 12px;
      padding: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 12px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 8px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      color: var(--muted);
      font-weight: 650;
      background: #fafafa;
    }
    pre {
      margin: 0;
      max-height: 460px;
      overflow: auto;
      background: var(--code);
      color: #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    @media (max-width: 980px) {
      main { grid-template-columns: 1fr; }
      .summary { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
    }
  </style>
</head>
<body>
  <header>
    <h1>Omnia Export Data Tester</h1>
  </header>
  <main>
    <section>
      <div class="panel-header">
        <h2>Request</h2>
      </div>
      <div class="form">
        <label>Base URL
          <input id="baseUrl" value="${DEFAULT_BASE_URL}" spellcheck="false">
        </label>
        <label>Datenabruf
          <select id="dataset">${presetOptions}</select>
        </label>
        <label>Endpoint
          <input id="endpointPath" value="${defaultPreset.endpointPath}" spellcheck="false">
        </label>
        <label>Sortierung
          <input id="sort" value="${defaultPreset.sort}" spellcheck="false">
        </label>
        <div class="grid-2">
          <label>Page Size
            <input id="pageSize" type="number" min="1" max="1000" value="200">
          </label>
          <label>Max Pages
            <input id="maxPages" type="number" min="1" max="500" value="50">
          </label>
        </div>
        <label>Auth Header / Cookie
          <textarea id="authInput" placeholder="Cookie-Wert, Cookie:-Header, Authorization:-Header oder kopierte curl -H Zeilen einfuegen"></textarea>
        </label>
        <div class="hint">Wenn dieses Feld leer ist, nutzt der Server automatisch <code>tmp/omnia-export-auth.json</code>, sofern du sie mit <code>node tools/export-auth-browser.mjs</code> erzeugt hast.</div>
        <div id="savePathHint" class="hint"></div>
        <div class="hint">Alternativ: Direkt-Login. Falls der Login 401 liefert, braucht das Feld "Client Authorization" den Basic-Header aus einem echten Login-Request.</div>
        <div class="grid-2">
          <label>Mandant / Realm
            <input id="realm" value="${DEFAULT_REALM}" spellcheck="false">
          </label>
          <label>X-Workspace
            <input id="workspace" placeholder="optional" spellcheck="false">
          </label>
        </div>
        <label>Benutzername
          <input id="username" autocomplete="username" spellcheck="false">
        </label>
        <label>Passwort
          <input id="password" type="password" autocomplete="current-password">
        </label>
        <label>Client Authorization
          <input id="clientAuthorization" placeholder="optional, z.B. Basic ..." spellcheck="false">
        </label>
        <label>Body JSON
          <textarea id="bodyJson" spellcheck="false">${escapeHtml(defaultBody)}</textarea>
        </label>
        <div class="actions">
          <button id="runButton">Daten abrufen</button>
          <button id="downloadButton" class="secondary" disabled>JSON herunterladen</button>
        </div>
        <div id="status" class="status"></div>
        <div class="hint">Der Cookie wird nur an diesen lokalen Node-Prozess gesendet und nicht gespeichert. Die Ausgabe kann sensible Daten enthalten.</div>
      </div>
    </section>
    <section>
      <div class="panel-header">
        <h2>Antwortdaten</h2>
      </div>
      <div class="summary">
        <div class="metric"><span>Items</span><strong id="itemCount">0</strong></div>
        <div class="metric"><span>Pages</span><strong id="pageCount">0</strong></div>
        <div class="metric"><span>Stop</span><strong id="stoppedReason">-</strong></div>
        <div class="metric"><span>Preview</span><strong id="previewCount">0</strong></div>
      </div>
      <div class="results">
        <table>
          <thead><tr><th style="width: 90px;">Page</th><th style="width: 140px;">Items</th><th>Flags</th></tr></thead>
          <tbody id="pagesBody"><tr><td colspan="3">Noch kein Abruf.</td></tr></tbody>
        </table>
        <pre id="preview">{}</pre>
      </div>
    </section>
  </main>
  <script>
    let lastItems = null;
    let lastResult = null;
    const presets = ${clientPresets};

    const $ = (id) => document.getElementById(id);
    $("dataset").addEventListener("change", applyPreset);
    $("runButton").addEventListener("click", runExport);
    $("downloadButton").addEventListener("click", downloadJson);
    applyPreset();

    async function runExport() {
      setStatus("Abruf laeuft ...", false);
      $("runButton").disabled = true;
      $("downloadButton").disabled = true;
      try {
        const payload = {
          dataset: $("dataset").value,
          baseUrl: $("baseUrl").value.trim(),
          endpointPath: $("endpointPath").value.trim(),
          sort: $("sort").value.trim(),
          pageSize: Number($("pageSize").value),
          maxPages: Number($("maxPages").value),
          authInput: $("authInput").value.trim(),
          realm: $("realm").value.trim(),
          workspace: $("workspace").value.trim(),
          username: $("username").value.trim(),
          password: $("password").value,
          clientAuthorization: $("clientAuthorization").value.trim(),
          body: JSON.parse($("bodyJson").value),
        };
        const response = await fetch("/api/export", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Abruf fehlgeschlagen");
        renderResult(result);
        setStatus(result.savedTo ? "Abruf abgeschlossen. Gespeichert: " + result.savedTo : "Abruf abgeschlossen.", false);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error), true);
      } finally {
        $("runButton").disabled = false;
      }
    }

    function renderResult(result) {
      lastResult = result;
      lastItems = result.items || [];
      $("itemCount").textContent = String(result.itemCount || 0);
      $("pageCount").textContent = String((result.pages || []).length);
      $("stoppedReason").textContent = result.stoppedReason || "-";
      $("previewCount").textContent = String(Math.min(lastItems.length, 25));
      $("downloadButton").disabled = lastItems.length === 0;

      const rows = (result.pages || []).map((page) => {
        const flags = [
          page.first ? "first" : "",
          page.last ? "last" : "",
          page.empty ? "empty" : "",
        ].filter(Boolean).join(", ") || "-";
        return "<tr><td>" + escapeHtml(String(page.page)) + "</td><td>" + escapeHtml(String(page.numberOfElements)) + "</td><td>" + escapeHtml(flags) + "</td></tr>";
      });
      $("pagesBody").innerHTML = rows.length ? rows.join("") : '<tr><td colspan="3">Keine Seiten.</td></tr>';
      $("preview").textContent = JSON.stringify(lastItems.slice(0, 25), null, 2);
    }

    function downloadJson() {
      if (!lastItems) return;
      const blob = new Blob([JSON.stringify(lastItems, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = lastResult && lastResult.dataset === "orderProposals" ? "omnia-order-proposals-data.json" : "omnia-export-data.json";
      link.click();
      URL.revokeObjectURL(url);
    }

    function applyPreset() {
      const preset = presets[$("dataset").value] || presets.articles;
      $("endpointPath").value = preset.endpointPath;
      $("sort").value = preset.sort || "";
      $("bodyJson").value = JSON.stringify(preset.body, null, 2);
      $("runButton").textContent = preset.buttonLabel || "Daten abrufen";
      $("savePathHint").innerHTML = 'Ein erfolgreicher Abruf wird serverseitig unter <code>' + escapeHtml(preset.saveTo) + '</code> gespeichert.';
    }

    function setStatus(message, isError) {
      $("status").textContent = message;
      $("status").className = isError ? "status error" : "status";
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char]));
    }
  </script>
</body>
</html>`;
}

function clientPresetConfig() {
  return Object.fromEntries(
    Object.values(EXPORT_PRESETS).map((preset) => [
      preset.id,
      {
        label: preset.label,
        buttonLabel: preset.buttonLabel,
        endpointPath: preset.endpointPath,
        sort: preset.sort,
        body: preset.body,
        saveTo: path.relative(WORKSPACE_ROOT, preset.saveFile),
      },
    ]),
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function safeErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function isMainModule() {
  return process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
}

if (isMainModule()) {
  const port = positiveInt(process.env.PORT || process.argv[2], DEFAULT_PORT, 1, 65535);
  const server = createServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Export Data Tester: http://127.0.0.1:${port}`);
  });
}
