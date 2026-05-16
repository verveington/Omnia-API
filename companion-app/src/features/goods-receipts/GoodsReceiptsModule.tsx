import { CheckCircle2, ClipboardCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { GoodsReceiptDraft, GoodsReceiptRecord } from "../../core/types";
import { ActionButton, Field, SectionHeader, SelectField, StatusBadge } from "../../components/ui";

const initialDraft: GoodsReceiptDraft = {
  deliveryNumber: "",
  deliveryDate: "2026-05-16",
  storageLocation: "",
  quantity: "5",
  caseStatus: "Abholbereit",
  supplyStatus: "Neu",
};

export function GoodsReceiptsModule({
  receipts,
  onAction,
}: {
  receipts: GoodsReceiptRecord[];
  onAction: (action: string, target: string) => void;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [booked, setBooked] = useState(false);
  const [completed, setCompleted] = useState(false);

  const validation = useMemo(() => {
    const missing = [];
    if (!draft.deliveryNumber.trim()) missing.push("Lieferschein-Nr.");
    if (!draft.storageLocation.trim()) missing.push("Lagerort");
    if (!draft.quantity.trim()) missing.push("Menge");
    if (!draft.caseStatus.trim()) missing.push("Vorgangsstatus");
    if (!draft.supplyStatus.trim()) missing.push("Versorgungsstatus");
    return missing;
  }, [draft]);

  function updateDraft(key: keyof GoodsReceiptDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function bookReceipt() {
    if (validation.length > 0) {
      onAction(`Pflichtfelder fehlen: ${validation.join(", ")}`, "Wareneingang");
      return;
    }
    setBooked(true);
    onAction("Wareneingang erfasst", "Bestellung 413");
  }

  function completeReceipt() {
    if (!booked) {
      onAction("Wareneingang noch nicht erfasst", "Bestellung 413");
      return;
    }
    setCompleted(true);
    onAction("Wareneingang durchgeführt", "Bestellung 413");
  }

  return (
    <section className="module-grid module-grid--receipts">
      <div className="panel panel--wide">
        <SectionHeader
          title="Wareneingänge"
          description="Gefilterte Order-Arrival-Suche für Bestellungen."
          action={
            <ActionButton variant="secondary" onClick={() => onAction("Wareneingänge gesucht", "Bestellung 413")}>
              <Search size={16} />
              Filtern
            </ActionButton>
          }
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bestellung</th>
                <th>Lieferant</th>
                <th>Artikel</th>
                <th>Menge</th>
                <th>Rest</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>{receipt.orderNumber}</td>
                  <td>{receipt.supplier}</td>
                  <td>{receipt.article}</td>
                  <td>{receipt.quantity}</td>
                  <td>{completed ? 0 : receipt.remainingQuantity}</td>
                  <td>
                    <StatusBadge tone={completed ? "green" : booked ? "blue" : "amber"}>
                      {completed ? "Durchgeführt" : booked ? "Erfasst" : receipt.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="panel detail-panel">
        <SectionHeader
          title="Wareneingang erfassen"
          description="Pflichtfelder werden vor dem produktiven API-Call validiert."
        />
        {validation.length > 0 ? (
          <div className="validation-box">
            <strong>Nicht alle Pflichtfelder sind ausgefüllt.</strong>
            <span>{validation.join(", ")}</span>
          </div>
        ) : (
          <div className="success-box">
            <CheckCircle2 size={16} />
            Pflichtfelder bereit
          </div>
        )}
        <div className="form-grid">
          <Field
            label="Lieferschein-Nr."
            required
            value={draft.deliveryNumber}
            onChange={(value) => updateDraft("deliveryNumber", value)}
          />
          <Field
            label="Lieferdatum"
            required
            type="date"
            value={draft.deliveryDate}
            onChange={(value) => updateDraft("deliveryDate", value)}
          />
          <SelectField
            label="Lagerort"
            required
            value={draft.storageLocation}
            onChange={(value) => updateDraft("storageLocation", value)}
            options={["", "Hauptlager", "Filiale Mitte", "Reserve"]}
          />
          <Field
            label="Menge"
            required
            value={draft.quantity}
            onChange={(value) => updateDraft("quantity", value)}
          />
          <SelectField
            label="Vorgangsstatus"
            required
            value={draft.caseStatus}
            onChange={(value) => updateDraft("caseStatus", value)}
            options={["Abholbereit", "Neu", "In Bearbeitung"]}
          />
          <SelectField
            label="Versorgungsstatus"
            required
            value={draft.supplyStatus}
            onChange={(value) => updateDraft("supplyStatus", value)}
            options={["Neu", "Geliefert", "Abgeschlossen"]}
          />
        </div>
        <div className="workflow-actions">
          <ActionButton onClick={bookReceipt}>
            <ClipboardCheck size={16} />
            Wareneingang erfassen
          </ActionButton>
          <ActionButton variant={booked ? "primary" : "secondary"} disabled={!booked} onClick={completeReceipt}>
            <CheckCircle2 size={16} />
            Durchführen
          </ActionButton>
        </div>
      </aside>
    </section>
  );
}
