const OMNIA_MODES = new Set(["launch", "attach", "none"]);

export function normalizeOmniaMode(mode) {
  return OMNIA_MODES.has(mode) ? mode : "none";
}

export function createOmniaConnectionState(seed = {}) {
  return {
    mode: normalizeOmniaMode(seed.mode),
    connected: Boolean(seed.connected),
    connecting: Boolean(seed.connecting),
    page: seed.page ?? null,
    browser: seed.browser ?? null,
    lastError: seed.lastError ?? "",
  };
}

export function serializeOmniaStatus(state, extras = {}) {
  const connectionState = createOmniaConnectionState(state);
  const pageSummary = state?.pageSummary ?? {};

  return {
    ok: true,
    omnia: {
      mode: connectionState.mode,
      connected: connectionState.connected,
      connecting: connectionState.connecting,
      href: pageSummary.href ?? state?.href ?? "",
      title: pageSummary.title ?? state?.title ?? "",
      lastError: connectionState.lastError,
    },
    ...extras,
  };
}

export function createDisconnectedPageSummary(message = "Omnia ist nicht verbunden.") {
  return {
    connected: false,
    href: "",
    readyState: "disconnected",
    buttonCount: 0,
    linkCount: 0,
    tabCount: 0,
    inputCount: 0,
    title: "Omnia nicht verbunden",
    connectionMessage: message,
  };
}

export function disconnectedActionResult(command = "") {
  return {
    ok: true,
    executed: false,
    requiresConnection: true,
    command,
    message: "Omnia ist nicht verbunden. Starte oder verbinde Omnia, bevor dieser Befehl ausgefuehrt wird.",
  };
}
