import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(toolsRoot, "..");
const require = createRequire(import.meta.url);
const tsxLoader = pathToFileURL(require.resolve("tsx")).href;
const [scriptArg, ...scriptArgs] = process.argv.slice(2);

if (!scriptArg) {
  console.error("Usage: npm run tool -- ./<tool>.ts [...args]");
  process.exit(1);
}

const env = {
  ...process.env,
  NODE_OPTIONS: appendNodeOption(process.env.NODE_OPTIONS, `--import=${tsxLoader}`),
};
const result = spawnSync(process.execPath, [resolveToolPath(scriptArg), ...scriptArgs], {
  cwd: workspaceRoot,
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

function resolveToolPath(script) {
  if (path.isAbsolute(script)) return script;
  const fromTools = path.resolve(toolsRoot, script);
  if (fs.existsSync(fromTools)) return fromTools;
  return path.resolve(workspaceRoot, script);
}

function appendNodeOption(existing, option) {
  if (!existing) return option;
  return existing.includes(option) ? existing : `${existing} ${option}`;
}
