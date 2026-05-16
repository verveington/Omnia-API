# Omnia Companion BFF V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local Backend-for-Frontend that owns Companion sessions and exposes first read-oriented workflow endpoints to the React frontend.

**Architecture:** The BFF runs as a small Node HTTP server next to the Vite app. The frontend talks only to `/api/*`; the BFF owns sessions, can proxy live Omnia requests when a token/auth provider is configured, and otherwise uses the current demo dataset for local development. Omnia write workflows stay behind future explicit workflow endpoints.

**Tech Stack:** Node.js ESM, built-in `node:test`, React/Vite proxy, existing TypeScript frontend.

---

## File Structure

- Create `companion-app/server/lib/http-utils.mjs`: JSON parsing, response helpers, cookies.
- Create `companion-app/server/lib/session-store.mjs`: in-memory session lifecycle.
- Create `companion-app/server/lib/omnia-client.mjs`: Omnia gateway request wrapper.
- Create `companion-app/server/lib/workflow-service.mjs`: BFF read workflow facade and mock/live source selection.
- Create `companion-app/server/index.mjs`: HTTP router for `/api`.
- Create `companion-app/server/lib/*.test.mjs`: tests for session and workflow behavior.
- Modify `companion-app/package.json`: add BFF scripts and tests.
- Modify `companion-app/vite.config.ts`: proxy `/api` to the BFF.
- Modify frontend app files to load session/bootstrap data through the BFF and show a login surface.

## Tasks

### Task 1: BFF core

- [x] Write failing tests for session store and bootstrap workflow.
- [x] Add in-memory sessions that never persist passwords.
- [x] Add mock bootstrap data and read endpoint facade.
- [x] Add Omnia gateway wrapper for later live reads.

### Task 2: HTTP API

- [x] Add `/api/health`.
- [x] Add `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`.
- [x] Add `/api/workflows/bootstrap`.
- [x] Add `/api/cases`, `/api/orders`, `/api/goods-receipts`.

### Task 3: Frontend wiring

- [x] Add frontend API client.
- [x] Add login/session state.
- [x] Load workflow data from the BFF instead of direct mock imports.
- [x] Keep local demo mode usable until Omnia live auth is configured.

### Task 4: Verify

- [x] Run BFF tests.
- [x] Run frontend production build.
- [x] Start local BFF and Vite server.
- [x] Verify login and workflow UI in browser automation.
