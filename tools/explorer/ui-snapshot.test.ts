import assert from "node:assert/strict";
import test from "node:test";

import { normalizeUiSnapshot } from "./ui-snapshot.ts";

test("normalizeUiSnapshot keeps UI structure but redacts obvious personal values", () => {
  const snapshot = normalizeUiSnapshot({
    step: "Kunde oeffnen",
    url: "https://api2.optica-omnia.de/master-data/customers/123?query=max.mustermann@example.test",
    title: "Kunde Max Mustermann",
    headings: ["Max Mustermann", "Stammdaten"],
    actions: ["Speichern", "Exportieren", "Max Mustermann bearbeiten"],
    formLabels: ["Geburtsdatum", "Versichertennummer", "Status"],
    tableHeaders: ["Name", "Status", "Letzte Aenderung"],
  }, new Date("2026-06-03T09:00:00.000Z"));

  assert.equal(snapshot.timestamp, "2026-06-03T09:00:00.000Z");
  assert.equal(snapshot.step, "Kunde oeffnen");
  assert.equal(snapshot.path, "/master-data/customers/{id}");
  assert.equal(snapshot.url, "https://api2.optica-omnia.de/master-data/customers/{id}?query=%5BREDACTED%5D");
  assert.equal(snapshot.title, "Kunde [REDACTED]");
  assert.deepEqual(snapshot.headings, ["[REDACTED]", "Stammdaten"]);
  assert.deepEqual(snapshot.actions, ["Speichern", "Exportieren", "[REDACTED] bearbeiten"]);
  assert.deepEqual(snapshot.formLabels, ["Geburtsdatum", "Versichertennummer", "Status"]);
  assert.deepEqual(snapshot.tableHeaders, ["Name", "Status", "Letzte Aenderung"]);
});
