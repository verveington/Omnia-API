import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOmniaDataModel,
  buildOmniaDataModelMarkdown,
  parseOmniaDataModelArgs,
} from "./omnia-data-model.ts";

test("buildOmniaDataModel groups redacted request and response bodies into entity candidates", () => {
  const model = buildOmniaDataModel(
    [
      response("GET", "/apigateway/kunden/customers/search", {
        content: [
          {
            id: 0,
            firstName: "[REDACTED]",
            active: false,
            address: { city: "[REDACTED]", postalCode: "[REDACTED]" },
          },
        ],
        totalElements: 0,
      }),
      request("POST", "/apigateway/wawi/order-proposals/search", {
        customerId: 0,
        includeAll: false,
        articleIds: [0],
      }),
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  assert.equal(model.entityCount, 2);
  const customers = model.entities.find((entity) => entity.name === "customers");
  assert.equal(customers?.area, "Kunden/Vorgaenge");
  assert.equal(customers?.sampleCount, 1);
  assert.deepEqual(
    customers?.fields.map((field) => `${field.path}:${field.types.join("|")}`),
    [
      "content:array",
      "content[].active:boolean",
      "content[].address:object",
      "content[].address.city:string",
      "content[].address.postalCode:string",
      "content[].firstName:string",
      "content[].id:number",
      "totalElements:number",
    ],
  );

  const proposals = model.entities.find((entity) => entity.name === "order-proposals");
  assert.equal(proposals?.area, "Warenwirtschaft/Bestellung");
  assert.equal(proposals?.sourceKinds.includes("request"), true);
  assert.equal(proposals?.fields.find((field) => field.path === "articleIds[]")?.types[0], "number");
});

test("buildOmniaDataModel skips missing and scalar bodies", () => {
  const model = buildOmniaDataModel([
    response("GET", "/apigateway/task/tasks/task-count", 0),
    response("GET", "/apigateway/mail/mails/unread-number", null),
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
      status: 200,
      resourceType: "xhr",
      body: null,
      bodyOmittedReason: "disabled",
    },
  ]);

  assert.equal(model.entityCount, 0);
  assert.equal(model.sampleCount, 0);
});

test("buildOmniaDataModel names repeated domain paths and dv-data correctly", () => {
  const model = buildOmniaDataModel([
    request("POST", "/apigateway/hilfsmittel/hilfsmittel/search", { active: false }),
    request("POST", "/apigateway/sales/dv-data/search", { keywords: "[REDACTED]" }),
  ]);

  assert.equal(model.entities.find((entity) => entity.area === "Hilfsmittel")?.name, "hilfsmittel");
  assert.equal(model.entities.find((entity) => entity.name === "dv-data")?.area, "dv-data");
});

test("buildOmniaDataModelMarkdown documents entities, fields and endpoints without raw values", () => {
  const model = buildOmniaDataModel(
    [
      response("GET", "/apigateway/kunden/customers/search", {
        content: [{ id: 0, firstName: "[REDACTED]" }],
      }),
    ],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const markdown = buildOmniaDataModelMarkdown(model);

  assert.match(markdown, /^# Omnia-Data-Model/m);
  assert.match(markdown, /customers/);
  assert.match(markdown, /content\[\]\.firstName/);
  assert.match(markdown, /Kunden\/Vorgaenge/);
  assert.doesNotMatch(markdown, /Max|Mustermann|user@example/);
});

test("parseOmniaDataModelArgs defaults to docs data model output", () => {
  const options = parseOmniaDataModelArgs([]);

  assert.equal(options.outputFile.endsWith("docs/13_omnia_data_model.md"), true);
});

function request(method: string, pathname: string, body: unknown): Record<string, unknown> {
  return traffic("request", method, pathname, body);
}

function response(method: string, pathname: string, body: unknown): Record<string, unknown> {
  return traffic("response", method, pathname, body);
}

function traffic(type: "request" | "response", method: string, pathname: string, body: unknown): Record<string, unknown> {
  return {
    type,
    method,
    url: `https://api2.optica-omnia.de${pathname}`,
    status: type === "response" ? 200 : undefined,
    resourceType: "xhr",
    body,
  };
}
