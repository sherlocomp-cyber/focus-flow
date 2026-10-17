# FocusFlow

Aplikasi **goal, kebiasaan (habit), tugas, dan timer fokus Pomodoro**.
Berjalan sepenuhnya di browser tanpa build, bisa dipakai offline, dan datanya tersimpan di perangkatmu (tanpa server, tanpa akun).

## Fitur

- **Beranda** — ringkasan hari ini, tugas utama, progres goal, kebiasaan minggu ini, grafik fokus.
- **Tugas** — daftar, papan status, matriks Eisenhower, jadwal harian, Ivy Lee, "Katak" (tugas tersulit), subtugas, tag, pengulangan.
- **Habit** — kebiasaan dengan cue/craving/reward, versi 2 menit, streak, pembeku streak, heatmap.
- **Goal** — format SMART/OKR, key results, milestone, review mingguan dan bulanan.
- **Fokus** — Pomodoro (klasik, deep work, flow), jeda otomatis, suara ambient, notifikasi browser, refleksi sesi.
- **Insight & gamifikasi** — XP, level, lencana, tren fokus dan kebiasaan.
- **Cadangan data** — ekspor/impor JSON, ekspor CSV tugas, pengingat backup.
- Mode terang/gelap/ikut sistem, tema **Kertas** (paper-cut), tampilan mobile dan desktop, dapat dipasang sebagai PWA.

## Cara memakai

1. Buka lewat GitHub Pages (lihat di bawah) atau jalankan server statis lokal, misalnya `python3 -m http.server`, lalu buka `http://localhost:8000`.
2. Di ponsel, pilih **Tambahkan ke layar utama** supaya terpasang seperti aplikasi.

Membuka `index.html` langsung dari berkas (`file://`) juga berjalan, tetapi mode offline (service worker) hanya aktif lewat `http(s)`.

### GitHub Pages

`Settings` → `Pages` → *Deploy from a branch* → branch `main`, folder `/ (root)`.
Aplikasi tersedia di `https://<username>.github.io/focus-flow/`.
Setiap push ke `main` otomatis ter-deploy (biasanya 1–2 menit).
(GitHub Pages untuk repo privat memerlukan paket berbayar.)

### APK Android

Workflow **Build APK** berjalan otomatis di setiap push ke `main`/`master` (dan bisa dijalankan manual lewat **Actions → Build APK → Run workflow**). Hasilnya APK debug (Capacitor) yang dilampirkan ke rilis `v1.1.<nomor run>`. APK yang sudah terpasang tidak memperbarui diri; unduh dan pasang APK terbaru.

## Data dan privasi

- Semua data disimpan di `localStorage` browser (cadangan otomatis ke `sessionStorage`/memori jika `localStorage` diblokir; akan muncul peringatan).
- Tidak ada pelacakan, tidak ada permintaan jaringan ke pihak lain.
- **Cadangkan secara berkala** lewat *Pengaturan → Data → Ekspor JSON*. Menghapus data situs di browser akan menghapus data aplikasi.

### Pulihkan dari cadangan

*Pengaturan → Data → Impor JSON*, pilih file `focusflow-backup-*.json`. File divalidasi dan dibersihkan lebih dulu; ukuran maksimum 5 MB. Data saat ini akan ditimpa setelah kamu konfirmasi.

## Struktur repo

| File | Fungsi |
| --- | --- |
| `index.html` | Kerangka halaman |
| `styles.css` | Gaya dasar |
| `improve.css` | Perbaikan kontras, keterbacaan, aksesibilitas, dan polish UX (dimuat setelah `styles.css`) |
| `ux.css` | Penyempurnaan UI/UX v1.0.1: banner, kartu habit mobile, tombol info, navigasi desktop (dimuat setelah `improve.css`) |
| `paper.css` | Tema "Kertas 3D"; aturan tema aktif saat `data-theme="paper"` (dimuat setelah `ux.css`) |
| `ux2.css` | Lapisan UX tahap 1 dan 2: navigasi bawah 5 item, menu avatar, urutan Beranda HP, ikon judul, kartu tanpa blur, serif untuk judul (dimuat terakhir) |
| `core.js` | Data layer, logika, komponen UI, modal, insight, pengaturan |
| `goals-tasks.js` | Modul goal dan tugas |
| `habits-focus.js` | Modul habit dan mesin fokus (timer, audio, notifikasi) |
| `init.js` | Inisialisasi, aksesibilitas modal, registrasi service worker |
| `improve.js` | Penyempurnaan perilaku UI (dimuat setelah `init.js`) |
| `paper.js` | Perilaku tema Kertas (dimuat setelah `improve.js`) |
| `focus-plus.js` | Penyempurnaan timer fokus: selesai tepat waktu, waktu aktif, ambient, timer bertahan saat muat ulang, target harian |
| `features.js` | Tautan habit–goal, kalender bulanan, mode fokus imersif |
| `ux2.js` | Menu avatar, imersif otomatis, ikon judul Beranda, `aria-checked` switch (dimuat terakhir) |
| `manifest.webmanifest`, `icon.svg` | Metadata PWA dan ikon |
| `sw.js` | Service worker untuk mode offline |
| `prepare-www.js` | Menyalin berkas web ke `www/` untuk build APK |
| `.github/workflows/build-apk.yml` | Workflow Build APK |
| `CHANGELOG.md` | Riwayat versi |

File JS adalah skrip klasik yang berbagi lingkup global, jadi urutan pemuatan di `index.html` harus dipertahankan. Urutan JS: `core` → `goals-tasks` → `habits-focus` → `init` → `improve` → `paper` → `focus-plus` → `features` → `ux2`. Urutan CSS juga penting: `styles.css` → `improve.css` → `ux.css` → `paper.css` → `ux2.css`.

## Pengembangan

Tidak ada proses build. Setiap rilis: naikkan `APP_VERSION` di `core.js` dan `CACHE` di `sw.js` agar pengguna menerima pembaruan. Kalau menambah berkas web baru, daftarkan di tiga tempat: tag di `index.html`, `ASSETS` di `sw.js`, dan daftar `files` di `prepare-www.js`.

## Lisensi

[MIT](LICENSE)
