import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import * as recordingAutopilotReportModule from "./recording-autopilot-report.ts";
import {
  buildRecordingAutopilotHistoryMarkdown,
  buildRecordingAutopilotHistoryReport,
  formatRecordingAutopilotReportCliLines,
  parseRecordingAutopilotReportArgs,
  readRecordingAutopilotHistory,
  writeRecordingAutopilotHistoryReport,
} from "./recording-autopilot-report.ts";

test("buildRecordingAutopilotHistoryReport summarizes decisions, artifacts and learning", () => {
  const entries = [
    {
      timestamp: "2026-06-03T10:00:00.000Z",
      mode: "dry-run",
      status: "ready",
      reason: "Dry-Run",
      findings: [],
      command: "node tools/recording-next.ts --auto-only",
      outcomeJsonFile: "/workspace/docs/recordings/recording-autopilot-outcome.json",
      nextReportJsonFile: "/workspace/docs/recordings/recording-autopilot-report.json",
      nextCommand: "node tools/recording-workflow.ts --mode auto",
    },
    {
      timestamp: "2026-06-03T10:05:00.000Z",
      mode: "run",
      status: "ready",
      reason: "Next-Recording wurde ausgefuehrt.",
      findings: [],
      command: "node tools/recording-next.ts --auto-only --run",
      outcomeJsonFile: "/workspace/docs/recordings/recording-autopilot-outcome.json",
      nextReportJsonFile: "/workspace/docs/recordings/recording-autopilot-report.json",
      workflowRun: {
        manifestFile: "/workspace/docs/recordings/001-workflow-manifest.json",
        purpose: "coverage",
        status: "completed",
        logFile: "/workspace/logs/network/001-workflow.jsonl",
        impactFile: "/workspace/docs/recordings/001-workflow-impact.md",
        targetResponses: 12,
        newEndpointCount: 4,
        newKnownInventoryCount: 2,
        coverageDeltaPercent: 3.5,
      },
      runEvidence: {
        status: "ok",
        reason: "Workflow-Run hat verwertbare Aufnahme-Evidenz geliefert.",
        findings: [],
        targetResponses: 12,
      },
      learning: {
        status: "ok",
        recommendedAction: "continue-coverage-recording",
        finalCoveragePercent: 42.5,
      },
    },
    {
      timestamp: "2026-06-03T10:10:00.000Z",
      mode: "run",
      status: "needs-review",
      reason: "Workflow-Run braucht Review: no-ui-snapshot.",
      findings: ["no-ui-snapshot"],
      command: "node tools/recording-next.ts --auto-only --run",
      outcomeJsonFile: "/workspace/docs/recordings/recording-autopilot-outcome.json",
      nextReportJsonFile: "/workspace/docs/recordings/recording-autopilot-report.json",
      workflowRun: {
        manifestFile: "/workspace/docs/recordings/002-workflow-manifest.json",
        purpose: "quality-baseline",
        status: "completed",
        logFile: "/workspace/logs/network/002-workflow.jsonl",
        targetResponses: 3,
        newEndpointCount: 0,
        newKnownInventoryCount: 0,
        coverageDeltaPercent: 0,
      },
      runEvidence: {
        status: "needs-review",
        reason: "Workflow-Run braucht Review: no-ui-snapshot.",
        findings: ["no-ui-snapshot"],
        targetResponses: 3,
      },
      learning: {
        status: "needs-review",
        recommendedAction: "record-quality-baseline",
        finalCoveragePercent: 42.5,
      },
    },
  ];

  const report = buildRecordingAutopilotHistoryReport(entries, new Date("2026-06-03T12:00:00.000Z"));

  assert.equal(report.entryCount, 3);
  assert.equal(report.runCount, 2);
  assert.equal(report.workflowRunCount, 2);
  assert.equal(report.readyCount, 2);
  assert.equal(report.needsReviewCount, 1);
  assert.equal(report.runEvidenceOkCount, 1);
  assert.equal(report.runEvidenceReviewCount, 1);
  assert.equal(report.totalNewEndpoints, 4);
  assert.equal(report.totalNewKnownInventoryEndpoints, 2);
  assert.equal(report.latestCoveragePercent, 42.5);
  assert.equal(report.latestStatus, "needs-review");
  assert.equal(report.reviewEntries.length, 1);
  assert.equal(report.reviewEntries[0].findings[0], "no-ui-snapshot");
});

test("buildRecordingAutopilotHistoryReport prefers autopilot continuation commands", () => {
  const report = buildRecordingAutopilotHistoryReport([
    {
      timestamp: "2026-06-03T10:00:00.000Z",
      mode: "preflight",
      status: "ready",
      reason: "Preflight ready",
      command: "node tools/recording-next.ts --auto-only --preflight",
      nextCommand: "node tools/recording-workflow.ts --mode auto",
      continueCommand: "node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run",
      continueArgs: [
        "tools/recording-autopilot.ts",
        "--continue-from",
        "docs/recordings/recording-autopilot-outcome.json",
        "--run",
      ],
      outcomeFresh: false,
      outcomeAgeMinutes: 180,
      outcomeMaxAgeMinutes: 120,
    },
  ], new Date("2026-06-03T12:00:00.000Z"));

  assert.equal(report.latestCommand, "node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run");
  assert.equal(report.entries[0].continueCommand, report.latestCommand);
  assert.deepEqual(report.entries[0].continueArgs, [
    "tools/recording-autopilot.ts",
    "--continue-from",
    "docs/recordings/recording-autopilot-outcome.json",
    "--run",
  ]);
  assert.equal(report.entries[0].outcomeFresh, false);
  assert.equal(report.entries[0].outcomeAgeMinutes, 180);
  assert.equal(report.entries[0].outcomeMaxAgeMinutes, 120);
  assert.equal(report.latestOutcomeFresh, false);
  assert.equal(report.latestOutcomeAgeMinutes, 180);
  assert.equal(report.latestOutcomeMaxAgeMinutes, 120);
  assert.equal(report.latestRunnable, false);
  assert.equal(report.latestRunnableReason, "Outcome-Fortsetzung ist stale (180/120 min).");
  const markdown = buildRecordingAutopilotHistoryMarkdown(report);
  assert.match(markdown, /tools\/recording-autopilot\.ts --continue-from/);
  assert.match(markdown, /Startfreigabe: nein/);
  assert.match(markdown, /Startfreigabe-Grund: Outcome-Fortsetzung ist stale \(180\/120 min\)\./);
  assert.match(markdown, /Outcome-Fortsetzung: stale \(180\/120 min\)/);
  assert.match(markdown, /stale \(180\/120 min\)/);
});

test("buildRecordingAutopilotHistoryReport marks fresh ready continuations runnable", () => {
  const report = buildRecordingAutopilotHistoryReport([
    {
      timestamp: "2026-06-03T10:00:00.000Z",
      mode: "dry-run",
      status: "ready",
      reason: "Continue preview",
      command: "node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run",
      outcomeJsonFile: "docs/recordings/recording-autopilot-outcome.json",
      continueCommand: "node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run",
      continueArgs: [
        "tools/recording-autopilot.ts",
        "--continue-from",
        "docs/recordings/recording-autopilot-outcome.json",
        "--run",
      ],
      outcomeFresh: true,
      outcomeAgeMinutes: 5,
      outcomeMaxAgeMinutes: 120,
    },
  ], new Date("2026-06-03T12:00:00.000Z"));

  assert.equal(report.latestRunnable, true);
  assert.equal(report.latestRunnableReason, "Ready-Fortsetzung ist frisch und gated.");
  assert.equal(report.latestOutcomeJsonFile, "docs/recordings/recording-autopilot-outcome.json");
  assert.deepEqual(report.latestContinueArgs, [
    "tools/recording-autopilot.ts",
    "--continue-from",
    "docs/recordings/recording-autopilot-outcome.json",
    "--run",
  ]);
  assert.match(buildRecordingAutopilotHistoryMarkdown(report), /Startfreigabe: ja/);
});

test("buildRecordingAutopilotHistoryReport revalidates stored outcome freshness from sidecar mtime", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-freshness-"));
  const outcomeJsonFile = path.join(dir, "recording-autopilot-outcome.json");
  const generatedAt = new Date("2026-06-03T12:00:00.000Z");
  fs.writeFileSync(outcomeJsonFile, "{}\n");
  fs.utimesSync(outcomeJsonFile, new Date("2026-06-03T09:00:00.000Z"), new Date("2026-06-03T09:00:00.000Z"));

  const report = buildRecordingAutopilotHistoryReport([
    {
      timestamp: "2026-06-03T10:00:00.000Z",
      mode: "dry-run",
      status: "ready",
      reason: "Continue preview",
      command: `node tools/recording-autopilot.ts --continue-from ${outcomeJsonFile} --run`,
      outcomeJsonFile,
      continueCommand: `node tools/recording-autopilot.ts --continue-from ${outcomeJsonFile} --run`,
      outcomeFresh: true,
      outcomeAgeMinutes: 5,
      outcomeMaxAgeMinutes: 120,
    },
  ], generatedAt);

  assert.equal(report.latestRunnable, false);
  assert.equal(report.latestOutcomeFresh, false);
  assert.equal(report.latestOutcomeAgeMinutes, 180);
  assert.equal(report.latestOutcomeMaxAgeMinutes, 120);
  assert.equal(report.latestRunnableReason, "Outcome-Fortsetzung ist stale (180/120 min).");
});

test("formatRecordingAutopilotReportCliLines exposes runnable state and next command", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-cli-"));
  const outcomeJsonFile = path.join(dir, "recording-autopilot-outcome.json");
  fs.writeFileSync(outcomeJsonFile, "{}\n");
  fs.utimesSync(outcomeJsonFile, new Date("2026-06-03T11:55:00.000Z"), new Date("2026-06-03T11:55:00.000Z"));
  const report = buildRecordingAutopilotHistoryReport([
    {
      timestamp: "2026-06-03T10:00:00.000Z",
      mode: "dry-run",
      status: "ready",
      reason: "Continue preview",
      command: `node tools/recording-autopilot.ts --continue-from ${outcomeJsonFile} --run`,
      outcomeJsonFile,
      continueCommand: `node tools/recording-autopilot.ts --continue-from ${outcomeJsonFile} --run`,
      continueArgs: [
        "tools/recording-autopilot.ts",
        "--continue-from",
        outcomeJsonFile,
        "--run",
      ],
      outcomeFresh: true,
      outcomeAgeMinutes: 5,
      outcomeMaxAgeMinutes: 120,
    },
  ], new Date("2026-06-03T12:00:00.000Z"));

  const lines = formatRecordingAutopilotReportCliLines(report, "/workspace/docs/recordings/recording-autopilot-history.md");

  assert.equal(lines.includes("Startfreigabe: ja"), true);
  assert.equal(lines.includes("Startfreigabe-Grund: Ready-Fortsetzung ist frisch und gated."), true);
  assert.equal(lines.includes("Outcome-Fortsetzung: frisch (5/120 min)"), true);
  assert.equal(lines.includes(`Naechste Args: tools/recording-autopilot.ts --continue-from ${outcomeJsonFile} --run`), true);
  assert.equal(lines.includes(`Outcome-Sidecar: ${outcomeJsonFile}`), true);
  assert.equal(lines.includes(`Naechster Befehl: node tools/recording-autopilot.ts --continue-from ${outcomeJsonFile} --run`), true);
});

test("buildRecordingAutopilotHistoryMarkdown documents timeline and review blockers", () => {
  const report = buildRecordingAutopilotHistoryReport([
    {
      timestamp: "2026-06-03T10:05:00.000Z",
      mode: "run",
      status: "needs-review",
      reason: "Workflow-Run braucht Review: no-ui-snapshot.",
      findings: ["no-ui-snapshot"],
      command: "node tools/recording-next.ts --auto-only --run",
      outcomeJsonFile: "/workspace/docs/recordings/recording-autopilot-outcome.json",
      nextReportJsonFile: "/workspace/docs/recordings/recording-autopilot-report.json",
      nextCommand: "node tools/recording-workflow.ts --mode auto --purpose quality-baseline",
      workflowRun: {
        logFile: "/workspace/logs/network/002-workflow.jsonl",
        manifestFile: "/workspace/docs/recordings/002-workflow-manifest.json",
        newEndpointCount: 0,
        newKnownInventoryCount: 0,
      },
      runEvidence: {
        status: "needs-review",
        reason: "Workflow-Run braucht Review: no-ui-snapshot.",
        findings: ["no-ui-snapshot"],
      },
      learning: {
        status: "needs-review",
        recommendedAction: "record-quality-baseline",
      },
    },
  ], new Date("2026-06-03T12:00:00.000Z"));

  const markdown = buildRecordingAutopilotHistoryMarkdown(report);

  assert.match(markdown, /^# Recording-Autopilot-History/m);
  assert.match(markdown, /Eintraege: 1/);
  assert.match(markdown, /002-workflow\.jsonl/);
  assert.doesNotMatch(markdown, /\.webm/);
  assert.doesNotMatch(markdown, /\bVideo\b/);
  assert.match(markdown, /needs-review/);
  assert.match(markdown, /no-ui-snapshot/);
  assert.match(markdown, /record-quality-baseline/);
});

test("readRecordingAutopilotHistory ignores invalid or empty JSONL lines", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-read-"));
  const file = path.join(dir, "history.jsonl");
  fs.writeFileSync(file, [
    "",
    "{\"timestamp\":\"2026-06-03T10:00:00.000Z\",\"status\":\"ready\"}",
    "kein-json",
    "{\"timestamp\":\"2026-06-03T10:05:00.000Z\",\"status\":\"blocked\"}",
    "",
  ].join("\n"));

  const entries = readRecordingAutopilotHistory(file);

  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((entry) => entry.status), ["ready", "blocked"]);
});

test("writeRecordingAutopilotHistoryReport writes markdown and JSON sidecar", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-write-"));
  const outputFile = path.join(dir, "autopilot-history.md");
  const report = buildRecordingAutopilotHistoryReport([], new Date("2026-06-03T12:00:00.000Z"));

  writeRecordingAutopilotHistoryReport(report, outputFile);

  assert.match(fs.readFileSync(outputFile, "utf8"), /Keine Autopilot-History gefunden/);
  const sidecar = JSON.parse(fs.readFileSync(path.join(dir, "autopilot-history.json"), "utf8"));
  assert.equal(sidecar.entryCount, 0);
});

test("parseRecordingAutopilotReportArgs defaults to docs recording outputs", () => {
  const options = parseRecordingAutopilotReportArgs([]);

  assert.match(options.historyJsonlFile, /docs\/recordings\/recording-autopilot-history\.jsonl$/);
  assert.match(options.outputFile, /docs\/recordings\/recording-autopilot-history\.md$/);
  assert.equal(options.requireRunnable, false);
  assert.equal(options.maxOutcomeAgeMinutes, 120);
});

test("recording autopilot report help request is handled before report side effects", () => {
  assert.equal(typeof recordingAutopilotReportModule.isRecordingAutopilotReportHelpRequest, "function");
  assert.equal(typeof recordingAutopilotReportModule.buildRecordingAutopilotReportHelp, "function");
  assert.equal(recordingAutopilotReportModule.isRecordingAutopilotReportHelpRequest(["--help"]), true);
  assert.equal(recordingAutopilotReportModule.isRecordingAutopilotReportHelpRequest(["-h"]), true);
  assert.equal(recordingAutopilotReportModule.isRecordingAutopilotReportHelpRequest(["--require-runnable"]), false);

  const help = recordingAutopilotReportModule.buildRecordingAutopilotReportHelp();

  assert.match(help, /^Recording-Autopilot-History-Report/m);
  assert.match(help, /--history-jsonl/);
  assert.match(help, /--out/);
  assert.match(help, /--require-runnable/);
  assert.match(help, /--max-outcome-age-minutes/);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-help-"));
  const outputFile = path.join(dir, "history.md");
  const result = spawnSync(process.execPath, [
    "tools/recording-autopilot-report.ts",
    "--help",
    "--out",
    outputFile,
  ], {
    cwd: path.resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^Recording-Autopilot-History-Report/m);
  assert.equal(fs.existsSync(outputFile), false);
});

test("parseRecordingAutopilotReportArgs rejects unknown flags before writing reports", () => {
  assert.throws(
    () => parseRecordingAutopilotReportArgs(["--histroy-jsonl", "tmp/history.jsonl"]),
    /Unbekannte Recording-Autopilot-Report-Option: --histroy-jsonl/,
  );
  assert.throws(
    () => parseRecordingAutopilotReportArgs(["--unknown-flag"]),
    /Unbekannte Recording-Autopilot-Report-Option: --unknown-flag/,
  );
});

test("parseRecordingAutopilotReportArgs supports a runnable gate for automations", () => {
  const options = parseRecordingAutopilotReportArgs(["--require-runnable", "--max-outcome-age-minutes", "30"]);

  assert.equal(options.requireRunnable, true);
  assert.equal(options.maxOutcomeAgeMinutes, 30);
});

test("recording autopilot report exits nonzero when runnable gate is required but stale", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-gate-"));
  const historyJsonl = path.join(dir, "history.jsonl");
  const outputFile = path.join(dir, "history.md");
  fs.writeFileSync(historyJsonl, `${JSON.stringify({
    timestamp: "2026-06-03T10:00:00.000Z",
    mode: "dry-run",
    status: "ready",
    reason: "Continue preview",
    command: "node tools/recording-autopilot.ts --continue-from outcome.json --run",
    continueCommand: "node tools/recording-autopilot.ts --continue-from outcome.json --run",
    outcomeFresh: false,
    outcomeAgeMinutes: 180,
    outcomeMaxAgeMinutes: 120,
  })}\n`);

  const result = spawnSync(process.execPath, [
    "tools/recording-autopilot-report.ts",
    "--history-jsonl",
    historyJsonl,
    "--out",
    outputFile,
    "--require-runnable",
  ], {
    cwd: path.resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Startfreigabe: nein/);
  assert.match(result.stdout, /Outcome-Fortsetzung: stale \(180\/120 min\)/);
  assert.match(fs.readFileSync(outputFile, "utf8"), /Startfreigabe: nein/);
});

test("recording autopilot report keeps zero exit when runnable gate is not required", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-report-no-gate-"));
  const historyJsonl = path.join(dir, "history.jsonl");
  const outputFile = path.join(dir, "history.md");
  fs.writeFileSync(historyJsonl, `${JSON.stringify({
    timestamp: "2026-06-03T10:00:00.000Z",
    mode: "dry-run",
    status: "ready",
    reason: "Continue preview",
    command: "node tools/recording-autopilot.ts --continue-from outcome.json --run",
    continueCommand: "node tools/recording-autopilot.ts --continue-from outcome.json --run",
    outcomeFresh: false,
    outcomeAgeMinutes: 180,
    outcomeMaxAgeMinutes: 120,
  })}\n`);

  const result = spawnSync(process.execPath, [
    "tools/recording-autopilot-report.ts",
    "--history-jsonl",
    historyJsonl,
    "--out",
    outputFile,
  ], {
    cwd: path.resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Startfreigabe: nein/);
});
