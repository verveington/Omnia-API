import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const fallbackRecordingUrl = "https://api2.optica-omnia.de";

export type RecordingCommandTargetOptions = {
  recordingUrl?: string;
};

export function resolveRecordingUrl(options: RecordingCommandTargetOptions = {}): string {
  return nonEmpty(options.recordingUrl) || nonEmpty(process.env.OMNIA_URL) || readEnvironmentUrl() || fallbackRecordingUrl;
}

export function recordingWorkflowBaseArgs(
  mode: "auto" | "manual",
  options: RecordingCommandTargetOptions = {},
): string[] {
  return [
    "tools/recording-workflow.ts",
    "--mode",
    mode,
    "--url",
    resolveRecordingUrl(options),
  ];
}

export function withRecordingUrlArg(
  args: string[],
  options: RecordingCommandTargetOptions = {},
): string[] {
  const next = [...args];
  const url = resolveRecordingUrl(options);
  const existing = next.indexOf("--url");
  if (existing >= 0) {
    next[existing + 1] = url;
    return next;
  }

  const mode = next.indexOf("--mode");
  const insertAt = mode >= 0 ? Math.min(mode + 2, next.length) : Math.min(1, next.length);
  next.splice(insertAt, 0, "--url", url);
  return next;
}

function readEnvironmentUrl(): string {
  const envPath = path.join(workspaceRoot, "environment.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(envPath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") return "";
    return nonEmpty((parsed as Record<string, unknown>).url);
  } catch {
    return "";
  }
}

function nonEmpty(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}
