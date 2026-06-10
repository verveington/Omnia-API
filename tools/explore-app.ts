import path from "node:path";
import { fileURLToPath } from "node:url";

export {
  classifyCandidate,
  classifyReadOnlyRequest,
  normalizeCandidate,
  selectNextTarget,
  shouldWaitForLogin,
  type CandidateInput,
  type Classification,
  type ExploreTarget,
  type ReadOnlyRequestInput,
} from "./explorer/policies.ts";
export { collectExploreCandidates } from "./explorer/candidates.ts";
export { createExplorerState, type ExplorerResult } from "./explorer/state.ts";
export { summarizeExplorerResult, writeExplorerReport } from "./explorer/report.ts";
export {
  createExploreLogPath,
  parseHandsOffArgs,
  runHandsOffCli,
  runReadOnlyExplorer,
  type HandsOffOptions,
} from "./explorer/orchestrator.ts";

import { runHandsOffCli } from "./explorer/orchestrator.ts";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runHandsOffCli(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
