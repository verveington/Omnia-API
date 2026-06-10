import fs from "node:fs";

const DEFAULT_VM_NAME = "Windows 11";
const DEFAULT_APP_PATH = "C:\\Users\\christophschernthane\\AppData\\Local\\Programs\\Optica Omnia\\Optica Omnia.exe";
const DEFAULT_PROFILE_PATH = "C:\\Temp\\omnia-cdp-profile";
const DEFAULT_GUEST_DEBUG_PORT = 9225;
const DEFAULT_HOST_DEBUG_PORT = 9226;
const DEFAULT_CONNECT_TIMEOUT_MS = 30000;

export function createNativeCdpConfig(env = process.env) {
  const guestDebugPort = parsePort(env.OMNIA_NATIVE_GUEST_DEBUG_PORT, DEFAULT_GUEST_DEBUG_PORT);
  const hostDebugPort = parsePort(env.OMNIA_NATIVE_HOST_DEBUG_PORT, DEFAULT_HOST_DEBUG_PORT);
  const vmIp = env.OMNIA_VM_IP || "";
  const profilePath = env.OMNIA_NATIVE_PROFILE_PATH || DEFAULT_PROFILE_PATH;
  const cleanProfile = parseCleanProfile(env.OMNIA_NATIVE_CLEAN_PROFILE, profilePath);

  return {
    vmName: env.OMNIA_VM_NAME || DEFAULT_VM_NAME,
    vmIp,
    appPath: env.OMNIA_NATIVE_APP_PATH || DEFAULT_APP_PATH,
    profilePath,
    guestDebugPort,
    hostDebugPort,
    firewallRuleName: env.OMNIA_NATIVE_FIREWALL_RULE || `Omnia CDP Test ${hostDebugPort}`,
    connectTimeoutMs: parsePositiveInt(env.OMNIA_NATIVE_CONNECT_TIMEOUT_MS, DEFAULT_CONNECT_TIMEOUT_MS),
    cleanProfile,
    hostEndpoint: vmIp ? `http://${vmIp}:${hostDebugPort}` : "",
  };
}

export function parseVmIp(prlctlInfoOutput) {
  const match = String(prlctlInfoOutput).match(/IP Addresses:\s*([0-9]+(?:\.[0-9]+){3})/);
  return match?.[1] || "";
}

export function selectPageTarget(targets) {
  if (!Array.isArray(targets)) return null;
  return (
    targets.find((target) => target.type === "page" && target.url?.includes("api2.optica-omnia.de")) ||
    targets.find((target) => target.type === "page") ||
    null
  );
}

export function scoreOmniaPageSnapshot(snapshot, options = {}) {
  const href = String(snapshot?.href || "");
  if (!href.includes("api2.optica-omnia.de")) return Number.NEGATIVE_INFINITY;
  if (snapshot?.readyState === "loading") return Number.NEGATIVE_INFINITY;

  const pathname = pathnameOf(href);
  const buttonCount = positiveNumber(snapshot?.buttonCount);
  const linkCount = positiveNumber(snapshot?.linkCount);
  const tabCount = positiveNumber(snapshot?.tabCount);
  const inputCount = positiveNumber(snapshot?.inputCount);
  const bodyTextLength = positiveNumber(snapshot?.bodyTextLength);
  const controlCount = buttonCount + linkCount + tabCount + inputCount;

  if (controlCount === 0) return -10_000 + Math.min(bodyTextLength, 100);

  let score = controlCount * 2;
  score += tabCount * 3;
  score += Math.min(bodyTextLength / 20, 50);

  if (pathname === "/login") score -= 1_000;
  if (pathname === "/dashboard" && bodyTextLength === 0) score -= 500;

  if (options.preferDashboardShell) {
    if (pathname === "/") score += 500;
    else if (pathname === "/dashboard") score += 100;
    else score -= 100;
  } else {
    if (pathname === "/") score += 10;
    if (pathname !== "/" && pathname !== "/login") score += 100;
  }

  return score;
}

export function loadEnvFile(file, env = process.env) {
  if (!fs.existsSync(file)) return env;
  return parseEnvFile(fs.readFileSync(file, "utf8"), env);
}

export function parseEnvFile(text, env = process.env) {
  for (const line of String(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!key || env[key] !== undefined) continue;

    env[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return env;
}

export function isReadlineClosedError(error) {
  return error instanceof Error && error.message === "readline was closed";
}

export function buildLaunchScript(config) {
  const appPath = quotePs(config.appPath);
  const profilePath = quotePs(config.profilePath);
  const args = [
    `--remote-debugging-port=${config.guestDebugPort}`,
    `--user-data-dir=${config.profilePath}`,
  ]
    .map(quotePs)
    .join(", ");

  return [
    `$profile = ${profilePath}`,
    "New-Item -ItemType Directory -Force -Path $profile | Out-Null",
    `Start-Process -FilePath ${appPath} -ArgumentList @(${args}) -PassThru | Select-Object -ExpandProperty Id`,
  ].join("; ");
}

export function buildPortProxySetupScript(config) {
  const ruleName = quotePs(config.firewallRuleName);

  return [
    `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=${config.hostDebugPort} | Out-Null`,
    `netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=${config.hostDebugPort} connectaddress=127.0.0.1 connectport=${config.guestDebugPort}`,
    `netsh advfirewall firewall delete rule name=${ruleName} | Out-Null`,
    `netsh advfirewall firewall add rule name=${ruleName} dir=in action=allow protocol=TCP localport=${config.hostDebugPort}`,
  ].join("; ");
}

export function buildCleanupScript(config) {
  const ruleName = quotePs(config.firewallRuleName);
  const profilePath = quotePs(config.profilePath);
  const processFilter = quotePs(`*--remote-debugging-port=${config.guestDebugPort}*`);
  const cleanupProfile = config.cleanProfile
    ? `; if (Test-Path ${profilePath}) { Remove-Item -Recurse -Force ${profilePath} -ErrorAction SilentlyContinue }`
    : "";

  return [
    `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'Optica Omnia.exe' -and $_.CommandLine -like ${processFilter} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
    `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=${config.hostDebugPort} | Out-Null`,
    `netsh advfirewall firewall delete rule name=${ruleName} | Out-Null${cleanupProfile}`,
  ].join("; ");
}

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) return parsed;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return fallback;
}

function positiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function pathnameOf(href) {
  try {
    return new URL(href).pathname;
  } catch {
    return "";
  }
}

function parseCleanProfile(value, profilePath) {
  if (value === "1") return true;
  if (value === "0") return false;
  return /^C:\\Temp\\omnia-cdp-[^\\]+$/i.test(profilePath);
}

function quotePs(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}
