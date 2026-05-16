import type { LucideIcon } from "lucide-react";

export type ModuleId = "cases" | "orders" | "goods-receipts";

export type WorkflowState = "ready" | "pending" | "done" | "blocked";

export type Priority = "low" | "medium" | "high";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface AuditEvent {
  id: string;
  time: string;
  actor: string;
  module: string;
  action: string;
  target: string;
  status: "ok" | "warning" | "error";
}

export interface CompanionUser {
  name: string;
  username: string;
  workspace: string;
  environment: string;
}

export interface SessionInfo {
  id: string;
  source: "mock" | "live";
  workspace: string;
  user: {
    username: string;
    displayName: string;
  };
}

export interface BootstrapData {
  source: "mock" | "live";
  currentUser: CompanionUser;
  cases: CaseRecord[];
  orderProposals: OrderProposal[];
  orders: OrderRecord[];
  goodsReceipts: GoodsReceiptRecord[];
  procurementCases: ProcurementCase[];
  auditSeed: AuditEvent[];
}

export interface CaseRecord {
  id: string;
  number: string;
  customer: string;
  payer: string;
  status: string;
  branch: string;
  article: string;
  total: string;
}

export interface OrderProposal {
  id: string;
  article: string;
  customer: string;
  supplier: string;
  quantity: number;
  unit: string;
  value: string;
  state: string;
}

export interface OrderRecord {
  id: string;
  number: string;
  supplier: string;
  status: string;
  orderValue: string;
  documentState: string;
  mailState: string;
}

export interface ProcurementCustomer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  customerNumber: string;
}

export interface ProcurementAddress {
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  country: string;
}

export interface ProcurementProposalItem {
  id: string;
  supplierId: string;
  supplierName: string;
  articleId: string;
  articleNumber: string;
  pzn: string;
  pznEnrichmentStatus: "present" | "enriched" | "missing" | "failed";
  articleDetailsSource: string;
  procurementReadiness: "ready_to_order" | "pzn_missing" | "supplier_missing";
  description: string;
  quantity: number;
  unit: string;
  value: string;
}

export interface SupplierProposalGroup {
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalValue: string;
  items: ProcurementProposalItem[];
}

export interface ProcurementOrderPosition {
  id: string;
  articleNumber: string;
  pzn: string;
  description: string;
  quantity: number | string;
  unit: string;
}

export interface ProcurementCreatedOrder {
  id: string;
  number: string;
  caseId: string;
  caseNumber: string;
  supplierId: string;
  supplierName: string;
  state: string;
  positions: ProcurementOrderPosition[];
}

export interface ProcurementOrderValidationDetail {
  code: string;
  message: string;
  proposalId?: string;
  articleNumber?: string;
  description?: string;
}

export interface ProcurementSupplierOrderResult {
  mode: "mock" | "live";
  proposalIds: string[];
  order: ProcurementCreatedOrder;
}

export interface ProcurementCase {
  id: string;
  salesProcessId: string;
  number: string;
  status: string;
  customer: ProcurementCustomer;
  deliveryAddress: ProcurementAddress;
  proposals: ProcurementProposalItem[];
  supplierGroups: SupplierProposalGroup[];
}

export interface GoodsReceiptRecord {
  id: string;
  orderNumber: string;
  supplier: string;
  article: string;
  quantity: number;
  remainingQuantity: number;
  storageLocation: string;
  status: string;
}

export interface GoodsReceiptDraft {
  deliveryNumber: string;
  deliveryDate: string;
  storageLocation: string;
  quantity: string;
  caseStatus: string;
  supplyStatus: string;
}
