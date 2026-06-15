import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from '@neondatabase/serverless';

export async function GET() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sql = readFileSync(join(process.cwd(), 'lib/migrate-platform.sql'), 'utf-8');
    const statements = sql
      .replace(/--[^\n]*/g, '')  // strip inline comments before splitting
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
    return NextResponse.json({ ok: true, message: 'Migration berhasil.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    await pool.end();
  }
}
