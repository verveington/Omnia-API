import assert from "node:assert/strict";
import test from "node:test";

import {
  createFallbackConversationDecision,
  createConversationConfig,
  createConversationRequest,
  extractChatCompletionText,
  isRiskyConversationCommand,
  requestConversationDecision,
  resolveDirectConversationDecision,
  resolveConversationCommand,
} from "./native-cdp-conversation.js";

test("createConversationConfig defaults to a local Ollama-compatible model server", () => {
  assert.deepEqual(createConversationConfig({}), {
    apiKey: "ollama",
    endpoint: "http://127.0.0.1:11434/v1/chat/completions",
    model: "qwen2.5:7b",
    timeoutMs: 8000,
  });

  const overridden = createConversationConfig({
    OMNIA_AI_BASE_URL: "http://127.0.0.1:8000/v1",
    OMNIA_AI_MODEL: "qwen3:14b",
    OMNIA_AI_API_KEY: "local-secret",
    OMNIA_AI_TIMEOUT_MS: "25",
  });
  assert.equal(overridden.endpoint, "http://127.0.0.1:8000/v1/chat/completions");
  assert.equal(overridden.timeoutMs, 25);
  assert.equal(createConversationConfig({ OMNIA_AI_TIMEOUT_MS: "not-a-number" }).timeoutMs, 8000);
});

test("createConversationRequest constrains the local model to known safe commands", () => {
  const request = createConversationRequest({
    model: "qwen3:8b",
    text: "bring mich bitte zu den artikeln",
    pageSummary: { href: "https://api2.optica-omnia.de/merchandise-management" },
    catalog: {
      commands: [
        { command: "gehe zu Artikelverwaltung", kind: "navigation", target: "Artikelverwaltung", aliases: ["zeige Artikelverwaltung"] },
        { command: "klick Speichern", kind: "action", target: "Speichern", aliases: ["speichern"] },
      ],
    },
    history: [{ role: "assistant", text: "Ich bin bereit." }],
  });

  assert.equal(request.model, "qwen3:8b");
  assert.equal(request.stream, false);
  assert.equal(request.temperature, 0);
  assert.deepEqual(request.response_format, { type: "json_object" });
  assert.equal(request.max_tokens, 180);
  assert.match(request.messages[0].content, /Omnia fernzusteuern/);
  assert.match(request.messages[1].content, /gehe zu Artikelverwaltung/);
  assert.match(request.messages[1].content, /klick Speichern/);
  assert.match(request.messages[1].content, /bring mich bitte zu den artikeln/);
});

test("createConversationRequest keeps large catalogs compact and relevant", () => {
  const request = createConversationRequest({
    model: "qwen3:8b",
    text: "zeige artikel",
    catalog: {
      commands: [
        ...Array.from({ length: 80 }, (_, index) => ({
          command: `gehe zu Bereich ${index}`,
          kind: "navigation",
          target: `Bereich ${index}`,
          aliases: [`bereich ${index}`],
        })),
        {
          command: "gehe zu Artikelverwaltung",
          kind: "navigation",
          target: "Artikelverwaltung",
          aliases: ["artikel", "zeige artikel"],
        },
      ],
    },
  });

  const payload = JSON.parse(request.messages[1].content);

  assert.ok(payload.knownCommands.length <= 32);
  assert.ok(payload.knownCommands.some((entry) => entry.command === "gehe zu Artikelverwaltung"));
  assert.equal(payload.knownCommands.some((entry) => entry.command === "gehe zu Bereich 79"), false);
});

test("createConversationRequest includes disconnected Omnia state", () => {
  const request = createConversationRequest({
    model: "qwen3:8b",
    text: "zeige dashboard",
    pageSummary: {
      connected: false,
      title: "Omnia nicht verbunden",
      connectionMessage: "Omnia ist nicht verbunden.",
    },
    catalog: {
      commands: [
        { command: "gehe zu Dashboard", kind: "navigation", target: "Dashboard", aliases: ["dashboard"] },
      ],
    },
  });

  assert.match(request.messages[1].content, /"connected": false/);
  assert.match(request.messages[1].content, /Omnia ist nicht verbunden/);
});

test("createConversationRequest asks the model to return confirmable risky commands", () => {
  const request = createConversationRequest({
    model: "qwen3:8b",
    text: "tippe die mandantennummer",
    catalog: {
      commands: [
        { command: "tippe mandantennummer", kind: "form", target: "mandantennummer", aliases: [] },
      ],
    },
  });

  assert.match(request.messages[0].content, /Bestätigungsfrage|Bestaetigungsfrage/);
  assert.match(request.messages[0].content, /Trotzdem ausführen|Trotzdem ausfuehren/);
});

test("extractChatCompletionText reads OpenAI-compatible chat completion text", () => {
  assert.equal(extractChatCompletionText({
    choices: [
      { message: { content: "{\"type\":\"answer\"}" } },
    ],
  }), "{\"type\":\"answer\"}");
});

test("requestConversationDecision parses local model JSON decisions", async () => {
  const calls = [];
  const decision = await requestConversationDecision({
    config: { apiKey: "ollama", endpoint: "https://example.test/v1/chat/completions", model: "qwen3:8b" },
    text: "zeige artikel",
    pageSummary: { href: "https://api2.optica-omnia.de/" },
    catalog: { commands: [{ command: "gehe zu Artikel", kind: "navigation", target: "Artikel" }] },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: "```json\n" + JSON.stringify({
                type: "execute_command",
                command: "gehe zu Artikel",
                say: "Ich öffne Artikel.",
                confidence: 0.92,
              }) + "\n```",
            },
          }],
        }),
      };
    },
  });

  assert.equal(calls[0].url, "https://example.test/v1/chat/completions");
  assert.equal(JSON.parse(calls[0].options.body).model, "qwen3:8b");
  assert.deepEqual(decision, {
    type: "execute_command",
    command: "gehe zu Artikel",
    say: "Ich öffne Artikel.",
    confidence: 0.92,
  });
});

test("requestConversationDecision times out a non-responsive local model request", async () => {
  const startedAt = Date.now();
  await assert.rejects(
    requestConversationDecision({
      config: {
        apiKey: "ollama",
        endpoint: "https://example.test/v1/chat/completions",
        model: "qwen3:8b",
        timeoutMs: 10,
      },
      text: "zeige artikel",
      fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      }),
    }),
    /Lokaler KI-Server antwortet nicht innerhalb von 10 ms\./,
  );
  assert.ok(Date.now() - startedAt < 500);
});

test("requestConversationDecision times out when fetch ignores AbortSignal", async () => {
  let signalAborted = false;
  const startedAt = Date.now();
  await assert.rejects(
    requestConversationDecision({
      config: {
        apiKey: "ollama",
        endpoint: "https://example.test/v1/chat/completions",
        model: "qwen3:8b",
        timeoutMs: 10,
      },
      text: "zeige artikel",
      fetchImpl: async (_url, options) => {
        options.signal.addEventListener("abort", () => {
          signalAborted = true;
        });
        return new Promise(() => {});
      },
    }),
    /Lokaler KI-Server antwortet nicht innerhalb von 10 ms\./,
  );

  assert.equal(signalAborted, true);
  assert.ok(Date.now() - startedAt < 500);
});

test("requestConversationDecision timeout covers response body parsing", async () => {
  let signalAborted = false;
  const startedAt = Date.now();
  await assert.rejects(
    requestConversationDecision({
      config: {
        apiKey: "ollama",
        endpoint: "https://example.test/v1/chat/completions",
        model: "qwen3:8b",
        timeoutMs: 10,
      },
      text: "zeige artikel",
      fetchImpl: async (_url, options) => {
        options.signal.addEventListener("abort", () => {
          signalAborted = true;
        });
        return {
          ok: true,
          json: async () => new Promise(() => {}),
        };
      },
    }),
    /Lokaler KI-Server antwortet nicht innerhalb von 10 ms\./,
  );

  assert.equal(signalAborted, true);
  assert.ok(Date.now() - startedAt < 500);
});

test("requestConversationDecision clears the timeout after successful local model responses", async () => {
  let signalAborted = false;
  const decision = await requestConversationDecision({
    config: {
      apiKey: "ollama",
      endpoint: "https://example.test/v1/chat/completions",
      model: "qwen3:8b",
      timeoutMs: 10,
    },
    text: "zeige artikel",
    fetchImpl: async (_url, options) => {
      options.signal.addEventListener("abort", () => {
        signalAborted = true;
      });
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                type: "answer",
                say: "Bereit.",
                confidence: 0.8,
              }),
            },
          }],
        }),
      };
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 25));

  assert.equal(signalAborted, false);
  assert.deepEqual(decision, {
    type: "answer",
    command: "",
    say: "Bereit.",
    confidence: 0.8,
  });
});

test("isRiskyConversationCommand blocks form and destructive actions for stage 1", () => {
  assert.equal(isRiskyConversationCommand("gehe zu Artikelverwaltung"), false);
  assert.equal(isRiskyConversationCommand("wechsel zu Dokumente"), false);
  assert.equal(isRiskyConversationCommand("fülle Nachname mit <text>"), true);
  assert.equal(isRiskyConversationCommand("tippe mandantennummer"), true);
  assert.equal(isRiskyConversationCommand("klick Speichern"), true);
  assert.equal(isRiskyConversationCommand("klick OK"), true);
  assert.equal(isRiskyConversationCommand("wähle Speichern"), true);
  assert.equal(isRiskyConversationCommand("starte Vorgang kopieren"), true);
  assert.equal(isRiskyConversationCommand("wähle Löschen"), true);
  assert.equal(isRiskyConversationCommand("gehe zu Speichern"), true);
  assert.equal(isRiskyConversationCommand("gehe zu Weiter"), true);
  assert.equal(isRiskyConversationCommand("wechsel zu Löschen"), true);
  assert.equal(isRiskyConversationCommand("zeige Weiter"), true);
  assert.equal(isRiskyConversationCommand("beenden"), true);
});

test("createFallbackConversationDecision keeps direct commands ahead of learned UI matches", () => {
  const error = new Error("fetch failed");
  const catalog = {
    commands: [
      { command: "klick Status", kind: "action", target: "Status", aliases: ["status"] },
      { command: "gehe zu Artikelverwaltung", kind: "navigation", target: "Artikelverwaltung", aliases: ["zeige Artikelverwaltung"] },
    ],
  };

  assert.deepEqual(createFallbackConversationDecision("status", catalog, error), {
    type: "execute_command",
    command: "status",
    say: "Lokales KI-Modell nicht erreichbar, ich nutze den direkten Befehl. (fetch failed)",
    confidence: 0.55,
  });

  assert.equal(
    createFallbackConversationDecision("bring mich zur artikelverwaltung", catalog, error).command,
    "gehe zu Artikelverwaltung",
  );
});

test("resolveDirectConversationDecision handles built-in and learned commands without model calls", () => {
  const catalog = {
    commands: [
      {
        command: "gehe zu Artikelverwaltung",
        aliases: ["artikelverwaltung"],
        keys: ["artikelverwaltung"],
      },
    ],
  };

  assert.deepEqual(resolveDirectConversationDecision("suche schernthaner", catalog), {
    type: "execute_command",
    command: "suche schernthaner",
    say: "Ich nutze den direkten Befehl.",
    confidence: 0.9,
  });
  assert.equal(
    resolveDirectConversationDecision("bring mich zur artikelverwaltung", catalog).command,
    "gehe zu Artikelverwaltung",
  );
  assert.deepEqual(resolveDirectConversationDecision("Omnia", catalog), {
    type: "answer",
    command: "",
    say: "Ich bin bereit. Was soll ich in Omnia tun?",
    confidence: 1,
  });
  assert.deepEqual(resolveDirectConversationDecision("hallo", catalog), {
    type: "answer",
    command: "",
    say: "Ich bin bereit. Was soll ich in Omnia tun?",
    confidence: 1,
  });
  assert.equal(resolveDirectConversationDecision("was kannst du", catalog), null);
});

test("resolveConversationCommand does not rewrite direct built-in commands through the catalog", () => {
  const catalog = {
    commands: [
      { command: "klick Status", kind: "action", target: "Status", aliases: ["status"] },
      { command: "gehe zu Artikelverwaltung", kind: "navigation", target: "Artikelverwaltung", aliases: ["zeige Artikelverwaltung"] },
    ],
  };

  assert.equal(resolveConversationCommand("status", catalog), "status");
  assert.equal(resolveConversationCommand("bring mich zur artikelverwaltung", catalog), "gehe zu Artikelverwaltung");
});
