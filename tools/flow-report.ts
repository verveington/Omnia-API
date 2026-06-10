import fs from "node:fs";
import path from "node:path";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";

export type FlowRecord = Record<string, unknown>;

export type FlowReportOptions = {
  generatedAt?: Date;
  sourceLogFile?: string;
  knownEndpointKeys?: Set<string>;
};

export type WriteFlowReportOptions = {
  generatedAt?: Date;
  knownCatalogFile?: string;
};

type FlowObservation = {
  step: string;
  timestamp: string;
  offset: string;
  method: string;
  host: string;
  path: string;
  status: number | null;
  resourceType: string;
  process: string;
  key: string;
};

type DownloadObservation = {
  step: string;
  timestamp: string;
  offset: string;
  url: string;
  extension: string;
};

type BrowserContextObservation = {
  step: string;
  timestamp: string;
  offset: string;
  event: string;
  detail: string;
  source: string;
};

type UiSnapshotObservation = {
  step: string;
  timestamp: string;
  offset: string;
  path: string;
  title: string;
  headings: string[];
  actions: string[];
  formLabels: string[];
  tableHeaders: string[];
};

type ResponseGroup = {
  method: string;
  host: string;
  path: string;
  statuses: Set<number>;
  resourceTypes: Set<string>;
  count: number;
};

export function buildFlowReportMarkdown(records: FlowRecord[], options: FlowReportOptions = {}): string {
  const generatedAt = options.generatedAt || new Date();
  const knownEndpointKeys = options.knownEndpointKeys || new Set<string>();
  const baseTime = recordingBaseTime(records);
  const observations = collectObservations(records, baseTime);
  const downloads = collectDownloads(records, baseTime);
  const browserContext = collectBrowserContext(records, baseTime);
  const uiSnapshots = collectUiSnapshots(records, baseTime);
  const navigationCount = browserContext.filter((item) => item.event === "Navigation").length;
  const browserDiagnosticCount = browserContext.length - navigationCount;
  const statusCounts = countStatuses(observations);
  const endpointGroups = groupObservations(observations);
  const newEndpointGroups = endpointGroups.filter((group) => !knownEndpointKeys.has(`${group.method} ${group.path}`));

  const lines = [
    "# Flow-Aufzeichnung",
    "",
    `Quelle: \`${formatSource(options.sourceLogFile)}\``,
    `Generiert: ${generatedAt.toISOString()}`,
    "",
    "Hinweis: Der Report nutzt ausschliesslich bereits redaktierte JSONL-Records. Er soll fachliche Zusammenhaenge sichtbar machen, nicht Rohwerte rekonstruieren.",
    "",
    "## Zusammenfassung",
    "",
    `- Responses: ${observations.length}`,
    `- Eindeutige Endpunkte: ${endpointGroups.length}`,
    `- Neue Endpunkte gegen Katalog: ${newEndpointGroups.length}`,
    `- Downloads: ${downloads.length}`,
    `- Navigationen: ${navigationCount}`,
    `- Browser-Diagnosen: ${browserDiagnosticCount}`,
    `- UI-Snapshots: ${uiSnapshots.length}`,
    "",
    "## Sequenz",
    "",
  ];

  if (observations.length === 0) {
    lines.push("- Keine Responses mit Flow-Kontext beobachtet.", "");
  } else {
    lines.push("| # | Offset | Schritt | Methode | Pfad | Status | Vermutete Funktion | Resource |");
    lines.push("|---:|---|---|---|---|---:|---|---|");
    observations.forEach((item, index) => {
      lines.push(
        `| ${index + 1} | ${item.offset} | ${escapeTable(item.step)} | ${item.method} | \`${item.path}\` | ${formatStatus(item.status)} | ${escapeTable(item.process)} | ${escapeTable(item.resourceType || "-")} |`,
      );
    });
    lines.push("");
  }

  lines.push("## Downloads", "");
  if (downloads.length === 0) {
    lines.push("- Keine Download-Events beobachtet.", "");
  } else {
    lines.push("| Offset | Schritt | URL | Dateityp |");
    lines.push("|---|---|---|---|");
    for (const download of downloads) {
      lines.push(
        `| ${download.offset} | ${escapeTable(download.step)} | \`${escapeBackticks(download.url)}\` | ${escapeTable(download.extension || "unbekannt")} |`,
      );
    }
    lines.push("");
  }

  lines.push("## UI-Struktur", "");
  if (uiSnapshots.length === 0) {
    lines.push("- Keine UI-Struktur-Snapshots beobachtet.", "");
  } else {
    lines.push("| Offset | Schritt | Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |");
    lines.push("|---|---|---|---|---|---|---|---|");
    for (const snapshot of uiSnapshots) {
      lines.push(
        `| ${snapshot.offset} | ${escapeTable(snapshot.step)} | \`${escapeBackticks(snapshot.path || "-")}\` | ${escapeTable(snapshot.title || "-")} | ${formatTextList(snapshot.headings)} | ${formatTextList(snapshot.actions)} | ${formatTextList(snapshot.formLabels)} | ${formatTextList(snapshot.tableHeaders)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Browser-Kontext", "");
  if (browserContext.length === 0) {
    lines.push("- Keine Navigationen oder Browser-Diagnosen beobachtet.", "");
  } else {
    lines.push("| Offset | Schritt | Ereignis | Detail | Quelle |");
    lines.push("|---|---|---|---|---|");
    for (const item of browserContext) {
      lines.push(
        `| ${item.offset} | ${escapeTable(item.step)} | ${escapeTable(item.event)} | ${formatBrowserDetail(item)} | ${formatBrowserSource(item.source)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Neue Endpunkte", "");
  if (newEndpointGroups.length === 0) {
    lines.push("- Keine neuen Endpunkte gegen den bekannten Katalog beobachtet.", "");
  } else {
    for (const group of newEndpointGroups) {
      lines.push(`- ${group.method} \`${group.path}\` (${[...group.statuses].sort((a, b) => a - b).join(", ") || "ohne Status"})`);
    }
    lines.push("");
  }

  lines.push("## Statuscodes", "");
  if (statusCounts.size === 0) {
    lines.push("- Keine HTTP-Statuscodes beobachtet.", "");
  } else {
    lines.push("| Status | Anzahl |");
    lines.push("|---:|---:|");
    for (const [status, count] of [...statusCounts.entries()].sort((a, b) => a[0] - b[0])) {
      lines.push(`| ${status} | ${count} |`);
    }
    lines.push("");
  }

  lines.push("## Vermutete Fachfunktionen", "");
  const byProcess = groupByProcess(observations);
  if (byProcess.size === 0) {
    lines.push("- Keine fachliche Zuordnung ableitbar.", "");
  } else {
    for (const [process, groups] of [...byProcess.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`### ${process}`, "");
      for (const group of groups) {
        lines.push(`- ${group.method} \`${group.path}\` (${[...group.statuses].sort((a, b) => a - b).join(", ") || "ohne Status"})`);
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

export function writeFlowReport(logFile: string, outputDir: string, options: WriteFlowReportOptions = {}): string {
  const records = readJsonLines(logFile);
  const generatedAt = options.generatedAt || new Date();
  const knownEndpointKeys = options.knownCatalogFile ? knownEndpointsFromCatalog(options.knownCatalogFile) : new Set<string>();
  const markdown = buildFlowReportMarkdown(records, {
    generatedAt,
    sourceLogFile: logFile,
    knownEndpointKeys,
  });
  const timestamp = firstTimestamp(records) || generatedAt.toISOString();
  const outputFile = path.join(outputDir, `${sanitizeTimestamp(timestamp)}-flow.md`);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, markdown);
  return outputFile;
}

export function writeFlowMapping(logFile: string, outputFile: string): void {
  const records = readJsonLines(logFile);
  const stepsInOrder = records
    .filter((record) => isStepStartMarker(record))
    .map((record) => String(record.step || "Unbenannter Schritt"));

  const byStep = new Map<string, FlowRecord[]>();
  for (const step of stepsInOrder) byStep.set(step, []);

  for (const record of records) {
    const isApiRecord = isApiTrafficRecord(record) && (record.type === "request" || record.type === "response" || record.type === "requestfailed");
    const isUiSnapshot = record.type === "ui-snapshot";
    if (!isApiRecord && !isUiSnapshot) continue;
    const step = String(record.step || "Ohne Marker");
    if (!byStep.has(step)) byStep.set(step, []);
    byStep.get(step)?.push(record);
  }

  const lines = [
    "# Flow-to-API-Mapping",
    "",
    `Quelle: \`${formatSource(logFile)}\``,
    `Generiert: ${new Date().toISOString()}`,
    "",
    "Hinweis: Beispiele stammen ausschliesslich aus redacted JSONL-Logs. Fehlende Schritte bedeuten, dass noch keine Requests beobachtet wurden oder kein Marker aktiv war. UI-Struktur zeigt nur redaktierte Strukturtexte.",
    "",
  ];

  for (const [step, items] of byStep.entries()) {
    lines.push(`## ${step}`, "");
    const responses = items.filter((item) => item.type === "response");
    const uiSnapshots = collectUiSnapshots(items, recordingBaseTime(records));
    if (responses.length === 0) {
      lines.push("- TODO: Keine Response fuer diesen Schritt beobachtet.", "");
    } else {
      lines.push("| Methode | Host | Pfad | Status | Resource | Anzahl |");
      lines.push("|---|---|---|---:|---|---:|");
      for (const group of groupResponses(responses)) {
        lines.push(
          `| ${group.method} | ${group.host} | \`${group.path}\` | ${[...group.statuses].sort((a, b) => a - b).join(", ")} | ${[...group.resourceTypes].sort().join(", ")} | ${group.count} |`,
        );
      }
      lines.push("");
    }

    if (uiSnapshots.length > 0) {
      lines.push("### UI-Struktur", "");
      lines.push("| Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |");
      lines.push("|---|---|---|---|---|---|");
      for (const snapshot of uiSnapshots) {
        lines.push(
          `| \`${escapeBackticks(snapshot.path || "-")}\` | ${escapeTable(snapshot.title || "-")} | ${formatTextList(snapshot.headings)} | ${formatTextList(snapshot.actions)} | ${formatTextList(snapshot.formLabels)} | ${formatTextList(snapshot.tableHeaders)} |`,
        );
      }
      lines.push("");
    }
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${lines.join("\n")}\n`);
}

export function knownEndpointsFromCatalog(catalogFile: string): Set<string> {
  if (!fs.existsSync(catalogFile)) return new Set<string>();

  const endpoints = new Set<string>();
  const text = fs.readFileSync(catalogFile, "utf8");
  const endpointRe = /^###\s+([A-Z]+)\s+`([^`]+)`/gm;
  for (const match of text.matchAll(endpointRe)) {
    endpoints.add(`${match[1].toUpperCase()} ${match[2]}`);
  }
  return endpoints;
}

function isStepStartMarker(record: FlowRecord): boolean {
  return (
    (record.type === "flow-marker" && record.marker === "step-start")
    || (record.type === "explore-marker" && record.marker === "target-start")
  );
}

function collectObservations(records: FlowRecord[], baseTime: number | null): FlowObservation[] {
  return records
    .filter((record) => record.type === "response")
    .filter((record) => isApiTrafficRecord(record))
    .map((record) => {
      const url = parseUrl(String(record.url || ""));
      const method = String(record.method || "GET").toUpperCase();
      const endpointPath = normalizeObservedPath(url.pathname || "/");
      const status = typeof record.status === "number" ? record.status : Number(record.status || 0);
      const normalizedStatus = Number.isFinite(status) && status > 0 ? status : null;
      return {
        step: String(record.step || "Ohne Marker"),
        timestamp: String(record.timestamp || ""),
        offset: formatOffset(String(record.timestamp || ""), baseTime),
        method,
        host: url.host,
        path: endpointPath,
        status: normalizedStatus,
        resourceType: String(record.resourceType || ""),
        process: inferProcess(endpointPath, String(record.step || "")),
        key: `${method} ${endpointPath}`,
      };
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function collectDownloads(records: FlowRecord[], baseTime: number | null): DownloadObservation[] {
  return records
    .filter((record) => record.type === "download")
    .map((record) => ({
      step: String(record.step || "Ohne Marker"),
      timestamp: String(record.timestamp || ""),
      offset: formatOffset(String(record.timestamp || ""), baseTime),
      url: normalizeDisplayUrl(String(record.url || "")),
      extension: String(record.suggestedFileExtension || ""),
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function collectBrowserContext(records: FlowRecord[], baseTime: number | null): BrowserContextObservation[] {
  return records
    .filter((record) => record.type === "navigation" || record.type === "browser-console" || record.type === "browser-pageerror")
    .map((record) => {
      const timestamp = String(record.timestamp || "");
      return {
        step: String(record.step || "Ohne Marker"),
        timestamp,
        offset: formatOffset(timestamp, baseTime),
        event: browserContextEvent(record),
        detail: browserContextDetail(record),
        source: browserContextSource(record),
      };
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function collectUiSnapshots(records: FlowRecord[], baseTime: number | null): UiSnapshotObservation[] {
  return records
    .filter((record) => record.type === "ui-snapshot")
    .map((record) => {
      const timestamp = String(record.timestamp || "");
      return {
        step: String(record.step || "Ohne Marker"),
        timestamp,
        offset: formatOffset(timestamp, baseTime),
        path: normalizeDisplayUrl(String(record.path || "")),
        title: String(record.title || ""),
        headings: stringList(record.headings),
        actions: stringList(record.actions),
        formLabels: stringList(record.formLabels),
        tableHeaders: stringList(record.tableHeaders),
      };
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function groupObservations(observations: FlowObservation[]): ResponseGroup[] {
  const groups = new Map<string, ResponseGroup>();
  for (const item of observations) {
    const group = groups.get(item.key) || {
      method: item.method,
      host: item.host,
      path: item.path,
      statuses: new Set<number>(),
      resourceTypes: new Set<string>(),
      count: 0,
    };
    if (item.status !== null) group.statuses.add(item.status);
    if (item.resourceType) group.resourceTypes.add(item.resourceType);
    group.count += 1;
    groups.set(item.key, group);
  }
  return [...groups.values()].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function browserContextEvent(record: FlowRecord): string {
  if (record.type === "navigation") return "Navigation";
  if (record.type === "browser-console") return `Console ${String(record.level || "message")}`;
  return "Page error";
}

function browserContextDetail(record: FlowRecord): string {
  if (record.type === "navigation") return normalizeDisplayUrl(String(record.url || ""));
  if (record.type === "browser-console") return String(record.text || "");
  return String(record.message || "");
}

function browserContextSource(record: FlowRecord): string {
  if (record.type !== "browser-console") return "";
  const location = record.location && typeof record.location === "object" ? record.location as Record<string, unknown> : {};
  const url = normalizeDisplayUrl(String(location.url || ""));
  const lineNumber = location.lineNumber === undefined ? "" : String(location.lineNumber);
  const columnNumber = location.columnNumber === undefined ? "" : String(location.columnNumber);
  const position = [lineNumber, columnNumber].filter(Boolean).join(":");
  if (!url) return position;
  return position ? `${url}:${position}` : url;
}

function formatBrowserDetail(item: BrowserContextObservation): string {
  const detail = escapeTable(item.detail);
  return item.event === "Navigation" ? `\`${escapeBackticks(detail)}\`` : detail;
}

function formatBrowserSource(value: string): string {
  if (!value) return "-";
  return `\`${escapeBackticks(escapeTable(value))}\``;
}

function formatTextList(values: string[]): string {
  return values.length > 0 ? escapeTable(values.slice(0, 6).join(", ")) : "-";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "")).filter(Boolean);
}

function groupResponses(records: FlowRecord[]): ResponseGroup[] {
  return groupObservations(collectObservations(records, recordingBaseTime(records)));
}

function countStatuses(observations: FlowObservation[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const item of observations) {
    if (item.status === null) continue;
    counts.set(item.status, (counts.get(item.status) || 0) + 1);
  }
  return counts;
}

function groupByProcess(observations: FlowObservation[]): Map<string, ResponseGroup[]> {
  const byProcess = new Map<string, FlowObservation[]>();
  for (const item of observations) {
    const items = byProcess.get(item.process) || [];
    items.push(item);
    byProcess.set(item.process, items);
  }

  const result = new Map<string, ResponseGroup[]>();
  for (const [process, items] of byProcess.entries()) {
    result.set(process, groupObservations(items));
  }
  return result;
}

function inferProcess(endpointPath: string, step: string): string {
  const value = `${step} ${endpointPath}`.toLowerCase();
  const pathValue = endpointPath.toLowerCase();
  if (value.includes("ekv") || value.includes("cost-estimate") || value.includes("kostenvoranschlag")) {
    return "eKV/Kostenvoranschlag";
  }
  if (
    pathValue.includes("/wawi/") ||
    pathValue.includes("/order-proposals") ||
    pathValue.includes("/order-arrival") ||
    pathValue.includes("/order-states") ||
    /\/orders(\/|$)/.test(pathValue) ||
    value.includes("bestell")
  ) {
    return "Warenwirtschaft/Bestellung";
  }
  if (value.includes("customer") || value.includes("kunde")) {
    return value.includes("search") || value.includes("such") ? "Kundensuche" : "Kundenstamm";
  }
  if (value.includes("sales") || value.includes("salesprocess") || value.includes("auftrag") || value.includes("vorgang")) {
    return "Verkauf/Vorgang";
  }
  if (value.includes("article") || value.includes("artikel")) {
    return "Artikel";
  }
  if (value.includes("supplier") || value.includes("procurement") || value.includes("purchase")) {
    return "Beschaffung";
  }
  if (value.includes("accounting") || value.includes("payment")) {
    return "Buchhaltung";
  }
  if (value.includes("auth") || value.includes("login") || value.includes("identity")) {
    return "Auth/Identity";
  }
  return "TODO: Fachprozess pruefen";
}

function readJsonLines(file: string): FlowRecord[] {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "parse-error" };
      }
    });
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("http://unknown.invalid/");
  }
}

function firstTimestamp(records: FlowRecord[]): string | null {
  for (const record of records) {
    const value = String(record.timestamp || "");
    if (value) return value;
  }
  return null;
}

function recordingBaseTime(records: FlowRecord[]): number | null {
  for (const record of records) {
    const time = Date.parse(String(record.timestamp || ""));
    if (Number.isFinite(time)) return time;
  }
  return null;
}

function sanitizeTimestamp(value: string): string {
  return value.replace(/[:.]/g, "-").replace(/[^A-Za-z0-9TZ_-]/g, "-");
}

function formatSource(sourceLogFile: string | undefined): string {
  if (!sourceLogFile) return "unbekannt";
  return path.isAbsolute(sourceLogFile) ? path.relative(process.cwd(), sourceLogFile) : sourceLogFile;
}

function formatStatus(status: number | null): string {
  return status === null ? "0" : String(status);
}

function formatOffset(timestamp: string, baseTime: number | null): string {
  const time = Date.parse(timestamp);
  if (baseTime === null || !Number.isFinite(time)) return "+00:00";
  const seconds = Math.max(0, Math.floor((time - baseTime) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `+${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function normalizeDisplayUrl(value: string): string {
  return value
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{uuid}")
    .replace(/\/\d+(?=\/|\?|#|$)/g, "/{id}");
}
