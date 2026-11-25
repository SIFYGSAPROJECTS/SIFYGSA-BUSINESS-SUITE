import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import {
  asegurarColeccionesBitacoras,
  COLECCION_BITACORA_CRM_PROMESAS,
  COLECCION_BITACORA_GENERAL,
} from '../src/lib/mongodb/bitacoras.schema';

function cargarEnvLocal() {
  const rutaEnv = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(rutaEnv)) return;
  const contenido = fs.readFileSync(rutaEnv, 'utf-8');
  for (const linea of contenido.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const idx = limpia.indexOf('=');
    if (idx === -1) continue;
    const clave = limpia.slice(0, idx).trim();
    let valor = limpia.slice(idx + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (!process.env[clave]) {
      process.env[clave] = valor;
    }
  }
}

async function main() {
  cargarEnvLocal();

  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_BITACORAS_DB?.trim() || 'BitacoraSifigsa';

  if (!uri || uri.includes('<password>') || uri.includes('TU_PASSWORD')) {
    console.error(
      '\n[ERROR] Configura tu cadena real MONGODB_URI en el archivo .env.local antes de ejecutar este comando.\n' +
        'Ejemplo:\n' +
        'MONGODB_URI="mongodb+srv://USUARIO:PASSWORD@clustersify.xxxxx.mongodb.net/?retryWrites=true&w=majority"\n' +
        'MONGODB_BITACORAS_DB="BitacoraSifigsa"\n'
    );
    process.exit(1);
  }

  console.log(`Conectando a MongoDB Atlas (Base de Datos: ${dbName})...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const resultado = await asegurarColeccionesBitacoras(db);

    const totalGeneral = await db.collection(COLECCION_BITACORA_GENERAL).countDocuments();
    const totalPromesas = await db
      .collection(COLECCION_BITACORA_CRM_PROMESAS)
      .countDocuments();

    console.log('\n============================================================');
    console.log(' COLECCIONES DE BITÁCORA LISTAS EN MONGODB ATLAS');
    console.log('============================================================');
    console.log(`• Base de datos      : ${dbName}`);
    console.log(
      `• Colecciones nuevas : ${resultado.creadas.length > 0 ? resultado.creadas.join(', ') : 'Ninguna (ya existían)'}`
    );
    console.log(
      `• Esquemas validados : ${[...resultado.creadas, ...resultado.actualizadas].join(', ')}`
    );
    console.log(`• ${COLECCION_BITACORA_GENERAL}      : ${totalGeneral} documentos`);
    console.log(`• ${COLECCION_BITACORA_CRM_PROMESAS} : ${totalPromesas} documentos`);
    console.log('============================================================\n');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('\n[ERROR] Falló la inicialización en MongoDB Atlas:', err);
  process.exit(1);
});
