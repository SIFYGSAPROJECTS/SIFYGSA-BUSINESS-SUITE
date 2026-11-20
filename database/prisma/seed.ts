/**
 * database/prisma/seed.ts
 * Ejecutor de seeds SQL idempotentes para entornos Node.js / Prisma CLI
 *
 * Uso (una vez instalado prisma y configurado DATABASE_URL en .env):
 *   npx tsx database/prisma/seed.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const POSTGRES_SCRIPTS_ORDER = [
  'postgres/00_bootstrap/01_extensions_and_schemas.sql',
  'postgres/01_core/01_domains.sql',
  'postgres/01_core/02_tables.sql',
  'postgres/02_rrhh/01_domains.sql',
  'postgres/02_rrhh/02_tables.sql',
  'postgres/02_rrhh/03_indexes.sql',
  'postgres/02_rrhh/04_functions_triggers.sql',
  'postgres/02_rrhh/05_views.sql',
  'postgres/02_rrhh/06_procedures.sql',
  'postgres/02_rrhh/07_security_roles_and_immutability.sql',
  'postgres/seeds/01_seed_core.sql',
  'postgres/seeds/02_seed_rrhh_catalogs.sql',
  'postgres/seeds/03_seed_rrhh_employees.sql'
];

export const getOrderedPostgresScripts = (): { file: string; sql: string }[] => {
  const baseDir = path.resolve(process.cwd(), 'database');
  return POSTGRES_SCRIPTS_ORDER.map((rel) => {
    const fullPath = path.join(baseDir, rel);
    return {
      file: rel,
      sql: fs.readFileSync(fullPath, 'utf-8')
    };
  });
};

// Si se ejecuta directamente por CLI, verifica integridad de todos los archivos SQL
if (process.argv[1]?.endsWith('seed.ts')) {
  const scripts = getOrderedPostgresScripts();
  console.log(`[SIFYGSA DB] ${scripts.length} scripts PostgreSQL verificados y listos en orden de ejecución:`);
  scripts.forEach((s, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, '0')}. database/${s.file} (${s.sql.length.toLocaleString()} bytes)`);
  });
  console.log('\nPara aplicar contra PostgreSQL:');
  console.log('  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/postgres/run_all.sql');
}
