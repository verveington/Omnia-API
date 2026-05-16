import {
  Activity,
  ClipboardList,
  FileText,
  LogOut,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AuditEvent, ModuleDefinition, ModuleId } from "../core/types";
import { AuditStream } from "./ui";

export const modules: ModuleDefinition[] = [
  {
    id: "cases",
    label: "Vorgänge",
    description: "Kunde, Positionen, Preis und Lieferschein",
    icon: FileText,
  },
  {
    id: "orders",
    label: "Bestellplattform",
    description: "Vorgänge, Vorschläge, Lieferantenexporte",
    icon: ReceiptText,
  },
  {
    id: "goods-receipts",
    label: "Wareneingang",
    description: "Buchen, durchführen, Status setzen",
    icon: PackageCheck,
  },
];

export function AppShell({
  activeModule,
  onModuleChange,
  userName,
  workspace,
  connectionLabel,
  onLogout,
  children,
  auditEvents,
}: {
  activeModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
  userName: string;
  workspace: string;
  connectionLabel: string;
  onLogout: () => void;
  children: ReactNode;
  auditEvents: AuditEvent[];
}) {
  const active = modules.find((module) => module.id === activeModule) ?? modules[0];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">OC</span>
          <div>
            <strong>Omnia Companion</strong>
            <span>Produktiver Workflow-Prototyp</span>
          </div>
        </div>
        <div className="global-search">
          <Search size={16} />
          <input aria-label="Globale Suche" placeholder="Kunde, Vorgang, Bestellung" />
        </div>
        <div className="session">
          <ShieldCheck size={17} />
          <div>
            <strong>{userName}</strong>
            <span>{workspace} · {connectionLabel}</span>
          </div>
          <button aria-label="Abmelden" onClick={onLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="workspace">
        <nav className="module-nav" aria-label="Module">
          <div className="module-nav__label">
            <Activity size={16} />
            Module
          </div>
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                className={module.id === activeModule ? "module-link module-link--active" : "module-link"}
                key={module.id}
                onClick={() => onModuleChange(module.id)}
              >
                <Icon size={18} />
                <span>
                  <strong>{module.label}</strong>
                  <small>{module.description}</small>
                </span>
              </button>
            );
          })}
          <div className="module-nav__footer">
            <ClipboardList size={16} />
            Keine direkten Omnia-Calls im Frontend
          </div>
        </nav>

        <main className="module-surface">
          <div className="module-title">
            <div>
              <span>{active.label}</span>
              <h1>{active.description}</h1>
            </div>
          </div>
          {children}
        </main>

        <AuditStream events={auditEvents} />
      </div>
    </div>
  );
}
