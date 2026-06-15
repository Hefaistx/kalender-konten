import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const kota = req.nextUrl.searchParams.get('kota');
  const rows = kota
    ? await query(`SELECT * FROM master_properti WHERE kota=$1 ORDER BY nama`, [kota])
    : await query(`SELECT * FROM master_properti ORDER BY kota, nama`);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { nama, kota } = await req.json();
  if (!nama?.trim() || !kota?.trim()) {
    return NextResponse.json({ error: 'Nama dan kota wajib diisi' }, { status: 400 });
  }
  const rows = await query(
    `INSERT INTO master_properti (nama, kota) VALUES ($1,$2) RETURNING *`,
    [nama.trim(), kota.trim()]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
