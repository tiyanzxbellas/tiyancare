/**
 * DouyinDesu API — type definitions.
 *
 * Endpoint inventory observed from the frontend bundle on 2026-08-16
 * (see docs/doujindesu-api.md). The API is undocumented and response
 * shapes can change whenever the upstream frontend bundle is updated,
 * so most entity types below are intentionally permissive: known/likely
 * fields are optional and every entity accepts extra keys.
 */

/** Generic permissive entity: known fields optional + arbitrary extra keys. */
export interface DDEntity {
  id?: string | number;
  [key: string]: unknown;
}

/**
 * Wire format used by encrypted JSON responses. The API client decodes this
 * envelope transparently before returning data to callers.
 */
export interface EncryptedEnvelope {
  _enc_resp_: string;
  [key: string]: unknown;
}

/** Generic paginated list envelope (shape may vary per endpoint). */
export interface Paginated<T> {
  data?: T[];
  items?: T[];
  rows?: T[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Content entities
// ---------------------------------------------------------------------------

export type MangaType = 'manga' | 'doujinshi' | 'manhwa' | (string & {});

export interface MangaItem extends DDEntity {
  slug?: string;
  title?: string;
  type?: MangaType;
  thumbnail?: string;
  image?: string;
  score?: number | string;
  status?: string;
}

export interface ChapterItem extends DDEntity {
  mangaId?: string | number;
  title?: string;
  number?: number | string;
}

export interface GenreItem extends DDEntity {
  name?: string;
  slug?: string;
}

export interface BannerItem extends DDEntity {
  image?: string;
  url?: string;
}

export interface AnnouncementItem extends DDEntity {
  title?: string;
  content?: string;
}

export interface MenuItem extends DDEntity {
  label?: string;
  url?: string;
  children?: MenuItem[];
}

export interface PageItem extends DDEntity {
  slug?: string;
  title?: string;
  content?: string;
}

export interface PostItem extends DDEntity {
  slug?: string;
  title?: string;
  content?: string;
}

export interface SocialItem extends DDEntity {
  name?: string;
  url?: string;
  icon?: string;
}

export interface LeaderboardEntry extends DDEntity {
  username?: string;
  xp?: number;
  rank?: number;
}

export interface CommentItem extends DDEntity {
  content?: string;
  username?: string;
  createdAt?: string;
  likes?: number;
  pinned?: boolean;
}

export interface ReactionItem extends DDEntity {
  type?: string;
  count?: number;
}

export interface TaxonomyItem extends DDEntity {
  slug?: string;
  name?: string;
  type?: string;
}

export interface TermItem extends DDEntity {
  slug?: string;
  name?: string;
  taxonomy?: string;
}

export interface XpInfo extends DDEntity {
  level?: number;
  xp?: number;
}

// ---------------------------------------------------------------------------
// Auth & user entities
// ---------------------------------------------------------------------------

export interface AuthUser extends DDEntity {
  username?: string;
  email?: string;
  vip?: boolean;
  avatar?: string;
  banner?: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password?: string;
  [key: string]: unknown;
}

export interface RegisterPayload {
  username?: string;
  email?: string;
  password?: string;
  [key: string]: unknown;
}

export interface GoogleAuthPayload {
  /** Google credential / ID token passed by the frontend. */
  credential?: string;
  token?: string;
  [key: string]: unknown;
}

export interface DeviceItem extends DDEntity {
  name?: string;
  platform?: string;
  lastActive?: string;
}

export interface NotificationItem extends DDEntity {
  title?: string;
  message?: string;
  read?: boolean;
}

export interface SubscriptionPackage extends DDEntity {
  name?: string;
  price?: number | string;
  duration?: string;
}

export interface SubscriptionItem extends DDEntity {
  packageId?: string | number;
  status?: string;
  expiresAt?: string;
}

export interface PaymentItem extends DDEntity {
  amount?: number | string;
  status?: string;
  method?: string;
}

export interface UserReportItem extends DDEntity {
  subject?: string;
  message?: string;
  status?: string;
}

export interface ReportReplyItem extends DDEntity {
  message?: string;
  createdAt?: string;
}

export interface BookmarkItem extends DDEntity {
  mangaId?: string | number;
}

export interface CollectionItem extends DDEntity {
  name?: string;
  items?: DDEntity[];
}

// ---------------------------------------------------------------------------
// Chapter PDF
// ---------------------------------------------------------------------------

export interface PdfStatus extends DDEntity {
  status?: string;
  progress?: number;
  url?: string;
}

// ---------------------------------------------------------------------------
// Admin entities
// ---------------------------------------------------------------------------

export interface AdminListItem extends DDEntity {
  /* Admin list rows vary per resource; keep fully permissive. */
}

export interface AdminCounts extends DDEntity {
  manga?: number;
  chapters?: number;
  users?: number;
  comments?: number;
}

export interface AdminUserCount extends DDEntity {
  total?: number;
}

// ---------------------------------------------------------------------------
// Query parameter helpers
// ---------------------------------------------------------------------------

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all' | 'vip' | (string & {});

export interface MangaListQuery {
  limit?: number;
  /** Zero-based result offset used by the current `/manga` endpoint. */
  offset?: number;
  type?: MangaType;
  sort?: string;
  search?: string;
}

/** Normalized manga list plus the API's `x-total-count` response metadata. */
export interface MangaListResult {
  items: MangaItem[];
  total: number;
}

export interface TaxonomyListQuery {
  page?: number;
  search?: string;
  limit?: number;
}

export interface TaxonomyTermQuery {
  page?: number;
  sort?: string;
  limit?: number;
}
