# Procurement PZN Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich procurement proposals with PZN/article metadata before supplier exports and expose readiness state for the later fully integrated Omnia ordering workflow.

**Architecture:** Keep Omnia as the source of truth. The BFF procurement service builds the existing read-only aggregate, resolves missing PZN values from article detail endpoints, caches per article id, and returns explicit enrichment/readiness metadata to the frontend and export service. Write actions for order creation, goods receipt, and delivery note generation remain behind future explicit endpoints.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing BFF services, React/TypeScript frontend.

---

## File Structure

- Modify `companion-app/server/lib/procurement-service.mjs`: accept `omniaClient`, enrich proposals from article details, expose PZN/readiness status, keep supplier privacy rules.
- Modify `companion-app/server/lib/demo-data.mjs`: add article detail fixture data and remove one direct PZN so tests prove enrichment.
- Modify `companion-app/server/lib/procurement-service.test.mjs`: add red/green coverage for article detail enrichment and missing PZN fallback.
- Modify `companion-app/server/lib/export-service.test.mjs`: keep supplier CSV assertion on enriched PZN.
- Modify `companion-app/src/core/types.ts`: add enrichment/readiness metadata to procurement proposal items.
- Modify `companion-app/src/features/orders/OrdersModule.tsx`: show PZN readiness and status in the Bestellplattform table.
- Optionally modify `companion-app/src/styles.css`: add compact status styling only if existing badges are insufficient.

## Tasks

### Task 1: Backend tests for PZN enrichment

- [ ] Add a failing test that a proposal with blank `pzn` receives PZN from article details.
- [ ] Add a failing test that a proposal without resolvable article details remains exportable with status `pzn_missing`.
- [ ] Run `npm run test:bff -- server/lib/procurement-service.test.mjs` or the project-equivalent focused test command and verify the new tests fail for missing behavior.

### Task 2: Procurement service enrichment

- [ ] Update `createProcurementService({ omniaClient } = {})` to keep the existing mock/live API.
- [ ] Add `resolveArticleDetails(session, articleId)` with mock fixture lookup first and Omnia calls for live sessions:
  - `GET /apigateway/article-tenant/articles/{articleId}`
  - fallback `GET /apigateway/articletenantservice/articles/{articleId}`
- [ ] Extract `pzn` from the returned article object, including wrapped `{ content: ... }` payloads.
- [ ] Cache article detail lookups per service instance and article id.
- [ ] Add `pznEnrichmentStatus` values: `present`, `enriched`, `missing`, `failed`.
- [ ] Add `procurementReadiness` values: `ready_to_order`, `pzn_missing`, `supplier_missing`.
- [ ] Keep supplier export rows privacy-preserving and include the enriched PZN.

### Task 3: Demo data and export coverage

- [ ] Add `demoData.articleDetailsById` fixture entries keyed by `articleId`.
- [ ] Make at least one demo proposal have an empty PZN and a detail fixture PZN.
- [ ] Make at least one demo proposal have an empty PZN with no fixture to exercise the missing state.
- [ ] Update CSV export tests so the supplier export proves enriched PZN is exported.

### Task 4: Frontend display

- [ ] Extend TypeScript procurement proposal types with enrichment/readiness fields.
- [ ] Add a `Status` column or compact PZN badge in `OrdersModule`.
- [ ] Keep the table readable and avoid repeating delivery address per row.
- [ ] Ensure missing PZN is visible before a future “Bestellung erzeugen” action is enabled.

### Task 5: Verification

- [ ] Run `npm run test:bff`.
- [ ] Run `npm run build`.
- [ ] Start or reuse BFF/Vite servers.
- [ ] Use browser automation on `http://127.0.0.1:5173/` to verify Bestellplattform renders enriched PZN and missing-PZN status.
