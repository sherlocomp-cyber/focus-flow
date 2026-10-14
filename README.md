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
- Mode terang/gelap/ikut sistem, tampilan mobile dan desktop, dapat dipasang sebagai PWA.

## Cara memakai

1. Buka lewat GitHub Pages (lihat di bawah) atau jalankan server statis lokal, misalnya `python3 -m http.server`, lalu buka `http://localhost:8000`.
2. Di ponsel, pilih **Tambahkan ke layar utama** supaya terpasang seperti aplikasi.

Membuka `index.html` langsung dari berkas (`file://`) juga berjalan, tetapi mode offline (service worker) hanya aktif lewat `http(s)`.

### GitHub Pages

`Settings` → `Pages` → *Deploy from a branch* → branch `main`, folder `/ (root)`.
Aplikasi tersedia di `https://<username>.github.io/focus-flow/`.

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
| `styles.css` | Seluruh gaya |
| `core.js` | Data layer, logika, komponen UI, modal, insight, pengaturan |
| `goals-tasks.js` | Modul goal dan tugas |
| `habits-focus.js` | Modul habit dan mesin fokus (timer, audio, notifikasi) |
| `init.js` | Inisialisasi, aksesibilitas modal, registrasi service worker |
| `manifest.webmanifest`, `icon.svg` | Metadata PWA dan ikon |
| `sw.js` | Service worker untuk mode offline |
| `CHANGELOG.md` | Riwayat versi |

File JS adalah skrip klasik yang berbagi lingkup global, jadi urutan pemuatan di `index.html` harus dipertahankan.

## Pengembangan

Tidak ada proses build. Setiap rilis: naikkan `APP_VERSION` di `core.js` dan `CACHE` di `sw.js` agar pengguna menerima pembaruan.

## Lisensi

[MIT](LICENSE)
