import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";

const CASE_COLUMNS = [
  { key: "supplierName", header: "Lieferant", pdfWidth: 128 },
  { key: "articleNumber", header: "Artikelnummer", pdfWidth: 96 },
  { key: "pzn", header: "PZN", pdfWidth: 82 },
  { key: "description", header: "Beschreibung", pdfWidth: 340 },
  { key: "quantity", header: "Menge", pdfWidth: 58, align: "right" },
  { key: "unit", header: "Einheit", pdfWidth: 58 },
];

const SUPPLIER_COLUMNS = [
  { key: "commission", header: "Kommission", pdfWidth: 88 },
  { key: "caseNumber", header: "Vorgangsnummer", pdfHeader: "Vorgang", pdfWidth: 76 },
  { key: "articleNumber", header: "Artikelnummer", pdfWidth: 96 },
  { key: "pzn", header: "PZN", pdfWidth: 82 },
  { key: "description", header: "Beschreibung", pdfWidth: 340 },
  { key: "quantity", header: "Menge", pdfWidth: 58, align: "right" },
  { key: "unit", header: "Einheit", pdfWidth: 58 },
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
    writeDocumentHeader(doc, `Vorgang ${record.number}`, [
      ["Kunde", record.customer.displayName],
      ["Kundennummer", record.customer.customerNumber],
      ["Lieferadresse", formatAddress(record.deliveryAddress)],
    ]);
    writeRows(doc, CASE_COLUMNS, record.proposals);
  });
}

async function createSupplierPdf(supplierExport) {
  return createPdf((doc) => {
    writeDocumentHeader(doc, `Bestellvorschlag ${supplierExport.supplier.supplierName}`, [
      ["Vorgang", supplierExport.caseNumber],
      ["Lieferant", supplierExport.supplier.supplierName],
    ]);
    writeRows(doc, SUPPLIER_COLUMNS, supplierExport.rows);
  });
}

function createPdf(write) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 32,
      info: { Creator: "Omnia Companion" },
    });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    write(doc);
    doc.end();
  });
}

function addTable(sheet, columns, rows) {
  sheet.columns = columns.map((column) => ({ header: column.header, key: column.key, width: column.key === "description" ? 48 : 18 }));
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  for (const row of sheet.getRows(2, rows.length) || []) {
    row.alignment = { vertical: "top", wrapText: true };
  }
}

function writeRows(doc, columns, rows) {
  if (!rows.length) {
    doc.font("Helvetica").fontSize(10).fillColor("#344054").text("Keine Positionen vorhanden.");
    return;
  }

  const table = {
    x: doc.page.margins.left,
    y: doc.y,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    headerHeight: 24,
    rowPaddingX: 5,
    rowPaddingY: 6,
  };
  const normalizedColumns = normalizePdfColumns(columns, table.width);

  let y = drawTableHeader(doc, table, normalizedColumns);
  for (const row of rows) {
    const rowHeight = getPdfRowHeight(doc, table, normalizedColumns, row);
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      table.y = doc.page.margins.top;
      y = drawTableHeader(doc, table, normalizedColumns);
    }
    drawTableRow(doc, table, normalizedColumns, row, y, rowHeight);
    y += rowHeight;
  }
  doc.y = y + 8;
}

function writeDocumentHeader(doc, title, metadata) {
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#101828").text(title);
  doc.moveDown(0.45);
  doc.font("Helvetica").fontSize(9).fillColor("#344054");
  for (const [label, value] of metadata) {
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(String(value || "-"));
  }
  doc.moveDown(0.9);
}

function normalizePdfColumns(columns, availableWidth) {
  const configuredWidth = columns.reduce((sum, column) => sum + (column.pdfWidth || 0), 0);
  const fallbackWidth = Math.floor(availableWidth / columns.length);
  return columns.map((column) => ({
    ...column,
    width: column.pdfWidth || fallbackWidth,
    scale: configuredWidth > availableWidth ? availableWidth / configuredWidth : 1,
  })).map((column) => ({ ...column, width: Math.floor(column.width * column.scale) }));
}

function drawTableHeader(doc, table, columns) {
  let x = table.x;
  const y = table.y;
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);

  doc.save();
  doc.rect(table.x, y, tableWidth, table.headerHeight).fill("#eef2f6");
  doc.strokeColor("#c8d0dc").lineWidth(0.7).rect(table.x, y, tableWidth, table.headerHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#1d2939");
  for (const column of columns) {
    doc.text(column.pdfHeader || column.header, x + table.rowPaddingX, y + 7, {
      width: column.width - table.rowPaddingX * 2,
      align: column.align || "left",
      lineBreak: false,
    });
    x += column.width;
  }
  doc.restore();
  return y + table.headerHeight;
}

function drawTableRow(doc, table, columns, row, y, height) {
  let x = table.x;
  doc.save();
  doc.strokeColor("#d8dee8").lineWidth(0.5);
  doc.font("Helvetica").fontSize(8.25).fillColor("#1d2939");
  for (const column of columns) {
    doc.rect(x, y, column.width, height).stroke();
    doc.text(formatCell(row[column.key]), x + table.rowPaddingX, y + table.rowPaddingY, {
      width: column.width - table.rowPaddingX * 2,
      align: column.align || "left",
      lineGap: 1,
    });
    x += column.width;
  }
  doc.restore();
}

function getPdfRowHeight(doc, table, columns, row) {
  doc.font("Helvetica").fontSize(8.25);
  const heights = columns.map((column) =>
    doc.heightOfString(formatCell(row[column.key]), {
      width: column.width - table.rowPaddingX * 2,
      lineGap: 1,
    }) + table.rowPaddingY * 2,
  );
  return Math.max(24, Math.ceil(Math.max(...heights)));
}

function formatCell(value) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
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
