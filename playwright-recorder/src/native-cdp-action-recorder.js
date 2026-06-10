const RECORDER_SCRIPT = String.raw`
(() => {
  const root = window.__OMNIA_VOICE_ACTION_RECORDER__;
  if (root?.cleanup) root.cleanup();

  const state = {
    active: true,
    startedAt: new Date().toISOString(),
    events: [],
  };

  function push(event) {
    if (!state.active) return;
    state.events.push({
      ...event,
      time: new Date().toISOString(),
      path: location.pathname,
    });
  }

  function textOf(element) {
    const appLayerTitle = element?.querySelector?.(".app-layer-title")?.innerText || "";
    return (appLayerTitle || element?.innerText || element?.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }

  function fieldName(element) {
    const labels = Array.from(element?.labels || []).map(textOf).filter(Boolean);
    if (labels[0]) return labels[0];

    const ariaLabelledBy = element?.getAttribute?.("aria-labelledby");
    if (ariaLabelledBy) {
      const labelText = ariaLabelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .map(textOf)
        .filter(Boolean)
        .join(" ");
      if (labelText) return labelText.slice(0, 80);
    }

    return (
      element?.getAttribute?.("aria-label") ||
      element?.getAttribute?.("placeholder") ||
      element?.getAttribute?.("name") ||
      element?.getAttribute?.("formcontrolname") ||
      ""
    ).trim().slice(0, 80);
  }

  function closestClickable(target) {
    return target?.closest?.("button, a, [role='button'], [role='link'], [role='menuitem'], [tabindex]");
  }

  function onClick(event) {
    const element = closestClickable(event.target);
    if (!element) return;
    const text = (
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      textOf(element)
    ).trim().slice(0, 80);
    if (!text) return;
    push({
      type: "click",
      text,
      role: element.getAttribute("role") || element.tagName.toLowerCase(),
      href: element.getAttribute("href") || element.href || "",
    });
  }

  function onInput(event) {
    const element = event.target;
    if (!element?.matches?.("input, textarea, [contenteditable='true']")) return;
    const field = fieldName(element);
    const value = element.value || element.textContent || "";
    push({
      type: "input",
      field,
      value: value === "502753" ? "502753" : undefined,
      valueLength: value.length,
      redacted: value !== "502753",
    });
  }

  function onKeydown(event) {
    if (!["Enter", "Tab", "Escape"].includes(event.key)) return;
    push({
      type: "key",
      key: event.shiftKey && event.key === "Tab" ? "Shift+Tab" : event.key,
    });
  }

  document.addEventListener("click", onClick, true);
  document.addEventListener("input", onInput, true);
  document.addEventListener("keydown", onKeydown, true);

  state.cleanup = () => {
    state.active = false;
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("input", onInput, true);
    document.removeEventListener("keydown", onKeydown, true);
  };

  window.__OMNIA_VOICE_ACTION_RECORDER__ = state;
  return { active: true, startedAt: state.startedAt };
})()
`;

export async function startActionRecording(page) {
  return page.evaluate(RECORDER_SCRIPT);
}

export async function stopActionRecording(page) {
  const result = await page.evaluate(() => {
    const state = window.__OMNIA_VOICE_ACTION_RECORDER__;
    if (!state) return { active: false, events: [] };
    const events = [...state.events];
    state.cleanup?.();
    return {
      active: false,
      startedAt: state.startedAt,
      stoppedAt: new Date().toISOString(),
      events,
    };
  });

  return {
    ...result,
    suggestions: buildCommandSuggestions(result.events || []),
  };
}

export async function snapshotActionRecording(page) {
  const result = await page.evaluate(() => {
    const state = window.__OMNIA_VOICE_ACTION_RECORDER__;
    if (!state) {
      return {
        active: false,
        startedAt: null,
        eventCount: 0,
        events: [],
      };
    }

    return {
      active: Boolean(state.active),
      startedAt: state.startedAt,
      eventCount: state.events?.length || 0,
      events: [...(state.events || [])],
    };
  });

  return {
    ...result,
    suggestions: buildCommandSuggestions(result.events || []),
  };
}

export async function getActionRecordingStatus(page) {
  return page.evaluate(() => {
    const state = window.__OMNIA_VOICE_ACTION_RECORDER__;
    return {
      active: Boolean(state?.active),
      startedAt: state?.startedAt || null,
      eventCount: state?.events?.length || 0,
    };
  });
}

export function buildCommandSuggestions(events) {
  const seen = new Set();
  const suggestions = [];

  for (const event of events || []) {
    const suggestion = suggestionForEvent(event);
    if (!suggestion || seen.has(suggestion.command)) continue;
    seen.add(suggestion.command);
    suggestions.push(suggestion);
  }

  return suggestions;
}

function suggestionForEvent(event) {
  if (event.type === "click" && event.text) {
    const text = cleanText(event.text) || labelForHref(event.href);
    const role = cleanText(event.role).toLowerCase();
    if (!text) return null;

    if (role === "tab") {
      return {
        command: `wechsel zu ${text}`,
        reason: "Tab-Wechsel",
      };
    }

    if (["a", "link"].includes(role)) {
      return {
        command: `gehe zu ${text}`,
        reason: "Navigation per Link",
      };
    }

    if (["listbox", "combobox", "option"].includes(role)) {
      return {
        command: `wähle ${text}`,
        reason: "Auswahlfeld",
      };
    }

    if (["button", "menuitem"].includes(role)) {
      return {
        command: `klick ${text}`,
        reason: "Klick auf Button",
      };
    }

    return {
      command: `klick ${text}`,
      reason: "Klick auf sichtbaren Text",
    };
  }

  if (event.type === "input" && event.value === "502753") {
    return {
      command: "tippe mandantennummer",
      reason: "Mandantennummer 502753 erkannt",
    };
  }

  if (event.type === "input" && event.field) {
    return {
      command: `fülle ${cleanText(event.field)} mit <text>`,
      reason: "Eingabe in Feld",
    };
  }

  if (event.type === "key") {
    const command = {
      Enter: "enter",
      Tab: "tab weiter",
      "Shift+Tab": "tab zurück",
      Escape: "escape",
    }[event.key];
    if (command) return { command, reason: "Taste gedrückt" };
  }

  return null;
}

function cleanText(text) {
  return String(text)
    .replace(/\b(?:add|add_location|apps|assignment|chat|computer|dvr|edit|email|euro_symbol|group|home_work|info|list_alt|note_add|open_in_browser|pie_chart|receipt|search|settings|today|trending_up)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelForHref(href) {
  if (!href) return "";

  let pathname = "";
  try {
    pathname = new URL(href, "https://api2.optica-omnia.de").pathname;
  } catch {
    pathname = String(href).split(/[?#]/, 1)[0];
  }

  const routeLabels = [
    ["/dashboard", "Dashboard"],
    ["/transactions", "Vorgänge"],
    ["/search", "Suche"],
    ["/cash-till", "Kasse"],
    ["/hilfsmittelverwaltung", "Hilfsmittelverwaltung"],
  ];
  return routeLabels.find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1] || "";
}
