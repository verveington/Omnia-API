import http from "node:http";
import { pathToFileURL } from "node:url";
import { createOmniaClient } from "./lib/omnia-client.mjs";
import { attachmentHeaders, createExportService } from "./lib/export-service.mjs";
import { createProcurementService } from "./lib/procurement-service.mjs";
import { createSessionStore } from "./lib/session-store.mjs";
import { createWorkflowService } from "./lib/workflow-service.mjs";
import {
  clearSessionCookie,
  parseCookies,
  publicSession,
  readJson,
  sendBuffer,
  sendJson,
  sendNoContent,
  sessionCookie,
} from "./lib/http-utils.mjs";

export function createCompanionServer({
  sessionStore = createSessionStore(),
  omniaClient = createOmniaClient(),
  procurementService = createProcurementService({ omniaClient }),
  workflowService = createWorkflowService({ omniaClient, procurementService }),
  exportService = createExportService(),
  allowedOrigin = process.env.COMPANION_ALLOWED_ORIGIN || "http://127.0.0.1:5173",
} = {}) {
  const deps = { sessionStore, workflowService, procurementService, exportService };

  return http.createServer(async (req, res) => {
    applyCorsHeaders(res, allowedOrigin);

    try {
      await route(req, res, deps);
    } catch (error) {
      const status = error.status || 500;
      sendJson(res, status, { error: normalizeError(error, status) });
      if (status === 500) {
        console.error(redactedLogError(error, status));
      }
    }
  });
}

export function startCompanionServer({ port = Number(process.env.COMPANION_API_PORT || 5174), host = "127.0.0.1" } = {}) {
  const server = createCompanionServer();
  server.listen(port, host, () => {
    console.log(`Omnia Companion BFF listening on http://${host}:${port}`);
  });
  return server;
}

async function route(req, res, { sessionStore, workflowService, procurementService, exportService }) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  if (req.method === "OPTIONS") {
    return sendNoContent(res);
  }

  if (!url.pathname.startsWith("/api/")) {
    return sendJson(res, 404, { error: createErrorPayload("NOT_FOUND", "Not found", 404) });
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "omnia-companion-bff",
      omniaBaseUrl: process.env.OMNIA_API_BASE_URL || "https://api2.optica-omnia.de",
      auth: process.env.OMNIA_DEV_BEARER_TOKEN ? "live-token-env" : "local-session",
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const omniaAccessToken = String(body.omniaToken || process.env.OMNIA_DEV_BEARER_TOKEN || "").trim();

    if (!username || (!password && !omniaAccessToken)) {
      return sendJson(res, 400, {
        error: createErrorPayload(
          "VALIDATION_FAILED",
          "Benutzername und Passwort oder Omnia-Token sind erforderlich.",
          400,
        ),
      });
    }

    const source = omniaAccessToken ? "live" : "mock";
    const session = sessionStore.createSession({
      username,
      password,
      displayName: body.displayName || username,
      workspace: body.workspace || "Lokaler Omnia Companion",
      source,
      omniaAccessToken,
    });

    return sendJson(
      res,
      200,
      {
        session: publicSession(session),
        mode: source === "live" ? "Live Omnia API" : "Lokaler Demo-Modus",
      },
      { "set-cookie": sessionCookie(session.id) },
    );
  }

  if (req.method === "GET" && url.pathname === "/api/auth/session") {
    const session = currentSession(req, sessionStore);
    if (!session) return sendJson(res, 200, { session: null });
    return sendJson(res, 200, { session: publicSession(session) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const cookies = parseCookies(req.headers.cookie || "");
    sessionStore.destroySession(cookies.oc_session);
    return sendJson(
      res,
      200,
      { ok: true },
      {
        "set-cookie": clearSessionCookie(),
      },
    );
  }

  const session = requireSession(req, sessionStore);

  if (req.method === "GET" && url.pathname === "/api/workflows/bootstrap") {
    return sendJson(res, 200, await workflowService.getBootstrap(session));
  }

  if (req.method === "GET" && url.pathname === "/api/cases") {
    return sendJson(res, 200, {
      data: await workflowService.searchCases(session, { keywords: url.searchParams.get("keywords") || "" }),
    });
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    return sendJson(res, 200, {
      data: await workflowService.searchOrders(session, { keywords: url.searchParams.get("keywords") || "" }),
    });
  }

  if (req.method === "GET" && url.pathname === "/api/goods-receipts") {
    return sendJson(res, 200, {
      data: await workflowService.searchGoodsReceipts(session, {
        orderNumber: url.searchParams.get("orderNumber") || "",
      }),
    });
  }

  if (req.method === "GET" && url.pathname === "/api/procurement/cases") {
    return sendJson(res, 200, { data: await procurementService.listCases(session) });
  }

  const caseMatch = url.pathname.match(/^\/api\/procurement\/cases\/([^/]+)$/);
  if (req.method === "GET" && caseMatch) {
    return sendJson(res, 200, { data: await procurementService.getCase(session, decodeURIComponent(caseMatch[1])) });
  }

  const caseExportMatch = url.pathname.match(/^\/api\/procurement\/cases\/([^/]+)\/export$/);
  if (req.method === "GET" && caseExportMatch) {
    const record = await procurementService.getCase(session, decodeURIComponent(caseExportMatch[1]));
    const file = await exportService.createCaseExport(record, exportFormat(url));
    return sendBuffer(res, 200, file.body, attachmentHeaders(file));
  }

  const supplierExportMatch = url.pathname.match(/^\/api\/procurement\/cases\/([^/]+)\/suppliers\/([^/]+)\/export$/);
  if (req.method === "GET" && supplierExportMatch) {
    const record = await procurementService.getCase(session, decodeURIComponent(supplierExportMatch[1]));
    const supplierExport = procurementService.getSupplierExport(record, decodeURIComponent(supplierExportMatch[2]));
    const file = await exportService.createSupplierExport(supplierExport, exportFormat(url));
    return sendBuffer(res, 200, file.body, attachmentHeaders(file));
  }

  const supplierOrderMatch = url.pathname.match(/^\/api\/procurement\/cases\/([^/]+)\/suppliers\/([^/]+)\/orders$/);
  if (req.method === "POST" && supplierOrderMatch) {
    const record = await procurementService.getCase(session, decodeURIComponent(supplierOrderMatch[1]));
    const result = await procurementService.createSupplierOrderDraft(
      session,
      record,
      decodeURIComponent(supplierOrderMatch[2]),
    );
    return sendJson(res, 201, { data: result });
  }

  return sendJson(res, 404, { error: createErrorPayload("NOT_FOUND", "Not found", 404) });
}

function exportFormat(url) {
  return url.searchParams.get("format") || "xlsx";
}

function currentSession(req, sessionStore) {
  const cookies = parseCookies(req.headers.cookie || "");
  return sessionStore.getSession(cookies.oc_session);
}

function requireSession(req, sessionStore) {
  const session = currentSession(req, sessionStore);
  if (!session) {
    const error = new Error("Nicht angemeldet");
    error.status = 401;
    error.code = "AUTH_REQUIRED";
    throw error;
  }
  return session;
}

function applyCorsHeaders(res, allowedOrigin) {
  for (const [name, value] of Object.entries(corsHeaders(allowedOrigin))) {
    res.setHeader(name, value);
  }
}

function corsHeaders(allowedOrigin) {
  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
  };
}

function normalizeError(error, status) {
  const code = error.code || (status === 500 ? "INTERNAL_ERROR" : "BFF_ERROR");
  return createErrorPayload(code, status === 500 && !error.code ? "Internal server error" : error.message, status, {
    correlationId: error.correlationId || null,
    retryable: Boolean(error.retryable),
    ...(error.details ? { details: error.details } : {}),
    ...(error.path ? { path: error.path } : {}),
    ...(error.method ? { method: error.method } : {}),
  });
}

function createErrorPayload(code, message, status, extra = {}) {
  return {
    code,
    message,
    status,
    correlationId: null,
    retryable: false,
    ...extra,
  };
}

function redactedLogError(error, status) {
  return {
    message: error.message,
    status,
    code: error.code || "INTERNAL_ERROR",
    correlationId: error.correlationId || null,
    path: error.path || null,
    method: error.method || null,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startCompanionServer();
}
