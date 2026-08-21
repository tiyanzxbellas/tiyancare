import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Search,
  Star,
  Clock,
  Sparkles,
  Play,
  Film,
  Video,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { HentaiDirectoryItem, JavDirectoryItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from './ImageWithFallback';

const ALPHABET = ['Semua', '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const DirectoryView: React.FC = () => {
  const { openDetail } = useApp();
  const [tabType, setTabType] = useState<'hentai' | 'jav'>('hentai');
  const [hentaiList, setHentaiList] = useState<HentaiDirectoryItem[]>([]);
  const [javList, setJavList] = useState<JavDirectoryItem[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadDirectories = async () => {
      const hentai = await api.getHentaiDirectory();
      const jav = await api.getJavDirectory();
      setHentaiList(hentai);
      setJavList(jav);
    };
    loadDirectories();
  }, []);

  // Filter Hentai List
  const filteredHentai = useMemo(() => {
    let list = hentaiList;
    if (selectedLetter !== 'Semua') {
      if (selectedLetter === '#') {
        list = list.filter((item) => /^[^a-zA-Z]/i.test(item.title));
      } else {
        list = list.filter((item) =>
          item.title.toUpperCase().startsWith(selectedLetter)
        );
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.japaneseTitle?.toLowerCase().includes(q) ||
          item.producer?.toLowerCase().includes(q) ||
          item.genres?.some((g) => g.toLowerCase().includes(q))
      );
    }
    return list;
  }, [hentaiList, selectedLetter, searchQuery]);

  // Filter JAV List
  const filteredJav = useMemo(() => {
    let list = javList;
    if (selectedLetter !== 'Semua') {
      if (selectedLetter === '#') {
        list = list.filter((item) => /^[^a-zA-Z]/i.test(item.title));
      } else {
        list = list.filter((item) =>
          item.title.toUpperCase().startsWith(selectedLetter)
        );
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.title.toLowerCase().includes(q));
    }
    return list;
  }, [javList, selectedLetter, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedLetter, searchQuery, tabType]);

  const currentList = tabType === 'hentai' ? filteredHentai : filteredJav;
  const totalPages = Math.ceil(currentList.length / itemsPerPage) || 1;
  const paginatedList = currentList.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-rose mb-1">
            <FolderTree className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Direktori Lengkap Nekopoi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Katalog Index A-Z
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Jelajahi seluruh koleksi serial anime dan rilis JAV terlengkap secara alfabetis.
          </p>
        </div>

        {/* Tab Switcher: Hentai Series vs JAV */}
        <div className="flex items-center gap-2 bg-dark-900 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setTabType('hentai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tabType === 'hentai'
                ? 'bg-gradient-to-r from-brand-rose to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Hentai ({hentaiList.length})</span>
          </button>

          <button
            onClick={() => setTabType('jav')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tabType === 'jav'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>JAV & Cosplay ({javList.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Alphabet Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3 shadow-xl">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari di antara ${currentList.length} judul ${tabType === 'hentai' ? 'anime' : 'video'}...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose transition-colors"
          />
        </div>

        {/* Alphabet Horizontal Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {ALPHABET.map((letter) => {
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-brand-rose text-white shadow-md shadow-brand-rose/25 scale-105'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Menampilkan <strong className="text-white">{paginatedList.length}</strong> dari <strong className="text-brand-pink">{currentList.length}</strong> judul ({selectedLetter})
        </span>
        <span>Halaman {page} dari {totalPages}</span>
      </div>

      {/* Directory Grid */}
      {tabType === 'hentai' ? (
        /* Hentai Series Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {(paginatedList as HentaiDirectoryItem[]).map((item, idx) => (
            <div
              key={item.link + idx}
              onClick={() => openDetail(item.link)}
              className="group relative flex flex-col bg-dark-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-brand-rose/60 transition-all duration-300 hover:shadow-xl hover:shadow-brand-rose/10 hover:-translate-y-1 cursor-pointer"
            >
              <div className="relative w-full aspect-[2/3] overflow-hidden bg-dark-850">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-80 group-hover:opacity-60" />

                {/* Score badge */}
                {item.score && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-dark-950 rounded-md">
                    <Star className="w-3 h-3 fill-dark-950" />
                    {item.score}
                  </div>
                )}

                {/* Duration */}
                {item.duration && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-slate-300 bg-dark-950/80 backdrop-blur px-1.5 py-0.5 rounded">
                    <Clock className="w-3 h-3 text-brand-pink" />
                    {item.duration}
                  </div>
                )}

                {/* Play hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <div className="w-10 h-10 rounded-full bg-brand-rose text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              <div className="p-3 flex flex-col justify-between flex-1 gap-1">
                <h3
                  className="text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-brand-pink transition-colors leading-snug"
                  title={item.title}
                >
                  {item.title}
                </h3>
                {item.producer && (
                  <span className="text-[10px] text-brand-purple truncate">
                    {item.producer}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* JAV Titles List Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {(paginatedList as JavDirectoryItem[]).map((item, idx) => (
            <div
              key={item.link + idx}
              onClick={() => openDetail(item.link)}
              className="p-3.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate leading-snug">
                  {item.title}
                </h4>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pt-6 border-t border-slate-800 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-4 py-2.5 rounded-xl bg-dark-850 border border-slate-700 text-xs font-bold text-brand-pink">
            Halaman {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white text-xs font-bold shadow-lg shadow-brand-rose/25 hover:scale-105 transition-all disabled:opacity-50"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
