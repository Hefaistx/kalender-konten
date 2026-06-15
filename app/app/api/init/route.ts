import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from '@neondatabase/serverless';

async function runInit() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const schema = readFileSync(join(process.cwd(), 'lib/schema.sql'), 'utf-8');
    const seed = readFileSync(join(process.cwd(), 'lib/seed.sql'), 'utf-8');
    const statements = [...schema.split(';'), ...seed.split(';')]
      .map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
    return NextResponse.json({ ok: true, message: 'Database initialized and seeded.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function GET() {
  return runInit();
}

export async function POST() {
  return runInit();
}
