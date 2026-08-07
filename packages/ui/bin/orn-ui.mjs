#!/usr/bin/env node
// CLI de instalación por componente. Cero dependencias (solo node:*), para
// no romper la promesa de "orn-ui: cero dependencias en tiempo de ejecución"
// ni siquiera en su tooling. Copia archivos de origen al proyecto del
// consumidor — no es un paquete npm que se importa, es código que se posee.
//
// El registry que usa por defecto es el que viene EMPACADO dentro de este
// mismo paquete (../registry/*.json, ver package.json "files"): así
// `npx orn-ui@0.2.0 add button` siempre resuelve contra la versión 0.2.0,
// sin llamada de red y sin poder desincronizarse. `--registry <url>` es un
// escape hatch para servir un fork o una versión específica desde
// orn-ui-docs (que publica el mismo registry en /r/*.json).
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_REGISTRY_DIR = path.join(__dirname, '..', 'registry');
const CONFIG_FILE = 'orn-ui.json';
const DEFAULT_DEST = 'src/components/ui';

function log(...args) {
  console.log(...args);
}
function fail(message) {
  console.error(`[orn-ui] ${message}`);
  process.exit(1);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`${url} -> HTTP ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/** Carga registry/<name>.json, del registry local empacado o de --registry <url>. */
async function loadRegistryEntry(name, registryUrl) {
  if (registryUrl) {
    const url = `${registryUrl.replace(/\/$/, '')}/${name}.json`;
    return JSON.parse(await fetchUrl(url));
  }
  const localPath = path.join(LOCAL_REGISTRY_DIR, `${name}.json`);
  if (!fs.existsSync(localPath)) {
    fail(
      `no encontré "${name}" en el registry local (${localPath}). ` +
        `¿Nombre de componente correcto? Corre "orn-ui list".`
    );
  }
  return JSON.parse(fs.readFileSync(localPath, 'utf8'));
}

async function loadIndex(registryUrl) {
  if (registryUrl) {
    const url = `${registryUrl.replace(/\/$/, '')}/index.json`;
    return JSON.parse(await fetchUrl(url));
  }
  return JSON.parse(fs.readFileSync(path.join(LOCAL_REGISTRY_DIR, 'index.json'), 'utf8'));
}

function readConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function writeConfig(cwd, config) {
  fs.writeFileSync(path.join(cwd, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);
}

/** Resuelve el árbol de dependencias (BFS) para una lista de slugs pedidos. */
async function resolveInstallSet(slugs, registryUrl) {
  const entries = new Map(); // name -> entry (incluye "core")
  const queue = [...slugs];
  while (queue.length) {
    const name = queue.shift();
    if (entries.has(name)) continue;
    const entry = await loadRegistryEntry(name, registryUrl);
    entries.set(name, entry);
    for (const dep of entry.registryDependencies ?? []) queue.push(dep);
  }
  return entries;
}

function writeEntryFiles(entry, destDir, { overwrite, dryRun }) {
  const written = [];
  for (const file of entry.files) {
    const target = path.join(destDir, file.path);
    const exists = fs.existsSync(target);
    if (exists && !overwrite) {
      log(`  ${'skip'.padEnd(9)} ${file.path} (ya existe, usa --overwrite para pisarlo)`);
      continue;
    }
    if (!dryRun) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.content);
    }
    written.push(file.path);
    log(`  ${exists ? 'overwrite' : 'write'.padEnd(9)} ${file.path}`);
  }
  return written;
}

async function cmdInit(args) {
  const cwd = args.cwd ?? process.cwd();
  const existing = readConfig(cwd);
  if (existing && !args.force) {
    fail(`ya existe ${CONFIG_FILE} en ${cwd}. Usa --force para sobrescribir la configuración.`);
  }
  const destPath = args.path ?? DEFAULT_DEST;

  const config = { $schema: 'https://orn-ui.dev/registry-config.json', path: destPath, installed: [] };
  const core = await loadRegistryEntry('core', args.registry);
  log(`Instalando core (theme + icons) en ${destPath}/ ...`);
  writeEntryFiles(core, path.join(cwd, destPath), args);
  writeConfig(cwd, config);
  log(`\n${CONFIG_FILE} creado. Envolvé tu app en <UIProvider> (import desde ${destPath}/theme).`);
  log(`Ahora: orn-ui add button select wizard ...`);
}

async function cmdAdd(args) {
  const cwd = args.cwd ?? process.cwd();
  let config = readConfig(cwd);
  const destPath = args.path ?? config?.path ?? DEFAULT_DEST;
  if (!config) config = { path: destPath, installed: [] };

  let slugs = args.positional;
  if (args.all) {
    const index = await loadIndex(args.registry);
    slugs = index.components.map((c) => c.slug);
  }
  if (!slugs.length) fail('especificá al menos un componente: orn-ui add button select ...\n  o: orn-ui add --all');

  log(`Resolviendo dependencias de: ${slugs.join(', ')}`);
  const entries = await resolveInstallSet(slugs, args.registry);
  log(`Instalando ${entries.size} paquete(s) (incluye deps transitivas) en ${destPath}/:\n`);

  const installedNow = new Set(config.installed ?? []);
  for (const [name, entry] of entries) {
    writeEntryFiles(entry, path.join(cwd, destPath), args);
    installedNow.add(name);
  }

  if (!args.dryRun) {
    config.installed = [...installedNow].sort();
    writeConfig(cwd, config);
  }
  log(`\nListo. ${entries.size} paquete(s) escritos bajo ${destPath}/.`);
}

async function cmdList(args) {
  const index = await loadIndex(args.registry);
  const byCategory = new Map();
  for (const c of index.components) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category).push(c);
  }
  for (const [category, items] of byCategory) {
    log(`\n${category}`);
    for (const item of items) log(`  ${item.slug.padEnd(20)} ${item.exportedNames.join(', ')}`);
  }
  log(`\n${index.components.length} componentes. Instalá con: orn-ui add <slug> [<slug> ...]`);
}

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--overwrite') args.overwrite = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--all') args.all = true;
    else if (a === '--path') args.path = argv[++i];
    else if (a === '--cwd') args.cwd = argv[++i];
    else if (a === '--registry') args.registry = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else args.positional.push(a);
  }
  return args;
}

const HELP = `orn-ui — instala componentes de orn-ui como código fuente en tu proyecto.

Uso:
  orn-ui init [--path <dir>]              Crea orn-ui.json e instala el core (theme + icons)
  orn-ui add <slug...> [--all]            Instala uno o más componentes (+ sus deps)
  orn-ui list                             Lista todos los componentes disponibles

Flags:
  --path <dir>       Carpeta destino (default: src/components/ui, o el de orn-ui.json)
  --overwrite        Pisa archivos existentes
  --dry-run          No escribe nada, solo muestra qué haría
  --registry <url>   Usa un registry remoto en vez del empacado en este paquete
  --cwd <dir>         Working directory (default: process.cwd())

Para instalar TODO de una: "pnpm add orn-ui" y "import { Button } from 'orn-ui'" —
este CLI es para cuando querés solo algunos componentes, sin la dependencia npm.`;

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  if (!command || args.help) {
    log(HELP);
    return;
  }

  try {
    if (command === 'init') await cmdInit(args);
    else if (command === 'add') await cmdAdd(args);
    else if (command === 'list') await cmdList(args);
    else fail(`comando desconocido "${command}". Corre "orn-ui --help".`);
  } catch (err) {
    fail(err.message ?? String(err));
  }
}

main();
