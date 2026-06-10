import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOmniaRelationships,
  buildOmniaRelationshipsMarkdown,
  parseOmniaRelationshipsArgs,
} from "./omnia-relationships.ts";

test("buildOmniaRelationships derives domain transitions from ordered API responses", () => {
  const report = buildOmniaRelationships(
    [
      {
        type: "response",
        timestamp: "2026-06-03T10:00:00.000Z",
        step: "Kunde und Artikel pruefen",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
        status: 200,
        resourceType: "xhr",
      },
      {
        type: "response",
        timestamp: "2026-06-03T10:00:01.000Z",
        step: "Kunde und Artikel pruefen",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search",
        status: 200,
        resourceType: "fetch",
      },
      {
        type: "response",
        timestamp: "2026-06-03T10:00:02.000Z",
        step: "Bestellung vorbereiten",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/wawi/order-proposals/search",
        status: 200,
        resourceType: "xhr",
      },
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  assert.equal(report.responseCount, 3);
  assert.equal(report.domainCount, 3);
  assert.equal(report.stepFlows.length, 2);
  assert.deepEqual(
    report.transitions.map((transition) => `${transition.fromArea} -> ${transition.toArea}`),
    ["Kunden/Vorgaenge -> Artikel/Warenbestand", "Artikel/Warenbestand -> Warenwirtschaft/Bestellung"],
  );
  assert.equal(report.stepFlows[0].domains.join(" -> "), "Kunden/Vorgaenge -> Artikel/Warenbestand");
  assert.equal(report.stepFlows[1].endpoints[0].path, "/apigateway/wawi/order-proposals/search");
});

test("buildOmniaRelationships keeps repeated transitions counted and compacts consecutive flow domains", () => {
  const report = buildOmniaRelationships([
    response("2026-06-03T10:00:00.000Z", "Loop", "GET", "/apigateway/kunden/customers/search"),
    response("2026-06-03T10:00:01.000Z", "Loop", "POST", "/apigateway/articletenantservice/articles/simple-search"),
    response("2026-06-03T10:00:02.000Z", "Loop", "GET", "/apigateway/kunden/customers/search"),
    response("2026-06-03T10:00:03.000Z", "Loop", "POST", "/apigateway/articletenantservice/articles/simple-search"),
    response("2026-06-03T10:00:04.000Z", "Loop", "GET", "/apigateway/wawi/order-states"),
    response("2026-06-03T10:00:05.000Z", "Loop", "GET", "/apigateway/wawi/storage-locations"),
  ]);

  assert.equal(report.transitions.find((transition) => transition.fromArea === "Kunden/Vorgaenge")?.count, 2);
  assert.deepEqual(report.stepFlows[0].domains, [
    "Kunden/Vorgaenge",
    "Artikel/Warenbestand",
    "Kunden/Vorgaenge",
    "Artikel/Warenbestand",
    "Warenwirtschaft/Bestellung",
  ]);
});

test("buildOmniaRelationshipsMarkdown shows graph, transition table and step flows", () => {
  const report = buildOmniaRelationships(
    [
      response("2026-06-03T10:00:00.000Z", "Export vorbereiten", "GET", "/apigateway/kunden/customers/search"),
      response("2026-06-03T10:00:01.000Z", "Export vorbereiten", "POST", "/apigateway/wawi/order-proposals/search"),
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildOmniaRelationshipsMarkdown(report);

  assert.match(markdown, /^# Omnia-Relationship-Map/m);
  assert.match(markdown, /"Kunden\/Vorgaenge" -->\|1\| "Warenwirtschaft\/Bestellung"/);
  assert.match(markdown, /Export vorbereiten/);
  assert.match(markdown, /\/apigateway\/wawi\/order-proposals\/search/);
});

test("buildOmniaRelationshipsMarkdown truncates very long domain sequences", () => {
  const records = Array.from({ length: 24 }, (_, index) => {
    const pathname = index % 2 === 0
      ? "/apigateway/kunden/customers/search"
      : "/apigateway/articletenantservice/articles/simple-search";
    return response(`2026-06-03T10:00:${String(index).padStart(2, "0")}.000Z`, "Ohne Marker", "GET", pathname);
  });
  const markdown = buildOmniaRelationshipsMarkdown(buildOmniaRelationships(records));

  assert.match(markdown, /\.\.\. 6 weitere/);
});

test("parseOmniaRelationshipsArgs defaults to docs relationship output", () => {
  const options = parseOmniaRelationshipsArgs([]);

  assert.equal(options.outputFile.endsWith("docs/12_omnia_relationships.md"), true);
});

function response(timestamp: string, step: string, method: string, pathname: string): Record<string, unknown> {
  return {
    type: "response",
    timestamp,
    step,
    method,
    url: `https://api2.optica-omnia.de${pathname}`,
    status: 200,
    resourceType: "xhr",
  };
}
