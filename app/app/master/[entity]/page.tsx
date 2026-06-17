'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatPicLabel } from '@/lib/pic-utils';

const ENTITY_LABELS: Record<string, string> = {
  'akun':           'Akun',
  'platform':       'Platform',
  'jenis-konten':   'Jenis Konten',
  'target-insight': 'Target Insight',
  'tipe-konten':    'Konten',
};

const MASTER_TABS = [
  { href: '/master/akun',           label: 'Akun' },
  { href: '/master/platform',       label: 'Platform' },
  { href: '/master/jenis-konten',   label: 'Jenis Konten' },
  { href: '/master/target-insight', label: 'Target Insight' },
  { href: '/master/tipe-konten',    label: 'Konten' },
];

type Item = { id: number; nama: string };
type PicItem = { id: number; nama: string };
type JenisKontenItem = { id: number; nama: string; pics: PicItem[] };

function PicMultiDropdown({
  options,
  selectedIds,
  onChange,
}: {
  options: PicItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedNames = options
    .filter(p => selectedIds.includes(p.id))
    .map(p => formatPicLabel(p.nama));

  const summary = selectedNames.length === 0
    ? '-- Pilih PIC --'
    : selectedNames.join(', ');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          open ? 'border-blue-500' : 'border-slate-200 hover:border-slate-400'
        }`}
      >
        <span className={selectedNames.length ? 'text-slate-800' : 'text-slate-400'}>
          {summary}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-3 py-2 text-slate-400 text-xs">Belum ada data PIC.</p>
          )}
          {options.map(p => {
            const checked = selectedIds.includes(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm select-none ${
                  checked ? 'text-blue-700 font-medium' : 'text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selectedIds.filter(x => x !== p.id)
                      : [...selectedIds, p.id];
                    onChange(next);
                  }}
                />
                {formatPicLabel(p.nama)}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabBar({ entity }: { entity: string }) {
  return (
    <div className="flex gap-1.5 mb-4 flex-wrap">
      {MASTER_TABS.map(t => (
        <Link key={t.href} href={t.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            t.href === `/master/${entity}`
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-slate-800'
          }`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ── Generic Master ────────────────────────────────────────────

function GenericMaster({ entity, label, search }: { entity: string; label: string; search: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addNama, setAddNama] = useState('');
  const [addError, setAddError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editError, setEditError] = useState('');

  async function load() {
    const res = await fetch(`/api/master/${entity}`);
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { load(); }, [entity]);

  async function handleAdd() {
    setAddError('');
    if (!addNama.trim()) return setAddError('Nama wajib diisi');
    const res = await fetch(`/api/master/${entity}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: addNama }),
    });
    if (!res.ok) return setAddError((await res.json()).error);
    setAddNama('');
    setAddOpen(false);
    load();
  }

  async function handleEdit(id: number) {
    setEditError('');
    if (!editNama.trim()) return setEditError('Nama wajib diisi');
    const res = await fetch(`/api/master/${entity}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editNama }),
    });
    if (!res.ok) return setEditError((await res.json()).error);
    setEditId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus item ini?')) return;
    await fetch(`/api/master/${entity}/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = items.filter(item =>
    !search || item.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">Master {label}</h1>
          <button
            onClick={() => { setAddNama(''); setAddError(''); setAddOpen(true); }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-left">
              <th className="pb-2 font-medium w-8 text-slate-400">No.</th>
              <th className="pb-2 font-medium">Nama</th>
              <th className="pb-2 font-medium w-20 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 text-slate-400 text-xs">{idx + 1}</td>
                <td className="py-2">
                  {editId === item.id ? (
                    <div>
                      {editError && <p className="text-red-500 text-xs mb-1">{editError}</p>}
                      <input
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editNama} onChange={e => setEditNama(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEdit(item.id)} autoFocus
                      />
                    </div>
                  ) : item.nama}
                </td>
                <td className="py-2">
                  <div className="flex justify-end gap-0.5">
                    {editId === item.id ? (
                      <>
                        <button title="Simpan" onClick={() => handleEdit(item.id)} className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button title="Batal" onClick={() => setEditId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button title="Edit" onClick={() => { setEditId(item.id); setEditNama(item.nama); setEditError(''); }} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button title="Hapus" onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-sm">
                {search ? 'Tidak ada hasil.' : 'Belum ada data.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add popup */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Tambah {label}</h2>
            {addError && <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama {label} <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Nama ${label.toLowerCase()}...`}
                value={addNama}
                onChange={e => setAddNama(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleAdd} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Jenis Konten Master ───────────────────────────────────────

function JenisKontenMaster({ search }: { search: string }) {
  const [items, setItems] = useState<JenisKontenItem[]>([]);
  const [allPics, setAllPics] = useState<PicItem[]>([]);
  const [filterPicId, setFilterPicId] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addNama, setAddNama] = useState('');
  const [addPicIds, setAddPicIds] = useState<number[]>([]);
  const [addError, setAddError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editPicIds, setEditPicIds] = useState<number[]>([]);
  const [editError, setEditError] = useState('');

  async function load() {
    const [jkRes, picRes] = await Promise.all([
      fetch('/api/master/jenis-konten'),
      fetch('/api/master/pic'),
    ]);
    if (jkRes.ok) setItems(await jkRes.json());
    if (picRes.ok) setAllPics(await picRes.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    setAddError('');
    if (!addNama.trim()) return setAddError('Nama wajib diisi');
    const res = await fetch('/api/master/jenis-konten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: addNama, pic_ids: addPicIds }),
    });
    if (!res.ok) return setAddError((await res.json()).error);
    setAddNama('');
    setAddPicIds([]);
    setAddOpen(false);
    load();
  }

  async function handleEdit(id: number) {
    setEditError('');
    if (!editNama.trim()) return setEditError('Nama wajib diisi');
    const res = await fetch(`/api/master/jenis-konten/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editNama, pic_ids: editPicIds }),
    });
    if (!res.ok) return setEditError((await res.json()).error);
    setEditId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus jenis konten ini?')) return;
    await fetch(`/api/master/jenis-konten/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = items.filter(item => {
    if (search && !item.nama.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPicId && !item.pics.some(p => p.id === filterPicId)) return false;
    return true;
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">Master Jenis Konten</h1>
          <button
            onClick={() => { setAddNama(''); setAddPicIds([]); setAddError(''); setAddOpen(true); }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah
          </button>
        </div>

        {/* PIC filter accordion */}
        <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setFilterOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V19l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">Filter PIC</span>
              {filterPicId && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>}
            </span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {filterOpen && (
            <div className="border-t border-slate-200 p-3 bg-slate-50 flex items-center gap-3">
              <select
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterPicId ?? ''}
                onChange={e => setFilterPicId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Semua PIC</option>
                {allPics.map(p => (
                  <option key={p.id} value={p.id}>{formatPicLabel(p.nama)}</option>
                ))}
              </select>
              {filterPicId && (
                <button type="button" onClick={() => setFilterPicId(null)} className="text-xs text-slate-500 hover:text-slate-700 underline whitespace-nowrap">
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-left">
              <th className="pb-2 font-medium w-8 text-slate-400">No.</th>
              <th className="pb-2 font-medium">Nama</th>
              <th className="pb-2 font-medium">PIC</th>
              <th className="pb-2 font-medium w-20 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={item.id} className={`border-b border-slate-50 ${editId === item.id ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                {editId === item.id ? (
                  <>
                    <td className="py-3 align-top text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 pr-4 align-top">
                      {editError && <p className="text-red-500 text-xs mb-1">{editError}</p>}
                      <input
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editNama} onChange={e => setEditNama(e.target.value)} autoFocus
                      />
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <p className="text-xs text-slate-500 mb-1">PIC:</p>
                      <PicMultiDropdown options={allPics} selectedIds={editPicIds} onChange={setEditPicIds} />
                    </td>
                    <td className="py-3 align-top">
                      <div className="flex justify-end gap-0.5">
                        <button title="Simpan" onClick={() => handleEdit(item.id)} className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button title="Batal" onClick={() => setEditId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-2.5 pr-4">{item.nama}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {item.pics.length > 0
                          ? item.pics.map(p => (
                            <span key={p.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                              {formatPicLabel(p.nama)}
                            </span>
                          ))
                          : <span className="text-slate-400 text-xs">—</span>
                        }
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-0.5">
                        <button title="Edit" onClick={() => { setEditId(item.id); setEditNama(item.nama); setEditPicIds(item.pics.map(p => p.id)); setEditError(''); }} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button title="Hapus" onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-slate-400 text-sm">
                {search || filterPicId ? 'Tidak ada hasil.' : 'Belum ada data.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add popup */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Tambah Jenis Konten</h2>
            {addError && <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Jenis Konten <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama jenis konten..."
                  value={addNama}
                  onChange={e => setAddNama(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">PIC</label>
                <PicMultiDropdown options={allPics} selectedIds={addPicIds} onChange={setAddPicIds} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleAdd} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function MasterPage() {
  const params = useParams<{ entity: string }>();
  const router = useRouter();
  const entity = params.entity;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!ENTITY_LABELS[entity]) {
      router.replace('/master/akun');
    }
    setSearch('');
  }, [entity, router]);

  if (!ENTITY_LABELS[entity]) return null;

  return (
    <div>
      <TabBar entity={entity} />

      <div className="mb-4">
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Cari ${ENTITY_LABELS[entity].toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {entity === 'jenis-konten'
        ? <JenisKontenMaster search={search} />
        : <GenericMaster entity={entity} label={ENTITY_LABELS[entity]} search={search} />
      }
    </div>
  );
}
