import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeWriteRequest,
  buildWriteLabReportMarkdown,
  parseWriteLabArgs,
  runSalesProcessAddArticlePosition,
  runSalesProcessUiCreate,
  runSalesProcessNoopSave,
  runWriteLabScenario,
  runWawiOrderLifecycle,
  uniqueExactMatch,
} from "./write-lab.ts";

test("parseWriteLabArgs reads the Wawi scenario and test objects", () => {
  const options = parseWriteLabArgs([
    "--scenario",
    "wawi-order-lifecycle",
    "--stub",
    "--wait-for-login",
    "--test-customer",
    "Max Mustermann",
    "--test-article",
    "Musterartikel",
    "--capture-bodies",
    "--max-body-bytes",
    "2000000",
    "--allow-article-setup",
  ]);

  assert.equal(options.scenario, "wawi-order-lifecycle");
  assert.equal(options.testCustomer, "Max Mustermann");
  assert.equal(options.testArticle, "Musterartikel");
  assert.equal(options.useElectronStub, true);
  assert.equal(options.waitForLogin, true);
  assert.equal(options.captureBodies, true);
  assert.equal(options.maxBodyBytes, 2_000_000);
  assert.equal(options.allowArticleSetup, true);
});

test("parseWriteLabArgs accepts the guarded sales-process UI create scenario", () => {
  const options = parseWriteLabArgs([
    "--scenario",
    "sales-process-add-article-position",
    "--test-customer",
    "Max Mustermann",
    "--quantity",
    "5",
  ]);

  assert.equal(options.scenario, "sales-process-add-article-position");
  assert.equal(options.testCustomer, "Max Mustermann");
  assert.equal(options.quantity, 5);
});

test("parseWriteLabArgs requires an explicit goods-receipt booking flag", () => {
  const searchOnly = parseWriteLabArgs(["--allow-goods-receipt"]);
  assert.equal(searchOnly.allowGoodsReceipt, true);
  assert.equal(searchOnly.bookGoodsReceipt, false);

  const booking = parseWriteLabArgs(["--book-goods-receipt"]);
  assert.equal(booking.allowGoodsReceipt, true);
  assert.equal(booking.bookGoodsReceipt, true);
});

test("uniqueExactMatch accepts exactly one exact match and rejects zero or multiple matches", () => {
  const rows = [
    { id: "1", firstName: "Max", lastName: "Mustermann" },
    { id: "2", firstName: "Mara", lastName: "Musterfrau" },
  ];

  assert.equal(
    uniqueExactMatch(rows, "Max Mustermann", (row) => [`${row.firstName} ${row.lastName}`], "Kunde").id,
    "1",
  );
  assert.throws(
    () => uniqueExactMatch(rows, "Nicht Vorhanden", (row) => [`${row.firstName} ${row.lastName}`], "Kunde"),
    /Kunde nicht eindeutig/,
  );
  assert.throws(
    () => uniqueExactMatch([...rows, { id: "3", firstName: "Max", lastName: "Mustermann" }], "Max Mustermann", (row) => [`${row.firstName} ${row.lastName}`], "Kunde"),
    /Kunde nicht eindeutig/,
  );
});

test("uniqueExactMatch can resolve the approved test customer by unique last name", () => {
  const rows = [
    { id: "1", firstName: "Max", lastName: "Mustermann" },
    { id: "2", firstName: "Mara", lastName: "Musterfrau" },
  ];

  assert.equal(
    uniqueExactMatch(rows, "Mustermann", (row) => [row.lastName, `${row.firstName} ${row.lastName}`], "Kunde").id,
    "1",
  );
  assert.throws(
    () =>
      uniqueExactMatch(
        [...rows, { id: "3", firstName: "Moritz", lastName: "Mustermann" }],
        "Mustermann",
        (row) => [row.lastName, `${row.firstName} ${row.lastName}`],
        "Kunde",
      ),
    /Kunde nicht eindeutig/,
  );
});

test("assertSafeWriteRequest blocks broad or destructive write requests", () => {
  assert.throws(
    () =>
      assertSafeWriteRequest({
        method: "POST",
        path: "/apigateway/wawi/order-proposals/to-order",
        body: { includeAll: true, selections: [], filters: null },
      }),
    /includeAll:true/,
  );
  assert.throws(
    () => assertSafeWriteRequest({ method: "DELETE", path: "/apigateway/wawi/order-proposals/proposal-1" }),
    /DELETE/,
  );
  assert.throws(
    () =>
      assertSafeWriteRequest({
        method: "POST",
        path: "/apigateway/wawi/orders/from-proposal",
        body: { proposals: { includeAll: false, selections: ["proposal-1"], filters: null } },
      }),
    /supplierId/,
  );
  assert.throws(
    () =>
      assertSafeWriteRequest({
        method: "POST",
        path: "/apigateway/article-tenant/articles/article-1/supplier-assignments",
        body: { articleId: "article-1", supplierId: "supplier-1" },
      }),
    /Artikellieferant/,
  );
  assert.doesNotThrow(() =>
    assertSafeWriteRequest(
      {
        method: "POST",
        path: "/apigateway/article-tenant/articles/article-1/supplier-assignments",
        body: { articleId: "article-1", supplierId: "supplier-1" },
      },
      { allowArticleSetup: true },
    ),
  );
  assert.throws(
    () =>
      assertSafeWriteRequest({
        method: "PUT",
        path: "/apigateway/sales/salesprocesses/sales-process-1",
        body: { id: "sales-process-1", customerId: "customer-1" },
      }),
    /Vorgang-Speichern/,
  );
  assert.throws(
    () =>
      assertSafeWriteRequest(
        {
          method: "PUT",
          path: "/apigateway/sales/salesprocesses/sales-process-1",
          body: { id: "sales-process-2", customerId: "customer-1" },
        },
        { allowSalesProcessSave: true },
      ),
    /passende Vorgangs-ID/,
  );
  assert.doesNotThrow(() =>
    assertSafeWriteRequest(
      {
        method: "PUT",
        path: "/apigateway/sales/salesprocesses/sales-process-1",
        body: { id: "sales-process-1", customerId: "customer-1" },
      },
      { allowSalesProcessSave: true },
    ),
  );
  assert.throws(
    () =>
      assertSafeWriteRequest({
        method: "POST",
        path: "/apigateway/sales/salesprocesses",
        body: { customerId: "customer-1" },
      }),
    /Vorgang-Anlage/,
  );
  assert.throws(
    () =>
      assertSafeWriteRequest(
        {
          method: "POST",
          path: "/apigateway/sales/salesprocesses",
          body: {},
        },
        { allowSalesProcessCreate: true },
      ),
    /Kundenbezug/,
  );
  assert.doesNotThrow(() =>
    assertSafeWriteRequest(
      {
        method: "POST",
        path: "/apigateway/sales/salesprocesses",
        body: { customerId: "customer-1" },
      },
      { allowSalesProcessCreate: true },
    ),
  );
});

test("buildWriteLabReportMarkdown omits video artifacts", () => {
  const markdown = buildWriteLabReportMarkdown({
    scenario: "wawi-order-lifecycle",
    status: "completed",
    startedAt: "2026-06-04T10:00:00.000Z",
    completedAt: "2026-06-04T10:01:00.000Z",
    testObjects: { customer: "Mustermann", article: "Musterartikel" },
    generatedIds: {},
    steps: [],
  });

  assert.equal(markdown.includes("Video:"), false);
});

test("runWawiOrderLifecycle uses explicit proposal selection, reads back, then processes the test order", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1" }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", articleNumber: "Musterartikel", description: "Musterartikel fuer Vorgangstest", pzn: "12345678", unit: "STK" }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": {
      id: "article-1",
      articleNumber: "Musterartikel",
      description: "Musterartikel fuer Vorgangstest",
      pzn: "12345678",
      unit: "STK",
    },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": {
      content: [{ id: "assignment-1", articleId: "article-1", supplierId: "supplier-1", unitSell: "STK", purchasePriceActual: 1 }],
    },
    "POST /apigateway/wawi/order-proposals/search": [
      { content: [readyProposal()] },
      { content: [readyProposal()] },
    ],
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": [
      { id: "order-1", number: "5001", supplierId: "supplier-1" },
      {
        id: "order-1",
        number: "5001",
        supplierId: "supplier-1",
        filialeId: "branch-1",
        orderDate: "2026-06-05T10:37:59.369+02:00",
      },
    ],
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [
        { id: "position-1", articleId: "article-1", description: "Musterartikel", pzn: "12345678", quantity: 1, unit: "STK" },
      ],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    quantity: 1,
    generatedAt: new Date("2026-06-03T10:00:00.000Z"),
  });

  assert.equal(result.status, "completed");
  assert.equal(result.generatedIds.orderId, "order-1");
  assert.deepEqual(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals/to-order"), {
    includeAll: false,
    selections: ["proposal-1"],
    filters: null,
  });
  assert.deepEqual(requestBody(client.calls, "POST", "/apigateway/wawi/orders/from-proposal"), {
    proposals: {
      includeAll: false,
      selections: ["proposal-1"],
      filters: null,
    },
    supplierId: "supplier-1",
  });

  const readbackIndex = callIndex(client.calls, "GET", "/apigateway/wawi/orders/order-1/positions");
  const processIndex = callIndex(client.calls, "POST", "/apigateway/wawi/orders/order-1/process-order");
  assert.ok(readbackIndex > -1);
  assert.ok(processIndex > readbackIndex);
});

test("runWawiOrderLifecycle aborts before writes when no unique test proposal or create context exists", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1" }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", description: "Musterartikel" }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": { id: "article-1", description: "Musterartikel" },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": { content: [] },
    "POST /apigateway/wawi/order-proposals/search": [{ content: [] }, { content: [] }],
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    quantity: 1,
  });

  assert.equal(result.status, "aborted");
  assert.match(result.abortReason || "", /missing-order-proposal-context/);
  assert.equal(client.calls.some((call) => call.method === "POST" && call.path === "/apigateway/wawi/order-proposals"), false);
  assert.equal(client.calls.some((call) => call.path === "/apigateway/wawi/orders/from-proposal"), false);
});

test("runWawiOrderLifecycle selects the latest active sales process for the approved test customer", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [
        { id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-old", date: "2026-05-01T08:00:00.000Z", active: true },
        { id: "sales-process-new", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-new", date: "2026-06-01T08:00:00.000Z", active: true },
      ],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", articleNumber: "Musterartikel", description: "Musterartikel", unit: "STK", purchasePriceActual: 1 }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": {
      id: "article-1",
      articleNumber: "Musterartikel",
      unit: "STK",
      purchasePriceActual: 1,
    },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": {
      content: [{ id: "assignment-1", articleId: "article-1", supplierId: "supplier-1", unitSell: "STK", purchasePriceActual: 1 }],
    },
    "POST /apigateway/wawi/order-proposals/search": [
      { content: [] },
      { content: [] },
    ],
    "POST /apigateway/wawi/order-proposals": readyProposal(),
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": { id: "order-1", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [{ id: "position-1", articleId: "article-1", quantity: 1, unit: "STK" }],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Mustermann",
    testArticle: "Musterartikel",
    quantity: 1,
  });

  assert.equal(result.status, "completed");
  assert.equal(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals").salesProcessId, "sales-process-new");
  assert.equal(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals").filialeId, "branch-new");
});

test("runWawiOrderLifecycle does not retry non-idempotent writes after a gateway failure", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1" }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", description: "Musterartikel", pzn: "12345678", unit: "STK" }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": { id: "article-1", description: "Musterartikel" },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": {
      content: [{ id: "assignment-1", articleId: "article-1", supplierId: "supplier-1", unitSell: "STK", purchasePriceActual: 1 }],
    },
    "POST /apigateway/wawi/order-proposals/search": [
      { content: [readyProposal()] },
      { content: [readyProposal()] },
    ],
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": new Error("500 Internal Server Error"),
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    quantity: 1,
  });

  assert.equal(result.status, "aborted");
  assert.equal(
    client.calls.filter((call) => call.method === "POST" && call.path === "/apigateway/wawi/orders/from-proposal").length,
    1,
  );
});

test("runWawiOrderLifecycle records goods receipt candidates without booking implicitly", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1", active: true }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": { id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": [{
      articleId: "article-1",
      supplierId: "supplier-1",
      unitSell: "PIECE",
      purchasePriceActual: 1,
      mainSupplier: true,
      active: true,
    }],
    "POST /apigateway/wawi/order-proposals/search": [{ content: [] }, { content: [] }],
    "POST /apigateway/wawi/order-proposals": readyProposal(),
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": [
      { id: "order-1", number: "5001", supplierId: "supplier-1" },
      {
        id: "order-1",
        number: "5001",
        supplierId: "supplier-1",
        filialeId: "branch-1",
        orderDate: "2026-06-05T10:37:59.369+02:00",
      },
    ],
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [{ id: "position-1", articleId: "article-1", supplierId: "supplier-1", unit: "PIECE", quantity: 1 }],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
    "POST /apigateway/wawi/order-arrival/search": {
      content: [{
        id: "arrival-1",
        orderId: "order-1",
        orderNumber: "5001",
        orderPositionId: "position-1",
        articleId: "article-1",
        supplierId: "supplier-1",
      }],
    },
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    allowGoodsReceipt: true,
  });

  assert.equal(result.status, "completed");
  assert.equal(callIndex(client.calls, "POST", "/apigateway/wawi/order-arrival/search") > callIndex(client.calls, "POST", "/apigateway/wawi/orders/order-1/process-order"), true);
  assert.deepEqual(requestBody(client.calls, "POST", "/apigateway/wawi/order-arrival/search"), {
    keywords: "*",
    active: true,
    externalFilter: {
      deliveryDateFrom: null,
      deliveryDateTo: null,
      deliveryDateScheduledFrom: null,
      deliveryDateScheduledTo: null,
      filialeIds: ["branch-1"],
      orderDateFrom: "2026-06-05T10:37:59.369+02:00",
      orderDateTo: "2026-06-05T10:37:59.369+02:00",
      orderId: "order-1",
      orderStateIds: null,
      storageLocationIds: null,
      supplierCustomerIds: null,
      supplierId: "supplier-1",
    },
    externalFilterFormHeader: {
      deliveryDate: null,
      filialeId: "branch-1",
      storageLocationId: null,
    },
  });
  assert.equal(client.calls.some((call) => call.path === "/apigateway/wawiservice/order-arrival/book"), false);
  const goodsReceiptStep = result.steps.find((step) => step.name === "Wareneingangskandidaten suchen");
  assert.equal(goodsReceiptStep?.status, "skipped");
  assert.equal(goodsReceiptStep?.generatedIds?.candidateCount, 1);
});

test("runWawiOrderLifecycle can book goods receipt only for one explicit test position", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1", active: true }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": { id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": [{
      articleId: "article-1",
      supplierId: "supplier-1",
      unitSell: "PIECE",
      purchasePriceActual: 1,
      mainSupplier: true,
      active: true,
    }],
    "POST /apigateway/wawi/order-proposals/search": [{ content: [] }, { content: [] }],
    "POST /apigateway/wawi/order-proposals": readyProposal(),
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": [
      { id: "order-1", number: "5001", supplierId: "supplier-1", filialeId: "branch-1" },
      { id: "order-1", number: "5001", supplierId: "supplier-1", filialeId: "branch-1", orderDate: "2026-06-05T10:37:59.369+02:00", editorId: "editor-1" },
      { id: "order-1", number: "5001", supplierId: "supplier-1", filialeId: "branch-1", orderArrivalBookingState: "ONGOING" },
    ],
    "GET /apigateway/wawi/orders/order-1/positions": [
      { content: [{ id: "position-1", articleId: "article-1", supplierId: "supplier-1", unit: "PIECE", quantity: 1, remainingQuantity: 1 }] },
      { content: [{ id: "position-1", articleId: "article-1", supplierId: "supplier-1", unit: "PIECE", quantity: 1, remainingQuantity: 0, arrivalBookingState: "ONGOING" }] },
    ],
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
    "GET /apigateway/wawi/storage-locations": { content: [{ id: "storage-1", filialeId: "branch-1", active: true }] },
    "POST /apigateway/wawi/order-arrival/search": {
      content: [{
        orderId: "order-1",
        orderNr: "5001",
        orderPositionId: "position-1",
        supplierId: "supplier-1",
        articleId: "article-1",
        filialeId: "branch-1",
        orderRemainingQuantity: 1,
        arrivalBookingState: "NEW",
      }],
    },
    "POST /apigateway/wawiservice/order-arrival/book": { id: "order-1", orderArrivalBookingState: "ONGOING" },
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    allowGoodsReceipt: true,
    bookGoodsReceipt: true,
    generatedAt: new Date("2026-06-05T08:00:00.000Z"),
  });

  assert.equal(result.status, "completed");
  const bookBody = requestBody(client.calls, "POST", "/apigateway/wawiservice/order-arrival/book");
  assert.deepEqual(bookBody.filteredSelection, { includeAll: false, selections: ["position-1"], filters: null });
  assert.equal(bookBody.orderNumber, "5001");
  assert.equal(bookBody.quantity, 1);
  assert.equal(bookBody.storageLocationId, "storage-1");
  assert.equal(bookBody.performGoodsReceipt, true);
  assert.equal(callIndex(client.calls, "POST", "/apigateway/wawiservice/order-arrival/book") > callIndex(client.calls, "POST", "/apigateway/wawi/order-arrival/search"), true);
  const goodsReceiptStep = result.steps.find((step) => step.name === "Wareneingang buchen");
  assert.equal(goodsReceiptStep?.status, "ok");
});

test("runWawiOrderLifecycle refuses goods receipt booking when multiple arrival candidates match", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1", active: true }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": { id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": [{ articleId: "article-1", supplierId: "supplier-1", unitSell: "PIECE", purchasePriceActual: 1 }],
    "POST /apigateway/wawi/order-proposals/search": [{ content: [] }, { content: [] }],
    "POST /apigateway/wawi/order-proposals": readyProposal(),
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": [
      { id: "order-1", number: "5001", supplierId: "supplier-1", filialeId: "branch-1" },
      { id: "order-1", number: "5001", supplierId: "supplier-1", filialeId: "branch-1", orderDate: "2026-06-05T10:37:59.369+02:00" },
    ],
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [{ id: "position-1", articleId: "article-1", supplierId: "supplier-1", unit: "PIECE", quantity: 1, remainingQuantity: 1 }],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
    "GET /apigateway/wawi/storage-locations": { content: [{ id: "storage-1", filialeId: "branch-1", active: true }] },
    "POST /apigateway/wawi/order-arrival/search": {
      content: [
        { orderId: "order-1", orderNr: "5001", orderPositionId: "position-1", articleId: "article-1", supplierId: "supplier-1", filialeId: "branch-1", orderRemainingQuantity: 1 },
        { orderId: "order-1", orderNr: "5001", orderPositionId: "position-2", articleId: "article-1", supplierId: "supplier-1", filialeId: "branch-1", orderRemainingQuantity: 1 },
      ],
    },
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    allowGoodsReceipt: true,
    bookGoodsReceipt: true,
  });

  assert.equal(result.status, "aborted");
  assert.match(result.abortReason || "", /goods-receipt-candidate-not-unique/);
  assert.equal(client.calls.some((call) => call.path === "/apigateway/wawiservice/order-arrival/book"), false);
});

test("runWawiOrderLifecycle keeps optional goods receipt search failures from aborting the completed order flow", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1", active: true }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": { id: "article-1", description: "Musterartikel", supplierId: "supplier-1", unit: "PIECE", orderValue: 1 },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": [{
      articleId: "article-1",
      supplierId: "supplier-1",
      unitSell: "PIECE",
      purchasePriceActual: 1,
      mainSupplier: true,
      active: true,
    }],
    "POST /apigateway/wawi/order-proposals/search": [{ content: [] }, { content: [] }],
    "POST /apigateway/wawi/order-proposals": readyProposal(),
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": [
      { id: "order-1", number: "5001", supplierId: "supplier-1" },
      {
        id: "order-1",
        number: "5001",
        supplierId: "supplier-1",
        filialeId: "branch-1",
        orderDate: "2026-06-05T10:37:59.369+02:00",
      },
    ],
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [{ id: "position-1", articleId: "article-1", supplierId: "supplier-1", unit: "PIECE", quantity: 1 }],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
    "POST /apigateway/wawi/order-arrival/search": new Error("POST /apigateway/wawi/order-arrival/search failed: 500"),
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    allowGoodsReceipt: true,
  });

  assert.equal(result.status, "completed");
  assert.equal(result.generatedIds.orderId, "order-1");
  const goodsReceiptStep = result.steps.find((step) => step.name === "Wareneingangskandidaten suchen");
  assert.equal(goodsReceiptStep?.status, "skipped");
  assert.match(goodsReceiptStep?.abortReason || "", /order-arrival\/search failed: 500/);
});

test("runWawiOrderLifecycle can prepare the Musterartikel supplier context with explicit approval", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [{ id: "sales-process-1", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-1" }],
    },
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [
        {
          id: "article-1",
          articleNumber: "Musterartikel",
          description: "Musterartikel fuer Vorgangstest",
          producer: { label: "CS | Coloplast GmbH, Hamburg" },
          priceData: { purchasePriceActual: 0.5 },
        },
      ],
    },
    "GET /apigateway/articletenantservice/articles/article-1": {
      id: "article-1",
      articleNumber: "Musterartikel",
      producer: { label: "CS | Coloplast GmbH, Hamburg" },
      priceData: { purchasePriceActual: 0.5 },
    },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": [
      { content: [] },
      { content: [{ id: "assignment-1", articleId: "article-1", supplierId: "supplier-1", unitSell: null, purchasePriceActual: 0.5 }] },
    ],
    "GET /apigateway/supplier/suppliers/search": {
      content: [{ id: "supplier-1", name: "Coloplast GmbH " }],
    },
    "POST /apigateway/article-tenant/articles/article-1/supplier-assignments": {
      id: "assignment-1",
      articleId: "article-1",
      supplierId: "supplier-1",
      unitSell: "PIECE",
      purchasePriceActual: 0.5,
    },
    "POST /apigateway/wawi/order-proposals/search": [
      { content: [] },
      { content: [] },
    ],
    "POST /apigateway/wawi/order-proposals": readyProposal(),
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": { id: "order-1", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [{ id: "position-1", articleId: "article-1", quantity: 1, unit: "PIECE" }],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
  });

  const result = await runWawiOrderLifecycle(client, {
    scenario: "wawi-order-lifecycle",
    testCustomer: "Mustermann",
    testArticle: "Musterartikel",
    quantity: 1,
    allowArticleSetup: true,
  });

  assert.equal(result.status, "completed");
  assert.equal(result.generatedIds.orderId, "order-1");
  assert.equal(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals").orderQuantityUnit, "PIECE");
  assert.deepEqual(requestBody(client.calls, "POST", "/apigateway/article-tenant/articles/article-1/supplier-assignments"), [{
    purchasePrice: 0.5,
    unitSell: "PIECE",
    discount: null,
    computePurchasePriceActual: true,
    purchasePriceActual: 0.5,
    vatRateBuy: null,
    minimumBulkQuantity: null,
    unitBuy: null,
    unitSize: null,
    computeBulkPurchasePrice: true,
    base: "PURCHASE_PRICE",
    bulkPrices: [],
    id: null,
    articleId: "article-1",
    supplierId: "supplier-1",
    orderNr: null,
    mainSupplier: true,
    supplier: null,
    active: true,
    pricesActive: true,
    hasBulkPrices: false,
  }]);
});

test("runSalesProcessNoopSave saves only the selected Mustermann sales process and reads it back", async () => {
  const salesProcessDetail = {
    id: "sales-process-new",
    customerId: "customer-1",
    customerFirstName: "Max",
    customerLastName: "Mustermann",
    filialeId: "branch-new",
    active: true,
    salesPositionList: [],
  };
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [
        { id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-old", date: "2026-05-01T08:00:00.000Z", active: true },
        { id: "sales-process-new", customerId: "customer-1", customerLastName: "Mustermann", filialeId: "branch-new", date: "2026-06-01T08:00:00.000Z", active: true },
      ],
    },
    "GET /apigateway/sales/salesprocesses/sales-process-new": [salesProcessDetail, salesProcessDetail],
    "PUT /apigateway/sales/salesprocesses/sales-process-new": salesProcessDetail,
  });

  const result = await runSalesProcessNoopSave(client, {
    scenario: "sales-process-noop-save",
    testCustomer: "Mustermann",
    testArticle: "Musterartikel",
    generatedAt: new Date("2026-06-04T21:10:00.000Z"),
  });

  assert.equal(result.status, "completed");
  assert.equal(result.generatedIds.salesProcessId, "sales-process-new");
  assert.deepEqual(requestBody(client.calls, "PUT", "/apigateway/sales/salesprocesses/sales-process-new"), salesProcessDetail);
  assert.equal(client.calls.filter((call) => call.method === "PUT" && call.path === "/apigateway/sales/salesprocesses/sales-process-new").length, 1);
  assert.ok(callIndex(client.calls, "PUT", "/apigateway/sales/salesprocesses/sales-process-new") > callIndex(client.calls, "GET", "/apigateway/sales/salesprocesses/sales-process-new"));
});

test("runSalesProcessUiCreate starts a new sales process from the customer history and reads it back", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": [
      {
        content: [{ id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true }],
      },
      {
        content: [
          { id: "sales-process-new", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-05T08:00:00.000Z", active: true },
          { id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true },
        ],
      },
    ],
    "GET /apigateway/sales/salesprocesses/sales-process-new": {
      id: "sales-process-new",
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      filialeId: "branch-1",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [{ selector: "[data-x='new-sales-process']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" }],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.equal(result.generatedIds.salesProcessId, "sales-process-new");
  assert.equal(page.actions[0], "goto:https://api2.optica-omnia.de/master-data/customers/customer-1");
  assert.equal(page.actions[1], "click:[data-x='history']");
  assert.match(page.actions[2] || "", /^wait:\d+$/);
  assert.equal(page.actions[3], "click:[data-x='new-sales-process']");
});

test("runSalesProcessUiCreate resolves the approved customer via last-name fallback before UI write", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": [
      { content: [] },
      {
        content: [
          { id: "customer-1", firstName: "Max", lastName: "Mustermann" },
          { id: "customer-2", firstName: "Mara", lastName: "Musterfrau" },
        ],
      },
    ],
    "POST /apigateway/sales/salesprocesses/search": [
      {
        content: [{ id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true }],
      },
      {
        content: [
          { id: "sales-process-new", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-05T08:00:00.000Z", active: true },
          { id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true },
        ],
      },
    ],
    "GET /apigateway/sales/salesprocesses/sales-process-new": {
      id: "sales-process-new",
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      filialeId: "branch-1",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [{ selector: "[data-x='new-sales-process']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" }],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(
    client.calls
      .filter((call) => call.method === "GET" && call.path === "/apigateway/kunden/customers/search")
      .map((call) => call.query?.keywords),
    ["Max Mustermann", "Mustermann"],
  );
  assert.deepEqual(page.actions.slice(0, 2), [
    "goto:https://api2.optica-omnia.de/master-data/customers/customer-1",
    "click:[data-x='history']",
  ]);
});

test("runSalesProcessUiCreate resolves the approved customer via sales-process fallback before UI write", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": [
      { content: [] },
      { content: [] },
      { content: [] },
    ],
    "POST /apigateway/sales/salesprocesses/search": [
      {
        content: [
          { id: "sales-process-known-1", customerId: "customer-1", customerFirstName: "Max", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true },
          { id: "sales-process-known-2", customerId: "customer-1", customerFirstName: "Max", customerLastName: "Mustermann", date: "2026-06-02T08:00:00.000Z", active: true },
        ],
      },
      {
        content: [{ id: "sales-process-known-2", customerId: "customer-1", customerFirstName: "Max", customerLastName: "Mustermann", date: "2026-06-02T08:00:00.000Z", active: true }],
      },
      {
        content: [
          { id: "sales-process-new", customerId: "customer-1", customerFirstName: "Max", customerLastName: "Mustermann", date: "2026-06-05T08:00:00.000Z", active: true },
          { id: "sales-process-known-2", customerId: "customer-1", customerFirstName: "Max", customerLastName: "Mustermann", date: "2026-06-02T08:00:00.000Z", active: true },
        ],
      },
    ],
    "GET /apigateway/sales/salesprocesses/sales-process-new": {
      id: "sales-process-new",
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      filialeId: "branch-1",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [{ selector: "[data-x='new-sales-process']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" }],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.equal(page.actions[0], "goto:https://api2.optica-omnia.de/master-data/customers/customer-1");
  assert.equal(client.calls.filter((call) => call.method === "POST" && call.path === "/apigateway/sales/salesprocesses/search").length, 3);
});

test("runSalesProcessUiCreate waits for a delayed customer history tab before UI write", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": [
      { content: [{ id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true }] },
      {
        content: [
          { id: "sales-process-new", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-05T08:00:00.000Z", active: true },
          { id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true },
        ],
      },
    ],
    "GET /apigateway/sales/salesprocesses/sales-process-new": {
      id: "sales-process-new",
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [],
    [{ selector: "[data-x='sales-processes-tab']", role: "tab", text: "Vorgänge", currentPath: "/master-data/customers/customer-1" }],
    [{ selector: "[data-x='new-sales-process']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" }],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 1,
  });

  assert.equal(result.status, "completed");
  assert.equal(page.actions.includes("click:[data-x='sales-processes-tab']"), true);
});

test("runSalesProcessUiCreate matches icon-prefixed new sales-process actions", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": [
      { content: [{ id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true }] },
      {
        content: [
          { id: "sales-process-new", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-05T08:00:00.000Z", active: true },
          { id: "sales-process-old", customerId: "customer-1", customerLastName: "Mustermann", date: "2026-06-01T08:00:00.000Z", active: true },
        ],
      },
    ],
    "GET /apigateway/sales/salesprocesses/sales-process-new": {
      id: "sales-process-new",
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [{ selector: "[data-x='new-sales-process']", role: "button", text: "computer Neuer Vorgang", currentPath: "/master-data/customers/customer-1" }],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.equal(page.actions.includes("click:[data-x='new-sales-process']"), true);
});

test("runSalesProcessUiCreate saves the transaction draft only on the new-transaction route", async () => {
  const salesProcessId = "289eff6f-1aa9-4baa-a556-3d9bdb4b44f0";
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": [
      { content: [] },
      { content: [] },
    ],
    [`GET /apigateway/sales/salesprocesses/${salesProcessId}`]: {
      id: salesProcessId,
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [
      {
        selector: "[data-x='new-sales-process']",
        role: "button",
        text: "computer Neuer Vorgang",
        currentPath: "/master-data/customers/customer-1",
        nextUrl: "https://api2.optica-omnia.de/transactions/new",
      },
    ],
    [
      {
        selector: "[data-x='save-sales-process']",
        role: "button",
        text: "save Speichern & schließen",
        currentPath: "/transactions/new",
        nextUrl: `https://api2.optica-omnia.de/transactions/${salesProcessId}`,
      },
    ],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.equal(page.actions.includes("click:[data-x='save-sales-process']"), true);
  assert.equal(result.generatedIds.salesProcessId, salesProcessId);
});

test("runSalesProcessUiCreate uses the create response id when save returns to the transaction list", async () => {
  const salesProcessId = "289eff6f-1aa9-4baa-a556-3d9bdb4b44f0";
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": [
      { content: [] },
      { content: [] },
    ],
    [`GET /apigateway/sales/salesprocesses/${salesProcessId}`]: {
      id: salesProcessId,
      customerId: "customer-1",
      customerFirstName: "Max",
      customerLastName: "Mustermann",
      active: true,
      salesPositionList: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [
      {
        selector: "[data-x='new-sales-process']",
        role: "button",
        text: "computer Neuer Vorgang",
        currentPath: "/master-data/customers/customer-1",
        nextUrl: "https://api2.optica-omnia.de/transactions/new",
      },
    ],
    [
      {
        selector: "[data-x='save-sales-process']",
        role: "button",
        text: "save Speichern & schließen",
        currentPath: "/transactions/new",
        nextUrl: "https://api2.optica-omnia.de/transactions",
        response: {
          method: "POST",
          url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses",
          status: 201,
          body: {
            id: salesProcessId,
            customerId: "customer-1",
            customerFirstName: "Max",
            customerLastName: "Mustermann",
          },
        },
      },
    ],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.equal(page.actions.includes("click:[data-x='save-sales-process']"), true);
  assert.equal(result.generatedIds.salesProcessId, salesProcessId);
  assert.equal(callIndex(client.calls, "GET", `/apigateway/sales/salesprocesses/${salesProcessId}`) > -1, true);
});

test("runSalesProcessAddArticlePosition creates a guarded Vorgang and saves Musterartikel quantity five", async () => {
  const salesProcessId = "289eff6f-1aa9-4baa-a556-3d9bdb4b44f0";
  const materialPosition = {
    id: null,
    articleId: "article-1",
    articleNumber: "Musterartikel",
    articleDescription: "Musterartikel fuer Vorgangstest",
    amount: 5,
    unit: "PIECE",
    positionType: "ARTICLE",
    rowPosition: 0,
    orderProposalId: null,
  };
  const emptySalesProcess = {
    id: salesProcessId,
    salesProcessType: "SALES_PROCESS",
    customerId: "customer-1",
    customerFirstName: "Max",
    customerLastName: "Mustermann",
    filialeId: "branch-1",
    filialeIkNumber: "IK-1",
    date: "2026-06-07T10:00:00.000Z",
    active: true,
    zuzahlungsbefreit: false,
    preisermittlung: "HMV",
    salesPositionList: [],
    salesMaterialPositionList: [],
  };
  const calculatedSalesProcess = {
    ...emptySalesProcess,
    totalGross: 25,
    totalNet: 21.01,
    salesPositionList: [
      {
        id: null,
        articleId: "article-1",
        articleNumber: "Musterartikel",
        articleDescription: "Musterartikel fuer Vorgangstest",
        amount: 5,
        unit: "PIECE",
        positionType: "ARTICLE",
        rowPosition: 0,
      },
    ],
    salesMaterialPositionList: [materialPosition],
  };
  const savedSalesProcess = {
    ...calculatedSalesProcess,
    salesPositionList: [
      {
        ...calculatedSalesProcess.salesPositionList[0],
        id: "sales-position-1",
      },
    ],
    salesMaterialPositionList: [
      {
        ...materialPosition,
        id: "material-position-1",
      },
    ],
  };
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": [
      { content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }] },
      { content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }] },
      { content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }] },
    ],
    "POST /apigateway/sales/salesprocesses/search": [
      { content: [] },
      { content: [] },
      { content: [savedSalesProcess] },
    ],
    [`GET /apigateway/sales/salesprocesses/${salesProcessId}`]: [
      emptySalesProcess,
      emptySalesProcess,
      savedSalesProcess,
    ],
    "POST /apigateway/articletenantservice/articles/simple-search": {
      content: [{ id: "article-1", articleNumber: "Musterartikel", description: "Musterartikel fuer Vorgangstest", dataOrigin: "LOCAL", producerId: "producer-1" }],
    },
    "GET /apigateway/articletenantservice/articles/article-1": {
      id: "article-1",
      articleNumber: "Musterartikel",
      description: "Musterartikel fuer Vorgangstest",
      dataOrigin: "LOCAL",
      producerId: "producer-1",
      unit: "PIECE",
    },
    "GET /apigateway/article-tenant/articles/article-1/supplier-assignments": {
      content: [
        {
          id: "assignment-1",
          articleId: "article-1",
          supplierId: "supplier-1",
          unitSell: "PIECE",
          purchasePriceActual: 0.5,
          mainSupplier: true,
        },
      ],
    },
    "POST /apigateway/pricingservice/sales-positions": [
      {
        content: [
          {
            id: null,
            articleId: "article-1",
            articleNumber: "Musterartikel",
            articleDescription: "Musterartikel fuer Vorgangstest",
            articleDataOrigin: "LOCAL",
            amount: 1,
            unit: "PIECE",
            positionType: null,
            rowPosition: null,
            producerId: "producer-1",
          },
        ],
      },
    ],
    "POST /apigateway/sales/salesprocesses/calculate-prices": calculatedSalesProcess,
    [`PUT /apigateway/sales/salesprocesses/${salesProcessId}`]: savedSalesProcess,
    "POST /apigateway/wawi/order-proposals/search": [
      { content: [] },
      { content: [] },
    ],
    "POST /apigateway/wawi/order-proposals": {
      id: "proposal-1",
      customerId: "customer-1",
      salesProcessId,
      articleId: "article-1",
      articleDescription: "Musterartikel",
      supplierId: "supplier-1",
      orderQuantity: 5,
      orderQuantityUnit: "PIECE",
      orderValue: 0.5,
    },
    "POST /apigateway/wawi/order-proposals/to-order": { ok: true },
    "POST /apigateway/wawi/orders/from-proposal": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1": { id: "order-1", number: "5001", supplierId: "supplier-1" },
    "GET /apigateway/wawi/orders/order-1/positions": {
      content: [
        { id: "order-position-1", articleId: "article-1", description: "Musterartikel", quantity: 5, unit: "PIECE" },
      ],
    },
    "POST /apigateway/wawi/orders/order-1/process-order": { orderDocumentId: "document-1" },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [
      {
        selector: "[data-x='new-sales-process']",
        role: "button",
        text: "Neuer Vorgang",
        currentPath: "/master-data/customers/customer-1",
        nextUrl: "https://api2.optica-omnia.de/transactions/new",
      },
    ],
    [
      {
        selector: "[data-x='save-sales-process']",
        role: "button",
        text: "Speichern & schließen",
        currentPath: "/transactions/new",
        nextUrl: "https://api2.optica-omnia.de/transactions",
        response: {
          method: "POST",
          url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses",
          status: 201,
          body: {
            id: salesProcessId,
            customerId: "customer-1",
            customerFirstName: "Max",
            customerLastName: "Mustermann",
          },
        },
      },
    ],
  ]);

  const result = await runSalesProcessAddArticlePosition(client, {
    scenario: "sales-process-add-article-position",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    quantity: 5,
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "completed");
  assert.equal(result.generatedIds.salesProcessId, salesProcessId);
  assert.equal(result.generatedIds.salesPositionId, "sales-position-1");
  assert.equal(result.generatedIds.salesMaterialPositionId, "material-position-1");
  assert.equal(result.generatedIds.proposalId, "proposal-1");
  assert.equal(result.generatedIds.orderId, "order-1");
  assert.equal(requestBody(client.calls, "POST", "/apigateway/pricingservice/sales-positions")[0].amount, 5);
  const calculatedBody = requestBody(client.calls, "POST", "/apigateway/sales/salesprocesses/calculate-prices");
  assert.equal(calculatedBody.salesPositionList[0].amount, 5);
  assert.equal(calculatedBody.salesPositionList[0].positionType, "ARTICLE");
  assert.equal(calculatedBody.salesMaterialPositionList[0].amount, 5);
  assert.equal(calculatedBody.salesMaterialPositionList[0].articleId, "article-1");
  assert.deepEqual(requestBody(client.calls, "PUT", `/apigateway/sales/salesprocesses/${salesProcessId}`), calculatedSalesProcess);
  assert.equal(callIndex(client.calls, "PUT", `/apigateway/sales/salesprocesses/${salesProcessId}`) > callIndex(client.calls, "POST", "/apigateway/sales/salesprocesses/calculate-prices"), true);
  assert.equal(callIndex(client.calls, "POST", "/apigateway/wawi/order-proposals") > callIndex(client.calls, "PUT", `/apigateway/sales/salesprocesses/${salesProcessId}`), true);
  assert.equal(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals").salesProcessId, salesProcessId);
  assert.equal(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals").orderQuantity, 5);
  assert.deepEqual(requestBody(client.calls, "POST", "/apigateway/wawi/order-proposals/to-order"), {
    includeAll: false,
    selections: ["proposal-1"],
    filters: null,
  });
});

test("runSalesProcessUiCreate aborts before writing when the new sales-process button is not unique", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": {
      content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }],
    },
    "POST /apigateway/sales/salesprocesses/search": {
      content: [],
    },
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [
      { selector: "[data-x='new-sales-process-1']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" },
      { selector: "[data-x='new-sales-process-2']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" },
    ],
  ]);

  const result = await runSalesProcessUiCreate(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    baseUrl: "https://api2.optica-omnia.de",
    uiSettleMs: 0,
  });

  assert.equal(result.status, "aborted");
  assert.match(result.abortReason || "", /UI-Ziel nicht eindeutig/);
  assert.deepEqual(page.actions, [
    "goto:https://api2.optica-omnia.de/master-data/customers/customer-1",
    "click:[data-x='history']",
  ]);
});

test("runWriteLabScenario routes the guarded sales-process UI create scenario", async () => {
  const client = createFakeClient({
    "GET /apigateway/kunden/customers/search": { content: [{ id: "customer-1", firstName: "Max", lastName: "Mustermann" }] },
    "POST /apigateway/sales/salesprocesses/search": [{ content: [] }, { content: [] }],
  });
  const page = createFakeWriteUiPage([
    [{ selector: "[data-x='history']", role: "tab", text: "Historie", currentPath: "/master-data/customers/customer-1" }],
    [{ selector: "[data-x='new-sales-process']", role: "button", text: "Neuer Vorgang", currentPath: "/master-data/customers/customer-1" }],
  ]);

  const result = await runWriteLabScenario(client, {
    scenario: "sales-process-ui-create",
    testCustomer: "Max Mustermann",
    testArticle: "Musterartikel",
    page,
    uiSettleMs: 0,
  });

  assert.equal(result.scenario, "sales-process-ui-create");
  assert.equal(result.status, "aborted");
  assert.match(result.abortReason || "", /sales-process-create-not-observed/);
});

function readyProposal() {
  return {
    id: "proposal-1",
    customerId: "customer-1",
    articleId: "article-1",
    articleDescription: "Musterartikel",
    supplierId: "supplier-1",
    pzn: "12345678",
    quantity: 1,
    unit: "STK",
  };
}

function createFakeClient(responses: Record<string, unknown>) {
  const calls: Array<{ method: string; path: string; query?: Record<string, unknown>; body?: unknown }> = [];
  return {
    calls,
    async request(request: { method?: string; path: string; query?: Record<string, unknown>; body?: unknown }) {
      const normalized = { ...request, method: (request.method || "GET").toUpperCase() };
      calls.push(normalized);
      const key = `${normalized.method} ${normalized.path}`;
      const configured = responses[key];
      const response = Array.isArray(configured) ? configured.shift() : configured;
      if (response instanceof Error) throw response;
      if (response === undefined) throw new Error(`unexpected request ${key}`);
      return response;
    },
  };
}

function createFakeWriteUiPage(candidateSets: Array<Array<Record<string, unknown>>>) {
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const actions: string[] = [];
  const selectorNextUrls = new Map<string, string>();
  const selectorResponses = new Map<string, ReturnType<typeof createFakeResponse>>();
  const responses: ReturnType<typeof createFakeResponse>[] = [];
  const waiters: Array<{
    predicate: (response: ReturnType<typeof createFakeResponse>) => boolean;
    resolve: (response: ReturnType<typeof createFakeResponse>) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];
  const emitResponse = (response: ReturnType<typeof createFakeResponse>) => {
    responses.push(response);
    for (let index = waiters.length - 1; index >= 0; index -= 1) {
      const waiter = waiters[index];
      if (waiter.predicate(response)) {
        waiters.splice(index, 1);
        clearTimeout(waiter.timer);
        waiter.resolve(response);
      }
    }
  };
  return {
    actions,
    context: () => ({ route: async () => {}, unroute: async () => {} }),
    url: () => currentUrl,
    goto: async (url: string) => {
      actions.push(`goto:${url}`);
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async (ms: number) => {
      actions.push(`wait:${ms}`);
    },
    locator: (selector: string) => ({
      click: async () => {
        actions.push(`click:${selector}`);
        const nextUrl = selectorNextUrls.get(selector);
        if (nextUrl) currentUrl = nextUrl;
        const response = selectorResponses.get(selector);
        if (response) emitResponse(response);
      },
    }),
    waitForResponse: async (
      predicate: (response: ReturnType<typeof createFakeResponse>) => boolean,
      options: { timeout?: number } = {},
    ) => {
      const existing = responses.find((response) => predicate(response));
      if (existing) return existing;
      return new Promise<ReturnType<typeof createFakeResponse>>((resolve, reject) => {
        const waiter = {
          predicate,
          resolve,
          reject,
          timer: setTimeout(() => {}, Math.max(1, options.timeout ?? 1)),
        };
        waiter.timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error("waitForResponse timeout"));
        }, Math.max(1, options.timeout ?? 1));
        waiters.push(waiter);
      });
    },
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        const candidates = candidateSets.shift() || [];
        for (const candidate of candidates) {
          const selector = String(candidate.selector || "");
          const nextUrl = String(candidate.nextUrl || "");
          if (selector && nextUrl) selectorNextUrls.set(selector, nextUrl);
          if (selector && candidate.response && typeof candidate.response === "object") {
            selectorResponses.set(selector, createFakeResponse(candidate.response as Record<string, unknown>));
          }
        }
        return candidates;
      }
      return null;
    },
  };
}

function createFakeResponse(config: Record<string, unknown>) {
  const method = String(config.method || "GET");
  const url = String(config.url || "https://api2.optica-omnia.de/");
  const status = Number(config.status || 200);
  const body = config.body;
  return {
    url: () => url,
    status: () => status,
    request: () => ({ method: () => method }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function requestBody(
  calls: Array<{ method: string; path: string; body?: unknown }>,
  method: string,
  path: string,
): unknown {
  return calls.find((call) => call.method === method && call.path === path)?.body;
}

function callIndex(calls: Array<{ method: string; path: string }>, method: string, path: string): number {
  return calls.findIndex((call) => call.method === method && call.path === path);
}
