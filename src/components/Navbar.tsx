import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  Dice5,
  Bookmark,
  Settings,
  Menu,
  X,
  Zap,
  Film,
  Layers,
  Tag,
  Calendar,
  FolderTree,
  Download,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types/api';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    triggerSearch,
    openRandom,
    isLoadingRandom,
    setIsSettingsOpen,
    bookmarks,
    isInstallable,
    isStandalone,
    installApp,
  } = useApp();

  const [searchInput, setSearchInput] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      triggerSearch(searchInput.trim());
      setMobileMenuOpen(false);
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Beranda', icon: <Film className="w-4 h-4" /> },
    { id: 'categories', label: 'Kategori', icon: <Layers className="w-4 h-4" /> },
    { id: 'genres', label: 'Genre', icon: <Tag className="w-4 h-4" /> },
    { id: 'directory', label: 'Direktori A-Z', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'schedule', label: 'Jadwal', icon: <Calendar className="w-4 h-4" /> },
    { id: 'doujin', label: 'Doujin', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'extractor', label: 'Ekstraktor', icon: <Zap className="w-4 h-4" /> },
    { id: 'library', label: 'Koleksi', icon: <Bookmark className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-950/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <button
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-rose via-brand-pink to-brand-purple p-0.5 shadow-lg shadow-brand-rose/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-pink fill-brand-pink group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-pink bg-clip-text text-transparent">
                  Neko<span className="text-brand-pink">Stream</span>
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-brand-rose/20 text-brand-pink border border-brand-rose/30">
                  18+
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium tracking-wide uppercase">
                Anime & Stream Hub
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-rose/15 text-brand-pink font-bold border border-brand-rose/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-dark-850'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'library' && bookmarks.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-rose text-[9px] text-white flex items-center justify-center font-bold">
                      {bookmarks.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-2">
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-40 md:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari anime... (/)"
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose focus:bg-dark-850 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Random Button */}
            <button
              onClick={openRandom}
              disabled={isLoadingRandom}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-purple/20 to-brand-rose/20 text-brand-pink border border-brand-rose/30 hover:bg-brand-rose hover:text-white transition-all text-xs font-bold shadow-sm"
              title="Putar Anime Acak (Surprise Me)"
            >
              <Dice5 className={`w-4 h-4 ${isLoadingRandom ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Acak</span>
            </button>

            {/* Install PWA Button (Desktop) */}
            {isInstallable && !isStandalone && (
              <button
                onClick={installApp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-rose/25 via-brand-pink/20 to-brand-purple/20 text-white hover:brightness-110 border border-brand-rose/40 hover:border-brand-rose/75 transition-all text-xs font-bold shadow-md shadow-brand-rose/10 animate-pulse shrink-0"
                title="Pasang Aplikasi NekoStream di Perangkat Anda (PWA)"
              >
                <Download className="w-3.5 h-3.5 text-brand-pink animate-bounce" />
                <span className="hidden md:inline">Pasang App</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Pengaturan API & Tema"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-dark-900 text-slate-300 lg:hidden border border-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3 animate-slide-up">
            {/* Mobile search bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari anime..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-rose"
              />
            </form>

            {/* Mobile PWA Install Promo */}
            {isInstallable && !isStandalone && (
              <button
                onClick={() => {
                  installApp();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-brand-rose via-brand-pink to-brand-purple text-white font-bold text-xs shadow-lg shadow-brand-rose/25"
              >
                <Smartphone className="w-4 h-4 animate-pulse" />
                <span>Pasang Aplikasi NekoStream</span>
              </button>
            )}

            {/* Nav links */}
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-brand-rose text-white shadow-md'
                        : 'bg-dark-900 text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
