import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nama, kota } = await req.json();
  if (!nama?.trim() || !kota?.trim()) {
    return NextResponse.json({ error: 'Nama dan kota wajib diisi' }, { status: 400 });
  }
  const rows = await query(
    `UPDATE master_properti SET nama=$1, kota=$2 WHERE id=$3 RETURNING *`,
    [nama.trim(), kota.trim(), id]
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await query(`DELETE FROM master_properti WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
