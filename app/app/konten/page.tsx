'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '../components/StatusBadge';
import { formatPicLabel, PIC_JABATAN } from '@/lib/pic-utils';
import LokasiFilterPicker, { type LokasiFilterState, EMPTY_LOKASI_FILTER } from '../components/LokasiFilterPicker';

type Konten = {
  id: number;
  judul: string;
  tanggal_tayang: string;
  tanggal_produksi: string | null;
  workflow_status: string;
  pic_name: string | null;
  platform_nama: string | null;
  platform_id: number;
  jenis_konten_nama: string | null;
  tipe_konten_nama: string | null;
  akun_nama: string | null;
  tipe_lokasi: string | null;
  lokasi_kota: string | null;
  properti_nama: string | null;
  properti_ids: number[] | null;
  referensi_konten: string | null;
  materi: string | null;
  target_insight_nama: string | null;
  link_konten: string | null;
};

type Platform = { id: number; nama: string };

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'to_do', label: 'To-Do' },
  { value: 'on_progress', label: 'On Progress' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waiting_publish', label: 'Waiting Publish' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'taken_down', label: 'Taken Down' },
];

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'to_do', label: 'To-Do' },
  { value: 'on_progress', label: 'On-Progress' },
  { value: 'waiting_publish', label: 'Waiting Publish' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected_all', label: 'Rejected' },
  { value: 'taken_down', label: 'Taken Down' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const selCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none';
const inpCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const STATUS_LABELS: Record<string, string> = {
  to_do: 'To-Do',
  on_progress: 'On Progress',
  pending_approval: 'Pending Approval',
  pending_manager_multimedia_approval: 'Pending Manager Multimedia',
  rejected: 'Rejected',
  waiting_publish: 'Waiting Publish',
  pending_head_publish_approval: 'Pending Head Publish',
  pending_manager_publish_approval: 'Pending Manager Publish',
  rejected_publish: 'Rejected Publish',
  done: 'Done',
  cancelled: 'Cancelled',
};

const PIC_FILTER_OPTIONS = Object.keys(PIC_JABATAN);

function formatKontenId(k: { id: number; jenis_konten_nama?: string | null; tanggal_tayang?: string | null }): string {
  const words = (k.jenis_konten_nama ?? '').trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
    : words.length === 1 ? words[0].slice(0, 3).toUpperCase()
    : 'KNT';
  const dt = k.tanggal_tayang ?? '';
  const mmyyyy = dt.length >= 10 ? dt.slice(5, 7) + dt.slice(0, 4) : '000000';
  const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const s = k.id;
  const rand = CHARS[s % 36] + CHARS[Math.floor(s / 36) % 36] + CHARS[Math.floor(s / 1296) % 36];
  return `${initials}-${mmyyyy}-${rand}`;
}

function formatDateDMY(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function toLocalDateStr(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildLokasi(tipe: string | null, kota: string | null, properti: string | null): string {
  if (!tipe) return '-';
  if (tipe === 'global') return 'Global';
  if (tipe === 'kota') return kota ?? 'Kota';
  if (tipe === 'segmented') return properti ?? (kota ? kota : 'Segmented');
  if (tipe === 'lokasi') return properti ?? 'Lokasi';
  return tipe;
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

const EXCEL_HEADERS = [
  'NO', 'ID', 'TGL PRODUKSI', 'TGL TAYANG', 'AKUN', 'LOKASI', 'PLATFORM',
  'JENIS KONTEN', 'KONTEN', 'PIC', 'TARGET INSIGHT', 'MATERI', 'STATUS', 'LINK KONTEN',
];

const SUMMARY_STATUS_KEYS = [
  { key: 'to_do', label: 'To-Do' },
  { key: 'on_progress', label: 'On Progress' },
  { key: 'pending_approval', label: 'Pending Approval' },
  { key: 'waiting_publish', label: 'Waiting Publish' },
  { key: 'done', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
];

const EXPORTER_NAMES: Record<string, string> = {
  '1': 'Anggri - Tim Video',
  '2': 'Putri - Tim Desain',
  '3': 'Sikin - Tim Desain',
  '4': 'Dede Kurniawan - Manager',
  '5': 'Eka Saputra - Head',
};

const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_NAMES_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatDateIdFull(d: Date): string {
  const hari = HARI_NAMES[d.getDay()];
  const tgl = String(d.getDate()).padStart(2, '0');
  const bln = BULAN_NAMES_FULL[d.getMonth()];
  const thn = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hari}, ${tgl} ${bln} ${thn}, ${hh}:${mm}:${ss}`;
}

function ChevronDown() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function buildSummaryData(rows: Konten[], jenisKontenList: string[], akunList: string[]) {
  const jkKeys = jenisKontenList.length > 0
    ? jenisKontenList
    : [...new Set(rows.map(r => r.jenis_konten_nama ?? '—'))].sort();
  const platformKeys = [...new Set(rows.map(r => r.platform_nama).filter((v): v is string => !!v))].sort();
  const kontenKeys = [...new Set(rows.map(r => r.tipe_konten_nama).filter((v): v is string => !!v))].sort();
  const picKeys = [...new Set(rows.map(r => r.pic_name).filter((v): v is string => !!v))].sort();

  const summaryRows = akunList.map(akun => {
    const akunRows = rows.filter(r => r.akun_nama === akun);
    return {
      akun,
      jkCounts: jkKeys.map(jk => akunRows.filter(r => r.jenis_konten_nama === jk).length),
      statusCounts: SUMMARY_STATUS_KEYS.map(s => akunRows.filter(r => r.workflow_status === s.key).length),
      platformCounts: platformKeys.map(p => akunRows.filter(r => r.platform_nama === p).length),
      kontenCounts: kontenKeys.map(k => akunRows.filter(r => r.tipe_konten_nama === k).length),
      picCounts: picKeys.map(p => akunRows.filter(r => r.pic_name === p).length),
      total: akunRows.length,
    };
  });
  return { rows: summaryRows, jkKeys, platformKeys, kontenKeys, picKeys };
}

function DateRangePicker({
  dari, sampai,
  onDariChange, onSampaiChange,
}: {
  dari: string; sampai: string;
  onDariChange: (v: string) => void; onSampaiChange: (v: string) => void;
}) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const selecting = !!dari && !sampai;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function handleDayClick(ds: string) {
    if (!dari || (dari && sampai)) {
      onDariChange(ds); onSampaiChange('');
    } else if (ds >= dari) {
      onSampaiChange(ds); setOpen(false);
    } else {
      onDariChange(ds);
    }
  }

  function getDays(): (string | null)[] {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (string | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }

  function dayClass(ds: string): string {
    const isStart = ds === dari;
    const isEnd = ds === sampai;
    const rangeEnd = sampai || (selecting && hovered && hovered >= dari ? hovered : null);
    const inRange = !!(dari && rangeEnd && ds > dari && ds < rangeEnd);
    const isToday = ds === now.toISOString().slice(0, 10);

    if (isStart || isEnd) return 'bg-blue-600 text-white rounded-full font-bold z-10';
    if (inRange) return 'bg-blue-100 text-blue-800';
    if (isToday) return 'font-semibold text-blue-500 hover:bg-slate-100 rounded-full';
    return 'text-slate-700 hover:bg-slate-100 rounded-full';
  }

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const display = dari || sampai
    ? `${dari ? formatDateDMY(dari) : '?'} — ${sampai ? formatDateDMY(sampai) : '...'}`
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          open ? 'border-blue-500' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={display ? 'text-slate-800 text-xs' : 'text-slate-400'}>
          {display ?? 'Pilih range tanggal...'}
        </span>
        {(dari || sampai) && (
          <span role="button" onClick={e => { e.stopPropagation(); onDariChange(''); onSampaiChange(''); }}
            className="ml-auto text-slate-300 hover:text-slate-500 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-slate-700">{BULAN_NAMES_FULL[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <p className="text-xs text-center text-slate-400 mb-2">
            {!dari || (dari && sampai) ? 'Klik tanggal mulai' : 'Klik tanggal akhir'}
          </p>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
              <div key={d} className="text-center text-xs text-slate-400 py-0.5">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {getDays().map((ds, i) => (
              <div
                key={i}
                className={`flex items-center justify-center h-8 text-xs select-none ${ds ? 'cursor-pointer ' + dayClass(ds) : ''}`}
                onClick={() => ds && handleDayClick(ds)}
                onMouseEnter={() => ds && setHovered(ds)}
                onMouseLeave={() => setHovered(null)}
              >
                {ds ? new Date(ds + 'T00:00').getDate() : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type FilterState = {
  status: string; platform: string;
  tanggalDari: string; tanggalSampai: string;
  akun: string; jenisKonten: string; pic: string;
  targetInsight: string; materi: string; lokasi: LokasiFilterState;
};
const EMPTY_FILTER: FilterState = {
  status: '', platform: '', tanggalDari: '', tanggalSampai: '',
  akun: '', jenisKonten: '', pic: '', targetInsight: '', materi: '',
  lokasi: EMPTY_LOKASI_FILTER,
};

async function exportToExcel(rows: Konten[], exporterName: string, jenisKontenList: string[], akunList: string[]) {
  const XLSX = await import('xlsx-js-style');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: Record<string, any> = {};
  const NUM_COLS = EXCEL_HEADERS.length;

  const hdrBg = 'BDD7EE';
  const darkBlue = '1C3972';
  const thin = (rgb: string) => ({ style: 'thin', color: { rgb } });
  const border = () => ({ top: thin('D0D8E8'), bottom: thin('D0D8E8'), left: thin('D0D8E8'), right: thin('D0D8E8') });
  const boldBorder = () => ({ top: thin('1C3972'), bottom: thin('1C3972'), left: thin('1C3972'), right: thin('1C3972') });

  // --- Header row ---
  EXCEL_HEADERS.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = {
      v: h,
      s: {
        font: { bold: true, sz: 10, color: { rgb: darkBlue }, name: 'Calibri' },
        fill: { fgColor: { rgb: hdrBg }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: boldBorder(),
      },
    };
  });

  // --- Data rows with alternating empty rows ---
  rows.forEach((k, ri) => {
    const r = 1 + ri * 2;
    const rowData = [
      ri + 1,
      formatKontenId(k),
      formatDateDMY(k.tanggal_produksi),
      formatDateDMY(k.tanggal_tayang),
      k.akun_nama ?? '-',
      buildLokasi(k.tipe_lokasi, k.lokasi_kota, k.properti_nama),
      buildPlatformStr(k.platform_nama, k.tipe_lokasi),
      k.jenis_konten_nama ?? '-',
      k.tipe_konten_nama ?? '-',
      formatPicLabel(k.pic_name),
      k.target_insight_nama ?? '-',
      k.materi ?? '-',
      STATUS_LABELS[k.workflow_status] ?? k.workflow_status,
      k.link_konten ?? '-',
    ];
    rowData.forEach((val, c) => {
      ws[XLSX.utils.encode_cell({ r, c })] = {
        v: val,
        s: {
          font: { sz: 10, name: 'Calibri' },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: border(),
        },
      };
    });
    // empty row after each data row
  });

  // --- Summary table: No | Jenis Konten | [Akun: DP | DJ] | [Status...] | Total ---
  const dataEnd = rows.length > 0 ? 1 + (rows.length - 1) * 2 : 0;
  const sumStart = dataEnd + 3;

  const { rows: summaryRows, jkKeys, platformKeys, kontenKeys, picKeys } = buildSummaryData(rows, jenisKontenList, akunList);
  const nJK = jkKeys.length;
  const nStatus = SUMMARY_STATUS_KEYS.length;
  const nPlatform = platformKeys.length;
  const nKonten = kontenKeys.length;
  const nPIC = picKeys.length;
  const colJKStart = 2;
  const colStatusStart = 2 + nJK;
  const colPlatformStart = 2 + nJK + nStatus;
  const colKontenStart = 2 + nJK + nStatus + nPlatform;
  const colPICStart = 2 + nJK + nStatus + nPlatform + nKonten;
  const colTotal = 2 + nJK + nStatus + nPlatform + nKonten + nPIC;
  const sumCols = colTotal + 1;

  const grpHdrStyle = {
    font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { fgColor: { rgb: darkBlue }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: boldBorder(),
  };
  const subHdrStyle = {
    font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { fgColor: { rgb: '2E5FA3' }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: boldBorder(),
  };

  // Row 0: title
  ws[XLSX.utils.encode_cell({ r: sumStart, c: 0 })] = {
    v: 'SUMMARY KONTEN',
    s: {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
      fill: { fgColor: { rgb: darkBlue }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
    },
  };
  for (let c = 1; c < sumCols; c++) {
    ws[XLSX.utils.encode_cell({ r: sumStart, c })] = {
      v: '', s: { fill: { fgColor: { rgb: darkBlue }, patternType: 'solid' } },
    };
  }

  // Row 1: Group headers
  const grpHeaders = [
    'NO', 'AKUN',
    'JENIS KONTEN', ...Array(Math.max(0, nJK - 1)).fill(''),
    'STATUS', ...Array(Math.max(0, nStatus - 1)).fill(''),
    ...(nPlatform > 0 ? ['PLATFORM', ...Array(nPlatform - 1).fill('')] : []),
    ...(nKonten > 0 ? ['TIPE KONTEN', ...Array(nKonten - 1).fill('')] : []),
    ...(nPIC > 0 ? ['PIC', ...Array(nPIC - 1).fill('')] : []),
    'TOTAL',
  ];
  grpHeaders.forEach((v, c) => {
    ws[XLSX.utils.encode_cell({ r: sumStart + 1, c })] = { v, s: grpHdrStyle };
  });

  // Row 2: Sub-headers
  const subHeaders = [
    'NO', 'AKUN',
    ...jkKeys,
    ...SUMMARY_STATUS_KEYS.map(s => s.label),
    ...platformKeys,
    ...kontenKeys,
    ...picKeys.map(p => formatPicLabel(p)),
    'TOTAL',
  ];
  subHeaders.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: sumStart + 2, c })] = { v: h, s: subHdrStyle };
  });

  // Data rows — one per Akun
  summaryRows.forEach(({ akun, jkCounts, statusCounts, platformCounts, kontenCounts, picCounts, total }, ri) => {
    const r = sumStart + 3 + ri;
    const rowData = [ri + 1, akun, ...jkCounts, ...statusCounts, ...platformCounts, ...kontenCounts, ...picCounts, total];
    rowData.forEach((val, c) => {
      ws[XLSX.utils.encode_cell({ r, c })] = {
        v: val,
        s: { font: { sz: 9, name: 'Calibri' }, alignment: { horizontal: c < 2 ? 'left' : 'center', vertical: 'center' }, border: border() },
      };
    });
  });

  // Total row
  const sumTotalRow = sumStart + 3 + summaryRows.length;
  const jkTotals = jkKeys.map((_, ji) => summaryRows.reduce((acc, r) => acc + r.jkCounts[ji], 0));
  const statusTotals = SUMMARY_STATUS_KEYS.map((_, si) => summaryRows.reduce((acc, r) => acc + r.statusCounts[si], 0));
  const platformTotals = platformKeys.map((_, pi) => summaryRows.reduce((acc, r) => acc + r.platformCounts[pi], 0));
  const kontenTotals = kontenKeys.map((_, ki) => summaryRows.reduce((acc, r) => acc + r.kontenCounts[ki], 0));
  const picTotals = picKeys.map((_, pi) => summaryRows.reduce((acc, r) => acc + r.picCounts[pi], 0));
  const grandTotal = summaryRows.reduce((acc, r) => acc + r.total, 0);
  ['', 'TOTAL', ...jkTotals, ...statusTotals, ...platformTotals, ...kontenTotals, ...picTotals, grandTotal].forEach((val, c) => {
    ws[XLSX.utils.encode_cell({ r: sumTotalRow, c })] = {
      v: val,
      s: { font: { bold: true, sz: 9, name: 'Calibri' }, fill: { fgColor: { rgb: 'BDD7EE' }, patternType: 'solid' }, alignment: { horizontal: c < 2 ? 'left' : 'center', vertical: 'center' }, border: boldBorder() },
    };
  });

  // Meta rows
  const now = new Date();
  const metaRow = sumTotalRow + 2;
  ws[XLSX.utils.encode_cell({ r: metaRow, c: 0 })] = {
    v: `Exported by : ${exporterName}`,
    s: { font: { italic: true, sz: 9, color: { rgb: '2E7D32' }, name: 'Calibri' } },
  };
  ws[XLSX.utils.encode_cell({ r: metaRow + 1, c: 0 })] = {
    v: `Generated on : ${formatDateIdFull(now)}`,
    s: { font: { italic: true, sz: 9, color: { rgb: '1565C0' }, name: 'Calibri' } },
  };

  const lastRow = metaRow + 1;
  const lastCol = Math.max(NUM_COLS, sumCols) - 1;
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } });
  ws['!merges'] = [
    { s: { r: sumStart, c: 0 }, e: { r: sumStart, c: sumCols - 1 } },
    { s: { r: sumStart + 1, c: 0 }, e: { r: sumStart + 2, c: 0 } },
    { s: { r: sumStart + 1, c: 1 }, e: { r: sumStart + 2, c: 1 } },
    { s: { r: sumStart + 1, c: colTotal }, e: { r: sumStart + 2, c: colTotal } },
    ...(nJK > 1 ? [{ s: { r: sumStart + 1, c: colJKStart }, e: { r: sumStart + 1, c: colJKStart + nJK - 1 } }] : []),
    ...(nStatus > 1 ? [{ s: { r: sumStart + 1, c: colStatusStart }, e: { r: sumStart + 1, c: colStatusStart + nStatus - 1 } }] : []),
    ...(nPlatform > 1 ? [{ s: { r: sumStart + 1, c: colPlatformStart }, e: { r: sumStart + 1, c: colPlatformStart + nPlatform - 1 } }] : []),
    ...(nKonten > 1 ? [{ s: { r: sumStart + 1, c: colKontenStart }, e: { r: sumStart + 1, c: colKontenStart + nKonten - 1 } }] : []),
    ...(nPIC > 1 ? [{ s: { r: sumStart + 1, c: colPICStart }, e: { r: sumStart + 1, c: colPICStart + nPIC - 1 } }] : []),
  ];
  ws['!cols'] = [
    { wch: 5 }, { wch: 7 }, { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 22 },
    { wch: 18 }, { wch: 14 }, { wch: 13 }, { wch: 20 }, { wch: 14 }, { wch: 28 },
    { wch: 16 }, { wch: 35 },
  ];
  ws['!rows'] = [{ hpt: 24 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Konten');

  const d = now;
  const fn = `KalenderKonten_${String(d.getDate()).padStart(2, '0')}${BULAN_NAMES_FULL[d.getMonth()]}${d.getFullYear()}_${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, fn);
}


export default function KontenPage() {
  const [list, setList] = useState<Konten[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [allJenisKonten, setAllJenisKonten] = useState<string[]>([]);
  const [allAkun, setAllAkun] = useState<string[]>([]);
  const [allTargetInsight, setAllTargetInsight] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter states — pending (in inputs) + applied (used for filtering)
  const [pendingFilter, setPendingFilter] = useState<FilterState>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(EMPTY_FILTER);

  // Action states
  const [mulaiLoading, setMulaiLoading] = useState<Set<number>>(new Set());
  const [cancelLoading, setCancelLoading] = useState<Set<number>>(new Set());
  const [takedownLoading, setTakedownLoading] = useState<Set<number>>(new Set());
  const [uploadModal, setUploadModal] = useState<{ id: number; tipe: 'multimedia' | 'sosmed' } | null>(null);
  const [uploadBukti, setUploadBukti] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function loadList() {
    fetch('/api/konten')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (Array.isArray(data)) setList(data); })
      .catch(err => console.error('loadList failed:', err));
  }

  useEffect(() => {
    const id = localStorage.getItem('active_user_id');
    const roles: Record<string, string> = { '1': 'tim_multimedia', '2': 'tim_sosmed', '3': 'tim_sosmed', '4': 'manager', '5': 'head' };
    setUserId(id ?? '');
    setRole(roles[id ?? ''] ?? '');

    loadList();
    fetch('/api/master/platform').then(r => r.ok ? r.json() : []).then(setPlatforms).catch(console.error);
    fetch('/api/master/jenis-konten').then(r => r.ok ? r.json() : []).then((data: { nama: string }[]) => setAllJenisKonten(data.map(j => j.nama))).catch(console.error);
    fetch('/api/master/akun').then(r => r.ok ? r.json() : []).then((data: { nama: string }[]) => setAllAkun(data.map(a => a.nama))).catch(console.error);
    fetch('/api/master/target-insight').then(r => r.ok ? r.json() : []).then((data: { nama: string }[]) => setAllTargetInsight(data.map(t => t.nama))).catch(console.error);

    const handler = () => {
      const id2 = localStorage.getItem('active_user_id');
      setUserId(id2 ?? '');
      setRole(roles[id2 ?? ''] ?? '');
    };
    window.addEventListener('user-changed', handler);
    return () => window.removeEventListener('user-changed', handler);
  }, []);

  async function doDelete(id: number) {
    if (!window.confirm('Hapus konten ini?')) return;
    const res = await fetch(`/api/konten/${id}`, { method: 'DELETE' });
    if (!res.ok) { window.alert('Gagal menghapus konten. Coba lagi.'); return; }
    loadList();
  }

  async function doMulaiKerjakan(id: number) {
    if (mulaiLoading.has(id)) return;
    setMulaiLoading(prev => new Set(prev).add(id));
    const res = await fetch(`/api/konten/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_status: 'on_progress' }),
    });
    setMulaiLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ? `Gagal: ${data.error}` : 'Gagal mengubah status. Coba lagi.');
      return;
    }
    loadList();
  }

  async function doTakedown(id: number) {
    if (takedownLoading.has(id)) return;
    if (!window.confirm('Takedown konten ini? Status akan berubah jadi Taken Down.')) return;
    setTakedownLoading(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/konten/${id}/takedown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ? `Gagal: ${data.error}` : 'Gagal takedown konten. Coba lagi.');
      } else {
        loadList();
      }
    } finally {
      setTakedownLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function doCancel(id: number) {
    if (cancelLoading.has(id)) return;
    if (!window.confirm('Batalkan konten ini? Status akan berubah jadi Cancelled dan tidak bisa diedit.')) return;
    setCancelLoading(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/konten/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_status: 'cancelled' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ? `Gagal: ${data.error}` : 'Gagal membatalkan konten. Coba lagi.');
      } else {
        loadList();
      }
    } finally {
      setCancelLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  function openUploadModal(id: number, tipe: 'multimedia' | 'sosmed') {
    setUploadModal({ id, tipe });
    setUploadBukti('');
    setUploadFileName('');
    setUploadError('');
  }

  function handleUploadFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { setUploadError('File terlalu besar. Maksimal 5MB.'); return; }
    setUploadError('');
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setUploadBukti(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function doUpload() {
    if (!uploadModal) return;
    if (!userId) { setUploadError('Login terlebih dahulu'); return; }
    if (uploadModal.tipe === 'multimedia' && !uploadBukti) { setUploadError('Pilih file terlebih dahulu'); return; }
    if (uploadModal.tipe === 'sosmed' && !uploadBukti.trim()) { setUploadError('Link wajib diisi'); return; }
    setUploadLoading(true);
    const res = await fetch(`/api/konten/${uploadModal.id}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipe: uploadModal.tipe, bukti: uploadBukti.trim() || uploadBukti, uploader_user_id: userId }),
    });
    setUploadLoading(false);
    if (!res.ok) { setUploadError((await res.json()).error ?? 'Gagal upload'); return; }
    setUploadModal(null);
    setUploadBukti('');
    setUploadFileName('');
    setUploadError('');
    loadList();
  }

  const safeList = Array.isArray(list) ? list : [];

  // Tab counts (from full list, unfiltered)
  const tabCounts: Record<string, number> = {
    '': safeList.length,
    to_do: safeList.filter(k => k.workflow_status === 'to_do').length,
    on_progress: safeList.filter(k => k.workflow_status === 'on_progress').length,
    pending_approval: safeList.filter(k => k.workflow_status === 'pending_approval').length,
    waiting_publish: safeList.filter(k => k.workflow_status === 'waiting_publish').length,
    done: safeList.filter(k => k.workflow_status === 'done').length,
    cancelled: safeList.filter(k => k.workflow_status === 'cancelled').length,
    rejected_all: safeList.filter(k => ['rejected', 'rejected_publish'].includes(k.workflow_status)).length,
    taken_down: safeList.filter(k => k.workflow_status === 'taken_down').length,
  };

  const filtered = safeList.filter(k => {
    const f = appliedFilter;
    if (activeTab === 'rejected_all') {
      if (!['rejected', 'rejected_publish'].includes(k.workflow_status)) return false;
    } else if (activeTab !== '') {
      if (k.workflow_status !== activeTab) return false;
    } else {
      if (f.status && k.workflow_status !== f.status) return false;
    }
    if (f.platform && !k.platform_nama?.split(', ').includes(f.platform)) return false;
    if (f.tanggalDari && toLocalDateStr(k.tanggal_tayang) < f.tanggalDari) return false;
    if (f.tanggalSampai && toLocalDateStr(k.tanggal_tayang) > f.tanggalSampai) return false;
    if (f.akun && k.akun_nama !== f.akun) return false;
    if (f.jenisKonten && k.jenis_konten_nama !== f.jenisKonten) return false;
    if (f.pic && k.pic_name !== f.pic) return false;
    if (f.targetInsight && !k.target_insight_nama?.split(', ').includes(f.targetInsight)) return false;
    if (f.materi && !k.materi?.toLowerCase().includes(f.materi.toLowerCase())) return false;
    if (f.lokasi.tipe) {
      if (k.tipe_lokasi !== f.lokasi.tipe) return false;
      if (f.lokasi.tipe === 'kota') {
        if (f.lokasi.kota && k.lokasi_kota !== f.lokasi.kota) return false;
      } else if (f.lokasi.tipe === 'segmented') {
        if (f.lokasi.kota) {
          if (k.lokasi_kota !== f.lokasi.kota) return false;
          if (f.lokasi.properti_ids.length > 0) {
            const kIds = k.properti_ids ?? [];
            if (!f.lokasi.properti_ids.some(id => kIds.includes(id))) return false;
          }
        }
      } else if (f.lokasi.tipe === 'lokasi') {
        if (f.lokasi.properti_ids.length > 0) {
          const kIds = k.properti_ids ?? [];
          if (!f.lokasi.properti_ids.some(id => kIds.includes(id))) return false;
        }
      }
    }
    return true;
  });

  const activeFilterCount = Object.entries(appliedFilter)
    .filter(([key, val]) => {
      if (key === 'status' && activeTab !== '') return false;
      if (key === 'lokasi') return !!(val as LokasiFilterState).tipe;
      return !!val;
    })
    .length;

  function clearFilters() {
    setPendingFilter(EMPTY_FILTER);
    setAppliedFilter(EMPTY_FILTER);
  }

  useEffect(() => { setCurrentPage(1); }, [activeTab, appliedFilter]);

  // Summary stats
  const totalAll = safeList.length;
  const countByAkun = list.reduce<Record<string, number>>((acc, k) => {
    const key = k.akun_nama ?? '—';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const byAkun = allAkun.length > 0
    ? allAkun.map(nama => [nama, countByAkun[nama] ?? 0] as [string, number]).sort((a, b) => b[1] - a[1])
    : Object.entries(countByAkun).sort((a, b) => b[1] - a[1]);
  const countByJenis = list.reduce<Record<string, number>>((acc, k) => {
    const key = k.jenis_konten_nama ?? '—';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const byJenis = allJenisKonten.length > 0
    ? allJenisKonten.map(nama => [nama, countByJenis[nama] ?? 0] as [string, number]).sort((a, b) => b[1] - a[1])
    : Object.entries(countByJenis).sort((a, b) => b[1] - a[1]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const pagedFiltered = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Konten</h1>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} konten ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const uid = localStorage.getItem('active_user_id') ?? '';
              try { await exportToExcel(filtered, EXPORTER_NAMES[uid] ?? 'Unknown', allJenisKonten, allAkun); }
              catch { window.alert('Gagal export Excel. Coba lagi.'); }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
          {role && role !== 'tim_sosmed' && (
            <Link href="/konten/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambahkan Konten
            </Link>
          )}
        </div>
      </div>

      {/* Status Tabs — paling atas */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-slate-800'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs font-bold ${activeTab === tab.value ? 'text-blue-100' : 'text-slate-400'}`}>
              ({tabCounts[tab.value] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Filter — collapsible */}
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
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${filterOpen ? 'rotate-45' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {filterOpen && (
          <div className="border-t border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">

              {/* Akun */}
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

              {/* Jenis Konten */}
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

              {/* PIC */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">PIC</p>
                <div className="relative">
                  <select className={selCls} value={pendingFilter.pic} onChange={e => setPendingFilter(f => ({ ...f, pic: e.target.value }))}>
                    <option value="">Semua</option>
                    {PIC_FILTER_OPTIONS.map(name => (
                      <option key={name} value={name}>{formatPicLabel(name)}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </div>

              {/* Target Insight */}
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

              {/* Range Tanggal Tayang — single field picker */}
              <div className="col-span-2">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Range Tanggal Tayang</p>
                <DateRangePicker
                  dari={pendingFilter.tanggalDari}
                  sampai={pendingFilter.tanggalSampai}
                  onDariChange={v => setPendingFilter(f => ({ ...f, tanggalDari: v }))}
                  onSampaiChange={v => setPendingFilter(f => ({ ...f, tanggalSampai: v }))}
                />
              </div>

              {/* Lokasi */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Lokasi</p>
                <LokasiFilterPicker
                  value={pendingFilter.lokasi}
                  onChange={v => setPendingFilter(f => ({ ...f, lokasi: v }))}
                />
              </div>

              {/* Materi */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Materi</p>
                <input type="text" className={inpCls} placeholder="Cari materi..."
                  value={pendingFilter.materi} onChange={e => setPendingFilter(f => ({ ...f, materi: e.target.value }))} />
              </div>

              {/* Status (hanya saat tab Semua) */}
              {activeTab === '' && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Status</p>
                  <div className="relative">
                    <select className={selCls} value={pendingFilter.status} onChange={e => setPendingFilter(f => ({ ...f, status: e.target.value }))}>
                      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
              )}

              {/* Platform */}
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

            </div>

            {/* Apply + Reset buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAppliedFilter(pendingFilter)}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Terapkan
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary — di bawah filter */}
      {totalAll > 0 && (
        <div className="mb-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Summary:</p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-700 text-white font-medium">
              Semua <span className="font-bold">({totalAll})</span>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" id="konten-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-left">
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-8">No.</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-14">ID</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Materi</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Tgl Tayang</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Akun</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Lokasi</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Platform</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Jenis Konten</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Konten</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">PIC</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Target Insight</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedFiltered.map((k, idx) => (
              <tr key={k.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3.5 text-slate-400 text-xs">{(safePage - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{formatKontenId(k)}</td>
                <td className="px-4 py-3.5 max-w-[180px]">
                  <Link href={`/konten/${k.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate">
                    {k.materi ?? '-'}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDateDMY(k.tanggal_tayang)}</td>
                <td className="px-4 py-3.5 text-slate-600 max-w-[120px] truncate">{k.akun_nama ?? '-'}</td>
                <td className="px-4 py-3.5 text-slate-600 max-w-[120px] truncate">{buildLokasi(k.tipe_lokasi, k.lokasi_kota, k.properti_nama)}</td>
                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{buildPlatformStr(k.platform_nama, k.tipe_lokasi)}</td>
                <td className="px-4 py-3.5 text-slate-600 max-w-[120px] truncate">{k.jenis_konten_nama ?? '-'}</td>
                <td className="px-4 py-3.5 text-slate-600 max-w-[110px] truncate">{k.tipe_konten_nama ?? '-'}</td>
                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatPicLabel(k.pic_name)}</td>
                <td className="px-4 py-3.5 text-slate-600 max-w-[130px] truncate">{k.target_insight_nama ?? '-'}</td>
                <td className="px-4 py-3.5"><StatusBadge status={k.workflow_status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    {role === 'tim_multimedia' && ['on_progress', 'rejected'].includes(k.workflow_status) && (
                      <button
                        onClick={() => openUploadModal(k.id, 'multimedia')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                        title="Upload Bukti Multimedia"
                        aria-label={`Upload bukti: ${k.materi ?? k.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                    )}
                    {role === 'tim_sosmed' && ['waiting_publish', 'rejected_publish'].includes(k.workflow_status) && (
                      <button
                        onClick={() => openUploadModal(k.id, 'sosmed')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                        title="Upload Link Sosmed"
                        aria-label={`Upload link: ${k.materi ?? k.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                    )}
                    {k.workflow_status === 'to_do' && (
                      <button
                        onClick={() => doMulaiKerjakan(k.id)}
                        disabled={mulaiLoading.has(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Mulai Kerjakan"
                        aria-label={`Mulai kerjakan: ${k.materi ?? k.id}`}
                      >
                        {mulaiLoading.has(k.id) ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    )}
                    <Link
                      href={`/konten/${k.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Lihat"
                      aria-label={`Lihat konten: ${k.materi ?? k.id}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    {['to_do', 'on_progress'].includes(k.workflow_status) && (
                      <Link
                        href={`/konten/${k.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                        aria-label={`Edit konten: ${k.materi ?? k.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    )}
                    <button
                      onClick={() => doDelete(k.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus"
                      aria-label={`Hapus konten: ${k.materi ?? k.id}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    {(role === 'head' || role === 'manager') && !['cancelled', 'done', 'taken_down'].includes(k.workflow_status) && (
                      <button
                        onClick={() => doCancel(k.id)}
                        disabled={cancelLoading.has(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Cancel"
                        aria-label={`Cancel konten: ${k.materi ?? k.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    )}
                    {(role === 'head' || role === 'manager') && k.workflow_status === 'done' && (
                      <button
                        onClick={() => doTakedown(k.id)}
                        disabled={takedownLoading.has(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                        title="Takedown"
                        aria-label={`Takedown konten: ${k.materi ?? k.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Tidak ada konten yang sesuai filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setUploadModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {uploadModal.tipe === 'multimedia' ? 'Upload Bukti Multimedia' : 'Upload Link Sosmed'}
              </h2>
              <button onClick={() => setUploadModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {uploadError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{uploadError}</p>
            )}
            {uploadModal.tipe === 'multimedia' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  File Bukti <span className="text-red-500">*</span>{' '}
                  <span className="text-slate-400 font-normal text-xs">(JPG, PNG, PDF · maks 5MB)</span>
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {uploadBukti.startsWith('data:image/') && (
                  <img src={uploadBukti} alt="Preview" className="mt-2 max-h-32 rounded-lg border border-slate-200 object-contain" />
                )}
                {uploadFileName && !uploadBukti.startsWith('data:image/') && (
                  <p className="mt-2 text-xs text-slate-500">📄 {uploadFileName}</p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Link Konten <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={uploadBukti}
                  onChange={e => setUploadBukti(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setUploadModal(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                Batal
              </button>
              <button
                onClick={doUpload}
                disabled={uploadLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer transition-colors"
              >
                {uploadLoading ? 'Mengupload...' : 'Submit Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {(totalPages > 1 || filtered.length > 0) && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
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
                      p === safePage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
    </div>
  );
}
