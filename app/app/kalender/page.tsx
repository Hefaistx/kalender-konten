'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '../components/StatusBadge';
import { formatPicLabel } from '@/lib/pic-utils';

type KontenItem = {
  id: number;
  judul: string;
  tanggal_tayang: string;
  tanggal_produksi: string | null;
  workflow_status: string;
  akun_nama: string | null;
  platform_nama: string | null;
  jenis_konten_nama: string | null;
  tipe_konten_nama: string | null;
  pic_name: string | null;
  target_insight_nama: string | null;
  tipe_lokasi: string | null;
  lokasi_kota: string | null;
  properti_nama: string | null;
  catatan: string | null;
  materi: string | null;
  referensi_konten: string | null;
};

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localDateStr(s: string | null | undefined): string {
  if (!s) return '';
  return toDateStr(new Date(s));
}

function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
}

function buildPlatformStr(platform: string | null, tipe: string | null): string {
  if (!platform) return '-';
  const label = !tipe ? null
    : tipe === 'global' ? 'Global'
    : tipe === 'kota' ? 'Kota'
    : tipe === 'lokasi' ? 'Lokasi'
    : tipe === 'segmented' ? 'Segmented'
    : null;
  return label ? `${platform} - ${label}` : platform;
}

function lokasiSummary(tipe: string | null, kota: string | null, properti: string | null): string {
  if (!tipe) return '-';
  if (tipe === 'global') return 'Global — semua properti';
  if (tipe === 'kota') return kota ?? 'Kota';
  if (tipe === 'segmented') return properti ?? (kota ? kota : 'Segmented');
  if (tipe === 'lokasi') return properti ?? 'Lokasi';
  return tipe;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className="text-slate-800 text-sm font-medium">{value}</p>
    </div>
  );
}

function KontenModal({ konten, onClose }: { konten: KontenItem; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {localDateStr(konten.tanggal_tayang)}
            </p>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{konten.judul || '—'}</h2>
            <div className="mt-2">
              <StatusBadge status={konten.workflow_status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Tanggal Produksi" value={localDateStr(konten.tanggal_produksi)} />
            <DetailRow label="Tanggal Tayang" value={localDateStr(konten.tanggal_tayang)} />
          </div>
          {konten.pic_name && <DetailRow label="PIC" value={formatPicLabel(konten.pic_name)} />}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Akun" value={konten.akun_nama} />
            <DetailRow label="Platform" value={buildPlatformStr(konten.platform_nama, konten.tipe_lokasi)} />
            <DetailRow label="Jenis Konten" value={konten.jenis_konten_nama} />
            <DetailRow label="Konten" value={konten.tipe_konten_nama} />
          </div>
          {konten.target_insight_nama && <DetailRow label="Target Insight" value={konten.target_insight_nama} />}
          <DetailRow label="Lokasi" value={lokasiSummary(konten.tipe_lokasi, konten.lokasi_kota, konten.properti_nama)} />
          {konten.referensi_konten && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-1">Referensi Konten</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{konten.referensi_konten}</p>
            </div>
          )}
          {konten.materi && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-1">Materi</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{konten.materi}</p>
            </div>
          )}
          {konten.catatan && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-1">Catatan</p>
              <p className="text-sm text-slate-700">{konten.catatan}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-2">
          <Link
            href={`/konten/${konten.id}`}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Lihat Detail Lengkap
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DayPopup({ date, items, onSelect, onClose }: {
  date: string;
  items: KontenItem[];
  onSelect: (k: KontenItem) => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const d = new Date(date + 'T12:00:00');
  const dateLabel = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[40] flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Konten Tayang</p>
            <h3 className="text-base font-bold text-slate-900">{dateLabel}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          {items.map(k => (
            <button
              key={k.id}
              onClick={() => onSelect(k)}
              className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-3.5 py-3 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {k.akun_nama && <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700">{k.akun_nama}</p>}
                  {k.jenis_konten_nama && <p className="text-xs text-slate-500 truncate">{k.jenis_konten_nama}</p>}
                  {k.platform_nama && <p className="text-xs text-slate-400 truncate">{buildPlatformStr(k.platform_nama, k.tipe_lokasi)}</p>}
                </div>
                <div className="shrink-0 mt-0.5">
                  <StatusBadge status={k.workflow_status} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function KalenderPage() {
  const [kontenList, setKontenList] = useState<KontenItem[]>([]);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [monthStart, setMonthStart] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selected, setSelected] = useState<KontenItem | null>(null);
  const [dayPopup, setDayPopup] = useState<{ date: string; items: KontenItem[] } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);
  const todayStr = toDateStr(new Date());

  useEffect(() => {
    fetch('/api/konten').then(r => r.json()).then(setKontenList);
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [pickerOpen]);

  function jumpToMonth(year: number, month: number) {
    const first = new Date(year, month, 1);
    setMonthStart(first);
    setWeekStart(getMonday(first));
    setPickerOpen(false);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  function prevPeriod() {
    if (viewMode === 'weekly') {
      setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    } else {
      setMonthStart(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }
  }
  function nextPeriod() {
    if (viewMode === 'weekly') {
      setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    } else {
      setMonthStart(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }
  function goNow() {
    const n = new Date();
    setWeekStart(getMonday(n));
    setMonthStart(new Date(n.getFullYear(), n.getMonth(), 1));
  }

  const totalThisWeek = weekDays.reduce((sum, day) => {
    return sum + kontenList.filter(k => localDateStr(k.tanggal_tayang) === toDateStr(day)).length;
  }, 0);

  // Monthly grid
  const firstDow = monthStart.getDay();
  const firstOffset = (firstDow + 6) % 7;
  const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((firstOffset + lastDay) / 7) * 7;
  const monthCells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstOffset + 1;
    if (dayNum < 1 || dayNum > lastDay) return null;
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNum);
  });

  function handleDayClick(day: Date) {
    const ds = toDateStr(day);
    const items = kontenList.filter(k => localDateStr(k.tanggal_tayang) === ds);
    if (items.length === 0) return;
    setDayPopup({ date: ds, items });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kalender Konten</h1>
          <div className="relative mt-0.5">
            <button
              onClick={() => {
                setPickerYear(viewMode === 'monthly' ? monthStart.getFullYear() : weekStart.getFullYear());
                setPickerOpen(o => !o);
              }}
              className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 group transition-colors"
            >
              {viewMode === 'weekly'
                ? `${formatWeekRange(weekDays[0], weekDays[6])} · (${totalThisWeek} konten minggu ini)`
                : `${MONTH_NAMES[monthStart.getMonth()]} ${monthStart.getFullYear()}`}
              <svg className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {pickerOpen && (
              <div ref={pickerRef} className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30 w-52">
                <div className="flex items-center justify-between mb-2.5">
                  <button onClick={() => setPickerYear(y => y - 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-bold text-slate-800">{pickerYear}</span>
                  <button onClick={() => setPickerYear(y => y + 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_NAMES.map((m, mi) => {
                    const active = viewMode === 'monthly'
                      ? pickerYear === monthStart.getFullYear() && mi === monthStart.getMonth()
                      : pickerYear === weekStart.getFullYear() && mi === weekStart.getMonth();
                    return (
                      <button key={m} onClick={() => jumpToMonth(pickerYear, mi)}
                        className={`text-xs py-1.5 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            <button
              onClick={() => { setViewMode('weekly'); setWeekStart(getMonday(monthStart)); }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-2 text-sm font-medium border-l border-slate-200 transition-colors ${viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Bulanan
            </button>
          </div>
          {/* Navigation */}
          <button onClick={prevPeriod} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goNow} className="px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-sm text-slate-600 font-medium transition-colors">
            {viewMode === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
          </button>
          <button onClick={nextPeriod} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekly view */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const dateStr = toDateStr(day);
            const isToday = dateStr === todayStr;
            const dayItems = kontenList.filter(k => localDateStr(k.tanggal_tayang) === dateStr);
            return (
              <div key={idx} className="flex flex-col min-h-48">
                <div className={`rounded-xl px-2 py-2.5 text-center mb-2 ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                    {DAY_NAMES[idx].slice(0, 3)}
                  </p>
                  <p className={`text-xl font-bold leading-tight mt-0.5 ${isToday ? 'text-white' : 'text-slate-800'}`}>
                    {day.getDate()}
                  </p>
                  {dayItems.length > 0 && (
                    <p className={`text-xs mt-0.5 ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>
                      ({dayItems.length} konten)
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  {dayItems.map(k => (
                    <button
                      key={k.id}
                      onClick={() => setSelected(k)}
                      className="text-left w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      {k.akun_nama && <p className="text-xs font-semibold text-slate-800 leading-snug truncate group-hover:text-blue-700">{k.akun_nama}</p>}
                      {k.jenis_konten_nama && <p className="text-xs text-slate-500 truncate">{k.jenis_konten_nama}</p>}
                      {k.platform_nama && <p className="text-xs text-slate-400 truncate">{buildPlatformStr(k.platform_nama, k.tipe_lokasi)}</p>}
                      <div className="mt-1.5"><StatusBadge status={k.workflow_status} /></div>
                    </button>
                  ))}
                  {dayItems.length === 0 && <div className="flex-1 border border-dashed border-slate-200 rounded-xl" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly view */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_NAMES.map(d => (
              <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d.slice(0, 3)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="min-h-[88px] border-b border-r border-slate-50" />;
              }
              const dateStr = toDateStr(day);
              const isToday = dateStr === todayStr;
              const dayItems = kontenList.filter(k => localDateStr(k.tanggal_tayang) === dateStr);
              const hasKonten = dayItems.length > 0;
              const STATUS_LABELS: [string, string][] = [
                ['to_do', 'To-Do'],
                ['on_progress', 'On-Progress'],
                ['waiting_publish', 'Waiting Publish'],
                ['pending_approval', 'Pending Approval'],
                ['done', 'Done'],
                ['cancelled', 'Cancelled'],
                ['rejected', 'Rejected'],
                ['taken_down', 'Taken Down'],
              ];
              const statusCounts = STATUS_LABELS.map(([key, label]) => ({
                label,
                count: dayItems.filter(k => k.workflow_status === key).length,
              })).filter(s => s.count > 0);
              const isLastCol = (idx + 1) % 7 === 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[88px] border-b border-slate-100 p-2 flex flex-col gap-1 ${!isLastCol ? 'border-r' : ''} ${hasKonten ? 'cursor-pointer hover:bg-blue-50/60 transition-colors' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                    {day.getDate()}
                  </div>
                  {hasKonten && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700">{dayItems.length} konten</p>
                      {statusCounts.map(s => (
                        <p key={s.label} className="text-xs text-slate-400 leading-snug">{s.label} ({s.count})</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DayPopup — z-40, below KontenModal z-50 */}
      {dayPopup && (
        <DayPopup
          date={dayPopup.date}
          items={dayPopup.items}
          onSelect={k => setSelected(k)}
          onClose={() => setDayPopup(null)}
        />
      )}

      {/* KontenModal — z-50 */}
      {selected && (
        <KontenModal konten={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
