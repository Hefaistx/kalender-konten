'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StatusBadge from '../../components/StatusBadge';
import { formatPicLabel, formatUserLabel } from '@/lib/pic-utils';

const USER_ROLES: Record<string, string> = {
  '1': 'tim_multimedia', '2': 'tim_sosmed', '3': 'tim_sosmed', '4': 'manager', '5': 'head',
};

type Properti = { id: number; nama: string; kota: string };
type Upload = { id: number; tipe: string; bukti: string; uploader_name: string; created_at: string };
type Approval = { id: number; tipe: string; action: string; alasan: string; approver_name: string; created_at: string };
type TargetInsight = { id: number; nama: string };
type Konten = {
  id: number; judul: string; tanggal_tayang: string; tanggal_produksi: string;
  workflow_status: string;
  pic_name: string; akun_nama: string; platform_nama: string; jenis_konten_nama: string;
  tipe_konten_nama: string;
  target_insights: TargetInsight[];
  tipe_lokasi: string; lokasi_kota: string;
  catatan: string; referensi_konten: string; materi: string;
  properti: Properti[]; uploads: Upload[]; approvals: Approval[];
};

function LokasiSummary({ tipe, kota, properti }: { tipe: string; kota: string; properti: Properti[] }) {
  if (!tipe) return <span className="text-slate-400">-</span>;
  if (tipe === 'global') return <span className="text-slate-800">Global — semua properti</span>;
  if (tipe === 'kota') return <span className="text-slate-800">Kota {kota} — semua properti</span>;
  if (tipe === 'lokasi') return (
    <span className="text-slate-800">{properti[0]?.nama ?? '-'}
      <span className="text-slate-400 font-normal text-xs ml-1">({properti[0]?.kota})</span>
    </span>
  );
  if (tipe === 'segmented') {
    return (
      <div>
        <span className="text-slate-800">Segmented · {kota}</span>
        <ul className="mt-1.5 space-y-1">
          {properti.map(p => (
            <li key={p.id} className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-slate-400 rounded-full shrink-0" />
              {p.nama}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <span>{tipe}</span>;
}

function formatDateDMY(s: string | null | undefined): string {
  if (!s) return '-';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function formatDateTime(s: string): string {
  const d = new Date(s);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()} ${hh}:${min}:${ss}`;
}

function buildPlatformStr(platform: string | null, tipe: string | null): string {
  if (!platform) return '-';
  const label = !tipe ? null
    : tipe === 'global' ? 'Global'
    : tipe === 'kota' ? 'Kota'
    : tipe === 'lokasi' ? 'Lokasi'
    : tipe === 'segmented' ? 'Segmented'
    : null;
  if (!label) return platform;
  return platform.split(', ').map(p => `${p} - ${label}`).join(', ');
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-slate-800 font-medium">{value || '-'}</p>
    </div>
  );
}

export default function KontenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backTo = searchParams.get('from') === 'tugas' ? '/tugas' : '/konten';
  const [konten, setKonten] = useState<Konten | null>(null);
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectAlasan, setRejectAlasan] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/konten/${id}`);
    if (res.ok) setKonten(await res.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const uid = localStorage.getItem('active_user_id') ?? '';
    setUserId(uid);
    setRole(USER_ROLES[uid] ?? '');
    const handler = () => {
      const uid2 = localStorage.getItem('active_user_id') ?? '';
      setUserId(uid2);
      setRole(USER_ROLES[uid2] ?? '');
    };
    window.addEventListener('user-changed', handler);
    return () => window.removeEventListener('user-changed', handler);
  }, []);

  async function doApprove() {
    setApproveLoading(true);
    try {
      await fetch(`/api/konten/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', alasan: '', approver_user_id: userId }),
      });
      load();
    } finally {
      setApproveLoading(false);
    }
  }


  async function doReject() {
    if (!rejectAlasan.trim()) { setRejectError('Alasan wajib diisi'); return; }
    setRejectLoading(true);
    const res = await fetch(`/api/konten/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', alasan: rejectAlasan.trim(), approver_user_id: userId }),
    });
    setRejectLoading(false);
    if (!res.ok) { setRejectError((await res.json()).error ?? 'Gagal submit'); return; }
    setRejectModal(false);
    setRejectAlasan('');
    setRejectError('');
    load();
  }

  if (!konten) return (
    <div className="flex items-center gap-3 text-slate-400 text-sm pt-10">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      Memuat...
    </div>
  );

  const status = konten.workflow_status;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.push(backTo)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Kembali
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{konten.judul}</h1>
            <div className="mt-2"><StatusBadge status={status} /></div>
          </div>
          <div className="flex gap-2 shrink-0">
            {['to_do', 'on_progress'].includes(status) && (
              <button
                onClick={() => router.push(`/konten/${id}/edit`)}
                className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
            <button
              onClick={async () => {
                if (!window.confirm('Hapus konten ini? Tindakan tidak bisa dibatalkan.')) return;
                await fetch(`/api/konten/${id}`, { method: 'DELETE' });
                router.push('/konten');
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>

      {/* Detail Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Detail Konten</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <Detail label="Tanggal Produksi" value={formatDateDMY(konten.tanggal_produksi)} />
          <Detail label="Tanggal Tayang" value={formatDateDMY(konten.tanggal_tayang)} />
          <Detail label="PIC" value={formatPicLabel(konten.pic_name)} />
          <Detail label="Akun" value={konten.akun_nama} />
          <Detail label="Platform" value={buildPlatformStr(konten.platform_nama, konten.tipe_lokasi)} />
          <Detail label="Jenis Konten" value={konten.jenis_konten_nama} />
          <Detail label="Konten" value={konten.tipe_konten_nama} />
          <div>
            <p className="text-slate-400 text-xs mb-1">Target Insight</p>
            {konten.target_insights?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {konten.target_insights.map(ti => (
                  <span key={ti.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {ti.nama}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-800 font-medium">-</p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-slate-400 text-xs mb-1.5">Lokasi</p>
            <div className="text-slate-800">
              <LokasiSummary tipe={konten.tipe_lokasi} kota={konten.lokasi_kota} properti={konten.properti} />
            </div>
          </div>
        </div>

        {konten.referensi_konten && (
          <div className="border-t border-slate-100 mt-5 pt-5">
            <p className="text-xs text-slate-400 mb-1">Referensi Konten</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{konten.referensi_konten}</p>
          </div>
        )}
        {konten.materi && (
          <div className="border-t border-slate-100 mt-5 pt-5">
            <p className="text-xs text-slate-400 mb-1">Materi</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{konten.materi}</p>
          </div>
        )}
        {konten.catatan && (
          <div className="border-t border-slate-100 mt-5 pt-5">
            <p className="text-xs text-slate-400 mb-1">Catatan</p>
            <p className="text-sm text-slate-700">{konten.catatan}</p>
          </div>
        )}
      </div>

      {/* Approval Action — visible for head/manager saat pending */}
      {(role === 'head' || role === 'manager') && status === 'pending_approval' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Menunggu Approval Anda</p>
          <p className="text-xs text-amber-600 mb-4">Bukti multimedia sudah diupload. Periksa riwayat upload di bawah, lalu beri keputusan.</p>
          <div className="flex gap-2">
            <button
              onClick={doApprove}
              disabled={approveLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {approveLoading ? 'Menyimpan...' : 'Approve'}
            </button>
            <button
              onClick={() => { setRejectModal(true); setRejectAlasan(''); setRejectError(''); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        </div>
      )}


      {/* Upload History */}
      {konten.uploads.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-700 text-sm mb-3">Riwayat Upload</h2>
          <div className="space-y-2">
            {konten.uploads.map(u => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm flex justify-between items-start gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${u.tipe === 'multimedia' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                      {u.tipe === 'multimedia' ? 'Multimedia' : 'Sosmed'}
                    </span>
                    <span className="text-slate-600 text-xs">{formatUserLabel(u.uploader_name)}</span>
                  </div>
                  {u.tipe === 'multimedia' && u.bukti.startsWith('data:image/') && (
                    <img src={u.bukti} alt="Bukti multimedia" className="mt-2 max-h-40 rounded-lg border border-slate-200 object-contain" />
                  )}
                  {u.tipe === 'multimedia' && !u.bukti.startsWith('data:image/') && (
                    <p className="text-slate-500 mt-1.5 text-xs">📄 File media (PDF)</p>
                  )}
                  {u.tipe === 'sosmed' && (
                    <a href={u.bukti.startsWith('http') ? u.bukti : `https://${u.bukti}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1.5 text-xs flex items-center gap-1 break-all">
                      🔗 {u.bukti.length > 60 ? u.bukti.slice(0, 60) + '...' : u.bukti}
                    </a>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-400 text-xs">{formatDateTime(u.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approval History */}
      {konten.approvals.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-700 text-sm mb-3">Riwayat Approval</h2>
          <div className="space-y-2">
            {konten.approvals.map(a => (
              <div key={a.id} className={`border rounded-xl px-4 py-3 text-sm shadow-sm ${a.action === 'approve' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`font-semibold ${a.action === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {a.action === 'approve' ? '✓ Approved' : '✗ Rejected'}
                    </span>
                    <span className="text-slate-400 text-xs ml-2">· {a.tipe} · {formatUserLabel(a.approver_name)}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{formatDateTime(a.created_at)}</span>
                </div>
                {a.alasan && <p className="text-slate-600 mt-1.5 text-xs italic">"{a.alasan}"</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setRejectModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Konfirmasi Reject</h2>
            {rejectError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{rejectError}</p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                rows={3}
                value={rejectAlasan}
                onChange={e => setRejectAlasan(e.target.value)}
                placeholder="Tuliskan alasan penolakan..."
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectModal(false)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={doReject}
                disabled={rejectLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 cursor-pointer transition-colors"
              >
                {rejectLoading ? 'Menyimpan...' : 'Konfirmasi Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
