import assert from "node:assert/strict";
import test from "node:test";

import { createExplorerState } from "./state.ts";

test("createExplorerState records skipped targets once and suppresses root-route noise", () => {
  const state = createExplorerState({
    startedAt: "2026-05-25T08:00:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    logFile: "/tmp/logs/network/test-explore.jsonl",
  });

  state.rememberSkipped([
    { role: "button", text: "Profil Mustermann", selector: "[data-x='profile']" },
    { role: "button", text: "Profil Mustermann", selector: "[data-x='profile']" },
    { role: "button", text: "Speichern", selector: "[data-x='save']" },
    { role: "link", text: "Neu", href: "/transactions/new", selector: "[data-x='new']" },
  ]);

  const result = state.finish({
    finalUrl: "https://api2.optica-omnia.de/dashboard",
    finishedAt: "2026-05-25T08:01:00.000Z",
    stopReason: "no-more-targets",
  });

  assert.deepEqual(result.skipped, [
    { label: "Speichern", path: "", reason: "dangerous-label" },
    { label: "Neu", path: "/transactions/new", reason: "dangerous-label" },
  ]);
});

test("createExplorerState records clicked targets and blocked requests", () => {
  const state = createExplorerState({
    startedAt: "2026-05-25T08:00:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    logFile: "/tmp/logs/network/test-explore.jsonl",
  });

  state.recordClicked({
    kind: "route",
    key: "route:/search",
    label: "Suche",
    selector: "[data-x='search']",
    path: "/search",
    reason: "safe-navigation",
    urlAfter: "https://api2.optica-omnia.de/search",
  });
  state.recordBlockedRequest({
    timestamp: "2026-05-25T08:00:05.000Z",
    method: "POST",
    url: "https://api2.optica-omnia.de/apigateway/userservice/metrics/user-login",
    reason: "telemetry-post",
    resourceType: "xhr",
  });

  const result = state.finish({
    finalUrl: "https://api2.optica-omnia.de/search",
    finishedAt: "2026-05-25T08:01:00.000Z",
    stopReason: "no-more-targets",
  });

  assert.equal(result.clicked.length, 1);
  assert.equal(result.clicked[0].label, "Suche");
  assert.equal(result.blockedRequests.length, 1);
  assert.equal(result.blockedRequests[0].reason, "telemetry-post");
});

test("createExplorerState keeps a deduplicated inventory of discovered safe targets", () => {
  const state = createExplorerState({
    startedAt: "2026-05-25T08:00:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    logFile: "/tmp/logs/network/test-explore.jsonl",
  });

  state.rememberDiscoveredTargets([
    {
      kind: "route",
      key: "route:/customers",
      label: "Kunden",
      selector: "[data-x='customers']",
      path: "/customers",
      reason: "safe-navigation",
    },
    {
      kind: "tab",
      key: "tab:/customers:Offene Vorgange",
      label: "Offene Vorgange",
      selector: "[data-x='open-cases']",
      path: "",
      reason: "safe-tab",
    },
  ]);
  state.rememberDiscoveredTargets([
    {
      kind: "route",
      key: "route:/customers",
      label: "Kunden",
      selector: "[data-x='customers-again']",
      path: "/customers",
      reason: "safe-navigation",
    },
  ]);
  state.recordClicked({
    kind: "route",
    key: "route:/customers",
    label: "Kunden",
    selector: "[data-x='customers']",
    path: "/customers",
    reason: "safe-navigation",
    urlAfter: "https://api2.optica-omnia.de/customers",
  });

  const result = state.finish({
    finalUrl: "https://api2.optica-omnia.de/customers",
    finishedAt: "2026-05-25T08:01:00.000Z",
    stopReason: "no-more-targets",
  });

  assert.deepEqual(result.discoveredTargets, [
    {
      kind: "route",
      key: "route:/customers",
      label: "Kunden",
      path: "/customers",
      reason: "safe-navigation",
      seenCount: 2,
      clicked: true,
    },
    {
      kind: "tab",
      key: "tab:/customers:Offene Vorgange",
      label: "Offene Vorgange",
      path: "",
      reason: "safe-tab",
      seenCount: 1,
      clicked: false,
    },
  ]);
});

test("createExplorerState keeps UI structure snapshots in chronological order", () => {
  const state = createExplorerState({
    startedAt: "2026-05-25T08:00:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    logFile: "/tmp/logs/network/test-explore.jsonl",
  });

  state.recordUiSnapshot({
    timestamp: "2026-05-25T08:00:01.000Z",
    step: "Dashboard",
    url: "https://api2.optica-omnia.de/dashboard",
    path: "/dashboard",
    title: "Dashboard",
    headings: ["Aufgaben"],
    actions: ["App-Menue"],
    formLabels: [],
    tableHeaders: [],
  });
  state.recordUiSnapshot({
    timestamp: "2026-05-25T08:00:03.000Z",
    step: "Kunden",
    url: "https://api2.optica-omnia.de/master-data/customers",
    path: "/master-data/customers",
    title: "Kunden",
    headings: ["Kundensuche"],
    actions: ["Exportieren"],
    formLabels: ["Suchbegriff"],
    tableHeaders: ["Name", "Status"],
  });

  const result = state.finish({
    finalUrl: "https://api2.optica-omnia.de/master-data/customers",
    finishedAt: "2026-05-25T08:01:00.000Z",
    stopReason: "no-more-targets",
  });

  assert.deepEqual(result.uiSnapshots?.map((snapshot) => ({
    step: snapshot.step,
    path: snapshot.path,
    headings: snapshot.headings,
    actions: snapshot.actions,
  })), [
    {
      step: "Dashboard",
      path: "/dashboard",
      headings: ["Aufgaben"],
      actions: ["App-Menue"],
    },
    {
      step: "Kunden",
      path: "/master-data/customers",
      headings: ["Kundensuche"],
      actions: ["Exportieren"],
    },
  ]);
});
