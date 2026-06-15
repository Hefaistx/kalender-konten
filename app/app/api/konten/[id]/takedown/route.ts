import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user_id } = await req.json();

    if (!user_id) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 400 });

    const userRows = await query(`SELECT role FROM users WHERE id=$1`, [user_id]);
    if (!userRows.length) return NextResponse.json({ error: 'User tidak valid' }, { status: 403 });
    const userRole = (userRows[0] as { role: string }).role;

    if (!['head', 'manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Hanya head atau manager yang dapat melakukan takedown' }, { status: 403 });
    }

    const rows = await query(`SELECT workflow_status FROM konten WHERE id=$1`, [id]);
    if (!rows.length) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
    const status = (rows[0] as { workflow_status: string }).workflow_status;

    if (status !== 'done') {
      return NextResponse.json({ error: 'Takedown hanya bisa dilakukan untuk konten berstatus Done' }, { status: 400 });
    }

    await query(`UPDATE konten SET workflow_status='taken_down' WHERE id=$1`, [id]);
    return NextResponse.json({ ok: true, new_status: 'taken_down' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
