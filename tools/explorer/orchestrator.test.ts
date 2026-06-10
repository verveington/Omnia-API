import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createExploreLogPath,
  parseHandsOffArgs,
  runReadOnlyExplorer,
} from "./orchestrator.ts";

test("parseHandsOffArgs uses safe hands-off defaults", () => {
  const options = parseHandsOffArgs([]);

  assert.equal(options.captureBodies, false);
  assert.equal(options.allowReadLikePosts, true);
  assert.equal(options.waitForLogin, false);
  assert.equal(options.rebuildCatalog, true);
  assert.equal(options.rebuildCoverageReport, true);
  assert.equal(options.maxSteps, 180);
  assert.equal(options.maxMinutes, 20);
  assert.match(options.reportFile, /docs\/06_auto_explore_report\.md$/);
  assert.match(options.logFile, /logs\/network\/.+-explore\.jsonl$/);
});

test("parseHandsOffArgs honors explicit flags", () => {
  const options = parseHandsOffArgs([
    "--cdp",
    "http://127.0.0.1:9222",
    "--capture-bodies",
    "--strict-get-only",
    "--wait-for-login",
    "--max-steps",
    "25",
    "--max-minutes",
    "3",
    "--settle-ms",
    "250",
    "--start-path",
    "/dashboard",
    "--report",
    "tmp/custom-report.md",
    "--out",
    "tmp/custom-log.jsonl",
    "--no-catalog",
    "--no-coverage",
    "--resolve-test-customer",
  ]);

  assert.equal(options.cdpEndpoint, "http://127.0.0.1:9222");
  assert.equal(options.captureBodies, true);
  assert.equal(options.allowReadLikePosts, false);
  assert.equal(options.waitForLogin, true);
  assert.equal(options.maxSteps, 25);
  assert.equal(options.maxMinutes, 3);
  assert.equal(options.settleMs, 250);
  assert.equal(options.startPath, "/dashboard");
  assert.equal(options.rebuildCatalog, false);
  assert.equal(options.rebuildCoverageReport, false);
  assert.equal(options.resolveTestCustomer, true);
  assert.equal(path.basename(options.reportFile), "custom-report.md");
  assert.equal(path.basename(options.logFile), "custom-log.jsonl");
});

test("createExploreLogPath creates explore JSONL names", () => {
  const file = createExploreLogPath(new Date(2026, 4, 25, 9, 7));

  assert.match(file, /logs\/network\/2026-05-25_09-07-explore\.jsonl$/);
});

test("runReadOnlyExplorer writes a timeline marker even when a module has no clickable targets", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-empty-module-"));
  const logFile = path.join(dir, "empty-module.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) return [];
      return {
        url: currentUrl,
        title: "Zahlungsbedingungen",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 3,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/accounting/payment-terms",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  const records = fs.readFileSync(logFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  assert.equal(records.some((record) => record.type === "explore-marker" && record.marker === "explore-start"), true);
});

test("runReadOnlyExplorer does not count out-of-scope global routes as open module targets", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-scoped-module-"));
  const logFile = path.join(dir, "scoped-module.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        return [
          {
            selector: "[data-x='search']",
            role: "link",
            text: "Suche",
            href: "/search",
            path: "/search",
            currentPath: "/merchandise-management/article-management/articles",
          },
          {
            selector: "[data-x='cash']",
            role: "link",
            text: "Cash Till",
            href: "/cash-till",
            path: "/cash-till",
            currentPath: "/merchandise-management/article-management/articles",
          },
        ];
      }
      return {
        url: currentUrl,
        title: "Artikel",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 3,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/merchandise-management/article-management/articles",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.clicked.length, 0);
  assert.equal(result.discoveredTargets.length, 0);
});

test("runReadOnlyExplorer waits at least two seconds between automated clicks", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-click-pause-"));
  const logFile = path.join(dir, "click-pause.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const waits: number[] = [];
  const clicks: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const candidates = [
    {
      selector: "[data-x='articles']",
      role: "link",
      text: "Artikel",
      href: "/merchandise-management/article-management/articles",
      path: "/merchandise-management/article-management/articles",
      currentPath: "/dashboard",
    },
    {
      selector: "[data-x='groups']",
      role: "link",
      text: "Warengruppen",
      href: "/merchandise-management/article-management/material-groups",
      path: "/merchandise-management/article-management/material-groups",
      currentPath: "/dashboard",
    },
  ];
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
    locator: (selector: string) => ({
      click: async () => {
        clicks.push(selector);
        const candidate = candidates.find((entry) => entry.selector === selector);
        if (candidate?.path) currentUrl = new URL(candidate.path, currentUrl).toString();
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) return candidates;
      return {
        url: currentUrl,
        title: "Warenwirtschaft",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 2,
    maxMinutes: 1,
    settleMs: 1,
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.clicked.length, 2);
  assert.equal(clicks.length, 2);
  assert.equal(waits.some((ms) => ms >= 1900), true);
});

test("runReadOnlyExplorer searches list pages and opens the first safe result row", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-search-row-"));
  const logFile = path.join(dir, "search-row.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let searchValue = "";
  let rowSelected = false;
  const waits: number[] = [];
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
    locator: (selector: string) => ({
      fill: async (value: string) => {
        actions.push(`fill:${selector}:${value}`);
        searchValue = value;
      },
      press: async (key: string) => {
        actions.push(`press:${selector}:${key}`);
      },
      click: async () => {
        actions.push(`click:${selector}`);
        if (selector === "[data-x='customer-row']") rowSelected = true;
        if (selector === "[data-x='edit']") currentUrl = "https://api2.optica-omnia.de/master-data/customers/detail";
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        if (!searchValue) {
          return [{
            selector: "[data-x='customer-search']",
            role: "input",
            tag: "input",
            inputType: "text",
            placeholder: "Kunden / Artikel",
            currentPath: "/master-data/customers",
          }];
        }
        if (!rowSelected) {
          return [{
            selector: "[data-x='customer-row']",
            role: "row",
            tag: "tr",
            text: "Mustermann aktiver Kunde",
            currentPath: "/master-data/customers",
          }];
        }
        return [{
          selector: "[data-x='edit']",
          role: "button",
          text: "edit",
          currentPath: "/master-data/customers",
        }];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: ["Kunden / Artikel"],
        tableHeaders: searchValue ? ["Name", "Status"] : [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 3,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.deepEqual(actions, [
    "fill:[data-x='customer-search']:Mustermann",
    "press:[data-x='customer-search']:Enter",
    "click:[data-x='customer-row']",
    "press:[data-x='customer-row']:Enter",
    "click:[data-x='edit']",
  ]);
  assert.equal(result.clicked.map((target) => target.kind).join(","), "search,row,detail");
  assert.equal(waits.some((ms) => ms >= 1900), true);
});

test("runReadOnlyExplorer prefers rows matching the configured test customer", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-preferred-row-"));
  const logFile = path.join(dir, "preferred-row.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let searchValue = "";
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    locator: (selector: string) => ({
      fill: async (value: string) => {
        actions.push(`fill:${selector}:${value}`);
        searchValue = value;
      },
      press: async (key: string) => {
        actions.push(`press:${selector}:${key}`);
      },
      click: async () => {
        actions.push(`click:${selector}`);
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        if (!searchValue) {
          return [{
            selector: "[data-x='customer-search']",
            role: "input",
            tag: "input",
            inputType: "text",
            placeholder: "Kunden / Artikel",
            currentPath: "/master-data/customers",
          }];
        }
        return [
          {
            selector: "[data-x='abc-row']",
            role: "row",
            tag: "tr",
            text: "Firma ABC Breast Care GnbH 14025 Nein",
            currentPath: "/master-data/customers",
          },
          {
            selector: "[data-x='max-row']",
            role: "row",
            tag: "tr",
            text: "Herr Max Mustermann 16025 BARMER Ja",
            currentPath: "/master-data/customers",
          },
        ];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: ["Kunden / Artikel"],
        tableHeaders: searchValue ? ["Name", "Status"] : [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 2,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    testCustomer: "Max Mustermann",
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.deepEqual(actions, [
    "fill:[data-x='customer-search']:Max Mustermann",
    "press:[data-x='customer-search']:Enter",
    "click:[data-x='max-row']",
    "press:[data-x='max-row']:Enter",
  ]);
  assert.equal(result.clicked.at(-1)?.label, "Herr Max Mustermann 16025 BARMER Ja");
});

test("runReadOnlyExplorer resolves the strict test customer before navigating to detail", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-resolve-customer-"));
  const logFile = path.join(dir, "resolve-customer.jsonl");
  const maxId = "08901aa6-8c23-4e1b-8c61-109a8573feeb";
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const gotos: string[] = [];
  const requestedUrls: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      gotos.push(url);
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    evaluate: async (fn: Function, input?: { url: string; method: string }) => {
      if (input?.url) {
        requestedUrls.push(input.url);
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          body: {
            content: [{ id: maxId, firstName: "Max", lastName: "Mustermann" }],
          },
        };
      }
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) return [];
      return {
        url: currentUrl,
        title: "Kunde",
        headings: ["Stammdaten"],
        actions: [],
        formLabels: ["Kundennummer"],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 0,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    testCustomer: "Max Mustermann",
    strictTestObject: true,
    resolveTestCustomer: true,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.stopReason, "completed");
  assert.equal(gotos.at(-1), `https://api2.optica-omnia.de/master-data/customers/${maxId}`);
  assert.match(requestedUrls[0], /\/apigateway\/kunden\/customers\/search\?/);
  const markers = fs.readFileSync(logFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  assert.equal(markers.some((record) => record.marker === "test-customer-resolver" && record.status === "resolved"), true);
});

test("runReadOnlyExplorer stops strict test-object runs before clicking other customer rows", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-strict-row-"));
  const logFile = path.join(dir, "strict-row.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let searchValue = "";
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    locator: (selector: string) => ({
      fill: async (value: string) => {
        actions.push(`fill:${selector}:${value}`);
        searchValue = value;
      },
      press: async (key: string) => {
        actions.push(`press:${selector}:${key}`);
      },
      click: async () => {
        actions.push(`click:${selector}`);
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        if (!searchValue) {
          return [{
            selector: "[data-x='customer-search']",
            role: "input",
            tag: "input",
            inputType: "text",
            placeholder: "Kunden / Artikel",
            currentPath: "/master-data/customers",
          }];
        }
        return [{
          selector: "[data-x='abc-row']",
          role: "row",
          tag: "tr",
          text: "Frau Erika Mustermann 12345 Nein",
          currentPath: "/master-data/customers",
        }];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: ["Kunden / Artikel"],
        tableHeaders: searchValue ? ["Name", "Status"] : [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 3,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    testCustomer: "Max Mustermann",
    genericSearchTerm: "Mustermann",
    strictTestObject: true,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.deepEqual(actions, [
    "fill:[data-x='customer-search']:Mustermann",
    "press:[data-x='customer-search']:Enter",
  ]);
  assert.equal(result.stopReason, "strict-test-object-not-visible");
  assert.equal(result.clicked.map((target) => target.kind).join(","), "search");
});

test("runReadOnlyExplorer applies strict test-object stop on the global customer search page", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-strict-global-search-"));
  const logFile = path.join(dir, "strict-global-search.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let searchValue = "";
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    locator: (selector: string) => ({
      fill: async (value: string) => {
        actions.push(`fill:${selector}:${value}`);
        searchValue = value;
      },
      press: async (key: string) => {
        actions.push(`press:${selector}:${key}`);
      },
      click: async () => {
        actions.push(`click:${selector}`);
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        if (!searchValue) {
          return [{
            selector: "[data-x='global-search']",
            role: "input",
            tag: "input",
            inputType: "text",
            placeholder: "Kunden / Artikel",
            currentPath: "/search",
          }];
        }
        return [{
          selector: "[data-x='wrong-row']",
          role: "row",
          tag: "tr",
          text: "Frau Erika Mustermann 12345 Nein",
          currentPath: "/search",
        }];
      }
      return {
        url: currentUrl,
        title: "Suche",
        headings: [],
        actions: [],
        formLabels: ["Kunden / Artikel"],
        tableHeaders: searchValue ? ["Name", "Status"] : [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 3,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/search",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    testCustomer: "Max Mustermann",
    genericSearchTerm: "Mustermann",
    strictTestObject: true,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.deepEqual(actions, [
    "fill:[data-x='global-search']:Mustermann",
    "press:[data-x='global-search']:Enter",
  ]);
  assert.equal(result.stopReason, "strict-test-object-not-visible");
  assert.equal(result.clicked.map((target) => target.kind).join(","), "search");
});

test("runReadOnlyExplorer tries unvisited search fields before strict test-object stop", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-strict-search-"));
  const logFile = path.join(dir, "strict-search.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let primarySearch = "";
  let tableSearch = "";
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    locator: (selector: string) => ({
      fill: async (value: string) => {
        actions.push(`fill:${selector}:${value}`);
        if (selector === "[data-x='customer-search']") primarySearch = value;
        if (selector === "[data-x='table-search']") tableSearch = value;
      },
      press: async (key: string) => {
        actions.push(`press:${selector}:${key}`);
      },
      click: async () => {
        actions.push(`click:${selector}`);
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        if (!primarySearch) {
          return [{
            selector: "[data-x='customer-search']",
            role: "input",
            tag: "input",
            inputType: "text",
            placeholder: "Kunden / Artikel",
            currentPath: "/master-data/customers",
          }];
        }
        return [
          {
            selector: "[data-x='table-search']",
            role: "input",
            tag: "input",
            inputType: "text",
            placeholder: "Suche",
            currentPath: "/master-data/customers",
          },
          {
            selector: "[data-x='abc-row']",
            role: "row",
            tag: "tr",
            text: tableSearch ? "Frau Erika Mustermann 12345 Nein" : "Firma ABC Breast Care GnbH 14025 Nein",
            currentPath: "/master-data/customers",
          },
        ];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: ["Kunden / Artikel", "Suche"],
        tableHeaders: primarySearch ? ["Name", "Status"] : [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 4,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    testCustomer: "Max Mustermann",
    genericSearchTerm: "Mustermann",
    strictTestObject: true,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.deepEqual(actions, [
    "fill:[data-x='customer-search']:Mustermann",
    "press:[data-x='customer-search']:Enter",
    "fill:[data-x='table-search']:Mustermann",
    "press:[data-x='table-search']:Enter",
  ]);
  assert.equal(result.stopReason, "strict-test-object-not-visible");
  assert.equal(result.clicked.map((target) => target.kind).join(","), "search,search");
});

test("runReadOnlyExplorer dismisses transient overlays after detail actions", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-dismiss-overlay-"));
  const logFile = path.join(dir, "dismiss-overlay.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    keyboard: {
      press: async (key: string) => {
        actions.push(`keyboard:${key}`);
      },
    },
    locator: (selector: string) => ({
      click: async () => {
        actions.push(`click:${selector}`);
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("data-omnia-readonly-explore")) {
        return [{
          selector: "[data-x='edit']",
          role: "button",
          text: "edit",
          currentPath: "/master-data/customers",
        }];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 1,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.clicked.map((target) => target.kind).join(","), "detail");
  assert.deepEqual(actions, [
    "click:[data-x='edit']",
    "keyboard:Escape",
  ]);
});

test("runReadOnlyExplorer dismisses blocking overlays before tab clicks", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-overlay-before-tab-"));
  const logFile = path.join(dir, "overlay-before-tab.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let overlayVisible = true;
  const actions: string[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    keyboard: {
      press: async (key: string) => {
        actions.push(`keyboard:${key}`);
        overlayVisible = false;
      },
    },
    locator: (selector: string) => ({
      click: async () => {
        if (overlayVisible) throw new Error("cdk-overlay-backdrop intercepts pointer events");
        actions.push(`click:${selector}`);
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("cdk-overlay-backdrop.cdk-overlay-backdrop-showing")) return overlayVisible ? 1 : 0;
      if (source.includes("data-omnia-readonly-explore")) {
        return [{
          selector: "[data-x='arzt-tab']",
          role: "tab",
          text: "Arztdaten",
          selected: false,
          currentPath: "/master-data/customers",
        }];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 1,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.clicked.map((target) => target.kind).join(","), "tab");
  assert.deepEqual(actions, [
    "keyboard:Escape",
    "click:[data-x='arzt-tab']",
  ]);
});

test("runReadOnlyExplorer retries target clicks after overlay interception", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-overlay-retry-"));
  const logFile = path.join(dir, "overlay-retry.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  let clickAttempts = 0;
  let overlayVisible = false;
  const actions: string[] = [];
  const waits: number[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
    keyboard: {
      press: async (key: string) => {
        actions.push(`keyboard:${key}`);
        overlayVisible = false;
      },
    },
    locator: (selector: string) => ({
      click: async () => {
        clickAttempts += 1;
        actions.push(`click:${selector}:${clickAttempts}`);
        if (clickAttempts === 1) {
          overlayVisible = true;
          throw new Error("locator.click: cdk-overlay-backdrop intercepts pointer events");
        }
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("cdk-overlay-backdrop.cdk-overlay-backdrop-showing")) return overlayVisible ? 1 : 0;
      if (source.includes("data-omnia-readonly-explore")) {
        return [{
          selector: "[data-x='history-tab']",
          role: "tab",
          text: "Historie",
          selected: false,
          currentPath: "/master-data/customers",
        }];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 1,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.clicked.map((target) => target.kind).join(","), "tab");
  assert.equal(clickAttempts, 2);
  assert.equal(waits.some((ms) => ms >= 1900), true);
  assert.deepEqual(actions, [
    "click:[data-x='history-tab']:1",
    "keyboard:Escape",
    "click:[data-x='history-tab']:2",
  ]);
});

test("runReadOnlyExplorer falls back to a DOM click for safe tabs outside the viewport", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omnia-explorer-tab-dom-fallback-"));
  const logFile = path.join(dir, "tab-dom-fallback.jsonl");
  let currentUrl = "https://api2.optica-omnia.de/dashboard";
  const actions: string[] = [];
  const waits: number[] = [];
  const routeOwner = {
    route: async () => {},
    unroute: async () => {},
  };
  const page = {
    context: () => routeOwner,
    url: () => currentUrl,
    goto: async (url: string) => {
      currentUrl = url;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async (ms: number) => {
      waits.push(ms);
    },
    locator: (selector: string) => ({
      click: async () => {
        actions.push(`click:${selector}`);
        throw new Error("locator.click: element is outside of the viewport");
      },
      evaluate: async (fn: Function) => {
        actions.push(`evaluate:${selector}`);
        await fn({
          scrollIntoView: () => actions.push(`scroll:${selector}`),
          click: () => actions.push(`dom-click:${selector}`),
        });
      },
    }),
    evaluate: async (fn: Function) => {
      const source = fn.toString();
      if (source.includes("cdk-overlay-backdrop.cdk-overlay-backdrop-showing")) return 0;
      if (source.includes("data-omnia-readonly-explore")) {
        return [{
          selector: "[data-x='customer-tab']",
          role: "tab",
          text: "Kundendaten",
          selected: false,
          currentPath: "/master-data/customers",
        }];
      }
      return {
        url: currentUrl,
        title: "Kunden",
        headings: [],
        actions: [],
        formLabels: [],
        tableHeaders: [],
      };
    },
  };

  const result = await runReadOnlyExplorer(page, {
    url: "https://api2.optica-omnia.de",
    captureBodies: false,
    maxSteps: 1,
    maxMinutes: 1,
    settleMs: 1,
    startPath: "/master-data/customers",
    reportFile: path.join(dir, "report.md"),
    logFile,
    outputFile: logFile,
    sessionId: "test-session",
    allowReadLikePosts: true,
    waitForLogin: false,
    loginTimeoutMs: 1,
    restoreStartUrl: false,
    rebuildCatalog: false,
    rebuildCoverageReport: false,
  });

  assert.equal(result.clicked.map((target) => target.kind).join(","), "tab");
  assert.equal(waits.some((ms) => ms >= 1900), true);
  assert.deepEqual(actions, [
    "click:[data-x='customer-tab']",
    "evaluate:[data-x='customer-tab']",
    "scroll:[data-x='customer-tab']",
    "dom-click:[data-x='customer-tab']",
  ]);
});
