// ============================================================================
// database/nosql/mongodb/01_collections_validators.js
// SIFYGSA ERP + CRM — Capa NoSQL (MongoDB) para Bitácora, Auditoría y Eventos
// Uso: mongosh "mongodb://localhost:27017/sifygsa_logs" 01_collections_validators.js
// ============================================================================

const targetDb = db.getSiblingDB('sifygsa_logs');

// ── 1. Colección audit_logs (Bitácora inmutable de acciones de negocio) ──────
if (!targetDb.getCollectionNames().includes('audit_logs')) {
  targetDb.createCollection('audit_logs', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['module', 'action', 'entity', 'actor', 'severity', 'createdAt'],
        properties: {
          module: {
            enum: ['CORE', 'RRHH', 'FINANZAS', 'COMPRAS', 'CRM', 'ADMIN'],
            description: 'Módulo ERP/CRM que originó el evento'
          },
          action: {
            bsonType: 'string',
            description: 'Ej. EMPLOYEE_CREATED, DEPARTMENT_CHANGED, EXCEL_IMPORTED, SGI_ISSUED'
          },
          summary: {
            bsonType: 'string',
            description: 'Descripción legible para la Bitácora Gerencial'
          },
          entity: {
            bsonType: 'object',
            required: ['type', 'id'],
            properties: {
              type:  { bsonType: 'string' }, // 'employee', 'department', 'document', 'vacation'
              id:    { bsonType: 'string' }, // UUID o Folio 'SFG-0001'
              folio: { bsonType: 'string' },
              label: { bsonType: 'string' }
            }
          },
          actor: {
            bsonType: 'object',
            required: ['username', 'role'],
            properties: {
              userId:   { bsonType: 'string' },
              username: { bsonType: 'string' },
              fullName: { bsonType: 'string' },
              role:     { bsonType: 'string' },
              ip:       { bsonType: 'string' }
            }
          },
          changes: {
            bsonType: 'object',
            description: 'Snapshot flexible antes/después de campos modificados',
            properties: {
              before: { bsonType: 'object' },
              after:  { bsonType: 'object' }
            }
          },
          metadata: {
            bsonType: 'object',
            description: 'Datos extra del módulo (archivo importado, sede, motivo, etc.)'
          },
          severity: {
            enum: ['INFO', 'WARNING', 'CRITICAL']
          },
          createdAt: {
            bsonType: 'date'
          }
        }
      }
    },
    validationLevel: 'moderate',
    validationAction: 'error'
  });
}

// ── 2. Colección system_events (Trazas técnicas, API errors, integraciones) ──
if (!targetDb.getCollectionNames().includes('system_events')) {
  targetDb.createCollection('system_events', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['service', 'level', 'message', 'createdAt'],
        properties: {
          service:   { bsonType: 'string' }, // 'rrhh-api', 'auth-service', 'excel-worker'
          level:     { enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] },
          message:   { bsonType: 'string' },
          requestId: { bsonType: 'string' },
          durationMs:{ bsonType: ['int', 'double', 'long'] },
          context:   { bsonType: 'object' },
          createdAt: { bsonType: 'date' }
        }
      }
    }
  });
}

// ── 3. Colección document_access_logs (Cumplimiento LFPDPPP / ISO-27001) ─────
// Registra quién descargó o visualizó INE, CURP, CSF, CV o expedientes médicos
if (!targetDb.getCollectionNames().includes('document_access_logs')) {
  targetDb.createCollection('document_access_logs', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['employeeFolio', 'documentId', 'accessType', 'actorUsername', 'createdAt'],
        properties: {
          employeeFolio: { bsonType: 'string' },
          documentId:    { bsonType: 'string' },
          category:      { bsonType: 'string' },
          accessType:    { enum: ['VIEW', 'DOWNLOAD', 'UPLOAD', 'DELETE'] },
          actorUsername: { bsonType: 'string' },
          ip:            { bsonType: 'string' },
          createdAt:     { bsonType: 'date' }
        }
      }
    }
  });
}

print('==> Colecciones MongoDB (audit_logs, system_events, document_access_logs) listas.');
