// ============================================================================
// database/nosql/mongodb/02_indexes.js
// Índices compuestos y TTL para millones de eventos de bitácora (escala 10k+)
// Uso: mongosh "mongodb://localhost:27017/sifygsa_logs" 02_indexes.js
// ============================================================================

const targetDb = db.getSiblingDB('sifygsa_logs');

// ── Índices en audit_logs (sin TTL: conservación histórica para auditoría SGI)
targetDb.audit_logs.createIndex({ module: 1, createdAt: -1 },        { name: 'idx_audit_module_date' });
targetDb.audit_logs.createIndex({ 'entity.folio': 1, createdAt: -1 },{ name: 'idx_audit_entity_folio' });
targetDb.audit_logs.createIndex({ 'actor.username': 1, createdAt: -1 },{ name: 'idx_audit_actor_date' });
targetDb.audit_logs.createIndex({ action: 1, createdAt: -1 },        { name: 'idx_audit_action_date' });
targetDb.audit_logs.createIndex({ severity: 1, createdAt: -1 },      { name: 'idx_audit_severity_date' });

// ── Índices en system_events (TTL automático: limpia trazas técnicas > 180 días)
targetDb.system_events.createIndex({ service: 1, level: 1, createdAt: -1 }, { name: 'idx_sys_service_level' });
targetDb.system_events.createIndex(
  { createdAt: 1 },
  { name: 'ttl_sys_events_180d', expireAfterSeconds: 180 * 24 * 60 * 60 }
);

// ── Índices en document_access_logs (trazabilidad de expedientes sensibles)
targetDb.document_access_logs.createIndex({ employeeFolio: 1, createdAt: -1 }, { name: 'idx_doc_access_emp' });
targetDb.document_access_logs.createIndex({ actorUsername: 1, createdAt: -1 }, { name: 'idx_doc_access_actor' });

print('==> Índices MongoDB (incluyendo TTL de 180 días en system_events) creados.');
