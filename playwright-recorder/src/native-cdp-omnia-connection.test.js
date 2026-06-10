import assert from "node:assert/strict";
import test from "node:test";

import {
  createDisconnectedPageSummary,
  createOmniaConnectionState,
  disconnectedActionResult,
  normalizeOmniaMode,
  serializeOmniaStatus,
} from "./native-cdp-omnia-connection.js";

test("normalizeOmniaMode accepts launch, attach, and none", () => {
  assert.equal(normalizeOmniaMode("launch"), "launch");
  assert.equal(normalizeOmniaMode("attach"), "attach");
  assert.equal(normalizeOmniaMode("none"), "none");
});

test("normalizeOmniaMode defaults invalid and undefined modes to none", () => {
  assert.equal(normalizeOmniaMode("invalid"), "none");
  assert.equal(normalizeOmniaMode(undefined), "none");
});

test("createOmniaConnectionState applies disconnected defaults", () => {
  assert.deepEqual(createOmniaConnectionState(), {
    mode: "none",
    connected: false,
    connecting: false,
    page: null,
    browser: null,
    lastError: "",
  });
});

test("serializeOmniaStatus returns disconnected status with extras", () => {
  const ai = { enabled: true };
  const learning = { recording: false };

  assert.deepEqual(serializeOmniaStatus(createOmniaConnectionState(), { ai, learning }), {
    ok: true,
    omnia: {
      mode: "none",
      connected: false,
      connecting: false,
      href: "",
      title: "",
      lastError: "",
    },
    ai,
    learning,
  });
});

test("createDisconnectedPageSummary returns disconnected page details", () => {
  const summary = createDisconnectedPageSummary("Omnia ist nicht verbunden.");

  assert.equal(summary.connected, false);
  assert.equal(summary.href, "");
  assert.equal(summary.readyState, "disconnected");
  assert.equal(summary.buttonCount, 0);
  assert.equal(summary.linkCount, 0);
  assert.equal(summary.tabCount, 0);
  assert.equal(summary.inputCount, 0);
  assert.match(summary.title, /Omnia nicht verbunden/);
  assert.match(summary.connectionMessage, /nicht verbunden/);
});

test("disconnectedActionResult explains that Omnia is not connected", () => {
  const result = disconnectedActionResult("gehe zu Dashboard");

  assert.equal(result.ok, true);
  assert.equal(result.executed, false);
  assert.equal(result.requiresConnection, true);
  assert.equal(result.command, "gehe zu Dashboard");
  assert.match(result.message, /Omnia.*nicht verbunden/);
});
