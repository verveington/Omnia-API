import { Calculator, FilePlus2, PackagePlus, Save, Search } from "lucide-react";
import type { CaseRecord } from "../../core/types";
import { ActionButton, Metric, SectionHeader, StatusBadge } from "../../components/ui";

export function CasesModule({
  cases,
  selectedCase,
  onSelectCase,
  onAction,
}: {
  cases: CaseRecord[];
  selectedCase: CaseRecord;
  onSelectCase: (record: CaseRecord) => void;
  onAction: (action: string, target: string) => void;
}) {
  return (
    <section className="module-grid module-grid--cases">
      <div className="panel panel--wide">
        <SectionHeader
          title="Vorgang suchen und öffnen"
          description="Geführter Einstieg in Kundensuche, Vorgang und Kontext-Hydration."
          action={
            <ActionButton onClick={() => onAction("Vorgang angelegt", "Neuer Vorgang")}>
              <FilePlus2 size={16} />
              Neuer Vorgang
            </ActionButton>
          }
        />
        <div className="toolbar">
          <div className="search-field">
            <Search size={16} />
            <input placeholder="Kunde oder Vorgangsnummer" defaultValue="Max" />
          </div>
          <ActionButton variant="secondary" onClick={() => onAction("Kundensuche ausgeführt", "Suchbegriff Max")}>
            Suchen
          </ActionButton>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vorgang</th>
                <th>Kunde</th>
                <th>Kostenträger</th>
                <th>Status</th>
                <th>Filiale</th>
                <th>Summe</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((record) => (
                <tr
                  className={record.id === selectedCase.id ? "is-selected" : ""}
                  key={record.id}
                  onClick={() => onSelectCase(record)}
                >
                  <td>{record.number}</td>
                  <td>{record.customer}</td>
                  <td>{record.payer}</td>
                  <td>
                    <StatusBadge tone={record.status === "Neu" ? "blue" : "green"}>{record.status}</StatusBadge>
                  </td>
                  <td>{record.branch}</td>
                  <td>{record.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="panel detail-panel">
        <SectionHeader
          title={`Vorgang ${selectedCase.number}`}
          description="Backend-Fassade: hydrateSalesProcessContext(caseId)"
        />
        <dl className="detail-list">
          <div>
            <dt>Kunde</dt>
            <dd>{selectedCase.customer}</dd>
          </div>
          <div>
            <dt>Kostenträger</dt>
            <dd>{selectedCase.payer}</dd>
          </div>
          <div>
            <dt>Artikel</dt>
            <dd>{selectedCase.article}</dd>
          </div>
        </dl>
        <div className="metric-row">
          <Metric label="Status" value={selectedCase.status} detail="Omnia Workflow" />
          <Metric label="Betrag" value={selectedCase.total} detail="berechnet" />
        </div>
        <div className="workflow-actions">
          <ActionButton variant="secondary" onClick={() => onAction("Artikelposition hinzugefügt", selectedCase.number)}>
            <PackagePlus size={16} />
            Artikelposition
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => onAction("Preise berechnet", selectedCase.number)}>
            <Calculator size={16} />
            Preise berechnen
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => onAction("Vorgang gespeichert", selectedCase.number)}>
            <Save size={16} />
            Speichern
          </ActionButton>
          <ActionButton onClick={() => onAction("Lieferschein erzeugt", selectedCase.number)}>
            <FilePlus2 size={16} />
            Lieferschein
          </ActionButton>
        </div>
      </aside>
    </section>
  );
}
