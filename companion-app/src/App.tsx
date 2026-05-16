import { useEffect, useMemo, useState } from "react";
import type {
  AuditEvent,
  BootstrapData,
  CaseRecord,
  ModuleId,
  ProcurementCase,
  ProcurementSupplierOrderResult,
  SessionInfo,
} from "./core/types";
import { createProcurementSupplierOrder, getBootstrap, getSession, login, logout } from "./api/client";
import { AppShell } from "./components/AppShell";
import { CasesModule } from "./features/cases/CasesModule";
import { OrdersModule } from "./features/orders/OrdersModule";
import { GoodsReceiptsModule } from "./features/goods-receipts/GoodsReceiptsModule";
import { LoginView } from "./features/auth/LoginView";

function createAuditEvent(actor: string, module: string, action: string, target: string): AuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date()),
    actor,
    module,
    action,
    target,
    status: action.includes("fehlen") || action.includes("nicht") ? "warning" : "ok",
  };
}

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("cases");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedProcurementCaseId, setSelectedProcurementCaseId] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [status, setStatus] = useState<"checking" | "anonymous" | "loading" | "ready">("checking");
  const [loginError, setLoginError] = useState<string | null>(null);

  const moduleName = useMemo(() => {
    if (activeModule === "cases") return "Vorgang";
    if (activeModule === "orders") return "Bestellung";
    return "Wareneingang";
  }, [activeModule]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const existingSession = await getSession();
        if (!existingSession) {
          if (!cancelled) setStatus("anonymous");
          return;
        }
        if (!cancelled) {
          setSession(existingSession);
          setStatus("loading");
        }
        const data = await getBootstrap();
        if (!cancelled) applyBootstrap(data);
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  function recordAction(action: string, target: string) {
    const actor = bootstrap?.currentUser.name || session?.user.displayName || "Omnia Companion";
    setAuditEvents((current) => [createAuditEvent(actor, moduleName, action, target), ...current].slice(0, 9));
  }

  async function handleLogin(username: string, password: string) {
    setLoginError(null);
    setStatus("loading");
    try {
      const result = await login(username, password);
      setSession(result.session);
      const data = await getBootstrap();
      applyBootstrap(data);
    } catch (error) {
      setStatus("anonymous");
      setLoginError(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen");
    }
  }

  async function handleLogout() {
    await logout().catch(() => {});
    setSession(null);
    setBootstrap(null);
    setAuditEvents([]);
    setSelectedCaseId(null);
    setSelectedProcurementCaseId(null);
    setStatus("anonymous");
  }

  function applyBootstrap(data: BootstrapData) {
    setBootstrap(data);
    setAuditEvents(data.auditSeed);
    setSelectedCaseId(data.cases[0]?.id ?? null);
    setSelectedProcurementCaseId(data.procurementCases[0]?.id ?? null);
    setStatus("ready");
  }

  async function handleCreateSupplierOrder(caseId: string, supplierId: string): Promise<ProcurementSupplierOrderResult> {
    return createProcurementSupplierOrder(caseId, supplierId);
  }

  if (status === "checking") {
    return (
      <main className="loading-screen">
        <strong>Omnia Companion</strong>
        <span>Session wird geprüft</span>
      </main>
    );
  }

  if (!session || !bootstrap) {
    return <LoginView onLogin={handleLogin} busy={status === "loading"} error={loginError} />;
  }

  const selectedCase = bootstrap.cases.find((record) => record.id === selectedCaseId) ?? bootstrap.cases[0];
  const selectedProcurementCase =
    bootstrap.procurementCases.find((record) => record.id === selectedProcurementCaseId) ?? bootstrap.procurementCases[0];
  const connectionLabel = bootstrap.source === "live" ? "Live Omnia" : "Demo-BFF";

  return (
    <AppShell
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      userName={bootstrap.currentUser.name}
      workspace={bootstrap.currentUser.workspace}
      connectionLabel={connectionLabel}
      onLogout={handleLogout}
      auditEvents={auditEvents}
    >
      {activeModule === "cases" && selectedCase ? (
        <CasesModule
          cases={bootstrap.cases}
          selectedCase={selectedCase}
          onSelectCase={(record: CaseRecord) => setSelectedCaseId(record.id)}
          onAction={recordAction}
        />
      ) : null}

      {activeModule === "orders" && selectedProcurementCase ? (
        <OrdersModule
          procurementCases={bootstrap.procurementCases}
          selectedCase={selectedProcurementCase}
          onSelectCase={(record: ProcurementCase) => setSelectedProcurementCaseId(record.id)}
          onAction={recordAction}
          onCreateSupplierOrder={handleCreateSupplierOrder}
        />
      ) : null}

      {activeModule === "goods-receipts" ? (
        <GoodsReceiptsModule receipts={bootstrap.goodsReceipts} onAction={recordAction} />
      ) : null}
    </AppShell>
  );
}
