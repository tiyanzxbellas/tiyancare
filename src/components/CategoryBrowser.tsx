import React, { useState, useEffect, useMemo } from 'react';
import { Layers, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { CategoryItem, MediaListItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { MediaCard } from './MediaCard';

export const CategoryBrowser: React.FC = () => {
  const { selectedCategory, openCategory } = useApp();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCats, setLoadingCats] = useState<boolean>(true);

  const [posts, setPosts] = useState<MediaListItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state: 10 items per page
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Load category list
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCats(true);
      try {
        const data = await api.getCategories();
        setCategories(data);
        if (!selectedCategory && data.length > 0) {
          openCategory(data[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat kategori.');
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Load posts whenever selectedCategory changes
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchCategoryPosts = async () => {
      setLoadingPosts(true);
      setError(null);
      setCurrentPage(1);
      try {
        const data = await api.getByCategory(selectedCategory.link, 60);
        setPosts(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat postingan kategori.');
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchCategoryPosts();
  }, [selectedCategory]);

  // 10 Items per page calculation
  const totalPages = Math.ceil(posts.length / itemsPerPage) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return posts.slice(start, start + itemsPerPage);
  }, [posts, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      const gridEl = document.getElementById('category-grid-top');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      const gridEl = document.getElementById('category-grid-top');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-pink mb-1">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Jelajahi Kategori</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {selectedCategory ? selectedCategory.name : 'Daftar Kategori'}
          </h2>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {loadingCats ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-28 rounded-xl bg-dark-850 animate-pulse" />
            ))}
          </div>
        ) : (
          categories.map((cat) => {
            const isSelected = selectedCategory?.link === cat.link;
            return (
              <button
                key={cat.link}
                onClick={() => {
                  openCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand-rose to-brand-purple text-white shadow-lg shadow-brand-rose/25 scale-105'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-pink'}`} />
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {/* Anchor for smooth scroll */}
      <div id="category-grid-top" />

      {/* Results Header Info with 10 Items Pagination Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Menampilkan <strong className="text-white">{paginatedPosts.length}</strong> konten (10 per halaman) di kategori <strong className="text-brand-pink">{selectedCategory?.name}</strong>
        </span>
        <span className="font-semibold text-brand-pink">
          Halaman {currentPage} dari {totalPages}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-center space-y-2">
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
              badge={selectedCategory?.name}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-dark-900 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-slate-400 font-medium">Belum ada konten untuk kategori ini.</p>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-purple text-white text-xs font-bold shadow-lg shadow-brand-rose/25 hover:scale-105 transition-all disabled:opacity-40"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
