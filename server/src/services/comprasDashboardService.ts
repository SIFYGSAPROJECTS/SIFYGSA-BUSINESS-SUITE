/**
 * ============================================================================
 * SIFYGSA ENTERPRISE ERP - SERVICIO DE DASHBOARD Y MÉTRICAS DE COMPRAS
 * Módulo de Backend (Node / Express / TypeScript)
 * ============================================================================
 */

import { ORDENES_COMPRA_INICIALES, PROVEEDORES_INICIALES } from '../../../src/modules/compras/data/mock-data';
import type { OrdenCompra, Proveedor, EstatusOrdenCompra } from '../../../src/modules/compras/types';

export interface KpiComprasDashboard {
  ordenesAbiertas: number;
  ordenesPorAutorizar: number;
  totalProveedores: number;
  montoTotalEjercidoMXN: number;
  porcentajeProveedoresCumplimientoSat: number;
  totalOrdenes: number;
}

export interface GraficaEstatusItem {
  estatus: EstatusOrdenCompra;
  label: string;
  count: number;
  montoMXN: number;
  porcentaje: number;
  color: string;
  icon: string;
}

export interface GraficaMesItem {
  key: string;
  mesCorto: string;
  mesLargo: string;
  anio: number;
  montoMXN: number;
  cantidad: number;
  aprobadas: number;
}

export interface ComparativaAutorizacion {
  porAutorizarCount: number;
  porAutorizarMonto: number;
  autorizadasCount: number;
  autorizadasMonto: number;
  tasaEfectividad: number; // Porcentaje de autorizadas vs total
}

export interface TopProveedorItem {
  proveedorNombre: string;
  rfc: string;
  numOrdenes: number;
  montoTotalMXN: number;
  porcentajeOrdenes: number;
  categoria?: string;
  opinionSat32D?: string;
}

export interface DatosDashboardCompras {
  kpis: KpiComprasDashboard;
  graficas: {
    ordenesPorEstatus: GraficaEstatusItem[];
    ordenesPorMes: GraficaMesItem[];
    comparativaAutorizacion: ComparativaAutorizacion;
    topProveedores: TopProveedorItem[];
  };
  timestamp: string;
}

export class ComprasDashboardService {
  /**
   * Normaliza montos a pesos mexicanos para comparativas homogéneas
   */
  private static calcularMontoMXN(oc: OrdenCompra): number {
    if (oc.moneda === 'USD') {
      const tc = oc.tipoCambio && oc.tipoCambio > 1 ? oc.tipoCambio : 18.45;
      return oc.total * tc;
    }
    return oc.total || 0;
  }

  /**
   * Obtiene las métricas KPI y analítica en tiempo real del módulo de Compras
   */
  public static async obtenerMetricasDashboard(
    ordenesFuente?: OrdenCompra[],
    proveedoresFuente?: Proveedor[]
  ): Promise<DatosDashboardCompras> {
    const ordenes = ordenesFuente && ordenesFuente.length > 0
      ? ordenesFuente
      : ORDENES_COMPRA_INICIALES;

    const proveedores = proveedoresFuente && proveedoresFuente.length > 0
      ? proveedoresFuente
      : PROVEEDORES_INICIALES;

    // 1. KPI Cards
    // Órdenes Abiertas (emitidas, en proceso operativo o en tránsito)
    const ordenesAbiertas = ordenes.filter(
      (o) =>
        o.estatus === 'abierta' ||
        o.estatus === 'transito' ||
        o.estatus === 'orden_completa_factura_abierta'
    ).length;

    // Órdenes por Autorizar (pendientes de firma o revisión presupuestal)
    const ordenesPorAutorizar = ordenes.filter(
      (o) => o.estatus === 'pendiente' || o.estatus === 'pendiente_aprobacion'
    ).length;

    // Total Proveedores
    const totalProveedores = proveedores.length;
    const proveedoresConSatPositiva = proveedores.filter(
      (p) => p.opinionSat32D === 'positiva'
    ).length;
    const porcentajeProveedoresCumplimientoSat =
      totalProveedores > 0
        ? Math.round((proveedoresConSatPositiva / totalProveedores) * 100)
        : 100;

    const montoTotalEjercidoMXN = ordenes
      .filter((o) => o.estatus !== 'cancelada')
      .reduce((sum, o) => sum + this.calcularMontoMXN(o), 0);

    // 2. Gráfica 1: Órdenes por Estatus (Dona)
    const conteoEstatus: Record<string, { count: number; monto: number }> = {};
    ordenes.forEach((o) => {
      const st = o.estatus || 'abierta';
      if (!conteoEstatus[st]) {
        conteoEstatus[st] = { count: 0, monto: 0 };
      }
      conteoEstatus[st].count += 1;
      conteoEstatus[st].monto += this.calcularMontoMXN(o);
    });

    const metaEstatus: Record<string, { label: string; color: string; icon: string }> = {
      abierta: { label: 'Abierta / Emitida', color: '#1D4ED8', icon: 'check_circle' },
      pendiente_aprobacion: { label: 'Por Autorizar', color: '#D97706', icon: 'hourglass_empty' },
      pendiente: { label: 'Pendiente', color: '#F59E0B', icon: 'schedule' },
      transito: { label: 'En Tránsito', color: '#00B7EB', icon: 'local_shipping' },
      cerrada: { label: 'Cerrada / Recibida', color: '#16A34A', icon: 'inventory_2' },
      cancelada: { label: 'Cancelada', color: '#DC2626', icon: 'cancel' },
    };

    const totalOrdenes = ordenes.length || 1;
    const ordenesPorEstatus: GraficaEstatusItem[] = Object.keys(metaEstatus).map((key) => {
      const data = conteoEstatus[key] || { count: 0, monto: 0 };
      return {
        estatus: key as EstatusOrdenCompra,
        label: metaEstatus[key].label,
        count: data.count,
        montoMXN: data.monto,
        porcentaje: Math.round((data.count / totalOrdenes) * 100),
        color: metaEstatus[key].color,
        icon: metaEstatus[key].icon,
      };
    }).filter((item) => item.count > 0 || item.estatus === 'abierta' || item.estatus === 'pendiente_aprobacion');

    // 3. Gráfica 2: Órdenes por Mes (Línea o Barras)
    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const MESES_LARGOS = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const mapaMes = new Map<string, GraficaMesItem>();
    ordenes.forEach((o) => {
      if (o.estatus === 'cancelada') return;
      const partes = (o.fechaEmision || '2026-03-01').split('-');
      const anio = parseInt(partes[0] || '2026', 10);
      const mesIdx = Math.max(0, Math.min(11, parseInt(partes[1] || '1', 10) - 1));
      const key = `${anio}-${String(mesIdx + 1).padStart(2, '0')}`;

      const actual = mapaMes.get(key) || {
        key,
        mesCorto: `${MESES[mesIdx]} ${String(anio).slice(-2)}`,
        mesLargo: `${MESES_LARGOS[mesIdx]} ${anio}`,
        anio,
        montoMXN: 0,
        cantidad: 0,
        aprobadas: 0,
      };

      actual.montoMXN += this.calcularMontoMXN(o);
      actual.cantidad += 1;
      if (o.estatus === 'abierta' || o.estatus === 'cerrada' || o.estatus === 'transito') {
        actual.aprobadas += 1;
      }
      mapaMes.set(key, actual);
    });

    const ordenesPorMes = Array.from(mapaMes.values()).sort((a, b) => a.key.localeCompare(b.key));

    // 4. Gráfica 3: Por Autorizar frente a Autorizadas
    const autorizadasList = ordenes.filter(
      (o) =>
        o.estatus === 'abierta' ||
        o.estatus === 'cerrada' ||
        o.estatus === 'transito' ||
        o.estatus === 'aprobada_supervisor' ||
        o.estatus === 'orden_completa_factura_abierta'
    );
    const porAutorizarList = ordenes.filter(
      (o) => o.estatus === 'pendiente' || o.estatus === 'pendiente_aprobacion'
    );

    const autorizadasMonto = autorizadasList.reduce((sum, o) => sum + this.calcularMontoMXN(o), 0);
    const porAutorizarMonto = porAutorizarList.reduce((sum, o) => sum + this.calcularMontoMXN(o), 0);
    const totalEvaluadas = autorizadasList.length + porAutorizarList.length;
    const tasaEfectividad = totalEvaluadas > 0
      ? Math.round((autorizadasList.length / totalEvaluadas) * 100)
      : 100;

    const comparativaAutorizacion: ComparativaAutorizacion = {
      porAutorizarCount: porAutorizarList.length,
      porAutorizarMonto,
      autorizadasCount: autorizadasList.length,
      autorizadasMonto,
      tasaEfectividad,
    };

    // 5. Gráfica 4: Top Proveedores por número de órdenes
    const mapaProv = new Map<string, { count: number; monto: number; rfc: string }>();
    ordenes.forEach((o) => {
      if (o.estatus === 'cancelada') return;
      const key = o.proveedorNombre || 'Proveedor Desconocido';
      const actual = mapaProv.get(key) || { count: 0, monto: 0, rfc: o.proveedorRfc || '' };
      actual.count += 1;
      actual.monto += this.calcularMontoMXN(o);
      mapaProv.set(key, actual);
    });

    const totalOrdenesValidas = ordenes.filter((o) => o.estatus !== 'cancelada').length || 1;
    const topProveedores: TopProveedorItem[] = Array.from(mapaProv.entries())
      .sort((a, b) => b[1].count - a[1].count || b[1].monto - a[1].monto)
      .slice(0, 6)
      .map(([nombre, data]) => {
        const provMeta = proveedores.find((p) => p.razonSocial === nombre || p.nombreComercial === nombre);
        return {
          proveedorNombre: nombre,
          rfc: data.rfc || provMeta?.rfc || 'RFC-IND',
          numOrdenes: data.count,
          montoTotalMXN: data.monto,
          porcentajeOrdenes: Math.round((data.count / totalOrdenesValidas) * 100),
          categoria: provMeta?.categoria,
          opinionSat32D: provMeta?.opinionSat32D,
        };
      });

    return {
      kpis: {
        ordenesAbiertas,
        ordenesPorAutorizar,
        totalProveedores,
        montoTotalEjercidoMXN,
        porcentajeProveedoresCumplimientoSat,
        totalOrdenes: ordenes.length,
      },
      graficas: {
        ordenesPorEstatus,
        ordenesPorMes,
        comparativaAutorizacion,
        topProveedores,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
