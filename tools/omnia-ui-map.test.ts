import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOmniaUiMap,
  buildOmniaUiMapMarkdown,
  parseOmniaUiMapArgs,
} from "./omnia-ui-map.ts";

test("buildOmniaUiMap combines clicked explorer markers and open manifest targets", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/auto.jsonl",
        records: [
          {
            type: "explore-marker",
            marker: "target-end",
            target: {
              kind: "route",
              key: "route:/customers",
              label: "Kunden",
              path: "/customers",
            },
          },
        ],
        manifestFile: "docs/recordings/auto-workflow-manifest.json",
        manifest: {
          schemaVersion: 1,
          mode: "auto",
          expectedEndpoints: [],
          explorer: {
            startUrl: "https://app.optica-omnia.de/dashboard",
            finalUrl: "https://app.optica-omnia.de/customers",
            stopReason: "no-more-targets",
            clickedTargets: 1,
            skippedTargets: 0,
            blockedRequests: 0,
            discoveredTargets: 2,
            openTargets: 1,
            topOpenTargets: [
              { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
            ],
          },
        },
      },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      recordingUrl: "https://omnia.example.test",
    },
  );

  assert.equal(map.recordingCount, 1);
  assert.equal(map.targetCount, 2);
  assert.equal(map.clickedTargetCount, 1);
  assert.equal(map.openTargetCount, 1);
  assert.deepEqual(
    map.targets.map((target) => ({
      label: target.label,
      path: target.path,
      clickedCount: target.clickedCount,
      openCount: target.openCount,
      seenCount: target.seenCount,
    })),
    [
      { label: "Artikel", path: "/articles", clickedCount: 0, openCount: 1, seenCount: 3 },
      { label: "Kunden", path: "/customers", clickedCount: 1, openCount: 0, seenCount: 1 },
    ],
  );
  assert.match(map.followupCommands[0].command, /node tools\/recording-workflow\.ts --mode manual/);
  assert.match(map.followupCommands[0].command, /Artikel/);
});

test("buildOmniaUiMap links explorer targets to API domains and endpoints", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/auto.jsonl",
        records: [
          {
            type: "explore-marker",
            marker: "target-start",
            step: "1. Kunden",
            target: {
              kind: "route",
              key: "route:/customers",
              label: "Kunden",
              path: "/customers",
            },
          },
          {
            type: "response",
            step: "1. Kunden",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          {
            type: "response",
            step: "1. Kunden",
            method: "POST",
            url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search",
            status: 200,
            resourceType: "fetch",
          },
          {
            type: "explore-marker",
            marker: "target-end",
            target: {
              kind: "route",
              key: "route:/customers",
              label: "Kunden",
              path: "/customers",
            },
          },
        ],
      },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      recordingUrl: "https://omnia.example.test",
    },
  );

  assert.equal(map.apiLinkedTargetCount, 1);
  assert.equal(map.apiEndpointCount, 2);
  assert.deepEqual(map.targets[0].apiAreas, ["Artikel/Warenbestand", "Kunden/Vorgaenge"]);
  assert.deepEqual(
    map.targets[0].apiEndpoints.map((endpoint) => `${endpoint.area}:${endpoint.method} ${endpoint.path} ${endpoint.count}`),
    [
      "Artikel/Warenbestand:POST /apigateway/articletenantservice/articles/simple-search 1",
      "Kunden/Vorgaenge:GET /apigateway/kunden/customers/search 1",
    ],
  );
});

test("buildOmniaUiMap derives UI surfaces from structural snapshots", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/auto.jsonl",
        records: [
          {
            type: "ui-snapshot",
            step: "1. Kunden",
            timestamp: "2026-06-03T09:00:00.000Z",
            path: "/master-data/customers",
            title: "Kunden",
            headings: ["Kundensuche", "Treffer"],
            actions: ["Exportieren", "Filter"],
            formLabels: ["Suchbegriff", "Status"],
            tableHeaders: ["Name", "Geburtsdatum", "Status"],
          },
          {
            type: "ui-snapshot",
            step: "2. Kunden Details",
            timestamp: "2026-06-03T09:00:10.000Z",
            path: "/master-data/customers/{id}",
            title: "Kunde [REDACTED]",
            headings: ["Stammdaten"],
            actions: ["Bearbeiten"],
            formLabels: ["Geburtsdatum"],
            tableHeaders: [],
          },
        ],
      },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      recordingUrl: "https://omnia.example.test",
    },
  );

  assert.equal(map.surfaceCount, 2);
  assert.deepEqual(
    map.surfaces.map((surface) => ({
      path: surface.path,
      title: surface.title,
      headings: surface.headings,
      actions: surface.actions,
      formLabels: surface.formLabels,
      tableHeaders: surface.tableHeaders,
      sourceCount: surface.sourceCount,
    })),
    [
      {
        path: "/master-data/customers",
        title: "Kunden",
        headings: ["Kundensuche", "Treffer"],
        actions: ["Exportieren", "Filter"],
        formLabels: ["Suchbegriff", "Status"],
        tableHeaders: ["Name", "Geburtsdatum", "Status"],
        sourceCount: 1,
      },
      {
        path: "/master-data/customers/{id}",
        title: "Kunde [REDACTED]",
        headings: ["Stammdaten"],
        actions: ["Bearbeiten"],
        formLabels: ["Geburtsdatum"],
        tableHeaders: [],
        sourceCount: 1,
      },
    ],
  );

  const markdown = buildOmniaUiMapMarkdown(map);
  assert.match(markdown, /- UI-Surfaces: 2/);
  assert.match(markdown, /## UI-Surfaces/);
  assert.match(markdown, /Kundensuche, Treffer/);
  assert.match(markdown, /Suchbegriff, Status/);
  assert.match(markdown, /Name, Geburtsdatum, Status/);
  assert.doesNotMatch(markdown, /Max Mustermann/);
});

test("buildOmniaUiMap links UI surfaces to API endpoints observed in the same step", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/manual.jsonl",
        records: [
          {
            type: "flow-marker",
            marker: "step-start",
            step: "Kundenliste oeffnen",
          },
          {
            type: "response",
            step: "Kundenliste oeffnen",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          {
            type: "ui-snapshot",
            step: "Kundenliste oeffnen",
            timestamp: "2026-06-03T09:00:00.000Z",
            path: "/master-data/customers",
            title: "Kunden",
            headings: ["Kundensuche"],
            actions: ["Exportieren"],
            formLabels: ["Suchbegriff"],
            tableHeaders: ["Name", "Status"],
          },
        ],
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  assert.equal(map.surfaces[0].apiEndpointCount, 1);
  assert.deepEqual(map.surfaces[0].apiAreas, ["Kunden/Vorgaenge"]);
  assert.deepEqual(
    map.surfaces[0].apiEndpoints.map((endpoint) => `${endpoint.area}:${endpoint.method} ${endpoint.path} ${endpoint.count}`),
    ["Kunden/Vorgaenge:GET /apigateway/kunden/customers/search 1"],
  );

  const markdown = buildOmniaUiMapMarkdown(map);
  assert.match(markdown, /## API-Verknuepfte UI-Surfaces/);
  assert.match(markdown, /Kunden\/Vorgaenge: GET `\/apigateway\/kunden\/customers\/search`/);
});

test("buildOmniaUiMapMarkdown documents open UI targets and follow-up commands", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/auto.jsonl",
        records: [],
        manifestFile: "docs/recordings/auto-workflow-manifest.json",
        manifest: {
          schemaVersion: 1,
          mode: "auto",
          expectedEndpoints: [],
          explorer: {
            startUrl: "https://app.optica-omnia.de/dashboard",
            finalUrl: "https://app.optica-omnia.de/customers",
            stopReason: "no-more-targets",
            clickedTargets: 0,
            skippedTargets: 0,
            blockedRequests: 0,
            discoveredTargets: 1,
            openTargets: 1,
            topOpenTargets: [
              { kind: "tab", label: "Notizen", path: "", seenCount: 1 },
            ],
          },
        },
      },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      recordingUrl: "https://omnia.example.test",
    },
  );

  const markdown = buildOmniaUiMapMarkdown(map);

  assert.match(markdown, /^# Omnia-UI-Map/m);
  assert.match(markdown, /Offene UI-Ziele: 1/);
  assert.match(markdown, /Notizen/);
  assert.match(markdown, /API-Verknuepfte UI-Ziele/);
  assert.match(markdown, /Nachfahr-Kommandos/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
  assert.match(markdown, /--url https:\/\/omnia\.example\.test/);
});

test("buildOmniaUiMap creates follow-up commands for clicked targets without API linkage", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/auto.jsonl",
        records: [
          {
            type: "explore-marker",
            marker: "target-end",
            target: {
              kind: "route",
              label: "Barverkauf",
              path: "/cash-till/direct-sale",
            },
          },
        ],
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  assert.equal(map.followupCommands.length, 1);
  assert.equal(map.followupCommands[0].reason, "geklickt, aber kein API-Verkehr eindeutig zugeordnet");
  assert.match(map.followupCommands[0].command, /Barverkauf/);
});

test("buildOmniaUiMapMarkdown documents the reason for unlinked UI follow-ups", () => {
  const map = buildOmniaUiMap(
    [
      {
        logFile: "logs/network/auto.jsonl",
        records: [
          {
            type: "explore-marker",
            marker: "target-end",
            target: {
              kind: "route",
              label: "Dauerversorgungen",
              path: "/recurring-supplies",
            },
          },
        ],
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildOmniaUiMapMarkdown(map);

  assert.match(markdown, /Dauerversorgungen/);
  assert.match(markdown, /Grund: geklickt, aber kein API-Verkehr eindeutig zugeordnet/);
  assert.match(markdown, /UI-Ziel Dauerversorgungen \/recurring-supplies erneut oeffnen/);
});

test("parseOmniaUiMapArgs defaults to docs UI map output", () => {
  const options = parseOmniaUiMapArgs([]);

  assert.equal(options.outputFile.endsWith("docs/14_omnia_ui_map.md"), true);
});
