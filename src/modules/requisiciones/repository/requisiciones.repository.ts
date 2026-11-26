import { escribirJsonSeguro, leerJsonSeguro } from '@/lib/storage/json-storage';
import type { IRepositorioRequisiciones, Requisicion } from '../types';

const ARCHIVO_REQUISICIONES = 'requisiciones.json';

export const REQUISICIONES_INICIALES: Requisicion[] = [
  {
    id: 'req_001',
    folio: 'REQ-2026-0081',
    contrato: 'PEMEX-MINA-SIL3-26',
    solicitante: 'Pablo Vázquez Culebro',
    area: 'Instrumentación & Fire/Gas',
    prioridad: 'critica',
    estado: 'aprobacion',
    justificacion: 'Suministro urgente de detectores ópticos infrarrojos CH4/H2S con display SIL-3 para Refinería Minatitlán.',
    fechaCreacion: '2026-10-24T09:15:00.000Z',
    fechaRequerida: '2026-11-05',
    partidas: [
      {
        id: 'part_001',
        codigoArticulo: 'DET-GAS-IR-042',
        descripcion: 'Detector Óptico Infrarrojo de Gas CH4/H2S SIL-3 Det-Tronics',
        cantidad: 2,
        unidad: 'PZA',
        precioUnitario: 48250,
        subtotal: 96500,
      },
      {
        id: 'part_002',
        codigoArticulo: 'SNSR-CAL-H2S',
        descripcion: 'Cilindro patrón de calibración certificada H2S 50 ppm',
        cantidad: 4,
        unidad: 'PZA',
        precioUnitario: 6800,
        subtotal: 27200,
      },
    ],
    subtotal: 123700,
    iva: 19792,
    total: 143492,
    nivelAprobacionRequerido: 'nivel_2_gerencia',
    historial: [
      {
        id: 'hist_001',
        fecha: '2026-10-24T09:15:00.000Z',
        estadoAnterior: null,
        estadoNuevo: 'solicitud',
        usuarioNombre: 'Pablo Vázquez Culebro',
        rolUsuario: 'requisiciones',
        comentario: 'Solicitud inicial creada con partidas críticas de instrumentación.',
      },
      {
        id: 'hist_002',
        fecha: '2026-10-25T11:20:00.000Z',
        estadoAnterior: 'solicitud',
        estadoNuevo: 'revision',
        usuarioNombre: 'Pablo Vázquez Culebro',
        rolUsuario: 'requisiciones',
        comentario: 'Validación técnica de números de parte y disponibilidad con proveedor.',
      },
      {
        id: 'hist_003',
        fecha: '2026-10-26T10:00:00.000Z',
        estadoAnterior: 'revision',
        estadoNuevo: 'aprobacion',
        usuarioNombre: 'Pablo Vázquez Culebro',
        rolUsuario: 'requisiciones',
        comentario: 'Enviada a aprobación Nivel 2 Gerencia por monto superior a $50,000 MXN.',
      },
    ],
  },
  {
    id: 'req_002',
    folio: 'REQ-2026-0082',
    contrato: 'ADM-SEGURIDAD-CAMPO',
    solicitante: 'Mariana Garza',
    area: 'Operaciones & Logística',
    prioridad: 'alta',
    estado: 'revision',
    justificacion: 'Renovación de equipo de protección personal ignífugo para cuadrilla Alfa en Base Mapachapa.',
    fechaCreacion: '2026-10-25T14:00:00.000Z',
    fechaRequerida: '2026-11-08',
    partidas: [
      {
        id: 'part_003',
        codigoArticulo: 'EPP-OVEROL-NOMEX',
        descripcion: 'Overol ignífugo certificado NFPA 2112 talla L',
        cantidad: 15,
        unidad: 'PZA',
        precioUnitario: 2200,
        subtotal: 33000,
      },
    ],
    subtotal: 33000,
    iva: 5280,
    total: 38280,
    nivelAprobacionRequerido: 'nivel_1_compras',
    historial: [
      {
        id: 'hist_004',
        fecha: '2026-10-25T14:00:00.000Z',
        estadoAnterior: null,
        estadoNuevo: 'solicitud',
        usuarioNombre: 'Mariana Garza',
        rolUsuario: 'rrhh',
        comentario: 'Alta de requisición de EPP para brigada de campo.',
      },
      {
        id: 'hist_005',
        fecha: '2026-10-26T08:45:00.000Z',
        estadoAnterior: 'solicitud',
        estadoNuevo: 'revision',
        usuarioNombre: 'Pablo Vázquez Culebro',
        rolUsuario: 'requisiciones',
        comentario: 'En revisión de tallas y existencias en almacén central.',
      },
    ],
  },
  {
    id: 'req_003',
    folio: 'REQ-2026-0083',
    contrato: 'CORP-TI-DESARROLLO',
    solicitante: 'Carlos Mendoza',
    area: 'Tecnología & Sistemas',
    prioridad: 'normal',
    estado: 'atencion',
    justificacion: 'Servidores de telemetría redundantes para monitoreo remoto Modbus/SCADA.',
    fechaCreacion: '2026-10-18T10:30:00.000Z',
    fechaRequerida: '2026-11-12',
    partidas: [
      {
        id: 'part_004',
        codigoArticulo: 'SRV-RACK-SCADA-01',
        descripcion: 'Servidor Rack Industrial Dual Xeon 64GB RAM RAID-10',
        cantidad: 2,
        unidad: 'PZA',
        precioUnitario: 125000,
        subtotal: 250000,
      },
    ],
    subtotal: 250000,
    iva: 40000,
    total: 290000,
    nivelAprobacionRequerido: 'nivel_3_direccion',
    historial: [
      {
        id: 'hist_006',
        fecha: '2026-10-18T10:30:00.000Z',
        estadoAnterior: null,
        estadoNuevo: 'solicitud',
        usuarioNombre: 'Carlos Mendoza',
        rolUsuario: 'administrador',
        comentario: 'Requisición de infraestructura crítica SCADA.',
      },
      {
        id: 'hist_007',
        fecha: '2026-10-20T16:00:00.000Z',
        estadoAnterior: 'aprobacion',
        estadoNuevo: 'atencion',
        usuarioNombre: 'Carlos Mendoza',
        rolUsuario: 'administrador',
        comentario: 'Aprobada en Nivel 3 Dirección General; orden de compra emitida.',
      },
    ],
  },
];

export class RepositorioRequisicionesJson implements IRepositorioRequisiciones {
  async listarTodas(): Promise<Requisicion[]> {
    return leerJsonSeguro<Requisicion[]>(ARCHIVO_REQUISICIONES, REQUISICIONES_INICIALES);
  }

  async buscarPorId(id: string): Promise<Requisicion | null> {
    const todas = await this.listarTodas();
    return todas.find((r) => r.id === id) ?? null;
  }

  async guardarTodas(requisiciones: Requisicion[]): Promise<void> {
    await escribirJsonSeguro<Requisicion[]>(ARCHIVO_REQUISICIONES, requisiciones);
  }
}

export const repositorioRequisiciones: IRepositorioRequisiciones =
  new RepositorioRequisicionesJson();
