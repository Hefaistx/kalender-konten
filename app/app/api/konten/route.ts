import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(`
      SELECT k.*,
        mp.nama AS pic_name,
        a.nama  AS akun_nama,
        j.nama  AS jenis_konten_nama,
        tc.nama AS tipe_konten_nama,
        (SELECT STRING_AGG(plat.nama, ', ' ORDER BY plat.nama)
         FROM konten_platform kplat
         JOIN master_platform plat ON plat.id = kplat.platform_id
         WHERE kplat.konten_id = k.id) AS platform_nama,
        STRING_AGG(ti.nama, ', ' ORDER BY ti.nama) AS target_insight_nama,
        (SELECT STRING_AGG(mp2.nama, ', ' ORDER BY mp2.nama)
         FROM konten_properti kp2
         JOIN master_properti mp2 ON mp2.id = kp2.properti_id
         WHERE kp2.konten_id = k.id) AS properti_nama,
        (SELECT ARRAY_AGG(kp3.properti_id ORDER BY kp3.properti_id)
         FROM konten_properti kp3
         WHERE kp3.konten_id = k.id) AS properti_ids
      FROM konten k
      LEFT JOIN master_pic mp ON mp.id = k.pic_id
      LEFT JOIN master_akun a ON a.id = k.akun_id
      LEFT JOIN master_jenis_konten j ON j.id = k.jenis_konten_id
      LEFT JOIN master_tipe_konten tc ON tc.id = k.tipe_konten_id
      LEFT JOIN konten_target_insights kti ON kti.konten_id = k.id
      LEFT JOIN master_target_insight ti ON ti.id = kti.target_insight_id
      GROUP BY k.id, mp.nama, a.nama, j.nama, tc.nama
      ORDER BY k.created_at ASC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      judul, tanggal_tayang, tanggal_produksi,
      akun_id, platform_ids, jenis_konten_id, tipe_konten_id,
      target_insight_ids,
      tipe_lokasi, lokasi_kota, properti_ids,
      pic_id, catatan, referensi_konten, materi,
    } = body;

    if (!judul?.trim() || !tanggal_tayang) {
      return NextResponse.json({ error: 'Judul dan tanggal tayang wajib diisi' }, { status: 400 });
    }
    if (!akun_id || !Array.isArray(platform_ids) || platform_ids.length === 0 || !jenis_konten_id || !tipe_lokasi) {
      return NextResponse.json({ error: 'Akun, Platform, Jenis Konten, dan Lokasi wajib dipilih' }, { status: 400 });
    }
    if (!pic_id) {
      return NextResponse.json({ error: 'PIC wajib dipilih' }, { status: 400 });
    }
    if (!Array.isArray(target_insight_ids) || target_insight_ids.length === 0) {
      return NextResponse.json({ error: 'Target Insight wajib dipilih minimal satu' }, { status: 400 });
    }

    const rows = await query(
      `INSERT INTO konten
         (judul, tanggal_tayang, tanggal_produksi,
          akun_id, jenis_konten_id, tipe_konten_id,
          pic_id, tipe_lokasi, lokasi_kota,
          catatan, referensi_konten, materi, workflow_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        judul.trim(), tanggal_tayang,
        tanggal_produksi || null,
        akun_id || null,
        jenis_konten_id || null, tipe_konten_id || null,
        pic_id,
        tipe_lokasi || null, lokasi_kota || null,
        catatan || null, referensi_konten || null, materi || null,
        'to_do',
      ]
    );

    const konten = rows[0] as { id: number };

    for (const pid of platform_ids) {
      await query(`INSERT INTO konten_platform (konten_id, platform_id) VALUES ($1,$2)`, [konten.id, pid]);
    }

    for (const tid of target_insight_ids) {
      await query(
        `INSERT INTO konten_target_insights (konten_id, target_insight_id) VALUES ($1,$2)`,
        [konten.id, tid]
      );
    }

    if (Array.isArray(properti_ids) && properti_ids.length > 0) {
      for (const pid of properti_ids) {
        await query(`INSERT INTO konten_properti (konten_id, properti_id) VALUES ($1,$2)`, [konten.id, pid]);
      }
    }

    return NextResponse.json(konten, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
