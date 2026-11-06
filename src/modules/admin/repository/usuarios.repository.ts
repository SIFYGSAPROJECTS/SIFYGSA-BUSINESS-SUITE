import type { Usuario, UsuarioPublico } from '@/config/types';
import { actualizarJsonSeguro, leerJsonSeguro } from '@/lib/storage/json-storage';
import type { IRepositorioUsuarios } from '../types';

const ARCHIVO_USUARIOS = 'usuarios.json';

export function sanitizarUsuario(usuario: Usuario): UsuarioPublico {
  const { passwordHash: _omitido, ...publico } = usuario;
  void _omitido;
  return publico;
}

export class RepositorioUsuariosJson implements IRepositorioUsuarios {
  async listarTodos(): Promise<Usuario[]> {
    return leerJsonSeguro<Usuario[]>(ARCHIVO_USUARIOS, []);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const usuarios = await this.listarTodos();
    return usuarios.find((u) => u.id === id) ?? null;
  }

  async buscarPorIdentificador(identificador: string): Promise<Usuario | null> {
    const limpio = identificador.trim().toLowerCase();
    const aliasEmail: Record<string, string> = {
      'crm@sifygsa.com': 'admin@sifygsa.com',
      'rh@sifygsa.com': 'rrhh@sifygsa.com',
    };
    const objetivo = aliasEmail[limpio] ?? limpio;
    const usuarios = await this.listarTodos();
    return (
      usuarios.find(
        (u) =>
          u.usuario.toLowerCase() === objetivo ||
          u.email.toLowerCase() === objetivo ||
          u.email.toLowerCase() === limpio
      ) ?? null
    );
  }

  async crear(nuevo: Usuario): Promise<Usuario> {
    await actualizarJsonSeguro<Usuario[]>(ARCHIVO_USUARIOS, [], (actuales) => [
      ...actuales,
      nuevo,
    ]);
    return nuevo;
  }

  async actualizar(id: string, cambios: Partial<Usuario>): Promise<Usuario | null> {
    let usuarioActualizado: Usuario | null = null;

    await actualizarJsonSeguro<Usuario[]>(ARCHIVO_USUARIOS, [], (actuales) =>
      actuales.map((u) => {
        if (u.id === id) {
          usuarioActualizado = { ...u, ...cambios, id: u.id };
          return usuarioActualizado;
        }
        return u;
      })
    );

    return usuarioActualizado;
  }
}

export const repositorioUsuarios: IRepositorioUsuarios = new RepositorioUsuariosJson();
