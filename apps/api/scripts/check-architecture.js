import * as fs from 'node:fs';
import * as path from 'node:path';

function getTsFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.wrangler') {
        getTsFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

export function checkArchitecture() {
  const srcDir = path.resolve(process.cwd(), 'src');
  const violations = [];
  const files = getTsFiles(srcDir);

  const CF_TYPES = ['D1Database', 'R2Bucket', 'KVNamespace', 'Queue', 'AnalyticsEngineDataset'];

  for (const filePath of files) {
    const baseName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 1. Prohibidos utils.ts y helpers.ts (§1 SRP)
    if (/^(utils|helpers)\.ts$/i.test(baseName)) {
      violations.push(`[Prohibición] Archivo genérico '${baseName}' en ${filePath}`);
    }

    // 2. Máximo 200 líneas de código efectivo (§1.bis)
    const effectiveLines = lines.filter((l) => {
      const trimmed = l.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
    });
    if (effectiveLines.length > 200) {
      violations.push(`[Límite 200 líneas] ${filePath} tiene ${effectiveLines.length} líneas efectivas`);
    }

    // 3. Dominio y aplicación no importan tipos de Cloudflare ni hono (§2)
    const isDomainOrApp = filePath.includes('/domain/') || filePath.includes('/application/');
    if (isDomainOrApp) {
      for (const cfType of CF_TYPES) {
        if (new RegExp(`\\b${cfType}\\b`).test(content)) {
          violations.push(`[Violación de capas] ${filePath} importa tipo Cloudflare '${cfType}' en domain/application`);
        }
      }
      if (content.includes("from 'hono'") || content.includes('from "hono"')) {
        violations.push(`[Violación de capas] ${filePath} importa librería HTTP 'hono' en domain/application`);
      }
    }

    // 4. Prohibidos imports directos entre módulos ajenos (§0, §20)
    const matchModule = filePath.match(/src\/modules\/([^/]+)\//);
    if (matchModule && matchModule[1]) {
      const currentModule = matchModule[1];
      const crossModuleImport = content.match(/from\s+['"](?:\.\.\/)+([a-zA-Z0-9_-]+)\/(domain|application|infrastructure)/g);
      if (crossModuleImport) {
        for (const imp of crossModuleImport) {
          if (!imp.includes(`modules/${currentModule}`)) {
            violations.push(`[Import cruzado prohibido] ${filePath}: ${imp}`);
          }
        }
      }
    }
  }

  return { violations, passed: violations.length === 0 };
}

if (process.argv[1] && process.argv[1].endsWith('check-architecture.js')) {
  const result = checkArchitecture();
  if (!result.passed) {
    console.error('❌ Violaciones de reglas de arquitectura detectadas:');
    result.violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  } else {
    console.log('✅ Arquitectura validada: 200 líneas, capas limpias, sin imports prohibidos.');
  }
}
