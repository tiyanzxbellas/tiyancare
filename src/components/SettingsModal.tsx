import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, RotateCcw, Shield, Smartphone, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl } from '../services/api';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    addToast,
    isInstallable,
    isStandalone,
    installApp,
  } = useApp();
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setApiBaseUrl(apiUrl);
    addToast({
      type: 'success',
      title: 'Pengaturan Disimpan',
      message: 'Base URL API scraper berhasil diperbarui.',
    });
    setIsSettingsOpen(false);
  };

  const handleReset = () => {
    resetApiBaseUrl();
    const def = getApiBaseUrl();
    setApiUrl(def);
    setTestResult(null);
    addToast({
      type: 'info',
      title: 'Reset ke Default',
      message: 'URL kembali ke https://name-neko-api.vercel.app',
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const clean = apiUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/category`, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (res.ok && json.success) {
        setTestResult({
          ok: true,
          message: `Koneksi Berhasil! API aktif & merespons dalam format valid (${json.data?.length || 0} kategori ditemukan).`,
        });
      } else {
        setTestResult({
          ok: false,
          message: `Koneksi gagal atau format JSON tidak sesuai: HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `Gagal terhubung ke API: ${err.message || 'Network error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="max-w-lg w-full bg-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-brand-pink" />
            <h3 className="text-lg font-bold text-white">Pengaturan API Scraper</h3>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
              API Base URL:
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://name-neko-api.vercel.app"
              className="w-full px-4 py-3 rounded-xl bg-dark-850 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Default: <code className="text-brand-pink">https://name-neko-api.vercel.app</code>
            </p>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || !apiUrl.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Menguji...' : 'Uji Koneksi API'}
            </button>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Default
            </button>
          </div>
        </div>

        {/* PWA Section */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-brand-pink" />
            <h4 className="text-sm font-bold text-slate-100">Aplikasi NekoStream</h4>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            NekoStream mendukung fitur PWA (Progressive Web App), memungkinkan Anda memasang aplikasi ini langsung di layar beranda HP atau desktop komputer Anda dengan ukuran yang sangat ringan dan performa super cepat.
          </p>

          {isStandalone ? (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Aplikasi telah terpasang & berjalan dalam mode standalone!
            </div>
          ) : isInstallable ? (
            <button
              onClick={() => {
                installApp();
                setIsSettingsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-rose via-brand-pink to-brand-purple text-white hover:brightness-110 text-xs font-bold shadow-lg shadow-brand-rose/15 transition-all"
            >
              <Download className="w-4 h-4 text-white animate-bounce" />
              <span>Pasang Aplikasi NekoStream Sekarang</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-dark-850 border border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              * Jika tombol pasang tidak muncul, pastikan Anda menggunakan browser modern (Chrome/Edge/Safari/Samsung Internet) dan tidak sedang dalam mode Private/Incognito.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-dark-850 text-slate-300 hover:text-white text-xs font-bold transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white text-xs font-bold shadow-lg shadow-brand-rose/25 hover:scale-105 transition-all"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
