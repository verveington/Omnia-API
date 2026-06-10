import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildAdaptiveCampaignRunSequence,
  buildRecordingCampaignHelp,
  buildRecordingCampaignMarkdown,
  buildRecordingCampaignPlan,
  isRecordingCampaignHelpRequest,
  parseExplorerFollowupFromManifest,
  parseRecordingCampaignArgs,
  parseExpectedEndpointMissesFromManifest,
  parseExpectedEndpointMissesFromMarkdown,
  runAdaptiveCampaignSteps,
  runRecordingCampaignCli,
  selectNextAutoRecordingRecommendation,
  selectNextRecordingRecommendation,
  writeRecordingCampaign,
} from "./recording-campaign.ts";
import { buildCoverageReport } from "./coverage-report.ts";
import { buildOmniaKnowledge } from "./omnia-knowledge.ts";
import { buildOmniaRelationships } from "./omnia-relationships.ts";

test("recording campaign help request is handled before campaign side effects", () => {
  assert.equal(isRecordingCampaignHelpRequest(["--help"]), true);
  assert.equal(isRecordingCampaignHelpRequest(["-h"]), true);
  assert.equal(isRecordingCampaignHelpRequest(["--run"]), false);

  const help = buildRecordingCampaignHelp();

  assert.match(help, /^Recording-Campaign/m);
  assert.match(help, /--run/);
  assert.match(help, /--limit/);
  assert.match(help, /--include-manual/);
  assert.match(help, /--print-next/);
  assert.match(help, /recording-campaign-next\.json/);
});

test("parseRecordingCampaignArgs rejects unknown flags before writing campaign files", () => {
  assert.throws(
    () => parseRecordingCampaignArgs(["--prit-next"]),
    /Unbekannte Recording-Campaign-Option: --prit-next/,
  );
  assert.throws(
    () => parseRecordingCampaignArgs(["--run", "--unknown-flag"]),
    /Unbekannte Recording-Campaign-Option: --unknown-flag/,
  );
});

test("recording campaign CLI waits for module initialization before planning", () => {
  const outputFile = path.join(os.tmpdir(), `recording-campaign-cli-${Date.now()}.md`);
  const result = spawnSync(process.execPath, [
    "tools/recording-campaign.ts",
    "--out",
    outputFile,
  ], {
    cwd: path.resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stderr, /successfulExplorerStopReasons/);
  assert.match(result.stdout, /Recording-Campaign:/);
  assert.equal(fs.existsSync(outputFile), true);
});

test("buildRecordingCampaignPlan selects executable auto recording runs from coverage priorities", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/customers/search", source: "test" },
      { method: "POST", path: "/orders/from-proposal", source: "test" },
      { method: "GET", path: "/file-archive/cloud/load/files/{fileId}", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
    recordingUrl: "https://omnia.example.test",
  });

  assert.deepEqual(
    plan.steps.map((step) => step.area),
    ["Kunden/Vorgaenge", "Warenwirtschaft/Bestellung"],
  );
  assert.equal(plan.skippedManual.length, 1);
  assert.equal(plan.skippedManual[0].area, "Dokumente/Archiv");
  assert.match(plan.steps[0].command, /node tools\/recording-workflow\.ts/);
  assert.match(plan.steps[0].command, /--mode auto/);
  assert.match(plan.steps[0].command, /--url https:\/\/omnia\.example\.test/);
  assert.match(plan.steps[0].command, /--start-path "\/master-data\/customers"/);
  assert.deepEqual(plan.steps[0].args.slice(0, 6), ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://omnia.example.test", "--stub"]);
});

test("selectNextAutoRecordingRecommendation skips ineffective auto start paths", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/cost-estimates", source: "test" },
      { method: "GET", path: "/cost-estimates/latest-approved", source: "test" },
      { method: "GET", path: "/customers/{customerId}/arzt/{relationId}", source: "test" },
      { method: "GET", path: "/article-kits/{articleKitId}", source: "test" },
      { method: "POST", path: "/order-arrival/search", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
    explorerFollowupMissions: [
      {
        manifestFile: "/workspace/docs/recordings/customers-workflow-manifest.json",
        startUrl: "https://api2.optica-omnia.de/dashboard",
        finalUrl: "https://api2.optica-omnia.de/master-data/customers",
        stopReason: "no-more-targets",
        clickedTargets: 0,
        skippedTargets: 0,
        blockedRequests: 1,
        discoveredTargets: 0,
        openTargets: 0,
        topOpenTargets: [],
        reason: "Auto-Explorer-Lauf braucht manuelle Nachfahrt: kein geklicktes Ziel.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const next = selectNextAutoRecordingRecommendation(plan);

  assert.deepEqual(plan.steps.map((step) => step.area), ["Kunden/Vorgaenge", "Artikel/Warenbestand", "Warenwirtschaft/Bestellung"]);
  assert.equal(next?.label, "Artikelverwaltung mit Musterartikel aufnehmen");
  assert.match(next?.command || "", /--start-path "\/merchandise-management\/article-management\/articles"/);
});

test("selectNextAutoRecordingRecommendation skips exhausted auto start paths with missed expected endpoints", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/cost-estimates", source: "test" },
      { method: "GET", path: "/cost-estimates/latest-approved", source: "test" },
      { method: "GET", path: "/customers/{customerId}/arzt/{relationId}", source: "test" },
      { method: "GET", path: "/article-kits/{articleKitId}", source: "test" },
      { method: "GET", path: "/article-kits/{articleKitId}/article-kit-material-positions", source: "test" },
      { method: "POST", path: "/order-arrival/search", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
    explorerFollowupMissions: [
      {
        manifestFile: "/workspace/docs/recordings/customers-workflow-manifest.json",
        startUrl: "https://api2.optica-omnia.de/dashboard",
        finalUrl: "https://api2.optica-omnia.de/master-data/customers",
        stopReason: "no-more-targets",
        clickedTargets: 0,
        skippedTargets: 0,
        blockedRequests: 1,
        discoveredTargets: 0,
        openTargets: 0,
        topOpenTargets: [],
        reason: "Auto-Explorer-Lauf braucht manuelle Nachfahrt: kein geklicktes Ziel.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
      {
        manifestFile: "/workspace/docs/recordings/articles-workflow-manifest.json",
        logFile: "/workspace/logs/network/articles-workflow.jsonl",
        startPath: "/merchandise-management/article-management/articles",
        startUrl: "https://api2.optica-omnia.de/login",
        finalUrl: "https://api2.optica-omnia.de/merchandise-management/article-management/articles",
        stopReason: "no-more-targets",
        clickedTargets: 18,
        skippedTargets: 8,
        blockedRequests: 11,
        discoveredTargets: 18,
        openTargets: 0,
        expectedEndpointCount: 3,
        expectedObservedCount: 0,
        topOpenTargets: [],
        reason: "Auto-Explorer-Lauf hat den Startpfad ausgeschoepft, aber keine erwarteten Endpunkte gesehen.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const next = selectNextAutoRecordingRecommendation(plan);

  assert.deepEqual(plan.steps.map((step) => step.area), ["Kunden/Vorgaenge", "Artikel/Warenbestand", "Warenwirtschaft/Bestellung"]);
  assert.equal(next?.label, "Wawi-Bestellvorschlaege read-only aufnehmen");
  assert.match(next?.command || "", /--start-path "\/merchandise-management\/order-management\/order-proposals"/);
});

test("selectNextAutoRecordingRecommendation retries modules when a previous run escaped the module scope", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/cost-estimates", source: "test" },
      { method: "GET", path: "/article-kits/{articleKitId}", source: "test" },
      { method: "POST", path: "/order-arrival/search", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
    explorerFollowupMissions: [
      {
        manifestFile: "/workspace/docs/recordings/customers-workflow-manifest.json",
        startPath: "/master-data/customers",
        startUrl: "https://api2.optica-omnia.de/dashboard",
        finalUrl: "https://api2.optica-omnia.de/master-data/customers",
        stopReason: "no-more-targets",
        clickedTargets: 0,
        skippedTargets: 0,
        blockedRequests: 1,
        discoveredTargets: 0,
        openTargets: 0,
        topOpenTargets: [],
        reason: "Auto-Explorer-Lauf braucht manuelle Nachfahrt: kein geklicktes Ziel.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
      {
        manifestFile: "/workspace/docs/recordings/articles-workflow-manifest.json",
        startPath: "/merchandise-management/article-management/articles",
        startUrl: "https://api2.optica-omnia.de/login",
        finalUrl: "https://api2.optica-omnia.de/transactions/archived",
        stopReason: "no-more-targets",
        clickedTargets: 18,
        skippedTargets: 8,
        blockedRequests: 11,
        discoveredTargets: 18,
        openTargets: 0,
        expectedEndpointCount: 3,
        expectedObservedCount: 0,
        topOpenTargets: [],
        reason: "Alter Lauf hat globale Navigation statt Modul-Scope erkundet.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const next = selectNextAutoRecordingRecommendation(plan);

  assert.equal(next?.label, "Artikelverwaltung mit Musterartikel aufnehmen");
  assert.match(next?.command || "", /--start-path "\/merchandise-management\/article-management\/articles"/);
});

test("selectNextAutoRecordingRecommendation ignores out-of-scope open targets for scoped modules", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/cost-estimates", source: "test" },
      { method: "GET", path: "/article-kits/{articleKitId}", source: "test" },
      { method: "POST", path: "/order-arrival/search", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
    explorerFollowupMissions: [
      {
        manifestFile: "/workspace/docs/recordings/customers-workflow-manifest.json",
        startPath: "/master-data/customers",
        startUrl: "https://api2.optica-omnia.de/dashboard",
        finalUrl: "https://api2.optica-omnia.de/master-data/customers",
        stopReason: "no-more-targets",
        clickedTargets: 0,
        skippedTargets: 0,
        blockedRequests: 1,
        discoveredTargets: 0,
        openTargets: 0,
        topOpenTargets: [],
        reason: "Auto-Explorer-Lauf braucht manuelle Nachfahrt: kein geklicktes Ziel.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
      {
        manifestFile: "/workspace/docs/recordings/articles-workflow-manifest.json",
        startPath: "/merchandise-management/article-management/articles",
        startUrl: "https://api2.optica-omnia.de/login",
        finalUrl: "https://api2.optica-omnia.de/merchandise-management/article-management/articles",
        stopReason: "no-more-targets",
        clickedTargets: 0,
        skippedTargets: 1,
        blockedRequests: 2,
        discoveredTargets: 4,
        openTargets: 4,
        expectedEndpointCount: 3,
        expectedObservedCount: 0,
        topOpenTargets: [
          { kind: "route", label: "Suche", path: "/search", seenCount: 1 },
          { kind: "route", label: "Cash Till", path: "/cash-till", seenCount: 1 },
        ],
        reason: "Nur globale Ziele offen.",
        command: "node tools/recording-workflow.ts --mode manual",
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const next = selectNextAutoRecordingRecommendation(plan);

  assert.equal(next?.label, "Wawi-Bestellvorschlaege read-only aufnehmen");
});

test("selectNextAutoRecordingRecommendation stops when all auto modules are exhausted", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/cost-estimates", source: "test" },
      { method: "GET", path: "/article-kits/{articleKitId}", source: "test" },
      { method: "GET", path: "/bons", source: "test" },
      { method: "POST", path: "/order-arrival/search", source: "test" },
      { method: "GET", path: "/route-plannings/{id}/stops", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const exhaustedStartPaths = [
    "/master-data/customers",
    "/merchandise-management/article-management/articles",
    "/accounting/payment-terms",
    "/merchandise-management/order-management/order-proposals",
    "/route-planning",
  ];
  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
    explorerFollowupMissions: exhaustedStartPaths.map((startPath) => ({
      manifestFile: `/workspace/docs/recordings/${startPath.replace(/\W+/g, "-")}-workflow-manifest.json`,
      startPath,
      startUrl: "https://api2.optica-omnia.de/login",
      finalUrl: `https://api2.optica-omnia.de${startPath}`,
      stopReason: "no-more-targets",
      clickedTargets: 0,
      skippedTargets: 0,
      blockedRequests: 1,
      discoveredTargets: 0,
      openTargets: 0,
      expectedEndpointCount: 2,
      expectedObservedCount: 0,
      topOpenTargets: [],
      reason: "Auto-Explorer-Lauf hat keine weiteren Modulziele gefunden.",
      command: "node tools/recording-workflow.ts --mode manual",
      args: ["tools/recording-workflow.ts", "--mode", "manual"],
    })),
  });

  assert.equal(plan.steps.length, 5);
  assert.equal(selectNextAutoRecordingRecommendation(plan), null);
});

test("buildRecordingCampaignMarkdown documents dry-run commands and skipped manual areas", () => {
  const report = buildCoverageReport(
    [
      { method: "GET", path: "/customers/search", source: "test" },
      { method: "GET", path: "/file-archive/cloud/load/files/{fileId}", source: "test" },
    ],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(report, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 10,
    includeManual: false,
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /^# Recording-Campaign/m);
  assert.match(markdown, /Modus: dry-run/);
  assert.match(markdown, /Kundenstamm und Vorgangsdetails aufnehmen/);
  assert.match(markdown, /node tools\/recording-workflow\.ts/);
  assert.match(markdown, /Manuell uebersprungene Bereiche/);
  assert.match(markdown, /Dokumente\/Archiv/);
});

test("buildRecordingCampaignPlan adds a domain backlog from knowledge coverage gaps", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "GET", path: "/aerzte", source: "test" },
    { method: "GET", path: "/aerzte/{uuid}", source: "test" },
    { method: "POST", path: "/dv-data", source: "test" },
  ];
  const records = [
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
      status: 200,
      resourceType: "xhr",
      step: "Kunde suchen",
    },
  ];
  const coverage = buildCoverageReport(known, records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const knowledge = buildOmniaKnowledge(records, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    knownEndpoints: known,
  });

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    knowledgeReport: knowledge,
    recordingUrl: "https://omnia.example.test",
  });

  assert.deepEqual(
    plan.domainBacklog.map((item) => item.area),
    ["aerzte", "dv-data"],
  );
  assert.equal(plan.domainBacklog[0].knownEndpoints, 2);
  assert.equal(plan.domainBacklog[0].observedKnownEndpoints, 0);
  assert.equal(plan.domainBacklog[0].missingKnownEndpoints, 2);
  assert.match(plan.domainBacklog[0].command, /node tools\/recording-workflow\.ts --mode manual/);
  assert.match(plan.domainBacklog[0].command, /--url https:\/\/omnia\.example\.test/);
});

test("buildRecordingCampaignMarkdown documents domain backlog commands", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "GET", path: "/aerzte", source: "test" },
  ];
  const records = [
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
      status: 200,
      resourceType: "xhr",
      step: "Kunde suchen",
    },
  ];
  const coverage = buildCoverageReport(known, records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const knowledge = buildOmniaKnowledge(records, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    knownEndpoints: known,
  });

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    knowledgeReport: knowledge,
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Domain-Backlog/);
  assert.match(markdown, /aerzte/);
  assert.match(markdown, /Known\/Observed\/Missing: 1 \/ 0 \/ 1/);
  assert.match(markdown, /GET `\/aerzte`/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
});

test("buildRecordingCampaignPlan adds relationship missions for observed domain handoffs with missing coverage", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "POST", path: "/customers/{customerId}/documents", source: "test" },
    { method: "POST", path: "/orders", source: "test" },
    { method: "POST", path: "/order-arrival/search", source: "test" },
  ];
  const records = [
    response("2026-06-03T10:00:00.000Z", "Bestellkontext", "GET", "/apigateway/kunden/customers/search"),
    response("2026-06-03T10:00:01.000Z", "Bestellkontext", "POST", "/apigateway/wawi/order-proposals/search"),
  ];
  const coverage = buildCoverageReport(known, records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const knowledge = buildOmniaKnowledge(records, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    knownEndpoints: known,
  });
  const relationships = buildOmniaRelationships(records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    knowledgeReport: knowledge,
    relationships,
  });

  assert.equal(plan.relationshipMissions.length, 1);
  assert.equal(plan.relationshipMissions[0].transition, "Kunden/Vorgaenge -> Warenwirtschaft/Bestellung");
  assert.equal(plan.relationshipMissions[0].missingKnownEndpoints, 3);
  assert.match(plan.relationshipMissions[0].command, /Uebergang zu Warenwirtschaft\/Bestellung ausloesen/);
  assert.equal(stepArg(plan.relationshipMissions[0].args).split(",").length, 4);
});

test("buildRecordingCampaignMarkdown documents relationship missions", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "POST", path: "/orders", source: "test" },
  ];
  const records = [
    response("2026-06-03T10:00:00.000Z", "Bestellkontext", "GET", "/apigateway/kunden/customers/search"),
    response("2026-06-03T10:00:01.000Z", "Bestellkontext", "POST", "/apigateway/wawi/order-proposals/search"),
  ];
  const coverage = buildCoverageReport(known, records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const knowledge = buildOmniaKnowledge(records, {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    knownEndpoints: known,
  });
  const relationships = buildOmniaRelationships(records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    knowledgeReport: knowledge,
    relationships,
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Relationship-Missions/);
  assert.match(markdown, /Kunden\/Vorgaenge -> Warenwirtschaft\/Bestellung/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
});

test("buildRecordingCampaignPlan adds endpoint missions for export search and detail gaps", () => {
  const known = [
    { method: "GET", path: "/cash-book-entries/csv", source: "test" },
    { method: "POST", path: "/salesprocesses/csv-export", source: "test" },
    { method: "POST", path: "/customers/search", source: "test" },
    { method: "GET", path: "/customers/{customerId}", source: "test" },
    { method: "POST", path: "/customers", source: "test" },
    { method: "DELETE", path: "/customers/{customerId}", source: "test" },
  ];
  const coverage = buildCoverageReport(known, [], { generatedAt: new Date("2026-06-03T12:00:00.000Z") });

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
  });

  assert.deepEqual(
    plan.endpointMissions.map((mission) => `${mission.intent}:${mission.endpoint.method} ${mission.endpoint.path}`),
    [
      "export:GET /cash-book-entries/csv",
      "export:POST /salesprocesses/csv-export",
      "search:POST /customers/search",
      "detail:GET /customers/{customerId}",
    ],
  );
  assert.equal(plan.endpointMissions.every((mission) => mission.mode === "manual"), true);
  assert.equal(plan.endpointMissions.some((mission) => mission.endpoint.method === "DELETE"), false);
  assert.match(plan.endpointMissions[0].command, /Exportdaten ohne Klarwerte pruefen/);
  assert.match(plan.endpointMissions[0].command, /--expect-endpoint "GET \/cash-book-entries\/csv"/);
  assert.deepEqual(
    plan.endpointMissions[0].args.slice(-2),
    ["--expect-endpoint", "GET /cash-book-entries/csv"],
  );
});

test("buildRecordingCampaignMarkdown documents endpoint missions", () => {
  const known = [
    { method: "GET", path: "/cash-book-entries/csv", source: "test" },
    { method: "POST", path: "/customers/search", source: "test" },
  ];
  const coverage = buildCoverageReport(known, [], { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Endpoint-Missions/);
  assert.match(markdown, /GET `\/cash-book-entries\/csv`/);
  assert.match(markdown, /POST `\/customers\/search`/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
});

test("parseExpectedEndpointMissesFromMarkdown reads missing expected endpoints", () => {
  const misses = parseExpectedEndpointMissesFromMarkdown(
    [
      "# Recording-Workflow",
      "",
      "## Erwartete Endpunkte",
      "",
      "| Endpoint | Ergebnis |",
      "|---|---|",
      "| POST `/salesprocesses/csv-export` | fehlt |",
      "| GET `/cash-book-entries/csv` | gesehen |",
      "| GET `/route-plannings/{routePlanningUuid}/exports` | fehlt |",
    ].join("\n"),
    "/workspace/docs/recordings/export-workflow-summary.md",
  );

  assert.deepEqual(misses, [
    {
      endpoint: { method: "POST", path: "/salesprocesses/csv-export", source: "expected-endpoint-miss" },
      summaryFile: "/workspace/docs/recordings/export-workflow-summary.md",
    },
    {
      endpoint: { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "expected-endpoint-miss" },
      summaryFile: "/workspace/docs/recordings/export-workflow-summary.md",
    },
  ]);
});

test("parseExpectedEndpointMissesFromManifest reads missing target endpoints from workflow manifests", () => {
  const misses = parseExpectedEndpointMissesFromManifest(
    {
      schemaVersion: 1,
      artifacts: {
        manifestFile: "/workspace/docs/recordings/export-workflow-manifest.json",
        summaryFile: "/workspace/docs/recordings/export-workflow-summary.md",
      },
      expectedEndpoints: [
        { method: "POST", path: "/salesprocesses/csv-export", source: "test", observed: false },
        { method: "GET", path: "/cash-book-entries/csv", source: "test", observed: true },
        { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "test", observed: false },
      ],
    },
    "/workspace/docs/recordings/export-workflow-manifest.json",
  );

  assert.deepEqual(misses, [
    {
      endpoint: { method: "POST", path: "/salesprocesses/csv-export", source: "expected-endpoint-miss" },
      summaryFile: "/workspace/docs/recordings/export-workflow-manifest.json",
    },
    {
      endpoint: { method: "GET", path: "/route-plannings/{routePlanningUuid}/exports", source: "expected-endpoint-miss" },
      summaryFile: "/workspace/docs/recordings/export-workflow-manifest.json",
    },
  ]);
});

test("buildRecordingCampaignPlan adds retry missions for failed expected endpoints still missing", () => {
  const known = [
    { method: "POST", path: "/salesprocesses/csv-export", source: "test" },
    { method: "GET", path: "/cash-book-entries/csv", source: "test" },
  ];
  const records = [
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/accounting/cash-book-entries/csv",
      status: 200,
      resourceType: "xhr",
    },
  ];
  const coverage = buildCoverageReport(known, records, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    expectedEndpointMisses: [
      {
        endpoint: { method: "POST", path: "/salesprocesses/csv-export", source: "expected-endpoint-miss" },
        summaryFile: "/workspace/docs/recordings/export-workflow-summary.md",
      },
      {
        endpoint: { method: "GET", path: "/cash-book-entries/csv", source: "expected-endpoint-miss" },
        summaryFile: "/workspace/docs/recordings/export-workflow-summary.md",
      },
    ],
  });

  assert.deepEqual(
    plan.retryMissions.map((mission) => `${mission.endpoint.method} ${mission.endpoint.path}`),
    ["POST /salesprocesses/csv-export"],
  );
  assert.equal(
    plan.endpointMissions.some((mission) => mission.endpoint.path === "/salesprocesses/csv-export"),
    false,
  );
  assert.match(plan.retryMissions[0].reason, /Workflow-Manifest oder eine Workflow-Summary meldete den erwarteten Endpoint als fehlt/);
  assert.match(plan.retryMissions[0].command, /--expect-endpoint "POST \/salesprocesses\/csv-export"/);
});

test("buildRecordingCampaignMarkdown documents retry missions", () => {
  const coverage = buildCoverageReport(
    [{ method: "POST", path: "/salesprocesses/csv-export", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    expectedEndpointMisses: [
      {
        endpoint: { method: "POST", path: "/salesprocesses/csv-export", source: "expected-endpoint-miss" },
        summaryFile: "/workspace/docs/recordings/export-workflow-summary.md",
      },
    ],
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Retry-Missions/);
  assert.match(markdown, /POST `\/salesprocesses\/csv-export`/);
  assert.match(markdown, /export-workflow-summary\.md/);
});

test("parseExplorerFollowupFromManifest creates a manual follow-up for blocked auto explorer runs", () => {
  const mission = parseExplorerFollowupFromManifest(
    {
      schemaVersion: 1,
      mode: "auto",
      artifacts: {
        logFile: "/workspace/logs/network/blocked-workflow.jsonl",
        summaryFile: "/workspace/docs/recordings/blocked-workflow-summary.md",
        explorerReportFile: "/workspace/docs/recordings/blocked-workflow-explorer.md",
      },
      expectedEndpoints: [],
      explorer: {
        startUrl: "https://app.optica-omnia.de/master-data/customers",
        finalUrl: "https://app.optica-omnia.de/master-data/customers",
        stopReason: "blocked-request",
        clickedTargets: 0,
        skippedTargets: 4,
        blockedRequests: 1,
      },
    },
    "/workspace/docs/recordings/blocked-workflow-manifest.json",
  );

  assert.equal(mission?.stopReason, "blocked-request");
  assert.equal(mission?.clickedTargets, 0);
  assert.equal(mission?.blockedRequests, 1);
  assert.match(mission?.reason || "", /blockierte Request/);
  assert.match(mission?.command || "", /node tools\/recording-workflow\.ts --mode manual/);
  assert.match(mission?.command || "", /--url https:\/\/api2\.optica-omnia\.de/);
  assert.match(mission?.command || "", /Auto-Explorer-Lauf manuell nachfahren/);
  assert.deepEqual(
    mission?.args.slice(0, 6),
    ["tools/recording-workflow.ts", "--mode", "manual", "--url", "https://api2.optica-omnia.de", "--stub"],
  );
});

test("parseExplorerFollowupFromManifest ignores successful auto explorer runs", () => {
  const mission = parseExplorerFollowupFromManifest(
    {
      schemaVersion: 1,
      mode: "auto",
      artifacts: {
        logFile: "/workspace/logs/network/good-workflow.jsonl",
      },
      expectedEndpoints: [],
      explorer: {
        startUrl: "https://app.optica-omnia.de/master-data/customers",
        finalUrl: "https://app.optica-omnia.de/master-data/articles",
        stopReason: "no-more-targets",
        clickedTargets: 8,
        skippedTargets: 2,
        blockedRequests: 0,
      },
    },
    "/workspace/docs/recordings/good-workflow-manifest.json",
  );

  assert.equal(mission, null);
});

test("parseExplorerFollowupFromManifest creates a manual follow-up for open UI targets", () => {
  const mission = parseExplorerFollowupFromManifest(
    {
      schemaVersion: 1,
      mode: "auto",
      artifacts: {
        logFile: "/workspace/logs/network/open-targets-workflow.jsonl",
        summaryFile: "/workspace/docs/recordings/open-targets-workflow-summary.md",
        explorerReportFile: "/workspace/docs/recordings/open-targets-workflow-explorer.md",
      },
      expectedEndpoints: [],
      explorer: {
        startUrl: "https://app.optica-omnia.de/dashboard",
        finalUrl: "https://app.optica-omnia.de/customers",
        stopReason: "no-more-targets",
        clickedTargets: 5,
        skippedTargets: 1,
        blockedRequests: 0,
        discoveredTargets: 8,
        openTargets: 2,
        topOpenTargets: [
          { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
        ],
      },
    },
    "/workspace/docs/recordings/open-targets-workflow-manifest.json",
  );

  assert.equal(mission?.openTargets, 2);
  assert.match(mission?.reason || "", /2 offene UI-Ziel/);
  assert.deepEqual(mission?.topOpenTargets, [
    { kind: "route", label: "Artikel", path: "/articles", seenCount: 3 },
  ]);
});

test("buildRecordingCampaignMarkdown documents explorer follow-up missions", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const followup = parseExplorerFollowupFromManifest(
    {
      schemaVersion: 1,
      mode: "auto",
      artifacts: {
        logFile: "/workspace/logs/network/blocked-workflow.jsonl",
        summaryFile: "/workspace/docs/recordings/blocked-workflow-summary.md",
        explorerReportFile: "/workspace/docs/recordings/blocked-workflow-explorer.md",
      },
      expectedEndpoints: [],
      explorer: {
        startUrl: "https://app.optica-omnia.de/master-data/customers",
        finalUrl: "https://app.optica-omnia.de/master-data/customers",
        stopReason: "blocked-request",
        clickedTargets: 0,
        skippedTargets: 4,
        blockedRequests: 1,
      },
    },
    "/workspace/docs/recordings/blocked-workflow-manifest.json",
  );
  assert.ok(followup);

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    explorerFollowupMissions: [followup],
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Explorer-Followups/);
  assert.match(markdown, /blocked-workflow-manifest\.json/);
  assert.match(markdown, /Stop-Grund: blocked-request/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
});

test("buildRecordingCampaignPlan keeps UI-Map follow-up missions", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    uiMapFollowupMissions: [
      {
        target: {
          key: "route:/cash-till/cash-sale",
          kind: "route",
          label: "Barverkauf",
          path: "/cash-till/cash-sale",
          clickedCount: 2,
          openCount: 0,
          seenCount: 2,
          apiEndpointCount: 0,
          apiAreas: [],
          apiEndpoints: [],
          sources: ["/workspace/logs/network/auto.jsonl"],
        },
        reason: "geklickt, aber kein API-Verkehr eindeutig zugeordnet",
        command: 'node tools/recording-workflow.ts --mode manual --steps "UI-Ziel Barverkauf erneut oeffnen"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  assert.equal(plan.uiMapFollowupMissions.length, 1);
  assert.equal(plan.uiMapFollowupMissions[0].target.label, "Barverkauf");
  assert.equal(plan.uiMapFollowupMissions[0].reason, "geklickt, aber kein API-Verkehr eindeutig zugeordnet");
});

test("buildRecordingCampaignMarkdown documents UI-Map follow-up missions", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    uiMapFollowupMissions: [
      {
        target: {
          key: "route:/transactions/dauerversorgung",
          kind: "route",
          label: "Dauerversorgungen",
          path: "/transactions/dauerversorgung",
          clickedCount: 2,
          openCount: 0,
          seenCount: 2,
          apiEndpointCount: 0,
          apiAreas: [],
          apiEndpoints: [],
          sources: ["/workspace/logs/network/auto.jsonl"],
        },
        reason: "geklickt, aber kein API-Verkehr eindeutig zugeordnet",
        command: 'node tools/recording-workflow.ts --mode manual --steps "UI-Ziel Dauerversorgungen erneut oeffnen"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## UI-Map-Followups/);
  assert.match(markdown, /Dauerversorgungen/);
  assert.match(markdown, /Grund: geklickt, aber kein API-Verkehr eindeutig zugeordnet/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
});

test("buildRecordingCampaignPlan keeps quality rerun missions", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );

  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response", "no-timeline-marker"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response, no-timeline-marker.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  assert.equal(plan.qualityRerunMissions.length, 1);
  assert.equal(plan.qualityRerunMissions[0].logFile, "/workspace/logs/network/weak.jsonl");
  assert.deepEqual(plan.qualityRerunMissions[0].findings, ["no-api-response", "no-timeline-marker"]);
});

test("buildRecordingCampaignMarkdown documents quality rerun missions", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response", "no-timeline-marker"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response, no-timeline-marker.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Quality-Reruns/);
  assert.match(markdown, /weak\.jsonl/);
  assert.match(markdown, /no-api-response, no-timeline-marker/);
  assert.match(markdown, /API-Responses: 0/);
  assert.match(markdown, /node tools\/recording-workflow\.ts --mode manual/);
});

test("runRecordingCampaignCli plans a focused rerun when UI snapshots are missing", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-campaign-ui-snapshot-"));
  const logFile = path.join(tmpDir, "api-without-ui.jsonl");
  const outputFile = path.join(tmpDir, "recording-campaign.md");
  fs.writeFileSync(
    logFile,
    [
      '{"type":"flow-marker","marker":"step-start","step":"Kundenliste oeffnen"}',
      '{"type":"response","method":"GET","url":"https://api2.optica-omnia.de/apigateway/kunden/customers/search","status":200,"resourceType":"xhr"}',
    ].join("\n"),
  );

  const plan = await runRecordingCampaignCli([logFile, "--out", outputFile]);
  const mission = plan.qualityRerunMissions.find((item) => item.logFile === logFile);
  const markdown = fs.readFileSync(outputFile, "utf8");

  assert.ok(mission);
  assert.deepEqual(mission.findings, ["no-ui-snapshot"]);
  assert.equal(mission.apiResponses, 1);
  assert.equal(mission.timelineMarkers, 1);
  assert.equal(mission.uiSnapshots, 0);
  assert.match(mission.command, /UI-Struktur-Snapshots erzeugen/);
  assert.match(markdown, /UI-Snapshots: 0/);
});

test("buildRecordingCampaignMarkdown recommends quality reruns as the next recording", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Naechste Aufnahme/);
  assert.match(markdown, /Prioritaet: Quality-Rerun/);
  assert.match(markdown, /weak\.jsonl/);
  assert.match(markdown, /Aufnahme weak\.jsonl nachfahren/);
});

test("selectNextRecordingRecommendation exposes the next recording command without parsing markdown", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  assert.deepEqual(selectNextRecordingRecommendation(plan), {
    priority: "Quality-Rerun",
    label: "weak.jsonl",
    reason: "Recording-Qualitaet schwach: no-api-response.",
    mode: "manual",
    command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
    args: ["tools/recording-workflow.ts", "--mode", "manual"],
  });
});

test("selectNextAutoRecordingRecommendation skips manual blockers and returns the next auto run", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  const next = selectNextRecordingRecommendation(plan);
  const nextAuto = selectNextAutoRecordingRecommendation(plan);

  assert.equal(next?.priority, "Quality-Rerun");
  assert.equal(nextAuto?.priority, "Geplanter Recording-Run");
  assert.equal(nextAuto?.mode, "auto");
  assert.match(nextAuto?.command || "", /--mode auto/);
});

test("writeRecordingCampaign writes a machine-readable next recording sidecar", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-campaign-"));
  const outputFile = path.join(tmpDir, "recording-campaign.md");
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
  });

  writeRecordingCampaign(plan, outputFile);

  const next = JSON.parse(fs.readFileSync(path.join(tmpDir, "recording-campaign-next.json"), "utf8"));
  assert.equal(next.priority, "Geplanter Recording-Run");
  assert.equal(next.mode, "auto");
  assert.match(next.command, /node tools\/recording-workflow\.ts --mode auto/);
  assert.deepEqual(next.args.slice(0, 6), ["tools/recording-workflow.ts", "--mode", "auto", "--url", "https://api2.optica-omnia.de", "--stub"]);
});

test("writeRecordingCampaign writes a machine-readable auto-only next sidecar", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-campaign-"));
  const outputFile = path.join(tmpDir, "recording-campaign.md");
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
  });

  writeRecordingCampaign(plan, outputFile);

  const next = JSON.parse(fs.readFileSync(path.join(tmpDir, "recording-campaign-next.json"), "utf8"));
  const nextAuto = JSON.parse(fs.readFileSync(path.join(tmpDir, "recording-campaign-next-auto.json"), "utf8"));
  assert.equal(next.priority, "Quality-Rerun");
  assert.equal(nextAuto.priority, "Geplanter Recording-Run");
  assert.equal(nextAuto.mode, "auto");
});

test("buildRecordingCampaignMarkdown falls back to planned auto runs as the next recording", () => {
  const coverage = buildCoverageReport(
    [{ method: "GET", path: "/customers/search", source: "test" }],
    [],
    { generatedAt: new Date("2026-06-03T12:00:00.000Z") },
  );
  const plan = buildRecordingCampaignPlan(coverage, {
    generatedAt: new Date("2026-06-03T12:10:00.000Z"),
    limit: 1,
    includeManual: false,
  });

  const markdown = buildRecordingCampaignMarkdown(plan);

  assert.match(markdown, /## Naechste Aufnahme/);
  assert.match(markdown, /Prioritaet: Geplanter Recording-Run/);
  assert.match(markdown, /Kundenstamm und Vorgangsdetails aufnehmen/);
  assert.match(markdown, /--mode auto/);
});

test("buildAdaptiveCampaignRunSequence replans after each run and skips already executed areas", () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "GET", path: "/customers/{customerId}", source: "test" },
    { method: "GET", path: "/customers/{customerId}/arzt/{relationId}", source: "test" },
    { method: "POST", path: "/orders/from-proposal", source: "test" },
    { method: "POST", path: "/order-arrival/search", source: "test" },
    { method: "GET", path: "/cash-book-entries/search", source: "test" },
  ];
  const recordsByIteration = [
    [],
    [
      response("2026-06-03T10:00:00.000Z", "Kunde suchen", "GET", "/apigateway/kunden/customers/search"),
    ],
    [
      response("2026-06-03T10:00:00.000Z", "Kunde suchen", "GET", "/apigateway/kunden/customers/search"),
      response("2026-06-03T10:01:00.000Z", "Bestellung lesen", "POST", "/apigateway/wawi/orders/from-proposal"),
    ],
  ];

  const sequence = buildAdaptiveCampaignRunSequence({
    knownEndpoints: known,
    limit: 3,
    includeManual: false,
    recordsForIteration: (iteration) => recordsByIteration[iteration] || recordsByIteration.at(-1) || [],
  });

  assert.deepEqual(
    sequence.map((step) => step.area),
    ["Kunden/Vorgaenge", "Warenwirtschaft/Bestellung", "Abrechnung/Kasse"],
  );
});

test("runAdaptiveCampaignSteps executes one freshly planned step per iteration", async () => {
  const known = [
    { method: "GET", path: "/customers/search", source: "test" },
    { method: "GET", path: "/customers/{customerId}", source: "test" },
    { method: "POST", path: "/orders/from-proposal", source: "test" },
    { method: "POST", path: "/order-arrival/search", source: "test" },
    { method: "GET", path: "/cash-book-entries/search", source: "test" },
  ];
  const recordsByIteration = [
    [],
    [
      response("2026-06-03T10:00:00.000Z", "Kunde suchen", "GET", "/apigateway/kunden/customers/search"),
    ],
  ];
  const executed: string[] = [];

  const result = await runAdaptiveCampaignSteps({
    knownEndpoints: known,
    limit: 2,
    includeManual: false,
    recordsForIteration: (iteration) => recordsByIteration[iteration] || recordsByIteration.at(-1) || [],
    executeStep: async (step) => {
      executed.push(step.area);
    },
  });

  assert.deepEqual(executed, ["Kunden/Vorgaenge", "Warenwirtschaft/Bestellung"]);
  assert.deepEqual(
    result.results.map((item) => `${item.area}:${item.status}`),
    ["Kunden/Vorgaenge:completed", "Warenwirtschaft/Bestellung:completed"],
  );
  assert.deepEqual(result.steps.map((step) => step.index), [1, 2]);
});

test("runAdaptiveCampaignSteps executes quality reruns first when manual missions are included", async () => {
  const executed: string[] = [];
  const result = await runAdaptiveCampaignSteps({
    knownEndpoints: [{ method: "GET", path: "/customers/search", source: "test" }],
    limit: 2,
    includeManual: true,
    recordsForIteration: () => [],
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response", "no-timeline-marker"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response, no-timeline-marker.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
    executeStep: async (step) => {
      executed.push(`${step.area}:${step.label}:${step.mode}`);
    },
  });

  assert.deepEqual(executed, [
    "Recording-Qualitaet:Quality-Rerun weak.jsonl:manual",
    "Kunden/Vorgaenge:Kundenstamm und Vorgangsdetails aufnehmen:auto",
  ]);
  assert.deepEqual(result.steps.map((step) => step.index), [1, 2]);
  assert.match(result.steps[0].command, /weak\.jsonl/);
});

test("runAdaptiveCampaignSteps does not execute quality reruns without manual inclusion", async () => {
  const executed: string[] = [];
  await runAdaptiveCampaignSteps({
    knownEndpoints: [{ method: "GET", path: "/customers/search", source: "test" }],
    limit: 1,
    includeManual: false,
    recordsForIteration: () => [],
    qualityRerunMissions: [
      {
        logFile: "/workspace/logs/network/weak.jsonl",
        findings: ["no-api-response"],
        apiResponses: 0,
        timelineMarkers: 0,
        reason: "Recording-Qualitaet schwach: no-api-response.",
        command: 'node tools/recording-workflow.ts --mode manual --steps "Aufnahme weak.jsonl nachfahren"',
        args: ["tools/recording-workflow.ts", "--mode", "manual"],
      },
    ],
    executeStep: async (step) => {
      executed.push(step.label);
    },
  });

  assert.deepEqual(executed, ["Kundenstamm und Vorgangsdetails aufnehmen"]);
});

test("parseRecordingCampaignArgs defaults to dry-run with bounded auto steps", () => {
  const options = parseRecordingCampaignArgs([]);

  assert.equal(options.run, false);
  assert.equal(options.limit, 5);
  assert.equal(options.includeManual, false);
  assert.equal(options.printNext, false);
  assert.equal(options.outputFile.endsWith("docs/recordings/recording-campaign.md"), true);
});

test("parseRecordingCampaignArgs can request printing the next recording command", () => {
  const options = parseRecordingCampaignArgs(["--print-next"]);

  assert.equal(options.printNext, true);
});

function response(timestamp: string, step: string, method: string, pathname: string): Record<string, unknown> {
  return {
    type: "response",
    timestamp,
    step,
    method,
    url: `https://api2.optica-omnia.de${pathname}`,
    status: 200,
    resourceType: "xhr",
  };
}

function stepArg(args: string[]): string {
  const index = args.indexOf("--steps");
  return index >= 0 ? args[index + 1] || "" : "";
}
