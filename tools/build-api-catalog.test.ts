import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildApiCatalog, writeCatalogMarkdown } from "./build-api-catalog.ts";

test("buildApiCatalog ignores static assets and keeps API fetch/xhr traffic", () => {
  const catalog = buildApiCatalog([
    {
      type: "request",
      requestId: "asset-1",
      method: "GET",
      url: "https://api2.optica-omnia.de/img/logo.png",
      resourceType: "image",
    },
    {
      type: "response",
      requestId: "asset-1",
      method: "GET",
      url: "https://api2.optica-omnia.de/img/logo.png",
      status: 200,
      resourceType: "image",
    },
    {
      type: "request",
      requestId: "api-1",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/customer/customers/search",
      resourceType: "fetch",
    },
    {
      type: "response",
      requestId: "api-1",
      step: "Kunde suchen",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/customer/customers/search",
      status: 200,
      resourceType: "fetch",
    },
  ]);

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].path, "/apigateway/customer/customers/search");
  assert.deepEqual([...catalog[0].resourceTypes], ["fetch"]);
});

test("writeCatalogMarkdown redacts long UI row labels used as step markers", () => {
  const catalog = buildApiCatalog([
    {
      type: "request",
      requestId: "api-1",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/123",
      resourceType: "fetch",
    },
    {
      type: "response",
      requestId: "api-1",
      step: "20. 18582 Max Mustermann AOK Bayern Christoph Schernthaner 0,00 EUR 21. 18587 Max Mustermann",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/123",
      status: 200,
      resourceType: "fetch",
    },
  ]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-catalog-"));
  const outputFile = path.join(dir, "catalog.md");

  writeCatalogMarkdown(catalog, outputFile, []);
  const markdown = fs.readFileSync(outputFile, "utf8");

  assert.match(markdown, /Vermuteter Fachprozess: UI-Zeile \[REDACTED\]/);
  assert.doesNotMatch(markdown, /Max Mustermann|Christoph Schernthaner/);
});
