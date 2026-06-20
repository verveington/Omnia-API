import { randomUUID } from "node:crypto";

export function createOmniaClient({
  baseUrl = process.env.OMNIA_API_BASE_URL || "https://api2.optica-omnia.de",
  fetchImpl = globalThis.fetch,
  timeoutMs = Number(process.env.OMNIA_API_TIMEOUT_MS || 15000),
  requestIdFactory = randomUUID,
} = {}) {
  if (!fetchImpl) {
    throw new Error("fetch is not available in this Node runtime");
  }

  async function request(session, { method = "GET", path, query, body }) {
    const normalizedMethod = method.toUpperCase();
    const requestId = requestIdFactory();
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = {
      accept: "application/json",
      "x-request-id": requestId,
    };

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    if (session?.omniaAccessToken) {
      headers.authorization = `Bearer ${session.omniaAccessToken}`;
    }

    const controller = new AbortController();
    let timeoutId;
    let timedOut = false;
    let fetchPromise;
    try {
      fetchPromise = Promise.resolve(
        fetchImpl(url, {
          method: normalizedMethod,
          headers,
          signal: controller.signal,
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      ).catch((error) => {
        if (timedOut) throw timeoutError({ method: normalizedMethod, path, requestId, timeoutMs });
        throw normalizeNetworkError(error, { method: normalizedMethod, path, requestId });
      });
    } catch (error) {
      throw normalizeNetworkError(error, { method: normalizedMethod, path, requestId });
    }

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(timeoutError({ method: normalizedMethod, path, requestId, timeoutMs }));
      }, timeoutMs);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]).finally(() => clearTimeout(timeoutId));

    const text = await response.text();
    const payload = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw normalizeGatewayError(response, payload, { method: normalizedMethod, path, requestId });
    }

    return payload;
  }

  return { request };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeGatewayError(response, payload, { method, path, requestId }) {
  const status = response.status || 502;
  const code = gatewayErrorCode(status);
  const error = new Error(errorMessage(payload, status, response.statusText));
  error.status = status;
  error.code = code;
  error.correlationId = payload?.correlationId || header(response, "x-correlation-id") || requestId;
  error.details = Array.isArray(payload?.details) ? payload.details : [];
  error.retryable = method === "GET" && status >= 500;
  error.path = path;
  error.method = method;
  return error;
}

function normalizeNetworkError(error, { method, path, requestId }) {
  if (error?.code) return error;
  const normalized = new Error("Gateway request failed before a response was received.");
  normalized.status = 502;
  normalized.code = "OMNIA_NETWORK_ERROR";
  normalized.correlationId = requestId;
  normalized.details = [];
  normalized.retryable = method === "GET";
  normalized.path = path;
  normalized.method = method;
  return normalized;
}

function timeoutError({ method, path, requestId, timeoutMs }) {
  const error = new Error(`Gateway request timed out after ${timeoutMs} ms.`);
  error.status = 504;
  error.code = "GATEWAY_TIMEOUT";
  error.correlationId = requestId;
  error.details = [];
  error.retryable = method === "GET";
  error.path = path;
  error.method = method;
  return error;
}

function gatewayErrorCode(status) {
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 404) return "NOT_FOUND";
  if (status === 400 || status === 422) return "VALIDATION_FAILED";
  if (status >= 500) return "OMNIA_INTERNAL_ERROR";
  return "OMNIA_GATEWAY_ERROR";
}

function errorMessage(payload, status, statusText) {
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return `Gateway request failed with status ${status}${statusText ? ` ${statusText}` : ""}.`;
}

function header(response, name) {
  return response.headers?.get?.(name) || null;
}
