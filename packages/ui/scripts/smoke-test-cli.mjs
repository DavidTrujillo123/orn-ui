#!/usr/bin/env node
// Smoke test end-to-end del CLI: instala TODO el catálogo (--all) dentro de
// apps/example (que ya tiene react/react-native/@types instalados en el
// workspace) y corre tsc real contra el árbol resultante. No es un mock del
// registry ni de la resolución de módulos — es exactamente lo que un
// consumidor haría con `npx orn-ui add --all`.
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

  console.log('[smoke-test-cli] tsc --noEmit sobre apps/example (incluye el árbol instalado) ...');
  // .bin/tsc es un shell shim (shebang), no un módulo JS: se ejecuta
  // directamente, no via `node <path>` (eso intenta parsearlo como JS).
  run(path.join(EXAMPLE_ROOT, 'node_modules', '.bin', 'tsc'), ['--noEmit'], EXAMPLE_ROOT);

  console.log('[smoke-test-cli] OK — el catálogo completo instalado por el CLI typechequea limpio.');
} finally {
  cleanup();
}
