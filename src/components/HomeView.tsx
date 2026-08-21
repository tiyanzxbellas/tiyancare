import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Film,
  Tv,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Video,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { HomeData } from '../types/api';
import { useApp } from '../context/AppContext';
import { HeroBanner } from './HeroBanner';
import { MediaCard } from './MediaCard';

export const HomeView: React.FC = () => {
  const { setActiveTab, openCategory } = useApp();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHome = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHome(page);
      setHomeData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat halaman beranda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHome(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      {/* Hero Banner Carousel */}
      <HeroBanner
        items={homeData?.recommended || []}
        loading={loading && !homeData}
      />

      {/* Error state */}
      {error && !homeData && (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Gagal Memuat Beranda</h3>
          <p className="text-xs text-slate-300">{error}</p>
          <button
            onClick={() => fetchHome(currentPage)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-rose text-white text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Quick Category Discovery Pills */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-brand-pink" />
            Kategori Terpopuler
          </span>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-brand-pink hover:underline flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {[
            { name: 'Hentai Series', link: 'https://nekopoi.care/category/hentai/', color: 'from-pink-500 to-rose-600' },
            { name: '2D Animation', link: 'https://nekopoi.care/category/2d-animation/', color: 'from-purple-500 to-indigo-600' },
            { name: '3D Hentai', link: 'https://nekopoi.care/category/3d-hentai/', color: 'from-cyan-500 to-blue-600' },
            { name: 'JAV HD', link: 'https://nekopoi.care/category/jav/', color: 'from-amber-500 to-orange-600' },
            { name: 'JAV Cosplay', link: 'https://nekopoi.care/category/jav-cosplay/', color: 'from-rose-500 to-purple-600' },
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() => openCategory({ name: cat.name, link: cat.link })}
              className="p-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-slate-800 hover:border-brand-rose/50 transition-all text-left group"
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${cat.color} flex items-center justify-center mb-2 shadow-md`}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white block">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Episode Terbaru (Recent Episodes) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-rose/20 text-brand-rose">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Episode Rilis Terbaru</h2>
              <p className="text-[11px] text-slate-400">Update episode harian dengan subtitle Indonesia</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-brand-pink hover:underline hidden sm:flex items-center gap-1"
          >
            Jelajahi Episode <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && !homeData ? (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-thin snap-x snap-mandatory">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-xl bg-dark-850 animate-pulse w-[260px] sm:w-[300px] md:w-[320px] shrink-0 snap-start"
              />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-thin snap-x snap-mandatory">
            {homeData?.recentEpisodes.map((item, idx) => (
              <div
                key={item.link + idx}
                className="w-[260px] sm:w-[300px] md:w-[320px] shrink-0 snap-start"
              >
                <MediaCard
                  title={item.title}
                  link={item.link}
                  image={item.image}
                  date={item.date}
                  aspectRatio="video"
                  badge="New Ep"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Hentai Series Terbaru (Recent Hentai) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-purple/20 text-brand-purple">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Hentai Series Terkini</h2>
              <p className="text-[11px] text-slate-400">Serial anime hentai dengan skor & rating tertinggi</p>
            </div>
          </div>

          <button
            onClick={() => openCategory({ name: 'Hentai', link: 'https://nekopoi.care/category/hentai/' })}
            className="text-xs font-bold text-brand-purple hover:underline flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && !homeData ? (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-thin snap-x snap-mandatory">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-xl bg-dark-850 animate-pulse w-[150px] sm:w-[180px] md:w-[200px] shrink-0 snap-start"
              />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-thin snap-x snap-mandatory">
            {homeData?.recentHentai.map((item, idx) => (
              <div
                key={item.link + idx}
                className="w-[150px] sm:w-[180px] md:w-[200px] shrink-0 snap-start"
              >
                <MediaCard
                  title={item.title}
                  link={item.link}
                  image={item.image}
                  description={item.description}
                  aspectRatio="poster"
                  badge="Hentai"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: JAV & Cosplay Terkini (Recent JAV) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">JAV & Cosplay Terbaru</h2>
              <p className="text-[11px] text-slate-400">Rilis video live-action & cosplay berkualitas tinggi</p>
            </div>
          </div>

          <button
            onClick={() => openCategory({ name: 'JAV', link: 'https://nekopoi.care/category/jav/' })}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && !homeData ? (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-thin snap-x snap-mandatory">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-xl bg-dark-850 animate-pulse w-[260px] sm:w-[300px] md:w-[320px] shrink-0 snap-start"
              />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-thin snap-x snap-mandatory">
            {homeData?.recentJav.map((item, idx) => (
              <div
                key={item.link + idx}
                className="w-[260px] sm:w-[300px] md:w-[320px] shrink-0 snap-start"
              >
                <MediaCard
                  title={item.title}
                  link={item.link}
                  image={item.image}
                  date={item.date}
                  aspectRatio="video"
                  badge="JAV"
                />
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
