'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Eye,
  Copy,
  Check,
  Search,
  Network,
  Layers,
  X,
  PhoneCall
} from 'lucide-react';
import { Employee } from '../../types';
import {
  getDepartmentCode,
  getDepartmentTheme,
  matchesNormalizedSearch,
  normalizeLocationLabel
} from '../../utils/formShield';

export interface TeamsOrgNode {
  employee: Employee;
  children: TeamsOrgNode[];
  totalDescendants: number;
  depth: number;
}

export interface TeamsTierMeta {
  level: number;
  code: string;
  shortLabel: string;
  groupTitle: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
}

interface TeamsOrgPanelProps {
  rootNode: TeamsOrgNode;
  nodeMap: Map<string, TeamsOrgNode>;
  parentMap: Map<string, string>;
  levelMap: Map<string, number>;
  tierMetaMap: Record<number, TeamsTierMeta>;
  selectedPersonId: string;
  scopedBranchId: string | null;
  globalSearchQuery: string;
  isFullscreen: boolean;
  onSelectPerson: (employeeId: string) => void;
  onViewEmployee: (employee: Employee) => void;
  onOpenInTree: (employeeId: string) => void;
}

export const TeamsOrgPanel: React.FC<TeamsOrgPanelProps> = ({
  rootNode,
  nodeMap,
  parentMap,
  levelMap,
  tierMetaMap,
  selectedPersonId,
  scopedBranchId,
  globalSearchQuery,
  isFullscreen,
  onSelectPerson,
  onViewEmployee,
  onOpenInTree
}) => {
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [reportsTierFilter, setReportsTierFilter] = useState<number | 'all'>('all');
  const [peersExpandedOverride, setPeersExpandedOverride] = useState<boolean | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedNode = nodeMap.get(selectedPersonId) || rootNode;
  const selectedEmp = selectedNode.employee;
  const selectedLevel = levelMap.get(selectedEmp.id) ?? 7;
  const selectedTier = tierMetaMap[selectedLevel] || tierMetaMap[7];
  const selectedDeptCode = getDepartmentCode(selectedEmp.department, selectedEmp.location);
  const selectedTheme = getDepartmentTheme(selectedDeptCode, selectedEmp.location);

  // Cadena superior (de Director General hasta jefe inmediato)
  const ancestors = useMemo(() => {
    const chain: TeamsOrgNode[] = [];
    let currParentId = parentMap.get(selectedEmp.id);
    let guard = 0;
    while (currParentId && guard < 12) {
      const parentNode = nodeMap.get(currParentId);
      if (parentNode) chain.unshift(parentNode);
      currParentId = parentMap.get(currParentId);
      guard += 1;
    }
    return chain;
  }, [selectedEmp.id, parentMap, nodeMap]);

  const immediateBossNode = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
  const directReports = selectedNode.children;

  // Pares (compañeros que reportan al mismo jefe inmediato)
  const peers = useMemo(() => {
    if (!immediateBossNode) return [];
    return immediateBossNode.children.filter((c) => c.employee.id !== selectedEmp.id);
  }, [immediateBossNode, selectedEmp.id]);

  // Desglose de niveles dentro de los reportes directos para chips de filtro
  const reportTierTabs = useMemo(() => {
    const counts = new Map<number, number>();
    directReports.forEach((child) => {
      const lvl = levelMap.get(child.employee.id) ?? 7;
      counts.set(lvl, (counts.get(lvl) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({
        level,
        meta: tierMetaMap[level] || tierMetaMap[7],
        count
      }));
  }, [directReports, levelMap, tierMetaMap]);

  const activeTierFilter =
    reportsTierFilter !== 'all' && reportTierTabs.some((t) => t.level === reportsTierFilter)
      ? reportsTierFilter
      : 'all';

  const visibleDirectReports = useMemo(() => {
    if (activeTierFilter === 'all') return directReports;
    return directReports.filter(
      (child) => (levelMap.get(child.employee.id) ?? 7) === activeTierFilter
    );
  }, [directReports, activeTierFilter, levelMap]);

  // Directorio lateral (acotado al área seleccionada arriba o a toda la empresa)
  const directoryNodes = useMemo(() => {
    const scopeRoot =
      scopedBranchId && nodeMap.has(scopedBranchId)
        ? nodeMap.get(scopedBranchId) || rootNode
        : rootNode;

    const collected: TeamsOrgNode[] = [];
    const walk = (n: TeamsOrgNode) => {
      collected.push(n);
      n.children.forEach(walk);
    };
    walk(scopeRoot);

    const combinedQuery = (sidebarQuery || globalSearchQuery).trim();
    const filtered = !combinedQuery
      ? collected
      : collected.filter((n) => {
          const emp = n.employee;
          return matchesNormalizedSearch(
            combinedQuery,
            emp.name,
            emp.position,
            emp.department,
            emp.id,
            normalizeLocationLabel(emp.location || emp.codeLocation),
            emp.location
          );
        });

    // Ordenado estrictamente de mayor jerarquía a menor (N1 -> N7)
    return filtered.sort((a, b) => {
      const lvlA = levelMap.get(a.employee.id) ?? 7;
      const lvlB = levelMap.get(b.employee.id) ?? 7;
      if (lvlA !== lvlB) return lvlA - lvlB;
      if (a.totalDescendants !== b.totalDescendants) {
        return b.totalDescendants - a.totalDescendants;
      }
      return a.employee.name.localeCompare(b.employee.name, 'es');
    });
  }, [scopedBranchId, nodeMap, rootNode, sidebarQuery, globalSearchQuery, levelMap]);

  const handleCopy = (key: string, value?: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {
      // ignore clipboard errors
    });
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1500);
  };

  const handleSelectAndReset = (empId: string) => {
    setReportsTierFilter('all');
    setPeersExpandedOverride(null);
    onSelectPerson(empId);
  };

  const showPeersExpanded =
    peersExpandedOverride !== null ? peersExpandedOverride : directReports.length === 0;

  const phoneDisplay = selectedEmp.phoneCell || selectedEmp.phonePrimary;
  const firstName = selectedEmp.name.split(' ')[0] || selectedEmp.name;

  const renderMiniPersonCard = (node: TeamsOrgNode, kind: 'report' | 'peer') => {
    const emp = node.employee;
    const deptCode = getDepartmentCode(emp.department, emp.location);
    const theme = getDepartmentTheme(deptCode, emp.location);
    const lvl = levelMap.get(emp.id) ?? 7;
    const tier = tierMetaMap[lvl] || tierMetaMap[7];

    return (
      <div
        key={`${kind}-${emp.id}`}
        onClick={() => handleSelectAndReset(emp.id)}
        className="card-hoverable"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease'
        }}
        title={`Explorar cadena de mando de ${emp.name}`}
      >
        <div style={{ height: '3px', backgroundColor: theme.accent }} />
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: emp.avatarBg || theme.accent,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12.5px',
                fontWeight: 800,
                border: `1.5px solid ${theme.softBorder}`
              }}
            >
              {emp.photoUrl ? (
                <img
                  src={emp.photoUrl}
                  alt={emp.name}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                emp.initials
              )}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                border: '2px solid var(--surface)'
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: tier.badgeBg,
                  color: tier.badgeColor,
                  border: `1px solid ${tier.badgeBorder}`
                }}
              >
                {tier.code} · {tier.shortLabel}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: theme.softBg,
                  color: theme.accent,
                  border: `1px solid ${theme.softBorder}`
                }}
              >
                {deptCode}
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {emp.name}
            </div>

            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginTop: '2px',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {emp.position}
            </div>

            {emp.location && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9.5px',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}
              >
                <MapPin className="w-2.5 h-2.5" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.location}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-alt)',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          {node.totalDescendants > 0 ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--primary)'
              }}
            >
              <Users className="w-3 h-3" />
              <span>{node.totalDescendants} a cargo</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {emp.id}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewEmployee(emp);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              padding: '2px 5px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            title="Abrir expediente completo"
          >
            <Eye className="w-3 h-3" />
            <span>Ficha</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(250px, 290px) minmax(0, 1fr)',
        flex: isFullscreen ? 1 : undefined,
        minHeight: isFullscreen ? 0 : '600px',
        height: isFullscreen ? undefined : '74vh',
        backgroundColor: 'var(--app-bg)',
        overflow: 'hidden'
      }}
    >
      {/* ================================================================= */}
      {/* COLUMNA IZQUIERDA: EXPLORADOR RÁPIDO DE PERSONAS                  */}
      {/* ================================================================= */}
      <aside
        style={{
          borderRight: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Directorio por jerarquía
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)'
              }}
            >
              {directoryNodes.length}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              className="w-3.5 h-3.5"
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              className="input-text"
              value={sidebarQuery}
              onChange={(e) => setSidebarQuery(e.target.value)}
              placeholder="Filtrar persona en lista..."
              style={{
                paddingLeft: '28px',
                paddingRight: sidebarQuery ? '24px' : '10px',
                height: '30px',
                fontSize: '11.5px',
                width: '100%'
              }}
            />
            {sidebarQuery && (
              <button
                type="button"
                onClick={() => setSidebarQuery('')}
                style={{
                  position: 'absolute',
                  right: '7px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'inline-flex'
                }}
                aria-label="Limpiar filtro lateral"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {directoryNodes.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              Sin coincidencias en este filtro.
            </div>
          ) : (
            directoryNodes.map((node) => {
              const emp = node.employee;
              const isSelected = emp.id === selectedEmp.id;
              const deptCode = getDepartmentCode(emp.department, emp.location);
              const theme = getDepartmentTheme(deptCode, emp.location);
              const lvl = levelMap.get(emp.id) ?? 7;
              const tier = tierMetaMap[lvl] || tierMetaMap[7];

              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelectAndReset(emp.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: isSelected ? `3px solid ${theme.accent}` : '3px solid transparent',
                    backgroundColor: isSelected ? 'var(--brand-50)' : 'transparent',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: emp.avatarBg || theme.accent,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800
                      }}
                    >
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        emp.initials
                      )}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        right: '-1px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#22C55E',
                        border: '1.5px solid var(--surface)'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 800 : 700,
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {emp.name}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '999px',
                          backgroundColor: tier.badgeBg,
                          color: tier.badgeColor,
                          border: `1px solid ${tier.badgeBorder}`,
                          flexShrink: 0
                        }}
                      >
                        {tier.code}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '1px'
                      }}
                    >
                      {emp.position}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ================================================================= */}
      {/* COLUMNA DERECHA: ORGANIZACIÓN ESTILO TEAMS EMPRESARIAL            */}
      {/* ================================================================= */}
      <div
        style={{
          overflowY: 'auto',
          minHeight: 0,
          padding: '18px 24px 36px',
          backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '22px 22px'
        }}
      >
        <div
          style={{
            maxWidth: '880px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Barra superior de contexto de cadena */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Layers className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                <span>
                  {ancestors.length === 0
                    ? 'Nivel 1 · Dirección General'
                    : `Nivel ${ancestors.length + 1} en cadena · ${ancestors.length} ${
                        ancestors.length === 1 ? 'superior' : 'superiores'
                      } arriba`}
                </span>
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {immediateBossNode && (
                <button
                  type="button"
                  onClick={() => handleSelectAndReset(immediateBossNode.employee.id)}
                  className="rrhh-dept-action-btn"
                  style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'var(--surface)' }}
                  title={`Subir a ${immediateBossNode.employee.name}`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Subir a {immediateBossNode.employee.name.split(' ')[0]}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenInTree(selectedEmp.id)}
                className="rrhh-dept-action-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--primary)',
                  borderColor: 'var(--brand-200)'
                }}
                title="Abrir esta estructura en la vista de árbol completo"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Ver en Árbol</span>
              </button>
            </div>
          </div>

          {/* 1. CADENA SUPERIOR ("QUIÉN ESTÁ ARRIBA DE X PERSONA") */}
          {ancestors.length > 0 && (
            <div
              style={{
                width: '100%',
                maxWidth: '540px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px'
                }}
              >
                Reporta a · Cadena superior ({ancestors.length})
              </div>

              {ancestors.map((ancNode, idx) => {
                const emp = ancNode.employee;
                const deptCode = getDepartmentCode(emp.department, emp.location);
                const theme = getDepartmentTheme(deptCode, emp.location);
                const lvl = levelMap.get(emp.id) ?? 7;
                const tier = tierMetaMap[lvl] || tierMetaMap[7];
                const isDirectBoss = idx === ancestors.length - 1;

                return (
                  <React.Fragment key={emp.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectAndReset(emp.id)}
                      className="card-hoverable"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface)',
                        border: isDirectBoss
                          ? `1.5px solid ${theme.softBorder}`
                          : '1px solid var(--border)',
                        borderLeft: `4px solid ${theme.accent}`,
                        boxShadow: 'var(--shadow-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                      title={`Cambiar enfoque a ${emp.name}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              backgroundColor: emp.avatarBg || theme.accent,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 800
                            }}
                          >
                            {emp.photoUrl ? (
                              <img
                                src={emp.photoUrl}
                                alt={emp.name}
                                draggable={false}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              emp.initials
                            )}
                          </div>
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '-1px',
                              right: '-1px',
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              backgroundColor: '#22C55E',
                              border: '2px solid var(--surface)'
                            }}
                          />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '999px',
                                backgroundColor: tier.badgeBg,
                                color: tier.badgeColor,
                                border: `1px solid ${tier.badgeBorder}`
                              }}
                            >
                              {tier.code} · {tier.shortLabel}
                            </span>
                            {isDirectBoss && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  color: 'var(--primary)',
                                  backgroundColor: 'var(--brand-50)',
                                  padding: '1px 6px',
                                  borderRadius: '999px'
                                }}
                              >
                                Jefe directo
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              marginTop: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {emp.name}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {emp.position}
                            {emp.location ? ` · ${emp.location}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--surface-alt)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {ancNode.totalDescendants} a cargo
                        </span>
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </button>

                    {/* Conector vertical estilo Teams hacia el siguiente nivel */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '24px',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '2px', height: '100%', backgroundColor: 'var(--border)' }} />
                      <span
                        style={{
                          position: 'absolute',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: isDirectBoss ? 'var(--primary)' : 'var(--border)',
                          border: '2px solid var(--app-bg)'
                        }}
                      />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* 2. TARJETA CENTRAL ENFOCADA (PERSONA ACTUAL ESTILO TEAMS) */}
          <div
            style={{
              width: '100%',
              maxWidth: '580px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              border: '2px solid var(--primary)',
              boxShadow: '0 12px 30px -10px rgba(29, 78, 216, 0.22)',
              overflow: 'hidden'
            }}
          >
            <div style={{ height: '4px', backgroundColor: selectedTheme.accent }} />

            <div style={{ padding: '16px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: selectedTier.badgeBg,
                      color: selectedTier.badgeColor,
                      border: `1px solid ${selectedTier.badgeBorder}`
                    }}
                  >
                    {selectedTier.code} · {selectedTier.shortLabel}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      backgroundColor: selectedTheme.softBg,
                      color: selectedTheme.accent,
                      border: `1px solid ${selectedTheme.softBorder}`
                    }}
                  >
                    {selectedDeptCode} · {selectedEmp.department}
                  </span>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)'
                  }}
                >
                  {selectedEmp.id}
                </span>
              </div>

              {/* Perfil principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      backgroundColor: selectedEmp.avatarBg || selectedTheme.accent,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '21px',
                      fontWeight: 800,
                      border: `2px solid ${selectedTheme.softBorder}`
                    }}
                  >
                    {selectedEmp.photoUrl ? (
                      <img
                        src={selectedEmp.photoUrl}
                        alt={selectedEmp.name}
                        draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      selectedEmp.initials
                    )}
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#22C55E',
                      border: '2.5px solid var(--surface)'
                    }}
                    title="Activo"
                  />
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.25
                    }}
                  >
                    {selectedEmp.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      marginTop: '2px'
                    }}
                  >
                    {selectedEmp.position}
                  </div>
                  {selectedEmp.location && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        marginTop: '4px'
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedEmp.location}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onViewEmployee(selectedEmp)}
                  className="btn btn-primary"
                  style={{ padding: '7px 13px', fontSize: '12px', gap: '6px' }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver expediente</span>
                </button>
              </div>

              {/* Franja de contacto rápido (estilo Teams) */}
              {(selectedEmp.email || phoneDisplay || selectedEmp.officeExtension) && (
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '11px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {selectedEmp.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy('email', selectedEmp.email)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 9px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                      title="Copiar correo corporativo"
                    >
                      <Mail className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      <span>{selectedEmp.email}</span>
                      {copiedKey === 'email' ? (
                        <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
                      ) : (
                        <Copy className="w-3 h-3" style={{ opacity: 0.6 }} />
                      )}
                    </button>
                  )}

                  {phoneDisplay && (
                    <button
                      type="button"
                      onClick={() => handleCopy('phone', phoneDisplay)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 9px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                      title="Copiar teléfono"
                    >
                      <Phone className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      <span>{phoneDisplay}</span>
                      {copiedKey === 'phone' ? (
                        <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
                      ) : (
                        <Copy className="w-3 h-3" style={{ opacity: 0.6 }} />
                      )}
                    </button>
                  )}

                  {selectedEmp.officeExtension && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--brand-50)',
                        border: '1px solid var(--brand-200)',
                        color: 'var(--primary)'
                      }}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Ext. {selectedEmp.officeExtension}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Pie resumen de relaciones */}
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-alt)',
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              <span>
                <strong>Reportes directos:</strong> {directReports.length}
                {selectedNode.totalDescendants > directReports.length
                  ? ` (${selectedNode.totalDescendants} en total)`
                  : ''}
              </span>
              <span>
                <strong>Compañeros del mismo equipo:</strong> {peers.length}
              </span>
            </div>
          </div>

          {/* 3. REPORTES DIRECTOS ("REPORTAN A [NOMBRE]") */}
          {directReports.length > 0 && (
            <>
              <div style={{ width: '2px', height: '24px', backgroundColor: 'var(--border)' }} />

              <div
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '15px 16px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '12px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Reportan a {firstName}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--brand-50)',
                        color: 'var(--primary)',
                        border: '1px solid var(--brand-200)'
                      }}
                    >
                      {directReports.length} directos
                    </span>
                  </div>

                  {/* Filtro rápido por nivel jerárquico cuando hay 2+ niveles */}
                  {reportTierTabs.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setReportsTierFilter('all')}
                        style={{
                          fontSize: '10.5px',
                          fontWeight: activeTierFilter === 'all' ? 800 : 600,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          backgroundColor: activeTierFilter === 'all' ? 'var(--primary)' : 'var(--surface-alt)',
                          color: activeTierFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                          border:
                            activeTierFilter === 'all'
                              ? '1px solid var(--primary)'
                              : '1px solid var(--border-subtle)'
                        }}
                      >
                        Todos ({directReports.length})
                      </button>
                      {reportTierTabs.map(({ level, meta, count }) => {
                        const isActive = activeTierFilter === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setReportsTierFilter(level)}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: isActive ? 800 : 600,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              cursor: 'pointer',
                              backgroundColor: isActive ? meta.badgeBg : 'var(--surface-alt)',
                              color: isActive ? meta.badgeColor : 'var(--text-secondary)',
                              border: isActive
                                ? `1.5px solid ${meta.badgeBorder}`
                                : '1px solid var(--border-subtle)'
                            }}
                          >
                            {meta.code} {meta.shortLabel} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(236px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {visibleDirectReports.map((child) => renderMiniPersonCard(child, 'report'))}
                </div>
              </div>
            </>
          )}

          {/* 4. COMPAÑEROS DEL MISMO EQUIPO ("TRABAJA CON · TAMBIÉN REPORTAN A [JEFE]") */}
          {peers.length > 0 && immediateBossNode && (
            <div
              style={{
                width: '100%',
                marginTop: '18px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <button
                type="button"
                onClick={() => setPeersExpandedOverride(!showPeersExpanded)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  backgroundColor: 'var(--surface-alt)',
                  border: 'none',
                  borderBottom: showPeersExpanded ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Mismo equipo · También reportan a {immediateBossNode.employee.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {peers.length} {peers.length === 1 ? 'compañero' : 'compañeros'}
                  </span>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--primary)'
                  }}
                >
                  <span>{showPeersExpanded ? 'Ocultar' : 'Mostrar'}</span>
                  {showPeersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              {showPeersExpanded && (
                <div
                  style={{
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(236px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {peers.map((peer) => renderMiniPersonCard(peer, 'peer'))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
