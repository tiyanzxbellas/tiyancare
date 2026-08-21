import React, { Suspense, lazy, useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { AgeWarningModal } from './components/AgeWarningModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { Sparkles, X } from 'lucide-react';

// Lazy loading views for optimized initial bundle loading (FCP, LCP, SI)
const CategoryBrowser = lazy(() => import('./components/CategoryBrowser').then(m => ({ default: m.CategoryBrowser })));
const GenreBrowser = lazy(() => import('./components/GenreBrowser').then(m => ({ default: m.GenreBrowser })));
const DirectoryView = lazy(() => import('./components/DirectoryView').then(m => ({ default: m.DirectoryView })));
const SearchView = lazy(() => import('./components/SearchView').then(m => ({ default: m.SearchView })));
const ScheduleView = lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const ExtractorTool = lazy(() => import('./components/ExtractorTool').then(m => ({ default: m.ExtractorTool })));
const LibraryView = lazy(() => import('./components/LibraryView').then(m => ({ default: m.LibraryView })));
const DetailView = lazy(() => import('./components/DetailView').then(m => ({ default: m.DetailView })));
const DoujinView = lazy(() => import('./components/DoujinView').then(m => ({ default: m.DoujinView })));

// Loader component for Code Splitting Suspense fallback
const LoadingFallback = () => (
  <div className="w-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-slate-500 py-20">
    <Sparkles className="w-8 h-8 animate-spin text-brand-pink" />
    <span className="text-xs font-semibold">Memuat Tampilan...</span>
  </div>
);

export const AppContent: React.FC = () => {
  const {
    activeTab,
    activeDetailUrl,
    isInstallable,
    isStandalone,
    installApp,
  } = useApp();

  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hide_pwa_banner') !== 'true';
    }
    return true;
  });

  const dismissBanner = () => {
    setShowPwaBanner(false);
    try {
      localStorage.setItem('hide_pwa_banner', 'true');
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 selection:bg-brand-rose selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6">
        <Suspense fallback={<LoadingFallback />}>
          {/* If a detail post is active, show the DetailView */}
          {activeDetailUrl ? (
            <DetailView />
          ) : (
            <>
              {activeTab === 'home' && <HomeView />}
              {activeTab === 'categories' && <CategoryBrowser />}
              {activeTab === 'genres' && <GenreBrowser />}
              {activeTab === 'directory' && <DirectoryView />}
              {activeTab === 'schedule' && <ScheduleView />}
              {activeTab === 'search' && <SearchView />}
              {activeTab === 'extractor' && <ExtractorTool />}
              {activeTab === 'library' && <LibraryView />}
              {activeTab === 'doujin' && <DoujinView />}
            </>
          )}
        </Suspense>
      </main>

      {/* Footer */}
      {!activeDetailUrl && <Footer />}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Age Warning Gate (18+) */}
      <AgeWarningModal />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Floating PWA Install Banner */}
      {isInstallable && !isStandalone && showPwaBanner && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-40 max-w-sm w-auto bg-dark-900/95 backdrop-blur-md border border-brand-rose/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-rose to-brand-pink p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-dark-950 rounded-[9px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-pink fill-brand-pink animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-extrabold text-white">Pasang NekoStream</h5>
              <p className="text-[10px] text-slate-400 truncate">Lebih cepat, hemat kuota & bisa offline!</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={installApp}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-rose to-brand-pink text-white text-[10px] font-black hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
            >
              Pasang
            </button>
            <button
              onClick={dismissBanner}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              title="Sembunyikan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toasts */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
