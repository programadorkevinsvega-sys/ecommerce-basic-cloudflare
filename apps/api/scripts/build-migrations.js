import * as fs from 'node:fs';
import * as path from 'node:path';

export function buildMigrations() {
  const cwd = path.resolve(process.cwd());
  const modulesDir = fs.existsSync(path.join(cwd, 'apps', 'api', 'src', 'modules'))
    ? path.join(cwd, 'apps', 'api', 'src', 'modules')
    : path.join(cwd, 'src', 'modules');

  const targetDirs = [
    path.join(cwd, 'migrations'),
    path.join(cwd, 'apps', 'api', 'migrations'),
  ];

  if (!fs.existsSync(modulesDir)) {
    console.error(`Directorio de módulos no encontrado: ${modulesDir}`);
    process.exit(1);
  }

  for (const targetDir of targetDirs) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  const moduleArg = process.argv.find((arg) => arg.startsWith('--module='));
  const targetModuleName = moduleArg ? moduleArg.split('=')[1]?.trim() : null;

  const modules = fs.readdirSync(modulesDir).filter((file) => {
    return fs.statSync(path.join(modulesDir, file)).isDirectory();
  });

  let copiedCount = 0;

  for (const moduleName of modules) {
    if (targetModuleName && moduleName !== targetModuleName) {
      continue;
    }

    const migrationsDir = path.join(
      modulesDir,
      moduleName,
      'infrastructure',
      'persistence',
      'd1',
      'migrations'
    );

    if (!fs.existsSync(migrationsDir)) {
      continue;
    }

    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'));

    for (const file of files) {
      const sourceFile = path.join(migrationsDir, file);
      const targetFileName = `${moduleName}__${file}`;

      for (const targetDir of targetDirs) {
        const targetFilePath = path.join(targetDir, targetFileName);
        fs.copyFileSync(sourceFile, targetFilePath);
      }
      console.log(`[migración] Copiada: ${sourceFile} -> ${targetFileName}`);
      copiedCount++;
    }
  }

  console.log(`[migraciones] Total procesadas: ${copiedCount}`);
}

if (process.argv[1] && process.argv[1].endsWith('build-migrations.js')) {
  buildMigrations();
}
