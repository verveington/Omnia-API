import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCandidate,
  classifyReadOnlyRequest,
  shouldWaitForLogin,
  normalizeCandidate,
  summarizeExplorerResult,
} from "./explore-app.ts";

test("classifyCandidate allows navigation and tabs but blocks write-like actions", () => {
  assert.deepEqual(classifyCandidate({
    role: "link",
    text: "Warenwirtschaft",
    href: "/warenwirtschaft",
    selector: "[data-x='route']",
  }), {
    allowed: true,
    reason: "safe-navigation",
  });

  assert.deepEqual(classifyCandidate({
    role: "tab",
    text: "Historie",
    selected: false,
    selector: "[data-x='tab']",
  }), {
    allowed: true,
    reason: "safe-tab",
  });

  assert.equal(classifyCandidate({ role: "button", text: "Speichern", selector: "button" }).allowed, false);
  assert.equal(classifyCandidate({
    role: "link",
    text: "Neuer Kunde",
    href: "/kunden/new",
    selector: "[data-x='new-customer']",
  }).allowed, false);

  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "Neues Hilfsmittel",
    selector: "[data-x='new-aid']",
  }), {
    allowed: false,
    reason: "dangerous-label",
  });
});

test("classifyCandidate allows app menu opening but not selected tabs or detail routes", () => {
  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "apps",
    hasPopup: "menu",
    expanded: false,
    selector: "[data-x='apps']",
  }), {
    allowed: true,
    reason: "safe-menu",
  });

  assert.equal(classifyCandidate({ role: "tab", text: "Historie", selected: true, selector: "[role=tab]" }).allowed, false);
  assert.equal(classifyCandidate({
    role: "link",
    text: "Kundendetail",
    href: "/kunden/08901aa6-8c23-4e1b-8c61-109a8573feeb",
    selector: "[data-x='detail']",
  }).allowed, false);
});

test("normalizeCandidate produces stable keys and labels", () => {
  assert.deepEqual(normalizeCandidate({
    role: "link",
    text: "Artikelverwaltung",
    href: "/warenwirtschaft/artikelverwaltung",
    selector: "[data-x='article']",
  }), {
    kind: "route",
    key: "route:/warenwirtschaft/artikelverwaltung",
    label: "Artikelverwaltung",
    selector: "[data-x='article']",
    path: "/warenwirtschaft/artikelverwaltung",
    reason: "safe-navigation",
  });

  assert.deepEqual(normalizeCandidate({
    role: "button",
    text: "apps",
    hasPopup: "menu",
    currentPath: "/dashboard",
    selector: "[data-x='apps']",
  }), {
    kind: "menu",
    key: "menu:/dashboard",
    label: "App-Menue",
    selector: "[data-x='apps']",
    path: "",
    reason: "safe-menu",
  });
});

test("classifyReadOnlyRequest allows safe reads and blocks mutations", () => {
  assert.deepEqual(classifyReadOnlyRequest({
    method: "GET",
    url: "https://api2.optica-omnia.de/apigateway/users",
  }), {
    allowed: true,
    reason: "safe-method",
  });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/search",
  }), {
    allowed: true,
    reason: "read-like-post",
  });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/wawi/order-arrival/search",
    postData: "{\"keywords\":\"\",\"active\":true}",
  }), {
    allowed: true,
    reason: "read-like-post",
  });

  assert.equal(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses",
    postData: "{\"name\":\"Muster\"}",
  }).allowed, false);

  assert.equal(classifyReadOnlyRequest({
    method: "PUT",
    url: "https://api2.optica-omnia.de/apigateway/articles/123",
  }).allowed, false);
});

test("classifyReadOnlyRequest blocks mutation-looking GraphQL and submit paths", () => {
  assert.equal(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/graphql",
    postData: "mutation SaveCustomer { saveCustomer { id } }",
  }).allowed, false);

  assert.equal(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/orders/submit",
  }).allowed, false);
});

test("classifyReadOnlyRequest allows auth token posts but blocks telemetry posts", () => {
  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/keycloak/auth/realms/502753/protocol/openid-connect/token",
  }), {
    allowed: true,
    reason: "auth-token",
  });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/userservice/workspaces/log",
  }), {
    allowed: false,
    reason: "telemetry-post",
  });
});

test("classifyReadOnlyRequest allows read-like search posts with sort order fields", () => {
  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/search",
    postData: "{\"page\":0,\"size\":25,\"order\":\"ASC\",\"sort\":\"updatedAt\"}",
  }), {
    allowed: true,
    reason: "read-like-post",
  });
});

test("summarizeExplorerResult omits sensitive request bodies", () => {
  const summary = summarizeExplorerResult({
    startedAt: "2026-05-21T20:00:00.000Z",
    finishedAt: "2026-05-21T20:01:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    finalUrl: "https://api2.optica-omnia.de/warenwirtschaft",
    logFile: "/tmp/logs/network/2026-05-21_20-00-explore.jsonl",
    clicked: [{ label: "Warenwirtschaft", path: "/warenwirtschaft", key: "route:/warenwirtschaft" }],
    skipped: [{ label: "Speichern", reason: "dangerous-label" }],
    blockedRequests: [{
      method: "POST",
      url: "https://api2.optica-omnia.de/apigateway/orders",
      reason: "post-not-read-like",
      postData: "name=Max",
    }],
    stopReason: "blocked-request",
  });

  assert.match(summary, /Warenwirtschaft/);
  assert.match(summary, /post-not-read-like/);
  assert.doesNotMatch(summary, /Max/);
});

test("shouldWaitForLogin only waits on login pages when explicitly enabled", () => {
  assert.equal(shouldWaitForLogin("https://api2.optica-omnia.de/login", true), true);
  assert.equal(shouldWaitForLogin("https://api2.optica-omnia.de/login", false), false);
  assert.equal(shouldWaitForLogin("https://api2.optica-omnia.de/dashboard", true), false);
});
