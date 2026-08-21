/**
 * DouyinDesu API client.
 *
 * Endpoint inventory observed from the current frontend bundle on 2026-08-16.
 * Full inventory: docs/doujindesu-api.md
 *
 * Base URLs:
 *   Site:        https://doujin.desu.xxx
 *   API base:    https://doujin.desu.xxx/api
 *   Media/CDN:   https://pic.desu.xxx
 *   Legacy:      http://doujindesu.tv (redirects to the current site)
 *
 * Notes:
 *  - Protected routes return HTTP 403 without the required session/token.
 *  - Encrypted JSON response envelopes (`_enc_resp_`) are decoded using the
 *    public transport protocol used by the current upstream client. This does
 *    NOT bypass authentication, VIP, or admin controls.
 *  - Endpoints are undocumented and can change whenever the upstream
 *    frontend bundle is updated.
 */

import type {
  EncryptedEnvelope,
  LoginPayload,
  RegisterPayload,
  GoogleAuthPayload,
  MangaListQuery,
  MangaListResult,
  TaxonomyListQuery,
  TaxonomyTermQuery,
  LeaderboardPeriod,
} from '../types/doujindesu';
import { decodeDoujinDesuResponse } from './doujindesuDecoder';

// ---------------------------------------------------------------------------
// Base URL / token configuration
// ---------------------------------------------------------------------------

export const DOUJINDESU_SITE_URL = 'https://doujin.desu.xxx';
export const DOUJINDESU_MEDIA_CDN = 'https://pic.desu.xxx';
export const DOUJINDESU_LEGACY_URL = 'http://doujindesu.tv';

// Public client identifier used by the official web client and extension.
// It is not a user credential and does not grant authenticated/VIP access.
export const DOUJINDESU_APP_SECRET = 'dfdf72051dbfdc7d76889ebd31324e74';

// Use the same-origin proxy by default. Calling the upstream domain directly from
// a browser is unreliable because its CORS policy can reject third-party origins.
// Vite and Vercel both proxy `/doujin-api` to the upstream `/api` endpoint.
const DEFAULT_API_BASE =
  import.meta.env.VITE_DOUJINDESU_API_BASE_URL || '/doujin-api';

const API_STORAGE_KEY = 'doujindesu_api_base_url';
const TOKEN_STORAGE_KEY = 'doujindesu_auth_token';

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

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

// ---------------------------------------------------------------------------
// Encrypted envelope helper
// ---------------------------------------------------------------------------

/** True when the payload is the site's encrypted `_enc_resp_` envelope. */
export function isEncryptedEnvelope(payload: unknown): payload is EncryptedEnvelope {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as EncryptedEnvelope)._enc_resp_ === 'string'
  );
}

// ---------------------------------------------------------------------------
// Request core
// ---------------------------------------------------------------------------

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface DDRequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON-serializable body (ignored when `form` is provided). */
  body?: unknown;
  /** Multipart body (FormData). Skips the JSON Content-Type header. */
  form?: FormData;
  /** Query-string parameters appended to the URL. */
  params?: QueryParams;
  /** Send the Authorization header when a token is stored (default: true). */
  auth?: boolean;
  /** Expected non-JSON response (e.g. blob for downloads). */
  responseType?: 'json' | 'blob' | 'text';
  /** Normalize an array response with its `x-total-count` header. */
  includeTotalCount?: boolean;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${cleanPath}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        qs.set(key, String(value));
      }
    });
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  return url;
}

type JsonRecord = Record<string, unknown>;

function asJsonRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null ? value as JsonRecord : null;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const payload = await response.json() as unknown;
  return isEncryptedEnvelope(payload)
    ? decodeDoujinDesuResponse(payload._enc_resp_)
    : payload;
}

function getErrorMessage(payload: unknown): string | null {
  const record = asJsonRecord(payload);
  if (typeof record?.message === 'string') return record.message;
  if (typeof record?.error === 'string') return record.error;
  return null;
}

function withTotalCount(payload: unknown, response: Response): MangaListResult {
  const record = asJsonRecord(payload);
  let items: unknown[] = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (record) {
    for (const key of ['items', 'rows', 'results', 'manga', 'mangas', 'posts']) {
      if (Array.isArray(record[key])) {
        items = record[key] as unknown[];
        break;
      }
    }
  }

  const headerTotal = response.headers.get('x-total-count');
  const embeddedTotal = record?.total ?? record?.totalItems ?? record?.count;
  const totalValue = headerTotal?.trim() || embeddedTotal;
  const parsedTotal = totalValue === null || totalValue === undefined
    ? Number.NaN
    : Number(totalValue);
  const total = Number.isFinite(parsedTotal) && parsedTotal >= 0
    ? parsedTotal
    : items.length;

  return { items: items as MangaListResult['items'], total };
}

async function request<T>(path: string, options: DDRequestOptions = {}): Promise<T> {
  const {
    body,
    form,
    params,
    auth = true,
    responseType = 'json',
    includeTotalCount = false,
    headers,
    method,
    ...rest
  } = options;

  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Accept')) finalHeaders.set('Accept', 'application/json');
  if (!finalHeaders.has('x-app-secret')) {
    finalHeaders.set('x-app-secret', DOUJINDESU_APP_SECRET);
  }

  if (auth) {
    const token = getAuthToken();
    if (token && !finalHeaders.has('Authorization')) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let finalBody: BodyInit | undefined;
  if (form) {
    finalBody = form;
  } else if (body !== undefined) {
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }
    finalBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, params), {
    ...rest,
    method: method || (finalBody !== undefined ? 'POST' : 'GET'),
    headers: finalHeaders,
    body: finalBody,
  });

  if (!res.ok) {
    let errMsg = `DouyinDesu request failed: ${res.status} ${res.statusText}`;
    try {
      errMsg = getErrorMessage(await readJsonResponse(res)) || errMsg;
    } catch {
      // Keep the HTTP status when the error body is empty or unreadable.
    }
    throw new Error(errMsg);
  }

  if (responseType === 'blob') {
    return (await res.blob()) as unknown as T;
  }
  if (responseType === 'text') {
    return (await res.text()) as unknown as T;
  }

  const json = await readJsonResponse(res);
  const record = asJsonRecord(json);
  if (record?.success === false) {
    throw new Error(
      getErrorMessage(record) || 'DouyinDesu API returned failure status'
    );
  }

  const payload = record && record.data !== undefined ? record.data : json;
  return (includeTotalCount ? withTotalCount(payload, res) : payload) as T;
}

function get<T>(path: string, params?: QueryParams, options: DDRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'GET', params });
}

function post<T>(path: string, body?: unknown, options: DDRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body: body ?? {} });
}

function postForm<T>(path: string, form: FormData, options: DDRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', form });
}

function put<T>(path: string, body?: unknown, options: DDRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'PUT', body: body ?? {} });
}

function del<T>(path: string, options: DDRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const doujindesuApi = {
  // -------------------------------------------------------------------------
  // Public / content — GET
  // -------------------------------------------------------------------------
  public: {
    getAnnouncements: () => get<unknown[]>('/announcements'),

    getBanners: () => get<unknown[]>('/banners'),

    getFeaturedItems: () => get<unknown[]>('/featured-items'),

    getGenres: () => get<unknown[]>('/genres'),

    getLeaderboard: (period: LeaderboardPeriod, extra?: { page?: number; search?: string }) =>
      get<unknown>('/leaderboard', { period, ...extra }),

    getMangaList: (query: MangaListQuery = {}) =>
      get<MangaListResult>('/manga', { ...query }, { includeTotalCount: true }),

    getManga: (slugOrId: string | number) => get<unknown>(`/manga/${encodeURIComponent(String(slugOrId))}`),

    getMangaComments: (mangaId: string | number) =>
      get<unknown[]>(`/manga/${encodeURIComponent(String(mangaId))}/comments`),

    getMangaReactions: (mangaId: string | number) =>
      get<unknown[]>(`/manga/${encodeURIComponent(String(mangaId))}/reactions`),

    getChapter: (chapterId: string | number) =>
      get<unknown>(`/chapters/${encodeURIComponent(String(chapterId))}`),

    getChapterComments: (chapterId: string | number) =>
      get<unknown[]>(`/chapters/${encodeURIComponent(String(chapterId))}/comments`),

    getChapterReactions: (chapterId: string | number) =>
      get<unknown[]>(`/chapters/${encodeURIComponent(String(chapterId))}/reactions`),

    getMenus: () => get<unknown[]>('/menus'),

    getPage: (slug: string) => get<unknown>(`/pages/${encodeURIComponent(slug)}`),

    getPosts: (limit?: number) => get<unknown[]>('/posts', { limit }),

    getPost: (slug: string) => get<unknown>(`/posts/${encodeURIComponent(slug)}`),

    getPostComments: (postId: string | number) =>
      get<unknown[]>(`/posts/${encodeURIComponent(String(postId))}/comments`),

    getSettings: () => get<unknown>('/settings'),

    getSocials: () => get<unknown[]>('/socials'),

    getTaxonomy: (taxonomyType: string, query: TaxonomyListQuery = {}) =>
      get<unknown>(`/taxonomy/${encodeURIComponent(taxonomyType)}`, { ...query }),

    getTaxonomyTerm: (taxonomyType: string, slug: string, query: TaxonomyTermQuery = {}) =>
      get<unknown>(
        `/taxonomy/${encodeURIComponent(taxonomyType)}/${encodeURIComponent(slug)}`,
        { ...query }
      ),

    getWidgetsData: () => get<unknown>('/widgets/data'),

    getXpInfo: () => get<unknown>('/xp-info'),

    /**
     * Builds the site's image proxy URL. Use this for hotlink-protected
     * images instead of fetching `/proxy-image` manually.
     */
    proxyImageUrl: (imageUrl: string): string =>
      buildUrl('/proxy-image', { url: imageUrl }),
  },

  // -------------------------------------------------------------------------
  // Public / content — POST & DELETE
  // -------------------------------------------------------------------------
  interactions: {
    viewManga: (slugOrId: string | number) =>
      post<unknown>(`/manga/${encodeURIComponent(String(slugOrId))}/view`),

    viewChapter: (chapterId: string | number) =>
      post<unknown>(`/chapters/${encodeURIComponent(String(chapterId))}/view`),

    commentOnManga: (mangaId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/manga/${encodeURIComponent(String(mangaId))}/comments`, payload),

    reactToManga: (mangaId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/manga/${encodeURIComponent(String(mangaId))}/react`, payload),

    commentOnChapter: (chapterId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/chapters/${encodeURIComponent(String(chapterId))}/comments`, payload),

    reactToChapter: (chapterId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/chapters/${encodeURIComponent(String(chapterId))}/react`, payload),

    commentOnPost: (postId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/posts/${encodeURIComponent(String(postId))}/comments`, payload),

    /** Multipart image/attachment upload for comments. */
    uploadCommentAttachment: (form: FormData) => postForm<unknown>('/comments/upload', form),

    likeComment: (commentId: string | number) =>
      post<unknown>(`/comments/${encodeURIComponent(String(commentId))}/like`),

    reportComment: (commentId: string | number, payload: Record<string, unknown> = {}) =>
      post<unknown>(`/comments/${encodeURIComponent(String(commentId))}/report`, payload),

    pinComment: (commentId: string | number) =>
      post<unknown>(`/comments/${encodeURIComponent(String(commentId))}/pin`),

    unpinComment: (commentId: string | number) =>
      post<unknown>(`/comments/${encodeURIComponent(String(commentId))}/unpin`),

    deleteComment: (commentId: string | number) =>
      del<unknown>(`/comments/${encodeURIComponent(String(commentId))}`),
  },

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------
  auth: {
    me: () => get<unknown>('/auth/me'),

    getDiscordAuthUrl: (origin: string) => get<{ url?: string } & Record<string, unknown>>('/auth/discord/url', { origin }),

    login: async (payload: LoginPayload) => {
      const data = await post<{ token?: string } & Record<string, unknown>>('/auth/login', payload);
      if (data && typeof data === 'object' && !isEncryptedEnvelope(data)) {
        const token = (data as { token?: string; accessToken?: string }).token
          ?? (data as { accessToken?: string }).accessToken;
        if (token) setAuthToken(token);
      }
      return data;
    },

    register: async (payload: RegisterPayload) => {
      const data = await post<{ token?: string } & Record<string, unknown>>('/auth/register', payload);
      if (data && typeof data === 'object' && !isEncryptedEnvelope(data)) {
        const token = (data as { token?: string; accessToken?: string }).token
          ?? (data as { accessToken?: string }).accessToken;
        if (token) setAuthToken(token);
      }
      return data;
    },

    google: (payload: GoogleAuthPayload) => post<unknown>('/auth/google', payload),
  },

  // -------------------------------------------------------------------------
  // User / account
  // -------------------------------------------------------------------------
  user: {
    // GET
    getDevices: () => get<unknown[]>('/devices'),

    getNotifications: () => get<unknown[]>('/notifications'),

    getMySubscription: () => get<unknown>('/subscriptions/my'),

    getSubscriptionPackages: () => get<unknown[]>('/subscriptions/packages'),

    getSubscriptionPayments: () => get<unknown[]>('/subscriptions/payments'),

    getUserReports: () => get<unknown[]>('/user-reports'),

    getUserReportReplies: (reportId: string | number) =>
      get<unknown[]>(`/user-reports/${encodeURIComponent(String(reportId))}/replies`),

    getBookmarks: () => get<unknown[]>('/user/bookmarks'),

    getCollections: () => get<unknown[]>('/user/collections'),

    getMangaSubscription: (mangaId: string | number) =>
      get<unknown>(`/user/manga-subscription/${encodeURIComponent(String(mangaId))}`),

    getProfile: (username: string) => get<unknown>(`/user/profile/${encodeURIComponent(username)}`),

    // POST
    markNotificationsRead: (payload: Record<string, unknown> = {}) =>
      post<unknown>('/notifications/read', payload),

    checkoutSubscription: (payload: Record<string, unknown>) =>
      post<unknown>('/subscriptions/checkout', payload),

    cancelSubscription: (subscriptionId: string | number) =>
      post<unknown>(`/subscriptions/cancel/${encodeURIComponent(String(subscriptionId))}`),

    uploadSubscriptionProof: (subscriptionId: string | number, form: FormData) =>
      postForm<unknown>(`/subscriptions/upload-proof/${encodeURIComponent(String(subscriptionId))}`, form),

    createUserReport: (payload: Record<string, unknown>) => post<unknown>('/user-reports', payload),

    replyToUserReport: (reportId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/user-reports/${encodeURIComponent(String(reportId))}/replies`, payload),

    addBookmark: (payload: Record<string, unknown>) => post<unknown>('/user/bookmarks', payload),

    createCollection: (payload: Record<string, unknown>) => post<unknown>('/user/collections', payload),

    addToCollection: (collectionId: string | number, payload: Record<string, unknown>) =>
      post<unknown>(`/user/collections/${encodeURIComponent(String(collectionId))}/items`, payload),

    addHistory: (payload: Record<string, unknown>) => post<unknown>('/user/history', payload),

    subscribeToManga: (mangaId: string | number) =>
      post<unknown>(`/user/manga-subscription/${encodeURIComponent(String(mangaId))}`),

    upgradeVip: (payload: Record<string, unknown> = {}) => post<unknown>('/user/upgrade-vip', payload),

    uploadAvatar: (form: FormData) => postForm<unknown>('/user/upload-avatar', form),

    uploadBanner: (form: FormData) => postForm<unknown>('/user/upload-banner', form),

    /** Generic upload endpoint: `/upload/{category}`. */
    upload: (category: string, form: FormData) =>
      postForm<unknown>(`/upload/${encodeURIComponent(category)}`, form),

    uploadBannerGeneric: (form: FormData) => postForm<unknown>('/upload/banner', form),

    // PUT
    updatePassword: (payload: Record<string, unknown>) => put<unknown>('/user/password', payload),

    updateProfile: (payload: Record<string, unknown>) => put<unknown>('/user/profile', payload),

    // DELETE
    deleteDevice: (deviceId: string | number) =>
      del<unknown>(`/devices/${encodeURIComponent(String(deviceId))}`),

    deleteUserReportReply: (replyId: string | number) =>
      del<unknown>(`/user-reports/replies/${encodeURIComponent(String(replyId))}`),

    deleteCollection: (collectionId: string | number) =>
      del<unknown>(`/user/collections/${encodeURIComponent(String(collectionId))}`),

    removeFromCollection: (collectionId: string | number, itemId: string | number) =>
      del<unknown>(
        `/user/collections/${encodeURIComponent(String(collectionId))}/items/${encodeURIComponent(String(itemId))}`
      ),

    unsubscribeFromManga: (mangaId: string | number) =>
      del<unknown>(`/user/manga-subscription/${encodeURIComponent(String(mangaId))}`),
  },

  // -------------------------------------------------------------------------
  // Chapter PDF / download
  // -------------------------------------------------------------------------
  pdf: {
    getStatus: (chapterId: string | number) =>
      get<unknown>(`/chapters/${encodeURIComponent(String(chapterId))}/pdf-status`),

    /** Returns the PDF file itself (Blob). */
    download: (chapterId: string | number) =>
      get<Blob>(
        `/chapters/${encodeURIComponent(String(chapterId))}/download-pdf`,
        undefined,
        { responseType: 'blob' }
      ),

    upload: (chapterId: string | number, form: FormData) =>
      postForm<unknown>(`/chapters/${encodeURIComponent(String(chapterId))}/upload-pdf`, form),
  },

  // -------------------------------------------------------------------------
  // Taxonomy / reactions utility
  // -------------------------------------------------------------------------
  taxonomy: {
    getTaxonomies: () => get<unknown[]>('/taxonomies'),

    getTerms: (taxonomy?: string) => get<unknown[]>('/terms', { taxonomy }),

    getReactionTypes: () => get<unknown[]>('/reaction-types'),
  },

  // -------------------------------------------------------------------------
  // Admin (requires an authorized admin/staff session)
  // -------------------------------------------------------------------------
  admin: {
    // GET
    getAdvertisements: () => get<unknown[]>('/admin/advertisements'),

    getAnnouncements: () => get<unknown[]>('/admin/announcements'),

    getComments: (query: { page?: number; limit?: number; search?: string } = {}) =>
      get<unknown>('/admin/comments', { ...query }),

    getLogs: () => get<unknown[]>('/admin/logs'),

    getMangaChapters: (mangaId: string | number) =>
      get<unknown[]>(`/admin/manga/${encodeURIComponent(String(mangaId))}/chapters`),

    getMangaCounts: () => get<unknown>('/admin/manga/counts'),

    searchManga: (query: { q?: string; limit?: number; page?: number; post_status?: string } = {}) =>
      get<unknown>('/admin/manga/search', { ...query }),

    getMenus: () => get<unknown[]>('/admin/menus'),

    getPages: () => get<unknown[]>('/admin/pages'),

    getPosts: () => get<unknown[]>('/admin/posts'),

    getSocials: () => get<unknown[]>('/admin/socials'),

    getUserReports: () => get<unknown[]>('/admin/user-reports'),

    getUserReport: (reportId: string | number) =>
      get<unknown>(`/admin/user-reports/${encodeURIComponent(String(reportId))}`),

    getUsers: (query: { search?: string; limit?: number; page?: number } = {}) =>
      get<unknown>('/admin/users', { ...query }),

    getUsersCount: () => get<unknown>('/admin/users/count'),

    // POST
    createAdvertisement: (payload: Record<string, unknown>) => post<unknown>('/admin/advertisements', payload),

    createAnnouncement: (payload: Record<string, unknown>) => post<unknown>('/admin/announcements', payload),

    createBanner: (payload: Record<string, unknown>) => post<unknown>('/admin/banners', payload),

    clearMangaCache: () => post<unknown>('/admin/cache/clear-manga'),

    invalidateCache: (payload: Record<string, unknown> = {}) =>
      post<unknown>('/admin/cache/invalidate', payload),

    createChapter: (payload: Record<string, unknown>) => post<unknown>('/admin/chapters', payload),

    /** Drops an uploaded file from storage. */
    dropFile: (payload: Record<string, unknown>) => post<unknown>('/admin/drop-file', payload),

    createManga: (payload: Record<string, unknown>) => post<unknown>('/admin/manga', payload),

    createMenu: (payload: Record<string, unknown>) => post<unknown>('/admin/menus', payload),

    migrateMysql: () => post<unknown>('/admin/migrate-mysql'),

    createPage: (payload: Record<string, unknown>) => post<unknown>('/admin/pages', payload),

    createPost: (payload: Record<string, unknown>) => post<unknown>('/admin/posts', payload),

    createReactionType: (payload: Record<string, unknown>) => post<unknown>('/admin/reaction-types', payload),

    bulkUpdateSettings: (payload: Record<string, unknown>) => post<unknown>('/admin/settings/bulk', payload),

    createSocial: (payload: Record<string, unknown>) => post<unknown>('/admin/socials', payload),

    uploadQris: (form: FormData) => postForm<unknown>('/admin/subscriptions/upload-qris', form),

    createTerm: (payload: Record<string, unknown>) => post<unknown>('/admin/terms', payload),

    remindUserReportReply: (reportId: string | number) =>
      post<unknown>(`/admin/user-reports/${encodeURIComponent(String(reportId))}/remind-reply`),

    createUser: (payload: Record<string, unknown>) => post<unknown>('/admin/users', payload),

    // PUT
    updateAnnouncement: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/announcements/${encodeURIComponent(String(id))}`, payload),

    updateBanner: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/banners/${encodeURIComponent(String(id))}`, payload),

    updateChapter: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/chapters/${encodeURIComponent(String(id))}`, payload),

    updateManga: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/manga/${encodeURIComponent(String(id))}`, payload),

    updateMenu: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/menus/${encodeURIComponent(String(id))}`, payload),

    reorderMenus: (payload: Record<string, unknown>) => put<unknown>('/admin/menus/reorder', payload),

    updatePage: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/pages/${encodeURIComponent(String(id))}`, payload),

    updatePost: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/posts/${encodeURIComponent(String(id))}`, payload),

    updateReactionType: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/reaction-types/${encodeURIComponent(String(id))}`, payload),

    updateSocial: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/socials/${encodeURIComponent(String(id))}`, payload),

    reorderSocials: (payload: Record<string, unknown>) => put<unknown>('/admin/socials/reorder', payload),

    updateUserReportStatus: (reportId: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/user-reports/${encodeURIComponent(String(reportId))}/status`, payload),

    updateUser: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/users/${encodeURIComponent(String(id))}`, payload),

    // DELETE
    deleteAnnouncement: (id: string | number) => del<unknown>(`/admin/announcements/${encodeURIComponent(String(id))}`),

    deleteBanner: (id: string | number) => del<unknown>(`/admin/banners/${encodeURIComponent(String(id))}`),

    deleteChapter: (id: string | number) => del<unknown>(`/admin/chapters/${encodeURIComponent(String(id))}`),

    deleteComment: (id: string | number) => del<unknown>(`/admin/comments/${encodeURIComponent(String(id))}`),

    deleteManga: (id: string | number) => del<unknown>(`/admin/manga/${encodeURIComponent(String(id))}`),

    deleteMenu: (id: string | number) => del<unknown>(`/admin/menus/${encodeURIComponent(String(id))}`),

    deletePage: (id: string | number) => del<unknown>(`/admin/pages/${encodeURIComponent(String(id))}`),

    deletePost: (id: string | number) => del<unknown>(`/admin/posts/${encodeURIComponent(String(id))}`),

    deleteReactionType: (id: string | number) =>
      del<unknown>(`/admin/reaction-types/${encodeURIComponent(String(id))}`),

    deleteSocial: (id: string | number) => del<unknown>(`/admin/socials/${encodeURIComponent(String(id))}`),

    deleteTerm: (id: string | number) => del<unknown>(`/admin/terms/${encodeURIComponent(String(id))}`),

    deleteUser: (id: string | number) => del<unknown>(`/admin/users/${encodeURIComponent(String(id))}`),
  },

  // -------------------------------------------------------------------------
  // Admin subscriptions
  // (the frontend calls these with an explicit `/api` prefix; here they are
  //  relative to the API base like everything else)
  // -------------------------------------------------------------------------
  adminSubscriptions: {
    // GET
    getDashboard: () => get<unknown>('/admin/subscriptions/dashboard'),

    getLogs: () => get<unknown[]>('/admin/subscriptions/logs'),

    getOrders: () => get<unknown[]>('/admin/subscriptions/orders'),

    getPackages: () => get<unknown[]>('/admin/subscriptions/packages'),

    getPayments: () => get<unknown[]>('/admin/subscriptions/payments'),

    getSettings: () => get<unknown>('/admin/subscriptions/settings'),

    getUsers: () => get<unknown[]>('/admin/subscriptions/users'),

    // POST
    createPackage: (payload: Record<string, unknown>) =>
      post<unknown>('/admin/subscriptions/packages', payload),

    createPayment: (payload: Record<string, unknown>) =>
      post<unknown>('/admin/subscriptions/payments', payload),

    saveSettings: (payload: Record<string, unknown>) =>
      post<unknown>('/admin/subscriptions/settings', payload),

    assignUserSubscription: (payload: Record<string, unknown>) =>
      post<unknown>('/admin/subscriptions/users/assign', payload),

    revokeUserSubscription: (payload: Record<string, unknown>) =>
      post<unknown>('/admin/subscriptions/users/revoke', payload),

    notifyOrder: (orderId: string | number) =>
      post<unknown>(`/admin/subscriptions/orders/${encodeURIComponent(String(orderId))}/notify`),

    // PUT
    updatePackage: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/subscriptions/packages/${encodeURIComponent(String(id))}`, payload),

    updatePayment: (id: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/subscriptions/payments/${encodeURIComponent(String(id))}`, payload),

    updateOrderStatus: (orderId: string | number, payload: Record<string, unknown>) =>
      put<unknown>(`/admin/subscriptions/orders/${encodeURIComponent(String(orderId))}/status`, payload),

    // DELETE
    deletePackage: (id: string | number) =>
      del<unknown>(`/admin/subscriptions/packages/${encodeURIComponent(String(id))}`),

    deletePayment: (id: string | number) =>
      del<unknown>(`/admin/subscriptions/payments/${encodeURIComponent(String(id))}`),
  },
};

export type DoujinDesuApi = typeof doujindesuApi;
