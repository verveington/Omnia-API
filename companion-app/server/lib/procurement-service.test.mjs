import assert from "node:assert/strict";
import { test } from "node:test";
import { demoData } from "./demo-data.mjs";
import { createProcurementService } from "./procurement-service.mjs";

test("builds procurement cases with customer, delivery address, proposals and supplier groups", async () => {
  const service = createProcurementService();

  const cases = await service.listCases({ source: "mock" });
  const record = await service.getCase({ source: "mock" }, cases[0].id);

  assert.equal(record.number, "18581");
  assert.equal(record.customer.lastName, "Mustermann");
  assert.equal(record.deliveryAddress.city, "Musterstadt");
  assert.ok(record.proposals.length >= 2);
  assert.deepEqual(
    record.supplierGroups.map((group) => group.supplierName),
    ["MedComplett GmbH", "Orthomed Lieferant"],
  );
  assert.deepEqual(
    record.proposals.map((proposal) => proposal.pzn),
    ["12345678", "87654321"],
  );
});

test("returns supplier export data with last name commission and without sensitive customer data", async () => {
  const service = createProcurementService();
  const record = await service.getCase({ source: "mock" }, "proc-case-18581");
  const supplierExport = service.getSupplierExport(record, "supplier-medcomplett");

  assert.equal(supplierExport.supplier.supplierName, "MedComplett GmbH");
  assert.equal(supplierExport.rows[0].commission, "Mustermann");
  assert.equal("dateOfBirth" in supplierExport.rows[0], false);
  assert.equal("insuranceNumber" in supplierExport.rows[0], false);
  assert.equal(supplierExport.rows[0].articleNumber, "ART-10001");
  assert.equal(supplierExport.rows[0].pzn, "12345678");
});

test("enriches missing proposal PZN from article details before supplier export", async () => {
  await withDemoProcurementSnapshot(async () => {
    demoData.procurementCases[0].proposals[0].pzn = "";
    demoData.articleDetailsById = {
      "article-10001": {
        pzn: "99887766",
      },
    };

    const service = createProcurementService();
    const record = await service.getCase({ source: "mock" }, "proc-case-18581");
    const proposal = record.proposals.find((item) => item.id === "proposal-18581-1");
    const supplierExport = service.getSupplierExport(record, "supplier-medcomplett");

    assert.equal(proposal.pzn, "99887766");
    assert.equal(proposal.pznEnrichmentStatus, "enriched");
    assert.equal(proposal.procurementReadiness, "ready_to_order");
    assert.equal(supplierExport.rows[0].pzn, "99887766");
  });
});

test("keeps proposals exportable and marks readiness when PZN cannot be resolved", async () => {
  await withDemoProcurementSnapshot(async () => {
    demoData.procurementCases[0].proposals[0].pzn = "";
    demoData.articleDetailsById = {};

    const service = createProcurementService();
    const record = await service.getCase({ source: "mock" }, "proc-case-18581");
    const proposal = record.proposals.find((item) => item.id === "proposal-18581-1");
    const supplierExport = service.getSupplierExport(record, "supplier-medcomplett");

    assert.equal(proposal.pzn, "");
    assert.equal(proposal.pznEnrichmentStatus, "missing");
    assert.equal(proposal.procurementReadiness, "pzn_missing");
    assert.equal(supplierExport.rows[0].pzn, "");
    assert.equal(supplierExport.rows[0].procurementReadiness, "pzn_missing");
  });
});

test("creates a mock Omnia order draft from a ready supplier group", async () => {
  const service = createProcurementService();
  const record = await service.getCase({ source: "mock" }, "proc-case-18581");

  const result = await service.createSupplierOrderDraft({ source: "mock" }, record, "supplier-medcomplett");

  assert.equal(result.mode, "mock");
  assert.equal(result.stage, "draft");
  assert.equal(result.processed, false);
  assert.equal(result.order.supplierId, "supplier-medcomplett");
  assert.equal(result.order.supplierName, "MedComplett GmbH");
  assert.equal(result.order.caseNumber, "18581");
  assert.equal(result.order.state, "draft_created");
  assert.deepEqual(result.proposalIds, ["proposal-18581-1"]);
  assert.deepEqual(result.order.positions.map((position) => position.pzn), ["12345678"]);
});

test("blocks supplier order draft creation when a proposal is not ready", async () => {
  await withDemoProcurementSnapshot(async () => {
    demoData.procurementCases[1].proposals[0].pzn = "";
    demoData.articleDetailsById = {};

    const service = createProcurementService();
    const record = await service.getCase({ source: "mock" }, "proc-case-18542");

    await assert.rejects(
      () => service.createSupplierOrderDraft({ source: "mock" }, record, "supplier-medcomplett"),
      (error) => {
        assert.equal(error.status, 422);
        assert.equal(error.code, "ORDER_DRAFT_VALIDATION_FAILED");
        assert.match(error.message, /Bestellentwurf kann nicht erzeugt werden/);
        assert.deepEqual(error.details.map((detail) => detail.code), ["pzn_missing"]);
        return true;
      },
    );
  });
});

test("rejects live procurement case access without token and does not return demo cases", async () => {
  const service = createProcurementService({
    omniaClient: {
      request() {
        throw new Error("live Omnia must not be called without a token");
      },
    },
  });

  await assert.rejects(() => service.listCases({ source: "live" }), liveSessionMissingToken);
  await assert.rejects(() => service.getCase({ source: "live" }, "proc-case-18581"), liveSessionMissingToken);
});

test("does not use demo article details for a live session without token", async () => {
  await withDemoProcurementSnapshot(async () => {
    demoData.procurementCases[0].proposals[0].pzn = "";
    demoData.articleDetailsById = {
      "article-10001": {
        pzn: "DEMO-PZN-MUST-NOT-LEAK",
      },
    };
    const service = createProcurementService({
      omniaClient: {
        request() {
          throw new Error("live Omnia must not be called without a token");
        },
      },
    });

    await assert.rejects(() => service.getCase({ source: "live" }, "proc-case-18581"), liveSessionMissingToken);
  });
});

test("rejects live procurement case access without Omnia client and does not return demo cases", async () => {
  const service = createProcurementService();

  await assert.rejects(() => service.listCases(liveSession()), liveClientUnavailable);
  await assert.rejects(() => service.getCase(liveSession(), "proc-case-18581"), liveClientUnavailable);
});

test("keeps explicit demo mode backed by demo procurement data", async () => {
  const service = createProcurementService();

  const cases = await service.listCases({ source: "mock" });

  assert.equal(cases[0].id, "proc-case-18581");
  assert.equal(cases[0].proposals[0].pzn, "12345678");
});

test("builds live procurement cases from documented proposal, sales process and article endpoints", async () => {
  const calls = [];
  const service = createProcurementService({
    omniaClient: {
      async request(_session, request) {
        calls.push(request);
        if (request.path === "/apigateway/wawi/order-proposals/search") {
          return {
            content: [
              {
                id: "proposal-live-1",
                salesProcessId: "sp-live-1",
                salesProcessNumber: "9001",
                customerId: "customer-live-1",
                customerFirstName: "Mira",
                customerLastName: "Live",
                customerName: "Mira Live",
                supplierId: "supplier-a",
                supplierName: "Supplier A",
                articleId: "article-live-1",
                articleNumber: "",
                articleDescription: "",
                orderQuantity: 2,
                orderQuantityUnit: "Packung",
                orderValue: 13.5,
              },
              {
                id: "proposal-live-2",
                salesProcessId: "sp-live-1",
                salesProcessNumber: "9001",
                customerId: "customer-live-1",
                customerFirstName: "Mira",
                customerLastName: "Live",
                customerName: "Mira Live",
                supplierId: "supplier-b",
                supplierName: "Supplier B",
                articleId: "article-live-2",
                articleNumber: "ART-2",
                pzn: "44556677",
                articleDescription: "Artikel mit PZN",
                orderQuantity: 1,
                orderQuantityUnit: "Stueck",
                orderValue: "7,25 EUR",
              },
            ],
          };
        }
        if (request.path === "/apigateway/sales/salesprocesses/sp-live-1") {
          return {
            id: "sp-live-1",
            number: "9001",
            status: { description: "Bestellvorschlag" },
            customerId: "customer-live-1",
            customerFirstName: "Mira",
            customerLastName: "Live",
            customerName: "Mira Live",
            customerNumber: "K-9001",
            deliveryAddressStreet: "Liveweg",
            deliveryAddressHouseNumber: "8",
            deliveryAddressZipCode: "10115",
            deliveryAddressCity: "Berlin",
            deliveryAddressCountryName: "DE",
          };
        }
        if (request.path === "/apigateway/article-tenant/articles/article-live-1") {
          return {
            pzn: "11223344",
            articleNumber: "ART-1",
            description: "Live Artikel",
          };
        }
        throw new Error(`unexpected path ${request.path}`);
      },
    },
  });

  const cases = await service.listCases(liveSession());
  const record = cases[0];

  assert.equal(record.id, "sp-live-1");
  assert.equal(record.number, "9001");
  assert.equal(record.status, "Bestellvorschlag");
  assert.equal(record.customer.customerNumber, "K-9001");
  assert.equal(record.deliveryAddress.city, "Berlin");
  assert.equal(record.proposals[0].articleNumber, "ART-1");
  assert.equal(record.proposals[0].description, "Live Artikel");
  assert.equal(record.proposals[0].pzn, "11223344");
  assert.equal(record.proposals[0].pznEnrichmentStatus, "enriched");
  assert.equal(record.proposals[0].procurementReadiness, "ready_to_order");
  assert.deepEqual(
    record.supplierGroups.map((group) => group.supplierName),
    ["Supplier A", "Supplier B"],
  );
  assert.deepEqual(calls[0], {
    method: "POST",
    path: "/apigateway/wawi/order-proposals/search",
    query: { page: 0, size: 25, sort: "supplierName,asc" },
    body: { keywords: "", active: true },
  });
  assert.deepEqual(
    calls.map((call) => [call.method, call.path]),
    [
      ["POST", "/apigateway/wawi/order-proposals/search"],
      ["GET", "/apigateway/sales/salesprocesses/sp-live-1"],
      ["GET", "/apigateway/article-tenant/articles/article-live-1"],
    ],
  );
});

test("marks missing gateway status explicitly instead of claiming a proposal status", async () => {
  const service = createProcurementService({
    omniaClient: createLiveProcurementClient({
      proposals: [
        {
          id: "proposal-missing-status",
          salesProcessId: "sp-missing-status",
          salesProcessNumber: "9300",
          customerId: "customer-missing-status",
          customerName: "Status Kunde",
          supplierId: "supplier-status",
          supplierName: "Supplier Status",
          articleId: "article-status",
          articleNumber: "ART-S",
          pzn: "10000001",
          articleDescription: "Status Artikel",
          orderQuantity: 1,
          orderQuantityUnit: "Packung",
          orderValue: 5,
        },
      ],
      salesProcesses: {
        "sp-missing-status": { id: "sp-missing-status", number: "9300" },
      },
    }),
  });

  const [record] = await service.listCases(liveSession());

  assert.equal(record.status, "missing_status");
});

test("getCase for UUID loads the sales process first and searches proposals by documented process number", async () => {
  const calls = [];
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const service = createProcurementService({
    omniaClient: {
      async request(_session, request) {
        calls.push(request);
        if (request.path === `/apigateway/sales/salesprocesses/${uuid}`) {
          return { id: uuid, number: "9100", status: { description: "Live Status" } };
        }
        if (request.path === "/apigateway/wawi/order-proposals/search") {
          return {
            content: [
              {
                id: "proposal-live-detail",
                salesProcessId: uuid,
                salesProcessNumber: "9100",
                customerId: "customer-live-detail",
                customerName: "Detail Kunde",
                supplierId: "supplier-detail",
                supplierName: "Supplier Detail",
                articleId: "article-live-detail",
                articleNumber: "ART-D",
                pzn: "12344321",
                articleDescription: "Detail Artikel",
                orderQuantity: 1,
                orderQuantityUnit: "Packung",
                orderValue: 5,
              },
            ],
          };
        }
        throw new Error(`unexpected path ${request.path}`);
      },
    },
  });

  const record = await service.getCase(liveSession(), uuid);

  assert.equal(record.id, uuid);
  assert.equal(record.status, "Live Status");
  assert.equal(record.proposals[0].id, "proposal-live-detail");
  assert.deepEqual(calls[0], { method: "GET", path: `/apigateway/sales/salesprocesses/${uuid}` });
  assert.equal(calls[1].path, "/apigateway/wawi/order-proposals/search");
  assert.deepEqual(calls[1].body, { keywords: "9100", active: true });
  assert.notEqual(calls[1].body.keywords, uuid);
});

test("getCase keeps documented keyword search for non-UUID case ids", async () => {
  const calls = [];
  const service = createProcurementService({
    omniaClient: {
      async request(_session, request) {
        calls.push(request);
        if (request.path === "/apigateway/wawi/order-proposals/search") {
          return {
            content: [
              {
                id: "proposal-live-keyword",
                salesProcessId: "sp-live-keyword",
                salesProcessNumber: "9100",
                customerId: "customer-live-keyword",
                customerName: "Keyword Kunde",
                supplierId: "supplier-a",
                supplierName: "Supplier A",
                articleId: "article-keyword",
                articleNumber: "ART-K",
                pzn: "12344321",
                articleDescription: "Keyword Artikel",
                orderQuantity: 1,
                orderQuantityUnit: "Packung",
                orderValue: 5,
              },
            ],
          };
        }
        if (request.path === "/apigateway/sales/salesprocesses/sp-live-keyword") {
          return { number: "9100", status: { description: "Live Status" } };
        }
        throw new Error(`unexpected path ${request.path}`);
      },
    },
  });

  const record = await service.getCase(liveSession(), "9100");

  assert.equal(record.id, "sp-live-keyword");
  assert.deepEqual(calls[0].body, { keywords: "9100", active: true });
});

test("sales process lookup failure for UUID detail does not fall back to demo data", async () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174001";
  const service = createProcurementService({
    omniaClient: {
      async request(_session, request) {
        if (request.path === `/apigateway/sales/salesprocesses/${uuid}`) throw notFoundError();
        throw new Error(`unexpected path ${request.path}`);
      },
    },
  });

  await assert.rejects(() => service.getCase(liveSession(), uuid), (error) => {
    assert.equal(error.status, 404);
    assert.notEqual(error.code, "LIVE_SOURCE_NOT_CONFIGURED");
    return true;
  });
});

test("article 404 marks only the affected live proposal as missing PZN", async () => {
  const service = createProcurementService({
    omniaClient: createLiveProcurementClient({
      proposals: [
        liveProposal({ id: "proposal-404", articleId: "article-404", articleNumber: "ART-404", pzn: "" }),
        liveProposal({
          id: "proposal-ready",
          articleId: "article-ready",
          articleNumber: "ART-READY",
          pzn: "20000002",
          supplierId: "supplier-b",
          supplierName: "Supplier B",
        }),
      ],
      articleHandlers: {
        "article-404": () => {
          throw notFoundError();
        },
      },
    }),
  });

  const [record] = await service.listCases(liveSession());
  const missing = record.proposals.find((proposal) => proposal.id === "proposal-404");
  const ready = record.proposals.find((proposal) => proposal.id === "proposal-ready");

  assert.equal(record.proposals.length, 2);
  assert.equal(missing.pzn, "");
  assert.equal(missing.pznEnrichmentStatus, "missing");
  assert.equal(missing.procurementReadiness, "pzn_missing");
  assert.equal(ready.procurementReadiness, "ready_to_order");
});

test("article auth, gateway and timeout failures are visible live lookup errors", async () => {
  const scenarios = [
    { articleId: "article-401", category: "auth", error: gatewayError(401, "AUTH_REQUIRED") },
    { articleId: "article-403", category: "auth", error: gatewayError(403, "PERMISSION_DENIED") },
    { articleId: "article-500", category: "gateway", error: gatewayError(500, "OMNIA_INTERNAL_ERROR") },
    { articleId: "article-timeout", category: "timeout", error: gatewayError(504, "GATEWAY_TIMEOUT") },
  ];

  for (const scenario of scenarios) {
    const service = createProcurementService({
      omniaClient: createLiveProcurementClient({
        proposals: [liveProposal({ id: `proposal-${scenario.articleId}`, articleId: scenario.articleId, pzn: "" })],
        articleHandlers: {
          [scenario.articleId]: () => {
            throw scenario.error;
          },
        },
      }),
    });

    const [record] = await service.listCases(liveSession());
    const [proposal] = record.proposals;

    assert.equal(proposal.pzn, "");
    assert.equal(proposal.pznEnrichmentStatus, "live_lookup_error");
    assert.equal(proposal.procurementReadiness, "live_lookup_error");
    assert.equal(proposal.liveLookupError?.category, scenario.category);
    assert.equal(proposal.liveLookupError?.code, "LIVE_LOOKUP_ERROR");
  }
});

test("live article hydration does not reuse cached demo article details", async () => {
  const calls = [];
  const service = createProcurementService({
    omniaClient: {
      async request(_session, request) {
        calls.push(request);
        if (request.path === "/apigateway/wawi/order-proposals/search") {
          return {
            content: [
              liveProposal({
                id: "proposal-live-cache",
                salesProcessId: "sp-live-cache",
                articleId: "article-10001",
                articleNumber: "",
                pzn: "",
              }),
            ],
          };
        }
        if (request.path === "/apigateway/sales/salesprocesses/sp-live-cache") {
          return { id: "sp-live-cache", number: "9600", status: { description: "Live Status" } };
        }
        if (request.path === "/apigateway/article-tenant/articles/article-10001") {
          return { pzn: "LIVE-PZN-10001", articleNumber: "LIVE-ART-10001", description: "Live Artikel 10001" };
        }
        throw new Error(`unexpected path ${request.path}`);
      },
    },
  });

  await service.getCase({ source: "mock" }, "proc-case-18581");
  const [record] = await service.listCases(liveSession());

  assert.equal(record.proposals[0].pzn, "LIVE-PZN-10001");
  assert.equal(calls.some((call) => call.path === "/apigateway/article-tenant/articles/article-10001"), true);
});

test("groups live proposals by salesProcessId", async () => {
  const service = createProcurementService({
    omniaClient: createLiveProcurementClient({
      proposals: [
        liveProposal({ id: "proposal-a", salesProcessId: "sp-grouped", supplierId: "supplier-a", supplierName: "Supplier A" }),
        liveProposal({ id: "proposal-b", salesProcessId: "sp-grouped", supplierId: "supplier-b", supplierName: "Supplier B" }),
      ],
      salesProcesses: {
        "sp-grouped": { id: "sp-grouped", number: "9400", status: { description: "Gruppiert" } },
      },
    }),
  });

  const cases = await service.listCases(liveSession());

  assert.equal(cases.length, 1);
  assert.deepEqual(
    cases[0].proposals.map((proposal) => proposal.id),
    ["proposal-a", "proposal-b"],
  );
});

test("groups live proposals by salesProcessNumber when salesProcessId is missing", async () => {
  const service = createProcurementService({
    omniaClient: createLiveProcurementClient({
      proposals: [
        liveProposal({ id: "proposal-number-a", salesProcessId: "", salesProcessNumber: "9500" }),
        liveProposal({ id: "proposal-number-b", salesProcessId: "", salesProcessNumber: "9500" }),
      ],
    }),
  });

  const cases = await service.listCases(liveSession());

  assert.equal(cases.length, 1);
  assert.equal(cases[0].number, "9500");
  assert.equal(cases[0].aggregationState, "complete");
});

test("does not group live proposals by customerId when sales process reference is missing", async () => {
  const service = createProcurementService({
    omniaClient: createLiveProcurementClient({
      proposals: [
        liveProposal({ id: "proposal-no-ref-a", salesProcessId: "", salesProcessNumber: "", customerId: "same-customer" }),
        liveProposal({ id: "proposal-no-ref-b", salesProcessId: "", salesProcessNumber: "", customerId: "same-customer" }),
      ],
    }),
  });

  const cases = await service.listCases(liveSession());

  assert.equal(cases.length, 2);
  assert.deepEqual(
    cases.map((record) => record.proposals[0].id),
    ["proposal-no-ref-a", "proposal-no-ref-b"],
  );
  assert.deepEqual(
    cases.map((record) => record.aggregationState),
    ["missing_sales_process_reference", "missing_sales_process_reference"],
  );
});

test("creates a live Omnia order draft with explicit supplier id and proposal selection", async () => {
  const calls = [];
  const service = createProcurementService({
    omniaClient: {
      async request(_session, request) {
        calls.push(request);
        if (request.path === "/apigateway/wawi/order-proposals/to-order") {
          return { ok: true };
        }
        if (request.path === "/apigateway/wawi/orders/from-proposal") {
          return { id: "order-live-1", number: "5001", supplierId: "supplier-medcomplett" };
        }
        if (request.path === "/apigateway/wawi/orders/order-live-1") {
          return { id: "order-live-1", number: "5001", supplierName: "MedComplett GmbH" };
        }
        if (request.path === "/apigateway/wawi/orders/order-live-1/positions") {
          return [{ id: "pos-1", articleNumber: "ART-10001", pzn: "12345678", quantity: 5, unit: "Packung" }];
        }
        throw new Error(`unexpected path ${request.path}`);
      },
    },
  });
  const record = await service.getCase({ source: "mock" }, "proc-case-18581");

  const result = await service.createSupplierOrderDraft(
    { source: "live", omniaAccessToken: "token" },
    record,
    "supplier-medcomplett",
  );

  assert.equal(result.mode, "live");
  assert.equal(result.stage, "draft");
  assert.equal(result.processed, false);
  assert.equal(result.order.number, "5001");
  assert.deepEqual(
    calls.map((call) => [call.method, call.path]),
    [
      ["POST", "/apigateway/wawi/order-proposals/to-order"],
      ["POST", "/apigateway/wawi/orders/from-proposal"],
      ["GET", "/apigateway/wawi/orders/order-live-1"],
      ["GET", "/apigateway/wawi/orders/order-live-1/positions"],
    ],
  );
  assert.deepEqual(calls[1].body, {
    proposals: {
      includeAll: false,
      selections: ["proposal-18581-1"],
      filters: null,
    },
    supplierId: "supplier-medcomplett",
  });
  assert.equal(calls.some((call) => call.path.includes("/process-order")), false);
});

function liveSessionMissingToken(error) {
  assert.equal(error.status, 501);
  assert.equal(error.code, "LIVE_SESSION_MISSING_TOKEN");
  assert.equal(error.retryable, false);
  assert.match(error.message, /Token/);
  return true;
}

function liveClientUnavailable(error) {
  assert.equal(error.status, 501);
  assert.equal(error.code, "LIVE_CLIENT_UNAVAILABLE");
  assert.equal(error.retryable, false);
  assert.match(error.message, /Omnia-Client/);
  return true;
}

function liveSession() {
  return {
    source: "live",
    omniaAccessToken: "token",
    user: { username: "live-user", displayName: "Live User" },
    workspace: "Live Workspace",
  };
}

function notFoundError() {
  const error = new Error("not found");
  error.status = 404;
  return error;
}

function gatewayError(status, code) {
  const error = new Error(`${code} from Omnia`);
  error.status = status;
  error.code = code;
  error.retryable = status >= 500;
  return error;
}

function liveProposal(overrides = {}) {
  return {
    id: "proposal-live-default",
    salesProcessId: "sp-live-default",
    salesProcessNumber: "9001",
    customerId: "customer-live-default",
    customerFirstName: "Mira",
    customerLastName: "Live",
    customerName: "Mira Live",
    supplierId: "supplier-a",
    supplierName: "Supplier A",
    articleId: "article-live-default",
    articleNumber: "ART-LIVE",
    pzn: "10000000",
    articleDescription: "Live Artikel",
    orderQuantity: 1,
    orderQuantityUnit: "Packung",
    orderValue: 5,
    ...overrides,
  };
}

function createLiveProcurementClient({ proposals, salesProcesses = {}, articleHandlers = {} }) {
  return {
    async request(_session, request) {
      if (request.path === "/apigateway/wawi/order-proposals/search") {
        return { content: proposals };
      }

      const salesProcessMatch = request.path.match(/^\/apigateway\/sales\/salesprocesses\/(.+)$/);
      if (salesProcessMatch) {
        const salesProcessId = decodeURIComponent(salesProcessMatch[1]);
        return salesProcesses[salesProcessId] || {
          id: salesProcessId,
          number: proposals.find((proposal) => proposal.salesProcessId === salesProcessId)?.salesProcessNumber || "",
          status: { description: "Live Status" },
        };
      }

      const articleMatch = request.path.match(/^\/apigateway\/article-tenant\/articles\/(.+)$/);
      if (articleMatch) {
        const articleId = decodeURIComponent(articleMatch[1]);
        if (articleHandlers[articleId]) return articleHandlers[articleId](request);
        return {
          pzn: `PZN-${articleId}`,
          articleNumber: `ART-${articleId}`,
          description: `Artikel ${articleId}`,
        };
      }

      const fallbackArticleMatch = request.path.match(/^\/apigateway\/articletenantservice\/articles\/(.+)$/);
      if (fallbackArticleMatch) throw notFoundError();

      throw new Error(`unexpected path ${request.path}`);
    },
  };
}

async function withDemoProcurementSnapshot(run) {
  const procurementCases = structuredClone(demoData.procurementCases);
  const articleDetailsById = structuredClone(demoData.articleDetailsById ?? {});
  try {
    await run();
  } finally {
    demoData.procurementCases = procurementCases;
    demoData.articleDetailsById = articleDetailsById;
  }
}
