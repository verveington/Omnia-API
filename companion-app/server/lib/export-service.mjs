import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";

const CASE_COLUMNS = [
  { key: "supplierName", header: "Lieferant" },
  { key: "articleNumber", header: "Artikelnummer" },
  { key: "pzn", header: "PZN" },
  { key: "description", header: "Beschreibung" },
  { key: "quantity", header: "Menge" },
  { key: "unit", header: "Einheit" },
  { key: "value", header: "Wert" },
];

const SUPPLIER_COLUMNS = [
  { key: "commission", header: "Kommission" },
  { key: "caseNumber", header: "Vorgangsnummer" },
  { key: "articleNumber", header: "Artikelnummer" },
  { key: "pzn", header: "PZN" },
  { key: "description", header: "Beschreibung" },
  { key: "quantity", header: "Menge" },
  { key: "unit", header: "Einheit" },
  { key: "value", header: "Wert" },
];

export function createExportService() {
  async function createCaseExport(record, format) {
    if (format === "csv") {
      return createTextFile({
        body: stringifyRows(CASE_COLUMNS, record.proposals),
        fileName: `Vorgang_${record.number}.csv`,
        contentType: "text/csv; charset=utf-8",
      });
    }

    if (format === "xlsx") {
      return {
        body: await createCaseWorkbook(record),
        fileName: `Vorgang_${record.number}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }

    if (format === "pdf") {
      return {
        body: await createCasePdf(record),
        fileName: `Vorgang_${record.number}.pdf`,
        contentType: "application/pdf",
      };
    }

    throw unsupportedFormat();
  }

  async function createSupplierExport(supplierExport, format) {
    const safeSupplierName = safeName(supplierExport.supplier.supplierName);

    if (format === "csv") {
      return createTextFile({
        body: stringifyRows(SUPPLIER_COLUMNS, supplierExport.rows),
        fileName: `Bestellvorschlag_${supplierExport.caseNumber}_${safeSupplierName}.csv`,
        contentType: "text/csv; charset=utf-8",
      });
    }

    if (format === "xlsx") {
      return {
        body: await createSupplierWorkbook(supplierExport),
        fileName: `Bestellvorschlag_${supplierExport.caseNumber}_${safeSupplierName}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }

    if (format === "pdf") {
      return {
        body: await createSupplierPdf(supplierExport),
        fileName: `Bestellvorschlag_${supplierExport.caseNumber}_${safeSupplierName}.pdf`,
        contentType: "application/pdf",
      };
    }

    throw unsupportedFormat();
  }

  return {
    createCaseExport,
    createSupplierExport,
  };
}

export function attachmentHeaders(file) {
  return {
    "content-type": file.contentType,
    "content-disposition": `attachment; filename="${file.fileName}"`,
  };
}

function createTextFile({ body, fileName, contentType }) {
  return {
    body: Buffer.from(body, "utf8"),
    fileName,
    contentType,
  };
}

function stringifyRows(columns, rows) {
  return stringify(rows, {
    header: true,
    delimiter: ";",
    bom: true,
    columns: Object.fromEntries(columns.map((column) => [column.key, column.header])),
  });
}

async function createCaseWorkbook(record) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Omnia Companion";

  const caseSheet = workbook.addWorksheet("Vorgang");
  caseSheet.addRows([
    ["Vorgangsnummer", record.number],
    ["Status", record.status],
    ["Kunde", record.customer.displayName],
    ["Kundennummer", record.customer.customerNumber],
    ["Lieferadresse", formatAddress(record.deliveryAddress)],
  ]);
  caseSheet.columns = [{ width: 22 }, { width: 54 }];

  const proposalsSheet = workbook.addWorksheet("Bestellvorschläge");
  addTable(proposalsSheet, CASE_COLUMNS, record.proposals);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function createSupplierWorkbook(supplierExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Omnia Companion";
  const sheet = workbook.addWorksheet(supplierExport.supplier.supplierName.slice(0, 31));
  addTable(sheet, SUPPLIER_COLUMNS, supplierExport.rows);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function createCasePdf(record) {
  return createPdf((doc) => {
    doc.fontSize(16).text(`Vorgang ${record.number}`, { underline: true });
    doc.moveDown(0.6);
    doc.fontSize(10).text(`Kunde: ${record.customer.displayName}`);
    doc.text(`Lieferadresse: ${formatAddress(record.deliveryAddress)}`);
    doc.moveDown();
    writeRows(doc, CASE_COLUMNS, record.proposals);
  });
}

async function createSupplierPdf(supplierExport) {
  return createPdf((doc) => {
    doc.fontSize(16).text(`Bestellvorschlag ${supplierExport.supplier.supplierName}`, { underline: true });
    doc.moveDown(0.6);
    doc.fontSize(10).text(`Vorgang: ${supplierExport.caseNumber}`);
    doc.moveDown();
    writeRows(doc, SUPPLIER_COLUMNS, supplierExport.rows);
  });
}

function createPdf(write) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    write(doc);
    doc.end();
  });
}

function addTable(sheet, columns, rows) {
  sheet.columns = columns.map((column) => ({ header: column.header, key: column.key, width: column.key === "description" ? 38 : 18 }));
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
}

function writeRows(doc, columns, rows) {
  const headers = columns.map((column) => column.header).join(" | ");
  doc.fontSize(8).text(headers);
  doc.moveDown(0.4);
  for (const row of rows) {
    doc.text(columns.map((column) => row[column.key]).join(" | "));
  }
}

function formatAddress(address) {
  return `${address.street} ${address.houseNumber}, ${address.zipCode} ${address.city}, ${address.country}`;
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

function unsupportedFormat() {
  const error = new Error("Unsupported export format");
  error.status = 400;
  return error;
}
