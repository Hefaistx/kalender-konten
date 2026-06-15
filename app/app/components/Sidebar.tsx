'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const USERS = [
  { id: 1, name: 'Anggri',        label: 'Tim Multimedia', initials: 'AG', color: 'bg-blue-500' },
  { id: 2, name: 'Putri',         label: 'Tim Sosmed',     initials: 'PT', color: 'bg-emerald-500' },
  { id: 3, name: 'Sikin',         label: 'Tim Sosmed',     initials: 'SK', color: 'bg-violet-500' },
  { id: 4, name: 'Dede Kurniawan', label: 'Manager',   initials: 'DK', color: 'bg-amber-500' },
  { id: 5, name: 'Eka Saputra',   label: 'Head',       initials: 'ES', color: 'bg-rose-500' },
];

const USER_ROLES: Record<number, string> = {
  1: 'tim_multimedia', 2: 'tim_sosmed', 3: 'tim_sosmed', 4: 'manager', 5: 'head',
};

const NAV_BASE = [
  {
    group: 'Setting Akun',
    items: [
      { label: 'Setting Akun', href: '/master/akun', activePrefix: '/master' },
    ],
  },
  {
    group: 'Kalender Konten',
    items: [
      { label: 'Kalender Konten', href: '/kalender', activePrefix: '/kalender' },
      { label: 'Daftar Konten', href: '/konten', activePrefix: '/konten' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('active_user_id');
    if (stored) setActiveId(Number(stored));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function login(id: number) {
    localStorage.setItem('active_user_id', String(id));
    setActiveId(id);
    setOpen(false);
    window.dispatchEvent(new Event('user-changed'));
  }

  const active = USERS.find(u => u.id === activeId);
  const activeRole = activeId ? (USER_ROLES[activeId] ?? '') : '';
  const isApprover = activeRole === 'head' || activeRole === 'manager';
  const NAV = isApprover
    ? [
        ...NAV_BASE.slice(0, 1),
        {
          ...NAV_BASE[1],
          items: [
            ...NAV_BASE[1].items,
            { label: 'Approval', href: '/tugas', activePrefix: '/tugas' },
          ],
        },
      ]
    : NAV_BASE;

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm overflow-y-auto">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Kalender Konten</p>
            <p className="text-xs text-slate-400 leading-tight">Content Workflow</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.group} className="mb-6">
            <p className="px-5 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {section.group}
            </p>
            {section.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.activePrefix + '/') || pathname === item.activePrefix;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-all ${
                    isActive
                      ? 'text-blue-700 bg-blue-50 font-semibold border-r-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Switcher Dropdown */}
      <div className="border-t border-slate-100 p-4" ref={dropdownRef}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simulasi Login</p>
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-left"
          >
            {active ? (
              <>
                <div className={`w-8 h-8 rounded-lg ${active.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{active.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{active.name}</p>
                  <p className="text-xs text-slate-400 truncate">{active.label}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Pilih user...</p>
                </div>
              </>
            )}
            <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
              {USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => login(u.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                    activeId === u.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${u.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-bold">{u.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.label}</p>
                  </div>
                  {activeId === u.id && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
