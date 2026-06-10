export function createVoiceServerConfig(env = process.env) {
  return {
    host: env.OMNIA_VOICE_HOST || "127.0.0.1",
    port: parsePositiveInt(env.OMNIA_VOICE_PORT, 8787),
  };
}

export function parseJsonBody(buffer) {
  try {
    return JSON.parse(buffer.toString("utf8") || "{}");
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

export function createVoicePanelHtml() {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Omnia Voice Control</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f4f6f8;
      color: #18202a;
      --panel: #ffffff;
      --border: #d7dee7;
      --muted: #657181;
      --accent: #0f766e;
      --accent-strong: #115e59;
      --danger: #b42318;
      --warn: #b54708;
      --soft: #eef6f4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #f4f6f8;
    }
    button, input {
      font: inherit;
    }
    button {
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #ffffff;
      color: #18202a;
      min-height: 38px;
      padding: 0 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    button.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #ffffff;
    }
    button.danger {
      border-color: #f3b4ad;
      color: var(--danger);
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .app {
      width: min(1180px, 100%);
      min-height: 100vh;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 14px;
    }
    .topBar {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      min-height: 48px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.15;
      letter-spacing: 0;
    }
    .subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }
    .workspace {
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 310px;
      gap: 14px;
      align-items: stretch;
    }
    .chatPanel,
    .sidePanel {
      min-height: 0;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 10px 28px rgba(20, 30, 43, 0.06);
    }
    .chatPanel {
      display: grid;
      grid-template-rows: minmax(360px, 1fr) auto;
      overflow: hidden;
    }
    .chatLog {
      min-height: 0;
      overflow-y: auto;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background:
        linear-gradient(#ffffff 0 0) padding-box,
        linear-gradient(180deg, #ffffff, #f8fafc) border-box;
    }
    .message {
      width: min(76%, 680px);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      line-height: 1.45;
      font-size: 14px;
      overflow-wrap: anywhere;
    }
    .message.user {
      align-self: flex-end;
      background: var(--soft);
      border-color: #b8dcd7;
    }
    .message.assistant,
    .message.system {
      align-self: flex-start;
      background: #ffffff;
    }
    .message.error {
      align-self: flex-start;
      border-color: #f3b4ad;
      color: var(--danger);
      background: #fff7f6;
    }
    .messageMeta {
      display: block;
      margin-bottom: 3px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.25;
    }
    .actionCard {
      align-self: flex-start;
      width: min(76%, 680px);
      border: 1px solid #f4c790;
      background: #fffaf2;
      border-radius: 8px;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .actionCommand {
      color: #3a2a12;
      font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }
    .composer {
      border-top: 1px solid var(--border);
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 10px;
      background: #fbfcfd;
    }
    input {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0 12px;
      color: #18202a;
      background: #ffffff;
    }
    .sidePanel {
      overflow-y: auto;
      padding: 16px;
      display: grid;
      align-content: start;
      gap: 18px;
    }
    .statusGrid {
      display: grid;
      gap: 8px;
    }
    .status {
      min-height: 42px;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      background: #ffffff;
      display: grid;
      align-content: center;
      gap: 1px;
    }
    .status strong {
      display: block;
      color: #18202a;
      font-size: 12px;
    }
    .status span {
      color: var(--muted);
    }
    h2 {
      margin: 0;
      font-size: 14px;
      line-height: 1.3;
      letter-spacing: 0;
    }
    .controlGroup {
      display: grid;
      gap: 8px;
    }
    .buttonGrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .buttonGrid .wide {
      grid-column: 1 / -1;
    }
    details {
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }
    summary {
      cursor: pointer;
      font-size: 14px;
      font-weight: 650;
      margin-bottom: 10px;
    }
    .learnedCommands {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 36px;
    }
    .learnedCommands button {
      min-height: 32px;
      font-size: 13px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .empty {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }
    .srOnly {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (max-width: 880px) {
      .app { padding: 14px; }
      .workspace { grid-template-columns: 1fr; }
      .chatPanel { min-height: calc(100vh - 110px); }
      .sidePanel { overflow: visible; }
    }
    @media (max-width: 560px) {
      .topBar { align-items: flex-start; flex-direction: column; }
      .composer { grid-template-columns: 1fr; }
      .message,
      .actionCard { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topBar">
      <div>
        <h1>Omnia Voice</h1>
        <p class="subtitle">Chat zuerst. Text und Sprache nutzen denselben KI-Pfad.</p>
      </div>
      <button id="disconnectOmnia" class="danger" type="button">Trennen</button>
    </header>
    <div class="workspace">
      <section class="chatPanel" aria-label="Omnia Chat">
        <div class="chatLog" id="chatLog" aria-live="polite"></div>
        <form class="composer" id="composerForm">
          <label class="srOnly" for="composerInput">Nachricht</label>
          <input id="composerInput" autocomplete="off" placeholder="Schreibe einen Auftrag an Omnia">
          <button id="toggleVoice" type="button">Sprache</button>
          <button id="sendMessage" class="primary" type="submit">Senden</button>
        </form>
      </section>
      <aside class="sidePanel" aria-label="Omnia Steuerung">
        <div class="statusGrid">
          <div class="status"><strong>Omnia</strong><span id="omniaStatus">Status wird geladen</span></div>
          <div class="status"><strong>KI</strong><span id="aiStatus">Status wird geladen</span></div>
          <div class="status"><strong>Sprache</strong><span id="speechStatus">Sprache pruefen</span></div>
          <div class="status"><strong>Lernen</strong><span id="learningStatus">Lernen: aus</span></div>
        </div>
        <div class="controlGroup">
          <h2>Verbindung</h2>
          <div class="buttonGrid">
            <button id="connectLaunch" class="primary" type="button">Starten</button>
            <button id="connectAttach" type="button">Verbinden</button>
            <button id="connectNone" type="button">Ohne Omnia</button>
          </div>
        </div>
        <div class="controlGroup">
          <h2>Lernen</h2>
          <div class="buttonGrid">
            <button id="startLearning" type="button">Start</button>
            <button id="stopLearning" type="button">Stop</button>
            <button id="runAutoExplorer" class="wide" type="button">Auto-Explorer</button>
            <button id="refreshLearning" class="wide" type="button">Aktualisieren</button>
          </div>
        </div>
        <details id="learnedDrawer" open>
          <summary>Gelernte Befehle</summary>
          <div class="learnedCommands" id="learnedCommands">
            <span class="empty">Noch keine Befehle geladen.</span>
          </div>
        </details>
      </aside>
    </div>
  </main>
  <script>
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const chatLogEl = document.getElementById("chatLog");
    const composerFormEl = document.getElementById("composerForm");
    const composerInputEl = document.getElementById("composerInput");
    const sendMessageBtn = document.getElementById("sendMessage");
    const toggleVoiceBtn = document.getElementById("toggleVoice");
    const learnedCommandsEl = document.getElementById("learnedCommands");
    const omniaStatusEl = document.getElementById("omniaStatus");
    const aiStatusEl = document.getElementById("aiStatus");
    const speechStatusEl = document.getElementById("speechStatus");
    const learningStatusEl = document.getElementById("learningStatus");
    const connectLaunchBtn = document.getElementById("connectLaunch");
    const connectAttachBtn = document.getElementById("connectAttach");
    const connectNoneBtn = document.getElementById("connectNone");
    const disconnectOmniaBtn = document.getElementById("disconnectOmnia");
    const startLearningBtn = document.getElementById("startLearning");
    const stopLearningBtn = document.getElementById("stopLearning");
    const runAutoExplorerBtn = document.getElementById("runAutoExplorer");
    const refreshLearningBtn = document.getElementById("refreshLearning");
    let recognition = null;
    let listening = false;
    let voiceTransitioning = false;
    let learningPoll = null;
    let lastStatus = {
      omnia: {},
      ai: {},
      learning: { active: false, eventCount: 0, apiEventCount: 0 }
    };

    function appendMessage(role, text, meta = "") {
      const message = document.createElement("div");
      message.className = "message " + role;
      if (meta) {
        const metaEl = document.createElement("span");
        metaEl.className = "messageMeta";
        metaEl.textContent = meta;
        message.append(metaEl);
      }
      const textEl = document.createElement("div");
      textEl.textContent = text || "";
      message.append(textEl);
      chatLogEl.append(message);
      chatLogEl.scrollTop = chatLogEl.scrollHeight;
      return message;
    }

    function appendSystemMessage(text) {
      appendMessage("system", text, "System");
    }

    function renderConversationPayload(payload) {
      if (payload.needsConfirmation && payload.decision?.command) {
        renderConfirmationCard(payload);
        return;
      }
      const role = payload.ok === false ? "error" : "assistant";
      appendMessage(role, payload.message || "Keine Antwort.", payload.ok === false ? "Fehler" : "Omnia");
      if (payload.closed) {
        composerInputEl.disabled = true;
        sendMessageBtn.disabled = true;
        toggleVoiceBtn.disabled = true;
        speechStatusEl.textContent = "Session beendet";
      }
    }

    function renderConfirmationCard(payload) {
      const command = String(payload.decision.command || "");
      const card = document.createElement("div");
      card.className = "actionCard";
      const message = document.createElement("div");
      message.textContent = payload.message || "Dieser Befehl braucht Bestaetigung.";
      const commandEl = document.createElement("div");
      commandEl.className = "actionCommand";
      commandEl.textContent = command;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      button.textContent = "Trotzdem ausfuehren";
      button.addEventListener("click", () => executeConfirmedCommand(command, button).catch((error) => appendMessage("error", error.message, "Fehler")));
      card.append(message, commandEl, button);
      chatLogEl.append(card);
      chatLogEl.scrollTop = chatLogEl.scrollHeight;
    }

    async function executeConfirmedCommand(command, button) {
      button.disabled = true;
      const recognizedCommand = command;
      appendSystemMessage("Fuehre bestaetigten Befehl aus: " + recognizedCommand);
      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: recognizedCommand })
      });
      const payload = await response.json();
      appendMessage(payload.ok === false ? "error" : "assistant", payload.message || "Befehl ausgefuehrt.", payload.ok === false ? "Fehler" : "Omnia");
      await refreshStatus();
    }

    async function sendChatMessage(text) {
      const message = String(text || "").trim();
      if (!message) return;
      composerInputEl.value = "";
      appendMessage("user", message, "Du");
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: message })
      });
      const payload = await response.json();
      renderConversationPayload(payload);
      await refreshStatus();
    }

    async function postJson(url, body = null) {
      const options = { method: "POST" };
      if (body) {
        options.headers = { "content-type": "application/json" };
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      return response.json();
    }

    async function getJson(url) {
      const response = await fetch(url);
      return response.json();
    }

    function updateStatus(payload) {
      const learningUpdate = payload.learning || (Object.hasOwn(payload, "active") ? payload : {});
      lastStatus = {
        ...lastStatus,
        ...payload,
        omnia: { ...lastStatus.omnia, ...(payload.omnia || {}) },
        ai: { ...lastStatus.ai, ...(payload.ai || {}) },
        learning: { ...lastStatus.learning, ...learningUpdate }
      };
      const omnia = lastStatus.omnia || {};
      const ai = lastStatus.ai || {};
      const learning = lastStatus.learning || {};
      if (omnia.connecting) {
        omniaStatusEl.textContent = "Verbinde (" + (omnia.mode || "none") + ")";
      } else if (omnia.connected) {
        omniaStatusEl.textContent = "Verbunden: " + (omnia.title || omnia.href || omnia.mode || "Omnia");
      } else {
        omniaStatusEl.textContent = omnia.lastError ? "Nicht verbunden: " + omnia.lastError : "Nicht verbunden";
      }
      aiStatusEl.textContent = ai.model ? ai.model : "Lokale KI";
      learningStatusEl.textContent = learning.active
        ? "Aktiv, " + (learning.eventCount || 0) + " UI / " + (learning.apiEventCount || 0) + " API"
        : "Aus";
    }

    async function refreshStatus() {
      const payload = await getJson("/api/status");
      updateStatus(payload);
      return payload;
    }

    async function connectOmnia(mode) {
      appendSystemMessage("Verbindung: " + mode);
      updateConnectionButtons(true);
      try {
        const payload = await postJson("/api/omnia/connect", { mode });
        updateStatus(payload);
        appendSystemMessage(payload.message || "Verbindungsstatus aktualisiert.");
      } finally {
        updateConnectionButtons(false);
      }
    }

    async function disconnectOmnia() {
      appendSystemMessage("Trenne Omnia.");
      const payload = await postJson("/api/omnia/disconnect");
      updateStatus(payload);
      appendSystemMessage(payload.message || "Omnia getrennt.");
    }

    function updateConnectionButtons(disabled) {
      connectLaunchBtn.disabled = disabled;
      connectAttachBtn.disabled = disabled;
      connectNoneBtn.disabled = disabled;
      disconnectOmniaBtn.disabled = disabled;
    }

    async function startLearning() {
      appendSystemMessage("Lernmodus wird gestartet.");
      const payload = await postJson("/api/learning/start");
      handleLearningPayload(payload);
      if (payload.ok && !payload.requiresConnection) startLearningPoll();
    }

    async function stopLearning() {
      appendSystemMessage("Lernmodus wird gestoppt.");
      const payload = await postJson("/api/learning/stop");
      stopLearningPoll();
      handleLearningPayload(payload);
    }

    async function refreshLearning() {
      const payload = await getJson("/api/learning/status");
      handleLearningPayload(payload, { quiet: true });
      return payload;
    }

    async function loadLearnedCommands() {
      const payload = await getJson("/api/learning/commands");
      if (!payload.ok) {
        appendMessage("error", payload.message || "Gelernte Befehle konnten nicht geladen werden.", "Fehler");
        return;
      }
      renderLearnedCommands(payload.catalog?.commands || []);
    }

    async function runAutoExplorer() {
      runAutoExplorerBtn.disabled = true;
      appendSystemMessage("Auto-Explorer gestartet.");
      try {
        const payload = await fetch("/api/explorer/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ maxSteps: 40, restoreStartUrl: true })
        }).then((response) => response.json());
        handleLearningPayload(payload);
        if (payload.summary) {
          appendSystemMessage("Auto-Explorer: " + payload.summary.clickedCount + " Klicks, " + payload.summary.learnedCount + " neue Befehle.");
        }
      } finally {
        runAutoExplorerBtn.disabled = false;
      }
    }

    function handleLearningPayload(payload, options = {}) {
      updateStatus({ learning: payload });
      if (payload.catalog?.commands) renderLearnedCommands(payload.catalog.commands);
      if (!payload.ok) {
        appendMessage("error", payload.message || "Lernstatus konnte nicht aktualisiert werden.", "Fehler");
        return;
      }
      if (payload.active && !learningPoll) startLearningPoll();
      if (!payload.active) stopLearningPoll();
      if (!options.quiet && payload.message) appendSystemMessage(payload.message);
      if (payload.learnedSuggestions?.length) {
        appendSystemMessage("Neu gelernt: " + payload.learnedSuggestions.map((entry) => entry.command).join(", "));
      }
    }

    function renderLearnedCommands(commands) {
      learnedCommandsEl.textContent = "";
      const visible = [...commands]
        .sort((left, right) => (right.count || 0) - (left.count || 0))
        .slice(0, 24);
      if (!visible.length) {
        const empty = document.createElement("span");
        empty.className = "empty";
        empty.textContent = "Noch keine Befehle gelernt.";
        learnedCommandsEl.append(empty);
        return;
      }
      for (const entry of visible) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = entry.command;
        button.title = (entry.aliases || []).slice(0, 5).join(", ");
        button.addEventListener("click", () => sendChatMessage(entry.command).catch((error) => appendMessage("error", error.message, "Fehler")));
        learnedCommandsEl.append(button);
      }
    }

    function startLearningPoll() {
      stopLearningPoll();
      learningPoll = window.setInterval(() => refreshLearning().catch((error) => appendMessage("error", error.message, "Fehler")), 3000);
    }

    function stopLearningPoll() {
      if (learningPoll) window.clearInterval(learningPoll);
      learningPoll = null;
    }

    if (!SpeechRecognition) {
      speechStatusEl.textContent = "Nicht verfuegbar";
      toggleVoiceBtn.disabled = true;
    } else {
      recognition = new SpeechRecognition();
      recognition.lang = "de-DE";
      recognition.continuous = false;
      recognition.interimResults = false;
      speechStatusEl.textContent = "Bereit";
      recognition.onstart = () => {
        listening = true;
        voiceTransitioning = false;
        speechStatusEl.textContent = "Hoert zu";
        toggleVoiceBtn.textContent = "Stop";
      };
      recognition.onend = () => {
        listening = false;
        voiceTransitioning = false;
        if (speechStatusEl.textContent !== "Session beendet") speechStatusEl.textContent = "Bereit";
        toggleVoiceBtn.textContent = "Sprache";
      };
      recognition.onerror = (event) => {
        voiceTransitioning = false;
        appendMessage("error", "Speech error: " + event.error, "Fehler");
      };
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        composerInputEl.value = transcript;
        sendChatMessage(transcript).catch((error) => appendMessage("error", error.message, "Fehler"));
      };
    }

    function toggleVoiceRecognition() {
      if (!recognition || voiceTransitioning) return;
      voiceTransitioning = true;
      try {
        if (listening) recognition.stop();
        else recognition.start();
      } catch (error) {
        voiceTransitioning = false;
        appendMessage("error", error.message || "Sprache konnte nicht umgeschaltet werden.", "Fehler");
      }
    }

    toggleVoiceBtn.addEventListener("click", () => toggleVoiceRecognition());
    composerFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      sendChatMessage(composerInputEl.value).catch((error) => appendMessage("error", error.message, "Fehler"));
    });
    connectLaunchBtn.addEventListener("click", () => connectOmnia("launch").catch((error) => appendMessage("error", error.message, "Fehler")));
    connectAttachBtn.addEventListener("click", () => connectOmnia("attach").catch((error) => appendMessage("error", error.message, "Fehler")));
    connectNoneBtn.addEventListener("click", () => connectOmnia("none").catch((error) => appendMessage("error", error.message, "Fehler")));
    disconnectOmniaBtn.addEventListener("click", () => disconnectOmnia().catch((error) => appendMessage("error", error.message, "Fehler")));
    startLearningBtn.addEventListener("click", () => startLearning().catch((error) => appendMessage("error", error.message, "Fehler")));
    stopLearningBtn.addEventListener("click", () => stopLearning().catch((error) => appendMessage("error", error.message, "Fehler")));
    runAutoExplorerBtn.addEventListener("click", () => runAutoExplorer().catch((error) => appendMessage("error", error.message, "Fehler")));
    refreshLearningBtn.addEventListener("click", () => {
      Promise.all([refreshLearning(), loadLearnedCommands()])
        .then(() => appendSystemMessage("Lernstatus aktualisiert."))
        .catch((error) => appendMessage("error", error.message, "Fehler"));
    });

    appendMessage("assistant", "Bereit. Schreib oder sprich deinen Auftrag.", "Omnia");
    refreshStatus().catch((error) => appendMessage("error", error.message, "Fehler"));
    loadLearnedCommands().catch((error) => appendMessage("error", error.message, "Fehler"));
  </script>
</body>
</html>`;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
