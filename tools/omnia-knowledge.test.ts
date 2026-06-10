import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOmniaKnowledge,
  buildOmniaKnowledgeMarkdown,
  parseOmniaKnowledgeArgs,
} from "./omnia-knowledge.ts";

test("buildOmniaKnowledge groups observed API records by fachlicher Domain", () => {
  const report = buildOmniaKnowledge(
    [
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
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/assets/main.js",
        status: 200,
        resourceType: "script",
        step: "Asset laden",
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  assert.equal(report.totalResponses, 2);
  assert.equal(report.endpointCount, 2);
  assert.deepEqual(
    report.domains.map((domain) => domain.area),
    ["Artikel/Warenbestand", "Kunden/Vorgaenge"],
  );
  assert.deepEqual(report.domains[1].steps, ["Kunde suchen"]);
  assert.equal(report.domains[1].endpoints[0].key, "GET /apigateway/kunden/customers/search");
  assert.match(report.domains[1].platformCandidate, /Kunden/);
});

test("buildOmniaKnowledge combines observed records with known inventory coverage per domain", () => {
  const report = buildOmniaKnowledge(
    [
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
        status: 200,
        resourceType: "xhr",
        step: "Kunde suchen",
      },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      knownEndpoints: [
        { method: "GET", path: "/customers/search", source: "test" },
        { method: "GET", path: "/customers/{customerId}/addresses", source: "test" },
        { method: "POST", path: "/articles/simple-search", source: "test" },
      ],
    },
  );

  assert.equal(report.knownEndpointCount, 3);
  assert.equal(report.observedKnownEndpointCount, 1);
  assert.equal(report.missingKnownEndpointCount, 2);
  assert.equal(report.coveragePercent, 33.33);

  const customerDomain = report.domains.find((domain) => domain.area === "Kunden/Vorgaenge");
  assert.equal(customerDomain?.coverage.knownEndpoints, 2);
  assert.equal(customerDomain?.coverage.observedKnownEndpoints, 1);
  assert.equal(customerDomain?.coverage.missingKnownEndpoints, 1);
  assert.deepEqual(customerDomain?.coverage.missingExamples.map((endpoint) => endpoint.path), ["/customers/{customerId}/addresses"]);

  const articleDomain = report.domains.find((domain) => domain.area === "Artikel/Warenbestand");
  assert.equal(articleDomain?.responseCount, 0);
  assert.equal(articleDomain?.coverage.knownEndpoints, 1);
  assert.equal(articleDomain?.coverage.missingKnownEndpoints, 1);
});

test("buildOmniaKnowledgeMarkdown shows domains, endpoints, steps and platform candidates", () => {
  const report = buildOmniaKnowledge(
    [
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
        status: 200,
        resourceType: "xhr",
        step: "Kunde suchen",
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildOmniaKnowledgeMarkdown(report);

  assert.match(markdown, /^# Omnia-Knowledge-Report/m);
  assert.match(markdown, /Kunden\/Vorgaenge/);
  assert.match(markdown, /Kunde suchen/);
  assert.match(markdown, /GET `\/apigateway\/kunden\/customers\/search`/);
  assert.match(markdown, /Plattform-Kandidaten/);
});

test("buildOmniaKnowledgeMarkdown shows per-domain coverage and missing examples", () => {
  const report = buildOmniaKnowledge(
    [
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
        status: 200,
        resourceType: "xhr",
        step: "Kunde suchen",
      },
    ],
    {
      generatedAt: new Date("2026-06-03T12:00:00.000Z"),
      knownEndpoints: [
        { method: "GET", path: "/customers/search", source: "test" },
        { method: "GET", path: "/customers/{customerId}/addresses", source: "test" },
      ],
    },
  );

  const markdown = buildOmniaKnowledgeMarkdown(report);

  assert.match(markdown, /Inventar-Coverage: 50 %/);
  assert.match(markdown, /Known\/Observed\/Missing: 2 \/ 1 \/ 1/);
  assert.match(markdown, /GET `\/customers\/\{customerId\}\/addresses`/);
});

test("parseOmniaKnowledgeArgs defaults to docs knowledge output", () => {
  const options = parseOmniaKnowledgeArgs([]);

  assert.equal(options.outputFile.endsWith("docs/10_omnia_knowledge.md"), true);
});
