import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildRecordingAutopilotHelp,
  buildRecordingAutopilotOutcome,
  formatRecordingAutopilotCliLines,
  isRecordingAutopilotHelpRequest,
  parseRecordingAutopilotArgs,
  recordingAutopilotExitCode,
  recordingAutopilotNextArgs,
  runRecordingAutopilot,
} from "./recording-autopilot.ts";

test("recording autopilot help request is handled before any side effects", () => {
  assert.equal(isRecordingAutopilotHelpRequest(["--help"]), true);
  assert.equal(isRecordingAutopilotHelpRequest(["-h"]), true);
  assert.equal(isRecordingAutopilotHelpRequest(["--run"]), false);

  const help = buildRecordingAutopilotHelp();

  assert.match(help, /^Recording-Autopilot/m);
  assert.match(help, /--continue-from/);
  assert.match(help, /--run/);
  assert.match(help, /--preflight/);
  assert.match(help, /--history-jsonl/);
  assert.match(help, /--url/);
  assert.match(help, /recording-autopilot-outcome\.json/);
});

test("parseRecordingAutopilotArgs rejects unknown flags before updating sidecars", () => {
  assert.throws(
    () => parseRecordingAutopilotArgs(["--contine-from", "docs/recordings/recording-autopilot-outcome.json"]),
    /Unbekannte Recording-Autopilot-Option: --contine-from/,
  );
  assert.throws(
    () => parseRecordingAutopilotArgs(["--run", "--unknown-flag"]),
    /Unbekannte Recording-Autopilot-Option: --unknown-flag/,
  );
});

test("formatRecordingAutopilotCliLines prefers gated continuation over direct workflow command", () => {
  const lines = formatRecordingAutopilotCliLines({
    mode: "dry-run",
    command: "node tools/recording-next.ts --refresh-campaign --auto-only",
    nextArgs: [],
    nextResult: {
      status: "dry-run",
      reason: "Dry-Run",
      command: "node tools/recording-workflow.ts --mode auto",
      recommendation: null,
    },
    outcome: {
      status: "ready",
      reason: "Dry-Run",
      findings: [],
      nextCommand: "node tools/recording-workflow.ts --mode auto",
    },
    outcomeJsonFile: "docs/recordings/recording-autopilot-outcome.json",
    continueCommand: "node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run",
  });

  assert.equal(
    lines.find((line) => line.startsWith("Recording-Autopilot-Next-Command:")),
    "Recording-Autopilot-Next-Command: node tools/recording-autopilot.ts --continue-from docs/recordings/recording-autopilot-outcome.json --run",
  );
  assert.equal(
    lines.find((line) => line.startsWith("Recording-Autopilot-Workflow-Command:")),
    "Recording-Autopilot-Workflow-Command: node tools/recording-workflow.ts --mode auto",
  );
  assert.equal(lines.some((line) => line === "Recording-Autopilot-Next-Command: node tools/recording-workflow.ts --mode auto"), false);
});

test("parseRecordingAutopilotArgs defaults to safe auto-only dry-run", () => {
  const options = parseRecordingAutopilotArgs([]);

  assert.equal(options.run, false);
  assert.equal(options.preflight, false);
  assert.equal(options.autoOnly, true);
  assert.equal(options.allowManual, false);
  assert.equal(options.refreshCampaign, true);
  assert.equal(options.repeat, 3);
  assert.match(options.reportFile, /docs\/recordings\/recording-autopilot-report\.md$/);
  assert.match(options.reportJsonFile, /docs\/recordings\/recording-autopilot-report\.json$/);
  assert.match(options.outcomeJsonFile, /docs\/recordings\/recording-autopilot-outcome\.json$/);
});

test("parseRecordingAutopilotArgs reads a continuation sidecar path", () => {
  const options = parseRecordingAutopilotArgs(["--continue-from", "tmp/autopilot-outcome.json"]);

  assert.equal(options.continueFromFile?.endsWith("tmp/autopilot-outcome.json"), true);
  assert.equal(options.run, false);
});

test("parseRecordingAutopilotArgs reads an optional history JSONL path", () => {
  const options = parseRecordingAutopilotArgs(["--history-jsonl", "tmp/autopilot-history.jsonl"]);

  assert.equal(options.historyJsonlFile?.endsWith("tmp/autopilot-history.jsonl"), true);
  assert.equal(options.historyReportFile?.endsWith("tmp/autopilot-history.md"), true);
});

test("parseRecordingAutopilotArgs can override the history report path", () => {
  const options = parseRecordingAutopilotArgs([
    "--history-jsonl",
    "tmp/autopilot-history.jsonl",
    "--history-report",
    "tmp/custom-autopilot-history.md",
  ]);

  assert.equal(options.historyReportFile?.endsWith("tmp/custom-autopilot-history.md"), true);
});

test("recordingAutopilotNextArgs maps preflight runs to recording-next without live execution", () => {
  const options = parseRecordingAutopilotArgs([
    "--preflight",
    "--url",
    "https://omnia.example.test",
    "--runs",
    "4",
    "--report",
    "tmp/autopilot.md",
  ]);

  const args = recordingAutopilotNextArgs(options);

  assert.deepEqual(args, [
    "--refresh-campaign",
    "--auto-only",
    "--preflight",
    "--repeat",
    "4",
    "--url",
    "https://omnia.example.test",
    "--report",
    path.resolve("tmp/autopilot.md"),
    "--report-json",
    path.resolve("tmp/autopilot.json"),
    "--print-run-command",
    "--print-automation-command",
    "--print-learning",
  ]);
});

test("recordingAutopilotNextArgs only allows manual missions when explicitly enabled", () => {
  const args = recordingAutopilotNextArgs(parseRecordingAutopilotArgs([
    "--include-manual",
    "--allow-manual",
    "--run",
    "--runs",
    "2",
  ]));

  assert.equal(args.includes("--auto-only"), false);
  assert.equal(args.includes("--allow-manual"), true);
  assert.equal(args.includes("--run"), true);
  assert.deepEqual(args.slice(args.indexOf("--repeat"), args.indexOf("--repeat") + 2), ["--repeat", "2"]);
});

test("runRecordingAutopilot delegates to recording-next with safe defaults", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-delegate-"));
  const reportFile = path.join(dir, "autopilot.md");
  const reportJsonFile = path.join(dir, "autopilot.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");
  const calls: string[][] = [];

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--url",
    "https://omnia.example.test",
    "--report",
    reportFile,
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
  ]), {
    runNext: async (args) => {
      calls.push(args);
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  assert.equal(result.mode, "dry-run");
  assert.equal(result.outcomeJsonFile, outcomeJsonFile);
  assert.deepEqual(result.nextArgs, calls[0]);
  assert.match(result.command, /^node tools\/recording-next\.ts --refresh-campaign --auto-only/);
  assert.equal(calls[0][calls[0].indexOf("--report") + 1], reportFile);
  assert.equal(calls[0][calls[0].indexOf("--report-json") + 1], reportJsonFile);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].includes("--refresh-campaign"), true);
  assert.equal(calls[0].includes("--auto-only"), true);
  assert.equal(calls[0].includes("--run"), false);
});

test("buildRecordingAutopilotOutcome marks ready next actions as runnable", () => {
  const outcome = buildRecordingAutopilotOutcome({
    status: "dry-run",
    summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
    nextAction: {
      runnable: true,
      gate: "ready",
      automationDecision: "bootstrap-recording",
      automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
    },
  });

  assert.equal(outcome.status, "ready");
  assert.equal(outcome.nextCommand, "node tools/recording-workflow.ts --mode auto --purpose bootstrap");
  assert.equal(outcome.reason, "Dry-Run");
});

test("buildRecordingAutopilotOutcome surfaces weak run evidence for review", () => {
  const outcome = buildRecordingAutopilotOutcome({
    status: "executed",
    summary: { stopStatus: "executed", stopReason: "Next-Recording wurde ausgefuehrt." },
    nextAction: {
      runnable: false,
      gate: "blocked",
      gateReason: "Run-Evidenz blockiert Autopilot: no-ui-snapshot.",
      automationDecision: "blocked",
      runEvidence: {
        status: "needs-review",
        reason: "Workflow-Run braucht Review: no-ui-snapshot.",
        findings: ["no-ui-snapshot"],
      },
    },
  });

  assert.equal(outcome.status, "needs-review");
  assert.equal(outcome.reason, "Workflow-Run braucht Review: no-ui-snapshot.");
  assert.deepEqual(outcome.findings, ["no-ui-snapshot"]);
  assert.equal(outcome.nextCommand, undefined);
});

test("runRecordingAutopilot reads the next report JSON and exposes the outcome", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-outcome-"));
  const reportFile = path.join(dir, "autopilot.md");
  const reportJsonFile = path.join(dir, "autopilot.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--report",
    reportFile,
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  assert.equal(result.outcome.status, "ready");
  assert.equal(result.outcome.nextCommand, "node tools/recording-workflow.ts --mode auto --purpose bootstrap");
  assert.equal(result.outcome.reportJsonFile, reportJsonFile);
});

test("runRecordingAutopilot writes a dedicated outcome JSON sidecar", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-outcome-json-"));
  const reportJsonFile = path.join(dir, "next-report.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  const written = JSON.parse(fs.readFileSync(outcomeJsonFile, "utf8"));
  assert.equal(written.status, "ready");
  assert.equal(written.nextCommand, result.outcome.nextCommand);
  assert.equal(written.reportJsonFile, reportJsonFile);
  assert.equal(written.nextReportJsonFile, reportJsonFile);
  assert.deepEqual(written.nextArgs, result.nextArgs);
});

test("runRecordingAutopilot appends outcome decisions to a history JSONL", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-history-"));
  const reportJsonFile = path.join(dir, "next-report.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");
  const historyJsonlFile = path.join(dir, "autopilot-history.jsonl");

  for (let index = 0; index < 2; index += 1) {
    await runRecordingAutopilot(parseRecordingAutopilotArgs([
      "--report-json",
      reportJsonFile,
      "--outcome-json",
      outcomeJsonFile,
      "--history-jsonl",
      historyJsonlFile,
    ]), {
      runNext: async () => {
        fs.writeFileSync(reportJsonFile, `${JSON.stringify({
          status: "dry-run",
          summary: { stopStatus: "dry-run", stopReason: `Dry-Run ${index + 1}` },
          nextAction: {
            runnable: true,
            gate: "ready",
            automationDecision: "bootstrap-recording",
            automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
          },
        })}\n`);
        return {
          status: "dry-run",
          reason: "Dry-Run",
          command: "node tools/recording-workflow.ts --mode auto",
          recommendation: null,
        };
      },
    });
  }

  const entries = fs.readFileSync(historyJsonlFile, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(entries.length, 2);
  assert.equal(entries[0].status, "ready");
  assert.equal(entries[0].reason, "Dry-Run 1");
  assert.equal(entries[0].mode, "dry-run");
  assert.equal(entries[0].outcomeJsonFile, outcomeJsonFile);
  assert.equal(entries[0].nextReportJsonFile, reportJsonFile);
  assert.deepEqual(entries[0].findings, []);
  assert.deepEqual(entries[0].nextArgs, recordingAutopilotNextArgs(parseRecordingAutopilotArgs([
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
    "--history-jsonl",
    historyJsonlFile,
  ])));
  assert.equal(entries[1].reason, "Dry-Run 2");
});

test("runRecordingAutopilot refreshes the history report when history JSONL is enabled", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-history-report-"));
  const reportJsonFile = path.join(dir, "next-report.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");
  const historyJsonlFile = path.join(dir, "autopilot-history.jsonl");
  const historyReportFile = path.join(dir, "autopilot-history.md");

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
    "--history-jsonl",
    historyJsonlFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  assert.equal(result.historyReportFile, historyReportFile);
  assert.match(fs.readFileSync(historyReportFile, "utf8"), /Recording-Autopilot-History/);
  const report = JSON.parse(fs.readFileSync(path.join(dir, "autopilot-history.json"), "utf8"));
  assert.equal(report.entryCount, 1);
  assert.equal(report.readyCount, 1);
});

test("runRecordingAutopilot stores the autopilot continuation in history and report", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-history-continue-"));
  const reportFile = path.join(dir, "next-report.md");
  const reportJsonFile = path.join(dir, "next-report.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");
  const historyJsonlFile = path.join(dir, "autopilot-history.jsonl");
  const historyReportFile = path.join(dir, "autopilot-history.md");

  await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--url",
    "https://omnia.example.test",
    "--runs",
    "4",
    "--report",
    reportFile,
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
    "--history-jsonl",
    historyJsonlFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  const entry = JSON.parse(fs.readFileSync(historyJsonlFile, "utf8").trim());
  assert.equal(entry.continueCommand, `node tools/recording-autopilot.ts --continue-from ${shellQuote(outcomeJsonFile)} --run --history-jsonl ${shellQuote(historyJsonlFile)} --history-report ${shellQuote(historyReportFile)}`);
  assert.deepEqual(entry.continueArgs.slice(0, 4), [
    "tools/recording-autopilot.ts",
    "--continue-from",
    outcomeJsonFile,
    "--run",
  ]);
  assert.equal(entry.continueArgs.includes("--history-jsonl"), true);
  assert.equal(entry.continueArgs.includes("--history-report"), true);

  const report = JSON.parse(fs.readFileSync(path.join(dir, "autopilot-history.json"), "utf8"));
  assert.equal(report.latestCommand, entry.continueCommand);
  assert.match(fs.readFileSync(historyReportFile, "utf8"), /tools\/recording-autopilot\.ts --continue-from/);
});

test("runRecordingAutopilot writes the history report to an explicit path", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-history-report-explicit-"));
  const reportJsonFile = path.join(dir, "next-report.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");
  const historyJsonlFile = path.join(dir, "autopilot-history.jsonl");
  const historyReportFile = path.join(dir, "reports", "autopilot-history.md");

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
    "--history-jsonl",
    historyJsonlFile,
    "--history-report",
    historyReportFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  assert.equal(result.historyReportFile, historyReportFile);
  assert.match(fs.readFileSync(historyReportFile, "utf8"), /Eintraege: 1/);
  assert.equal(fs.existsSync(path.join(dir, "reports", "autopilot-history.json")), true);
});

test("runRecordingAutopilot indexes workflow artifacts from the next report in history JSONL", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-history-index-"));
  const reportJsonFile = path.join(dir, "next-report.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");
  const historyJsonlFile = path.join(dir, "autopilot-history.jsonl");
  const workflowRun = {
    manifestFile: path.join(dir, "workflow-manifest.json"),
    status: "completed",
    purpose: "coverage",
    logFile: path.join(dir, "workflow.jsonl"),
    summaryFile: path.join(dir, "workflow-summary.md"),
    impactFile: path.join(dir, "workflow-impact.md"),
    impactJsonFile: path.join(dir, "workflow-impact.json"),
    targetResponses: 12,
    newEndpointCount: 3,
    newKnownInventoryCount: 2,
    coverageDeltaPercent: 1.5,
    expectedEndpointsObserved: 1,
    expectedEndpointsMissing: 0,
  };
  const runEvidence = {
    status: "ok",
    reason: "Workflow-Run hat verwertbare Aufnahme-Evidenz geliefert.",
    findings: [],
    manifestFile: workflowRun.manifestFile,
    logFile: workflowRun.logFile,
    targetResponses: 12,
  };

  await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--run",
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
    "--history-jsonl",
    historyJsonlFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "executed",
        summary: {
          stopStatus: "executed",
          stopReason: "Next-Recording wurde ausgefuehrt.",
          lastWorkflowRun: workflowRun,
          lastRunEvidence: runEvidence,
        },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "run",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose coverage",
          workflowRun,
          runEvidence,
        },
        learning: {
          status: "ok",
          recommendedAction: "continue-coverage-recording",
          recommendedReason: "Lernstand ist verwertbar; naechste Coverage-Luecke aufnehmen.",
          finalCoveragePercent: 42.5,
          recordingCount: 4,
          recordingsNeedingReview: 0,
          totalNewEndpoints: 12,
          totalNewKnownInventoryEndpoints: 8,
        },
      })}\n`);
      return {
        status: "executed",
        reason: "Next-Recording wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  const entry = JSON.parse(fs.readFileSync(historyJsonlFile, "utf8").trim());
  assert.deepEqual(entry.workflowRun, workflowRun);
  assert.deepEqual(entry.runEvidence, runEvidence);
  assert.equal(entry.learning.status, "ok");
  assert.equal(entry.learning.recommendedAction, "continue-coverage-recording");
  assert.equal(entry.learning.finalCoveragePercent, 42.5);
});

test("runRecordingAutopilot writes a ready continuation command that keeps the autopilot gate", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-continue-"));
  const reportFile = path.join(dir, "autopilot.md");
  const reportJsonFile = path.join(dir, "autopilot.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");

  await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--url",
    "https://omnia.example.test",
    "--runs",
    "4",
    "--report",
    reportFile,
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "dry-run",
        reason: "Dry-Run",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  const written = JSON.parse(fs.readFileSync(outcomeJsonFile, "utf8"));
  assert.equal(written.continueCommand, `node tools/recording-autopilot.ts --continue-from ${shellQuote(outcomeJsonFile)} --run`);
  assert.deepEqual(written.continueArgs, [
    "tools/recording-autopilot.ts",
    "--run",
    "--runs",
    "4",
    "--url",
    "https://omnia.example.test",
    "--report",
    reportFile,
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
  ]);
});

test("runRecordingAutopilot omits continuation command when outcome needs review", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-no-continue-"));
  const reportJsonFile = path.join(dir, "autopilot.json");
  const outcomeJsonFile = path.join(dir, "autopilot-outcome.json");

  await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeJsonFile,
  ]), {
    runNext: async () => {
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "executed",
        summary: { stopStatus: "executed", stopReason: "Run ausgefuehrt." },
        nextAction: {
          runnable: false,
          gate: "blocked",
          gateReason: "Run-Evidenz blockiert Autopilot: no-ui-snapshot.",
          automationDecision: "blocked",
          runEvidence: {
            status: "needs-review",
            reason: "Workflow-Run braucht Review: no-ui-snapshot.",
            findings: ["no-ui-snapshot"],
          },
        },
      })}\n`);
      return {
        status: "executed",
        reason: "Run ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  const written = JSON.parse(fs.readFileSync(outcomeJsonFile, "utf8"));
  assert.equal(written.status, "needs-review");
  assert.equal(written.continueCommand, undefined);
  assert.equal(written.continueArgs, undefined);
});

test("runRecordingAutopilot previews a ready continuation sidecar without executing", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-continue-preview-"));
  const outcomeFile = path.join(dir, "autopilot-outcome.json");
  const historyJsonlFile = path.join(dir, "autopilot-history.jsonl");
  const continueArgs = [
    "tools/recording-autopilot.ts",
    "--run",
    "--runs",
    "3",
    "--url",
    "https://omnia.example.test",
    "--report",
    path.join(dir, "autopilot.md"),
    "--report-json",
    path.join(dir, "autopilot.json"),
    "--outcome-json",
    outcomeFile,
  ];
  fs.writeFileSync(outcomeFile, `${JSON.stringify({
    status: "ready",
    reason: "Dry-Run",
    findings: [],
    continueCommand: `node ${continueArgs.map(shellQuote).join(" ")}`,
    continueArgs,
  })}\n`);
  const calls: string[][] = [];

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs(["--continue-from", outcomeFile]), {
    runNext: async (args) => {
      calls.push(args);
      return {
        status: "executed",
        reason: "Soll im Preview nicht laufen.",
        command: "",
        recommendation: null,
      };
    },
  });

  assert.equal(result.mode, "dry-run");
  assert.equal(result.command, `node ${continueArgs.map(shellQuote).join(" ")}`);
  assert.deepEqual(result.nextArgs, continueArgs);
  assert.equal(result.outcomeJsonFile, outcomeFile);
  assert.equal(result.outcome.status, "ready");
  assert.deepEqual(calls, []);

  const previewResult = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--continue-from",
    outcomeFile,
    "--history-jsonl",
    historyJsonlFile,
  ]));
  const history = fs.readFileSync(historyJsonlFile, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(previewResult.command, `node ${continueArgs.map(shellQuote).join(" ")}`);
  assert.equal(history.length, 1);
  assert.equal(history[0].status, "ready");
  assert.equal(history[0].mode, "dry-run");
  assert.equal(history[0].command, `node ${continueArgs.map(shellQuote).join(" ")}`);
  assert.equal(history[0].outcomeJsonFile, outcomeFile);
});

test("runRecordingAutopilot executes a ready continuation sidecar only with --run", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-continue-run-"));
  const reportJsonFile = path.join(dir, "autopilot.json");
  const outcomeFile = path.join(dir, "autopilot-outcome.json");
  const continueArgs = [
    "tools/recording-autopilot.ts",
    "--run",
    "--runs",
    "2",
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeFile,
  ];
  fs.writeFileSync(outcomeFile, `${JSON.stringify({
    status: "ready",
    reason: "Dry-Run",
    findings: [],
    continueArgs,
  })}\n`);
  const calls: string[][] = [];

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs(["--continue-from", outcomeFile, "--run"]), {
    runNext: async (args) => {
      calls.push(args);
      fs.writeFileSync(reportJsonFile, `${JSON.stringify({
        status: "dry-run",
        summary: { stopStatus: "dry-run", stopReason: "Dry-Run" },
        nextAction: {
          runnable: true,
          gate: "ready",
          automationDecision: "bootstrap-recording",
          automationRunCommand: "node tools/recording-workflow.ts --mode auto --purpose bootstrap",
        },
      })}\n`);
      return {
        status: "executed",
        reason: "Fortsetzung ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto",
        recommendation: null,
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 4), ["--refresh-campaign", "--auto-only", "--run", "--repeat"]);
  assert.equal(result.outcome.status, "ready");
});

test("runRecordingAutopilot blocks stale continuation sidecars before a live run", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-stale-continue-"));
  const outcomeFile = path.join(dir, "autopilot-outcome.json");
  const reportJsonFile = path.join(dir, "autopilot.json");
  const continueArgs = [
    "tools/recording-autopilot.ts",
    "--run",
    "--runs",
    "2",
    "--report-json",
    reportJsonFile,
    "--outcome-json",
    outcomeFile,
  ];
  fs.writeFileSync(outcomeFile, `${JSON.stringify({
    status: "ready",
    reason: "Dry-Run",
    findings: [],
    continueArgs,
  })}\n`);
  const old = new Date(Date.now() - 3 * 60 * 60 * 1000);
  fs.utimesSync(outcomeFile, old, old);
  const calls: string[][] = [];

  const preview = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--continue-from",
    outcomeFile,
    "--max-outcome-age-minutes",
    "60",
  ]), {
    runNext: async (args) => {
      calls.push(args);
      return {
        status: "executed",
        reason: "Soll im Preview nicht laufen.",
        command: "",
        recommendation: null,
      };
    },
  });

  assert.equal(preview.outcome.status, "ready");
  assert.equal(preview.outcomeFresh, false);
  assert.equal(preview.outcomeMaxAgeMinutes, 60);
  assert.equal(typeof preview.outcomeAgeMinutes, "number");
  assert.ok((preview.outcomeAgeMinutes || 0) >= 180);

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs([
    "--continue-from",
    outcomeFile,
    "--run",
    "--max-outcome-age-minutes",
    "60",
  ]), {
    runNext: async (args) => {
      calls.push(args);
      return {
        status: "executed",
        reason: "Soll mit stale Sidecar nicht laufen.",
        command: "",
        recommendation: null,
      };
    },
  });

  assert.equal(result.nextResult.status, "blocked");
  assert.equal(result.outcome.status, "blocked");
  assert.equal(result.outcomeFresh, false);
  assert.match(result.outcome.reason, /Outcome-Sidecar ist zu alt/);
  assert.deepEqual(result.outcome.findings, ["continue-outcome-stale"]);
  assert.deepEqual(calls, []);
});

test("runRecordingAutopilot does not continue a sidecar that needs review", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-autopilot-continue-review-"));
  const outcomeFile = path.join(dir, "autopilot-outcome.json");
  fs.writeFileSync(outcomeFile, `${JSON.stringify({
    status: "needs-review",
    reason: "Workflow-Run braucht Review: no-ui-snapshot.",
    findings: ["no-ui-snapshot"],
  })}\n`);
  const calls: string[][] = [];

  const result = await runRecordingAutopilot(parseRecordingAutopilotArgs(["--continue-from", outcomeFile, "--run"]), {
    runNext: async (args) => {
      calls.push(args);
      return {
        status: "executed",
        reason: "Soll bei Review nicht laufen.",
        command: "",
        recommendation: null,
      };
    },
  });

  assert.equal(result.nextResult.status, "blocked");
  assert.equal(result.outcome.status, "needs-review");
  assert.deepEqual(calls, []);
});

test("recordingAutopilotExitCode keeps ready runs zero and stops review or blocked outcomes", () => {
  assert.equal(recordingAutopilotExitCode({ status: "ready", reason: "ok", findings: [] }), 0);
  assert.equal(recordingAutopilotExitCode({ status: "needs-review", reason: "review", findings: [] }), 2);
  assert.equal(recordingAutopilotExitCode({ status: "blocked", reason: "blocked", findings: [] }), 1);
  assert.equal(recordingAutopilotExitCode({ status: "missing", reason: "missing", findings: [] }), 1);
});

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:=@+-]+$/.test(value) ? value : `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}
