import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildFlowReportMarkdown, knownEndpointsFromCatalog, writeFlowMapping } from "./flow-report.ts";
import { REDACTED } from "./redact.ts";

test("buildFlowReportMarkdown summarizes sequence, new endpoints, statuses and suspected function", () => {
  const records = [
    {
      type: "flow-marker",
      marker: "step-start",
      step: "Kunde suchen",
      timestamp: "2026-05-30T08:00:00.000Z",
    },
    {
      type: "response",
      step: "Kunde suchen",
      timestamp: "2026-05-30T08:00:01.000Z",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/customer/customers/search?query=%5BREDACTED%5D",
      status: 200,
      resourceType: "fetch",
    },
    {
      type: "flow-marker",
      marker: "step-end",
      step: "Kunde suchen",
      timestamp: "2026-05-30T08:00:02.000Z",
    },
    {
      type: "flow-marker",
      marker: "step-start",
      step: "eKV anlegen",
      timestamp: "2026-05-30T08:00:03.000Z",
    },
    {
      type: "response",
      step: "eKV anlegen",
      timestamp: "2026-05-30T08:00:04.000Z",
      method: "POST",
      url: "https://api2.optica-omnia.de/apigateway/ekv/cost-estimates",
      status: 201,
      resourceType: "xhr",
    },
  ];

  const markdown = buildFlowReportMarkdown(records, {
    generatedAt: new Date("2026-05-30T08:01:00.000Z"),
    sourceLogFile: "/workspace/logs/network/test-session.jsonl",
    knownEndpointKeys: new Set(["GET /apigateway/customer/customers/search"]),
  });

  assert.match(markdown, /^# Flow-Aufzeichnung/m);
  assert.match(
    markdown,
    /\| 1 \| \+00:01 \| Kunde suchen \| GET \| `\/apigateway\/customer\/customers\/search` \| 200 \| Kundensuche \|/,
  );
  assert.match(
    markdown,
    /\| 2 \| \+00:04 \| eKV anlegen \| POST \| `\/apigateway\/ekv\/cost-estimates` \| 201 \| eKV\/Kostenvoranschlag \|/,
  );
  assert.match(markdown, /## Neue Endpunkte/);
  assert.match(markdown, /- POST `\/apigateway\/ekv\/cost-estimates` \(201\)/);
  const newEndpointsSection = markdown.split("## Neue Endpunkte")[1].split("## Statuscodes")[0];
  assert.doesNotMatch(newEndpointsSection, /- GET `\/apigateway\/customer\/customers\/search`/);
  assert.match(markdown, /## Statuscodes/);
  assert.match(markdown, /\| 201 \| 1 \|/);
});

test("buildFlowReportMarkdown classifies Wawi order lifecycle endpoints", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "response",
        step: "Bestellvorschlag anlegen",
        timestamp: "2026-06-05T08:00:01.000Z",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/wawi/order-proposals",
        status: 201,
        resourceType: "fetch",
      },
      {
        type: "response",
        step: "Bestellung erzeugen",
        timestamp: "2026-06-05T08:00:02.000Z",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/wawi/orders/from-proposal",
        status: 200,
        resourceType: "fetch",
      },
      {
        type: "response",
        step: "Bestellung verarbeiten",
        timestamp: "2026-06-05T08:00:03.000Z",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/wawi/orders/fd87445a-860d-4efb-8472-c30a1e73d286/process-order",
        status: 200,
        resourceType: "fetch",
      },
    ],
    { generatedAt: new Date("2026-06-05T08:01:00.000Z") },
  );

  assert.match(
    markdown,
    /\| 1 \| \+00:00 \| Bestellvorschlag anlegen \| POST \| `\/apigateway\/wawi\/order-proposals` \| 201 \| Warenwirtschaft\/Bestellung \|/,
  );
  assert.match(markdown, /### Warenwirtschaft\/Bestellung/);
  assert.doesNotMatch(markdown, /TODO: Fachprozess pruefen/);
});

test("knownEndpointsFromCatalog reads endpoint keys from the generated catalog", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-flow-report-"));
  const catalogFile = path.join(dir, "03_api_catalog.md");
  fs.writeFileSync(
    catalogFile,
    [
      "# API-Katalog",
      "",
      "### GET `/apigateway/customer/customers/search`",
      "",
      "### POST `/apigateway/sales/salesprocesses`",
      "",
    ].join("\n"),
  );

  assert.deepEqual([...knownEndpointsFromCatalog(catalogFile)].sort(), [
    "GET /apigateway/customer/customers/search",
    "POST /apigateway/sales/salesprocesses",
  ]);
});

test("buildFlowReportMarkdown ignores static assets and keeps API traffic", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "response",
        timestamp: "2026-05-30T08:00:00.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/img/logo.png",
        status: 200,
        resourceType: "image",
      },
      {
        type: "response",
        step: "Kunde suchen",
        timestamp: "2026-05-30T08:00:01.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/customer/customers/search",
        status: 200,
        resourceType: "fetch",
      },
      {
        type: "response",
        timestamp: "2026-05-30T08:00:02.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/fonts/Proxima-Nova-Regular.woff2",
        status: 200,
        resourceType: "font",
      },
    ],
    { generatedAt: new Date("2026-05-30T08:01:00.000Z") },
  );

  assert.match(markdown, /- Responses: 1/);
  assert.match(markdown, /`\/apigateway\/customer\/customers\/search`/);
  assert.doesNotMatch(markdown, /logo\.png/);
  assert.doesNotMatch(markdown, /Proxima-Nova-Regular\.woff2/);
});

test("buildFlowReportMarkdown normalizes uuid path segments before comparing known endpoints", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "response",
        step: "Export-Quelle oeffnen",
        timestamp: "2026-06-03T09:00:00.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/userservice/workspaces/e3181e5b-8da8-4b4c-b446-f7814f5bca2e",
        status: 200,
        resourceType: "xhr",
      },
    ],
    {
      generatedAt: new Date("2026-06-03T09:01:00.000Z"),
      knownEndpointKeys: new Set(["GET /apigateway/userservice/workspaces/{uuid}"]),
    },
  );

  assert.match(markdown, /`\/apigateway\/userservice\/workspaces\/\{uuid\}`/);
  assert.doesNotMatch(markdown, /e3181e5b-8da8-4b4c-b446-f7814f5bca2e/);
  assert.match(markdown, /- Neue Endpunkte gegen Katalog: 0/);
  assert.match(markdown, /Keine neuen Endpunkte gegen den bekannten Katalog/);
});

test("buildFlowReportMarkdown normalizes redacted uuid path segments before comparing known endpoints", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "response",
        step: "Bestellung lesen",
        timestamp: "2026-06-05T08:00:00.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/wawi/orders/d0210953-[REDACTED]-c53a0b6b7080/positions",
        status: 200,
        resourceType: "fetch",
      },
    ],
    {
      generatedAt: new Date("2026-06-05T08:01:00.000Z"),
      knownEndpointKeys: new Set(["GET /apigateway/wawi/orders/{uuid}/positions"]),
    },
  );

  assert.match(markdown, /`\/apigateway\/wawi\/orders\/\{uuid\}\/positions`/);
  assert.doesNotMatch(markdown, /d0210953/);
  assert.match(markdown, /- Neue Endpunkte gegen Katalog: 0/);
});

test("buildFlowReportMarkdown normalizes numeric path segments", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "response",
        step: "Detail oeffnen",
        timestamp: "2026-06-03T09:00:00.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/orders/4711/items",
        status: 200,
        resourceType: "fetch",
      },
    ],
    { generatedAt: new Date("2026-06-03T09:01:00.000Z") },
  );

  assert.match(markdown, /`\/apigateway\/orders\/\{id\}\/items`/);
  assert.doesNotMatch(markdown, /\/4711\/items/);
});

test("writeFlowMapping ignores static assets in per-step tables", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-flow-mapping-"));
  const logFile = path.join(dir, "session.jsonl");
  const outputFile = path.join(dir, "mapping.md");
  fs.writeFileSync(
    logFile,
    [
      JSON.stringify({
        type: "flow-marker",
        marker: "step-start",
        step: "Kunde suchen",
        timestamp: "2026-05-30T08:00:00.000Z",
      }),
      JSON.stringify({
        type: "response",
        step: "Kunde suchen",
        timestamp: "2026-05-30T08:00:01.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/img/logo.png",
        status: 200,
        resourceType: "image",
      }),
      JSON.stringify({
        type: "response",
        step: "Kunde suchen",
        timestamp: "2026-05-30T08:00:02.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/customer/customers/search",
        status: 200,
        resourceType: "xhr",
      }),
    ].join("\n"),
  );

  writeFlowMapping(logFile, outputFile);
  const markdown = fs.readFileSync(outputFile, "utf8");

  assert.match(markdown, /`\/apigateway\/customer\/customers\/search`/);
  assert.doesNotMatch(markdown, /logo\.png/);
});

test("writeFlowMapping includes automatic explorer targets even without responses", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-flow-mapping-explore-"));
  const logFile = path.join(dir, "explore.jsonl");
  const outputFile = path.join(dir, "mapping.md");
  fs.writeFileSync(
    logFile,
    [
      JSON.stringify({
        type: "explore-marker",
        marker: "target-start",
        step: "1. Artikel oeffnen",
        timestamp: "2026-06-03T09:00:00.000Z",
      }),
      JSON.stringify({
        type: "response",
        step: "1. Artikel oeffnen",
        timestamp: "2026-06-03T09:00:01.000Z",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/articletenantservice/articles/simple-search",
        status: 200,
        resourceType: "xhr",
      }),
      JSON.stringify({
        type: "explore-marker",
        marker: "target-start",
        step: "2. Hilfe oeffnen",
        timestamp: "2026-06-03T09:00:02.000Z",
      }),
    ].join("\n"),
  );

  writeFlowMapping(logFile, outputFile);
  const markdown = fs.readFileSync(outputFile, "utf8");

  assert.match(markdown, /## 1\. Artikel oeffnen/);
  assert.match(markdown, /`\/apigateway\/articletenantservice\/articles\/simple-search`/);
  assert.match(markdown, /## 2\. Hilfe oeffnen/);
  assert.match(markdown, /TODO: Keine Response fuer diesen Schritt beobachtet/);
});

test("writeFlowMapping includes UI structure for steps even without API responses", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-flow-mapping-ui-"));
  const logFile = path.join(dir, "manual.jsonl");
  const outputFile = path.join(dir, "mapping.md");
  fs.writeFileSync(
    logFile,
    [
      JSON.stringify({
        type: "flow-marker",
        marker: "step-start",
        step: "Kunde [REDACTED] oeffnen",
        timestamp: "2026-06-03T09:00:00.000Z",
      }),
      JSON.stringify({
        type: "ui-snapshot",
        step: "Kunde [REDACTED] oeffnen",
        timestamp: "2026-06-03T09:00:01.000Z",
        path: "/customers/{id}",
        title: "Kunde [REDACTED]",
        headings: ["Kunde [REDACTED]"],
        actions: ["Exportieren", "Zurueck"],
        formLabels: ["Name [REDACTED]", "Geburtsdatum"],
        tableHeaders: ["Artikel", "Status"],
      }),
    ].join("\n"),
  );

  writeFlowMapping(logFile, outputFile);
  const markdown = fs.readFileSync(outputFile, "utf8");

  assert.match(markdown, /## Kunde \[REDACTED\] oeffnen/);
  assert.match(markdown, /TODO: Keine Response fuer diesen Schritt beobachtet/);
  assert.match(markdown, /### UI-Struktur/);
  assert.match(markdown, /\| `\/customers\/\{id\}` \| Kunde \[REDACTED\] \| Kunde \[REDACTED\] \| Exportieren, Zurueck \| Name \[REDACTED\], Geburtsdatum \| Artikel, Status \|/);
  assert.doesNotMatch(markdown, /Max Mustermann/);
});

test("buildFlowReportMarkdown includes download events for export analysis", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "download",
        step: "CSV exportieren",
        timestamp: "2026-06-03T09:00:00.000Z",
        url: "blob:https://api2.optica-omnia.de/3f0699e5-734f-47aa-b0e9-60cbe647be1c",
        suggestedFilename: REDACTED,
        suggestedFileExtension: ".csv",
      },
    ],
    { generatedAt: new Date("2026-06-03T09:01:00.000Z") },
  );

  assert.match(markdown, /- Downloads: 1/);
  assert.match(markdown, /## Downloads/);
  assert.match(markdown, /\| CSV exportieren \| `blob:https:\/\/api2\.optica-omnia\.de\/\{uuid\}` \| \.csv \|/);
  assert.doesNotMatch(markdown, /3f0699e5-734f-47aa-b0e9-60cbe647be1c/);
});

test("buildFlowReportMarkdown includes relative offsets without a video artifact", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "flow-marker",
        marker: "step-start",
        step: "Export vorbereiten",
        timestamp: "2026-06-03T09:00:00.000Z",
      },
      {
        type: "response",
        step: "Export vorbereiten",
        timestamp: "2026-06-03T09:00:05.000Z",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/kunden/salesprocesses/csv-export",
        status: 200,
        resourceType: "xhr",
      },
      {
        type: "download",
        step: "Export pruefen",
        timestamp: "2026-06-03T09:01:15.000Z",
        url: "blob:https://api2.optica-omnia.de/3f0699e5-734f-47aa-b0e9-60cbe647be1c",
        suggestedFileExtension: ".csv",
      },
    ],
    {
      generatedAt: new Date("2026-06-03T09:02:00.000Z"),
      sourceLogFile: "/workspace/logs/network/export-workflow.jsonl",
    },
  );

  assert.doesNotMatch(markdown, /Video:/);
  assert.match(markdown, /\| # \| Offset \| Schritt \| Methode \| Pfad \| Status \| Vermutete Funktion \| Resource \|/);
  assert.match(markdown, /\| 1 \| \+00:05 \| Export vorbereiten \| POST \| `\/apigateway\/kunden\/salesprocesses\/csv-export` \| 200 \|/);
  assert.match(markdown, /\| \+01:15 \| Export pruefen \| `blob:https:\/\/api2\.optica-omnia\.de\/\{uuid\}` \| \.csv \|/);
});

test("buildFlowReportMarkdown includes navigation and browser diagnostic context", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "flow-marker",
        marker: "step-start",
        step: "Kunde oeffnen",
        timestamp: "2026-06-03T09:00:00.000Z",
      },
      {
        type: "navigation",
        step: "Kunde oeffnen",
        timestamp: "2026-06-03T09:00:03.000Z",
        url: "https://api2.optica-omnia.de/master-data/customers/123?query=%5BREDACTED%5D",
      },
      {
        type: "browser-console",
        step: "Kunde oeffnen",
        timestamp: "2026-06-03T09:00:04.000Z",
        level: "error",
        text: "Kunde [REDACTED] konnte nicht geladen werden",
        location: {
          url: "https://api2.optica-omnia.de/assets/main.js?token=%5BREDACTED%5D",
          lineNumber: 42,
          columnNumber: 7,
        },
      },
      {
        type: "browser-pageerror",
        step: "Kunde oeffnen",
        timestamp: "2026-06-03T09:00:05.000Z",
        message: "Fehler fuer Patient [REDACTED]",
      },
    ],
    { generatedAt: new Date("2026-06-03T09:01:00.000Z") },
  );

  assert.match(markdown, /- Navigationen: 1/);
  assert.match(markdown, /- Browser-Diagnosen: 2/);
  assert.match(markdown, /## Browser-Kontext/);
  assert.match(markdown, /\| \+00:03 \| Kunde oeffnen \| Navigation \| `https:\/\/api2\.optica-omnia\.de\/master-data\/customers\/\{id\}\?query=%5BREDACTED%5D` \|/);
  assert.match(markdown, /\| \+00:04 \| Kunde oeffnen \| Console error \| Kunde \[REDACTED\] konnte nicht geladen werden/);
  assert.match(markdown, /\| \+00:05 \| Kunde oeffnen \| Page error \| Fehler fuer Patient \[REDACTED\] \|/);
  assert.doesNotMatch(markdown, /\/123\?query=/);
});

test("buildFlowReportMarkdown includes UI structure snapshots in the recording timeline", () => {
  const markdown = buildFlowReportMarkdown(
    [
      {
        type: "flow-marker",
        marker: "step-start",
        step: "Kunde oeffnen",
        timestamp: "2026-06-03T09:00:00.000Z",
      },
      {
        type: "ui-snapshot",
        step: "Kunde [REDACTED] oeffnen",
        timestamp: "2026-06-03T09:00:06.000Z",
        path: "/customers/{id}",
        title: "Kunde [REDACTED]",
        headings: ["Kunde [REDACTED]"],
        actions: ["Exportieren", "Zurueck"],
        formLabels: ["Name [REDACTED]", "Geburtsdatum"],
        tableHeaders: ["Artikel", "Status"],
      },
    ],
    { generatedAt: new Date("2026-06-03T09:01:00.000Z") },
  );

  assert.match(markdown, /- UI-Snapshots: 1/);
  assert.match(markdown, /## UI-Struktur/);
  assert.match(markdown, /\| \+00:06 \| Kunde \[REDACTED\] oeffnen \| `\/customers\/\{id\}` \| Kunde \[REDACTED\] \| Kunde \[REDACTED\] \| Exportieren, Zurueck \| Name \[REDACTED\], Geburtsdatum \| Artikel, Status \|/);
  assert.doesNotMatch(markdown, /Max Mustermann/);
});
