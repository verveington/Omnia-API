export const commandHelp = [
  "hilfe | ?",
  "status",
  "fokus loginfeld | benutzername",
  "passwort",
  "tippe <text>",
  "tippe mandantennummer",
  "enter | tab weiter | tab zurueck | escape",
  "feld leeren",
  "klick anmelden",
  "klick <button oder sichtbarer text>",
  "gehe zu <navigationseintrag>",
  "wechsel zu <tab>",
  "waehle <option>",
  "zeige <bereich>",
  "starte <aktion>",
  "oeffne <sichtbarer text> (Alias, wenn es sprachlich passt)",
  "fuelle <feld> mit <text>",
  "suche <text> | suche kunde <text>",
  "zurueck | vorwaerts | neu laden",
  "scroll runter | scroll hoch",
  "gelernte Befehle koennen natuerlich formuliert werden, z. B. 'zeig mir die Dokumente'",
  "beenden",
];

const MANDANTENNUMMER = "502753";

export function parseNativeCommand(input) {
  const text = String(input || "").trim();
  const normalized = normalize(text);

  if (!normalized) return { type: "noop" };
  if (["hilfe", "help", "?"].includes(normalized)) return { type: "help" };
  if (["beenden", "exit", "quit", "ende"].includes(normalized)) return { type: "quit" };
  if (["status", "summary", "seite"].includes(normalized)) return { type: "summary" };
  if (["fokus loginfeld", "loginfeld", "benutzername", "username", "user"].includes(normalized)) {
    return { type: "focus-login" };
  }
  if (["passwort", "password", "fokus passwort"].includes(normalized)) return { type: "focus-password" };
  if (["enter", "druecke enter", "drucke enter", "drücke enter"].includes(normalized)) return { type: "press-key", key: "Enter" };
  if (["tab", "tab weiter", "naechstes feld", "nächstes feld"].includes(normalized)) return { type: "press-key", key: "Tab" };
  if (["tab zurueck", "tab zurück", "vorheriges feld", "shift tab", "umschalt tab"].includes(normalized)) return { type: "press-key", key: "Shift+Tab" };
  if (["escape", "esc", "abbrechen"].includes(normalized)) return { type: "press-key", key: "Escape" };
  if (["backspace", "ruecktaste", "löschen", "loeschen"].includes(normalized)) return { type: "press-key", key: "Backspace" };
  if (["feld leeren", "feld löschen", "feld loeschen", "eingabe leeren"].includes(normalized)) return { type: "clear-field" };
  if (["tippe mandantennummer", "mandantennummer", "mandant"].includes(normalized)) return { type: "type-text", text: MANDANTENNUMMER };
  if (["zurueck", "zurück", "gehe zurueck", "gehe zurück"].includes(normalized)) return { type: "go-back" };
  if (["vorwaerts", "vorwärts", "gehe vorwaerts", "gehe vorwärts"].includes(normalized)) return { type: "go-forward" };
  if (["neu laden", "reload", "aktualisieren"].includes(normalized)) return { type: "reload" };
  if (["scroll runter", "runter scrollen", "nach unten"].includes(normalized)) return { type: "scroll", direction: "down" };
  if (["scroll hoch", "hoch scrollen", "nach oben"].includes(normalized)) return { type: "scroll", direction: "up" };
  if (["klick anmelden", "anmelden", "login", "einloggen"].includes(normalized)) {
    return { type: "click-login" };
  }

  const typeMatch = text.match(/^(?:tippe|schreibe|type)\s+(.+)$/i);
  if (typeMatch) return { type: "type-text", text: typeMatch[1].trim() };

  const fillMatch = text.match(/^(?:fülle|fuelle|befuelle|befülle)\s+(.+?)\s+mit\s+(.+)$/i);
  if (fillMatch) {
    return { type: "fill-field", field: fillMatch[1].trim(), value: fillMatch[2].trim() };
  }

  const clickTextMatch = text.match(/^(?:klick|klicke|waehle|wähle|zeige|starte|oeffne|öffne|öffnen|gehe zu|wechsel zu)\s+(.+)$/i);
  if (clickTextMatch) {
    return { type: "click-text", text: clickTextMatch[1].trim() };
  }

  const customerSearchMatch = text.match(/^suche\s+(?:kunde|kunden)\s+(.+)$/i);
  if (customerSearchMatch) {
    return { type: "search", entity: "kunde", query: customerSearchMatch[1].trim() };
  }

  const searchMatch = text.match(/^suche\s+(.+)$/i);
  if (searchMatch) {
    return { type: "search", entity: "", query: searchMatch[1].trim() };
  }

  return { type: "unknown", text };
}

export async function executeNativeCommand(page, command) {
  switch (command.type) {
    case "noop":
      return { ok: true, message: "Keine Aktion." };
    case "help":
      return { ok: true, message: `Befehle:\n- ${commandHelp.join("\n- ")}` };
    case "summary":
      return { ok: true, message: JSON.stringify(await summarizePage(page), null, 2) };
    case "focus-login":
      await focusFirst(page, [
        "input[autocomplete='username']",
        "input[type='email']",
        "input[name*='user' i]",
        "input[name*='login' i]",
        "input[placeholder*='Benutzer' i]",
        "input[placeholder*='E-Mail' i]",
        "input[placeholder*='Email' i]",
        "input:not([type='hidden']):not([type='password'])",
      ]);
      return { ok: true, message: "Loginfeld fokussiert." };
    case "focus-password":
      await focusFirst(page, [
        "input[type='password']",
        "input[autocomplete='current-password']",
        "input[placeholder*='Passwort' i]",
      ]);
      return { ok: true, message: "Passwortfeld fokussiert." };
    case "type-text":
      await page.keyboard.type(command.text, { delay: 10 });
      return { ok: true, message: `Text getippt: ${command.text.length} Zeichen.` };
    case "press-key":
      await page.keyboard.press(command.key);
      return { ok: true, message: `Taste gedrueckt: ${command.key}.` };
    case "clear-field":
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");
      return { ok: true, message: "Aktuelles Feld geleert." };
    case "go-back":
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => {});
      return { ok: true, message: "Zurueck navigiert." };
    case "go-forward":
      await page.goForward({ waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => {});
      return { ok: true, message: "Vorwaerts navigiert." };
    case "reload":
      await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      return { ok: true, message: "Seite neu geladen." };
    case "scroll":
      await page.mouse.wheel(0, command.direction === "up" ? -700 : 700);
      return { ok: true, message: `Gescrollt: ${command.direction === "up" ? "hoch" : "runter"}.` };
    case "click-login":
      await clickFirst(page, [
        () => page.getByRole("button", { name: /anmelden|login|einloggen/i }),
        "button[type='submit']",
        "input[type='submit']",
        "button",
      ]);
      return { ok: true, message: "Anmelden-Klick ausgefuehrt." };
    case "click-text":
      await clickVisibleText(page, command.text);
      return { ok: true, message: `Geklickt: ${command.text}.` };
    case "fill-field":
      await fillField(page, command.field, command.value);
      return { ok: true, message: `Feld gefuellt: ${command.field}.` };
    case "search":
      await runSearch(page, command);
      return { ok: true, message: `Suche ausgefuehrt: ${command.query}.` };
    case "unknown":
      return { ok: false, message: `Unbekannter Befehl: ${command.text}. Tippe "hilfe" fuer die Befehlsliste.` };
    default:
      return { ok: false, message: `Nicht implementierter Befehlstyp: ${command.type}.` };
  }
}

async function runSearch(page, command) {
  await focusFirst(page, [
    "input[type='search']",
    "input[placeholder*='Suche' i]",
    "input[aria-label*='Suche' i]",
    "input[name*='search' i]",
    "input[name*='suche' i]",
    command.entity === "kunde" ? "input[placeholder*='Kunde' i]" : "",
  ].filter(Boolean));
  await page.keyboard.type(command.query, { delay: 10 });
  await page.keyboard.press("Enter");
}

async function clickVisibleText(page, text) {
  const pattern = exactTextPattern(text);
  await clickFirst(page, [
    () => page.getByRole("button", { name: pattern }),
    () => page.getByRole("link", { name: pattern }),
    () => page.getByRole("menuitem", { name: pattern }),
    () => page.getByText(pattern).first(),
  ]);
}

async function fillField(page, field, value) {
  const pattern = partialTextPattern(field);
  for (const candidate of [
    () => page.getByLabel(pattern).first(),
    () => page.getByPlaceholder(pattern).first(),
    () => page.getByRole("textbox", { name: pattern }).first(),
  ]) {
    const locator = candidate();
    if (await tryFill(locator, value)) return;
  }

  throw new Error(`Kein passendes Feld gefunden: ${field}.`);
}

async function summarizePage(page) {
  return page.evaluate(() => ({
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    buttonCount: document.querySelectorAll("button").length,
    inputCount: document.querySelectorAll("input, textarea, [contenteditable=true]").length,
    focusedTag: document.activeElement?.tagName?.toLowerCase() || "",
    focusedType: document.activeElement?.getAttribute?.("type") || "",
  }));
}

async function focusFirst(page, candidates) {
  for (const candidate of candidates) {
    const locator = typeof candidate === "function" ? candidate() : page.locator(candidate).first();
    if (await tryFocus(locator)) return;
  }
  throw new Error("Kein passendes Feld gefunden.");
}

async function clickFirst(page, candidates) {
  for (const candidate of candidates) {
    const locator = typeof candidate === "function" ? candidate() : page.locator(candidate).first();
    if (await tryClick(locator)) return;
  }
  throw new Error("Kein passender Button gefunden.");
}

async function tryFocus(locator) {
  try {
    if ((await locator.count()) === 0) return false;
    await locator.focus({ timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

async function tryClick(locator) {
  try {
    if ((await locator.count()) === 0) return false;
    await locator.click({ timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

async function tryFill(locator, value) {
  try {
    if ((await locator.count()) === 0) return false;
    await locator.fill(value, { timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

function exactTextPattern(text) {
  return new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`, "i");
}

function partialTextPattern(text) {
  return new RegExp(escapeRegExp(text), "i");
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}
