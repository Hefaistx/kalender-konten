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
    <div className="flex gap-1.5 mb-6 flex-wrap">
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

function GenericMaster({ entity, label }: { entity: string; label: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [newNama, setNewNama] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch(`/api/master/${entity}`);
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { load(); }, [entity]);

  async function handleAdd() {
    setError('');
    if (!newNama.trim()) return setError('Nama wajib diisi');
    const res = await fetch(`/api/master/${entity}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: newNama }),
    });
    if (!res.ok) return setError((await res.json()).error);
    setNewNama('');
    load();
  }

  async function handleEdit(id: number) {
    setError('');
    if (!editNama.trim()) return setError('Nama wajib diisi');
    const res = await fetch(`/api/master/${entity}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editNama }),
    });
    if (!res.ok) return setError((await res.json()).error);
    setEditId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus item ini?')) return;
    await fetch(`/api/master/${entity}/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Master {label}</h1>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex gap-2 mb-5">
        <input
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Nama ${label.toLowerCase()} baru...`}
          value={newNama}
          onChange={e => setNewNama(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Tambah</button>
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
          {items.map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="py-2 text-slate-400 text-xs">{idx + 1}</td>
              <td className="py-2">
                {editId === item.id ? (
                  <input className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editNama} onChange={e => setEditNama(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEdit(item.id)} autoFocus />
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
                      <button title="Edit" onClick={() => { setEditId(item.id); setEditNama(item.nama); }} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
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
          {items.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-slate-400 text-sm">Belum ada data.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function JenisKontenMaster() {
  const [items, setItems] = useState<JenisKontenItem[]>([]);
  const [allPics, setAllPics] = useState<PicItem[]>([]);
  const [newNama, setNewNama] = useState('');
  const [newPicIds, setNewPicIds] = useState<number[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editPicIds, setEditPicIds] = useState<number[]>([]);
  const [error, setError] = useState('');

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
    setError('');
    if (!newNama.trim()) return setError('Nama wajib diisi');
    const res = await fetch('/api/master/jenis-konten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: newNama, pic_ids: newPicIds }),
    });
    if (!res.ok) return setError((await res.json()).error);
    setNewNama('');
    setNewPicIds([]);
    load();
  }

  async function handleEdit(id: number) {
    setError('');
    if (!editNama.trim()) return setError('Nama wajib diisi');
    const res = await fetch(`/api/master/jenis-konten/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editNama, pic_ids: editPicIds }),
    });
    if (!res.ok) return setError((await res.json()).error);
    setEditId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus jenis konten ini?')) return;
    await fetch(`/api/master/jenis-konten/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Master Jenis Konten</h1>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* Add form */}
      <div className="border border-slate-200 rounded-lg p-4 mb-5 bg-slate-50">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tambah Jenis Konten Baru</p>
        <div className="space-y-3">
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nama jenis konten..."
            value={newNama}
            onChange={e => setNewNama(e.target.value)}
          />
          <div>
            <p className="text-xs text-slate-500 mb-1">PIC yang tersedia untuk jenis konten ini:</p>
            <PicMultiDropdown options={allPics} selectedIds={newPicIds} onChange={setNewPicIds} />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Tambah</button>
        </div>
      </div>

      {/* List */}
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
          {items.map((item, idx) => (
            <tr key={item.id} className={`border-b border-slate-50 ${editId === item.id ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
              {editId === item.id ? (
                <>
                  <td className="py-3 align-top text-slate-400 text-xs">{idx + 1}</td>
                  <td className="py-3 pr-4 align-top">
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
                      <button title="Edit" onClick={() => { setEditId(item.id); setEditNama(item.nama); setEditPicIds(item.pics.map(p => p.id)); }} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
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
          {items.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-sm">Belum ada data.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function MasterPage() {
  const params = useParams<{ entity: string }>();
  const router = useRouter();
  const entity = params.entity;

  useEffect(() => {
    if (!ENTITY_LABELS[entity]) {
      router.replace('/master/akun');
    }
  }, [entity, router]);

  if (!ENTITY_LABELS[entity]) return null;

  return (
    <div>
      <TabBar entity={entity} />
      {entity === 'jenis-konten'
        ? <JenisKontenMaster />
        : <GenericMaster entity={entity} label={ENTITY_LABELS[entity]} />
      }
    </div>
  );
}
