import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { redactUiLabel, redactUrl } from "../redact.ts";
import type { ExplorerResult } from "./state.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultWorkspaceRoot = path.resolve(__dirname, "..", "..");

export function summarizeExplorerResult(result: ExplorerResult): string {
  const lines = [
    "# Auto-Explore Read-only Report",
    "",
    `Generiert: ${result.finishedAt}`,
    `Start: ${redactUrl(result.startUrl)}`,
    `Ende: ${redactUrl(result.finalUrl)}`,
    `Stop-Grund: ${result.stopReason}`,
    `JSONL-Log: \`${result.logFile}\``,
    "",
    "## Geklickte Ziele",
    "",
  ];

  if (result.clicked.length === 0) {
    lines.push("- Keine Ziele geklickt.", "");
  } else {
    lines.push("| # | Typ | Label | Pfad | URL danach |");
    lines.push("|---:|---|---|---|---|");
    result.clicked.forEach((target, index) => {
      lines.push(`| ${index + 1} | ${escapeCell(target.kind)} | ${escapeCell(redactUiLabel(target.label))} | \`${escapeCell(target.path || "-")}\` | ${escapeCell(target.urlAfter || "")} |`);
    });
    lines.push("");
  }

  const discoveredTargets = result.discoveredTargets || [];
  lines.push("## UI-Zielinventar", "");
  if (discoveredTargets.length === 0) {
    lines.push("- Keine sicheren UI-Ziele inventarisiert.", "");
  } else {
    lines.push("| Status | Typ | Label | Pfad | Sichtungen | Grund |");
    lines.push("|---|---|---|---|---:|---|");
    for (const target of discoveredTargets.slice().sort(compareInventoryTargets).slice(0, 500)) {
      lines.push([
        target.clicked ? "geklickt" : "offen",
        escapeCell(target.kind),
        escapeCell(redactUiLabel(target.label)),
        `\`${escapeCell(target.path || "-")}\``,
        String(target.seenCount),
        escapeCell(target.reason),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    if (discoveredTargets.length > 500) {
      lines.push(`| ... | ... | ... | ... | ${discoveredTargets.length - 500} weitere ausgeblendet | ... |`);
    }
    lines.push("");
  }

  const uiSnapshots = result.uiSnapshots || [];
  lines.push("## UI-Struktur-Snapshots", "");
  if (uiSnapshots.length === 0) {
    lines.push("- Keine UI-Struktur-Snapshots aufgezeichnet.", "");
  } else {
    lines.push("| # | Schritt | Pfad | Titel | Ueberschriften | Aktionen | Formularfelder | Tabellenkoepfe |");
    lines.push("|---:|---|---|---|---|---|---|---|");
    uiSnapshots.slice(0, 120).forEach((snapshot, index) => {
      lines.push([
        String(index + 1),
        escapeCell(snapshot.step || "-"),
        `\`${escapeCell(snapshot.path || "-")}\``,
        escapeCell(snapshot.title || "-"),
        escapeCell(joinSnapshotItems(snapshot.headings)),
        escapeCell(joinSnapshotItems(snapshot.actions)),
        escapeCell(joinSnapshotItems(snapshot.formLabels)),
        escapeCell(joinSnapshotItems(snapshot.tableHeaders)),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    });
    if (uiSnapshots.length > 120) {
      lines.push(`| ... | ... | ... | ... | ... | ... | ... | ${uiSnapshots.length - 120} weitere ausgeblendet |`);
    }
    lines.push("");
  }

  lines.push("## Blockierte Requests", "");
  if (result.blockedRequests.length === 0) {
    lines.push("- Keine unerwarteten Schreibrequests beobachtet.", "");
  } else {
    lines.push("| Methode | URL | Grund | Resource |");
    lines.push("|---|---|---|---|");
    for (const item of result.blockedRequests) {
      lines.push(`| ${escapeCell(item.method)} | ${escapeCell(redactUrl(item.url))} | ${escapeCell(item.reason)} | ${escapeCell(item.resourceType || "")} |`);
    }
    lines.push("");
  }

  lines.push("## Uebersprungene Ziele", "");
  if (result.skipped.length === 0) {
    lines.push("- Keine uebersprungenen Ziele protokolliert.", "");
  } else {
    lines.push("| Label | Pfad | Grund |");
    lines.push("|---|---|---|");
    for (const item of result.skipped.slice(0, 300)) {
      lines.push(`| ${escapeCell(redactUiLabel(item.label))} | \`${escapeCell(item.path || "-")}\` | ${escapeCell(item.reason)} |`);
    }
    if (result.skipped.length > 300) {
      lines.push(`| ... | ... | ${result.skipped.length - 300} weitere ausgeblendet |`);
    }
    lines.push("");
  }

  lines.push("## Hinweise", "");
  lines.push("- Das Tool klickt nur klassifizierte Navigationsziele, Tabs, App-Menue-Eintraege und App-Kacheln.");
  lines.push("- PUT, PATCH und DELETE werden blockiert. POST wird nur fuer read-like Endpunkte wie Suche, Listen und Zaehler erlaubt.");
  lines.push("- Telemetrie-POSTs werden abgebrochen und dokumentiert, fuehren aber nicht allein zum Abbruch des Crawls.");
  lines.push("- Request- und Response-Bodies sind beim Explorer standardmaessig deaktiviert.");

  return `${lines.join("\n")}\n`;
}

export function writeExplorerReport(
  file: string,
  result: ExplorerResult,
  workspaceRoot = defaultWorkspaceRoot,
): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, summarizeExplorerResult({
    ...result,
    logFile: path.relative(workspaceRoot, result.logFile) || result.logFile,
  }));
}

function escapeCell(value: unknown): string {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function joinSnapshotItems(values: string[] | undefined): string {
  if (!values || values.length === 0) return "-";
  return values.slice(0, 8).join(", ");
}

function compareInventoryTargets(
  left: NonNullable<ExplorerResult["discoveredTargets"]>[number],
  right: NonNullable<ExplorerResult["discoveredTargets"]>[number],
): number {
  if (left.clicked !== right.clicked) return left.clicked ? 1 : -1;
  return left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label, "de") || left.path.localeCompare(right.path);
}
