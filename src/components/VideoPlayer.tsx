import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Play,
  RotateCcw,
  ExternalLink,
  Tv,
  Zap,
  Copy,
  Maximize,
  Minimize,
  ScreenShare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface VideoPlayerProps {
  streamUrl: string | null;
  title: string;
  poster?: string;
  allStreams?: string[];
  activeStreamIndex?: number;
  onSelectStream?: (index: number) => void;
  onExtractStream?: () => void;
  isExtracting?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  title,
  poster,
  allStreams = [],
  activeStreamIndex = 0,
  onSelectStream,
  onExtractStream,
  isExtracting = false,
}) => {
  const { addToast } = useApp();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Some scraper responses still contain HTTP embed URLs. When the app is
  // served over HTTPS the browser blocks those as mixed content before the
  // player can even load. Upgrade them here; this is safe for these hosts and
  // keeps the player same-origin with the secure page.
  const playableUrl = streamUrl?.trim().replace(/^http:\/\//i, 'https://') || null;
  const lowerPlayableUrl = playableUrl?.toLowerCase() || '';
  const isDirectHls = /\.(m3u8|mp4)(?:$|[?#])/i.test(lowerPlayableUrl);

  // Handle HLS / direct HTML5 playback
  useEffect(() => {
    if (!playableUrl || !isDirectHls || !videoRef.current) return;

    const video = videoRef.current;
    if (lowerPlayableUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(playableUrl);
        hls.attachMedia(video);
        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playableUrl;
      }
    } else {
      video.src = playableUrl;
    }
  }, [playableUrl, lowerPlayableUrl, isDirectHls]);

  // Listen to Fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // Kembalikan orientasi ke Portrait saat keluar dari fullscreen
      if (!isCurrentlyFullscreen && screen.orientation) {
        try {
          const orientation = screen.orientation as any;
          if (typeof orientation.lock === 'function') {
            // Kunci kembali ke portrait agar layar tidak tertinggal di landscape
            orientation.lock('portrait').catch(() => {
              // Jika lock portrait tidak diizinkan, lepas kunci landscape saja
              if (screen.orientation.unlock) screen.orientation.unlock();
            });
          } else if (screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Request Fullscreen & Auto-Rotate to Landscape for Mobile Phones
  const toggleFullscreenLandscape = async () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      try {
        // Request fullscreen across browsers
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }

        // Lock screen orientation to Landscape on mobile devices
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch {
            // Orientation lock might not be supported or allowed by some browsers without user interaction
          }
        }

        addToast({
          type: 'info',
          title: 'Layar Penuh Landscape',
          message: 'Mode layar rentang melebar (landscape) aktif.',
        });
      } catch (err) {
        // Fallback: If container fullscreen fails on iOS Safari, try video native fullscreen
        if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
      }
    } else {
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }

        // Kembalikan orientasi ke Portrait setelah keluar fullscreen
        if (screen.orientation) {
          const orientation = screen.orientation as any;
          if (typeof orientation.lock === 'function') {
            orientation.lock('portrait').catch(() => {
              if (screen.orientation.unlock) screen.orientation.unlock();
            });
          } else if (screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        }
      } catch {
        // ignore
      }
    }
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
    addToast({
      type: 'info',
      title: 'Memuat Ulang Player...',
      message: 'Menghubungkan kembali ke server video.',
    });
  };

  const handleOpenExternal = () => {
    if (streamUrl) {
      window.open(playableUrl || streamUrl, '_blank', 'noopener,noreferrer');
      addToast({
        type: 'success',
        title: 'Membuka di Tab Baru',
        message: 'Video dibuka di jendela/tab baru.',
      });
    }
  };

  const handleCopyLink = () => {
    if (playableUrl && navigator.clipboard) {
      navigator.clipboard.writeText(playableUrl);
      addToast({
        type: 'success',
        title: 'Link Stream Disalin!',
        message: playableUrl,
      });
    }
  };

  if (!streamUrl) {
    return (
      <div className="relative w-full aspect-video bg-dark-950 flex flex-col items-center justify-center p-6 text-center space-y-4 border border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-rose/10 border border-brand-rose/30 text-brand-rose flex items-center justify-center animate-pulse">
          <Tv className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Server Video Belum Dipilih</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Silakan pilih salah satu server streaming di bawah atau klik tombol Ekstraksi Otomatis.
          </p>
        </div>
        {onExtractStream && (
          <button
            onClick={onExtractStream}
            disabled={isExtracting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-purple text-white text-xs font-bold shadow-lg shadow-brand-rose/25 hover:scale-105 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            {isExtracting ? 'Mengekstrak Video...' : 'Ekstrak Video Otomatis'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl space-y-0 group ${
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-none h-screen w-screen flex flex-col justify-between' : ''
      }`}
    >
      {/* Video Stream Container (Stretched 16:9 / Full Edge-to-Edge) */}
      <div
        className={`relative w-full ${
          isFullscreen ? 'flex-1 h-full' : 'aspect-video'
        } bg-black flex items-center justify-center overflow-hidden`}
      >
        {isDirectHls ? (
          /* Native HTML5 + HLS Player */
          <video
            ref={videoRef}
            controls
            playsInline
            poster={poster}
            className="w-full h-full object-contain"
          />
        ) : (
          /* High-Compatibility Embedded Player with Fullscreen Support */
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={playableUrl || undefined}
            title={title || 'NekoStream Player'}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope; clipboard-write"
            allowFullScreen
            referrerPolicy="origin"
          />
        )}

        {/* Quick Landscape / Fullscreen Overlay Button on Mobile/Desktop */}
        <button
          onClick={toggleFullscreenLandscape}
          className="absolute bottom-3 right-3 z-30 p-2.5 rounded-xl bg-dark-950/80 hover:bg-brand-rose text-white border border-slate-700/80 hover:border-brand-rose backdrop-blur-md transition-all shadow-lg shadow-black/50"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Landscape / Rentang)'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Control & Server Toolbar */}
      <div className="p-3 sm:p-4 bg-dark-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Server Switchers */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Tv className="w-3.5 h-3.5 text-brand-pink" />
            Server:
          </span>

          {allStreams.map((url, idx) => {
            const isCurrent = activeStreamIndex === idx;
            const isPlaymogo = url.includes('playmogo');
            const isStreampoi = url.includes('streampoi');
            const label = isPlaymogo
              ? `Playmogo ${idx + 1}`
              : isStreampoi
              ? `Streampoi ${idx + 1}`
              : `Server ${idx + 1}`;

            return (
              <button
                key={url + idx}
                onClick={() => onSelectStream && onSelectStream(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-brand-rose to-brand-pink text-white shadow-md shadow-brand-rose/30 scale-105'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Tools: Fullscreen Landscape, Tab Baru, Reload, Salin */}
        <div className="flex items-center gap-1.5">
          {/* Tombol Rentang / Layar Penuh Landscape */}
          <button
            onClick={toggleFullscreenLandscape}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-rose text-white text-xs font-bold shadow-md shadow-brand-rose/20 hover:scale-105 transition-all"
            title="Putar Layar Penuh / Rentang Melebar (Landscape HP)"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>Layar Penuh (Landscape)</span>
              </>
            )}
          </button>

          {/* Reload Stream */}
          <button
            onClick={handleReload}
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Muat Ulang Player"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Open in External Tab */}
          <button
            onClick={handleOpenExternal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
            title="Buka Player di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab Baru</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Salin Link Stream"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
