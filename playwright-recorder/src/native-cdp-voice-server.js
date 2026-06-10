import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";

import { chromium } from "playwright";

import {
  snapshotActionRecording,
  startActionRecording,
  stopActionRecording,
} from "./native-cdp-action-recorder.js";
import {
  snapshotApiRecording,
  startApiRecording,
  stopApiRecording,
} from "./native-cdp-api-recorder.js";
import { buildCommandCatalog, resolveNaturalCommand } from "./native-cdp-command-catalog.js";
import {
  createFallbackConversationDecision,
  createConversationConfig,
  isRiskyConversationCommand,
  requestConversationDecision,
  resolveDirectConversationDecision,
  resolveConversationCommand,
} from "./native-cdp-conversation.js";
import { executeNativeCommand, parseNativeCommand } from "./native-cdp-commands.js";
import { runAutoExplorer, summarizeAutoExploreResult } from "./native-cdp-auto-explorer.js";
import {
  createLearningSession,
  learnFromExplorerClicks as learnFromExplorerClickSnapshot,
  learnFromRecordingSnapshot,
} from "./native-cdp-learning-session.js";
import {
  createDisconnectedPageSummary,
  createOmniaConnectionState,
  disconnectedActionResult,
  normalizeOmniaMode,
  serializeOmniaStatus,
} from "./native-cdp-omnia-connection.js";
import {
  buildCleanupScript,
  buildLaunchScript,
  buildPortProxySetupScript,
  createNativeCdpConfig,
  loadEnvFile,
  parseVmIp,
  scoreOmniaPageSnapshot,
  selectPageTarget,
} from "./native-cdp-utils.js";
import {
  createVoicePanelHtml,
  createVoiceServerConfig,
  parseJsonBody,
} from "./native-cdp-voice-ui.js";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, "..");

loadEnvFile(path.join(projectRoot, ".env.local"));

let server;
let shuttingDown = false;
let learningSession = createLearningSession();
let catalogPath;
let conversationConfig;
let conversationHistory = [];
let omniaConnection = createOmniaConnectionState();
let connectionAttemptId = 0;
let lifecycleQueue = Promise.resolve();
let currentLifecycleOperation = null;

class ConnectionAttemptCancelledError extends Error {
  constructor(browserToClose = null) {
    super("Omnia connection attempt was cancelled.");
    this.name = "ConnectionAttemptCancelledError";
    this.browserToClose = browserToClose;
  }
}

try {
  const voiceConfig = createVoiceServerConfig();
  conversationConfig = createConversationConfig();
  const nativeConfig = createNativeCdpConfig();
  const autoconnectMode = normalizeOmniaMode(process.env.OMNIA_NATIVE_AUTOCONNECT);
  catalogPath = process.env.OMNIA_COMMAND_CATALOG_PATH || path.join(projectRoot, "captures", "native-command-catalog.json");
  learningSession = createLearningSession({ catalog: await loadCommandCatalog(catalogPath) });
  await saveCommandCatalog(catalogPath, learningSession.catalog);

  console.log(`VM: ${nativeConfig.vmName} (${nativeConfig.vmIp || "IP bei Verbindung"})`);
  console.log(`CDP: Windows 127.0.0.1:${nativeConfig.guestDebugPort} -> Mac ${nativeConfig.hostEndpoint}`);
  console.log(`KI: ${conversationConfig.model} @ ${conversationConfig.endpoint}`);

  server = http.createServer((req, res) => {
    handleRequest(req, res, nativeConfig, () => shutdown(nativeConfig)).catch((error) => {
      sendJson(res, 500, { ok: false, message: error.message });
    });
  });

  await listen(server, voiceConfig);
  console.log(`Voice panel: http://${voiceConfig.host}:${voiceConfig.port}`);
  console.log("Use the web panel for microphone input or typed commands. Press Ctrl+C to stop.");

  if (autoconnectMode !== "none") {
    connectOmnia(nativeConfig, autoconnectMode).catch((error) => {
      console.error(`Omnia auto-connect failed: ${error.message}`);
    });
  }

  process.once("SIGINT", () => shutdown(nativeConfig));
  process.once("SIGTERM", () => shutdown(nativeConfig));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  await shutdown(createNativeCdpConfig(), { skipNativeCleanup: true }).catch(() => {});
}

async function handleRequest(req, res, nativeConfig, shutdownFn) {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/") {
    sendHtml(res, createVoicePanelHtml());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    sendJson(res, 200, await summarizeServerStatus());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/omnia/connect") {
    const payload = parseJsonBody(await readBody(req));
    const status = await connectOmnia(nativeConfig, payload.mode);
    sendJson(res, 200, status);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/omnia/disconnect") {
    await disconnectOmnia(nativeConfig);
    sendJson(res, 200, await summarizeServerStatus());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/recording/status") {
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload());
      return;
    }
    sendJson(res, 200, { ok: true, ...(await snapshotRecorders(activePage)) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/recording/start") {
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload({ catalog: learningSession.catalog }));
      return;
    }
    sendJson(res, 200, { ok: true, ...(await startRecorders(activePage)) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/recording/stop") {
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload({ catalog: learningSession.catalog }));
      return;
    }
    const stopped = await stopRecorders(activePage);
    const learned = await learnFromSnapshot(stopped);
    sendJson(res, 200, { ok: true, ...stopped, learnedSuggestions: learned.learnedSuggestions, catalog: learningSession.catalog });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/learning/start") {
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload({ catalog: learningSession.catalog }));
      return;
    }
    const started = await startRecorders(activePage);
    learningSession = createLearningSession({ active: true, catalog: learningSession.catalog });
    sendJson(res, 200, {
      ok: true,
      ...started,
      learnedSuggestions: [],
      catalog: learningSession.catalog,
      message: "Lernmodus aktiv.",
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/learning/status") {
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload({ catalog: learningSession.catalog }));
      return;
    }
    const snapshot = await snapshotRecorders(activePage);
    if (!snapshot.active && !learningSession.active) {
      sendJson(res, 200, {
        ok: true,
        active: false,
        startedAt: null,
        eventCount: 0,
        apiEventCount: 0,
        learnedSuggestions: [],
        catalog: learningSession.catalog,
      });
      return;
    }
    const learned = await learnFromSnapshot(snapshot);
    sendJson(res, 200, {
      ok: true,
      active: snapshot.active,
      startedAt: snapshot.startedAt,
      eventCount: snapshot.eventCount,
      apiEventCount: snapshot.apiEventCount,
      learnedSuggestions: learned.learnedSuggestions,
      catalog: learningSession.catalog,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/learning/stop") {
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload({ catalog: learningSession.catalog }));
      return;
    }
    const stopped = await stopRecorders(activePage);
    const learned = await learnFromSnapshot(stopped);
    learningSession = createLearningSession({ active: false, catalog: learningSession.catalog });
    sendJson(res, 200, {
      ok: true,
      active: false,
      startedAt: stopped.startedAt,
      stoppedAt: stopped.stoppedAt,
      eventCount: stopped.eventCount,
      apiEventCount: stopped.apiEventCount,
      learnedSuggestions: learned.learnedSuggestions,
      catalog: learningSession.catalog,
      message: "Lernmodus gestoppt.",
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/learning/commands") {
    sendJson(res, 200, { ok: true, catalog: learningSession.catalog });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/explorer/run") {
    const payload = parseJsonBody(await readBody(req));
    let activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedUiPayload({ catalog: learningSession.catalog }));
      return;
    }
    let shouldStopRecorders = false;
    try {
      activePage = await connectToOmniaPage(omniaConnection.nativeConfig || nativeConfig, { preferDashboardShell: true });
      shouldStopRecorders = true;
      await startRecorders(activePage);
      learningSession = createLearningSession({ active: true, catalog: learningSession.catalog });
      const explorer = await runAutoExplorer(activePage, {
        maxSteps: payload.maxSteps,
        restoreStartUrl: payload.restoreStartUrl !== false,
      });
      const stopped = await stopRecorders(activePage);
      shouldStopRecorders = false;
      const explorerLearnedSuggestions = await applyExplorerLearning(explorer.clicked, stopped);
      learningSession = createLearningSession({ active: false, catalog: learningSession.catalog });
      const learnedSuggestions = mergeSuggestionLists([], explorerLearnedSuggestions);
      const report = {
        ...explorer,
        eventCount: stopped.eventCount,
        apiEventCount: stopped.apiEventCount,
        apiObservations: stopped.apiObservations,
        learnedSuggestions,
        catalog: learningSession.catalog,
      };
      sendJson(res, 200, {
        ok: true,
        active: false,
        message: `Auto-Explorer fertig: ${explorer.clicked.length} Klicks, ${learnedSuggestions.length} neue Befehle.`,
        summary: summarizeAutoExploreResult(report),
        ...report,
      });
      return;
    } finally {
      if (shouldStopRecorders) await stopRecorders(activePage).catch(() => {});
      if (learningSession.active) {
        learningSession = createLearningSession({ active: false, catalog: learningSession.catalog });
      }
    }
  }

  if (req.method === "POST" && url.pathname === "/api/command") {
    const payload = parseJsonBody(await readBody(req));
    const activePage = getConnectedPageOrNull();
    if (!activePage) {
      sendJson(res, 200, disconnectedActionResult(payload.text));
      return;
    }
    const result = await executeTextCommand(activePage, payload.text, shutdownFn);
    sendJson(res, result.ok ? 200 : 400, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/conversation") {
    const payload = parseJsonBody(await readBody(req));
    const activePage = getConnectedPageOrNull();
    const pageSummary = await summarizeConnectedPage();
    const result = await handleConversationTurn({
      text: payload.text,
      page: activePage,
      pageSummary,
      shutdownFn,
    });
    sendJson(res, result.ok ? 200 : 400, result);
    return;
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
}

async function resolveVmIp(config) {
  if (config.vmIp) return config;

  const { stdout } = await execFileAsync("prlctl", ["list", "-i", config.vmName], {
    maxBuffer: 1024 * 1024,
  });
  const vmIp = parseVmIp(stdout);
  if (!vmIp) {
    throw new Error(`Could not detect an IP address for Parallels VM "${config.vmName}".`);
  }

  return {
    ...config,
    vmIp,
    hostEndpoint: `http://${vmIp}:${config.hostDebugPort}`,
  };
}

async function execWindowsPowerShell(config, script, { currentUser = false } = {}) {
  const args = ["exec", config.vmName];
  if (currentUser) args.push("--current-user");
  args.push("powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script);

  return execFileAsync("prlctl", args, {
    maxBuffer: 1024 * 1024,
  });
}

async function connectOmnia(baseConfig, requestedMode) {
  const mode = normalizeOmniaMode(requestedMode);
  if (mode === "none") {
    await disconnectOmnia(baseConfig);
    return summarizeServerStatus();
  }

  const attemptId = ++connectionAttemptId;
  return enqueueLifecycleOperation(() => connectOmniaAttempt(baseConfig, mode, attemptId), `connect:${mode}`);
}

async function connectOmniaAttempt(baseConfig, mode, attemptId) {
  if (!isConnectionAttemptActive(attemptId)) return summarizeCancelledConnection();

  if (omniaConnection.connected || omniaConnection.browser) {
    await disconnectOmniaNow(baseConfig);
  }
  if (!isConnectionAttemptActive(attemptId)) return summarizeCancelledConnection();

  omniaConnection = createOmniaConnectionState({ mode, connecting: true });
  let resolvedConfig = null;
  let launchCleanupNeeded = false;

  try {
    resolvedConfig = await resolveVmIp(baseConfig);
    ensureConnectionAttemptActive(attemptId);
    omniaConnection.nativeConfig = resolvedConfig;

    if (mode === "launch") {
      await execWindowsPowerShell(resolvedConfig, buildCleanupScript(resolvedConfig));
      ensureConnectionAttemptActive(attemptId);
      await execWindowsPowerShell(resolvedConfig, buildPortProxySetupScript(resolvedConfig));
      launchCleanupNeeded = true;
      ensureConnectionAttemptActive(attemptId);
      await execWindowsPowerShell(resolvedConfig, buildLaunchScript(resolvedConfig), { currentUser: true });
      launchCleanupNeeded = true;
      ensureConnectionAttemptActive(attemptId);
    } else {
      await execWindowsPowerShell(resolvedConfig, buildPortProxySetupScript(resolvedConfig));
      ensureConnectionAttemptActive(attemptId);
    }

    const activePage = await connectToOmniaPage(resolvedConfig, {}, { attemptId });
    ensureConnectionAttemptActive(attemptId);
    omniaConnection = createOmniaConnectionState({
      mode,
      connected: true,
      connecting: false,
      browser: omniaConnection.browser,
      page: activePage,
      lastError: "",
    });
    omniaConnection.nativeConfig = resolvedConfig;
  } catch (error) {
    if (error instanceof ConnectionAttemptCancelledError) {
      if (error.browserToClose) await error.browserToClose.close().catch(() => {});
      await cleanupCancelledLaunchAttempt({ mode, config: resolvedConfig, cleanupNeeded: launchCleanupNeeded });
      return summarizeCancelledConnection();
    }

    const browserToClose = isConnectionAttemptActive(attemptId) ? omniaConnection.browser : null;
    if (browserToClose) await browserToClose.close().catch(() => {});
    if (!isConnectionAttemptActive(attemptId)) {
      await cleanupCancelledLaunchAttempt({ mode, config: resolvedConfig, cleanupNeeded: launchCleanupNeeded });
      return summarizeCancelledConnection();
    }
    await cleanupCancelledLaunchAttempt({ mode, config: resolvedConfig, cleanupNeeded: launchCleanupNeeded });
    omniaConnection = createOmniaConnectionState({
      mode,
      connected: false,
      connecting: false,
      lastError: error.message,
    });
    if (resolvedConfig) omniaConnection.nativeConfig = resolvedConfig;
  }

  return summarizeActiveConnectionAttempt(attemptId);
}

async function disconnectOmnia(baseConfig, { skipNativeCleanup = false, invalidateAttempts = true } = {}) {
  if (invalidateAttempts) connectionAttemptId += 1;
  return enqueueLifecycleOperation(() => disconnectOmniaNow(baseConfig, { skipNativeCleanup }), "disconnect");
}

async function disconnectOmniaNow(baseConfig, { skipNativeCleanup = false } = {}) {
  const previousConnection = omniaConnection;
  const activePage = getConnectedPageOrNull();
  if (activePage) await stopRecorders(activePage).catch(() => {});
  learningSession = createLearningSession({ active: false, catalog: learningSession.catalog });

  if (previousConnection.browser) {
    await previousConnection.browser.close().catch(() => {});
  }

  if (!skipNativeCleanup && previousConnection.mode === "launch") {
    const cleanupConfig = previousConnection.nativeConfig || (baseConfig?.vmIp ? baseConfig : null);
    if (cleanupConfig) {
      await execWindowsPowerShell(cleanupConfig, buildCleanupScript(cleanupConfig)).catch((error) => {
        console.warn(`Cleanup warning: ${error.message}`);
      });
    }
  }

  omniaConnection = createOmniaConnectionState();
}

function enqueueLifecycleOperation(operation, name = "lifecycle") {
  const operationToken = { name };
  const previous = lifecycleQueue.catch(() => {});
  const run = previous.then(async () => {
    currentLifecycleOperation = operationToken;
    try {
      return await operation();
    } finally {
      if (currentLifecycleOperation === operationToken) currentLifecycleOperation = null;
    }
  });
  lifecycleQueue = run.catch(() => {});
  return run;
}

function getConnectedPageOrNull() {
  const activePage = omniaConnection.page;
  const activeBrowser = omniaConnection.browser;
  if (!omniaConnection.connected) return null;
  if (!activePage) {
    markOmniaDisconnected("Omnia page is not available.");
    return null;
  }
  if (activePage.isClosed?.()) {
    markOmniaDisconnected("Omnia page is closed.");
    return null;
  }
  if (!activeBrowser || !activeBrowser.isConnected?.()) {
    markOmniaDisconnected("Omnia CDP browser is disconnected.", { clearBrowser: true });
    return null;
  }
  return activePage;
}

function isConnectionAttemptActive(attemptId) {
  return attemptId === connectionAttemptId && !shuttingDown;
}

function ensureConnectionAttemptActive(attemptId, browserToClose = null) {
  if (isConnectionAttemptActive(attemptId)) return;
  throw new ConnectionAttemptCancelledError(browserToClose);
}

function markOmniaDisconnected(lastError = "Omnia connection is no longer available.", { clearBrowser = false } = {}) {
  const nativeConfig = omniaConnection.nativeConfig;
  const disconnected = createOmniaConnectionState({
    ...omniaConnection,
    connected: false,
    connecting: false,
    page: null,
    browser: clearBrowser ? null : omniaConnection.browser,
    lastError,
  });
  omniaConnection = disconnected;
  if (nativeConfig) omniaConnection.nativeConfig = nativeConfig;
}

async function summarizeCancelledConnection() {
  const pageSummary = createDisconnectedPageSummary("Omnia-Verbindung wurde abgebrochen.");
  return serializeOmniaStatus(
    { ...createOmniaConnectionState(), pageSummary },
    {
      ...pageSummary,
      ai: summarizeAiStatus(),
      learning: {
        active: false,
        startedAt: null,
        eventCount: 0,
        apiEventCount: 0,
      },
      cancelled: true,
      message: "Omnia-Verbindung wurde abgebrochen.",
    },
  );
}

async function summarizeActiveConnectionAttempt(attemptId) {
  if (!isConnectionAttemptActive(attemptId)) return summarizeCancelledConnection();
  const status = await summarizeServerStatus();
  if (!isConnectionAttemptActive(attemptId)) return summarizeCancelledConnection();
  return status;
}

async function cleanupCancelledLaunchAttempt({ mode, config, cleanupNeeded }) {
  if (mode !== "launch" || !config || !cleanupNeeded) return;

  await execWindowsPowerShell(config, buildCleanupScript(config)).catch((error) => {
    console.warn(`Cleanup warning: ${error.message}`);
  });
}

async function summarizeServerStatus(extras = {}) {
  const pageSummary = await summarizeConnectedPage();
  return serializeOmniaStatus(
    { ...omniaConnection, pageSummary },
    {
      ...pageSummary,
      ai: summarizeAiStatus(),
      learning: await summarizeLearningStatus(),
      ...extras,
    },
  );
}

function summarizeAiStatus() {
  return {
    model: conversationConfig?.model || "",
    endpoint: conversationConfig?.endpoint || "",
  };
}

async function summarizeConnectedPage() {
  const activePage = getConnectedPageOrNull();
  if (!activePage) {
    if (omniaConnection.connected) markOmniaDisconnected("Omnia page is not available.");
    return createDisconnectedPageSummary();
  }

  try {
    const summary = await summarizePage(activePage);
    omniaConnection.pageSummary = summary;
    omniaConnection.href = summary.href;
    omniaConnection.title = summary.title;
    return { connected: true, ...summary };
  } catch (error) {
    omniaConnection.connected = false;
    omniaConnection.lastError = error.message;
    return createDisconnectedPageSummary();
  }
}

async function summarizeLearningStatus() {
  const activePage = getConnectedPageOrNull();
  if (!activePage) {
    return {
      active: false,
      startedAt: null,
      eventCount: 0,
      apiEventCount: 0,
    };
  }

  const snapshot = await snapshotRecorders(activePage).catch(() => null);
  return {
    active: Boolean(snapshot?.active),
    startedAt: snapshot?.startedAt || null,
    eventCount: snapshot?.eventCount || 0,
    apiEventCount: snapshot?.apiEventCount || 0,
  };
}

function disconnectedUiPayload(extras = {}) {
  return {
    ok: true,
    active: false,
    startedAt: null,
    eventCount: 0,
    apiEventCount: 0,
    requiresConnection: true,
    message: "Omnia ist nicht verbunden. Starte oder verbinde Omnia, bevor diese Funktion genutzt wird.",
    ...extras,
  };
}

async function startRecorders(activePage) {
  try {
    const actionRecording = await startActionRecording(activePage);
    const apiRecording = await startApiRecording(activePage);
    return combineRecordingSnapshots(actionRecording, apiRecording);
  } catch (error) {
    await stopRecorders(activePage).catch(() => {});
    throw error;
  }
}

async function snapshotRecorders(activePage) {
  const actionRecording = await snapshotActionRecording(activePage);
  const apiRecording = await snapshotApiRecording(activePage);
  return combineRecordingSnapshots(actionRecording, apiRecording);
}

async function stopRecorders(activePage) {
  const actionRecording = await stopActionRecording(activePage);
  const apiRecording = await stopApiRecording(activePage);
  return combineRecordingSnapshots(actionRecording, apiRecording);
}

function combineRecordingSnapshots(actionRecording = {}, apiRecording = {}) {
  const actionEvents = actionRecording.events || [];
  const apiEvents = apiRecording.events || [];

  return {
    ...actionRecording,
    active: Boolean(actionRecording.active || apiRecording.active),
    startedAt: actionRecording.startedAt || apiRecording.startedAt || null,
    stoppedAt: actionRecording.stoppedAt || apiRecording.stoppedAt,
    eventCount: Number.isInteger(actionRecording.eventCount) ? actionRecording.eventCount : actionEvents.length,
    events: actionEvents,
    apiEventCount: Number.isInteger(apiRecording.eventCount) ? apiRecording.eventCount : apiEvents.length,
    apiEvents,
    apiObservations: apiRecording.observations || [],
    apiRecording,
  };
}

async function connectToOmniaPage(config, options = {}, { attemptId = null } = {}) {
  await waitForDevToolsTarget(config);
  if (attemptId !== null) ensureConnectionAttemptActive(attemptId);

  if (!omniaConnection.browser || !omniaConnection.browser.isConnected()) {
    const connectedBrowser = await chromium.connectOverCDP(config.hostEndpoint, {
      timeout: config.connectTimeoutMs,
    });
    if (attemptId !== null && !isConnectionAttemptActive(attemptId)) {
      throw new ConnectionAttemptCancelledError(connectedBrowser);
    }
    omniaConnection.browser = connectedBrowser;
  }

  const activeBrowser = omniaConnection.browser;
  if (attemptId !== null) ensureConnectionAttemptActive(attemptId, activeBrowser);

  const candidates = activeBrowser
    .contexts()
    .flatMap((context) => context.pages())
    .filter((candidate) => !candidate.isClosed() && candidate.url().includes("api2.optica-omnia.de"));

  const readyPage = await bestScoredPage(candidates, options);
  if (readyPage) {
    if (attemptId !== null) ensureConnectionAttemptActive(attemptId, activeBrowser);
    omniaConnection.page = readyPage;
    return readyPage;
  }

  for (const candidate of candidates) {
    await waitForUsablePage(candidate);
    if (attemptId !== null) ensureConnectionAttemptActive(attemptId, activeBrowser);
  }

  const waitedPage = await bestScoredPage(candidates, options);
  if (waitedPage) {
    if (attemptId !== null) ensureConnectionAttemptActive(attemptId, activeBrowser);
    omniaConnection.page = waitedPage;
    return waitedPage;
  }

  throw new Error("Playwright connected, but no usable Omnia page target was exposed.");
}

async function waitForDevToolsTarget(config) {
  const deadline = Date.now() + config.connectTimeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${config.hostEndpoint}/json/list`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const target = selectPageTarget(await response.json());
      if (target) return target;
      lastError = new Error("DevTools is reachable, but no page target is available yet.");
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for Omnia DevTools target: ${lastError?.message || "unknown error"}`);
}

async function waitForUsablePage(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(
    () =>
      location.href.includes("/login") ||
      document.querySelectorAll("button, input, textarea, [contenteditable=true]").length > 0,
    null,
    { timeout: 15000 },
  ).catch(() => {});
}

async function bestScoredPage(candidates, options) {
  const scored = [];
  for (const candidate of candidates) {
    const snapshot = await snapshotOmniaPage(candidate).catch(() => null);
    const score = scoreOmniaPageSnapshot(snapshot, options);
    if (Number.isFinite(score)) scored.push({ page: candidate, score });
  }

  scored.sort((left, right) => right.score - left.score);
  return scored[0]?.page || null;
}

async function snapshotOmniaPage(page) {
  return page.evaluate(() => ({
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    buttonCount: document.querySelectorAll("button").length,
    linkCount: document.querySelectorAll("a, [role='link']").length,
    tabCount: document.querySelectorAll("[role='tab']").length,
    inputCount: document.querySelectorAll("input, textarea, [contenteditable=true]").length,
    bodyTextLength: (document.body?.innerText || "").replace(/\s+/g, " ").trim().length,
  }));
}

async function summarizePage(page) {
  return page.evaluate(() => ({
    ok: true,
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    buttonCount: document.querySelectorAll("button").length,
    linkCount: document.querySelectorAll("a, [role='link']").length,
    tabCount: document.querySelectorAll("[role='tab']").length,
    inputCount: document.querySelectorAll("input, textarea, [contenteditable=true]").length,
  }));
}

async function handleConversationTurn({ text, page, pageSummary, shutdownFn }) {
  const userText = String(text || "").trim();
  if (!userText) return { ok: true, message: "Keine Eingabe.", executed: false };

  let decision = resolveDirectConversationDecision(userText, learningSession.catalog);
  if (!decision) {
    try {
      decision = await requestConversationDecision({
        config: conversationConfig,
        text: userText,
        pageSummary,
        catalog: learningSession.catalog,
        history: conversationHistory,
      });
    } catch (error) {
      decision = createFallbackConversationDecision(userText, learningSession.catalog, error);
    }
  }

  if (decision.type !== "execute_command") {
    rememberConversation(userText, decision.say);
    return {
      ok: true,
      executed: false,
      decision,
      message: decision.say,
    };
  }

  const resolvedCommand = resolveConversationCommand(decision.command, learningSession.catalog);
  if (!resolvedCommand) {
    const message = "Ich habe keinen passenden Omnia-Befehl gefunden.";
    rememberConversation(userText, message);
    return { ok: true, executed: false, decision: { ...decision, command: "" }, message };
  }

  if (isRiskyConversationCommand(resolvedCommand)) {
    const message = `${decision.say} Stufe 1 führt Formular-, Speicher- und Abschlussaktionen noch nicht automatisch aus.`;
    rememberConversation(userText, message);
    return {
      ok: true,
      blocked: true,
      executed: false,
      needsConfirmation: true,
      decision: { ...decision, command: resolvedCommand },
      message,
    };
  }

  if (!page) {
    const disconnected = disconnectedActionResult(resolvedCommand);
    const message = [decision.say, disconnected.message].filter(Boolean).join(" ");
    rememberConversation(userText, message);
    return {
      ...disconnected,
      decision: { ...decision, command: resolvedCommand },
      message,
    };
  }

  const executed = await executeTextCommand(page, resolvedCommand, shutdownFn);
  const message = [decision.say, executed.message].filter(Boolean).join(" ");
  rememberConversation(userText, message);
  return {
    ...executed,
    executed: executed.ok,
    decision: { ...decision, command: resolvedCommand },
    message,
  };
}

async function executeTextCommand(page, text, shutdownFn) {
  let command = parseNativeCommand(text);
  const learnedMatch = command.type === "unknown" ? resolveNaturalCommand(text, learningSession.catalog) : null;
  if (learnedMatch) command = parseNativeCommand(learnedMatch.command);
  if (command.type === "quit") {
    setTimeout(() => shutdownFn(), 50);
    return { ok: true, closed: true, message: "Session wird beendet." };
  }

  const result = await executeNativeCommand(page, command);
  if (learnedMatch && result.ok) {
    result.message = `${learnedMatch.reason}. ${result.message}`;
  }
  return result;
}

function rememberConversation(userText, assistantText) {
  conversationHistory.push({ role: "user", text: userText });
  conversationHistory.push({ role: "assistant", text: assistantText });
  conversationHistory = conversationHistory.slice(-12);
}

async function learnFromSnapshot(snapshot) {
  const result = learnFromRecordingSnapshot(learningSession, snapshot);
  learningSession = result.session;
  if (result.learnedSuggestions.length) await saveCommandCatalog(catalogPath, learningSession.catalog);
  return result;
}

async function applyExplorerLearning(clicked, recordingSnapshot = {}) {
  const result = learnFromExplorerClickSnapshot(learningSession, clicked, {
    apiEvents: recordingSnapshot.apiEvents,
    apiEventCount: recordingSnapshot.apiEventCount,
    apiObservations: recordingSnapshot.apiObservations,
  });
  learningSession = result.session;
  if (result.catalogChanged) await saveCommandCatalog(catalogPath, learningSession.catalog);
  return result.learnedSuggestions;
}

function mergeSuggestionLists(left, right) {
  const seen = new Set();
  const merged = [];
  for (const suggestion of [...(left || []), ...(right || [])]) {
    if (!suggestion?.command || seen.has(suggestion.command)) continue;
    seen.add(suggestion.command);
    merged.push(suggestion);
  }
  return merged;
}

async function loadCommandCatalog(filePath) {
  try {
    return buildCommandCatalog(JSON.parse(await fs.readFile(filePath, "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") return buildCommandCatalog();
    throw error;
  }
}

async function saveCommandCatalog(filePath, catalog) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(catalog, null, 2)}\n`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("error", reject);
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function listen(targetServer, config) {
  return new Promise((resolve, reject) => {
    targetServer.once("error", reject);
    targetServer.listen(config.port, config.host, () => {
      targetServer.off("error", reject);
      resolve();
    });
  });
}

async function shutdown(config, { skipNativeCleanup = false } = {}) {
  if (shuttingDown) return;
  connectionAttemptId += 1;
  shuttingDown = true;

  if (server) {
    await new Promise((resolve) => server.close(resolve)).catch(() => {});
  }
  await disconnectOmnia(config, { skipNativeCleanup });

  process.exitCode = process.exitCode || 0;
}

function sendHtml(res, html) {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(html);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
