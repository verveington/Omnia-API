import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCoverageReport,
  buildCoverageReportMarkdown,
  classifyEndpointArea,
  parseBackendPathMarkdown,
  parseTokenResolution,
} from "./coverage-report.ts";

test("parseTokenResolution flattens unique known endpoints from token resolution JSON", () => {
  const endpoints = parseTokenResolution({
    _e: [
      { method: "GET", path: "/customers/{customerUuid}" },
      { method: "GET", path: "/customers/{customerUuid}" },
      { method: "POST", path: "/orders/from-proposal" },
    ],
    ae: [{ method: "PUT", path: "/articles/{articleId}" }],
  });

  assert.deepEqual(
    endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`).sort(),
    ["GET /customers/{customerUuid}", "POST /orders/from-proposal", "PUT /articles/{articleId}"],
  );
});

test("parseBackendPathMarkdown reads multi-method backend path rows", () => {
  const endpoints = parseBackendPathMarkdown(`
### /articles

- \`POST\` \`/articles/simple-search\`
- \`GET PUT\` \`/articles/{articleId}\`
`);

  assert.deepEqual(
    endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`).sort(),
    ["GET /articles/{articleId}", "POST /articles/simple-search", "PUT /articles/{articleId}"],
  );
});

test("buildCoverageReport matches observed apigateway aliases to static endpoint suffixes", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "POST", path: "/articles/simple-search", source: "test" },
    { method: "POST", path: "/orders/from-proposal", source: "test" },
    { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "test" },
  ];
  const observedRecords = [
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search?keywords=%5BREDACTED%5D",
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
  ];

  const report = buildCoverageReport(known, observedRecords);

  assert.equal(report.knownCount, 4);
  assert.equal(report.observedKnownCount, 2);
  assert.equal(report.coveragePercent, 50);
  assert.deepEqual(
    report.missing.map((endpoint) => `${endpoint.method} ${endpoint.path}`).sort(),
    ["GET /route-plannings/{routePlanningUuid}/exports", "POST /orders/from-proposal"],
  );
  assert.deepEqual(
    report.observedUnknown.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
    [],
  );
});

test("buildCoverageReport treats redacted path segments as observed parameters", () => {
  const report = buildCoverageReport(
    [{ method: "GET", path: "/articles/search/{searchId}", source: "test" }],
    [
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/search/[REDACTED]",
        status: 200,
        resourceType: "xhr",
      },
    ],
  );

  assert.equal(report.observedKnownCount, 1);
  assert.equal(report.missing.length, 0);
  assert.equal(report.observedUnknown.length, 0);
});

test("classifyEndpointArea maps observed gateway aliases to fachliche Bereiche", () => {
  assert.equal(classifyEndpointArea("/apigateway/kunden/customers/search"), "Kunden/Vorgaenge");
  assert.equal(classifyEndpointArea("/apigateway/articletenantservice/articles/simple-search"), "Artikel/Warenbestand");
  assert.equal(classifyEndpointArea("/apigateway/wawi/orders/from-proposal"), "Warenwirtschaft/Bestellung");
  assert.equal(classifyEndpointArea("/apigateway/filiale/filialen"), "Filialen/Mandant");
  assert.equal(classifyEndpointArea("/apigateway/hilfsmittel/hilfsmittel/termine"), "Hilfsmittel");
  assert.equal(classifyEndpointArea("/apigateway/enum-service/enums"), "Referenzdaten");
  assert.equal(classifyEndpointArea("/apigateway/kostentraeger-tenant/kostentraeger/{uuid}"), "Kunden/Vorgaenge");
  assert.equal(classifyEndpointArea("/apigateway/vatrates/vatrates"), "Abrechnung/Kasse");
  assert.equal(classifyEndpointArea("/apigateway/wawi/order-states"), "Warenwirtschaft/Bestellung");
  assert.equal(classifyEndpointArea("/apigateway/user-details"), "User/Workspace");
  assert.equal(classifyEndpointArea("/auth/realms/omnia/protocol/openid-connect/token"), "Auth/Identity");
});

test("buildCoverageReportMarkdown shows coverage, missing endpoints and recording priorities", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/customers/search", source: "test" },
      { method: "POST", path: "/orders/from-proposal", source: "test" },
      { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "test" },
    ],
    [
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
        status: 200,
        resourceType: "xhr",
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildCoverageReportMarkdown(report);

  assert.match(markdown, /^# API-Coverage-Report/m);
  assert.match(markdown, /- Bekannte Endpunkte: 3/);
  assert.match(markdown, /- Beobachtet aus bekanntem Inventar: 1/);
  assert.match(markdown, /- Coverage: 33\.33 %/);
  assert.match(markdown, /POST `\/orders\/from-proposal`/);
  assert.match(markdown, /Warenwirtschaft\/Bestellung/);
  assert.match(markdown, /Touren\/Routenplanung/);
});

test("buildCoverageReportMarkdown includes concrete recording workflow commands for missing areas", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/customers/search", source: "test" },
      { method: "POST", path: "/orders/from-proposal", source: "test" },
      { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "test" },
    ],
    [],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      recordingUrl: "https://omnia.example.test",
    },
  );

  const markdown = buildCoverageReportMarkdown(report);
  const firstCommand = report.recordingPriorities[0].commands[0];

  assert.match(markdown, /node tools\/recording-workflow\.ts/);
  assert.match(markdown, /--mode auto/);
  assert.match(markdown, /--url https:\/\/omnia\.example\.test/);
  assert.match(markdown, /--capture-bodies/);
  assert.match(markdown, /--start-path "\/master-data\/customers"/);
  assert.match(markdown, /--expect-endpoint "GET \/customers\/search"/);
  assert.match(markdown, /--start-path "\/merchandise-management\/order-management\/order-proposals"/);
  assert.doesNotMatch(markdown, /--expect-endpoint "POST \/orders\/from-proposal"/);
  assert.match(markdown, /--start-path "\/route-planning"/);
  assert.match(markdown, /--expect-endpoint "GET \/route-plannings\/\{routePlanningUuid\}\/exports"/);
  assert.deepEqual(firstCommand.args.slice(0, 6), [
    "tools/recording-workflow.ts",
    "--mode",
    "auto",
    "--url",
    "https://omnia.example.test",
    "--stub",
  ]);
});

test("buildCoverageReportMarkdown omits unsafe expected endpoints from auto commands", () => {
  const report = buildCoverageReport(
    [
      { method: "DELETE", path: "/route-plannings/{routePlanningUuid}", source: "test" },
      { method: "POST", path: "/route-plannings/{routePlanningUuid}/stops/search", source: "test" },
      { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const command = report.recordingPriorities[0].commands[0].command;

  assert.match(command, /--mode auto/);
  assert.doesNotMatch(command, /DELETE/);
  assert.match(command, /--expect-endpoint "POST \/route-plannings\/\{routePlanningUuid\}\/stops\/search"/);
  assert.match(command, /--expect-endpoint "GET \/route-plannings\/\{routePlanningUuid\}\/exports"/);
});
