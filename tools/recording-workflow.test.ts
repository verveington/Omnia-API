import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendWorkflowUiSnapshot,
  automatedLoginConfigFromEnv,
  buildRecordingExplorerStats,
  buildRecordingWorkflowHelp,
  buildRecordingWorkflowPostProcessingPlan,
  buildRecordingWorkflowPreflight,
  buildRecordingWorkflowPreflightMarkdown,
  buildRecordingWorkflowRunArgs,
  recordingWorkflowPreflightExitCode,
  buildRecordingWorkflowAuditFiles,
  buildRecordingWorkflowManifest,
  buildRecordingWorkflowSummaryMarkdown,
  createRecordingWorkflowLogPath,
  evaluateExpectedEndpoints,
  isRecordingWorkflowHelpRequest,
  parseRecordingWorkflowArgs,
  writeRecordingWorkflowPreflight,
} from "./recording-workflow.ts";
import { REDACTED } from "./redact.ts";

test("recording workflow help request is handled before any recording side effects", () => {
  assert.equal(isRecordingWorkflowHelpRequest(["--help"]), true);
  assert.equal(isRecordingWorkflowHelpRequest(["-h"]), true);
  assert.equal(isRecordingWorkflowHelpRequest(["--mode", "manual"]), false);

  const help = buildRecordingWorkflowHelp();

  assert.match(help, /^Recording-Workflow/m);
  assert.match(help, /--preflight/);
  assert.match(help, /--mode manual/);
  assert.match(help, /--mode auto/);
  assert.match(help, /--wait-for-login/);
  assert.match(help, /--capture-bodies/);
  assert.match(help, /--expect-endpoint/);
  assert.match(help, /--resolve-test-customer/);
  assert.doesNotMatch(help, /Video/);
  assert.match(help, /API-Katalog/);
});

test("parseRecordingWorkflowArgs rejects unknown flags before a recording can start", () => {
  assert.throws(
    () => parseRecordingWorkflowArgs(["--hlep"]),
    /Unbekannte Recording-Workflow-Option: --hlep/,
  );
  assert.throws(
    () => parseRecordingWorkflowArgs(["--mode", "auto", "--unknown-flag", "value"]),
    /Unbekannte Recording-Workflow-Option: --unknown-flag/,
  );
  assert.throws(
    () => parseRecordingWorkflowArgs(["--video"]),
    /Unbekannte Recording-Workflow-Option: --video/,
  );
  assert.throws(
    () => parseRecordingWorkflowArgs(["--video-dir", "logs/video"]),
    /Unbekannte Recording-Workflow-Option: --video-dir/,
  );
});

test("parseRecordingWorkflowArgs defaults to manual recording with post-processing and no video artifact", () => {
  const options = parseRecordingWorkflowArgs([]);

  assert.equal(options.mode, "manual");
  assert.equal("recordVideo" in options, false);
  assert.equal("videoDir" in options, false);
  assert.equal(options.captureBodies, true);
  assert.equal(options.rebuildCatalog, true);
  assert.equal(options.rebuildCoverageReport, true);
  assert.equal(options.rebuildKnowledgeReport, true);
  assert.equal(options.rebuildRelationships, true);
  assert.equal(options.rebuildDataModel, true);
  assert.equal(options.rebuildBlueprint, true);
  assert.equal(options.rebuildUiMap, true);
  assert.equal(options.rebuildScoreboard, true);
  assert.equal(options.rebuildCampaign, true);
  assert.equal(options.writeImpactReport, true);
  assert.equal(options.runAudit, true);
  assert.equal(options.preflightOnly, false);
  assert.match(options.logFile, /logs\/network\/.+-workflow\.jsonl$/);
  assert.match(options.summaryFile, /docs\/recordings\/.+-workflow-summary\.md$/);
  assert.match(options.manifestFile, /docs\/recordings\/.+-workflow-manifest\.json$/);
  assert.match(options.explorerReportFile, /docs\/recordings\/.+-workflow-explorer\.md$/);
  assert.match(options.auditFile, /docs\/recordings\/.+-workflow-audit\.md$/);
  assert.match(options.knowledgeReportFile, /docs\/10_omnia_knowledge\.md$/);
  assert.match(options.relationshipsFile, /docs\/12_omnia_relationships\.md$/);
  assert.match(options.dataModelFile, /docs\/13_omnia_data_model\.md$/);
  assert.match(options.blueprintFile, /docs\/11_platform_blueprint\.md$/);
  assert.match(options.uiMapFile, /docs\/14_omnia_ui_map\.md$/);
  assert.match(options.scoreboardFile, /docs\/recordings\/recording-scoreboard\.md$/);
  assert.match(options.campaignFile, /docs\/recordings\/recording-campaign\.md$/);
  assert.match(options.impactFile, /docs\/recordings\/.+-impact\.md$/);
});

test("parseRecordingWorkflowArgs supports automatic read-only exploration flags", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "auto",
    "--purpose",
    "quality-baseline",
    "--stub",
    "--wait-for-login",
    "--max-steps",
    "25",
    "--max-minutes",
    "3",
    "--settle-ms",
    "250",
    "--auto-flow",
    "all-targeted-read",
    "--start-path",
    "/dashboard",
    "--test-customer",
    "Max Mustermann",
    "--test-article",
    "Musterartikel",
    "--search-term",
    "Max Mustermann",
    "--strict-test-object",
    "--resolve-test-customer",
    "--out",
    "tmp/auto-workflow.jsonl",
    "--explorer-report",
    "tmp/auto-explorer.md",
    "--manifest",
    "tmp/auto-manifest.json",
    "--no-catalog",
    "--no-coverage",
    "--no-knowledge",
    "--no-relationships",
    "--no-data-model",
    "--no-blueprint",
    "--no-ui-map",
    "--no-scoreboard",
    "--no-campaign",
    "--no-impact",
    "--no-audit",
  ]);

  assert.equal(options.mode, "auto");
  assert.equal(options.purpose, "quality-baseline");
  assert.equal(options.useElectronStub, true);
  assert.equal(options.waitForLogin, true);
  assert.equal(options.maxSteps, 25);
  assert.equal(options.maxMinutes, 3);
  assert.equal(options.settleMs, 250);
  assert.equal(options.autoFlow, "all-targeted-read");
  assert.equal(options.startPath, "/dashboard");
  assert.equal(options.testCustomer, "Max Mustermann");
  assert.equal(options.testArticle, "Musterartikel");
  assert.equal(options.genericSearchTerm, "Max Mustermann");
  assert.equal(options.strictTestObject, true);
  assert.equal(options.resolveTestCustomer, true);
  assert.equal(options.rebuildCatalog, false);
  assert.equal(options.rebuildCoverageReport, false);
  assert.equal(options.rebuildKnowledgeReport, false);
  assert.equal(options.rebuildRelationships, false);
  assert.equal(options.rebuildDataModel, false);
  assert.equal(options.rebuildBlueprint, false);
  assert.equal(options.rebuildUiMap, false);
  assert.equal(options.rebuildScoreboard, false);
  assert.equal(options.rebuildCampaign, false);
  assert.equal(options.writeImpactReport, false);
  assert.equal(options.runAudit, false);
  assert.equal(options.logFile.endsWith("tmp/auto-workflow.jsonl"), true);
  assert.equal(options.explorerReportFile.endsWith("tmp/auto-explorer.md"), true);
  assert.equal(options.manifestFile.endsWith("tmp/auto-manifest.json"), true);

  const runArgs = buildRecordingWorkflowRunArgs(options);
  assert.equal(runArgs[runArgs.indexOf("--auto-flow") + 1], "all-targeted-read");
  assert.equal(runArgs[runArgs.indexOf("--test-customer") + 1], "Max Mustermann");
  assert.equal(runArgs[runArgs.indexOf("--test-article") + 1], "Musterartikel");
  assert.equal(runArgs[runArgs.indexOf("--search-term") + 1], "Max Mustermann");
  assert.equal(runArgs.includes("--strict-test-object"), true);
  assert.equal(runArgs.includes("--resolve-test-customer"), true);
});

test("automatedLoginConfigFromEnv prefers dedicated test-user credentials", () => {
  const config = automatedLoginConfigFromEnv({
    OMNIA_TEST_MANDANT: "502753",
    OMNIA_TEST_USERNAME: "claude",
    OMNIA_TEST_PASSWORD: "secret",
    OMNIA_USERNAME: "other",
    OMNIA_PASSWORD: "other-secret",
  });

  assert.deepEqual(config, {
    tenant: "502753",
    username: "claude",
    password: "secret",
    newPassword: "",
    usernameSelector: "",
    passwordSelector: "",
    tenantSelector: "",
    submitSelector: "",
    changeOldPasswordSelector: "",
    changeNewPasswordSelector: "",
    changeConfirmPasswordSelector: "",
    changeSubmitSelector: "",
  });
});

test("automatedLoginConfigFromEnv carries optional forced password change fields", () => {
  const config = automatedLoginConfigFromEnv({
    OMNIA_TEST_USERNAME: "claude",
    OMNIA_TEST_PASSWORD: "old-secret",
    OMNIA_TEST_NEW_PASSWORD: "new-secret",
    OMNIA_TEST_CHANGE_OLD_PASSWORD_SELECTOR: "#old",
    OMNIA_TEST_CHANGE_NEW_PASSWORD_SELECTOR: "#new",
    OMNIA_TEST_CHANGE_CONFIRM_PASSWORD_SELECTOR: "#confirm",
    OMNIA_TEST_CHANGE_SUBMIT_SELECTOR: "#save",
  });

  assert.equal(config?.newPassword, "new-secret");
  assert.equal(config?.changeOldPasswordSelector, "#old");
  assert.equal(config?.changeNewPasswordSelector, "#new");
  assert.equal(config?.changeConfirmPasswordSelector, "#confirm");
  assert.equal(config?.changeSubmitSelector, "#save");
});

test("automatedLoginConfigFromEnv falls back to existing recorder env names", () => {
  const config = automatedLoginConfigFromEnv({
    OMNIA_USERNAME: "recorder-user",
    OMNIA_PASSWORD: "recorder-secret",
    OMNIA_USERNAME_SELECTOR: "#user",
    OMNIA_PASSWORD_SELECTOR: "#pass",
    OMNIA_SUBMIT_SELECTOR: "#submit",
  });

  assert.equal(config?.username, "recorder-user");
  assert.equal(config?.password, "recorder-secret");
  assert.equal(config?.usernameSelector, "#user");
  assert.equal(config?.passwordSelector, "#pass");
  assert.equal(config?.submitSelector, "#submit");
});

test("automatedLoginConfigFromEnv is disabled without username and password", () => {
  assert.equal(automatedLoginConfigFromEnv({ OMNIA_TEST_USERNAME: "claude" }), null);
  assert.equal(automatedLoginConfigFromEnv({ OMNIA_TEST_PASSWORD: "secret" }), null);
});

test("buildRecordingWorkflowPreflight carries the recording purpose into run args and markdown", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "auto",
    "--purpose",
    "quality-baseline",
    "--url",
    "https://app.optica-omnia.de",
    "--out",
    "tmp/baseline.jsonl",
  ]);

  const preflight = buildRecordingWorkflowPreflight(options, new Date("2026-06-03T12:00:00.000Z"));
  const markdown = buildRecordingWorkflowPreflightMarkdown(preflight);

  assert.equal(preflight.purpose, "quality-baseline");
  assert.match(preflight.runCommand, /--purpose quality-baseline/);
  assert.equal(preflight.runArgs[preflight.runArgs.indexOf("--purpose") + 1], "quality-baseline");
  assert.match(markdown, /Zweck: quality-baseline/);
});

test("buildRecordingWorkflowPreflight redacts sensitive rerun argument values", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "auto",
    "--test-customer",
    "Max Mustermann",
    "--test-article",
    "Musterartikel",
    "--search-term",
    "A123456789",
  ]);
  const preflight = buildRecordingWorkflowPreflight(options, new Date("2026-06-03T12:00:00.000Z"));

  assert.equal(preflight.runArgs[preflight.runArgs.indexOf("--test-customer") + 1], REDACTED);
  assert.equal(preflight.runArgs[preflight.runArgs.indexOf("--search-term") + 1], REDACTED);
  assert.equal(preflight.runArgs[preflight.runArgs.indexOf("--test-article") + 1], "Musterartikel");
  assert.doesNotMatch(preflight.runCommand, /Max Mustermann|A123456789/);
});

test("parseRecordingWorkflowArgs supports preflight-only checks and report path", () => {
  const options = parseRecordingWorkflowArgs([
    "--preflight",
    "--preflight-out",
    "tmp/preflight.md",
    "--preflight-json",
    "tmp/preflight.json",
    "--mode",
    "auto",
    "--stub",
  ]);

  assert.equal(options.preflightOnly, true);
  assert.equal(options.useElectronStub, true);
  assert.equal(options.mode, "auto");
  assert.equal(options.preflightFile.endsWith("tmp/preflight.md"), true);
  assert.equal(options.preflightJsonFile.endsWith("tmp/preflight.json"), true);
});

test("parseRecordingWorkflowArgs reads manual flow steps", () => {
  const options = parseRecordingWorkflowArgs(["--steps", "Kunde suchen,Artikel oeffnen,Export ausloesen"]);

  assert.deepEqual(options.steps, ["Kunde suchen", "Artikel oeffnen", "Export ausloesen"]);
});

test("parseRecordingWorkflowArgs reads repeated expected endpoints", () => {
  const options = parseRecordingWorkflowArgs([
    "--expect-endpoint",
    "POST /salesprocesses/csv-export",
    "--expect-endpoint",
    "GET /route-plannings/{routePlanningUuid}/exports",
  ]);

  assert.deepEqual(options.expectedEndpoints, [
    { method: "POST", path: "/salesprocesses/csv-export", source: "recording-workflow" },
    { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "recording-workflow" },
  ]);
});

test("createRecordingWorkflowLogPath creates stable workflow log names", () => {
  const file = createRecordingWorkflowLogPath(new Date(2026, 5, 3, 14, 7));

  assert.match(file, /logs\/network\/2026-06-03_14-07-workflow\.jsonl$/);
});

test("evaluateExpectedEndpoints matches gateway aliases and parameterized paths", () => {
  const results = evaluateExpectedEndpoints(
    [
      { method: "POST", path: "/salesprocesses/csv-export", source: "test" },
      { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "test" },
      { method: "GET", path: "/cash-book-entries/csv", source: "test" },
    ],
    [
      {
        type: "response",
        method: "POST",
        url: "https://api2.optica-omnia.de/apigateway/kunden/salesprocesses/csv-export",
        status: 200,
        resourceType: "xhr",
      },
      {
        type: "response",
        method: "GET",
        url: "https://api2.optica-omnia.de/apigateway/routes/route-plannings/47d6a13e-88ef-4c0e-9dc3-d5e63d341333/exports",
        status: 200,
        resourceType: "fetch",
      },
    ],
  );

  assert.deepEqual(
    results.map((result) => ({ key: `${result.endpoint.method} ${result.endpoint.path}`, observed: result.observed })),
    [
      { key: "POST /salesprocesses/csv-export", observed: true },
      { key: "GET /route-plannings/{routePlanningUuid}/exports", observed: true },
      { key: "GET /cash-book-entries/csv", observed: false },
    ],
  );
});

test("appendWorkflowUiSnapshot writes redacted UI structure with session and step", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-workflow-ui-snapshot-"));
  const logFile = path.join(dir, "manual.jsonl");
  const page = {
    evaluate: async () => ({
      url: "https://app.optica-omnia.de/customers/123?query=Max%20Mustermann",
      title: "Kunde Max Mustermann",
      headings: ["Kunde Max Mustermann"],
      actions: ["Exportieren"],
      formLabels: ["Name Max Mustermann"],
      tableHeaders: ["Kundennummer"],
    }),
  };

  await appendWorkflowUiSnapshot(page, {
    logFile,
    sessionId: "session-1",
    step: "Kunde Max Mustermann pruefen",
    timestamp: new Date("2026-06-03T12:00:00.000Z"),
  });

  const record = JSON.parse(fs.readFileSync(logFile, "utf8"));
  assert.equal(record.type, "ui-snapshot");
  assert.equal(record.sessionId, "[REDACTED]");
  assert.equal(record.timestamp, "2026-06-03T12:00:00.000Z");
  assert.equal(record.path, "/customers/{id}");
  assert.equal(record.step, "Kunde [REDACTED] pruefen");
  assert.deepEqual(record.actions, ["Exportieren"]);
  assert.deepEqual(record.tableHeaders, ["Kundennummer"]);
  assert.doesNotMatch(JSON.stringify(record), /Max Mustermann/);
});

test("buildRecordingWorkflowPostProcessingPlan refreshes UI-derived inputs before the platform blueprint", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "auto",
    "--stub",
    "--out",
    "tmp/post-processing-order.jsonl",
  ]);

  const steps = buildRecordingWorkflowPostProcessingPlan(options, { hasNetworkLog: true }).map((step) => step.id);

  assert.ok(steps.indexOf("relationships") < steps.indexOf("platform-blueprint"));
  assert.ok(steps.indexOf("data-model") < steps.indexOf("platform-blueprint"));
  assert.ok(steps.indexOf("ui-map") < steps.indexOf("platform-blueprint"));
  assert.ok(steps.indexOf("platform-blueprint") < steps.indexOf("recording-scoreboard"));
  assert.ok(steps.indexOf("recording-scoreboard") < steps.indexOf("recording-campaign"));
});

test("buildRecordingWorkflowPreflight marks normal launched recordings as ready", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "auto",
    "--stub",
    "--url",
    "https://app.optica-omnia.de",
    "--capture-bodies",
  ]);
  const preflight = buildRecordingWorkflowPreflight(options, new Date("2026-06-03T12:00:00.000Z"));

  assert.equal(preflight.status, "ready");
  assert.equal(preflight.mode, "auto");
  assert.equal(preflight.captureBodies, true);
  assert.equal(preflight.postProcessingEnabled, true);
  assert.equal(preflight.checks.every((check) => check.status === "ready"), true);
});

test("buildRecordingWorkflowPreflight does not treat CDP as a video warning", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "manual",
    "--cdp",
    "http://127.0.0.1:9222",
    "--no-bodies",
    "--no-audit",
  ]);
  const preflight = buildRecordingWorkflowPreflight(options, new Date("2026-06-03T12:00:00.000Z"));

  assert.equal(preflight.status, "warning");
  assert.deepEqual(
    preflight.checks
      .filter((check) => check.status === "warning")
      .map((check) => check.name),
    ["Bodies", "Audit"],
  );
});

test("buildRecordingWorkflowPreflightMarkdown documents command readiness and artifact paths", () => {
  const options = parseRecordingWorkflowArgs([
    "--mode",
    "auto",
    "--stub",
    "--url",
    "https://app.optica-omnia.de",
    "--out",
    "tmp/session.jsonl",
    "--summary",
    "tmp/session-summary.md",
    "--manifest",
    "tmp/session-manifest.json",
    "--preflight-out",
    "tmp/preflight.md",
    "--preflight-json",
    "tmp/preflight.json",
    "--expect-endpoint",
    "GET /customers",
  ]);
  const preflight = buildRecordingWorkflowPreflight(options, new Date("2026-06-03T12:00:00.000Z"));
  const markdown = buildRecordingWorkflowPreflightMarkdown(preflight);

  assert.match(markdown, /^# Recording-Preflight/m);
  assert.match(markdown, /Status: ready/);
  assert.match(markdown, /Modus: auto/);
  assert.match(markdown, /tmp\/session\.jsonl/);
  assert.doesNotMatch(markdown, /logs\/video/);
  assert.match(markdown, /API-Katalog/);
  assert.match(preflight.runCommand, /^node tools\/recording-workflow\.ts --mode auto/);
  assert.match(preflight.runCommand, /--out tmp\/session\.jsonl/);
  assert.match(preflight.runCommand, /--summary tmp\/session-summary\.md/);
  assert.match(preflight.runCommand, /--manifest tmp\/session-manifest\.json/);
  assert.match(preflight.runCommand, /--preflight-out tmp\/preflight\.md/);
  assert.match(preflight.runCommand, /--preflight-json tmp\/preflight\.json/);
  assert.match(preflight.runCommand, /--expect-endpoint "GET \/customers"/);
  assert.doesNotMatch(preflight.runCommand, /--preflight(?:\s|$)/);
  assert.deepEqual(preflight.runArgs.slice(0, 3), ["tools/recording-workflow.ts", "--mode", "auto"]);
  assert.equal(preflight.runArgs.includes("--preflight"), false);
  assert.equal(preflight.runArgs[preflight.runArgs.indexOf("--out") + 1], "tmp/session.jsonl");
  assert.equal(preflight.runArgs[preflight.runArgs.indexOf("--expect-endpoint") + 1], "GET /customers");
  assert.match(markdown, /## Startbefehl/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode auto/);
});

test("recordingWorkflowPreflightExitCode fails only on blocked checks", () => {
  assert.equal(recordingWorkflowPreflightExitCode({ status: "ready" } as never), 0);
  assert.equal(recordingWorkflowPreflightExitCode({ status: "warning" } as never), 0);
  assert.equal(recordingWorkflowPreflightExitCode({ status: "blocked" } as never), 1);
});

test("writeRecordingWorkflowPreflight writes markdown and machine-readable JSON sidecar", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-preflight-"));
  const markdownFile = path.join(dir, "preflight.md");
  const jsonFile = path.join(dir, "preflight.json");
  const preflight = buildRecordingWorkflowPreflight(
    parseRecordingWorkflowArgs([
      "--mode",
      "auto",
      "--stub",
      "--url",
      "https://app.optica-omnia.de",
      "--out",
      path.join(dir, "session.jsonl"),
    ]),
    new Date("2026-06-03T12:00:00.000Z"),
  );

  writeRecordingWorkflowPreflight(markdownFile, preflight, jsonFile);

  assert.match(fs.readFileSync(markdownFile, "utf8"), /^# Recording-Preflight/m);
  const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(parsed.status, "ready");
  assert.equal(parsed.mode, "auto");
  assert.equal(parsed.artifacts.logFile.endsWith("session.jsonl"), true);
});

test("buildRecordingWorkflowSummaryMarkdown lists all generated artifacts", () => {
  const markdown = buildRecordingWorkflowSummaryMarkdown({
    mode: "manual",
    purpose: "quality-baseline",
    status: "completed",
    startedAt: "2026-06-03T12:00:00.000Z",
    completedAt: "2026-06-03T12:05:00.000Z",
    logFile: "/workspace/logs/network/test-workflow.jsonl",
    preflightFile: "/workspace/docs/recordings/test-workflow-preflight.md",
    preflightJsonFile: "/workspace/docs/recordings/test-workflow-preflight.json",
    preflightStatus: "ready",
    manifestFile: "/workspace/docs/recordings/test-workflow-manifest.json",
    explorerReportFile: "/workspace/docs/recordings/test-workflow-explorer.md",
    flowReportFile: "/workspace/docs/recordings/test-flow.md",
    flowMappingFile: "/workspace/docs/04_flow_to_api_mapping.md",
    catalogFile: "/workspace/docs/03_api_catalog.md",
    openApiFile: "/workspace/openapi/omnia-observed.openapi.yaml",
    coverageReportFile: "/workspace/docs/08_api_coverage_report.md",
    knowledgeReportFile: "/workspace/docs/10_omnia_knowledge.md",
    relationshipsFile: "/workspace/docs/12_omnia_relationships.md",
    dataModelFile: "/workspace/docs/13_omnia_data_model.md",
    blueprintFile: "/workspace/docs/11_platform_blueprint.md",
    uiMapFile: "/workspace/docs/14_omnia_ui_map.md",
    scoreboardFile: "/workspace/docs/recordings/recording-scoreboard.md",
    campaignFile: "/workspace/docs/recordings/recording-campaign.md",
    impactFile: "/workspace/docs/recordings/test-impact.md",
    auditFile: "/workspace/docs/recordings/test-audit.md",
    auditStatus: "passed",
    impact: {
      targetResponses: 12,
      targetEndpointCount: 5,
      newEndpointCount: 3,
      newKnownInventoryCount: 2,
      coverageDeltaPercent: 1.25,
      downloads: 1,
      topAreas: [
        { area: "Kunden/Vorgaenge", endpointCount: 4, newEndpointCount: 2, responseCount: 10 },
      ],
    },
    expectedEndpointResults: [
      {
        endpoint: { method: "POST", path: "/salesprocesses/csv-export", source: "test" },
        observed: true,
      },
      {
        endpoint: { method: "GET", path: "/cash-book-entries/csv", source: "test" },
        observed: false,
      },
    ],
  });

  assert.match(markdown, /^# Recording-Workflow/m);
  assert.match(markdown, /Modus: manual/);
  assert.match(markdown, /Zweck: quality-baseline/);
  assert.match(markdown, /test-workflow\.jsonl/);
  assert.doesNotMatch(markdown, /Video:/);
  assert.doesNotMatch(markdown, /test\.webm/);
  assert.match(markdown, /test-workflow-preflight\.md/);
  assert.match(markdown, /test-workflow-preflight\.json/);
  assert.match(markdown, /Preflight-Status: ready/);
  assert.match(markdown, /test-workflow-manifest\.json/);
  assert.match(markdown, /test-workflow-explorer\.md/);
  assert.match(markdown, /08_api_coverage_report\.md/);
  assert.match(markdown, /10_omnia_knowledge\.md/);
  assert.match(markdown, /12_omnia_relationships\.md/);
  assert.match(markdown, /13_omnia_data_model\.md/);
  assert.match(markdown, /11_platform_blueprint\.md/);
  assert.match(markdown, /14_omnia_ui_map\.md/);
  assert.match(markdown, /recording-scoreboard\.md/);
  assert.match(markdown, /recording-campaign\.md/);
  assert.match(markdown, /test-impact\.md/);
  assert.match(markdown, /test-audit\.md/);
  assert.match(markdown, /Audit-Status: passed/);
  assert.match(markdown, /## Impact/);
  assert.match(markdown, /Neue Endpunkte: 3/);
  assert.match(markdown, /Coverage-Delta: 1\.25 %/);
  assert.match(markdown, /Kunden\/Vorgaenge: 2 neue \/ 4 Endpunkte, 10 Responses/);
  assert.match(markdown, /## Erwartete Endpunkte/);
  assert.match(markdown, /\| POST `\/salesprocesses\/csv-export` \| gesehen \|/);
  assert.match(markdown, /\| GET `\/cash-book-entries\/csv` \| fehlt \|/);
});

test("buildRecordingWorkflowSummaryMarkdown includes auto explorer stats when available", () => {
  const markdown = buildRecordingWorkflowSummaryMarkdown({
    mode: "auto",
    status: "completed",
    startedAt: "2026-06-03T12:00:00.000Z",
    completedAt: "2026-06-03T12:05:00.000Z",
    stopReason: "no-more-targets",
    logFile: "/workspace/logs/network/test-workflow.jsonl",
    explorer: {
      startUrl: "https://app.optica-omnia.de/dashboard",
      finalUrl: "https://app.optica-omnia.de/customers",
      stopReason: "no-more-targets",
      clickedTargets: 7,
      skippedTargets: 14,
      blockedRequests: 2,
      discoveredTargets: 9,
      openTargets: 2,
      topOpenTargets: [
        { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
      ],
    },
  });

  assert.match(markdown, /## Auto-Explorer/);
  assert.match(markdown, /Geklickte Ziele: 7/);
  assert.match(markdown, /Uebersprungene Ziele: 14/);
  assert.match(markdown, /Blockierte Requests: 2/);
  assert.match(markdown, /Explorer-Stop-Grund: no-more-targets/);
});

test("buildRecordingWorkflowManifest keeps machine-readable artifact and target endpoint metadata", () => {
  const manifest = buildRecordingWorkflowManifest({
    mode: "auto",
    purpose: "quality-baseline",
    status: "completed",
    startedAt: "2026-06-03T12:00:00.000Z",
    completedAt: "2026-06-03T12:05:00.000Z",
    stopReason: "no-more-targets",
    logFile: "/workspace/logs/network/test-workflow.jsonl",
    preflightFile: "/workspace/docs/recordings/test-workflow-preflight.md",
    preflightJsonFile: "/workspace/docs/recordings/test-workflow-preflight.json",
    preflight: {
      generatedAt: "2026-06-03T12:00:00.000Z",
      status: "ready",
      mode: "auto",
      purpose: "quality-baseline",
      target: "https://app.optica-omnia.de",
      captureBodies: true,
      postProcessingEnabled: true,
      artifacts: {
        logFile: "/workspace/logs/network/test-workflow.jsonl",
      },
      checks: [
        { name: "Ziel", status: "ready", detail: "https://app.optica-omnia.de" },
      ],
    },
    manifestFile: "/workspace/docs/recordings/test-workflow-manifest.json",
    explorerReportFile: "/workspace/docs/recordings/test-workflow-explorer.md",
    summaryFile: "/workspace/docs/recordings/test-workflow-summary.md",
    catalogFile: "/workspace/docs/03_api_catalog.md",
    openApiFile: "/workspace/openapi/omnia-observed.openapi.yaml",
    coverageReportFile: "/workspace/docs/08_api_coverage_report.md",
    uiMapFile: "/workspace/docs/14_omnia_ui_map.md",
    scoreboardFile: "/workspace/docs/recordings/recording-scoreboard.md",
    auditFile: "/workspace/docs/recordings/test-audit.md",
    auditStatus: "passed",
    impactFile: "/workspace/docs/recordings/test-impact.md",
    impact: {
      targetResponses: 12,
      targetEndpointCount: 5,
      newEndpointCount: 3,
      newKnownInventoryCount: 2,
      coverageDeltaPercent: 1.25,
      downloads: 1,
      topAreas: [
        { area: "Kunden/Vorgaenge", endpointCount: 4, newEndpointCount: 2, responseCount: 10 },
      ],
    },
    explorer: {
      startUrl: "https://app.optica-omnia.de/dashboard",
      finalUrl: "https://app.optica-omnia.de/customers",
      stopReason: "no-more-targets",
      clickedTargets: 7,
      skippedTargets: 14,
      blockedRequests: 2,
      discoveredTargets: 9,
      openTargets: 2,
      topOpenTargets: [
        { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
      ],
    },
    expectedEndpointResults: [
      {
        endpoint: { method: "GET", path: "/customers", source: "test" },
        observed: true,
      },
      {
        endpoint: { method: "POST", path: "/salesprocesses/csv-export", source: "test" },
        observed: false,
      },
    ],
  });

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.mode, "auto");
  assert.equal(manifest.purpose, "quality-baseline");
  assert.equal(manifest.status, "completed");
  assert.equal(manifest.auditStatus, "passed");
  assert.deepEqual(manifest.artifacts, {
    logFile: "/workspace/logs/network/test-workflow.jsonl",
    preflightFile: "/workspace/docs/recordings/test-workflow-preflight.md",
    preflightJsonFile: "/workspace/docs/recordings/test-workflow-preflight.json",
    manifestFile: "/workspace/docs/recordings/test-workflow-manifest.json",
    explorerReportFile: "/workspace/docs/recordings/test-workflow-explorer.md",
    summaryFile: "/workspace/docs/recordings/test-workflow-summary.md",
    catalogFile: "/workspace/docs/03_api_catalog.md",
    openApiFile: "/workspace/openapi/omnia-observed.openapi.yaml",
    coverageReportFile: "/workspace/docs/08_api_coverage_report.md",
    uiMapFile: "/workspace/docs/14_omnia_ui_map.md",
    impactFile: "/workspace/docs/recordings/test-impact.md",
    impactJsonFile: "/workspace/docs/recordings/test-impact.json",
    scoreboardFile: "/workspace/docs/recordings/recording-scoreboard.md",
    scoreboardJsonFile: "/workspace/docs/recordings/recording-scoreboard.json",
    auditFile: "/workspace/docs/recordings/test-audit.md",
  });
  assert.equal(manifest.preflight?.status, "ready");
  assert.equal(manifest.preflight?.purpose, "quality-baseline");
  assert.equal(manifest.preflight?.checks[0].name, "Ziel");
  assert.deepEqual(manifest.impact, {
    targetResponses: 12,
    targetEndpointCount: 5,
    newEndpointCount: 3,
    newKnownInventoryCount: 2,
    coverageDeltaPercent: 1.25,
    downloads: 1,
    topAreas: [
      { area: "Kunden/Vorgaenge", endpointCount: 4, newEndpointCount: 2, responseCount: 10 },
    ],
  });
  assert.deepEqual(manifest.expectedEndpoints, [
    { method: "GET", path: "/customers", source: "test", observed: true },
    { method: "POST", path: "/salesprocesses/csv-export", source: "test", observed: false },
  ]);
  assert.deepEqual(manifest.explorer, {
    startUrl: "https://app.optica-omnia.de/dashboard",
    finalUrl: "https://app.optica-omnia.de/customers",
    stopReason: "no-more-targets",
    clickedTargets: 7,
    skippedTargets: 14,
    blockedRequests: 2,
    discoveredTargets: 9,
    openTargets: 2,
    topOpenTargets: [
      { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
    ],
  });
});

test("buildRecordingExplorerStats summarizes read-only explorer results", () => {
  const stats = buildRecordingExplorerStats({
    startedAt: "2026-06-03T12:00:00.000Z",
    finishedAt: "2026-06-03T12:05:00.000Z",
    startUrl: "https://app.optica-omnia.de/dashboard",
    finalUrl: "https://app.optica-omnia.de/customers",
    logFile: "/workspace/logs/network/test-workflow.jsonl",
    clicked: [
      { key: "menu-customers", kind: "menu", label: "Kunden", path: "/customers", selector: "a" },
      { key: "tab-details", kind: "tab", label: "Details", path: "/customers/1", selector: "button" },
    ],
    discoveredTargets: [
      {
        kind: "route",
        key: "route:/customers",
        label: "Kunden",
        path: "/customers",
        reason: "safe-navigation",
        seenCount: 4,
        clicked: true,
      },
      {
        kind: "route",
        key: "route:/articles",
        label: "Artikel",
        path: "/articles",
        reason: "safe-navigation",
        seenCount: 3,
        clicked: false,
      },
      {
        kind: "tab",
        key: "tab:/customers:Notizen",
        label: "Notizen",
        path: "",
        reason: "safe-tab",
        seenCount: 1,
        clicked: false,
      },
    ],
    skipped: [
      { label: "Loeschen", path: "/delete", reason: "dangerous-label" },
      { label: "Speichern", path: "/save", reason: "dangerous-label" },
      { label: "Extern", reason: "unsupported-target" },
    ],
    blockedRequests: [
      { method: "POST", url: "https://api2.optica-omnia.de/telemetry", reason: "telemetry-post" },
    ],
    stopReason: "no-more-targets",
  });

  assert.deepEqual(stats, {
    startUrl: "https://app.optica-omnia.de/dashboard",
    finalUrl: "https://app.optica-omnia.de/customers",
    stopReason: "no-more-targets",
    clickedTargets: 2,
    skippedTargets: 3,
    blockedRequests: 1,
    discoveredTargets: 3,
    openTargets: 2,
    topOpenTargets: [
      { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
      { kind: "tab", label: "Notizen", path: "", seenCount: 1 },
    ],
  });
});

test("buildRecordingWorkflowAuditFiles includes summary and manifest as required text artifacts", () => {
  const files = buildRecordingWorkflowAuditFiles({
    logFile: "/workspace/logs/network/test-workflow.jsonl",
    preflightFile: "/workspace/docs/recordings/test-workflow-preflight.md",
    preflightJsonFile: "/workspace/docs/recordings/test-workflow-preflight.json",
    summaryFile: "/workspace/docs/recordings/test-workflow-summary.md",
    manifestFile: "/workspace/docs/recordings/test-workflow-manifest.json",
    explorerReportFile: "/workspace/docs/recordings/test-workflow-explorer.md",
    flowReportFile: "/workspace/docs/recordings/test-flow.md",
    flowMappingFile: "/workspace/docs/04_flow_to_api_mapping.md",
    catalogFile: "/workspace/docs/03_api_catalog.md",
    openApiFile: "/workspace/openapi/omnia-observed.openapi.yaml",
    coverageReportFile: "/workspace/docs/08_api_coverage_report.md",
    knowledgeReportFile: "/workspace/docs/10_omnia_knowledge.md",
    relationshipsFile: "/workspace/docs/12_omnia_relationships.md",
    dataModelFile: "/workspace/docs/13_omnia_data_model.md",
    blueprintFile: "/workspace/docs/11_platform_blueprint.md",
    uiMapFile: "/workspace/docs/14_omnia_ui_map.md",
    scoreboardFile: "/workspace/docs/recordings/recording-scoreboard.md",
    impactFile: "/workspace/docs/recordings/test-impact.md",
    rebuildCatalog: true,
    rebuildCoverageReport: true,
    rebuildKnowledgeReport: true,
    rebuildBlueprint: true,
    rebuildUiMap: true,
  });

  assert.deepEqual(
    files
      .filter((file) => file.role === "Workflow-Summary" || file.role === "Run-Manifest" || file.role === "UI-Map" || file.role === "Impact-JSON" || file.role === "Recording-Scoreboard-JSON")
      .map((file) => ({ role: file.role, file: file.file, required: file.required })),
    [
      {
        role: "Workflow-Summary",
        file: "/workspace/docs/recordings/test-workflow-summary.md",
        required: true,
      },
      {
        role: "Run-Manifest",
        file: "/workspace/docs/recordings/test-workflow-manifest.json",
        required: true,
      },
      {
        role: "UI-Map",
        file: "/workspace/docs/14_omnia_ui_map.md",
        required: true,
      },
      {
        role: "Recording-Scoreboard-JSON",
        file: "/workspace/docs/recordings/recording-scoreboard.json",
        required: true,
      },
      {
        role: "Impact-JSON",
        file: "/workspace/docs/recordings/test-impact.json",
        required: true,
      },
    ],
  );
  assert.deepEqual(
    files
      .filter((file) => file.role === "Preflight-Report" || file.role === "Preflight-JSON")
      .map((file) => ({ role: file.role, file: file.file, required: file.required })),
    [
      {
        role: "Preflight-Report",
        file: "/workspace/docs/recordings/test-workflow-preflight.md",
        required: true,
      },
      {
        role: "Preflight-JSON",
        file: "/workspace/docs/recordings/test-workflow-preflight.json",
        required: true,
      },
    ],
  );
});
