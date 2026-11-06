import type { Usuario, UsuarioPublico } from '@/config/types';
import type {
  EntradaCrearUsuario,
  EntradaEditarUsuario,
} from '../schemas/admin.schema';

export interface IRepositorioUsuarios {
  listarTodos(): Promise<Usuario[]>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorIdentificador(identificador: string): Promise<Usuario | null>;
  crear(usuario: Usuario): Promise<Usuario>;
  actualizar(id: string, cambios: Partial<Usuario>): Promise<Usuario | null>;
}

export interface IndicadoresGlobalesAdmin {
  usuariosActivos: number;
  usuariosTotales: number;
  oportunidadesActivas: number;
  valorPipelineCrm: number;
  requisicionesPendientes: number;
  montoRequisicionesMes: number;
  empleadosActivos: number;
  solicitudesRrhhPendientes: number;
  eventosAuditoriaHoy: number;
}

export type { UsuarioPublico, EntradaCrearUsuario, EntradaEditarUsuario };
