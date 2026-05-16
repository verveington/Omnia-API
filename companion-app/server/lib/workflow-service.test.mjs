import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkflowService } from "./workflow-service.mjs";

test("returns bootstrap data from the demo source when the session is not live", async () => {
  const service = createWorkflowService({
    omniaClient: {
      request() {
        throw new Error("live Omnia must not be called in mock mode");
      },
    },
  });

  const bootstrap = await service.getBootstrap({
    source: "mock",
    user: { username: "christoph", displayName: "Christoph Schernthaner" },
    workspace: "saniPEP Sanitätshaus GmbH & Co. KG",
  });

  assert.equal(bootstrap.source, "mock");
  assert.equal(bootstrap.currentUser.name, "Christoph Schernthaner");
  assert.ok(bootstrap.cases.length > 0);
  assert.ok(bootstrap.orders.length > 0);
  assert.ok(bootstrap.goodsReceipts.length > 0);
  assert.equal(bootstrap.procurementCases[0].supplierGroups.length, 2);
  assert.equal(bootstrap.procurementCases[0].proposals[0].pzn, "12345678");
});

test("filters demo cases, orders and goods receipts by keyword", async () => {
  const service = createWorkflowService({ omniaClient: { request() {} } });
  const session = {
    source: "mock",
    user: { username: "christoph", displayName: "Christoph Schernthaner" },
    workspace: "saniPEP",
  };

  const cases = await service.searchCases(session, { keywords: "Erika" });
  const orders = await service.searchOrders(session, { keywords: "411" });
  const receipts = await service.searchGoodsReceipts(session, { orderNumber: "413" });

  assert.deepEqual(cases.map((record) => record.customer), ["Erika Beispiel"]);
  assert.deepEqual(orders.map((record) => record.number), ["411"]);
  assert.deepEqual(receipts.map((record) => record.orderNumber), ["413"]);
});
