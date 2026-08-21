import React from 'react';
import { Film, Layers, FolderTree, Zap, Bookmark, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types/api';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, bookmarks } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Beranda', icon: <Film className="w-4 h-4" /> },
    { id: 'categories', label: 'Kategori', icon: <Layers className="w-4 h-4" /> },
    { id: 'doujin', label: 'Doujin', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'directory', label: 'Index A-Z', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'extractor', label: 'Ekstraktor', icon: <Zap className="w-4 h-4" /> },
    { id: 'library', label: 'Koleksi', icon: <Bookmark className="w-4 h-4" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-brand-pink font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="text-[9px] mt-0.5">{tab.label}</span>
            {tab.id === 'library' && bookmarks.length > 0 && (
              <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-brand-rose" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
