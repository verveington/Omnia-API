const RECORDER_STATE_KEY = "__OMNIA_VOICE_API_RECORDER__";

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

export function isApiUrl(url) {
  return String(url || "").includes("/apigateway/");
}

export function toPath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return String(url || "");
  }
}

export function normalizeApiPath(pathname) {
  const normalized = String(pathname || "")
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
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

export function redactHeaders(headers, { enabled = true } = {}) {
  if (!headers) return headers;

  const redacted = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = enabled && SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return redacted;
}

export function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function startApiRecording(page, options = {}) {
  stopApiRecording(page);

  const state = {
    active: true,
    startedAt: new Date().toISOString(),
    events: [],
    requestByRequest: new Map(),
    options,
  };

  state.onRequest = (request) => {
    const url = request.url();
    if (!isApiUrl(url)) return;

    const path = toPath(url);
    const record = {
      type: "request",
      time: new Date().toISOString(),
      method: request.method(),
      url,
      path,
      normalizedPath: normalizeApiPath(path),
      resourceType: request.resourceType?.() || "",
      headers: redactHeaders(request.headers(), { enabled: options.redactHeaders !== false }),
      postData: safeJson(request.postData?.()),
    };

    state.requestByRequest.set(request, record);
    state.events.push(record);
  };

  state.onResponse = (response) => {
    const url = response.url();
    if (!isApiUrl(url)) return;

    const request = response.request();
    const requestRecord = state.requestByRequest.get(request);
    const path = toPath(url);
    const headers = response.headers();
    const record = {
      type: "response",
      time: new Date().toISOString(),
      method: request.method(),
      url,
      path,
      normalizedPath: normalizeApiPath(path),
      status: response.status(),
      statusText: response.statusText?.() || "",
      contentType: headers["content-type"] || headers["Content-Type"] || "",
      responseHeaders: redactHeaders(headers, { enabled: options.redactHeaders !== false }),
      requestPostData: requestRecord?.postData ?? safeJson(request.postData?.()),
    };

    state.events.push(record);
    state.requestByRequest.delete(request);
  };

  state.onRequestFailed = (request) => {
    state.requestByRequest.delete(request);
  };

  page.on("request", state.onRequest);
  page.on("response", state.onResponse);
  page.on("requestfailed", state.onRequestFailed);
  page[RECORDER_STATE_KEY] = state;

  return snapshotApiRecording(page);
}

export function snapshotApiRecording(page) {
  const state = page?.[RECORDER_STATE_KEY];
  if (!state) {
    return {
      active: false,
      startedAt: null,
      eventCount: 0,
      events: [],
      observations: [],
    };
  }

  const events = [...state.events];
  return {
    active: Boolean(state.active),
    startedAt: state.startedAt,
    eventCount: events.length,
    events,
    observations: buildApiObservations(events),
  };
}

export function stopApiRecording(page) {
  const state = page?.[RECORDER_STATE_KEY];
  if (!state) {
    return {
      active: false,
      eventCount: 0,
      events: [],
      observations: [],
    };
  }

  page.off("request", state.onRequest);
  page.off("response", state.onResponse);
  page.off("requestfailed", state.onRequestFailed);
  state.active = false;
  const events = [...state.events];
  delete page[RECORDER_STATE_KEY];

  return {
    active: false,
    startedAt: state.startedAt,
    stoppedAt: new Date().toISOString(),
    eventCount: events.length,
    events,
    observations: buildApiObservations(events),
  };
}

export function buildApiObservations(events) {
  const byKey = new Map();

  for (const event of events || []) {
    if (event?.type !== "response") continue;

    const method = String(event.method || "").trim().toUpperCase();
    const path = String(event.normalizedPath || normalizeApiPath(event.path || toPath(event.url || ""))).trim();
    const status = Number(event.status);
    if (!method || !path || !Number.isInteger(status)) continue;

    const key = `${method}\0${path}\0${status}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.calls += 1;
      existing.lastSeenAt = maxTimestamp(existing.lastSeenAt, event.time || event.lastSeenAt);
      continue;
    }

    byKey.set(key, {
      method,
      path,
      status,
      calls: 1,
      lastSeenAt: event.time || event.lastSeenAt || null,
    });
  }

  return [...byKey.values()];
}

function maxTimestamp(left, right) {
  if (!left) return right || null;
  if (!right) return left;

  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return right > left ? right : left;
  return rightTime > leftTime ? right : left;
}
