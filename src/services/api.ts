import {
  HomeData,
  CategoryItem,
  GenreItem,
  MediaListItem,
  DetailData,
  ExtractResponse,
  JobsResponse,
  JobItem,
  HentaiDirectoryItem,
  JavDirectoryItem,
  UpcomingScheduleItem,
} from '../types/api';

import hentaiDirectoryData from '../data/hentai_directory.json';
import javDirectoryData from '../data/jav_directory.json';
import upcomingScheduleData from '../data/upcoming_schedule.json';
import allGenresData from '../data/all_genres.json';
import allProducersData from '../data/all_producers.json';

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://name-neko-api.vercel.app';
const API_STORAGE_KEY = 'neko_api_base_url';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(API_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_API_BASE;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === DEFAULT_API_BASE) {
      localStorage.removeItem(API_STORAGE_KEY);
    } else {
      localStorage.setItem(API_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
    }
  }
}

export function resetApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_STORAGE_KEY);
  }
}

let cachedCategories: CategoryItem[] | null = null;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(fullUrl, {
    headers: {
      'Accept': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData?.message) errMsg = errData.message;
      else if (errData?.error) errMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const json = await res.json();
  if (json && json.success === false) {
    throw new Error(json.message || json.error || 'API returned failure status');
  }

  return json.data !== undefined ? json.data : (json as unknown as T);
}

export const api = {
  // Core Scraper Endpoints
  getHome: async (page = 1): Promise<HomeData> => {
    return request<HomeData>(`/api/home?page=${page}`);
  },

  getCategories: async (): Promise<CategoryItem[]> => {
    if (cachedCategories) return cachedCategories;
    const data = await request<CategoryItem[]>('/api/category');
    cachedCategories = data;
    return data;
  },

  // Returns all 118+ Complete Genres & Tags
  getGenres: async (): Promise<GenreItem[]> => {
    return allGenresData as GenreItem[];
  },

  // Returns all 199+ Studios / Producers
  getProducers: async (): Promise<string[]> => {
    return allProducersData as string[];
  },

  getByCategory: async (categoryUrl: string, limit = 60): Promise<MediaListItem[]> => {
    const encodedUrl = encodeURIComponent(categoryUrl);
    return request<MediaListItem[]>(`/api/bycategory?url=${encodedUrl}&limit=${limit}`);
  },

  // Complete Genre Query: Queries ALL 1,042+ anime series from archive + merges live API
  getByGenre: async (genreNameOrUrl: string, limit?: number): Promise<MediaListItem[]> => {
    // Extract normalized genre name
    let cleanGenre = genreNameOrUrl.trim();
    if (cleanGenre.includes('http') || cleanGenre.includes('/')) {
      const parts = cleanGenre.split('/').filter(Boolean);
      cleanGenre = parts[parts.length - 1].replace(/-/g, ' ');
    }
    const lowerQ = cleanGenre.toLowerCase();

    // 1. Query full 1,042 A-Z archive
    const directoryItems = (hentaiDirectoryData as HentaiDirectoryItem[]).filter((item) => {
      if (!item.genres || item.genres.length === 0) return false;
      return item.genres.some((g) => {
        const gl = g.toLowerCase().trim();
        return (
          gl === lowerQ ||
          gl.includes(lowerQ) ||
          lowerQ.includes(gl) ||
          (lowerQ === 'uncensored' && (gl.includes('uncensor') || gl.includes('tanpa sensor') || item.title.toLowerCase().includes('uncensor'))) ||
          (lowerQ === 'schoolgirl' && (gl.includes('school') || gl.includes('school girl'))) ||
          (lowerQ === 'netorare' && (gl.includes('ntr') || gl.includes('netorare')))
        );
      });
    });

    const archiveMapped: MediaListItem[] = directoryItems.map((item) => ({
      title: item.title,
      link: item.link,
      image: item.image,
      genres: item.genres,
      description: item.japaneseTitle
        ? `Nama Jepang: ${item.japaneseTitle} Produser: ${item.producer || '-'} Tipe: ${item.type || 'Hentai'} Skor: ${item.score || '-'}`
        : item.producer
        ? `Produser: ${item.producer}`
        : null,
    }));

    // 2. Fetch live remote API to catch any new releases
    try {
      const remoteUrl = genreNameOrUrl.startsWith('http')
        ? genreNameOrUrl
        : `https://nekopoi.care/genres/${encodeURIComponent(cleanGenre.toLowerCase().replace(/\s+/g, '-'))}/`;
      const liveItems = await request<MediaListItem[]>(
        `/api/bygenre?url=${encodeURIComponent(remoteUrl)}&limit=60`
      );

      if (liveItems && liveItems.length > 0) {
        // Merge without duplicates
        const existingLinks = new Set(archiveMapped.map((i) => i.link));
        const newItems = liveItems.filter((i) => !existingLinks.has(i.link));
        return [...newItems, ...archiveMapped];
      }
    } catch {
      // Remote fetch fallback to search
      try {
        const searchItems = await request<MediaListItem[]>(
          `/api/search?q=${encodeURIComponent(cleanGenre)}&limit=60`
        );
        if (searchItems && searchItems.length > 0) {
          const existingLinks = new Set(archiveMapped.map((i) => i.link));
          const newItems = searchItems.filter((i) => !existingLinks.has(i.link));
          return [...newItems, ...archiveMapped];
        }
      } catch {
        // ignore
      }
    }

    return archiveMapped;
  },

  // Complete Producer / Studio Query: Queries ALL 1,042+ anime series by studio
  getByProducer: async (producerName: string): Promise<MediaListItem[]> => {
    const lowerP = producerName.toLowerCase().trim();

    const directoryItems = (hentaiDirectoryData as HentaiDirectoryItem[]).filter((item) => {
      if (!item.producer) return false;
      return item.producer.toLowerCase().includes(lowerP);
    });

    const archiveMapped: MediaListItem[] = directoryItems.map((item) => ({
      title: item.title,
      link: item.link,
      image: item.image,
      genres: item.genres,
      description: item.japaneseTitle
        ? `Nama Jepang: ${item.japaneseTitle} Produser: ${item.producer || '-'} Tipe: ${item.type || 'Hentai'} Skor: ${item.score || '-'}`
        : `Produser: ${item.producer}`,
    }));

    try {
      const searchItems = await request<MediaListItem[]>(
        `/api/search?q=${encodeURIComponent(producerName)}&limit=60`
      );
      if (searchItems && searchItems.length > 0) {
        const existingLinks = new Set(archiveMapped.map((i) => i.link));
        const newItems = searchItems.filter((i) => !existingLinks.has(i.link));
        return [...newItems, ...archiveMapped];
      }
    } catch {
      // ignore
    }

    return archiveMapped;
  },

  search: async (query: string, limit = 60): Promise<MediaListItem[]> => {
    const q = query.trim().toLowerCase();

    // 1. Search in full A-Z archive
    const archiveMatches = (hentaiDirectoryData as HentaiDirectoryItem[]).filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.japaneseTitle?.toLowerCase().includes(q) ||
        item.producer?.toLowerCase().includes(q) ||
        item.genres?.some((g) => g.toLowerCase().includes(q))
      );
    });

    const archiveMapped: MediaListItem[] = archiveMatches.map((item) => ({
      title: item.title,
      link: item.link,
      image: item.image,
      genres: item.genres,
      description: item.japaneseTitle
        ? `Nama Jepang: ${item.japaneseTitle} Produser: ${item.producer || '-'} Skor: ${item.score || '-'}`
        : null,
    }));

    // 2. Also search in remote API
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const remoteItems = await request<MediaListItem[]>(`/api/search?q=${encodedQuery}&limit=${limit}`);
      if (remoteItems && remoteItems.length > 0) {
        const existing = new Set(remoteItems.map((r) => r.link));
        const additional = archiveMapped.filter((a) => !existing.has(a.link));
        return [...remoteItems, ...additional];
      }
    } catch {
      // fallback
    }

    return archiveMapped;
  },

  getDetail: async (postUrl: string): Promise<DetailData> => {
    const encodedUrl = encodeURIComponent(postUrl);
    return request<DetailData>(`/api/detail?url=${encodedUrl}`);
  },

  getRandom: async (): Promise<DetailData> => {
    // 50% chance to fetch live random API, 50% chance to pick from full 1,042 directory
    if (Math.random() > 0.5) {
      try {
        const data = await request<DetailData>('/api/random');
        if (data && data.url) return data;
      } catch {
        // fallback to random from directory
      }
    }

    const list = hentaiDirectoryData as HentaiDirectoryItem[];
    const pick = list[Math.floor(Math.random() * list.length)];
    return request<DetailData>(`/api/detail?url=${encodeURIComponent(pick.link)}`);
  },

  getSchedule: async (): Promise<string[]> => {
    return request<string[]>('/api/schedule');
  },

  startExtract: async (postUrl: string): Promise<ExtractResponse> => {
    const baseUrl = getApiBaseUrl();
    const encodedUrl = encodeURIComponent(postUrl);
    const res = await fetch(`${baseUrl}/api/extract?url=${encodedUrl}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return res.json();
  },

  getJobs: async (): Promise<JobsResponse> => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/jobs`, {
      headers: { 'Accept': 'application/json' },
    });
    return res.json();
  },

  getJobById: async (jobId: string): Promise<{ success: boolean; job?: JobItem; message?: string }> => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/job/${encodeURIComponent(jobId)}`, {
      headers: { 'Accept': 'application/json' },
    });
    return res.json();
  },

  getHentaiDirectory: async (): Promise<HentaiDirectoryItem[]> => {
    return hentaiDirectoryData as HentaiDirectoryItem[];
  },

  getJavDirectory: async (): Promise<JavDirectoryItem[]> => {
    return javDirectoryData as JavDirectoryItem[];
  },

  getUpcomingSchedule: async (): Promise<UpcomingScheduleItem[]> => {
    return upcomingScheduleData as UpcomingScheduleItem[];
  },
};
