'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  GitBranch,
  Focus,
  Crosshair,
  Hand,
  ListTree,
  Network,
  X,
  Building2,
  ArrowLeft,
  Layers,
  UserCheck
} from 'lucide-react';
import { Employee } from '../../types';
import {
  getDepartmentCode,
  getDepartmentTheme,
  matchesNormalizedSearch,
  normalizeLocationLabel
} from '../../utils/formShield';
import { TeamsOrgPanel } from './TeamsOrgPanel';

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

type LayoutMode = 'tree' | 'teams' | 'outline';

interface HierarchyTierMeta {
  level: number; // 1 = Dirección General ... 7 = Operativo / Staff
  code: string;
  shortLabel: string;
  groupTitle: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
}

const HIERARCHY_TIERS: Record<number, HierarchyTierMeta> = {
  1: {
    level: 1,
    code: 'N1',
    shortLabel: 'Dirección General',
    groupTitle: 'Dirección General',
    badgeBg: '#0F172A',
    badgeColor: '#FFFFFF',
    badgeBorder: '#0F172A'
  },
  2: {
    level: 2,
    code: 'N2',
    shortLabel: 'Dirección',
    groupTitle: 'Dirección de Área',
    badgeBg: '#1D4ED8',
    badgeColor: '#FFFFFF',
    badgeBorder: '#1D4ED8'
  },
  3: {
    level: 3,
    code: 'N3',
    shortLabel: 'Gerencia',
    groupTitle: 'Gerencias',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8',
    badgeBorder: '#BFDBFE'
  },
  4: {
    level: 4,
    code: 'N4',
    shortLabel: 'Subgerencia',
    groupTitle: 'Subgerencia',
    badgeBg: '#EEF2FF',
    badgeColor: '#3730A3',
    badgeBorder: '#C7D2FE'
  },
  5: {
    level: 5,
    code: 'N5',
    shortLabel: 'Supervisión / Líder',
    groupTitle: 'Liderazgo, Coordinación y Supervisión',
    badgeBg: '#F0FDFA',
    badgeColor: '#0F766E',
    badgeBorder: '#99F6E4'
  },
  6: {
    level: 6,
    code: 'N6',
    shortLabel: 'Especialista / Ing.',
    groupTitle: 'Ingeniería, Especialistas y Analistas',
    badgeBg: '#F8FAFC',
    badgeColor: '#334155',
    badgeBorder: '#CBD5E1'
  },
  7: {
    level: 7,
    code: 'N7',
    shortLabel: 'Operativo / Staff',
    groupTitle: 'Técnicos, Auxiliares y Soporte Operativo',
    badgeBg: '#F8FAFC',
    badgeColor: '#64748B',
    badgeBorder: '#E2E8F0'
  }
};

const normalizeKey = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ing|lic|mtra|mtro|dr|dra|arq|cp|tec)\.?\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Nivel jerárquico corporativo (1 = más alto, 7 = operativo/staff) */
const getRawHierarchyLevel = (position?: string): number => {
  const low = normalizeKey(position);
  if (!low) return 7;
  if (low.includes('director general')) return 1;
  if (/\bdirector(a)?\b/.test(low)) return 2;
  if (/\bsub[-\s]?gerente\b/.test(low)) return 4;
  if (/\bgerente\b/.test(low)) return 3;
  if (/\b(jefe|coordinador(a)?|coordonador(a)?|lider|supervisor(a)?|encargado(a)?)\b/.test(low)) {
    return 5;
  }
  if (
    /\b(ingeniero|especialista|generalista|analista|nominista|comprador(a)?|compradr|estimacionista|cadista|signatario|electrico sr|tecnico especialista)\b/.test(
      low
    )
  ) {
    return 6;
  }
  return 7;
};

/** Evita que un colaborador subordinado muestre mayor/igual jerarquía que su propio jefe */
const getEffectiveHierarchyLevel = (position?: string, depth = 0, parentLevel = 0): number => {
  const raw = getRawHierarchyLevel(position);
  if (depth === 0) return 1;
  if (parentLevel > 0 && raw <= parentLevel) {
    return Math.min(6, Math.max(parentLevel + 1, 5));
  }
  return raw;
};

/** Orden interno por seniority (Sr > Ss > Base > Jr > Trainee) */
const getSeniorityWeight = (position?: string): number => {
  const low = normalizeKey(position);
  if (/\b(sr|senior)\b/.test(low)) return 1;
  if (/\b(ss|s\.s|semi[-\s]?senior)\b/.test(low)) return 2;
  if (/\b(trainee|training|becario|practicante)\b/.test(low)) return 5;
  if (/\b(jr|junior)\b/.test(low)) return 4;
  return 3;
};

/** Filtra registros corruptos o incompletos sin nombre real */
const isValidOrgEmployee = (emp: Employee): boolean => {
  const name = (emp.name || '').trim();
  if (name.length < 4) return false;
  if (!name.includes(' ') && emp.department === 'Por asignar') return false;
  if (/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.'-]/.test(name)) return false;
  return true;
};

/** Etiqueta corta y clara para cada departamento/gerencia en el selector superior */
const getBranchPillLabel = (emp: Employee): string => {
  const posLow = normalizeKey(emp.position);
  const locLow = normalizeKey(emp.location);
  const dept = (emp.department || '').trim();

  if (dept === 'Medición y Control de Proyectos' || posLow.includes('mycp')) return 'MYCP';
  if (dept === 'GSAPE' || posLow.includes('soporte a proyectos')) return 'GSAPE';
  if (dept === 'HSE' || posLow.includes('hse') || posLow.includes('qhse')) {
    if (posLow.includes('comalcalco') || locLow.includes('comalcalco')) {
      return 'HSE Comalcalco';
    }
    return 'QHSE Minatitlán';
  }
  if (dept === 'Recursos Humanos') return 'Recursos Humanos';
  if (dept === 'Administración') return 'Administración';
  return dept || 'Área';
};

const chunkItems = <T,>(items: T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
};

const MIN_ZOOM = 0.28;
const MAX_ZOOM = 1.6;
const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

export const OrgChartView: React.FC<OrgChartViewProps> = ({
  employees,
  onViewEmployee
}) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedRootId, setFocusedRootId] = useState<string | null>(null);
  const [teamsSelectedId, setTeamsSelectedId] = useState<string | null>(null);
  const [customExpandedIds, setCustomExpandedIds] = useState<Set<string> | null>(null);
  const [activePreset, setActivePreset] = useState<'executive' | 'managers' | 'all' | 'custom'>('executive');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wheelMode, setWheelMode] = useState<'pan' | 'zoom'>('pan');

  // Estado interactivo del lienzo (Pan + Zoom sincronizados con refs para 60fps sin saltos)
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 0, y: 24 });
  const zoomRef = useRef(0.82);
  const panRef = useRef({ x: 0, y: 24 });
  const [isSmoothTransition, setIsSmoothTransition] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const suppressNextClickRef = useRef(false);
  const dragOriginRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    hasDragged: boolean;
  } | null>(null);

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (e) => (e.employmentStatus || 'Activo') === 'Activo' && isValidOrgEmployee(e)
      ),
    [employees]
  );

  // Construcción ordenada del árbol jerárquico real
  const { rootNode, nodeMap, parentMap, levelMap } = useMemo(() => {
    if (activeEmployees.length === 0) {
      return {
        rootNode: null as OrgNode | null,
        nodeMap: new Map<string, OrgNode>(),
        parentMap: new Map<string, string>(),
        levelMap: new Map<string, number>()
      };
    }

    const rootEmp =
      activeEmployees.find((e) => normalizeKey(e.position).includes('director general')) ||
      activeEmployees.find((e) => e.id === 'SFG-0001') ||
      activeEmployees[0];

    const byNormName = new Map<string, Employee>();
    const deptLeadByDept = new Map<string, Employee>();

    activeEmployees.forEach((emp) => {
      byNormName.set(normalizeKey(emp.name), emp);
    });

    activeEmployees.forEach((emp) => {
      if (emp.id === rootEmp.id) return;
      const deptKey = normalizeKey(emp.department);
      if (!deptKey || deptKey === 'por asignar') return;
      const existing = deptLeadByDept.get(deptKey);
      if (
        !existing ||
        getRawHierarchyLevel(emp.position) < getRawHierarchyLevel(existing.position)
      ) {
        deptLeadByDept.set(deptKey, emp);
      }
    });

    const findSupervisorEmployee = (emp: Employee): Employee | null => {
      if (emp.id === rootEmp.id) return null;
      const supNorm = normalizeKey(emp.supervisor);
      if (supNorm) {
        const exact = byNormName.get(supNorm);
        if (exact && exact.id !== emp.id) return exact;

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

      const deptLead = deptLeadByDept.get(normalizeKey(emp.department));
      if (deptLead && deptLead.id !== emp.id) return deptLead;
      return rootEmp;
    };

    const childrenById = new Map<string, Employee[]>();
    const pMap = new Map<string, string>();

    activeEmployees.forEach((emp) => {
      if (emp.id === rootEmp.id) return;
      const sup = findSupervisorEmployee(emp) || rootEmp;
      if (sup.id === emp.id) return;
      pMap.set(emp.id, sup.id);
      const list = childrenById.get(sup.id) || [];
      list.push(emp);
      childrenById.set(sup.id, list);
    });

    const nMap = new Map<string, OrgNode>();
    const lMap = new Map<string, number>();
    const visited = new Set<string>();

    const buildNode = (emp: Employee, depth: number, parentLevel: number): OrgNode => {
      visited.add(emp.id);
      const effLevel = getEffectiveHierarchyLevel(emp.position, depth, parentLevel);
      lMap.set(emp.id, effLevel);

      const rawChildren = (childrenById.get(emp.id) || []).filter((c) => !visited.has(c.id));
      const childNodes = rawChildren.map((child) => buildNode(child, depth + 1, effLevel));

      // Orden corporativo estricto:
      // 1) Nivel jerárquico efectivo (N1 -> N7)
      // 2) Mayor estructura a cargo (en empate directivo/gerencial)
      // 3) Seniority (Sr -> Ss -> Base -> Jr -> Trainee)
      // 4) Orden alfabético
      childNodes.sort((a, b) => {
        const lvlA = lMap.get(a.employee.id) ?? 7;
        const lvlB = lMap.get(b.employee.id) ?? 7;
        if (lvlA !== lvlB) return lvlA - lvlB;
        if (a.totalDescendants !== b.totalDescendants) {
          return b.totalDescendants - a.totalDescendants;
        }
        const senDiff = getSeniorityWeight(a.employee.position) - getSeniorityWeight(b.employee.position);
        if (senDiff !== 0) return senDiff;
        return a.employee.name.localeCompare(b.employee.name, 'es');
      });

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

    const root = buildNode(rootEmp, 0, 0);
    return { rootNode: root, nodeMap: nMap, parentMap: pMap, levelMap: lMap };
  }, [activeEmployees]);

  // Calcula la expansión ejecutiva oficial (VIPSALeaders: Director General + Dirección Comercial -> Gerentes Ventas + Servicios -> Sub-Gerente)
  const buildExecutiveExpandedSet = useCallback(
    (root: OrgNode): Set<string> => {
      const next = new Set<string>([root.employee.id]);
      root.children.forEach((child) => {
        const hasExecutiveChild = child.children.some(
          (grand) => (levelMap.get(grand.employee.id) ?? 7) <= 4
        );
        if (hasExecutiveChild) {
          next.add(child.employee.id);
        }
      });
      return next;
    },
    [levelMap]
  );

  // Expansión ejecutiva por defecto (VIPSALeaders: Director General + Dirección Comercial -> Gerentes + Servicios -> Subgerente)
  const executiveExpandedIds = useMemo(() => {
    if (!rootNode) return new Set<string>();
    return buildExecutiveExpandedSet(rootNode);
  }, [rootNode, buildExecutiveExpandedSet]);

  const expandedIds = customExpandedIds ?? executiveExpandedIds;

  // Lista de gerencias/departamentos oficiales para la barra superior de cambio rápido
  const departmentBranches = useMemo(() => {
    if (!rootNode) return [];
    return rootNode.children
      .filter((child) => {
        const lvl = levelMap.get(child.employee.id) ?? 7;
        return lvl <= 4 || child.children.length > 0;
      })
      .map((child) => {
        const deptCode = getDepartmentCode(child.employee.department, child.employee.location);
        const theme = getDepartmentTheme(deptCode, child.employee.location);
        return {
          id: child.employee.id,
          label: getBranchPillLabel(child.employee),
          headcount: child.totalDescendants + 1,
          managerName: child.employee.name,
          deptCode,
          accent: theme.accent,
          softBg: theme.softBg,
          softBorder: theme.softBorder
        };
      });
  }, [rootNode, levelMap]);

  // Nodo raíz efectivo (General o el departamento/gerencia enfocado)
  const displayRoot = useMemo(() => {
    if (!rootNode) return null;
    if (focusedRootId && nodeMap.has(focusedRootId)) {
      return nodeMap.get(focusedRootId) || rootNode;
    }
    return rootNode;
  }, [rootNode, focusedRootId, nodeMap]);

  const isDepartmentFocused = Boolean(
    focusedRootId && rootNode && focusedRootId !== rootNode.employee.id
  );

  // Resumen jerárquico del departamento enfocado (muestra quién es el superior y cuántos hay por nivel)
  const focusedTierSummary = useMemo(() => {
    if (!displayRoot || !isDepartmentFocused) return [];
    const counts = new Map<number, number>();
    const walk = (node: OrgNode) => {
      const lvl = levelMap.get(node.employee.id) ?? 7;
      counts.set(lvl, (counts.get(lvl) || 0) + 1);
      node.children.forEach(walk);
    };
    walk(displayRoot);
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({
        tier: HIERARCHY_TIERS[level] || HIERARCHY_TIERS[7],
        count
      }));
  }, [displayRoot, isDepartmentFocused, levelMap]);

  // Ruta jerárquica (breadcrumbs) hasta el nodo enfocado
  const focusBreadcrumbs = useMemo(() => {
    if (!displayRoot) return [];
    const trail: Employee[] = [];
    let currId: string | undefined = displayRoot.employee.id;
    let guard = 0;
    while (currId && guard < 12) {
      const node = nodeMap.get(currId);
      if (node) trail.unshift(node.employee);
      currId = parentMap.get(currId);
      guard += 1;
    }
    return trail;
  }, [displayRoot, nodeMap, parentMap]);

  // Coincidencias de búsqueda y expansión automática
  const { matchedIds, autoExpandedIds } = useMemo(() => {
    const q = normalizeKey(searchQuery);
    const matches = new Set<string>();
    const autoExp = new Set<string>();

    if (!q) {
      return { matchedIds: matches, autoExpandedIds: autoExp };
    }

    activeEmployees.forEach((emp) => {
      const normalizedLoc = normalizeLocationLabel(emp.location || emp.codeLocation);
      const textMatch = matchesNormalizedSearch(
        searchQuery,
        emp.name,
        emp.position,
        emp.department,
        emp.id,
        normalizedLoc,
        emp.location,
        getDepartmentCode(emp.department, emp.location)
      );

      if (textMatch) {
        matches.add(emp.id);
        let curr = parentMap.get(emp.id);
        while (curr) {
          autoExp.add(curr);
          curr = parentMap.get(curr);
        }
      }
    });

    return { matchedIds: matches, autoExpandedIds: autoExp };
  }, [searchQuery, activeEmployees, parentMap]);

  // Si el usuario busca a alguien fuera del departamento enfocado, mostrar el árbol general automáticamente
  const effectiveDisplayRoot = useMemo(() => {
    if (!displayRoot) return null;
    if (!searchQuery.trim() || !focusedRootId || matchedIds.size === 0 || !rootNode) {
      return displayRoot;
    }
    const hasMatchInFocus = (node: OrgNode): boolean => {
      if (matchedIds.has(node.employee.id)) return true;
      return node.children.some(hasMatchInFocus);
    };
    return hasMatchInFocus(displayRoot) ? displayRoot : rootNode;
  }, [displayRoot, searchQuery, focusedRootId, matchedIds, rootNode]);

  // Bloqueo de scroll de fondo y tecla Esc en modo pantalla completa ("Ver en grande")
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Evita cerrar pantalla completa si el usuario abrió la ficha del colaborador encima
        const hasHigherModal = Array.from(document.querySelectorAll('div')).some((el) => {
          const z = Number(window.getComputedStyle(el).zIndex);
          return Number.isFinite(z) && z >= 100 && window.getComputedStyle(el).position === 'fixed';
        });
        if (!hasHigherModal) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Actualiza pan/zoom de forma atómica manteniendo las refs sincronizadas
  const applyTransform = useCallback(
    (nextPan: { x: number; y: number }, nextZoom: number, smooth = false) => {
      setIsSmoothTransition(smooth);
      panRef.current = nextPan;
      zoomRef.current = nextZoom;
      setPan(nextPan);
      setZoom(nextZoom);
    },
    []
  );

  // Zoom anclado exactamente al cursor (sin que el árbol se desplace fuera de vista)
  const zoomAtClientPoint = useCallback(
    (clientX: number, clientY: number, nextZoomRaw: number, smooth = false) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const oldZoom = zoomRef.current;
      const nextZoom = clampZoom(nextZoomRaw);
      if (nextZoom === oldZoom) return;

      const currPan = panRef.current;
      const worldX = (mx - currPan.x) / oldZoom;
      const worldY = (my - currPan.y) / oldZoom;
      const nextPan = {
        x: Math.round(mx - worldX * nextZoom),
        y: Math.round(my - worldY * nextZoom)
      };

      applyTransform(nextPan, nextZoom, smooth);
    },
    [applyTransform]
  );

  // Zoom anclado al centro del lienzo para los botones + / -
  const zoomByStepCentered = useCallback(
    (delta: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      zoomAtClientPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        zoomRef.current + delta,
        true
      );
    },
    [zoomAtClientPoint]
  );

  // Ajustar el árbol completo al tamaño visible del lienzo
  const fitTreeToViewport = useCallback(
    (maxScale = 1) => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;

      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const cw = content.scrollWidth;
      const ch = content.scrollHeight;
      if (!vw || !cw) return;

      const padX = 56;
      const padY = 48;
      const scaleX = (vw - padX) / cw;
      const scaleY = (vh - padY) / Math.max(ch, 1);
      const fitted = clampZoom(Math.min(maxScale, scaleX, Math.max(scaleY, 0.58)));
      const nextX = Math.round((vw - cw * fitted) / 2);

      applyTransform({ x: nextX, y: 20 }, fitted, true);
    },
    [applyTransform]
  );

  // Centrar horizontalmente manteniendo un zoom legible
  const centerAtCurrentZoom = useCallback(
    (targetZoom?: number) => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;
      const z = clampZoom(targetZoom ?? zoomRef.current);
      const vw = viewport.clientWidth;
      const cw = content.scrollWidth;
      const nextX = Math.round((vw - cw * z) / 2);
      applyTransform({ x: nextX, y: 22 }, z, true);
    },
    [applyTransform]
  );

  // Auto-encuadre al cambiar de departamento, preset, vista o pantalla completa
  useEffect(() => {
    if (layoutMode !== 'tree') return;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        fitTreeToViewport(isDepartmentFocused ? 0.98 : 0.94);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [layoutMode, focusedRootId, activePreset, isFullscreen, isDepartmentFocused, fitTreeToViewport]);

  // Rueda del mouse y gestos de trackpad (desplazamiento fluido + zoom al cursor con Ctrl/pinch o modo Zoom)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || layoutMode !== 'tree') return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Normaliza unidades entre drivers (píxeles, líneas o páginas)
      const unitScale = e.deltaMode === 1 ? 28 : e.deltaMode === 2 ? 360 : 1;
      let dx = e.deltaX * unitScale;
      let dy = e.deltaY * unitScale;

      const shouldZoom = e.ctrlKey || e.metaKey || wheelMode === 'zoom';
      if (shouldZoom) {
        const isFinePinch = (e.ctrlKey || e.metaKey) && Math.abs(dy) < 25;
        const sensitivity = isFinePinch ? 0.006 : 0.0016;
        const clampedDy = Math.max(-120, Math.min(120, dy));
        const zoomFactor = Math.exp(-clampedDy * sensitivity);
        zoomAtClientPoint(e.clientX, e.clientY, zoomRef.current * zoomFactor, false);
        return;
      }

      // Shift + rueda desplaza horizontalmente en mouse convencional
      if (e.shiftKey && Math.abs(dx) < 1) {
        dx = dy;
        dy = 0;
      }

      const nextPan = {
        x: Math.round(panRef.current.x - dx),
        y: Math.round(panRef.current.y - dy)
      };
      applyTransform(nextPan, zoomRef.current, false);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [layoutMode, isFullscreen, wheelMode, zoomAtClientPoint, applyTransform]);

  // Arrastre fluido en cualquier parte del lienzo (incluso iniciando sobre una tarjeta, con botón izquierdo o rueda)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, a, [data-org-controls="true"]')) return;

    // Evita el icono de autoscroll del navegador al arrastrar con la rueda del mouse
    if (e.button === 1) {
      e.preventDefault();
    }

    dragOriginRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      hasDragged: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const origin = dragOriginRef.current;
    if (!origin || origin.pointerId !== e.pointerId) return;

    const dx = e.clientX - origin.startX;
    const dy = e.clientY - origin.startY;

    if (!origin.hasDragged) {
      if (Math.hypot(dx, dy) < 5) return;
      origin.hasDragged = true;
      suppressNextClickRef.current = true;
      setIsDragging(true);
      setIsSmoothTransition(false);
      window.getSelection()?.removeAllRanges();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignora si el navegador no soporta captura para este evento sintético
      }
    }

    const nextPan = {
      x: Math.round(origin.panX + dx),
      y: Math.round(origin.panY + dy)
    };
    panRef.current = nextPan;
    setPan(nextPan);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const origin = dragOriginRef.current;
    if (!origin || origin.pointerId !== e.pointerId) return;

    const didDrag = origin.hasDragged;
    dragOriginRef.current = null;

    if (didDrag) {
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 80);
    }
  };

  const handleViewportClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressNextClickRef.current = false;
    }
  };

  const isExpanded = (id: string): boolean => {
    if (autoExpandedIds.size > 0 && autoExpandedIds.has(id)) return true;
    return expandedIds.has(id);
  };

  const toggleExpand = (id: string) => {
    setActivePreset('custom');
    setCustomExpandedIds((prev) => {
      const next = new Set(prev ?? executiveExpandedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Enfocar un departamento / gerente y desplegar automáticamente toda su jerarquía interna
  const handleSelectDepartmentBranch = (branchRootId: string | null) => {
    if (!rootNode) return;
    if (!branchRootId || branchRootId === rootNode.employee.id) {
      setFocusedRootId(null);
      setTeamsSelectedId(rootNode.employee.id);
      setCustomExpandedIds(buildExecutiveExpandedSet(rootNode));
      setActivePreset('executive');
      return;
    }

    const branchNode = nodeMap.get(branchRootId);
    if (!branchNode) return;

    const allInBranch = new Set<string>([branchRootId]);
    const collectBranchParents = (node: OrgNode) => {
      if (node.children.length > 0) allInBranch.add(node.employee.id);
      node.children.forEach(collectBranchParents);
    };
    collectBranchParents(branchNode);

    setFocusedRootId(branchRootId);
    setTeamsSelectedId(branchRootId);
    setCustomExpandedIds(allInBranch);
    setActivePreset('all');
  };

  // Abrir cualquier colaborador en la vista empresarial estilo Teams (cadena superior + equipo)
  const handleOpenInTeams = (employeeId: string) => {
    setTeamsSelectedId(employeeId);
    setLayoutMode('teams');
  };

  // Volver desde Teams a la vista de Árbol enfocada en el titular correspondiente
  const handleOpenInTreeFromTeams = (employeeId: string) => {
    if (!rootNode) return;
    const node = nodeMap.get(employeeId);
    if (node && node.children.length > 0) {
      handleSelectDepartmentBranch(employeeId);
    } else {
      const bossId = parentMap.get(employeeId);
      handleSelectDepartmentBranch(bossId || rootNode.employee.id);
    }
    setLayoutMode('tree');
  };

  const handleSetExecutivePreset = () => {
    if (!rootNode) return;
    setFocusedRootId(null);
    setCustomExpandedIds(buildExecutiveExpandedSet(rootNode));
    setActivePreset('executive');
  };

  const handleCollapseToManagers = () => {
    if (!effectiveDisplayRoot) return;
    setCustomExpandedIds(new Set([effectiveDisplayRoot.employee.id]));
    setActivePreset('managers');
  };

  const handleExpandAllCurrent = () => {
    if (!effectiveDisplayRoot) return;
    const allParents = new Set<string>();
    const collect = (node: OrgNode) => {
      if (node.children.length > 0) allParents.add(node.employee.id);
      node.children.forEach(collect);
    };
    collect(effectiveDisplayRoot);
    setCustomExpandedIds(allParents);
    setActivePreset('all');
  };

  if (!rootNode || !displayRoot || !effectiveDisplayRoot) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Sin colaboradores activos para construir el organigrama.
      </div>
    );
  }

  const shouldShowBranch = (node: OrgNode): boolean => {
    if (!searchQuery.trim()) return true;
    const selfTextOk = matchesNormalizedSearch(
      searchQuery,
      node.employee.name,
      node.employee.position,
      node.employee.department,
      node.employee.id,
      normalizeLocationLabel(node.employee.location || node.employee.codeLocation),
      node.employee.location,
      getDepartmentCode(node.employee.department, node.employee.location)
    );
    if (selfTextOk) return true;
    return node.children.some((child) => shouldShowBranch(child));
  };

  // =========================================================================
  // TARJETA EJECUTIVA DE NODO (CON NIVEL JERÁRQUICO CLARAMENTE VISIBLE)
  // =========================================================================
  const renderNodeCard = (node: OrgNode, variant: 'root' | 'leader' | 'member') => {
    const { employee, children, totalDescendants } = node;
    const deptCode = getDepartmentCode(employee.department, employee.location);
    const deptTheme = getDepartmentTheme(deptCode, employee.location);
    const level = levelMap.get(employee.id) ?? 7;
    const tierMeta = HIERARCHY_TIERS[level] || HIERARCHY_TIERS[7];
    const expanded = isExpanded(employee.id);
    const isHighlighted = matchedIds.has(employee.id);
    const isRoot = variant === 'root';
    const isMember = variant === 'member';
    const canFocus = !isRoot && children.length > 0;

    return (
      <div
        style={{
          width: isRoot ? '316px' : isMember ? '234px' : '256px',
          backgroundColor: 'var(--surface)',
          borderRadius: isRoot ? '14px' : '12px',
          border: isHighlighted
            ? '2px solid var(--primary)'
            : isRoot
            ? `1.5px solid ${deptTheme.accent}`
            : '1px solid var(--border)',
          boxShadow: isHighlighted
            ? '0 0 0 4px rgba(29, 78, 216, 0.16), var(--shadow-md)'
            : isRoot
            ? '0 10px 26px -8px rgba(15, 23, 42, 0.18)'
            : '0 2px 8px -2px rgba(15, 23, 42, 0.07)',
          overflow: 'hidden',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {/* Franja superior corporativa del área */}
        <div
          style={{
            height: isRoot ? '4px' : isMember ? '2.5px' : '3.5px',
            backgroundColor: deptTheme.accent
          }}
        />

        {/* Cabecera de jerarquía y código */}
        <div
          style={{
            padding: isRoot ? '7px 12px 0' : '6px 10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '9.5px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: tierMeta.badgeBg,
              color: tierMeta.badgeColor,
              border: `1px solid ${tierMeta.badgeBorder}`,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tierMeta.code}</span>
            <span style={{ opacity: 0.7 }}>·</span>
            <span>{tierMeta.shortLabel}</span>
          </span>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: deptTheme.softBg,
                color: deptTheme.accent,
                border: `1px solid ${deptTheme.softBorder}`
              }}
            >
              {deptCode}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9.5px',
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}
            >
              {employee.id}
            </span>
          </div>
        </div>

        {/* Cuerpo clicable para abrir ficha */}
        <div
          onClick={() => onViewEmployee(employee)}
          style={{
            padding: isRoot ? '10px 12px 12px' : isMember ? '8px 10px 10px' : '9px 11px 10px',
            cursor: isDragging ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: isRoot ? '12px' : '10px'
          }}
          title="Abrir ficha del colaborador"
        >
          <div style={{ position: 'relative', flexShrink: 0, marginTop: '1px' }}>
            <div
              style={{
                width: isRoot ? '50px' : isMember ? '36px' : '44px',
                height: isRoot ? '50px' : isMember ? '36px' : '44px',
                borderRadius: isRoot ? '12px' : '10px',
                overflow: 'hidden',
                backgroundColor: employee.avatarBg || deptTheme.accent,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isRoot ? '16px' : isMember ? '12px' : '14px',
                fontWeight: 800,
                border: `1.5px solid ${deptTheme.softBorder}`
              }}
            >
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={employee.name}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />
              ) : (
                employee.initials
              )}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: isRoot ? '11px' : '9px',
                height: isRoot ? '11px' : '9px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                border: '2px solid var(--surface)'
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: isRoot ? '13.5px' : isMember ? '11.5px' : '12.5px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
              title={employee.name}
            >
              {employee.name}
            </div>

            <div
              style={{
                fontSize: isRoot ? '11.5px' : '10.5px',
                fontWeight: 600,
                color: isRoot ? 'var(--primary)' : 'var(--text-secondary)',
                marginTop: '2px',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
              title={employee.position}
            >
              {employee.position}
            </div>

            {employee.location && (
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
                  {employee.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de tarjeta para líderes con equipo a cargo */}
        {children.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-alt)',
              padding: '5px 9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => toggleExpand(employee.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: expanded ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: '6px',
                background: 'none',
                border: 'none'
              }}
              title={expanded ? 'Ocultar equipo ramificado' : 'Desplegar equipo ramificado'}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Users className="w-3 h-3" />
              <span>
                {totalDescendants} {totalDescendants === 1 ? 'persona' : 'personas'}
              </span>
            </button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {canFocus && (
                <button
                  type="button"
                  onClick={() => handleSelectDepartmentBranch(employee.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    backgroundColor: 'var(--brand-50)',
                    border: '1px solid var(--brand-200)',
                    borderRadius: '6px',
                    padding: '2px 7px',
                    cursor: 'pointer'
                  }}
                  title="Ver el organigrama exclusivo de esta área"
                >
                  <Focus className="w-3 h-3" />
                  <span>Ver área</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenInTeams(employee.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  cursor: 'pointer'
                }}
                title="Ver cadena de mando estilo Teams"
              >
                <UserCheck className="w-3 h-3" />
                <span>Teams</span>
              </button>

              <button
                type="button"
                onClick={() => onViewEmployee(employee)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  cursor: 'pointer'
                }}
                title="Abrir ficha del colaborador"
              >
                <Eye className="w-3 h-3" />
                <span>Ficha</span>
              </button>
            </div>
          </div>
        )}

        {/* Pie compacto en tarjetas individuales para saltar a vista Teams o Ficha */}
        {children.length === 0 && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-alt)',
              padding: '4px 9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => handleOpenInTeams(employee.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                padding: '2px 4px',
                cursor: 'pointer'
              }}
              title="Ver quién está arriba y equipo en vista Teams"
            >
              <UserCheck className="w-3 h-3" />
              <span>Cadena</span>
            </button>

            <button
              type="button"
              onClick={() => onViewEmployee(employee)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                padding: '2px 4px',
                cursor: 'pointer'
              }}
              title="Abrir ficha del colaborador"
            >
              <Eye className="w-3 h-3" />
              <span>Ficha</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // RAMIFICACIÓN REAL DE COLABORADORES BAJO CADA GERENTE (SIN CAJA CON SCROLL)
  // =========================================================================
  const renderHorizontalConnectedRow = (members: OrgNode[]) => {
    const isSingle = members.length === 1;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '14px',
          position: 'relative',
          paddingTop: isSingle ? '0' : '16px'
        }}
      >
        {members.map((member, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === members.length - 1;
          return (
            <div
              key={member.employee.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {!isSingle && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      left: isFirst ? '50%' : '-7px',
                      right: isLast ? '50%' : '-7px',
                      height: '2px',
                      backgroundColor: 'var(--border)'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '2px',
                      height: '16px',
                      backgroundColor: 'var(--border)'
                    }}
                  />
                </>
              )}
              {renderNodeCard(member, 'member')}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTieredTeamBranches = (
    parentNode: OrgNode,
    leafMembers: OrgNode[],
    compactInline: boolean,
    connectedToParentTop: boolean
  ) => {
    if (leafMembers.length === 0) return null;

    // Agrupa el equipo del gerente por nivel jerárquico (N5 -> N6 -> N7)
    const groupedMap = new Map<number, OrgNode[]>();
    leafMembers.forEach((member) => {
      const lvl = levelMap.get(member.employee.id) ?? 7;
      const list = groupedMap.get(lvl) || [];
      list.push(member);
      groupedMap.set(lvl, list);
    });

    const tierGroups = Array.from(groupedMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, members]) => ({
        level,
        meta: HIERARCHY_TIERS[level] || HIERARCHY_TIERS[7],
        members
      }));

    const maxPerRow = compactInline ? 3 : 5;

    // Caso 1: Un solo nivel y pocos colaboradores -> ramificación horizontal clásica directa
    if (tierGroups.length === 1 && tierGroups[0].members.length <= maxPerRow) {
      const onlyGroup = tierGroups[0];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 9px',
              borderRadius: '999px',
              backgroundColor: onlyGroup.meta.badgeBg,
              color: onlyGroup.meta.badgeColor,
              border: `1px solid ${onlyGroup.meta.badgeBorder}`,
              marginBottom: '2px'
            }}
          >
            {onlyGroup.meta.code} · {onlyGroup.meta.groupTitle} ({onlyGroup.members.length})
          </div>
          <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--border)' }} />
          {renderHorizontalConnectedRow(onlyGroup.members)}
        </div>
      );
    }

    // Caso 2: Múltiples niveles jerárquicos o equipo numeroso -> troncal directa del gerente
    // hacia cada banda de nivel (cada nivel cuelga de la línea del gerente, nunca de un par)
    const deptCode = getDepartmentCode(parentNode.employee.department, parentNode.employee.location);
    const deptTheme = getDepartmentTheme(deptCode, parentNode.employee.location);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          position: 'relative',
          paddingLeft: '26px',
          paddingTop: connectedToParentTop ? '14px' : '4px',
          gap: '16px'
        }}
      >
        {!connectedToParentTop && (
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '-4px'
            }}
          >
            Equipo directo de {parentNode.employee.name} ({leafMembers.length})
          </div>
        )}

        {/* Troncal vertical izquierda conectada directamente al gerente */}
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: connectedToParentTop ? '0' : '24px',
            bottom: '22px',
            width: '2px',
            backgroundColor: deptTheme.softBorder
          }}
        />
        {/* Brazo superior que une el centro del gerente con la troncal izquierda */}
        {connectedToParentTop && (
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '0',
              right: '50%',
              height: '2px',
              backgroundColor: deptTheme.softBorder
            }}
          />
        )}

        {tierGroups.map((group) => {
          const rows = chunkItems(group.members, maxPerRow);
          return (
            <div
              key={`${parentNode.employee.id}-tier-${group.level}`}
              style={{
                position: 'relative',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '12px 14px 14px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {/* Conector horizontal desde la troncal del gerente hacia este nivel */}
              <div
                style={{
                  position: 'absolute',
                  left: '-16px',
                  top: '20px',
                  width: '16px',
                  height: '2px',
                  backgroundColor: deptTheme.softBorder
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '-19px',
                  top: '17px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: deptTheme.accent,
                  border: '2px solid var(--app-bg)'
                }}
              />

              {/* Encabezado del nivel jerárquico */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: group.meta.badgeBg,
                      color: group.meta.badgeColor,
                      border: `1px solid ${group.meta.badgeBorder}`
                    }}
                  >
                    {group.meta.code}
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {group.meta.groupTitle}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    padding: '1px 8px',
                    borderRadius: '999px'
                  }}
                >
                  {group.members.length} {group.members.length === 1 ? 'colaborador' : 'colaboradores'}
                </span>
              </div>

              {/* Filas de tarjetas ramificadas (ordenadas por seniority Sr -> Ss -> Jr -> Trainee) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                {rows.map((rowMembers, rowIdx) => (
                  <div
                    key={`${parentNode.employee.id}-tier-${group.level}-row-${rowIdx}`}
                    style={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      gap: '12px',
                      alignItems: 'stretch'
                    }}
                  >
                    {rowMembers.map((member) => (
                      <div key={member.employee.id}>{renderNodeCard(member, 'member')}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // RENDERIZADO RECURSIVO EN ÁRBOL VISUAL
  // =========================================================================
  const renderBranch = (node: OrgNode, isTopDisplayRoot = false): React.ReactNode => {
    const visibleChildren = node.children.filter((c) => shouldShowBranch(c));
    const expanded = isExpanded(node.employee.id);

    // Sub-ramas: quienes tienen equipo propio O tienen nivel gerencial/directivo (N1..N4)
    const subBranches = visibleChildren.filter(
      (c) => c.children.length > 0 || (levelMap.get(c.employee.id) ?? 7) <= 4
    );
    const directLeafMembers = visibleChildren.filter(
      (c) => c.children.length === 0 && (levelMap.get(c.employee.id) ?? 7) > 4
    );

    const compactInline = !isDepartmentFocused && !isTopDisplayRoot;

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
        {renderNodeCard(node, isTopDisplayRoot ? 'root' : 'leader')}

        {expanded && visibleChildren.length > 0 && (
          <>
            <div style={{ width: '2px', height: '22px', backgroundColor: 'var(--border)' }} />

            {/* Sub-ramas directivas/gerenciales o líderes con equipo propio */}
            {subBranches.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: '16px',
                  position: 'relative',
                  paddingTop: subBranches.length > 1 ? '18px' : '0'
                }}
              >
                {subBranches.map((child, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === subBranches.length - 1;
                  const isSingle = subBranches.length === 1;
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
                          <div
                            style={{
                              position: 'absolute',
                              top: '-18px',
                              left: isFirst ? '50%' : '-8px',
                              right: isLast ? '50%' : '-8px',
                              height: '2px',
                              backgroundColor: 'var(--border)'
                            }}
                          />
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
                      {renderBranch(child, false)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Equipo directo ramificado por nivel jerárquico (N5 -> N6 -> N7) */}
            {directLeafMembers.length > 0 && (
              <div
                style={{
                  marginTop: subBranches.length > 0 ? '20px' : '0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {renderTieredTeamBranches(
                  node,
                  directLeafMembers,
                  compactInline,
                  subBranches.length === 0
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // =========================================================================
  // VISTA ALTERNA: LISTA JERÁRQUICA VERTICAL (CON NIVELES N1..N7)
  // =========================================================================
  const renderOutlineNode = (node: OrgNode, level = 0): React.ReactNode => {
    if (!shouldShowBranch(node)) return null;
    const { employee, children, totalDescendants } = node;
    const visibleChildren = children.filter((c) => shouldShowBranch(c));
    const expanded = isExpanded(employee.id);
    const deptCode = getDepartmentCode(employee.department, employee.location);
    const deptTheme = getDepartmentTheme(deptCode, employee.location);
    const effLevel = levelMap.get(employee.id) ?? 7;
    const tierMeta = HIERARCHY_TIERS[effLevel] || HIERARCHY_TIERS[7];
    const isHighlighted = matchedIds.has(employee.id);

    return (
      <div key={employee.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '8px 14px',
            paddingLeft: `${14 + level * 26}px`,
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: isHighlighted
              ? 'var(--brand-50)'
              : level === 0
              ? 'var(--surface-alt)'
              : 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            {visibleChildren.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleExpand(employee.id)}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: expanded ? 'var(--primary)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span style={{ width: '22px', display: 'inline-block', textAlign: 'center', color: 'var(--border)' }}>•</span>
            )}

            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: employee.avatarBg || deptTheme.accent,
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                employee.initials
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: tierMeta.badgeBg,
                    color: tierMeta.badgeColor,
                    border: `1px solid ${tierMeta.badgeBorder}`
                  }}
                >
                  {tierMeta.code} · {tierMeta.shortLabel}
                </span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {employee.name}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: deptTheme.softBg,
                    color: deptTheme.accent,
                    border: `1px solid ${deptTheme.softBorder}`
                  }}
                >
                  {deptCode}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  {employee.id}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {employee.position}
                {employee.location ? ` · ${employee.location}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {totalDescendants > 0 && (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                {totalDescendants} a cargo
              </span>
            )}
            {children.length > 0 && node.employee.id !== displayRoot.employee.id && (
              <button
                type="button"
                onClick={() => handleSelectDepartmentBranch(employee.id)}
                className="rrhh-dept-action-btn"
                style={{ padding: '3px 9px', fontSize: '11px', color: 'var(--primary)' }}
              >
                <Focus className="w-3 h-3" />
                <span>Ver área</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleOpenInTeams(employee.id)}
              className="rrhh-dept-action-btn"
              style={{ padding: '3px 9px', fontSize: '11px' }}
              title="Ver cadena de mando estilo Teams"
            >
              <UserCheck className="w-3 h-3" />
              <span>Teams</span>
            </button>
            <button
              type="button"
              onClick={() => onViewEmployee(employee)}
              className="rrhh-dept-action-btn"
              style={{ padding: '3px 9px', fontSize: '11px' }}
            >
              <Eye className="w-3 h-3" />
              <span>Ficha</span>
            </button>
          </div>
        </div>

        {expanded && visibleChildren.map((child) => renderOutlineNode(child, level + 1))}
      </div>
    );
  };

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        inset: '12px',
        zIndex: 80,
        height: 'calc(100vh - 24px)',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.38)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)'
      }
    : {
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      };

  return (
    <>
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 79,
            backgroundColor: 'rgba(15, 23, 42, 0.52)',
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      <div className="card" style={containerStyle}>
        {/* 1. Barra principal de herramientas */}
        <div
          style={{
            padding: '11px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <GitBranch className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isDepartmentFocused
                ? `Organigrama · ${getBranchPillLabel(displayRoot.employee)}`
                : 'Organigrama Corporativo'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                border: '1px solid var(--brand-200)'
              }}
            >
              {isDepartmentFocused
                ? `${displayRoot.totalDescendants + 1} integrantes`
                : `${activeEmployees.length} activos`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Buscador global */}
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
                placeholder="Ubicar persona o puesto..."
                style={{
                  paddingLeft: '28px',
                  paddingRight: searchQuery ? '24px' : '10px',
                  height: '32px',
                  fontSize: '12px',
                  width: '195px'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
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
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Presets de profundidad (solo en vista Árbol y Lista) */}
            {layoutMode !== 'teams' && (
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
                  onClick={handleSetExecutivePreset}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: activePreset === 'executive' && !isDepartmentFocused ? 700 : 600,
                    borderRadius: '6px',
                    color:
                      activePreset === 'executive' && !isDepartmentFocused
                        ? 'var(--primary)'
                        : 'var(--text-secondary)',
                    backgroundColor:
                      activePreset === 'executive' && !isDepartmentFocused
                        ? 'var(--surface)'
                        : 'transparent',
                    boxShadow:
                      activePreset === 'executive' && !isDepartmentFocused
                        ? 'var(--shadow-xs)'
                        : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Dirección, Gerencias y Subgerencias (VIPSALeaders)"
                >
                  Directivos
                </button>
                <button
                  type="button"
                  onClick={handleCollapseToManagers}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: activePreset === 'managers' ? 700 : 600,
                    borderRadius: '6px',
                    color: activePreset === 'managers' ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: activePreset === 'managers' ? 'var(--surface)' : 'transparent',
                    boxShadow: activePreset === 'managers' ? 'var(--shadow-xs)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Mostrar solo el primer nivel bajo el nodo actual"
                >
                  Compacto
                </button>
                <button
                  type="button"
                  onClick={handleExpandAllCurrent}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: activePreset === 'all' ? 700 : 600,
                    borderRadius: '6px',
                    color: activePreset === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: activePreset === 'all' ? 'var(--surface)' : 'transparent',
                    boxShadow: activePreset === 'all' ? 'var(--shadow-xs)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Desplegar todo el personal ramificado"
                >
                  Todo
                </button>
              </div>
            )}

            {/* Toggle Árbol / Teams / Lista Jerárquica */}
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
                onClick={() => setLayoutMode('tree')}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: layoutMode === 'tree' ? 700 : 600,
                  borderRadius: '6px',
                  color: layoutMode === 'tree' ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: layoutMode === 'tree' ? 'var(--surface)' : 'transparent',
                  boxShadow: layoutMode === 'tree' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Mapa visual en árbol ramificado"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Árbol</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeamsSelectedId((prev) => prev || displayRoot.employee.id);
                  setLayoutMode('teams');
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: layoutMode === 'teams' ? 700 : 600,
                  borderRadius: '6px',
                  color: layoutMode === 'teams' ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: layoutMode === 'teams' ? 'var(--surface)' : 'transparent',
                  boxShadow: layoutMode === 'teams' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Vista empresarial estilo Microsoft Teams (cadena superior, reportes y equipo)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Teams</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('outline')}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: layoutMode === 'outline' ? 700 : 600,
                  borderRadius: '6px',
                  color: layoutMode === 'outline' ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: layoutMode === 'outline' ? 'var(--surface)' : 'transparent',
                  boxShadow: layoutMode === 'outline' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Lista jerárquica expandible"
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Botón Ver en grande (Pantalla completa) */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                height: '32px',
                padding: '0 11px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: isFullscreen ? 'var(--text-primary)' : 'var(--brand-50)',
                color: isFullscreen ? '#FFFFFF' : 'var(--primary)',
                border: isFullscreen ? '1px solid var(--text-primary)' : '1px solid var(--brand-200)'
              }}
              title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Expandir organigrama a pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Salir (Esc)' : 'Ver en grande'}</span>
            </button>
          </div>
        </div>

        {/* 2. Selector rápido de Organigramas por Departamento */}
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            flexShrink: 0
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10.5px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              marginRight: '4px'
            }}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Áreas:</span>
          </span>

          <button
            type="button"
            onClick={() => handleSelectDepartmentBranch(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: !isDepartmentFocused ? 800 : 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backgroundColor: !isDepartmentFocused ? 'var(--primary)' : 'var(--surface)',
              color: !isDepartmentFocused ? '#FFFFFF' : 'var(--text-secondary)',
              border: !isDepartmentFocused ? '1px solid var(--primary)' : '1px solid var(--border)'
            }}
          >
            <span>General · VIPSALeaders</span>
          </button>

          {departmentBranches.map((branch) => {
            const isActive = focusedRootId === branch.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => handleSelectDepartmentBranch(branch.id)}
                title={`Ver organigrama de ${branch.label} · Titular: ${branch.managerName}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  backgroundColor: isActive ? branch.softBg : 'var(--surface)',
                  color: isActive ? branch.accent : 'var(--text-secondary)',
                  border: isActive ? `1.5px solid ${branch.accent}` : '1px solid var(--border)'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: branch.accent,
                    flexShrink: 0
                  }}
                />
                <span>{branch.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    opacity: 0.78
                  }}
                >
                  ({branch.headcount})
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Barra de detalle jerárquico cuando un departamento está enfocado */}
        {isDepartmentFocused && (
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--brand-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '11.5px',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSelectDepartmentBranch(null)}
                className="rrhh-dept-action-btn"
                style={{ padding: '3px 9px', fontSize: '11px', backgroundColor: 'var(--surface)' }}
              >
                <ArrowLeft className="w-3 h-3" />
                <span>General</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {focusBreadcrumbs.map((crumb, idx) => {
                  const isLast = idx === focusBreadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() =>
                          idx === 0
                            ? handleSelectDepartmentBranch(null)
                            : handleSelectDepartmentBranch(crumb.id)
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontWeight: isLast ? 800 : 600,
                          color: isLast ? 'var(--text-primary)' : 'var(--primary)',
                          cursor: isLast ? 'default' : 'pointer',
                          textDecoration: isLast ? 'none' : 'underline'
                        }}
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Desglose de niveles jerárquicos del área */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              {focusedTierSummary.map(({ tier, count }) => (
                <span
                  key={tier.code}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: tier.badgeBg,
                    color: tier.badgeColor,
                    border: `1px solid ${tier.badgeBorder}`
                  }}
                >
                  {tier.code} {tier.shortLabel}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Cuerpo principal: Lienzo interactivo con Pan/Zoom o Lista Jerárquica */}
        {layoutMode === 'tree' ? (
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={() => {
              if (dragOriginRef.current?.hasDragged) {
                dragOriginRef.current = null;
                setIsDragging(false);
              }
            }}
            onPointerLeave={() => {
              if (dragOriginRef.current && !dragOriginRef.current.hasDragged) {
                dragOriginRef.current = null;
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 1) e.preventDefault();
            }}
            onClickCapture={handleViewportClickCapture}
            onDragStart={(e) => e.preventDefault()}
            onAuxClick={(e) => {
              if (e.button === 1) e.preventDefault();
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              flex: isFullscreen ? 1 : undefined,
              minHeight: isFullscreen ? 0 : '600px',
              height: isFullscreen ? undefined : '74vh',
              backgroundColor: 'var(--app-bg)',
              backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {/* Escena transformada */}
            <div
              ref={contentRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isSmoothTransition
                  ? 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
                willChange: 'transform',
                padding: '20px 36px 56px 36px',
                width: 'max-content'
              }}
            >
              {renderBranch(effectiveDisplayRoot, true)}
            </div>

            {/* Barra flotante de navegación del lienzo */}
            <div
              data-org-controls="true"
              style={{
                position: 'absolute',
                right: '16px',
                bottom: '16px',
                zIndex: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 7px',
                borderRadius: '11px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {/* Modo de rueda: Mover vs Zoom */}
              <button
                type="button"
                onClick={() => setWheelMode((m) => (m === 'pan' ? 'zoom' : 'pan'))}
                className="rrhh-dept-action-btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '10.5px',
                  backgroundColor: wheelMode === 'zoom' ? 'var(--brand-50)' : undefined,
                  color: wheelMode === 'zoom' ? 'var(--primary)' : undefined,
                  borderColor: wheelMode === 'zoom' ? 'var(--brand-200)' : undefined
                }}
                title={
                  wheelMode === 'pan'
                    ? 'Rueda del mouse desplaza el mapa (clic para cambiar a Zoom directo)'
                    : 'Rueda del mouse hace Zoom al cursor (clic para cambiar a Desplazar)'
                }
              >
                <span>Rueda: {wheelMode === 'pan' ? 'Mover' : 'Zoom'}</span>
              </button>
              <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)', margin: '0 2px' }} />
              <button
                type="button"
                onClick={() => zoomByStepCentered(-0.14)}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  minWidth: '40px',
                  textAlign: 'center'
                }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomByStepCentered(0.14)}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)', margin: '0 2px' }} />
              <button
                type="button"
                onClick={() => fitTreeToViewport(1)}
                className="rrhh-dept-action-btn"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                title="Ajustar organigrama a la vista"
              >
                <Crosshair className="w-3 h-3" />
                <span>Ajustar</span>
              </button>
              <button
                type="button"
                onClick={() => centerAtCurrentZoom(0.95)}
                className="rrhh-dept-action-btn"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                title="Centrar vista al 95%"
              >
                <span>Centrar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="btn-icon"
                style={{ width: '28px', height: '28px', color: 'var(--primary)' }}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en grande'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              {(isDepartmentFocused || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    handleSelectDepartmentBranch(null);
                  }}
                  className="btn-icon"
                  style={{ width: '28px', height: '28px', color: 'var(--text-secondary)' }}
                  title="Volver a vista general"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : layoutMode === 'teams' ? (
          <TeamsOrgPanel
            rootNode={rootNode}
            nodeMap={nodeMap}
            parentMap={parentMap}
            levelMap={levelMap}
            tierMetaMap={HIERARCHY_TIERS}
            selectedPersonId={
              teamsSelectedId && nodeMap.has(teamsSelectedId)
                ? teamsSelectedId
                : displayRoot.employee.id
            }
            scopedBranchId={focusedRootId}
            globalSearchQuery={searchQuery}
            isFullscreen={isFullscreen}
            onSelectPerson={(empId) => setTeamsSelectedId(empId)}
            onViewEmployee={onViewEmployee}
            onOpenInTree={handleOpenInTreeFromTeams}
          />
        ) : (
          <div
            style={{
              flex: isFullscreen ? 1 : undefined,
              minHeight: isFullscreen ? 0 : undefined,
              maxHeight: isFullscreen ? undefined : '74vh',
              overflowY: 'auto',
              backgroundColor: 'var(--surface)'
            }}
          >
            {renderOutlineNode(effectiveDisplayRoot, 0)}
          </div>
        )}

        {/* 5. Pie discreto: Escala jerárquica + controles */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            flexShrink: 0
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Hand className="w-3.5 h-3.5" />
            <span>
              {layoutMode === 'teams'
                ? 'Haz clic en cualquier persona arriba o abajo para recorrer su cadena de mando estilo Teams.'
                : `Arrastra en cualquier punto (clic o rueda) · Rueda para ${
                    wheelMode === 'pan' ? 'desplazar' : 'zoom'
                  } · Shift + Rueda lateral · Ctrl + Rueda zoom al cursor.`}
            </span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {matchedIds.size > 0 && (
              <span style={{ color: 'var(--primary)', fontWeight: 700, marginRight: '4px' }}>
                {matchedIds.size} coincidencia{matchedIds.size === 1 ? '' : 's'}
              </span>
            )}
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Orden: N1 Dir. General → N2 Dir. → N3 Gerencia → N4 Subgerencia → N5 Líder/Sup. → N6 Especialista → N7 Operativo
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
