import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-dark-900/95 border-emerald-500/50 text-slate-100 shadow-emerald-950/40'
              : toast.type === 'error'
              ? 'bg-dark-900/95 border-rose-500/50 text-slate-100 shadow-rose-950/40'
              : 'bg-dark-900/95 border-slate-700 text-slate-100 shadow-dark-950/60'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-brand-pink shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
            {toast.message && (
              <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
