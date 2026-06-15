'use client';

import { useEffect, useRef, useState } from 'react';

type Properti = { id: number; nama: string; kota: string };

export type LokasiFilterState = {
  tipe: string;
  kota: string;
  properti_ids: number[];
};

export const EMPTY_LOKASI_FILTER: LokasiFilterState = {
  tipe: '', kota: '', properti_ids: [],
};

const TIPE_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'global', label: 'Global' },
  { value: 'kota', label: 'Kota' },
  { value: 'segmented', label: 'Segmented' },
  { value: 'lokasi', label: 'Lokasi' },
];

function buildLabel(v: LokasiFilterState, allProperti: Properti[]): string {
  if (!v.tipe) return 'Semua';
  if (v.tipe === 'global') return 'Global';
  if (v.tipe === 'kota') return v.kota ? `Kota · ${v.kota}` : 'Kota';
  if (v.tipe === 'segmented') {
    if (!v.kota) return 'Segmented';
    if (v.properti_ids.length === 0) return `Segmented · ${v.kota}`;
    return `Segmented · ${v.properti_ids.length} unit`;
  }
  if (v.tipe === 'lokasi') {
    if (v.properti_ids.length === 0) return 'Lokasi';
    const p = allProperti.find(p => p.id === v.properti_ids[0]);
    return p ? p.nama : 'Lokasi';
  }
  return 'Semua';
}

interface Props {
  value: LokasiFilterState;
  onChange: (v: LokasiFilterState) => void;
}

export default function LokasiFilterPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [allProperti, setAllProperti] = useState<Properti[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/properti').then(r => r.json()).then(setAllProperti).catch(() => {});
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const kotaList = [...new Set(allProperti.map(p => p.kota))].sort();
  const unitsByKota = value.kota ? allProperti.filter(p => p.kota === value.kota) : [];

  const isActive = !!value.tipe;
  const label = buildLabel(value, allProperti);

  function setTipe(tipe: string) {
    onChange({ tipe, kota: '', properti_ids: [] });
    if (tipe === '' || tipe === 'global') setOpen(false);
  }

  function setKota(kota: string) {
    onChange({ ...value, kota, properti_ids: [] });
  }

  function toggleUnit(id: number) {
    const ids = value.properti_ids.includes(id)
      ? value.properti_ids.filter(x => x !== id)
      : [...value.properti_ids, id];
    onChange({ ...value, properti_ids: ids });
  }

  function setSingleUnit(id: number | null) {
    onChange({ ...value, properti_ids: id !== null ? [id] : [] });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          open ? 'border-blue-500' : isActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className={isActive ? 'text-blue-700 font-medium truncate pr-1' : 'text-slate-400'}>
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {isActive && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange(EMPTY_LOKASI_FILTER); }}
              className="text-slate-300 hover:text-slate-500 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-72">

          {/* Tipe pills */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipe Lokasi</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {TIPE_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setTipe(o.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  value.tipe === o.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Kota list (kota + segmented) */}
          {(value.tipe === 'kota' || value.tipe === 'segmented') && (
            <div className={value.tipe === 'segmented' && value.kota ? 'mb-3' : ''}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kota</p>
              <div className="flex flex-col max-h-36 overflow-y-auto rounded-lg border border-slate-100">
                <button
                  type="button"
                  onClick={() => setKota('')}
                  className={`text-left px-3 py-2 text-sm transition-colors cursor-pointer border-b border-slate-100 ${
                    !value.kota ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Semua Kota
                </button>
                {kotaList.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKota(k)}
                    className={`text-left px-3 py-2 text-sm transition-colors cursor-pointer border-b border-slate-100 last:border-0 ${
                      value.kota === k ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unit multi-select (segmented + kota dipilih) */}
          {value.tipe === 'segmented' && value.kota && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Unit
                {value.properti_ids.length > 0 && (
                  <span className="text-blue-600 ml-1 normal-case font-normal">({value.properti_ids.length} dipilih)</span>
                )}
              </p>
              <div className="max-h-44 overflow-y-auto flex flex-col rounded-lg border border-slate-100">
                {unitsByKota.length === 0 ? (
                  <p className="text-sm text-slate-400 px-3 py-2">Tidak ada unit di kota ini.</p>
                ) : (
                  unitsByKota.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={value.properti_ids.includes(p.id)}
                        onChange={() => toggleUnit(p.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <span className="text-sm text-slate-700">{p.nama}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Unit single-select (lokasi) */}
          {value.tipe === 'lokasi' && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unit</p>
              <div className="max-h-52 overflow-y-auto flex flex-col rounded-lg border border-slate-100">
                <button
                  type="button"
                  onClick={() => setSingleUnit(null)}
                  className={`text-left px-3 py-2 text-sm transition-colors cursor-pointer border-b border-slate-100 ${
                    value.properti_ids.length === 0 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Semua Unit
                </button>
                {allProperti.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSingleUnit(p.id)}
                    className={`text-left px-3 py-2 text-sm transition-colors cursor-pointer border-b border-slate-100 last:border-0 ${
                      value.properti_ids[0] === p.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.nama}
                    <span className="text-xs text-slate-400 ml-1">· {p.kota}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
