#!/usr/bin/env node
// End-to-end smoke test of the CLI: installs the WHOLE catalog (--all) into
// apps/example (which already has react/react-native/@types installed in the
// workspace) and runs real tsc against the resulting tree. It isn't a mock of
// the registry or of module resolution — it's exactly what a consumer would
// do with `npx orn-ui add --all`.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_ROOT = path.resolve(__dirname, '..');
const EXAMPLE_ROOT = path.resolve(UI_ROOT, '..', '..', 'apps', 'example');
const SMOKE_DIR_NAME = 'orn-ui-cli-smoketest';
const SMOKE_DIR = path.join(EXAMPLE_ROOT, SMOKE_DIR_NAME);
const CONFIG_FILE = path.join(EXAMPLE_ROOT, 'orn-ui.json');

function cleanup() {
  fs.rmSync(SMOKE_DIR, { recursive: true, force: true });
  fs.rmSync(CONFIG_FILE, { force: true });
}

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

cleanup();
try {
  const bin = path.join(UI_ROOT, 'bin', 'orn-ui.mjs');
  console.log('[smoke-test-cli] orn-ui init --all ...');
  run('node', [bin, 'init', '--cwd', EXAMPLE_ROOT, '--path', SMOKE_DIR_NAME, '--force'], EXAMPLE_ROOT);
  run('node', [bin, 'add', '--all', '--cwd', EXAMPLE_ROOT, '--path', SMOKE_DIR_NAME], EXAMPLE_ROOT);

  console.log('[smoke-test-cli] tsc --noEmit on apps/example (includes the installed tree) ...');
  // .bin/tsc is a shell shim (shebang), not a JS module: it is executed
  // directly, not via `node <path>` (that tries to parse it as JS).
  run(path.join(EXAMPLE_ROOT, 'node_modules', '.bin', 'tsc'), ['--noEmit'], EXAMPLE_ROOT);

  console.log('[smoke-test-cli] OK — the full catalog installed by the CLI typechecks cleanly.');
} finally {
  cleanup();
}
