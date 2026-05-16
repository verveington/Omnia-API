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
