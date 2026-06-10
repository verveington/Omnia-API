import { redactText } from "../redact.ts";

const DANGEROUS_LABEL_RE =
  /\b(speichern|save|loeschen|löschen|delete|remove|entfernen|buchen|book|booking|senden|send|submit|anlegen|create|neu|neuer|neue|neues|neuen|new|bearbeiten|edit|hinzufuegen|hinzufügen|add|uebernehmen|übernehmen|apply|stornieren|storno|cancel|abschliessen|abschließen|finish|complete|bestellen|order|drucken|print|mail|e-mail|email|export|import|bezahlen|zahlung|kassieren|abrechnen|freigeben|genehmigen|approve|assign|zuordnen|upload|persist)\b/i;

const DANGEROUS_PATH_RE =
  /\/(?:login|logout|sign-out|new|create|edit|delete|remove|save|submit|send|order|booking|book|storno|cancel|checkout|assign|approve|upload|import|export|persist)(?:\/|$)/i;

const DETAIL_ROUTE_RE =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/|$)/i;

const READ_LIKE_POST_PATH_RE =
  /(?:^|\/)(search|simple-search|list|lookup|filter|query|count|counts|autocomplete|suggest|preview|validate|calculate|kpi|available|options|metadata|config|feature-toggles|user-details|preferences|countries|departments|material-groups)(?:\/|$|-)/i;

const TELEMETRY_POST_PATH_RE =
  /(?:^|\/)(metrics|telemetry|analytics|workspaces\/log)(?:\/|$)/i;

const AUTH_TOKEN_POST_PATH_RE =
  /\/protocol\/openid-connect\/token$/i;

const MUTATION_POST_PATH_RE =
  /(?:^|\/)(create|update|delete|remove|save|submit|send|assign|unassign|storno|cancel|book|booking|order|orders|insert|upsert|persist|checkout|approve|approval|upload|import)(?:\/|$|-)/i;

const MUTATION_BODY_RE =
  /\bmutation\b|["'](?:operationName|action|command|intent|operation|type)["']\s*:\s*["'](?:create|update|delete|remove|save|submit|send|assign|unassign|storno|cancel|book|booking|order|insert|upsert|persist|checkout|approve)/i;

type BoolLike = boolean | string | undefined | null;

export type CandidateInput = {
  selector?: string;
  role?: string;
  tag?: string;
  text?: string;
  appTitle?: string;
  ariaLabel?: string;
  title?: string;
  href?: string;
  path?: string;
  selected?: BoolLike;
  expanded?: BoolLike;
  disabled?: BoolLike;
  hasPopup?: string;
  inputType?: string;
  name?: string;
  placeholder?: string;
  currentPath?: string;
  classes?: string;
  inAppLayerMenu?: boolean;
};

export type Classification = {
  allowed: boolean;
  reason: string;
};

export type ExploreTarget = {
  kind: "route" | "tab" | "menu" | "app" | "search" | "row" | "detail" | "action-menu";
  key: string;
  label: string;
  selector: string;
  path: string;
  reason: string;
};

export type FrontierRouteTarget = Pick<ExploreTarget, "kind" | "key" | "label" | "path" | "reason"> & {
  clicked?: boolean;
  seenCount?: number;
};

export type ReadOnlyRequestInput = {
  method: string;
  url: string;
  postData?: string | null;
  allowReadLikePosts?: boolean;
};

export function classifyCandidate(raw: CandidateInput): Classification {
  const selector = String(raw.selector || "");
  if (!selector) return { allowed: false, reason: "missing-selector" };

  const role = normalizedRole(raw);
  const label = candidateLabel(raw);
  const pathName = pathnameOf(raw.href || raw.path || "");
  const expanded = isTruthy(raw.expanded);
  const selected = isTruthy(raw.selected);
  const disabled = isTruthy(raw.disabled);

  if (disabled) return { allowed: false, reason: "disabled-target" };

  if (isDetailOpenButton(raw)) {
    return { allowed: true, reason: "safe-detail-open" };
  }

  if (label && DANGEROUS_LABEL_RE.test(label)) {
    return { allowed: false, reason: "dangerous-label" };
  }

  if (pathName && !isSafeRoutePath(pathName)) {
    return { allowed: false, reason: "dangerous-route" };
  }

  if (role === "tab") {
    if (selected) return { allowed: false, reason: "already-selected-tab" };
    if (!label || label.length > 80) return { allowed: false, reason: "unsafe-tab-label" };
    return { allowed: true, reason: "safe-tab" };
  }

  if (isSearchInput(raw)) {
    return { allowed: true, reason: "safe-search-input" };
  }

  if (isUnsafeTextInput(raw)) {
    return { allowed: false, reason: "unsafe-search-input" };
  }

  if (isTableRow(raw)) {
    if (!label || label.length > 300) return { allowed: false, reason: "unsafe-row-label" };
    return { allowed: true, reason: "safe-table-row" };
  }

  if (isAppsMenu(raw)) {
    if (expanded) return { allowed: false, reason: "already-open-menu" };
    return { allowed: true, reason: "safe-menu" };
  }

  if (isActionMenu(raw)) {
    if (expanded) return { allowed: false, reason: "already-open-menu" };
    return { allowed: true, reason: "safe-action-menu" };
  }

  if (isAppLayerButton(raw)) {
    if (!label || label.length > 80) return { allowed: false, reason: "unsafe-app-label" };
    return { allowed: true, reason: "safe-app-button" };
  }

  if (["a", "link", "menuitem"].includes(role) && pathName) {
    return { allowed: true, reason: "safe-navigation" };
  }

  return { allowed: false, reason: "unsupported-target" };
}

export function normalizeCandidate(raw: CandidateInput): ExploreTarget | null {
  const classification = classifyCandidate(raw);
  if (!classification.allowed || !raw.selector) return null;

  const role = normalizedRole(raw);
  const pathName = pathnameOf(raw.href || raw.path || "");
  const currentPath = pathnameOf(raw.currentPath || "");
  const label = safeLabel(isDetailOpenButton(raw) ? detailOpenLabel(raw) : candidateLabel(raw) || labelFromPath(pathName) || role);

  if (role === "tab") {
    return {
      kind: "tab",
      key: `tab:${currentPath || "/"}:${label}`,
      label,
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  if (isSearchInput(raw)) {
    return {
      kind: "search",
      key: `search:${currentPath || "/"}:${label}`,
      label,
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  if (isDetailOpenButton(raw)) {
    return {
      kind: "detail",
      key: `detail:${currentPath || "/"}:${label}`,
      label,
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  if (isTableRow(raw)) {
    return {
      kind: "row",
      key: `row:${currentPath || "/"}:${label}`,
      label,
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  if (isAppsMenu(raw)) {
    return {
      kind: "menu",
      key: `menu:${currentPath || "/"}`,
      label: "App-Menue",
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  if (isActionMenu(raw)) {
    const actionLabel = actionMenuLabel(raw);
    return {
      kind: "action-menu",
      key: `action-menu:${currentPath || "/"}:${actionLabel}`,
      label: actionLabel,
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  if (isAppLayerButton(raw)) {
    return {
      kind: "app",
      key: `app:${label}`,
      label,
      selector: raw.selector,
      path: "",
      reason: classification.reason,
    };
  }

  return {
    kind: "route",
    key: `route:${pathName}`,
    label,
    selector: raw.selector,
    path: pathName,
    reason: classification.reason,
  };
}

export function classifyReadOnlyRequest(input: ReadOnlyRequestInput): Classification {
  const method = String(input.method || "GET").toUpperCase();
  const url = parseUrl(input.url);
  const pathName = url.pathname;
  const postData = String(input.postData || "");
  const allowReadLikePosts = input.allowReadLikePosts !== false;

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { allowed: true, reason: "safe-method" };
  }

  if (method !== "POST") {
    return { allowed: false, reason: "mutation-method" };
  }

  if (AUTH_TOKEN_POST_PATH_RE.test(pathName)) {
    return { allowed: true, reason: "auth-token" };
  }

  if (TELEMETRY_POST_PATH_RE.test(pathName)) {
    return { allowed: false, reason: "telemetry-post" };
  }

  if (!allowReadLikePosts) {
    return { allowed: false, reason: "post-disallowed" };
  }

  if (MUTATION_BODY_RE.test(postData)) {
    return { allowed: false, reason: "post-mutation-like" };
  }

  if (READ_LIKE_POST_PATH_RE.test(pathName)) {
    return { allowed: true, reason: "read-like-post" };
  }

  if (MUTATION_POST_PATH_RE.test(pathName)) {
    return { allowed: false, reason: "post-mutation-like" };
  }

  return { allowed: false, reason: "post-not-read-like" };
}

export function shouldWaitForLogin(url: string, enabled: boolean): boolean {
  return enabled && isLoginUrl(url);
}

export function selectNextTarget(targets: ExploreTarget[], visited: Set<string>, scopePath = ""): ExploreTarget | null {
  const rowVisited = [...visited].some((key) => key.startsWith("row:"));
  return targets
    .filter((target) => !visited.has(target.key))
    .filter((target) => isExploreTargetInScope(target, scopePath))
    .sort((left, right) => targetPriority(left, rowVisited) - targetPriority(right, rowVisited) || left.label.localeCompare(right.label, "de"))[0] || null;
}

export function selectNextFrontierRouteTarget(
  targets: FrontierRouteTarget[],
  visited: Set<string>,
  scopePath = "",
): ExploreTarget | null {
  const next = targets
    .filter((target) => target.kind === "route")
    .filter((target) => !target.clicked && !visited.has(target.key))
    .filter((target) => isSafeRoutePath(target.path))
    .filter((target) => isRoutePathInScope(target.path, scopePath))
    .sort((left, right) =>
      targetPriority(frontierToExploreTarget(left)) - targetPriority(frontierToExploreTarget(right))
      || (right.seenCount || 0) - (left.seenCount || 0)
      || left.label.localeCompare(right.label, "de")
      || left.path.localeCompare(right.path)
    )[0];

  return next ? frontierToExploreTarget(next) : null;
}

export function moduleScopePath(startPath: string): string {
  const parts = pathnameOf(startPath).split("/").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts[0] === "merchandise-management" && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return `/${parts[0]}`;
}

export function isSafeRoutePath(value: string): boolean {
  const pathName = pathnameOf(value);
  if (!pathName || pathName === "/" || !pathName.startsWith("/")) return false;
  if (DANGEROUS_PATH_RE.test(pathName)) return false;
  if (DETAIL_ROUTE_RE.test(pathName)) return false;
  return true;
}

export function candidateLabel(raw: CandidateInput): string {
  return cleanText(raw.appTitle || raw.text || raw.ariaLabel || raw.title || raw.placeholder || raw.name || "");
}

export function safeLabel(value: string): string {
  return redactText(cleanText(value)).slice(0, 120);
}

export function normalizedRole(raw: CandidateInput): string {
  return String(raw.role || raw.tag || "").toLowerCase();
}

export function pathnameOf(value: string): string {
  if (!value) return "";
  try {
    return new URL(value, "https://api2.optica-omnia.de").pathname;
  } catch {
    return String(value).split(/[?#]/, 1)[0];
  }
}

export function labelFromPath(pathName: string): string {
  return pathnameOf(pathName)
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "";
}

export function isLoginUrl(value: string): boolean {
  return /\/login(?:\/|$)/i.test(parseUrl(value).pathname);
}

function targetPriority(target: ExploreTarget, rowVisited = false): number {
  if (target.kind === "menu") return isDashboardPath(target.key.replace(/^menu:/, "")) ? 5 : 45;
  if (target.kind === "app") return 10;
  if (target.kind === "route") return target.path.includes("/") && target.path.split("/").length > 3 ? 20 : 30;
  if (target.kind === "search") return 25;
  if (target.kind === "detail") return rowVisited ? 32 : 36;
  if (target.kind === "action-menu") return rowVisited ? 33 : 36;
  if (target.kind === "row") return 35;
  if (target.kind === "tab") return 40;
  return 50;
}

function frontierToExploreTarget(target: FrontierRouteTarget): ExploreTarget {
  return {
    kind: "route",
    key: target.key,
    label: target.label,
    selector: "",
    path: target.path,
    reason: target.reason,
  };
}

export function isExploreTargetInScope(target: ExploreTarget, scopePath: string): boolean {
  if (!scopePath) return true;
  if (target.kind === "route") return isRoutePathInScope(target.path, scopePath);
  if (target.kind === "menu" || target.kind === "tab") return true;
  if (target.kind === "search" || target.kind === "row" || target.kind === "detail" || target.kind === "action-menu") return true;
  return false;
}

function isRoutePathInScope(pathName: string, scopePath: string): boolean {
  if (!scopePath) return true;
  const normalizedPath = pathnameOf(pathName);
  const normalizedScope = pathnameOf(scopePath);
  return normalizedPath === normalizedScope || normalizedPath.startsWith(`${normalizedScope}/`);
}

function isAppsMenu(raw: CandidateInput): boolean {
  const role = normalizedRole(raw);
  if (!["button", "menuitem"].includes(role)) return false;
  if (String(raw.hasPopup || "").toLowerCase() !== "menu") return false;
  const label = String(raw.appTitle || raw.text || raw.ariaLabel || raw.title || "").replace(/\s+/g, " ").trim().toLowerCase();
  const classes = String(raw.classes || "").toLowerCase();
  return label === "apps" || label.includes("app-menue") || label.includes("app-menu") || classes.includes("apps-layer");
}

function isActionMenu(raw: CandidateInput): boolean {
  const role = normalizedRole(raw);
  if (!["button", "menuitem"].includes(role)) return false;
  const label = rawText(raw).toLowerCase();
  if (!label) return false;
  if (/\bmore_vert\b/i.test(label)) return true;
  if (String(raw.hasPopup || "").toLowerCase() !== "menu") return false;
  return /\b(mehr|aktionen|actions|weitere)\b/i.test(label);
}

function actionMenuLabel(_raw: CandidateInput): string {
  return "Aktionen";
}

function isAppLayerButton(raw: CandidateInput): boolean {
  const role = normalizedRole(raw);
  const classes = String(raw.classes || "");
  return ["button", "menuitem"].includes(role) && (raw.inAppLayerMenu === true || classes.includes("apps-layer-btn"));
}

function isDetailOpenButton(raw: CandidateInput): boolean {
  const role = normalizedRole(raw);
  if (!["button", "menuitem"].includes(role)) return false;
  if (raw.href || raw.path) return false;
  if (String(raw.hasPopup || "").toLowerCase() === "menu") return false;
  const label = rawText(raw).toLowerCase();
  const classes = String(raw.classes || "").toLowerCase();
  return /\b(edit|bearbeiten|details?|mehr details|open_in_browser)\b/i.test(label) || classes.includes("edit");
}

function detailOpenLabel(raw: CandidateInput): string {
  const label = rawText(raw);
  if (/details?|mehr details/i.test(label)) return label;
  return "Detail oeffnen";
}

function isSearchInput(raw: CandidateInput): boolean {
  if (isUnsafeTextInput(raw)) return false;
  const role = normalizedRole(raw);
  if (!["input", "textarea", "searchbox"].includes(role)) return false;
  const haystack = [
    raw.text,
    raw.ariaLabel,
    raw.title,
    raw.placeholder,
    raw.name,
  ].filter(Boolean).join(" ");
  return /\b(suche|search|kunden|kunde|artikel|article|vorgang|auftrag|route|tour|kasse|bon|beleg)\b/i.test(haystack);
}

function isUnsafeTextInput(raw: CandidateInput): boolean {
  const role = normalizedRole(raw);
  if (!["input", "textarea", "searchbox"].includes(role)) return false;
  const inputType = String(raw.inputType || "").toLowerCase();
  return Boolean(inputType && !["text", "search"].includes(inputType));
}

function isTableRow(raw: CandidateInput): boolean {
  const role = normalizedRole(raw);
  const tag = String(raw.tag || "").toLowerCase();
  const classes = String(raw.classes || "").toLowerCase();
  if (role !== "row" && tag !== "tr" && !classes.includes("ag-row") && !classes.includes("mat-mdc-row")) return false;
  const label = candidateLabel(raw);
  if (/columnheader|header/i.test(classes)) return false;
  return label.length > 0;
}

function cleanText(value: string): string {
  return String(value || "")
    .replace(/\b(?:add|add_location|apps|assignment|chat|computer|dvr|edit|email|euro_symbol|group|home_work|info|list_alt|note_add|open_in_browser|pie_chart|receipt|search|settings|today|trending_up)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}

function isTruthy(value: BoolLike): boolean {
  return value === true || value === "true";
}

function rawText(raw: CandidateInput): string {
  return String(raw.appTitle || raw.text || raw.ariaLabel || raw.title || raw.placeholder || raw.name || "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDashboardPath(value: string): boolean {
  return !value || value === "/" || value === "/dashboard";
}
