import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildRecordingScoreboard,
  buildRecordingScoreboardMarkdown,
  parseRecordingScoreboardArgs,
  parseExpectedEndpointResultsFromMarkdown,
  parseExpectedEndpointResultsFromManifest,
  writeRecordingScoreboard,
} from "./recording-scoreboard.ts";

test("buildRecordingScoreboard computes chronological learning contributions", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "POST", path: "/articles/simple-search", source: "test" },
    { method: "POST", path: "/orders/from-proposal", source: "test" },
  ];
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/001.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
      {
        file: "logs/network/002.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          {
            type: "response",
            method: "POST",
            url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search",
            status: 200,
            resourceType: "fetch",
          },
          { type: "ui-snapshot", routePath: "/articles", title: "Artikel" },
        ],
      },
    ],
    known,
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      summaryMarkdownByLogFile: {
        "logs/network/001.jsonl": [
          "## Erwartete Endpunkte",
          "",
          "| Endpoint | Ergebnis |",
          "|---|---|",
          "| GET `/customers/search` | gesehen |",
        ].join("\n"),
        "logs/network/002.jsonl": [
          "## Erwartete Endpunkte",
          "",
          "| Endpoint | Ergebnis |",
          "|---|---|",
          "| POST `/articles/simple-search` | gesehen |",
          "| POST `/orders/from-proposal` | fehlt |",
        ].join("\n"),
      },
    },
  );

  assert.equal(scoreboard.recordingCount, 2);
  assert.equal(scoreboard.finalCoveragePercent, 66.67);
  assert.equal(scoreboard.totalNewKnownInventoryEndpoints, 2);
  assert.deepEqual(
    scoreboard.entries.map((entry) => entry.newKnownInventoryEndpoints),
    [1, 1],
  );
  assert.deepEqual(
    scoreboard.entries.map((entry) => entry.coverageAfterPercent),
    [33.33, 66.67],
  );
  assert.equal(scoreboard.entries[1].topAreas[0], "Artikel/Warenbestand");
  assert.deepEqual(
    scoreboard.entries.map((entry) => [entry.expectedEndpoints, entry.expectedEndpointsObserved, entry.expectedEndpointsMissing]),
    [
      [1, 1, 0],
      [2, 1, 1],
    ],
  );
  assert.equal(scoreboard.expectedEndpointHitRatePercent, 66.67);
});

test("buildRecordingScoreboardMarkdown shows learning curve and best recordings", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/001.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      summaryMarkdownByLogFile: {
        "logs/network/001.jsonl": [
          "## Erwartete Endpunkte",
          "",
          "| Endpoint | Ergebnis |",
          "|---|---|",
          "| GET `/customers/search` | gesehen |",
        ].join("\n"),
      },
    },
  );

  const markdown = buildRecordingScoreboardMarkdown(scoreboard);

  assert.match(markdown, /^# Recording-Scoreboard/m);
  assert.match(markdown, /Finale Coverage: 100 %/);
  assert.match(markdown, /001\.jsonl/);
  assert.match(markdown, /Kunden\/Vorgaenge/);
  assert.match(markdown, /Neue bekannte Inventar-Endpunkte/);
  assert.match(markdown, /Ziel-Endpunkte: 1 \/ 1 gesehen \(100 %\)/);
  assert.match(markdown, /Ziel-Endpunkte/);
});

test("parseExpectedEndpointResultsFromMarkdown reads seen and missing expected endpoints", () => {
  const results = parseExpectedEndpointResultsFromMarkdown([
    "# Recording-Workflow",
    "",
    "## Erwartete Endpunkte",
    "",
    "| Endpoint | Ergebnis |",
    "|---|---|",
    "| GET `/customers/search` | gesehen |",
    "| POST `/orders/from-proposal` | fehlt |",
  ].join("\n"));

  assert.deepEqual(results, [
    { method: "GET", path: "/customers/search", observed: true },
    { method: "POST", path: "/orders/from-proposal", observed: false },
  ]);
});

test("parseExpectedEndpointResultsFromManifest reads target endpoint results from workflow manifests", () => {
  const results = parseExpectedEndpointResultsFromManifest({
    schemaVersion: 1,
    expectedEndpoints: [
      { method: "GET", path: "/customers/search", source: "test", observed: true },
      { method: "POST", path: "/orders/from-proposal", source: "test", observed: false },
    ],
  });

  assert.deepEqual(results, [
    { method: "GET", path: "/customers/search", observed: true },
    { method: "POST", path: "/orders/from-proposal", observed: false },
  ]);
});

test("buildRecordingScoreboard prefers manifest target endpoint results over markdown summaries", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/001.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
    ],
    [
      { method: "GET", path: "/customers/search", source: "test" },
      { method: "POST", path: "/orders/from-proposal", source: "test" },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      manifestByLogFile: {
        "logs/network/001.jsonl": {
          schemaVersion: 1,
          expectedEndpoints: [
            { method: "GET", path: "/customers/search", source: "test", observed: true },
            { method: "POST", path: "/orders/from-proposal", source: "test", observed: false },
          ],
        },
      },
      summaryMarkdownByLogFile: {
        "logs/network/001.jsonl": [
          "## Erwartete Endpunkte",
          "",
          "| Endpoint | Ergebnis |",
          "|---|---|",
          "| GET `/customers/search` | gesehen |",
        ].join("\n"),
      },
    },
  );

  assert.deepEqual(
    scoreboard.entries.map((entry) => [entry.expectedEndpoints, entry.expectedEndpointsObserved, entry.expectedEndpointsMissing]),
    [[2, 1, 1]],
  );
});

test("buildRecordingScoreboard reads explorer stats from workflow manifests", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/auto.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      manifestByLogFile: {
        "logs/network/auto.jsonl": {
          schemaVersion: 1,
          expectedEndpoints: [
            { method: "GET", path: "/customers/search", source: "test", observed: true },
          ],
          explorer: {
            startUrl: "https://app.optica-omnia.de/dashboard",
            finalUrl: "https://app.optica-omnia.de/customers",
            stopReason: "no-more-targets",
            clickedTargets: 7,
            skippedTargets: 14,
            blockedRequests: 2,
            discoveredTargets: 12,
            openTargets: 3,
            topOpenTargets: [
              { kind: "route", label: "Artikel", path: "/articles", seenCount: 4 },
            ],
          },
        },
      },
    },
  );

  assert.equal(scoreboard.totalExplorerClickedTargets, 7);
  assert.equal(scoreboard.totalExplorerSkippedTargets, 14);
  assert.equal(scoreboard.totalExplorerBlockedRequests, 2);
  assert.equal(scoreboard.totalExplorerDiscoveredTargets, 12);
  assert.equal(scoreboard.totalExplorerOpenTargets, 3);
  assert.deepEqual(
    scoreboard.entries.map((entry) => ({
      clicked: entry.explorerClickedTargets,
      skipped: entry.explorerSkippedTargets,
      blocked: entry.explorerBlockedRequests,
      discovered: entry.explorerDiscoveredTargets,
      open: entry.explorerOpenTargets,
      topOpenTargets: entry.explorerTopOpenTargets,
      stopReason: entry.explorerStopReason,
    })),
    [
      {
        clicked: 7,
        skipped: 14,
        blocked: 2,
        discovered: 12,
        open: 3,
        topOpenTargets: [
          { kind: "route", label: "Artikel", path: "/articles", seenCount: 4 },
        ],
        stopReason: "no-more-targets",
      },
    ],
  );
});

test("buildRecordingScoreboard keeps workflow purpose from manifests", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/baseline.jsonl",
        records: [
          { type: "flow-marker", marker: "step-start", step: "Kunde suchen" },
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      manifestByLogFile: {
        "logs/network/baseline.jsonl": {
          schemaVersion: 1,
          purpose: "quality-baseline",
          expectedEndpoints: [
            { method: "GET", path: "/customers/search", source: "test", observed: true },
          ],
        },
      },
    },
  );

  assert.equal(scoreboard.entries[0].purpose, "quality-baseline");
  assert.match(buildRecordingScoreboardMarkdown(scoreboard), /quality-baseline/);
});

test("buildRecordingScoreboard prefers manifest impact summary over recomputing impact", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/manifest-impact.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      manifestByLogFile: {
        "logs/network/manifest-impact.jsonl": {
          schemaVersion: 1,
          expectedEndpoints: [],
          impact: {
            targetResponses: 12,
            targetEndpointCount: 5,
            newEndpointCount: 3,
            newKnownInventoryCount: 2,
            coverageBeforePercent: 40,
            coverageAfterPercent: 45.5,
            coverageDeltaPercent: 5.5,
            downloads: 1,
            topAreas: [
              { area: "Kunden/Vorgaenge", endpointCount: 4, newEndpointCount: 2, responseCount: 10 },
              { area: "Artikel/Warenbestand", endpointCount: 1, newEndpointCount: 1, responseCount: 2 },
            ],
          },
        },
      },
    },
  );

  const entry = scoreboard.entries[0];
  assert.equal(entry.responses, 12);
  assert.equal(entry.endpointCount, 5);
  assert.equal(entry.newEndpoints, 3);
  assert.equal(entry.newKnownInventoryEndpoints, 2);
  assert.equal(entry.coverageBeforePercent, 40);
  assert.equal(entry.coverageAfterPercent, 45.5);
  assert.equal(entry.coverageDeltaPercent, 5.5);
  assert.deepEqual(entry.topAreas, ["Kunden/Vorgaenge", "Artikel/Warenbestand"]);
  assert.equal(scoreboard.finalCoveragePercent, 45.5);
  assert.equal(scoreboard.totalNewEndpoints, 3);
  assert.equal(scoreboard.totalNewKnownInventoryEndpoints, 2);
});

test("buildRecordingScoreboard marks recordings without API responses, timeline markers, or UI snapshots for review", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/good.jsonl",
        records: [
          {
            type: "flow-marker",
            marker: "step-start",
            step: "Kunde suchen",
          },
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
      {
        file: "logs/network/weak.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://app.optica-omnia.de/assets/app.js",
            status: 200,
            resourceType: "script",
          },
          {
            type: "request",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            resourceType: "xhr",
          },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  assert.equal(scoreboard.recordingsNeedingReview, 1);
  assert.deepEqual(
    scoreboard.entries.map((entry) => ({
      file: entry.file,
      status: entry.qualityStatus,
      apiResponses: entry.qualityApiResponses,
      markers: entry.qualityTimelineMarkers,
      uiSnapshots: entry.qualityUiSnapshots,
      findings: entry.qualityFindings,
    })),
    [
      {
        file: "logs/network/good.jsonl",
        status: "ok",
        apiResponses: 1,
        markers: 1,
        uiSnapshots: 1,
        findings: [],
      },
      {
        file: "logs/network/weak.jsonl",
        status: "needs-review",
        apiResponses: 0,
        markers: 0,
        uiSnapshots: 0,
        findings: ["no-api-response", "no-timeline-marker", "no-ui-snapshot"],
      },
    ],
  );
});

test("buildRecordingScoreboardMarkdown documents recording quality and review candidates", () => {
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/good.jsonl",
        records: [
          { type: "flow-marker", marker: "step-start", step: "Kunde suchen" },
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
      {
        file: "logs/network/weak.jsonl",
        records: [
          {
            type: "response",
            method: "GET",
            url: "https://app.optica-omnia.de/assets/app.js",
            status: 200,
            resourceType: "script",
          },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildRecordingScoreboardMarkdown(scoreboard);

  assert.match(markdown, /Recording-Qualitaet: 1 \/ 2 ok, 1 pruefen/);
  assert.match(markdown, /Qualitaet/);
  assert.match(markdown, /UI-Snapshots/);
  assert.match(markdown, /needs-review/);
  assert.match(markdown, /no-api-response, no-timeline-marker, no-ui-snapshot/);
  assert.match(markdown, /## Nachaufnahme-Kandidaten/);
  assert.match(markdown, /weak\.jsonl/);
});

test("buildRecordingScoreboardMarkdown shows explorer yield for auto recordings", () => {
  const markdown = buildRecordingScoreboardMarkdown({
    generatedAt: "2026-06-03T12:00:00.000Z",
    recordingCount: 1,
    finalCoveragePercent: 10,
    totalNewEndpoints: 1,
    totalNewKnownInventoryEndpoints: 1,
    expectedEndpoints: 1,
    expectedEndpointsObserved: 1,
    expectedEndpointsMissing: 0,
    expectedEndpointHitRatePercent: 100,
    totalExplorerClickedTargets: 7,
    totalExplorerSkippedTargets: 14,
    totalExplorerBlockedRequests: 2,
    totalExplorerDiscoveredTargets: 12,
    totalExplorerOpenTargets: 3,
    entries: [
      {
        index: 1,
        file: "logs/network/auto.jsonl",
        responses: 1,
        endpointCount: 1,
        newEndpoints: 1,
        newKnownInventoryEndpoints: 1,
        expectedEndpoints: 1,
        expectedEndpointsObserved: 1,
        expectedEndpointsMissing: 0,
        expectedEndpointHitRatePercent: 100,
        explorerClickedTargets: 7,
        explorerSkippedTargets: 14,
        explorerBlockedRequests: 2,
        explorerDiscoveredTargets: 12,
        explorerOpenTargets: 3,
        explorerTopOpenTargets: [
          { kind: "route", label: "Artikel", path: "/articles", seenCount: 4 },
        ],
        explorerStopReason: "no-more-targets",
        coverageBeforePercent: 0,
        coverageAfterPercent: 10,
        coverageDeltaPercent: 10,
        topAreas: ["Kunden/Vorgaenge"],
      },
    ],
  });

  assert.match(markdown, /Auto-Explorer: 7 geklickt, 14 uebersprungen, 2 blockiert/);
  assert.match(markdown, /12 UI-Ziele entdeckt, 3 offen/);
  assert.match(markdown, /Explorer/);
  assert.match(markdown, /7\/14\/2\/3 no-more-targets/);
  assert.match(markdown, /Artikel/);
});

test("parseRecordingScoreboardArgs defaults to recording scoreboard output", () => {
  const options = parseRecordingScoreboardArgs([]);

  assert.equal(options.outputFile.endsWith("docs/recordings/recording-scoreboard.md"), true);
});

test("writeRecordingScoreboard writes a machine-readable JSON sidecar", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-scoreboard-"));
  const markdownFile = path.join(dir, "scoreboard.md");
  const scoreboard = buildRecordingScoreboard(
    [
      {
        file: "logs/network/001.jsonl",
        records: [
          { type: "flow-marker", marker: "step-start", step: "Kunde suchen" },
          {
            type: "response",
            method: "GET",
            url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
            status: 200,
            resourceType: "xhr",
          },
          { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
        ],
      },
    ],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      manifestByLogFile: {
        "logs/network/001.jsonl": {
          schemaVersion: 1,
          purpose: "quality-baseline",
          expectedEndpoints: [],
        },
      },
    },
  );

  writeRecordingScoreboard(scoreboard, markdownFile);

  const jsonFile = path.join(dir, "scoreboard.json");
  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.match(fs.readFileSync(markdownFile, "utf8"), /^# Recording-Scoreboard/m);
  assert.equal(parsed.generatedAt, "2026-06-03T12:00:00.000Z");
  assert.equal(parsed.recordingCount, 1);
  assert.equal(parsed.finalCoveragePercent, 100);
  assert.equal(parsed.totalNewKnownInventoryEndpoints, 1);
  assert.equal(parsed.entries[0].file, "logs/network/001.jsonl");
  assert.equal(parsed.entries[0].purpose, "quality-baseline");
  assert.equal(parsed.entries[0].qualityStatus, "ok");
});
