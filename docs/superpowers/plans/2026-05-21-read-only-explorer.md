# Read-only Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guarded Playwright/CDP explorer that can navigate the live Omnia app without saving or changing business data.

**Architecture:** Add one standalone CLI under `tools/explore-app.ts`. Keep the write guard and target classifier as exported pure functions so they can be tested without the ERP. Reuse the existing network logger so all runtime network data is redacted before it reaches disk.

**Tech Stack:** Node.js test runner, Playwright via existing `tools/network-recorder.ts`, TypeScript files executed directly by the local Node runtime.

---

### Task 1: Safety Classifier Tests

**Files:**
- Create: `tools/explore-app.test.ts`
- Create: `tools/explore-app.ts`

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCandidate,
  classifyReadOnlyRequest,
} from "./explore-app.ts";

test("classifyCandidate allows navigation and tabs but blocks write-like actions", () => {
  assert.equal(classifyCandidate({ role: "link", text: "Warenwirtschaft", href: "/warenwirtschaft" }).allowed, true);
  assert.equal(classifyCandidate({ role: "tab", text: "Historie", selected: false }).allowed, true);
  assert.equal(classifyCandidate({ role: "button", text: "Speichern" }).allowed, false);
  assert.equal(classifyCandidate({ role: "link", text: "Neuer Kunde", href: "/kunden/new" }).allowed, false);
});

test("classifyReadOnlyRequest allows safe reads and blocks mutations", () => {
  assert.equal(classifyReadOnlyRequest({ method: "GET", url: "https://api2.optica-omnia.de/apigateway/users" }).allowed, true);
  assert.equal(classifyReadOnlyRequest({ method: "POST", url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses/search" }).allowed, true);
  assert.equal(classifyReadOnlyRequest({ method: "POST", url: "https://api2.optica-omnia.de/apigateway/sales/salesprocesses", postData: "{\"name\":\"Muster\"}" }).allowed, false);
  assert.equal(classifyReadOnlyRequest({ method: "PUT", url: "https://api2.optica-omnia.de/apigateway/articles/123" }).allowed, false);
});
```

- [ ] **Step 2: Verify red**

Run: `node --test tools/explore-app.test.ts`

Expected: fail because `tools/explore-app.ts` does not exist yet.

- [ ] **Step 3: Implement minimal exported classifiers**

Add `classifyCandidate` and `classifyReadOnlyRequest` to `tools/explore-app.ts`.

- [ ] **Step 4: Verify green**

Run: `node --test tools/explore-app.test.ts`

Expected: pass.

### Task 2: Explorer CLI

**Files:**
- Modify: `tools/explore-app.ts`

- [ ] **Step 1: Implement CLI**

Use `parseCommonArgs`, `connectOrLaunchPage`, `attachNetworkLogger`, `appendMarker`, and `waitForSettledNetwork`. Add options `--max-steps`, `--max-minutes`, `--settle-ms`, `--start-path`, and `--allow-read-like-posts`.

- [ ] **Step 2: Implement guarded clicking**

Collect visible links, tabs, menu items, and app menu buttons. Skip write-like labels and write-like routes. Before each click, set the current step and write a marker. Install a route guard that aborts unexpected write requests and stops the crawl.

- [ ] **Step 3: Write report**

Create `docs/06_auto_explore_report.md` with start URL, final URL, clicked targets, skipped targets, blocked requests, and log file path. Do not include request/response bodies.

### Task 3: Documentation and Verification

**Files:**
- Modify: `docs/SECURITY.md`
- Modify: `.gitignore`

- [ ] **Step 1: Document live read-only constraints**

Add a short section that read-only crawling must keep the write guard enabled and that write trials require separate human confirmation.

- [ ] **Step 2: Ignore explorer scratch logs**

Ensure `logs/` remains ignored.

- [ ] **Step 3: Verify**

Run:

```bash
node --test tools/redact.test.ts tools/explore-app.test.ts
node --check tools/explore-app.ts
node --check tools/network-recorder.ts
git diff --check
```

Expected: all commands exit 0.
