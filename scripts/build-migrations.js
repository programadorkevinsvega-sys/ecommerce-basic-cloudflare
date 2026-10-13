import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function buildMigrations() {
  const modulesDir = path.join(repositoryRoot, 'apps', 'api', 'src', 'modules');
  const targetDirs = [
    path.join(repositoryRoot, 'migrations'),
    path.join(repositoryRoot, 'apps', 'api', 'migrations'),
  ];
  const moduleArg = process.argv.find((arg) => arg.startsWith('--module='));
  const targetModule = moduleArg?.slice('--module='.length).trim();
  let copiedCount = 0;

  for (const moduleName of fs.readdirSync(modulesDir).sort()) {
    if (targetModule && moduleName !== targetModule) continue;
    const sourceDir = path.join(modulesDir, moduleName, 'infrastructure', 'persistence', 'd1', 'migrations');
    if (!fs.existsSync(sourceDir)) continue;

    for (const file of fs.readdirSync(sourceDir).filter((name) => name.endsWith('.sql')).sort()) {
      const source = path.join(sourceDir, file);
      const outputName = `${moduleName}__${file}`;
      for (const targetDir of targetDirs) {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(source, path.join(targetDir, outputName));
      }
      console.log(`[migración] ${source} -> ${outputName}`);
      copiedCount++;
    }
  }
  console.log(`[migraciones] Total procesadas: ${copiedCount}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildMigrations();
}
