import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function iniciarProceso(nombre, color, args) {
  const proc = spawn(npmCmd, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
  });

  const prefijo = `${color}[${nombre}]\x1b[0m `;
  proc.stdout?.on('data', (chunk) => {
    process.stdout.write(
      String(chunk)
        .split('\n')
        .map((line, i, arr) => (i === arr.length - 1 && !line ? '' : `${prefijo}${line}`))
        .join('\n')
    );
  });
  proc.stderr?.on('data', (chunk) => {
    process.stderr.write(
      String(chunk)
        .split('\n')
        .map((line, i, arr) => (i === arr.length - 1 && !line ? '' : `${prefijo}${line}`))
        .join('\n')
    );
  });

  return proc;
}

const backend = iniciarProceso('NestJS :4000', '\x1b[36m', ['run', 'start:dev', '--prefix', 'backend']);
const frontend = iniciarProceso('NextJS :3000', '\x1b[32m', ['run', 'dev']);

function detenerTodo() {
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', detenerTodo);
process.on('SIGTERM', detenerTodo);
