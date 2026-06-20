import { demoData } from "./demo-data.mjs";

export function createProcurementService({ omniaClient } = {}) {
  const articleDetailsCache = new Map();

  async function listCases(session, options = {}) {
    const records = await sourceCases(session, options);
    return Promise.all(records.map((record) => toProcurementCase(record, session)));
  }

  async function getCase(session, caseId) {
    if (isExplicitLiveSession(session)) return getLiveCase(session, caseId);

    const records = await sourceCases(session);
    const record = findCaseRecord(records, caseId);
    if (!record) {
      const error = new Error("Bestellvorgang nicht gefunden");
      error.status = 404;
      throw error;
    }
    return toProcurementCase(record, session);
  }

  function getSupplierExport(record, supplierId) {
    const supplier = record.supplierGroups.find((group) => group.supplierId === supplierId);
    if (!supplier) {
      const error = new Error("Lieferantengruppe nicht gefunden");
      error.status = 404;
      throw error;
    }

    return {
      caseId: record.id,
      caseNumber: record.number,
      supplier,
      rows: supplier.items.map((item) => ({
        commission: record.customer.lastName,
        caseNumber: record.number,
        articleNumber: item.articleNumber,
        pzn: item.pzn,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        procurementReadiness: item.procurementReadiness,
      })),
    };
  }

  async function createSupplierOrderDraft(session, record, supplierId) {
    const supplier = getSupplierGroup(record, supplierId);
    const proposalIds = supplier.items.map((item) => item.id);
    const validationErrors = validateSupplierOrder(record, supplier);

    if (validationErrors.length) {
      const error = new Error("Bestellentwurf kann nicht erzeugt werden");
      error.status = 422;
      error.code = "ORDER_DRAFT_VALIDATION_FAILED";
      error.details = validationErrors;
      throw error;
    }

    if (isExplicitLiveSession(session)) {
      assertLiveSessionReady(session);
      return createLiveSupplierOrderDraft(session, record, supplier, proposalIds);
    }

    if (!isExplicitDemoSession(session)) throw unsupportedSessionSourceError();

    return {
      mode: "mock",
      stage: "draft",
      processed: false,
      proposalIds,
      order: createMockOrderDraft(record, supplier),
    };
  }

  return {
    listCases,
    getCase,
    getSupplierExport,
    createSupplierOrderDraft,
  };

  async function toProcurementCase(record, session) {
    const proposals = await Promise.all(record.proposals.map((proposal) => enrichProposal(session, proposal)));
    return {
      id: record.id,
      salesProcessId: record.salesProcessId,
      number: record.number,
      status: record.status,
      customer: { ...record.customer },
      deliveryAddress: { ...record.deliveryAddress },
      aggregationState: record.aggregationState,
      proposals,
      supplierGroups: groupBySupplier(proposals),
    };
  }

  async function enrichProposal(session, proposal) {
    const baseProposal = { ...proposal, pzn: normalizeText(proposal.pzn) };
    const supplierMissing = !normalizeText(baseProposal.supplierId) || !normalizeText(baseProposal.supplierName);

    if (baseProposal.pzn) {
      return {
        ...baseProposal,
        pznEnrichmentStatus: "present",
        articleDetailsSource: "proposal",
        procurementReadiness: supplierMissing ? "supplier_missing" : "ready_to_order",
      };
    }

    const articleDetails = await resolveArticleDetails(session, baseProposal.articleId);
    if (articleDetails?.liveLookupError) {
      return {
        ...baseProposal,
        pzn: "",
        pznEnrichmentStatus: "live_lookup_error",
        articleDetailsSource: articleDetails.source || "",
        procurementReadiness: "live_lookup_error",
        liveLookupError: {
          code: "LIVE_LOOKUP_ERROR",
          category: articleDetails.category,
        },
      };
    }

    const pzn = normalizeText(extractPzn(articleDetails));
    const articleNumber = normalizeText(baseProposal.articleNumber) || normalizeText(extractArticleNumber(articleDetails));
    const description = normalizeText(baseProposal.description) || normalizeText(extractArticleDescription(articleDetails));
    const pznEnrichmentStatus = pzn ? "enriched" : "missing";

    return {
      ...baseProposal,
      articleNumber,
      description,
      pzn,
      pznEnrichmentStatus,
      articleDetailsSource: articleDetails?.source || "",
      procurementReadiness: supplierMissing ? "supplier_missing" : pzn ? "ready_to_order" : "pzn_missing",
    };
  }

  async function resolveArticleDetails(session, articleId) {
    const normalizedArticleId = normalizeText(articleId);
    if (!normalizedArticleId) return null;
    const cacheKey = articleDetailsCacheKey(session, normalizedArticleId);
    if (articleDetailsCache.has(cacheKey)) return articleDetailsCache.get(cacheKey);

    let details = null;
    if (isExplicitLiveSession(session)) {
      assertLiveSessionReady(session);
      details = await loadLiveArticleDetails(session, normalizedArticleId);
    } else if (isExplicitDemoSession(session)) {
      const fixture = demoData.articleDetailsById?.[normalizedArticleId] || null;
      details = fixture ? { ...fixture, source: "demo-article-details" } : null;
    } else {
      throw unsupportedSessionSourceError();
    }

    articleDetailsCache.set(cacheKey, details);
    return details;
  }

  async function loadLiveArticleDetails(session, articleId) {
    const detailPaths = [
      `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}`,
      `/apigateway/articletenantservice/articles/${encodeURIComponent(articleId)}`,
    ];

    for (const path of detailPaths) {
      try {
        const payload = await omniaClient.request(session, { method: "GET", path });
        const article = unwrapContent(payload);
        return { ...article, source: path };
      } catch (error) {
        if (isNotFoundError(error)) continue;
        return liveArticleLookupError(error, path);
      }
    }

    return { lookupFailed: true, notFound: true, source: "omnia-article-details" };
  }

  async function createLiveSupplierOrderDraft(session, record, supplier, proposalIds) {
    const selection = {
      includeAll: false,
      selections: proposalIds,
      filters: null,
    };

    await omniaClient.request(session, {
      method: "POST",
      path: "/apigateway/wawi/order-proposals/to-order",
      body: selection,
    });

    const createdOrder = await omniaClient.request(session, {
      method: "POST",
      path: "/apigateway/wawi/orders/from-proposal",
      body: {
        proposals: selection,
        supplierId: supplier.supplierId,
      },
    });

    const orderId = normalizeText(createdOrder?.id || createdOrder?.orderId || createdOrder?.uuid);
    const hydratedOrder = orderId
      ? await omniaClient.request(session, { method: "GET", path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}` })
      : createdOrder;
    const positions = orderId
      ? await omniaClient.request(session, {
          method: "GET",
          path: `/apigateway/wawi/orders/${encodeURIComponent(orderId)}/positions`,
        })
      : supplier.items;

    return {
      mode: "live",
      stage: "draft",
      processed: false,
      proposalIds,
      order: normalizeLiveOrder(record, supplier, hydratedOrder || createdOrder, positions),
    };
  }

  async function sourceCases(session, { keywords = "" } = {}) {
    if (isExplicitDemoSession(session)) return demoData.procurementCases;
    if (!isExplicitLiveSession(session)) throw unsupportedSessionSourceError();

    assertLiveSessionReady(session);

    const payload = await omniaClient.request(session, {
      method: "POST",
      path: "/apigateway/wawi/order-proposals/search",
      query: {
        page: 0,
        size: 25,
        sort: "supplierName,asc",
      },
      body: {
        keywords: normalizeText(keywords),
        active: true,
      },
    });

    const proposalGroups = groupLiveProposalRows(asArrayContent(payload));
    return Promise.all(proposalGroups.map((rows) => hydrateLiveCaseRecord(session, rows)));
  }

  async function hydrateLiveCaseRecord(session, rows) {
    const first = rows[0] || {};
    const salesProcessId = firstText(first.salesProcessId);
    const salesProcessNumber = firstText(first.salesProcessNumber, first.number);
    const salesProcess = salesProcessId ? await loadLiveSalesProcess(session, salesProcessId) : null;
    const number = firstText(salesProcess?.number, salesProcessNumber);
    const aggregationState = salesProcessId || salesProcessNumber ? "complete" : "missing_sales_process_reference";

    return {
      id: salesProcessId || `procurement-${safeOrderKey(firstText(number, first.id))}`,
      salesProcessId,
      number,
      aggregationState,
      status: normalizeLiveStatus(first, salesProcess),
      customer: normalizeLiveCustomer(first, salesProcess),
      deliveryAddress: normalizeLiveDeliveryAddress(first, salesProcess),
      proposals: rows.map(toLiveProposal),
    };
  }

  async function loadLiveSalesProcess(session, salesProcessId) {
    try {
      return unwrapContent(
        await omniaClient.request(session, {
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
        }),
      );
    } catch (error) {
      if (error?.status === 404) return { lookupFailed: true };
      throw error;
    }
  }

  async function getLiveCase(session, caseId) {
    assertLiveSessionReady(session);
    const normalizedCaseId = normalizeText(caseId);
    let keywords = normalizedCaseId;

    if (looksLikeUuid(normalizedCaseId)) {
      const salesProcess = await loadRequiredLiveSalesProcess(session, normalizedCaseId);
      keywords = firstText(salesProcess?.number, salesProcess?.salesProcessNumber);
      if (!keywords) throw liveSourceIncompleteError("Salesprocess enthaelt keine dokumentierte Vorgangsnummer.");
    }

    const records = await sourceCases(session, { keywords });
    const record = findCaseRecord(records, normalizedCaseId);
    if (!record) {
      const error = new Error("Bestellvorgang nicht gefunden");
      error.status = 404;
      throw error;
    }

    return toProcurementCase(record, session);
  }

  async function loadRequiredLiveSalesProcess(session, salesProcessId) {
    try {
      return unwrapContent(
        await omniaClient.request(session, {
          method: "GET",
          path: `/apigateway/sales/salesprocesses/${encodeURIComponent(salesProcessId)}`,
        }),
      );
    } catch (error) {
      if (isNotFoundError(error)) {
        const notFound = new Error("Bestellvorgang nicht gefunden");
        notFound.status = 404;
        notFound.code = "LIVE_SALES_PROCESS_NOT_FOUND";
        notFound.retryable = false;
        throw notFound;
      }
      throw error;
    }
  }

  function assertLiveSessionReady(session) {
    if (!session?.omniaAccessToken) throw liveSessionMissingTokenError();
    if (!omniaClient) throw liveClientUnavailableError();
  }
}

function isExplicitLiveSession(session) {
  return session?.source === "live";
}

function isExplicitDemoSession(session) {
  return session?.source === "mock";
}

function findCaseRecord(records, caseId) {
  const normalizedCaseId = normalizeText(caseId);
  return records.find(
    (item) =>
      item.id === normalizedCaseId ||
      item.salesProcessId === normalizedCaseId ||
      item.number === normalizedCaseId ||
      `procurement-${safeOrderKey(item.number)}` === normalizedCaseId,
  );
}

function getSupplierGroup(record, supplierId) {
  const supplier = record.supplierGroups.find((group) => group.supplierId === supplierId);
  if (!supplier) {
    const error = new Error("Lieferantengruppe nicht gefunden");
    error.status = 404;
    throw error;
  }
  return supplier;
}

function validateSupplierOrder(record, supplier) {
  const errors = [];
  for (const item of supplier.items) {
    addReadinessErrors(errors, item);
    if (!normalizeText(item.articleNumber)) addValidationError(errors, item, "article_number_missing", "Artikelnummer fehlt");
    if (!normalizeText(item.pzn)) addValidationError(errors, item, "pzn_missing", "PZN fehlt");
    if (!normalizeText(item.unit)) addValidationError(errors, item, "unit_missing", "Einheit fehlt");
    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
      addValidationError(errors, item, "quantity_invalid", "Menge muss groesser 0 sein");
    }
    if (item.supplierId !== supplier.supplierId) {
      addValidationError(errors, item, "supplier_mismatch", "Position gehoert nicht zur Lieferantengruppe");
    }
  }

  if (!normalizeText(record.number)) {
    errors.push({ code: "case_number_missing", message: "Vorgangsnummer fehlt" });
  }

  return errors;
}

function addReadinessErrors(errors, item) {
  if (item.procurementReadiness === "pzn_missing") {
    addValidationError(errors, item, "pzn_missing", "PZN fehlt");
  }
  if (item.procurementReadiness === "supplier_missing") {
    addValidationError(errors, item, "supplier_missing", "Lieferant fehlt");
  }
}

function addValidationError(errors, item, code, message) {
  if (errors.some((error) => error.proposalId === item.id && error.code === code)) return;
  errors.push({
    code,
    message,
    proposalId: item.id,
    articleNumber: item.articleNumber,
    description: item.description,
  });
}

function createMockOrderDraft(record, supplier) {
  return {
    id: `mock-order-${record.number}-${safeOrderKey(supplier.supplierId)}`,
    number: `M-${record.number}-${String(record.supplierGroups.findIndex((group) => group.supplierId === supplier.supplierId) + 1).padStart(2, "0")}`,
    caseId: record.id,
    caseNumber: record.number,
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,
    state: "draft_created",
    positions: supplier.items.map(toOrderPosition),
    createdAt: new Date().toISOString(),
  };
}

function normalizeLiveOrder(record, supplier, order, positions) {
  return {
    id: order?.id || order?.orderId || order?.uuid || "",
    number: order?.number || order?.orderNumber || "",
    caseId: record.id,
    caseNumber: record.number,
    supplierId: order?.supplierId || supplier.supplierId,
    supplierName: order?.supplierName || supplier.supplierName,
    state: order?.orderStateDescription || order?.state || "draft_created",
    positions: asArrayContent(positions).map((position) => ({
      id: position.id || position.positionId || "",
      articleNumber: position.articleNumber || position.orderNr || "",
      pzn: position.pzn || "",
      description: position.description || position.articleDescription || "",
      quantity: position.quantity ?? position.orderQuantity ?? "",
      unit: position.unit || position.quantityUnit || "",
    })),
    raw: order,
  };
}

function toOrderPosition(item) {
  return {
    id: item.id,
    articleId: item.articleId,
    articleNumber: item.articleNumber,
    pzn: item.pzn,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
  };
}

function asArrayContent(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function groupLiveProposalRows(rows) {
  const groups = new Map();
  rows.forEach((row, index) => {
    const salesProcessId = firstText(row.salesProcessId);
    const salesProcessNumber = firstText(row.salesProcessNumber);
    const groupKey = salesProcessId
      ? `salesProcessId:${salesProcessId}`
      : salesProcessNumber
        ? `salesProcessNumber:${salesProcessNumber}`
        : `proposal:${firstText(row.id, index)}`;
    const existing = groups.get(groupKey) || [];
    existing.push(row);
    groups.set(groupKey, existing);
  });
  return [...groups.values()];
}

function normalizeLiveCustomer(first, salesProcess) {
  const firstName = firstText(salesProcess?.customerFirstName, first.customerFirstName);
  const lastName = firstText(salesProcess?.customerLastName, first.customerLastName);
  const displayName = firstText(
    salesProcess?.customerName,
    first.customerName,
    [firstName, lastName].filter(Boolean).join(" "),
  );

  return {
    id: firstText(salesProcess?.customerId, salesProcess?.customer?.id, first.customerId),
    firstName,
    lastName,
    displayName,
    customerNumber: firstText(salesProcess?.customerNumber, salesProcess?.customer?.customerNumber, first.customerNumber),
  };
}

function normalizeLiveDeliveryAddress(first, salesProcess) {
  return {
    street: firstText(
      salesProcess?.deliveryAddressStreet,
      salesProcess?.deliveryAddress?.street,
      salesProcess?.customerStreet,
      first.customerStreet,
    ),
    houseNumber: firstText(
      salesProcess?.deliveryAddressHouseNumber,
      salesProcess?.deliveryAddress?.houseNumber,
      salesProcess?.customerHouseNumber,
      first.customerHouseNumber,
    ),
    zipCode: firstText(
      salesProcess?.deliveryAddressZipCode,
      salesProcess?.deliveryAddress?.zipCode,
      salesProcess?.customerZipCode,
      first.customerZipCode,
    ),
    city: firstText(
      salesProcess?.deliveryAddressCity,
      salesProcess?.deliveryAddress?.city,
      salesProcess?.customerCity,
      first.customerCity,
    ),
    country: firstText(
      salesProcess?.deliveryAddressCountryName,
      salesProcess?.deliveryAddressCountry,
      salesProcess?.deliveryAddressAlpha3CountryCode,
      salesProcess?.deliveryAddress?.country,
      salesProcess?.deliveryAddress?.countryName,
      salesProcess?.deliveryAddress?.alpha3CountryCode,
      first.customerCountry,
    ),
  };
}

function normalizeLiveStatus(first, salesProcess) {
  return firstText(
    salesProcess?.statusDescription,
    salesProcess?.statusName,
    salesProcess?.statusText,
    salesProcess?.status?.description,
    salesProcess?.status?.name,
    salesProcess?.status?.label,
    first.statusDescription,
    first.statusName,
    "missing_status",
  );
}

function toLiveProposal(row) {
  return {
    id: firstText(row.id, row.orderProposalId),
    salesProcessId: firstText(row.salesProcessId),
    supplierId: firstText(row.supplierId),
    supplierName: firstText(row.supplierName),
    articleId: firstText(row.articleId),
    articleNumber: firstText(row.articleNumber, row.articleArticleNr),
    pzn: firstText(row.pzn, row.PZN, row.pharmaCentralNumber),
    description: firstText(row.articleDescription, row.description),
    quantity: normalizeNumber(row.orderQuantity ?? row.quantity),
    unit: firstText(row.orderQuantityUnit, row.quantityUnit, row.unit),
    value: normalizeMoney(row.orderValue ?? row.value),
  };
}

function groupBySupplier(proposals) {
  const groups = new Map();
  for (const proposal of proposals) {
    const existing = groups.get(proposal.supplierId) || {
      supplierId: proposal.supplierId,
      supplierName: proposal.supplierName,
      itemCount: 0,
      totalValue: "0,00 EUR",
      items: [],
    };
    existing.items.push(proposal);
    existing.itemCount = existing.items.length;
    existing.totalValue = formatEuro(existing.items.reduce((sum, item) => sum + parseEuro(item.value), 0));
    groups.set(proposal.supplierId, existing);
  }
  return [...groups.values()].sort((a, b) => a.supplierName.localeCompare(b.supplierName, "de"));
}

function liveSessionMissingTokenError() {
  const error = new Error("Live-Session fuer Procurement-Cases hat keinen Omnia-Token.");
  error.status = 501;
  error.code = "LIVE_SESSION_MISSING_TOKEN";
  error.retryable = false;
  return error;
}

function liveClientUnavailableError() {
  const error = new Error("Live-Quelle fuer Procurement-Cases ist ohne Omnia-Client nicht verfuegbar.");
  error.status = 501;
  error.code = "LIVE_CLIENT_UNAVAILABLE";
  error.retryable = false;
  return error;
}

function unsupportedSessionSourceError() {
  const error = new Error("Procurement-Cases benoetigen eine explizite Live- oder Mock-Session.");
  error.status = 400;
  error.code = "SESSION_SOURCE_UNSUPPORTED";
  error.retryable = false;
  return error;
}

function liveSourceIncompleteError(message) {
  const error = new Error(message);
  error.status = 502;
  error.code = "LIVE_SOURCE_INCOMPLETE";
  error.retryable = false;
  return error;
}

function liveArticleLookupError(error, source) {
  return {
    liveLookupError: true,
    lookupFailed: true,
    category: liveLookupCategory(error),
    status: error?.status || 502,
    source,
  };
}

function liveLookupCategory(error) {
  if (error?.code === "GATEWAY_TIMEOUT" || error?.status === 504) return "timeout";
  if (error?.code === "OMNIA_NETWORK_ERROR") return "network";
  if (error?.status === 401 || error?.status === 403) return "auth";
  if (error?.status >= 500) return "gateway";
  return "network";
}

function isNotFoundError(error) {
  return error?.status === 404 || error?.code === "NOT_FOUND";
}

function articleDetailsCacheKey(session, articleId) {
  return `${session?.source || "unknown"}:${articleId}`;
}

function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalizeText(value),
  );
}

function unwrapContent(payload) {
  return payload?.content && !Array.isArray(payload.content) ? payload.content : payload;
}

function extractPzn(articleDetails) {
  if (!articleDetails) return "";
  const article = unwrapContent(articleDetails);
  return article?.pzn || article?.PZN || article?.pharmaCentralNumber || "";
}

function extractArticleNumber(articleDetails) {
  if (!articleDetails) return "";
  const article = unwrapContent(articleDetails);
  return article?.articleNumber || article?.number || "";
}

function extractArticleDescription(articleDetails) {
  if (!articleDetails) return "";
  const article = unwrapContent(articleDetails);
  return article?.description || article?.articleDescription || "";
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function firstText(...values) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return "";
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeMoney(value) {
  if (typeof value === "number") return formatEuro(value);
  const normalized = normalizeText(value);
  if (!normalized) return formatEuro(0);
  return normalized.includes("EUR") ? normalized : formatEuro(Number(normalized.replace(",", ".")) || 0);
}

function parseEuro(value) {
  return Number(String(value).replace(" EUR", "").replace(/\./g, "").replace(",", ".")) || 0;
}

function formatEuro(value) {
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

function safeOrderKey(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
