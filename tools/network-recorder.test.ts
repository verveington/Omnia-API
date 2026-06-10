import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { attachNetworkLogger, parseCommonArgs } from "./network-recorder.ts";
import { REDACTED } from "./redact.ts";

class FakePage {
  handlers = new Map<string, Function[]>();

  url(): string {
    return "https://api2.optica-omnia.de/";
  }

  on(event: string, handler: Function): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  off(event: string, handler: Function): void {
    const handlers = this.handlers.get(event) || [];
    this.handlers.set(
      event,
      handlers.filter((item) => item !== handler),
    );
  }

  emit(event: string, payload: unknown): void {
    for (const handler of this.handlers.get(event) || []) handler(payload);
  }
}

test("parseCommonArgs lets --capture-bodies override an environment default that disables bodies", () => {
  const previous = process.env.OMNIA_CAPTURE_BODIES;
  process.env.OMNIA_CAPTURE_BODIES = "0";
  try {
    const options = parseCommonArgs(["--capture-bodies"]);

    assert.equal(options.captureBodies, true);
  } finally {
    if (previous === undefined) delete process.env.OMNIA_CAPTURE_BODIES;
    else process.env.OMNIA_CAPTURE_BODIES = previous;
  }
});

test("parseCommonArgs ignores removed video recording flags and environment variables", () => {
  const previousRecordVideo = process.env.OMNIA_RECORD_VIDEO;
  const previousVideoDir = process.env.OMNIA_VIDEO_DIR;
  process.env.OMNIA_RECORD_VIDEO = "1";
  process.env.OMNIA_VIDEO_DIR = "logs/video";
  try {
    const options = parseCommonArgs(["--video", "--video-dir", "logs/custom-video"]);

    assert.equal("recordVideo" in options, false);
    assert.equal("videoDir" in options, false);
  } finally {
    if (previousRecordVideo === undefined) delete process.env.OMNIA_RECORD_VIDEO;
    else process.env.OMNIA_RECORD_VIDEO = previousRecordVideo;
    if (previousVideoDir === undefined) delete process.env.OMNIA_VIDEO_DIR;
    else process.env.OMNIA_VIDEO_DIR = previousVideoDir;
  }
});

test("attachNetworkLogger records redacted download metadata with the active step", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-network-recorder-"));
  const logFile = path.join(dir, "session.jsonl");
  const page = new FakePage();
  const recorder = attachNetworkLogger(page, {
    outputFile: logFile,
    sessionId: "export-session",
    getCurrentStep: () => "CSV exportieren",
  });

  page.emit("download", {
    url: () => "blob:https://api2.optica-omnia.de/0c0ffee0-export",
    suggestedFilename: () => "Max-Mustermann-Kunden.csv",
  });
  recorder.stop();

  const records = fs
    .readFileSync(logFile, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
  const download = records.find((record) => record.type === "download");

  assert.equal(download.step, "CSV exportieren");
  assert.equal(download.suggestedFilename, REDACTED);
  assert.equal(download.suggestedFileExtension, ".csv");
  assert.match(download.url, /^blob:/);
});

test("attachNetworkLogger keeps large JSON response structure in truncated form", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-network-recorder-"));
  const logFile = path.join(dir, "session.jsonl");
  const page = new FakePage();
  const recorder = attachNetworkLogger(page, {
    outputFile: logFile,
    sessionId: "large-json-session",
    maxBodyBytes: 90,
    getCurrentStep: () => "Bestellvorschlaege laden",
  });

  const body = JSON.stringify({
    content: Array.from({ length: 12 }, (_value, index) => ({ id: index + 1, articleDescription: "Musterartikel" })),
    customer: { firstName: "Max", lastName: "Mustermann" },
  });
  page.emit("response", {
    request: () => ({
      method: () => "POST",
      resourceType: () => "xhr",
    }),
    allHeaders: async () => ({ "content-type": "application/json" }),
    body: async () => Buffer.from(body, "utf8"),
    url: () => "https://api2.optica-omnia.de/apigateway/wawi/order-proposals/search",
    status: () => 200,
    statusText: () => "OK",
  });

  await new Promise((resolve) => setTimeout(resolve, 20));
  recorder.stop();

  const records = fs
    .readFileSync(logFile, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
  const response = records.find((record) => record.type === "response");

  assert.equal(response.bodyTruncated, true);
  assert.equal(response.bodyOmittedReason, "body-truncated-json");
  assert.ok(response.bodySize > 90);
  assert.equal(Array.isArray(response.body.content), true);
  assert.equal(response.body.content.length, 5);
  assert.equal(response.body.customer.firstName, REDACTED);
  assert.equal(response.body.customer.lastName, REDACTED);
});

test("attachNetworkLogger records redacted navigation and browser diagnostics with the active step", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-network-recorder-"));
  const logFile = path.join(dir, "session.jsonl");
  const page = new FakePage();
  const recorder = attachNetworkLogger(page, {
    outputFile: logFile,
    sessionId: "diagnostic-session",
    getCurrentStep: () => "Kunde oeffnen",
  });

  page.emit("framenavigated", {
    parentFrame: () => null,
    url: () => "https://api2.optica-omnia.de/master-data/customers/123?query=max.mustermann@example.test",
  });
  page.emit("console", {
    type: () => "error",
    text: () => "Kunde Max Mustermann mit Bearer abc.def.ghi konnte nicht geladen werden",
    location: () => ({
      url: "https://api2.optica-omnia.de/assets/main.js?token=secret",
      lineNumber: 42,
      columnNumber: 7,
    }),
  });
  page.emit("pageerror", new Error("Fehler fuer Patient Max Mustermann max.mustermann@example.test"));
  recorder.stop();

  const records = fs
    .readFileSync(logFile, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
  const navigation = records.find((record) => record.type === "navigation");
  const browserConsole = records.find((record) => record.type === "browser-console");
  const pageError = records.find((record) => record.type === "browser-pageerror");

  assert.equal(navigation.step, "Kunde oeffnen");
  assert.equal(navigation.url, "https://api2.optica-omnia.de/master-data/customers/123?query=%5BREDACTED%5D");
  assert.equal(browserConsole.level, "error");
  assert.equal(browserConsole.step, "Kunde oeffnen");
  assert.equal(browserConsole.location.url, "https://api2.optica-omnia.de/assets/main.js?token=%5BREDACTED%5D");
  assert.doesNotMatch(browserConsole.text, /Max Mustermann|max\.mustermann|Bearer abc/);
  assert.match(browserConsole.text, /\[REDACTED\]/);
  assert.doesNotMatch(pageError.message, /Max Mustermann|max\.mustermann/);
});
