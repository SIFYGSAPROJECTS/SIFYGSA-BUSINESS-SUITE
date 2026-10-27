import type { MatrizPermisos, Usuario, UsuarioPublico } from '@/config/types';
import { registrarAccionUsuario } from '@/lib/audit';
import {
  hashearPassword,
  limpiarIntentosFallidos,
  registrarIntentoFallido,
  verificarEstadoBloqueo,
  verificarPassword,
  type PayloadSesion,
} from '@/lib/auth';
import { guardarMatrizPermisos, obtenerMatrizPermisos } from '@/lib/permissions/server';
import {
  repositorioUsuarios,
  sanitizarUsuario,
} from '../repository/usuarios.repository';
import {
  esquemaCrearUsuario,
  esquemaEditarUsuario,
  esquemaRestablecerPassword,
  type EntradaCrearUsuario,
  type EntradaEditarUsuario,
} from '../schemas/admin.schema';

export interface ResultadoAutenticacion {
  exito: boolean;
  usuario?: UsuarioPublico;
  error?: string;
  bloqueado?: boolean;
  segundosRestantes?: number;
}

export async function autenticarUsuario(
  identificador: string,
  passwordPlano: string
): Promise<ResultadoAutenticacion> {
  const estadoBloqueo = verificarEstadoBloqueo(identificador);
  if (estadoBloqueo.bloqueado) {
    return {
      exito: false,
      bloqueado: true,
      segundosRestantes: estadoBloqueo.segundosRestantes,
      error: `Cuenta bloqueada temporalmente por seguridad. Intenta nuevamente en ${estadoBloqueo.segundosRestantes} segundos.`,
    };
  }

  const usuario = await repositorioUsuarios.buscarPorIdentificador(identificador);

  if (!usuario) {
    const nuevoEstado = registrarIntentoFallido(identificador);
    await registrarAccionUsuario({
      usuarioId: 'desconocido',
      usuarioNombre: identificador,
      rol: 'vendedor',
      modulo: 'auth',
      tipoEvento: 'intento_fallido',
      entidad: 'Login',
      detalle: `Intento de acceso fallido con usuario inexistente (${identificador}).`,
    });
    return {
      exito: false,
      bloqueado: nuevoEstado.bloqueado,
      segundosRestantes: nuevoEstado.segundosRestantes,
      error: nuevoEstado.bloqueado
        ? 'Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.'
        : `Credenciales inválidas. Intentos restantes: ${nuevoEstado.intentosRestantes}.`,
    };
  }

  if (usuario.estado !== 'activo') {
    return {
      exito: false,
      error: 'Esta cuenta se encuentra desactivada. Contacta al Administrador del sistema.',
    };
  }

  const passwordCorrecta = await verificarPassword(passwordPlano, usuario.passwordHash);
  if (!passwordCorrecta) {
    const nuevoEstado = registrarIntentoFallido(identificador);
    await registrarAccionUsuario({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      rol: usuario.rol,
      modulo: 'auth',
      tipoEvento: 'intento_fallido',
      entidad: 'Login',
      entidadId: usuario.id,
      detalle: `Contraseña incorrecta para la cuenta ${usuario.usuario}.`,
    });
    return {
      exito: false,
      bloqueado: nuevoEstado.bloqueado,
      segundosRestantes: nuevoEstado.segundosRestantes,
      error: nuevoEstado.bloqueado
        ? 'Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.'
        : `Credenciales inválidas. Intentos restantes: ${nuevoEstado.intentosRestantes}.`,
    };
  }

  limpiarIntentosFallidos(identificador);
  const ahoraIso = new Date().toISOString();
  const actualizado = await repositorioUsuarios.actualizar(usuario.id, {
    ultimoAcceso: ahoraIso,
  });

  await registrarAccionUsuario({
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    rol: usuario.rol,
    modulo: 'auth',
    tipoEvento: 'inicio_sesion',
    entidad: 'Sesión JWT',
    entidadId: usuario.id,
    detalle: `Inicio de sesión exitoso (${usuario.rol}).`,
  });

  return {
    exito: true,
    usuario: sanitizarUsuario(actualizado ?? usuario),
  };
}

export async function listarUsuariosPublicos(): Promise<UsuarioPublico[]> {
  const todos = await repositorioUsuarios.listarTodos();
  return todos.map(sanitizarUsuario);
}

export async function crearNuevoUsuario(
  entrada: EntradaCrearUsuario,
  actor: PayloadSesion
): Promise<UsuarioPublico> {
  const validado = esquemaCrearUsuario.parse(entrada);
  const existenteUsuario = await repositorioUsuarios.buscarPorIdentificador(validado.usuario);
  const existenteEmail = await repositorioUsuarios.buscarPorIdentificador(validado.email);

  if (existenteUsuario || existenteEmail) {
    throw new Error('Ya existe un usuario registrado con ese nombre de usuario o correo electrónico.');
  }

  const passwordHash = await hashearPassword(validado.password);
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

  await repositorioUsuarios.crear(nuevoUsuario);

  await registrarAccionUsuario({
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

export async function editarUsuarioExistente(
  id: string,
  entrada: EntradaEditarUsuario,
  actor: PayloadSesion
): Promise<UsuarioPublico> {
  const validado = esquemaEditarUsuario.parse(entrada);
  const actual = await repositorioUsuarios.buscarPorId(id);

  if (!actual) {
    throw new Error('El usuario especificado no existe.');
  }

  const actualizado = await repositorioUsuarios.actualizar(id, {
    nombre: validado.nombre,
    email: validado.email.toLowerCase(),
    rol: validado.rol,
    zona: validado.zona,
    departamento: validado.departamento,
    estado: validado.estado,
    modulosPermitidos: validado.modulosPermitidos,
  });

  if (!actualizado) {
    throw new Error('No se pudo actualizar el usuario.');
  }

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'admin',
    tipoEvento: 'actualizacion',
    entidad: 'Usuario',
    entidadId: id,
    detalle: `Actualización de usuario ${actualizado.nombre}: rol=${actualizado.rol}, estado=${actualizado.estado}.`,
  });

  return sanitizarUsuario(actualizado);
}

export async function restablecerPasswordUsuario(
  id: string,
  nuevaPassword: string,
  actor: PayloadSesion
): Promise<void> {
  const validado = esquemaRestablecerPassword.parse({ nuevaPassword });
  const actual = await repositorioUsuarios.buscarPorId(id);

  if (!actual) {
    throw new Error('Usuario no encontrado.');
  }

  const passwordHash = await hashearPassword(validado.nuevaPassword);
  await repositorioUsuarios.actualizar(id, { passwordHash });

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'admin',
    tipoEvento: 'actualizacion',
    entidad: 'Usuario',
    entidadId: id,
    detalle: `Restablecimiento de contraseña para la cuenta ${actual.usuario}.`,
  });
}

export async function obtenerMatrizRolesPermisos(): Promise<MatrizPermisos> {
  return obtenerMatrizPermisos();
}

export async function actualizarMatrizRolesPermisos(
  matriz: MatrizPermisos,
  actor: PayloadSesion
): Promise<MatrizPermisos> {
  const guardada = await guardarMatrizPermisos(matriz);

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'admin',
    tipoEvento: 'cambio_permisos',
    entidad: 'MatrizPermisos',
    detalle: 'Actualización de la matriz de roles y permisos en data/roles-permisos.json.',
  });

  return guardada;
}
