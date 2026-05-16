import { demoData } from "./demo-data.mjs";

export function createProcurementService({ omniaClient } = {}) {
  const articleDetailsCache = new Map();

  async function listCases(session) {
    return Promise.all(sourceCases(session).map((record) => toProcurementCase(record, session)));
  }

  async function getCase(session, caseId) {
    const record = sourceCases(session).find((item) => item.id === caseId || item.salesProcessId === caseId);
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

  async function createSupplierOrder(session, record, supplierId) {
    const supplier = getSupplierGroup(record, supplierId);
    const proposalIds = supplier.items.map((item) => item.id);
    const validationErrors = validateSupplierOrder(record, supplier);

    if (validationErrors.length) {
      const error = new Error("Bestellung kann nicht erzeugt werden");
      error.status = 422;
      error.details = validationErrors;
      throw error;
    }

    if (session?.source === "live" && session?.omniaAccessToken && omniaClient) {
      return createLiveSupplierOrder(session, record, supplier, proposalIds);
    }

    return {
      mode: "mock",
      proposalIds,
      order: createMockOrder(record, supplier),
    };
  }

  return {
    listCases,
    getCase,
    getSupplierExport,
    createSupplierOrder,
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
    const pzn = normalizeText(extractPzn(articleDetails));
    const pznEnrichmentStatus = articleDetails?.lookupFailed ? "failed" : pzn ? "enriched" : "missing";

    return {
      ...baseProposal,
      pzn,
      pznEnrichmentStatus,
      articleDetailsSource: articleDetails?.source || "",
      procurementReadiness: supplierMissing ? "supplier_missing" : pzn ? "ready_to_order" : "pzn_missing",
    };
  }

  async function resolveArticleDetails(session, articleId) {
    const normalizedArticleId = normalizeText(articleId);
    if (!normalizedArticleId) return null;
    if (articleDetailsCache.has(normalizedArticleId)) return articleDetailsCache.get(normalizedArticleId);

    let details = null;
    if (session?.source === "live" && session?.omniaAccessToken && omniaClient) {
      details = await loadLiveArticleDetails(session, normalizedArticleId);
    } else {
      const fixture = demoData.articleDetailsById?.[normalizedArticleId] || null;
      details = fixture ? { ...fixture, source: "demo-article-details" } : null;
    }

    articleDetailsCache.set(normalizedArticleId, details);
    return details;
  }

  async function loadLiveArticleDetails(session, articleId) {
    const detailPaths = [
      `/apigateway/article-tenant/articles/${encodeURIComponent(articleId)}`,
      `/apigateway/articletenantservice/articles/${encodeURIComponent(articleId)}`,
    ];

    for (const path of detailPaths) {
      try {
        const payload = await omniaClient.request(session, { path });
        const article = unwrapContent(payload);
        return { ...article, source: path };
      } catch {
        // Try the next observed Omnia article detail path before marking the lookup as failed.
      }
    }

    return { lookupFailed: true, source: "omnia-article-details" };
  }

  async function createLiveSupplierOrder(session, record, supplier, proposalIds) {
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
      proposalIds,
      order: normalizeLiveOrder(record, supplier, hydratedOrder || createdOrder, positions),
    };
  }
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

function createMockOrder(record, supplier) {
  return {
    id: `mock-order-${record.number}-${safeOrderKey(supplier.supplierId)}`,
    number: `M-${record.number}-${String(record.supplierGroups.findIndex((group) => group.supplierId === supplier.supplierId) + 1).padStart(2, "0")}`,
    caseId: record.id,
    caseNumber: record.number,
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,
    state: "created",
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
    state: order?.orderStateDescription || order?.state || "created",
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

function sourceCases(session) {
  if (session?.source === "live") {
    return demoData.procurementCases;
  }
  return demoData.procurementCases;
}

function unwrapContent(payload) {
  return payload?.content && !Array.isArray(payload.content) ? payload.content : payload;
}

function extractPzn(articleDetails) {
  if (!articleDetails) return "";
  const article = unwrapContent(articleDetails);
  return article?.pzn || article?.PZN || article?.pharmaCentralNumber || "";
}

function normalizeText(value) {
  return String(value ?? "").trim();
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
