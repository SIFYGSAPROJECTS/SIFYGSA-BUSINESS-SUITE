import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const rootDir = process.cwd();

const major = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(major) || major < 20) {
  console.error(
    `\x1b[31m[SIFYGSA Setup] Se requiere Node.js >= 20 (recomendado Node 22 LTS). Versión actual: ${process.version}\x1b[0m`
  );
  console.error('Tip: Si prefieres no instalar versiones de Node, usa: docker compose up --build');
  process.exit(1);
}

console.log(`\x1b[36m[SIFYGSA Setup]\x1b[0m Node.js ${process.version} detectado.`);

function ejecutar(titulo, args) {
  console.log(`\n\x1b[36m[SIFYGSA Setup]\x1b[0m ${titulo}...`);
  const res = spawnSync(npmCmd, args, {
    stdio: 'inherit',
    shell: isWindows,
    cwd: rootDir,
  });
  if (res.status !== 0) {
    console.error(`\x1b[31m[SIFYGSA Setup] Error ejecutando: npm ${args.join(' ')}\x1b[0m`);
    process.exit(res.status ?? 1);
  }
}

ejecutar('Instalando dependencias del frontend (Next.js)', ['install']);
ejecutar('Instalando dependencias del backend (NestJS)', ['install', '--prefix', 'backend']);

const envLocalPath = path.join(rootDir, '.env.local');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envLocalPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log(
    '\n\x1b[33m[SIFYGSA Setup]\x1b[0m Se creó .env.local a partir de .env.example. Recuerda colocar tu MONGODB_URI (o usar mongodb://localhost:27017/BitacoraSifigsa con `npm run docker:mongo`).'
  );
} else {
  console.log('\n\x1b[32m[SIFYGSA Setup]\x1b[0m Archivo .env.local detectado.');
}

console.log('\n\x1b[32m[SIFYGSA Setup] ¡Entorno listo!\x1b[0m');
console.log('  • Iniciar todo en local:  npm run dev:all');
console.log('  • Iniciar todo en Docker: npm run docker:up');
console.log('  • Solo Mongo en Docker:   npm run docker:mongo\n');
