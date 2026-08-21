# 🐱 NekoStream - Modern Anime & Video Streaming Web App

Web Frontend modern, cepat, dan responsif berbasis **Vite + React (TypeScript) + Tailwind CSS** yang dirancang khusus untuk mengonsumsi API Scraper NekoPoi live (`https://name-neko-api.vercel.app`). Mendukung deployment instan ke **Vercel**.

---

## ✨ Fitur Utama

- 🚀 **Performa Tinggi dengan Vite 6 & React 18**: Waktu muat kilat, transisi halus, dan optimasi bundle produksi.
- 🎨 **Desain Modern Dark Cyberpunk / Anime UI**: Gradien neon, glassmorphism, responsive card grid, dan tema modern yang nyaman di mata.
- 🎬 **Multi-Server Embedded Video Player**:
  - Dukungan streaming server langsung (`Playmogo`, `Streampoi`, embed iframe).
  - Mode Bioskop (Theater Mode) & Mode Redup Layar (Lights Off).
  - Ekstraksi stream video background otomatis via API (`/api/extract` & `/api/jobs`).
  - Pemilih episode interaktif dengan auto-play episode pertama.
- 📥 **Pengelola Unduhan Multi-Kualitas**: Pengelompokan kualitas (1080p, 720p, 480p, 360p) dengan tombol penyedia langsung (Mp4Upload, PixelDrain, Mirror).
- 🔍 **Pencarian Cerdas & Cepat**:
  - Shortcut keyboard (tekan `/` di keyboard untuk langsung mencari).
  - Rekomendasi kata kunci populer (*Isekai, Maid, Elf, Cosplay, dll.*).
- 📂 **Jelajahi 5 Kategori & 78+ Genre**:
  - Kategori: *Hentai, 2D Animation, 3D Hentai, JAV, JAV Cosplay*.
  - Filter pencarian genre instan dengan selector limit (15, 30, 45, 60 konten).
- 🎲 **Fitur "Acak" (Surprise Me)**: Temukan anime / konten acak dengan satu klik langsung di navbar.
- 📅 **Jadwal Rilis & Update Tracker**: Pantau pembaruan berkala dari API.
- ⚡ **Video Extractor & Job Monitor Tool**: Halaman khusus untuk mengekstrak stream player dari URL postingan mana pun dan memantau status antrean job.
- 📚 **Perpustakaan Pribadi (LocalStorage)**:
  - **Daftar Favorit / Watchlist**: Simpan anime favorit tanpa perlu login database.
  - **Riwayat Tontonan (Watch History)**: Rekam episode terakhir yang ditonton beserta timestamp.
- 🛡️ **Peringatan Batas Usia 18+ (Age Verification Gate)**: Dialog konfirmasi usia yang tersimpan di browser.
- ⚙️ **Pengaturan Base URL Fleksibel**: Pengguna dapat mengganti API Base URL secara dinamis lewat modal pengaturan di antarmuka web.
- 📖 **DouyinDesu API Client**: Modul client terketik untuk seluruh inventaris endpoint DouyinDesu (`src/services/doujindesu.ts`), lihat [docs/doujindesu-api.md](docs/doujindesu-api.md).

---

## 📖 DoujinDesu API Client

Selain API Scraper NekoPoi, proyek ini menyertakan client untuk **DouyinDesu API** (`https://doujin.desu.xxx/api`):

- **Inventaris endpoint lengkap** terdokumentasi di [`docs/doujindesu-api.md`](docs/doujindesu-api.md) (public/content, auth, user/account, chapter PDF, taxonomy, admin, dan admin subscriptions).
- **Client terketik** di [`src/services/doujindesu.ts`](src/services/doujindesu.ts) dengan tipe di [`src/types/doujindesu.ts`](src/types/doujindesu.ts).
- Manajemen **token/session** (`Bearer`) via localStorage — `doujindesuApi.auth.login/register` menyimpan token secara otomatis.
- **Base URL dapat dikonfigurasi** lewat `VITE_DOUJINDESU_API_BASE_URL` (lihat `.env.example`) atau `setApiBaseUrl()` saat runtime.
- Decoding transparan untuk envelope respons `_enc_resp_` menggunakan protokol transport publik upstream; autentikasi dan pemeriksaan akses/VIP tetap diberlakukan oleh server.

Contoh pemakaian:

```ts
import { doujindesuApi } from './services/doujindesu';

const mangaList = await doujindesuApi.public.getMangaList({ limit: 20, offset: 0, type: 'manga' });
console.log(mangaList.items, mangaList.total);
const detail = await doujindesuApi.public.getManga('contoh-slug');
const pdf = await doujindesuApi.pdf.download(chapterId); // Blob
```

> ⚠️ Endpoint tidak terdokumentasi resmi dan dapat berubah kapan pun bundle frontend DouyinDesu diperbarui.

---

## 🚀 Cara Menjalankan Secara Lokal (Development)

1. **Install Dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan Development Server Vite:**
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173`.

3. **Build untuk Produksi:**
   ```bash
   npm run build
   ```

---

## ☁️ Panduan Deployment ke Vercel (1-Click / CLI / Git)

Aplikasi ini sudah dilengkapi dengan file `vercel.json` yang telah dikonfigurasi untuk Single Page Application (SPA) routing dan header keamanan.

### Cara 1: Menggunakan Vercel CLI (Paling Cepat)
```bash
npm install -g vercel
vercel
```
Ikuti petunjuk di terminal: pilih direktori saat ini dan gunakan preset **Vite**.

### Cara 2: Hubungkan dengan GitHub / GitLab
1. Unggah kode proyek ini ke repositori Git (GitHub/GitLab).
2. Masuk ke dashboard [Vercel](https://vercel.com).
3. Klik **"Add New..."** -> **"Project"** -> Import repositori Anda.
4. Framework Preset akan otomatis terdeteksi sebagai **Vite**.
5. *(Opsional)* Tambahkan Environment Variable:
   - `VITE_API_BASE_URL` = `https://name-neko-api.vercel.app`
6. Klik **Deploy**! Proyek akan langsung aktif dalam hitungan detik.

---

## 📡 Daftar Endpoint API yang Digunakan

Base API URL: `https://name-neko-api.vercel.app`

| Endpoint | Metode | Deskripsi |
|---|---|---|
| `/api/home?page=1` | `GET` | Beranda (Rekomendasi, Hentai Terbaru, Episode Terbaru, JAV Terbaru) |
| `/api/category` | `GET` | Daftar 5 kategori utama |
| `/api/genre` | `GET` | Daftar 78+ genre |
| `/api/bycategory?url=<url>&limit=30` | `GET` | Postingan berdasarkan URL kategori |
| `/api/bygenre?url=<url>&limit=30` | `GET` | Postingan berdasarkan URL genre |
| `/api/search?q=<kata>&limit=30` | `GET` | Pencarian konten berdasarkan kata kunci |
| `/api/detail?url=<url>` | `GET` | Detail lengkap post (sinopsis, info, episode, stream & download) |
| `/api/random` | `GET` | Mengambil detail 1 konten acak |
| `/api/schedule` | `GET` | Jadwal rilis dan pembaruan |
| `/api/extract?url=<url>` | `GET` | Memulai ekstraksi stream video background (menghasilkan `jobId` / embed) |
| `/api/jobs` | `GET` | Status seluruh background job ekstraksi |
| `/api/job/:id` | `GET` | Status job ekstraksi tertentu |

---

## 🐍 Script Pengujian Python

Script Python mandiri juga disertakan di `neko_api_client.py` untuk menguji dan memvalidasi seluruh endpoint sekaligus dari terminal:
```bash
python3 neko_api_client.py
```

---

## 📦 Struktur Proyek

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── AgeWarningModal.tsx    # Dialog konfirmasi usia 18+
│   │   ├── BottomNav.tsx          # Navigasi bawah untuk mobile
│   │   ├── CategoryBrowser.tsx    # Penjelajah kategori konten
│   │   ├── DetailView.tsx         # Halaman detail & video player
│   │   ├── ExtractorTool.tsx      # Video stream extractor & monitor
│   │   ├── Footer.tsx             # Footer dan status API
│   │   ├── GenreBrowser.tsx       # Penjelajah 78+ genre
│   │   ├── HeroBanner.tsx         # Banner carousel pilihan utama
│   │   ├── HomeView.tsx           # Tampilan halaman utama
│   │   ├── ImageWithFallback.tsx  # Komponen gambar anti-blokir referrer
│   │   ├── LibraryView.tsx        # Favorit & Riwayat tontonan
│   │   ├── MediaCard.tsx          # Kartu media anime responsif
│   │   ├── Navbar.tsx             # Header navigasi & bar pencarian
│   │   ├── ScheduleView.tsx       # Jadwal rilis
│   │   ├── SearchView.tsx         # Pencarian dengan filter limit
│   │   ├── SettingsModal.tsx      # Pengaturan custom API Base URL
│   │   └── ToastContainer.tsx     # Notifikasi interaktif
│   ├── context/
│   │   └── AppContext.tsx         # State management & LocalStorage sync
│   ├── services/
│   │   └── api.ts                 # API Client terstruktur untuk semua endpoint
│   ├── types/
│   │   └── api.ts                 # TypeScript interfaces untuk data API
│   ├── utils/
│   │   └── parser.ts              # Metadata parsing helpers
│   ├── App.tsx                    # Komponen root aplikasi
│   ├── index.css                  # Tailwind styles & scrollbar
│   └── main.tsx                   # Entry point React
├── neko_api_client.py             # Script pengujian Python
├── package.json                   # Dependensi & script build
├── tailwind.config.js             # Konfigurasi tema dan warna
├── tsconfig.json                  # Konfigurasi TypeScript
├── vercel.json                    # Konfigurasi deployment Vercel
└── vite.config.ts                 # Konfigurasi Vite & dev server
```
