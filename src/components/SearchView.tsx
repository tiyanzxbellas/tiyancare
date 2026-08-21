import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import { MediaListItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { MediaCard } from './MediaCard';

const POPULAR_SEARCHES = ['Isekai', 'Maid', 'Elf', 'Cosplay', 'Milf', 'Schoolgirl', 'Nurse', 'Uncensored', 'Succubus'];

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const [results, setResults] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Sync internal search term when global search query changes
  useEffect(() => {
    setSearchTerm(searchQuery);
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query || !query.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const data = await api.search(query.trim(), limit);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Gagal mencari anime.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm.trim());
      handleSearch(searchTerm.trim());
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    setSearchQuery(tag);
    handleSearch(tag);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Search Header Form */}
      <div className="p-6 md:p-8 rounded-2xl bg-dark-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-brand-pink">
          <Search className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Pencarian Anime & Video</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik judul anime, karakter, atau kata kunci..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-dark-850 border border-slate-700 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-dark-850 text-slate-200 border border-slate-700 text-sm rounded-xl px-3 py-3.5 focus:outline-none focus:border-brand-rose"
            >
              <option value={15}>15 Hasil</option>
              <option value={30}>30 Hasil</option>
              <option value={45}>45 Hasil</option>
              <option value={60}>60 Hasil</option>
            </select>

            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white font-bold text-sm shadow-lg shadow-brand-rose/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Mencari...' : 'Cari'}
            </button>
          </div>
        </form>

        {/* Popular search tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
            Populer:
          </span>
          {POPULAR_SEARCHES.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            Hasil Pencarian untuk: <span className="text-brand-pink">"{searchQuery || searchTerm}"</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {results.length} item ditemukan
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {/* Loading Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, idx) => (
            <div key={idx} className="aspect-[2/3] rounded-xl bg-dark-850 animate-pulse" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {results.map((item, idx) => (
            <MediaCard
              key={item.link + idx}
              title={item.title}
              link={item.link}
              image={item.image}
              description={item.description}
              genres={item.genres}
              aspectRatio="poster"
            />
          ))}
        </div>
      ) : hasSearched ? (
        <div className="text-center py-20 bg-dark-900 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-base text-slate-300 font-semibold">
            Tidak ada hasil untuk "{searchQuery || searchTerm}"
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba kata kunci lain atau pilih dari rekomendasi populer di atas.
          </p>
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-900/60 rounded-2xl border border-slate-800/60 space-y-2">
          <Search className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-medium text-sm">
            Ketik kata kunci di kolom pencarian untuk menemukan anime & episode favoritmu.
          </p>
        </div>
      )}
    </div>
  );
};
