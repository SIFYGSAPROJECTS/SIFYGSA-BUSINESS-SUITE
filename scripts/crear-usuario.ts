import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import bcrypt from 'bcryptjs';
import {
  ROLES_USUARIO,
  ZONAS_COMERCIALES,
  esquemaUsuario,
  type IdModulo,
  type RolUsuario,
  type Usuario,
  type ZonaComercial,
} from '../src/config/types';
import { obtenerModulosPorDefectoRol } from '../src/lib/permissions/matrix';
import { actualizarJsonSeguro } from '../src/lib/storage/json-storage';

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n====================================================');
    console.log('  SIFYGSA ERP — Creación Segura de Usuario (bcrypt) ');
    console.log('====================================================\n');

    const nombre = (await rl.question('Nombre completo: ')).trim();
    const usuario = (await rl.question('Nombre de usuario (login): ')).trim().toLowerCase();
    const email = (await rl.question('Correo corporativo: ')).trim().toLowerCase();
    const password = (await rl.question('Contraseña (mínimo 6 caracteres): ')).trim();

    console.log(`\nRoles disponibles: ${ROLES_USUARIO.join(', ')}`);
    const rolInput = (await rl.question('Rol (por defecto "vendedor"): ')).trim().toLowerCase();
    const rol: RolUsuario = (ROLES_USUARIO as readonly string[]).includes(rolInput)
      ? (rolInput as RolUsuario)
      : 'vendedor';

    console.log(`\nZonas disponibles: ${ZONAS_COMERCIALES.join(', ')}`);
    const zonaInput = (await rl.question('Zona comercial (opcional, Enter para omitir): ')).trim();
    const zona: ZonaComercial | undefined = (ZONAS_COMERCIALES as readonly string[]).includes(zonaInput)
      ? (zonaInput as ZonaComercial)
      : undefined;

    const departamento = (await rl.question('Departamento (opcional): ')).trim() || undefined;

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const modulosPermitidos: IdModulo[] = obtenerModulosPorDefectoRol(rol);

    const nuevoUsuario: Usuario = {
      id: `usr_${Date.now()}`,
      nombre,
      usuario,
      email,
      passwordHash,
      rol,
      zona,
      departamento,
      estado: 'activo',
      modulosPermitidos,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null,
    };

    const validacion = esquemaUsuario.safeParse(nuevoUsuario);
    if (!validacion.success) {
      const errores = validacion.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Datos inválidos:\n${errores}`);
    }

    await actualizarJsonSeguro<Usuario[]>('usuarios.json', [], (actuales) => {
      const existe = actuales.some(
        (u) => u.usuario.toLowerCase() === usuario || u.email.toLowerCase() === email
      );
      if (existe) {
        throw new Error(`Ya existe un usuario con el identificador "${usuario}" o correo "${email}".`);
      }
      return [...actuales, validacion.data];
    });

    console.log('\n✅ Usuario creado exitosamente en data/usuarios.json:');
    console.log(`   ID:       ${nuevoUsuario.id}`);
    console.log(`   Nombre:   ${nuevoUsuario.nombre}`);
    console.log(`   Usuario:  ${nuevoUsuario.usuario}`);
    console.log(`   Email:    ${nuevoUsuario.email}`);
    console.log(`   Rol:      ${nuevoUsuario.rol}`);
    console.log(`   Módulos:  ${nuevoUsuario.modulosPermitidos.join(', ')}`);
    console.log(`   Hash:     ${nuevoUsuario.passwordHash.slice(0, 25)}...\n`);
  } catch (error) {
    console.error('\n❌ Error al crear usuario:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

void main();
