export interface HomeRecommendedItem {
  title: string;
  link: string;
  image: string;
  description: string;
}

export interface RecentHentaiItem {
  title: string;
  link: string;
  image: string;
  description: string;
}

export interface RecentEpisodeItem {
  title: string;
  link: string;
  image: string;
  date?: string;
}

export interface RecentJavItem {
  title: string;
  link: string;
  image: string;
  date?: string;
}

export interface HomeData {
  currentPage: number;
  recommended: HomeRecommendedItem[];
  recentHentai: RecentHentaiItem[];
  recentEpisodes: RecentEpisodeItem[];
  recentJav: RecentJavItem[];
}

export interface CategoryItem {
  name: string;
  link: string;
}

export interface GenreItem {
  name: string;
  link: string;
}

export interface MediaListItem {
  title: string;
  link: string;
  image: string;
  genres?: string[];
  description?: string | null;
  date?: string;
}

export interface EpisodeItem {
  title: string;
  link: string;
  date?: string;
}

export interface DownloadLinkProvider {
  provider: string;
  url: string;
}

export interface DownloadGroup {
  resolution: string;
  links: DownloadLinkProvider[];
}

export interface DetailData {
  title: string;
  url: string;
  image: string;
  views?: string;
  details?: Record<string, string>;
  synopsis?: string | null;
  episodes?: EpisodeItem[];
  streamLinks?: string[];
  downloadLinks?: DownloadGroup[];
}

export interface ExtractResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  embedLinks?: string[];
  error?: string;
}

export interface JobItem {
  id: string;
  status: 'processing' | 'completed' | 'failed' | string;
  url: string;
  startedAt?: number;
  embedLinks?: string[];
  error?: string;
}

export interface JobsResponse {
  success: boolean;
  activeJobs?: number;
  jobs: JobItem[];
}

export interface BookmarkItem {
  id: string;
  title: string;
  link: string;
  image: string;
  type?: string;
  addedAt: number;
  genres?: string[];
  description?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  link: string;
  image: string;
  watchedAt: number;
  episodeTitle?: string;
  lastServer?: string;
}

export interface HentaiDirectoryItem {
  title: string;
  link: string;
  image: string;
  japaneseTitle?: string | null;
  producer?: string | null;
  type?: string;
  status?: string | null;
  genres?: string[];
  duration?: string | null;
  score?: string | null;
}

export interface JavDirectoryItem {
  title: string;
  link: string;
}

export interface UpcomingScheduleItem {
  title: string;
  image: string;
  note?: string;
}

export type ActiveTab = 'home' | 'categories' | 'genres' | 'directory' | 'schedule' | 'search' | 'extractor' | 'library' | 'doujin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
