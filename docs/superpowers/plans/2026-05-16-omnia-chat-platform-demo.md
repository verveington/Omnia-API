# Omnia Chat Platform Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate local demo web platform `omnia-chat-platform/` with a chat-first Omnia assistant, visible context cockpit, mock Omnia tools, audit, and local-AI-ready gateway.

**Architecture:** The project is independent from `companion-app` but reuses the same product concepts: BFF-only tool execution, explicit validation, confirmation cards for write actions, and no direct Omnia calls from the browser. The first implementation uses deterministic mock data and a `rule-based` LLM gateway, with an OpenAI-compatible local gateway interface prepared behind the same server API.

**Tech Stack:** Vite, React, TypeScript, Node HTTP server, Node test runner, local CSS, no database for the demo.

---

## File Structure

- Create `omnia-chat-platform/package.json`: scripts and dependencies for the separate app.
- Create `omnia-chat-platform/vite.config.ts`: Vite config with `/api` proxy to the chat BFF.
- Create `omnia-chat-platform/tsconfig*.json`: TypeScript config.
- Create `omnia-chat-platform/index.html`: Vite entry.
- Create `omnia-chat-platform/server/index.mjs`: local BFF and route composition.
- Create `omnia-chat-platform/server/lib/http-utils.mjs`: JSON helpers and response helpers.
- Create `omnia-chat-platform/server/lib/demo-data.mjs`: local customer, case, proposal, order and audit seed data.
- Create `omnia-chat-platform/server/lib/tool-service.mjs`: mock Omnia tools and action confirmation.
- Create `omnia-chat-platform/server/lib/intent-service.mjs`: rule-based intent parser and local LLM gateway boundary.
- Create `omnia-chat-platform/server/lib/chat-service.mjs`: chat orchestration, context updates, action cards and audit.
- Create `omnia-chat-platform/server/lib/*.test.mjs`: BFF unit tests.
- Create `omnia-chat-platform/src/core/types.ts`: shared frontend domain types.
- Create `omnia-chat-platform/src/api/client.ts`: typed API client.
- Create `omnia-chat-platform/src/App.tsx`: app composition and state.
- Create `omnia-chat-platform/src/components/*.tsx`: app shell and shared UI.
- Create `omnia-chat-platform/src/features/chat/*.tsx`: chat stream, input, messages and action cards.
- Create `omnia-chat-platform/src/features/context/*.tsx`: Omnia context cockpit.
- Create `omnia-chat-platform/src/features/audit/*.tsx`: audit panel.
- Create `omnia-chat-platform/src/styles.css`: full UI styling.

## Task 1: Scaffold Separate Project

**Files:**
- Create: `omnia-chat-platform/package.json`
- Create: `omnia-chat-platform/vite.config.ts`
- Create: `omnia-chat-platform/tsconfig.json`
- Create: `omnia-chat-platform/tsconfig.app.json`
- Create: `omnia-chat-platform/index.html`
- Create: `omnia-chat-platform/src/main.tsx`
- Create: `omnia-chat-platform/src/App.tsx`
- Create: `omnia-chat-platform/src/styles.css`

- [ ] **Step 1: Create package and config files**

Create `omnia-chat-platform/package.json`:

```json
{
  "name": "omnia-chat-platform",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "api": "node server/index.mjs",
    "build": "tsc -b && vite build",
    "test:bff": "node --test server/**/*.test.mjs"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  },
  "devDependencies": {
    "@types/node": "^25.8.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3"
  }
}
```

Create `omnia-chat-platform/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5183,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5184",
        changeOrigin: true,
      },
    },
  },
});
```

Create `omnia-chat-platform/tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

Create `omnia-chat-platform/tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

Create `omnia-chat-platform/index.html`:

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Omnia Chat Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create minimal React entry**

Create `omnia-chat-platform/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `omnia-chat-platform/src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>Omnia Chat Platform</h1>
      <p>Demo-Modus mit lokaler KI-Schnittstelle.</p>
    </main>
  );
}
```

Create `omnia-chat-platform/src/styles.css`:

```css
:root {
  color-scheme: light;
  --bg: #f5f7f8;
  --surface: #ffffff;
  --line: #dce4e1;
  --text: #17211f;
  --muted: #63706b;
  --accent: #1c7c64;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text);
  background: var(--bg);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

from `omnia-chat-platform/`.

Expected: `node_modules/` and `package-lock.json` are created.

- [ ] **Step 4: Verify scaffold builds**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete with exit code 0.

- [ ] **Step 5: Commit scaffold**

```bash
git add omnia-chat-platform
git commit -m "Scaffold Omnia chat platform"
```

## Task 2: Create Demo Domain Types and Data

**Files:**
- Create: `omnia-chat-platform/server/lib/demo-data.mjs`
- Create: `omnia-chat-platform/src/core/types.ts`

- [ ] **Step 1: Add shared frontend types**

Create `omnia-chat-platform/src/core/types.ts`:

```ts
export type EntityType = "customer" | "case" | "proposal" | "supplierOrder";

export interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  address: string;
}

export interface CaseRecord {
  id: string;
  number: string;
  customerId: string;
  status: string;
  deliveryAddress: string;
}

export interface Proposal {
  id: string;
  caseId: string;
  supplierId: string;
  supplierName: string;
  articleNumber: string;
  pzn: string;
  description: string;
  quantity: number;
  unit: string;
  readiness: "ready" | "pzn_missing" | "supplier_missing";
}

export interface SupplierOrder {
  id: string;
  number: string;
  caseId: string;
  supplierId: string;
  supplierName: string;
  positions: Proposal[];
  status: "draft" | "created" | "blocked";
}

export interface AuditEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  status: "simulated" | "blocked" | "confirmed";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  createdAt: string;
  actionCard?: ActionCard;
}

export interface ActionCard {
  id: string;
  title: string;
  summary: string;
  status: "pending_confirmation" | "confirmed" | "blocked";
  confirmLabel: string;
  cancelLabel: string;
}

export interface ChatContext {
  customer?: Customer;
  caseRecord?: CaseRecord;
  proposals: Proposal[];
  supplierOrder?: SupplierOrder;
  validationMessages: string[];
}

export interface ChatState {
  mode: "demo";
  llmProvider: "rule-based" | "local-openai-compatible";
  messages: ChatMessage[];
  context: ChatContext;
  audit: AuditEvent[];
}
```

- [ ] **Step 2: Add demo data**

Create `omnia-chat-platform/server/lib/demo-data.mjs`:

```js
export const demoData = {
  customers: [
    {
      id: "customer-10042",
      customerNumber: "10042",
      firstName: "Max",
      lastName: "Mustermann",
      displayName: "Max Mustermann",
      address: "Musterweg 12, 80331 Musterstadt",
    },
    {
      id: "customer-10043",
      customerNumber: "10043",
      firstName: "Erika",
      lastName: "Beispiel",
      displayName: "Erika Beispiel",
      address: "Filialstrasse 4, 80333 Muenchen",
    },
  ],
  cases: [
    {
      id: "case-18581",
      number: "18581",
      customerId: "customer-10042",
      status: "Bestellvorschlag",
      deliveryAddress: "Musterweg 12, 80331 Musterstadt",
    },
    {
      id: "case-18542",
      number: "18542",
      customerId: "customer-10043",
      status: "PZN klaeren",
      deliveryAddress: "Filialstrasse 4, 80333 Muenchen",
    },
  ],
  proposals: [
    {
      id: "proposal-18581-1",
      caseId: "case-18581",
      supplierId: "supplier-medcomplett",
      supplierName: "MedComplett GmbH",
      articleNumber: "ART-10001",
      pzn: "12345678",
      description: "VLIESKOMPRESSEN unsteril 10x10 cm",
      quantity: 5,
      unit: "Packung",
      readiness: "ready",
    },
    {
      id: "proposal-18542-1",
      caseId: "case-18542",
      supplierId: "supplier-medcomplett",
      supplierName: "MedComplett GmbH",
      articleNumber: "ART-30003",
      pzn: "",
      description: "Fixierbinde elastisch 8 cm",
      quantity: 3,
      unit: "Packung",
      readiness: "pzn_missing",
    },
  ],
};
```

- [ ] **Step 3: Commit data model**

```bash
git add omnia-chat-platform/src/core/types.ts omnia-chat-platform/server/lib/demo-data.mjs
git commit -m "Add chat platform demo domain model"
```

## Task 3: Implement Mock Tool Service with Tests

**Files:**
- Create: `omnia-chat-platform/server/lib/tool-service.mjs`
- Create: `omnia-chat-platform/server/lib/tool-service.test.mjs`

- [ ] **Step 1: Write failing tool tests**

Create `omnia-chat-platform/server/lib/tool-service.test.mjs`:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { createToolService } from "./tool-service.mjs";

test("searches customers by last name", () => {
  const tools = createToolService();
  const results = tools.searchCustomers("muster");

  assert.equal(results.length, 1);
  assert.equal(results[0].displayName, "Max Mustermann");
});

test("finds a case and hydrates customer and proposals", () => {
  const tools = createToolService();
  const result = tools.searchCases("18581")[0];

  assert.equal(result.caseRecord.number, "18581");
  assert.equal(result.customer.displayName, "Max Mustermann");
  assert.equal(result.proposals[0].pzn, "12345678");
});

test("creates supplier order draft for ready proposal group", () => {
  const tools = createToolService();
  const result = tools.createSupplierOrderDraft("case-18581", "supplier-medcomplett");

  assert.equal(result.status, "ready");
  assert.equal(result.order.number, "DEMO-18581-01");
  assert.equal(result.validationMessages.length, 0);
});

test("blocks supplier order draft when pzn is missing", () => {
  const tools = createToolService();
  const result = tools.createSupplierOrderDraft("case-18542", "supplier-medcomplett");

  assert.equal(result.status, "blocked");
  assert.deepEqual(result.validationMessages, ["ART-30003: PZN fehlt"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:bff -- server/lib/tool-service.test.mjs
```

Expected: fails because `tool-service.mjs` does not exist.

- [ ] **Step 3: Implement mock tools**

Create `omnia-chat-platform/server/lib/tool-service.mjs`:

```js
import { demoData } from "./demo-data.mjs";

export function createToolService() {
  function searchCustomers(query) {
    const normalized = normalize(query);
    return demoData.customers.filter((customer) =>
      [customer.customerNumber, customer.firstName, customer.lastName, customer.displayName]
        .some((value) => normalize(value).includes(normalized)),
    );
  }

  function searchCases(query) {
    const normalized = normalize(query);
    return demoData.cases
      .filter((caseRecord) => [caseRecord.number, caseRecord.status].some((value) => normalize(value).includes(normalized)))
      .map(hydrateCase);
  }

  function searchOrderProposals(query) {
    const normalized = normalize(query);
    return demoData.proposals.filter((proposal) =>
      [proposal.supplierName, proposal.articleNumber, proposal.pzn, proposal.description]
        .some((value) => normalize(value).includes(normalized)),
    );
  }

  function createSupplierOrderDraft(caseId, supplierId) {
    const caseRecord = demoData.cases.find((item) => item.id === caseId);
    const proposals = demoData.proposals.filter((proposal) => proposal.caseId === caseId && proposal.supplierId === supplierId);
    const validationMessages = proposals.flatMap(validateProposal);

    if (!caseRecord || !proposals.length) {
      return { status: "blocked", order: null, validationMessages: ["Keine passende Lieferantengruppe gefunden"] };
    }

    if (validationMessages.length) {
      return { status: "blocked", order: null, validationMessages };
    }

    return {
      status: "ready",
      validationMessages: [],
      order: {
        id: `demo-order-${caseRecord.number}-${supplierId}`,
        number: `DEMO-${caseRecord.number}-01`,
        caseId,
        supplierId,
        supplierName: proposals[0].supplierName,
        positions: proposals,
        status: "draft",
      },
    };
  }

  function hydrateCase(caseRecord) {
    const customer = demoData.customers.find((item) => item.id === caseRecord.customerId);
    const proposals = demoData.proposals.filter((proposal) => proposal.caseId === caseRecord.id);
    return { caseRecord, customer, proposals };
  }

  return {
    searchCustomers,
    searchCases,
    searchOrderProposals,
    createSupplierOrderDraft,
  };
}

function validateProposal(proposal) {
  const messages = [];
  if (!proposal.pzn) messages.push(`${proposal.articleNumber}: PZN fehlt`);
  if (!proposal.articleNumber) messages.push(`${proposal.description}: Artikelnummer fehlt`);
  if (!proposal.unit) messages.push(`${proposal.articleNumber}: Einheit fehlt`);
  if (!Number.isFinite(proposal.quantity) || proposal.quantity <= 0) messages.push(`${proposal.articleNumber}: Menge ungueltig`);
  return messages;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
```

- [ ] **Step 4: Verify tool tests pass**

Run:

```bash
npm run test:bff -- server/lib/tool-service.test.mjs
```

Expected: all tool-service tests pass.

- [ ] **Step 5: Commit tool service**

```bash
git add omnia-chat-platform/server/lib/tool-service.mjs omnia-chat-platform/server/lib/tool-service.test.mjs
git commit -m "Add mock Omnia chat tools"
```

## Task 4: Implement Intent and Local LLM Gateway Boundary

**Files:**
- Create: `omnia-chat-platform/server/lib/intent-service.mjs`
- Create: `omnia-chat-platform/server/lib/intent-service.test.mjs`

- [ ] **Step 1: Write failing intent tests**

Create `omnia-chat-platform/server/lib/intent-service.test.mjs`:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { createIntentService } from "./intent-service.mjs";

test("parses customer search intent", async () => {
  const service = createIntentService({ provider: "rule-based" });
  const intent = await service.parse("Suche Kunde Mustermann");

  assert.equal(intent.intent, "search_customers");
  assert.equal(intent.arguments.query, "Mustermann");
  assert.equal(intent.requiresConfirmation, false);
});

test("parses case search intent", async () => {
  const service = createIntentService({ provider: "rule-based" });
  const intent = await service.parse("Zeig mir Vorgang 18581");

  assert.equal(intent.intent, "search_cases");
  assert.equal(intent.arguments.query, "18581");
});

test("parses supplier order draft intent", async () => {
  const service = createIntentService({ provider: "rule-based" });
  const intent = await service.parse("Erzeuge Bestellung fuer MedComplett");

  assert.equal(intent.intent, "create_supplier_order_draft");
  assert.equal(intent.arguments.supplierQuery, "MedComplett");
  assert.equal(intent.requiresConfirmation, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:bff -- server/lib/intent-service.test.mjs
```

Expected: fails because `intent-service.mjs` does not exist.

- [ ] **Step 3: Implement rule-based parser and local provider shell**

Create `omnia-chat-platform/server/lib/intent-service.mjs`:

```js
export function createIntentService({
  provider = process.env.CHAT_LLM_PROVIDER || "rule-based",
  baseUrl = process.env.CHAT_LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  model = process.env.CHAT_LLM_MODEL || "",
  fetchImpl = globalThis.fetch,
} = {}) {
  async function parse(message) {
    if (provider === "local-openai-compatible") {
      return parseWithLocalOpenAi({ message, baseUrl, model, fetchImpl });
    }
    return parseRuleBased(message);
  }

  return { parse, provider };
}

function parseRuleBased(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (lower.includes("kunde")) {
    return intent("search_customers", { query: cleanup(text.replace(/suche|kunde/gi, "")) }, false, "Ich suche nach passenden Kunden.");
  }

  if (lower.includes("vorgang")) {
    const number = text.match(/\d{3,}/)?.[0] || cleanup(text.replace(/zeig|zeige|mir|vorgang/gi, ""));
    return intent("search_cases", { query: number }, false, `Ich suche nach Vorgang ${number}.`);
  }

  if (lower.includes("bestellvorsch")) {
    return intent("search_order_proposals", { query: cleanup(text.replace(/zeige|zeig|bestellvorschlaege|bestellvorschläge/gi, "")) }, false, "Ich suche Bestellvorschlaege.");
  }

  if (lower.includes("bestellung") && (lower.includes("erzeuge") || lower.includes("erstelle"))) {
    return intent("create_supplier_order_draft", { supplierQuery: cleanup(text.replace(/erzeuge|erstelle|bestellung|fuer|für/gi, "")) }, true, "Ich bereite eine Bestellung zur Bestaetigung vor.");
  }

  if (lower.includes("omnia") && lower.includes("oeffnen")) {
    return intent("open_in_omnia", {}, false, "Ich bereite den Omnia-Oeffnungslink vor.");
  }

  return intent("unknown", { query: text }, false, "Ich brauche noch mehr Kontext. Du kannst nach Kunden, Vorgaengen oder Bestellungen fragen.");
}

async function parseWithLocalOpenAi({ message, baseUrl, model, fetchImpl }) {
  if (!fetchImpl || !model) return parseRuleBased(message);
  const response = await fetchImpl(new URL("/v1/chat/completions", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Return only JSON with intent, confidence, arguments, requiresConfirmation, assistantText.",
        },
        { role: "user", content: message },
      ],
      temperature: 0,
    }),
  });
  if (!response.ok) return parseRuleBased(message);
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || "";
  return safeIntent(content) || parseRuleBased(message);
}

function safeIntent(content) {
  try {
    const parsed = JSON.parse(content);
    if (!parsed.intent || typeof parsed.arguments !== "object") return null;
    return {
      intent: parsed.intent,
      confidence: Number(parsed.confidence) || 0,
      arguments: parsed.arguments,
      requiresConfirmation: Boolean(parsed.requiresConfirmation),
      assistantText: String(parsed.assistantText || ""),
    };
  } catch {
    return null;
  }
}

function intent(name, args, requiresConfirmation, assistantText) {
  return {
    intent: name,
    confidence: 0.9,
    arguments: args,
    requiresConfirmation,
    assistantText,
  };
}

function cleanup(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
```

- [ ] **Step 4: Verify intent tests pass**

Run:

```bash
npm run test:bff -- server/lib/intent-service.test.mjs
```

Expected: all intent-service tests pass.

- [ ] **Step 5: Commit intent service**

```bash
git add omnia-chat-platform/server/lib/intent-service.mjs omnia-chat-platform/server/lib/intent-service.test.mjs
git commit -m "Add local AI intent gateway"
```

## Task 5: Implement Chat Service and BFF API

**Files:**
- Create: `omnia-chat-platform/server/lib/chat-service.mjs`
- Create: `omnia-chat-platform/server/lib/chat-service.test.mjs`
- Create: `omnia-chat-platform/server/lib/http-utils.mjs`
- Create: `omnia-chat-platform/server/index.mjs`

- [ ] **Step 1: Write failing chat service tests**

Create `omnia-chat-platform/server/lib/chat-service.test.mjs`:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { createChatService } from "./chat-service.mjs";

test("handles customer search and updates context", async () => {
  const chat = createChatService();
  const state = await chat.sendMessage("Suche Kunde Mustermann");

  assert.equal(state.context.customer.displayName, "Max Mustermann");
  assert.match(state.messages.at(-1).text, /Max Mustermann/);
});

test("handles case search and hydrates context", async () => {
  const chat = createChatService();
  const state = await chat.sendMessage("Zeig mir Vorgang 18581");

  assert.equal(state.context.caseRecord.number, "18581");
  assert.equal(state.context.customer.displayName, "Max Mustermann");
  assert.equal(state.context.proposals.length, 1);
});

test("creates confirmation card for ready supplier order", async () => {
  const chat = createChatService();
  await chat.sendMessage("Zeig mir Vorgang 18581");
  const state = await chat.sendMessage("Erzeuge Bestellung fuer MedComplett");

  assert.equal(state.messages.at(-1).actionCard.status, "pending_confirmation");
  assert.equal(state.context.validationMessages.length, 0);
});

test("blocks supplier order when proposal has missing pzn", async () => {
  const chat = createChatService();
  await chat.sendMessage("Zeig mir Vorgang 18542");
  const state = await chat.sendMessage("Erzeuge Bestellung fuer MedComplett");

  assert.equal(state.context.validationMessages[0], "ART-30003: PZN fehlt");
  assert.equal(state.messages.at(-1).actionCard.status, "blocked");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:bff -- server/lib/chat-service.test.mjs
```

Expected: fails because `chat-service.mjs` does not exist.

- [ ] **Step 3: Implement chat service**

Create `omnia-chat-platform/server/lib/chat-service.mjs`:

```js
import { createIntentService } from "./intent-service.mjs";
import { createToolService } from "./tool-service.mjs";

export function createChatService({ intentService = createIntentService(), toolService = createToolService() } = {}) {
  let state = createInitialState(intentService.provider);

  async function getState() {
    return state;
  }

  async function sendMessage(text) {
    const userMessage = message("user", text);
    const parsed = await intentService.parse(text);
    const next = handleIntent(parsed);
    state = {
      ...state,
      messages: [...state.messages, userMessage, next.assistantMessage],
      context: next.context,
      audit: next.auditEvent ? [next.auditEvent, ...state.audit] : state.audit,
    };
    return state;
  }

  function handleIntent(parsed) {
    if (parsed.intent === "search_customers") {
      const results = toolService.searchCustomers(parsed.arguments.query);
      const customer = results[0];
      return respond(customer ? `Gefunden: ${customer.displayName}.` : "Keine Kunden gefunden.", {
        ...state.context,
        customer,
      });
    }

    if (parsed.intent === "search_cases") {
      const result = toolService.searchCases(parsed.arguments.query)[0];
      if (!result) return respond("Kein Vorgang gefunden.", state.context);
      return respond(`Vorgang ${result.caseRecord.number} geladen.`, {
        customer: result.customer,
        caseRecord: result.caseRecord,
        proposals: result.proposals,
        validationMessages: [],
      });
    }

    if (parsed.intent === "search_order_proposals") {
      const proposals = state.context.caseRecord
        ? toolService.searchOrderProposals("").filter((proposal) => proposal.caseId === state.context.caseRecord.id)
        : toolService.searchOrderProposals(parsed.arguments.query || "");
      return respond(`${proposals.length} Bestellvorschlaege gefunden.`, {
        ...state.context,
        proposals,
      });
    }

    if (parsed.intent === "create_supplier_order_draft") {
      if (!state.context.caseRecord) {
        return respond("Bitte zuerst einen Vorgang auswaehlen.", state.context);
      }
      const supplierId = resolveSupplierId(parsed.arguments.supplierQuery, state.context.proposals);
      const draft = toolService.createSupplierOrderDraft(state.context.caseRecord.id, supplierId);
      if (draft.status === "blocked") {
        return respond("Bestellung kann nicht erzeugt werden.", {
          ...state.context,
          validationMessages: draft.validationMessages,
        }, actionCard("Bestellung blockiert", draft.validationMessages.join("; "), "blocked"), audit("Bestellung blockiert", state.context.caseRecord.number, "blocked"));
      }
      return respond("Bestellung ist bereit zur Bestaetigung.", {
        ...state.context,
        supplierOrder: draft.order,
        validationMessages: [],
      }, actionCard("Bestellung erzeugen", `Lieferant ${draft.order.supplierName}, ${draft.order.positions.length} Positionen`, "pending_confirmation"));
    }

    if (parsed.intent === "open_in_omnia") {
      const target = state.context.caseRecord?.number || state.context.customer?.displayName || "aktueller Kontext";
      return respond(`Demo: In Omnia wuerde ${target} geoeffnet.`, state.context, undefined, audit("Omnia-Oeffnung simuliert", target, "simulated"));
    }

    return respond(parsed.assistantText, state.context);
  }

  function respond(text, context, actionCardValue, auditEvent) {
    return {
      assistantMessage: message("assistant", text, actionCardValue),
      context,
      auditEvent,
    };
  }

  return { getState, sendMessage };
}

function createInitialState(llmProvider) {
  return {
    mode: "demo",
    llmProvider,
    messages: [
      message("assistant", "Demo bereit. Frage nach Kunden, Vorgaengen oder Bestellungen."),
    ],
    context: { proposals: [], validationMessages: [] },
    audit: [],
  };
}

function resolveSupplierId(query, proposals) {
  const normalized = normalize(query);
  return proposals.find((proposal) => normalize(proposal.supplierName).includes(normalized))?.supplierId || normalized;
}

function actionCard(title, summary, status) {
  return {
    id: `action-${Date.now()}`,
    title,
    summary,
    status,
    confirmLabel: "Bestaetigen",
    cancelLabel: "Abbrechen",
  };
}

function audit(action, target, status) {
  return {
    id: `audit-${Date.now()}`,
    time: new Date().toISOString(),
    actor: "Demo-Benutzer",
    action,
    target,
    status,
  };
}

function message(role, text, actionCard) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
    ...(actionCard ? { actionCard } : {}),
  };
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
```

- [ ] **Step 4: Implement HTTP utilities and API server**

Create `omnia-chat-platform/server/lib/http-utils.mjs`:

```js
export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": body.length,
  });
  res.end(body);
}
```

Create `omnia-chat-platform/server/index.mjs`:

```js
import http from "node:http";
import { createChatService } from "./lib/chat-service.mjs";
import { readJson, sendJson } from "./lib/http-utils.mjs";

const port = Number(process.env.CHAT_API_PORT || 5184);
const chat = createChatService();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, service: "omnia-chat-platform-bff" });
    }

    if (req.method === "GET" && url.pathname === "/api/chat/state") {
      return sendJson(res, 200, { data: await chat.getState() });
    }

    if (req.method === "POST" && url.pathname === "/api/chat/messages") {
      const body = await readJson(req);
      return sendJson(res, 200, { data: await chat.sendMessage(body.text || "") });
    }

    return sendJson(res, 404, { error: { message: "Not found", status: 404 } });
  } catch (error) {
    return sendJson(res, 500, { error: { message: "Internal server error", status: 500 } });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Omnia Chat BFF listening on http://127.0.0.1:${port}`);
});
```

- [ ] **Step 5: Verify chat tests pass**

Run:

```bash
npm run test:bff
```

Expected: all BFF tests pass.

- [ ] **Step 6: Commit chat API**

```bash
git add omnia-chat-platform/server
git commit -m "Add chat BFF demo orchestration"
```

## Task 6: Build Chat UI and Context Cockpit

**Files:**
- Create: `omnia-chat-platform/src/api/client.ts`
- Create: `omnia-chat-platform/src/components/AppShell.tsx`
- Create: `omnia-chat-platform/src/components/ui.tsx`
- Create: `omnia-chat-platform/src/features/chat/ChatPanel.tsx`
- Create: `omnia-chat-platform/src/features/context/ContextCockpit.tsx`
- Create: `omnia-chat-platform/src/features/audit/AuditPanel.tsx`
- Modify: `omnia-chat-platform/src/App.tsx`
- Modify: `omnia-chat-platform/src/styles.css`

- [ ] **Step 1: Add API client**

Create `omnia-chat-platform/src/api/client.ts`:

```ts
import type { ChatState } from "../core/types";

export async function getChatState(): Promise<ChatState> {
  const result = await request<{ data: ChatState }>("/api/chat/state");
  return result.data;
}

export async function sendChatMessage(text: string): Promise<ChatState> {
  const result = await request<{ data: ChatState }>("/api/chat/messages", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return result.data;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "API request failed");
  return payload;
}
```

- [ ] **Step 2: Add UI components**

Create `omnia-chat-platform/src/components/ui.tsx`:

```tsx
import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "blue" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Button({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
```

Create `omnia-chat-platform/src/components/AppShell.tsx`:

```tsx
import { Bot, ClipboardList, PackageSearch, UserSearch } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">
          <Bot size={20} />
          <strong>Omnia Chat</strong>
          <span>Demo lokal</span>
        </div>
        <nav>
          <button className="nav-item nav-item--active"><UserSearch size={16} /> Kunden</button>
          <button className="nav-item"><ClipboardList size={16} /> Vorgaenge</button>
          <button className="nav-item"><PackageSearch size={16} /> Bestellungen</button>
        </nav>
      </aside>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Add feature panels**

Create `omnia-chat-platform/src/features/chat/ChatPanel.tsx`:

```tsx
import { FormEvent, useState } from "react";
import type { ChatState } from "../../core/types";
import { Button } from "../../components/ui";

export function ChatPanel({
  state,
  busy,
  onSend,
}: {
  state: ChatState;
  busy: boolean;
  onSend: (text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await onSend(text);
  }

  return (
    <section className="chat-panel">
      <header>
        <span>Lokaler Chat-Assistent</span>
        <strong>Frage nach Kunden, Vorgaengen oder Bestellungen</strong>
      </header>
      <div className="message-list">
        {state.messages.map((message) => (
          <article className={`message message--${message.role}`} key={message.id}>
            <p>{message.text}</p>
            {message.actionCard ? (
              <div className={`action-card action-card--${message.actionCard.status}`}>
                <strong>{message.actionCard.title}</strong>
                <span>{message.actionCard.summary}</span>
                {message.actionCard.status === "pending_confirmation" ? (
                  <div className="action-card__actions">
                    <Button>{message.actionCard.confirmLabel}</Button>
                    <button className="text-button">{message.actionCard.cancelLabel}</button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="z. B. Zeig mir Vorgang 18581" />
        <Button disabled={busy}>{busy ? "Sende" : "Senden"}</Button>
      </form>
    </section>
  );
}
```

Create `omnia-chat-platform/src/features/context/ContextCockpit.tsx`:

```tsx
import type { ChatContext } from "../../core/types";
import { Badge } from "../../components/ui";

export function ContextCockpit({ context, llmProvider }: { context: ChatContext; llmProvider: string }) {
  return (
    <aside className="context-panel">
      <header>
        <span>Kontext</span>
        <Badge tone="blue">{llmProvider}</Badge>
      </header>
      <section>
        <h2>Kunde</h2>
        <strong>{context.customer?.displayName || "Noch kein Kunde"}</strong>
        <p>{context.customer?.address || "Suche einen Kunden oder Vorgang."}</p>
      </section>
      <section>
        <h2>Vorgang</h2>
        <strong>{context.caseRecord ? `Vorgang ${context.caseRecord.number}` : "Nicht ausgewaehlt"}</strong>
        <p>{context.caseRecord?.status || "Kein aktiver Vorgang"}</p>
      </section>
      <section>
        <h2>Bestellvorschlaege</h2>
        {context.proposals.length ? context.proposals.map((proposal) => (
          <div className="proposal-line" key={proposal.id}>
            <strong>{proposal.articleNumber}</strong>
            <span>{proposal.pzn || "PZN fehlt"}</span>
            <Badge tone={proposal.readiness === "ready" ? "green" : "red"}>{proposal.readiness === "ready" ? "bereit" : "blockiert"}</Badge>
          </div>
        )) : <p>Keine Vorschlaege geladen.</p>}
      </section>
      {context.validationMessages.length ? (
        <section className="validation-panel">
          <h2>Validierung</h2>
          {context.validationMessages.map((message) => <p key={message}>{message}</p>)}
        </section>
      ) : null}
    </aside>
  );
}
```

Create `omnia-chat-platform/src/features/audit/AuditPanel.tsx`:

```tsx
import type { AuditEvent } from "../../core/types";

export function AuditPanel({ events }: { events: AuditEvent[] }) {
  return (
    <aside className="audit-panel">
      <strong>Audit</strong>
      {events.length ? events.map((event) => (
        <article key={event.id}>
          <span>{event.action}</span>
          <small>{event.target}</small>
        </article>
      )) : <p>Noch keine Aktionen.</p>}
    </aside>
  );
}
```

- [ ] **Step 4: Compose app**

Replace `omnia-chat-platform/src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import type { ChatState } from "./core/types";
import { getChatState, sendChatMessage } from "./api/client";
import { AppShell } from "./components/AppShell";
import { ChatPanel } from "./features/chat/ChatPanel";
import { ContextCockpit } from "./features/context/ContextCockpit";
import { AuditPanel } from "./features/audit/AuditPanel";

export default function App() {
  const [state, setState] = useState<ChatState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getChatState().then(setState);
  }, []);

  async function handleSend(text: string) {
    setBusy(true);
    try {
      setState(await sendChatMessage(text));
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return <main className="loading">Omnia Chat wird geladen</main>;
  }

  return (
    <AppShell>
      <main className="workspace">
        <ChatPanel state={state} busy={busy} onSend={handleSend} />
        <ContextCockpit context={state.context} llmProvider={state.llmProvider} />
        <AuditPanel events={state.audit} />
      </main>
    </AppShell>
  );
}
```

- [ ] **Step 5: Replace styles with operational layout**

Replace `omnia-chat-platform/src/styles.css`:

```css
:root {
  color-scheme: light;
  --bg: #f5f7f8;
  --surface: #ffffff;
  --surface-alt: #eef4f2;
  --line: #dce4e1;
  --line-strong: #c8d4d0;
  --text: #17211f;
  --muted: #63706b;
  --accent: #1c7c64;
  --accent-dark: #125541;
  --blue: #276fbf;
  --red: #ba3a32;
  --green-soft: #e5f3ee;
  --blue-soft: #e8f1fb;
  --red-soft: #fae8e6;
  --shadow: 0 10px 30px rgba(21, 38, 32, 0.08);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text);
  background: var(--bg);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: var(--bg);
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

.loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: var(--muted);
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
}

.side-nav {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 18px;
  border-right: 1px solid var(--line);
  background: var(--surface);
}

.brand {
  display: grid;
  gap: 4px;
  margin-bottom: 28px;
}

.brand svg {
  width: 38px;
  height: 38px;
  padding: 8px;
  border-radius: 8px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--accent), var(--blue));
}

.brand strong {
  font-size: 17px;
}

.brand span,
.context-panel p,
.audit-panel p,
.audit-panel small {
  color: var(--muted);
}

.side-nav nav {
  display: grid;
  gap: 8px;
}

.nav-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 11px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text);
  background: transparent;
  text-align: left;
  font-weight: 750;
}

.nav-item--active {
  border-color: #b7d7ce;
  background: var(--green-soft);
  color: var(--accent-dark);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 18px;
  height: 100vh;
  padding: 18px;
}

.chat-panel,
.context-panel,
.audit-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.chat-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.chat-panel header,
.context-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

.chat-panel header span,
.context-panel header span {
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.message-list {
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.message {
  max-width: min(760px, 92%);
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfc;
}

.message--user {
  justify-self: end;
  color: #ffffff;
  border-color: var(--accent);
  background: var(--accent);
}

.message--assistant,
.message--tool {
  justify-self: start;
}

.message p {
  margin: 0;
}

.chat-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid var(--line);
}

.chat-input input {
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  background: #fbfcfc;
}

.button {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: #ffffff;
  background: var(--accent);
  font-weight: 800;
}

.text-button {
  border: 0;
  color: var(--muted);
  background: transparent;
  font-weight: 750;
}

.badge {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 850;
}

.badge--neutral {
  color: var(--muted);
  background: #eef1f0;
}

.badge--green {
  color: var(--accent-dark);
  background: var(--green-soft);
}

.badge--blue {
  color: #174d89;
  background: var(--blue-soft);
}

.badge--red {
  color: var(--red);
  background: var(--red-soft);
}

.action-card {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 11px;
  border-radius: 8px;
  background: var(--surface);
}

.action-card--pending_confirmation {
  border: 1px solid #b7d7ce;
}

.action-card--blocked {
  border: 1px solid #efb5af;
  background: var(--red-soft);
}

.action-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.context-panel {
  min-height: 0;
  overflow: auto;
}

.context-panel section {
  display: grid;
  gap: 7px;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

.context-panel section:last-child {
  border-bottom: 0;
}

.context-panel h2 {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

.context-panel strong {
  font-size: 16px;
}

.proposal-line {
  display: grid;
  grid-template-columns: minmax(90px, auto) minmax(70px, auto) auto;
  gap: 8px;
  align-items: center;
  padding: 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfc;
}

.validation-panel {
  color: var(--red);
  background: var(--red-soft);
}

.audit-panel {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
}

.audit-panel article {
  display: inline-grid;
  margin-right: 18px;
}

.audit-panel span {
  font-weight: 750;
}

@media (max-width: 900px) {
  .app-shell,
  .workspace {
    display: block;
    height: auto;
  }

  .side-nav {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .side-nav nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .workspace {
    padding: 12px;
  }

  .chat-panel,
  .context-panel,
  .audit-panel {
    margin-bottom: 12px;
  }

  .chat-panel {
    min-height: 70vh;
  }
}
```

- [ ] **Step 6: Verify frontend build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 7: Commit UI**

```bash
git add omnia-chat-platform/src
git commit -m "Add Omnia chat demo UI"
```

## Task 7: Browser Verification and Final Commit

**Files:**
- No new source files.
- Verify running app.

- [ ] **Step 1: Start BFF**

Run from `omnia-chat-platform/`:

```bash
npm run api
```

Expected: `Omnia Chat BFF listening on http://127.0.0.1:5184`.

- [ ] **Step 2: Start frontend**

Run from `omnia-chat-platform/` in a second session:

```bash
npm run dev
```

Expected: Vite serves `http://127.0.0.1:5183/`.

- [ ] **Step 3: Verify main demo flows with Playwright**

Create and run this temporary Playwright script from `playwright-recorder/`:

```bash
node - <<'NODE'
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const issues = [];
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) issues.push(`${msg.type()}: ${msg.text()}`);
});
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:5183/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.innerText.includes('Omnia Chat'), null, { timeout: 10000 });

async function send(text) {
  await page.locator('.chat-input input').fill(text);
  await page.getByRole('button', { name: /Senden/ }).click();
  await page.waitForTimeout(250);
}

await send('Suche Kunde Mustermann');
await page.waitForFunction(() => document.body.innerText.includes('Max Mustermann'), null, { timeout: 10000 });
await send('Zeig mir Vorgang 18581');
await page.waitForFunction(() => document.body.innerText.includes('Vorgang 18581') && document.body.innerText.includes('ART-10001'), null, { timeout: 10000 });
await send('Erzeuge Bestellung fuer MedComplett');
await page.waitForFunction(() => document.body.innerText.includes('Bestellung erzeugen'), null, { timeout: 10000 });
await send('Zeig mir Vorgang 18542');
await page.waitForFunction(() => document.body.innerText.includes('ART-30003'), null, { timeout: 10000 });
await send('Erzeuge Bestellung fuer MedComplett');
await page.waitForFunction(() => document.body.innerText.includes('ART-30003: PZN fehlt'), null, { timeout: 10000 });

await page.screenshot({ path: '../tmp/pdfs/omnia-chat-platform-demo.png', fullPage: true });
console.log(JSON.stringify({ ok: true, consoleIssues: issues }, null, 2));
await browser.close();
NODE
```

Expected:

```json
{
  "ok": true,
  "consoleIssues": []
}
```

The script tests:

1. App loads and shows `Omnia Chat`.
2. Send `Suche Kunde Mustermann`; context shows `Max Mustermann`.
3. Send `Zeig mir Vorgang 18581`; context shows `Vorgang 18581` and proposal `ART-10001`.
4. Send `Erzeuge Bestellung fuer MedComplett`; chat shows confirmation card `Bestellung erzeugen`.
5. Send `Zeig mir Vorgang 18542`; context shows proposal `ART-30003`.
6. Send `Erzeuge Bestellung fuer MedComplett`; validation panel shows `ART-30003: PZN fehlt`.

Expected: all six checks pass, no relevant console errors.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run test:bff
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit any verification fixes**

If browser verification required fixes:

```bash
git add omnia-chat-platform
git commit -m "Verify Omnia chat demo flows"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers separate project scaffolding, demo-only behavior, local KI gateway, rule-based fallback, chat, context cockpit, mock tools, action cards, audit, validation and browser verification.
- Placeholder scan: No implementation task references missing modules; code-writing steps include concrete file contents or exact verification scripts.
- Type consistency: Frontend types match BFF state fields: `ChatState`, `ChatContext`, `ChatMessage`, `ActionCard`, `AuditEvent`, `Proposal`.
