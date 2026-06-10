import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFocusModuleCoverage,
  classifyFocusModule,
} from "./focus-module-coverage.ts";
import type { KnownEndpoint } from "./coverage-report.ts";

test("classifyFocusModule maps the three restricted Omnia modules", () => {
  assert.equal(classifyFocusModule("/customers/{customerId}"), "stammdaten");
  assert.equal(classifyFocusModule("/apigateway/kunden/customers/{customerId}/addresses"), "stammdaten");
  assert.equal(classifyFocusModule("/salesprocesses/{salesProcessUuid}"), "vorgaenge");
  assert.equal(classifyFocusModule("/apigateway/sales/salesprocesses/search"), "vorgaenge");
  assert.equal(classifyFocusModule("/articles/{articleId}/price-data"), "warenwirtschaft");
  assert.equal(classifyFocusModule("/apigateway/wawi/order-proposals/search"), "warenwirtschaft");
  assert.equal(classifyFocusModule("/stocktaking-lists/{stocktakingListUuid}"), "warenwirtschaft");
  assert.equal(classifyFocusModule("/payment-terms"), null);
});

test("buildFocusModuleCoverage separates seen, missing, read and write endpoints", () => {
  const known: KnownEndpoint[] = [
    { method: "GET", path: "/customers/{customerId}", source: "test" },
    { method: "POST", path: "/customers", source: "test" },
    { method: "POST", path: "/salesprocesses/search", source: "test" },
    { method: "PUT", path: "/salesprocesses/{salesProcessUuid}", source: "test" },
    { method: "GET", path: "/articles/{articleId}/price-data", source: "test" },
    { method: "POST", path: "/orders/{orderUuid}/positions", source: "test" },
    { method: "GET", path: "/payment-terms", source: "test" },
  ];
  const records = [
    responseRecord("GET", "https://api2.optica-omnia.de/apigateway/kunden/customers/123", 200),
    responseRecord("POST", "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/search", 200),
    responseRecord("GET", "https://api2.optica-omnia.de/apigateway/article-tenant/articles/710f2668-3802-47d2-960a-059483daf5ad/price-data", 200),
  ];

  const report = buildFocusModuleCoverage(known, records, {
    generatedAt: new Date("2026-06-06T10:00:00.000Z"),
  });

  assert.equal(report.totals.known, 6);
  assert.equal(report.totals.observedKnown, 3);
  assert.equal(report.totals.missing, 3);
  assert.equal(report.modules.stammdaten.knownCount, 2);
  assert.equal(report.modules.stammdaten.observedKnownCount, 1);
  assert.equal(report.modules.stammdaten.missingWriteCount, 1);
  assert.equal(report.modules.vorgaenge.observedKnownCount, 1);
  assert.equal(report.modules.vorgaenge.missingWriteCount, 1);
  assert.equal(report.modules.warenwirtschaft.knownCount, 2);
  assert.equal(report.modules.warenwirtschaft.missingWriteCount, 1);
  assert.deepEqual(report.modules.warenwirtschaft.observedStatuses, [200]);
});

function responseRecord(method: string, url: string, status: number): Record<string, unknown> {
  return {
    type: "response",
    method,
    url,
    status,
    resourceType: "fetch",
    timestamp: "2026-06-06T10:00:00.000Z",
  };
}
