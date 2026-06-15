'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LokasiPicker, { type LokasiValue } from '../../components/LokasiPicker';
import { formatPicLabel } from '@/lib/pic-utils';

type Option = { id: number; nama: string };
type PicOption = { id: number; nama: string };
type JenisKontenOption = { id: number; nama: string; pics: PicOption[] };

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
const selectCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function MultiSelectDropdown({ options, selectedIds, onChange, placeholder = '-- Pilih --' }: {
  options: { id: number; nama: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const label = selectedIds.length === 0
    ? placeholder
    : options.filter(o => selectedIds.includes(o.id)).map(o => o.nama).join(', ');
  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  }
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-left">
        <span className={selectedIds.length === 0 ? 'text-slate-400' : ''}>{label}</span>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.map(o => {
            const checked = selectedIds.includes(o.id);
            return (
              <label key={o.id} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm hover:bg-slate-50 ${checked ? 'bg-blue-50' : ''}`}>
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                  checked={checked} onChange={() => toggle(o.id)} />
                <span className={checked ? 'text-blue-700 font-medium' : 'text-slate-700'}>{o.nama}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export default function NewKontenPage() {
  const router = useRouter();
  const [masters, setMasters] = useState<Record<string, Option[]>>({});
  const [jenisKontenList, setJenisKontenList] = useState<JenisKontenOption[]>([]);
  const [form, setForm] = useState({
    tanggal_produksi: '', tanggal_tayang: '',
    akun_id: '', jenis_konten_id: '', tipe_konten_id: '',
    pic_id: '',
    catatan: '', referensi_konten: '', materi: '',
  });
  const [platformIds, setPlatformIds] = useState<number[]>([]);
  const [targetInsightIds, setTargetInsightIds] = useState<number[]>([]);
  const [lokasi, setLokasi] = useState<LokasiValue>({ tipe_lokasi: '', lokasi_kota: '', properti_ids: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const USER_ROLES: Record<string, string> = { '1': 'tim_multimedia', '2': 'tim_sosmed', '3': 'tim_sosmed', '4': 'manager', '5': 'head' };
    const uid = localStorage.getItem('active_user_id') ?? '';
    if (USER_ROLES[uid] === 'tim_sosmed') { router.replace('/konten'); return; }

    const entities = ['akun', 'platform', 'target-insight', 'tipe-konten'];
    Promise.all([
      ...entities.map(e => fetch(`/api/master/${e}`).then(r => r.ok ? r.json() : [])),
      fetch('/api/master/jenis-konten').then(r => r.ok ? r.json() : []),
    ]).then(results => {
      const m: Record<string, Option[]> = {};
      entities.forEach((e, i) => { m[e] = results[i]; });
      setMasters(m);
      setJenisKontenList(results[entities.length] as JenisKontenOption[]);
    }).catch(err => console.error('Gagal memuat master data:', err));
  }, []);

  const selectedJK = jenisKontenList.find(j => String(j.id) === form.jenis_konten_id);
  const picOptions: PicOption[] = selectedJK?.pics ?? [];

  const platformList = masters['platform'] ?? [];

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function handleJenisKontenChange(val: string) {
    const jk = jenisKontenList.find(j => String(j.id) === val);
    const stillValid = (jk?.pics ?? []).some(p => String(p.id) === form.pic_id);
    setForm(f => ({ ...f, jenis_konten_id: val, pic_id: stillValid ? f.pic_id : '' }));
  }

  function toggleTargetInsight(id: number) {
    setTargetInsightIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.tanggal_tayang) return setError('Tanggal tayang wajib diisi');
    const missing: string[] = [];
    if (!form.akun_id) missing.push('Akun');
    if (platformIds.length === 0) missing.push('Platform');
    if (!form.jenis_konten_id) missing.push('Jenis Konten');
    if (!form.pic_id) missing.push('PIC');
    if (targetInsightIds.length === 0) missing.push('Target Insight');
    if (!lokasi.tipe_lokasi) {
      missing.push('Lokasi');
    } else if (lokasi.tipe_lokasi === 'lokasi' && lokasi.properti_ids.length === 0) {
      missing.push('Properti lokasi');
    } else if (lokasi.tipe_lokasi === 'kota' && !lokasi.lokasi_kota?.trim()) {
      missing.push('Kota lokasi');
    } else if (lokasi.tipe_lokasi === 'segmented') {
      if (!lokasi.lokasi_kota?.trim()) missing.push('Kota lokasi');
      else if (lokasi.properti_ids.length === 0) missing.push('Properti lokasi');
    }
    if (missing.length > 0) return setError(`Wajib dipilih: ${missing.join(', ')}`);
    const akunNama = masters['akun']?.find(a => String(a.id) === form.akun_id)?.nama ?? '';
    const jkNama = jenisKontenList.find(j => String(j.id) === form.jenis_konten_id)?.nama ?? '';
    const autoJudul = [akunNama, jkNama, form.tanggal_tayang].filter(Boolean).join(' · ');
    setLoading(true);
    const res = await fetch('/api/konten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, judul: autoJudul, platform_ids: platformIds, target_insight_ids: targetInsightIds, ...lokasi }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push(`/konten/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* Informasi Dasar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Informasi Dasar</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal Produksi">
              <input type="date" className={inputCls} value={form.tanggal_produksi} onChange={e => set('tanggal_produksi', e.target.value)} />
            </Field>
            <Field label="Tanggal Tayang" required>
              <input type="date" className={inputCls} value={form.tanggal_tayang} onChange={e => set('tanggal_tayang', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Detail Konten */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Detail Konten</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Akun" required>
              <SelectWrapper>
                <select className={selectCls} value={form.akun_id} onChange={e => set('akun_id', e.target.value)}>
                  <option value="">-- Pilih --</option>
                  {masters['akun']?.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Platform" required>
              <MultiSelectDropdown
                options={platformList}
                selectedIds={platformIds}
                onChange={setPlatformIds}
                placeholder="-- Pilih Platform --"
              />
            </Field>
            <Field label="Jenis Konten" required>
              <SelectWrapper>
                <select className={selectCls} value={form.jenis_konten_id} onChange={e => handleJenisKontenChange(e.target.value)}>
                  <option value="">-- Pilih --</option>
                  {jenisKontenList.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </SelectWrapper>
            </Field>
            <Field label="PIC" required>
              <SelectWrapper>
                <select
                  className={selectCls}
                  value={form.pic_id}
                  onChange={e => set('pic_id', e.target.value)}
                  disabled={!form.jenis_konten_id}
                >
                  <option value="">
                    {form.jenis_konten_id
                      ? picOptions.length > 0 ? '-- Pilih --' : '— Belum ada PIC —'
                      : '-- Pilih jenis konten dahulu --'}
                  </option>
                  {picOptions.map(p => <option key={p.id} value={p.id}>{formatPicLabel(p.nama)}</option>)}
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Konten">
              <SelectWrapper>
                <select className={selectCls} value={form.tipe_konten_id} onChange={e => set('tipe_konten_id', e.target.value)}>
                  <option value="">-- Pilih --</option>
                  {masters['tipe-konten']?.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                </select>
              </SelectWrapper>
            </Field>
          </div>

          <Field label="Target Insight" required>
            <div className="flex flex-wrap gap-2 mt-0.5">
              {masters['target-insight']?.map(o => {
                const checked = targetInsightIds.includes(o.id);
                return (
                  <label key={o.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors select-none ${
                    checked ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleTargetInsight(o.id)} />
                    {checked && <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    {o.nama}
                  </label>
                );
              })}
            </div>
          </Field>
        </div>

        {/* Lokasi */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Lokasi Tayang <span className="text-red-500 normal-case font-bold">*</span>
          </h2>
          <LokasiPicker value={lokasi} onChange={setLokasi} />
        </div>

        {/* Produksi & Materi */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Produksi & Materi</h2>
          <Field label="Referensi Konten">
            <textarea className={inputCls} rows={3} value={form.referensi_konten} onChange={e => set('referensi_konten', e.target.value)} placeholder="Link atau deskripsi referensi konten..." />
          </Field>
          <Field label="Materi">
            <textarea className={inputCls} rows={4} value={form.materi} onChange={e => set('materi', e.target.value)} placeholder="Deskripsi materi konten..." />
          </Field>
        </div>

        {/* Catatan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Catatan</h2>
          <Field label="Catatan">
            <textarea className={inputCls} rows={3} value={form.catatan} onChange={e => set('catatan', e.target.value)} placeholder="Catatan tambahan untuk tim..." />
          </Field>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors">
            {loading ? 'Menyimpan...' : 'Simpan Konten'}
          </button>
          <button type="button" onClick={() => router.push('/konten')}
            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
