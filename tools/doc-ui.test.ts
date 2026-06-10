import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFlowUiData,
  buildFlowUiHtml,
  buildSwaggerUiHtml,
  parseDocUiArgs,
} from "./doc-ui.ts";

test("buildFlowUiData turns manifests and records into redacted timeline data", () => {
  const data = buildFlowUiData([
    {
      manifestFile: "/workspace/docs/recordings/export-workflow-manifest.json",
      manifest: {
        schemaVersion: 1,
        mode: "manual",
        purpose: "export-flow",
        status: "completed",
        startedAt: "2026-06-08T08:00:00.000Z",
        completedAt: "2026-06-08T08:02:00.000Z",
        auditStatus: "passed",
        artifacts: {
          logFile: "/workspace/logs/network/export-workflow.jsonl",
          flowReportFile: "/workspace/docs/recordings/export-flow.md",
          openApiFile: "/workspace/openapi/omnia-observed.openapi.yaml",
        },
        expectedEndpoints: [
          { method: "GET", path: "/customers/search", observed: true },
          { method: "POST", path: "/exports/start", observed: false },
        ],
        impact: {
          targetResponses: 2,
          targetEndpointCount: 2,
          newEndpointCount: 1,
          newKnownInventoryCount: 1,
          coverageDeltaPercent: 2.5,
          downloads: 1,
          topAreas: [{ area: "Export", endpointCount: 1 }],
        },
      },
      records: [
        marker("Export oeffnen", "2026-06-08T08:00:00.000Z"),
        response("GET", "https://api2.optica-omnia.de/apigateway/kunden/customers/search", 200, "Export oeffnen", "2026-06-08T08:00:05.000Z"),
        {
          type: "ui-snapshot",
          step: "Export oeffnen",
          timestamp: "2026-06-08T08:00:06.000Z",
          path: "https://api2.optica-omnia.de/master-data/customers",
          title: "Kunden",
          actions: ["Export"],
          formLabels: ["Suche"],
          tableHeaders: ["Name", "Status"],
        },
        marker("Export starten", "2026-06-08T08:01:00.000Z"),
        response("POST", "https://api2.optica-omnia.de/apigateway/order-proposals/11111111-1111-4111-8111-111111111111", 202, "20. 18582 Max Mustermann AOK Bayern", "2026-06-08T08:01:04.000Z"),
        {
          type: "download",
          step: "Export starten",
          timestamp: "2026-06-08T08:01:10.000Z",
          url: "https://api2.optica-omnia.de/apigateway/export/jobs/11111111-1111-4111-8111-111111111111/file",
          suggestedFileExtension: "csv",
        },
      ],
    },
  ], { generatedAt: new Date("2026-06-08T08:03:00.000Z"), workspaceRoot: "/workspace" });

  assert.equal(data.summary.recordings, 1);
  assert.equal(data.summary.apiResponses, 2);
  assert.equal(data.summary.uniqueEndpoints, 2);
  assert.equal(data.summary.relationships, 1);
  assert.equal(data.summary.missingExpectedEndpoints, 1);
  assert.equal(data.recordings[0].artifacts.logFile, "logs/network/export-workflow.jsonl");
  assert.equal(data.recordings[0].expectedEndpoints[1].observed, false);
  assert.ok(data.recordings[0].endpoints.some((endpoint) => endpoint.path === "/apigateway/order-proposals/{uuid}"));
  assert.ok(data.recordings[0].relationships.transitions.some((transition) => (
    transition.fromArea === "Kunden/Vorgaenge" && transition.toArea === "Warenwirtschaft/Bestellung"
  )));
  assert.ok(data.recordings[0].relationships.stepFlows.some((flow) => (
    flow.step === "Export starten" && flow.domains.includes("Warenwirtschaft/Bestellung")
  )));
  assert.equal(data.recordings[0].steps.length, 2);
  assert.equal(data.recordings[0].steps[0].apiCalls.length, 1);
  assert.equal(data.recordings[0].steps[0].uiSnapshots.length, 1);
  assert.equal(data.recordings[0].steps[1].downloads[0].extension, "csv");
  assert.doesNotMatch(JSON.stringify(data), /Max Mustermann|AOK Bayern/);
  assert.match(JSON.stringify(data), /UI-Zeile \[REDACTED\]/);
});

test("buildFlowUiHtml references generated data and exposes timeline filters", () => {
  const html = buildFlowUiHtml({ dataFile: "flow-ui-data.json" });

  assert.match(html, /flow-ui-data\.json/);
  assert.match(html, /id="recordingSearch"/);
  assert.match(html, /id="methodFilter"/);
  assert.match(html, /renderTimeline/);
  assert.match(html, /id="relationshipList"/);
  assert.match(html, /renderRelationships/);
});

test("buildSwaggerUiHtml exposes interactive Swagger controls", () => {
  const html = buildSwaggerUiHtml({
    defaultSpec: "openapi.cumulative.json",
    observedSpec: "../openapi/omnia-observed.openapi.yaml",
  });

  assert.match(html, /SwaggerUIBundle/);
  assert.match(html, /tryItOutEnabled:\s*true/);
  assert.match(html, /supportedSubmitMethods:\s*\["get", "post", "put", "patch", "delete"\]/);
  assert.match(html, /parameterMacro:\s*swaggerParameterDefault/);
  assert.match(html, /function swaggerParameterDefault/);
  assert.match(html, /paymenttypes:\s*"SALE"/);
  assert.match(html, /active:\s*"true"/);
  assert.match(html, /size:\s*"2000"/);
  assert.match(html, /if \(location === "header" \|\| location === "cookie"\) return undefined/);
  assert.match(html, /openapi\.cumulative\.json/);
  assert.match(html, /omnia-observed\.openapi\.yaml/);
  assert.match(html, /Interaktiv/);
  assert.doesNotMatch(html, /\.swagger-ui \.auth-wrapper/);
  assert.doesNotMatch(html, /\.swagger-ui \.try-out/);
});

test("parseDocUiArgs defaults to docs UI artifact paths", () => {
  const options = parseDocUiArgs([]);

  assert.equal(options.flowDataFile.endsWith("docs/flow-ui-data.json"), true);
  assert.equal(options.flowHtmlFile.endsWith("docs/flow-ui.html"), true);
  assert.equal(options.swaggerHtmlFile.endsWith("docs/swagger-ui.html"), true);
  assert.equal(options.openapiJsonFile.endsWith("docs/openapi.cumulative.json"), true);
});

function marker(step: string, timestamp: string): Record<string, unknown> {
  return {
    type: "flow-marker",
    marker: "step-start",
    step,
    timestamp,
  };
}

function response(method: string, url: string, status: number, step: string, timestamp: string): Record<string, unknown> {
  return {
    type: "response",
    method,
    url,
    status,
    step,
    timestamp,
    resourceType: "fetch",
  };
}
