import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { MATRIZ_PERMISOS_POR_DEFECTO } from '../../common/constants/permissions.matrix';
import type {
  MatrizPermisos,
  PayloadSesion,
  Usuario,
  UsuarioPublico,
} from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import { AuditService } from '../audit/audit.service';
import {
  esquemaActualizarMatrizPermisos,
  esquemaCrearUsuario,
  esquemaEditarUsuario,
  esquemaRestablecerPassword,
} from './admin.schemas';

function sanitizarUsuario(usuario: Usuario): UsuarioPublico {
  const { passwordHash: _omitido, ...publico } = usuario;
  void _omitido;
  return publico;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly auditService: AuditService
  ) {}

  async listarUsuariosPublicos(): Promise<UsuarioPublico[]> {
    const usuarios = await this.jsonStorage.leerJson<Usuario[]>('usuarios.json', []);
    return usuarios.map(sanitizarUsuario);
  }

  async crearNuevoUsuario(entrada: unknown, actor: PayloadSesion): Promise<UsuarioPublico> {
    const validado = esquemaCrearUsuario.parse(entrada);
    const existentes = await this.jsonStorage.leerJson<Usuario[]>('usuarios.json', []);
    const duplicado = existentes.some(
      (u) =>
        u.usuario.toLowerCase() === validado.usuario.toLowerCase() ||
        u.email.toLowerCase() === validado.email.toLowerCase()
    );
    if (duplicado) {
      throw new Error(
        'Ya existe un usuario registrado con ese nombre de usuario o correo electrónico.'
      );
    }

    const passwordHash = await bcrypt.hash(validado.password, 10);
    const nuevoUsuario: Usuario = {
      id: `usr_${Date.now()}`,
      nombre: validado.nombre,
      usuario: validado.usuario.toLowerCase(),
      email: validado.email.toLowerCase(),
      passwordHash,
      rol: validado.rol,
      zona: validado.zona,
      departamento: validado.departamento,
      estado: 'activo',
      modulosPermitidos: validado.modulosPermitidos,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null,
    };

    await this.jsonStorage.actualizarJson<Usuario[]>('usuarios.json', [], (actuales) => [
      ...actuales,
      nuevoUsuario,
    ]);

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'admin',
      tipoEvento: 'creacion',
      entidad: 'Usuario',
      entidadId: nuevoUsuario.id,
      detalle: `Creación del usuario ${nuevoUsuario.nombre} (${nuevoUsuario.usuario}) con rol ${nuevoUsuario.rol}.`,
    });

    return sanitizarUsuario(nuevoUsuario);
  }

  async editarUsuarioExistente(
    id: string,
    entrada: unknown,
    actor: PayloadSesion
  ): Promise<UsuarioPublico> {
    const validado = esquemaEditarUsuario.parse(entrada);
    let actualizado: Usuario | null = null;

    await this.jsonStorage.actualizarJson<Usuario[]>('usuarios.json', [], (actuales) =>
      actuales.map((u) => {
        if (u.id === id) {
          actualizado = {
            ...u,
            nombre: validado.nombre,
            email: validado.email.toLowerCase(),
            rol: validado.rol,
            zona: validado.zona,
            departamento: validado.departamento,
            estado: validado.estado,
            modulosPermitidos: validado.modulosPermitidos,
          };
          return actualizado;
        }
        return u;
      })
    );

    if (!actualizado) {
      throw new Error('El usuario especificado no existe.');
    }

    const usuarioFinal = actualizado as Usuario;
    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'admin',
      tipoEvento: 'actualizacion',
      entidad: 'Usuario',
      entidadId: id,
      detalle: `Actualización de usuario ${usuarioFinal.nombre}: rol=${usuarioFinal.rol}, estado=${usuarioFinal.estado}.`,
    });

    return sanitizarUsuario(usuarioFinal);
  }

  async restablecerPasswordUsuario(
    id: string,
    nuevaPassword: string,
    actor: PayloadSesion
  ): Promise<void> {
    const validado = esquemaRestablecerPassword.parse({ nuevaPassword });
    const passwordHash = await bcrypt.hash(validado.nuevaPassword, 10);
    let objetivo: Usuario | null = null;

    await this.jsonStorage.actualizarJson<Usuario[]>('usuarios.json', [], (actuales) =>
      actuales.map((u) => {
        if (u.id === id) {
          objetivo = { ...u, passwordHash };
          return objetivo;
        }
        return u;
      })
    );

    if (!objetivo) {
      throw new Error('Usuario no encontrado.');
    }

    const usuarioFinal = objetivo as Usuario;
    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'admin',
      tipoEvento: 'actualizacion',
      entidad: 'Usuario',
      entidadId: id,
      detalle: `Restablecimiento de contraseña para la cuenta ${usuarioFinal.usuario}.`,
    });
  }

  async obtenerMatrizPermisos(): Promise<MatrizPermisos> {
    return this.jsonStorage.leerJson<MatrizPermisos>(
      'roles-permisos.json',
      MATRIZ_PERMISOS_POR_DEFECTO
    );
  }

  async actualizarMatrizPermisos(
    cuerpo: unknown,
    actor: PayloadSesion
  ): Promise<MatrizPermisos> {
    const validado = esquemaActualizarMatrizPermisos.parse(cuerpo);
    const matrizSegura: MatrizPermisos = {
      ...(validado.matriz as MatrizPermisos),
      administrador: MATRIZ_PERMISOS_POR_DEFECTO.administrador,
    };

    await this.jsonStorage.escribirJson<MatrizPermisos>('roles-permisos.json', matrizSegura);

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'admin',
      tipoEvento: 'cambio_permisos',
      entidad: 'MatrizPermisos',
      detalle: 'Actualización de la matriz de roles y permisos en roles-permisos.json.',
    });

    return matrizSegura;
  }
}
