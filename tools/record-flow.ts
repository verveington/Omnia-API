import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

import { writeFlowMapping, writeFlowReport } from "./flow-report.ts";
import {
  appendMarker,
  attachNetworkLogger,
  connectOrLaunchPage,
  parseCommonArgs,
  waitForSettledNetwork,
} from "./network-recorder.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const defaultSteps = [
  "Kunde suchen",
  "Kunde oeffnen",
  "Auftrag oeffnen",
  "Rezept anzeigen",
  "Artikel hinzufuegen",
];

const args = process.argv.slice(2);
const options = parseCommonArgs(args);
const steps = parseSteps(args) || defaultSteps;
const mappingFile = path.join(workspaceRoot, "docs", "04_flow_to_api_mapping.md");
const recordingsDir = path.join(workspaceRoot, "docs", "recordings");
const catalogFile = path.join(workspaceRoot, "docs", "03_api_catalog.md");
let currentStep: string | null = null;
let connection: Awaited<ReturnType<typeof connectOrLaunchPage>> | null = null;
let recorder: ReturnType<typeof attachNetworkLogger> | null = null;

try {
  connection = await connectOrLaunchPage(options);
  recorder = attachNetworkLogger(connection.page, {
    ...options,
    getCurrentStep: () => currentStep,
  });

  console.log("=".repeat(72));
  console.log("Flow-Aufzeichnung aktiv. Vor jedem Schritt wird ein Marker geschrieben.");
  console.log(`JSONL: ${recorder.logFile}`);
  console.log(`Mapping: ${mappingFile}`);
  console.log(`Report-Verzeichnis: ${recordingsDir}`);
  console.log("=".repeat(72));

  const rl = readline.createInterface({ input, output });
  for (const step of steps) {
    await rl.question(`Bereit fuer "${step}"? Enter schreibt den Marker, danach den Schritt in der ERP ausfuehren.`);
    currentStep = step;
    appendMarker(recorder.logFile, {
      type: "flow-marker",
      sessionId: recorder.sessionId,
      marker: "step-start",
      step,
      timestamp: new Date().toISOString(),
    });

    await rl.question(`Fuehre "${step}" jetzt aus. Enter, wenn die sichtbare Aktion abgeschlossen ist.`);
    await waitForSettledNetwork(connection.page);
    appendMarker(recorder.logFile, {
      type: "flow-marker",
      sessionId: recorder.sessionId,
      marker: "step-end",
      step,
      timestamp: new Date().toISOString(),
    });
    currentStep = null;
  }
  rl.close();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  recorder?.stop();
  await connection?.close();
  if (recorder?.logFile) {
    writeFlowMapping(recorder.logFile, mappingFile);
    const reportFile = writeFlowReport(recorder.logFile, recordingsDir, { knownCatalogFile: catalogFile });
    console.log(`Flow-Report: ${reportFile}`);
  }
}

function parseSteps(argv: string[]): string[] | null {
  const index = argv.indexOf("--steps");
  if (index === -1 || !argv[index + 1]) return null;
  return argv[index + 1]
    .split(",")
    .map((step) => step.trim())
    .filter(Boolean);
}
