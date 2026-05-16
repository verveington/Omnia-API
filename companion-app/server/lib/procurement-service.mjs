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
        value: item.value,
        procurementReadiness: item.procurementReadiness,
      })),
    };
  }

  return {
    listCases,
    getCase,
    getSupplierExport,
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
