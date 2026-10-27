import type { RolUsuario } from '@/config/types';
import type { AreaOperativa, EstadoRequisicion } from '../constants';
import type {
  CambioHistorialRequisicion,
  EntradaActualizarRequisicion,
  EntradaCrearRequisicion,
  EntradaTransicionRequisicion,
  NotaSistemaRequisicion,
  PartidaRequisicion,
  Requisicion,
} from '../schemas/requisicion.schema';

export interface IRepositorioRequisiciones {
  listarTodas(): Promise<Requisicion[]>;
  buscarPorId(id: string): Promise<Requisicion | null>;
  guardarTodas(requisiciones: Requisicion[]): Promise<void>;
}

export interface AlertaPendienteRequisicion {
  requisicionId: string;
  folio: string;
  solicitante: string;
  area: AreaOperativa;
  estado: EstadoRequisicion;
  total: number;
  accionRequerida: string;
  rolesNotificados: RolUsuario[];
}

export type {
  Requisicion,
  PartidaRequisicion,
  CambioHistorialRequisicion,
  NotaSistemaRequisicion,
  EntradaCrearRequisicion,
  EntradaActualizarRequisicion,
  EntradaTransicionRequisicion,
};
