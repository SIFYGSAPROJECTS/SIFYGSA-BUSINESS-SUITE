// ============================================================================
// database/nosql/mongodb/seeds/01_seed_audit_logs.js
// Registros iniciales de ejemplo para Bitácora Gerencial RRHH
// ============================================================================

const targetDb = db.getSiblingDB('sifygsa_logs');

targetDb.audit_logs.insertMany([
  {
    module: 'RRHH',
    action: 'EXCEL_BATCH_IMPORTED',
    summary: 'Importación inicial de plantilla corporativa (192 colaboradores normalizados SFG-0001..SFG-0192).',
    entity: {
      type: 'employee_batch',
      id: 'BATCH-2026-INIT',
      folio: 'SFG-0001..SFG-0192',
      label: 'Actualizacion de informacion de personal.xlsx'
    },
    actor: {
      username: 'valeria.mendez',
      fullName: 'Lic. Valeria Méndez Albores',
      role: 'gerente_rrhh',
      ip: '127.0.0.1'
    },
    metadata: {
      sourceFile: 'Actualizacion de informacion de personal.xlsx',
      totalImported: 192,
      departmentsMapped: 14
    },
    severity: 'INFO',
    createdAt: new Date()
  },
  {
    module: 'RRHH',
    action: 'DEPARTMENT_CODES_STANDARDIZED',
    summary: 'Estandarización de códigos de departamento a siglas nemotécnicas (DIR, ADM, RH, SRV, VTA, HSE-MIN, HSE-COM...).',
    entity: {
      type: 'department_catalog',
      id: 'CATALOG-DEPTS-V2',
      label: 'Catálogo Oficial de 14 Departamentos'
    },
    actor: {
      username: 'admin.erp',
      fullName: 'Administrador SIFYSUITE',
      role: 'super_admin',
      ip: '127.0.0.1'
    },
    changes: {
      before: { format: 'DEP-001..DEP-014' },
      after:  { format: 'DIR, ADM, CAL, COM, HSE-MIN, ALM, INF, ING, MCP, HSE-COM, RH, SRV, VTA, GSAPE' }
    },
    severity: 'INFO',
    createdAt: new Date()
  }
]);

print('==> Seed inicial de audit_logs insertado en sifygsa_logs.');
