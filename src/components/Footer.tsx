import React from 'react';
import { Sparkles, Heart, Shield, Terminal, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setActiveTab, setIsSettingsOpen } = useApp();

  return (
    <footer className="w-full bg-dark-950 border-t border-slate-900 pt-12 pb-24 md:pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-rose to-brand-purple p-0.5">
                <div className="w-full h-full bg-dark-950 rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-pink fill-brand-pink" />
                </div>
              </div>
              <span className="font-black text-base text-white">
                Neko<span className="text-brand-pink">Stream</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Frontend web streaming anime dan media modern bertenaga Vite & React. Dilengkapi pemutar video multi-server, ekstraksi embed link, pencarian cepat, dan penanda favorit.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API Scraper Status: Online
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Navigasi Utama</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-pink transition-colors"
                >
                  Beranda & Rilis Terbaru
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-pink transition-colors"
                >
                  Daftar Kategori
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('genres');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-pink transition-colors"
                >
                  Semua 78+ Genre
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('schedule');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-pink transition-colors"
                >
                  Jadwal Rilis & Update
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('extractor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-pink transition-colors"
                >
                  Ekstraktor Stream Video
                </button>
              </li>
            </ul>
          </div>

          {/* Tools & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Pengaturan & Bantuan</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hover:text-brand-pink transition-colors"
                >
                  Ubah Server API Base URL
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('library');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-pink transition-colors"
                >
                  Favorit & Riwayat Nonton
                </button>
              </li>
              <li>
                <span className="text-slate-500">Support Vercel Deployment</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 NekoStream Web. Scraper API client untuk Nekopoi.</p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="w-3.5 h-3.5 text-brand-rose fill-brand-rose" /> menggunakan Vite & React
          </p>
        </div>
      </div>
    </footer>
  );
};
