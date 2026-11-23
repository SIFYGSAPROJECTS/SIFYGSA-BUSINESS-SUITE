'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Eye,
  Maximize2,
  Minimize2,
  GitBranch
} from 'lucide-react';
import { Employee } from '../../types';
import { getDepartmentCode, getDepartmentTheme } from '../../utils/formShield';

interface OrgChartViewProps {
  employees: Employee[];
  onViewEmployee: (employee: Employee) => void;
}

interface OrgNode {
  employee: Employee;
  children: OrgNode[];
  totalDescendants: number;
  depth: number;
}

const normalizeKey = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ing|lic|mtra|mtro|dr|dra|arq|cp|tec)\.?\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isLeadershipRole = (position?: string): boolean => {
  const low = normalizeKey(position);
  return /\b(director|gerente|subgerente|sub-gerente|jefe|coordinador)\b/.test(low);
};

export const OrgChartView: React.FC<OrgChartViewProps> = ({
  employees,
  onViewEmployee
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('todos');
  const [zoom, setZoom] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['SFG-0001', 'SFG-0002', 'SFG-0003']));

  const activeEmployees = useMemo(
    () => employees.filter((e) => (e.employmentStatus || 'Activo') === 'Activo'),
    [employees]
  );

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    activeEmployees.forEach((e) => {
      if (e.department && e.department !== 'Por asignar') set.add(e.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [activeEmployees]);

  // Construcción dinámica del árbol desde los empleados reales sincronizados
  const { rootNode, nodeMap, parentMap } = useMemo(() => {
    if (activeEmployees.length === 0) {
      return {
        rootNode: null as OrgNode | null,
        nodeMap: new Map<string, OrgNode>(),
        parentMap: new Map<string, string>()
      };
    }

    // Buscar raíz: Director General o SFG-0001
    const rootEmp =
      activeEmployees.find((e) => normalizeKey(e.position).includes('director general')) ||
      activeEmployees.find((e) => e.id === 'SFG-0001') ||
      activeEmployees[0];

    const byNormName = new Map<string, Employee>();
    const deptLeadByDept = new Map<string, Employee>();

    activeEmployees.forEach((emp) => {
      byNormName.set(normalizeKey(emp.name), emp);
    });

    // Identificar líder principal de cada departamento para conectar colaboradores sin supervisor
    activeEmployees.forEach((emp) => {
      if (emp.id === rootEmp.id) return;
      const deptKey = normalizeKey(emp.department);
      if (!deptKey) return;
      const existing = deptLeadByDept.get(deptKey);
      const posLow = normalizeKey(emp.position);
      const isHighLeader = posLow.includes('director') || posLow.includes('gerente');
      if (!existing || (isHighLeader && !normalizeKey(existing.position).includes('gerente'))) {
        deptLeadByDept.set(deptKey, emp);
      }
    });

    const findSupervisorEmployee = (emp: Employee): Employee | null => {
      if (emp.id === rootEmp.id) return null;
      const supNorm = normalizeKey(emp.supervisor);
      if (supNorm) {
        // Coincidencia exacta
        const exact = byNormName.get(supNorm);
        if (exact && exact.id !== emp.id) return exact;

        // Coincidencia parcial por nombre y primer apellido (ej. "Miguel Guzmán Reyes" vs "Miguel Ángel Guzmán Reyes")
        const supTokens = supNorm.split(' ').filter((t) => t.length > 2);
        if (supTokens.length >= 2) {
          const matched = activeEmployees.find((cand) => {
            if (cand.id === emp.id) return false;
            const candNorm = normalizeKey(cand.name);
            return supTokens.every((tk) => candNorm.includes(tk));
          });
          if (matched) return matched;
        }
      }

      // Fallback: gerente de su departamento o Director General
      const deptLead = deptLeadByDept.get(normalizeKey(emp.department));
      if (deptLead && deptLead.id !== emp.id) return deptLead;
      return rootEmp;
    };

    const childrenById = new Map<string, Employee[]>();
    const pMap = new Map<string, string>();

    activeEmployees.forEach((emp) => {
      if (emp.id === rootEmp.id) return;
      const sup = findSupervisorEmployee(emp) || rootEmp;
      // Evitar ciclos
      if (sup.id === emp.id) return;
      pMap.set(emp.id, sup.id);
      const list = childrenById.get(sup.id) || [];
      list.push(emp);
      childrenById.set(sup.id, list);
    });

    const nMap = new Map<string, OrgNode>();
    const visited = new Set<string>();

    const buildNode = (emp: Employee, depth: number): OrgNode => {
      visited.add(emp.id);
      const rawChildren = (childrenById.get(emp.id) || []).filter((c) => !visited.has(c.id));

      // Ordenar: primero líderes/gerentes/subgerentes, luego por ID/nombre
      rawChildren.sort((a, b) => {
        const aLead = isLeadershipRole(a.position) ? 0 : 1;
        const bLead = isLeadershipRole(b.position) ? 0 : 1;
        if (aLead !== bLead) return aLead - bLead;
        return a.id.localeCompare(b.id);
      });

      const childNodes = rawChildren.map((child) => buildNode(child, depth + 1));
      const totalDescendants = childNodes.reduce(
        (acc, child) => acc + 1 + child.totalDescendants,
        0
      );

      const node: OrgNode = {
        employee: emp,
        children: childNodes,
        totalDescendants,
        depth
      };
      nMap.set(emp.id, node);
      return node;
    };

    const root = buildNode(rootEmp, 0);
    return { rootNode: root, nodeMap: nMap, parentMap: pMap };
  }, [activeEmployees]);

  // Coincidencias de búsqueda y expansión automática de su cadena jerárquica
  const { matchedIds, autoExpandedIds } = useMemo(() => {
    const q = normalizeKey(searchQuery);
    const matches = new Set<string>();
    const autoExp = new Set<string>();

    if (!q && selectedDept === 'todos') {
      return { matchedIds: matches, autoExpandedIds: autoExp };
    }

    activeEmployees.forEach((emp) => {
      const deptMatch = selectedDept === 'todos' || emp.department === selectedDept;
      const textMatch =
        !q ||
        normalizeKey(emp.name).includes(q) ||
        normalizeKey(emp.position).includes(q) ||
        normalizeKey(emp.department).includes(q) ||
        normalizeKey(emp.id).includes(q) ||
        normalizeKey(getDepartmentCode(emp.department, emp.location)).includes(q);

      if (deptMatch && textMatch) {
        if (q) matches.add(emp.id);
        let curr = parentMap.get(emp.id);
        while (curr) {
          autoExp.add(curr);
          curr = parentMap.get(curr);
        }
      }
    });

    return { matchedIds: matches, autoExpandedIds: autoExp };
  }, [searchQuery, selectedDept, activeEmployees, parentMap]);

  const isExpanded = (id: string): boolean => {
    if (autoExpandedIds.size > 0 && autoExpandedIds.has(id)) return true;
    return expandedIds.has(id);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSetLeadershipPreset = () => {
    if (!rootNode) return;
    const next = new Set<string>([rootNode.employee.id]);
    rootNode.children.forEach((child) => {
      const hasLeaderChild = child.children.some((c) => isLeadershipRole(c.employee.position));
      if (hasLeaderChild) next.add(child.employee.id);
    });
    setExpandedIds(next);
  };

  const handleExpandAll = () => {
    const allParents = new Set<string>();
    nodeMap.forEach((node, id) => {
      if (node.children.length > 0) allParents.add(id);
    });
    setExpandedIds(allParents);
  };

  const handleCollapseToRoot = () => {
    if (!rootNode) return;
    setExpandedIds(new Set([rootNode.employee.id]));
  };

  if (!rootNode) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Sin colaboradores activos para construir el organigrama.
      </div>
    );
  }

  const shouldShowBranch = (node: OrgNode): boolean => {
    if (selectedDept === 'todos' && !searchQuery.trim()) return true;
    const q = normalizeKey(searchQuery);
    const selfDeptOk = selectedDept === 'todos' || node.employee.department === selectedDept;
    const selfTextOk =
      !q ||
      normalizeKey(node.employee.name).includes(q) ||
      normalizeKey(node.employee.position).includes(q) ||
      normalizeKey(node.employee.department).includes(q) ||
      normalizeKey(node.employee.id).includes(q);
    if (selfDeptOk && selfTextOk) return true;
    return node.children.some((child) => shouldShowBranch(child));
  };

  const renderNodeCard = (node: OrgNode, variant: 'root' | 'leader' | 'member') => {
    const { employee, children, totalDescendants } = node;
    const deptCode = getDepartmentCode(employee.department, employee.location);
    const deptTheme = getDepartmentTheme(deptCode, employee.location);
    const expanded = isExpanded(employee.id);
    const isHighlighted = matchedIds.has(employee.id);
    const isRoot = variant === 'root';
    const isMember = variant === 'member';

    return (
      <div
        style={{
          width: isRoot ? '310px' : isMember ? '236px' : '254px',
          backgroundColor: 'var(--surface)',
          borderRadius: isRoot ? '16px' : '13px',
          border: isHighlighted
            ? '2px solid var(--primary)'
            : isRoot
            ? `1.5px solid ${deptTheme.softBorder}`
            : '1px solid var(--border)',
          boxShadow: isHighlighted
            ? '0 0 0 4px rgba(29, 78, 216, 0.16), var(--shadow-md)'
            : isRoot
            ? '0 10px 25px -5px rgba(29, 78, 216, 0.16)'
            : 'var(--shadow-sm)',
          overflow: 'hidden',
          transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
          position: 'relative'
        }}
      >
        {/* Franja superior con color oficial del departamento */}
        <div
          style={{
            height: isRoot ? '5px' : isMember ? '3px' : '4px',
            background: isRoot
              ? `linear-gradient(90deg, #0F172A 0%, ${deptTheme.accent} 60%, #3B82F6 100%)`
              : isMember
              ? deptTheme.softBorder
              : deptTheme.accent
          }}
        />

        {/* Cuerpo clicable para abrir Ficha */}
        <div
          onClick={() => onViewEmployee(employee)}
          style={{
            padding: isRoot ? '14px 16px' : isMember ? '10px 12px' : '12px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: isRoot ? '13px' : '10px'
          }}
          title="Clic para abrir ficha y editar foto"
        >
          {/* Avatar / Foto */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: isRoot ? '54px' : isMember ? '38px' : '46px',
                height: isRoot ? '54px' : isMember ? '38px' : '46px',
                borderRadius: isRoot ? '14px' : '11px',
                overflow: 'hidden',
                backgroundColor: employee.avatarBg || 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isRoot ? '18px' : isMember ? '13px' : '15px',
                fontWeight: 700,
                border: isRoot ? '2px solid var(--brand-200)' : '1.5px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={employee.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                employee.initials
              )}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: isRoot ? '12px' : '10px',
                height: isRoot ? '12px' : '10px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                border: '2px solid var(--surface)'
              }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '5px',
                  backgroundColor: isRoot ? deptTheme.accent : deptTheme.softBg,
                  color: isRoot ? '#FFFFFF' : deptTheme.accent,
                  border: isRoot ? 'none' : `1px solid ${deptTheme.softBorder}`,
                  letterSpacing: '0.03em'
                }}
              >
                {deptCode}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}
              >
                {employee.id}
              </span>
            </div>

            <div
              style={{
                fontSize: isRoot ? '14px' : isMember ? '12px' : '12.5px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={employee.name}
            >
              {employee.name}
            </div>

            <div
              style={{
                fontSize: isRoot ? '11.5px' : '11px',
                fontWeight: 600,
                color: isRoot ? 'var(--primary)' : 'var(--text-secondary)',
                marginTop: '1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={employee.position}
            >
              {employee.position}
            </div>

            {!isMember && employee.location && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  marginTop: '3px'
                }}
              >
                <MapPin className="w-3 h-3" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {employee.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de tarjeta: expandir rama o ver ficha */}
        {children.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-alt)',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <button
              type="button"
              onClick={() => toggleExpand(employee.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                color: expanded ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '6px'
              }}
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <Users className="w-3 h-3" />
              <span>
                {totalDescendants} {totalDescendants === 1 ? 'a cargo' : 'en rama'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onViewEmployee(employee)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Ver ficha completa"
            >
              <Eye className="w-3 h-3" />
              <span>Ficha</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizado recursivo de cada rama gerencial y su equipo
  const renderBranch = (node: OrgNode): React.ReactNode => {
    const visibleChildren = node.children.filter((c) => shouldShowBranch(c));
    const expanded = isExpanded(node.employee.id);
    const leaderChildren = visibleChildren.filter(
      (c) => c.children.length > 0 || isLeadershipRole(c.employee.position)
    );
    const operationalMembers = visibleChildren.filter(
      (c) => c.children.length === 0 && !isLeadershipRole(c.employee.position)
    );

    return (
      <div
        key={node.employee.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {renderNodeCard(node, node.depth === 0 ? 'root' : 'leader')}

        {expanded && visibleChildren.length > 0 && (
          <>
            {/* Línea vertical conectora hacia abajo */}
            <div style={{ width: '2px', height: '22px', backgroundColor: 'var(--border)' }} />

            {/* Sub-líderes en horizontal con conectores de árbol */}
            {leaderChildren.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: '16px',
                  position: 'relative',
                  paddingTop: leaderChildren.length > 1 ? '18px' : '0'
                }}
              >
                {leaderChildren.map((child, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === leaderChildren.length - 1;
                  const isSingle = leaderChildren.length === 1;
                  return (
                    <div
                      key={child.employee.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                    >
                      {!isSingle && (
                        <>
                          {/* Barra horizontal izquierda/derecha */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '-18px',
                              left: isFirst ? '50%' : '-9px',
                              right: isLast ? '50%' : '-9px',
                              height: '2px',
                              backgroundColor: 'var(--border)'
                            }}
                          />
                          {/* Conector vertical hacia esta tarjeta */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '-18px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '2px',
                              height: '18px',
                              backgroundColor: 'var(--border)'
                            }}
                          />
                        </>
                      )}
                      {renderBranch(child)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Equipo operativo directo bajo esta gerencia (lista en columnas compactas) */}
            {operationalMembers.length > 0 && (
              <div
                style={{
                  marginTop: leaderChildren.length > 0 ? '14px' : '0',
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxWidth: operationalMembers.length > 4 ? '520px' : '268px'
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2px'
                  }}
                >
                  <span>Equipo directo ({operationalMembers.length})</span>
                  <span>{getDepartmentCode(node.employee.department, node.employee.location)}</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      operationalMembers.length > 4 ? 'repeat(2, minmax(220px, 1fr))' : '1fr',
                    gap: '8px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    paddingRight: '2px'
                  }}
                >
                  {operationalMembers.map((member) => (
                    <div key={member.employee.id}>
                      {renderNodeCard(member, 'member')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Barra de controles del Organigrama */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <GitBranch className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Organigrama Corporativo SIFYGSA
            </span>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 9px',
              borderRadius: '999px',
              backgroundColor: 'var(--brand-50)',
              color: 'var(--primary)',
              border: '1px solid var(--brand-200)'
            }}
          >
            {activeEmployees.length} colaboradores conectados
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Buscador en árbol */}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ubicar colaborador..."
              style={{
                paddingLeft: '28px',
                height: '32px',
                fontSize: '12px',
                width: '180px'
              }}
            />
          </div>

          {/* Filtro por área */}
          <select
            className="input-text"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ height: '32px', fontSize: '12px', padding: '0 10px', maxWidth: '190px' }}
          >
            <option value="todos">Todas las áreas</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {getDepartmentCode(dept)} — {dept}
              </option>
            ))}
          </select>

          {/* Presets de expansión */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={handleSetLeadershipPreset}
              style={{
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                color: 'var(--primary)',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--shadow-xs)',
                cursor: 'pointer'
              }}
              title="Mostrar Dirección y Gerencias"
            >
              Líderes
            </button>
            <button
              type="button"
              onClick={handleExpandAll}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Expandir todo el árbol"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Todo</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseToRoot}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Colapsar ramas"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Controles de Zoom */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '2px 4px',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
              style={{ padding: '4px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                minWidth: '38px',
                textAlign: 'center'
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              style={{ padding: '4px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1 && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                style={{ padding: '4px', color: 'var(--primary)', cursor: 'pointer' }}
                title="Restablecer zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lienzo del árbol con fondo de cuadrícula punteada sutil */}
      <div
        style={{
          overflow: 'auto',
          padding: '28px 24px 36px 24px',
          minHeight: '520px',
          maxHeight: '72vh',
          backgroundColor: 'var(--app-bg)',
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            minWidth: '100%',
            justifyContent: 'center',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
        >
          {renderBranch(rootNode)}
        </div>
      </div>

      {/* Pie informativo discreto */}
      <div
        style={{
          padding: '9px 18px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11.5px',
          color: 'var(--text-muted)'
        }}
      >
        <span>
          Haz clic en cualquier persona para abrir su ficha o subir su foto · Usa <strong>en rama ▾</strong> para expandir equipos.
        </span>
        {matchedIds.size > 0 && (
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
            {matchedIds.size} coincidencia{matchedIds.size === 1 ? '' : 's'} resaltada{matchedIds.size === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
};
