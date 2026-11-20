import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const dbDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'sifygsa_db.json');

const ensureDbFile = () => {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify({ updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  }
};

export async function GET() {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(dbPath, 'utf-8');
    return NextResponse.json(JSON.parse(raw || '{}'));
  } catch {
    return NextResponse.json(
      { error: 'No se pudo leer data/sifygsa_db.json' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureDbFile();
    const existingRaw = fs.readFileSync(dbPath, 'utf-8');
    const existing = JSON.parse(existingRaw || '{}') as Record<string, unknown>;
    const patch = (await request.json()) as Record<string, unknown>;
    const merged = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, updatedAt: merged.updatedAt });
  } catch {
    return NextResponse.json(
      { error: 'JSON inválido al guardar en data/sifygsa_db.json' },
      { status: 400 }
    );
  }
}
