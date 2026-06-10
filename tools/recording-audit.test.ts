import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  auditRecordingArtifacts,
  buildRecordingAuditMarkdown,
  evaluateNetworkLogQuality,
  parseRecordingAuditArgs,
} from "./recording-audit.ts";

test("parseRecordingAuditArgs reads artifact files and output file", () => {
  const options = parseRecordingAuditArgs([
    "--log",
    "logs/network/test.jsonl",
    "--flow-report",
    "docs/recordings/test-flow.md",
    "--catalog",
    "docs/03_api_catalog.md",
    "--knowledge",
    "docs/10_omnia_knowledge.md",
    "--relationships",
    "docs/12_omnia_relationships.md",
    "--data-model",
    "docs/13_omnia_data_model.md",
    "--blueprint",
    "docs/11_platform_blueprint.md",
    "--scoreboard",
    "docs/recordings/recording-scoreboard.md",
    "--impact",
    "docs/recordings/test-impact.md",
    "--impact-json",
    "docs/recordings/test-impact.json",
    "--out",
    "docs/recordings/test-audit.md",
  ]);

  assert.equal(options.files.length, 10);
  assert.equal(options.files.some((file) => file.role === "Knowledge-Report"), true);
  assert.equal(options.files.some((file) => file.role === "Relationship-Map"), true);
  assert.equal(options.files.some((file) => file.role === "Data-Model"), true);
  assert.equal(options.files.some((file) => file.role === "Plattform-Blueprint"), true);
  assert.equal(options.files.some((file) => file.role === "Recording-Scoreboard"), true);
  assert.equal(options.files.some((file) => file.role === "Impact-Report"), true);
  assert.equal(options.files.some((file) => file.role === "Impact-JSON"), true);
  assert.equal(path.basename(options.outputFile), "test-audit.md");
});

test("evaluateNetworkLogQuality requires UI snapshots for structure-aware recordings", () => {
  const baseRecords = [
    { type: "flow-marker", marker: "step-start", step: "Kunde suchen" },
    {
      type: "response",
      method: "GET",
      url: "https://api2.optica-omnia.de/apigateway/kunden/customers/search",
      status: 200,
      resourceType: "xhr",
    },
  ];

  const withoutSnapshot = evaluateNetworkLogQuality(baseRecords);

  assert.equal(withoutSnapshot.uiSnapshotCount, 0);
  assert.deepEqual(withoutSnapshot.findings.map((finding) => finding.pattern), ["no-ui-snapshot"]);

  const withSnapshot = evaluateNetworkLogQuality([
    ...baseRecords,
    { type: "ui-snapshot", routePath: "/customers", title: "Kunden" },
  ]);

  assert.equal(withSnapshot.uiSnapshotCount, 1);
  assert.deepEqual(withSnapshot.findings.map((finding) => finding.pattern), []);
});

test("auditRecordingArtifacts passes when required text artifacts exist and contain only redacted secrets", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-recording-audit-"));
  const logFile = path.join(dir, "session.jsonl");
  const catalogFile = path.join(dir, "catalog.md");
  fs.writeFileSync(
    logFile,
    [
      '{"type":"flow-marker","marker":"step-start","step":"Kunde suchen"}',
      '{"type":"ui-snapshot","routePath":"/customers","title":"Kunden","headings":["Kunden"],"actions":["Suchen"]}',
      '{"type":"response","method":"GET","url":"https://api2.optica-omnia.de/apigateway/kunden/customers/search","status":200,"resourceType":"xhr","headers":{"authorization":"[REDACTED]","cookie":"[REDACTED]"},"body":"[REDACTED]"}',
    ].join("\n"),
  );
  fs.writeFileSync(catalogFile, "# API-Katalog\n\nKeine Rohdaten.\n");

  const audit = auditRecordingArtifacts({
    files: [
      { role: "Netzwerk-Log", file: logFile, required: true },
      { role: "API-Katalog", file: catalogFile, required: true },
    ],
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
  });

  assert.equal(audit.status, "passed");
  assert.equal(audit.findings.length, 0);
});

test("auditRecordingArtifacts flags network logs without API responses and timeline markers", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-recording-audit-"));
  const logFile = path.join(dir, "session.jsonl");
  fs.writeFileSync(
    logFile,
    [
      '{"type":"response","method":"GET","url":"https://app.optica-omnia.de/assets/app.js","status":200,"resourceType":"script"}',
      '{"type":"request","method":"GET","url":"https://api2.optica-omnia.de/apigateway/kunden/customers/search","resourceType":"xhr"}',
    ].join("\n"),
  );

  const audit = auditRecordingArtifacts({
    files: [{ role: "Netzwerk-Log", file: logFile, required: true }],
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
  });

  assert.equal(audit.status, "failed");
  assert.equal(audit.findings.some((finding) => finding.kind === "quality-warning" && finding.pattern === "no-api-response"), true);
  assert.equal(audit.findings.some((finding) => finding.kind === "quality-warning" && finding.pattern === "no-timeline-marker"), true);
  assert.equal(audit.findings.some((finding) => finding.kind === "quality-warning" && finding.pattern === "no-ui-snapshot"), true);
});

test("auditRecordingArtifacts fails missing required files and obvious unredacted sensitive values", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-recording-audit-"));
  const logFile = path.join(dir, "session.jsonl");
  fs.writeFileSync(
    logFile,
    [
      '{"headers":{"authorization":"Bearer abc.def.ghi"}}',
      '{"body":"Kontakt user@example.test, KVNR A123456789"}',
    ].join("\n"),
  );

  const audit = auditRecordingArtifacts({
    files: [
      { role: "Netzwerk-Log", file: logFile, required: true },
      { role: "OpenAPI", file: path.join(dir, "missing.yaml"), required: true },
    ],
  });

  assert.equal(audit.status, "failed");
  assert.equal(audit.findings.some((finding) => finding.kind === "missing-file" && finding.role === "OpenAPI"), true);
  assert.equal(audit.findings.some((finding) => finding.kind === "secret-leak" && finding.pattern === "bearer-token"), true);
  assert.equal(audit.findings.some((finding) => finding.kind === "pii-leak" && finding.pattern === "email"), true);
  assert.equal(audit.findings.some((finding) => finding.kind === "pii-leak" && finding.pattern === "kvnr"), true);
});

test("buildRecordingAuditMarkdown summarizes pass/fail and findings", () => {
  const markdown = buildRecordingAuditMarkdown({
    status: "failed",
    generatedAt: "2026-06-03T12:00:00.000Z",
    checkedFiles: [{ role: "Netzwerk-Log", file: "/workspace/logs/network/test.jsonl", exists: true }],
    findings: [
      {
        kind: "secret-leak",
        severity: "high",
        role: "Netzwerk-Log",
        file: "/workspace/logs/network/test.jsonl",
        line: 1,
        pattern: "bearer-token",
        message: "Bearer-Token nicht redacted.",
      },
    ],
  });

  assert.match(markdown, /^# Recording-Audit/m);
  assert.match(markdown, /Status: failed/);
  assert.match(markdown, /bearer-token/);
  assert.match(markdown, /test\.jsonl/);
});
