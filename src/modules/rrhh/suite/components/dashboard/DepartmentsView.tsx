import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Edit2,
  Eye,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  History,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { DepartmentItem } from '../../types';
import {
  sanitizeCleanText,
  sanitizePersonName,
  savePersistedDepartments,
  useSyncedDepartments,
  downloadCsvFile,
  logHrAuditAction
} from '../../utils/formShield';

interface DepartmentsViewProps {
  departments: DepartmentItem[];
  onAddDepartment: (newDept: DepartmentItem) => void;
  onUpdateDepartment: (updatedDept: DepartmentItem) => void;
  onDeleteDepartment?: (id: string) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments: initialDepartments,
  onAddDepartment,
  onUpdateDepartment
}) => {
  const departments = useSyncedDepartments(initialDepartments);

  // Estados de Vista y Filtros
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactives, setShowInactives] = useState(false);
  const [selectedView, setSelectedView] = useState('Vista predeterminada de departamento');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'code' | 'employeeCount'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Estados de Modal (Crear / Editar / Ver)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentItem | null>(null);

  // Formulario de Crear / Editar
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLead, setFormLead] = useState('');
  const [formLocation, setFormLocation] = useState('Minatitlán, Ver.');
  const [formSubsidiary, setFormSubsidiary] = useState('SIFYGSA');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Toast de confirmación / advertencia (1 a 3 palabras)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Filtrado y ordenación
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((dept) => {
        const matchesStatus = showInactives ? true : dept.status === 'active';
        const matchesSearch =
          dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') comp = a.name.localeCompare(b.name);
        if (sortField === 'code') comp = a.code.localeCompare(b.code);
        if (sortField === 'employeeCount') comp = a.employeeCount - b.employeeCount;
        return sortAsc ? comp : -comp;
      });
  }, [departments, searchQuery, showInactives, sortField, sortAsc]);

  const totalEmployees = useMemo(() => {
    return departments.reduce((acc, d) => acc + d.employeeCount, 0);
  }, [departments]);

  const handleOpenCreate = () => {
    const nextNum = departments.length + 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    setFormName('');
    setFormCode(`DEP-${formattedNum}`);
    setFormLead('');
    setFormLocation('Minatitlán, Ver.');
    setFormSubsidiary('SIFYGSA');
    setFormDescription('');
    setFormActive(true);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentItem) => {
    setCurrentDepartment(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormLead(dept.lead);
    setFormLocation(dept.location);
    setFormSubsidiary(dept.subsidiary);
    setFormDescription(dept.description || '');
    setFormActive(dept.status === 'active');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (dept: DepartmentItem) => {
    setCurrentDepartment(dept);
    setIsDetailModalOpen(true);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (formName.trim().length < 2) {
      showToast('¡Falta nombre!', 'warning');
      return;
    }

    const newDept: DepartmentItem = {
      id: `dep-${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim() || `DEP-${String(departments.length + 1).padStart(3, '0')}`,
      lead: formLead.trim() || 'Por Asignar',
      employeeCount: 0,
      subsidiary: formSubsidiary,
      location: formLocation,
      status: formActive ? 'active' : 'inactive',
      description: formDescription.trim(),
      createdAt: new Date().toLocaleDateString('es-MX')
    };

    savePersistedDepartments([newDept, ...departments]);
    logHrAuditAction({
      actionType: 'Catálogo Departamentos',
      targetRecord: `${newDept.code} · ${newDept.name}`,
      details: `Alta de nuevo departamento operativo con titular ${newDept.lead}.`,
      previousValue: 'Sin registro',
      newValue: `${newDept.name} (${newDept.location})`,
      severity: 'normal'
    });
    onAddDepartment(newDept);
    setIsCreateModalOpen(false);
    showToast('¡Guardado!', 'success');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDepartment || formName.trim().length < 2) {
      showToast('¡Falta nombre!', 'warning');
      return;
    }

    const updated: DepartmentItem = {
      ...currentDepartment,
      name: formName.trim(),
      code: formCode.trim(),
      lead: formLead.trim() || 'Por Asignar',
      location: formLocation,
      subsidiary: formSubsidiary,
      status: formActive ? 'active' : 'inactive',
      description: formDescription.trim()
    };

    savePersistedDepartments(departments.map((d) => (d.id === updated.id ? updated : d)));
    logHrAuditAction({
      actionType: 'Catálogo Departamentos',
      targetRecord: `${updated.code} · ${updated.name}`,
      details: 'Actualización de departamento y titular de área.',
      previousValue: `${currentDepartment.name} · ${currentDepartment.lead}`,
      newValue: `${updated.name} · ${updated.lead}`,
      severity: 'normal'
    });
    onUpdateDepartment(updated);
    setIsEditModalOpen(false);
    showToast('¡Guardado!', 'success');
  };

  const toggleSort = (field: 'name' | 'code' | 'employeeCount') => {
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
        'Departamentos_SIFYGSA.csv',
        [
          'Código',
          'Nombre del Departamento',
          'Titular / Responsable',
          'Colaboradores Asignados',
          'Empresa',
          'Ubicación / Sede',
          'Estatus'
        ],
        filteredDepartments.map((d) => [
          d.code,
          d.name,
          d.lead,
          d.employeeCount,
          d.subsidiary,
          d.location,
          d.status === 'active' ? 'Activo' : 'Inactivo'
        ])
      );
      logHrAuditAction({
        actionType: 'Exportación Excel',
        targetRecord: `Catálogo de Departamentos (${filteredDepartments.length} áreas)`,
        details: 'Descarga de archivo Departamentos_SIFYGSA.csv.',
        newValue: 'Departamentos_SIFYGSA.csv',
        severity: 'normal'
      });
      showToast('¡Excel descargado!', 'success');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      {/* Toast Notification (Microcopy 1 a 3 palabras) */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '22px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastType === 'success' ? '#047857' : '#D97706',
            color: '#FFFFFF',
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 800,
            border: toastType === 'success' ? '1px solid #34D399' : '1px solid #FBBF24'
          }}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-white" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ENCABEZADO TIPO ORACLE NETSUITE / SIFYGSA ENTERPRISE                   */}
      {/* ========================================================================= */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Recursos Humanos</span> <span style={{ margin: '0 4px' }}>/</span> <span>Catálogos</span> <span style={{ margin: '0 4px' }}>/</span> <strong style={{ color: 'var(--text-secondary)' }}>Departamentos</strong>
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Departamentos
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Estructura organizacional y centros de costo operativos SIFYGSA
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
                    minWidth: '280px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '4px'
                  }}
                >
                  {[
                    'Vista predeterminada de departamento',
                    'Vista operativa con plantilla de puestos',
                    'Vista resumida de centros de costos',
                    'Vista de auditoría y responsables'
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
              onClick={() => showToast('Vista personalizada para el rol de RRHH')}
              style={{ fontSize: '12px' }}
            >
              Personalizar vista
            </button>

            {/* Botón Principal Crear Departamento */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
            >
              <Plus className="w-4 h-4" />
              <span>Crear Departamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE MÉTRICAS RÁPIDAS (KPIs DEPARTAMENTALES)                    */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Departamentos</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{departments.length} Áreas</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Colaboradores Adscritos</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalEmployees} Colaboradores</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Área con Mayor Frente</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Ingeniería (22)
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Estado de Catálogo</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#047857' }}>100% Sincronizado</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS, FILTROS Y ACCIONES DE EXPORTACIÓN (NETSUITE)   */}
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
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px' }}
          >
            <Filter className="w-3.5 h-3.5 text-muted" />
            <span>+ FILTROS</span>
          </button>

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
              title="Imprimir Catálogo"
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
              placeholder="Buscar departamento..."
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
              title="Vista Cuadrícula / Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Contador Total tipo NetSuite */}
          <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            TOTAL: <span style={{ color: 'var(--primary)' }}>{filteredDepartments.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA PRINCIPAL DE DEPARTAMENTOS (REPLICANDO LA TABLA NETSUITE)       */}
      {/* ========================================================================= */}
      {viewMode === 'list' ? (
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px', width: '110px' }}>EDITAR | VER</th>
                  <th
                    style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>NOMBRE</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th
                    style={{ padding: '12px 16px', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('code')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>CÓDIGO</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px' }}>TITULAR / RESPONSABLE</th>
                  <th
                    style={{ padding: '12px 16px', width: '140px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                    onClick={() => toggleSort('employeeCount')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>PERSONAL</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px', width: '160px' }}>SEDE PRINCIPAL</th>
                  <th style={{ padding: '12px 16px', width: '100px', textAlign: 'center' }}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={dept.id}
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
                      {/* Acciones Editar | Ver tipo NetSuite */}
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dept)}
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
                            onClick={() => handleOpenDetail(dept)}
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

                      {/* Nombre del Departamento */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--brand-50)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '11px',
                              flexShrink: 0
                            }}
                          >
                            {dept.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {dept.name}
                          </span>
                        </div>
                      </td>

                      {/* Código */}
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {dept.code}
                      </td>

                      {/* Responsable */}
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {dept.lead}
                      </td>

                      {/* Conteo de Colaboradores */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: dept.employeeCount > 0 ? 'var(--brand-50)' : 'var(--surface-alt)',
                            color: dept.employeeCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '11px'
                          }}
                        >
                          {dept.employeeCount} {dept.employeeCount === 1 ? 'persona' : 'personas'}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                        {dept.location}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            backgroundColor: dept.status === 'active' ? 'var(--success-bg)' : 'var(--surface-alt)',
                            color: dept.status === 'active' ? 'var(--success-text)' : 'var(--text-secondary)',
                            border: dept.status === 'active' ? '1px solid var(--success-border)' : '1px solid var(--border)'
                          }}
                        >
                          {dept.status === 'active' ? 'Activo' : 'Inactivo'}
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
        /* Vista en Cuadrícula / Tarjetas */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="card card-hoverable"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700, backgroundColor: 'var(--brand-50)', padding: '2px 6px', borderRadius: '4px' }}>
                    {dept.code}
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: dept.status === 'active' ? 'var(--success-text)' : 'var(--text-muted)' }}>
                    ● {dept.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  {dept.name}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, minHeight: '34px', lineHeight: 1.4 }}>
                  {dept.description || 'Departamento operativo central de SIFYGSA.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>TITULAR</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>{dept.lead}</div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dept)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(dept)}
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

      {/* ========================================================================= */}
      {/* MODAL: CREAR DEPARTAMENTO                                                 */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Crear Departamento</h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Se sincronizará en todos los selectores de la suite</div>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveNew} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                  Nombre del Departamento <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Automatización & SCADA"
                  value={formName}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizeCleanText(e.target.value, 65);
                    if (hadInvalid) showToast('¡Carácter inválido!', 'warning');
                    setFormName(value);
                  }}
                  className="input-text"
                  style={{ width: '100%' }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12))}
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                    Sede Principal
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '38px' }}
                  >
                    <option value="Minatitlán, Ver.">Minatitlán, Ver.</option>
                    <option value="Comalcalco, Tab.">Comalcalco, Tab.</option>
                    <option value="Base Mapachapa Km 18">Base Mapachapa Km 18</option>
                    <option value="Xalapa, Ver.">Xalapa, Ver.</option>
                    <option value="Ciudad del Carmen, Camp.">Ciudad del Carmen, Camp.</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                  Titular / Responsable del Área
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Carlos Hernández Vega"
                  value={formLead}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizePersonName(e.target.value);
                    if (hadInvalid) showToast('¡Solo letras!', 'warning');
                    setFormLead(value);
                  }}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                  Descripción u Objetivo Operativo
                </label>
                <textarea
                  rows={3}
                  placeholder="Funciones clave, alcance técnico o cuadrillas a su cargo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input-text"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '12px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <span>Departamento Activo (visible en captura de empleados)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Guardar Departamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR DEPARTAMENTO                                                */}
      {/* ========================================================================= */}
      {isEditModalOpen && currentDepartment && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Editar Departamento</h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{currentDepartment.name}</div>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveEdit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                  Nombre del Departamento <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizeCleanText(e.target.value, 65);
                    if (hadInvalid) showToast('¡Carácter inválido!', 'warning');
                    setFormName(value);
                  }}
                  className="input-text"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12))}
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                    Sede Principal
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '38px' }}
                  >
                    <option value="Minatitlán, Ver.">Minatitlán, Ver.</option>
                    <option value="Comalcalco, Tab.">Comalcalco, Tab.</option>
                    <option value="Base Mapachapa Km 18">Base Mapachapa Km 18</option>
                    <option value="Xalapa, Ver.">Xalapa, Ver.</option>
                    <option value="Ciudad del Carmen, Camp.">Ciudad del Carmen, Camp.</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                  Titular / Responsable del Área
                </label>
                <input
                  type="text"
                  value={formLead}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizePersonName(e.target.value);
                    if (hadInvalid) showToast('¡Solo letras!', 'warning');
                    setFormLead(value);
                  }}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                  Descripción u Objetivo Operativo
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input-text"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '12px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <span>Departamento Activo</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Actualizar Departamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLE DEL DEPARTAMENTO                                       */}
      {/* ========================================================================= */}
      {isDetailModalOpen && currentDepartment && (
        <div className="modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{currentDepartment.name}</h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Código {currentDepartment.code}</div>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>TITULAR / JEFE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{currentDepartment.lead}</div>
                </div>
                <div style={{ backgroundColor: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>PLANTILLA ACTIVA</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{currentDepartment.employeeCount} Colaboradores</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Sede Operativa</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>{currentDepartment.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Subsidiaria</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>{currentDepartment.subsidiary}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Descripción / Misión</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.5 }}>
                  {currentDepartment.description || 'Departamento operativo adscrito a la estructura corporativa de SIFYGSA Fire & Gas Safety Systems.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(currentDepartment);
                  }}
                >
                  Editar Información
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
