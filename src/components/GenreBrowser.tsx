import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Search, Sparkles, Building2, Flame, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { GenreItem, MediaListItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { MediaCard } from './MediaCard';

export const GenreBrowser: React.FC = () => {
  const { selectedGenre, openGenre } = useApp();
  const [activeTab, setActiveTab] = useState<'genres' | 'studios'>('genres');
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [studios, setStudios] = useState<string[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);

  const [loadingGenres, setLoadingGenres] = useState<boolean>(true);
  const [searchAnimeTerm, setSearchAnimeTerm] = useState<string>('');

  const [posts, setPosts] = useState<MediaListItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state: 10 items per page
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Load all 118+ genres & 199+ studios
  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingGenres(true);
      try {
        const [gData, sData] = await Promise.all([
          api.getGenres(),
          api.getProducers(),
        ]);
        setGenres(gData);
        setStudios(sData);
        if (!selectedGenre && gData.length > 0) {
          openGenre(gData[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat genre.');
      } finally {
        setLoadingGenres(false);
      }
    };
    fetchAllData();
  }, []);

  // Load posts for selected genre from 1,042 A-Z archive + live API
  useEffect(() => {
    if (activeTab === 'genres' && selectedGenre) {
      const fetchGenrePosts = async () => {
        setLoadingPosts(true);
        setError(null);
        setCurrentPage(1);
        try {
          const data = await api.getByGenre(selectedGenre.link, 1000);
          setPosts(data);
        } catch (err: any) {
          setError(err.message || 'Gagal memuat konten genre.');
        } finally {
          setLoadingPosts(false);
        }
      };
      fetchGenrePosts();
    }
  }, [selectedGenre, activeTab]);

  // Load posts for selected studio from 1,042 A-Z archive + live API
  useEffect(() => {
    if (activeTab === 'studios' && selectedStudio) {
      const fetchStudioPosts = async () => {
        setLoadingPosts(true);
        setError(null);
        setCurrentPage(1);
        try {
          const data = await api.getByProducer(selectedStudio);
          setPosts(data);
        } catch (err: any) {
          setError(err.message || 'Gagal memuat konten studio.');
        } finally {
          setLoadingPosts(false);
        }
      };
      fetchStudioPosts();
    }
  }, [selectedStudio, activeTab]);

  const handleSelectStudio = (studio: string) => {
    setSelectedStudio(studio);
    setCurrentPage(1);
  };

  // Filter ANIME titles inside the selected genre/studio based on user search input
  const filteredAnimeList = useMemo(() => {
    if (!searchAnimeTerm.trim()) return posts;
    const q = searchAnimeTerm.toLowerCase().trim();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.genres?.some((g) => g.toLowerCase().includes(q))
    );
  }, [posts, searchAnimeTerm]);

  // 10 Items per page calculation on filtered anime list
  const totalPages = Math.ceil(filteredAnimeList.length / itemsPerPage) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAnimeList.slice(start, start + itemsPerPage);
  }, [filteredAnimeList, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      const gridEl = document.getElementById('genre-grid-top');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      const gridEl = document.getElementById('genre-grid-top');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-purple mb-1">
            <Tag className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Koleksi 118+ Genre & 199+ Studio Terlengkap
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {activeTab === 'genres'
              ? `Genre: ${selectedGenre ? selectedGenre.name : 'Pilih Genre'}`
              : `Studio: ${selectedStudio || 'Pilih Studio'}`}
          </h2>
        </div>

        {/* Tab Switcher: Genre vs Studio */}
        <div className="flex items-center gap-1.5 bg-dark-900 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('genres');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'genres'
                ? 'bg-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Genre ({genres.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('studios');
              setCurrentPage(1);
              if (!selectedStudio && studios.length > 0) {
                setSelectedStudio(studios[0]);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'studios'
                ? 'bg-brand-rose text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Studio ({studios.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Chips Selector Box for Genre / Studio */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {activeTab === 'genres' ? 'Pilih Genre Anime:' : 'Pilih Studio Animasi:'}
          </span>
          <span className="text-xs text-brand-pink font-semibold">
            {activeTab === 'genres' ? `${genres.length} Genre` : `${studios.length} Studio`}
          </span>
        </div>

        {activeTab === 'genres' ? (
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {loadingGenres ? (
              <div className="flex flex-wrap gap-2">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="h-7 w-20 rounded-lg bg-dark-850 animate-pulse" />
                ))}
              </div>
            ) : (
              genres.map((genre) => {
                const isSelected = selectedGenre?.name.toLowerCase() === genre.name.toLowerCase();
                const isSpecial = ['uncensored', 'loli', 'shota', 'milf', 'cosplay', '3d hentai', 'big oppai', 'blowjob'].includes(genre.name.toLowerCase());

                return (
                  <button
                    key={genre.name}
                    onClick={() => {
                      openGenre(genre);
                      setCurrentPage(1);
                      setSearchAnimeTerm('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-purple to-brand-rose text-white shadow-md shadow-brand-purple/30 scale-105'
                        : isSpecial
                        ? 'bg-brand-rose/15 text-brand-pink border border-brand-rose/40 hover:bg-brand-rose hover:text-white'
                        : 'bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {isSpecial && <Flame className="w-3 h-3 text-brand-rose fill-brand-rose" />}
                    <span>{genre.name}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {studios.map((studio) => {
              const isSelected = selectedStudio === studio;
              return (
                <button
                  key={studio}
                  onClick={() => {
                    handleSelectStudio(studio);
                    setSearchAnimeTerm('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-rose to-brand-pink text-white shadow-md shadow-brand-rose/30 scale-105'
                      : 'bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{studio}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SEARCH INPUT: Khusus Mencari Judul Anime di Genre ini */}
      <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchAnimeTerm}
            onChange={(e) => {
              setSearchAnimeTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Cari judul anime di genre ${activeTab === 'genres' ? selectedGenre?.name || '' : selectedStudio || ''} (contoh: Inaka, Valkyrie, Sister, Elf)...`}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-dark-850 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose transition-colors"
          />
          {searchAnimeTerm && (
            <button
              onClick={() => {
                setSearchAnimeTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end sm:self-center">
          Ditemukan <strong className="text-white">{filteredAnimeList.length}</strong> judul anime
        </div>
      </div>

      {/* Anchor for smooth scroll */}
      <div id="genre-grid-top" />

      {/* Results Header Info with 10 Items Pagination Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Menampilkan <strong className="text-white">{paginatedPosts.length}</strong> anime (10 per halaman) di <strong className="text-brand-pink">{activeTab === 'genres' ? selectedGenre?.name : selectedStudio}</strong>
        </span>
        <span className="font-semibold text-brand-purple">
          Halaman {currentPage} dari {totalPages}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {/* Posts Grid (10 items per page) */}
      {loadingPosts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, idx) => (
            <div key={idx} className="aspect-[2/3] rounded-xl bg-dark-850 animate-pulse" />
          ))}
        </div>
      ) : paginatedPosts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {paginatedPosts.map((item, idx) => (
            <MediaCard
              key={item.link + idx}
              title={item.title}
              link={item.link}
              image={item.image}
              description={item.description}
              genres={item.genres}
              aspectRatio="poster"
              badge={activeTab === 'genres' ? selectedGenre?.name : selectedStudio || 'Studio'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-900 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-slate-300 font-semibold text-sm">
            Tidak ada judul anime yang cocok dengan "{searchAnimeTerm}" di {activeTab === 'genres' ? `genre ${selectedGenre?.name}` : `studio ${selectedStudio}`}.
          </p>
          <p className="text-xs text-slate-500">Coba gunakan kata kunci pencarian judul anime yang lain.</p>
        </div>
      )}

      {/* 10 Items Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-6 border-t border-slate-800 flex items-center justify-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loadingPosts}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold disabled:opacity-40 transition-all shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="px-4 py-2.5 rounded-xl bg-dark-850 border border-slate-700 text-xs font-bold text-brand-pink shadow-inner">
            Halaman {currentPage} / {totalPages}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loadingPosts}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-rose text-white text-xs font-bold shadow-lg shadow-brand-rose/25 hover:scale-105 transition-all disabled:opacity-40"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
