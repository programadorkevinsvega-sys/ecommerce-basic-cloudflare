import * as fs from 'node:fs';
import * as path from 'node:path';

const KNOWN_MODULES = [
  'identity', 'catalog', 'media', 'inventory', 'cart', 'orders',
  'payments', 'shipping', 'credit', 'invoicing', 'realtime',
  'promotions', 'storefront', 'cms', 'seo', 'settings',
  'notifications', 'audit'
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.sql')) {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

export function checkTableIsolation() {
  const modulesDir = path.resolve(process.cwd(), 'src', 'modules');
  const violations = [];

  if (!fs.existsSync(modulesDir)) {
    return { violations, passed: true };
  }

  const modules = fs.readdirSync(modulesDir).filter((file) => {
    return fs.statSync(path.join(modulesDir, file)).isDirectory();
  });

  for (const moduleName of modules) {
    const modulePath = path.join(modulesDir, moduleName);
    const files = getAllFiles(modulePath);

    // Prefijos prohibidos para este módulo
    const forbiddenPrefixes = KNOWN_MODULES.filter((m) => m !== moduleName).map((m) => `${m}_`);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const prefix of forbiddenPrefixes) {
        // Solo marcar si es una consulta SQL o declaración DDL a una tabla ajena
        const regex = new RegExp(`(?:FROM|JOIN|INTO|UPDATE|TABLE)\\s+${prefix}[a-z0-9_]+`, 'gi');
        const matches = content.match(regex);

        if (matches && matches.length > 0) {
          const violation = `[Violación de aislamiento] ${filePath} referencia tabla ajena '${matches[0]}' (módulo actual: ${moduleName})`;
          violations.push(violation);
        }
      }
    }
  }

  return {
    violations,
    passed: violations.length === 0,
  };
}

if (process.argv[1] && process.argv[1].endsWith('check-table-isolation.js')) {
  const result = checkTableIsolation();
  if (!result.passed) {
    console.error('❌ Falló la verificación de aislamiento de tablas D1:');
    result.violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  } else {
    console.log('✅ Aislamiento de tablas verificado: ningún módulo accede a tablas ajenas.');
  }
}
