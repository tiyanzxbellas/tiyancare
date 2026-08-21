import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Download,
  Star,
  Clock,
  Eye,
  Tv,
  Share2,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  FolderDown,
  Film,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DetailData, EpisodeItem, DownloadGroup } from '../types/api';
import { ImageWithFallback } from './ImageWithFallback';
import { VideoPlayer } from './VideoPlayer';
import { cleanTitle } from '../utils/parser';

export const DetailView: React.FC = () => {
  const {
    activeDetailUrl,
    closeDetail,
    isBookmarked,
    toggleBookmark,
    addToHistory,
    openGenre,
    addToast,
  } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<EpisodeItem | null>(null);
  const [activeStreamIndex, setActiveStreamIndex] = useState<number>(0);
  const [synopsisExpanded, setSynopsisExpanded] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load detail whenever activeDetailUrl changes
  const loadDetail = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setExtractedLinks([]);
    try {
      const data = await api.getDetail(url);
      setDetail(data);

      // If it's a standalone episode or has stream links right away
      if (data.streamLinks && data.streamLinks.length > 0) {
        setActiveStreamIndex(0);
        // Add to watch history
        addToHistory({
          title: cleanTitle(data.title) || data.title,
          link: data.url || url,
          image: data.image,
          episodeTitle: data.title,
        });
      } else if (data.episodes && data.episodes.length > 0) {
        // If it's a series page with episodes, auto-select episode 1 to get stream links
        const firstEp = data.episodes[0];
        setActiveEpisode(firstEp);
        // Fetch first episode details
        try {
          const epData = await api.getDetail(firstEp.link);
          if (epData.streamLinks && epData.streamLinks.length > 0) {
            setDetail((prev) => (prev ? { ...prev, streamLinks: epData.streamLinks, downloadLinks: epData.downloadLinks } : prev));
            setActiveStreamIndex(0);
          }
        } catch {
          // ignore auto ep fetch error
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail konten.');
    } finally {
      setLoading(false);
    }
  }, [addToHistory]);

  useEffect(() => {
    if (activeDetailUrl) {
      loadDetail(activeDetailUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeDetailUrl, loadDetail]);

  if (!activeDetailUrl) return null;

  // Handle switching episode
  const handleSelectEpisode = async (ep: EpisodeItem) => {
    setActiveEpisode(ep);
    setLoading(true);
    try {
      const epData = await api.getDetail(ep.link);
      setDetail((prev) => {
        if (!prev) return epData;
        return {
          ...prev,
          streamLinks: epData.streamLinks || [],
          downloadLinks: epData.downloadLinks || [],
        };
      });
      setActiveStreamIndex(0);
      addToHistory({
        title: cleanTitle(detail?.title || ep.title),
        link: ep.link,
        image: epData.image || detail?.image || '',
        episodeTitle: ep.title,
      });
      addToast({
        type: 'info',
        title: 'Memuat Episode',
        message: ep.title,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Memuat Episode',
        message: err.message || 'Server episode tidak merespons.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Video stream extraction tool trigger
  const handleStartExtract = async () => {
    const targetUrl = activeEpisode?.link || activeDetailUrl;
    if (!targetUrl) return;

    setExtracting(true);
    addToast({
      type: 'info',
      title: 'Mengekstrak Video...',
      message: 'Menghubungi server ekstraksi video background...',
    });

    try {
      const res = await api.startExtract(targetUrl);
      if (res.embedLinks && res.embedLinks.length > 0) {
        setExtractedLinks(res.embedLinks);
        addToast({
          type: 'success',
          title: 'Ekstraksi Berhasil!',
          message: `Ditemukan ${res.embedLinks.length} server streaming baru.`,
        });
      } else if (res.jobId) {
        addToast({
          type: 'info',
          title: 'Tugas Ekstraksi Dimulai',
          message: `Job ID: ${res.jobId}. Menunggu status...`,
        });
        // Poll job once after 3s
        setTimeout(async () => {
          try {
            const jobRes = await api.getJobById(res.jobId!);
            if (jobRes.job?.embedLinks && jobRes.job.embedLinks.length > 0) {
              setExtractedLinks(jobRes.job.embedLinks);
              addToast({
                type: 'success',
                title: 'Ekstraksi Selesai!',
                message: 'Server stream baru siap dimainkan.',
              });
            }
          } catch {
            // ignore
          }
        }, 3000);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Ekstraksi Gagal',
        message: err.message || 'Tidak dapat mengekstrak stream.',
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'success',
        title: 'Tautan Disalin!',
        message: 'Link halaman telah disalin ke clipboard.',
      });
    }
  };

  // Combine native streams and newly extracted streams
  const allStreams = [
    ...(detail?.streamLinks || []),
    ...extractedLinks.filter((link) => !detail?.streamLinks?.includes(link)),
  ];

  const currentStreamUrl = allStreams[activeStreamIndex] || null;
  const displayTitle = cleanTitle(detail?.title || '');
  const bookmarked = isBookmarked(detail?.url || activeDetailUrl);

  return (
    <div className="relative w-full min-h-screen pb-24 animate-fade-in">
      {/* Top Header Navigation Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-dark-950/90 backdrop-blur-md border-b border-slate-800">
        <button
          onClick={closeDetail}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 transition-colors text-sm font-semibold"
        >
          <X className="w-4 h-4" />
          <span>Kembali / Tutup</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Bagikan"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Bookmark */}
          {detail && (
            <button
              onClick={() =>
                toggleBookmark({
                  title: displayTitle || detail.title,
                  link: detail.url || activeDetailUrl,
                  image: detail.image,
                  genres: detail.details?.genre?.split(',').map((g) => g.trim()),
                  description: detail.synopsis || undefined,
                })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                bookmarked
                  ? 'bg-brand-rose text-white border-brand-rose'
                  : 'bg-dark-850 text-slate-300 hover:text-white border-slate-700 hover:bg-dark-800'
              }`}
            >
              {bookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">Tersimpan</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Simpan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && !detail && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-4 border-brand-rose border-t-transparent animate-spin" />
          <p className="text-slate-300 font-medium">Memuat data video & server stream...</p>
        </div>
      )}

      {/* Error state */}
      {error && !detail && (
        <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Gagal Memuat Halaman</h3>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={() => loadDetail(activeDetailUrl)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-rose text-white font-semibold text-sm hover:bg-brand-rose/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Content Body */}
      {detail && (
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-8 pt-2 sm:pt-4 space-y-6">
          {/* Main Video Streaming Area (Rentang Penuh / 16:9 Melebar) */}
          <div className="w-full">
            <VideoPlayer
              streamUrl={currentStreamUrl}
              title={displayTitle || detail.title}
              poster={detail.image}
              allStreams={allStreams}
              activeStreamIndex={activeStreamIndex}
              onSelectStream={(idx) => setActiveStreamIndex(idx)}
              onExtractStream={handleStartExtract}
              isExtracting={extracting}
            />
          </div>

          {/* Episode List Section (if available) */}
          {detail.episodes && detail.episodes.length > 0 && (
            <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-pink" />
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Daftar Episode ({detail.episodes.length})
                  </h3>
                </div>
                {activeEpisode && (
                  <span className="text-xs text-brand-cyan bg-brand-cyan/10 px-2.5 py-1 rounded-full border border-brand-cyan/30">
                    Memutar: {activeEpisode.title}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {detail.episodes.map((ep, idx) => {
                  const isCurrent = activeEpisode?.link === ep.link;
                  return (
                    <button
                      key={ep.link + idx}
                      onClick={() => handleSelectEpisode(ep)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-brand-rose/15 border-brand-rose text-white shadow-md'
                          : 'bg-dark-850/80 hover:bg-dark-800 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-brand-rose text-white shadow-md shadow-brand-rose/40'
                            : 'bg-dark-800 text-slate-400'
                        }`}
                      >
                        {isCurrent ? <Play className="w-4 h-4 fill-white" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold line-clamp-2 leading-tight">
                          {cleanTitle(ep.title) || ep.title}
                        </p>
                        {ep.date && (
                          <span className="text-[10px] text-slate-500 mt-1 block">{ep.date}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Download Links Section (if available) */}
          {detail.downloadLinks && detail.downloadLinks.length > 0 && (
            <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderDown className="w-5 h-5 text-brand-cyan" />
                  <h3 className="text-base sm:text-lg font-bold text-white">Tautan Unduhan & Streaming Alternatif</h3>
                </div>
                <span className="text-xs text-slate-400">Pilih kualitas / mirror unduhan</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detail.downloadLinks.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-dark-850/70 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-pink bg-brand-pink/10 px-2.5 py-1 rounded-md border border-brand-pink/30">
                        {group.resolution || `Kualitas ${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {group.links.map((linkItem, lIdx) => (
                        <a
                          key={lIdx}
                          href={linkItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-brand-rose hover:text-white text-slate-200 text-xs font-medium border border-slate-700 hover:border-brand-rose transition-all group"
                        >
                          <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                          <span>{linkItem.provider}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata & Synopsis Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Poster & Quick Specs */}
            <div className="lg:col-span-1 space-y-4">
              <div className="w-full aspect-[2/3] max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <ImageWithFallback
                  src={detail.image}
                  alt={displayTitle || detail.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Quick specs table */}
              <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-2.5 text-xs">
                {detail.views && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-400" /> Dilihat:
                    </span>
                    <span className="font-semibold text-slate-200">{detail.views}</span>
                  </div>
                )}

                {detail.details &&
                  Object.entries(detail.details).map(([key, value]) => {
                    if (key.toLowerCase() === 'genre') return null; // rendered separately
                    return (
                      <div
                        key={key}
                        className="flex items-start justify-between py-1 border-b border-slate-800/80 gap-3"
                      >
                        <span className="text-slate-400 capitalize whitespace-nowrap">{key}:</span>
                        <span className="font-semibold text-slate-200 text-right">{value}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Column: Title, Genres, Synopsis */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {displayTitle || detail.title}
                </h1>

                {/* Genre chips */}
                {detail.details?.genre && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {detail.details.genre.split(',').map((g) => {
                      const cleanG = g.trim();
                      return (
                        <button
                          key={cleanG}
                          onClick={() =>
                            openGenre({
                              name: cleanG,
                              link: `https://nekopoi.care/genres/${cleanG.toLowerCase().replace(/\s+/g, '-')}/`,
                            })
                          }
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-dark-850 hover:bg-brand-rose/20 text-slate-300 hover:text-brand-rose border border-slate-700 hover:border-brand-rose/50 transition-all"
                        >
                          {cleanG}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Synopsis Box */}
              {detail.synopsis && (
                <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-pink" />
                    Sinopsis Cerita
                  </h3>
                  <p
                    className={`text-slate-300 text-sm leading-relaxed transition-all ${
                      !synopsisExpanded ? 'line-clamp-4' : ''
                    }`}
                  >
                    {detail.synopsis}
                  </p>
                  {detail.synopsis.length > 200 && (
                    <button
                      onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                      className="text-xs font-bold text-brand-pink hover:text-brand-rose transition-colors"
                    >
                      {synopsisExpanded ? 'Sembunyikan' : 'Baca Selengkapnya...'}
                    </button>
                  )}
                </div>
              )}

              {/* Extracted stream links log if any */}
              {extractedLinks.length > 0 && (
                <div className="p-4 rounded-2xl bg-brand-purple/10 border border-brand-purple/30 space-y-2">
                  <h4 className="text-xs font-bold text-brand-purple flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Hasil Ekstraksi Stream Tambahan
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {extractedLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-dark-950/80 text-xs"
                      >
                        <span className="truncate max-w-md text-slate-300 font-mono">{link}</span>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(link);
                              addToast({
                                type: 'success',
                                title: 'Link Disalin',
                                message: link,
                              });
                            }
                          }}
                          className="text-brand-pink hover:underline ml-2 font-medium"
                        >
                          Salin
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
