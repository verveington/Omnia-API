# Omnia Hands-off Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hands-off read-only Omnia explorer that crawls the app, records redacted network traffic, and regenerates API documentation without enabling sandbox write behavior.

**Architecture:** Split the current monolithic `tools/explore-app.ts` into small modules under `tools/explorer/`: policy, candidate collection, crawl state, report writing, and orchestration. Keep `tools/explore-app.ts` as a compatibility wrapper and add `tools/explore-hands-off.ts` as the new primary CLI. Reuse `tools/network-recorder.ts`, `tools/redact.ts`, and `tools/build-api-catalog.ts`.

**Tech Stack:** Node.js ESM TypeScript executed directly by Node, Playwright through the existing recorder loader, `node:test` for module tests, Markdown/YAML artifacts generated locally.

---

### Task 1: Policy Module

**Files:**
- Create: `tools/explorer/policies.ts`
- Create: `tools/explorer/policies.test.ts`
- Modify: `tools/explore-app.ts`

- [ ] **Step 1: Write failing policy tests**

Create tests that import `classifyCandidate`, `classifyReadOnlyRequest`, `normalizeCandidate`, and `shouldWaitForLogin` from `tools/explorer/policies.ts`. Include cases for safe navigation, safe tabs, app menu, dangerous labels, UUID detail routes, auth token POSTs, telemetry POSTs, read-like search POSTs, mutation-like POSTs, and strict GET-only mode.

Run: `node --test tools/explorer/policies.test.ts`

Expected: fail with `ERR_MODULE_NOT_FOUND` because the module does not exist.

- [ ] **Step 2: Create policy module**

Move the pure policy code from `tools/explore-app.ts` into `tools/explorer/policies.ts`. Export the existing types and functions so the old tests and new tests can use the same implementation.

- [ ] **Step 3: Re-export from legacy CLI**

Update `tools/explore-app.ts` to import policy functions from `tools/explorer/policies.ts` and re-export them for compatibility with `tools/explore-app.test.ts`.

- [ ] **Step 4: Verify**

Run: `node --test tools/explorer/policies.test.ts tools/explore-app.test.ts`

Expected: all tests pass.

### Task 2: Candidate and State Modules

**Files:**
- Create: `tools/explorer/candidates.ts`
- Create: `tools/explorer/state.ts`
- Create: `tools/explorer/state.test.ts`
- Modify: `tools/explore-app.ts`

- [ ] **Step 1: Write failing state tests**

Test that `createExplorerState()` records skipped targets once, suppresses dangerous root-route noise, records clicked targets, records blocked requests, and returns a result with expected start/final metadata.

Run: `node --test tools/explorer/state.test.ts`

Expected: fail because `tools/explorer/state.ts` does not exist.

- [ ] **Step 2: Create candidate module**

Move `collectExploreCandidates()` and selector collection logic into `tools/explorer/candidates.ts`.

- [ ] **Step 3: Create state module**

Move skipped/clicked/blocked bookkeeping into `tools/explorer/state.ts` with explicit methods: `rememberSkipped()`, `recordClicked()`, `recordBlockedRequest()`, `finish()`.

- [ ] **Step 4: Wire legacy explorer**

Update `tools/explore-app.ts` to use `collectExploreCandidates()` from `candidates.ts` and state helpers from `state.ts`.

- [ ] **Step 5: Verify**

Run: `node --test tools/explorer/state.test.ts tools/explore-app.test.ts`

Expected: all tests pass.

### Task 3: Report Module

**Files:**
- Create: `tools/explorer/report.ts`
- Create: `tools/explorer/report.test.ts`
- Modify: `tools/explore-app.ts`

- [ ] **Step 1: Write failing report tests**

Test that `summarizeExplorerResult()` includes clicked targets and blocked requests, omits request body values, and redacts URLs. Test that `writeExplorerReport()` uses relative log paths.

Run: `node --test tools/explorer/report.test.ts`

Expected: fail because `tools/explorer/report.ts` does not exist.

- [ ] **Step 2: Create report module**

Move `summarizeExplorerResult()` and `writeExplorerReport()` into `tools/explorer/report.ts`.

- [ ] **Step 3: Re-export from legacy CLI**

Update `tools/explore-app.ts` to import and re-export report functions for compatibility.

- [ ] **Step 4: Verify**

Run: `node --test tools/explorer/report.test.ts tools/explore-app.test.ts`

Expected: all tests pass.

### Task 4: Hands-off Orchestrator

**Files:**
- Create: `tools/explorer/orchestrator.ts`
- Create: `tools/explorer/orchestrator.test.ts`
- Create: `tools/explore-hands-off.ts`
- Modify: `tools/explore-app.ts`

- [ ] **Step 1: Write failing orchestrator tests**

Test `parseHandsOffArgs()` with defaults and explicit flags. Test that body capture defaults to false, `--capture-bodies` enables it, report file defaults to `docs/06_auto_explore_report.md`, and explore log names use `-explore.jsonl`.

Run: `node --test tools/explorer/orchestrator.test.ts`

Expected: fail because `tools/explorer/orchestrator.ts` does not exist.

- [ ] **Step 2: Create orchestrator module**

Move CLI parsing, `createExploreLogPath()`, browser connection, recorder attachment, `runReadOnlyExplorer()`, report writing, and optional catalog rebuild into `tools/explorer/orchestrator.ts`.

- [ ] **Step 3: Create primary CLI**

Create `tools/explore-hands-off.ts` as a thin executable wrapper around `runHandsOffCli(process.argv.slice(2))`.

- [ ] **Step 4: Keep legacy CLI**

Reduce `tools/explore-app.ts` to a compatibility wrapper that re-exports public helpers and calls the same orchestrator when executed directly.

- [ ] **Step 5: Verify**

Run: `node --test tools/explorer/orchestrator.test.ts tools/explore-app.test.ts`

Expected: all tests pass.

### Task 5: Documentation and Safety Verification

**Files:**
- Modify: `docs/SECURITY.md`
- Modify: `docs/06_auto_explore_report.md`

- [ ] **Step 1: Update Security doc**

Add `tools/explore-hands-off.ts` as the preferred read-only entrypoint and state that `tools/explore-app.ts` remains a compatibility alias.

- [ ] **Step 2: Run full verification**

Run:

```bash
node --test tools/redact.test.ts tools/explore-app.test.ts tools/explorer/*.test.ts
node --check tools/explore-hands-off.ts
node --check tools/explore-app.ts
node --check tools/explorer/policies.ts
node --check tools/explorer/candidates.ts
node --check tools/explorer/state.ts
node --check tools/explorer/report.ts
node --check tools/explorer/orchestrator.ts
node --check tools/network-recorder.ts
node --check tools/build-api-catalog.ts
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Redaction scan**

Run a local scan over the generated documentation and latest JSONL paths for obvious secrets or personal data patterns. Any hit outside literal `[REDACTED]` is treated as a blocker.

Expected: no unredacted secrets, tokens, cookies, names, birth dates, insurance numbers, phone numbers, e-mail addresses, or addresses in Markdown/OpenAPI.

## Self-Review

- Spec coverage: read-only orchestration, network recording, report generation, API catalog rebuild, redaction, and sandbox-write separation are covered.
- Placeholder scan: the plan uses no unresolved placeholder values; remaining `TODO` strings are existing OpenAPI/catalog wording and not implementation gaps in this plan.
- Type consistency: policy exports are the source of truth for candidate/request/result types, and downstream modules consume those exported types.
