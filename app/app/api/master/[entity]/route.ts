import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TABLES: Record<string, string> = {
  'akun':           'master_akun',
  'platform':       'master_platform',
  'pic':            'master_pic',
  'target-insight': 'master_target_insight',
  'tipe-konten':    'master_tipe_konten',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;

  if (entity === 'jenis-konten') {
    const rows = await query(`
      SELECT j.id, j.nama,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'nama', p.nama) ORDER BY p.nama)
          FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS pics
      FROM master_jenis_konten j
      LEFT JOIN master_jenis_konten_pic jp ON jp.jenis_konten_id = j.id
      LEFT JOIN master_pic p ON p.id = jp.pic_id
      GROUP BY j.id, j.nama
      ORDER BY j.nama
    `);
    return NextResponse.json(rows);
  }

  const table = TABLES[entity];
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rows = await query(`SELECT id, nama FROM ${table} ORDER BY nama`);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const body = await req.json();
  const { nama } = body;
  if (!nama?.trim()) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  if (entity === 'jenis-konten') {
    const { pic_ids = [] } = body;
    const rows = await query(
      `INSERT INTO master_jenis_konten (nama) VALUES ($1) RETURNING *`,
      [nama.trim()]
    );
    const jk = rows[0] as { id: number };
    for (const pid of pic_ids) {
      await query(
        `INSERT INTO master_jenis_konten_pic (jenis_konten_id, pic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [jk.id, pid]
      );
    }
    return NextResponse.json(jk, { status: 201 });
  }

  const table = TABLES[entity];
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rows = await query(`INSERT INTO ${table} (nama) VALUES ($1) RETURNING *`, [nama.trim()]);
  return NextResponse.json(rows[0], { status: 201 });
}
