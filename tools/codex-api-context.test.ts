import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCodexApiContext,
  buildCodexApiContextMarkdown,
  parseCodexApiContextArgs,
} from "./codex-api-context.ts";

test("buildCodexApiContext prioritizes missing endpoints with purpose and recording hints", () => {
  const knownEndpoints = [
    { method: "GET", path: "/customers/search", source: "inventory" },
    { method: "GET", path: "/orders/{orderUuid}", source: "inventory" },
    { method: "POST", path: "/orders/{orderUuid}/positions", source: "inventory" },
    { method: "POST", path: "/order-arrival/search", source: "inventory" },
  ];
  const records = [
    response("GET", "https://api2.optica-omnia.de/apigateway/kunden/customers/search", 200, "Kunde suchen"),
    response("GET", "https://api2.optica-omnia.de/apigateway/wawi/orders/11111111-1111-4111-8111-111111111111", 200, "24. Herr Abdullah Saglam 11058 81735 Muenchen AOK Bayern"),
    request("POST", "https://api2.optica-omnia.de/apigateway/wawi/orders/from-proposal", {
      proposals: { includeAll: false, selections: ["proposal-1"] },
      supplierId: "supplier-1",
    }, "Bestellung erzeugen"),
    response("POST", "https://api2.optica-omnia.de/apigateway/wawi/orders/from-proposal", 200, "Bestellung erzeugen"),
  ];

  const context = buildCodexApiContext({
    knownEndpoints,
    records,
    uiMap: {
      targets: [
        {
          label: "Bestellpositionen",
          path: "/merchandise-management/order-management/orders",
          apiAreas: ["Warenwirtschaft/Bestellung"],
          apiEndpointCount: 1,
        },
      ],
      surfaces: [],
    },
  }, { generatedAt: new Date("2026-06-08T08:00:00.000Z"), top: 10 });

  assert.equal(context.summary.knownEndpoints, 4);
  assert.equal(context.summary.missingKnownEndpoints, 2);
  assert.equal(context.summary.observedKnownEndpoints, 2);

  const missingPositions = context.missingEndpoints.find((endpoint) => endpoint.path === "/orders/{orderUuid}/positions");
  assert.ok(missingPositions);
  assert.equal(missingPositions.area, "Warenwirtschaft/Bestellung");
  assert.match(missingPositions.purpose, /Bestellpositionen/);
  assert.ok(missingPositions.relatedObserved.some((endpoint) => endpoint.path.endsWith("/orders/{param}")));
  assert.ok(missingPositions.uiHints.some((hint) => hint.includes("Bestellpositionen")));
  assert.ok(missingPositions.recordingCommands.some((command) => command.command.includes("--expect-endpoint")));

  const markdown = buildCodexApiContextMarkdown(context);
  assert.match(markdown, /# Codex API Context/);
  assert.match(markdown, /POST `\/orders\/\{orderUuid\}\/positions`/);
  assert.match(markdown, /Bestellpositionen/);
  assert.doesNotMatch(markdown, /proposal-1|supplier-1/);
  assert.doesNotMatch(markdown, /Abdullah|Saglam/);
  assert.ok(context.observedEndpoints.some((endpoint) => endpoint.steps.includes("UI-Zeile [REDACTED]")));
});

test("parseCodexApiContextArgs defaults to docs context outputs", () => {
  const options = parseCodexApiContextArgs([]);
  assert.equal(options.outputFile.endsWith("docs/16_codex_api_context.md"), true);
  assert.equal(options.jsonOutputFile.endsWith("docs/16_codex_api_context.json"), true);
  assert.equal(options.top, 30);
});

function response(method: string, url: string, status: number, step: string): Record<string, unknown> {
  return {
    type: "response",
    method,
    url,
    status,
    resourceType: "fetch",
    step,
    timestamp: "2026-06-08T08:00:00.000Z",
    body: {},
  };
}

function request(method: string, url: string, body: unknown, step: string): Record<string, unknown> {
  return {
    type: "request",
    method,
    url,
    resourceType: "fetch",
    step,
    timestamp: "2026-06-08T08:00:00.000Z",
    body,
  };
}
