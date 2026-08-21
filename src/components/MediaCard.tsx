import React from 'react';
import { Play, Star, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from './ImageWithFallback';
import { parseDescription, cleanTitle, extractEpisodeNumber } from '../utils/parser';

interface MediaCardProps {
  title: string;
  link: string;
  image: string;
  description?: string | null;
  date?: string;
  genres?: string[];
  aspectRatio?: 'poster' | 'video';
  badge?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  title,
  link,
  image,
  description,
  date,
  genres = [],
  aspectRatio = 'poster',
  badge,
}) => {
  const { openDetail, isBookmarked, toggleBookmark } = useApp();
  const parsed = parseDescription(description);
  const displayTitle = cleanTitle(title);
  const epNum = extractEpisodeNumber(title);
  const bookmarked = isBookmarked(link);

  const finalGenres = genres.length > 0 ? genres : (parsed.genres || []);
  const score = parsed.score;
  const duration = parsed.duration;

  const handleCardClick = () => {
    openDetail(link);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark({
      title: displayTitle || title,
      link,
      image,
      genres: finalGenres,
      description: description || undefined,
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-dark-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-brand-rose/60 transition-all duration-300 hover:shadow-xl hover:shadow-brand-rose/10 hover:-translate-y-1 cursor-pointer"
    >
      {/* Image Wrapper */}
      <div
        className={`relative w-full ${
          aspectRatio === 'poster' ? 'aspect-[2/3]' : 'aspect-video'
        } overflow-hidden bg-dark-850`}
      >
        <ImageWithFallback
          src={image}
          alt={displayTitle || title}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap gap-1.5 items-center">
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-rose text-white rounded-md shadow-md">
                {badge}
              </span>
            )}
            {epNum && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-dark-900/90 backdrop-blur-md text-brand-cyan border border-brand-cyan/30 rounded-md">
                {epNum}
              </span>
            )}
            {score && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold bg-amber-500/90 text-dark-950 rounded-md">
                <Star className="w-3 h-3 fill-dark-950" />
                {score}
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkClick}
            className={`pointer-events-auto p-1.5 rounded-lg backdrop-blur-md transition-all ${
              bookmarked
                ? 'bg-brand-rose text-white shadow-lg shadow-brand-rose/30 scale-105'
                : 'bg-dark-900/80 text-slate-300 hover:text-white hover:bg-dark-800'
            }`}
            title={bookmarked ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
          >
            {bookmarked ? (
              <BookmarkCheck className="w-4 h-4 fill-white" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
          <div className="w-12 h-12 rounded-full bg-brand-rose/90 backdrop-blur text-white flex items-center justify-center shadow-lg shadow-brand-rose/40">
            <Play className="w-5 h-5 ml-0.5 fill-white" />
          </div>
        </div>

        {/* Bottom Metadata in Image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-slate-300">
          {duration ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-dark-900/80 backdrop-blur text-slate-300">
              <Clock className="w-3 h-3 text-brand-pink" />
              {duration}
            </span>
          ) : date ? (
            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
              {date}
            </span>
          ) : null}

          {parsed.type && (
            <span className="text-[10px] font-semibold text-brand-purple bg-dark-900/80 backdrop-blur px-1.5 py-0.5 rounded">
              {parsed.type}
            </span>
          )}
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <h3
          className="text-xs md:text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-brand-pink transition-colors leading-snug"
          title={title}
        >
          {displayTitle || title}
        </h3>

        {/* Genres tag list */}
        {finalGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {finalGenres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-[10px] text-slate-400 bg-dark-800 px-1.5 py-0.5 rounded-md border border-slate-700/50"
              >
                {genre}
              </span>
            ))}
            {finalGenres.length > 2 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{finalGenres.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
