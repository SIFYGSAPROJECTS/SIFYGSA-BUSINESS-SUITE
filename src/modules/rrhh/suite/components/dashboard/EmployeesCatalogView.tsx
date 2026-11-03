import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Edit2,
  Eye,
  Mail,
  ShieldCheck,
  Building2,
  MapPin,
  X,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';
import { Employee } from '../../types';
import {
  useSyncedEmployees,
  downloadCsvFile,
  logHrAuditAction
} from '../../utils/formShield';
import { HrAuditLogModal } from './HrAuditLogModal';

interface EmployeesCatalogViewProps {
  employees: Employee[];
  onOpenNewEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onViewEmployee: (employee: Employee) => void;
}

export const EmployeesCatalogView: React.FC<EmployeesCatalogViewProps> = ({
  employees: initialEmployees,
  onOpenNewEmployee,
  onEditEmployee,
  onViewEmployee
}) => {
  const employees = useSyncedEmployees(initialEmployees);

  // Estados de Vista y Filtros
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptoFilter, setSelectedDeptoFilter] = useState('todos');
  const [showInactives, setShowInactives] = useState(false);
  const [selectedView, setSelectedView] = useState('Vista básica de Empleado');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'position' | 'department'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Toast y Bitácora Gerencia RRHH
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Departamentos únicos para el filtro
  const departmentsList = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return Array.from(set);
  }, [employees]);

  // Filtrado y ordenación
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesDepto = selectedDeptoFilter === 'todos' || emp.department === selectedDeptoFilter;
        const matchesSearch =
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (emp.supervisor && emp.supervisor.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (emp.phoneCell && emp.phoneCell.includes(searchQuery)) ||
          (emp.codeLocation && emp.codeLocation.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesDepto && matchesSearch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') comp = a.name.localeCompare(b.name);
        if (sortField === 'position') comp = a.position.localeCompare(b.position);
        if (sortField === 'department') comp = a.department.localeCompare(b.department);
        return sortAsc ? comp : -comp;
      });
  }, [employees, searchQuery, selectedDeptoFilter, sortField, sortAsc]);

  const toggleSort = (field: 'name' | 'position' | 'department') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExport = (type: 'excel' | 'pdf' | 'print') => {
    if (type === 'print' || type === 'pdf') {
      window.print();
    } else {
      downloadCsvFile(
        'Empleados_SIFYGSA.csv',
        [
          'Folio Empleado',
          'Nombre Completo',
          'RFC',
          'CURP',
          'NSS (IMSS)',
          'Puesto Oficial',
          'Departamento',
          'Empresa',
          'Base / Ubicación',
          'Cuadrilla',
          'Correo Corporativo',
          'Teléfono Celular',
          'Banco',
          'CLABE Interbancaria',
          'Fecha de Ingreso'
        ],
        filteredEmployees.map((emp) => [
          emp.id,
          emp.name,
          emp.rfc || 'En validación',
          emp.curp || 'En validación',
          emp.nss || 'En validación',
          emp.position,
          emp.department,
          emp.subsidiary,
          emp.location,
          emp.squad,
          emp.email,
          emp.phoneCell || '—',
          emp.bank || 'BBVA México',
          emp.clabe || '—',
          emp.hireDate
        ])
      );
      logHrAuditAction({
        actionType: 'Exportación Excel',
        targetRecord: `Catálogo de Empleados (${filteredEmployees.length} registros)`,
        details: 'Descarga de archivo Empleados_SIFYGSA.csv desde el Catálogo General.',
        newValue: 'Empleados_SIFYGSA.csv',
        severity: 'normal'
      });
      showToast('¡Excel descargado!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            backgroundColor: '#047857',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 700,
            animation: 'fadeInUp 0.3s ease'
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ENCABEZADO TIPO ORACLE NETSUITE SIFYGSA                                 */}
      {/* ========================================================================= */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Recursos Humanos</span> <span style={{ margin: '0 4px' }}>/</span> <span>Catálogos</span> <span style={{ margin: '0 4px' }}>/</span> <strong style={{ color: 'var(--text-secondary)' }}>Empleados</strong>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-200)'
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Empleados
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Padrón oficial de colaboradores, asignación de puestos y credencialización F&G
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Selector de Vista NetSuite */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>VER:</span>
                <span style={{ fontWeight: 700 }}>{selectedView}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>

              {isViewDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    zIndex: 50,
                    minWidth: '260px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '4px'
                  }}
                >
                  {[
                    'Vista básica de Empleado',
                    'Vista operativa con cuadrillas y sedes',
                    'Vista técnica de certificaciones SIL-3',
                    'Vista de contactos y emergencias 24h'
                  ].map((v) => (
                    <div
                      key={v}
                      onClick={() => {
                        setSelectedView(v);
                        setIsViewDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: selectedView === v ? 'var(--primary)' : 'var(--text-primary)',
                        backgroundColor: selectedView === v ? 'var(--brand-50)' : 'transparent',
                        fontWeight: selectedView === v ? 700 : 500
                      }}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => showToast('Vista personalizada configurada para el rol de RRHH')}
              style={{ fontSize: '12px' }}
            >
              Personalizar vista
            </button>

            {/* Botón Bitácora Exclusiva Gerente RRHH */}
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="btn btn-secondary"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'var(--brand-200)',
                color: 'var(--primary)'
              }}
              title="Bitácora de Auditoría exclusiva para Gerencia de Recursos Humanos"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bitácora Gerencia</span>
            </button>

            {/* Botón Crear Empleado */}
            <button
              type="button"
              onClick={onOpenNewEmployee}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
            >
              <Plus className="w-4 h-4" />
              <span>Crear Empleado</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE RESUMEN EJECUTIVO                                          */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Padrón Activo</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{employees.length} Empleados</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--success-border)' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Acreditados SIL-3 / DC-3</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success-text)' }}>98.2% Vigentes</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--brand-200)' }}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Sede Central</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Minatitlán, Ver.</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--surface-alt)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Áreas / Departamentos</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{departmentsList.length} Departamentos</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS, FILTROS Y CONTROLES NETSUITE                    */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '10px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: 'var(--surface)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Botón Filtros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px' }}
            >
              <Filter className="w-3.5 h-3.5 text-muted" />
              <span>+ FILTROS</span>
            </button>

            {/* Filtro Rápido por Departamento */}
            <select
              value={selectedDeptoFilter}
              onChange={(e) => setSelectedDeptoFilter(e.target.value)}
              className="select-control"
              style={{ height: '32px', fontSize: '11.5px', paddingRight: '24px' }}
            >
              <option value="todos">Todos los Departamentos</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Iconos de Exportación tipo NetSuite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '0 8px' }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => handleExport('excel')}
              title="Exportar a CSV / Excel"
              style={{ color: '#047857' }}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => handleExport('pdf')}
              title="Exportar a PDF"
              style={{ color: '#DC2626' }}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => handleExport('print')}
              title="Imprimir Padrón"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          {/* Checkbox Mostrar Inactivos */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showInactives}
              onChange={(e) => setShowInactives(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>MOSTRAR INACTIVOS</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Buscador Rápido */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search className="w-3.5 h-3.5 text-muted" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '30px', height: '32px', fontSize: '11.5px', width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Toggle Vista Lista / Tarjetas */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--surface-alt)', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setViewMode('list')}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none'
              }}
              title="Vista Lista"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setViewMode('cards')}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: viewMode === 'cards' ? 'var(--surface)' : 'transparent',
                boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none'
              }}
              title="Vista Tarjetas de Credencial"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Contador Total tipo NetSuite */}
          <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            TOTAL: <span style={{ color: 'var(--primary)' }}>{filteredEmployees.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA PRINCIPAL DE EMPLEADOS                                           */}
      {/* ========================================================================= */}
      {viewMode === 'list' ? (
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 14px', width: '100px' }}>EDITAR | VER</th>
                  <th style={{ padding: '10px 14px', width: '60px', textAlign: 'center' }}>IMAGEN</th>
                  <th
                    style={{ padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>NOMBRE</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th
                    style={{ padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('position')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>PUESTO DE TRABAJO</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th style={{ padding: '10px 14px' }}>SUPERVISOR</th>
                  <th style={{ padding: '10px 14px' }}>SUBSIDIARIA</th>
                  <th
                    style={{ padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('department')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>DEPARTAMENTO</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th style={{ padding: '10px 14px' }}>UBICACIÓN</th>
                  <th style={{ padding: '10px 14px' }}>INFORMACIÓN DE CONTACTO</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>ACREDITACIÓN</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={emp.id}
                      style={{
                        backgroundColor: isEven ? 'var(--surface)' : 'var(--surface-alt)',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--brand-50)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isEven ? 'var(--surface)' : 'var(--surface-alt)';
                      }}
                    >
                      {/* Acciones Editar | Ver */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              padding: 0
                            }}
                          >
                            Editar
                          </button>
                          <span style={{ color: 'var(--text-muted)' }}>|</span>
                          <button
                            type="button"
                            onClick={() => onViewEmployee(emp)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: 0
                            }}
                          >
                            Ver
                          </button>
                        </div>
                      </td>

                      {/* Imagen / Avatar */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: emp.avatarBg || 'var(--primary)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            margin: '0 auto',
                            boxShadow: 'var(--shadow-xs)',
                            border: '1.5px solid var(--border)'
                          }}
                        >
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            emp.initials
                          )}
                        </div>
                      </td>

                      {/* Nombre */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {emp.id} {emp.rfc ? `· ${emp.rfc}` : ''}
                        </div>
                      </td>

                      {/* Puesto */}
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {emp.position}
                      </td>

                      {/* Supervisor */}
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                        {emp.supervisor || '—'}
                      </td>

                      {/* Subsidiaria */}
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        Empresa principal : <strong style={{ color: 'var(--text-secondary)' }}>{emp.subsidiary || 'SIFYGSA'}</strong>
                      </td>

                      {/* Departamento */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dirección : </span>
                        <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{emp.department}</strong>
                      </td>

                      {/* Ubicación */}
                      <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {emp.codeLocation || emp.location}
                      </td>

                      {/* Información de Contacto */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <a
                            href={`mailto:${emp.email}`}
                            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '11px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {emp.email}
                          </a>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                            {emp.phonePrimary && <span>Tel: {emp.phonePrimary}</span>}
                            {emp.phoneCell && <span>Cel: {emp.phoneCell}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Estatus Certificación */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            backgroundColor: emp.silStatusType === 'success' ? 'var(--success-bg)' : 'var(--warning-bg)',
                            color: emp.silStatusType === 'success' ? 'var(--success-text)' : 'var(--warning-text)',
                            border: emp.silStatusType === 'success' ? '1px solid var(--success-border)' : '1px solid var(--warning-border)'
                          }}
                        >
                          {emp.silStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista de Tarjetas / Carnets Oficiales SIL-3 */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="card card-hoverable"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, backgroundColor: 'var(--brand-50)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>
                    {emp.id}
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#047857', backgroundColor: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>
                    {emp.silStatus}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      backgroundColor: emp.avatarBg || 'var(--primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                      border: '1.5px solid var(--border)'
                    }}
                  >
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      emp.initials
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {emp.name}
                    </h3>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                      {emp.position}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 className="w-3.5 h-3.5 text-muted" />
                    <span>Depto: <strong>{emp.department}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <span>Ubicación: {emp.codeLocation || emp.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail className="w-3.5 h-3.5 text-muted" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Ingreso: <strong>{emp.hireDate}</strong>
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onEditEmployee(emp)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewEmployee(emp)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Bitácora Gerencial Exclusiva RRHH */}
      <HrAuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};
