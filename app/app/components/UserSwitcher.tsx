'use client';

import { useEffect, useState } from 'react';

const USERS = [
  { id: 1, name: 'Citra', role: 'tim_promo', label: 'Tim Promo' },
  { id: 2, name: 'Ani', role: 'tim_multimedia', label: 'Multimedia' },
  { id: 3, name: 'Budi', role: 'tim_sosmed', label: 'Sosmed' },
  { id: 4, name: 'Dede', role: 'manager', label: 'Manager' },
];

export default function UserSwitcher() {
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('active_user_id');
    if (stored) setActiveId(Number(stored));
  }, []);

  function login(id: number) {
    localStorage.setItem('active_user_id', String(id));
    setActiveId(id);
    window.dispatchEvent(new Event('user-changed'));
  }

  const active = USERS.find(u => u.id === activeId);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {active && (
        <span className="text-sm text-gray-600 mr-1">
          Login sebagai <strong>{active.name}</strong> ({active.label})
        </span>
      )}
      {USERS.map(u => (
        <button
          key={u.id}
          onClick={() => login(u.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            activeId === u.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
          }`}
        >
          {u.name}
        </button>
      ))}
    </div>
  );
}
