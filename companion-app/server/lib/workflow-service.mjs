import { demoData } from "./demo-data.mjs";
import { createProcurementService } from "./procurement-service.mjs";

export function createWorkflowService({ omniaClient }) {
  const procurementService = createProcurementService();

  async function getBootstrap(session) {
    if (isLive(session)) {
      return getLiveBootstrap(session);
    }

    return {
      source: "mock",
      currentUser: {
        ...demoData.currentUser,
        name: session?.user?.displayName || demoData.currentUser.name,
        username: session?.user?.username || demoData.currentUser.username,
        workspace: session?.workspace || demoData.currentUser.workspace,
      },
      cases: demoData.cases,
      orderProposals: demoData.orderProposals,
      orders: demoData.orders,
      goodsReceipts: demoData.goodsReceipts,
      procurementCases: await procurementService.listCases(session),
      auditSeed: demoData.auditSeed,
    };
  }

  async function searchCases(session, { keywords = "" } = {}) {
    if (isLive(session)) {
      return normalizeCases(
        await omniaClient.request(session, {
          method: "POST",
          path: "/apigateway/sales/salesprocesses/search",
          body: {
            globalSearch: keywords,
            keywords,
            page: 0,
            size: 25,
          },
        }),
      );
    }

    return filterRecords(demoData.cases, keywords);
  }

  async function searchOrders(session, { keywords = "" } = {}) {
    if (isLive(session)) {
      return normalizeOrders(
        await omniaClient.request(session, {
          method: "POST",
          path: "/apigateway/wawi/orders/search",
          body: {
            keywords,
            page: 0,
            size: 25,
          },
        }),
      );
    }

    return filterRecords(demoData.orders, keywords);
  }

  async function searchGoodsReceipts(session, { orderNumber = "" } = {}) {
    if (isLive(session)) {
      return normalizeGoodsReceipts(
        await omniaClient.request(session, {
          method: "POST",
          path: "/apigateway/wawi/order-arrival/search",
          body: {
            orderNumber,
            page: 0,
            size: 25,
          },
        }),
      );
    }

    return filterRecords(demoData.goodsReceipts, orderNumber);
  }

  async function getLiveBootstrap(session) {
    const [userDetails, cases, orders, goodsReceipts, procurementCases] = await Promise.all([
      omniaClient.request(session, { path: "/apigateway/user-details" }).catch(() => null),
      searchCases(session, {}),
      searchOrders(session, {}),
      searchGoodsReceipts(session, {}),
      procurementService.listCases(session),
    ]);

    return {
      source: "live",
      currentUser: {
        name: userDetails?.name || userDetails?.displayName || session.user.displayName,
        username: session.user.username,
        workspace: session.workspace,
        environment: "Live Omnia API",
      },
      cases,
      orderProposals: demoData.orderProposals,
      orders,
      goodsReceipts,
      procurementCases,
      auditSeed: [],
    };
  }

  return {
    getBootstrap,
    searchCases,
    searchOrders,
    searchGoodsReceipts,
  };
}

function isLive(session) {
  return session?.source === "live" && Boolean(session.omniaAccessToken);
}

function filterRecords(records, keyword) {
  const normalizedKeyword = String(keyword || "").trim().toLowerCase();
  if (!normalizedKeyword) return records;
  return records.filter((record) =>
    Object.values(record).some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
  );
}

function content(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function normalizeCases(payload) {
  return content(payload).map((item) => ({
    id: item.id,
    number: String(item.number ?? ""),
    customer: item.customerName || [item.customerFirstName, item.customerLastName].filter(Boolean).join(" "),
    payer: item.kostentraegerName || item.kostentraegerIk || "",
    status: item.statusDescription || item.status || "",
    branch: item.filialeName || "",
    article: item.artGesamt || item.commaSeparatedArt || "",
    total: item.total ? `${item.total} EUR` : "",
  }));
}

function normalizeOrders(payload) {
  return content(payload).map((item) => ({
    id: item.id,
    number: String(item.number ?? item.orderNr ?? ""),
    supplier: item.supplierName || "",
    status: item.orderStateDescription || item.orderArrivalBookingState || "",
    orderValue: item.orderValue !== undefined && item.orderValue !== null ? `${item.orderValue} EUR` : "",
    documentState: item.orderDocumentId ? "Bestelldokument bereit" : "Unbekannt",
    mailState: item.mailFileId ? "PDF/Mail vorbereitet" : "Nicht vorbereitet",
  }));
}

function normalizeGoodsReceipts(payload) {
  return content(payload).map((item) => ({
    id: item.id,
    orderNumber: String(item.number ?? item.orderNumber ?? ""),
    supplier: item.supplierName || "",
    article: item.articleDescription || item.articleArticleNr || "",
    quantity: Number(item.orderQuantity ?? item.quantity ?? 0),
    remainingQuantity: Number(item.remainingQuantity ?? item.restQuantity ?? 0),
    storageLocation: item.storageLocationName || "",
    status: item.orderArrivalBookingState || item.status || "",
  }));
}
