import { appendMarker, waitForSettledNetwork } from "./network-recorder.ts";
import { createExplorerState, type ExplorerResult } from "./explorer/state.ts";
import { collectUiSnapshot } from "./explorer/ui-snapshot.ts";
import type { BrowserApiClient, BrowserApiRequest } from "./browser-api-client.ts";

export type TargetedAutoFlowClient = BrowserApiClient;

export const targetedAutoFlowNames = [
  "all-targeted-read",
  "wawi-order-arrival-position-info",
  "accounting-cash-book-read",
  "article-detail-read",
  "article-kit-read",
  "route-planning-read",
  "customer-cost-estimates-read",
] as const;

export type TargetedAutoFlowName = typeof targetedAutoFlowNames[number];

export type TargetedAutoFlowOptions = {
  flowName: string;
  client: TargetedAutoFlowClient;
  page: any;
  logFile: string;
  sessionId: string;
  settleMs: number;
  testCustomer: string;
  testArticle: string;
  setCurrentStep?: (step: string | null) => void;
};

type TargetedFlowContext = TargetedAutoFlowOptions & {
  state: ReturnType<typeof createExplorerState>;
  customer?: Record<string, unknown>;
  article?: Record<string, unknown>;
  salesProcess?: Record<string, unknown>;
  articleKit?: Record<string, unknown>;
  routePlanning?: Record<string, unknown>;
};

type TargetedFlowStepOutcome = {
  status?: "ok" | "skipped" | "error";
  message?: string;
  endpoint?: string;
  data?: Record<string, unknown>;
};

class TargetedFlowSkip extends Error {}

export function isTargetedAutoFlowName(value: string): value is TargetedAutoFlowName {
  return targetedAutoFlowNames.includes(value as TargetedAutoFlowName);
}

export function assertTargetedAutoFlowName(value: string): TargetedAutoFlowName {
  if (isTargetedAutoFlowName(value)) return value;
  throw new Error(`Unbekannter Auto-Flow: ${value}. Erlaubt: ${targetedAutoFlowNames.join(", ")}`);
}

export async function runTargetedAutoFlow(options: TargetedAutoFlowOptions): Promise<ExplorerResult> {
  const flowName = assertTargetedAutoFlowName(options.flowName);
  const state = createExplorerState({
    startUrl: pageUrl(options.page),
    logFile: options.logFile,
  });
  const context: TargetedFlowContext = { ...options, flowName, state };

  for (const name of expandFlowNames(flowName)) {
    try {
      await runNamedFlow(context, name);
    } catch (error) {
      const message = errorMessage(error);
      context.state.skipped.push({ label: name, reason: message });
      appendMarker(context.logFile, {
        type: "flow-marker",
        sessionId: context.sessionId,
        marker: "flow-skipped",
        flow: name,
        status: error instanceof TargetedFlowSkip ? "skipped" : "error",
        message,
        timestamp: new Date().toISOString(),
      });
      context.setCurrentStep?.(null);
    }
  }

  return state.finish({
    finalUrl: pageUrl(options.page),
    stopReason: "targeted-flow-completed",
  });
}

async function runNamedFlow(context: TargetedFlowContext, flowName: Exclude<TargetedAutoFlowName, "all-targeted-read">): Promise<void> {
  switch (flowName) {
    case "wawi-order-arrival-position-info":
      await runWawiOrderArrivalPositionInfoFlow(context);
      return;
    case "accounting-cash-book-read":
      await runAccountingCashBookReadFlow(context);
      return;
    case "article-detail-read":
      await runArticleDetailReadFlow(context);
      return;
    case "article-kit-read":
      await runArticleKitReadFlow(context);
      return;
    case "route-planning-read":
      await runRoutePlanningReadFlow(context);
      return;
    case "customer-cost-estimates-read":
      await runCustomerCostEstimatesReadFlow(context);
      return;
  }
}

function expandFlowNames(flowName: TargetedAutoFlowName): Array<Exclude<TargetedAutoFlowName, "all-targeted-read">> {
  if (flowName !== "all-targeted-read") return [flowName];
  return [
    "customer-cost-estimates-read",
    "article-detail-read",
    "article-kit-read",
    "wawi-order-arrival-position-info",
    "accounting-cash-book-read",
    "route-planning-read",
  ];
}

async function runCustomerCostEstimatesReadFlow(context: TargetedFlowContext): Promise<void> {
  await navigateIfPossible(context, "/master-data/customers");
  const customer = await ensureCustomer(context);
  const customerId = idOf(customer);

  await runStep(context, {
    name: "Kunde: eKV/Kostenvoranschlaege laden",
    endpoint: "GET /apigateway/ekv/cost-estimates",
    action: async () => {
      if (!customerId) throw new TargetedFlowSkip("customer-id-missing");
      await probe(context, {
        path: "/apigateway/ekv/cost-estimates",
        query: { customerId, page: 0, size: 20 },
      });
      await probe(context, {
        path: "/apigateway/ekv/cost-estimates/latest-approved",
        query: { customerId },
      });
      return { data: { customerId } };
    },
  });
}

async function runArticleKitReadFlow(context: TargetedFlowContext): Promise<void> {
  await navigateIfPossible(context, "/merchandise-management/article-management/article-kits");
  const articleKit = await runStep(context, {
    name: "Artikel: Musterartikel-Kit suchen",
    endpoint: "POST /apigateway/article-tenant/article-kits/search",
    action: async () => {
      const payload = await probe(context, {
        method: "POST",
        path: "/apigateway/article-tenant/article-kits/search",
        query: { page: 0, size: 20, sort: "articleKitNumber,asc" },
        body: { keywords: context.testArticle, active: true },
      });
      const row = uniqueExactMatch(contentItems(payload), context.testArticle, articleKitMatchValues);
      context.articleKit = row;
      return { data: { articleKitId: idOf(row) } };
    },
  });

  const kitId = idOf(articleKit || context.articleKit);
  if (!kitId) return;

  await runStep(context, {
    name: "Artikel: Kit-Details und Positionen laden",
    endpoint: "GET /apigateway/article-tenant/article-kits/{articleKitId}",
    action: async () => {
      await probe(context, { path: `/apigateway/article-tenant/article-kits/${encodeURIComponent(kitId)}` });
      await probe(context, { path: `/apigateway/article-tenant/article-kits/${encodeURIComponent(kitId)}/article-kit-positions` });
      await probe(context, { path: `/apigateway/article-tenant/article-kits/${encodeURIComponent(kitId)}/article-kit-material-positions` });
      await probe(context, { path: `/apigateway/article-tenant/article-kits/${encodeURIComponent(kitId)}/article-kit-positions/has-main-position` });
      return { data: { articleKitId: kitId } };
    },
  });

  await runStep(context, {
    name: "Artikel: Kit-Label-Vorschau laden",
    endpoint: "GET /apigateway/article-tenant/article-kit/generate-labels/{companyProfileId}/article-kits/{articleKitId}",
    action: async () => {
      const companyProfileId = await resolveCompanyProfileId(context);
      if (!companyProfileId) throw new TargetedFlowSkip("company-profile-id-missing");
      await probe(context, {
        path: `/apigateway/article-tenant/article-kit/generate-labels/${encodeURIComponent(companyProfileId)}/article-kits/${encodeURIComponent(kitId)}`,
      });
      return { data: { articleKitId: kitId, companyProfileId } };
    },
  });
}

async function runArticleDetailReadFlow(context: TargetedFlowContext): Promise<void> {
  await navigateIfPossible(context, "/merchandise-management/article-management/articles");
  const resolvedArticle = await ensureArticle(context);
  const article = context.article || resolvedArticle;
  const articleId = idOf(article);
  if (!articleId) throw new TargetedFlowSkip("article-id-missing");

  await runStep(context, {
    name: "Artikel: Stammdaten laden",
    endpoint: "GET /apigateway/article-tenant/articles/{articleId}",
    action: async () => {
      const payload = await probe(context, {
        path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}`,
      });
      context.article = {
        ...article,
        ...asRecord(payload),
      };
      return { data: { articleId } };
    },
  });

  await runStep(context, {
    name: "Artikel: Preisdaten laden",
    endpoint: "GET /apigateway/article-tenant/articles/{articleId}/price-data",
    action: async () => {
      await probe(context, { path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/price-data` });
      await probe(context, { path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/price-data/alternative-selling-prices` });
      const companyProfileId = await resolveCompanyProfileId(context);
      if (companyProfileId) {
        await probe(context, {
          path: `/apigateway/article-tenant/article/generate-labels/${encodeURIComponent(companyProfileId)}/articles/${encodeURIComponent(articleId)}`,
        });
      }
      return { data: { articleId, companyProfileId } };
    },
  });

  await runStep(context, {
    name: "Artikel: Warenwirtschaftsdaten laden",
    endpoint: "GET /apigateway/article-tenant/articles/{articleId}/merchandise-management-setting",
    action: async () => {
      await probe(context, { path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/merchandise-management-setting` });
      await probe(context, { path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/stock-data` });
      await probe(context, { path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/quantities` });
      const filialeId = await resolveFilialeId(context);
      if (filialeId) {
        await probe(context, { path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/details/${encodeURIComponent(filialeId)}` });
      }
      await probe(context, {
        path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/computed-order-value/1`,
        query: { unit: articleUnit(context.article || article) },
      });
      return { data: { articleId, filialeId } };
    },
  });

  await runStep(context, {
    name: "Artikel: Lieferantendaten laden",
    endpoint: "GET /apigateway/article-tenant/articles/{articleId}/supplier-assignments",
    action: async () => {
      await probe(context, {
        path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/supplier-assignments`,
        query: { page: 0, size: 1000 },
      });
      await probe(context, {
        path: `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}/supplier-assignments/has-main-supplier`,
      });
      return { data: { articleId } };
    },
  });

  await runStep(context, {
    name: "Artikel: Dokumente suchen",
    endpoint: "POST /apigateway/document/archive-documents/search",
    action: async () => {
      await probe(context, {
        method: "POST",
        path: "/apigateway/document/archive-documents/search",
        query: { page: 0, size: 10, sort: "description,asc" },
        body: {
          module: "ARTICLE_TENANT",
          migratedId: null,
          size: 10,
          sort: ["description,asc"],
          keywords: context.testArticle,
          description: { type: "contains" },
          fileName: { type: "contains" },
        },
      });
      return { data: { articleId } };
    },
  });
}

async function runWawiOrderArrivalPositionInfoFlow(context: TargetedFlowContext): Promise<void> {
  await navigateIfPossible(context, "/merchandise-management/order-management/order-arrival");
  const article = await ensureArticle(context);
  const customer = await ensureCustomer(context);
  let candidate: Record<string, unknown> | undefined;

  await runStep(context, {
    name: "Wawi: Wareneingang Kandidaten suchen",
    endpoint: "POST /apigateway/wawi/order-arrival/search",
    action: async () => {
      const payload = await probe(context, {
        method: "POST",
        path: "/apigateway/wawi/order-arrival/search",
        query: { page: 0, size: 20, sort: "orderNr,asc" },
        body: {
          keywords: context.testArticle,
          active: true,
        },
      });
      candidate = selectOrderArrivalCandidate(contentItems(payload), article, customer, context.testArticle);
      if (!candidate) throw new TargetedFlowSkip("order-arrival-candidate-missing");
      return { data: orderArrivalInfoBody(candidate) };
    },
  });

  await runStep(context, {
    name: "Wawi: Wareneingang Position-Info laden",
    endpoint: "POST /apigateway/wawi/order-arrival/position-info",
    action: async () => {
      if (!candidate) throw new TargetedFlowSkip("order-arrival-candidate-missing");
      const body = orderArrivalInfoBody(candidate);
      if (!body.orderPositionId) throw new TargetedFlowSkip("order-position-id-missing");
      await probe(context, {
        method: "POST",
        path: "/apigateway/wawi/order-arrival/position-info",
        body,
      });
      return { data: body };
    },
  });
}

async function runAccountingCashBookReadFlow(context: TargetedFlowContext): Promise<void> {
  await navigateIfPossible(context, "/cash-till/register/cash-book");

  await runStep(context, {
    name: "Kasse: Bons und Kassenbuchlisten laden",
    endpoint: "GET /apigateway/accounting/bons",
    action: async () => {
      await probe(context, {
        path: "/apigateway/accounting/bons",
        query: { page: 0, size: 20, sort: "created,desc" },
      });
      await probe(context, {
        path: "/apigateway/accounting/cash-book-entries/search",
        query: { page: 0, size: 20, sort: "bookingDate,desc" },
      });
      await probe(context, {
        path: "/apigateway/accounting/cash-books",
        query: { page: 0, size: 20 },
      });
      return {};
    },
  });
}

async function runRoutePlanningReadFlow(context: TargetedFlowContext): Promise<void> {
  await navigateIfPossible(context, "/hilfsmittelverwaltung/route-planning");
  const salesProcess = await ensureSalesProcess(context);
  const salesProcessNumber = textField(salesProcess, "number") || textField(salesProcess, "salesProcessNumber");

  await runStep(context, {
    name: "Route: Planungen zum Vorgang laden",
    endpoint: "GET /apigateway/hilfsmittel/route-plannings",
    action: async () => {
      const payload = await probe(context, {
        path: "/apigateway/hilfsmittel/route-plannings",
        query: salesProcessNumber ? { salesProcessNumber } : { page: 0, size: 20 },
      });
      const rows = contentItems(payload);
      context.routePlanning = rows.find((row) => idOf(row)) || context.routePlanning;
      return { data: { routePlanningId: idOf(context.routePlanning) } };
    },
  });

  const routePlanningId = idOf(context.routePlanning);
  if (!routePlanningId) return;

  await runStep(context, {
    name: "Route: Stopps und Details laden",
    endpoint: "GET /apigateway/hilfsmittel/route-plannings/{routePlanningUuid}/stops",
    action: async () => {
      await probe(context, { path: `/apigateway/hilfsmittel/route-plannings/${encodeURIComponent(routePlanningId)}` });
      await probe(context, { path: `/apigateway/hilfsmittel/route-plannings/${encodeURIComponent(routePlanningId)}/stops` });
      await probe(context, {
        method: "POST",
        path: `/apigateway/hilfsmittel/route-plannings/${encodeURIComponent(routePlanningId)}/stops/search`,
        query: { page: 0, size: 20 },
        body: { active: true },
      });
      return { data: { routePlanningId } };
    },
  });
}

async function ensureCustomer(context: TargetedFlowContext): Promise<Record<string, unknown>> {
  if (context.customer) return context.customer;
  const customer = await runStep(context, {
    name: "Testkunde eindeutig aufloesen",
    endpoint: "GET /apigateway/kunden/customers/search",
    action: async () => {
      for (const keyword of customerLookupTerms(context.testCustomer)) {
        const payload = await probe(context, {
          path: "/apigateway/kunden/customers/search",
          query: { active: true, keywords: keyword, page: 0, size: 50, sort: "lastName,asc" },
        });
        const resolved = uniqueCustomerMatch(contentItems(payload), context.testCustomer);
        if (resolved) {
          context.customer = resolved.row;
          return { data: { customerId: resolved.customerId, keyword } };
        }
      }

      for (const keyword of customerLookupTerms(context.testCustomer)) {
        const payload = await probe(context, {
          method: "POST",
          path: "/apigateway/sales/salesprocesses/search",
          query: { page: 0, size: 20, sort: "date,desc" },
          body: { keywords: keyword, active: true },
        });
        const resolved = uniqueCustomerMatch(contentItems(payload), context.testCustomer);
        if (resolved) {
          const salesProcess = resolved.row;
          context.customer = {
            ...salesProcess,
            id: resolved.customerId,
            salesProcess,
            salesProcessId: idOf(salesProcess),
            filialeId: textField(salesProcess, "filialeId"),
          };
          return { data: { customerId: resolved.customerId, keyword, salesProcessId: idOf(salesProcess) } };
        }
      }

      throw new TargetedFlowSkip("customer-not-unique-or-missing");
    },
  });
  if (!customer) throw new TargetedFlowSkip("customer-not-resolved");
  return customer;
}

async function ensureArticle(context: TargetedFlowContext): Promise<Record<string, unknown>> {
  if (context.article) return context.article;
  const article = await runStep(context, {
    name: "Musterartikel eindeutig aufloesen",
    endpoint: "POST /apigateway/articletenantservice/articles/simple-search",
    action: async () => {
      const payload = await probe(context, {
        method: "POST",
        path: "/apigateway/articletenantservice/articles/simple-search",
        query: { page: 0, size: 20 },
        body: {
          dataOrigin: ["LOCAL"],
          keywords: context.testArticle,
          active: true,
          useDescriptionOnlyMultiKeywords: true,
        },
      });
      let rows = contentItems(payload);
      if (rows.length === 0) {
        const fallback = await probe(context, {
          method: "POST",
          path: "/apigateway/article-tenant/articles/search",
          query: { page: 0, size: 20 },
          body: {
            listType: "ARTICLE",
            size: 20,
            dataOrigin: [],
            keywords: context.testArticle,
            active: true,
          },
        });
        rows = contentItems(fallback);
      }
      const row = uniqueExactMatch(rows, context.testArticle, articleMatchValues);
      context.article = row;
      return { data: { articleId: idOf(row) } };
    },
  });
  if (!article) throw new TargetedFlowSkip("article-not-resolved");
  return article;
}

async function ensureSalesProcess(context: TargetedFlowContext): Promise<Record<string, unknown>> {
  if (context.salesProcess) return context.salesProcess;
  const customer = await ensureCustomer(context);
  const salesProcess = await runStep(context, {
    name: "Vorgang zum Testkunden laden",
    endpoint: "POST /apigateway/sales/salesprocesses/search",
    action: async () => {
      const payload = await probe(context, {
        method: "POST",
        path: "/apigateway/sales/salesprocesses/search",
        query: { page: 0, size: 20, sort: "date,desc" },
        body: { keywords: context.testCustomer, active: true },
      });
      const customerId = idOf(customer);
      const rows = contentItems(payload).filter((row) => {
        const rowCustomerId = textField(row, "customerId") || textField(asRecord(row.customer), "id");
        return !customerId || !rowCustomerId || rowCustomerId === customerId;
      });
      const row = rows.find((item) => idOf(item)) || rows[0];
      if (!row) throw new TargetedFlowSkip("sales-process-missing");
      context.salesProcess = row;
      return { data: { salesProcessId: idOf(row), salesProcessNumber: textField(row, "number") || textField(row, "salesProcessNumber") } };
    },
  });
  if (!salesProcess) throw new TargetedFlowSkip("sales-process-not-resolved");
  return salesProcess;
}

async function resolveCompanyProfileId(context: TargetedFlowContext): Promise<string> {
  const preferences = await probe(context, {
    path: "/apigateway/userservice/companies/details/preferences",
  });
  return textField(preferences, "companyProfileId")
    || textField(preferences, "id")
    || textField(asRecord(preferences).companyProfile, "id")
    || textField(asRecord(preferences).company, "companyProfileId");
}

async function resolveFilialeId(context: TargetedFlowContext): Promise<string> {
  const payload = await probe(context, {
    path: "/apigateway/filiale/filialen",
  });
  const rows = contentItems(payload);
  const active = rows.find((row) => row.active !== false && idOf(row));
  return idOf(active || rows.find((row) => idOf(row)));
}

function articleUnit(article: Record<string, unknown>): string {
  const priceData = asRecord(article.priceData);
  return textField(article, "quantityUnit")
    || textField(article, "unitSell")
    || textField(priceData, "quantityUnit")
    || textField(priceData, "unitSell")
    || textField(priceData, "unitBuy")
    || "PIECE";
}

async function runStep<T extends Record<string, unknown> | void | undefined>(
  context: TargetedFlowContext,
  input: {
    name: string;
    endpoint?: string;
    action: () => Promise<TargetedFlowStepOutcome | T>;
  },
): Promise<T | undefined> {
  const timestamp = new Date().toISOString();
  context.setCurrentStep?.(input.name);
  appendMarker(context.logFile, {
    type: "flow-marker",
    sessionId: context.sessionId,
    marker: "step-start",
    step: input.name,
    endpoint: input.endpoint,
    timestamp,
  });
  context.state.recordClicked({
    kind: "detail",
    key: `targeted:${input.name}`,
    label: input.name,
    selector: "",
    path: input.endpoint || "",
    reason: "targeted-api-flow",
  });

  try {
    const rawOutcome = await input.action();
    const outcome = normalizeOutcome(rawOutcome);
    appendMarker(context.logFile, {
      type: "flow-marker",
      sessionId: context.sessionId,
      marker: "step-end",
      step: input.name,
      endpoint: outcome.endpoint || input.endpoint,
      status: outcome.status || "ok",
      message: outcome.message,
      data: outcome.data,
      timestamp: new Date().toISOString(),
    });
    return (outcome.data || rawOutcome) as T | undefined;
  } catch (error) {
    const status = error instanceof TargetedFlowSkip ? "skipped" : "error";
    const message = errorMessage(error);
    context.state.skipped.push({ label: input.name, path: input.endpoint, reason: message });
    appendMarker(context.logFile, {
      type: "flow-marker",
      sessionId: context.sessionId,
      marker: "step-end",
      step: input.name,
      endpoint: input.endpoint,
      status,
      message,
      timestamp: new Date().toISOString(),
    });
    return undefined;
  } finally {
    await waitForSettledNetwork(context.page, context.settleMs);
    await appendTargetedUiSnapshot(context, input.name);
    context.setCurrentStep?.(null);
  }
}

async function appendTargetedUiSnapshot(context: TargetedFlowContext, step: string): Promise<void> {
  try {
    const snapshot = await collectUiSnapshot(context.page, { step });
    context.state.recordUiSnapshot(snapshot);
    appendMarker(context.logFile, {
      type: "ui-snapshot",
      sessionId: context.sessionId,
      ...snapshot,
    });
  } catch (error) {
    appendMarker(context.logFile, {
      type: "flow-marker",
      sessionId: context.sessionId,
      marker: "ui-snapshot-error",
      step,
      timestamp: new Date().toISOString(),
      message: errorMessage(error),
    });
  }
}

function normalizeOutcome(value: unknown): TargetedFlowStepOutcome {
  if (value && typeof value === "object" && ("status" in value || "message" in value || "endpoint" in value || "data" in value)) {
    return value as TargetedFlowStepOutcome;
  }
  return { data: asRecord(value) };
}

async function probe<T = unknown>(context: TargetedFlowContext, request: BrowserApiRequest): Promise<T | undefined> {
  try {
    return await context.client.request<T>(request);
  } catch (error) {
    context.state.recordBlockedRequest({
      timestamp: new Date().toISOString(),
      method: (request.method || "GET").toUpperCase(),
      url: request.path,
      reason: errorMessage(error),
      resourceType: "fetch",
    });
    return undefined;
  }
}

async function navigateIfPossible(context: TargetedFlowContext, path: string): Promise<void> {
  const currentUrl = pageUrl(context.page);
  if (!currentUrl || !context.page.goto) return;
  try {
    const targetUrl = new URL(path, currentUrl).toString();
    await context.page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
    await waitForSettledNetwork(context.page, context.settleMs);
  } catch {
    // Navigation ist nur fuer UI-Kontext; API-Probes laufen auch ohne Route.
  }
}

function selectOrderArrivalCandidate(
  rows: Record<string, unknown>[],
  article: Record<string, unknown>,
  customer: Record<string, unknown>,
  testArticle: string,
): Record<string, unknown> | undefined {
  const articleId = idOf(article);
  const customerId = idOf(customer);
  return rows.find((row) => {
    const rowArticleId = textField(row, "articleId") || textField(asRecord(row.article), "id");
    const rowCustomerId = textField(row, "customerId") || textField(asRecord(row.customer), "id");
    const articleMatches = articleId && rowArticleId ? articleId === rowArticleId : articleMatchValues(row).some((value) => normalizeText(value) === normalizeText(testArticle));
    const customerMatches = !customerId || !rowCustomerId || rowCustomerId === customerId;
    return Boolean(articleMatches && customerMatches && textField(row, "orderPositionId"));
  }) || rows.find((row) => Boolean(textField(row, "orderPositionId")));
}

function orderArrivalInfoBody(row: Record<string, unknown>): Record<string, unknown> {
  return {
    orderId: textField(row, "orderId") || textField(row, "orderUuid") || textField(asRecord(row.order), "id"),
    orderPositionId: textField(row, "orderPositionId") || textField(row, "positionId") || textField(row, "orderManagementOrderPositionId"),
    articleId: textField(row, "articleId") || textField(asRecord(row.article), "id"),
  };
}

function uniqueExactMatch(
  items: Record<string, unknown>[],
  expected: string,
  valuesForItem: (item: Record<string, unknown>) => unknown[],
): Record<string, unknown> {
  const normalizedExpected = normalizeText(expected);
  const matches = items.filter((item) =>
    valuesForItem(item)
      .map((value) => normalizeText(value))
      .some((value) => value === normalizedExpected),
  );
  if (matches.length !== 1) throw new TargetedFlowSkip(`test-object-not-unique:${matches.length}`);
  return matches[0];
}

function uniqueCustomerMatch(
  rows: Record<string, unknown>[],
  expectedCustomer: string,
): { row: Record<string, unknown>; customerId: string } | null {
  const normalizedExpected = normalizeText(expectedCustomer);
  const matches = rows.filter((row) =>
    customerMatchValues(row)
      .map((value) => normalizeText(value))
      .some((value) => value === normalizedExpected),
  );
  if (matches.length === 0) return null;

  const customerIds = uniqueStrings(matches.map(customerIdOf).filter(Boolean));
  if (customerIds.length !== 1) throw new TargetedFlowSkip(`customer-not-unique:${matches.length}`);
  return { row: matches[0], customerId: customerIds[0] };
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

function customerIdOf(value: unknown): string {
  const record = asRecord(value);
  return textField(record, "customerId")
    || textField(asRecord(record.customer), "id")
    || textField(record, "kundeId")
    || textField(record, "id")
    || textField(record, "uuid");
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

function customerMatchValues(row: Record<string, unknown>): unknown[] {
  const firstName = textField(row, "firstName") || textField(row, "vorname");
  const lastName = textField(row, "lastName") || textField(row, "nachname");
  const salesFirstName = textField(row, "customerFirstName");
  const salesLastName = textField(row, "customerLastName");
  return [
    textField(row, "name"),
    textField(row, "fullName"),
    textField(row, "customerName"),
    textField(row, "customerFullName"),
    `${firstName} ${lastName}`.trim(),
    `${lastName} ${firstName}`.trim(),
    `${salesFirstName} ${salesLastName}`.trim(),
    `${salesLastName} ${salesFirstName}`.trim(),
    textField(row, "displayName"),
  ];
}

function articleMatchValues(row: Record<string, unknown>): unknown[] {
  return [
    textField(row, "articleNumber"),
    textField(row, "articleNr"),
    textField(row, "number"),
    textField(row, "description"),
    textField(row, "articleDescription"),
    textField(row, "producerDescription"),
  ];
}

function articleKitMatchValues(row: Record<string, unknown>): unknown[] {
  return [
    textField(row, "articleKitNumber"),
    textField(row, "number"),
    textField(row, "description"),
    textField(row, "articleDescription"),
    textField(row, "name"),
  ];
}

function contentItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord).filter((row) => Object.keys(row).length > 0);
  const record = asRecord(value);
  for (const key of ["content", "items", "data", "results", "rows"]) {
    const child = record[key];
    if (Array.isArray(child)) return child.map(asRecord).filter((row) => Object.keys(row).length > 0);
  }
  return Object.keys(record).length > 0 ? [record] : [];
}

function idOf(value: unknown): string {
  const record = asRecord(value);
  return textField(record, "id")
    || textField(record, "uuid")
    || textField(record, "customerId")
    || textField(record, "articleId")
    || textField(record, "articleKitId");
}

function textField(value: unknown, key: string): string {
  const child = asRecord(value)[key];
  return child === null || child === undefined ? "" : String(child).trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function pageUrl(page: any): string {
  try {
    return page.url?.() || "";
  } catch {
    return "";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
