import assert from "node:assert/strict";
import test from "node:test";

import { buildCommandSuggestions, snapshotActionRecording } from "./native-cdp-action-recorder.js";

test("buildCommandSuggestions turns clicks into context-aware commands", () => {
  const suggestions = buildCommandSuggestions([
    { type: "click", text: "Kunden", role: "button" },
    { type: "click", text: "Dashboard", role: "link" },
    { type: "click", text: "Historie", role: "tab" },
    { type: "click", text: "Bitte wählen", role: "listbox" },
    { type: "click", text: "Speichern", role: "button" },
    { type: "click", text: "dvr Vorgänge", role: "a" },
    { type: "click", text: "add", role: "a", href: "/dashboard" },
    { type: "click", text: "search", role: "a", href: "/search" },
    { type: "click", text: "add_location Neue Adresse", role: "button" },
    { type: "click", text: "computer Neue Dauerversorgung", role: "button" },
    { type: "click", text: "list_alt Aufgaben", role: "button" },
    { type: "click", text: "email E-Mail", role: "button" },
    { type: "click", text: "settings Einstellungen", role: "button" },
    { type: "click", text: "trending_up Finanzbuchhaltung", role: "button" },
    { type: "click", text: "today Kalender", role: "button" },
  ]);

  assert.deepEqual(suggestions, [
    { command: "klick Kunden", reason: "Klick auf Button" },
    { command: "gehe zu Dashboard", reason: "Navigation per Link" },
    { command: "wechsel zu Historie", reason: "Tab-Wechsel" },
    { command: "wähle Bitte wählen", reason: "Auswahlfeld" },
    { command: "klick Speichern", reason: "Klick auf Button" },
    { command: "gehe zu Vorgänge", reason: "Navigation per Link" },
    { command: "gehe zu Suche", reason: "Navigation per Link" },
    { command: "klick Neue Adresse", reason: "Klick auf Button" },
    { command: "klick Neue Dauerversorgung", reason: "Klick auf Button" },
    { command: "klick Aufgaben", reason: "Klick auf Button" },
    { command: "klick E-Mail", reason: "Klick auf Button" },
    { command: "klick Einstellungen", reason: "Klick auf Button" },
    { command: "klick Finanzbuchhaltung", reason: "Klick auf Button" },
    { command: "klick Kalender", reason: "Klick auf Button" },
  ]);
});

test("buildCommandSuggestions turns field input into redacted fill commands", () => {
  const suggestions = buildCommandSuggestions([
    { type: "input", field: "Nachname", valueLength: 6 },
    { type: "input", field: "Mandant", value: "502753", valueLength: 6 },
  ]);

  assert.deepEqual(suggestions, [
    { command: "fülle Nachname mit <text>", reason: "Eingabe in Feld" },
    { command: "tippe mandantennummer", reason: "Mandantennummer 502753 erkannt" },
  ]);
});

test("buildCommandSuggestions maps keys and removes duplicates", () => {
  const suggestions = buildCommandSuggestions([
    { type: "key", key: "Enter" },
    { type: "key", key: "Enter" },
    { type: "key", key: "Tab" },
    { type: "key", key: "Shift+Tab" },
    { type: "key", key: "Escape" },
  ]);

  assert.deepEqual(suggestions, [
    { command: "enter", reason: "Taste gedrückt" },
    { command: "tab weiter", reason: "Taste gedrückt" },
    { command: "tab zurück", reason: "Taste gedrückt" },
    { command: "escape", reason: "Taste gedrückt" },
  ]);
});

test("snapshotActionRecording returns suggestions without stopping the recorder", async () => {
  const page = {
    evaluate(fn) {
      return fn();
    },
  };
  globalThis.window = {
    __OMNIA_VOICE_ACTION_RECORDER__: {
      active: true,
      startedAt: "2026-05-17T10:00:00.000Z",
      events: [{ type: "click", text: "Dokumente", role: "tab" }],
    },
  };

  try {
    const snapshot = await snapshotActionRecording(page);
    assert.deepEqual(snapshot, {
      active: true,
      startedAt: "2026-05-17T10:00:00.000Z",
      eventCount: 1,
      events: [{ type: "click", text: "Dokumente", role: "tab" }],
      suggestions: [{ command: "wechsel zu Dokumente", reason: "Tab-Wechsel" }],
    });
    assert.equal(globalThis.window.__OMNIA_VOICE_ACTION_RECORDER__.active, true);
  } finally {
    delete globalThis.window;
  }
});
