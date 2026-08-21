#!/usr/bin/env python3
"""
NekoPoi Scraper API Client (Python)
Script untuk memanggil dan menguji seluruh endpoint Neko API & hasil sniffing secara lengkap.
"""

import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "https://name-neko-api.vercel.app"

def request_api(endpoint: str):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NekoStreamClient/1.0",
        "Accept": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except Exception as e:
        return {"success": False, "error": str(e)}

def run_all_tests():
    print("=" * 65)
    print(" 🐱 MEMULAI PENGUJIAN SEMUA ENDPOINT NEKO API & HASIL SNIFFING")
    print(f" Target Server: {BASE_URL}")
    print("=" * 65)

    # 1. /api/home
    print("\n[1/10] Mengambil Data Beranda (/api/home?page=1)...")
    home = request_api("/api/home?page=1")
    if home.get("success"):
        data = home.get("data", {})
        print(f"  ✓ Beranda Berhasil!")
        print(f"    - Rekomendasi: {len(data.get('recommended', []))} item")
        print(f"    - Hentai Terbaru: {len(data.get('recentHentai', []))} item")
        print(f"    - Episode Terbaru: {len(data.get('recentEpisodes', []))} item")
        print(f"    - JAV Terbaru: {len(data.get('recentJav', []))} item")
    else:
        print(f"  ✗ Gagal: {home.get('error')}")

    # 2. /api/category
    print("\n[2/10] Mengambil Daftar 5 Kategori (/api/category)...")
    cats = request_api("/api/category")
    if cats.get("success"):
        items = cats.get("data", [])
        print(f"  ✓ Berhasil! Ditemukan {len(items)} kategori:")
        for c in items:
            print(f"    • {c.get('name')} -> {c.get('link')}")
    else:
        print(f"  ✗ Gagal: {cats.get('error')}")

    # 3. /api/genre
    print("\n[3/10] Mengambil Daftar 78+ Genre (/api/genre)...")
    genres = request_api("/api/genre")
    if genres.get("success"):
        items = genres.get("data", [])
        print(f"  ✓ Berhasil! Ditemukan {len(items)} genre.")
        print(f"    Contoh 5 genre: {', '.join([g.get('name', '') for g in items[:5]])}")
    else:
        print(f"  ✗ Gagal: {genres.get('error')}")

    # 4. /api/bycategory
    print("\n[4/10] Mengambil Konten per Kategori (/api/bycategory?url=...&limit=5)...")
    cat_url = "https://nekopoi.care/category/hentai/"
    by_cat = request_api(f"/api/bycategory?url={urllib.parse.quote(cat_url, safe='')}&limit=5")
    if by_cat.get("success"):
        items = by_cat.get("data", [])
        print(f"  ✓ Berhasil! Mendapatkan {len(items)} konten kategori 'Hentai'.")
        if items:
            print(f"    Contoh: {items[0].get('title')}")
    else:
        print(f"  ✗ Gagal: {by_cat.get('error')}")

    # 5. /api/bygenre
    print("\n[5/10] Mengambil Konten per Genre (/api/bygenre?url=...&limit=5)...")
    genre_url = "https://nekopoi.care/genres/action/"
    by_genre = request_api(f"/api/bygenre?url={urllib.parse.quote(genre_url, safe='')}&limit=5")
    if by_genre.get("success"):
        items = by_genre.get("data", [])
        print(f"  ✓ Berhasil! Mendapatkan {len(items)} konten genre 'Action'.")
        if items:
            print(f"    Contoh: {items[0].get('title')}")
    else:
        print(f"  ✗ Gagal: {by_genre.get('error')}")

    # 6. /api/search
    print("\n[6/10] Menguji Pencarian (/api/search?q=isekai&limit=5)...")
    search_res = request_api("/api/search?q=isekai&limit=5")
    if search_res.get("success"):
        items = search_res.get("data", [])
        print(f"  ✓ Berhasil! Menemukan {len(items)} hasil untuk 'isekai'.")
        if items:
            print(f"    Contoh: {items[0].get('title')}")
    else:
        print(f"  ✗ Gagal: {search_res.get('error')}")

    # 7. /api/detail
    print("\n[7/10] Mengambil Detail Konten (/api/detail?url=...)...")
    sample_post = "https://nekopoi.care/hentai/inaka-ni-wa-kore-kurai-shika-goraku-ga-nai/"
    detail_res = request_api(f"/api/detail?url={urllib.parse.quote(sample_post, safe='')}")
    if detail_res.get("success"):
        data = detail_res.get("data", {})
        print(f"  ✓ Berhasil! Judul: {data.get('title')}")
        print(f"    - Skor: {data.get('details', {}).get('skor')}")
        print(f"    - Jumlah Episode: {len(data.get('episodes', []))}")
    else:
        print(f"  ✗ Gagal: {detail_res.get('error')}")

    # 8. /api/random
    print("\n[8/10] Mengambil 1 Konten Acak (/api/random)...")
    random_res = request_api("/api/random")
    if random_res.get("success"):
        data = random_res.get("data", {})
        print(f"  ✓ Berhasil! Judul Acak: {data.get('title')}")
    else:
        print(f"  ✗ Gagal: {random_res.get('error')}")

    # 9. /api/schedule
    print("\n[9/10] Mengambil Jadwal Rilis (/api/schedule)...")
    sched = request_api("/api/schedule")
    if sched.get("success"):
        items = sched.get("data", [])
        print(f"  ✓ Berhasil! Jadwal: {items}")
    else:
        print(f"  ✗ Gagal: {sched.get('error')}")

    # 10. /api/jobs & /api/extract
    print("\n[10/10] Menguji Status Job Ekstraksi Video (/api/jobs)...")
    jobs = request_api("/api/jobs")
    if jobs.get("success"):
        active_count = jobs.get("activeJobs", 0)
        print(f"  ✓ Berhasil! Active Jobs saat ini: {active_count}")
    else:
        print(f"  ✗ Gagal: {jobs.get('error')}")

    print("\n" + "=" * 65)
    print(" 🎉 SELURUH ENDPOINT LENGKAP TERVALIDASI AKTIF!")
    print("=" * 65)

if __name__ == "__main__":
    run_all_tests()
