# Omnia Companion V1 Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first modular React/Vite frontend prototype for the Omnia Companion App V1.

**Architecture:** The frontend is a modular operational web app. `App` composes a platform shell, module registry, mock workflow state, and feature modules for Vorgang, Bestellung, and Wareneingang. Real Omnia API calls are intentionally abstracted behind future workflow boundaries.

**Tech Stack:** React, TypeScript, Vite, CSS modules through global design tokens, lucide-react icons.

---

## File Structure

- Create `companion-app/package.json`: npm scripts and dependencies.
- Create `companion-app/index.html`: Vite HTML entry.
- Create `companion-app/tsconfig.json`, `companion-app/tsconfig.node.json`, `companion-app/vite.config.ts`: TypeScript and Vite config.
- Create `companion-app/src/main.tsx`: React bootstrap.
- Create `companion-app/src/App.tsx`: composition root and module state.
- Create `companion-app/src/styles.css`: design tokens, layout, modules, responsive behavior.
- Create `companion-app/src/core/types.ts`: shared UI/domain types.
- Create `companion-app/src/data/mockData.ts`: seed data and mock audit entries.
- Create `companion-app/src/components/AppShell.tsx`: platform shell and navigation.
- Create `companion-app/src/components/ui.tsx`: reusable status badge, action button, metric, table helpers.
- Create `companion-app/src/features/cases/CasesModule.tsx`: Vorgang workflow surface.
- Create `companion-app/src/features/orders/OrdersModule.tsx`: Bestellung workflow surface.
- Create `companion-app/src/features/goods-receipts/GoodsReceiptsModule.tsx`: Wareneingang workflow surface.

## Tasks

### Task 1: Scaffold React/Vite app

- [x] Create package/config/entry files.
- [x] Install dependencies.
- [x] Verify TypeScript/Vite build starts.

### Task 2: Build platform shell

- [x] Add app shell with top bar, module rail, audit panel, and responsive layout.
- [x] Add reusable UI primitives for status, actions, metrics, and tables.
- [x] Wire module switching without routing dependency.

### Task 3: Build feature modules

- [x] Add Vorgang module with search, detail, workflow actions and stateful audit events.
- [x] Add Bestellung module with proposal/order split, process-order and PDF/Mail preparation actions.
- [x] Add Wareneingang module with required fields, validation, booking and completion actions.

### Task 4: Verify frontend

- [x] Run production build.
- [x] Start local dev server.
- [x] Open in browser and inspect first viewport.
- [x] Test at least one interaction per module.
- [x] Check desktop and mobile viewport.

## Test Commands

```bash
cd companion-app
npm run build
npm run dev -- --host 127.0.0.1
```

Expected build result: TypeScript compilation and Vite build complete without errors.

## Verification Notes

- `npm run build` passes.
- Local dev server: `http://127.0.0.1:5173/`.
- Playwright checked desktop cases/orders/receipts and mobile receipts.
- Tested actions: PDF/Mail preparation, Wareneingang validation, Wareneingang erfassen, Durchführen.
