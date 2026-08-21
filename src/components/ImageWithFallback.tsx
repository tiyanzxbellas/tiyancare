import React, { useState, useEffect } from 'react';
import { Film, Sparkles, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../utils/parser';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  priority?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Thumbnail',
  className = '',
  containerClassName = '',
  priority = false,
  ...props
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string>(() => getImageUrl(src));

  // Reset state whenever src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
    setRetryCount(0);
    setCurrentSrc(getImageUrl(src));
  }, [src]);

  const handleError = () => {
    if (retryCount === 0 && src && currentSrc !== src) {
      // First retry: fall back to original URL in case CDN failed
      setRetryCount(1);
      setCurrentSrc(src);
    } else if (retryCount < 2 && src) {
      // Second retry: add cache buster timestamp
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        const separator = currentSrc.includes('?') ? '&' : '?';
        setCurrentSrc(`${currentSrc}${separator}retry=${retryCount + 1}`);
      }, 1000);
    } else {
      setError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-dark-900 select-none ${containerClassName}`}>
      {/* 1. Animated Processing / Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-dark-900 via-dark-850 to-dark-950 overflow-hidden">
          {/* Sweeping Glowing Shimmer Wave */}
          <div className="absolute inset-0 -inset-x-full bg-gradient-to-r from-transparent via-brand-rose/15 to-transparent animate-shimmer-wave pointer-events-none" />

          {/* Pulsing Icon Center Badge */}
          <div className="relative z-10 flex flex-col items-center gap-1.5 animate-pulse-neon">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-rose/20 via-brand-purple/20 to-brand-cyan/20 border border-brand-rose/30 flex items-center justify-center shadow-lg shadow-brand-rose/10">
              <Sparkles className="w-5 h-5 text-brand-pink fill-brand-pink/30 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {retryCount > 0 ? `Menghubungkan (${retryCount})...` : 'Memproses...'}
            </span>
          </div>

          {/* Bottom Progress Glow Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark-800 overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-brand-rose via-brand-purple to-brand-cyan animate-shimmer-wave" />
          </div>
        </div>
      )}

      {/* 2. Fallback Poster on Error */}
      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850 border border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-dark-800 border border-slate-700 flex items-center justify-center mb-1.5 shadow">
            <Film className="w-5 h-5 text-brand-rose/60" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 line-clamp-2 leading-tight px-1">
            {alt}
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Poster Preview</span>
        </div>
      ) : (
        /* 3. Image with Smooth Blur-Up & Scale Reveal Transition */
        <img
          src={currentSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          {...(priority ? { fetchpriority: 'high' } : {})}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`${className} transition-all duration-700 ease-out ${
            loaded
              ? 'opacity-100 scale-100 blur-0'
              : 'opacity-0 scale-105 blur-sm'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
