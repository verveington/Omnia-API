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

test("creates a mock Omnia order from a ready supplier group", async () => {
  const service = createProcurementService();
  const record = await service.getCase({ source: "mock" }, "proc-case-18581");

  const result = await service.createSupplierOrder({ source: "mock" }, record, "supplier-medcomplett");

  assert.equal(result.mode, "mock");
  assert.equal(result.order.supplierId, "supplier-medcomplett");
  assert.equal(result.order.supplierName, "MedComplett GmbH");
  assert.equal(result.order.caseNumber, "18581");
  assert.deepEqual(result.proposalIds, ["proposal-18581-1"]);
  assert.deepEqual(result.order.positions.map((position) => position.pzn), ["12345678"]);
});

test("blocks supplier order creation when a proposal is not ready", async () => {
  await withDemoProcurementSnapshot(async () => {
    demoData.procurementCases[1].proposals[0].pzn = "";
    demoData.articleDetailsById = {};

    const service = createProcurementService();
    const record = await service.getCase({ source: "mock" }, "proc-case-18542");

    await assert.rejects(
      () => service.createSupplierOrder({ source: "mock" }, record, "supplier-medcomplett"),
      (error) => {
        assert.equal(error.status, 422);
        assert.match(error.message, /Bestellung kann nicht erzeugt werden/);
        assert.deepEqual(error.details.map((detail) => detail.code), ["pzn_missing"]);
        return true;
      },
    );
  });
});

test("creates a live Omnia order with explicit supplier id and proposal selection", async () => {
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

  const result = await service.createSupplierOrder(
    { source: "live", omniaAccessToken: "token" },
    record,
    "supplier-medcomplett",
  );

  assert.equal(result.mode, "live");
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
});

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
