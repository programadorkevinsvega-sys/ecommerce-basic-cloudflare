import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulesDir = path.join(root, 'apps/api/src/modules');
const errors = [];

for (const moduleName of fs.readdirSync(modulesDir).sort()) {
  const sourceDir = path.join(modulesDir, moduleName, 'infrastructure/persistence/d1/migrations');
  if (!fs.existsSync(sourceDir)) continue;
  for (const file of fs.readdirSync(sourceDir).filter((name) => name.endsWith('.sql'))) {
    const outputName = `${moduleName}__${file}`;
    const source = fs.readFileSync(path.join(sourceDir, file));
    for (const targetDir of ['migrations', 'apps/api/migrations']) {
      const targetPath = path.join(root, targetDir, outputName);
      if (!fs.existsSync(targetPath) || !source.equals(fs.readFileSync(targetPath))) {
        errors.push(`${targetDir}/${outputName} no coincide con ${moduleName}/.../${file}`);
      }
    }
  }
}

if (errors.length) {
  console.error('Copias de migraciones desactualizadas:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('Fuentes canónicas y copias de migraciones coinciden.');
