import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeFlowMapping, writeFlowReport } from "./flow-report.ts";
import { createAutomatedClickThrottle, runThrottledAutomatedClick } from "./automated-clicks.ts";
import { collectExploreCandidates } from "./explorer/candidates.ts";
import {
  createBrowserApiClient,
  type BrowserApiClient,
  type BrowserApiRequest,
} from "./browser-api-client.ts";
import {
  appendMarker,
  attachNetworkLogger,
  connectOrLaunchPage,
  parseCommonArgs,
  waitForSettledNetwork,
} from "./network-recorder.ts";
import type { RecorderOptions } from "./network-recorder.ts";
import { redactRecord } from "./redact.ts";
import { waitForLoginGate } from "./recording-workflow.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultBaseUrl = "https://api2.optica-omnia.de";
const defaultReportFile = path.join(workspaceRoot, "docs", "07_write_lab_report.md");
const defaultMappingFile = path.join(workspaceRoot, "docs", "04_flow_to_api_mapping.md");
const defaultRecordingsDir = path.join(workspaceRoot, "docs", "recordings");
const defaultCatalogFile = path.join(workspaceRoot, "docs", "03_api_catalog.md");
const defaultTargetsFile = path.join(workspaceRoot, "tmp", "write-lab-targets.json");

export { createBrowserApiClient };
export type WriteLabRequest = BrowserApiRequest;
export type WriteLabClient = BrowserApiClient;

export type OrderProposalContext = {
  customerId: string;
  salesProcessId: string;
  articleId: string;
  supplierId: string;
  filialeId: string;
  quantity: number;
  unit: string;
  orderValue: number;
  pzn?: string;
};

export type WriteLabOptions = RecorderOptions & {
  scenario: "wawi-order-lifecycle" | "sales-process-noop-save" | "sales-process-ui-create" | "sales-process-add-article-position" | string;
  waitForLogin?: boolean;
  testCustomer: string;
  testArticle: string;
  quantity?: number;
  generatedAt?: Date;
  baseUrl?: string;
  authInput?: string;
  targetsFile?: string;
  proposalContext?: Partial<OrderProposalContext>;
  prepareMail?: boolean;
  allowGoodsReceipt?: boolean;
  bookGoodsReceipt?: boolean;
  allowArticleSetup?: boolean;
  page?: any;
  uiSettleMs?: number;
  onMarker?: (marker: "step-start" | "step-end", step: WriteLabAuditStep) => void;
};

export type WriteLabAuditStep = {
  name: string;
  endpoint?: string;
  status: "ok" | "skipped" | "aborted" | "error";
  testObjectMapping?: Record<string, unknown>;
  generatedIds?: Record<string, unknown>;
  readBack?: string;
  abortReason?: string;
};

export type WriteLabResult = {
  scenario: string;
  status: "completed" | "aborted";
  startedAt: string;
  completedAt: string;
  testObjects: {
    customer: string;
    article: string;
  };
  generatedIds: Record<string, unknown>;
  steps: WriteLabAuditStep[];
  abortReason?: string;
  logFile?: string;
  flowReportFile?: string;
  flowMappingFile?: string;
  reportFile?: string;
};

export function parseWriteLabArgs(argv: string[]): WriteLabOptions {
  const common = parseCommonArgs(argv);
  const targetsFile = valueAfter(argv, "--targets-file") || defaultTargetsFile;
  const options: WriteLabOptions = {
    ...common,
    scenario: valueAfter(argv, "--scenario") || "wawi-order-lifecycle",
    waitForLogin: hasFlag(argv, "--wait-for-login"),
    testCustomer: valueAfter(argv, "--test-customer") || "Max Mustermann",
    testArticle: valueAfter(argv, "--test-article") || "Musterartikel",
    quantity: positiveNumber(valueAfter(argv, "--quantity"), 1),
    baseUrl: valueAfter(argv, "--base-url") || process.env.OMNIA_BASE_URL || defaultBaseUrl,
    authInput: valueAfter(argv, "--auth-input") || readOptionalText(valueAfter(argv, "--auth-file")) || process.env.OMNIA_AUTH_INPUT || "",
    targetsFile,
    proposalContext: readProposalContext(targetsFile),
    prepareMail: hasFlag(argv, "--prepare-mail"),
    allowGoodsReceipt: hasFlag(argv, "--allow-goods-receipt") || hasFlag(argv, "--book-goods-receipt"),
    bookGoodsReceipt: hasFlag(argv, "--book-goods-receipt"),
    allowArticleSetup: hasFlag(argv, "--allow-article-setup"),
  };

  if (hasFlag(argv, "--capture-bodies")) options.captureBodies = true;
  return options;
}

export async function runWawiOrderLifecycle(client: WriteLabClient, options: WriteLabOptions): Promise<WriteLabResult> {
  if (options.scenario !== "wawi-order-lifecycle") {
    throw new Error(`Unbekanntes Write-Lab-Szenario: ${options.scenario}`);
  }

  const startedAt = (options.generatedAt || new Date()).toISOString();
  const steps: WriteLabAuditStep[] = [];
  const result: WriteLabResult = {
    scenario: options.scenario,
    status: "completed",
    startedAt,
    completedAt: startedAt,
    testObjects: {
      customer: options.testCustomer,
      article: options.testArticle,
    },
    generatedIds: {},
    steps,
  };

  const runStep = async <T>(
    name: string,
    endpoint: string | undefined,
    action: (step: WriteLabAuditStep) => Promise<T>,
  ): Promise<T> => {
    const step: WriteLabAuditStep = { name, endpoint, status: "ok" };
    options.onMarker?.("step-start", step);
    try {
      const value = await action(step);
      steps.push(step);
      return value;
    } catch (error) {
      step.status = error instanceof WriteLabAbort ? "aborted" : "error";
      step.abortReason = errorMessage(error);
      steps.push(step);
      throw error;
    } finally {
      options.onMarker?.("step-end", step);
    }
  };

  try {
    await runStep("Login/Workspace/User-Kontext erfassen", undefined, async (step) => {
      step.readBack = "Aktive Omnia-Sitzung wird fuer authentifizierte Browser-Requests verwendet.";
    });

    let customer = await runStep("Musterkunde suchen", "GET /apigateway/kunden/customers/search", async (step) => {
      const resolved = await resolveTestCustomer(client, options.testCustomer);
      step.testObjectMapping = {
        customerId: idOf(resolved.row),
        match: "exact",
        lookupKeyword: resolved.keyword,
        candidateCount: resolved.candidateCount,
      };
      step.readBack = "Kunde eindeutig aufgeloest.";
      return resolved.row;
    });

    customer = await runStep("Sales-Process- und Filial-Kontext zum Musterkunden laden", "POST /apigateway/sales/salesprocesses/search", async (step) => {
      const payload = await client.request({
        method: "POST",
        path: "/apigateway/sales/salesprocesses/search",
        query: { page: 0, size: 10, sort: "date,desc" },
        body: {
          keywords: options.testCustomer,
          active: true,
        },
      });
      const selection = selectSalesProcessForCustomer(
        contentItems(payload),
        customer,
        options.testCustomer,
        textField(options.proposalContext, "salesProcessId"),
      );
      const salesProcess = selection.row;
      const merged = {
        ...customer,
        salesProcess,
        salesProcessId: idOf(salesProcess),
        filialeId: textField(salesProcess, "filialeId") || textField(customer, "filialeId"),
      };
      step.testObjectMapping = {
        customerId: idOf(customer),
        salesProcessId: idOf(salesProcess),
        filialeId: textField(merged, "filialeId"),
        candidateCount: selection.candidateCount,
        selectionStrategy: selection.strategy,
      };
      step.readBack =
        selection.candidateCount === 1
          ? "Sales-Process und Filiale fuer den Testkunden eindeutig aufgeloest."
          : "Mehrere Testkunden-Vorgaenge gefunden; neuester aktiver Vorgang mit Filiale wurde deterministisch gewaehlt.";
      return merged;
    });

    const article = await runStep("Musterartikel suchen und Kontext laden", "POST /apigateway/articletenantservice/articles/simple-search", async (step) => {
      const found = await searchArticle(client, options.testArticle);
      const row = uniqueExactMatch(found, options.testArticle, articleMatchValues, "Artikel");
      const hydrated = await hydrateArticle(client, row);
      const merged = await prepareArticleOrderContext(client, { ...row, ...hydrated }, options);
      step.testObjectMapping = {
        articleId: idOf(merged),
        match: "exact",
        supplierId: textField(merged, "supplierId") || textField(merged, "defaultSupplierId"),
        pzn: textField(merged, "pzn"),
        unit: orderUnitOf(merged),
      };
      step.readBack = "Artikel eindeutig aufgeloest; Detailkontext wurde soweit moeglich geladen.";
      return merged;
    });

    let proposal = await runStep("Passenden Bestellvorschlag suchen", "POST /apigateway/wawi/order-proposals/search", async (step) => {
      const proposalRows = await searchOrderProposals(client, options);
      const matching = uniqueById(proposalRows).filter((row) =>
        proposalMatchesCustomer(row, customer, options.testCustomer) &&
        proposalMatchesArticle(row, article, options.testArticle) &&
        proposalMatchesPreferredSalesProcess(row, textField(options.proposalContext, "salesProcessId"))
      );

      if (matching.length > 1) {
        throw new WriteLabAbort(`Bestellvorschlag nicht eindeutig: ${matching.length} Treffer`);
      }

      if (matching.length === 0) {
        step.status = "skipped";
        step.readBack = "Kein bestehender Bestellvorschlag fuer Musterkunde und Musterartikel gefunden.";
        return null;
      }

      step.testObjectMapping = proposalMapping(matching[0]);
      step.readBack = "Bestehender Bestellvorschlag eindeutig aufgeloest.";
      return matching[0];
    });

    if (!proposal) {
      proposal = await runStep("Test-Bestellvorschlag anlegen", "POST /apigateway/wawi/order-proposals", async (step) => {
        const context = buildOrderProposalContext(customer, article, options);
        const missing = missingProposalContext(context);
        if (missing.length > 0) {
          throw new WriteLabAbort(`missing-order-proposal-context:${missing.join(",")}`);
        }

        const body = {
          articleId: context.articleId,
          supplierId: context.supplierId,
          filialeId: context.filialeId,
          orderQuantity: context.quantity,
          orderQuantityUnit: context.unit,
          orderValue: context.orderValue ?? null,
          salesProcessId: context.salesProcessId,
          customerId: context.customerId,
          articleOrigin: textField(article, "dataOrigin") || "LOCAL",
          kindOfOrderProposal: "OWN_ORDER_PROPOSAL",
          comment: "",
          externalOrder: false,
        };
        const created = await guardedRequest(client, { method: "POST", path: "/apigateway/wawi/order-proposals", body });
        const normalized = { ...body, ...asRecord(created), id: idOf(created) || idOf(body) };
        step.testObjectMapping = proposalMapping(normalized);
        step.generatedIds = { proposalId: idOf(normalized) };
        step.readBack = "Test-Bestellvorschlag wurde erzeugt.";
        result.generatedIds.proposalId = idOf(normalized);
        return normalized;
      });
    }

    await runStep("Bestellkontext validieren", undefined, async (step) => {
      validateProposalForOrder(proposal, customer, article);
      validateProposalSalesProcess(proposal, textField(options.proposalContext, "salesProcessId"));
      step.testObjectMapping = proposalMapping(proposal);
      step.readBack = "Lieferant, PZN, Einheit, Menge und Testobjekt-Bezug sind plausibel.";
    });

    const proposalId = idOf(proposal);
    const supplierId = textField(proposal, "supplierId");
    const selection = { includeAll: false, selections: [proposalId], filters: null };

    await runStep("Bestellvorschlag per selection vorbereiten", "POST /apigateway/wawi/order-proposals/to-order", async (step) => {
      await guardedRequest(client, {
        method: "POST",
        path: "/apigateway/wawi/order-proposals/to-order",
        body: selection,
      });
      step.generatedIds = { proposalIds: selection.selections };
      step.readBack = "Omnia hat die explizite Vorschlagsauswahl vorbereitet.";
    });

    const createdOrder = await runStep("Bestellung aus Vorschlag erzeugen", "POST /apigateway/wawi/orders/from-proposal", async (step) => {
      const payload = await guardedRequest(client, {
        method: "POST",
        path: "/apigateway/wawi/orders/from-proposal",
        body: {
          proposals: selection,
          supplierId,
        },
      });
      const orderId = idOf(payload);
      if (!orderId) throw new WriteLabAbort("created-order-id-missing");
      step.generatedIds = { orderId };
      step.readBack = "Bestellung erzeugt; Read-back steht noch aus.";
      result.generatedIds.orderId = orderId;
      return payload;
    });

    const orderId = idOf(createdOrder);
    const readBack = await runStep("Bestellung und Positionen zuruecklesen", `GET /apigateway/wawi/orders/${orderId}`, async (step) => {
      const order = await client.request({ method: "GET", path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}` });
      const positionsPayload = await client.request({
        method: "GET",
        path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}/positions`,
      });
      const positions = contentItems(positionsPayload);
      validateOrderReadBack(order, positions, proposal, article);
      step.generatedIds = { orderId, positionCount: positions.length };
      step.readBack = "Bestellung und Positionen passen zum Musterartikel und zur Lieferantengruppe.";
      return { order, positions };
    });

    await runStep("Bestellung verarbeiten", `POST /apigateway/wawi/orders/${orderId}/process-order`, async (step) => {
      const payload = await guardedRequest(client, {
        method: "POST",
        path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}/process-order`,
        body: {
          orderState: null,
          orderDate: (options.generatedAt || new Date()).toISOString(),
          markProposalsAsOrdered: true,
          printOptions: {
            stationery: true,
            prices: true,
            emailHeader: false,
            emailFooter: false,
            showSalesProcessNumber: true,
          },
        },
      });
      const documentId = textField(payload, "orderDocumentId");
      if (documentId) result.generatedIds.orderDocumentId = documentId;
      step.generatedIds = { orderId, orderDocumentId: documentId || null };
      step.readBack = "process-order wurde erst nach eindeutigem Read-back ausgefuehrt.";
    });

    if (options.prepareMail) {
      await runStep("PDF/Mail lokal vorbereiten", `POST /apigateway/wawi/orders/${orderId}/email`, async (step) => {
        const orderDocumentId = textField(result.generatedIds, "orderDocumentId");
        if (!orderDocumentId) throw new WriteLabAbort("mail-prepare-document-id-missing");
        const payload = await guardedRequest(
          client,
          {
            method: "POST",
            path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}/email`,
            body: {
              createMailFile: true,
              documentIds: [orderDocumentId],
            },
          },
          { allowMailPrepare: true },
        );
        step.generatedIds = { mailFileId: textField(payload, "mailFileId") || null };
        step.readBack = "Mail/PDF wurde nur vorbereitet; kein externer Versand wurde ausgeloest.";
      });
    } else {
      steps.push({
        name: "PDF/Mail lokal vorbereiten",
        endpoint: `POST /apigateway/wawi/orders/${orderId}/email`,
        status: "skipped",
        readBack: "Uebersprungen, weil --prepare-mail nicht gesetzt ist.",
      });
    }

    if (options.allowGoodsReceipt) {
      let goodsReceiptOrder: Record<string, unknown> | null = null;
      let goodsReceiptCandidate: Record<string, unknown> | null = null;

      await runStep("Wareneingangskandidaten suchen", "POST /apigateway/wawi/order-arrival/search", async (step) => {
        const orderNumber = textField(readBack.order, "number") || textField(createdOrder, "number");
        let payload: unknown;
        try {
          goodsReceiptOrder = asRecord(await client.request({
            method: "GET",
            path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}`,
          }));
          payload = await client.request({
            method: "POST",
            path: "/apigateway/wawi/order-arrival/search",
            query: { page: 0, size: 10, sort: "orderNr,asc" },
            body: buildOrderArrivalSearchBody(goodsReceiptOrder, orderId),
          });
        } catch (error) {
          if (options.bookGoodsReceipt) throw error;
          step.status = "skipped";
          step.generatedIds = { orderId, orderNumber: orderNumber || null };
          step.abortReason = errorMessage(error);
          step.readBack = "Wareneingangssuche ist optional fehlgeschlagen; der erzeugte und verarbeitete Bestellflow bleibt gueltig.";
          return;
        }
        const rows = contentItems(payload);
        const candidates = rows.filter((row) =>
          orderArrivalMatchesOrder(row, orderId, orderNumber) && orderArrivalMatchesArticle(row, article, options.testArticle)
        );
        step.status = options.bookGoodsReceipt ? "ok" : "skipped";
        step.generatedIds = { orderId, orderNumber: orderNumber || null, observedRows: rows.length, candidateCount: candidates.length };
        if (candidates.length === 1) step.testObjectMapping = orderArrivalMapping(candidates[0]);
        if (options.bookGoodsReceipt) {
          if (candidates.length !== 1) throw new WriteLabAbort(`goods-receipt-candidate-not-unique:${candidates.length}`);
          goodsReceiptCandidate = candidates[0];
          validateGoodsReceiptCandidate(goodsReceiptCandidate, orderId, orderNumber, article, options.testArticle);
          step.readBack = "Wareneingangskandidat ist eindeutig und passt zu Musterartikel/Testbestellung.";
          return;
        }
        step.readBack =
          candidates.length === 0
            ? "Wareneingangssuche wurde aufgezeichnet; kein eindeutig passender Kandidat zur Testbestellung gefunden."
            : "Wareneingangskandidaten wurden aufgezeichnet; nicht gebucht, weil Liefernummer, Lagerort und explizite Position noch fehlen.";
      });

      if (options.bookGoodsReceipt) {
        await runStep("Wareneingang buchen", "POST /apigateway/wawiservice/order-arrival/book", async (step) => {
          if (!goodsReceiptCandidate) throw new WriteLabAbort("goods-receipt-candidate-missing");
          const orderForReceipt = goodsReceiptOrder || asRecord(readBack.order);
          const filialeId = textField(goodsReceiptCandidate, "filialeId") || textField(orderForReceipt, "filialeId");
          const storageLocation = await resolveGoodsReceiptStorageLocation(client, filialeId);
          const body = buildGoodsReceiptBookBody(goodsReceiptCandidate, orderForReceipt, storageLocation, options);
          const payload = await guardedRequest(
            client,
            {
              method: "POST",
              path: "/apigateway/wawiservice/order-arrival/book",
              body,
            },
            { allowGoodsReceipt: true },
          );
          const postPositionsPayload = await client.request({
            method: "GET",
            path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}/positions`,
          });
          validateGoodsReceiptReadBack(contentItems(postPositionsPayload), goodsReceiptCandidate);
          step.testObjectMapping = orderArrivalMapping(goodsReceiptCandidate);
          step.generatedIds = {
            orderId,
            orderNumber: textField(goodsReceiptCandidate, "orderNr") || textField(orderForReceipt, "number") || null,
            orderPositionId: goodsReceiptPositionId(goodsReceiptCandidate),
            storageLocationId: idOf(storageLocation),
            deliveryNr: textField(body, "deliveryNr"),
            responseId: idOf(payload) || null,
          };
          step.readBack = "Wareneingang wurde fuer genau eine Testposition gebucht und anschliessend zurueckgelesen.";
        });
      } else {
        steps.push({
          name: "Wareneingang buchen",
          endpoint: "POST /apigateway/wawiservice/order-arrival/book",
          status: "skipped",
          readBack: "Uebersprungen, weil --book-goods-receipt nicht gesetzt ist.",
        });
      }
    } else {
      steps.push({
        name: "Wareneingang optional pruefen",
        endpoint: "POST /apigateway/wawi/order-arrival/search",
        status: "skipped",
        readBack: "Uebersprungen, weil --allow-goods-receipt nicht gesetzt ist.",
      });
    }
  } catch (error) {
    result.status = "aborted";
    result.abortReason = errorMessage(error);
  }

  result.completedAt = new Date().toISOString();
  return result;
}

export async function runSalesProcessNoopSave(client: WriteLabClient, options: WriteLabOptions): Promise<WriteLabResult> {
  if (options.scenario !== "sales-process-noop-save") {
    throw new Error(`Unbekanntes Write-Lab-Szenario: ${options.scenario}`);
  }

  const startedAt = (options.generatedAt || new Date()).toISOString();
  const steps: WriteLabAuditStep[] = [];
  const result: WriteLabResult = {
    scenario: options.scenario,
    status: "completed",
    startedAt,
    completedAt: startedAt,
    testObjects: {
      customer: options.testCustomer,
      article: options.testArticle,
    },
    generatedIds: {},
    steps,
  };

  const runStep = async <T>(
    name: string,
    endpoint: string | undefined,
    action: (step: WriteLabAuditStep) => Promise<T>,
  ): Promise<T> => {
    const step: WriteLabAuditStep = { name, endpoint, status: "ok" };
    options.onMarker?.("step-start", step);
    try {
      const value = await action(step);
      steps.push(step);
      return value;
    } catch (error) {
      step.status = error instanceof WriteLabAbort ? "aborted" : "error";
      step.abortReason = errorMessage(error);
      steps.push(step);
      throw error;
    } finally {
      options.onMarker?.("step-end", step);
    }
  };

  try {
    await runStep("Login/Workspace/User-Kontext erfassen", undefined, async (step) => {
      step.readBack = "Aktive Omnia-Sitzung wird fuer authentifizierte Browser-Requests verwendet.";
    });

    const customer = await runStep("Musterkunde suchen", "GET /apigateway/kunden/customers/search", async (step) => {
      const resolved = await resolveTestCustomer(client, options.testCustomer);
      step.testObjectMapping = {
        customerId: idOf(resolved.row),
        match: "exact",
        lookupKeyword: resolved.keyword,
        candidateCount: resolved.candidateCount,
      };
      step.readBack = "Kunde eindeutig aufgeloest.";
      return resolved.row;
    });

    const salesProcess = await runStep("Vorgang zum Musterkunden auswaehlen", "POST /apigateway/sales/salesprocesses/search", async (step) => {
      const payload = await client.request({
        method: "POST",
        path: "/apigateway/sales/salesprocesses/search",
        query: { page: 0, size: 10, sort: "date,desc" },
        body: {
          keywords: options.testCustomer,
          active: true,
        },
      });
      const selection = selectSalesProcessForCustomer(contentItems(payload), customer, options.testCustomer);
      const row = selection.row;
      step.testObjectMapping = {
        customerId: idOf(customer),
        salesProcessId: idOf(row),
        filialeId: textField(row, "filialeId"),
        candidateCount: selection.candidateCount,
        selectionStrategy: selection.strategy,
      };
      step.readBack =
        selection.candidateCount === 1
          ? "Vorgang fuer den Testkunden eindeutig aufgeloest."
          : "Mehrere Testkunden-Vorgaenge gefunden; neuester aktiver Vorgang mit Filiale wurde deterministisch gewaehlt.";
      return row;
    });

    const salesProcessId = idOf(salesProcess);
    if (!salesProcessId) throw new WriteLabAbort("sales-process-id-missing");
    result.generatedIds.salesProcessId = salesProcessId;

    const before = await runStep("Vorgang detail laden", `GET /apigateway/sales/salesprocesses/${salesProcessId}`, async (step) => {
      const detail = asRecord(
        await client.request({
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
        }),
      );
      validateSalesProcessForCustomer(detail, customer, options.testCustomer);
      step.testObjectMapping = salesProcessMapping(detail);
      step.readBack = "Vorgangsdetail passt zum Mustermann-Testkunden.";
      return detail;
    });

    const requestBody = cloneJson(before);
    await runStep("Vorgang unveraendert speichern", `PUT /apigateway/sales/salesprocesses/${salesProcessId}`, async (step) => {
      validateSalesProcessForCustomer(requestBody, customer, options.testCustomer);
      await guardedRequest(
        client,
        {
          method: "PUT",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
          body: requestBody,
        },
        { allowSalesProcessSave: true },
      );
      step.testObjectMapping = salesProcessMapping(requestBody);
      step.generatedIds = { salesProcessId };
      step.readBack = "Vorgang wurde als No-op mit unveraendertem Detail-Body gespeichert.";
    });

    await runStep("Vorgang zuruecklesen und No-op verifizieren", `GET /apigateway/sales/salesprocesses/${salesProcessId}`, async (step) => {
      const after = asRecord(
        await client.request({
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
        }),
      );
      validateSalesProcessForCustomer(after, customer, options.testCustomer);
      validateSalesProcessNoopReadBack(before, after);
      step.testObjectMapping = salesProcessMapping(after);
      step.generatedIds = { salesProcessId };
      step.readBack = "Read-back bestaetigt ID, Kundenbezug, Filiale und Positionsliste des Testvorgangs.";
    });
  } catch (error) {
    result.status = "aborted";
    result.abortReason = errorMessage(error);
  }

  result.completedAt = new Date().toISOString();
  return result;
}

export async function runSalesProcessUiCreate(client: WriteLabClient, options: WriteLabOptions): Promise<WriteLabResult> {
  if (options.scenario !== "sales-process-ui-create") {
    throw new Error(`Unbekanntes Write-Lab-Szenario: ${options.scenario}`);
  }

  const startedAt = (options.generatedAt || new Date()).toISOString();
  const steps: WriteLabAuditStep[] = [];
  const result: WriteLabResult = {
    scenario: options.scenario,
    status: "completed",
    startedAt,
    completedAt: startedAt,
    testObjects: {
      customer: options.testCustomer,
      article: options.testArticle,
    },
    generatedIds: {},
    steps,
  };
  const clickThrottle = createAutomatedClickThrottle();
  let createdIdFromSave = "";

  const runStep = async <T>(
    name: string,
    endpoint: string | undefined,
    action: (step: WriteLabAuditStep) => Promise<T>,
  ): Promise<T> => {
    const step: WriteLabAuditStep = { name, endpoint, status: "ok" };
    options.onMarker?.("step-start", step);
    try {
      const value = await action(step);
      steps.push(step);
      return value;
    } catch (error) {
      step.status = error instanceof WriteLabAbort ? "aborted" : "error";
      step.abortReason = errorMessage(error);
      steps.push(step);
      throw error;
    } finally {
      options.onMarker?.("step-end", step);
    }
  };

  try {
    if (!options.page) throw new WriteLabAbort("sales-process-ui-create-page-missing");

    await runStep("Login/Workspace/User-Kontext erfassen", undefined, async (step) => {
      step.readBack = "Aktive Omnia-Sitzung wird fuer authentifizierte Browser-Requests und UI-Klicks verwendet.";
    });

    const customer = await runStep("Musterkunde suchen", "GET /apigateway/kunden/customers/search", async (step) => {
      const resolved = await resolveTestCustomer(client, options.testCustomer);
      step.testObjectMapping = {
        customerId: idOf(resolved.row),
        match: "exact",
        lookupKeyword: resolved.keyword,
        candidateCount: resolved.candidateCount,
      };
      step.readBack = "Kunde eindeutig aufgeloest.";
      return resolved.row;
    });

    const beforeRows = await runStep("Vorhandene Vorgangsliste merken", "POST /apigateway/sales/salesprocesses/search", async (step) => {
      const rows = await searchSalesProcessesForCustomer(client, customer, options.testCustomer);
      step.testObjectMapping = { customerId: idOf(customer), beforeCount: rows.length };
      step.generatedIds = { beforeSalesProcessIds: rows.map(idOf).filter(Boolean) };
      step.readBack = "Vorheriger Vorgangsbestand fuer den Musterkunden wurde gemerkt.";
      return rows;
    });
    const beforeIds = new Set(beforeRows.map(idOf).filter(Boolean));

    await runStep("Kundendetail oeffnen", `/master-data/customers/${idOf(customer)}`, async (step) => {
      const customerId = idOf(customer);
      if (!customerId) throw new WriteLabAbort("customer-id-missing");
      const detailUrl = new URL(`/master-data/customers/${encodeURIComponent(customerId)}`, options.baseUrl || options.url || defaultBaseUrl).toString();
      await options.page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 15000 }).catch((error: unknown) => {
        throw new WriteLabAbort(`customer-detail-navigation-failed:${errorMessage(error)}`);
      });
      await waitForWriteUiSettled(options.page, options.uiSettleMs);
      step.testObjectMapping = { customerId };
      step.readBack = "Kundendetail wurde vor dem Write-Klick geoeffnet.";
    });

    await runStep("Kunde-Historie oeffnen", "UI tab Historie", async (step) => {
      await clickWriteUiCandidate(options.page, clickThrottle, {
        labels: ["Historie", "Vorgänge", "Vorgaenge", "Verlauf"],
        roles: ["tab"],
      }, options);
      step.testObjectMapping = { customerId: idOf(customer) };
      step.readBack = "Historie-Tab des Musterkunden ist aktiv.";
    });

    await runStep("Neuer Vorgang aus Kundenhistorie starten", "UI button Neuer Vorgang", async (step) => {
      assertCustomerDetailContext(options.page.url?.() || "", idOf(customer));
      await clickWriteUiCandidate(options.page, clickThrottle, {
        label: "Neuer Vorgang",
      }, options);
      step.testObjectMapping = { customerId: idOf(customer), beforeCount: beforeIds.size };
      step.readBack = "Der UI-Write-Klick wurde nur im eindeutig geoeffneten Musterkunden-Kontext ausgefuehrt.";
    });

    if (isNewSalesProcessDraftUrl(options.page.url?.() || "")) {
      await runStep("Neuen Vorgangsentwurf speichern", "UI button Speichern & schließen", async (step) => {
        assertNewSalesProcessDraftContext(options.page.url?.() || "");
        const createResponse = waitForSalesProcessCreateResponse(options.page, writeUiResponseTimeoutMs(options));
        await clickWriteUiCandidate(options.page, clickThrottle, {
          labels: ["Speichern & schließen", "Speichern und schließen", "Speichern"],
        }, options);
        await waitForSettledNetwork(options.page, 2500);
        const created = await createResponse;
        const responseId = idOf(created);
        if (responseId) {
          validateSalesProcessCreateResponse(created, customer, options.testCustomer);
          createdIdFromSave = responseId;
          step.generatedIds = { salesProcessId: responseId };
        }
        step.testObjectMapping = { customerId: idOf(customer) };
        step.readBack = responseId
          ? "Der neue Vorgangsentwurf wurde gespeichert; die Create-Response-ID wurde gemerkt."
          : "Der neue Vorgangsentwurf wurde nur im /transactions/new-Kontext gespeichert.";
      });
    }

    const createdId = await runStep("Neuen Vorgang eindeutig ermitteln", "POST /apigateway/sales/salesprocesses/search", async (step) => {
      const afterRows = await searchSalesProcessesForCustomer(client, customer, options.testCustomer);
      const newRows = afterRows.filter((row) => {
        const rowId = idOf(row);
        return rowId && !beforeIds.has(rowId) && proposalMatchesCustomer(row, customer, options.testCustomer);
      });
      const routeId = salesProcessIdFromUrl(options.page.url?.() || "");
      if (createdIdFromSave) {
        if (beforeIds.has(createdIdFromSave)) throw new WriteLabAbort("sales-process-create-response-id-already-known");
        step.testObjectMapping = { customerId: idOf(customer), responseSalesProcessId: createdIdFromSave };
        step.generatedIds = { salesProcessId: createdIdFromSave };
        step.readBack = "Neuer Vorgang wurde ueber die Create-Response erkannt.";
        return createdIdFromSave;
      }
      if (newRows.length === 0 && routeId && !beforeIds.has(routeId)) {
        step.testObjectMapping = { customerId: idOf(customer), routeSalesProcessId: routeId };
        step.generatedIds = { salesProcessId: routeId };
        step.readBack = "Neuer Vorgang wurde ueber die Vorgangsroute erkannt.";
        return routeId;
      }
      if (newRows.length !== 1) {
        throw new WriteLabAbort(`sales-process-create-not-observed:${newRows.length}`);
      }
      const row = newRows[0];
      const salesProcessId = idOf(row);
      step.testObjectMapping = { customerId: idOf(customer), afterCount: afterRows.length };
      step.generatedIds = { salesProcessId };
      step.readBack = "Genau ein neuer Vorgang zum Musterkunden wurde in der Liste gefunden.";
      return salesProcessId;
    });

    await runStep("Neuen Vorgang zuruecklesen", `GET /apigateway/sales/salesprocesses/${createdId}`, async (step) => {
      const detail = asRecord(
        await client.request({
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(createdId)}`,
        }),
      );
      validateSalesProcessForCustomer(detail, customer, options.testCustomer);
      step.testObjectMapping = salesProcessMapping(detail);
      step.generatedIds = { salesProcessId: createdId };
      step.readBack = "Read-back bestaetigt den Kundenbezug des neu erkannten Vorgangs.";
      result.generatedIds.salesProcessId = createdId;
    });
  } catch (error) {
    result.status = "aborted";
    result.abortReason = errorMessage(error);
  }

  result.completedAt = new Date().toISOString();
  return result;
}

export async function runSalesProcessAddArticlePosition(client: WriteLabClient, options: WriteLabOptions): Promise<WriteLabResult> {
  if (options.scenario !== "sales-process-add-article-position") {
    throw new Error(`Unbekanntes Write-Lab-Szenario: ${options.scenario}`);
  }

  const startedAt = (options.generatedAt || new Date()).toISOString();
  const steps: WriteLabAuditStep[] = [];
  const result: WriteLabResult = {
    scenario: options.scenario,
    status: "completed",
    startedAt,
    completedAt: startedAt,
    testObjects: {
      customer: options.testCustomer,
      article: options.testArticle,
    },
    generatedIds: {},
    steps,
  };

  const runStep = async <T>(
    name: string,
    endpoint: string | undefined,
    action: (step: WriteLabAuditStep) => Promise<T>,
  ): Promise<T> => {
    const step: WriteLabAuditStep = { name, endpoint, status: "ok" };
    options.onMarker?.("step-start", step);
    try {
      const value = await action(step);
      steps.push(step);
      return value;
    } catch (error) {
      step.status = error instanceof WriteLabAbort ? "aborted" : "error";
      step.abortReason = errorMessage(error);
      steps.push(step);
      throw error;
    } finally {
      options.onMarker?.("step-end", step);
    }
  };

  try {
    const createResult = await runSalesProcessUiCreate(client, {
      ...options,
      scenario: "sales-process-ui-create",
    });
    steps.push(...createResult.steps);
    if (createResult.status !== "completed") {
      throw new WriteLabAbort(createResult.abortReason || "sales-process-create-failed");
    }

    const salesProcessId = textField(createResult.generatedIds, "salesProcessId");
    if (!salesProcessId) throw new WriteLabAbort("sales-process-id-missing");
    result.generatedIds.salesProcessId = salesProcessId;

    const customer = await runStep("Musterkunde fuer Positionsflow pruefen", "GET /apigateway/kunden/customers/search", async (step) => {
      const resolved = await resolveTestCustomer(client, options.testCustomer);
      step.testObjectMapping = {
        customerId: idOf(resolved.row),
        match: "exact",
        lookupKeyword: resolved.keyword,
        candidateCount: resolved.candidateCount,
      };
      step.readBack = "Kunde vor dem Positionswrite erneut eindeutig aufgeloest.";
      return resolved.row;
    });

    const before = await runStep("Neuen Vorgang vor Positionswrite laden", `GET /apigateway/sales/salesprocesses/${salesProcessId}`, async (step) => {
      const detail = asRecord(
        await client.request({
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
        }),
      );
      validateSalesProcessForCustomer(detail, customer, options.testCustomer);
      const existingPositions = salesPositionRows(detail);
      const existingMaterialPositions = salesMaterialPositionRows(detail);
      if (existingPositions.length !== 0 || existingMaterialPositions.length !== 0) {
        throw new WriteLabAbort(`sales-process-new-position-precondition-failed:${existingPositions.length}/${existingMaterialPositions.length}`);
      }
      step.testObjectMapping = salesProcessMapping(detail);
      step.generatedIds = { salesProcessId };
      step.readBack = "Neu angelegter Vorgang ist leer und gehoert zum Musterkunden.";
      return detail;
    });

    const article = await runStep("Musterartikel fuer Vorgangsposition suchen", "POST /apigateway/articletenantservice/articles/simple-search", async (step) => {
      const found = await searchArticle(client, options.testArticle);
      const row = uniqueExactMatch(found, options.testArticle, articleMatchValues, "Artikel");
      const hydrated = await hydrateArticle(client, row);
      const merged = { ...row, ...hydrated };
      step.testObjectMapping = {
        articleId: idOf(merged),
        articleNumber: textField(merged, "articleNumber") || textField(row, "articleNumber"),
        match: "exact",
      };
      step.readBack = "Artikel eindeutig fuer den Vorgang aufgeloest.";
      return merged;
    });

    const salesPosition = await runStep("Musterartikel-Position berechnen", "POST /apigateway/pricingservice/sales-positions", async (step) => {
      const quantity = positiveRuntimeQuantity(options.quantity);
      const payload = await guardedRequest(client, {
        method: "POST",
        path: "/apigateway/pricingservice/sales-positions",
        body: [buildSalesPositionPricingRequest(before, article, quantity)],
      });
      const candidates = nestedContentItems(payload).filter((row) => salesPositionMatchesArticle(row, article, options.testArticle));
      if (candidates.length !== 1) throw new WriteLabAbort(`sales-position-pricing-not-unique:${candidates.length}`);
      const prepared = prepareSalesPositionForSalesProcess(candidates[0], article, quantity, 0);
      step.testObjectMapping = salesPositionMapping(prepared);
      step.readBack = "Pricingservice hat genau eine Musterartikel-Position geliefert.";
      return prepared;
    });

    const calculated = await runStep("Vorgangspreise mit Musterartikel berechnen", "POST /apigateway/sales/salesprocesses/calculate-prices", async (step) => {
      const draft = cloneJson(before);
      const quantity = positiveRuntimeQuantity(options.quantity);
      draft.salesPositionList = [salesPosition];
      draft.salesMaterialPositionList = [buildSalesMaterialPositionForSalesProcess(salesPosition, article, quantity, 0)];
      draft.materialPositionen = true;
      const payload = asRecord(
        await guardedRequest(client, {
          method: "POST",
          path: "/apigateway/sales/salesprocesses/calculate-prices",
          body: draft,
        }),
      );
      const position = validateSalesProcessArticlePosition(payload, customer, article, options);
      if (salesMaterialPositionRows(payload).length === 0) {
        payload.salesMaterialPositionList = draft.salesMaterialPositionList;
        payload.materialPositionen = true;
      }
      validateSalesProcessMaterialPosition(payload, customer, article, options);
      step.testObjectMapping = salesPositionMapping(position);
      step.generatedIds = { salesProcessId, quantity };
      step.readBack = `Preisberechnung enthaelt genau die Musterartikel-Position mit Menge ${quantity} und eine Materialposition.`;
      return payload;
    });

    await runStep("Vorgang mit Musterartikel speichern", `PUT /apigateway/sales/salesprocesses/${salesProcessId}`, async (step) => {
      validateSalesProcessArticlePosition(calculated, customer, article, options);
      validateSalesProcessMaterialPosition(calculated, customer, article, options);
      await guardedRequest(
        client,
        {
          method: "PUT",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
          body: calculated,
        },
        { allowSalesProcessSave: true },
      );
      step.testObjectMapping = salesProcessMapping(calculated);
      step.generatedIds = { salesProcessId };
      step.readBack = "Vorgang wurde erst nach Preisberechnung und Testobjekt-Pruefung gespeichert.";
    });

    await runStep("Vorgang mit Musterartikel zuruecklesen", `GET /apigateway/sales/salesprocesses/${salesProcessId}`, async (step) => {
      const after = asRecord(
        await client.request({
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
        }),
      );
      const position = validateSalesProcessArticlePosition(after, customer, article, options);
      const materialPosition = validateSalesProcessMaterialPosition(after, customer, article, options);
      step.testObjectMapping = salesPositionMapping(position);
      step.generatedIds = {
        salesProcessId,
        salesPositionId: idOf(position) || null,
        salesMaterialPositionId: idOf(materialPosition) || null,
      };
      step.readBack = `Read-back bestaetigt Musterkunde, Musterartikel, Menge ${positiveRuntimeQuantity(options.quantity)} und Materialposition.`;
      result.generatedIds.salesPositionId = idOf(position) || null;
      result.generatedIds.salesMaterialPositionId = idOf(materialPosition) || null;
    });

    const orderResult = await runWawiOrderLifecycle(client, {
      ...options,
      scenario: "wawi-order-lifecycle",
      proposalContext: {
        ...(options.proposalContext || {}),
        customerId: idOf(customer),
        salesProcessId,
        articleId: idOf(article),
        filialeId: textField(calculated, "filialeId") || textField(before, "filialeId"),
        quantity: positiveRuntimeQuantity(options.quantity),
        unit: orderUnitOf(article) || textField(salesPosition, "unit") || "PIECE",
      },
    });
    steps.push(...orderResult.steps);
    Object.assign(result.generatedIds, orderResult.generatedIds);
    if (orderResult.status !== "completed") {
      throw new WriteLabAbort(orderResult.abortReason || "wawi-order-follow-up-failed");
    }
  } catch (error) {
    result.status = "aborted";
    result.abortReason = errorMessage(error);
  }

  result.completedAt = new Date().toISOString();
  return result;
}

export async function runWriteLabScenario(client: WriteLabClient, options: WriteLabOptions): Promise<WriteLabResult> {
  if (options.scenario === "wawi-order-lifecycle") return runWawiOrderLifecycle(client, options);
  if (options.scenario === "sales-process-noop-save") return runSalesProcessNoopSave(client, options);
  if (options.scenario === "sales-process-ui-create") return runSalesProcessUiCreate(client, options);
  if (options.scenario === "sales-process-add-article-position") return runSalesProcessAddArticlePosition(client, options);
  throw new Error(`Unbekanntes Write-Lab-Szenario: ${options.scenario}`);
}

export function assertSafeWriteRequest(
  request: WriteLabRequest,
  policy: { allowMailPrepare?: boolean; allowGoodsReceipt?: boolean; allowArticleSetup?: boolean; allowSalesProcessSave?: boolean; allowSalesProcessCreate?: boolean } = {},
): void {
  const method = (request.method || "GET").toUpperCase();
  const pathname = request.path.toLowerCase();
  if (method === "DELETE") throw new WriteLabAbort("DELETE ist im Write-Lab verboten");
  if (!["POST", "PUT", "PATCH"].includes(method)) return;

  if (containsIncludeAllTrue(request.body)) throw new WriteLabAbort("includeAll:true ist im Write-Lab verboten");
  if (/(^|\/)(delete|import|upload|storno|cancel)(\/|$|-)/i.test(pathname)) {
    throw new WriteLabAbort(`Gefaerlicher Write-Pfad blockiert: ${request.path}`);
  }
  if (pathname.includes("resolveunitmismatch")) {
    throw new WriteLabAbort("resolveUnitMismatch darf nicht automatisch ausgefuehrt werden");
  }

  if (method === "PUT" && /^\/apigateway\/sales\/salesprocesses\/[^/]+$/.test(pathname)) {
    if (!policy.allowSalesProcessSave) {
      throw new WriteLabAbort("Vorgang-Speichern ist ohne explizites No-op-Szenario blockiert");
    }
    const body = asRecord(request.body);
    const pathSalesProcessId = decodeURIComponent(request.path.split("/").pop() || "");
    if (!textField(body, "id") || textField(body, "id") !== pathSalesProcessId) {
      throw new WriteLabAbort("Vorgang-Speichern verlangt passende Vorgangs-ID im Pfad und Body");
    }
    if (!salesProcessCustomerId(body)) {
      throw new WriteLabAbort("Vorgang-Speichern verlangt Kundenbezug im Body");
    }
  }

  if (method === "POST" && pathname === "/apigateway/sales/salesprocesses") {
    if (!policy.allowSalesProcessCreate) {
      throw new WriteLabAbort("Vorgang-Anlage ist ohne explizites UI-Create-Szenario blockiert");
    }
    if (!salesProcessCustomerId(asRecord(request.body))) {
      throw new WriteLabAbort("Vorgang-Anlage verlangt Kundenbezug im Body");
    }
  }

  if (/^\/apigateway\/article-tenant\/articles\/[^/]+\/supplier-assignments$/.test(pathname)) {
    if (!policy.allowArticleSetup) {
      throw new WriteLabAbort("Artikellieferant-Setup ist ohne explizite Freigabe blockiert");
    }
    if (Array.isArray(request.body) && request.body.length !== 1) {
      throw new WriteLabAbort("Artikellieferant-Setup verlangt genau eine Lieferantenzuordnung");
    }
    const body = Array.isArray(request.body) ? asRecord(request.body[0]) : asRecord(request.body);
    if (!textField(body, "articleId") || !textField(body, "supplierId")) {
      throw new WriteLabAbort("Artikellieferant-Setup verlangt articleId und supplierId");
    }
    const pathArticleId = decodeURIComponent(request.path.split("/").at(-2) || "");
    if (pathArticleId && textField(body, "articleId") !== pathArticleId) {
      throw new WriteLabAbort("Artikellieferant-Setup verlangt passende articleId im Pfad und Body");
    }
  }

  if (pathname.endsWith("/email")) {
    if (!policy.allowMailPrepare) throw new WriteLabAbort("Externe Mail-/PDF-Vorbereitung ist ohne explizite Freigabe blockiert");
    const body = asRecord(request.body);
    if (body.send === true || body.sendMail === true || body.externalSend === true) {
      throw new WriteLabAbort("Externer E-Mail-Versand ist blockiert");
    }
    if (body.createMailFile !== true) throw new WriteLabAbort("Mail-Schritt darf nur createMailFile:true vorbereiten");
  }

  if (pathname === "/apigateway/wawi/order-proposals/to-order") {
    const body = asRecord(request.body);
    if (body.includeAll !== false) throw new WriteLabAbort("to-order verlangt includeAll:false");
    if (!Array.isArray(body.selections) || body.selections.length === 0) {
      throw new WriteLabAbort("to-order verlangt explizite selections");
    }
  }

  if (pathname === "/apigateway/wawi/orders/from-proposal") {
    const body = asRecord(request.body);
    const proposals = asRecord(body.proposals);
    if (proposals.includeAll !== false) throw new WriteLabAbort("orders/from-proposal verlangt proposals.includeAll:false");
    if (!Array.isArray(proposals.selections) || proposals.selections.length === 0) {
      throw new WriteLabAbort("orders/from-proposal verlangt explizite proposal selections");
    }
    if (!textField(body, "supplierId")) throw new WriteLabAbort("orders/from-proposal verlangt supplierId");
  }

  if (pathname === "/apigateway/wawiservice/order-arrival/book") {
    if (!policy.allowGoodsReceipt) throw new WriteLabAbort("Wareneingang ist ohne explizite Freigabe blockiert");
    const body = asRecord(request.body);
    const selection = asRecord(body.filteredSelection);
    if (selection.includeAll !== false || !Array.isArray(selection.selections) || selection.selections.length === 0) {
      throw new WriteLabAbort("Wareneingang verlangt explizite filteredSelection");
    }
    if (selection.selections.length !== 1) throw new WriteLabAbort("Wareneingang verlangt genau eine Positionsauswahl");
    for (const key of ["orderNumber", "deliveryNr", "filialeId", "storageLocationId", "editorId"] as const) {
      if (!textField(body, key)) throw new WriteLabAbort(`Wareneingang verlangt ${key}`);
    }
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new WriteLabAbort("Wareneingang verlangt positive Menge");
  }
}

export function uniqueExactMatch<T>(items: T[], expected: string, valuesForItem: (item: T) => unknown[], label: string): T {
  const matches = exactMatches(items, expected, valuesForItem);

  if (matches.length !== 1) {
    throw new WriteLabAbort(`${label} nicht eindeutig: ${matches.length} Treffer fuer "${expected}"`);
  }

  return matches[0];
}

function exactMatches<T>(items: T[], expected: string, valuesForItem: (item: T) => unknown[]): T[] {
  const normalizedExpected = normalizeText(expected);
  return items.filter((item) =>
    valuesForItem(item)
      .map((value) => normalizeText(value))
      .some((value) => value === normalizedExpected),
  );
}

export function createWriteLabLogPath(date = new Date()): string {
  const dir = path.join(workspaceRoot, "logs", "network");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${formatLocalTimestamp(date)}-write-lab.jsonl`);
}

export function writeWriteLabReport(result: WriteLabResult, outputFile = defaultReportFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildWriteLabReportMarkdown(result));
  return outputFile;
}

export function buildWriteLabReportMarkdown(result: WriteLabResult): string {
  const redacted = redactRecord(result) as WriteLabResult;
  const lines = [
    "# Write-Lab Report",
    "",
    `Szenario: \`${redacted.scenario}\``,
    `Status: ${redacted.status}`,
    `Start: ${redacted.startedAt}`,
    `Ende: ${redacted.completedAt}`,
    `Testkunde: ${redacted.testObjects.customer}`,
    `Testartikel: ${redacted.testObjects.article}`,
    "",
    "## Ergebnis",
    "",
    redacted.abortReason ? `- Abbruchgrund: ${redacted.abortReason}` : "- Abbruchgrund: keiner",
    `- Erzeugte IDs: \`${inlineJson(redacted.generatedIds)}\``,
    "",
    "## Schritte",
    "",
    "| Schritt | Endpoint | Status | Testobjekt-Zuordnung | Erzeugte IDs | Read-back | Abbruchgrund |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const step of redacted.steps) {
    lines.push(
      `| ${escapeTable(step.name)} | ${escapeTable(step.endpoint || "-")} | ${step.status} | \`${inlineJson(step.testObjectMapping || {})}\` | \`${inlineJson(step.generatedIds || {})}\` | ${escapeTable(step.readBack || "-")} | ${escapeTable(step.abortReason || "-")} |`,
    );
  }

  lines.push(
    "",
    "## Guardrails",
    "",
    "- Keine Deletes, Stornos, Imports oder Uploads.",
    "- Selection-Writes nur mit `includeAll:false` und expliziten IDs.",
    "- Keine externe E-Mail; Mail/PDF nur lokale Vorbereitung mit expliziter Freigabe.",
    "- `process-order` erst nach eindeutigem Read-back der erzeugten Bestellung.",
    "",
  );
  return `${lines.join("\n")}`;
}

export async function runWriteLabCli(argv = process.argv.slice(2)): Promise<WriteLabResult> {
  const options = parseWriteLabArgs(argv);
  options.outputFile ||= createWriteLabLogPath();
  let connection: Awaited<ReturnType<typeof connectOrLaunchPage>> | null = null;
  let recorder: ReturnType<typeof attachNetworkLogger> | null = null;
  let currentStep: string | null = null;
  let result: WriteLabResult | null = null;

  try {
    connection = await connectOrLaunchPage(options);
    if (options.waitForLogin) {
      await waitForLoginGate(connection.page, 10 * 60 * 1000);
    }

    recorder = attachNetworkLogger(connection.page, {
      ...options,
      outputFile: options.outputFile,
      getCurrentStep: () => currentStep,
    });

    console.log("=".repeat(72));
    console.log("Write-Lab aktiv. Der Runner stoppt vor Writes ohne eindeutige Testdaten.");
    console.log(`JSONL: ${recorder.logFile}`);
    console.log(`Testkunde: ${options.testCustomer}`);
    console.log(`Testartikel: ${options.testArticle}`);
    console.log("=".repeat(72));

    const client = createBrowserApiClient(connection.page, {
      baseUrl: options.baseUrl,
      authInput: options.authInput,
    });

    result = await runWriteLabScenario(client, {
      ...options,
      page: connection.page,
      onMarker(marker, step) {
        if (marker === "step-start") currentStep = step.name;
        appendMarker(recorder!.logFile, {
          type: "flow-marker",
          sessionId: recorder!.sessionId,
          marker,
          step: step.name,
          endpoint: step.endpoint || null,
          status: step.status,
          timestamp: new Date().toISOString(),
        });
        if (marker === "step-end") currentStep = null;
      },
    });

    await waitForSettledNetwork(connection.page);
  } finally {
    recorder?.stop();
    await connection?.close();
  }

  if (!result) throw new Error("Write-Lab wurde nicht gestartet");
  if (recorder?.logFile) {
    result.logFile = recorder.logFile;
    result.flowMappingFile = defaultMappingFile;
    writeFlowMapping(recorder.logFile, defaultMappingFile);
    result.flowReportFile = writeFlowReport(recorder.logFile, defaultRecordingsDir, {
      knownCatalogFile: defaultCatalogFile,
    });
    rebuildApiCatalog();
  }
  result.reportFile = writeWriteLabReport(result, defaultReportFile);
  console.log(`Write-Lab-Report: ${result.reportFile}`);
  if (result.flowReportFile) console.log(`Flow-Report: ${result.flowReportFile}`);
  if (result.logFile) console.log(`JSONL: ${result.logFile}`);
  if (result.status !== "completed") process.exitCode = 1;
  return result;
}

async function resolveTestCustomer(
  client: WriteLabClient,
  expectedCustomer: string,
): Promise<{ row: Record<string, unknown>; keyword: string; candidateCount: number }> {
  const keywords = customerLookupTerms(expectedCustomer);
  for (const keyword of keywords) {
    const payload = await client.request({
      method: "GET",
      path: "/apigateway/kunden/customers/search",
      query: {
        active: true,
        keywords: keyword,
        page: 0,
        size: 50,
      },
    });
    const rows = contentItems(payload);
    const resolved = uniqueCustomerMatch(rows, expectedCustomer);
    if (resolved) return { row: resolved.row, keyword, candidateCount: rows.length };
  }

  for (const keyword of keywords) {
    const payload = await client.request({
      method: "POST",
      path: "/apigateway/sales/salesprocesses/search",
      query: {
        page: 0,
        size: 10,
        sort: "date,desc",
      },
      body: {
        keywords: keyword,
        active: true,
      },
    });
    const rows = contentItems(payload);
    const resolved = uniqueCustomerMatch(rows, expectedCustomer);
    if (resolved) {
      const salesProcess = resolved.row;
      return {
        row: {
          ...salesProcess,
          id: resolved.customerId,
          salesProcess,
          salesProcessId: idOf(salesProcess),
          filialeId: textField(salesProcess, "filialeId"),
        },
        keyword,
        candidateCount: rows.length,
      };
    }
  }

  throw new WriteLabAbort(`Kunde nicht eindeutig: 0 Treffer fuer "${expectedCustomer}"`);
}

function uniqueCustomerMatch(
  rows: Record<string, unknown>[],
  expectedCustomer: string,
): { row: Record<string, unknown>; customerId: string; matchCount: number } | null {
  const matches = exactMatches(rows, expectedCustomer, customerMatchValues);
  if (matches.length === 0) return null;

  const customerIds = uniqueStrings(matches.map(customerIdOf).filter(Boolean));
  if (customerIds.length !== 1) {
    throw new WriteLabAbort(`Kunde nicht eindeutig: ${matches.length} Treffer fuer "${expectedCustomer}"`);
  }

  return {
    row: matches[0],
    customerId: customerIds[0],
    matchCount: matches.length,
  };
}

function customerIdOf(value: unknown): string {
  const record = asRecord(value);
  return (
    textField(record, "customerId") ||
    textField(asRecord(record.customer), "id") ||
    textField(record, "kundeId") ||
    textField(record, "id") ||
    textField(record, "uuid")
  );
}

function customerLookupTerms(expectedCustomer: string): string[] {
  const terms: string[] = [];
  const push = (value: string | undefined) => {
    const text = String(value || "").trim();
    if (text && !terms.some((term) => normalizeText(term) === normalizeText(text))) terms.push(text);
  };

  push(expectedCustomer);
  const parts = String(expectedCustomer || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length > 1) {
    push(parts.at(-1));
    push(parts[0]);
  }

  return terms;
}

async function searchArticle(client: WriteLabClient, keyword: string): Promise<Record<string, unknown>[]> {
  const primary = await client.request({
    method: "POST",
    path: "/apigateway/articletenantservice/articles/simple-search",
    query: { page: 0, size: 20 },
    body: {
      dataOrigin: ["LOCAL"],
      keywords: keyword,
      active: true,
      useDescriptionOnlyMultiKeywords: true,
    },
  });
  const primaryItems = contentItems(primary);
  if (primaryItems.length > 0) return primaryItems;

  const fallback = await client.request({
    method: "POST",
    path: "/apigateway/article-tenant/articles/search",
    query: { page: 0, size: 20 },
    body: {
      listType: "ARTICLE",
      size: 20,
      dataOrigin: [],
      keywords: keyword,
      active: true,
    },
  });
  return contentItems(fallback);
}

async function hydrateArticle(client: WriteLabClient, article: Record<string, unknown>): Promise<Record<string, unknown>> {
  const articleId = idOf(article);
  if (!articleId) return {};

  for (const detailPath of [
    `/apigateway/articletenantservice/articles/${encodeURIComponent(articleId)}`,
    `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}`,
  ]) {
    try {
      return asRecord(await client.request({ method: "GET", path: detailPath }));
    } catch {
      // Detailendpunkte sind in Aufzeichnungen nicht immer konsistent; Suchtreffer bleibt die sichere Basis.
    }
  }

  return {};
}

async function prepareArticleOrderContext(
  client: WriteLabClient,
  article: Record<string, unknown>,
  options: WriteLabOptions,
): Promise<Record<string, unknown>> {
  const articleId = idOf(article);
  if (!articleId) return article;

  let assignments = await readArticleSupplierAssignments(client, articleId);
  if (assignments.length === 0 && options.allowArticleSetup) {
    await createArticleSupplierAssignment(client, article, options);
    assignments = await readArticleSupplierAssignments(client, articleId);
  }

  const assignment = preferredSupplierAssignment(assignments);
  if (!assignment) return article;

  return {
    ...article,
    supplierAssignment: assignment,
    supplierId: textField(assignment, "supplierId") || textField(article, "supplierId"),
    unit: orderUnitOf({ ...article, supplierAssignment: assignment }) || textField(article, "unit"),
    orderValue: orderValueOf({ ...article, supplierAssignment: assignment }) ?? numberField(article, "orderValue"),
  };
}

async function readArticleSupplierAssignments(client: WriteLabClient, articleId: string): Promise<Record<string, unknown>[]> {
  const payload = await client.request({
    method: "GET",
    path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/supplier-assignments`,
    query: { page: 0, size: 1000 },
  });
  return contentItems(payload);
}

async function createArticleSupplierAssignment(
  client: WriteLabClient,
  article: Record<string, unknown>,
  options: WriteLabOptions,
): Promise<Record<string, unknown>> {
  const articleId = idOf(article);
  const supplierKeyword = producerSupplierKeyword(article);
  if (!articleId) throw new WriteLabAbort("article-supplier-setup-article-id-missing");
  if (!supplierKeyword) throw new WriteLabAbort("article-supplier-setup-producer-missing");

  const supplier = await findUniqueSupplier(client, supplierKeyword);
  const purchasePriceActual = orderValueOf(article);
  if (!Number.isFinite(Number(purchasePriceActual))) {
    throw new WriteLabAbort("article-supplier-setup-purchase-price-missing");
  }

  const assignment = {
    purchasePrice: purchasePriceActual,
    unitSell: orderUnitOf(article) || "PIECE",
    discount: null,
    computePurchasePriceActual: true,
    purchasePriceActual,
    vatRateBuy: null,
    minimumBulkQuantity: null,
    unitBuy: null,
    unitSize: null,
    computeBulkPurchasePrice: true,
    base: "PURCHASE_PRICE",
    bulkPrices: [],
    id: null,
    articleId,
    supplierId: idOf(supplier),
    orderNr: null,
    mainSupplier: true,
    supplier: null,
    active: true,
    pricesActive: true,
    hasBulkPrices: false,
  };

  return guardedRequest(
    client,
    {
      method: "POST",
      path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/supplier-assignments`,
      body: [assignment],
    },
    { allowArticleSetup: options.allowArticleSetup },
  );
}

async function findUniqueSupplier(client: WriteLabClient, keyword: string): Promise<Record<string, unknown>> {
  const payload = await client.request({
    method: "GET",
    path: "/apigateway/supplier/suppliers/search",
    query: { active: true, keywords: keyword, page: 0, size: 20, sort: "name,asc" },
  });
  return uniqueExactMatch(contentItems(payload), keyword, supplierMatchValues, "Lieferant");
}

async function searchOrderProposals(client: WriteLabClient, options: WriteLabOptions): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (const keyword of [options.testArticle, options.testCustomer]) {
    const payload = await client.request({
      method: "POST",
      path: "/apigateway/wawi/order-proposals/search",
      query: { page: 0, size: 25, sort: "articleDescription,desc" },
      body: { keywords: keyword, active: true },
    });
    rows.push(...contentItems(payload));
  }
  return rows;
}

async function searchSalesProcessesForCustomer(
  client: WriteLabClient,
  customer: Record<string, unknown>,
  query: string,
): Promise<Record<string, unknown>[]> {
  const payload = await client.request({
    method: "POST",
    path: "/apigateway/sales/salesprocesses/search",
    query: { page: 0, size: 20, sort: "date,desc" },
    body: {
      keywords: query,
      active: true,
    },
  });
  return contentItems(payload).filter((row) => proposalMatchesCustomer(row, customer, query));
}

async function clickWriteUiCandidate(
  page: any,
  clickThrottle: ReturnType<typeof createAutomatedClickThrottle>,
  criteria: { label?: string; labels?: string[]; roles?: string[] },
  options: Pick<WriteLabOptions, "uiSettleMs">,
): Promise<void> {
  const rawLabels = criteria.labels || (criteria.label ? [criteria.label] : []);
  const expectedLabels = rawLabels.map((label) => normalizeText(label));
  const expectedRoles = (criteria.roles || []).map((role) => normalizeText(role));
  const labelForError = rawLabels[0] || "";
  const timeoutMs = writeUiCandidateTimeoutMs(options);
  const startedAt = Date.now();
  let matches: Awaited<ReturnType<typeof collectExploreCandidates>> = [];

  do {
    const candidates = await collectExploreCandidates(page);
    matches = candidates.filter((candidate) => {
      const label = normalizeText(candidate.text || candidate.ariaLabel || candidate.title || candidate.appTitle || "");
      const role = normalizeText(candidate.role || candidate.tag || "");
      if (!matchesWriteUiLabel(label, expectedLabels)) return false;
      if (expectedRoles.length === 0) return true;
      return expectedRoles.includes(role);
    });
    if (matches.length !== 0 || timeoutMs <= 0) break;
    await page.waitForTimeout?.(500);
  } while (Date.now() - startedAt < timeoutMs);

  if (matches.length !== 1) {
    throw new WriteLabAbort(`UI-Ziel nicht eindeutig: ${labelForError} (${matches.length} Treffer)`);
  }

  const selector = matches[0].selector;
  if (!selector) throw new WriteLabAbort(`UI-Ziel ohne Selector: ${labelForError}`);

  await runThrottledAutomatedClick(page, clickThrottle, async () => {
    await page.locator(selector).click({ timeout: 5000 });
  });
  await waitForWriteUiSettled(page, options.uiSettleMs);
}

function matchesWriteUiLabel(label: string, expectedLabels: string[]): boolean {
  return expectedLabels.some((expectedLabel) => label === expectedLabel || label.endsWith(` ${expectedLabel}`));
}

function writeUiCandidateTimeoutMs(options: Pick<WriteLabOptions, "uiSettleMs">): number {
  if (options.uiSettleMs !== undefined && options.uiSettleMs <= 0) return 0;
  return Math.max(8000, options.uiSettleMs ?? 1200);
}

async function waitForWriteUiSettled(page: any, timeoutMs = 1200): Promise<void> {
  if (timeoutMs <= 0) return;
  await page.waitForLoadState?.("networkidle", { timeout: timeoutMs }).catch(() => {});
  if (typeof page.waitForTimeout === "function") {
    await page.waitForTimeout(Math.min(timeoutMs, 1200));
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, Math.min(timeoutMs, 1200)));
}

function assertCustomerDetailContext(url: string, customerId: string): void {
  if (!customerId) throw new WriteLabAbort("customer-id-missing");
  const pathName = parseUrl(url).pathname;
  const expected = `/master-data/customers/${customerId}`;
  if (pathName !== expected) {
    throw new WriteLabAbort(`customer-detail-context-mismatch:${pathName}`);
  }
}

function assertNewSalesProcessDraftContext(url: string): void {
  if (!isNewSalesProcessDraftUrl(url)) {
    throw new WriteLabAbort(`sales-process-draft-context-mismatch:${parseUrl(url).pathname}`);
  }
}

function isNewSalesProcessDraftUrl(url: string): boolean {
  return parseUrl(url).pathname === "/transactions/new";
}

function salesProcessIdFromUrl(url: string): string {
  const match = parseUrl(url).pathname.match(/\/transactions\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match?.[1] || "";
}

async function waitForSalesProcessCreateResponse(page: any, timeoutMs: number): Promise<Record<string, unknown>> {
  if (typeof page?.waitForResponse !== "function") return {};
  try {
    const response = await page.waitForResponse((candidate: any) => {
      const method = String(candidate.request?.().method?.() || "").toUpperCase();
      const pathname = parseUrl(String(candidate.url?.() || "")).pathname;
      const status = Number(candidate.status?.() || 0);
      return method === "POST" && pathname === "/apigateway/sales/salesprocesses" && status >= 200 && status < 300;
    }, { timeout: timeoutMs });
    return responseBodyRecord(response);
  } catch {
    return {};
  }
}

function writeUiResponseTimeoutMs(options: Pick<WriteLabOptions, "uiSettleMs">): number {
  if (options.uiSettleMs !== undefined && options.uiSettleMs <= 0) return 1;
  return 8000;
}

async function responseBodyRecord(response: any): Promise<Record<string, unknown>> {
  try {
    if (typeof response?.json === "function") return asRecord(await response.json());
    if (typeof response?.text === "function") return asRecord(JSON.parse(await response.text()));
  } catch {
    return {};
  }
  return {};
}

function validateSalesProcessCreateResponse(
  salesProcess: Record<string, unknown>,
  customer: Record<string, unknown>,
  query: string,
): void {
  if (!idOf(salesProcess)) throw new WriteLabAbort("sales-process-id-missing");
  if (!salesProcessHasCustomerSignal(salesProcess)) return;
  validateSalesProcessForCustomer(salesProcess, customer, query);
}

function salesProcessHasCustomerSignal(salesProcess: Record<string, unknown>): boolean {
  return Boolean(
    salesProcessCustomerId(salesProcess) ||
      customerMatchValues(salesProcess).length > 0 ||
      customerMatchValues(asRecord(salesProcess.customer)).length > 0,
  );
}

function parseUrl(url: string): URL {
  try {
    return new URL(url, defaultBaseUrl);
  } catch {
    return new URL(defaultBaseUrl);
  }
}

async function guardedRequest<T = unknown>(
  client: WriteLabClient,
  request: WriteLabRequest,
  policy: { allowMailPrepare?: boolean; allowGoodsReceipt?: boolean; allowArticleSetup?: boolean; allowSalesProcessSave?: boolean; allowSalesProcessCreate?: boolean } = {},
): Promise<T> {
  assertSafeWriteRequest(request, policy);
  return client.request<T>(request);
}

function buildOrderProposalContext(
  customer: Record<string, unknown>,
  article: Record<string, unknown>,
  options: WriteLabOptions,
): Partial<OrderProposalContext> {
  const target = options.proposalContext || {};
  return {
    customerId: target.customerId || idOf(customer),
    salesProcessId:
      target.salesProcessId ||
      textField(customer, "salesProcessId") ||
      textField(customer, "currentSalesProcessId") ||
      textField(asRecord(customer.salesProcess), "id"),
    articleId: target.articleId || idOf(article),
    supplierId:
      target.supplierId ||
      textField(article, "supplierId") ||
      textField(article, "defaultSupplierId") ||
      textField(asRecord(article.supplier), "id") ||
      textField(asRecord(article.supplierAssignment), "supplierId"),
    filialeId:
      target.filialeId ||
      textField(article, "filialeId") ||
      textField(customer, "filialeId") ||
      textField(asRecord(customer.filiale), "id"),
    quantity: Number(target.quantity || options.quantity || 1),
    unit: target.unit || orderUnitOf(article) || "PIECE",
    orderValue: numberField(target, "orderValue") ?? orderValueOf(article) ?? undefined,
    pzn: target.pzn || textField(article, "pzn") || textField(article, "pharmacyNumber"),
  };
}

function missingProposalContext(context: Partial<OrderProposalContext>): string[] {
  const missing = [];
  for (const key of ["customerId", "salesProcessId", "articleId", "supplierId", "filialeId", "unit"] as const) {
    if (!textField(context, key)) missing.push(key);
  }
  if (!Number.isFinite(Number(context.quantity)) || Number(context.quantity) <= 0) missing.push("quantity");
  if (!Number.isFinite(Number(context.orderValue))) missing.push("orderValue");
  return missing;
}

function validateProposalForOrder(
  proposal: Record<string, unknown>,
  customer: Record<string, unknown>,
  article: Record<string, unknown>,
): void {
  const missing = [];
  if (!idOf(proposal)) missing.push("proposalId");
  if (!textField(proposal, "supplierId")) missing.push("supplierId");
  if (!proposalUnitOf(proposal) && !orderUnitOf(article)) missing.push("unit");
  if (!Number.isFinite(proposalQuantity(proposal)) || proposalQuantity(proposal) <= 0) missing.push("quantity");
  if (!proposalMatchesArticle(proposal, article, "")) missing.push("article-match");
  if (!proposalMatchesCustomer(proposal, customer, "")) missing.push("customer-match");
  if (missing.length > 0) throw new WriteLabAbort(`proposal-context-mismatch:${missing.join(",")}`);
}

function validateProposalSalesProcess(proposal: Record<string, unknown>, salesProcessId: string): void {
  if (!salesProcessId) return;
  if (!proposalMatchesPreferredSalesProcess(proposal, salesProcessId)) {
    throw new WriteLabAbort("proposal-sales-process-mismatch");
  }
}

function validateOrderReadBack(
  order: unknown,
  positions: Record<string, unknown>[],
  proposal: Record<string, unknown>,
  article: Record<string, unknown>,
): void {
  if (positions.length === 0) throw new WriteLabAbort("order-readback-positions-empty");
  const supplierId = textField(proposal, "supplierId");
  const orderSupplierId = textField(order, "supplierId");
  if (orderSupplierId && supplierId && orderSupplierId !== supplierId) {
    throw new WriteLabAbort("order-readback-supplier-mismatch");
  }

  const matchingPosition = positions.find((position) => positionMatchesArticle(position, article, proposal));
  if (!matchingPosition) throw new WriteLabAbort("order-readback-article-mismatch");

  const expectedPzn = textField(proposal, "pzn") || textField(article, "pzn");
  const actualPzn = textField(matchingPosition, "pzn");
  if (expectedPzn && actualPzn && expectedPzn !== actualPzn) throw new WriteLabAbort("order-readback-pzn-mismatch");

  const expectedUnits = uniqueStrings([proposalUnitOf(proposal), ...orderUnitCandidates(article)]);
  const actualUnit = textField(matchingPosition, "unit");
  if (expectedUnits.length > 0 && actualUnit && !expectedUnits.includes(actualUnit)) {
    throw new WriteLabAbort("order-readback-unit-mismatch");
  }

  const expectedQuantity = proposalQuantity(proposal);
  const actualQuantity = Number(matchingPosition.quantity);
  if (Number.isFinite(expectedQuantity) && Number.isFinite(actualQuantity) && expectedQuantity !== actualQuantity) {
    throw new WriteLabAbort("order-readback-quantity-mismatch");
  }
}

function orderArrivalMatchesOrder(row: Record<string, unknown>, orderId: string, orderNumber: string): boolean {
  const nestedOrder = asRecord(row.order);
  const ids = [
    textField(row, "orderId"),
    textField(row, "orderUuid"),
    textField(row, "purchaseOrderId"),
    textField(row, "purchaseOrderUuid"),
    textField(nestedOrder, "id"),
    textField(nestedOrder, "uuid"),
  ].filter(Boolean);
  if (orderId && ids.includes(orderId)) return true;

  const numbers = [
    textField(row, "orderNr"),
    textField(row, "orderNumber"),
    textField(row, "purchaseOrderNumber"),
    textField(row, "number"),
    textField(nestedOrder, "number"),
  ].filter(Boolean);
  return Boolean(orderNumber && numbers.includes(orderNumber));
}

function orderArrivalMapping(row: Record<string, unknown>): Record<string, unknown> {
  return {
    arrivalId: idOf(row),
    orderPositionId: goodsReceiptPositionId(row),
    orderId: textField(row, "orderId") || textField(row, "orderUuid") || textField(asRecord(row.order), "id"),
    orderNumber: textField(row, "orderNr") || textField(row, "orderNumber") || textField(row, "purchaseOrderNumber") || textField(row, "number") || textField(asRecord(row.order), "number"),
    supplierId: textField(row, "supplierId") || textField(asRecord(row.supplier), "id"),
    positionCount: contentItems(row.positions || row.orderArrivalPositions || row.items).length,
  };
}

function buildOrderArrivalSearchBody(order: Record<string, unknown>, orderId: string): Record<string, unknown> {
  const filialeId = textField(order, "filialeId");
  const supplierId = textField(order, "supplierId");
  const orderDate = textField(order, "orderDate") || textField(order, "timestampUpdated") || textField(order, "timestampCreated") || null;
  if (!filialeId) throw new WriteLabAbort("goods-receipt-search-filiale-missing");
  if (!supplierId) throw new WriteLabAbort("goods-receipt-search-supplier-missing");

  const externalFilter = {
    deliveryDateFrom: null,
    deliveryDateTo: null,
    deliveryDateScheduledFrom: null,
    deliveryDateScheduledTo: null,
    filialeIds: [filialeId],
    orderDateFrom: orderDate,
    orderDateTo: orderDate,
    orderId,
    orderStateIds: null,
    storageLocationIds: null,
    supplierCustomerIds: null,
    supplierId,
  };

  return {
    keywords: "*",
    active: true,
    externalFilter,
    externalFilterFormHeader: {
      deliveryDate: null,
      filialeId,
      storageLocationId: null,
    },
  };
}

function orderArrivalMatchesArticle(row: Record<string, unknown>, article: Record<string, unknown>, testArticle: string): boolean {
  const articleId = idOf(article);
  const ids = [textField(row, "articleId"), textField(asRecord(row.article), "id")].filter(Boolean);
  if (articleId && ids.includes(articleId)) return true;
  return articleMatchValues(row).some((value) => normalizeText(value) === normalizeText(testArticle));
}

function validateGoodsReceiptCandidate(
  row: Record<string, unknown>,
  orderId: string,
  orderNumber: string,
  article: Record<string, unknown>,
  testArticle: string,
): void {
  if (!orderArrivalMatchesOrder(row, orderId, orderNumber)) throw new WriteLabAbort("goods-receipt-order-mismatch");
  if (!orderArrivalMatchesArticle(row, article, testArticle)) throw new WriteLabAbort("goods-receipt-article-mismatch");
  if (!goodsReceiptPositionId(row)) throw new WriteLabAbort("goods-receipt-position-id-missing");
  const remaining = goodsReceiptRemainingQuantity(row);
  if (!Number.isFinite(remaining) || remaining <= 0) throw new WriteLabAbort("goods-receipt-no-remaining-quantity");
  const state = textField(row, "arrivalBookingState");
  if (state && !["NEW", "OPEN"].includes(state.toUpperCase())) {
    throw new WriteLabAbort(`goods-receipt-state-not-new:${state}`);
  }
}

async function resolveGoodsReceiptStorageLocation(
  client: WriteLabClient,
  filialeId: string,
): Promise<Record<string, unknown>> {
  if (!filialeId) throw new WriteLabAbort("goods-receipt-filiale-missing");
  const payload = await client.request({
    method: "GET",
    path: "/apigateway/wawi/storage-locations",
    query: { size: 2000 },
  });
  const matches = uniqueById(contentItems(payload)).filter((row) => storageLocationMatchesFiliale(row, filialeId));
  if (matches.length !== 1) throw new WriteLabAbort(`goods-receipt-storage-location-not-unique:${matches.length}`);
  return matches[0];
}

function storageLocationMatchesFiliale(row: Record<string, unknown>, filialeId: string): boolean {
  if (row.active === false) return false;
  if (textField(row, "filialeId") === filialeId) return true;
  const filialeIds = Array.isArray(row.filialeIds) ? row.filialeIds.map(String) : [];
  if (filialeIds.includes(filialeId)) return true;
  return contentItems(row.branches).some((branch) => idOf(branch) === filialeId);
}

function buildGoodsReceiptBookBody(
  candidate: Record<string, unknown>,
  order: Record<string, unknown>,
  storageLocation: Record<string, unknown>,
  options: WriteLabOptions,
): Record<string, unknown> {
  const remaining = goodsReceiptRemainingQuantity(candidate);
  const quantity = Number(options.quantity || 1);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > remaining) {
    throw new WriteLabAbort("goods-receipt-quantity-mismatch");
  }
  const orderNumber = textField(candidate, "orderNr") || textField(order, "number");
  const filialeId = textField(candidate, "filialeId") || textField(order, "filialeId");
  const editorId = textField(order, "editorId");
  const deliveryDate = (options.generatedAt || new Date()).toISOString();
  const deliveryNr = `WL-${orderNumber}-${formatLocalTimestamp(options.generatedAt || new Date()).replace(/\D/g, "")}`;

  return {
    orderNumber,
    deliveryDate,
    deliveryNr,
    filialeId,
    storageLocationId: idOf(storageLocation),
    applyToAllFiliale: false,
    quantity,
    salesProcessStatusId: null,
    versorgungsStatusId: null,
    comment: null,
    editorId,
    zeroRemainingAmount: false,
    performGoodsReceipt: true,
    filteredSelection: {
      includeAll: false,
      selections: [goodsReceiptPositionId(candidate)],
      filters: null,
    },
  };
}

function validateGoodsReceiptReadBack(positions: Record<string, unknown>[], candidate: Record<string, unknown>): void {
  const positionId = goodsReceiptPositionId(candidate);
  const position = positions.find((row) => idOf(row) === positionId || textField(row, "orderPositionId") === positionId);
  if (!position) throw new WriteLabAbort("goods-receipt-readback-position-missing");
  const remaining = numberField(position, "remainingQuantity") ?? numberField(position, "orderRemainingQuantity");
  const state = textField(position, "arrivalBookingState");
  if (Number.isFinite(Number(remaining)) && Number(remaining) >= goodsReceiptRemainingQuantity(candidate)) {
    throw new WriteLabAbort("goods-receipt-readback-remaining-not-reduced");
  }
  if (state && state.toUpperCase() === "NEW") throw new WriteLabAbort("goods-receipt-readback-state-new");
}

function goodsReceiptPositionId(row: Record<string, unknown>): string {
  return textField(row, "orderPositionId") || textField(row, "positionId") || idOf(row);
}

function goodsReceiptRemainingQuantity(row: Record<string, unknown>): number {
  return (
    numberField(row, "orderRemainingQuantity") ??
    numberField(row, "remainingQuantity") ??
    numberField(row, "orderQuantity") ??
    numberField(row, "quantity") ??
    Number.NaN
  );
}

function validateSalesProcessForCustomer(
  salesProcess: Record<string, unknown>,
  customer: Record<string, unknown>,
  query: string,
): void {
  if (!idOf(salesProcess)) throw new WriteLabAbort("sales-process-id-missing");
  if (!proposalMatchesCustomer(salesProcess, customer, query)) {
    throw new WriteLabAbort("sales-process-customer-mismatch");
  }
}

function validateSalesProcessNoopReadBack(before: Record<string, unknown>, after: Record<string, unknown>): void {
  for (const key of ["id", "customerId", "filialeId", "active"]) {
    const beforeValue = asRecord(before)[key];
    const afterValue = asRecord(after)[key];
    if (beforeValue !== undefined && afterValue !== undefined && beforeValue !== afterValue) {
      throw new WriteLabAbort(`sales-process-noop-${key}-mismatch`);
    }
  }

  const beforePositions = salesPositionIds(before);
  const afterPositions = salesPositionIds(after);
  if (beforePositions.length !== afterPositions.length) {
    throw new WriteLabAbort("sales-process-noop-position-count-mismatch");
  }
  for (let index = 0; index < beforePositions.length; index += 1) {
    if (beforePositions[index] && afterPositions[index] && beforePositions[index] !== afterPositions[index]) {
      throw new WriteLabAbort("sales-process-noop-position-id-mismatch");
    }
  }
}

function validateSalesProcessArticlePosition(
  salesProcess: Record<string, unknown>,
  customer: Record<string, unknown>,
  article: Record<string, unknown>,
  options: WriteLabOptions,
): Record<string, unknown> {
  validateSalesProcessForCustomer(salesProcess, customer, options.testCustomer);
  const quantity = positiveRuntimeQuantity(options.quantity);
  const matches = salesPositionRows(salesProcess).filter((position) =>
    salesPositionMatchesArticle(position, article, options.testArticle)
  );
  if (matches.length !== 1) throw new WriteLabAbort(`sales-position-readback-not-unique:${matches.length}`);
  const position = matches[0];
  const amount = salesPositionAmount(position);
  if (!Number.isFinite(amount) || amount !== quantity) {
    throw new WriteLabAbort(`sales-position-quantity-mismatch:${amount}`);
  }
  return position;
}

function validateSalesProcessMaterialPosition(
  salesProcess: Record<string, unknown>,
  customer: Record<string, unknown>,
  article: Record<string, unknown>,
  options: WriteLabOptions,
): Record<string, unknown> {
  validateSalesProcessForCustomer(salesProcess, customer, options.testCustomer);
  const quantity = positiveRuntimeQuantity(options.quantity);
  const matches = salesMaterialPositionRows(salesProcess).filter((position) =>
    salesPositionMatchesArticle(position, article, options.testArticle)
  );
  if (matches.length !== 1) throw new WriteLabAbort(`sales-material-position-readback-not-unique:${matches.length}`);
  const position = matches[0];
  const amount = salesPositionAmount(position);
  if (!Number.isFinite(amount) || amount !== quantity) {
    throw new WriteLabAbort(`sales-material-position-quantity-mismatch:${amount}`);
  }
  return position;
}

function salesProcessMapping(salesProcess: Record<string, unknown>): Record<string, unknown> {
  return {
    salesProcessId: idOf(salesProcess),
    customerId: salesProcessCustomerId(salesProcess),
    filialeId: textField(salesProcess, "filialeId"),
    positionCount: salesPositionRows(salesProcess).length,
    materialPositionCount: salesMaterialPositionRows(salesProcess).length,
  };
}

function salesProcessCustomerId(salesProcess: Record<string, unknown>): string {
  return textField(salesProcess, "customerId") || textField(asRecord(salesProcess.customer), "id") || textField(salesProcess, "kundeId");
}

function salesPositionIds(salesProcess: Record<string, unknown>): string[] {
  return salesPositionRows(salesProcess).map(idOf);
}

function salesPositionRows(salesProcess: Record<string, unknown>): Record<string, unknown>[] {
  const positions = asRecord(salesProcess).salesPositionList ?? asRecord(salesProcess).positions;
  return Array.isArray(positions) ? positions.map(asRecord) : [];
}

function salesMaterialPositionRows(salesProcess: Record<string, unknown>): Record<string, unknown>[] {
  const positions = asRecord(salesProcess).salesMaterialPositionList ?? asRecord(salesProcess).materialPositions;
  return Array.isArray(positions) ? positions.map(asRecord) : [];
}

function buildSalesPositionPricingRequest(
  salesProcess: Record<string, unknown>,
  article: Record<string, unknown>,
  quantity: number,
): Record<string, unknown> {
  const articleId = idOf(article);
  if (!articleId) throw new WriteLabAbort("sales-position-article-id-missing");
  const customerId = salesProcessCustomerId(salesProcess);
  if (!customerId) throw new WriteLabAbort("sales-position-customer-id-missing");

  return {
    searchId: articleId,
    hilfsmittelId: null,
    variante: null,
    leistungsdatum: textField(salesProcess, "deliveryDate") || textField(salesProcess, "date") || new Date().toISOString(),
    prescriptionDate: textField(salesProcess, "rezeptDate") || null,
    kostentraegerIk: textField(salesProcess, "kostentraegerIk") || null,
    leistungserbringerIk: textField(salesProcess, "filialeIkNumber") || null,
    articleDataOrigin: textField(article, "dataOrigin") || null,
    customerDateOfBirth: textField(salesProcess, "customerDateOfBirth") || null,
    customerId,
    zuzahlungBefreit: asRecord(salesProcess).zuzahlungsbefreit === true,
    mainPosition: null,
    parentPosition: null,
    producerId: textField(article, "producerId") || null,
    branchId: textField(salesProcess, "filialeId") || null,
    amount: quantity,
    unit: orderUnitOf(article) || null,
    notfallversorgung: asRecord(salesProcess).emergencyCare === true,
    salesProcessType: textField(salesProcess, "salesProcessType") || "SALES_PROCESS",
    customHilfsmittelkennzeichen: false,
    preisermittlung: textField(salesProcess, "preisermittlung") || "HMV",
    alternativeSellingPriceAvailable: false,
    selectedSellingPriceId: null,
  };
}

function prepareSalesPositionForSalesProcess(
  candidate: Record<string, unknown>,
  article: Record<string, unknown>,
  quantity: number,
  rowPosition: number,
): Record<string, unknown> {
  const position = cloneJson(candidate);
  position.id = null;
  position.articleId = idOf(article);
  position.articleNumber = textField(position, "articleNumber") || textField(article, "articleNumber") || textField(article, "number");
  position.articleDescription = textField(position, "articleDescription") || textField(article, "description") || textField(article, "articleDescription");
  position.articleDataOrigin = textField(position, "articleDataOrigin") || textField(article, "dataOrigin") || "LOCAL";
  position.amount = quantity;
  position.unit = textField(position, "unit") || orderUnitOf(article) || "PIECE";
  position.positionType = textField(position, "positionType") || "ARTICLE";
  position.rowPosition = rowPosition;
  if (position.mainPosition === undefined) position.mainPosition = null;
  if (position.parentPosition === undefined) position.parentPosition = null;
  return position;
}

function buildSalesMaterialPositionForSalesProcess(
  salesPosition: Record<string, unknown>,
  article: Record<string, unknown>,
  quantity: number,
  rowPosition: number,
): Record<string, unknown> {
  const articleId = idOf(article);
  if (!articleId) throw new WriteLabAbort("sales-material-position-article-id-missing");
  return {
    id: null,
    articleId,
    articleKitId: textField(salesPosition, "articleKitId") || null,
    articleNumber: textField(salesPosition, "articleNumber") || textField(article, "articleNumber") || textField(article, "number"),
    articleDescription:
      textField(salesPosition, "articleDescription") ||
      textField(article, "description") ||
      textField(article, "articleDescription"),
    articleEanCode: textField(salesPosition, "articleEanCode") || textField(article, "eanCode") || null,
    articleOrderNumber: textField(article, "orderNr") || textField(article, "articleOrderNumber") || null,
    articleColor: textField(salesPosition, "articleColor") || textField(article, "articleColor") || textField(article, "color") || null,
    articleSize: textField(salesPosition, "articleSize") || textField(article, "articleSize") || textField(article, "size") || null,
    articleSide: textField(salesPosition, "articleSide") || textField(article, "side") || null,
    amount: quantity,
    unit: textField(salesPosition, "unit") || orderUnitOf(article) || "PIECE",
    udi: textField(salesPosition, "udi") || null,
    positionText: textField(salesPosition, "positionText") || null,
    positionType: textField(salesPosition, "positionType") || "ARTICLE",
    rowPosition,
    orderDeliveryDate: null,
    orderDeliveryDateScheduled: null,
    orderState: null,
    stockBookingCharge: null,
    stockBookingSerialNumber: null,
    stockBookingDateBestBefore: null,
    stockQuantity: numberField(salesPosition, "stockQuantity") ?? numberField(article, "stockQuantity") ?? 0,
    storageLocationId: textField(salesPosition, "storageLocationId") || null,
    storageLocationFilialeId: textField(salesPosition, "storageLocationFilialeId") || null,
    orderProposalId: null,
  };
}

function salesPositionMatchesArticle(
  position: Record<string, unknown>,
  article: Record<string, unknown>,
  query: string,
): boolean {
  const expectedId = idOf(article);
  const actualIds = [textField(position, "articleId"), textField(asRecord(position.article), "id")].filter(Boolean);
  if (expectedId && actualIds.includes(expectedId)) return true;
  return articleMatchValues(position).some((value) => articleMatchValues(article).some((expected) => normalizeText(value) === normalizeText(expected))) ||
    Boolean(query && articleMatchValues(position).some((value) => normalizeText(value) === normalizeText(query)));
}

function salesPositionAmount(position: Record<string, unknown>): number {
  return numberField(position, "amount") ?? numberField(position, "quantity") ?? Number.NaN;
}

function salesPositionMapping(position: Record<string, unknown>): Record<string, unknown> {
  return {
    salesPositionId: idOf(position),
    articleId: textField(position, "articleId") || textField(asRecord(position.article), "id"),
    articleNumber: textField(position, "articleNumber"),
    amount: Number.isFinite(salesPositionAmount(position)) ? salesPositionAmount(position) : null,
    unit: textField(position, "unit"),
    rowPosition: numberField(position, "rowPosition") ?? null,
  };
}

function proposalMatchesCustomer(proposal: Record<string, unknown>, customer: Record<string, unknown>, query: string): boolean {
  const expectedId = idOf(customer);
  const ids = [textField(proposal, "customerId"), textField(asRecord(proposal.customer), "id"), textField(proposal, "kundeId")].filter(Boolean);
  if (ids.length > 0) return Boolean(expectedId && ids.includes(expectedId));

  const names = [
    ...customerMatchValues(proposal),
    ...customerMatchValues(asRecord(proposal.customer)),
    textField(proposal, "customerName"),
    textField(proposal, "customerFullName"),
  ];
  return query ? names.some((value) => normalizeText(value) === normalizeText(query)) : names.some(Boolean);
}

function proposalMatchesArticle(proposal: Record<string, unknown>, article: Record<string, unknown>, query: string): boolean {
  const expectedId = idOf(article);
  const ids = [textField(proposal, "articleId"), textField(asRecord(proposal.article), "id")].filter(Boolean);
  if (ids.length > 0) return Boolean(expectedId && ids.includes(expectedId));

  const names = [
    ...articleMatchValues(proposal),
    ...articleMatchValues(asRecord(proposal.article)),
    textField(proposal, "articleDescription"),
    textField(proposal, "description"),
  ];
  return query ? names.some((value) => normalizeText(value) === normalizeText(query)) : names.some(Boolean);
}

function proposalMatchesPreferredSalesProcess(proposal: Record<string, unknown>, salesProcessId: string): boolean {
  if (!salesProcessId) return true;
  return textField(proposal, "salesProcessId") === salesProcessId || textField(asRecord(proposal.salesProcess), "id") === salesProcessId;
}

function selectSalesProcessForCustomer(
  rows: Record<string, unknown>[],
  customer: Record<string, unknown>,
  query: string,
  preferredSalesProcessId = "",
): { row: Record<string, unknown>; candidateCount: number; strategy: string } {
  const matching = rows.filter((row) => proposalMatchesCustomer(row, customer, query));
  if (matching.length === 0) {
    throw new WriteLabAbort(`Sales-Process nicht eindeutig: 0 Treffer fuer "${query}"`);
  }
  if (preferredSalesProcessId) {
    const preferred = matching.filter((row) => idOf(row) === preferredSalesProcessId);
    if (preferred.length !== 1) {
      throw new WriteLabAbort(`Sales-Process nicht eindeutig: ${preferred.length} Treffer fuer bevorzugten Vorgang`);
    }
    return {
      row: preferred[0],
      candidateCount: matching.length,
      strategy: "preferred-sales-process",
    };
  }
  if (matching.length === 1) {
    return { row: matching[0], candidateCount: 1, strategy: "single-match" };
  }

  const candidates = matching
    .filter((row) => asRecord(row).active !== false)
    .filter((row) => textField(row, "filialeId"))
    .sort(compareSalesProcessRows);

  if (candidates.length === 0) {
    throw new WriteLabAbort(`Sales-Process nicht eindeutig: ${matching.length} Treffer fuer "${query}", kein aktiver Treffer mit Filiale`);
  }

  return {
    row: candidates[0],
    candidateCount: matching.length,
    strategy: "latest-active-with-filiale",
  };
}

function compareSalesProcessRows(a: Record<string, unknown>, b: Record<string, unknown>): number {
  const dateDelta = timestampOf(b) - timestampOf(a);
  if (dateDelta !== 0) return dateDelta;
  return Number(textField(b, "number") || 0) - Number(textField(a, "number") || 0);
}

function timestampOf(value: Record<string, unknown>): number {
  const parsed = Date.parse(textField(value, "date"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function positionMatchesArticle(
  position: Record<string, unknown>,
  article: Record<string, unknown>,
  proposal: Record<string, unknown>,
): boolean {
  const expectedIds = [idOf(article), textField(proposal, "articleId")].filter(Boolean);
  const actualIds = [textField(position, "articleId"), textField(asRecord(position.article), "id")].filter(Boolean);
  if (expectedIds.length > 0 && actualIds.length > 0) return actualIds.some((id) => expectedIds.includes(id));

  const expectedPzn = textField(proposal, "pzn") || textField(article, "pzn");
  const actualPzn = textField(position, "pzn");
  if (expectedPzn && actualPzn) return expectedPzn === actualPzn;

  return articleMatchValues(position).some((value) => articleMatchValues(article).some((expected) => normalizeText(value) === normalizeText(expected)));
}

function proposalMapping(proposal: Record<string, unknown>): Record<string, unknown> {
  return {
    proposalId: idOf(proposal),
    customerId: textField(proposal, "customerId") || textField(asRecord(proposal.customer), "id"),
    articleId: textField(proposal, "articleId") || textField(asRecord(proposal.article), "id"),
    supplierId: textField(proposal, "supplierId"),
    pzn: textField(proposal, "pzn"),
    unit: proposalUnitOf(proposal),
    quantity: Number.isFinite(proposalQuantity(proposal)) ? proposalQuantity(proposal) : null,
  };
}

function proposalUnitOf(proposal: Record<string, unknown>): string {
  return textField(proposal, "orderQuantityUnit") || textField(proposal, "unit");
}

function proposalQuantity(proposal: Record<string, unknown>): number {
  const value = numberField(proposal, "orderQuantity") ?? numberField(proposal, "quantity");
  return value ?? Number.NaN;
}

function customerMatchValues(value: unknown): unknown[] {
  const record = asRecord(value);
  return [
    textField(record, "name"),
    textField(record, "fullName"),
    textField(record, "customerName"),
    textField(record, "displayName"),
    textField(record, "customerLastName"),
    textField(record, "customerFirstName"),
    textField(record, "lastName"),
    textField(record, "nachname"),
    [textField(record, "customerFirstName"), textField(record, "customerLastName")].filter(Boolean).join(" "),
    [textField(record, "firstName"), textField(record, "lastName")].filter(Boolean).join(" "),
    [textField(record, "vorname"), textField(record, "nachname")].filter(Boolean).join(" "),
  ].filter(Boolean);
}

function articleMatchValues(value: unknown): unknown[] {
  const record = asRecord(value);
  return [
    textField(record, "description"),
    textField(record, "articleDescription"),
    textField(record, "articleNumber"),
    textField(record, "number"),
    textField(record, "articleNo"),
    textField(record, "name"),
    textField(record, "articleName"),
    textField(record, "displayName"),
    textField(record, "shortDescription"),
  ].filter(Boolean);
}

function supplierMatchValues(value: unknown): unknown[] {
  const record = asRecord(value);
  return [
    textField(record, "name"),
    textField(record, "displayName"),
    textField(record, "label"),
    textField(record, "supplierName"),
  ].filter(Boolean);
}

function preferredSupplierAssignment(assignments: Record<string, unknown>[]): Record<string, unknown> | null {
  if (assignments.length === 0) return null;
  const main = assignments.filter((assignment) => asRecord(assignment).mainSupplier === true);
  if (main.length === 1) return main[0];
  if (assignments.length === 1) return assignments[0];
  return null;
}

function producerSupplierKeyword(article: Record<string, unknown>): string {
  const candidates = [
    textField(asRecord(article.producer), "label"),
    textField(asRecord(article.producer), "name"),
    textField(article, "producerLabel"),
    textField(article, "producerName"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const afterPipe = candidate.includes("|") ? candidate.split("|").pop() || candidate : candidate;
    const beforeComma = afterPipe.split(",")[0] || afterPipe;
    const cleaned = beforeComma.trim();
    if (cleaned) return cleaned;
  }
  return "";
}

function orderUnitOf(value: unknown): string {
  return orderUnitCandidates(value)[0] || "";
}

function orderUnitCandidates(value: unknown): string[] {
  const record = asRecord(value);
  const assignment = asRecord(record.supplierAssignment);
  const priceData = asRecord(record.priceData);
  return uniqueStrings([
    textField(record, "unit") ||
      textField(record, "orderUnit") ||
      textField(record, "baseUnit") ||
      textField(record, "unitSell") ||
      textField(record, "orderQuantityUnit"),
    textField(assignment, "unitSell") ||
      textField(assignment, "unitBuy"),
    textField(priceData, "unitSell") ||
      textField(priceData, "unitBuy") ||
      textField(priceData, "quantityUnit"),
  ]);
}

function orderValueOf(value: unknown): number | undefined {
  const record = asRecord(value);
  const assignment = asRecord(record.supplierAssignment);
  const priceData = asRecord(record.priceData);
  return (
    numberField(record, "orderValue") ??
    numberField(record, "purchasePriceActual") ??
    numberField(record, "purchasePrice") ??
    numberField(record, "price") ??
    numberField(assignment, "purchasePriceActual") ??
    numberField(assignment, "purchasePrice") ??
    numberField(priceData, "purchasePriceActual") ??
    numberField(priceData, "purchasePrice") ??
    numberField(priceData, "sellingPrice")
  );
}

function contentItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  for (const key of ["content", "items", "results", "data"]) {
    const child = record[key];
    if (Array.isArray(child)) return child.map(asRecord);
  }
  const nestedData = asRecord(record.data);
  if (Array.isArray(nestedData.content)) return nestedData.content.map(asRecord);
  return [];
}

function nestedContentItems(value: unknown): Record<string, unknown>[] {
  const outer = contentItems(value);
  const nested = outer.flatMap((item) => contentItems(item));
  return nested.length > 0 ? nested : outer;
}

function uniqueById(items: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const result = [];
  for (const item of items) {
    const key = idOf(item) || JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function idOf(value: unknown): string {
  const record = asRecord(value);
  for (const key of ["id", "uuid", "orderId", "orderUuid", "proposalId", "articleId", "customerId"]) {
    const value = textField(record, key);
    if (value) return value;
  }
  return "";
}

function containsIncludeAllTrue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsIncludeAllTrue);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "includeAll" && child === true) return true;
    if (containsIncludeAllTrue(child)) return true;
  }
  return false;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function textField(value: unknown, key: string): string {
  const child = asRecord(value)[key];
  return child === null || child === undefined ? "" : String(child).trim();
}

function numberField(value: unknown, key: string): number | undefined {
  const parsed = Number(asRecord(value)[key]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveRuntimeQuantity(value: unknown): number {
  const quantity = Number(value || 1);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new WriteLabAbort("quantity-invalid");
  return quantity;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function readProposalContext(file: string): Partial<OrderProposalContext> {
  if (!file || !fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return asRecord(parsed.writeLab || parsed.wawi || parsed.orderProposal || parsed) as Partial<OrderProposalContext>;
  } catch {
    return {};
  }
}

function readOptionalText(file: string | null): string {
  if (!file) return "";
  try {
    return fs.readFileSync(path.resolve(file), "utf8");
  } catch {
    return "";
  }
}

function rebuildApiCatalog(): void {
  const script = path.join(workspaceRoot, "tools", "build-api-catalog.ts");
  const result = spawnSync(process.execPath, [script], {
    cwd: workspaceRoot,
    stdio: "inherit",
  });
  if (result.status && result.status !== 0) {
    console.warn(`API-Katalog konnte nicht aktualisiert werden: Exit ${result.status}`);
  }
}

function inlineJson(value: unknown): string {
  return JSON.stringify(value ?? {}).replace(/`/g, "\\`");
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatLocalTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${min}`;
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function positiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class WriteLabAbort extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WriteLabAbort";
  }
}

if (isMainModule()) {
  runWriteLabCli().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
