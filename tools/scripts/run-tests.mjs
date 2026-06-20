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
const testFiles = collectTestFiles(toolsRoot)
  .map((file) => path.relative(workspaceRoot, file).split(path.sep).join(path.posix.sep));

const env = {
  ...process.env,
  NODE_OPTIONS: appendNodeOption(process.env.NODE_OPTIONS, `--import=${tsxLoader}`),
};
const result = spawnSync(process.execPath, ["--test", ...process.argv.slice(2), ...testFiles], {
  cwd: workspaceRoot,
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

function collectTestFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.name === "node_modules") return [];
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectTestFiles(file);
      return /\.(test\.ts|test\.mjs)$/.test(entry.name) ? [file] : [];
    })
    .sort();
}

function appendNodeOption(existing, option) {
  if (!existing) return option;
  return existing.includes(option) ? existing : `${existing} ${option}`;
}
