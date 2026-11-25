'use client';

import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Star
} from 'lucide-react';
import { ExtensionDirectoryItem } from '../../types';
import { INITIAL_EXTENSIONS_DIRECTORY, DEPARTMENTS } from '../../data/mockData';
import {
  useSyncedExtensions,
  savePersistedExtensions,
  sanitizeExtension,
  sanitizeCleanText,
  sanitizePersonName,
  downloadCsvFile,
  logHrAuditAction,
  matchesNormalizedSearch
} from '../../utils/formShield';

interface ExtensionsCatalogViewProps {
  departments?: string[];
}

const WORK_LOCATIONS = [
  'Minatitlán, Ver.',
  'Mapachapa, Ver.',
  'Comalcalco, Tab.',
  'Xalapa, Ver.',
  'Ciudad del Carmen, Camp.',
  'Mérida, Yuc.'
];

export const ExtensionsCatalogView: React.FC<ExtensionsCatalogViewProps> = ({
  departments
}) => {
  const availableDepartments = departments && departments.length > 0 ? departments : DEPARTMENTS;
  const extensionsList = useSyncedExtensions(INITIAL_EXTENSIONS_DIRECTORY);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('Todos');

  // Estado del Modal CRUD (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtensionDirectoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExtensionDirectoryItem | null>(null);

  // Campos del formulario
  const [formExtension, setFormExtension] = useState('');
  const [formAreaLabel, setFormAreaLabel] = useState('');
  const [formDepartment, setFormDepartment] = useState(availableDepartments[0] || 'Administración');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formLocation, setFormLocation] = useState('Minatitlán, Ver.');
  const [formIsDefault, setFormIsDefault] = useState(true);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  };

  const filteredExtensions = useMemo(() => {
    return extensionsList
      .filter((item) => {
        const matchesDept =
          selectedDeptFilter === 'Todos' ||
          item.department.toLowerCase() === selectedDeptFilter.toLowerCase();
        const matchesSearch = matchesNormalizedSearch(
          searchQuery,
          item.extension,
          item.areaLabel,
          item.department,
          item.assignedTo,
          item.location
        );
        return matchesDept && matchesSearch;
      })
      .sort((a, b) => Number(a.extension) - Number(b.extension));
  }, [extensionsList, searchQuery, selectedDeptFilter]);

  const handleOpenCreate = () => {
    const maxExt = extensionsList.reduce((acc, item) => {
      const n = parseInt(item.extension, 10);
      return !isNaN(n) && n > acc ? n : acc;
    }, 120);
    setEditingItem(null);
    setFormExtension(String(maxExt + 1));
    setFormAreaLabel('');
    setFormDepartment(availableDepartments[0] || 'Administración');
    setFormAssignedTo('');
    setFormLocation('Minatitlán, Ver.');
    setFormIsDefault(false);
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExtensionDirectoryItem) => {
    setEditingItem(item);
    setFormExtension(item.extension);
    setFormAreaLabel(item.areaLabel);
    setFormDepartment(item.department);
    setFormAssignedTo(item.assignedTo);
    setFormLocation(item.location);
    setFormIsDefault(Boolean(item.isDefaultForDept));
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanExt = formExtension.trim();
    if (!cleanExt) {
      showToast('¡Indica la extensión!', 'warning');
      return;
    }
    if (!formAreaLabel.trim()) {
      showToast('¡Indica el área!', 'warning');
      return;
    }

    const duplicate = extensionsList.find(
      (item) => item.extension === cleanExt && (!editingItem || item.id !== editingItem.id)
    );
    if (duplicate) {
      showToast(`¡Extensión ${cleanExt} ya existe!`, 'warning');
      return;
    }

    let updatedList = [...extensionsList];

    // Si se marca como predeterminada del departamento, desmarcar las demás de ese mismo depto
    if (formIsDefault) {
      updatedList = updatedList.map((item) =>
        item.department.toLowerCase() === formDepartment.toLowerCase()
          ? { ...item, isDefaultForDept: false }
          : item
      );
    }

    if (editingItem) {
      const updatedItem: ExtensionDirectoryItem = {
        ...editingItem,
        extension: cleanExt,
        areaLabel: formAreaLabel.trim(),
        department: formDepartment,
        assignedTo: formAssignedTo.trim() || 'Por Asignar',
        location: formLocation,
        isDefaultForDept: formIsDefault,
        status: formStatus
      };
      updatedList = updatedList.map((item) => (item.id === editingItem.id ? updatedItem : item));
      savePersistedExtensions(updatedList);
      logHrAuditAction({
        actionType: 'Catálogo Departamentos',
        targetRecord: `Ext. ${updatedItem.extension} · ${updatedItem.areaLabel}`,
        details: `Actualización de extensión telefónica para ${updatedItem.department}.`,
        previousValue: `Ext. ${editingItem.extension} (${editingItem.assignedTo})`,
        newValue: `Ext. ${updatedItem.extension} (${updatedItem.assignedTo})`,
        severity: 'normal'
      });
      showToast('¡Extensión actualizada!', 'success');
    } else {
      const newItem: ExtensionDirectoryItem = {
        id: `ext-${Date.now()}`,
        extension: cleanExt,
        areaLabel: formAreaLabel.trim(),
        department: formDepartment,
        assignedTo: formAssignedTo.trim() || 'Por Asignar',
        location: formLocation,
        isDefaultForDept: formIsDefault,
        status: formStatus
      };
      updatedList = [...updatedList, newItem];
      savePersistedExtensions(updatedList);
      logHrAuditAction({
        actionType: 'Catálogo Departamentos',
        targetRecord: `Ext. ${newItem.extension} · ${newItem.areaLabel}`,
        details: `Alta de nueva extensión telefónica asignada a ${newItem.department}.`,
        previousValue: 'Sin registro',
        newValue: `Ext. ${newItem.extension} (${newItem.assignedTo})`,
        severity: 'normal'
      });
      showToast('¡Extensión agregada!', 'success');
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updatedList = extensionsList.filter((item) => item.id !== deleteTarget.id);
    savePersistedExtensions(updatedList);
    logHrAuditAction({
      actionType: 'Catálogo Departamentos',
      targetRecord: `Ext. ${deleteTarget.extension} · ${deleteTarget.areaLabel}`,
      details: `Eliminación de extensión telefónica del directorio (${deleteTarget.department}).`,
      previousValue: `Ext. ${deleteTarget.extension}`,
      newValue: 'Eliminado',
      severity: 'normal'
    });
    setDeleteTarget(null);
    showToast('¡Extensión eliminada!', 'success');
  };

  const handleSetDefaultForDept = (target: ExtensionDirectoryItem) => {
    const updated = extensionsList.map((item) => {
      if (item.department.toLowerCase() === target.department.toLowerCase()) {
        return { ...item, isDefaultForDept: item.id === target.id };
      }
      return item;
    });
    savePersistedExtensions(updated);
    showToast(`Ext. ${target.extension} predeterminada en ${target.department}`, 'success');
  };

  const handleExportExcel = () => {
    downloadCsvFile(
      'Directorio_Extensiones_SIFYGSA.csv',
      ['Extensión', 'Área / Subárea', 'Departamento Vinculado', 'Responsable / Asignado', 'Base', 'Predeterminada en Alta'],
      filteredExtensions.map((item) => [
        item.extension,
        item.areaLabel,
        item.department,
        item.assignedTo,
        item.location,
        item.isDefaultForDept ? 'Sí' : 'No'
      ])
    );
    showToast('¡Excel descargado!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      {/* Notificación Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '22px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#047857' : '#D97706',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 800
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Encabezado Superior */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Recursos Humanos</span> <span style={{ margin: '0 4px' }}>/</span> <span>Catálogos</span>{' '}
          <span style={{ margin: '0 4px' }}>/</span>{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>Extensiones Telefónicas</strong>
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
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Directorio de Extensiones Telefónicas
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Extensiones internas por área y sede.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <FileSpreadsheet className="w-4 h-4" style={{ color: '#047857' }} />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Extensión</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Extensiones</div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>{extensionsList.length} líneas</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deptos. Vinculados</div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {new Set(extensionsList.map((e) => e.department)).size} áreas
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star className="w-4 h-4" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Autollenado en Alta</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#047857' }}>Activo por Departamento</div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro por Departamento */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Departamento:</span>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="select-control"
            style={{ height: '34px', fontSize: '12px', minWidth: '190px' }}
          >
            <option value="Todos">Todos los departamentos ({extensionsList.length})</option>
            {Array.from(new Set([...availableDepartments, ...extensionsList.map((e) => e.department)])).map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search className="w-3.5 h-3.5 text-muted" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar ext. (ej. 111), área o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '30px', height: '34px', fontSize: '12px', width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)' }}>
            MOSTRANDO: <span style={{ color: 'var(--primary)' }}>{filteredExtensions.length}</span>
          </div>
        </div>
      </div>

      {/* Tabla CRUD de Extensiones */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <th style={{ padding: '12px 16px', width: '110px' }}>EXTENSIÓN</th>
                <th style={{ padding: '12px 16px' }}>ÁREA / SUBÁREA</th>
                <th style={{ padding: '12px 16px' }}>DEPARTAMENTO VINCULADO</th>
                <th style={{ padding: '12px 16px' }}>RESPONSABLE / ASIGNADO</th>
                <th style={{ padding: '12px 16px', width: '150px' }}>SEDE</th>
                <th style={{ padding: '12px 16px', width: '150px', textAlign: 'center' }}>AUTOLLENADO ALTA</th>
                <th style={{ padding: '12px 16px', width: '130px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredExtensions.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: isEven ? 'var(--surface)' : 'var(--surface-alt)',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '48px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #F59E0B',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '12.5px'
                        }}
                      >
                        {item.extension}
                      </span>
                    </td>

                    <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.areaLabel}
                    </td>

                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 9px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--brand-50)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '11.5px'
                        }}
                      >
                        {item.department}
                      </span>
                    </td>

                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {item.assignedTo}
                    </td>

                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    </td>

                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      {item.isDefaultForDept ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            backgroundColor: 'var(--success-bg)',
                            color: 'var(--success-text)',
                            border: '1px solid var(--success-border)'
                          }}
                        >
                          ★ Principal
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultForDept(item)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '10.5px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Usar esta extensión por defecto al seleccionar este departamento en Alta de Empleado"
                        >
                          Usar en Alta
                        </button>
                      )}
                    </td>

                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Editar extensión"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--danger)' }}
                          title="Eliminar extensión"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Extensión */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            backdropFilter: 'blur(3px)',
            padding: '16px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '14px', boxShadow: 'var(--shadow-xl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingItem ? `Editar Extensión ${editingItem.extension}` : 'Nueva Extensión Telefónica'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Asigna extensión y departamento.
                </p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Extensión <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 121"
                    value={formExtension}
                    onChange={(e) => setFormExtension(sanitizeExtension(e.target.value).value)}
                    maxLength={5}
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Nombre en Directorio / Subárea <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Compras 1, Ventas Istmo, RRHH"
                    value={formAreaLabel}
                    onChange={(e) => setFormAreaLabel(sanitizeCleanText(e.target.value, 60).value)}
                    className="input-text"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Departamento en Sistema <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '38px' }}
                  >
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Base de Trabajo
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '38px' }}
                  >
                    {WORK_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Responsable / Personal Asignado
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Pablo Vázquez Culebro"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(sanitizePersonName(e.target.value).value)}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                />
                <span>Establecer como extensión principal al dar de alta empleados en {formDepartment}</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {editingItem ? 'Guardar Cambios' : 'Agregar Extensión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 210,
            padding: '16px'
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '420px', width: '100%', padding: '22px', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              ¿Eliminar Extensión {deleteTarget.extension}?
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 18px 0' }}>
              Se eliminará la extensión <strong>{deleteTarget.extension} ({deleteTarget.areaLabel})</strong> del catálogo.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
