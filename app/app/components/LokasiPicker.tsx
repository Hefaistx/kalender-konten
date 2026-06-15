'use client';

import { useEffect, useRef, useState } from 'react';

export type LokasiValue = {
  tipe_lokasi: string;
  lokasi_kota: string;
  properti_ids: number[];
};

type Properti = { id: number; nama: string; kota: string };

const TIPE_OPTIONS = [
  { value: 'lokasi', label: 'Lokasi', desc: '1 unit / properti tertentu' },
  { value: 'segmented', label: 'Segmented', desc: 'Beberapa unit dalam 1 kota' },
  { value: 'kota', label: 'Kota', desc: 'Semua properti dalam 1 kota' },
  { value: 'global', label: 'Global', desc: 'Semua properti semua kota' },
];

const sel = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none';

function MultiSelectDropdown({
  options,
  selected,
  onToggle,
  placeholder,
}: {
  options: Properti[];
  selected: number[];
  onToggle: (id: number) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const label = selected.length === 0
    ? placeholder
    : selected.length === options.length
      ? `Semua properti dipilih (${selected.length})`
      : `${selected.length} properti dipilih`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
      >
        <span className={selected.length === 0 ? 'text-slate-400' : 'text-slate-800'}>{label}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-3 py-2.5 text-sm text-slate-400">Tidak ada properti di kota ini.</p>
          )}
          {options.map(p => (
            <label
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => onToggle(p.id)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{p.nama}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  value: LokasiValue;
  onChange: (v: LokasiValue) => void;
}

export default function LokasiPicker({ value, onChange }: Props) {
  const [allProperti, setAllProperti] = useState<Properti[]>([]);

  useEffect(() => {
    fetch('/api/properti').then(r => r.json()).then(setAllProperti);
  }, []);

  const kotaList = [...new Set(allProperti.map(p => p.kota))].sort();
  const filteredProperti = value.lokasi_kota
    ? allProperti.filter(p => p.kota === value.lokasi_kota)
    : allProperti;

  function setTipe(tipe: string) {
    onChange({ tipe_lokasi: tipe, lokasi_kota: '', properti_ids: [] });
  }

  function setKota(kota: string) {
    onChange({ ...value, lokasi_kota: kota, properti_ids: [] });
  }

  function toggleProperti(id: number) {
    const ids = value.properti_ids.includes(id)
      ? value.properti_ids.filter(x => x !== id)
      : [...value.properti_ids, id];
    onChange({ ...value, properti_ids: ids });
  }

  function setSingleProperti(id: number) {
    onChange({ ...value, properti_ids: id ? [id] : [] });
  }

  return (
    <div className="space-y-3">
      {/* Step 1: Tipe */}
      <div className="relative">
        <select
          className={sel}
          value={value.tipe_lokasi}
          onChange={e => setTipe(e.target.value)}
        >
          <option value="">-- Pilih Tipe Lokasi --</option>
          {TIPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>

      {/* Step 2: Kota (segmented / kota) */}
      {(value.tipe_lokasi === 'segmented' || value.tipe_lokasi === 'kota') && (
        <div className="relative">
          <select className={sel} value={value.lokasi_kota} onChange={e => setKota(e.target.value)}>
            <option value="">-- Pilih Kota --</option>
            {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      )}

      {/* Step 3a: Single properti dropdown (lokasi) */}
      {value.tipe_lokasi === 'lokasi' && (
        <div className="relative">
          <select
            className={sel}
            value={value.properti_ids[0] ?? ''}
            onChange={e => setSingleProperti(Number(e.target.value))}
          >
            <option value="">-- Pilih Properti --</option>
            {allProperti.map(p => (
              <option key={p.id} value={p.id}>{p.nama} · {p.kota}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      )}

      {/* Step 3b: Multi properti dropdown (segmented) */}
      {value.tipe_lokasi === 'segmented' && value.lokasi_kota && (
        <MultiSelectDropdown
          options={filteredProperti}
          selected={value.properti_ids}
          onToggle={toggleProperti}
          placeholder="-- Pilih Properti --"
        />
      )}

      {/* Step 3c: Kota info */}
      {value.tipe_lokasi === 'kota' && value.lokasi_kota && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-blue-700">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Semua <strong>{filteredProperti.length} properti</strong> di {value.lokasi_kota} akan diikutsertakan.</span>
        </div>
      )}

      {/* Step 3d: Global info */}
      {value.tipe_lokasi === 'global' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-blue-700">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Semua <strong>{allProperti.length} properti</strong> dari semua kota akan diikutsertakan.</span>
        </div>
      )}
    </div>
  );
}
