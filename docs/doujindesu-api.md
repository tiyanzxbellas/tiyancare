# DoujinDesu API endpoint inventory

Observed from the current frontend bundle on 2026-08-16.

Implemented as a typed client in [`src/services/doujindesu.ts`](../src/services/doujindesu.ts)
(types: [`src/types/doujindesu.ts`](../src/types/doujindesu.ts)).

## Base URLs

```text
Site (current): https://doujin.desu.xxx
API base:       https://doujin.desu.xxx/api
Media/CDN:      https://pic.desu.xxx
Legacy URL:     http://doujindesu.tv  (currently points/redirects to the current site)
```

Paths below are relative to `https://doujin.desu.xxx/api`. Parameters in `{braces}` are placeholders.

## Current request/response protocol

- API requests send the public client header `x-app-secret` used by the current upstream web client. This header identifies a compatible client; it is not a user credential.
- JSON responses wrapped as `{ "_enc_resp_": "<hex>" }` are decoded transparently by the client using the current hour-dependent transport protocol.
- Decryption only exposes the response already returned to the caller. Bearer authentication and all server-side VIP/admin access decisions remain unchanged.
- `/manga` pagination uses a zero-based `offset`, and the total matching item count is returned in the `x-total-count` response header. The client normalizes these as `{ items, total }`.

## Public/content

### GET

```text
/announcements
/banners
/featured-items
/genres
/leaderboard?period={period}
/leaderboard?period=vip&page={page}&search={query}
/manga
/manga?limit={limit}&offset={offset}&type={type}&sort={sort}
/manga/{slug-or-id}
/manga/{mangaId}/comments
/manga/{mangaId}/reactions
/chapters/{chapterId}
/chapters/{chapterId}/comments
/chapters/{chapterId}/reactions
/menus
/pages/{slug}
/posts
/posts?limit={limit}
/posts/{slug}
/posts/{postId}/comments
/settings
/socials
/taxonomy/{taxonomyType}?page={page}&search={query}&limit={limit}
/taxonomy/{taxonomyType}/{slug}?page={page}&sort={sort}&limit={limit}
/widgets/data
/xp-info
/proxy-image?url={encodedImageUrl}
```

Known `type` examples for `/manga`: `manga`, `doujinshi`, `manhwa`.

### POST

```text
/manga/{slug-or-id}/view
/chapters/{chapterId}/view
/manga/{mangaId}/comments
/manga/{mangaId}/react
/chapters/{chapterId}/comments
/chapters/{chapterId}/react
/posts/{postId}/comments
/comments/upload
/comments/{commentId}/like
/comments/{commentId}/report
/comments/{commentId}/pin
/comments/{commentId}/unpin
```

### DELETE

```text
/comments/{commentId}
```

## Authentication

### GET

```text
/auth/me
/auth/discord/url?origin={origin}
```

### POST

```text
/auth/login
/auth/register
/auth/google
```

## User/account

### GET

```text
/devices
/notifications
/subscriptions/my
/subscriptions/packages
/subscriptions/payments
/user-reports
/user-reports/{reportId}/replies
/user/bookmarks
/user/collections
/user/manga-subscription/{mangaId}
/user/profile/{username}
```

### POST

```text
/notifications/read
/subscriptions/checkout
/subscriptions/cancel/{subscriptionId}
/subscriptions/upload-proof/{subscriptionId}
/user-reports
/user-reports/{reportId}/replies
/user/bookmarks
/user/collections
/user/collections/{collectionId}/items
/user/history
/user/manga-subscription/{mangaId}
/user/upgrade-vip
/user/upload-avatar
/user/upload-banner
/upload/{category}
/upload/banner
```

### PUT

```text
/user/password
/user/profile
```

### DELETE

```text
/devices/{deviceId}
/user-reports/replies/{replyId}
/user/collections/{collectionId}
/user/collections/{collectionId}/items/{itemId}
/user/manga-subscription/{mangaId}
```

## Chapter PDF/download

These routes use the full paths shown, or equivalently the API base plus the portion after `/api`.

### GET

```text
/api/chapters/{chapterId}/pdf-status
/api/chapters/{chapterId}/download-pdf
```

### POST

```text
/api/chapters/{chapterId}/upload-pdf
```

## Taxonomy/reactions utility

### GET

```text
/taxonomies
/terms
/terms?taxonomy={taxonomy}
/reaction-types
```

## Admin

Requires an authorized admin/staff session.

### GET

```text
/admin/advertisements
/admin/announcements
/admin/comments?page={page}&limit={limit}&search={query}
/admin/logs
/admin/manga/{mangaId}/chapters
/admin/manga/counts
/admin/manga/search
/admin/manga/search?q={query}&limit={limit}&page={page}&post_status={status}
/admin/menus
/admin/pages
/admin/posts
/admin/socials
/admin/user-reports
/admin/user-reports/{reportId}
/admin/users
/admin/users/count
```

### POST

```text
/admin/advertisements
/admin/announcements
/admin/banners
/admin/cache/clear-manga
/admin/cache/invalidate
/admin/chapters
/admin/drop-file
/admin/manga
/admin/menus
/admin/migrate-mysql
/admin/pages
/admin/posts
/admin/reaction-types
/admin/settings/bulk
/admin/socials
/admin/subscriptions/upload-qris
/admin/terms
/admin/user-reports/{reportId}/remind-reply
/admin/users
```

### PUT

```text
/admin/announcements/{id}
/admin/banners/{id}
/admin/chapters/{id}
/admin/manga/{id}
/admin/menus/{id}
/admin/menus/reorder
/admin/pages/{id}
/admin/posts/{id}
/admin/reaction-types/{id}
/admin/socials/{id}
/admin/socials/reorder
/admin/user-reports/{reportId}/status
/admin/users/{id}
```

### DELETE

```text
/admin/announcements/{id}
/admin/banners/{id}
/admin/chapters/{id}
/admin/comments/{id}
/admin/manga/{id}
/admin/menus/{id}
/admin/pages/{id}
/admin/posts/{id}
/admin/reaction-types/{id}
/admin/socials/{id}
/admin/terms/{id}
/admin/users/{id}
```

## Admin subscriptions

Paths include `/api` below because the frontend calls them directly.

### GET

```text
/api/admin/subscriptions/dashboard
/api/admin/subscriptions/logs
/api/admin/subscriptions/orders
/api/admin/subscriptions/packages
/api/admin/subscriptions/payments
/api/admin/subscriptions/settings
/api/admin/subscriptions/users
/api/admin/users?search={query}&limit={limit}
```

### POST

```text
/api/admin/subscriptions/packages
/api/admin/subscriptions/payments
/api/admin/subscriptions/settings
/api/admin/subscriptions/users/assign
/api/admin/subscriptions/users/revoke
/api/admin/subscriptions/orders/{orderId}/notify
```

### PUT

```text
/api/admin/subscriptions/packages/{id}
/api/admin/subscriptions/payments/{id}
/api/admin/subscriptions/orders/{orderId}/status
```

### DELETE

```text
/api/admin/subscriptions/packages/{id}
/api/admin/subscriptions/payments/{id}
```

## Access notes

- Public tests returned HTTP 200 for `/settings`, `/manga`, `/genres`, `/posts`, and `/featured-items`.
- Protected routes return HTTP 403 without the required session/token.
- The client transparently decodes the site's encrypted JSON transport envelope (`_enc_resp_`). This does not bypass authentication, VIP, or admin controls.
- Endpoints are undocumented and can change whenever the frontend bundle is updated.
