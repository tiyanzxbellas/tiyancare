import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  BookmarkItem,
  HistoryItem,
  CategoryItem,
  GenreItem,
  ToastMessage,
  DetailData,
} from '../types/api';
import { api } from '../services/api';

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  triggerSearch: (query: string) => void;

  // Selected Detail Modal / View
  activeDetailUrl: string | null;
  openDetail: (url: string) => void;
  closeDetail: () => void;

  // Category & Genre active views
  selectedCategory: CategoryItem | null;
  openCategory: (cat: CategoryItem) => void;
  selectedGenre: GenreItem | null;
  openGenre: (genre: GenreItem) => void;

  // Bookmarks
  bookmarks: BookmarkItem[];
  isBookmarked: (url: string) => boolean;
  toggleBookmark: (item: { title: string; link: string; image: string; genres?: string[]; description?: string }) => void;
  removeBookmark: (url: string) => void;

  // Watch History
  history: HistoryItem[];
  addToHistory: (item: { title: string; link: string; image: string; episodeTitle?: string; lastServer?: string }) => void;
  clearHistory: () => void;
  removeFromHistory: (url: string) => void;

  // 18+ Age Gate
  isAgeVerified: boolean;
  verifyAge: () => void;

  // Settings
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Quick Random
  openRandom: () => void;
  isLoadingRandom: boolean;

  // PWA Install
  deferredPrompt: any;
  isInstallable: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BOOKMARKS_KEY = 'neko_bookmarks_v1';
const HISTORY_KEY = 'neko_history_v1';
const AGE_VERIFIED_KEY = 'neko_age_verified';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDetailUrl, setActiveDetailUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<GenreItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState<boolean>(false);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
        || (navigator as any).standalone
        || document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('beforeinstallprompt event fired and stored');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      addToast({
        type: 'success',
        title: 'Aplikasi Terpasang!',
        message: 'NekoStream berhasil dipasang ke perangkat Anda.',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      addToast({
        type: 'info',
        title: 'Instalasi Tidak Tersedia',
        message: 'Aplikasi sudah terpasang atau browser Anda tidak mendukung pemasangan otomatis.',
      });
      return;
    }

    // Show the browser's install prompt
    deferredPrompt.prompt();

    try {
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        addToast({
          type: 'success',
          title: 'Memasang Aplikasi',
          message: 'Memulai proses pemasangan ke perangkat...',
        });
      }
    } catch (err) {
      console.error('Error prompt:', err);
    }

    // Discard the prompt
    setDeferredPrompt(null);
  }, [deferredPrompt, addToast]);

  // Age verification state
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AGE_VERIFIED_KEY) === 'true';
    }
    return false;
  });

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(BOOKMARKS_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync Bookmarks to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Sync History to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const verifyAge = useCallback(() => {
    setIsAgeVerified(true);
    try {
      localStorage.setItem(AGE_VERIFIED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const openDetail = useCallback((url: string) => {
    if (!url) return;
    setActiveDetailUrl(url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeDetail = useCallback(() => {
    setActiveDetailUrl(null);
  }, []);

  const openCategory = useCallback((cat: CategoryItem) => {
    setSelectedCategory(cat);
    setActiveTab('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openGenre = useCallback((genre: GenreItem) => {
    setSelectedGenre(genre);
    setActiveTab('genres');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const triggerSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isBookmarked = useCallback((url: string) => {
    return bookmarks.some((b) => b.link === url || b.id === url);
  }, [bookmarks]);

  const removeBookmark = useCallback((url: string) => {
    setBookmarks((prev) => prev.filter((b) => b.link !== url && b.id !== url));
  }, []);

  const toggleBookmark = useCallback((item: { title: string; link: string; image: string; genres?: string[]; description?: string }) => {
    const exists = bookmarks.some((b) => b.link === item.link || b.id === item.link);
    if (exists) {
      removeBookmark(item.link);
      addToast({
        type: 'info',
        title: 'Dihapus dari Favorit',
        message: item.title,
      });
    } else {
      const newBookmark: BookmarkItem = {
        id: item.link,
        title: item.title,
        link: item.link,
        image: item.image,
        genres: item.genres,
        description: item.description,
        addedAt: Date.now(),
      };
      setBookmarks((prev) => [newBookmark, ...prev]);
      addToast({
        type: 'success',
        title: 'Ditambahkan ke Favorit',
        message: item.title,
      });
    }
  }, [bookmarks, removeBookmark, addToast]);

  const addToHistory = useCallback((item: { title: string; link: string; image: string; episodeTitle?: string; lastServer?: string }) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.link !== item.link);
      const newEntry: HistoryItem = {
        id: item.link,
        title: item.title,
        link: item.link,
        image: item.image,
        episodeTitle: item.episodeTitle,
        lastServer: item.lastServer,
        watchedAt: Date.now(),
      };
      return [newEntry, ...filtered].slice(0, 50); // Keep last 50
    });
  }, []);

  const removeFromHistory = useCallback((url: string) => {
    setHistory((prev) => prev.filter((h) => h.link !== url && h.id !== url));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    addToast({
      type: 'info',
      title: 'Riwayat Dikosongkan',
      message: 'Semua riwayat tontonan telah dihapus.',
    });
  }, [addToast]);

  const openRandom = useCallback(async () => {
    setIsLoadingRandom(true);
    try {
      const randomData: DetailData = await api.getRandom();
      if (randomData && randomData.url) {
        openDetail(randomData.url);
        addToast({
          type: 'success',
          title: 'Anime Acak Ditemukan!',
          message: randomData.title,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Memuat Acak',
        message: err.message || 'Silakan coba lagi.',
      });
    } finally {
      setIsLoadingRandom(false);
    }
  }, [openDetail, addToast]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        triggerSearch,
        activeDetailUrl,
        openDetail,
        closeDetail,
        selectedCategory,
        openCategory,
        selectedGenre,
        openGenre,
        bookmarks,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
        isAgeVerified,
        verifyAge,
        isSettingsOpen,
        setIsSettingsOpen,
        toasts,
        addToast,
        removeToast,
        openRandom,
        isLoadingRandom,
        deferredPrompt,
        isInstallable: !!deferredPrompt,
        isStandalone,
        installApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
