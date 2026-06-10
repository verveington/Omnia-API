import { redactUiLabel, redactUrl } from "../redact.ts";

export type UiSnapshot = {
  timestamp: string;
  step: string;
  url: string;
  path: string;
  title: string;
  headings: string[];
  actions: string[];
  formLabels: string[];
  tableHeaders: string[];
};

export type RawUiSnapshot = {
  step?: string;
  url?: string;
  title?: string;
  headings?: unknown[];
  actions?: unknown[];
  formLabels?: unknown[];
  tableHeaders?: unknown[];
};

const MAX_ITEMS = 16;
const MAX_TEXT_LENGTH = 120;

export async function collectUiSnapshot(page: any, input: { step?: string; timestamp?: Date } = {}): Promise<UiSnapshot> {
  const raw = await page.evaluate(() => {
    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
    }

    function textOf(element: Element): string {
      const value =
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.getAttribute("placeholder") ||
        (element as HTMLElement).innerText ||
        element.textContent ||
        "";
      return value.replace(/\s+/g, " ").trim();
    }

    function values(selector: string): string[] {
      return Array.from(document.querySelectorAll(selector))
        .filter(visible)
        .map(textOf)
        .filter(Boolean);
    }

    const labelTexts = values("label, mat-label, .mat-mdc-form-field-label, .mat-mdc-floating-label");
    const inputLabels = Array.from(document.querySelectorAll("input[aria-label], input[placeholder], textarea[aria-label], textarea[placeholder], select[aria-label]"))
      .filter(visible)
      .map(textOf)
      .filter(Boolean);

    return {
      url: location.href,
      title: document.title || "",
      headings: values("h1, h2, h3, [role='heading'], .app-layer-title, .mat-mdc-card-title"),
      actions: values("button, [role='button'], a[role='button'], [role='menuitem']"),
      formLabels: [...labelTexts, ...inputLabels],
      tableHeaders: values("th, [role='columnheader'], .mat-sort-header-content"),
    };
  });

  return normalizeUiSnapshot({ ...raw, step: input.step }, input.timestamp || new Date());
}

export function normalizeUiSnapshot(raw: RawUiSnapshot, timestamp = new Date()): UiSnapshot {
  const rawUrl = String(raw.url || "");
  const url = normalizeUrl(rawUrl);
  return {
    timestamp: timestamp.toISOString(),
    step: cleanText(raw.step || "Ohne Marker"),
    url,
    path: normalizePath(rawUrl),
    title: cleanText(raw.title || ""),
    headings: cleanList(raw.headings),
    actions: cleanList(raw.actions),
    formLabels: cleanList(raw.formLabels),
    tableHeaders: cleanList(raw.tableHeaders),
  };
}

function cleanList(values: unknown[] | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values || []) {
    const cleaned = cleanText(value);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
    if (result.length >= MAX_ITEMS) break;
  }
  return result;
}

function cleanText(value: unknown): string {
  return redactUiLabel(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function normalizeUrl(value: string): string {
  return normalizeDisplayUrl(redactUrl(value));
}

function normalizePath(value: string): string {
  try {
    return normalizeDisplayUrl(new URL(value).pathname);
  } catch {
    return "";
  }
}

function normalizeDisplayUrl(value: string): string {
  return value
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{uuid}")
    .replace(/\/\d+(?=\/|\?|#|$)/g, "/{id}");
}
