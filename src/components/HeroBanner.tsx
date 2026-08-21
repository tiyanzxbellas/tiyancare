import React, { useState, useEffect } from 'react';
import {
  Play,
  Star,
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { HomeRecommendedItem } from '../types/api';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from './ImageWithFallback';
import { parseDescription, cleanTitle } from '../utils/parser';

interface HeroBannerProps {
  items: HomeRecommendedItem[];
  loading?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items, loading = false }) => {
  const { openDetail, isBookmarked, toggleBookmark } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto advance every 6 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items]);

  if (loading || !items || items.length === 0) {
    return (
      <div className="relative w-full h-[380px] md:h-[460px] rounded-2xl bg-dark-900 overflow-hidden border border-slate-800 animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Sparkles className="w-10 h-10 animate-spin text-brand-pink" />
          <span className="text-sm font-semibold">Memuat Rekomendasi Utama...</span>
        </div>
      </div>
    );
  }

  const current = items[currentIndex];
  const parsed = parseDescription(current.description);
  const title = cleanTitle(current.title);
  const bookmarked = isBookmarked(current.link);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="relative w-full min-h-[420px] md:min-h-[460px] rounded-3xl overflow-hidden bg-dark-950 border border-slate-800/80 shadow-2xl group flex flex-col justify-between p-5 sm:p-8 md:p-10">
      {/* 1. Vivid Background Backdrop with Clear Artwork Visibility */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <ImageWithFallback
          src={current.image}
          alt={title}
          priority={true}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover object-center scale-105 opacity-40 md:opacity-50 transition-all duration-1000 group-hover:scale-110"
        />
        {/* Soft Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/85 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/60" />
      </div>

      {/* 2. Main Hero Content Layout */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between gap-6">
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Info Column */}
          <div className="flex-1 space-y-3 md:space-y-4 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-brand-rose to-brand-purple text-white shadow-lg shadow-brand-rose/25 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Pilihan Utama
              </span>
              {parsed.score && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-dark-950 shadow">
                  <Star className="w-3.5 h-3.5 fill-dark-950" />
                  {parsed.score}
                </span>
              )}
              {parsed.status && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-850/90 text-slate-300 border border-slate-700">
                  {parsed.status}
                </span>
              )}
            </div>

            {/* Anime Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg line-clamp-2">
              {title}
            </h1>

            {/* Japanese Title & Producer */}
            {(parsed.japaneseTitle || parsed.producer) && (
              <p className="text-xs md:text-sm text-slate-300 font-medium line-clamp-1">
                {parsed.japaneseTitle && <span className="mr-3">{parsed.japaneseTitle}</span>}
                {parsed.producer && (
                  <span className="text-brand-purple font-semibold">Studio: {parsed.producer}</span>
                )}
              </p>
            )}

            {/* Genres Chips */}
            {parsed.genres && parsed.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {parsed.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-2.5 py-1 rounded-lg bg-dark-850/90 backdrop-blur-md text-slate-200 border border-slate-700/70 font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Meta Duration */}
            {parsed.duration && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-brand-pink" />
                <span>Durasi: {parsed.duration}</span>
              </div>
            )}
          </div>

          {/* Right Poster Thumbnail (Visible & Crisp on Desktop & Tablet) */}
          <div
            onClick={() => openDetail(current.link)}
            className="hidden sm:block w-36 md:w-48 lg:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 hover:border-brand-rose transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-rotate-1 shrink-0 bg-dark-900 group/poster relative"
          >
            <ImageWithFallback
              src={current.image}
              alt={title}
              priority={true}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-end justify-center p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1 bg-brand-rose/90 px-3 py-1 rounded-lg">
                <Play className="w-3.5 h-3.5 fill-white" /> Putar
              </span>
            </div>
          </div>
        </div>

        {/* CTA Action Buttons - precisely positioned above pagination indicator */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => openDetail(current.link)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white font-bold text-sm shadow-lg shadow-brand-rose/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Tonton Sekarang
          </button>

          <button
            onClick={() =>
              toggleBookmark({
                title,
                link: current.link,
                image: current.image,
                genres: parsed.genres,
                description: current.description,
              })
            }
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border backdrop-blur-md transition-all ${
              bookmarked
                ? 'bg-brand-rose/20 border-brand-rose text-brand-rose'
                : 'bg-dark-850/80 border-slate-700 text-slate-200 hover:bg-dark-800 hover:text-white'
            }`}
          >
            {bookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 fill-brand-rose" />
                <span>Tersimpan</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Bottom Slide Controller (Dots & Arrows NEVER cover title text) */}
      <div className="relative z-10 w-full pt-4 mt-2 border-t border-slate-800/60 flex items-center justify-between gap-4">
        {/* Slide Counter */}
        <span className="text-xs font-mono text-slate-400 font-semibold">
          <span className="text-brand-pink font-bold">{(currentIndex + 1).toString().padStart(2, '0')}</span> / {items.length.toString().padStart(2, '0')}
        </span>

        {/* Slide Controller Pill (Left Arrow + Dots + Right Arrow) */}
        <div className="flex items-center gap-2 bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-lg">
          {/* Previous Arrow */}
          <button
            onClick={prevSlide}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 px-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full ${
                  currentIndex === idx
                    ? 'w-5 h-1.5 bg-gradient-to-r from-brand-rose to-brand-purple'
                    : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={nextSlide}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
