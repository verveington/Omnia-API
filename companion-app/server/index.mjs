import http from "node:http";
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

const port = Number(process.env.COMPANION_API_PORT || 5174);
const sessionStore = createSessionStore();
const omniaClient = createOmniaClient();
const workflowService = createWorkflowService({ omniaClient });
const procurementService = createProcurementService({ omniaClient });
const exportService = createExportService();

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    const status = error.status || 500;
    sendJson(res, status, {
      error: {
        message: status === 500 ? "Internal server error" : error.message,
        status,
      },
    });
    if (status === 500) {
      console.error(error);
    }
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Omnia Companion BFF listening on http://127.0.0.1:${port}`);
});

async function route(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  if (req.method === "OPTIONS") {
    return sendNoContent(res, corsHeaders());
  }

  if (!url.pathname.startsWith("/api/")) {
    return sendJson(res, 404, { error: { message: "Not found", status: 404 } });
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
        error: {
          message: "Benutzername und Passwort oder Omnia-Token sind erforderlich.",
          status: 400,
        },
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
    const session = currentSession(req);
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

  const session = requireSession(req);

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

  return sendJson(res, 404, { error: { message: "Not found", status: 404 } });
}

function exportFormat(url) {
  return url.searchParams.get("format") || "xlsx";
}

function currentSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return sessionStore.getSession(cookies.oc_session);
}

function requireSession(req) {
  const session = currentSession(req);
  if (!session) {
    const error = new Error("Nicht angemeldet");
    error.status = 401;
    throw error;
  }
  return session;
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "http://127.0.0.1:5173",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
  };
}
