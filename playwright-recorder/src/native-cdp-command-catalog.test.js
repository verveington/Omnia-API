import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCommandCatalog,
  filterLearnableSuggestions,
  mergeSuggestionsIntoCatalog,
  resolveNaturalCommand,
} from "./native-cdp-command-catalog.js";

test("mergeSuggestionsIntoCatalog deduplicates learned commands and tracks usage", () => {
  const catalog = mergeSuggestionsIntoCatalog(buildCommandCatalog(), [
    { command: "gehe zu Vorgänge", reason: "Navigation per Link" },
    { command: "gehe zu Vorgänge", reason: "Navigation per Link" },
    { command: "wechsel zu Dokumente", reason: "Tab-Wechsel" },
  ], { now: "2026-05-17T10:00:00.000Z" });

  assert.equal(catalog.commands.length, 2);
  assert.equal(catalog.commands[0].command, "gehe zu Vorgänge");
  assert.equal(catalog.commands[0].count, 2);
  assert.equal(catalog.commands[0].target, "Vorgänge");
  assert.equal(catalog.commands[0].kind, "navigation");
  assert.equal(catalog.commands[1].kind, "tab");
});

test("mergeSuggestionsIntoCatalog preserves executor safety context and API observations", () => {
  const catalog = mergeSuggestionsIntoCatalog(buildCommandCatalog(), [
    {
      command: "gehe zu Dashboard",
      reason: "Navigation per Link",
      executor: "hybrid",
      safety: "safe",
      context: { route: "/dashboard" },
      apiObservations: [
        {
          method: "GET",
          path: "/apigateway/dashboardservice/cards",
          status: 200,
          calls: 1,
          lastSeenAt: "2026-05-17T10:00:01.000Z",
        },
      ],
    },
    {
      command: "gehe zu Dashboard",
      reason: "Navigation per Link",
      executor: "hybrid",
      safety: "safe",
      context: { source: "learning" },
      apiObservations: [
        {
          method: "GET",
          path: "/apigateway/dashboardservice/cards",
          status: 200,
          calls: 2,
          lastSeenAt: "2026-05-17T10:00:03.000Z",
        },
        {
          method: "POST",
          path: "/apigateway/auditservice/events",
          status: 204,
          calls: 1,
          lastSeenAt: "2026-05-17T10:00:04.000Z",
        },
      ],
    },
  ], { now: "2026-05-17T10:00:05.000Z" });

  assert.equal(catalog.commands.length, 1);
  assert.equal(catalog.commands[0].executor, "hybrid");
  assert.equal(catalog.commands[0].safety, "safe");
  assert.deepEqual(catalog.commands[0].context, { route: "/dashboard", source: "learning" });
  assert.deepEqual(catalog.commands[0].apiObservations, [
    {
      method: "GET",
      path: "/apigateway/dashboardservice/cards",
      status: 200,
      calls: 3,
      lastSeenAt: "2026-05-17T10:00:03.000Z",
    },
    {
      method: "POST",
      path: "/apigateway/auditservice/events",
      status: 204,
      calls: 1,
      lastSeenAt: "2026-05-17T10:00:04.000Z",
    },
  ]);
});

test("resolveNaturalCommand maps conversational navigation to learned targets", () => {
  const catalog = mergeSuggestionsIntoCatalog(buildCommandCatalog(), [
    { command: "gehe zu Vorgänge", reason: "Navigation per Link" },
    { command: "wechsel zu Dokumente", reason: "Tab-Wechsel" },
  ]);

  assert.deepEqual(resolveNaturalCommand("geh bitte zu den Vorgängen", catalog), {
    command: "gehe zu Vorgänge",
    confidence: 0.92,
    reason: "Gelernter Befehl: gehe zu Vorgänge",
  });
  assert.deepEqual(resolveNaturalCommand("zeig mir mal die dokumente", catalog), {
    command: "wechsel zu Dokumente",
    confidence: 0.92,
    reason: "Gelernter Befehl: wechsel zu Dokumente",
  });
});

test("resolveNaturalCommand maps assistant-style action phrases to learned buttons", () => {
  const catalog = mergeSuggestionsIntoCatalog(buildCommandCatalog(), [
    { command: "klick Speichern", reason: "Klick auf Button" },
    { command: "klick Abbrechen", reason: "Klick auf Button" },
    { command: "klick Neue Notiz", reason: "Klick auf Button" },
  ]);

  assert.equal(resolveNaturalCommand("speichere das bitte", catalog)?.command, "klick Speichern");
  assert.equal(resolveNaturalCommand("brich das ab", catalog)?.command, "klick Abbrechen");
  assert.equal(resolveNaturalCommand("leg eine neue Notiz an", catalog)?.command, "klick Neue Notiz");
});

test("resolveNaturalCommand returns null when target is ambiguous", () => {
  const catalog = mergeSuggestionsIntoCatalog(buildCommandCatalog(), [
    { command: "klick Speichern", reason: "Klick auf Button" },
    { command: "klick Speichern & schließen", reason: "Klick auf Button" },
  ]);

  assert.equal(resolveNaturalCommand("speichern", catalog), null);
});

test("filterLearnableSuggestions keeps stable UI commands and drops transient content", () => {
  assert.deepEqual(filterLearnableSuggestions([
    { command: "klick Mustermann", reason: "Klick auf sichtbaren Text" },
    { command: "klick 16.05.2026", reason: "Klick auf Button" },
    { command: "klick 1", reason: "Klick auf Button" },
      { command: "wähle Bitte wählen", reason: "Auswahlfeld" },
      { command: "klick apps", reason: "Klick auf Button" },
      { command: "öffne App-Menü", reason: "Auto-Explorer" },
      {
        command: "wähle Der Rechnungsbetrag wird in 10 Tagen per SEPA-Lastschrift von Ihrem",
        reason: "Auswahlfeld",
    },
    { command: "klick Speichern", reason: "Klick auf Button" },
    { command: "wechsel zu Dokumente", reason: "Tab-Wechsel" },
    { command: "fülle Nachname mit <text>", reason: "Eingabe in Feld" },
  ]), [
    { command: "klick Speichern", reason: "Klick auf Button" },
    { command: "wechsel zu Dokumente", reason: "Tab-Wechsel" },
    { command: "fülle Nachname mit <text>", reason: "Eingabe in Feld" },
  ]);
});

test("buildCommandCatalog cleans material icon prefixes from persisted commands", () => {
  const catalog = buildCommandCatalog({
    commands: [
      { command: "klick add_location Neue Adresse", reasons: ["Klick auf Button"] },
      { command: "klick edit", reasons: ["Klick auf Button"] },
      { command: "klick computer Neue Dauerversorgung", reasons: ["Klick auf Button"] },
      { command: "klick list_alt Aufgaben", reasons: ["Klick auf Button"] },
      { command: "klick Aufgaben", reasons: ["Klick auf Button"] },
      { command: "klick today Kalender", reasons: ["Klick auf Button"] },
      { command: "gehe zu Aufgaben", reasons: ["Auto-Explorer"] },
    ],
  });

  assert.deepEqual(catalog.commands.map((entry) => entry.command), [
    "klick Neue Adresse",
    "klick Neue Dauerversorgung",
    "gehe zu Aufgaben",
  ]);
});
