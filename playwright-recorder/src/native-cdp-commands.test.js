import assert from "node:assert/strict";
import test from "node:test";

import { parseNativeCommand } from "./native-cdp-commands.js";

test("parseNativeCommand maps help and quit commands", () => {
  assert.deepEqual(parseNativeCommand("hilfe"), { type: "help" });
  assert.deepEqual(parseNativeCommand("?"), { type: "help" });
  assert.deepEqual(parseNativeCommand("beenden"), { type: "quit" });
});

test("parseNativeCommand maps login field focus commands", () => {
  assert.deepEqual(parseNativeCommand("fokus loginfeld"), { type: "focus-login" });
  assert.deepEqual(parseNativeCommand("benutzername"), { type: "focus-login" });
  assert.deepEqual(parseNativeCommand("passwort"), { type: "focus-password" });
});

test("parseNativeCommand maps typing and key commands", () => {
  assert.deepEqual(parseNativeCommand("tippe christoph"), { type: "type-text", text: "christoph" });
  assert.deepEqual(parseNativeCommand("drücke enter"), { type: "press-key", key: "Enter" });
  assert.deepEqual(parseNativeCommand("enter"), { type: "press-key", key: "Enter" });
  assert.deepEqual(parseNativeCommand("tab weiter"), { type: "press-key", key: "Tab" });
  assert.deepEqual(parseNativeCommand("tab zurück"), { type: "press-key", key: "Shift+Tab" });
  assert.deepEqual(parseNativeCommand("escape"), { type: "press-key", key: "Escape" });
  assert.deepEqual(parseNativeCommand("feld leeren"), { type: "clear-field" });
  assert.deepEqual(parseNativeCommand("tippe mandantennummer"), {
    type: "type-text",
    text: "502753",
  });
});

test("parseNativeCommand maps click login and search commands", () => {
  assert.deepEqual(parseNativeCommand("klick anmelden"), { type: "click-login" });
  assert.deepEqual(parseNativeCommand("klick Kunden"), { type: "click-text", text: "Kunden" });
  assert.deepEqual(parseNativeCommand("öffne Aufträge"), { type: "click-text", text: "Aufträge" });
  assert.deepEqual(parseNativeCommand("zeige Vorgänge"), { type: "click-text", text: "Vorgänge" });
  assert.deepEqual(parseNativeCommand("wechsel zu Historie"), { type: "click-text", text: "Historie" });
  assert.deepEqual(parseNativeCommand("wähle Speichern"), { type: "click-text", text: "Speichern" });
  assert.deepEqual(parseNativeCommand("starte Vorgang kopieren"), {
    type: "click-text",
    text: "Vorgang kopieren",
  });
  assert.deepEqual(parseNativeCommand("suche kunde Mueller"), {
    type: "search",
    entity: "kunde",
    query: "Mueller",
  });
  assert.deepEqual(parseNativeCommand("suche Fassungen"), {
    type: "search",
    entity: "",
    query: "Fassungen",
  });
});

test("parseNativeCommand maps field fill and navigation commands", () => {
  assert.deepEqual(parseNativeCommand("fülle Nachname mit Mueller"), {
    type: "fill-field",
    field: "Nachname",
    value: "Mueller",
  });
  assert.deepEqual(parseNativeCommand("zurück"), { type: "go-back" });
  assert.deepEqual(parseNativeCommand("vorwärts"), { type: "go-forward" });
  assert.deepEqual(parseNativeCommand("neu laden"), { type: "reload" });
  assert.deepEqual(parseNativeCommand("scroll runter"), { type: "scroll", direction: "down" });
  assert.deepEqual(parseNativeCommand("scroll hoch"), { type: "scroll", direction: "up" });
});

test("parseNativeCommand returns unknown commands with original text", () => {
  assert.deepEqual(parseNativeCommand("mach irgendwas"), {
    type: "unknown",
    text: "mach irgendwas",
  });
});
