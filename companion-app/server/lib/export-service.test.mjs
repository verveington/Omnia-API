import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { createExportService } from "./export-service.mjs";
import { createProcurementService } from "./procurement-service.mjs";

test("creates semicolon separated supplier CSV without full customer details", async () => {
  const procurement = createProcurementService();
  const exports = createExportService();
  const record = await procurement.getCase({ source: "mock" }, "proc-case-18581");
  const supplierExport = procurement.getSupplierExport(record, "supplier-medcomplett");

  const file = await exports.createSupplierExport(supplierExport, "csv");
  const csv = file.body.toString("utf8");

  assert.equal(file.contentType, "text/csv; charset=utf-8");
  assert.match(file.fileName, /MedComplett_GmbH/);
  assert.match(csv.split("\n")[0], /Kommission;Vorgangsnummer;Artikelnummer;PZN;Beschreibung;Menge;Einheit/);
  assert.equal(csv.split("\n")[0].includes("Wert"), false);
  assert.equal(csv.includes("92,50 EUR"), false);
  assert.match(csv, /Mustermann;18581;ART-10001;12345678/);
  assert.equal(csv.includes("Max Mustermann"), false);
  assert.equal(csv.includes("1980"), false);
  assert.equal(csv.includes("A123"), false);
});

test("creates xlsx and pdf exports with download metadata and no price columns", async () => {
  const procurement = createProcurementService();
  const exports = createExportService();
  const record = await procurement.getCase({ source: "mock" }, "proc-case-18581");

  const xlsx = await exports.createCaseExport(record, "xlsx");
  const pdf = await exports.createCaseExport(record, "pdf");

  assert.equal(xlsx.contentType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(pdf.contentType, "application/pdf");
  assert.match(xlsx.fileName, /Vorgang_18581\.xlsx$/);
  assert.match(pdf.fileName, /Vorgang_18581\.pdf$/);
  assert.ok(Buffer.isBuffer(xlsx.body));
  assert.ok(Buffer.isBuffer(pdf.body));
  assert.ok(xlsx.body.length > 100);
  assert.ok(pdf.body.length > 100);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(xlsx.body);
  const proposalsSheet = workbook.getWorksheet("Bestellvorschläge");
  const headers = proposalsSheet.getRow(1).values.filter(Boolean);
  assert.deepEqual(headers, ["Lieferant", "Artikelnummer", "PZN", "Beschreibung", "Menge", "Einheit"]);
});
