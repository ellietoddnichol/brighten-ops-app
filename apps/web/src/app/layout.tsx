import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brighten Ops',
  description: 'Solar installation operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-yellow-400 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">☀️</span>
            <span className="text-xl font-bold tracking-tight">Brighten Ops</span>
          </div>
        </header>
        <nav className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 flex gap-6 text-sm font-medium">
            <a href="/" className="py-3 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-600 transition-colors">
              Dashboard
            </a>
            <a href="/jobs" className="py-3 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-600 transition-colors">
              Jobs
            </a>
            <a href="/employees" className="py-3 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-600 transition-colors">
              Employees
            </a>
            <a href="/calculator" className="py-3 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-600 transition-colors">
              Install Calculator
            </a>
            <a href="/labour" className="py-3 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-600 transition-colors">
              Labour
            </a>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
