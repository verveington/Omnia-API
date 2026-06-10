const CATALOG_VERSION = 1;

const COMMAND_PATTERN = /^(gehe zu|wechsel zu|wähle|waehle|zeige|starte|klick|klicke|oeffne|öffne|öffnen)\s+(.+)$/i;

const ACTION_KINDS = new Map([
  ["gehe zu", "navigation"],
  ["wechsel zu", "tab"],
  ["wähle", "selection"],
  ["waehle", "selection"],
  ["zeige", "view"],
  ["starte", "action"],
  ["klick", "action"],
  ["klicke", "action"],
  ["oeffne", "navigation"],
  ["öffne", "navigation"],
  ["öffnen", "navigation"],
]);

const ICON_WORD_PATTERN = /\b(?:add|add_location|apps|assignment|chat|computer|dvr|edit|email|euro_symbol|group|home_work|info|list_alt|note_add|open_in_browser|pie_chart|receipt|search|settings|today|trending_up)\b/gi;

const DASHBOARD_APP_TARGETS = new Set([
  "aufgaben",
  "e mail",
  "einstellungen",
  "finanzbuchhaltung",
  "hilfsmittelverwaltung",
  "kalender",
  "kommunikator",
  "ladenkasse",
  "preisfindung",
  "stammdaten",
  "statistiken",
  "suchergebnisse",
  "vorgaenge",
  "warenwirtschaft",
]);

const STOP_WORDS = new Set([
  "aber",
  "an",
  "auf",
  "bitte",
  "das",
  "dem",
  "den",
  "der",
  "des",
  "die",
  "doch",
  "du",
  "ein",
  "eine",
  "einen",
  "einmal",
  "etwas",
  "im",
  "in",
  "jetzt",
  "kannst",
  "koenntest",
  "mal",
  "mir",
  "mich",
  "nach",
  "und",
  "vom",
  "zu",
  "zum",
  "zur",
]);

const ACTION_WORDS = new Set([
  "bring",
  "bringe",
  "drueck",
  "druecke",
  "geh",
  "gehe",
  "klick",
  "klicke",
  "leg",
  "lege",
  "mach",
  "navigiere",
  "oeffne",
  "oeffnest",
  "spring",
  "springe",
  "start",
  "starte",
  "waehl",
  "waehle",
  "wechsel",
  "wechsle",
  "zeig",
  "zeige",
]);

const EXECUTOR_VALUES = new Set(["ui", "api", "hybrid"]);
const SAFETY_RANKS = new Map([
  ["safe", 0],
  ["confirm", 1],
  ["blocked", 2],
]);

export function buildCommandCatalog(seed = {}) {
  return {
    version: CATALOG_VERSION,
    updatedAt: seed.updatedAt || null,
    commands: Array.isArray(seed.commands)
      ? seed.commands
        .map(normalizeEntry)
        .filter((entry) => isLearnableSuggestion({ command: entry.command, reason: entry.reasons[0] || "" }))
      : [],
  };
}

export function mergeSuggestionsIntoCatalog(catalog, suggestions, { now = new Date().toISOString() } = {}) {
  const next = buildCommandCatalog(catalog);
  const byCommandKey = new Map(next.commands.map((entry, index) => [entry.commandKey, { entry, index }]));

  for (const suggestion of filterLearnableSuggestions(suggestions)) {
    const command = String(suggestion?.command || "").trim();
    if (!command) continue;

    const descriptor = describeCommand(suggestion, now);
    const existing = byCommandKey.get(descriptor.commandKey);
    if (existing) {
      const merged = {
        ...existing.entry,
        count: existing.entry.count + 1,
        lastSeenAt: now,
        reasons: mergeUnique(existing.entry.reasons, descriptor.reasons),
        aliases: mergeUnique(existing.entry.aliases, descriptor.aliases),
        keys: mergeUnique(existing.entry.keys, descriptor.keys),
        executor: mergeExecutor(existing.entry.executor, descriptor.executor),
        safety: mergeSafety(existing.entry.safety, descriptor.safety),
        context: mergeContext(existing.entry.context, descriptor.context),
        apiObservations: mergeApiObservations(existing.entry.apiObservations, descriptor.apiObservations),
      };
      next.commands[existing.index] = normalizeEntry(merged);
      byCommandKey.set(descriptor.commandKey, { entry: next.commands[existing.index], index: existing.index });
      continue;
    }

    next.commands.push(descriptor);
    byCommandKey.set(descriptor.commandKey, { entry: descriptor, index: next.commands.length - 1 });
  }

  next.updatedAt = now;
  return next;
}

export function filterLearnableSuggestions(suggestions) {
  return (suggestions || []).filter(isLearnableSuggestion);
}

export function resolveNaturalCommand(input, catalog) {
  const phrase = normalizePhrase(input);
  const key = intentKey(input);
  if (!phrase && !key) return null;

  const commands = buildCommandCatalog(catalog).commands;
  if (isAmbiguousShortTarget(key, commands)) return null;

  const scored = commands
    .map((entry) => scoreEntry(entry, phrase, key))
    .filter(Boolean)
    .sort((left, right) => right.confidence - left.confidence || right.entry.count - left.entry.count);

  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].confidence === scored[1].confidence) return null;

  return {
    command: scored[0].entry.command,
    confidence: scored[0].confidence,
    reason: `Gelernter Befehl: ${scored[0].entry.command}`,
  };
}

function isLearnableSuggestion(suggestion) {
  const command = String(suggestion?.command || "").trim();
  if (!command) return false;
  if (/^(?:enter|tab weiter|tab zurück|tab zurueck|escape|tippe mandantennummer)$/i.test(command)) return true;
  if (/^(?:fülle|fuelle|befuelle|befülle)\s+.+?\s+mit\s+<text>$/i.test(command)) return true;

  const parsed = parseLearnedCommand(command);
  const target = parsed.target || "";
  const normalizedTarget = normalizePhrase(target);
  if (!target || !normalizedTarget) return false;

  if (["klick", "klicke"].includes(parsed.action) && DASHBOARD_APP_TARGETS.has(normalizedTarget)) return false;
  if (suggestion.reason === "Klick auf sichtbaren Text") return false;
  if (["apps", "app menue", "app menu"].includes(normalizedTarget)) return false;
  if (normalizedTarget === "bitte waehlen") return false;
  if (normalizedTarget === "open calendar") return false;
  if (/^\d+$/.test(normalizedTarget)) return false;
  if (/\b\d{1,2}\s?\d{1,2}\s?\d{2,4}\b/.test(normalizedTarget)) return false;
  if (/\b(?:januar|februar|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/.test(normalizedTarget)) return false;
  if (target.length > 56) return false;
  if (normalizedTarget.split(" ").length > 6) return false;

  return true;
}

function describeCommand(suggestion, now) {
  const command = String(suggestion?.command || "").trim();
  const reason = suggestion?.reason || "";
  const parsed = parseLearnedCommand(command);
  const target = parsed.target || command;
  const targetKey = intentKey(target);
  const aliases = buildAliases(command, parsed.action, target);
  const keys = mergeUnique([targetKey, intentKey(command)], aliases.map(intentKey).filter(Boolean));

  return normalizeEntry({
    command,
    commandKey: normalizePhrase(command),
    kind: parsed.kind,
    action: parsed.action,
    target,
    targetKey,
    count: 1,
    createdAt: now,
    lastSeenAt: now,
    reasons: reason ? [reason] : [],
    aliases,
    keys,
    executor: suggestion?.executor,
    safety: suggestion?.safety,
    context: suggestion?.context,
    apiObservations: suggestion?.apiObservations,
  });
}

function parseLearnedCommand(command) {
  const match = String(command || "").trim().match(COMMAND_PATTERN);
  if (!match) {
    return {
      kind: "utility",
      action: "",
      target: String(command || "").trim(),
    };
  }

  const action = match[1].toLowerCase();
  return {
    kind: ACTION_KINDS.get(action) || "action",
    action,
    target: cleanTargetText(match[2]),
  };
}

function buildAliases(command, action, target) {
  const aliases = new Set([command, target]);
  const targetKey = normalizePhrase(target);

  if (["gehe zu", "oeffne", "öffne", "öffnen"].includes(action)) {
    aliases.add(`gehe zu ${target}`);
    aliases.add(`zeige ${target}`);
    aliases.add(`bring mich zu ${target}`);
    aliases.add(`navigiere zu ${target}`);
  }

  if (action === "wechsel zu") {
    aliases.add(`wechsel zu ${target}`);
    aliases.add(`zeige ${target}`);
    aliases.add(`geh zu ${target}`);
  }

  if (["wähle", "waehle"].includes(action)) {
    aliases.add(`wähle ${target}`);
    aliases.add(`nimm ${target}`);
  }

  if (["klick", "klicke", "starte"].includes(action)) {
    aliases.add(`klick ${target}`);
    aliases.add(`drücke ${target}`);
    aliases.add(`starte ${target}`);
  }

  if (targetKey === "speichern") {
    aliases.add("speichern");
    aliases.add("speichere");
    aliases.add("speichere das");
    aliases.add("sichern");
    aliases.add("sichere das");
  }

  if (targetKey === "abbrechen") {
    aliases.add("abbrechen");
    aliases.add("brich ab");
    aliases.add("brich das ab");
  }

  if (targetKey === "schliessen") {
    aliases.add("schließen");
    aliases.add("mach zu");
    aliases.add("schließe das");
  }

  if (targetKey.startsWith("neue ") || targetKey.startsWith("neuer ") || targetKey.startsWith("neues ")) {
    aliases.add(`erstelle ${target}`);
    aliases.add(`lege ${target} an`);
    aliases.add(`leg ${target} an`);
  }

  return [...aliases].map((alias) => alias.trim()).filter(Boolean);
}

function scoreEntry(entry, phrase, key) {
  const phraseMatches = [entry.commandKey, ...entry.aliases.map(normalizePhrase)];
  if (phraseMatches.includes(phrase)) {
    return { entry, confidence: 1 };
  }

  if (key && entry.keys.includes(key)) {
    return { entry, confidence: 0.92 };
  }

  if (key && entry.targetKey && (key.includes(entry.targetKey) || entry.targetKey.includes(key))) {
    return { entry, confidence: 0.82 };
  }

  return null;
}

function isAmbiguousShortTarget(key, commands) {
  if (!key || key.includes(" ")) return false;
  const matches = commands.filter((entry) => entry.targetKey === key || entry.targetKey.startsWith(`${key} `));
  return matches.length > 1;
}

function normalizeEntry(entry) {
  const rawCommand = String(entry.command || "").trim();
  const parsed = parseLearnedCommand(rawCommand);
  const fallbackTarget = parsed.action ? parsed.target : (entry.target || parsed.target || rawCommand);
  const target = cleanTargetText(entry.target || fallbackTarget);
  const command = parsed.action && target ? `${parsed.action} ${target}` : rawCommand;
  const aliases = buildAliases(command, parsed.action, target);
  const targetKey = intentKey(target);

  return {
    command,
    commandKey: normalizePhrase(command),
    kind: entry.kind || parsed.kind,
    action: entry.action || parsed.action,
    target,
    targetKey,
    count: Number.isInteger(entry.count) && entry.count > 0 ? entry.count : 1,
    createdAt: entry.createdAt || null,
    lastSeenAt: entry.lastSeenAt || null,
    reasons: Array.isArray(entry.reasons) ? entry.reasons.filter(Boolean) : [],
    aliases,
    keys: mergeUnique([targetKey, intentKey(command)], Array.isArray(entry.keys) ? entry.keys : aliases.map(intentKey)).filter(Boolean),
    executor: normalizeExecutor(entry.executor),
    safety: normalizeSafety(entry.safety),
    context: normalizeContext(entry.context),
    apiObservations: normalizeApiObservations(entry.apiObservations),
  };
}

function normalizeExecutor(executor) {
  return EXECUTOR_VALUES.has(executor) ? executor : "ui";
}

function mergeExecutor(left, right) {
  const normalizedLeft = normalizeExecutor(left);
  const normalizedRight = normalizeExecutor(right);
  if (normalizedLeft === "hybrid" || normalizedRight === "hybrid") return "hybrid";
  if ((normalizedLeft === "ui" && normalizedRight === "api") || (normalizedLeft === "api" && normalizedRight === "ui")) {
    return "hybrid";
  }
  return normalizedRight || normalizedLeft || "ui";
}

function normalizeSafety(safety) {
  return SAFETY_RANKS.has(safety) ? safety : "safe";
}

function mergeSafety(left, right) {
  const normalizedLeft = normalizeSafety(left);
  const normalizedRight = normalizeSafety(right);
  return SAFETY_RANKS.get(normalizedRight) > SAFETY_RANKS.get(normalizedLeft) ? normalizedRight : normalizedLeft;
}

function normalizeContext(context) {
  return isPlainObject(context) ? { ...context } : {};
}

function mergeContext(left, right) {
  return {
    ...normalizeContext(left),
    ...normalizeContext(right),
  };
}

function normalizeApiObservations(apiObservations) {
  return mergeApiObservations([], apiObservations);
}

function mergeApiObservations(left, right) {
  const byObservationKey = new Map();

  for (const observation of [...(left || []), ...(right || [])]) {
    const normalized = normalizeApiObservation(observation);
    if (!normalized) continue;

    const key = `${normalized.method}\0${normalized.path}\0${normalized.status}`;
    const existing = byObservationKey.get(key);
    if (!existing) {
      byObservationKey.set(key, normalized);
      continue;
    }

    existing.calls += normalized.calls;
    existing.lastSeenAt = maxTimestamp(existing.lastSeenAt, normalized.lastSeenAt);
  }

  return [...byObservationKey.values()].slice(0, 12);
}

function normalizeApiObservation(observation) {
  const method = String(observation?.method || "").trim().toUpperCase();
  const path = String(observation?.path || "").trim();
  const status = Number(observation?.status);
  if (!method || !path || !Number.isInteger(status)) return null;

  const calls = Number(observation?.calls);
  return {
    method,
    path,
    status,
    calls: Number.isFinite(calls) && calls > 0 ? calls : 1,
    lastSeenAt: observation?.lastSeenAt || null,
  };
}

function maxTimestamp(left, right) {
  if (!left) return right || null;
  if (!right) return left;

  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return right > left ? right : left;
  return rightTime > leftTime ? right : left;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeUnique(left, right) {
  return [...new Set([...(left || []), ...(right || [])].filter(Boolean))];
}

function intentKey(text) {
  const tokens = normalizePhrase(text)
    .split(" ")
    .map(stemToken)
    .filter((token) => token && !STOP_WORDS.has(token) && !ACTION_WORDS.has(token));
  return tokens.join(" ");
}

function stemToken(token) {
  if (token.length > 4 && token.endsWith("n")) return token.slice(0, -1);
  return token;
}

function normalizePhrase(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTargetText(text) {
  return String(text || "")
    .replace(ICON_WORD_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}
