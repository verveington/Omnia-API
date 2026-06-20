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

test("sends documented live search request contracts", async () => {
  const calls = [];
  const service = createWorkflowService({
    omniaClient: {
      async request(_session, request) {
        calls.push(request);
        return { content: [] };
      },
    },
    procurementService: { listCases: async () => [] },
  });
  const session = liveSession();

  await service.searchCases(session, { keywords: "Muster" });
  await service.searchOrders(session, { keywords: "5001" });
  await service.searchGoodsReceipts(session, { orderNumber: "413" });

  assert.deepEqual(calls[0], {
    method: "POST",
    path: "/apigateway/sales/salesprocesses/search",
    query: { page: 0, size: 25, sort: "number,desc" },
    body: {
      status: [],
      keywords: "Muster",
      active: true,
      editor: { editorIds: [] },
    },
  });
  assert.deepEqual(calls[1], {
    method: "POST",
    path: "/apigateway/wawi/orders/search",
    query: { page: 0, size: 25, sort: "number,desc" },
    body: {
      keywords: "5001",
      active: true,
    },
  });
  assert.deepEqual(calls[2], {
    method: "POST",
    path: "/apigateway/wawi/order-arrival/search",
    query: { page: 0, size: 25, sort: "number,desc" },
    body: {
      keywords: "",
      active: true,
      orderNr: "413",
      arrivalBookingState: "",
    },
  });
});

test("uses injected live-capable procurement service for live bootstrap", async () => {
  const procurementCalls = [];
  const service = createWorkflowService({
    omniaClient: {
      async request(_session, request) {
        if (request.path === "/apigateway/user-details") return { displayName: "Live User" };
        return { content: [] };
      },
    },
    procurementService: {
      async listCases(session) {
        procurementCalls.push(session);
        return [{ id: "live-procurement-case" }];
      },
    },
  });

  const bootstrap = await service.getBootstrap(liveSession());

  assert.equal(bootstrap.source, "live");
  assert.equal(bootstrap.currentUser.name, "Live User");
  assert.deepEqual(bootstrap.orderProposals, []);
  assert.deepEqual(bootstrap.procurementCases, [{ id: "live-procurement-case" }]);
  assert.equal(procurementCalls.length, 1);
  assert.equal(procurementCalls[0].source, "live");
});

function liveSession() {
  return {
    source: "live",
    omniaAccessToken: "token",
    user: { username: "live-user", displayName: "Live User" },
    workspace: "Live Workspace",
  };
}
