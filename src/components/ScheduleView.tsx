import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock, RefreshCw, AlertCircle, ArrowRight, Film } from 'lucide-react';
import { api } from '../services/api';
import { UpcomingScheduleItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from './ImageWithFallback';

export const ScheduleView: React.FC = () => {
  const { setActiveTab } = useApp();
  const [schedule, setSchedule] = useState<string[]>([]);
  const [upcomingList, setUpcomingList] = useState<UpcomingScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSchedule();
      const upcoming = await api.getUpcomingSchedule();
      setSchedule(data);
      setUpcomingList(upcoming);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat jadwal rilis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-pink mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Update & Jadwal Tayang</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Jadwal Rilis Anime & Pembaruan</h2>
        </div>

        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Segarkan Jadwal"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. Status Update Scraper */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-9 h-9 rounded-xl bg-brand-rose/20 text-brand-rose flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Status Update Scraper NekoPoi Live</h3>
            <p className="text-xs text-slate-400">Sinkronisasi otomatis dengan server Nekopoi</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-dark-850 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {schedule.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-dark-850/80 border border-slate-800 flex items-center justify-between group hover:border-brand-pink/50 transition-colors text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-pink shadow-md" />
                  <span>{item}</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-pink" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Upcoming Anime Releases Gallery (Sniffed from /jadwal-new-hentai/) */}
      {upcomingList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-purple/20 text-brand-purple">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Katalog Rilis Mendatang ({upcomingList.length} Judul)
                </h3>
                <p className="text-xs text-slate-400">
                  Daftar episode anime hentai baru yang dijadwalkan segera tayang
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {upcomingList.map((item, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col bg-dark-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-brand-purple/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative w-full aspect-[2/3] overflow-hidden bg-dark-850">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-brand-purple text-white rounded-md shadow-md">
                      Upcoming
                    </span>
                  </div>
                </div>

                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-brand-pink">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {item.note || 'Segera Tayang'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
