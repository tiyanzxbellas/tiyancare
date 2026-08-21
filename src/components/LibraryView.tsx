import React, { useState } from 'react';
import { Bookmark, History, Trash2, Play, Star, Clock, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MediaCard } from './MediaCard';
import { ImageWithFallback } from './ImageWithFallback';
import { cleanTitle } from '../utils/parser';

export const LibraryView: React.FC = () => {
  const {
    bookmarks,
    history,
    clearHistory,
    removeFromHistory,
    removeBookmark,
    openDetail,
  } = useApp();
  const [subTab, setSubTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const filteredBookmarks = bookmarks.filter((b) =>
    b.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredHistory = history.filter((h) =>
    h.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-rose mb-1">
            <Bookmark className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Koleksi Pribadi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Perpustakaan Saya</h2>
        </div>

        {/* SubTab switcher */}
        <div className="flex items-center gap-2 bg-dark-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSubTab('bookmarks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'bookmarks'
                ? 'bg-brand-rose text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Favorit ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'history'
                ? 'bg-brand-rose text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Bookmarks Section */}
      {subTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredBookmarks.map((item) => (
                <MediaCard
                  key={item.id}
                  title={item.title}
                  link={item.link}
                  image={item.image}
                  description={item.description}
                  genres={item.genres}
                  aspectRatio="poster"
                  badge="Favorit"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-dark-900 rounded-2xl border border-slate-800 space-y-3">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Belum Ada Favorit</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Klik ikon bookmark pada anime atau video mana pun untuk menyimpannya di sini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Watch History Section */}
      {subTab === 'history' && (
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bersihkan Riwayat
              </button>
            </div>
          )}

          {filteredHistory.length > 0 ? (
            <div className="space-y-2.5">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openDetail(item.link)}
                  className="p-3.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-800 hover:border-brand-rose/50 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-brand-pink truncate">
                        {cleanTitle(item.title) || item.title}
                      </h4>
                      {item.episodeTitle && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {item.episodeTitle}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(item.watchedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(item.link);
                      }}
                      className="p-2 rounded-lg bg-brand-rose/20 text-brand-rose hover:bg-brand-rose hover:text-white transition-colors"
                      title="Lanjut Nonton"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.link);
                      }}
                      className="p-2 rounded-lg bg-dark-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Hapus item ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-dark-900 rounded-2xl border border-slate-800 space-y-3">
              <History className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Riwayat Masih Kosong</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tonton anime atau video untuk melihat riwayat tontonanmu di sini.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
