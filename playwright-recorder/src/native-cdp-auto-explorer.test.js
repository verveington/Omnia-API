import assert from "node:assert/strict";
import test from "node:test";

import {
  isSafeRoutePath,
  normalizeExploreTarget,
  selectNextExploreTarget,
  summarizeAutoExploreResult,
} from "./native-cdp-auto-explorer.js";

test("normalizeExploreTarget accepts only safe tabs and known routes", () => {
  assert.deepEqual(normalizeExploreTarget({
    role: "tab",
    text: "Dokumente",
    selected: false,
    selector: "[data-x='1']",
  }), {
    kind: "tab",
    key: "tab:Dokumente",
    label: "wechsel zu Dokumente",
    selector: "[data-x='1']",
    path: "",
  });

  assert.deepEqual(normalizeExploreTarget({
    role: "a",
    text: "search",
    href: "/search",
    selector: "[data-x='2']",
  }), {
    kind: "route",
    key: "route:/search",
    label: "gehe zu Suche",
    selector: "[data-x='2']",
    path: "/search",
  });

  assert.deepEqual(normalizeExploreTarget({
    role: "a",
    text: "Kasse",
    href: "/cash-till",
    selector: "[data-x='3']",
  }), {
    kind: "route",
    key: "route:/cash-till",
    label: "gehe zu Kasse",
    selector: "[data-x='3']",
    path: "/cash-till",
  });

  assert.deepEqual(normalizeExploreTarget({
    role: "a",
    text: "assignment Warenwirtschaft",
    href: "/warenwirtschaft",
    selector: "[data-x='4']",
  }), {
    kind: "route",
    key: "route:/warenwirtschaft",
    label: "gehe zu Warenwirtschaft",
    selector: "[data-x='4']",
    path: "/warenwirtschaft",
  });

  assert.deepEqual(normalizeExploreTarget({
    role: "button",
    text: "assignment Warenwirtschaft",
    appTitle: "Warenwirtschaft",
    classes: "apps-layer-btn",
    selector: "[data-x='app']",
    currentPath: "/",
  }), {
    kind: "app",
    key: "app:Warenwirtschaft",
    label: "gehe zu Warenwirtschaft",
    selector: "[data-x='app']",
    path: "",
  });

  assert.deepEqual(normalizeExploreTarget({
    role: "button",
    text: "apps",
    hasPopup: "menu",
    selector: "[data-x='menu']",
    currentPath: "/dashboard",
  }), {
    kind: "menu",
    key: "menu:apps:/dashboard",
    label: "öffne App-Menü",
    selector: "[data-x='menu']",
    path: "",
  });

  assert.equal(normalizeExploreTarget({
    role: "button",
    text: "apps",
    hasPopup: "menu",
    expanded: "true",
    selector: "[data-x='open-menu']",
    currentPath: "/dashboard",
  }), null);

  assert.equal(normalizeExploreTarget({ role: "button", text: "Speichern", selector: "button" }), null);
  assert.equal(normalizeExploreTarget({ role: "tab", text: "Historie", selected: true, selector: "[role=tab]" }), null);
  assert.equal(normalizeExploreTarget({ role: "a", text: "add", href: "/dashboard", selector: "a" }), null);
  assert.equal(normalizeExploreTarget({ role: "a", text: "Neuer Kunde", href: "/master-data/customers/new", selector: "a" }), null);
});

test("selectNextExploreTarget opens dashboard menus before routes and tabs", () => {
  const targets = [
    normalizeExploreTarget({ role: "a", text: "dvr", href: "/transactions", selector: "[data-x='route']" }),
    normalizeExploreTarget({ role: "button", text: "apps", hasPopup: "menu", selector: "[data-x='menu']", currentPath: "/dashboard" }),
    normalizeExploreTarget({ role: "tab", text: "Notizen", selected: false, selector: "[data-x='tab']" }),
    normalizeExploreTarget({ role: "button", text: "assignment Warenwirtschaft", appTitle: "Warenwirtschaft", classes: "apps-layer-btn", selector: "[data-x='app']" }),
  ];

  assert.equal(selectNextExploreTarget(targets, new Set()).label, "öffne App-Menü");
  assert.equal(selectNextExploreTarget(targets, new Set(["menu:apps:/dashboard"])).label, "gehe zu Warenwirtschaft");
  assert.equal(selectNextExploreTarget(targets, new Set(["menu:apps:/dashboard", "app:Warenwirtschaft"])).label, "gehe zu Vorgänge");
  assert.equal(selectNextExploreTarget(targets, new Set(["menu:apps:/dashboard", "app:Warenwirtschaft", "route:/transactions"])).label, "wechsel zu Notizen");
});

test("selectNextExploreTarget follows module subroutes before reopening the app menu", () => {
  const targets = [
    normalizeExploreTarget({ role: "button", text: "apps", hasPopup: "menu", selector: "[data-x='menu']", currentPath: "/merchandise-management" }),
    normalizeExploreTarget({ role: "a", text: "Artikelverwaltung", href: "/merchandise-management/article-management", selector: "[data-x='article-management']", currentPath: "/merchandise-management" }),
    normalizeExploreTarget({ role: "a", text: "search", href: "/search", selector: "[data-x='search']", currentPath: "/merchandise-management" }),
  ];

  assert.equal(targets[1].kind, "subroute");
  assert.equal(selectNextExploreTarget(targets, new Set()).label, "gehe zu Artikelverwaltung");
  assert.equal(selectNextExploreTarget(targets, new Set(["route:/merchandise-management/article-management"])).label, "öffne App-Menü");
});

test("isSafeRoutePath allows dashboard navigation but blocks edit and detail routes", () => {
  assert.equal(isSafeRoutePath("/dashboard"), true);
  assert.equal(isSafeRoutePath("/cash-till"), true);
  assert.equal(isSafeRoutePath("/master-data/customers"), true);
  assert.equal(isSafeRoutePath("/master-data/customers/new"), false);
  assert.equal(isSafeRoutePath("/master-data/customers/08901aa6-8c23-4e1b-8c61-109a8573feeb"), false);
  assert.equal(isSafeRoutePath("/transactions/edit/123"), false);
  assert.equal(isSafeRoutePath("/logout"), false);
});

test("summarizeAutoExploreResult reports learned stable commands", () => {
  assert.deepEqual(summarizeAutoExploreResult({
    clicked: [
      { label: "wechsel zu Notizen" },
      { label: "gehe zu Suche" },
    ],
    learnedSuggestions: [
      { command: "wechsel zu Notizen", reason: "Tab-Wechsel" },
      { command: "gehe zu Suche", reason: "Navigation per Link" },
    ],
  }), {
    clickedCount: 2,
    learnedCount: 2,
    clicked: ["wechsel zu Notizen", "gehe zu Suche"],
    learned: ["wechsel zu Notizen", "gehe zu Suche"],
  });
});
