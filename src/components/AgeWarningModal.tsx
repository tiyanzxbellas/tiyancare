import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AgeWarningModal: React.FC = () => {
  const { isAgeVerified, verifyAge } = useApp();

  if (isAgeVerified) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-brand-rose flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded-md bg-brand-rose/20 text-brand-pink border border-brand-rose/30">
            Peringatan Konten Dewasa (18+)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Konfirmasi Batas Usia
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Situs web ini memuat konten animasi, media, dan materi yang hanya ditujukan untuk pengunjung berusia <strong>18 tahun ke atas</strong> atau telah dewasa secara hukum.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              window.location.href = 'https://google.com';
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
          >
            Keluar (Di bawah 18)
          </button>
          <button
            onClick={verifyAge}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white text-xs font-black shadow-lg shadow-brand-rose/30 hover:scale-105 transition-all"
          >
            <Check className="w-4 h-4" />
            Saya 18+ Tahun (Masuk)
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Dengan melanjutkan, Anda menyetujui syarat & ketentuan dan menyatakan bahwa Anda telah cukup umur.
        </p>
      </div>
    </div>
  );
};
