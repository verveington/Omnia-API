import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildRecordingImpact,
  buildRecordingImpactMarkdown,
  parseRecordingImpactArgs,
  writeRecordingImpact,
} from "./recording-impact.ts";

test("buildRecordingImpact finds endpoints introduced by the target recording", () => {
  const previousRecords = [
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
      status: 200,
      resourceType: "xhr",
    },
  ];
  const targetRecords = [
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
      status: 200,
      resourceType: "xhr",
      step: "Kunde suchen",
    },
    {
      type: "response",
      method: "POST",
      url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search",
      status: 200,
      resourceType: "fetch",
      step: "Musterartikel suchen",
    },
  ];

  const impact = buildRecordingImpact(targetRecords, previousRecords, [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "POST", path: "/articles/simple-search", source: "test" },
  ], {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    sourceLogFile: "logs/network/test.jsonl",
  });

  assert.equal(impact.targetResponses, 2);
  assert.equal(impact.targetEndpointCount, 2);
  assert.equal(impact.newEndpointCount, 1);
  assert.equal(impact.newKnownInventoryCount, 1);
  assert.equal(impact.coverageBeforePercent, 50);
  assert.equal(impact.coverageAfterPercent, 100);
  assert.equal(impact.coverageDeltaPercent, 50);
  assert.deepEqual(impact.newEndpoints.map((endpoint) => endpoint.key), ["POST /apigateway/articletenantservice/articles/simple-search"]);
  assert.deepEqual(impact.domainImpacts.map((domain) => domain.area), ["Artikel/Warenbestand", "Kunden/Vorgaenge"]);
});

test("buildRecordingImpactMarkdown summarizes coverage delta, domains and new endpoints", () => {
  const impact = buildRecordingImpact(
    [
      {
        type: "response",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search",
        status: 200,
        resourceType: "fetch",
        step: "Musterartikel suchen",
      },
      {
        type: "download",
        url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/export",
        suggestedFileExtension: ".csv",
        step: "Export pruefen",
      },
    ],
    [],
    [{ method: "POST", path: "/articles/simple-search", source: "test" }],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildRecordingImpactMarkdown(impact);

  assert.match(markdown, /^# Recording-Impact/m);
  assert.match(markdown, /Coverage-Delta: 100 %/);
  assert.match(markdown, /Artikel\/Warenbestand/);
  assert.match(markdown, /POST `\/apigateway\/articletenantservice\/articles\/simple-search`/);
  assert.match(markdown, /Downloads: 1/);
});

test("parseRecordingImpactArgs reads log and output path", () => {
  const options = parseRecordingImpactArgs(["--log", "logs/network/test.jsonl", "--out", "docs/recordings/test-impact.md"]);

  assert.equal(options.logFile.endsWith("logs/network/test.jsonl"), true);
  assert.equal(options.outputFile.endsWith("docs/recordings/test-impact.md"), true);
});

test("writeRecordingImpact writes a machine-readable JSON sidecar", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-impact-json-"));
  const outputFile = path.join(dir, "test-impact.md");
  const impact = buildRecordingImpact(
    [
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
        status: 200,
        resourceType: "xhr",
      },
    ],
    [],
    [{ method: "GET", path: "/customers/search", source: "test" }],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      sourceLogFile: "logs/network/test.jsonl",
    },
  );

  writeRecordingImpact(impact, outputFile);

  const parsed = JSON.parse(fs.readFileSync(path.join(dir, "test-impact.json"), "utf8"));
  assert.equal(parsed.sourceLogFile, "logs/network/test.jsonl");
  assert.equal(parsed.targetResponses, 1);
  assert.equal(parsed.newKnownInventoryCount, 1);
  assert.deepEqual(parsed.endpoints.map((endpoint: { key: string }) => endpoint.key), ["GET /apigateway/kunden/customers/search"]);
});
