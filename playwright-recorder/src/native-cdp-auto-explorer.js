const DEFAULT_MAX_STEPS = 40;
const DEFAULT_SETTLE_MS = 450;
const DEFAULT_START_PATH = "/dashboard";

const SAFE_ROUTE_LABELS = new Map([
  ["/dashboard", "Dashboard"],
  ["/transactions", "Vorgänge"],
  ["/search", "Suche"],
  ["/cash-till", "Kasse"],
  ["/hilfsmittelverwaltung", "Hilfsmittelverwaltung"],
]);

const ICON_WORD_PATTERN = /\b(?:add|add_location|apps|assignment|chat|computer|dvr|edit|email|euro_symbol|group|home_work|info|list_alt|note_add|open_in_browser|pie_chart|receipt|search|settings|today|trending_up)\b/gi;

export function normalizeExploreTarget(raw) {
  if (!raw?.selector) return null;

  const role = String(raw.role || raw.tag || "").toLowerCase();
  const path = pathnameOf(raw.href || raw.path || "");
  const routeLabel = SAFE_ROUTE_LABELS.get(path);
  const text = cleanText(raw.appTitle) || cleanText(raw.text) || routeLabel || labelFromPath(path);

  if (role === "tab") {
    if (raw.selected === true || raw.selected === "true") return null;
    if (!text || text.length > 48) return null;
    return {
      kind: "tab",
      key: `tab:${text}`,
      label: `wechsel zu ${text}`,
      selector: raw.selector,
      path: "",
    };
  }

  if (["button", "menuitem"].includes(role) && raw.hasPopup === "menu" && isAppsMenu(raw)) {
    if (raw.expanded === true || raw.expanded === "true") return null;
    const currentPath = pathnameOf(raw.currentPath || "");
    return {
      kind: "menu",
      key: `menu:apps:${currentPath || "/"}`,
      label: "öffne App-Menü",
      selector: raw.selector,
      path: "",
    };
  }

  if (["button", "menuitem"].includes(role) && isAppLayerButton(raw)) {
    if (!text || text.length > 48) return null;
    return {
      kind: "app",
      key: `app:${text}`,
      label: `gehe zu ${text}`,
      selector: raw.selector,
      path: "",
    };
  }

  if (["a", "link", "menuitem"].includes(role) && path !== DEFAULT_START_PATH && isSafeRoutePath(path)) {
    const currentPath = pathnameOf(raw.currentPath || "");
    return {
      kind: isNestedRoutePath(currentPath, path) ? "subroute" : "route",
      key: `route:${path}`,
      label: `gehe zu ${routeLabel || text}`,
      selector: raw.selector,
      path,
    };
  }

  return null;
}

export function selectNextExploreTarget(targets, visitedKeys = new Set()) {
  return (targets || [])
    .filter(Boolean)
    .filter((target) => !visitedKeys.has(target.key))
    .sort((left, right) => priority(left) - priority(right) || left.label.localeCompare(right.label, "de"))
    [0] || null;
}

export function isSafeRoutePath(path) {
  const normalized = pathnameOf(path);
  if (!normalized || normalized === "/") return false;
  if (!normalized.startsWith("/")) return false;
  if (/\/(?:login|logout|sign-out|new|create|edit|delete|remove)(?:\/|$)/i.test(normalized)) return false;
  if (/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/|$)/i.test(normalized)) return false;
  return true;
}

export function summarizeAutoExploreResult(result) {
  return {
    clickedCount: result?.clicked?.length || 0,
    learnedCount: result?.learnedSuggestions?.length || 0,
    clicked: (result?.clicked || []).map((entry) => entry.label),
    learned: (result?.learnedSuggestions || []).map((entry) => entry.command),
  };
}

export async function runAutoExplorer(page, options = {}) {
  const maxSteps = positiveInt(options.maxSteps, DEFAULT_MAX_STEPS);
  const settleMs = positiveInt(options.settleMs, DEFAULT_SETTLE_MS);
  const restoreStartUrl = options.restoreStartUrl !== false;
  const originalUrl = page.url();
  const startPath = options.startPath === false ? "" : String(options.startPath || DEFAULT_START_PATH);
  if (startPath) {
    await navigateToRoute(page, startPath, settleMs);
  }
  const startUrl = page.url();
  const restoreUrl = restoreStartUrl ? originalUrl : "";
  const visited = new Set(options.visitedKeys || []);
  const clicked = [];
  const skipped = [];

  for (let step = 0; step < maxSteps; step += 1) {
    const targets = (await collectSafeExploreTargets(page))
      .map(normalizeExploreTarget)
      .filter(Boolean);
    const next = selectNextExploreTarget(targets, visited);
    if (!next) break;

    visited.add(next.key);
    try {
      await page.locator(next.selector).click({ timeout: 2500 });
      await settlePage(page, settleMs);
      clicked.push(next);
      if (next.kind === "app") {
        visited.delete(`menu:apps:${pathnameOf(page.url()) || "/"}`);
      }
    } catch (error) {
      skipped.push({ ...next, error: error.message });
    }
  }

  let finalUrl = page.url();
  if (restoreUrl && finalUrl !== restoreUrl) {
    await page.goto(restoreUrl, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
    await settlePage(page, settleMs);
    finalUrl = page.url();
  }

  return {
    startUrl,
    originalUrl,
    finalUrl,
    restored: restoreStartUrl,
    clicked,
    skipped,
    visitedKeys: [...visited],
  };
}

async function navigateToRoute(page, path, settleMs) {
  if (path === DEFAULT_START_PATH) return;

  const targetPath = path;
  if (pathnameOf(page.url()) === targetPath || pathnameOf(page.url()) === path) return;

  const selector = await page.evaluate((requestedPath) => {
    function visible(element) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
    }
    function pathOf(element) {
      try {
        return new URL(element.getAttribute("href") || element.href || "", location.origin).pathname;
      } catch {
        return "";
      }
    }

    const element = Array.from(document.querySelectorAll("a, [role='link']"))
      .find((candidate) => visible(candidate) && pathOf(candidate) === requestedPath);
    if (!element) return "";

    const marker = `start-route-${Date.now()}`;
    element.setAttribute("data-omnia-auto-explorer-start", marker);
    return `[data-omnia-auto-explorer-start="${marker}"]`;
  }, targetPath);

  if (selector) {
    await page.locator(selector).click({ timeout: 2500 });
    await settlePage(page, settleMs);
    return;
  }

  await page.goto(new URL(targetPath, "https://api2.optica-omnia.de").toString(), {
    waitUntil: "domcontentloaded",
    timeout: 10000,
  }).catch(() => {});
  await settlePage(page, settleMs);
}

export async function collectSafeExploreTargets(page) {
  return page.evaluate(({ routeEntries }) => {
    const routeLabels = new Map(routeEntries);
    const oldMarkers = document.querySelectorAll("[data-omnia-auto-explorer]");
    oldMarkers.forEach((element) => element.removeAttribute("data-omnia-auto-explorer"));

    function textOf(element) {
      return (
        appLayerTitle(element) ||
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.innerText ||
        element.textContent ||
        ""
      ).replace(/\s+/g, " ").trim();
    }

    function visible(element) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
    }

    function pathnameOfBrowser(href) {
      try {
        return new URL(href, location.origin).pathname;
      } catch {
        return "";
      }
    }

    let index = 0;
    function inAppLayerMenu(element) {
      return Boolean(element.closest(".app-layer-panel, .mat-mdc-menu-panel"));
    }

    function appLayerTitle(element) {
      return (element.querySelector?.(".app-layer-title")?.innerText || "").replace(/\s+/g, " ").trim();
    }

    return Array.from(document.querySelectorAll("[role='tab'], a, [role='link'], [role='menuitem'], button[aria-haspopup='menu'], button.apps-layer-btn"))
      .filter(visible)
      .map((element) => {
        const role = element.getAttribute("role") || element.tagName.toLowerCase();
        const href = element.getAttribute("href") || element.href || "";
        const path = pathnameOfBrowser(href);
        const marker = `target-${Date.now()}-${index++}`;
        element.setAttribute("data-omnia-auto-explorer", marker);
        return {
          selector: `[data-omnia-auto-explorer="${marker}"]`,
          role,
          tag: element.tagName.toLowerCase(),
          text: textOf(element) || routeLabels.get(path) || "",
          appTitle: appLayerTitle(element),
          selected: element.getAttribute("aria-selected") || false,
          href,
          path,
          classes: element.className?.toString?.() || "",
          hasPopup: element.getAttribute("aria-haspopup") || "",
          expanded: element.getAttribute("aria-expanded") || "",
          currentPath: location.pathname,
          inAppLayerMenu: inAppLayerMenu(element),
        };
      });
  }, { routeEntries: [...SAFE_ROUTE_LABELS] });
}

function priority(target) {
  if (target.kind === "menu") return isDashboardContext(menuContextPath(target)) ? 5 : 25;
  if (target.kind === "app") return 10;
  if (target.kind === "subroute") return 15;
  if (target.kind === "route") return 30;
  if (target.kind === "tab") return 30;
  return 40;
}

function cleanText(text) {
  return String(text || "")
    .replace(ICON_WORD_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pathnameOf(href) {
  if (!href) return "";
  try {
    return new URL(href, "https://api2.optica-omnia.de").pathname;
  } catch {
    return String(href).split(/[?#]/, 1)[0];
  }
}

function labelFromPath(path) {
  return pathnameOf(path)
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "";
}

function isAppsMenu(raw) {
  const text = String(raw.text || "").trim().toLowerCase();
  return text === "apps" || String(raw.classes || "").includes("apps-layer-button");
}

function isAppLayerButton(raw) {
  const classes = String(raw.classes || "");
  return classes.includes("apps-layer-btn") || raw.inAppLayerMenu === true;
}

function menuContextPath(target) {
  return String(target?.key || "").replace(/^menu:apps:/, "");
}

function isDashboardContext(path) {
  return !path || path === "/" || path === "/dashboard";
}

function isNestedRoutePath(currentPath, targetPath) {
  return Boolean(currentPath && targetPath && currentPath !== "/" && targetPath.startsWith(`${currentPath}/`));
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function settlePage(page, settleMs) {
  await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  await delay(settleMs);
}
