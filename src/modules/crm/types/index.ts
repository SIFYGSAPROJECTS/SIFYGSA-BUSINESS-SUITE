import type { ZonaComercial } from '@/config/types';
import type { EtapaOportunidad } from '../constants';
import type {
  ActividadCrm,
  ClienteCrm,
  DatosCrm,
  EntradaCrearActividadCrm,
  EntradaCrearCliente,
  EntradaCrearOportunidad,
  InteraccionCliente,
  OportunidadCrm,
} from '../schemas/crm.schema';

export interface IRepositorioCrm {
  obtenerTodo(): Promise<DatosCrm>;
  guardarOportunidades(oportunidades: OportunidadCrm[]): Promise<void>;
  guardarClientes(clientes: ClienteCrm[]): Promise<void>;
  guardarActividades(actividades: ActividadCrm[]): Promise<void>;
}

export interface MetricasReporteCrm {
  totalOportunidades: number;
  valorPipelineActivo: number;
  valorGanadoTotal: number;
  tasaConversion: number;
  porEtapa: { etapa: EtapaOportunidad; cantidad: number; monto: number }[];
  ventasPorVendedor: { vendedor: string; ganado: number; pipeline: number; oportunidades: number }[];
  ventasPorZona: { zona: ZonaComercial; ganado: number; pipeline: number; oportunidades: number }[];
  ventasPorPeriodo: { periodo: string; ganado: number; proyectado: number }[];
}

export type {
  OportunidadCrm,
  ClienteCrm,
  ActividadCrm,
  InteraccionCliente,
  DatosCrm,
  EntradaCrearOportunidad,
  EntradaCrearCliente,
  EntradaCrearActividadCrm,
};
