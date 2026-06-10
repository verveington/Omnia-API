import { runHandsOffCli } from "./explorer/orchestrator.ts";

await runHandsOffCli(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
