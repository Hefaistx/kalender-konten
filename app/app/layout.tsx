import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kalendar Konten',
  description: 'Content calendar & approval workflow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
        <Sidebar />
        <main className="flex-1 min-w-0 p-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
