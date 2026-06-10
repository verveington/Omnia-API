import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  REDACTED,
  redactBodyText,
  redactHeaders,
  redactRecord,
  redactText,
  redactUrl,
} from "./redact.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const DIAGNOSTIC_NAME_RE = /\b[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{2,}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{2,}\b/g;

export type RecorderOptions = {
  cdpEndpoint?: string;
  url?: string;
  useElectronStub?: boolean;
  headless?: boolean;
  outputFile?: string;
  maxBodyBytes?: number;
  captureBodies?: boolean;
  sessionId?: string;
};

export type Connection = {
  browser: any;
  context: any;
  page: any;
  close: () => Promise<void>;
};

export type AttachedRecorder = {
  logFile: string;
  sessionId: string;
  stop: () => void;
};

let requestCounter = 0;

export function parseCommonArgs(argv: string[]): RecorderOptions {
  const options: RecorderOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--cdp" && next) {
      options.cdpEndpoint = next;
      i += 1;
    } else if (arg === "--url" && next) {
      options.url = next;
      i += 1;
    } else if (arg === "--out" && next) {
      options.outputFile = next;
      i += 1;
    } else if (arg === "--max-body-bytes" && next) {
      options.maxBodyBytes = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--capture-bodies") {
      options.captureBodies = true;
    } else if (arg === "--no-bodies") {
      options.captureBodies = false;
    } else if (arg === "--stub") {
      options.useElectronStub = true;
    } else if (arg === "--headless") {
      options.headless = true;
    }
  }

  options.cdpEndpoint ||= process.env.OMNIA_CDP_ENDPOINT;
  options.url ||= process.env.OMNIA_URL || readDefaultOmniaUrl();
  options.maxBodyBytes ||= parsePositiveInt(process.env.OMNIA_MAX_BODY_BYTES, 256 * 1024);
  options.captureBodies = options.captureBodies ?? process.env.OMNIA_CAPTURE_BODIES !== "0";
  options.useElectronStub = options.useElectronStub ?? process.env.OMNIA_USE_ELECTRON_STUB === "1";

  return options;
}

export async function connectOrLaunchPage(options: RecorderOptions): Promise<Connection> {
  const { chromium } = await loadPlaywright();

  if (options.cdpEndpoint) {
    const browser = await chromium.connectOverCDP(options.cdpEndpoint);
    const context = browser.contexts()[0];
    if (!context) throw new Error(`CDP verbunden, aber kein BrowserContext gefunden: ${options.cdpEndpoint}`);

    const page = await firstUsablePage(context);
    return {
      browser,
      context,
      page,
      close: async () => browser.close().catch(() => {}),
    };
  }

  const browser = await chromium.launch({
    headless: Boolean(options.headless),
    args: ["--window-size=1440,900"],
  });
  const contextOptions: Record<string, unknown> = {
    viewport: { width: 1440, height: 820 },
    ignoreHTTPSErrors: true,
    serviceWorkers: "block",
  };

  const context = await browser.newContext(contextOptions);

  if (options.useElectronStub) {
    await installElectronStub(context, options.url || "");
  }

  const page = await context.newPage();
  await page.goto(options.url || "about:blank", { waitUntil: "domcontentloaded" });

  return {
    browser,
    context,
    page,
    close: async () => browser.close().catch(() => {}),
  };
}

export function createNetworkLogPath(date = new Date()): string {
  const dir = path.join(workspaceRoot, "logs", "network");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${formatLocalTimestamp(date)}-session.jsonl`);
}

export function attachNetworkLogger(
  page: any,
  options: RecorderOptions & { getCurrentStep?: () => string | null } = {},
): AttachedRecorder {
  const logFile = options.outputFile ? path.resolve(options.outputFile) : createNetworkLogPath();
  fs.mkdirSync(path.dirname(logFile), { recursive: true });

  const sessionId = options.sessionId || path.basename(logFile, ".jsonl");
  const maxBodyBytes = options.maxBodyBytes || 256 * 1024;
  const requestIds = new WeakMap<object, string>();
  const requestSteps = new WeakMap<object, string | null>();

  const write = (record: Record<string, unknown>) => appendJsonLine(logFile, redactRecord(record));

  const onRequest = (request: any) => {
    void (async () => {
      const requestId = nextRequestId();
      requestIds.set(request, requestId);
      requestSteps.set(request, options.getCurrentStep?.() || null);

      const headers = await safeAllHeaders(request);
      const contentType = headerValue(headers, "content-type");
      const postData = request.postData?.() || null;

      write({
        type: "request",
        sessionId,
        requestId,
        step: requestSteps.get(request),
        timestamp: new Date().toISOString(),
        method: request.method?.() || "",
        url: redactUrl(request.url?.() || ""),
        resourceType: request.resourceType?.() || "",
        headers: redactHeaders(headers),
        body: postData ? redactBodyText(postData, contentType) : null,
      });
    })().catch((error) => {
      write({
        type: "recorder-error",
        sessionId,
        timestamp: new Date().toISOString(),
        phase: "request",
        message: errorMessage(error),
      });
    });
  };

  const onResponse = (response: any) => {
    void (async () => {
      const request = response.request?.();
      const requestId = request ? requestIds.get(request) || nextRequestId() : nextRequestId();
      const headers = await safeAllHeaders(response);
      const contentType = headerValue(headers, "content-type");

      const record: Record<string, unknown> = {
        type: "response",
        sessionId,
        requestId,
        step: request ? requestSteps.get(request) || null : null,
        timestamp: new Date().toISOString(),
        method: request?.method?.() || "",
        url: redactUrl(response.url?.() || ""),
        status: response.status?.() || 0,
        statusText: response.statusText?.() || "",
        resourceType: request?.resourceType?.() || "",
        headers: redactHeaders(headers),
      };

      if (options.captureBodies !== false && isTextualContent(contentType)) {
        const body = await safeResponseText(response, maxBodyBytes);
        Object.assign(record, body);
      } else {
        record.body = null;
        record.bodyOmittedReason = options.captureBodies === false ? "disabled" : "non-textual-content-type";
      }

      write(record);
    })().catch((error) => {
      write({
        type: "recorder-error",
        sessionId,
        timestamp: new Date().toISOString(),
        phase: "response",
        message: errorMessage(error),
      });
    });
  };

  const onRequestFailed = (request: any) => {
    write({
      type: "requestfailed",
      sessionId,
      requestId: requestIds.get(request) || nextRequestId(),
      step: requestSteps.get(request) || null,
      timestamp: new Date().toISOString(),
      method: request.method?.() || "",
      url: redactUrl(request.url?.() || ""),
      resourceType: request.resourceType?.() || "",
      failure: request.failure?.()?.errorText || "unknown",
    });
  };

  const onWebSocket = (ws: any) => {
    const websocketId = nextRequestId("ws");
    write({
      type: "websocket-open",
      sessionId,
      websocketId,
      step: options.getCurrentStep?.() || null,
      timestamp: new Date().toISOString(),
      url: redactUrl(ws.url?.() || ""),
    });

    ws.on?.("framesent", (frame: { payload?: unknown }) => {
      writeWebSocketFrame(write, sessionId, websocketId, "websocket-frame-sent", frame, options.getCurrentStep);
    });
    ws.on?.("framereceived", (frame: { payload?: unknown }) => {
      writeWebSocketFrame(write, sessionId, websocketId, "websocket-frame-received", frame, options.getCurrentStep);
    });
    ws.on?.("close", () => {
      write({
        type: "websocket-close",
        sessionId,
        websocketId,
        step: options.getCurrentStep?.() || null,
        timestamp: new Date().toISOString(),
      });
    });
  };

  const onDownload = (download: any) => {
    const suggestedFilename = safeSuggestedFilename(download);
    write({
      type: "download",
      sessionId,
      downloadId: nextRequestId("download"),
      step: options.getCurrentStep?.() || null,
      timestamp: new Date().toISOString(),
      url: redactUrl(download.url?.() || ""),
      suggestedFilename,
      suggestedFileExtension: fileExtension(suggestedFilename),
    });
  };

  const onFrameNavigated = (frame: any) => {
    if (!isMainFrame(frame, page)) return;
    write({
      type: "navigation",
      sessionId,
      step: options.getCurrentStep?.() || null,
      timestamp: new Date().toISOString(),
      url: redactUrl(frame.url?.() || page.url?.() || ""),
    });
  };

  const onConsole = (message: any) => {
    write({
      type: "browser-console",
      sessionId,
      step: options.getCurrentStep?.() || null,
      timestamp: new Date().toISOString(),
      level: safeConsoleType(message),
      text: redactDiagnosticText(safeConsoleText(message)),
      location: safeConsoleLocation(message),
    });
  };

  const onPageError = (error: unknown) => {
    write({
      type: "browser-pageerror",
      sessionId,
      step: options.getCurrentStep?.() || null,
      timestamp: new Date().toISOString(),
      message: redactDiagnosticText(errorMessage(error)),
      stack: redactDiagnosticText(error instanceof Error && error.stack ? error.stack : ""),
    });
  };

  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);
  page.on("websocket", onWebSocket);
  page.on("download", onDownload);
  page.on("framenavigated", onFrameNavigated);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  appendMarker(logFile, {
    type: "session-start",
    sessionId,
    timestamp: new Date().toISOString(),
    url: redactUrl(page.url?.() || ""),
  });

  return {
    logFile,
    sessionId,
    stop: () => {
      page.off("request", onRequest);
      page.off("response", onResponse);
      page.off("requestfailed", onRequestFailed);
      page.off("websocket", onWebSocket);
      page.off("download", onDownload);
      page.off("framenavigated", onFrameNavigated);
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      appendMarker(logFile, {
        type: "session-stop",
        sessionId,
        timestamp: new Date().toISOString(),
      });
    },
  };
}

export function appendMarker(logFile: string, marker: Record<string, unknown>): void {
  appendJsonLine(logFile, redactRecord(marker));
}

export async function waitForSettledNetwork(page: any, timeoutMs = 1500): Promise<void> {
  await page.waitForLoadState?.("networkidle", { timeout: timeoutMs }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, Math.min(timeoutMs, 1500)));
}

async function loadPlaywright(): Promise<any> {
  try {
    const module = await import("playwright");
    return module.chromium ? module : module.default;
  } catch {
    const module = await import("../playwright-recorder/node_modules/playwright/index.js");
    return module.chromium ? module : module.default;
  }
}

async function firstUsablePage(context: any): Promise<any> {
  const existing = context.pages().find((page: any) => !String(page.url()).startsWith("devtools://"));
  if (existing) return existing;
  const page = await context.waitForEvent("page", { timeout: 15000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  return page;
}

async function installElectronStub(context: any, apiUrl: string): Promise<void> {
  const stubPath = path.join(workspaceRoot, "playwright-recorder", "src", "electron-ipc-stub.js");
  if (!fs.existsSync(stubPath)) return;

  const stubScript = fs.readFileSync(stubPath, "utf8");
  const stubConfig = {
    url: apiUrl,
    version: process.env.OMNIA_APP_VERSION || "analysis-0.0.0",
    machineId: process.env.OMNIA_MACHINE_ID || "",
    tenantId: process.env.OMNIA_TENANT_ID || "",
  };
  await context.addInitScript({
    content: `window.__OMNIA_STUB__ = ${JSON.stringify(stubConfig)};\n${stubScript}`,
  });
}

async function safeAllHeaders(target: any): Promise<Record<string, string>> {
  try {
    if (target.allHeaders) return await target.allHeaders();
  } catch {
    // fall through
  }
  try {
    return target.headers?.() || {};
  } catch {
    return {};
  }
}

async function safeResponseText(response: any, maxBodyBytes: number): Promise<Record<string, unknown>> {
  try {
    const body = await response.body();
    if (!body || body.length === 0) return { body: null };
    const contentType = headerValue(await safeAllHeaders(response), "content-type");
    if (body.length > maxBodyBytes) {
      if (contentType.toLowerCase().includes("json")) {
        return {
          body: truncateJsonForLog(redactBodyText(body.toString("utf8"), contentType)),
          bodyTruncated: true,
          bodyOmittedReason: "body-truncated-json",
          bodySize: body.length,
        };
      }

      return {
        body: null,
        bodyOmittedReason: `body-too-large:${body.length}`,
        bodySize: body.length,
      };
    }

    return {
      body: redactBodyText(body.toString("utf8"), contentType),
      bodySize: body.length,
    };
  } catch (error) {
    return {
      body: null,
      bodyOmittedReason: `unavailable:${errorMessage(error)}`,
    };
  }
}

function truncateJsonForLog(value: unknown, maxArrayItems = 5, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, maxArrayItems).map((item) => truncateJsonForLog(item, maxArrayItems, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = truncateJsonForLog(child, maxArrayItems, seen);
  }
  return out;
}

function writeWebSocketFrame(
  write: (record: Record<string, unknown>) => void,
  sessionId: string,
  websocketId: string,
  type: string,
  frame: { payload?: unknown },
  getCurrentStep?: () => string | null,
): void {
  write({
    type,
    sessionId,
    websocketId,
    step: getCurrentStep?.() || null,
    timestamp: new Date().toISOString(),
    payload: redactBodyText(String(frame?.payload ?? ""), "text/plain"),
  });
}

function appendJsonLine(file: string, data: unknown): void {
  fs.appendFileSync(file, `${JSON.stringify(data)}\n`);
}

function isTextualContent(contentType: string): boolean {
  const value = contentType.toLowerCase();
  return (
    value.startsWith("text/") ||
    value.includes("json") ||
    value.includes("xml") ||
    value.includes("graphql") ||
    value.includes("x-www-form-urlencoded")
  );
}

function headerValue(headers: Record<string, unknown>, name: string): string {
  const direct = headers[name];
  if (typeof direct === "string") return direct;
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return typeof match?.[1] === "string" ? match[1] : "";
}

function nextRequestId(prefix = "req"): string {
  requestCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${requestCounter.toString(36)}`;
}

function safeSuggestedFilename(download: any): string {
  try {
    return download.suggestedFilename?.() || "";
  } catch {
    return "";
  }
}

function fileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function isMainFrame(frame: any, page: any): boolean {
  try {
    if (typeof frame.parentFrame === "function") return frame.parentFrame() === null;
  } catch {
    return false;
  }
  try {
    return typeof page.mainFrame === "function" ? frame === page.mainFrame() : true;
  } catch {
    return true;
  }
}

function safeConsoleType(message: any): string {
  try {
    return String(message.type?.() || "console");
  } catch {
    return "console";
  }
}

function safeConsoleText(message: any): string {
  try {
    return String(message.text?.() || "");
  } catch {
    return "";
  }
}

function safeConsoleLocation(message: any): Record<string, unknown> {
  try {
    const location = message.location?.() || {};
    return {
      url: redactUrl(String(location.url || "")),
      lineNumber: Number.isFinite(Number(location.lineNumber)) ? Number(location.lineNumber) : undefined,
      columnNumber: Number.isFinite(Number(location.columnNumber)) ? Number(location.columnNumber) : undefined,
    };
  } catch {
    return {};
  }
}

function redactDiagnosticText(value: unknown): string {
  return trimDiagnostic(redactText(value).replace(DIAGNOSTIC_NAME_RE, REDACTED));
}

function trimDiagnostic(value: string, limit = 4000): string {
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function formatLocalTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${min}`;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readDefaultOmniaUrl(): string {
  const envPath = path.join(workspaceRoot, "environment.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(envPath, "utf8"));
    return parsed.url || "https://api2.optica-omnia.de";
  } catch {
    return "https://api2.optica-omnia.de";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
