import { resolveNaturalCommand } from "./native-cdp-command-catalog.js";
import { parseNativeCommand } from "./native-cdp-commands.js";

const DEFAULT_LOCAL_MODEL = "qwen2.5:7b";
const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:11434/v1";
const DEFAULT_LOCAL_TIMEOUT_MS = 8000;
const MAX_COMMANDS_IN_PROMPT = 32;
const MAX_COMPLETION_TOKENS = 180;
const MAX_HISTORY_ITEMS = 8;
const ACTIONABLE_UI_COMMAND_PATTERN = /^(?:klick|klicke|waehle|zeige|starte|oeffne|oeffnen|gehe zu|wechsel zu)\b/;
const RISKY_ACTION_TARGET_PATTERN = /\b(?:speichern|schliessen|loeschen|entfernen|ok|weiter|ja|neue|neuer|neues|kopieren|generieren|zuordnung)\b/;
const WAKE_WORD_PATTERN = /^(?:omnia|hallo|hallo omnia|hi|hey|servus|start)$/;

export function createConversationConfig(env = process.env) {
  const baseUrl = String(env.OMNIA_AI_BASE_URL || DEFAULT_LOCAL_BASE_URL).replace(/\/+$/, "");
  return {
    apiKey: env.OMNIA_AI_API_KEY || "ollama",
    endpoint: env.OMNIA_AI_CHAT_ENDPOINT || `${baseUrl}/chat/completions`,
    model: env.OMNIA_AI_MODEL || DEFAULT_LOCAL_MODEL,
    timeoutMs: parseTimeoutMs(env.OMNIA_AI_TIMEOUT_MS),
  };
}

export function createConversationRequest({ model, text, pageSummary = {}, catalog = {}, history = [] }) {
  return {
    model,
    stream: false,
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: MAX_COMPLETION_TOKENS,
    messages: [
      {
        role: "system",
        content: [
          "Du hilfst dabei, Optica Omnia fernzusteuern.",
          "Antworte immer ausschließlich als JSON-Objekt ohne Markdown.",
          "Du darfst keine eigenen UI-Aktionen erfinden.",
          "Wenn eine Aktion ausgeführt werden soll, wähle genau einen Befehl aus der Liste der bekannten Befehle.",
          "Wenn die passende Aktion unklar ist, frage kurz nach.",
          "Wenn Omnia nicht verbunden ist, darfst du bekannte Befehle erkennen, musst aber sagen, dass UI-Ausführung erst nach der Verbindung möglich ist.",
          "Für Formularfüllung, Speichern, Löschen, OK, Weiter, Ja oder Beenden wähle trotzdem den passenden Befehl, aber formuliere in 'say' eine kurze Bestätigungsfrage für die UI-Karte 'Trotzdem ausführen'.",
          "JSON-Schema: {\"type\":\"execute_command|ask_clarification|answer\",\"command\":\"\",\"say\":\"\",\"confidence\":0.0}",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          userText: String(text || "").trim(),
          currentPage: compactPageSummary(pageSummary),
          knownCommands: compactCommands(catalog, text),
          recentConversation: compactHistory(history),
        }, null, 2),
      },
    ],
  };
}

export async function requestConversationDecision({
  config,
  text,
  pageSummary,
  catalog,
  history = [],
  fetchImpl = fetch,
  signal,
}) {
  const request = createConversationRequest({
    model: config.model,
    text,
    pageSummary,
    catalog,
    history,
  });

  const timeoutMs = parseTimeoutMs(config.timeoutMs);
  const shouldApplyTimeout = !signal && Number.isFinite(timeoutMs) && timeoutMs > 0;
  const controller = shouldApplyTimeout ? new AbortController() : null;
  const fetchSignal = signal || controller?.signal;
  let timeoutId;
  let timedOut = false;
  const timeoutError = new Error(`Lokaler KI-Server antwortet nicht innerhalb von ${timeoutMs} ms.`);
  const operation = async () => {
    const response = await fetchImpl(config.endpoint, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${config.apiKey || "ollama"}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
      ...(fetchSignal ? { signal: fetchSignal } : {}),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Lokaler KI-Server antwortet mit HTTP ${response.status}${body ? `: ${body.slice(0, 240)}` : ""}`);
    }

    return normalizeConversationDecision(parseJsonObject(extractChatCompletionText(await response.json())));
  };

  const timeout = controller
    ? new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(timeoutError);
      }, timeoutMs);
    })
    : null;

  try {
    return await (timeout ? Promise.race([operation(), timeout]) : operation());
  } catch (error) {
    if (timedOut) throw timeoutError;
    if (error?.name === "AbortError") throw new Error("Anfrage an lokalen KI-Server wurde abgebrochen.");
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function extractChatCompletionText(payload) {
  return String(payload?.choices?.[0]?.message?.content || "").trim();
}

export function isRiskyConversationCommand(command) {
  const normalized = normalizeText(command);
  if (!normalized) return false;
  if (/^(?:beenden|exit|quit|ende)$/.test(normalized)) return true;
  if (/^(?:tippe|schreibe|type|fuelle|fülle|befuelle|befülle)\b/.test(normalized)) return true;
  if (ACTIONABLE_UI_COMMAND_PATTERN.test(normalized) && RISKY_ACTION_TARGET_PATTERN.test(normalized)) return true;
  if (/\b(?:passwort|mandantennummer)\b/.test(normalized)) return true;
  return false;
}

export function createFallbackConversationDecision(text, catalog, error) {
  const direct = parseNativeCommand(text);
  if (direct.type !== "unknown") {
    return {
      type: "execute_command",
      command: text,
      say: `Lokales KI-Modell nicht erreichbar, ich nutze den direkten Befehl. (${error.message})`,
      confidence: 0.55,
    };
  }

  const learnedMatch = resolveNaturalCommand(text, catalog);
  if (learnedMatch) {
    return {
      type: "execute_command",
      command: learnedMatch.command,
      say: `Lokales KI-Modell nicht erreichbar, ich nutze den gelernten Befehl. (${error.message})`,
      confidence: learnedMatch.confidence,
    };
  }

  return {
    type: "ask_clarification",
    command: "",
    say: `Ich erreiche den lokalen KI-Server nicht: ${error.message}`,
    confidence: 0,
  };
}

export function resolveDirectConversationDecision(text, catalog) {
  const command = String(text || "").trim();
  if (!command) return null;

  if (WAKE_WORD_PATTERN.test(normalizeText(command))) {
    return {
      type: "answer",
      command: "",
      say: "Ich bin bereit. Was soll ich in Omnia tun?",
      confidence: 1,
    };
  }

  const direct = parseNativeCommand(command);
  if (direct.type !== "unknown" && direct.type !== "noop") {
    return {
      type: "execute_command",
      command,
      say: "Ich nutze den direkten Befehl.",
      confidence: 0.9,
    };
  }

  const learnedMatch = resolveNaturalCommand(command, catalog);
  if (!learnedMatch) return null;

  return {
    type: "execute_command",
    command: learnedMatch.command,
    say: "Ich nutze den gelernten Befehl.",
    confidence: learnedMatch.confidence,
  };
}

export function resolveConversationCommand(command, catalog) {
  const direct = parseNativeCommand(command);
  if (direct.type !== "unknown") return String(command || "").trim();
  return resolveNaturalCommand(command, catalog)?.command || String(command || "").trim();
}

export function normalizeConversationDecision(raw) {
  const type = ["execute_command", "ask_clarification", "answer"].includes(raw?.type)
    ? raw.type
    : "ask_clarification";
  const command = type === "execute_command" ? String(raw?.command || "").trim() : "";
  const say = String(raw?.say || "").trim() || fallbackSay(type, command);
  const confidence = Number(raw?.confidence);

  return {
    type,
    command,
    say,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
  };
}

function compactCommands(catalog, text = "") {
  return (catalog?.commands || [])
    .map((entry, index) => ({
      entry,
      index,
      score: commandRelevanceScore(entry, text),
    }))
    .sort((left, right) => right.score - left.score || right.entry.count - left.entry.count || left.index - right.index)
    .slice(0, MAX_COMMANDS_IN_PROMPT)
    .map(({ entry }) => ({
      command: entry.command,
      kind: entry.kind,
      target: entry.target,
      aliases: (entry.aliases || []).slice(0, 2),
    }));
}

function commandRelevanceScore(entry, text) {
  const query = normalizeText(text);
  if (!query) return Number(entry?.count || 0);

  const haystack = [
    entry?.command,
    entry?.target,
    ...(entry?.aliases || []),
    ...(entry?.keys || []),
  ].map(normalizeText).filter(Boolean).join(" ");

  if (!haystack) return 0;
  if (haystack === query) return 100;
  if (haystack.includes(query)) return 80;

  const queryTokens = query.split(" ").filter(Boolean);
  if (!queryTokens.length) return 0;
  const matchingTokens = queryTokens.filter((token) => haystack.includes(token)).length;
  return matchingTokens * 10 + Number(entry?.count || 0);
}

function parseTimeoutMs(value) {
  if (value === undefined || value === null || value === "") return DEFAULT_LOCAL_TIMEOUT_MS;
  const timeoutMs = Number(value);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) return DEFAULT_LOCAL_TIMEOUT_MS;
  return Math.floor(timeoutMs);
}

function compactHistory(history) {
  return (history || []).slice(-MAX_HISTORY_ITEMS).map((entry) => ({
    role: entry.role,
    text: String(entry.text || "").slice(0, 300),
  }));
}

function compactPageSummary(pageSummary) {
  return {
    connected: pageSummary?.connected !== false,
    connectionMessage: pageSummary?.connectionMessage || "",
    href: pageSummary?.href || "",
    title: pageSummary?.title || "",
    readyState: pageSummary?.readyState || "",
    buttonCount: pageSummary?.buttonCount || 0,
    linkCount: pageSummary?.linkCount || 0,
    tabCount: pageSummary?.tabCount || 0,
    inputCount: pageSummary?.inputCount || 0,
  };
}

function parseJsonObject(text) {
  const cleaned = stripMarkdownFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Lokales KI-Modell hat kein parsebares JSON geliefert.");
  }
}

function stripMarkdownFence(text) {
  return String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function fallbackSay(type, command) {
  if (type === "execute_command" && command) return `Ich führe aus: ${command}.`;
  if (type === "answer") return "Okay.";
  return "Das ist noch nicht eindeutig. Was soll ich in Omnia tun?";
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}
