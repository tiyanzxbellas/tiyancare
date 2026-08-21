import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Star,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { doujindesuApi } from '../services/doujindesu';
import { useApp } from '../context/AppContext';
import { DoujinReader } from './DoujinReader';
import { ImageWithFallback } from './ImageWithFallback';
import {
  listFromResponse,
  mangaLookupKey,
  normalizeManga,
  numberFromResponse,
  type MangaItem,
} from '../utils/doujin';

type MangaType = '' | 'manga' | 'doujinshi' | 'manhwa';

interface BannerItem {
  image?: string;
  url?: string;
  [key: string]: unknown;
}

export const DoujinView: React.FC = () => {
  const { addToast } = useApp();
  const [mangaType, setMangaType] = useState<MangaType>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Data states
  const [featured, setFeatured] = useState<MangaItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [genres, setGenres] = useState<{ name?: string; slug?: string }[]>([]);
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingManga, setLoadingManga] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [currentBanner, setCurrentBanner] = useState(0);
  // Title opened in the in-app reader. `null` shows the browse grid.
  const [selected, setSelected] = useState<MangaItem | null>(null);
  const itemsPerPage = 20;

  // Fetch initial data (announcements, banners, featured, genres)
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        const [announceData, bannerData, featuredData, genreData] = await Promise.all([
          doujindesuApi.public.getAnnouncements().catch(() => []),
          doujindesuApi.public.getBanners().catch(() => []),
          doujindesuApi.public.getFeaturedItems().catch(() => []),
          doujindesuApi.public.getGenres().catch(() => []),
        ]);

        setAnnouncements(
          listFromResponse(announceData)
            .map((a) => a.title || a.content || a.message || '')
            .filter(Boolean)
        );
        setBanners(
          listFromResponse(bannerData).map((banner) => ({
            ...banner,
            image: banner.image || banner.image_url || banner.banner || banner.url_image,
            url: banner.url || banner.link || banner.target_url,
          }))
        );
        setFeatured(listFromResponse(featuredData).map(normalizeManga));
        setGenres(
          listFromResponse(genreData).map((genre) => ({
            ...genre,
            name: genre.name || genre.title || genre.label,
            slug: genre.slug || genre.name,
          }))
        );
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data awal.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // Auto rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Fetch manga list when type, search, or page changes
  const fetchManga = useCallback(async () => {
    setLoadingManga(true);
    setError(null);
    try {
      const params = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        sort: 'latest_chapter',
        type: mangaType || undefined,
        search: searchQuery || undefined,
      };

      const result = await doujindesuApi.public.getMangaList(params);
      const items = listFromResponse(result).map(normalizeManga);
      setMangaList(items);
      setTotalItems(numberFromResponse(result, items.length));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar manga.');
      setMangaList([]);
    } finally {
      setLoadingManga(false);
    }
  }, [mangaType, page, searchQuery, itemsPerPage]);

  useEffect(() => {
    fetchManga();
  }, [fetchManga]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleTypeChange = (type: MangaType) => {
    setMangaType(type);
    setPage(1);
    setSearchQuery('');
    setSearchInput('');
  };

  /**
   * Opens a title inside the app. Previously the cards linked straight to
   * `https://doujin.desu.xxx/manga/<id>`, but the website routes by slug, so
   * every id-only item landed on the upstream 404 page.
   */
  const openManga = (item: MangaItem) => {
    const key = mangaLookupKey(item);
    if (!key) {
      addToast({
        type: 'error',
        title: 'Tidak Bisa Dibuka',
        message: 'Judul ini tidak menyertakan ID/slug dari server.',
      });
      return;
    }
    setSelected(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (selected) {
    return (
      <DoujinReader
        mangaKey={mangaLookupKey(selected)}
        preview={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-pink mb-1">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">DoujinDesu Indonesia</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Doujin & Manga Reader
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Jelajahi koleksi manga, doujinshi, dan manhwa dari DoujinDesu
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          <div className="w-full h-[200px] rounded-2xl bg-dark-900 animate-pulse border border-slate-800" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-dark-850 animate-pulse" />
            ))}
          </div>
        </div>
      ) : error && mangaList.length === 0 ? (
        /* Error State */
        <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Gagal Memuat Halaman Doujin</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => { setPage(1); fetchManga(); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-rose text-white text-xs font-bold hover:scale-105 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Announcements Bar */}
          {announcements.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-rose/10 via-brand-purple/10 to-brand-pink/10 border border-brand-rose/30 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <Sparkles className="w-4 h-4 text-brand-pink shrink-0" />
                <span className="font-semibold shrink-0">Pengumuman DoujinDesu:</span>
                <span className="text-slate-300 truncate min-w-0">{announcements[0]}</span>
              </div>
            </div>
          )}

          {/* Banners Carousel */}
          {banners.length > 0 && (
            <div className="relative w-full h-[180px] sm:h-[240px] rounded-2xl overflow-hidden bg-dark-900 border border-slate-800 shadow-xl group">
              {banners.map((banner, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ${
                    idx === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                >
                  {banner.image ? (
                    <ImageWithFallback
                      src={banner.image}
                      alt={banner.url || `Banner ${idx + 1}`}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-dark-850">
                      <ImageIcon className="w-10 h-10 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/60 to-transparent" />
                  {banner.url && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <a
                        href={banner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-rose text-white text-xs font-bold hover:scale-105 transition-all shadow-lg"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Kunjungi
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {/* Banner Dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-dark-900/70 backdrop-blur px-2.5 py-1.5 rounded-full">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`transition-all rounded-full ${
                        idx === currentBanner
                          ? 'w-5 h-1.5 bg-brand-rose'
                          : 'w-1.5 h-1.5 bg-slate-500 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Featured Items (if available) */}
          {featured.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-lg font-extrabold text-white">Item Unggulan</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {featured.slice(0, 6).map((item, idx) => (
                  <button
                    key={mangaLookupKey(item) || idx}
                    type="button"
                    onClick={() => openManga(item)}
                    className="group relative flex flex-col text-left bg-dark-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-brand-rose/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="relative w-full aspect-[2/3] overflow-hidden bg-dark-850">
                      <ImageWithFallback
                        src={item.thumbnail || item.image || ''}
                        alt={item.title || ''}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-60" />
                      {item.score && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-dark-950 rounded-md">
                          <Star className="w-3 h-3 fill-dark-950" />
                          {item.score}
                        </div>
                      )}
                      {item.type && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold uppercase bg-brand-pink/90 text-white rounded-md">
                          {item.type}
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-brand-pink transition-colors leading-snug">
                        {item.title || 'Untitled'}
                      </h4>
                      {item.status && (
                        <span className="text-[10px] text-slate-500 mt-1">{item.status}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Genre Chips */}
          {genres.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Genre Populer</span>
                <span className="text-xs text-brand-pink font-semibold">{genres.length} Genre</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                {genres.slice(0, 30).map((genre, idx) => (
                  <button
                    key={genre.slug || idx}
                    onClick={() => {
                      setSearchInput(genre.name || '');
                      setSearchQuery(genre.name || '');
                      setPage(1);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                  >
                    {genre.name || genre.slug || `Genre ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manga List Section */}
          <section className="space-y-4">
            {/* Type Filter + Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 bg-dark-900 p-1.5 rounded-2xl border border-slate-800">
                {([
                  { value: '', label: 'Semua' },
                  { value: 'manga', label: 'Manga' },
                  { value: 'doujinshi', label: 'Doujinshi' },
                  { value: 'manhwa', label: 'Manhwa' },
                ] as { value: MangaType; label: string }[]).map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeChange(type.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      mangaType === type.value
                        ? 'bg-gradient-to-r from-brand-rose to-brand-pink text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari manga..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-dark-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose transition-colors"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <span className="text-xs">&times;</span>
                  </button>
                )}
              </form>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Menampilkan <strong className="text-white">{mangaList.length}</strong> dari <strong className="text-brand-pink">{totalItems}</strong> judul
                {mangaType && <span> (tipe: <strong className="text-white">{mangaType}</strong>)</span>}
                {searchQuery && <span> — pencarian: "<strong className="text-white">{searchQuery}</strong>"</span>}
              </span>
              <span>Halaman {page} dari {totalPages}</span>
            </div>

            {/* Manga Grid */}
            {loadingManga ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-dark-850 animate-pulse" />
                ))}
              </div>
            ) : mangaList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {mangaList.map((item, idx) => (
                  <button
                    key={mangaLookupKey(item) || idx}
                    type="button"
                    onClick={() => openManga(item)}
                    className="group relative flex flex-col text-left bg-dark-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-brand-rose/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="relative w-full aspect-[2/3] overflow-hidden bg-dark-850">
                      <ImageWithFallback
                        src={item.thumbnail || item.image || ''}
                        alt={item.title || ''}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-80 group-hover:opacity-60" />
                      {item.score && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-dark-950 rounded-md">
                          <Star className="w-3 h-3 fill-dark-950" />
                          {item.score}
                        </div>
                      )}
                      {item.type && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold uppercase bg-brand-pink/90 text-white rounded-md shadow">
                          {item.type}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <div className="w-10 h-10 rounded-full bg-brand-rose/90 text-white flex items-center justify-center shadow-lg">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-1">
                      <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-brand-pink transition-colors leading-snug">
                        {item.title || 'Untitled'}
                      </h4>
                      {item.status && (
                        <span className="text-[10px] text-slate-500">{item.status}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-dark-900 rounded-2xl border border-slate-800 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">Tidak Ditemukan</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada manga yang cocok dengan "${searchQuery}"`
                    : 'Belum ada manga untuk ditampilkan.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-slate-800 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingManga}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold disabled:opacity-40 transition-all shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className="px-4 py-2.5 rounded-xl bg-dark-850 border border-slate-700 text-xs font-bold text-brand-pink shadow-inner">
                  Halaman {page} / {totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loadingManga}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white text-xs font-bold shadow-lg shadow-brand-rose/25 hover:scale-105 transition-all disabled:opacity-40"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};