import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  runTargetedAutoFlow,
  targetedAutoFlowNames,
  type TargetedAutoFlowClient,
} from "./targeted-auto-flows.ts";

test("targeted auto flow records concrete module endpoints", async () => {
  const requests: Array<{ method: string; path: string; body?: unknown }> = [];
  const client: TargetedAutoFlowClient = {
    async request(request) {
      requests.push({
        method: (request.method || "GET").toUpperCase(),
        path: request.path,
        body: request.body,
      });

      if (request.path === "/apigateway/kunden/customers/search") {
        return { content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann", name: "Max Mustermann" }] };
      }
      if (request.path === "/apigateway/sales/salesprocesses/search") {
        return { content: [{ id: "sales-1", number: "SP-1", customerId: "customer-1", filialeId: "branch-1" }] };
      }
      if (request.path === "/apigateway/articletenantservice/articles/simple-search") {
        return { content: [{ id: "article-1", articleNumber: "Musterartikel", description: "Musterartikel" }] };
      }
      if (request.path === "/apigateway/article-tenant/article-kits/search") {
        return { content: [{ id: "kit-1", articleKitNumber: "Musterartikel", description: "Musterartikel" }] };
      }
      if (request.path === "/apigateway/userservice/companies/details/preferences") {
        return { companyProfileId: "company-profile-1" };
      }
      if (request.path === "/apigateway/wawi/order-arrival/search") {
        return {
          content: [{
            id: "arrival-1",
            orderId: "order-1",
            orderPositionId: "position-1",
            articleId: "article-1",
            articleDescription: "Musterartikel",
            customerId: "customer-1",
          }],
        };
      }
      if (request.path === "/apigateway/hilfsmittel/route-plannings") {
        return [{ id: "route-1", salesProcessNumber: "SP-1" }];
      }
      return {};
    },
  };
  const logFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "targeted-flow-")), "flow.jsonl");
  const currentSteps: Array<string | null> = [];

  const result = await runTargetedAutoFlow({
    flowName: "all-targeted-read",
    client,
    page: fakePage(),
    logFile,
    sessionId: "test-session",
    settleMs: 1,
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    setCurrentStep: (step) => currentSteps.push(step),
  });

  assert.equal(result.stopReason, "targeted-flow-completed");
  assert.equal(currentSteps.includes("Wawi: Wareneingang Position-Info laden"), true);
  assert.equal(requests.some((request) => request.method === "POST" && request.path === "/apigateway/wawi/order-arrival/position-info"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/accounting/bons"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/accounting/cash-book-entries/search"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/article-kit/generate-labels/company-profile-1/article-kits/kit-1"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/hilfsmittel/route-plannings/route-1/stops"), true);

  const articleSearch = requests.find((request) => request.path === "/apigateway/articletenantservice/articles/simple-search");
  assert.deepEqual(articleSearch?.body, {
    dataOrigin: ["LOCAL"],
    keywords: "Musterartikel",
    active: true,
    useDescriptionOnlyMultiKeywords: true,
  });

  const positionInfo = requests.find((request) => request.path === "/apigateway/wawi/order-arrival/position-info");
  assert.deepEqual(positionInfo?.body, {
    orderId: "order-1",
    orderPositionId: "position-1",
    articleId: "article-1",
  });

  const markers = fs.readFileSync(logFile, "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.equal(markers.some((marker) => marker.marker === "step-start" && marker.step === "Wawi: Wareneingang Position-Info laden"), true);
  assert.equal(markers.some((marker) => marker.marker === "step-end" && marker.status === "ok"), true);
  assert.equal(markers.some((marker) => marker.type === "ui-snapshot"), true);
});

test("targeted auto flow exposes stable flow names", () => {
  assert.deepEqual(
    targetedAutoFlowNames,
    [
      "all-targeted-read",
      "wawi-order-arrival-position-info",
      "accounting-cash-book-read",
      "article-detail-read",
      "article-kit-read",
      "route-planning-read",
      "customer-cost-estimates-read",
    ],
  );
});

test("targeted article detail flow reads article tabs and related endpoints", async () => {
  const requests: Array<{ method: string; path: string; body?: unknown }> = [];
  const client: TargetedAutoFlowClient = {
    async request(request) {
      requests.push({
        method: (request.method || "GET").toUpperCase(),
        path: request.path,
        body: request.body,
      });

      if (request.path === "/apigateway/articletenantservice/articles/simple-search") {
        return { content: [{ id: "article-1", articleNumber: "Musterartikel", description: "Musterartikel" }] };
      }
      if (request.path === "/apigateway/article-tenant/articles/article-1") {
        return { id: "article-1", articleNumber: "Musterartikel", priceData: { quantityUnit: "PIECE" } };
      }
      if (request.path === "/apigateway/filiale/filialen") {
        return { content: [{ id: "branch-1", active: true }] };
      }
      if (request.path === "/apigateway/userservice/companies/details/preferences") {
        return { companyProfileId: "company-profile-1" };
      }
      return {};
    },
  };

  await runTargetedAutoFlow({
    flowName: "article-detail-read",
    client,
    page: fakePage(),
    logFile: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "targeted-flow-article-detail-")), "flow.jsonl"),
    sessionId: "test-session",
    settleMs: 1,
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
  });

  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/price-data"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/price-data/alternative-selling-prices"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/merchandise-management-setting"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/stock-data"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/quantities"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/details/branch-1"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/supplier-assignments"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/articles/article-1/supplier-assignments/has-main-supplier"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/article-tenant/article/generate-labels/company-profile-1/articles/article-1"), true);
  assert.equal(requests.some((request) => request.method === "POST" && request.path === "/apigateway/document/archive-documents/search"), true);
  assert.deepEqual(requests.find((request) => request.path === "/apigateway/document/archive-documents/search")?.body, {
    module: "ARTICLE_TENANT",
    migratedId: null,
    size: 10,
    sort: ["description,asc"],
    keywords: "Musterartikel",
    description: { type: "contains" },
    fileName: { type: "contains" },
  });
});

test("targeted auto flow resolves the test customer from sales-process rows", async () => {
  const requests: Array<{ method: string; path: string }> = [];
  const client: TargetedAutoFlowClient = {
    async request(request) {
      requests.push({ method: (request.method || "GET").toUpperCase(), path: request.path });
      if (request.path === "/apigateway/kunden/customers/search") return { content: [] };
      if (request.path === "/apigateway/sales/salesprocesses/search") {
        return {
          content: [{
            id: "sales-1",
            customerId: "customer-1",
            customerFirstName: "Max",
            customerLastName: "Mustermann",
            customerName: "Max Mustermann",
            number: "SP-1",
          }],
        };
      }
      return {};
    },
  };

  await runTargetedAutoFlow({
    flowName: "customer-cost-estimates-read",
    client,
    page: fakePage(),
    logFile: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "targeted-flow-customer-")), "flow.jsonl"),
    sessionId: "test-session",
    settleMs: 1,
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
  });

  assert.equal(requests.some((request) => request.path === "/apigateway/ekv/cost-estimates"), true);
  assert.equal(requests.some((request) => request.path === "/apigateway/ekv/cost-estimates/latest-approved"), true);
});

function fakePage(): any {
  return {
    url: () => "https://api2.optica-omnia.de/dashboard",
    async goto() {},
    async evaluate() {
      return {
        url: "https://api2.optica-omnia.de/dashboard",
        title: "Omnia",
        headings: ["Dashboard"],
        actions: ["Suchen"],
        formLabels: ["Suche"],
        tableHeaders: ["Nummer"],
      };
    },
    async waitForLoadState() {},
    async waitForTimeout() {},
  };
}
