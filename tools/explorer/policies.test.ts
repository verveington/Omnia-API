import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCandidate,
  classifyReadOnlyRequest,
  normalizeCandidate,
  moduleScopePath,
  selectNextTarget,
  selectNextFrontierRouteTarget,
  shouldWaitForLogin,
} from "./policies.ts";

test("classifyCandidate allows safe read-only UI targets", () => {
  assert.deepEqual(classifyCandidate({
    role: "link",
    text: "Warenwirtschaft",
    href: "/warenwirtschaft",
    selector: "[data-x='route']",
  }), { allowed: true, reason: "safe-navigation" });

  assert.deepEqual(classifyCandidate({
    role: "tab",
    text: "Historie",
    selected: false,
    selector: "[data-x='tab']",
  }), { allowed: true, reason: "safe-tab" });

  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "apps",
    hasPopup: "menu",
    selector: "[data-x='apps']",
  }), { allowed: true, reason: "safe-menu" });

  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "more_vert",
    hasPopup: "menu",
    selector: "[data-x='row-actions']",
  }), { allowed: true, reason: "safe-action-menu" });

  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "more_vert",
    selector: "[data-x='row-actions-no-popup']",
  }), { allowed: true, reason: "safe-action-menu" });

  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "edit",
    selector: "[data-x='edit']",
  }), { allowed: true, reason: "safe-detail-open" });

  assert.deepEqual(classifyCandidate({
    role: "input",
    tag: "input",
    inputType: "text",
    placeholder: "Kunden / Artikel",
    selector: "[data-x='search-input']",
  }), { allowed: true, reason: "safe-search-input" });

  assert.deepEqual(classifyCandidate({
    role: "row",
    tag: "tr",
    text: "Musterartikel LOCAL aktiv",
    selector: "[data-x='row']",
  }), { allowed: true, reason: "safe-table-row" });
});

test("classifyCandidate blocks write-like labels and dangerous routes", () => {
  assert.deepEqual(classifyCandidate({
    role: "button",
    text: "Speichern",
    selector: "[data-x='save']",
  }), { allowed: false, reason: "dangerous-label" });

  assert.deepEqual(classifyCandidate({
    role: "link",
    text: "Neuer Kunde",
    href: "/kunden/new",
    selector: "[data-x='new']",
  }), { allowed: false, reason: "dangerous-label" });

  assert.deepEqual(classifyCandidate({
    role: "link",
    text: "Kundendetail",
    href: "/kunden/08901aa6-8c23-4e1b-8c61-109a8573feeb",
    selector: "[data-x='detail']",
  }), { allowed: false, reason: "dangerous-route" });

  assert.deepEqual(classifyCandidate({
    role: "input",
    tag: "input",
    inputType: "password",
    placeholder: "Suche",
    selector: "[data-x='password']",
  }), { allowed: false, reason: "unsafe-search-input" });
});

test("normalizeCandidate creates stable keys for menu and routes", () => {
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
    role: "input",
    tag: "input",
    inputType: "search",
    placeholder: "Suche",
    currentPath: "/master-data/customers",
    selector: "[data-x='search']",
  }), {
    kind: "search",
    key: "search:/master-data/customers:Suche",
    label: "Suche",
    selector: "[data-x='search']",
    path: "",
    reason: "safe-search-input",
  });

  assert.deepEqual(normalizeCandidate({
    role: "button",
    text: "edit",
    currentPath: "/master-data/customers",
    selector: "[data-x='edit']",
  }), {
    kind: "detail",
    key: "detail:/master-data/customers:Detail oeffnen",
    label: "Detail oeffnen",
    selector: "[data-x='edit']",
    path: "",
    reason: "safe-detail-open",
  });

  assert.deepEqual(normalizeCandidate({
    role: "button",
    text: "more_vert",
    hasPopup: "menu",
    currentPath: "/master-data/customers",
    selector: "[data-x='row-actions']",
  }), {
    kind: "action-menu",
    key: "action-menu:/master-data/customers:Aktionen",
    label: "Aktionen",
    selector: "[data-x='row-actions']",
    path: "",
    reason: "safe-action-menu",
  });

  assert.deepEqual(normalizeCandidate({
    role: "row",
    tag: "tr",
    text: "Musterartikel LOCAL aktiv",
    currentPath: "/merchandise-management/article-management/articles",
    selector: "[data-x='row']",
  }), {
    kind: "row",
    key: "row:/merchandise-management/article-management/articles:Musterartikel LOCAL aktiv",
    label: "Musterartikel LOCAL aktiv",
    selector: "[data-x='row']",
    path: "",
    reason: "safe-table-row",
  });
});

test("classifyReadOnlyRequest allows only safe read-like traffic", () => {
  assert.deepEqual(classifyReadOnlyRequest({
    method: "GET",
    url: "https://api2.optica-omnia.de/apigateway/userservice/feature-toggles",
  }), { allowed: true, reason: "safe-method" });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/keycloak/auth/realms/502753/protocol/openid-connect/token",
  }), { allowed: true, reason: "auth-token" });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/search",
    postData: "{\"page\":0,\"size\":25,\"order\":\"ASC\"}",
  }), { allowed: true, reason: "read-like-post" });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/wawi/order-arrival/search",
    postData: "{\"keywords\":\"\",\"active\":true,\"orderNr\":\"463\"}",
  }), { allowed: true, reason: "read-like-post" });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/wawiservice/order-arrival/book",
    postData: "{\"quantity\":1}",
  }), { allowed: false, reason: "post-mutation-like" });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/userservice/metrics/user-login",
  }), { allowed: false, reason: "telemetry-post" });

  assert.equal(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/orders/submit",
  }).allowed, false);

  assert.equal(classifyReadOnlyRequest({
    method: "PUT",
    url: "https://api2.optica-omnia.de/apigateway/articles/123",
  }).allowed, false);
});

test("classifyReadOnlyRequest strict mode blocks read-like POSTs but not auth", () => {
  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/keycloak/auth/realms/502753/protocol/openid-connect/token",
    allowReadLikePosts: false,
  }), { allowed: true, reason: "auth-token" });

  assert.deepEqual(classifyReadOnlyRequest({
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/search",
    allowReadLikePosts: false,
  }), { allowed: false, reason: "post-disallowed" });
});

test("shouldWaitForLogin only waits when enabled and URL is login", () => {
  assert.equal(shouldWaitForLogin("https://api2.optica-omnia.de/login", true), true);
  assert.equal(shouldWaitForLogin("https://api2.optica-omnia.de/login", false), false);
  assert.equal(shouldWaitForLogin("https://api2.optica-omnia.de/dashboard", true), false);
});

test("selectNextFrontierRouteTarget reuses open safe routes from the inventory", () => {
  const visited = new Set(["route:/customers"]);
  const next = selectNextFrontierRouteTarget([
    {
      kind: "route",
      key: "route:/customers",
      label: "Kunden",
      path: "/customers",
      reason: "safe-navigation",
      seenCount: 3,
      clicked: false,
    },
    {
      kind: "tab",
      key: "tab:/transactions:Archiv",
      label: "Archiv",
      path: "",
      reason: "safe-tab",
      seenCount: 1,
      clicked: false,
    },
    {
      kind: "route",
      key: "route:/transactions/list",
      label: "Vorgangsliste",
      path: "/transactions/list",
      reason: "safe-navigation",
      seenCount: 2,
      clicked: false,
    },
  ], visited);

  assert.deepEqual(next, {
    kind: "route",
    key: "route:/transactions/list",
    label: "Vorgangsliste",
    selector: "",
    path: "/transactions/list",
    reason: "safe-navigation",
  });
});

test("selectNextTarget keeps scoped module runs inside the start module", () => {
  const next = selectNextTarget([
    {
      kind: "route",
      key: "route:/search",
      label: "Suche",
      selector: "[data-x='search']",
      path: "/search",
      reason: "safe-navigation",
    },
    {
      kind: "menu",
      key: "menu:/merchandise-management/order-management/order-proposals",
      label: "App-Menue",
      selector: "[data-x='apps']",
      path: "",
      reason: "safe-menu",
    },
    {
      kind: "route",
      key: "route:/merchandise-management/order-management/orders",
      label: "Bestellungen",
      selector: "[data-x='orders']",
      path: "/merchandise-management/order-management/orders",
      reason: "safe-navigation",
    },
  ], new Set(), "/merchandise-management/order-management");

  assert.equal(next?.key, "route:/merchandise-management/order-management/orders");
});

test("selectNextTarget prefers detail actions over additional table rows", () => {
  const next = selectNextTarget([
    {
      kind: "row",
      key: "row:/master-data/customers:Weitere Kundin",
      label: "Weitere Kundin",
      selector: "[data-x='row-2']",
      path: "",
      reason: "safe-table-row",
    },
    {
      kind: "detail",
      key: "detail:/master-data/customers:Detail oeffnen",
      label: "Detail oeffnen",
      selector: "[data-x='edit']",
      path: "",
      reason: "safe-detail-open",
    },
  ], new Set(["row:/master-data/customers:Erste Kundin"]), "/master-data");

  assert.equal(next?.key, "detail:/master-data/customers:Detail oeffnen");
});

test("selectNextTarget selects a table row before detail actions when no row was visited", () => {
  const next = selectNextTarget([
    {
      kind: "row",
      key: "row:/master-data/customers:Erste Kundin",
      label: "Erste Kundin",
      selector: "[data-x='row-1']",
      path: "",
      reason: "safe-table-row",
    },
    {
      kind: "detail",
      key: "detail:/master-data/customers:Detail oeffnen",
      label: "Detail oeffnen",
      selector: "[data-x='edit']",
      path: "",
      reason: "safe-detail-open",
    },
  ], new Set(), "/master-data");

  assert.equal(next?.key, "row:/master-data/customers:Erste Kundin");
});

test("selectNextTarget selects module rows before the app menu on module pages", () => {
  const next = selectNextTarget([
    {
      kind: "menu",
      key: "menu:/master-data/customers",
      label: "App-Menue",
      selector: "[data-x='apps']",
      path: "",
      reason: "safe-menu",
    },
    {
      kind: "row",
      key: "row:/master-data/customers:Max Mustermann",
      label: "Max Mustermann",
      selector: "[data-x='row']",
      path: "",
      reason: "safe-table-row",
    },
  ], new Set(), "/master-data");

  assert.equal(next?.key, "row:/master-data/customers:Max Mustermann");
});

test("selectNextTarget opens action menus after a row was visited", () => {
  const next = selectNextTarget([
    {
      kind: "row",
      key: "row:/master-data/customers:Weitere Kundin",
      label: "Weitere Kundin",
      selector: "[data-x='row-2']",
      path: "",
      reason: "safe-table-row",
    },
    {
      kind: "action-menu",
      key: "action-menu:/master-data/customers:Aktionen",
      label: "Aktionen",
      selector: "[data-x='row-actions']",
      path: "",
      reason: "safe-action-menu",
    },
  ], new Set(["row:/master-data/customers:Erste Kundin"]), "/master-data");

  assert.equal(next?.key, "action-menu:/master-data/customers:Aktionen");
});

test("selectNextFrontierRouteTarget keeps scoped frontier routes inside the start module", () => {
  const next = selectNextFrontierRouteTarget([
    {
      kind: "route",
      key: "route:/cash-till/register",
      label: "Kassenverwaltung",
      path: "/cash-till/register",
      reason: "safe-navigation",
      seenCount: 5,
      clicked: false,
    },
    {
      kind: "route",
      key: "route:/merchandise-management/order-management/orders",
      label: "Bestellungen",
      path: "/merchandise-management/order-management/orders",
      reason: "safe-navigation",
      seenCount: 1,
      clicked: false,
    },
  ], new Set(), moduleScopePath("/merchandise-management/order-management/order-proposals"));

  assert.equal(next?.key, "route:/merchandise-management/order-management/orders");
});
