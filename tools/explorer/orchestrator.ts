import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  appendMarker,
  attachNetworkLogger,
  connectOrLaunchPage,
  parseCommonArgs,
  waitForSettledNetwork,
  type RecorderOptions,
} from "../network-recorder.ts";
import { createAutomatedClickThrottle, runThrottledAutomatedClick } from "../automated-clicks.ts";
import { redactUrl } from "../redact.ts";
import { collectExploreCandidates } from "./candidates.ts";
import {
  classifyReadOnlyRequest,
  isExploreTargetInScope,
  isLoginUrl,
  isSafeRoutePath,
  moduleScopePath,
  normalizeCandidate,
  pathnameOf,
  selectNextFrontierRouteTarget,
  selectNextTarget,
  shouldWaitForLogin,
  type ExploreTarget,
} from "./policies.ts";
import { writeExplorerReport } from "./report.ts";
import { createExplorerState, type ExplorerResult } from "./state.ts";
import { resolveTestCustomerDetailPath, type TestCustomerResolution } from "./test-customer-resolver.ts";
import { collectUiSnapshot } from "./ui-snapshot.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");

const DEFAULT_MAX_STEPS = 180;
const DEFAULT_MAX_MINUTES = 20;
const DEFAULT_SETTLE_MS = 900;

export type HandsOffOptions = RecorderOptions & {
  maxSteps: number;
  maxMinutes: number;
  settleMs: number;
  startPath?: string;
  reportFile: string;
  logFile: string;
  sessionId: string;
  allowReadLikePosts: boolean;
  waitForLogin: boolean;
  loginTimeoutMs: number;
  testCustomer?: string;
  testArticle?: string;
  genericSearchTerm?: string;
  strictTestObject?: boolean;
  resolveTestCustomer?: boolean;
  restoreStartUrl: boolean;
  rebuildCatalog: boolean;
  rebuildCoverageReport: boolean;
};

export async function runReadOnlyExplorer(page: any, options: HandsOffOptions & {
  setCurrentStep?: (step: string | null) => void;
}): Promise<ExplorerResult> {
  const originalUrl = page.url?.() || "";
  const state = createExplorerState({
    startUrl: originalUrl,
    logFile: options.logFile,
  });
  const deadline = Date.now() + options.maxMinutes * 60 * 1000;
  let stopReason = "completed";
  let stopRequested = false;
  let effectiveStartPath = options.startPath;
  let scopePath = effectiveStartPath ? moduleScopePath(effectiveStartPath) : "";
  const clickThrottle = createAutomatedClickThrottle();
  let resolvedTestCustomer: TestCustomerResolution | null = null;

  const routeHandler = async (route: any) => {
    const request = route.request();
    const classification = classifyReadOnlyRequest({
      method: request.method?.() || "GET",
      url: request.url?.() || "",
      postData: request.postData?.() || "",
      allowReadLikePosts: options.allowReadLikePosts,
    });

    if (classification.allowed) {
      await route.continue();
      return;
    }

    const blocked = {
      timestamp: new Date().toISOString(),
      method: request.method?.() || "",
      url: redactUrl(request.url?.() || ""),
      reason: classification.reason,
      resourceType: request.resourceType?.() || "",
    };
    state.recordBlockedRequest(blocked);
    appendMarker(options.logFile, {
      type: "explore-blocked-request",
      sessionId: options.sessionId,
      ...blocked,
    });

    await route.abort("blockedbyclient").catch(() => {});
    if (classification.reason !== "telemetry-post") {
      stopReason = "blocked-request";
      stopRequested = true;
    }
  };

  const routeOwner = page.context?.() || page;
  await routeOwner.route("**/*", routeHandler);

  try {
    if (shouldWaitForLogin(page.url?.() || originalUrl, options.waitForLogin)) {
      await waitUntilLoggedIn(page, options.loginTimeoutMs);
    }

    if (isLoginUrl(page.url?.() || originalUrl)) {
      stopReason = "login-page";
      return state.finish({ finalUrl: page.url?.() || "", stopReason });
    }

    if (options.resolveTestCustomer) {
      resolvedTestCustomer = await resolveTestCustomerDetailPath(page, {
        baseUrl: options.url,
        testCustomer: options.testCustomer,
        searchTerms: [options.genericSearchTerm || ""],
      });
      appendMarker(options.logFile, {
        type: "explore-marker",
        sessionId: options.sessionId,
        marker: "test-customer-resolver",
        status: resolvedTestCustomer.status,
        reason: resolvedTestCustomer.status === "blocked" ? resolvedTestCustomer.reason : "resolved",
        candidateCount: resolvedTestCustomer.candidateCount,
        matchCount: resolvedTestCustomer.matchCount,
        detailPath: resolvedTestCustomer.status === "resolved" ? "/master-data/customers/{uuid}" : undefined,
        timestamp: new Date().toISOString(),
      });

      if (resolvedTestCustomer.status !== "resolved") {
        stopReason = `test-customer-resolver-${resolvedTestCustomer.reason}`;
        return state.finish({ finalUrl: page.url?.() || "", stopReason });
      }

      effectiveStartPath = resolvedTestCustomer.detailPath;
      scopePath = moduleScopePath(effectiveStartPath);
    }

    if (effectiveStartPath) {
      if (!isAllowedStartPath(effectiveStartPath, resolvedTestCustomer)) {
        stopReason = "unsafe-start-path";
        return state.finish({ finalUrl: page.url?.() || "", stopReason });
      }
      await page.goto(new URL(effectiveStartPath, page.url()).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      }).catch(() => {});
      await waitForSettledNetwork(page, options.settleMs);
    }

    await recordUiSnapshot(page, state, options, "Start");
    appendMarker(options.logFile, {
      type: "explore-marker",
      sessionId: options.sessionId,
      marker: "explore-start",
      step: "Start",
      url: redactUrl(page.url?.() || ""),
      timestamp: new Date().toISOString(),
    });

    for (let stepIndex = 0; stepIndex < options.maxSteps; stepIndex += 1) {
      if (Date.now() > deadline) {
        stopReason = "time-limit";
        break;
      }
      if (stopRequested) break;

      const rawCandidates = await collectExploreCandidates(page);
      state.rememberSkipped(rawCandidates);
      const targets = rawCandidates.map(normalizeCandidate).filter(Boolean) as ExploreTarget[];
      const scopedTargets = targets.filter((target) => isExploreTargetInScope(target, scopePath));
      state.rememberDiscoveredTargets(scopedTargets);
      const preferredTestObjectTarget = selectPreferredTestObjectTarget(scopedTargets, state.visited, scopePath, options);
      const strictSearchTarget = selectStrictTestObjectSearchTarget(scopedTargets, state.visited, scopePath, page.url?.() || "", options);
      if (!preferredTestObjectTarget && !strictSearchTarget && shouldStopStrictTestObjectRun(state.visited, page.url?.() || "", options)) {
        stopReason = "strict-test-object-not-visible";
        break;
      }
      const selectableTargets = filterStrictTestObjectTargets(scopedTargets, options);
      const next = preferredTestObjectTarget
        || strictSearchTarget
        || selectNextTarget(selectableTargets, state.visited, scopePath)
        || selectNextFrontierRouteTarget(state.discoveredTargets, state.visited, scopePath);

      if (!next) {
        stopReason = "no-more-targets";
        break;
      }

      state.visited.add(next.key);
      const stepLabel = `${stepIndex + 1}. ${next.label}`;
      options.setCurrentStep?.(stepLabel);
      appendMarker(options.logFile, {
        type: "explore-marker",
        sessionId: options.sessionId,
        marker: "target-start",
        step: stepLabel,
        target: markerTarget(next),
        timestamp: new Date().toISOString(),
      });

      try {
        await runTargetAction(page, clickThrottle, next, options);
        await waitForSettledNetwork(page, options.settleMs);
        state.recordClicked({ ...next, urlAfter: page.url?.() || "" });
        await recordUiSnapshot(page, state, options, stepLabel);
        appendMarker(options.logFile, {
          type: "explore-marker",
          sessionId: options.sessionId,
          marker: "target-end",
          target: markerTarget(next),
          url: redactUrl(page.url?.() || ""),
          timestamp: new Date().toISOString(),
        });
        await dismissTransientOverlayAfterTarget(page, next, options.settleMs);
      } catch (error) {
        state.skipped.push({
          label: next.label,
          path: next.path,
          reason: `click-failed:${errorMessage(error)}`,
        });
      } finally {
        options.setCurrentStep?.(null);
      }
    }
  } finally {
    await routeOwner.unroute("**/*", routeHandler).catch(() => {});
  }

  return state.finish({ finalUrl: page.url?.() || "", stopReason });
}

async function runTargetAction(
  page: any,
  clickThrottle: ReturnType<typeof createAutomatedClickThrottle>,
  target: ExploreTarget,
  options: Pick<HandsOffOptions, "settleMs" | "startPath" | "testCustomer" | "testArticle" | "genericSearchTerm">,
): Promise<void> {
  await dismissBlockingOverlays(page, options.settleMs);
  try {
    await performTargetAction(page, clickThrottle, target, options);
  } catch (error) {
    if (isViewportClickError(error) && canUseDomClickFallback(target)) {
      // Material-Tabs koennen ausserhalb des sichtbaren Tab-Headers liegen; DOM-Klick bleibt auf sichere Tabs begrenzt.
      clickThrottle.lastClickAt = clickThrottle.now();
      await performDomClickFallback(page, clickThrottle, target);
      return;
    }

    if (!isOverlayInterceptionError(error)) throw error;

    // Der erste Playwright-Versuch war ein Klickversuch; der Retry respektiert die Klickpause.
    clickThrottle.lastClickAt = clickThrottle.now();
    await dismissBlockingOverlays(page, options.settleMs, { force: true });
    await performTargetAction(page, clickThrottle, target, options);
  }
}

async function performTargetAction(
  page: any,
  clickThrottle: ReturnType<typeof createAutomatedClickThrottle>,
  target: ExploreTarget,
  options: Pick<HandsOffOptions, "startPath" | "testCustomer" | "testArticle" | "genericSearchTerm">,
): Promise<void> {
  if (target.kind === "search") {
    await runThrottledAutomatedClick(page, clickThrottle, async () => {
      const locator = page.locator(target.selector);
      await locator.fill(searchValueForTarget(target, page.url?.() || "", options), { timeout: 3500 });
      await locator.press("Enter", { timeout: 3500 });
    });
    return;
  }

  if (target.selector) {
    await runThrottledAutomatedClick(page, clickThrottle, async () => {
      const locator = page.locator(target.selector);
      await locator.click({ timeout: 3500 });
      if (target.kind === "row") {
        await page.waitForTimeout?.(250);
        await locator.press?.("Enter", { timeout: 3500 }).catch(() => {});
      }
    });
    return;
  }

  await page.goto(new URL(target.path, page.url()).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 10000,
  });
}

async function performDomClickFallback(
  page: any,
  clickThrottle: ReturnType<typeof createAutomatedClickThrottle>,
  target: ExploreTarget,
): Promise<void> {
  if (!target.selector) throw new Error("dom-click-fallback-missing-selector");
  await runThrottledAutomatedClick(page, clickThrottle, async () => {
    const locator = page.locator(target.selector);
    await locator.evaluate((element: Element) => {
      const html = element as HTMLElement;
      html.scrollIntoView({ block: "center", inline: "center" });
      html.click();
    });
  });
}

async function dismissTransientOverlayAfterTarget(page: any, target: ExploreTarget, settleMs: number): Promise<void> {
  if (target.kind !== "detail" && target.kind !== "action-menu") return;
  await dismissBlockingOverlays(page, settleMs, { force: true });
}

async function dismissBlockingOverlays(
  page: any,
  settleMs: number,
  options: { force?: boolean } = {},
): Promise<boolean> {
  const waitMs = Math.min(Math.max(settleMs, 1), 250);
  if (!options.force && await visibleBlockingOverlayCount(page) === 0) return false;

  const pressEscape = page.keyboard?.press?.bind(page.keyboard);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await pressEscape?.("Escape").catch(() => {});
    await page.waitForTimeout?.(waitMs).catch(() => {});
    if (await visibleBlockingOverlayCount(page) === 0) return true;
  }

  if (await clickSafeOverlayDismissButton(page)) {
    await page.waitForTimeout?.(waitMs).catch(() => {});
    if (await visibleBlockingOverlayCount(page) === 0) return true;
  }

  if (await clickVisibleOverlayBackdrop(page)) {
    await page.waitForTimeout?.(waitMs).catch(() => {});
  }

  return true;
}

async function visibleBlockingOverlayCount(page: any): Promise<number> {
  try {
    return Number(await page.evaluate(() => {
      function visible(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
      }

      const selectors = [
        ".cdk-overlay-backdrop.cdk-overlay-backdrop-showing",
        ".cdk-overlay-pane .mat-mdc-dialog-surface",
        ".cdk-overlay-pane [role='dialog']",
        ".cdk-overlay-pane .mat-mdc-menu-panel",
        ".cdk-overlay-pane .mat-mdc-select-panel",
        ".cdk-overlay-pane .mat-mdc-autocomplete-panel",
      ];
      return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))).filter(visible).length;
    })) || 0;
  } catch {
    return 0;
  }
}

async function clickSafeOverlayDismissButton(page: any): Promise<boolean> {
  try {
    return Boolean(await page.evaluate(() => {
      function visible(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
      }

      function textOf(element: Element): string {
        return [
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          element.textContent,
        ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      }

      const overlay = document.querySelector(".cdk-overlay-container");
      if (!overlay) return false;
      const closeRe = /\b(close|schlie(?:ß|ss)en|abbrechen|cancel)\b|^x$/i;
      const unsafeRe = /\b(speichern|save|loeschen|löschen|delete|senden|send|anlegen|create|buchen|book|bestellen|order)\b/i;
      const candidates = Array.from(overlay.querySelectorAll("button,[role='button'],a[role='button']"));
      for (const candidate of candidates) {
        const button = candidate as HTMLButtonElement;
        if (!visible(button) || button.disabled) continue;
        const text = textOf(button);
        if (!closeRe.test(text) || unsafeRe.test(text)) continue;
        button.click();
        return true;
      }
      return false;
    }));
  } catch {
    return false;
  }
}

async function clickVisibleOverlayBackdrop(page: any): Promise<boolean> {
  try {
    return Boolean(await page.evaluate(() => {
      function visible(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
      }

      const backdrops = Array.from(document.querySelectorAll(".cdk-overlay-backdrop.cdk-overlay-backdrop-showing")).filter(visible);
      const backdrop = backdrops.at(-1) as HTMLElement | undefined;
      if (!backdrop) return false;
      backdrop.click();
      return true;
    }));
  } catch {
    return false;
  }
}

function isOverlayInterceptionError(error: unknown): boolean {
  return /intercepts pointer events|cdk-overlay|mat-mdc-dialog|mat-mdc-select|mat-mdc-menu/i.test(errorMessage(error));
}

function isViewportClickError(error: unknown): boolean {
  return /element is outside of the viewport/i.test(errorMessage(error));
}

function canUseDomClickFallback(target: ExploreTarget): boolean {
  return target.kind === "tab" && Boolean(target.selector);
}

function selectPreferredTestObjectTarget(
  targets: ExploreTarget[],
  visited: Set<string>,
  scopePath: string,
  options: Pick<HandsOffOptions, "testCustomer" | "testArticle" | "genericSearchTerm">,
): ExploreTarget | null {
  const needles = preferredObjectNeedles(options);
  if (needles.length === 0) return null;

  return targets
    .filter((target) => target.kind === "row")
    .filter((target) => !visited.has(target.key))
    .filter((target) => isExploreTargetInScope(target, scopePath))
    .map((target) => ({ target, score: preferredObjectScore(target.label, needles) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.target.label.localeCompare(right.target.label, "de"))[0]?.target || null;
}

function shouldStopStrictTestObjectRun(
  visited: Set<string>,
  url: string,
  options: Pick<HandsOffOptions, "strictTestObject" | "testCustomer" | "testArticle" | "genericSearchTerm">,
): boolean {
  if (!options.strictTestObject) return false;
  if (![...visited].some((key) => key.startsWith("search:"))) return false;
  if (!isStrictTestObjectSearchPath(url)) return false;
  return true;
}

function selectStrictTestObjectSearchTarget(
  targets: ExploreTarget[],
  visited: Set<string>,
  scopePath: string,
  url: string,
  options: Pick<HandsOffOptions, "strictTestObject">,
): ExploreTarget | null {
  if (!options.strictTestObject) return null;
  if (![...visited].some((key) => key.startsWith("search:"))) return null;
  if (!isStrictTestObjectSearchPath(url)) return null;
  return selectNextTarget(targets.filter((target) => target.kind === "search"), visited, scopePath);
}

function isStrictTestObjectSearchPath(url: string): boolean {
  const pathName = pathnameOf(url);
  return pathName === "/master-data/customers" || pathName === "/search";
}

function filterStrictTestObjectTargets(
  targets: ExploreTarget[],
  options: Pick<HandsOffOptions, "strictTestObject" | "testCustomer" | "testArticle" | "genericSearchTerm">,
): ExploreTarget[] {
  if (!options.strictTestObject) return targets;
  const needles = preferredObjectNeedles(options);
  if (needles.length === 0) return targets;
  return targets.filter((target) => target.kind !== "row" || preferredObjectScore(target.label, needles) > 0);
}

function preferredObjectNeedles(options: Pick<HandsOffOptions, "testCustomer" | "testArticle" | "genericSearchTerm">): string[] {
  return [options.testCustomer, options.testArticle]
    .map((value) => normalizeObjectText(value || ""))
    .filter((value) => value.length >= 3)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function preferredObjectScore(label: string, needles: string[]): number {
  const normalizedLabel = normalizeObjectText(label);
  let bestScore = 0;
  for (const needle of needles) {
    if (normalizedLabel.includes(needle)) {
      bestScore = Math.max(bestScore, 100 + needle.length);
      continue;
    }
    const tokens = needle.split(" ").filter((token) => token.length >= 3);
    if (tokens.length > 0 && tokens.every((token) => normalizedLabel.includes(token))) {
      bestScore = Math.max(bestScore, 50 + tokens.length);
    }
  }
  return bestScore;
}

function normalizeObjectText(value: string): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function parseHandsOffArgs(argv: string[]): HandsOffOptions {
  const common = parseCommonArgs(argv);
  const explicitCaptureBodies = argv.includes("--capture-bodies");
  const logFile = path.resolve(common.outputFile || createExploreLogPath());
  const options: HandsOffOptions = {
    ...common,
    captureBodies: explicitCaptureBodies ? true : false,
    maxSteps: intArg(argv, "--max-steps", DEFAULT_MAX_STEPS),
    maxMinutes: intArg(argv, "--max-minutes", DEFAULT_MAX_MINUTES),
    settleMs: intArg(argv, "--settle-ms", DEFAULT_SETTLE_MS),
    startPath: stringArg(argv, "--start-path"),
    reportFile: path.resolve(stringArg(argv, "--report") || path.join(workspaceRoot, "docs", "06_auto_explore_report.md")),
    logFile,
    outputFile: logFile,
    sessionId: "",
    allowReadLikePosts: !argv.includes("--strict-get-only"),
    waitForLogin: argv.includes("--wait-for-login"),
    loginTimeoutMs: intArg(argv, "--login-timeout-ms", 10 * 60 * 1000),
    testCustomer: stringArg(argv, "--test-customer") || "Mustermann",
    testArticle: stringArg(argv, "--test-article") || "Musterartikel",
    genericSearchTerm: stringArg(argv, "--search-term") || "",
    strictTestObject: argv.includes("--strict-test-object") || argv.includes("--strict-test-customer"),
    resolveTestCustomer: argv.includes("--resolve-test-customer"),
    restoreStartUrl: argv.includes("--restore-start"),
    rebuildCatalog: !argv.includes("--no-catalog"),
    rebuildCoverageReport: !argv.includes("--no-coverage"),
  };

  return options;
}

export async function runHandsOffCli(argv: string[]): Promise<void> {
  const options = parseHandsOffArgs(argv);
  let currentStep: string | null = null;
  let connection: Awaited<ReturnType<typeof connectOrLaunchPage>> | null = null;
  let recorder: ReturnType<typeof attachNetworkLogger> | null = null;

  try {
    connection = await connectOrLaunchPage(options);
    recorder = attachNetworkLogger(connection.page, {
      ...options,
      getCurrentStep: () => currentStep,
    });

    console.log("=".repeat(72));
    console.log("Hands-off Read-only Explorer aktiv.");
    console.log("Write-Guard: PUT/PATCH/DELETE blockiert, POST nur read-like/Auth erlaubt.");
    console.log("Bodies: deaktiviert, ausser --capture-bodies wird explizit gesetzt.");
    if (options.waitForLogin && isLoginUrl(connection.page.url?.() || "")) {
      console.log("Login-Wartepunkt aktiv: bitte im sichtbaren Browser anmelden.");
    }
    console.log(`JSONL: ${recorder.logFile}`);
    console.log(`Report: ${options.reportFile}`);
    console.log("=".repeat(72));

    const result = await runReadOnlyExplorer(connection.page, {
      ...options,
      sessionId: recorder.sessionId,
      logFile: recorder.logFile,
      setCurrentStep: (step) => {
        currentStep = step;
      },
    });

    if (options.restoreStartUrl && result.startUrl && result.startUrl !== connection.page.url()) {
      await connection.page.goto(result.startUrl, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      await waitForSettledNetwork(connection.page, options.settleMs);
    }

    writeExplorerReport(options.reportFile, result, workspaceRoot);
    if (options.rebuildCatalog) rebuildApiCatalog();
    if (options.rebuildCoverageReport) rebuildCoverageReport();

    console.log(`Stop-Grund: ${result.stopReason}`);
    console.log(`Geklickte Ziele: ${result.clicked.length}`);
    console.log(`Blockierte Requests: ${result.blockedRequests.length}`);
  } finally {
    recorder?.stop();
    await connection?.close();
  }
}

export function createExploreLogPath(date = new Date()): string {
  const dir = path.join(workspaceRoot, "logs", "network");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${formatLocalTimestamp(date)}-explore.jsonl`);
}

function isAllowedStartPath(pathName: string, resolvedTestCustomer: TestCustomerResolution | null): boolean {
  if (isSafeRoutePath(pathName)) return true;
  return resolvedTestCustomer?.status === "resolved" && pathName === resolvedTestCustomer.detailPath;
}

function markerTarget(target: ExploreTarget): Record<string, string> {
  return {
    kind: target.kind,
    key: target.key,
    label: target.label,
    path: target.path,
  };
}

function searchValueForTarget(
  target: ExploreTarget,
  url: string,
  options: Pick<HandsOffOptions, "startPath" | "testCustomer" | "testArticle" | "genericSearchTerm">,
): string {
  const customer = options.testCustomer || "Mustermann";
  const article = options.testArticle || "Musterartikel";
  const generic = options.genericSearchTerm || customer;
  const customerSearch = options.genericSearchTerm || customer;
  const haystack = [
    target.label,
    target.key,
    target.path,
    options.startPath,
    pathnameOf(url),
  ].join(" ").toLowerCase();
  const routeContext = [options.startPath, pathnameOf(url)].join(" ").toLowerCase();

  if (/(customer|kunde|kunden|master-data|transaction|vorgang|sales|route|tour|cash|kasse|bon|beleg|accounting)/i.test(routeContext)) {
    return customerSearch;
  }
  if (/(article|artikel|merchandise|waren|lager|bestand)/i.test(routeContext)) return article;
  if (/(customer|kunde|kunden|master-data|transaction|vorgang|sales|route|tour|cash|kasse|bon|beleg|accounting)/i.test(haystack)) {
    return customerSearch;
  }
  if (/(article|artikel|merchandise|waren|lager|bestand)/i.test(haystack)) return article;
  return generic;
}

async function recordUiSnapshot(
  page: any,
  state: ReturnType<typeof createExplorerState>,
  options: Pick<HandsOffOptions, "logFile" | "sessionId">,
  step: string,
): Promise<void> {
  try {
    const snapshot = await collectUiSnapshot(page, { step });
    state.recordUiSnapshot(snapshot);
    appendMarker(options.logFile, {
      type: "ui-snapshot",
      sessionId: options.sessionId,
      ...snapshot,
    });
  } catch (error) {
    appendMarker(options.logFile, {
      type: "explore-marker",
      sessionId: options.sessionId,
      marker: "ui-snapshot-error",
      step,
      timestamp: new Date().toISOString(),
      message: errorMessage(error),
    });
  }
}

async function waitUntilLoggedIn(page: any, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isLoginUrl(page.url?.() || "")) return;
    await page.waitForTimeout?.(1000).catch(() => {});
  }
}

function rebuildApiCatalog(): void {
  execFileSync(process.execPath, [path.join(workspaceRoot, "tools", "build-api-catalog.ts")], {
    cwd: workspaceRoot,
    stdio: "inherit",
  });
}

function rebuildCoverageReport(): void {
  execFileSync(process.execPath, [path.join(workspaceRoot, "tools", "coverage-report.ts")], {
    cwd: workspaceRoot,
    stdio: "inherit",
  });
}

function intArg(argv: string[], name: string, fallback: number): number {
  const value = stringArg(argv, name);
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function stringArg(argv: string[], name: string): string {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : "";
}

function formatLocalTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${min}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
