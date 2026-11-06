import bcrypt from 'bcryptjs';

const FACTOR_COSTO_BCRYPT = 10;

export async function hashearPassword(passwordPlano: string): Promise<string> {
  return bcrypt.hash(passwordPlano, FACTOR_COSTO_BCRYPT);
}

export async function verificarPassword(
  passwordPlano: string,
  hashAlmacenado: string
): Promise<boolean> {
  return bcrypt.compare(passwordPlano, hashAlmacenado);
}
