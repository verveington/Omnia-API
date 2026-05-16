import type {
  AuditEvent,
  CaseRecord,
  GoodsReceiptRecord,
  OrderProposal,
  OrderRecord,
} from "../core/types";

export const currentUser = {
  name: "Christoph Schernthaner",
  workspace: "saniPEP Sanitätshaus GmbH & Co. KG",
  environment: "Lokal / später Cloud-ready",
};

export const cases: CaseRecord[] = [
  {
    id: "sp-18581",
    number: "18581",
    customer: "Max Mustermann",
    payer: "AOK Bayern",
    status: "Neu",
    branch: "saniPEP Sanitätshaus",
    article: "VLIESKOMPRESSEN unsteril 10x10 cm",
    total: "18,50 EUR",
  },
  {
    id: "sp-18542",
    number: "18542",
    customer: "Erika Beispiel",
    payer: "IKK classic",
    status: "Abholbereit",
    branch: "Filiale Mitte",
    article: "Bandage Standard",
    total: "42,20 EUR",
  },
];

export const orderProposals: OrderProposal[] = [
  {
    id: "op-413",
    article: "VLIESKOMPRESSEN unsteril 10x10 cm",
    customer: "Max Mustermann",
    supplier: "MedComplett GmbH",
    quantity: 5,
    unit: "Packung",
    value: "92,50 EUR",
    state: "Vorschlag",
  },
  {
    id: "op-414",
    article: "Bandage Standard",
    customer: "Erika Beispiel",
    supplier: "Orthomed Lieferant",
    quantity: 1,
    unit: "Stück",
    value: "31,70 EUR",
    state: "Prüfen",
  },
];

export const orders: OrderRecord[] = [
  {
    id: "order-413",
    number: "413",
    supplier: "MedComplett GmbH",
    status: "Erstellt",
    orderValue: "92,50 EUR",
    documentState: "Bestelldokument bereit",
    mailState: "PDF/Mail vorbereitet",
  },
  {
    id: "order-411",
    number: "411",
    supplier: "RehaLogistik",
    status: "Offen",
    orderValue: "120,00 EUR",
    documentState: "Entwurf",
    mailState: "Nicht vorbereitet",
  },
];

export const goodsReceipts: GoodsReceiptRecord[] = [
  {
    id: "gr-413",
    orderNumber: "413",
    supplier: "MedComplett GmbH",
    article: "VLIESKOMPRESSEN unsteril 10x10 cm",
    quantity: 5,
    remainingQuantity: 5,
    storageLocation: "Hauptlager",
    status: "Offen",
  },
];

export const auditSeed: AuditEvent[] = [
  {
    id: "audit-1",
    time: "00:46:18",
    actor: currentUser.name,
    module: "Bestellung",
    action: "Bestellvorschlag in Bestellung umgewandelt",
    target: "Bestellung 413",
    status: "ok",
  },
  {
    id: "audit-2",
    time: "00:48:02",
    actor: currentUser.name,
    module: "Wareneingang",
    action: "Wareneingang erfasst",
    target: "Bestellung 413",
    status: "ok",
  },
];
