import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildRecordingNextHelp,
  buildRecordingNextReportMarkdown,
  formatRecordingNextResult,
  formatRecordingNextRunCommand,
  isRecordingNextHelpRequest,
  loadNextRecordingRecommendation,
  parseRecordingNextArgs,
  runRecordingNextCli,
  runNextRecording,
  runNextRecordingLoop,
  writeRecordingNextReport,
} from "./recording-next.ts";

test("recording next help request is handled before report side effects", () => {
  assert.equal(isRecordingNextHelpRequest(["--help"]), true);
  assert.equal(isRecordingNextHelpRequest(["-h"]), true);
  assert.equal(isRecordingNextHelpRequest(["--run"]), false);

  const help = buildRecordingNextHelp();

  assert.match(help, /^Recording-Next/m);
  assert.match(help, /--refresh-campaign/);
  assert.match(help, /--auto-only/);
  assert.match(help, /--preflight/);
  assert.match(help, /--run/);
  assert.match(help, /--print-run-command/);
  assert.match(help, /recording-next-report\.json/);
});

test("parseRecordingNextArgs rejects unknown flags before writing reports", () => {
  assert.throws(
    () => parseRecordingNextArgs(["--refesh-campaign"]),
    /Unbekannte Recording-Next-Option: --refesh-campaign/,
  );
  assert.throws(
    () => parseRecordingNextArgs(["--auto-only", "--unknown-flag", "value"]),
    /Unbekannte Recording-Next-Option: --unknown-flag/,
  );
});

test("parseRecordingNextArgs defaults to dry-run with guarded manual execution", () => {
  const options = parseRecordingNextArgs([]);

  assert.equal(options.run, false);
  assert.equal(options.preflight, false);
  assert.equal(options.allowManual, false);
  assert.equal(options.refreshCampaign, false);
  assert.equal(options.repeat, 1);
  assert.match(options.reportFile, /docs\/recordings\/recording-next-report\.md$/);
  assert.match(options.reportJsonFile, /docs\/recordings\/recording-next-report\.json$/);
  assert.match(options.file, /docs\/recordings\/recording-campaign-next\.json$/);
});

test("parseRecordingNextArgs can request a safe preflight of the next recommendation", () => {
  const options = parseRecordingNextArgs(["--auto-only", "--preflight", "--repeat", "3", "--report", "tmp/next-report.md"]);

  assert.equal(options.autoOnly, true);
  assert.equal(options.preflight, true);
  assert.equal(options.repeat, 3);
  assert.equal(options.workflowPreflightFile.endsWith("tmp/next-report-workflow-preflight.md"), true);
  assert.equal(options.workflowPreflightJsonFile.endsWith("tmp/next-report-workflow-preflight.json"), true);
});

test("parseRecordingNextArgs reads an explicit report file", () => {
  const options = parseRecordingNextArgs(["--report", "tmp/next-report.md"]);

  assert.equal(options.reportFile.endsWith("tmp/next-report.md"), true);
  assert.equal(options.reportJsonFile.endsWith("tmp/next-report.json"), true);
});

test("parseRecordingNextArgs reads an explicit JSON report file", () => {
  const options = parseRecordingNextArgs(["--report-json", "tmp/next-machine.json"]);

  assert.equal(options.reportJsonFile.endsWith("tmp/next-machine.json"), true);
});

test("parseRecordingNextArgs reads an explicit scoreboard JSON file", () => {
  const options = parseRecordingNextArgs(["--scoreboard-json", "tmp/scoreboard-machine.json"]);

  assert.equal(options.scoreboardJsonFile.endsWith("tmp/scoreboard-machine.json"), true);
});

test("parseRecordingNextArgs reads a bounded repeat count", () => {
  const options = parseRecordingNextArgs(["--repeat", "3"]);

  assert.equal(options.repeat, 3);
});

test("parseRecordingNextArgs reads an explicit recording URL for campaign refreshes", () => {
  const options = parseRecordingNextArgs(["--refresh-campaign", "--url", "https://omnia.example.test"]);

  assert.equal(options.refreshCampaign, true);
  assert.equal(options.recordingUrl, "https://omnia.example.test");
});

test("parseRecordingNextArgs can print the resolved live run command", () => {
  const options = parseRecordingNextArgs(["--auto-only", "--print-run-command"]);

  assert.equal(options.printRunCommand, true);
});

test("parseRecordingNextArgs can print the resolved automation command", () => {
  const options = parseRecordingNextArgs(["--auto-only", "--print-automation-command"]);

  assert.equal(options.printAutomationCommand, true);
});

test("parseRecordingNextArgs can print the current learning summary", () => {
  const options = parseRecordingNextArgs(["--auto-only", "--print-learning"]);

  assert.equal(options.printLearning, true);
});

test("parseRecordingNextArgs can target the auto-only sidecar", () => {
  const options = parseRecordingNextArgs(["--auto-only"]);

  assert.equal(options.autoOnly, true);
  assert.match(options.file, /docs\/recordings\/recording-campaign-next-auto\.json$/);
});

test("loadNextRecordingRecommendation reads a valid sidecar recommendation", () => {
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });

  const recommendation = loadNextRecordingRecommendation(file);

  assert.equal(recommendation.priority, "Geplanter Recording-Run");
  assert.equal(recommendation.mode, "auto");
  assert.deepEqual(recommendation.args.slice(0, 4), ["tools/recording-workflow.ts", "--mode", "auto", "--stub"]);
});

test("runNextRecording shows the next command without executing by default", async () => {
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file]) }, {
    execute: async (args) => {
      executed.push(args);
    },
  });

  assert.equal(result.status, "dry-run");
  assert.equal(result.command, "node tools/recording-workflow.ts --mode auto --stub");
  assert.deepEqual(executed, []);
});

test("runNextRecording blocks manual recordings unless explicitly allowed", async () => {
  const file = writeNextRecommendation({
    priority: "Quality-Rerun",
    label: "weak.jsonl",
    reason: "Recording-Qualitaet schwach.",
    mode: "manual",
    command: 'node tools/recording-workflow.ts --mode manual --steps "Nachfahren"',
    args: ["tools/recording-workflow.ts", "--mode", "manual", "--steps", "Nachfahren"],
  });
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgsWithoutLearning(["--file", file, "--run"]) }, {
    execute: async (args) => {
      executed.push(args);
    },
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /--allow-manual/);
  assert.deepEqual(executed, []);
});

test("runNextRecording blocks manual recordings in auto-only mode even when manual is allowed", async () => {
  const file = writeNextRecommendation({
    priority: "Quality-Rerun",
    label: "weak.jsonl",
    reason: "Recording-Qualitaet schwach.",
    mode: "manual",
    command: 'node tools/recording-workflow.ts --mode manual --steps "Nachfahren"',
    args: ["tools/recording-workflow.ts", "--mode", "manual", "--steps", "Nachfahren"],
  });
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--auto-only", "--run", "--allow-manual"]) }, {
    execute: async (args) => {
      executed.push(args);
    },
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /Auto-only/);
  assert.deepEqual(executed, []);
});

test("formatRecordingNextResult prints the block reason instead of a runnable command", () => {
  const text = formatRecordingNextResult({
    status: "blocked",
    reason: "Manuelle Aufnahme nur mit --allow-manual ausfuehren.",
    command: 'node tools/recording-workflow.ts --mode manual --steps "Nachfahren"',
    recommendation: {
      priority: "Quality-Rerun",
      label: "weak.jsonl",
      reason: "Recording-Qualitaet schwach.",
      mode: "manual",
      command: 'node tools/recording-workflow.ts --mode manual --steps "Nachfahren"',
      args: ["tools/recording-workflow.ts", "--mode", "manual"],
    },
  });

  assert.equal(text, "Manuelle Aufnahme nur mit --allow-manual ausfuehren.");
});

test("runNextRecording executes an allowed auto recommendation with bootstrap purpose when learning is missing", async () => {
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgsWithoutLearning(["--file", file, "--run"]) }, {
    execute: async (args) => {
      executed.push(args);
    },
  });

  assert.equal(result.status, "executed");
  assert.equal(result.command, "node tools/recording-workflow.ts --mode auto --stub --purpose bootstrap");
  assert.deepEqual(executed, [["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--purpose", "bootstrap"]]);
});

test("runNextRecording attaches the completed workflow manifest and impact to the next report", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-workflow-run-"));
  const manifestFile = path.join(dir, "workflow-manifest.json");
  const summaryFile = path.join(dir, "workflow-summary.md");
  const logFile = path.join(dir, "workflow.jsonl");
  const impactFile = path.join(dir, "workflow-impact.md");
  const nextReportFile = path.join(dir, "next.md");
  const nextReportJsonFile = path.join(dir, "next.json");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --stub --manifest ${manifestFile}`,
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--manifest", manifestFile],
  });

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
    execute: async (args) => {
      const writtenManifestFile = args[args.indexOf("--manifest") + 1];
      fs.writeFileSync(writtenManifestFile, `${JSON.stringify({
        schemaVersion: 1,
        mode: "auto",
        purpose: "bootstrap",
        status: "completed",
        auditStatus: "passed",
        artifacts: {
          logFile,
          summaryFile,
          impactFile,
          impactJsonFile: path.join(dir, "workflow-impact.json"),
        },
        expectedEndpoints: [
          { method: "GET", path: "/customers", observed: true },
          { method: "POST", path: "/customers/search", observed: false },
        ],
        impact: {
          targetResponses: 12,
          targetEndpointCount: 5,
          newEndpointCount: 2,
          newKnownInventoryCount: 1,
          coverageDeltaPercent: 0.5,
          downloads: 1,
          topAreas: [{ area: "Kunden/Vorgaenge", endpointCount: 5, newEndpointCount: 2, responseCount: 12 }],
        },
        explorer: {
          startUrl: "https://omnia.example.test/master-data/customers",
          finalUrl: "https://omnia.example.test/master-data/customers/1",
          stopReason: "max-steps",
          clickedTargets: 7,
          skippedTargets: 2,
          blockedRequests: 1,
          discoveredTargets: 9,
          openTargets: 3,
          topOpenTargets: [],
        },
      }, null, 2)}\n`);
    },
  });

  assert.equal(result.status, "executed");
  assert.equal(result.workflowRun?.manifestFile, manifestFile);
  assert.equal(result.workflowRun?.status, "completed");
  assert.equal(result.workflowRun?.purpose, "bootstrap");
  assert.equal(result.workflowRun?.logFile, logFile);
  assert.equal(result.workflowRun?.newEndpointCount, 2);
  assert.equal(result.workflowRun?.newKnownInventoryCount, 1);
  assert.equal(result.workflowRun?.coverageDeltaPercent, 0.5);
  assert.equal(result.workflowRun?.expectedEndpointsObserved, 1);
  assert.equal(result.workflowRun?.expectedEndpointsMissing, 1);
  assert.equal(result.workflowRun?.explorerClickedTargets, 7);

  writeRecordingNextReport({ status: "executed", results: [result] }, nextReportFile, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: true,
    autoOnly: true,
    repeat: 1,
    sourceFile: file,
    jsonFile: nextReportJsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(nextReportJsonFile, "utf8"));
  assert.equal(parsed.summary.lastWorkflowRun.manifestFile, manifestFile);
  assert.equal(parsed.summary.lastWorkflowRun.newEndpointCount, 2);
  assert.equal(parsed.nextAction.workflowRun.manifestFile, manifestFile);
  assert.equal(parsed.nextAction.workflowRun.expectedEndpointsMissing, 1);
  assert.match(fs.readFileSync(nextReportFile, "utf8"), /Workflow-Run/);
  assert.match(fs.readFileSync(nextReportFile, "utf8"), /Neue Endpunkte: 2/);
});

test("runNextRecording marks executed runs without workflow manifest as missing run evidence", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-missing-evidence-"));
  const nextReportFile = path.join(dir, "next.md");
  const nextReportJsonFile = path.join(dir, "next.json");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
    execute: async () => {},
  });

  assert.equal(result.status, "executed");
  assert.equal(result.runEvidence?.status, "missing");
  assert.deepEqual(result.runEvidence?.findings, ["workflow-manifest-missing"]);

  writeRecordingNextReport({ status: "executed", results: [result] }, nextReportFile, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: true,
    autoOnly: true,
    repeat: 1,
    sourceFile: file,
    jsonFile: nextReportJsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(nextReportJsonFile, "utf8"));
  assert.equal(parsed.summary.lastRunEvidence.status, "missing");
  assert.deepEqual(parsed.nextAction.runEvidence.findings, ["workflow-manifest-missing"]);
  assert.match(fs.readFileSync(nextReportFile, "utf8"), /Run-Evidenz/);
  assert.match(fs.readFileSync(nextReportFile, "utf8"), /workflow-manifest-missing/);
});

test("runNextRecording marks a missing log artifact even when the manifest names it", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-missing-artifacts-"));
  const manifestFile = path.join(dir, "workflow-manifest.json");
  const logFile = path.join(dir, "workflow.jsonl");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --stub --manifest ${manifestFile}`,
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--manifest", manifestFile],
  });

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
    execute: async () => {
      fs.writeFileSync(manifestFile, `${JSON.stringify({
        schemaVersion: 1,
        mode: "auto",
        status: "completed",
        artifacts: { logFile },
        impact: { targetResponses: 3, targetEndpointCount: 2 },
      }, null, 2)}\n`);
    },
  });

  assert.equal(result.runEvidence?.status, "needs-review");
  assert.equal(result.runEvidence?.findings.includes("network-log-missing"), true);
  assert.equal(result.runEvidence?.findings.includes("video-missing"), false);
});

test("runNextRecording marks logs without response records as no-api-response even when manifest impact has responses", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-log-content-"));
  const manifestFile = path.join(dir, "workflow-manifest.json");
  const logFile = path.join(dir, "workflow.jsonl");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --stub --manifest ${manifestFile}`,
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--manifest", manifestFile],
  });

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
    execute: async () => {
      fs.writeFileSync(logFile, [
        JSON.stringify({ type: "flow-marker", marker: "step-start", step: "Kunden" }),
        JSON.stringify({ type: "ui-snapshot", routePath: "/customers", title: "Kunden" }),
        JSON.stringify({ type: "request", method: "GET", url: "https://omnia.example.test/apigateway/customers", resourceType: "xhr" }),
        "",
      ].join("\n"));
      fs.writeFileSync(manifestFile, `${JSON.stringify({
        schemaVersion: 1,
        mode: "auto",
        status: "completed",
        artifacts: { logFile },
        impact: { targetResponses: 3, targetEndpointCount: 2 },
      }, null, 2)}\n`);
    },
  });

  assert.equal(result.runEvidence?.status, "needs-review");
  assert.deepEqual(result.runEvidence?.findings, ["no-api-response"]);
  assert.equal(result.runEvidence?.targetResponses, 0);
});

test("runNextRecording marks logs without timeline markers and UI snapshots as weak evidence", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-log-context-"));
  const manifestFile = path.join(dir, "workflow-manifest.json");
  const logFile = path.join(dir, "workflow.jsonl");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --stub --manifest ${manifestFile}`,
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--manifest", manifestFile],
  });

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
    execute: async () => {
      fs.writeFileSync(logFile, `${JSON.stringify({ type: "response", method: "GET", url: "https://omnia.example.test/apigateway/customers", resourceType: "xhr", status: 200 })}\n`);
      fs.writeFileSync(manifestFile, `${JSON.stringify({
        schemaVersion: 1,
        mode: "auto",
        status: "completed",
        artifacts: { logFile },
        impact: { targetResponses: 1, targetEndpointCount: 1 },
      }, null, 2)}\n`);
    },
  });

  assert.equal(result.runEvidence?.status, "needs-review");
  assert.deepEqual(result.runEvidence?.findings, ["no-timeline-marker", "no-ui-snapshot"]);
  assert.equal(result.runEvidence?.targetResponses, 1);
});

test("runNextRecording keeps complete logs with API response, marker and UI snapshot as ok evidence", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-log-context-ok-"));
  const manifestFile = path.join(dir, "workflow-manifest.json");
  const logFile = path.join(dir, "workflow.jsonl");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --stub --manifest ${manifestFile}`,
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--manifest", manifestFile],
  });

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
    execute: async () => {
      fs.writeFileSync(logFile, [
        JSON.stringify({ type: "flow-marker", marker: "step-start", step: "Kunden" }),
        JSON.stringify({ type: "ui-snapshot", routePath: "/customers", title: "Kunden" }),
        JSON.stringify({ type: "response", method: "GET", url: "https://omnia.example.test/apigateway/customers", resourceType: "xhr", status: 200 }),
        "",
      ].join("\n"));
      fs.writeFileSync(manifestFile, `${JSON.stringify({
        schemaVersion: 1,
        mode: "auto",
        status: "completed",
        artifacts: { logFile },
        impact: { targetResponses: 1, targetEndpointCount: 1 },
      }, null, 2)}\n`);
    },
  });

  assert.equal(result.runEvidence?.status, "ok");
  assert.deepEqual(result.runEvidence?.findings, []);
  assert.equal(result.runEvidence?.targetResponses, 1);
});

test("runNextRecording detects a newly written default workflow manifest when the recommendation has no manifest arg", async () => {
  const recordingsDir = path.join(process.cwd(), "docs", "recordings");
  const manifestFile = path.join(recordingsDir, `${Date.now()}-${Math.random().toString(36).slice(2)}-workflow-manifest.json`);
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });

  try {
    const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }, {
      execute: async () => {
        fs.mkdirSync(recordingsDir, { recursive: true });
        fs.writeFileSync(manifestFile, `${JSON.stringify({
          schemaVersion: 1,
          mode: "auto",
          status: "completed",
          artifacts: { logFile: "logs/network/default-workflow.jsonl" },
          impact: { newEndpointCount: 1, coverageDeltaPercent: 0.25 },
        }, null, 2)}\n`);
      },
    });

    assert.equal(result.workflowRun?.manifestFile, manifestFile);
    assert.equal(result.workflowRun?.newEndpointCount, 1);
    assert.equal(result.workflowRun?.coverageDeltaPercent, 0.25);
  } finally {
    fs.rmSync(manifestFile, { force: true });
  }
});

test("runNextRecording executes an allowed auto recommendation with quality-baseline purpose when recordings need review", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-run-learning-"));
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
  const scoreboardJsonFile = path.join(dir, "recording-scoreboard.json");
  fs.writeFileSync(scoreboardJsonFile, `${JSON.stringify({
    recordingCount: 1,
    recordingsNeedingReview: 1,
    entries: [{ file: "logs/network/weak.jsonl", qualityStatus: "needs-review" }],
  })}\n`);
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run", "--scoreboard-json", scoreboardJsonFile]) }, {
    execute: async (args) => {
      executed.push(args);
    },
  });

  assert.equal(result.status, "executed");
  assert.equal(result.command, "node tools/recording-workflow.ts --mode auto --stub --purpose quality-baseline");
  assert.deepEqual(executed, [["tools/recording-workflow.ts", "--mode", "auto", "--stub", "--purpose", "quality-baseline"]]);
});

test("runNextRecording passes an explicit URL to campaign refresh without starting a recording", async () => {
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --url https://old.example.test --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://old.example.test", "--stub"],
  });
  const refreshes: string[][] = [];
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--refresh-campaign", "--url", "https://omnia.example.test"]) }, {
    refreshCampaign: async (args) => {
      refreshes.push(args);
    },
    execute: async (args) => {
      executed.push(args);
    },
  });

  assert.equal(result.status, "dry-run");
  assert.deepEqual(refreshes, [["tools/recording-campaign.ts", "--url", "https://omnia.example.test"]]);
  assert.deepEqual(executed, []);
});

test("runNextRecording preflights an allowed auto recommendation without starting the live workflow", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-preflight-"));
  const workflowPreflightFile = path.join(dir, "workflow-preflight.md");
  const workflowPreflightJsonFile = path.join(dir, "workflow-preflight.json");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgsWithoutLearning(["--file", file, "--preflight", "--auto-only"]) }, {
    execute: async (args) => {
      executed.push(args);
      const jsonPath = args[args.indexOf("--preflight-json") + 1];
      fs.writeFileSync(jsonPath, `${JSON.stringify({
        status: "ready",
        runCommand: "node tools/recording-workflow.ts --mode auto --stub",
        runArgs: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
        checks: [{ name: "Ziel", status: "ready" }],
      })}\n`);
    },
    workflowPreflightFile,
    workflowPreflightJsonFile,
  });

  assert.equal(result.status, "preflighted");
  assert.match(result.reason, /Preflight/);
  assert.deepEqual(executed, [[
    "tools/recording-workflow.ts",
    "--mode",
    "auto",
    "--stub",
    "--purpose",
    "bootstrap",
    "--preflight",
    "--preflight-out",
    workflowPreflightFile,
    "--preflight-json",
    workflowPreflightJsonFile,
  ]]);
  assert.equal(result.command, `node tools/recording-workflow.ts --mode auto --stub --purpose bootstrap --preflight --preflight-out ${workflowPreflightFile} --preflight-json ${workflowPreflightJsonFile}`);
  assert.deepEqual(result.workflowPreflight, {
    file: workflowPreflightFile,
    jsonFile: workflowPreflightJsonFile,
    status: "ready",
    runCommand: "node tools/recording-workflow.ts --mode auto --stub",
    runArgs: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
});

test("runNextRecording reports blocked workflow preflight even when the workflow process exits nonzero", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-preflight-blocked-"));
  const workflowPreflightFile = path.join(dir, "workflow-preflight.md");
  const workflowPreflightJsonFile = path.join(dir, "workflow-preflight.json");
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto",
    args: ["tools/recording-workflow.ts", "--mode", "auto"],
  });
  const executed: string[][] = [];

  const result = await runNextRecording({ ...parseRecordingNextArgsWithoutLearning(["--file", file, "--preflight", "--auto-only"]) }, {
    execute: async (args) => {
      executed.push(args);
      const jsonPath = args[args.indexOf("--preflight-json") + 1];
      fs.writeFileSync(jsonPath, `${JSON.stringify({
        status: "blocked",
        runCommand: "node tools/recording-workflow.ts --mode auto",
        runArgs: ["tools/recording-workflow.ts", "--mode", "auto"],
        checks: [{ name: "Ziel", status: "blocked", detail: "Weder --url noch --cdp ist gesetzt." }],
      })}\n`);
      throw new Error("Command failed with exit code 1");
    },
    workflowPreflightFile,
    workflowPreflightJsonFile,
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /Workflow-Preflight/);
  assert.deepEqual(executed, [[
    "tools/recording-workflow.ts",
    "--mode",
    "auto",
    "--purpose",
    "bootstrap",
    "--preflight",
    "--preflight-out",
    workflowPreflightFile,
    "--preflight-json",
    workflowPreflightJsonFile,
  ]]);
  assert.equal(result.command, `node tools/recording-workflow.ts --mode auto --purpose bootstrap --preflight --preflight-out ${workflowPreflightFile} --preflight-json ${workflowPreflightJsonFile}`);
  assert.deepEqual(result.workflowPreflight, {
    file: workflowPreflightFile,
    jsonFile: workflowPreflightJsonFile,
    status: "blocked",
    runCommand: "node tools/recording-workflow.ts --mode auto",
    runArgs: ["tools/recording-workflow.ts", "--mode", "auto"],
  });
});

test("runNextRecording rejects sidecars that would execute arbitrary tools", async () => {
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Fremdkommando",
    reason: "ungueltig",
    mode: "auto",
    command: "node tools/other.ts",
    args: ["tools/other.ts"],
  });

  await assert.rejects(
    () => runNextRecording({ ...parseRecordingNextArgs(["--file", file, "--run"]) }),
    /tools\/recording-workflow\.ts/,
  );
});

test("runNextRecordingLoop keeps repeat dry-runs to one non-executing preview", async () => {
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
  const executed: string[][] = [];

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--repeat", "3"]) }, {
    execute: async (args) => executed.push(args),
  });

  assert.equal(loop.status, "dry-run");
  assert.equal(loop.results.length, 1);
  assert.equal(loop.results[0].status, "dry-run");
  assert.deepEqual(executed, []);
});

test("runNextRecordingLoop keeps preflight runs to one non-recording check", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-preflight-"));
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
  });
  const executed: string[][] = [];

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--preflight", "--repeat", "3"]) }, {
    execute: async (args) => {
      executed.push(args);
      const jsonPath = args[args.indexOf("--preflight-json") + 1];
      fs.writeFileSync(jsonPath, `${JSON.stringify({ status: "ready" })}\n`);
    },
    workflowPreflightFile: path.join(dir, "workflow-preflight.md"),
    workflowPreflightJsonFile: path.join(dir, "workflow-preflight.json"),
  });

  assert.equal(loop.status, "preflighted");
  assert.equal(loop.results.length, 1);
  assert.equal(loop.results[0].status, "preflighted");
  assert.equal(executed[0].includes("--preflight-out"), true);
  assert.equal(executed[0].includes("--preflight-json"), true);
  assert.equal(loop.results[0].workflowPreflight?.status, "ready");
});

test("runNextRecordingLoop refreshes and executes auto recommendations until the repeat limit", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-loop-"));
  const file = path.join(dir, "recording-campaign-next-auto.json");
  const recommendations = [
    recommendation("Kunden", `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${path.join(dir, "kunden-workflow-manifest.json")}`),
    recommendation("Wawi", `node tools/recording-workflow.ts --mode auto --start-path /wawi --manifest ${path.join(dir, "wawi-workflow-manifest.json")}`),
  ];
  let refreshes = 0;
  const executed: string[][] = [];
  fs.writeFileSync(file, `${JSON.stringify(recommendations[0], null, 2)}\n`);

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--auto-only", "--run", "--repeat", "2"]) }, {
    refreshCampaign: async () => {
      fs.writeFileSync(file, `${JSON.stringify(recommendations[Math.min(refreshes + 1, recommendations.length - 1)], null, 2)}\n`);
      refreshes += 1;
    },
    execute: async (args) => {
      executed.push(args);
      writeOkWorkflowManifestFromArgs(args);
    },
  });

  assert.equal(loop.status, "executed");
  assert.deepEqual(
    loop.results.map((result) => result.recommendation?.label),
    ["Kunden", "Wawi"],
  );
  assert.equal(executed[0].includes("--manifest"), true);
  assert.equal(executed[1].includes("--manifest"), true);
  assert.equal(refreshes, 1);
});

test("runNextRecordingLoop stops when the refreshed recommendation repeats", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-loop-repeat-"));
  const file = writeNextRecommendation(
    recommendation("Kunden", `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${path.join(dir, "kunden-workflow-manifest.json")}`),
  );
  const executed: string[][] = [];
  let refreshes = 0;

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgsWithoutLearning(["--file", file, "--auto-only", "--run", "--repeat", "3"]) }, {
    refreshCampaign: async () => {
      fs.writeFileSync(file, `${JSON.stringify(recommendation("Kunden", `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${path.join(dir, "kunden-workflow-manifest.json")}`), null, 2)}\n`);
      refreshes += 1;
    },
    execute: async (args) => {
      executed.push(args);
      writeOkWorkflowManifestFromArgs(args);
    },
  });

  assert.equal(loop.status, "stalled");
  assert.deepEqual(
    loop.results.map((result) => result.status),
    ["executed", "stalled"],
  );
  assert.equal(executed.length, 1);
  assert.equal(executed[0].includes("--manifest"), true);
  assert.equal(refreshes, 1);
});

test("runNextRecordingLoop stops repeat runs after an executed run without evidence", async () => {
  const file = writeNextRecommendation(
    recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --start-path /customers"),
  );
  const executed: string[][] = [];
  let refreshes = 0;

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgsWithoutLearning(["--file", file, "--auto-only", "--run", "--repeat", "3"]) }, {
    execute: async (args) => executed.push(args),
    refreshCampaign: async () => {
      refreshes += 1;
      fs.writeFileSync(file, `${JSON.stringify(recommendation("Wawi", "node tools/recording-workflow.ts --mode auto --start-path /wawi"), null, 2)}\n`);
    },
  });

  assert.equal(loop.status, "executed");
  assert.equal(loop.results.length, 1);
  assert.equal(loop.results[0].runEvidence?.status, "missing");
  assert.deepEqual(executed, [["tools/recording-workflow.ts", "--mode", "auto", "--start-path", "/customers", "--purpose", "bootstrap"]]);
  assert.equal(refreshes, 0);
});

test("runNextRecordingLoop treats repeated recommendations as stalled even when learning changes the auto purpose", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-loop-purpose-"));
  const file = path.join(dir, "recording-campaign-next-auto.json");
  const scoreboardJsonFile = path.join(dir, "recording-scoreboard.json");
  const sameRecommendation = recommendation("Kunden", `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${path.join(dir, "kunden-workflow-manifest.json")}`);
  fs.writeFileSync(file, `${JSON.stringify(sameRecommendation, null, 2)}\n`);
  const executed: string[][] = [];
  let refreshes = 0;

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--auto-only", "--run", "--repeat", "3", "--scoreboard-json", scoreboardJsonFile]) }, {
    refreshCampaign: async () => {
      fs.writeFileSync(file, `${JSON.stringify(sameRecommendation, null, 2)}\n`);
      refreshes += 1;
    },
    execute: async (args) => {
      executed.push(args);
      writeOkWorkflowManifestFromArgs(args);
      fs.writeFileSync(scoreboardJsonFile, `${JSON.stringify({
        recordingCount: 1,
        recordingsNeedingReview: 1,
        entries: [{ file: "logs/network/weak.jsonl", qualityStatus: "needs-review" }],
      })}\n`);
    },
  });

  assert.equal(loop.status, "stalled");
  assert.deepEqual(
    loop.results.map((result) => result.status),
    ["executed", "stalled"],
  );
  assert.equal(executed.length, 1);
  assert.equal(executed[0].includes("--manifest"), true);
  assert.match(loop.results[1].command, /--purpose quality-baseline/);
  assert.equal(refreshes, 1);
});

test("runNextRecordingLoop treats repeated recommendation args as stalled even when command formatting changes", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-loop-args-key-"));
  const file = path.join(dir, "recording-campaign-next-auto.json");
  const manifestFile = path.join(dir, "kunden-workflow-manifest.json");
  const firstRecommendation = {
    priority: "Geplanter Recording-Run",
    label: "Kunden",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --start-path "/customers" --manifest ${manifestFile}`,
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--start-path", "/customers", "--manifest", manifestFile],
  };
  const refreshedRecommendation = {
    ...firstRecommendation,
    command: `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${manifestFile}`,
  };
  fs.writeFileSync(file, `${JSON.stringify(firstRecommendation, null, 2)}\n`);
  const executed: string[][] = [];
  let refreshes = 0;

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--auto-only", "--run", "--repeat", "3"]) }, {
    refreshCampaign: async () => {
      fs.writeFileSync(file, `${JSON.stringify(refreshedRecommendation, null, 2)}\n`);
      refreshes += 1;
    },
    execute: async (args) => {
      executed.push(args);
      writeOkWorkflowManifestFromArgs(args);
    },
  });

  assert.equal(loop.status, "stalled");
  assert.deepEqual(
    loop.results.map((result) => result.status),
    ["executed", "stalled"],
  );
  assert.equal(executed.length, 1);
  assert.equal(executed[0].includes("--manifest"), true);
  assert.equal(refreshes, 1);
});

test("runNextRecordingLoop treats repeated recommendation args as stalled even when the refreshed recommendation has an explicit purpose", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-loop-explicit-purpose-"));
  const file = path.join(dir, "recording-campaign-next-auto.json");
  const manifestFile = path.join(dir, "kunden-workflow-manifest.json");
  const baseArgs = ["tools/recording-workflow.ts", "--mode", "auto", "--start-path", "/customers", "--manifest", manifestFile];
  const firstRecommendation = {
    priority: "Geplanter Recording-Run",
    label: "Kunden",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${manifestFile}`,
    args: baseArgs,
  };
  const refreshedRecommendation = {
    ...firstRecommendation,
    command: `node tools/recording-workflow.ts --mode auto --start-path /customers --manifest ${manifestFile} --purpose coverage`,
    args: [...baseArgs, "--purpose", "coverage"],
  };
  fs.writeFileSync(file, `${JSON.stringify(firstRecommendation, null, 2)}\n`);
  const executed: string[][] = [];
  let refreshes = 0;

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--auto-only", "--run", "--repeat", "3"]) }, {
    refreshCampaign: async () => {
      fs.writeFileSync(file, `${JSON.stringify(refreshedRecommendation, null, 2)}\n`);
      refreshes += 1;
    },
    execute: async (args) => {
      executed.push(args);
      writeOkWorkflowManifestFromArgs(args);
    },
  });

  assert.equal(loop.status, "stalled");
  assert.deepEqual(
    loop.results.map((result) => result.status),
    ["executed", "stalled"],
  );
  assert.equal(executed.length, 1);
  assert.equal(executed[0].includes("--manifest"), true);
  assert.equal(refreshes, 1);
});

test("runNextRecordingLoop stops after a blocked iteration", async () => {
  const file = writeNextRecommendation({
    priority: "Quality-Rerun",
    label: "weak.jsonl",
    reason: "Recording-Qualitaet schwach.",
    mode: "manual",
    command: 'node tools/recording-workflow.ts --mode manual --steps "Nachfahren"',
    args: ["tools/recording-workflow.ts", "--mode", "manual", "--steps", "Nachfahren"],
  });

  const loop = await runNextRecordingLoop({ ...parseRecordingNextArgs(["--file", file, "--run", "--repeat", "3"]) });

  assert.equal(loop.status, "blocked");
  assert.equal(loop.results.length, 1);
  assert.equal(loop.results[0].status, "blocked");
});

test("buildRecordingNextReportMarkdown documents loop status and iteration commands", () => {
  const loop = {
    status: "stalled" as const,
    results: [
      {
        status: "executed" as const,
        reason: "Next-Recording wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --start-path /customers",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --start-path /customers") as never,
      },
      {
        status: "stalled" as const,
        reason: "Auto-Pilot gestoppt: Campaign liefert erneut dieselbe Recording-Empfehlung.",
        command: "node tools/recording-workflow.ts --mode auto --start-path /customers",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --start-path /customers") as never,
      },
    ],
  };

  const markdown = buildRecordingNextReportMarkdown(loop, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: true,
    autoOnly: true,
    repeat: 3,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
  });

  assert.match(markdown, /^# Recording-Next-Report/m);
  assert.match(markdown, /Status: stalled/);
  assert.match(markdown, /Auto-only: ja/);
  assert.match(markdown, /Repeat-Limit: 3/);
  assert.match(markdown, /Kunden/);
  assert.match(markdown, /Auto-Pilot gestoppt/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode auto --start-path \/customers/);
});

test("buildRecordingNextReportMarkdown links workflow preflight artifacts when present", () => {
  const loop = {
    status: "preflighted" as const,
    results: [
      {
        status: "preflighted" as const,
        reason: "Next-Recording-Preflight wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --preflight",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto") as never,
        workflowPreflight: {
          file: "/workspace/tmp/next-workflow-preflight.md",
          jsonFile: "/workspace/tmp/next-workflow-preflight.json",
          status: "ready",
          runCommand: "node tools/recording-workflow.ts --mode auto --stub",
          runArgs: ["tools/recording-workflow.ts", "--mode", "auto", "--stub"],
        },
      },
    ],
  };

  const markdown = buildRecordingNextReportMarkdown(loop, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    preflight: true,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
  });

  assert.match(markdown, /Workflow-Preflight-Status: ready/);
  assert.match(markdown, /next-workflow-preflight\.md/);
  assert.match(markdown, /next-workflow-preflight\.json/);
  assert.match(markdown, /Workflow-Startbefehl/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode auto --stub/);
});

test("writeRecordingNextReport exposes workflow run command after preflight", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-report-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const loop = {
    status: "preflighted" as const,
    results: [
      {
        status: "preflighted" as const,
        reason: "Next-Recording-Preflight wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub --preflight",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
        workflowPreflight: {
          file: "/workspace/tmp/next-workflow-preflight.md",
          jsonFile: "/workspace/tmp/next-workflow-preflight.json",
          status: "ready",
          runCommand: "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub",
          runArgs: ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"],
        },
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    preflight: true,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
    refreshCampaign: true,
    recordingUrl: "https://omnia.example.test",
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.results[0].workflowPreflight.runCommand, "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub");
  assert.deepEqual(parsed.results[0].workflowPreflight.runArgs, ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"]);
  assert.equal(parsed.nextAction.command, "node tools/recording-workflow.ts --mode auto --stub --preflight");
  assert.equal(parsed.nextAction.runCommand, "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub");
  assert.deepEqual(parsed.nextAction.runArgs, ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"]);
  assert.equal(parsed.nextAction.automationRunCommand, "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub --purpose bootstrap");
  assert.deepEqual(parsed.nextAction.automationRunArgs, ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub", "--purpose", "bootstrap"]);
  assert.equal(parsed.nextAction.targetUrl, "https://omnia.example.test");
  assert.equal(parsed.summary.campaignRefreshed, true);
  assert.equal(parsed.options.refreshCampaign, true);
  assert.equal(parsed.options.recordingUrl, "https://omnia.example.test");
  assert.equal(parsed.nextAction.runnable, true);
  assert.equal(parsed.nextAction.gate, "ready");
  assert.doesNotMatch(parsed.nextAction.runCommand, /--preflight(?:\s|$)/);
  assert.equal(parsed.nextAction.runArgs.includes("--preflight"), false);
});

test("formatRecordingNextRunCommand prefers the preflight run command and respects the action gate", () => {
  const readyLoop = {
    status: "preflighted" as const,
    results: [
      {
        status: "preflighted" as const,
        reason: "Next-Recording-Preflight wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --preflight",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
        workflowPreflight: {
          file: "/workspace/tmp/next-workflow-preflight.md",
          jsonFile: "/workspace/tmp/next-workflow-preflight.json",
          status: "ready",
          runCommand: "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub",
          runArgs: ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"],
        },
      },
    ],
  };
  const blockedLoop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Export pruefen"',
        recommendation: {
          priority: "Manuelle Mission",
          label: "Export manuell aufnehmen",
          reason: "Export-Flow braucht Bedienung.",
          mode: "manual",
          command: 'node tools/recording-workflow.ts --mode manual --steps "Export pruefen"',
          args: ["tools/recording-workflow.ts", "--mode", "manual", "--steps", "Export pruefen"],
        } as never,
      },
    ],
  };

  assert.equal(
    formatRecordingNextRunCommand(readyLoop, {
      run: false,
      preflight: true,
      autoOnly: true,
      repeat: 1,
      sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
      recordingUrl: "https://omnia.example.test",
    }),
    "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub",
  );
  assert.equal(
    formatRecordingNextRunCommand(blockedLoop, {
      run: false,
      autoOnly: false,
      allowManual: false,
      repeat: 1,
      sourceFile: "/workspace/docs/recordings/recording-campaign-next.json",
    }),
    "",
  );
});

test("runRecordingNextCli prints the resolved live run command when requested", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-print-"));
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"],
  });
  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (value?: unknown) => {
    lines.push(String(value));
  };

  try {
    await runRecordingNextCli([
      "--file",
      file,
      "--report",
      path.join(dir, "next.md"),
      "--print-run-command",
    ]);
  } finally {
    console.log = originalLog;
  }

  assert.equal(
    lines.includes("Recording-Run-Command: node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub"),
    true,
  );
});

test("runRecordingNextCli prints the resolved automation command when requested", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-automation-print-"));
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"],
  });
  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (value?: unknown) => {
    lines.push(String(value));
  };

  try {
    await runRecordingNextCli([
      "--file",
      file,
      "--report",
      path.join(dir, "next.md"),
      "--scoreboard-json",
      missingLearningScoreboardFile(),
      "--print-automation-command",
    ]);
  } finally {
    console.log = originalLog;
  }

  assert.equal(
    lines.includes("Recording-Automation-Command: node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub --purpose bootstrap"),
    true,
  );
});

test("runRecordingNextCli prints the compact learning summary when requested", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-learning-print-"));
  const file = writeNextRecommendation({
    priority: "Geplanter Recording-Run",
    label: "Kundenstamm aufnehmen",
    reason: "Coverage-Luecke.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --url https://omnia.example.test --stub",
    args: ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"],
  });
  const scoreboardJsonFile = path.join(dir, "recording-scoreboard.json");
  fs.writeFileSync(scoreboardJsonFile, `${JSON.stringify({
    recordingCount: 3,
    recordingsNeedingReview: 1,
    finalCoveragePercent: 42.5,
    totalNewEndpoints: 12,
    totalNewKnownInventoryEndpoints: 8,
    expectedEndpointHitRatePercent: 66.67,
    totalExplorerClickedTargets: 30,
    totalExplorerOpenTargets: 5,
    entries: [
      {
        file: "logs/network/latest.jsonl",
        purpose: "quality-baseline",
        qualityStatus: "ok",
        newEndpoints: 4,
        newKnownInventoryEndpoints: 3,
        coverageDeltaPercent: 7.5,
        expectedEndpointsObserved: 2,
        expectedEndpointsMissing: 1,
        explorerClickedTargets: 9,
        explorerOpenTargets: 2,
        topAreas: ["Kunden/Vorgaenge"],
      },
    ],
  }, null, 2)}\n`);
  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (value?: unknown) => {
    lines.push(String(value));
  };

  try {
    await runRecordingNextCli([
      "--file",
      file,
      "--report",
      path.join(dir, "next.md"),
      "--scoreboard-json",
      scoreboardJsonFile,
      "--print-learning",
    ]);
  } finally {
    console.log = originalLog;
  }

  assert.equal(
    lines.includes("Recording-Learning: Status needs-review, Aktion record-quality-baseline, Coverage 42.5 %, Recordings 3, Review 1, neue Endpunkte 12, Inventar 8, letzter Beitrag 4/3, Delta 7.5 %, Qualitaet ok, Zweck quality-baseline"),
    true,
  );
});

test("writeRecordingNextReport blocks next action when workflow preflight is blocked", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-report-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const loop = {
    status: "preflighted" as const,
    results: [
      {
        status: "preflighted" as const,
        reason: "Next-Recording-Preflight wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --preflight",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto") as never,
        workflowPreflight: {
          file: "/workspace/tmp/next-workflow-preflight.md",
          jsonFile: "/workspace/tmp/next-workflow-preflight.json",
          status: "blocked",
          runCommand: "node tools/recording-workflow.ts --mode auto",
          runArgs: ["tools/recording-workflow.ts", "--mode", "auto"],
        },
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    preflight: true,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.nextAction.runnable, false);
  assert.equal(parsed.nextAction.gate, "blocked");
  assert.match(parsed.nextAction.gateReason, /Workflow-Preflight/);
  assert.equal(parsed.nextAction.runCommand, "node tools/recording-workflow.ts --mode auto");
  assert.deepEqual(parsed.nextAction.runArgs, ["tools/recording-workflow.ts", "--mode", "auto"]);
});

test("writeRecordingNextReport blocks next action when the last executed run has weak evidence", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-run-evidence-gate-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const loop = {
    status: "executed" as const,
    results: [
      {
        status: "executed" as const,
        reason: "Next-Recording wurde ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
        runEvidence: {
          status: "missing" as const,
          reason: "Workflow-Manifest wurde nach dem Run nicht gefunden.",
          findings: ["workflow-manifest-missing"],
        },
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: true,
    autoOnly: true,
    repeat: 3,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.nextAction.runnable, false);
  assert.equal(parsed.nextAction.gate, "blocked");
  assert.match(parsed.nextAction.gateReason, /Run-Evidenz/);
  assert.equal(parsed.nextAction.automationDecision, "blocked");
  assert.match(parsed.nextAction.automationDecisionReason, /workflow-manifest-missing/);
  assert.equal(parsed.summary.lastRunEvidence.status, "missing");
});

test("writeRecordingNextReport writes the markdown report", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-report-"));
  const file = path.join(dir, "next.md");
  const loop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
  });

  assert.match(fs.readFileSync(file, "utf8"), /Status: dry-run/);
});

test("writeRecordingNextReport writes the machine-readable JSON sidecar", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-report-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const loop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.status, "dry-run");
  assert.deepEqual(parsed.summary, {
    iterationCount: 1,
    campaignRefreshed: false,
    executedCount: 0,
    dryRunCount: 1,
    preflightedCount: 0,
    blockedCount: 0,
    stalledCount: 0,
    missingCount: 0,
    stopStatus: "dry-run",
    stopReason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
    lastCommand: "node tools/recording-workflow.ts --mode auto --stub",
  });
  assert.equal(parsed.options.autoOnly, true);
  assert.equal(parsed.results[0].recommendation.label, "Kunden");
  assert.equal(parsed.results[0].command, "node tools/recording-workflow.ts --mode auto --stub");
});

test("writeRecordingNextReport includes compact learning state from scoreboard JSON", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-learning-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const scoreboardJsonFile = path.join(dir, "recording-scoreboard.json");
  fs.writeFileSync(scoreboardJsonFile, `${JSON.stringify({
    recordingCount: 3,
    recordingsNeedingReview: 1,
    finalCoveragePercent: 42.5,
    totalNewEndpoints: 12,
    totalNewKnownInventoryEndpoints: 8,
    expectedEndpointHitRatePercent: 66.67,
    totalExplorerClickedTargets: 30,
    totalExplorerOpenTargets: 5,
    entries: [
      {
        file: "logs/network/001.jsonl",
        qualityStatus: "needs-review",
        newEndpoints: 0,
        newKnownInventoryEndpoints: 0,
        coverageDeltaPercent: 0,
        expectedEndpoints: 0,
        expectedEndpointsObserved: 0,
        expectedEndpointsMissing: 0,
        explorerClickedTargets: 0,
        explorerOpenTargets: 0,
        topAreas: [],
      },
      {
        file: "logs/network/latest.jsonl",
        purpose: "quality-baseline",
        qualityStatus: "ok",
        newEndpoints: 4,
        newKnownInventoryEndpoints: 3,
        coverageDeltaPercent: 7.5,
        expectedEndpoints: 3,
        expectedEndpointsObserved: 2,
        expectedEndpointsMissing: 1,
        explorerClickedTargets: 9,
        explorerOpenTargets: 2,
        topAreas: ["Kunden/Vorgaenge", "Artikel/Warenbestand"],
      },
    ],
  }, null, 2)}\n`);
  const loop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
    scoreboardJsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.deepEqual(parsed.learning, {
    status: "needs-review",
    recommendedAction: "record-quality-baseline",
    recommendedReason: "Recordings brauchen Review; neue Aufnahme mit UI-Snapshots priorisieren.",
    sourceFile: scoreboardJsonFile,
    recordingCount: 3,
    recordingsNeedingReview: 1,
    finalCoveragePercent: 42.5,
    totalNewEndpoints: 12,
    totalNewKnownInventoryEndpoints: 8,
    expectedEndpointHitRatePercent: 66.67,
    totalExplorerClickedTargets: 30,
    totalExplorerOpenTargets: 5,
    lastRecording: {
      file: "logs/network/latest.jsonl",
      purpose: "quality-baseline",
      qualityStatus: "ok",
      newEndpoints: 4,
      newKnownInventoryEndpoints: 3,
      coverageDeltaPercent: 7.5,
      expectedEndpointsObserved: 2,
      expectedEndpointsMissing: 1,
      explorerClickedTargets: 9,
      explorerOpenTargets: 2,
      topAreas: ["Kunden/Vorgaenge", "Artikel/Warenbestand"],
    },
  });
  assert.equal(parsed.nextAction.learningStatus, "needs-review");
  assert.equal(parsed.nextAction.learningRecommendedAction, "record-quality-baseline");
  assert.equal(parsed.nextAction.learningRecommendedReason, "Recordings brauchen Review; neue Aufnahme mit UI-Snapshots priorisieren.");
  assert.equal(parsed.nextAction.qualityGate, "needs-review");
  assert.equal(parsed.nextAction.qualityGateReason, "Recordings brauchen Review; neue Aufnahme mit UI-Snapshots priorisieren.");
  assert.equal(parsed.nextAction.automationDecision, "record-quality-baseline");
  assert.equal(parsed.nextAction.automationDecisionReason, "Recordings brauchen Review; neue Aufnahme mit UI-Snapshots priorisieren.");
  assert.equal(parsed.nextAction.automationRunArgs[parsed.nextAction.automationRunArgs.indexOf("--purpose") + 1], "quality-baseline");
  assert.match(parsed.nextAction.automationRunCommand, /--purpose quality-baseline/);
});

test("writeRecordingNextReport marks learning status ok when no recordings need review", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-learning-ok-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const scoreboardJsonFile = path.join(dir, "recording-scoreboard.json");
  fs.writeFileSync(scoreboardJsonFile, `${JSON.stringify({
    recordingCount: 2,
    recordingsNeedingReview: 0,
    finalCoveragePercent: 75,
    totalNewEndpoints: 20,
    totalNewKnownInventoryEndpoints: 15,
    expectedEndpointHitRatePercent: 100,
    totalExplorerClickedTargets: 12,
    totalExplorerOpenTargets: 1,
    entries: [],
  }, null, 2)}\n`);
  const loop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub",
        recommendation: recommendation("Kunden", "node tools/recording-workflow.ts --mode auto --stub") as never,
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
    scoreboardJsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.learning.status, "ok");
  assert.equal(parsed.learning.recommendedAction, "continue-coverage-recording");
  assert.equal(parsed.learning.recommendedReason, "Lernstand ist verwertbar; naechste Coverage-Luecke aufnehmen.");
  assert.equal(parsed.nextAction.qualityGate, "ready");
  assert.equal(parsed.nextAction.qualityGateReason, "Lernstand ist verwertbar; naechste Coverage-Luecke aufnehmen.");
  assert.equal(parsed.nextAction.automationDecision, "run");
  assert.equal(parsed.nextAction.automationDecisionReason, "Technik und Lernstand sind bereit; Recording kann gestartet werden.");
});

test("writeRecordingNextReport exposes the next action without shell parsing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-report-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const loop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: "node tools/recording-workflow.ts --mode auto --stub --max-steps 180 --max-minutes 20 --start-path /master-data/customers --expect-endpoint \"GET /customers\" --expect-endpoint \"POST /customers/search\"",
        recommendation: {
          priority: "Geplanter Recording-Run",
          label: "Kunden aufnehmen",
          reason: "Kunden-Coverage fehlt.",
          mode: "auto",
          command: "node tools/recording-workflow.ts --mode auto --stub --max-steps 180 --max-minutes 20 --start-path /master-data/customers --expect-endpoint \"GET /customers\" --expect-endpoint \"POST /customers/search\"",
          args: [
            "tools/recording-workflow.ts",
            "--mode",
            "auto",
            "--stub",
            "--max-steps",
            "180",
            "--max-minutes",
            "20",
            "--start-path",
            "/master-data/customers",
            "--expect-endpoint",
            "GET /customers",
            "--expect-endpoint",
            "POST /customers/search",
          ],
        } as never,
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    autoOnly: true,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next-auto.json",
    jsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.deepEqual(parsed.nextAction, {
    available: true,
    runnable: true,
    gate: "ready",
    qualityGate: "missing-learning",
    qualityGateReason: "Noch kein Recording-Lernstand; erste Aufnahme mit UI-Snapshots starten.",
    automationDecision: "bootstrap-recording",
    automationDecisionReason: "Noch kein Recording-Lernstand; erste Aufnahme mit UI-Snapshots starten.",
    automationRunCommand: "node tools/recording-workflow.ts --mode auto --stub --max-steps 180 --max-minutes 20 --start-path /master-data/customers --expect-endpoint \"GET /customers\" --expect-endpoint \"POST /customers/search\" --purpose bootstrap",
    automationRunArgs: [
      "tools/recording-workflow.ts",
      "--mode",
      "auto",
      "--stub",
      "--max-steps",
      "180",
      "--max-minutes",
      "20",
      "--start-path",
      "/master-data/customers",
      "--expect-endpoint",
      "GET /customers",
      "--expect-endpoint",
      "POST /customers/search",
      "--purpose",
      "bootstrap",
    ],
    status: "dry-run",
    priority: "Geplanter Recording-Run",
    label: "Kunden aufnehmen",
    reason: "Kunden-Coverage fehlt.",
    mode: "auto",
    command: "node tools/recording-workflow.ts --mode auto --stub --max-steps 180 --max-minutes 20 --start-path /master-data/customers --expect-endpoint \"GET /customers\" --expect-endpoint \"POST /customers/search\"",
    args: [
      "tools/recording-workflow.ts",
      "--mode",
      "auto",
      "--stub",
      "--max-steps",
      "180",
      "--max-minutes",
      "20",
      "--start-path",
      "/master-data/customers",
      "--expect-endpoint",
      "GET /customers",
      "--expect-endpoint",
      "POST /customers/search",
    ],
    startPath: "/master-data/customers",
    maxSteps: 180,
    maxMinutes: 20,
    expectedEndpoints: [
      { method: "GET", path: "/customers" },
      { method: "POST", path: "/customers/search" },
    ],
  });
});

test("writeRecordingNextReport marks manual next actions as requiring approval", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-report-"));
  const file = path.join(dir, "next.md");
  const jsonFile = path.join(dir, "next-machine.json");
  const loop = {
    status: "dry-run" as const,
    results: [
      {
        status: "dry-run" as const,
        reason: "Dry-Run: Empfehlung wurde nicht ausgefuehrt.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Export pruefen"',
        recommendation: {
          priority: "Manuelle Mission",
          label: "Export manuell aufnehmen",
          reason: "Export-Flow braucht Bedienung.",
          mode: "manual",
          command: 'node tools/recording-workflow.ts --mode manual --steps "Export pruefen"',
          args: ["tools/recording-workflow.ts", "--mode", "manual", "--steps", "Export pruefen"],
        } as never,
      },
    ],
  };

  writeRecordingNextReport(loop, file, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    run: false,
    autoOnly: false,
    allowManual: false,
    repeat: 1,
    sourceFile: "/workspace/docs/recordings/recording-campaign-next.json",
    jsonFile,
  });

  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.nextAction.available, true);
  assert.equal(parsed.nextAction.runnable, false);
  assert.equal(parsed.nextAction.gate, "manual-approval-required");
  assert.match(parsed.nextAction.gateReason, /--allow-manual/);
});

function writeNextRecommendation(value: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-"));
  const file = path.join(dir, "recording-campaign-next.json");
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function parseRecordingNextArgsWithoutLearning(argv: string[]) {
  return parseRecordingNextArgs([...argv, "--scoreboard-json", missingLearningScoreboardFile()]);
}

function missingLearningScoreboardFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-next-no-learning-"));
  return path.join(dir, "recording-scoreboard.json");
}

function writeOkWorkflowManifestFromArgs(args: string[]): void {
  const index = args.indexOf("--manifest");
  assert.notEqual(index, -1);
  const manifestFile = args[index + 1];
  const logFile = path.join(path.dirname(manifestFile), `${path.basename(manifestFile, ".json")}.jsonl`);
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  fs.writeFileSync(logFile, [
    JSON.stringify({ type: "flow-marker", marker: "step-start", step: "Kunden" }),
    JSON.stringify({ type: "ui-snapshot", routePath: "/customers", title: "Kunden" }),
    JSON.stringify({ type: "response", method: "GET", url: "https://omnia.example.test/apigateway/customers", resourceType: "xhr", status: 200 }),
    "",
  ].join("\n"));
  fs.writeFileSync(manifestFile, `${JSON.stringify({
    schemaVersion: 1,
    mode: "auto",
    status: "completed",
    artifacts: {
      logFile,
    },
    expectedEndpoints: [],
    impact: {
      targetResponses: 1,
      targetEndpointCount: 1,
      newEndpointCount: 1,
      newKnownInventoryCount: 1,
      coverageDeltaPercent: 1,
      downloads: 0,
      topAreas: [{ area: "Kunden/Vorgaenge", endpointCount: 1, newEndpointCount: 1, responseCount: 1 }],
    },
    explorer: {
      clickedTargets: 1,
      openTargets: 0,
      blockedRequests: 0,
      stopReason: "max-steps",
    },
  }, null, 2)}\n`);
}

function recommendation(label: string, command: string): unknown {
  const parts = command.split(" ");
  const args = parts.slice(1).map((part) => part.replace(/^"|"$/g, ""));
  return {
    priority: "Geplanter Recording-Run",
    label,
    reason: "Coverage-Luecke.",
    mode: "auto",
    command,
    args,
  };
}
