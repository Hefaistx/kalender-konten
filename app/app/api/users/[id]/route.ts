import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tipe_produksi } = await req.json();
  const rows = await query(
    'UPDATE users SET tipe_produksi=$1 WHERE id=$2 RETURNING id, name, role, tipe_produksi',
    [tipe_produksi || null, id]
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
