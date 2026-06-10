import { execFile } from "node:child_process";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { promisify } from "node:util";

import { chromium } from "playwright";

import {
  commandHelp,
  executeNativeCommand,
  parseNativeCommand,
} from "./native-cdp-commands.js";
import {
  buildCleanupScript,
  buildLaunchScript,
  buildPortProxySetupScript,
  createNativeCdpConfig,
  isReadlineClosedError,
  loadEnvFile,
  parseVmIp,
  selectPageTarget,
} from "./native-cdp-utils.js";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, "..");

loadEnvFile(path.join(projectRoot, ".env.local"));

const mode = parseMode(process.argv.slice(2));
let browser;

try {
  let config = createNativeCdpConfig();
  config = await resolveVmIp(config);

  console.log(`VM: ${config.vmName} (${config.vmIp})`);
  console.log(`CDP: Windows 127.0.0.1:${config.guestDebugPort} -> Mac ${config.hostEndpoint}`);

  await execWindowsPowerShell(config, buildCleanupScript(config));
  await execWindowsPowerShell(config, buildPortProxySetupScript(config));

  console.log("Starting controlled Omnia instance...");
  await execWindowsPowerShell(config, buildLaunchScript(config), { currentUser: true });

  const target = await waitForDevToolsTarget(config);
  console.log(`DevTools target: ${target.title || "(no title)"} ${target.url || "(no url)"}`);

  browser = await chromium.connectOverCDP(config.hostEndpoint, {
    timeout: config.connectTimeoutMs,
  });

  const page = browser.contexts().flatMap((context) => context.pages())[0];
  if (!page) {
    throw new Error("Playwright connected, but no page target was exposed.");
  }

  await waitForUsablePage(page);
  console.log("Page summary:");
  console.log(JSON.stringify(await summarizePage(page), null, 2));

  if (mode.session) {
    await runCommandSession(page);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close().catch(() => {});
  }

  if (!mode.noCleanup) {
    const config = await resolveVmIp(createNativeCdpConfig()).catch(() => createNativeCdpConfig());
    await execWindowsPowerShell(config, buildCleanupScript(config)).catch((error) => {
      console.warn(`Cleanup warning: ${error.message}`);
    });
  } else {
    console.warn("Cleanup skipped by --no-cleanup. The debug port may remain exposed.");
  }
}

async function runCommandSession(page) {
  console.log("Command session is active. Type \"hilfe\" for commands or \"beenden\" to close and clean up.");
  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      const line = await askLine(rl, "omnia> ");
      if (line === null) break;

      const command = parseNativeCommand(line);
      if (command.type === "noop" || command.type === "quit") break;

      try {
        const result = await executeNativeCommand(page, command);
        console.log(result.message);
      } catch (error) {
        console.error(`Befehl fehlgeschlagen: ${error.message}`);
        console.log(`Verfuegbare Befehle:\n- ${commandHelp.join("\n- ")}`);
      }
    }
  } finally {
    rl.close();
  }
}

async function askLine(rl, prompt) {
  try {
    return await rl.question(prompt);
  } catch (error) {
    if (isReadlineClosedError(error)) return null;
    throw error;
  }
}

async function resolveVmIp(config) {
  if (config.vmIp) return config;

  const { stdout } = await execFileAsync("prlctl", ["list", "-i", config.vmName], {
    maxBuffer: 1024 * 1024,
  });
  const vmIp = parseVmIp(stdout);
  if (!vmIp) {
    throw new Error(`Could not detect an IP address for Parallels VM "${config.vmName}".`);
  }

  return {
    ...config,
    vmIp,
    hostEndpoint: `http://${vmIp}:${config.hostDebugPort}`,
  };
}

async function execWindowsPowerShell(config, script, { currentUser = false } = {}) {
  const args = ["exec", config.vmName];
  if (currentUser) args.push("--current-user");
  args.push("powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script);

  return execFileAsync("prlctl", args, {
    maxBuffer: 1024 * 1024,
  });
}

async function waitForDevToolsTarget(config) {
  const deadline = Date.now() + config.connectTimeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${config.hostEndpoint}/json/list`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const targets = await response.json();
      const target = selectPageTarget(targets);
      if (target) return target;
      lastError = new Error("DevTools is reachable, but no page target is available yet.");
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for Omnia DevTools target: ${lastError?.message || "unknown error"}`);
}

async function summarizePage(page) {
  return page.evaluate(() => ({
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    buttonCount: document.querySelectorAll("button").length,
    inputCount: document.querySelectorAll("input, textarea, [contenteditable=true]").length,
  }));
}

async function waitForUsablePage(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(
    () =>
      location.href.includes("/login") ||
      document.querySelectorAll("button, input, textarea, [contenteditable=true]").length > 0,
    null,
    { timeout: 15000 },
  ).catch(() => {});
}

function parseMode(args) {
  return {
    session: args.includes("--session"),
    noCleanup: args.includes("--no-cleanup"),
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
