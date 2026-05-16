import type { BootstrapData, CaseRecord, GoodsReceiptRecord, OrderRecord, ProcurementCase, SessionInfo } from "../core/types";

interface ApiErrorPayload {
  error?: {
    message?: string;
    status?: number;
  };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function login(username: string, password: string): Promise<{ session: SessionInfo; mode: string }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password, workspace: "saniPEP Sanitätshaus GmbH & Co. KG" }),
  });
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
}

export async function getSession(): Promise<SessionInfo | null> {
  const result = await request<{ session: SessionInfo | null }>("/api/auth/session");
  return result.session;
}

export async function getBootstrap(): Promise<BootstrapData> {
  return request("/api/workflows/bootstrap");
}

export async function searchCases(keywords: string): Promise<CaseRecord[]> {
  const query = new URLSearchParams({ keywords });
  const result = await request<{ data: CaseRecord[] }>(`/api/cases?${query}`);
  return result.data;
}

export async function searchOrders(keywords: string): Promise<OrderRecord[]> {
  const query = new URLSearchParams({ keywords });
  const result = await request<{ data: OrderRecord[] }>(`/api/orders?${query}`);
  return result.data;
}

export async function searchGoodsReceipts(orderNumber: string): Promise<GoodsReceiptRecord[]> {
  const query = new URLSearchParams({ orderNumber });
  const result = await request<{ data: GoodsReceiptRecord[] }>(`/api/goods-receipts?${query}`);
  return result.data;
}

export async function listProcurementCases(): Promise<ProcurementCase[]> {
  const result = await request<{ data: ProcurementCase[] }>("/api/procurement/cases");
  return result.data;
}

export async function getProcurementCase(caseId: string): Promise<ProcurementCase> {
  const result = await request<{ data: ProcurementCase }>(`/api/procurement/cases/${encodeURIComponent(caseId)}`);
  return result.data;
}

export function procurementCaseExportUrl(caseId: string, format: "xlsx" | "csv" | "pdf"): string {
  return `/api/procurement/cases/${encodeURIComponent(caseId)}/export?format=${format}`;
}

export function procurementSupplierExportUrl(caseId: string, supplierId: string, format: "xlsx" | "csv" | "pdf"): string {
  return `/api/procurement/cases/${encodeURIComponent(caseId)}/suppliers/${encodeURIComponent(supplierId)}/export?format=${format}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;

  if (!response.ok) {
    throw new ApiError(payload.error?.message || "API request failed", response.status);
  }

  return payload as T;
}
