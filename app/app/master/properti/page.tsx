'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const MASTER_TABS = [
  { href: '/master/akun',           label: 'Akun' },
  { href: '/master/platform',       label: 'Platform' },
  { href: '/master/jenis-konten',   label: 'Jenis Konten' },
  { href: '/master/target-insight', label: 'Target Insight' },
  { href: '/master/tipe-konten',    label: 'Konten' },
  { href: '/master/pic',            label: 'PIC' },
  { href: '/master/properti',       label: 'Properti' },
];

type Properti = { id: number; nama: string; kota: string };

export default function MasterPropertiPage() {
  const [items, setItems] = useState<Properti[]>([]);
  const [form, setForm] = useState({ nama: '', kota: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', kota: '' });
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/properti');
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    setError('');
    if (!form.nama.trim() || !form.kota.trim()) return setError('Nama dan kota wajib diisi');
    const res = await fetch('/api/properti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) return setError((await res.json()).error);
    setForm({ nama: '', kota: '' });
    load();
  }

  async function handleEdit(id: number) {
    setError('');
    if (!editForm.nama.trim() || !editForm.kota.trim()) return setError('Nama dan kota wajib diisi');
    const res = await fetch(`/api/properti/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) return setError((await res.json()).error);
    setEditId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus properti ini?')) return;
    await fetch(`/api/properti/${id}`, { method: 'DELETE' });
    load();
  }

  const kotaList = [...new Set(items.map(i => i.kota))].sort();

  return (
    <div>
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {MASTER_TABS.map(t => (
          <Link key={t.href} href={t.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              t.href === '/master/properti'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-slate-800'
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Master Properti</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2 mb-5">
          <input className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nama properti..." value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
          <input className="w-36 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Kota..." value={form.kota} onChange={e => setForm(f => ({ ...f, kota: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Tambah</button>
        </div>

        {kotaList.map(kota => (
          <div key={kota} className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{kota}</p>
            <table className="w-full text-sm">
              <tbody>
                {items.filter(i => i.kota === kota).map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2">
                      {editId === item.id ? (
                        <div className="flex gap-2">
                          <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.nama}
                            onChange={e => setEditForm(f => ({ ...f, nama: e.target.value }))} autoFocus />
                          <input className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.kota}
                            onChange={e => setEditForm(f => ({ ...f, kota: e.target.value }))} />
                        </div>
                      ) : (
                        item.nama
                      )}
                    </td>
                    <td className="py-2 text-right space-x-2 w-28">
                      {editId === item.id ? (
                        <>
                          <button onClick={() => handleEdit(item.id)} className="text-blue-600 hover:underline text-xs">Simpan</button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:underline text-xs">Batal</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(item.id); setEditForm({ nama: item.nama, kota: item.kota }); }}
                            className="text-blue-600 hover:underline text-xs">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-xs">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Belum ada properti.</p>}
      </div>
    </div>
  );
}
