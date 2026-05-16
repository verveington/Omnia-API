import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionStore } from "./session-store.mjs";

test("creates sessions without persisting the password", () => {
  const store = createSessionStore();

  const session = store.createSession({
    username: "christoph",
    password: "not-for-storage",
    displayName: "Christoph Schernthaner",
    workspace: "saniPEP",
    source: "mock",
  });

  assert.equal(typeof session.id, "string");
  assert.equal(session.user.username, "christoph");
  assert.equal(session.user.displayName, "Christoph Schernthaner");
  assert.equal(session.workspace, "saniPEP");
  assert.equal(session.source, "mock");
  assert.equal("password" in session, false);
  assert.equal(JSON.stringify(session).includes("not-for-storage"), false);
});

test("reads and destroys sessions by id", () => {
  const store = createSessionStore();
  const session = store.createSession({
    username: "omnia-user",
    displayName: "Omnia User",
    workspace: "Tenant",
    source: "live",
    omniaAccessToken: "token",
  });

  assert.equal(store.getSession(session.id)?.user.username, "omnia-user");
  assert.equal(store.destroySession(session.id), true);
  assert.equal(store.getSession(session.id), null);
});
