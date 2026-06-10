# Omnia Voice Chat Platform Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Convert the existing native-CDP voice panel into a chat-first local Omnia assistant that can run with or without a connected Omnia app, blocks risky stage-1 actions with explicit confirmation, and records UI plus API learning signals.

**Architecture:** Keep the current `playwright-recorder` Node HTTP server and plain HTML panel, but split connection state and API recording into focused testable modules. The server starts first, Omnia becomes an explicit runtime connection state, and the browser UI drives all conversation, learning, connection, and confirmation flows through local JSON endpoints.

**Tech Stack:** Node.js ESM, Node test runner, Playwright CDP, plain HTML/CSS/JS in `createVoicePanelHtml()`, Ollama/OpenAI-compatible local chat completions, JSON catalog files under `playwright-recorder/captures/`.

---

## File Structure

- Create `playwright-recorder/src/native-cdp-omnia-connection.js`: pure helpers for Omnia connection modes, disconnected page summaries, status payloads, and disconnected action responses.
- Create `playwright-recorder/src/native-cdp-omnia-connection.test.js`: unit coverage for mode normalization, status payloads, and disconnected responses.
- Create `playwright-recorder/src/native-cdp-api-recorder.js`: Playwright request/response listeners for `/apigateway/`, redaction, normalized paths, snapshots, and compact catalog observations.
- Create `playwright-recorder/src/native-cdp-api-recorder.test.js`: unit coverage for API filtering, path normalization, redaction, and event summarization.
- Modify `playwright-recorder/src/native-cdp-command-catalog.js`: preserve `executor`, `safety`, `context`, and `apiObservations` metadata on learned entries.
- Modify `playwright-recorder/src/native-cdp-command-catalog.test.js`: assert metadata merge behavior.
- Modify `playwright-recorder/src/native-cdp-learning-session.js`: accept `snapshot.apiEvents`, correlate them with newly learned UI suggestions, and store API observations in the catalog.
- Modify `playwright-recorder/src/native-cdp-learning-session.test.js`: assert UI/API correlation and unchanged incremental learning.
- Modify `playwright-recorder/src/native-cdp-conversation.js`: include connection state in the model prompt and expose confirmable risky commands consistently.
- Modify `playwright-recorder/src/native-cdp-conversation.test.js`: assert disconnected context appears in prompts and risky commands remain confirmable.
- Modify `playwright-recorder/src/native-cdp-voice-server.js`: start the HTTP server before Omnia connection, add `/api/omnia/connect` and `/api/omnia/disconnect`, gate UI-only actions when disconnected, and run API recording alongside UI recording.
- Modify `playwright-recorder/src/native-cdp-voice-ui.js`: replace command-console layout with chat-first UI, connection controls, learned-command drawer, and confirmation cards.
- Modify `playwright-recorder/src/native-cdp-voice-ui.test.js`: assert chat markup, endpoint wiring, voice/text parity, confirmation execution, and connection controls.
- Modify `playwright-recorder/README.md`: document chat panel startup, local model config, Omnia modes, confirmation behavior, and UI/API learning.

## Task 1: Add Omnia Connection State Helpers

**Files:**
- Create: `playwright-recorder/src/native-cdp-omnia-connection.js`
- Create: `playwright-recorder/src/native-cdp-omnia-connection.test.js`

- [x] **Step 1: Write failing tests for connection modes and disconnected status**

Create `playwright-recorder/src/native-cdp-omnia-connection.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  createDisconnectedPageSummary,
  createOmniaConnectionState,
  disconnectedActionResult,
  normalizeOmniaMode,
  serializeOmniaStatus,
} from "./native-cdp-omnia-connection.js";

test("normalizeOmniaMode accepts stage-1 connection modes", () => {
  assert.equal(normalizeOmniaMode("launch"), "launch");
  assert.equal(normalizeOmniaMode("attach"), "attach");
  assert.equal(normalizeOmniaMode("none"), "none");
  assert.equal(normalizeOmniaMode("bad-value"), "none");
  assert.equal(normalizeOmniaMode(undefined), "none");
});

test("createOmniaConnectionState defaults to disconnected no-local-app mode", () => {
  const state = createOmniaConnectionState();

  assert.equal(state.mode, "none");
  assert.equal(state.connected, false);
  assert.equal(state.connecting, false);
  assert.equal(state.page, null);
  assert.equal(state.browser, null);
});

test("serializeOmniaStatus is safe when Omnia is not connected", () => {
  const status = serializeOmniaStatus(createOmniaConnectionState(), {
    ai: { model: "qwen2.5:7b", endpoint: "http://127.0.0.1:11434/v1/chat/completions" },
    learning: { active: false, eventCount: 0, apiEventCount: 0 },
  });

  assert.equal(status.ok, true);
  assert.deepEqual(status.omnia, {
    mode: "none",
    connected: false,
    connecting: false,
    href: "",
    title: "",
    lastError: "",
  });
  assert.equal(status.ai.model, "qwen2.5:7b");
  assert.equal(status.learning.apiEventCount, 0);
});

test("createDisconnectedPageSummary gives the model explicit no-ui context", () => {
  const summary = createDisconnectedPageSummary("Omnia ist nicht verbunden.");

  assert.equal(summary.connected, false);
  assert.equal(summary.href, "");
  assert.match(summary.title, /Omnia nicht verbunden/);
  assert.match(summary.connectionMessage, /nicht verbunden/);
});

test("disconnectedActionResult explains that UI execution needs Omnia", () => {
  const result = disconnectedActionResult("gehe zu Dashboard");

  assert.equal(result.ok, true);
  assert.equal(result.executed, false);
  assert.equal(result.requiresConnection, true);
  assert.match(result.message, /Omnia ist nicht verbunden/);
  assert.equal(result.command, "gehe zu Dashboard");
});
```

- [x] **Step 2: Run the new test and verify it fails**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-omnia-connection.test.js
```

Expected: FAIL with a module-not-found error for `native-cdp-omnia-connection.js`.

- [x] **Step 3: Implement connection helper module**

Create `playwright-recorder/src/native-cdp-omnia-connection.js`:

```js
const OMNIA_MODES = new Set(["launch", "attach", "none"]);

export function normalizeOmniaMode(mode) {
  const normalized = String(mode || "none").trim().toLowerCase();
  return OMNIA_MODES.has(normalized) ? normalized : "none";
}

export function createOmniaConnectionState(seed = {}) {
  return {
    mode: normalizeOmniaMode(seed.mode),
    connected: Boolean(seed.connected),
    connecting: Boolean(seed.connecting),
    href: seed.href || "",
    title: seed.title || "",
    lastError: seed.lastError || "",
    browser: seed.browser || null,
    page: seed.page || null,
    skipNativeCleanup: Boolean(seed.skipNativeCleanup),
  };
}

export function serializeOmniaStatus(state, extras = {}) {
  const current = createOmniaConnectionState(state);
  return {
    ok: true,
    omnia: {
      mode: current.mode,
      connected: Boolean(current.connected && current.page && !current.page.isClosed?.()),
      connecting: current.connecting,
      href: current.href,
      title: current.title,
      lastError: current.lastError,
    },
    ai: extras.ai || {},
    learning: extras.learning || {},
  };
}

export function createDisconnectedPageSummary(message = "Omnia ist nicht verbunden.") {
  return {
    ok: true,
    connected: false,
    href: "",
    title: "Omnia nicht verbunden",
    readyState: "disconnected",
    buttonCount: 0,
    linkCount: 0,
    tabCount: 0,
    inputCount: 0,
    connectionMessage: message,
  };
}

export function disconnectedActionResult(command = "") {
  return {
    ok: true,
    executed: false,
    requiresConnection: true,
    command: String(command || "").trim(),
    message: "Omnia ist nicht verbunden. Ich kann den Befehl erkennen, aber keine echte UI-Aktion ausfuehren, bis du Omnia lokal startest oder anhaengst.",
  };
}
```

- [x] **Step 4: Run the helper test and commit**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-omnia-connection.test.js
```

Expected: PASS.

Commit:

```bash
git add src/native-cdp-omnia-connection.js src/native-cdp-omnia-connection.test.js
git commit -m "Add Omnia connection state helpers"
```

## Task 2: Preserve Executor, Safety, Context, And API Metadata In Catalog

**Files:**
- Modify: `playwright-recorder/src/native-cdp-command-catalog.js`
- Modify: `playwright-recorder/src/native-cdp-command-catalog.test.js`

- [x] **Step 1: Add failing catalog metadata tests**

Append to `playwright-recorder/src/native-cdp-command-catalog.test.js`:

```js
test("mergeSuggestionsIntoCatalog preserves executor safety context and API observations", () => {
  const catalog = mergeSuggestionsIntoCatalog(buildCommandCatalog(), [
    {
      command: "gehe zu Dashboard",
      reason: "Navigation per Link",
      executor: "hybrid",
      safety: "safe",
      context: { route: "/dashboard", source: "learning" },
      apiObservations: [
        { method: "GET", path: "/apigateway/dashboardservice/cards", status: 200, calls: 1, lastSeenAt: "2026-05-17T10:00:00.000Z" },
      ],
    },
    {
      command: "gehe zu Dashboard",
      reason: "Navigation per Link",
      executor: "hybrid",
      apiObservations: [
        { method: "GET", path: "/apigateway/dashboardservice/cards", status: 200, calls: 2, lastSeenAt: "2026-05-17T10:00:03.000Z" },
        { method: "POST", path: "/apigateway/auditservice/events", status: 204, calls: 1, lastSeenAt: "2026-05-17T10:00:04.000Z" },
      ],
    },
  ], { now: "2026-05-17T10:00:05.000Z" });

  assert.equal(catalog.commands.length, 1);
  assert.equal(catalog.commands[0].executor, "hybrid");
  assert.equal(catalog.commands[0].safety, "safe");
  assert.deepEqual(catalog.commands[0].context, { route: "/dashboard", source: "learning" });
  assert.deepEqual(catalog.commands[0].apiObservations, [
    { method: "GET", path: "/apigateway/dashboardservice/cards", status: 200, calls: 3, lastSeenAt: "2026-05-17T10:00:03.000Z" },
    { method: "POST", path: "/apigateway/auditservice/events", status: 204, calls: 1, lastSeenAt: "2026-05-17T10:00:04.000Z" },
  ]);
});
```

- [x] **Step 2: Run the catalog test and verify it fails**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-command-catalog.test.js
```

Expected: FAIL because `executor`, `safety`, `context`, and `apiObservations` are not preserved.

- [x] **Step 3: Extend catalog merge and normalization**

In `playwright-recorder/src/native-cdp-command-catalog.js`, update the merge block inside `mergeSuggestionsIntoCatalog()` so existing entries merge metadata:

```js
const merged = {
  ...existing.entry,
  count: existing.entry.count + 1,
  lastSeenAt: now,
  reasons: mergeUnique(existing.entry.reasons, descriptor.reasons),
  aliases: mergeUnique(existing.entry.aliases, descriptor.aliases),
  keys: mergeUnique(existing.entry.keys, descriptor.keys),
  executor: mergeExecutor(existing.entry.executor, descriptor.executor),
  safety: mergeSafety(existing.entry.safety, descriptor.safety),
  context: { ...existing.entry.context, ...descriptor.context },
  apiObservations: mergeApiObservations(existing.entry.apiObservations, descriptor.apiObservations),
};
```

Add these helper functions near `mergeUnique()`:

```js
function mergeExecutor(left, right) {
  if (left === "hybrid" || right === "hybrid") return "hybrid";
  if (left === "api" && right === "ui") return "hybrid";
  if (left === "ui" && right === "api") return "hybrid";
  return right || left || "ui";
}

function mergeSafety(left, right) {
  const rank = { safe: 1, confirm: 2, blocked: 3 };
  const leftRank = rank[left] || 1;
  const rightRank = rank[right] || 1;
  return leftRank >= rightRank ? (left || "safe") : right;
}

function mergeApiObservations(left, right) {
  const byKey = new Map();
  for (const observation of [...(left || []), ...(right || [])].map(normalizeApiObservation).filter(Boolean)) {
    const key = `${observation.method} ${observation.path} ${observation.status}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, observation);
      continue;
    }
    byKey.set(key, {
      ...current,
      calls: current.calls + observation.calls,
      lastSeenAt: observation.lastSeenAt > current.lastSeenAt ? observation.lastSeenAt : current.lastSeenAt,
    });
  }
  return [...byKey.values()].slice(0, 12);
}

function normalizeApiObservation(observation) {
  const method = String(observation?.method || "").toUpperCase();
  const path = String(observation?.path || "").trim();
  const status = Number(observation?.status || 0);
  if (!method || !path) return null;
  return {
    method,
    path,
    status,
    calls: Number.isInteger(observation.calls) && observation.calls > 0 ? observation.calls : 1,
    lastSeenAt: observation.lastSeenAt || null,
  };
}
```

In `normalizeEntry()`, add the returned metadata fields:

```js
executor: ["ui", "api", "hybrid"].includes(entry.executor) ? entry.executor : "ui",
safety: ["safe", "confirm", "blocked"].includes(entry.safety) ? entry.safety : "safe",
context: entry.context && typeof entry.context === "object" && !Array.isArray(entry.context) ? { ...entry.context } : {},
apiObservations: mergeApiObservations([], entry.apiObservations),
```

- [x] **Step 4: Run catalog tests and commit**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-command-catalog.test.js
```

Expected: PASS.

Commit:

```bash
git add src/native-cdp-command-catalog.js src/native-cdp-command-catalog.test.js
git commit -m "Preserve command catalog API metadata"
```

## Task 3: Add API Recorder And UI/API Correlation

**Files:**
- Create: `playwright-recorder/src/native-cdp-api-recorder.js`
- Create: `playwright-recorder/src/native-cdp-api-recorder.test.js`
- Modify: `playwright-recorder/src/native-cdp-learning-session.js`
- Modify: `playwright-recorder/src/native-cdp-learning-session.test.js`

- [x] **Step 1: Write failing API recorder tests**

Create `playwright-recorder/src/native-cdp-api-recorder.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildApiObservations,
  isApiUrl,
  normalizeApiPath,
  redactHeaders,
  safeJson,
} from "./native-cdp-api-recorder.js";

test("isApiUrl only keeps Omnia apigateway traffic", () => {
  assert.equal(isApiUrl("https://api2.optica-omnia.de/apigateway/dashboard/cards"), true);
  assert.equal(isApiUrl("https://api2.optica-omnia.de/assets/main.js"), false);
});

test("normalizeApiPath replaces volatile ids", () => {
  assert.equal(
    normalizeApiPath("/apigateway/customerservice/customers/12345/orders/18"),
    "/apigateway/customerservice/customers/{id}/orders/{id}",
  );
  assert.equal(
    normalizeApiPath("/apigateway/customerservice/customers/7f7b27b6-12a2-4da1-bf1a-6c3e0db1a111"),
    "/apigateway/customerservice/customers/{uuid}",
  );
});

test("redactHeaders masks sensitive values", () => {
  assert.deepEqual(redactHeaders({
    authorization: "Bearer secret",
    cookie: "a=b",
    "content-type": "application/json",
  }), {
    authorization: "[REDACTED]",
    cookie: "[REDACTED]",
    "content-type": "application/json",
  });
});

test("safeJson parses JSON and keeps non-json strings", () => {
  assert.deepEqual(safeJson("{\"a\":1}"), { a: 1 });
  assert.equal(safeJson("plain"), "plain");
  assert.equal(safeJson(""), null);
});

test("buildApiObservations summarizes response events for a catalog entry", () => {
  const observations = buildApiObservations([
    { type: "request", method: "GET", normalizedPath: "/apigateway/dashboard/cards", time: "2026-05-17T10:00:00.000Z" },
    { type: "response", method: "GET", normalizedPath: "/apigateway/dashboard/cards", status: 200, time: "2026-05-17T10:00:01.000Z" },
    { type: "response", method: "GET", normalizedPath: "/apigateway/dashboard/cards", status: 200, time: "2026-05-17T10:00:03.000Z" },
  ]);

  assert.deepEqual(observations, [
    { method: "GET", path: "/apigateway/dashboard/cards", status: 200, calls: 2, lastSeenAt: "2026-05-17T10:00:03.000Z" },
  ]);
});
```

- [x] **Step 2: Run the API recorder test and verify it fails**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-api-recorder.test.js
```

Expected: FAIL with a module-not-found error for `native-cdp-api-recorder.js`.

- [x] **Step 3: Implement API recorder module**

Create `playwright-recorder/src/native-cdp-api-recorder.js`:

```js
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
    return String(url || "").split(/[?#]/, 1)[0];
  }
}

export function normalizeApiPath(pathname) {
  return String(pathname || "")
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (UUID_RE.test(segment)) return "{uuid}";
      if (NUMERIC_RE.test(segment)) return "{id}";
      return segment;
    })
    .join("/")
    .replace(
      /\/apigateway\/articletenantservice\/articles\/search\/[^/]+$/,
      "/apigateway/articletenantservice/articles/search/{id}",
    );
}

export function redactHeaders(headers, { enabled = true } = {}) {
  if (!headers) return headers;
  const output = {};
  for (const [key, value] of Object.entries(headers)) {
    output[key] = enabled && SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return output;
}

export function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function startApiRecording(page, options = {}) {
  await stopApiRecording(page).catch(() => {});
  const state = {
    active: true,
    startedAt: new Date().toISOString(),
    events: [],
    requestByObject: new Map(),
  };

  state.onRequest = (request) => {
    const url = request.url();
    if (!isApiUrl(url)) return;
    const rawPath = toPath(url);
    const record = {
      type: "request",
      time: new Date().toISOString(),
      method: request.method(),
      url,
      path: rawPath,
      normalizedPath: normalizeApiPath(rawPath),
      resourceType: request.resourceType?.() || "",
      headers: redactHeaders(request.headers?.() || {}, options),
      postData: safeJson(request.postData?.()),
    };
    state.requestByObject.set(request, record);
    state.events.push(record);
  };

  state.onResponse = async (response) => {
    const url = response.url();
    if (!isApiUrl(url)) return;
    const request = response.request();
    const rawPath = toPath(url);
    const record = {
      type: "response",
      time: new Date().toISOString(),
      method: request.method(),
      url,
      path: rawPath,
      normalizedPath: normalizeApiPath(rawPath),
      status: response.status(),
      statusText: response.statusText(),
      contentType: response.headers?.()["content-type"] || "",
      responseHeaders: redactHeaders(response.headers?.() || {}, options),
      requestPostData: state.requestByObject.has(request) ? state.requestByObject.get(request).postData : null,
    };
    state.events.push(record);
    state.requestByObject.delete(request);
  };

  page.on("request", state.onRequest);
  page.on("response", state.onResponse);
  page.__OMNIA_VOICE_API_RECORDER__ = state;
  return snapshotApiRecording(page);
}

export async function snapshotApiRecording(page) {
  const state = page.__OMNIA_VOICE_API_RECORDER__;
  return {
    active: Boolean(state?.active),
    startedAt: state?.startedAt || null,
    eventCount: state?.events?.length || 0,
    events: [...(state?.events || [])],
    observations: buildApiObservations(state?.events || []),
  };
}

export async function stopApiRecording(page) {
  const state = page.__OMNIA_VOICE_API_RECORDER__;
  if (!state) {
    return { active: false, startedAt: null, stoppedAt: new Date().toISOString(), eventCount: 0, events: [], observations: [] };
  }
  state.active = false;
  page.off("request", state.onRequest);
  page.off("response", state.onResponse);
  delete page.__OMNIA_VOICE_API_RECORDER__;
  return {
    active: false,
    startedAt: state.startedAt,
    stoppedAt: new Date().toISOString(),
    eventCount: state.events.length,
    events: [...state.events],
    observations: buildApiObservations(state.events),
  };
}

export function buildApiObservations(events) {
  const byKey = new Map();
  for (const event of events || []) {
    if (event.type !== "response") continue;
    const method = String(event.method || "").toUpperCase();
    const path = event.normalizedPath || normalizeApiPath(event.path);
    const status = Number(event.status || 0);
    if (!method || !path) continue;
    const key = `${method} ${path} ${status}`;
    const current = byKey.get(key) || { method, path, status, calls: 0, lastSeenAt: null };
    current.calls += 1;
    current.lastSeenAt = !current.lastSeenAt || event.time > current.lastSeenAt ? event.time : current.lastSeenAt;
    byKey.set(key, current);
  }
  return [...byKey.values()].sort((left, right) => right.calls - left.calls || left.path.localeCompare(right.path)).slice(0, 12);
}
```

- [x] **Step 4: Add failing learning-session correlation test**

Append to `playwright-recorder/src/native-cdp-learning-session.test.js`:

```js
test("learnFromRecordingSnapshot attaches API observations to newly learned UI commands", () => {
  const result = learnFromRecordingSnapshot(createLearningSession(), {
    active: true,
    eventCount: 1,
    events: [
      { type: "click", text: "Dashboard", role: "link", path: "/dashboard", time: "2026-05-17T10:00:00.000Z" },
    ],
    apiEvents: [
      { type: "response", method: "GET", normalizedPath: "/apigateway/dashboard/cards", status: 200, time: "2026-05-17T10:00:01.000Z" },
      { type: "response", method: "GET", normalizedPath: "/apigateway/dashboard/cards", status: 200, time: "2026-05-17T10:00:02.000Z" },
    ],
  }, { now: "2026-05-17T10:00:03.000Z" });

  assert.equal(result.learnedSuggestions[0].command, "gehe zu Dashboard");
  assert.equal(result.session.catalog.commands[0].executor, "hybrid");
  assert.deepEqual(result.session.catalog.commands[0].apiObservations, [
    { method: "GET", path: "/apigateway/dashboard/cards", status: 200, calls: 2, lastSeenAt: "2026-05-17T10:00:02.000Z" },
  ]);
});
```

- [x] **Step 5: Update learning session to merge API observations**

Modify `playwright-recorder/src/native-cdp-learning-session.js`:

```js
import { buildCommandSuggestions } from "./native-cdp-action-recorder.js";
import { buildApiObservations } from "./native-cdp-api-recorder.js";
import { buildCommandCatalog, mergeSuggestionsIntoCatalog } from "./native-cdp-command-catalog.js";
```

Inside `learnFromRecordingSnapshot()`, replace:

```js
const learnedSuggestions = buildCommandSuggestions(newEvents);
```

with:

```js
const apiObservations = buildApiObservations(snapshot?.apiEvents || []);
const learnedSuggestions = buildCommandSuggestions(newEvents).map((suggestion) => ({
  ...suggestion,
  executor: apiObservations.length ? "hybrid" : "ui",
  safety: "safe",
  context: {
    route: newEvents.find((event) => event?.path)?.path || "",
  },
  apiObservations,
}));
```

- [x] **Step 6: Run recorder and learning tests, then commit**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-api-recorder.test.js src/native-cdp-learning-session.test.js src/native-cdp-command-catalog.test.js
```

Expected: PASS.

Commit:

```bash
git add src/native-cdp-api-recorder.js src/native-cdp-api-recorder.test.js src/native-cdp-learning-session.js src/native-cdp-learning-session.test.js src/native-cdp-command-catalog.js src/native-cdp-command-catalog.test.js
git commit -m "Correlate UI learning with Omnia API observations"
```

## Task 4: Make Conversation Aware Of Disconnected Omnia And Confirmable Risk

**Files:**
- Modify: `playwright-recorder/src/native-cdp-conversation.js`
- Modify: `playwright-recorder/src/native-cdp-conversation.test.js`

- [x] **Step 1: Add failing conversation prompt and risk tests**

Append to `playwright-recorder/src/native-cdp-conversation.test.js`:

```js
test("createConversationRequest includes disconnected Omnia state", () => {
  const request = createConversationRequest({
    model: "qwen2.5:7b",
    text: "zeige dashboard",
    pageSummary: {
      connected: false,
      title: "Omnia nicht verbunden",
      connectionMessage: "Omnia ist nicht verbunden.",
    },
    catalog: { commands: [{ command: "gehe zu Dashboard", kind: "navigation", target: "Dashboard" }] },
  });

  const prompt = request.messages[1].content;
  assert.match(prompt, /"connected": false/);
  assert.match(prompt, /Omnia ist nicht verbunden/);
});

test("createConversationRequest asks the model to return confirmable risky commands", () => {
  const request = createConversationRequest({
    model: "qwen2.5:7b",
    text: "tippe die mandantennummer",
    catalog: { commands: [{ command: "tippe mandantennummer", kind: "utility", target: "tippe mandantennummer" }] },
  });

  assert.match(request.messages[0].content, /Bestaetigungsfrage|Bestätigungsfrage/);
  assert.match(request.messages[0].content, /Trotzdem ausfuehren|Trotzdem ausführen/);
});
```

- [x] **Step 2: Run conversation tests and verify the first new assertion fails**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-conversation.test.js
```

Expected: FAIL until `connected` and `connectionMessage` are included in compact page summaries.

- [x] **Step 3: Update prompt text and page summary compaction**

In `playwright-recorder/src/native-cdp-conversation.js`, update the system prompt lines in `createConversationRequest()`:

```js
"Wenn Omnia nicht verbunden ist, darfst du einen passenden bekannten Befehl erkennen, aber sage klar, dass die UI-Ausfuehrung erst nach Verbindung moeglich ist.",
"Fuer Formularfuellung, Speichern, Loeschen, OK, Weiter, Ja oder Beenden waehle trotzdem den passenden Befehl, aber formuliere in 'say' eine kurze Bestaetigungsfrage fuer die UI-Karte 'Trotzdem ausfuehren'.",
```

In `compactPageSummary()`, return the connection fields:

```js
connected: pageSummary?.connected !== false,
connectionMessage: pageSummary?.connectionMessage || "",
```

- [x] **Step 4: Run tests and commit**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-conversation.test.js
```

Expected: PASS.

Commit:

```bash
git add src/native-cdp-conversation.js src/native-cdp-conversation.test.js
git commit -m "Make conversation aware of Omnia connection state"
```

## Task 5: Refactor Voice Server For Explicit Omnia Modes

**Files:**
- Modify: `playwright-recorder/src/native-cdp-voice-server.js`

- [x] **Step 1: Add imports and runtime connection state**

In `playwright-recorder/src/native-cdp-voice-server.js`, add imports:

```js
import {
  createDisconnectedPageSummary,
  createOmniaConnectionState,
  disconnectedActionResult,
  normalizeOmniaMode,
  serializeOmniaStatus,
} from "./native-cdp-omnia-connection.js";
import {
  snapshotApiRecording,
  startApiRecording,
  stopApiRecording,
} from "./native-cdp-api-recorder.js";
```

Replace global `let browser; let page;` with:

```js
let omniaConnection = createOmniaConnectionState();
```

- [x] **Step 2: Start the HTTP server before connecting Omnia**

Replace the top-level startup sequence so it loads config and catalog, starts HTTP, and only auto-connects if explicitly requested:

```js
const voiceConfig = createVoiceServerConfig();
conversationConfig = createConversationConfig();
let nativeConfig = createNativeCdpConfig();
catalogPath = process.env.OMNIA_COMMAND_CATALOG_PATH || path.join(projectRoot, "captures", "native-command-catalog.json");
learningSession = createLearningSession({ catalog: await loadCommandCatalog(catalogPath) });
await saveCommandCatalog(catalogPath, learningSession.catalog);

server = http.createServer((req, res) => {
  handleRequest(req, res, nativeConfig, () => shutdown(nativeConfig)).catch((error) => {
    sendJson(res, 500, { ok: false, message: error.message });
  });
});

await listen(server, voiceConfig);
console.log(`Voice panel: http://${voiceConfig.host}:${voiceConfig.port}`);
console.log(`KI: ${conversationConfig.model} @ ${conversationConfig.endpoint}`);

const autoMode = normalizeOmniaMode(process.env.OMNIA_NATIVE_AUTOCONNECT);
if (autoMode !== "none") {
  connectOmnia(nativeConfig, autoMode).catch((error) => {
    omniaConnection = createOmniaConnectionState({ ...omniaConnection, connected: false, connecting: false, lastError: error.message });
    console.warn(`Omnia auto-connect failed: ${error.message}`);
  });
}
```

- [x] **Step 3: Add connection and disconnection handlers**

Add these functions near `getActivePage()`:

```js
async function connectOmnia(config, mode) {
  const requestedMode = normalizeOmniaMode(mode);
  if (requestedMode === "none") {
    await disconnectOmnia({ keepServer: true });
    return omniaConnection;
  }

  omniaConnection = createOmniaConnectionState({ ...omniaConnection, mode: requestedMode, connecting: true, lastError: "" });
  const resolvedConfig = await resolveVmIp(config);
  nativeLogConnection(resolvedConfig);

  if (requestedMode === "launch") {
    await execWindowsPowerShell(resolvedConfig, buildCleanupScript(resolvedConfig));
    await execWindowsPowerShell(resolvedConfig, buildPortProxySetupScript(resolvedConfig));
    await execWindowsPowerShell(resolvedConfig, buildLaunchScript(resolvedConfig), { currentUser: true });
  } else if (requestedMode === "attach") {
    await execWindowsPowerShell(resolvedConfig, buildPortProxySetupScript(resolvedConfig));
  }

  const activePage = await connectToOmniaPage(resolvedConfig);
  const summary = await summarizePage(activePage);
  omniaConnection = createOmniaConnectionState({
    mode: requestedMode,
    connected: true,
    connecting: false,
    href: summary.href,
    title: summary.title,
    browser: omniaConnection.browser,
    page: activePage,
    skipNativeCleanup: requestedMode === "attach",
  });
  return omniaConnection;
}

async function disconnectOmnia({ keepServer = true } = {}) {
  const current = omniaConnection;
  await stopRecorders(current.page).catch(() => {});
  if (current.browser) await current.browser.close().catch(() => {});
  omniaConnection = createOmniaConnectionState({ mode: "none" });
  if (!keepServer) await shutdown(createNativeCdpConfig()).catch(() => {});
  return omniaConnection;
}

function nativeLogConnection(config) {
  console.log(`VM: ${config.vmName} (${config.vmIp})`);
  console.log(`CDP: Windows 127.0.0.1:${config.guestDebugPort} -> Mac ${config.hostEndpoint}`);
}
```

Then update `connectToOmniaPage()` so the connected browser is stored on `omniaConnection.browser` instead of the removed global:

```js
if (!omniaConnection.browser || !omniaConnection.browser.isConnected()) {
  omniaConnection.browser = await chromium.connectOverCDP(config.hostEndpoint, {
    timeout: config.connectTimeoutMs,
  });
}

const candidates = omniaConnection.browser
  .contexts()
```

- [x] **Step 4: Add status and Omnia mode endpoints**

In `handleRequest()`, replace `/api/status` with a non-blocking status response:

```js
if (req.method === "GET" && url.pathname === "/api/status") {
  const pageSummary = await summarizeConnectedPage().catch(() => createDisconnectedPageSummary(omniaConnection.lastError));
  sendJson(res, 200, serializeOmniaStatus({ ...omniaConnection, ...pageSummary }, {
    ai: { model: conversationConfig.model, endpoint: conversationConfig.endpoint },
    learning: await summarizeLearningStatus(),
  }));
  return;
}
```

Add:

```js
if (req.method === "POST" && url.pathname === "/api/omnia/connect") {
  const payload = parseJsonBody(await readBody(req));
  const mode = normalizeOmniaMode(payload.mode);
  const connected = await connectOmnia(nativeConfig, mode);
  sendJson(res, 200, serializeOmniaStatus(connected, {
    ai: { model: conversationConfig.model, endpoint: conversationConfig.endpoint },
    learning: await summarizeLearningStatus(),
  }));
  return;
}

if (req.method === "POST" && url.pathname === "/api/omnia/disconnect") {
  await disconnectOmnia({ keepServer: true });
  sendJson(res, 200, serializeOmniaStatus(omniaConnection, {
    ai: { model: conversationConfig.model, endpoint: conversationConfig.endpoint },
    learning: await summarizeLearningStatus(),
  }));
  return;
}
```

Add helper functions:

```js
async function summarizeConnectedPage() {
  if (!omniaConnection.page || omniaConnection.page.isClosed?.()) {
    return createDisconnectedPageSummary(omniaConnection.lastError || "Omnia ist nicht verbunden.");
  }
  const summary = await summarizePage(omniaConnection.page);
  omniaConnection = createOmniaConnectionState({ ...omniaConnection, connected: true, href: summary.href, title: summary.title });
  return { ...summary, connected: true };
}

async function summarizeLearningStatus() {
  if (!omniaConnection.page || omniaConnection.page.isClosed?.()) {
    return { active: false, startedAt: null, eventCount: 0, apiEventCount: 0 };
  }
  const ui = await snapshotActionRecording(omniaConnection.page).catch(() => ({ active: false, eventCount: 0 }));
  const api = await snapshotApiRecording(omniaConnection.page).catch(() => ({ active: false, eventCount: 0 }));
  return {
    active: Boolean(ui.active || api.active || learningSession.active),
    startedAt: ui.startedAt || api.startedAt || null,
    eventCount: ui.eventCount || 0,
    apiEventCount: api.eventCount || 0,
  };
}
```

- [x] **Step 5: Gate UI-only endpoints when disconnected**

For `/api/recording/*`, `/api/learning/start`, `/api/learning/stop`, `/api/explorer/run`, and `/api/command`, first get the page with a non-throwing helper:

```js
function getConnectedPageOrNull() {
  return omniaConnection.page && !omniaConnection.page.isClosed?.() ? omniaConnection.page : null;
}
```

For direct commands, replace the handler body with:

```js
const payload = parseJsonBody(await readBody(req));
const activePage = getConnectedPageOrNull();
if (!activePage) {
  sendJson(res, 200, disconnectedActionResult(payload.text));
  return;
}
const result = await executeTextCommand(activePage, payload.text, shutdownFn);
sendJson(res, result.ok ? 200 : 400, result);
return;
```

For learning start when disconnected, return:

```js
sendJson(res, 200, {
  ok: true,
  active: false,
  requiresConnection: true,
  message: "Omnia ist nicht verbunden. Der Lernmodus braucht eine verbundene lokale Omnia-App.",
  catalog: learningSession.catalog,
});
return;
```

- [x] **Step 6: Run UI and API recorders together**

Add helpers:

```js
async function startRecorders(activePage) {
  const ui = await startActionRecording(activePage);
  const api = await startApiRecording(activePage);
  return { ui, api };
}

async function snapshotRecorders(activePage) {
  const ui = await snapshotActionRecording(activePage);
  const api = await snapshotApiRecording(activePage);
  return {
    ...ui,
    apiEvents: api.events || [],
    apiEventCount: api.eventCount || 0,
    apiObservations: api.observations || [],
  };
}

async function stopRecorders(activePage) {
  if (!activePage) return { active: false, events: [], apiEvents: [] };
  const ui = await stopActionRecording(activePage).catch(() => ({ active: false, events: [] }));
  const api = await stopApiRecording(activePage).catch(() => ({ active: false, events: [] }));
  return {
    ...ui,
    apiEvents: api.events || [],
    apiEventCount: api.eventCount || 0,
    apiObservations: api.observations || [],
  };
}
```

Replace learning endpoint calls to `startActionRecording`, `snapshotActionRecording`, and `stopActionRecording` with `startRecorders`, `snapshotRecorders`, and `stopRecorders`.

- [x] **Step 7: Let conversation work while disconnected**

Replace `/api/conversation` body with:

```js
const payload = parseJsonBody(await readBody(req));
const activePage = getConnectedPageOrNull();
const pageSummary = activePage
  ? await summarizeConnectedPage()
  : createDisconnectedPageSummary(omniaConnection.lastError || "Omnia ist nicht verbunden.");
const result = await handleConversationTurn({
  text: payload.text,
  page: activePage,
  pageSummary,
  shutdownFn,
});
sendJson(res, result.ok ? 200 : 400, result);
return;
```

Inside `handleConversationTurn()`, before executing a non-risky resolved command, add:

```js
if (!page) {
  const disconnected = disconnectedActionResult(resolvedCommand);
  const message = [decision.say, disconnected.message].filter(Boolean).join(" ");
  rememberConversation(userText, message);
  return {
    ...disconnected,
    decision: { ...decision, command: resolvedCommand },
    message,
  };
}
```

- [x] **Step 8: Update shutdown for optional native cleanup**

In `shutdown()`, close `omniaConnection.browser` and only run cleanup for launched mode:

```js
if (omniaConnection.browser) {
  await omniaConnection.browser.close().catch(() => {});
}

if (!skipNativeCleanup && omniaConnection.mode === "launch") {
  const resolvedConfig = await resolveVmIp(config).catch(() => config);
  await execWindowsPowerShell(resolvedConfig, buildCleanupScript(resolvedConfig)).catch((error) => {
    console.warn(`Cleanup warning: ${error.message}`);
  });
}
```

- [x] **Step 9: Run focused tests and do a smoke start**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-omnia-connection.test.js src/native-cdp-api-recorder.test.js src/native-cdp-learning-session.test.js src/native-cdp-conversation.test.js
OMNIA_VOICE_PORT=8791 OMNIA_NATIVE_AUTOCONNECT=none node src/native-cdp-voice-server.js
```

Expected:

- Tests PASS.
- Server prints `Voice panel: http://127.0.0.1:8791`.
- It does not try to resolve the VM IP until `/api/omnia/connect` is called.

Stop the smoke server with Ctrl+C.

- [x] **Step 10: Commit server refactor**

Commit:

```bash
git add src/native-cdp-voice-server.js
git commit -m "Start voice server without required Omnia connection"
```

## Task 6: Rebuild The Panel As Chat-First UI

**Files:**
- Modify: `playwright-recorder/src/native-cdp-voice-ui.js`
- Modify: `playwright-recorder/src/native-cdp-voice-ui.test.js`

- [x] **Step 1: Replace HTML wiring test with chat-first assertions**

Replace the existing `createVoicePanelHtml includes speech recognition and command endpoint wiring` test in `playwright-recorder/src/native-cdp-voice-ui.test.js` with:

```js
test("createVoicePanelHtml renders chat-first Omnia assistant wiring", () => {
  const html = createVoicePanelHtml();

  assert.match(html, /id="chatLog"/);
  assert.match(html, /id="composerInput"/);
  assert.match(html, /id="sendMessage"/);
  assert.match(html, /id="toggleVoice"/);
  assert.match(html, /id="learnedDrawer"/);
  assert.match(html, /id="connectLaunch"/);
  assert.match(html, /id="connectAttach"/);
  assert.match(html, /id="connectNone"/);
  assert.match(html, /\/api\/omnia\/connect/);
  assert.match(html, /\/api\/omnia\/disconnect/);
  assert.match(html, /\/api\/conversation/);
  assert.match(html, /\/api\/command/);
  assert.match(html, /Trotzdem ausfuehren/);
  assert.match(html, /SpeechRecognition|webkitSpeechRecognition/);
  assert.match(html, /sendChatMessage\(transcript\)/);
});
```

- [x] **Step 2: Run UI test and verify it fails**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-voice-ui.test.js
```

Expected: FAIL because the old panel lacks the chat-first element IDs and connection endpoints.

- [x] **Step 3: Replace panel body structure**

In `createVoicePanelHtml()`, replace the `<body>` content with this structure:

```html
<body>
  <main class="appShell">
    <header class="topBar">
      <div>
        <h1>Omnia Assistent</h1>
        <p class="subtle">Lokale Konversation, Sprache und gelernte Omnia-Befehle.</p>
      </div>
      <div class="statusGrid">
        <div class="status" id="omniaStatus">Omnia: getrennt</div>
        <div class="status" id="aiStatus">KI: pruefen</div>
        <div class="status" id="speechStatus">Sprache: pruefen</div>
        <div class="status" id="learningStatus">Lernen: aus</div>
      </div>
    </header>

    <section class="modeBar" aria-label="Omnia Verbindung">
      <button id="connectLaunch" class="primary" type="button">Lokale Omnia-App starten</button>
      <button id="connectAttach" type="button">An laufende App anhaengen</button>
      <button id="connectNone" type="button">Ohne lokale App</button>
      <button id="disconnectOmnia" type="button">Trennen</button>
    </section>

    <section class="chatPanel" aria-label="Chat">
      <div class="chatLog" id="chatLog"></div>
      <form class="composer" id="composer">
        <button id="toggleVoice" type="button" title="Spracheingabe">Mic</button>
        <input id="composerInput" autocomplete="off" placeholder="Schreib oder sprich mit Omnia">
        <button id="sendMessage" class="primary" type="submit">Senden</button>
      </form>
    </section>

    <aside class="learnedDrawer" id="learnedDrawer">
      <div class="drawerHeader">
        <h2>Gelernte Befehle</h2>
        <button id="toggleLearnedDrawer" type="button">Einblenden</button>
      </div>
      <div class="toolRow">
        <button id="startLearning" type="button">Lernen starten</button>
        <button id="stopLearning" type="button">Lernen stoppen</button>
        <button id="runAutoExplorer" type="button">Auto-Explorer</button>
        <button id="refreshLearning" type="button">Aktualisieren</button>
      </div>
      <div class="learnedCommands" id="learnedCommands"></div>
    </aside>
  </main>
</body>
```

- [x] **Step 4: Replace browser script behavior**

In the `<script>` block, keep `SpeechRecognition` setup but replace command-log functions with these function names and behaviors:

```js
function appendMessage(role, text, options = {}) {
  const item = document.createElement("article");
  item.className = "message " + role;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  item.append(bubble);
  if (options.confirmCommand) item.append(createConfirmCard(options.confirmCommand, options.reason || text));
  chatLogEl.append(item);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

function createConfirmCard(command, reason) {
  const card = document.createElement("div");
  card.className = "actionCard";
  const label = document.createElement("p");
  label.textContent = reason + " Erkannter Befehl: " + command;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary";
  button.textContent = "Trotzdem ausfuehren";
  button.addEventListener("click", () => executeConfirmedCommand(command));
  card.append(label, button);
  return card;
}

async function sendChatMessage(text) {
  const message = String(text || "").trim();
  if (!message) return;
  composerInputEl.value = "";
  appendMessage("user", message);
  const payload = await fetchJson("/api/conversation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
  renderConversationPayload(payload);
}

async function executeConfirmedCommand(command) {
  appendMessage("action", "Bestaetigt: " + command);
  const payload = await fetchJson("/api/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: command }),
  });
  appendMessage(payload.ok ? "assistant" : "error", payload.message || "Keine Antwort.");
  await refreshStatus();
}

function renderConversationPayload(payload) {
  const text = payload.message || payload.decision?.say || "Keine Antwort.";
  if (payload.needsConfirmation && payload.decision?.command) {
    appendMessage("assistant", text, { confirmCommand: payload.decision.command, reason: text });
  } else {
    appendMessage(payload.ok ? "assistant" : "error", text);
  }
  refreshStatus().catch((error) => appendMessage("error", error.message));
}

async function connectOmnia(mode) {
  appendMessage("system", "Verbinde Omnia: " + mode);
  const payload = await fetchJson("/api/omnia/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  applyStatusPayload(payload);
  appendMessage(payload.omnia?.connected ? "system" : "error", payload.omnia?.connected ? "Omnia verbunden." : (payload.omnia?.lastError || "Omnia nicht verbunden."));
}
```

Ensure:

- The form submit handler calls `sendChatMessage(composerInputEl.value)`.
- Speech recognition `onresult` calls `sendChatMessage(transcript)`.
- `startLearning()`, `stopLearning()`, `runAutoExplorer()`, and `refreshLearning()` append chat messages instead of writing to the old terminal log.
- `renderLearnedCommands()` places learned commands in `#learnedCommands`; clicking one calls `sendChatMessage(entry.command)`.
- `refreshStatus()` calls `/api/status`, updates `#omniaStatus`, `#aiStatus`, and `#learningStatus`, and never blocks page load if disconnected.

- [x] **Step 5: Replace CSS with stable chat layout**

Keep the existing color direction but make the first screen the chat:

```css
body {
  margin: 0;
  min-height: 100vh;
  background: #f6f7f9;
  color: #16181d;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.appShell {
  width: min(1180px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-rows: auto auto minmax(420px, 1fr) auto;
  gap: 12px;
}
.topBar, .modeBar, .chatPanel, .learnedDrawer {
  border: 1px solid #d8dde6;
  background: #ffffff;
  border-radius: 8px;
}
.topBar {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}
.statusGrid, .modeBar, .toolRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chatPanel {
  min-height: 420px;
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
}
.chatLog {
  padding: 18px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.message {
  display: flex;
}
.message.user {
  justify-content: flex-end;
}
.bubble, .actionCard {
  max-width: min(720px, 88%);
  border: 1px solid #d8dde6;
  border-radius: 8px;
  padding: 10px 12px;
  background: #ffffff;
}
.message.user .bubble {
  background: #0f6f5f;
  color: #ffffff;
  border-color: #0f6f5f;
}
.message.error .bubble {
  border-color: #d64545;
  background: #fff6f6;
}
.composer {
  border-top: 1px solid #d8dde6;
  padding: 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
}
.learnedDrawer {
  padding: 12px;
}
.learnedCommands {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
@media (max-width: 720px) {
  .appShell { padding: 12px; }
  .topBar { align-items: stretch; flex-direction: column; }
  .composer { grid-template-columns: 1fr; }
}
```

- [x] **Step 6: Run UI tests and commit**

Run:

```bash
cd playwright-recorder
npm test -- src/native-cdp-voice-ui.test.js
```

Expected: PASS.

Commit:

```bash
git add src/native-cdp-voice-ui.js src/native-cdp-voice-ui.test.js
git commit -m "Build chat-first voice control panel"
```

## Task 7: Browser Smoke Test The Chat Platform

**Files:**
- Modify only if the smoke test exposes defects in files already touched by Tasks 1-6.

- [x] **Step 1: Run full automated tests**

Run:

```bash
cd playwright-recorder
npm test
```

Expected: all tests PASS.

- [x] **Step 2: Start the panel without Omnia**

Run:

```bash
cd playwright-recorder
OMNIA_VOICE_PORT=8787 OMNIA_NATIVE_AUTOCONNECT=none npm run native:voice
```

Expected:

- Server stays running.
- It prints `Voice panel: http://127.0.0.1:8787`.
- It does not require the Windows VM before showing the page.

- [x] **Step 3: Open and inspect in the in-app browser**

Use the Browser plugin to open:

```text
http://127.0.0.1:8787/
```

Verify:

- Chat log is visible on first viewport.
- Status shows Omnia disconnected.
- Connection buttons are visible.
- Learned-command drawer is visible but compact.
- No JavaScript console errors on load.

- [x] **Step 4: Test disconnected conversation**

In the chat input, send:

```text
zeige dashboard
```

Expected:

- User message appears.
- Assistant response appears.
- No request hangs.
- Response explains that UI execution needs an Omnia connection.

- [x] **Step 5: Test risky confirmation card**

In the chat input, send:

```text
tippe mandantennummer
```

Expected:

- Assistant response appears as a blocked action.
- Card shows `Trotzdem ausfuehren`.
- Clicking the button calls `/api/command` with `tippe mandantennummer`.
- If Omnia is still disconnected, the result explains that no UI action was executed.

- [x] **Step 6: Test local attach or launch when available**

If the Windows VM is running and the Omnia debug port can be exposed, click one mode:

- `Lokale Omnia-App starten` for `mode: "launch"`.
- `An laufende App anhaengen` for `mode: "attach"`.

Expected:

- Status changes to connected after Playwright finds the Omnia page.
- `/api/status` returns `omnia.connected: true`.
- Sending `status` returns the current Omnia page title and URL.

- [x] **Step 7: Stop server and commit smoke fixes**

If fixes were needed, run:

```bash
cd playwright-recorder
npm test
git add src/native-cdp-voice-server.js src/native-cdp-voice-ui.js src/*.test.js
git commit -m "Fix chat platform smoke test issues"
```

Expected: commit only if files changed.

## Task 8: Document Stage-1 Usage

**Files:**
- Modify: `playwright-recorder/README.md`

- [x] **Step 1: Add chat platform usage section**

Add this section before `## Pflicht-Konfiguration`:

````md
## Chat-first Voice Control

Die native Voice-Control startet jetzt als lokale Chatplattform:

```bash
npm run native:voice
```

Standardmaessig laeuft der Server unter `http://127.0.0.1:8787/`.
Der Webserver kann ohne Omnia-Verbindung starten. Im Panel waehlst du:

- `Lokale Omnia-App starten`: startet die Windows-Omnia-App mit CDP und verbindet Playwright.
- `An laufende App anhaengen`: verbindet eine bereits gestartete Debug-Instanz.
- `Ohne lokale App`: laesst den Chat, den lokalen KI-Router und den Lernkatalog ohne UI-Ausfuehrung laufen.

Optional kann ein Startmodus per Environment gesetzt werden:

```env
OMNIA_NATIVE_AUTOCONNECT=none
# oder: launch, attach
```

Der Chat nutzt den OpenAI-kompatiblen lokalen Endpoint aus `.env.local`:

```env
OMNIA_AI_BASE_URL=http://127.0.0.1:11434/v1
OMNIA_AI_MODEL=qwen2.5:7b
OMNIA_AI_API_KEY=ollama
```

Stufe 1 fuehrt sichere Navigation und Ansichtswechsel direkt aus. Formularfuellung,
Speichern, Loeschen, OK/Weiter/Ja, Beenden, Passwort und Mandantennummer werden
als Aktionskarte blockiert. Der Button `Trotzdem ausfuehren` ruft danach exakt den
erkannten Befehl ueber `/api/command` auf, ohne eine zweite KI-Entscheidung.

Wenn Omnia verbunden ist, zeichnet der Lernmodus UI-Aktionen und `/apigateway/`
API-Verkehr parallel auf. Neue Katalogeintraege koennen dadurch `apiObservations`
enthalten. Diese Beobachtungen werden noch nicht als API-Schreibaktionen ausgefuehrt;
sie dienen als Grundlage fuer spaetere lesende und bestaetigte API-Rezepte.
````

- [x] **Step 2: Run tests and commit docs**

Run:

```bash
cd playwright-recorder
npm test
```

Expected: PASS.

Commit:

```bash
git add README.md
git commit -m "Document chat-first voice control usage"
```

## Task 9: Final Verification

**Files:**
- No planned source edits.

- [x] **Step 1: Check git status**

Run:

```bash
git status --short
```

Expected: only unrelated pre-existing files may remain. No accidental captures, body dumps, or local secrets are staged.

- [x] **Step 2: Run full test suite**

Run:

```bash
cd playwright-recorder
npm test
```

Expected: PASS.

- [x] **Step 3: Run no-Omnia server smoke check**

Run:

```bash
cd playwright-recorder
OMNIA_VOICE_PORT=8791 OMNIA_NATIVE_AUTOCONNECT=none npm run native:voice
```

Expected:

- Server prints `Voice panel: http://127.0.0.1:8791`.
- Browser can load the panel.
- `GET http://127.0.0.1:8791/api/status` returns JSON with `ok: true` and `omnia.connected: false`.

Stop the server with Ctrl+C.

- [x] **Step 4: Final commit if verification changed files**

If verification required fixes:

```bash
git add playwright-recorder/src playwright-recorder/README.md
git commit -m "Finalize Omnia voice chat stage 1"
```

Expected: no commit is made when there are no changes.
