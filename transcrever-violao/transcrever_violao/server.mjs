#!/usr/bin/env node
/** Wrapper: delega para o servidor na raiz do pacote. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { status } = spawnSync(
  process.execPath,
  [path.join(root, "server.mjs"), ...process.argv.slice(2)],
  { stdio: "inherit", cwd: root },
);
process.exit(status ?? 1);
