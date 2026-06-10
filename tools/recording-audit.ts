import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isApiTrafficRecord } from "./api-traffic.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "recordings", "latest-recording-audit.md");

export type RecordingAuditFile = {
  role: string;
  file: string;
  required: boolean;
};

export type RecordingAuditOptions = {
  files: RecordingAuditFile[];
  outputFile: string;
  generatedAt?: Date;
};

export type RecordingAuditFinding = {
  kind: "missing-file" | "secret-leak" | "pii-leak" | "quality-warning";
  severity: "high" | "medium";
  role: string;
  file: string;
  line?: number;
  pattern?: string;
  message: string;
};

export type RecordingAuditResult = {
  status: "passed" | "failed";
  generatedAt: string;
  checkedFiles: Array<{ role: string; file: string; exists: boolean }>;
  findings: RecordingAuditFinding[];
};

export type NetworkLogQualityFinding = {
  pattern: "empty-network-log" | "no-api-response" | "no-timeline-marker" | "no-ui-snapshot";
  message: string;
};

export type NetworkLogQuality = {
  recordCount: number;
  apiResponseCount: number;
  timelineMarkerCount: number;
  uiSnapshotCount: number;
  findings: NetworkLogQualityFinding[];
};

const LEAK_PATTERNS: Array<{
  kind: RecordingAuditFinding["kind"];
  severity: RecordingAuditFinding["severity"];
  pattern: string;
  regex: RegExp;
  message: string;
  ignoreMatch?: (match: string) => boolean;
}> = [
  {
    kind: "secret-leak",
    severity: "high",
    pattern: "bearer-token",
    regex: /\bBearer\s+(?!\[REDACTED\])[A-Za-z0-9._~+/=-]{8,}/i,
    message: "Bearer-Token nicht redacted.",
  },
  {
    kind: "secret-leak",
    severity: "high",
    pattern: "jwt",
    regex: /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    message: "JWT-artiger Wert nicht redacted.",
  },
  {
    kind: "secret-leak",
    severity: "high",
    pattern: "cookie-header",
    regex: /"cookie"\s*:\s*"(?!\[REDACTED\])[^"]+=|cookie\s*:\s*(?!\[REDACTED\])[^;\s]+=|Cookie\s*:\s*(?!\[REDACTED\])[^;\s]+=/,
    message: "Cookie-Wert nicht redacted.",
  },
  {
    kind: "secret-leak",
    severity: "high",
    pattern: "password",
    regex: /password(?:=|"\s*:\s*")(?!%5BREDACTED%5D|\[REDACTED\])[^&"\s]{3,}/i,
    message: "Passwort-Wert nicht redacted.",
  },
  {
    kind: "pii-leak",
    severity: "medium",
    pattern: "email",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    message: "E-Mail-Adresse nicht redacted.",
  },
  {
    kind: "pii-leak",
    severity: "medium",
    pattern: "kvnr",
    regex: /\b[A-Z]\d{9}\b/,
    message: "KVNR-artiger Wert nicht redacted.",
  },
];

if (isMainModule()) {
  const options = parseRecordingAuditArgs(process.argv.slice(2));
  const result = auditRecordingArtifacts(options);
  writeRecordingAudit(result, options.outputFile);
  console.log(`Recording-Audit: ${options.outputFile}`);
  console.log(`Status: ${result.status}`);
  console.log(`Findings: ${result.findings.length}`);
  if (result.status === "failed") process.exitCode = 1;
}

export function parseRecordingAuditArgs(argv: string[]): RecordingAuditOptions {
  const outputFile = path.resolve(valueAfter(argv, "--out") || defaultOutputFile);
  const files = [
    fileArg(argv, "--log", "Netzwerk-Log", true),
    fileArg(argv, "--flow-report", "Flow-Report", false),
    fileArg(argv, "--flow-mapping", "Flow-Mapping", false),
    fileArg(argv, "--catalog", "API-Katalog", false),
    fileArg(argv, "--openapi", "OpenAPI", false),
    fileArg(argv, "--coverage", "Coverage-Report", false),
    fileArg(argv, "--knowledge", "Knowledge-Report", false),
    fileArg(argv, "--relationships", "Relationship-Map", false),
    fileArg(argv, "--data-model", "Data-Model", false),
    fileArg(argv, "--blueprint", "Plattform-Blueprint", false),
    fileArg(argv, "--scoreboard", "Recording-Scoreboard", false),
    fileArg(argv, "--impact", "Impact-Report", false),
    fileArg(argv, "--impact-json", "Impact-JSON", false),
    fileArg(argv, "--summary", "Workflow-Summary", false),
  ].filter(Boolean) as RecordingAuditFile[];

  return {
    outputFile,
    files,
  };
}

export function auditRecordingArtifacts(options: {
  files: RecordingAuditFile[];
  generatedAt?: Date;
}): RecordingAuditResult {
  const checkedFiles = [];
  const findings: RecordingAuditFinding[] = [];

  for (const item of options.files) {
    const file = path.resolve(item.file);
    const exists = fs.existsSync(file);
    checkedFiles.push({ role: item.role, file, exists });

    if (!exists) {
      if (item.required) {
        findings.push({
          kind: "missing-file",
          severity: "high",
          role: item.role,
          file,
          message: "Pflichtartefakt fehlt.",
        });
      }
      continue;
    }

    if (!isTextArtifact(file)) continue;
    scanTextFile(file, item.role, findings);
    if (isNetworkLogArtifact(item.role, file)) scanNetworkLogQuality(file, item.role, findings);
  }

  return {
    status: findings.length === 0 ? "passed" : "failed",
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    checkedFiles,
    findings,
  };
}

export function buildRecordingAuditMarkdown(result: RecordingAuditResult): string {
  const lines = [
    "# Recording-Audit",
    "",
    `Generiert: ${result.generatedAt}`,
    `Status: ${result.status}`,
    "",
    "## Gepruefte Artefakte",
    "",
    "| Rolle | Datei | Existiert |",
    "|---|---|---:|",
  ];

  for (const item of result.checkedFiles) {
    lines.push(`| ${escapeTable(item.role)} | \`${escapeBackticks(item.file)}\` | ${item.exists ? "ja" : "nein"} |`);
  }

  lines.push("", "## Findings", "");
  if (result.findings.length === 0) {
    lines.push("- Keine offensichtlichen Token-/Cookie-/PII-Leaks gefunden.", "");
  } else {
    lines.push("| Severity | Art | Rolle | Datei | Zeile | Pattern | Meldung |");
    lines.push("|---|---|---|---|---:|---|---|");
    for (const finding of result.findings) {
      lines.push(
        `| ${finding.severity} | ${finding.kind} | ${escapeTable(finding.role)} | \`${escapeBackticks(finding.file)}\` | ${finding.line || "-"} | ${escapeTable(finding.pattern || "-")} | ${escapeTable(finding.message)} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Grenzen",
    "",
    "- Der Audit erkennt offensichtliche technische Secrets und typische PII-Muster.",
    "- Fuer Netzwerk-Logs prueft er zusaetzlich, ob API-Responses, Flow-/Explorer-Marker und UI-Struktur-Snapshots vorhanden sind.",
    "- Fachlich echte Namen ohne Muster koennen nur ueber Review oder staerkere Redaction-Regeln erkannt werden.",
    "",
  );
  return `${lines.join("\n")}`;
}

export function writeRecordingAudit(result: RecordingAuditResult, outputFile: string): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildRecordingAuditMarkdown(result));
  return outputFile;
}

function scanTextFile(file: string, role: string, findings: RecordingAuditFinding[]): void {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    for (const pattern of LEAK_PATTERNS) {
      const matches = matchingStrings(line, pattern.regex);
      if (matches.length === 0) continue;
      if (pattern.ignoreMatch && matches.every((match) => pattern.ignoreMatch?.(match))) continue;
      findings.push({
        kind: pattern.kind,
        severity: pattern.severity,
        role,
        file,
        line: index + 1,
        pattern: pattern.pattern,
        message: pattern.message,
      });
    }
  }
}

function matchingStrings(line: string, regex: RegExp): string[] {
  regex.lastIndex = 0;
  if (!regex.global) {
    const match = regex.exec(line);
    regex.lastIndex = 0;
    return match ? [match[0]] : [];
  }

  const matches = [...line.matchAll(regex)].map((match) => match[0]);
  regex.lastIndex = 0;
  return matches;
}

function scanNetworkLogQuality(file: string, role: string, findings: RecordingAuditFinding[]): void {
  const quality = evaluateNetworkLogQuality(readNetworkLogRecords(file));
  for (const finding of quality.findings) {
    findings.push({
      kind: "quality-warning",
      severity: "medium",
      role,
      file,
      pattern: finding.pattern,
      message: finding.message,
    });
  }
}

export function evaluateNetworkLogQuality(records: Record<string, unknown>[]): NetworkLogQuality {
  const quality: NetworkLogQuality = {
    recordCount: records.length,
    apiResponseCount: 0,
    timelineMarkerCount: 0,
    uiSnapshotCount: 0,
    findings: [],
  };

  for (const record of records) {
    if (record.type === "response" && isApiTrafficRecord(record)) quality.apiResponseCount += 1;
    if (record.type === "flow-marker" || record.type === "explore-marker") quality.timelineMarkerCount += 1;
    if (record.type === "ui-snapshot") quality.uiSnapshotCount += 1;
  }

  if (quality.recordCount === 0) {
    quality.findings.push({
      pattern: "empty-network-log",
      message: "Netzwerk-Log enthaelt keine parsebaren JSONL-Records.",
    });
    return quality;
  }

  if (quality.apiResponseCount === 0) {
    quality.findings.push({
      pattern: "no-api-response",
      message: "Netzwerk-Log enthaelt keine API-Responses; Katalog und OpenAPI lernen daraus nichts.",
    });
  }

  if (quality.timelineMarkerCount === 0) {
    quality.findings.push({
      pattern: "no-timeline-marker",
      message: "Netzwerk-Log enthaelt keine Flow- oder Explorer-Marker; API-/UI-Zuordnung ist schwach.",
    });
  }

  if (quality.uiSnapshotCount === 0) {
    quality.findings.push({
      pattern: "no-ui-snapshot",
      message: "Netzwerk-Log enthaelt keine UI-Struktur-Snapshots; UI-Map und Plattform-Blueprint bleiben unvollstaendig.",
    });
  }

  return quality;
}

function readNetworkLogRecords(file: string): Record<string, unknown>[] {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Record<string, unknown>[];
}

function isTextArtifact(file: string): boolean {
  return /\.(jsonl|json|md|yaml|yml|txt)$/i.test(file);
}

function isNetworkLogArtifact(role: string, file: string): boolean {
  return role === "Netzwerk-Log" && /\.jsonl$/i.test(file);
}

function fileArg(argv: string[], flag: string, role: string, required: boolean): RecordingAuditFile | null {
  const value = valueAfter(argv, flag);
  return value ? { role, file: path.resolve(value), required } : null;
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function escapeBackticks(value: string): string {
  return String(value).replace(/`/g, "\\`");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
