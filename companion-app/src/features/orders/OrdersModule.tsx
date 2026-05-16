import { Download, FileSpreadsheet, FileText, TableProperties } from "lucide-react";
import type { ProcurementCase, ProcurementProposalItem, SupplierProposalGroup } from "../../core/types";
import { procurementCaseExportUrl, procurementSupplierExportUrl } from "../../api/client";
import { ActionLink, Metric, SectionHeader, StatusBadge } from "../../components/ui";

export function OrdersModule({
  procurementCases,
  selectedCase,
  onSelectCase,
  onAction,
}: {
  procurementCases: ProcurementCase[];
  selectedCase: ProcurementCase;
  onSelectCase: (record: ProcurementCase) => void;
  onAction: (action: string, target: string) => void;
}) {
  const proposals = selectedCase.proposals ?? [];
  const supplierGroups = selectedCase.supplierGroups ?? [];
  const blockedProposalCount = proposals.filter((proposal) => proposal.procurementReadiness !== "ready_to_order").length;

  return (
    <section className="module-grid module-grid--orders">
      <div className="panel panel--wide">
        <SectionHeader
          title="Bestellvorgänge"
          description="Vorgänge aus Omnia mit vorhandenen Bestellvorschlägen."
          action={<ExportActions caseId={selectedCase.id} onAction={onAction} target={`Vorgang ${selectedCase.number}`} />}
        />
        <div className="procurement-list">
          {procurementCases.map((record) => (
            <button
              className={record.id === selectedCase.id ? "procurement-row procurement-row--active" : "procurement-row"}
              key={record.id}
              onClick={() => onSelectCase(record)}
            >
              <span>
                <strong>Vorgang {record.number}</strong>
                <small>{record.customer.displayName}</small>
              </span>
              <span>
                <StatusBadge tone="amber">{record.status}</StatusBadge>
                <small>{record.proposals.length} Vorschläge</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <aside className="panel detail-panel">
        <SectionHeader
          title={`Vorgang ${selectedCase.number}`}
          description="Kundendaten und Lieferadresse für den Bestellkontext."
        />
        <div className="metric-row">
          <Metric label="Kunde" value={selectedCase.customer.lastName} detail={selectedCase.customer.customerNumber} />
          <Metric label="Lieferanten" value={String(supplierGroups.length)} detail="getrennte Exporte" />
          <Metric label="PZN offen" value={String(blockedProposalCount)} detail="vor Bestellung klären" />
        </div>
        <dl className="detail-list">
          <div>
            <dt>Kunde</dt>
            <dd>{selectedCase.customer.displayName}</dd>
          </div>
          <div>
            <dt>Lieferadresse</dt>
            <dd>{formatAddress(selectedCase)}</dd>
          </div>
        </dl>
      </aside>

      <div className="panel panel--full">
        <SectionHeader title="Bestellvorschläge" description="Artikelpositionen mit Artikelnummer, PZN und Lieferant." />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lieferant</th>
                <th>Artikelnummer</th>
                <th>PZN</th>
                <th>Status</th>
                <th>Beschreibung</th>
                <th>Menge</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id}>
                  <td>{proposal.supplierName}</td>
                  <td>{proposal.articleNumber}</td>
                  <td>{proposal.pzn || "fehlt"}</td>
                  <td>
                    <ReadinessBadge proposal={proposal} />
                  </td>
                  <td>{proposal.description}</td>
                  <td>
                    {proposal.quantity} {proposal.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel panel--full">
        <SectionHeader
          title="Lieferantenexporte"
          description="Je Lieferant getrennt; Kommission im Export ist nur der Nachname."
        />
        <div className="supplier-groups">
          {supplierGroups.map((group) => (
            <SupplierGroupCard
              caseId={selectedCase.id}
              group={group}
              key={group.supplierId}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SupplierGroupCard({
  caseId,
  group,
  onAction,
}: {
  caseId: string;
  group: SupplierProposalGroup;
  onAction: (action: string, target: string) => void;
}) {
  const blockedCount = group.items.filter((item) => item.procurementReadiness !== "ready_to_order").length;

  return (
    <article className="supplier-group">
      <div>
        <strong>{group.supplierName}</strong>
        <span>{group.itemCount} Positionen</span>
        {blockedCount > 0 ? <StatusBadge tone="red">{blockedCount} nicht bereit</StatusBadge> : null}
      </div>
      <div className="export-actions">
        <ActionLink
          href={procurementSupplierExportUrl(caseId, group.supplierId, "xlsx")}
          onClick={() => onAction("Lieferantenexport Excel", group.supplierName)}
          variant="secondary"
        >
          <FileSpreadsheet size={16} />
          Excel
        </ActionLink>
        <ActionLink
          href={procurementSupplierExportUrl(caseId, group.supplierId, "csv")}
          onClick={() => onAction("Lieferantenexport CSV", group.supplierName)}
          variant="secondary"
        >
          <TableProperties size={16} />
          CSV
        </ActionLink>
        <ActionLink
          href={procurementSupplierExportUrl(caseId, group.supplierId, "pdf")}
          onClick={() => onAction("Lieferantenexport PDF", group.supplierName)}
          variant="secondary"
        >
          <FileText size={16} />
          PDF
        </ActionLink>
      </div>
    </article>
  );
}

function ReadinessBadge({ proposal }: { proposal: ProcurementProposalItem }) {
  if (proposal.procurementReadiness === "supplier_missing") {
    return <StatusBadge tone="amber">Lieferant fehlt</StatusBadge>;
  }

  if (proposal.procurementReadiness === "pzn_missing") {
    return <StatusBadge tone="red">PZN fehlt</StatusBadge>;
  }

  if (proposal.pznEnrichmentStatus === "enriched") {
    return <StatusBadge tone="blue">PZN ergänzt</StatusBadge>;
  }

  return <StatusBadge tone="green">bereit</StatusBadge>;
}

function ExportActions({
  caseId,
  target,
  onAction,
}: {
  caseId: string;
  target: string;
  onAction: (action: string, target: string) => void;
}) {
  return (
    <div className="export-actions">
      <ActionLink href={procurementCaseExportUrl(caseId, "xlsx")} onClick={() => onAction("Vorgangsexport Excel", target)}>
        <Download size={16} />
        Excel
      </ActionLink>
      <ActionLink
        href={procurementCaseExportUrl(caseId, "csv")}
        onClick={() => onAction("Vorgangsexport CSV", target)}
        variant="secondary"
      >
        <TableProperties size={16} />
        CSV
      </ActionLink>
      <ActionLink
        href={procurementCaseExportUrl(caseId, "pdf")}
        onClick={() => onAction("Vorgangsexport PDF", target)}
        variant="secondary"
      >
        <FileText size={16} />
        PDF
      </ActionLink>
    </div>
  );
}

function formatAddress(record: ProcurementCase) {
  const address = record.deliveryAddress;
  return `${address.street} ${address.houseNumber}, ${address.zipCode} ${address.city}`;
}
