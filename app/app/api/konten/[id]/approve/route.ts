import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TRANSITIONS: Record<string, Record<string, { tipe: string; approve: string; reject: string }>> = {
  head: {
    pending_approval: { tipe: 'multimedia', approve: 'waiting_publish', reject: 'rejected' },
  },
  manager: {
    pending_approval: { tipe: 'multimedia', approve: 'waiting_publish', reject: 'rejected' },
  },
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, alasan, approver_user_id } = await req.json();

    if (!approver_user_id) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 400 });
    if (action === 'reject' && !alasan?.trim()) {
      return NextResponse.json({ error: 'Alasan reject wajib diisi' }, { status: 400 });
    }

    const kontenRows = await query<{ workflow_status: string }>(`SELECT workflow_status FROM konten WHERE id=$1`, [id]);
    if (!kontenRows.length) return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });

    const approverRows = await query<{ role: string }>(`SELECT role FROM users WHERE id=$1`, [approver_user_id]);
    if (!approverRows.length) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

    const approverRole = approverRows[0].role;
    if (approverRole !== 'head' && approverRole !== 'manager') {
      return NextResponse.json({ error: 'Hanya head atau manager yang bisa approve/reject' }, { status: 403 });
    }

    const status = kontenRows[0].workflow_status;
    const transition = TRANSITIONS[approverRole]?.[status];
    if (!transition) {
      return NextResponse.json({ error: 'Status tidak valid untuk approval ini' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? transition.approve : transition.reject;

    await query(
      `INSERT INTO konten_approvals (konten_id, approver_user_id, tipe, action, alasan) VALUES ($1,$2,$3,$4,$5)`,
      [id, approver_user_id, transition.tipe, action, alasan || null]
    );

    await query(`UPDATE konten SET workflow_status=$1 WHERE id=$2`, [newStatus, id]);

    return NextResponse.json({ ok: true, new_status: newStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
