import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const rows = await query(`
      SELECT k.*,
        mp.nama AS pic_name,
        a.nama  AS akun_nama,
        j.nama  AS jenis_konten_nama,
        tc.nama AS tipe_konten_nama,
        (SELECT STRING_AGG(plat.nama, ', ' ORDER BY plat.nama)
         FROM konten_platform kplat
         JOIN master_platform plat ON plat.id = kplat.platform_id
         WHERE kplat.konten_id = k.id) AS platform_nama
      FROM konten k
      LEFT JOIN master_pic mp ON mp.id = k.pic_id
      LEFT JOIN master_akun a ON a.id = k.akun_id
      LEFT JOIN master_jenis_konten j ON j.id = k.jenis_konten_id
      LEFT JOIN master_tipe_konten tc ON tc.id = k.tipe_konten_id
      WHERE k.id = $1
    `, [id]);

    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const platforms = await query<{ id: number }>(`
      SELECT platform_id AS id FROM konten_platform WHERE konten_id = $1
    `, [id]);
    const platform_ids = platforms.map(p => p.id);

    const targetInsights = await query(`
      SELECT ti.id, ti.nama
      FROM konten_target_insights kti
      JOIN master_target_insight ti ON ti.id = kti.target_insight_id
      WHERE kti.konten_id = $1
      ORDER BY ti.nama
    `, [id]);

    const properti = await query(`
      SELECT mp.id, mp.nama, mp.kota
      FROM konten_properti kp
      JOIN master_properti mp ON mp.id = kp.properti_id
      WHERE kp.konten_id = $1
      ORDER BY mp.kota, mp.nama
    `, [id]);

    const uploads = await query(`
      SELECT ku.*, u.name AS uploader_name
      FROM konten_uploads ku
      LEFT JOIN users u ON u.id = ku.uploader_user_id
      WHERE ku.konten_id = $1 ORDER BY ku.created_at
    `, [id]);

    const approvals = await query(`
      SELECT ka.*, u.name AS approver_name
      FROM konten_approvals ka
      LEFT JOIN users u ON u.id = ka.approver_user_id
      WHERE ka.konten_id = $1 ORDER BY ka.created_at
    `, [id]);

    return NextResponse.json({ ...rows[0], platform_ids, target_insights: targetInsights, properti, uploads, approvals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      judul, tanggal_tayang, tanggal_produksi,
      akun_id, platform_ids = [], jenis_konten_id, tipe_konten_id,
      target_insight_ids = [],
      catatan, tipe_lokasi, lokasi_kota,
      referensi_konten, materi, properti_ids = [],
      pic_id,
    } = body;

    if (!judul?.trim() || !tanggal_tayang) {
      return NextResponse.json({ error: 'Judul dan tanggal tayang wajib diisi' }, { status: 400 });
    }
    if (!akun_id || platform_ids.length === 0 || !jenis_konten_id || !tipe_lokasi) {
      return NextResponse.json({ error: 'Akun, Platform, Jenis Konten, dan Lokasi wajib dipilih' }, { status: 400 });
    }
    if (!pic_id) {
      return NextResponse.json({ error: 'PIC wajib dipilih' }, { status: 400 });
    }
    if (!Array.isArray(target_insight_ids) || target_insight_ids.length === 0) {
      return NextResponse.json({ error: 'Target Insight wajib dipilih minimal satu' }, { status: 400 });
    }

    await query(`
      UPDATE konten SET
        judul = $1, tanggal_tayang = $2, tanggal_produksi = $3,
        akun_id = $4,
        jenis_konten_id = $5, tipe_konten_id = $6,
        pic_id = $7,
        catatan = $8, tipe_lokasi = $9, lokasi_kota = $10,
        referensi_konten = $11, materi = $12
      WHERE id = $13
    `, [
      judul, tanggal_tayang,
      tanggal_produksi || null,
      akun_id || null,
      jenis_konten_id || null, tipe_konten_id || null,
      pic_id || null,
      catatan || null, tipe_lokasi || null,
      lokasi_kota || null, referensi_konten || null, materi || null, id,
    ]);

    await query(`DELETE FROM konten_platform WHERE konten_id = $1`, [id]);
    for (const pid of platform_ids) {
      await query(`INSERT INTO konten_platform (konten_id, platform_id) VALUES ($1,$2)`, [id, pid]);
    }

    await query(`DELETE FROM konten_target_insights WHERE konten_id = $1`, [id]);
    for (const tid of target_insight_ids) {
      await query(
        `INSERT INTO konten_target_insights (konten_id, target_insight_id) VALUES ($1, $2)`,
        [id, tid]
      );
    }

    await query(`DELETE FROM konten_properti WHERE konten_id = $1`, [id]);
    for (const pid of properti_ids) {
      await query(`INSERT INTO konten_properti (konten_id, properti_id) VALUES ($1, $2)`, [id, pid]);
    }

    return NextResponse.json({ id: Number(id) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

const ALLOWED_STATUSES = ['to_do', 'on_progress', 'done', 'cancelled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { workflow_status } = await req.json();
    if (!ALLOWED_STATUSES.includes(workflow_status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }
    const rows = await query<{ id: number }>(`UPDATE konten SET workflow_status = $1 WHERE id = $2 RETURNING id`, [workflow_status, id]);
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query(`DELETE FROM konten WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
