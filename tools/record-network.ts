import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  attachNetworkLogger,
  connectOrLaunchPage,
  parseCommonArgs,
} from "./network-recorder.ts";

const options = parseCommonArgs(process.argv.slice(2));
let connection: Awaited<ReturnType<typeof connectOrLaunchPage>> | null = null;
let recorder: ReturnType<typeof attachNetworkLogger> | null = null;

try {
  connection = await connectOrLaunchPage(options);
  recorder = attachNetworkLogger(connection.page, options);

  printSafetyNotice(recorder.logFile);
  console.log(`Zielseite: ${connection.page.url()}`);
  console.log("Interagiere jetzt manuell mit der ERP. Druecke Enter, um die Aufzeichnung zu beenden.");

  const rl = readline.createInterface({ input, output });
  await rl.question("");
  rl.close();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  recorder?.stop();
  await connection?.close();
}

function printSafetyNotice(logFile: string): void {
  console.log("=".repeat(72));
  console.log("DSGVO-HINWEIS: Requests, Responses und WebSocket-Frames werden vor");
  console.log("dem Schreiben redacted. Logs bleiben lokal unter logs/network/.");
  console.log("Keine echten Patientendaten oder Tokens committen.");
  console.log(`JSONL: ${logFile}`);
  console.log("=".repeat(72));
}
