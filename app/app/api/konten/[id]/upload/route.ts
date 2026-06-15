import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MULTIMEDIA_STATUSES = ['on_progress', 'rejected'];
const SOSMED_STATUSES = ['waiting_publish', 'rejected_publish'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tipe, bukti, uploader_user_id } = await req.json();

    if (!bukti) return NextResponse.json({ error: 'Bukti wajib diisi' }, { status: 400 });
    if (!uploader_user_id) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 400 });

    const rows = await query(`SELECT workflow_status FROM konten WHERE id=$1`, [id]);
    if (!rows.length) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
    const status = (rows[0] as { workflow_status: string }).workflow_status;

    if (tipe === 'multimedia' && !MULTIMEDIA_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid untuk upload multimedia' }, { status: 400 });
    }
    if (tipe === 'sosmed' && !SOSMED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid untuk upload sosmed' }, { status: 400 });
    }

    const newStatus = tipe === 'multimedia'
      ? 'pending_approval'
      : 'done';

    await query(
      `INSERT INTO konten_uploads (konten_id, uploader_user_id, tipe, bukti) VALUES ($1,$2,$3,$4)`,
      [id, uploader_user_id, tipe, bukti]
    );
    await query(`UPDATE konten SET workflow_status=$1 WHERE id=$2`, [newStatus, id]);
    if (tipe === 'sosmed') {
      await query(`UPDATE konten SET link_konten=$1 WHERE id=$2`, [bukti, id]);
    }

    return NextResponse.json({ ok: true, new_status: newStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tipe } = await req.json();

    const rows = await query(`SELECT workflow_status FROM konten WHERE id=$1`, [id]);
    if (!rows.length) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
    const status = (rows[0] as { workflow_status: string }).workflow_status;

    const requiredStatus = tipe === 'multimedia'
      ? 'pending_approval'
      : 'done';
    if (status !== requiredStatus) {
      return NextResponse.json({ error: 'Tidak dapat menghapus upload pada status ini' }, { status: 400 });
    }

    await query(`
      DELETE FROM konten_uploads WHERE id = (
        SELECT id FROM konten_uploads WHERE konten_id=$1 AND tipe=$2 ORDER BY created_at DESC LIMIT 1
      )
    `, [id, tipe]);

    const rejections = await query(
      `SELECT id FROM konten_approvals WHERE konten_id=$1 AND tipe='multimedia' AND action='reject'`,
      [id]
    );
    const revertStatus = tipe === 'multimedia'
      ? (rejections.length > 0 ? 'rejected' : 'on_progress')
      : 'waiting_publish';

    await query(`UPDATE konten SET workflow_status=$1 WHERE id=$2`, [revertStatus, id]);
    if (tipe === 'sosmed') {
      await query(`UPDATE konten SET link_konten=NULL WHERE id=$1`, [id]);
    }
    return NextResponse.json({ ok: true, new_status: revertStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tipe, bukti } = await req.json();

    if (!bukti?.trim()) return NextResponse.json({ error: 'Link wajib diisi' }, { status: 400 });

    const rows = await query(`SELECT workflow_status FROM konten WHERE id=$1`, [id]);
    if (!rows.length) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
    const status = (rows[0] as { workflow_status: string }).workflow_status;

    const requiredStatus = tipe === 'multimedia'
      ? 'pending_approval'
      : 'done';
    if (status !== requiredStatus) {
      return NextResponse.json({ error: 'Tidak dapat mengedit upload pada status ini' }, { status: 400 });
    }

    await query(`
      UPDATE konten_uploads SET bukti=$1 WHERE id = (
        SELECT id FROM konten_uploads WHERE konten_id=$2 AND tipe=$3 ORDER BY created_at DESC LIMIT 1
      )
    `, [bukti.trim(), id, tipe]);
    if (tipe === 'sosmed') {
      await query(`UPDATE konten SET link_konten=$1 WHERE id=$2`, [bukti.trim(), id]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
