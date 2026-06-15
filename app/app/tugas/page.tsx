'use client';

import { useEffect, useRef, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { formatPicLabel, formatUserLabel, PIC_JABATAN } from '@/lib/pic-utils';

const PIC_FILTER_OPTIONS = Object.keys(PIC_JABATAN);
const selCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none';
const inpCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

type KontenItem = {
  id: number;
  judul: string;
  materi: string | null;
  tanggal_tayang: string;
  workflow_status: string;
  platform_nama: string | null;
  akun_nama: string | null;
  pic_name: string | null;
  jenis_konten_nama: string | null;
  tipe_lokasi: string | null;
  lokasi_kota: string | null;
  properti_nama: string | null;
  target_insight_nama: string | null;
};

type Platform = { id: number; nama: string };

type FilterState = {
  platform: string;
  tanggalDari: string; tanggalSampai: string;
  akun: string; jenisKonten: string; pic: string;
  targetInsight: string; materi: string; lokasi: string;
};
const EMPTY_FILTER: FilterState = {
  platform: '', tanggalDari: '', tanggalSampai: '',
  akun: '', jenisKonten: '', pic: '', targetInsight: '', materi: '', lokasi: '',
};

type KontenDetail = {
  id: number;
  materi: string | null;
  judul: string;
  tanggal_tayang: string;
  tanggal_produksi: string | null;
  workflow_status: string;
  akun_nama: string | null;
  platform_nama: string | null;
  jenis_konten_nama: string | null;
  tipe_konten_nama: string | null;
  pic_name: string | null;
  tipe_lokasi: string | null;
  lokasi_kota: string | null;
  catatan: string | null;
  referensi_konten: string | null;
  target_insights: { id: number; nama: string }[];
  properti: { id: number; nama: string; kota: string }[];
  uploads: { id: number; tipe: string; bukti: string; uploader_name: string; created_at: string }[];
};

const USER_MAP: Record<string, string> = {
  '1': 'tim_multimedia', '2': 'tim_sosmed', '3': 'tim_sosmed', '4': 'manager', '5': 'head',
};

const ROLE_STATUSES: Record<string, string[]> = {
  head: ['pending_approval'],
  manager: ['pending_approval'],
};

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

function buildLokasiStr(tipe: string | null, kota: string | null, properti_nama: string | null): string {
  if (!tipe) return '-';
  if (tipe === 'global') return 'Global';
  if (tipe === 'kota') return kota ?? 'Kota';
  if (tipe === 'lokasi') return properti_nama?.split(', ')[0] ?? '-';
  if (tipe === 'segmented') return properti_nama || kota || 'Segmented';
  return tipe;
}

function buildLokasi(tipe: string | null, kota: string | null, properti: { nama: string }[]): string {
  if (!tipe) return '-';
  if (tipe === 'global') return 'Global';
  if (tipe === 'kota') return kota ?? 'Kota';
  if (tipe === 'lokasi') return properti[0]?.nama ?? '-';
  if (tipe === 'segmented') return properti.map(p => p.nama).join(', ') || kota || 'Segmented';
  return tipe;
}

function toLocalDateStr(s: string | null | undefined): string {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ChevronDown() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DateRangePicker({ dari, sampai, onDariChange, onSampaiChange }: {
  dari: string; sampai: string;
  onDariChange: (v: string) => void; onSampaiChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const selecting = !!dari && !sampai;
  useEffect(() => {
    function handleOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewYear, viewMonth, i + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })];
  function pickDate(ds: string) {
    if (!dari || (dari && sampai)) { onDariChange(ds); onSampaiChange(''); }
    else if (ds < dari) { onDariChange(ds); onSampaiChange(''); }
    else { onSampaiChange(ds); setOpen(false); }
  }
  const label = dari ? (sampai ? `${dari} – ${sampai}` : `${dari} – ...`) : 'Pilih rentang tanggal';
  const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-left text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {label}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} className="p-1 hover:bg-slate-100 rounded">‹</button>
            <span className="text-sm font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} className="p-1 hover:bg-slate-100 rounded">›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {['M','S','S','R','K','J','S'].map((d, i) => <div key={i} className="text-center text-xs text-slate-400 font-medium py-0.5">{d}</div>)}
            {cells.map((ds, idx) => {
              const isFrom = ds === dari; const isTo = ds === sampai;
              const inRange = ds && dari && sampai ? ds > dari && ds < sampai : ds && dari && !sampai && hovered && ds > dari && ds < hovered ? true : false;
              return (
                <div key={idx} onClick={() => ds && pickDate(ds)}
                  onMouseEnter={() => selecting && ds && setHovered(ds)}
                  onMouseLeave={() => setHovered(null)}
                  className={`text-center text-xs py-1 rounded cursor-pointer select-none
                    ${!ds ? '' : isFrom || isTo ? 'bg-blue-600 text-white font-bold' : inRange ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                  <div className="relative mt-0.5">{ds ? new Date(ds + 'T00:00').getDate() : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateDMY(s: string | null | undefined) {
  if (!s) return '-';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function formatDateTime(s: string | null | undefined) {
  if (!s) return '-';
  const d = new Date(s);
  const date = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '-'}</p>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ApprovalPage() {
  const [list, setList] = useState<KontenItem[]>([]);
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<FilterState>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(EMPTY_FILTER);
  const [allJenisKonten, setAllJenisKonten] = useState<string[]>([]);
  const [allAkun, setAllAkun] = useState<string[]>([]);
  const [allTargetInsight, setAllTargetInsight] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [approveLoading, setApproveLoading] = useState<Set<number>>(new Set());
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null);
  const [rejectAlasan, setRejectAlasan] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const [detailLoading, setDetailLoading] = useState<number | null>(null);
  const [detailModal, setDetailModal] = useState<KontenDetail | null>(null);

  function loadData(uid: string) {
    setUserId(uid);
    setRole(USER_MAP[uid] ?? '');
    fetch('/api/konten').then(r => r.json()).then(setList);
  }

  useEffect(() => {
    const uid = localStorage.getItem('active_user_id') ?? '';
    loadData(uid);
    fetch('/api/master/platform').then(r => r.ok ? r.json() : []).then(setPlatforms).catch(console.error);
    fetch('/api/master/jenis-konten').then(r => r.ok ? r.json() : []).then((d: { nama: string }[]) => setAllJenisKonten(d.map(j => j.nama))).catch(console.error);
    fetch('/api/master/akun').then(r => r.ok ? r.json() : []).then((d: { nama: string }[]) => setAllAkun(d.map(a => a.nama))).catch(console.error);
    fetch('/api/master/target-insight').then(r => r.ok ? r.json() : []).then((d: { nama: string }[]) => setAllTargetInsight(d.map(t => t.nama))).catch(console.error);
    function handler() {
      const uid2 = localStorage.getItem('active_user_id') ?? '';
      loadData(uid2);
    }
    window.addEventListener('user-changed', handler);
    return () => window.removeEventListener('user-changed', handler);
  }, []);

  function refresh() {
    fetch('/api/konten').then(r => r.json()).then(setList);
  }

  async function doLihatDetail(id: number) {
    setDetailLoading(id);
    const res = await fetch(`/api/konten/${id}`);
    setDetailLoading(null);
    if (!res.ok) return;
    setDetailModal(await res.json());
  }

  async function doApprove(id: number) {
    if (approveLoading.has(id)) return;
    setApproveLoading(prev => new Set(prev).add(id));
    try {
      await fetch(`/api/konten/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', alasan: '', approver_user_id: userId }),
      });
      refresh();
      setDetailModal(null);
    } finally {
      setApproveLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function doReject() {
    if (!rejectModal) return;
    if (!rejectAlasan.trim()) { setRejectError('Alasan wajib diisi'); return; }
    setRejectLoading(true);
    const res = await fetch(`/api/konten/${rejectModal.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', alasan: rejectAlasan.trim(), approver_user_id: userId }),
    });
    setRejectLoading(false);
    if (!res.ok) { setRejectError((await res.json()).error ?? 'Gagal submit'); return; }
    setRejectModal(null);
    setRejectAlasan('');
    setRejectError('');
    setDetailModal(null);
    refresh();
  }

  const validStatuses = ROLE_STATUSES[role] ?? [];
  const safeList = Array.isArray(list) ? list : [];
  const displayTasks = safeList.filter(k => validStatuses.includes(k.workflow_status));

  const lokasiOptions = [...new Set(displayTasks.map(k => buildLokasiStr(k.tipe_lokasi, k.lokasi_kota, k.properti_nama)).filter(l => l !== '-'))].sort();

  const filteredTasks = displayTasks.filter(k => {
    const f = appliedFilter;
    if (f.platform && k.platform_nama !== f.platform) return false;
    if (f.tanggalDari && toLocalDateStr(k.tanggal_tayang) < f.tanggalDari) return false;
    if (f.tanggalSampai && toLocalDateStr(k.tanggal_tayang) > f.tanggalSampai) return false;
    if (f.akun && k.akun_nama !== f.akun) return false;
    if (f.jenisKonten && k.jenis_konten_nama !== f.jenisKonten) return false;
    if (f.pic && k.pic_name !== f.pic) return false;
    if (f.targetInsight && !k.target_insight_nama?.split(', ').includes(f.targetInsight)) return false;
    if (f.materi && !k.materi?.toLowerCase().includes(f.materi.toLowerCase())) return false;
    if (f.lokasi && buildLokasiStr(k.tipe_lokasi, k.lokasi_kota, k.properti_nama) !== f.lokasi) return false;
    return true;
  });

  const activeFilterCount = Object.values(appliedFilter).filter(Boolean).length;

  const countByAkun = displayTasks.reduce<Record<string, number>>((acc, k) => {
    const key = k.akun_nama ?? '—'; acc[key] = (acc[key] ?? 0) + 1; return acc;
  }, {});
  const byAkun = allAkun.length > 0
    ? allAkun.map(nama => [nama, countByAkun[nama] ?? 0] as [string, number])
    : Object.entries(countByAkun).sort((a, b) => b[1] - a[1]);

  const countByJenis = displayTasks.reduce<Record<string, number>>((acc, k) => {
    const key = k.jenis_konten_nama ?? '—'; acc[key] = (acc[key] ?? 0) + 1; return acc;
  }, {});
  const byJenis = allJenisKonten.length > 0
    ? allJenisKonten.map(nama => [nama, countByJenis[nama] ?? 0] as [string, number])
    : Object.entries(countByJenis).sort((a, b) => b[1] - a[1]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedTasks = filteredTasks.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700">Belum login</p>
        <p className="text-sm text-slate-400 mt-1">Pilih user lewat sidebar terlebih dahulu.</p>
      </div>
    );
  }

  if (role !== 'head' && role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700">Akses Ditolak</p>
        <p className="text-sm text-slate-400 mt-1">Halaman ini hanya untuk Head dan Manager.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Approval</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {displayTasks.length > 0
            ? `${displayTasks.length} konten menunggu approval`
            : 'Tidak ada konten menunggu approval'}
        </p>
      </div>

      {/* Filter accordion */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-5">
        <button
          onClick={() => setFilterOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V19l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">{activeFilterCount}</span>
            )}
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${filterOpen ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        {filterOpen && (
          <div className="border-t border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Akun</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.akun} onChange={e => setPendingFilter(f => ({ ...f, akun: e.target.value }))}>
                    <option value="">Semua</option>
                    {allAkun.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Jenis Konten</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.jenisKonten} onChange={e => setPendingFilter(f => ({ ...f, jenisKonten: e.target.value }))}>
                    <option value="">Semua</option>
                    {allJenisKonten.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">PIC</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.pic} onChange={e => setPendingFilter(f => ({ ...f, pic: e.target.value }))}>
                    <option value="">Semua</option>
                    {PIC_FILTER_OPTIONS.map(name => <option key={name} value={name}>{formatPicLabel(name)}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Target Insight</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.targetInsight} onChange={e => setPendingFilter(f => ({ ...f, targetInsight: e.target.value }))}>
                    <option value="">Semua</option>
                    {allTargetInsight.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Range Tanggal Tayang</p>
                <DateRangePicker
                  dari={pendingFilter.tanggalDari} sampai={pendingFilter.tanggalSampai}
                  onDariChange={v => setPendingFilter(f => ({ ...f, tanggalDari: v }))}
                  onSampaiChange={v => setPendingFilter(f => ({ ...f, tanggalSampai: v }))}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Lokasi</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.lokasi} onChange={e => setPendingFilter(f => ({ ...f, lokasi: e.target.value }))}>
                    <option value="">Semua</option>
                    {lokasiOptions.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Platform</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.platform} onChange={e => setPendingFilter(f => ({ ...f, platform: e.target.value }))}>
                    <option value="">Semua Platform</option>
                    {platforms.map(p => <option key={p.id} value={p.nama}>{p.nama}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Materi</p>
                <input type="text" className={inpCls} placeholder="Cari materi..."
                  value={pendingFilter.materi} onChange={e => setPendingFilter(f => ({ ...f, materi: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => { setAppliedFilter(pendingFilter); setCurrentPage(1); }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Terapkan
              </button>
              <button onClick={() => { setPendingFilter(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER); setCurrentPage(1); }}
                className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {displayTasks.length > 0 && (
        <div className="mb-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Summary:</p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-700 text-white font-medium">
              Semua <span className="font-bold">({displayTasks.length})</span>
            </span>
            <span className="w-px bg-slate-200 self-stretch shrink-0" />
            {byAkun.map(([akun, count]) => (
              <span key={akun} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 font-medium">
                {akun} <span className="font-bold text-slate-900">({count})</span>
              </span>
            ))}
            <span className="w-px bg-slate-200 self-stretch shrink-0" />
            {byJenis.map(([jenis, count]) => (
              <span key={jenis} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium border border-blue-100">
                {jenis} <span className="font-bold text-blue-900">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {displayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">Semua beres!</p>
          <p className="text-sm text-slate-400 mt-1">Tidak ada konten yang menunggu review saat ini.</p>
        </div>
      ) : (
        <>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-left">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-10">No.</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Materi</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Tgl Tayang</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Akun</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Platform</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedTasks.map((k, idx) => (
                <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <span className="font-medium text-slate-800 block truncate">{k.materi ?? '-'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDateDMY(k.tanggal_tayang)}</td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-[120px] truncate">{k.akun_nama ?? '-'}</td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{k.platform_nama ?? '-'}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={k.workflow_status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      {/* Lihat Detail */}
                      <button
                        onClick={() => doLihatDetail(k.id)}
                        disabled={detailLoading === k.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Lihat Detail & Bukti"
                      >
                        {detailLoading === k.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      {/* Approve */}
                      <button
                        onClick={() => doApprove(k.id)}
                        disabled={approveLoading.has(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      {/* Reject */}
                      <button
                        onClick={() => { setRejectModal({ id: k.id }); setRejectAlasan(''); setRejectError(''); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Reject"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayTasks.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-400">
                Halaman <span className="font-medium text-slate-700">{safePage}</span> dari{' '}
                <span className="font-medium text-slate-700">{totalPages}</span>
              </p>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-400">Tampilkan</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-slate-400">per halaman</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              {totalPages <= 7 ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        p === safePage ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-600 px-1">{safePage} / {totalPages}</span>
              )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Detail + Bukti Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setDetailModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Menunggu Approval</p>
                <h2 className="text-base font-bold text-slate-900">
                  {[detailModal.akun_nama, detailModal.jenis_konten_nama, formatDateDMY(detailModal.tanggal_tayang)]
                    .filter(Boolean).join(' · ')}
                </h2>
                <div className="mt-1.5"><StatusBadge status={detailModal.workflow_status} /></div>
              </div>
              <button onClick={() => setDetailModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
                {detailModal.materi && (
                  <div className="col-span-2">
                    <DetailRow label="Materi" value={detailModal.materi} />
                  </div>
                )}
                <DetailRow label="Tanggal Produksi" value={formatDateDMY(detailModal.tanggal_produksi)} />
                <DetailRow label="Tanggal Tayang" value={formatDateDMY(detailModal.tanggal_tayang)} />
                <DetailRow label="Akun" value={detailModal.akun_nama} />
                <DetailRow label="Platform" value={detailModal.platform_nama} />
                <DetailRow label="Jenis Konten" value={detailModal.jenis_konten_nama} />
                <DetailRow label="Konten" value={detailModal.tipe_konten_nama} />
                <DetailRow label="PIC" value={formatPicLabel(detailModal.pic_name)} />
                <DetailRow label="Lokasi" value={buildLokasi(detailModal.tipe_lokasi, detailModal.lokasi_kota, detailModal.properti)} />
                {detailModal.target_insights?.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-1">Target Insight</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailModal.target_insights.map(ti => (
                        <span key={ti.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {ti.nama}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detailModal.referensi_konten && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">Referensi Konten</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{detailModal.referensi_konten}</p>
                  </div>
                )}
                {detailModal.catatan && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">Catatan</p>
                    <p className="text-sm text-slate-700">{detailModal.catatan}</p>
                  </div>
                )}
              </div>

              {/* Bukti multimedia */}
              {(() => {
                const bukti = detailModal.uploads?.filter(u => u.tipe === 'multimedia').pop();
                if (!bukti) return null;
                return (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bukti Multimedia</p>
                    {bukti.bukti.startsWith('data:image/') ? (
                      <img src={bukti.bukti} alt="Bukti multimedia"
                        className="w-full max-h-80 rounded-xl border border-slate-200 object-contain bg-slate-50" />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        File PDF — tidak bisa ditampilkan sebagai gambar
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">Diupload oleh {formatUserLabel(bukti.uploader_name)} · {formatDateTime(bukti.created_at)}</p>
                  </div>
                );
              })()}

              {/* Action buttons */}
              <div className="border-t border-slate-100 pt-4 flex gap-2">
                <button
                  onClick={() => doApprove(detailModal.id)}
                  disabled={approveLoading.has(detailModal.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {approveLoading.has(detailModal.id) ? 'Menyimpan...' : 'Approve'}
                </button>
                <button
                  onClick={() => { setRejectModal({ id: detailModal.id }); setRejectAlasan(''); setRejectError(''); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setRejectModal(null)} />
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
                className={inputCls}
                rows={3}
                value={rejectAlasan}
                onChange={e => setRejectAlasan(e.target.value)}
                placeholder="Tuliskan alasan penolakan..."
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                Batal
              </button>
              <button onClick={doReject} disabled={rejectLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 cursor-pointer transition-colors">
                {rejectLoading ? 'Menyimpan...' : 'Konfirmasi Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
