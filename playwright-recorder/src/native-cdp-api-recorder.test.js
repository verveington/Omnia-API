import assert from "node:assert/strict";
import test from "node:test";

import {
  buildApiObservations,
  isApiUrl,
  normalizeApiPath,
  redactHeaders,
  safeJson,
  snapshotApiRecording,
  startApiRecording,
  stopApiRecording,
  toPath,
} from "./native-cdp-api-recorder.js";

test("isApiUrl is true only for URLs containing /apigateway/", () => {
  assert.equal(isApiUrl("https://api2.optica-omnia.de/apigateway/dashboardservice/cards"), true);
  assert.equal(isApiUrl("https://api2.optica-omnia.de/foo/apigateway/bar"), true);
  assert.equal(isApiUrl("https://api2.optica-omnia.de/apiGateway/dashboardservice/cards"), false);
  assert.equal(isApiUrl("/apigateway/dashboardservice/cards"), true);
  assert.equal(isApiUrl("/assets/apigateway-logo.svg"), false);
});

test("normalizeApiPath replaces numeric ids UUIDs and article search values", () => {
  assert.equal(
    normalizeApiPath("/apigateway/orderservice/orders/123/items/456"),
    "/apigateway/orderservice/orders/{id}/items/{id}",
  );
  assert.equal(
    normalizeApiPath("/apigateway/customerservice/customers/550e8400-e29b-41d4-a716-446655440000"),
    "/apigateway/customerservice/customers/{uuid}",
  );
  assert.equal(
    normalizeApiPath("/apigateway/articletenantservice/articles/search/ABC-123"),
    "/apigateway/articletenantservice/articles/search/{id}",
  );
});

test("toPath returns pathname for valid URLs and falls back for invalid strings", () => {
  assert.equal(toPath("https://api2.optica-omnia.de/apigateway/orderservice/orders/123?include=items"), "/apigateway/orderservice/orders/123");
  assert.equal(toPath("/apigateway/orderservice/orders/123?include=items"), "/apigateway/orderservice/orders/123?include=items");
  assert.equal(toPath("not a url"), "not a url");
});

test("redactHeaders masks sensitive headers by default", () => {
  assert.deepEqual(redactHeaders({
    authorization: "Bearer token",
    Cookie: "session=abc",
    "set-cookie": "session=abc",
    "x-auth-token": "auth",
    "X-CSRF-Token": "csrf",
    "proxy-authorization": "Basic abc",
    accept: "application/json",
  }), {
    authorization: "[REDACTED]",
    Cookie: "[REDACTED]",
    "set-cookie": "[REDACTED]",
    "x-auth-token": "[REDACTED]",
    "X-CSRF-Token": "[REDACTED]",
    "proxy-authorization": "[REDACTED]",
    accept: "application/json",
  });

  assert.deepEqual(redactHeaders({ authorization: "Bearer token" }, { enabled: false }), {
    authorization: "Bearer token",
  });
});

test("safeJson parses JSON strings keeps non-json strings and returns null for empty input", () => {
  assert.deepEqual(safeJson("{\"ok\":true}"), { ok: true });
  assert.deepEqual(safeJson("[1,2]"), [1, 2]);
  assert.equal(safeJson("plain text"), "plain text");
  assert.equal(safeJson(""), null);
  assert.equal(safeJson(null), null);
});

test("buildApiObservations summarizes response events by method path and status", () => {
  const observations = buildApiObservations([
    {
      type: "request",
      method: "GET",
      normalizedPath: "/apigateway/dashboardservice/cards",
      status: 200,
      time: "2026-05-17T10:00:00.000Z",
    },
    {
      type: "response",
      method: "get",
      normalizedPath: "/apigateway/dashboardservice/cards",
      status: 200,
      time: "2026-05-17T10:00:01.000Z",
    },
    {
      type: "response",
      method: "GET",
      normalizedPath: "/apigateway/dashboardservice/cards",
      path: "/apigateway/dashboardservice/cards/42",
      status: 200,
      time: "2026-05-17T10:00:03.000Z",
    },
    {
      type: "response",
      method: "POST",
      normalizedPath: "/apigateway/auditservice/events",
      status: 204,
      time: "2026-05-17T10:00:02.000Z",
    },
  ]);

  assert.deepEqual(observations, [
    {
      method: "GET",
      path: "/apigateway/dashboardservice/cards",
      status: 200,
      calls: 2,
      lastSeenAt: "2026-05-17T10:00:03.000Z",
    },
    {
      method: "POST",
      path: "/apigateway/auditservice/events",
      status: 204,
      calls: 1,
      lastSeenAt: "2026-05-17T10:00:02.000Z",
    },
  ]);
});

test("API recorder captures request response snapshot and stop lifecycle", () => {
  const page = createFakePage();
  const startSnapshot = startApiRecording(page);

  assert.deepEqual(page.onCalls.map((call) => call.event), ["request", "response", "requestfailed"]);
  assert.equal(Boolean(page.__OMNIA_VOICE_API_RECORDER__), true);
  assert.equal(startSnapshot.active, true);
  assert.equal(startSnapshot.eventCount, 0);

  const request = createFakeRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/orderservice/orders/123",
    resourceType: "xhr",
    headers: {
      authorization: "Bearer secret",
      accept: "application/json",
    },
    postData: "{\"orderId\":123}",
  });
  page.emit("request", request);

  assert.equal(page.__OMNIA_VOICE_API_RECORDER__.events.length, 1);
  assert.match(page.__OMNIA_VOICE_API_RECORDER__.events[0].time, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(withoutTime(page.__OMNIA_VOICE_API_RECORDER__.events[0]), {
    type: "request",
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/orderservice/orders/123",
    path: "/apigateway/orderservice/orders/123",
    normalizedPath: "/apigateway/orderservice/orders/{id}",
    resourceType: "xhr",
    headers: {
      authorization: "[REDACTED]",
      accept: "application/json",
    },
    postData: { orderId: 123 },
  });

  const failedRequest = createFakeRequest({
    method: "GET",
    url: "https://api2.optica-omnia.de/apigateway/orderservice/orders/456",
  });
  page.emit("request", failedRequest);
  assert.equal(page.__OMNIA_VOICE_API_RECORDER__.requestByRequest.has(failedRequest), true);
  page.emit("requestfailed", failedRequest);
  assert.equal(page.__OMNIA_VOICE_API_RECORDER__.requestByRequest.has(failedRequest), false);

  const response = createFakeResponse({
    request,
    url: "https://api2.optica-omnia.de/apigateway/orderservice/orders/123",
    status: 201,
    statusText: "Created",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": "session=secret",
    },
  });
  page.emit("response", response);

  assert.equal(page.__OMNIA_VOICE_API_RECORDER__.events.length, 3);
  assert.match(page.__OMNIA_VOICE_API_RECORDER__.events[2].time, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(withoutTime(page.__OMNIA_VOICE_API_RECORDER__.events[2]), {
    type: "response",
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/orderservice/orders/123",
    path: "/apigateway/orderservice/orders/123",
    normalizedPath: "/apigateway/orderservice/orders/{id}",
    status: 201,
    statusText: "Created",
    contentType: "application/json; charset=utf-8",
    responseHeaders: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": "[REDACTED]",
    },
    requestPostData: { orderId: 123 },
  });

  const snapshot = snapshotApiRecording(page);
  assert.equal(snapshot.active, true);
  assert.equal(snapshot.eventCount, 3);
  assert.notEqual(snapshot.events, page.__OMNIA_VOICE_API_RECORDER__.events);
  assert.deepEqual(snapshot.events, page.__OMNIA_VOICE_API_RECORDER__.events);
  assert.deepEqual(snapshot.observations.map(withoutLastSeenAt), [
    {
      method: "POST",
      path: "/apigateway/orderservice/orders/{id}",
      status: 201,
      calls: 1,
    },
  ]);
  assert.match(snapshot.observations[0].lastSeenAt, /^\d{4}-\d{2}-\d{2}T/);

  const stopped = stopApiRecording(page);
  assert.deepEqual(page.offCalls.map((call) => call.event), ["request", "response", "requestfailed"]);
  assert.equal(page.__OMNIA_VOICE_API_RECORDER__, undefined);
  assert.equal(stopped.active, false);
  assert.equal(stopped.eventCount, 3);
  assert.deepEqual(stopped.events, snapshot.events);
  assert.deepEqual(stopped.observations.map(withoutLastSeenAt), snapshot.observations.map(withoutLastSeenAt));
});

test("startApiRecording stops an existing recorder before attaching new listeners", () => {
  const page = createFakePage();
  const first = startApiRecording(page);
  const firstRequestListener = page.listeners.get("request");
  const firstResponseListener = page.listeners.get("response");

  const second = startApiRecording(page);

  assert.equal(first.active, true);
  assert.equal(second.active, true);
  assert.notEqual(page.listeners.get("request"), firstRequestListener);
  assert.notEqual(page.listeners.get("response"), firstResponseListener);
  assert.deepEqual(page.offCalls, [
    { event: "request", listener: firstRequestListener },
    { event: "response", listener: firstResponseListener },
    { event: "requestfailed", listener: page.onCalls[2].listener },
  ]);
  assert.equal(Boolean(page.__OMNIA_VOICE_API_RECORDER__), true);
});

function createFakePage() {
  const listeners = new Map();
  return {
    listeners,
    onCalls: [],
    offCalls: [],
    on(event, listener) {
      this.onCalls.push({ event, listener });
      listeners.set(event, listener);
    },
    off(event, listener) {
      this.offCalls.push({ event, listener });
      if (listeners.get(event) === listener) {
        listeners.delete(event);
      }
    },
    emit(event, payload) {
      listeners.get(event)?.(payload);
    },
  };
}

function createFakeRequest({ method, url, resourceType = "xhr", headers = {}, postData = null }) {
  return {
    method: () => method,
    url: () => url,
    resourceType: () => resourceType,
    headers: () => headers,
    postData: () => postData,
  };
}

function createFakeResponse({ request, url, status, statusText = "", headers = {} }) {
  return {
    request: () => request,
    url: () => url,
    status: () => status,
    statusText: () => statusText,
    headers: () => headers,
  };
}

function withoutTime(event) {
  const { time, ...rest } = event;
  return rest;
}

function withoutLastSeenAt(observation) {
  const { lastSeenAt, ...rest } = observation;
  return rest;
}
