import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  summarizeExplorerResult,
  writeExplorerReport,
} from "./report.ts";

test("summarizeExplorerResult includes navigation and blocked requests but not body values", () => {
  const summary = summarizeExplorerResult({
    startedAt: "2026-05-25T08:00:00.000Z",
    finishedAt: "2026-05-25T08:01:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard?token=%5BREDACTED%5D",
    finalUrl: "https://api2.optica-omnia.de/search",
    logFile: "logs/network/test-explore.jsonl",
    clicked: [{
      kind: "route",
      key: "route:/search",
      label: "Suche",
      selector: "[data-x='search']",
      path: "/search",
      reason: "safe-navigation",
      urlAfter: "https://api2.optica-omnia.de/search",
    }],
    skipped: [{ label: "Speichern", path: "", reason: "dangerous-label" }],
    blockedRequests: [{
      method: "POST",
      url: "https://api2.optica-omnia.de/apigateway/orders",
      reason: "post-not-read-like",
      resourceType: "xhr",
      postData: "name=Max",
    }],
    stopReason: "blocked-request",
  });

  assert.match(summary, /Suche/);
  assert.match(summary, /post-not-read-like/);
  assert.match(summary, /Speichern/);
  assert.doesNotMatch(summary, /Max/);
});

test("writeExplorerReport writes relative log file paths", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-report-"));
  const output = path.join(dir, "report.md");
  const workspaceRoot = path.join(dir, "workspace");
  const logFile = path.join(workspaceRoot, "logs", "network", "test-explore.jsonl");

  writeExplorerReport(output, {
    startedAt: "2026-05-25T08:00:00.000Z",
    finishedAt: "2026-05-25T08:01:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    finalUrl: "https://api2.optica-omnia.de/search",
    logFile,
    clicked: [],
    skipped: [],
    blockedRequests: [],
    stopReason: "no-more-targets",
  }, workspaceRoot);

  const text = fs.readFileSync(output, "utf8");
  assert.match(text, /logs\/network\/test-explore\.jsonl/);
  assert.doesNotMatch(text, new RegExp(workspaceRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("summarizeExplorerResult includes discovered UI targets as recording inventory", () => {
  const summary = summarizeExplorerResult({
    startedAt: "2026-05-25T08:00:00.000Z",
    finishedAt: "2026-05-25T08:01:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    finalUrl: "https://api2.optica-omnia.de/customers",
    logFile: "logs/network/test-explore.jsonl",
    clicked: [],
    discoveredTargets: [
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
    ],
    skipped: [],
    blockedRequests: [],
    stopReason: "no-more-targets",
  });

  assert.match(summary, /## UI-Zielinventar/);
  assert.match(summary, /Kunden/);
  assert.match(summary, /Offene Vorgange/);
  assert.match(summary, /offen/);
  assert.match(summary, /geklickt/);
});

test("summarizeExplorerResult includes structural UI snapshots", () => {
  const summary = summarizeExplorerResult({
    startedAt: "2026-05-25T08:00:00.000Z",
    finishedAt: "2026-05-25T08:01:00.000Z",
    startUrl: "https://api2.optica-omnia.de/dashboard",
    finalUrl: "https://api2.optica-omnia.de/master-data/customers",
    logFile: "logs/network/test-explore.jsonl",
    clicked: [],
    discoveredTargets: [],
    uiSnapshots: [
      {
        timestamp: "2026-05-25T08:00:01.000Z",
        step: "Dashboard",
        url: "https://api2.optica-omnia.de/dashboard",
        path: "/dashboard",
        title: "Dashboard",
        headings: ["Aufgaben"],
        actions: ["App-Menue"],
        formLabels: [],
        tableHeaders: [],
      },
      {
        timestamp: "2026-05-25T08:00:05.000Z",
        step: "Kunden",
        url: "https://api2.optica-omnia.de/master-data/customers",
        path: "/master-data/customers",
        title: "Kunden",
        headings: ["Kundensuche", "Treffer"],
        actions: ["Exportieren"],
        formLabels: ["Suchbegriff", "Status"],
        tableHeaders: ["Name", "Geburtsdatum", "Status"],
      },
    ],
    skipped: [],
    blockedRequests: [],
    stopReason: "no-more-targets",
  });

  assert.match(summary, /## UI-Struktur-Snapshots/);
  assert.match(summary, /Kundensuche, Treffer/);
  assert.match(summary, /Exportieren/);
  assert.match(summary, /Suchbegriff, Status/);
  assert.match(summary, /Name, Geburtsdatum, Status/);
});
