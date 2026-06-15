import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TABLES: Record<string, string> = {
  'akun':           'master_akun',
  'platform':       'master_platform',
  'pic':            'master_pic',
  'target-insight': 'master_target_insight',
  'tipe-konten':    'master_tipe_konten',
  'lokasi':         'master_lokasi',
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ entity: string; itemId: string }> }) {
  const { entity, itemId } = await params;
  const body = await req.json();
  const { nama } = body;
  if (!nama?.trim()) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  if (entity === 'jenis-konten') {
    const { pic_ids = [] } = body;
    const rows = await query(
      `UPDATE master_jenis_konten SET nama=$1 WHERE id=$2 RETURNING *`,
      [nama.trim(), itemId]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await query(`DELETE FROM master_jenis_konten_pic WHERE jenis_konten_id=$1`, [itemId]);
    for (const pid of pic_ids) {
      await query(
        `INSERT INTO master_jenis_konten_pic (jenis_konten_id, pic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [itemId, pid]
      );
    }
    return NextResponse.json(rows[0]);
  }

  const table = TABLES[entity];
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rows = await query(`UPDATE ${table} SET nama=$1 WHERE id=$2 RETURNING *`, [nama.trim(), itemId]);
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ entity: string; itemId: string }> }) {
  const { entity, itemId } = await params;

  if (entity === 'jenis-konten') {
    await query(`DELETE FROM master_jenis_konten WHERE id=$1`, [itemId]);
    return NextResponse.json({ ok: true });
  }

  const table = TABLES[entity];
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await query(`DELETE FROM ${table} WHERE id=$1`, [itemId]);
  return NextResponse.json({ ok: true });
}
