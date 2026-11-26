// Inicialización automática de MongoDB local en Docker para SIFYGSA Business Suite
// Crea la base de datos BitacoraSifigsa, sus colecciones e índices la primera vez que arranca el volumen.

const dbBitacoras = db.getSiblingDB('BitacoraSifigsa');

const coleccionesExistentes = dbBitacoras.getCollectionNames();

if (!coleccionesExistentes.includes('bitacora_general')) {
  dbBitacoras.createCollection('bitacora_general');
}
dbBitacoras.bitacora_general.createIndex({ fecha: -1 });
dbBitacoras.bitacora_general.createIndex({ modulo: 1, tipoEvento: 1 });

if (!coleccionesExistentes.includes('bitacora_crm_promesas')) {
  dbBitacoras.createCollection('bitacora_crm_promesas');
}
dbBitacoras.bitacora_crm_promesas.createIndex({ folio: 1, fecha: -1 });
dbBitacoras.bitacora_crm_promesas.createIndex({ clientePromesa: 1 });

print('[SIFYGSA Docker] Base BitacoraSifigsa e índices inicializados correctamente.');
