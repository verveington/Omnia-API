import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCleanupScript,
  buildLaunchScript,
  buildPortProxySetupScript,
  createNativeCdpConfig,
  isReadlineClosedError,
  parseEnvFile,
  parseVmIp,
  scoreOmniaPageSnapshot,
  selectPageTarget,
} from "./native-cdp-utils.js";

test("createNativeCdpConfig applies safe defaults and environment overrides", () => {
  const config = createNativeCdpConfig({
    OMNIA_VM_NAME: "Windows Test",
    OMNIA_VM_IP: "10.0.0.4",
    OMNIA_NATIVE_GUEST_DEBUG_PORT: "9333",
    OMNIA_NATIVE_HOST_DEBUG_PORT: "9334",
  });

  assert.equal(config.vmName, "Windows Test");
  assert.equal(config.vmIp, "10.0.0.4");
  assert.equal(config.guestDebugPort, 9333);
  assert.equal(config.hostDebugPort, 9334);
  assert.equal(config.hostEndpoint, "http://10.0.0.4:9334");
  assert.match(config.appPath, /Optica Omnia\.exe$/);
});

test("parseVmIp reads the Parallels IP address from prlctl output", () => {
  const output = `
INFO
Name: Windows 11
Network:
  Conditioned: off
  IP Addresses: 10.211.55.5
`;

  assert.equal(parseVmIp(output), "10.211.55.5");
});

test("parseEnvFile reads simple .env.local values without overwriting existing env", () => {
  const parsed = parseEnvFile(
    `
# comment
OMNIA_VM_NAME="Windows From File"
OMNIA_NATIVE_HOST_DEBUG_PORT=9445
EXISTING=from-file
`,
    { EXISTING: "from-env" },
  );

  assert.equal(parsed.OMNIA_VM_NAME, "Windows From File");
  assert.equal(parsed.OMNIA_NATIVE_HOST_DEBUG_PORT, "9445");
  assert.equal(parsed.EXISTING, "from-env");
});

test("isReadlineClosedError detects non-interactive stdin EOF from readline", () => {
  assert.equal(isReadlineClosedError(new Error("readline was closed")), true);
  assert.equal(isReadlineClosedError(new Error("other failure")), false);
});

test("selectPageTarget ignores service workers and returns the Omnia page", () => {
  const targets = [
    { type: "service_worker", url: "https://api2.optica-omnia.de/ngsw-worker.js" },
    { type: "page", title: "Optica Omnia", url: "https://api2.optica-omnia.de/login" },
  ];

  assert.deepEqual(selectPageTarget(targets), targets[1]);
});

test("scoreOmniaPageSnapshot prefers rich content for normal control", () => {
  const rootShell = {
    href: "https://api2.optica-omnia.de/",
    readyState: "complete",
    buttonCount: 8,
    linkCount: 4,
    tabCount: 0,
    inputCount: 1,
    bodyTextLength: 110,
  };
  const customerPage = {
    href: "https://api2.optica-omnia.de/master-data/customers/08901aa6-8c23-4e1b-8c61-109a8573feeb",
    readyState: "complete",
    buttonCount: 16,
    linkCount: 4,
    tabCount: 12,
    inputCount: 23,
    bodyTextLength: 900,
  };

  assert.ok(scoreOmniaPageSnapshot(customerPage) > scoreOmniaPageSnapshot(rootShell));
});

test("scoreOmniaPageSnapshot prefers the app shell for dashboard exploration", () => {
  const rootShell = {
    href: "https://api2.optica-omnia.de/",
    readyState: "complete",
    buttonCount: 8,
    linkCount: 4,
    tabCount: 0,
    inputCount: 1,
    bodyTextLength: 110,
  };
  const blankDashboard = {
    href: "https://api2.optica-omnia.de/dashboard",
    readyState: "complete",
    buttonCount: 0,
    linkCount: 0,
    tabCount: 0,
    inputCount: 0,
    bodyTextLength: 0,
  };
  const loginPage = {
    href: "https://api2.optica-omnia.de/login",
    readyState: "complete",
    buttonCount: 10,
    linkCount: 6,
    tabCount: 0,
    inputCount: 4,
    bodyTextLength: 240,
  };
  const customerPage = {
    href: "https://api2.optica-omnia.de/master-data/customers/08901aa6-8c23-4e1b-8c61-109a8573feeb",
    readyState: "complete",
    buttonCount: 16,
    linkCount: 4,
    tabCount: 12,
    inputCount: 23,
    bodyTextLength: 900,
  };

  const explorerOptions = { preferDashboardShell: true };
  assert.ok(scoreOmniaPageSnapshot(rootShell, explorerOptions) > scoreOmniaPageSnapshot(customerPage, explorerOptions));
  assert.ok(scoreOmniaPageSnapshot(rootShell, explorerOptions) > scoreOmniaPageSnapshot(loginPage, explorerOptions));
  assert.ok(scoreOmniaPageSnapshot(rootShell, explorerOptions) > scoreOmniaPageSnapshot(blankDashboard, explorerOptions));
});

test("buildLaunchScript starts Omnia with a remote debugging port and isolated profile", () => {
  const config = createNativeCdpConfig({
    OMNIA_NATIVE_GUEST_DEBUG_PORT: "9444",
    OMNIA_NATIVE_PROFILE_PATH: "C:\\Temp\\omnia-cdp-test",
  });

  const script = buildLaunchScript(config);

  assert.match(script, /Start-Process/);
  assert.match(script, /--remote-debugging-port=9444/);
  assert.match(script, /--user-data-dir=C:\\Temp\\omnia-cdp-test/);
});

test("buildPortProxySetupScript exposes the guest loopback CDP port through a host port", () => {
  const config = createNativeCdpConfig({
    OMNIA_NATIVE_GUEST_DEBUG_PORT: "9444",
    OMNIA_NATIVE_HOST_DEBUG_PORT: "9445",
  });

  const script = buildPortProxySetupScript(config);

  assert.match(script, /listenport=9445/);
  assert.match(script, /connectaddress=127\.0\.0\.1/);
  assert.match(script, /connectport=9444/);
  assert.match(script, /advfirewall firewall add rule/);
});

test("buildCleanupScript removes only the controlled debug instance and temporary access", () => {
  const config = createNativeCdpConfig({
    OMNIA_NATIVE_GUEST_DEBUG_PORT: "9444",
    OMNIA_NATIVE_HOST_DEBUG_PORT: "9445",
    OMNIA_NATIVE_PROFILE_PATH: "C:\\Temp\\omnia-cdp-test",
  });

  const script = buildCleanupScript(config);

  assert.match(script, /--remote-debugging-port=9444/);
  assert.match(script, /listenport=9445/);
  assert.match(script, /Remove-Item -Recurse -Force 'C:\\Temp\\omnia-cdp-test'/);
});
