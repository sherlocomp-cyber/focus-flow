# FocusFlow

Aplikasi **goal, kebiasaan (habit), tugas, dan timer fokus Pomodoro** dalam satu file HTML.
Berjalan sepenuhnya di browser, bisa dipakai offline, dan datanya tersimpan di perangkatmu (tanpa server, tanpa akun).

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

1. Buka `index.html` di browser, atau pakai lewat GitHub Pages (lihat di bawah).
2. Di ponsel, pilih **Tambahkan ke layar utama** supaya terpasang seperti aplikasi.

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
| `index.html` | Seluruh aplikasi (HTML, CSS, JS) |
| `manifest.webmanifest`, `icon.svg` | Metadata PWA dan ikon |
| `sw.js` | Service worker untuk mode offline |
| `CHANGELOG.md` | Riwayat versi |

## Pengembangan

Tidak ada proses build. Edit `index.html`, lalu naikkan `APP_VERSION` di skrip dan `CACHE` di `sw.js` setiap rilis agar pengguna menerima pembaruan.

## Lisensi

[MIT](LICENSE)
