import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

import { CAPTURED_AUTH_FILE, DEFAULT_BASE_URL } from "./export-data-platform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const baseUrl = process.env.OMNIA_URL || DEFAULT_BASE_URL;

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  headless: false,
  args: ["--window-size=1440,900"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 820 },
  ignoreHTTPSErrors: true,
  serviceWorkers: "block",
});
await installElectronStub(context, baseUrl);
const page = await context.newPage();

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  console.log("=".repeat(72));
  console.log("Omnia Auth-Capture");
  console.log(`Browser: ${baseUrl}`);
  console.log(`Ziel: ${path.relative(workspaceRoot, CAPTURED_AUTH_FILE)}`);
  console.log("Logge dich im Chromium-Fenster normal ein und druecke danach hier Enter.");
  console.log("Es werden keine Cookie-Werte ausgegeben.");
  console.log("=".repeat(72));

  const rl = readline.createInterface({ input, output });
  await rl.question("Nach erfolgreichem Login Enter druecken ...");
  rl.close();

  const cookies = await context.cookies(baseUrl);
  const cookieHeader = cookies
    .filter((cookie) => cookie.name && cookie.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!cookieHeader) {
    throw new Error("Keine Cookies gefunden. Ist der Login im Chromium-Fenster wirklich abgeschlossen?");
  }

  fs.mkdirSync(path.dirname(CAPTURED_AUTH_FILE), { recursive: true });
  fs.writeFileSync(
    CAPTURED_AUTH_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        authInput: `Cookie: ${cookieHeader}`,
        cookieNames: cookies.map((cookie) => cookie.name).sort(),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  fs.chmodSync(CAPTURED_AUTH_FILE, 0o600);
  console.log(`Auth-Capture gespeichert: ${path.relative(workspaceRoot, CAPTURED_AUTH_FILE)}`);
  console.log(`Cookie-Namen: ${cookies.map((cookie) => cookie.name).sort().join(", ")}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
}

async function loadPlaywright() {
  try {
    const module = await import("playwright");
    return module.chromium ? module : module.default;
  } catch {
    const module = await import("../playwright-recorder/node_modules/playwright/index.js");
    return module.chromium ? module : module.default;
  }
}

async function installElectronStub(context, apiUrl) {
  const stubPath = path.join(workspaceRoot, "playwright-recorder", "src", "electron-ipc-stub.js");
  if (!fs.existsSync(stubPath)) {
    console.warn("Electron-Stub nicht gefunden; Arbeitsplatzkennung kann im Browser fehlschlagen.");
    return;
  }

  const stubScript = fs.readFileSync(stubPath, "utf8");
  const stubConfig = {
    url: apiUrl,
    version: process.env.OMNIA_APP_VERSION || "analysis-0.0.0",
    machineId: process.env.OMNIA_MACHINE_ID || "",
    tenantId: process.env.OMNIA_TENANT_ID || "",
  };
  await context.addInitScript({
    content: `window.__OMNIA_STUB__ = ${JSON.stringify(stubConfig)};\n${stubScript}`,
  });
}
