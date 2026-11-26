import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { obtenerRutaInicialParaUsuario } from '../../common/constants/permissions.matrix';
import { SessionTokenService } from '../../common/services/session-token.service';
import type { PayloadSesion, Usuario, UsuarioPublico } from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import { AuditService } from '../audit/audit.service';
import { RateLimitService } from './rate-limit.service';

export const esquemaCredencialesLogin = z.object({
  identificador: z
    .string()
    .trim()
    .min(3, 'Ingresa tu usuario o correo electrónico corporativo'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

function sanitizarUsuario(usuario: Usuario): UsuarioPublico {
  const { passwordHash: _omitido, ...publico } = usuario;
  void _omitido;
  return publico;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly rateLimit: RateLimitService,
    private readonly auditService: AuditService,
    private readonly sessionToken: SessionTokenService
  ) {}

  private async buscarUsuarioPorIdentificador(identificador: string): Promise<Usuario | null> {
    const limpio = identificador.trim().toLowerCase();
    const aliasEmail: Record<string, string> = {
      'crm@sifygsa.com': 'admin@sifygsa.com',
      'rh@sifygsa.com': 'rrhh@sifygsa.com',
      compras: 'compras@sifygsa.com',
      procura: 'compras@sifygsa.com',
    };
    const objetivo = aliasEmail[limpio] ?? limpio;
    const usuarios = await this.jsonStorage.leerJson<Usuario[]>('usuarios.json', []);
    return (
      usuarios.find(
        (u) =>
          u.usuario.toLowerCase() === objetivo ||
          u.email.toLowerCase() === objetivo ||
          u.email.toLowerCase() === limpio
      ) ?? null
    );
  }

  async iniciarSesion(cuerpo: unknown, ip?: string) {
    const credenciales = esquemaCredencialesLogin.parse(cuerpo);
    const estadoBloqueo = this.rateLimit.verificarEstadoBloqueo(credenciales.identificador);
    if (estadoBloqueo.bloqueado) {
      return {
        exito: false as const,
        status: 429,
        error: `Cuenta bloqueada temporalmente por seguridad. Intenta nuevamente en ${estadoBloqueo.segundosRestantes} segundos.`,
      };
    }

    const usuario = await this.buscarUsuarioPorIdentificador(credenciales.identificador);
    if (!usuario) {
      const nuevoEstado = this.rateLimit.registrarIntentoFallido(credenciales.identificador);
      await this.auditService.registrarAccionSegura({
        usuarioId: 'desconocido',
        usuarioNombre: credenciales.identificador,
        rol: 'vendedor',
        modulo: 'auth',
        tipoEvento: 'intento_fallido',
        entidad: 'Login',
        detalle: `Intento de acceso fallido con usuario inexistente (${credenciales.identificador}).`,
        ip,
      });

      return {
        exito: false as const,
        status: nuevoEstado.bloqueado ? 429 : 401,
        error: nuevoEstado.bloqueado
          ? 'Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.'
          : `Credenciales inválidas. Intentos restantes: ${nuevoEstado.intentosRestantes}.`,
      };
    }

    if (usuario.estado !== 'activo') {
      return {
        exito: false as const,
        status: 401,
        error: 'Esta cuenta se encuentra desactivada. Contacta al Administrador del sistema.',
      };
    }

    const passwordCorrecta = await bcrypt.compare(credenciales.password, usuario.passwordHash);
    if (!passwordCorrecta) {
      const nuevoEstado = this.rateLimit.registrarIntentoFallido(credenciales.identificador);
      await this.auditService.registrarAccionSegura({
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        rol: usuario.rol,
        modulo: 'auth',
        tipoEvento: 'intento_fallido',
        entidad: 'Login',
        entidadId: usuario.id,
        detalle: `Contraseña incorrecta para la cuenta ${usuario.usuario}.`,
        ip,
      });

      return {
        exito: false as const,
        status: nuevoEstado.bloqueado ? 429 : 401,
        error: nuevoEstado.bloqueado
          ? 'Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.'
          : `Credenciales inválidas. Intentos restantes: ${nuevoEstado.intentosRestantes}.`,
      };
    }

    this.rateLimit.limpiarIntentosFallidos(credenciales.identificador);
    const ahoraIso = new Date().toISOString();
    let usuarioFinal = usuario;

    try {
      await this.jsonStorage.actualizarJson<Usuario[]>('usuarios.json', [], (lista) =>
        lista.map((u) => {
          if (u.id === usuario.id) {
            usuarioFinal = { ...u, ultimoAcceso: ahoraIso };
            return usuarioFinal;
          }
          return u;
        })
      );
    } catch {
      // Continuar incluso si disco está ocupado
    }

    await this.auditService.registrarAccionSegura({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      rol: usuario.rol,
      modulo: 'auth',
      tipoEvento: 'inicio_sesion',
      entidad: 'Sesión JWT',
      entidadId: usuario.id,
      detalle: `Inicio de sesión exitoso (${usuario.rol}).`,
      ip,
    });

    const usr = sanitizarUsuario(usuarioFinal);
    const token = await this.sessionToken.firmarTokenSesion({
      sub: usr.id,
      usuario: usr.usuario,
      nombre: usr.nombre,
      email: usr.email,
      rol: usr.rol,
      zona: usr.zona,
      departamento: usr.departamento,
      modulosPermitidos: usr.modulosPermitidos,
    });

    const rutaDestino = obtenerRutaInicialParaUsuario(usr.rol, usr.modulosPermitidos);

    return {
      exito: true as const,
      token,
      usuario: usr,
      rutaDestino,
    };
  }

  async cerrarSesion(sesion?: PayloadSesion, ip?: string): Promise<void> {
    if (!sesion) return;
    await this.auditService.registrarAccionSegura({
      usuarioId: sesion.sub,
      usuarioNombre: sesion.nombre,
      rol: sesion.rol,
      modulo: 'auth',
      tipoEvento: 'cierre_sesion',
      entidad: 'Sesión JWT',
      entidadId: sesion.sub,
      detalle: 'Cierre de sesión de usuario.',
      ip,
    });
  }
}
