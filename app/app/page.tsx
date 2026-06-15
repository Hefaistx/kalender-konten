import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Selamat datang</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Kelola konten, tracking status, dan approval workflow antar tim.
        </p>
      </div>

      <div className="grid gap-3">
        <Link
          href="/master/akun"
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div>
            <p className="font-medium text-gray-800 group-hover:text-blue-700">Master Data</p>
            <p className="text-xs text-gray-400 mt-0.5">Kelola akun, platform, jenis konten, target insight</p>
          </div>
          <span className="text-gray-300 group-hover:text-blue-400">→</span>
        </Link>

        <Link
          href="/konten"
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div>
            <p className="font-medium text-gray-800 group-hover:text-blue-700">Kalender Konten</p>
            <p className="text-xs text-gray-400 mt-0.5">Kalender mingguan, daftar konten, dan tugas</p>
          </div>
          <span className="text-gray-300 group-hover:text-blue-400">→</span>
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Pilih user di sidebar kiri untuk simulasi login role.
      </p>
    </div>
  );
}
