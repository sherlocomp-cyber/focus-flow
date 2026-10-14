# Changelog

## [1.0.0] — 2026-10-14

Rilis pertama di GitHub, hasil audit.

### Diperbaiki
- **Tanggal "hari ini" bergeser satu hari di zona waktu WIB** (`isoDay` memakai UTC). Kini memakai tanggal lokal; memengaruhi deadline, log habit, streak, grafik fokus, dan insight.
- **Impor JSON**: `id` dan field angka/tanggal/warna disanitasi saat load dan impor, sehingga file cadangan yang dimodifikasi tidak bisa menyuntik HTML lewat atribut. Batas ukuran file 5 MB.
- Teks pengguna yang belum di-escape (Key Results, Milestone, kapan/di mana habit) kini di-escape.
- Impor goal minimal (tanpa `type`/`status`) tidak lagi membuat halaman Goal error.

### Ditambahkan
- Data awal netral (tanpa tugas/goal/habit contoh); sebelumnya berisi data demo.
- Aksesibilitas modal: fokus masuk ke dialog, jebakan Tab, fokus dikembalikan saat ditutup; toast `aria-live`.
- PWA: `manifest.webmanifest`, `icon.svg`, service worker offline, meta description.
- Versi aplikasi di Pengaturan dan penanda versi skema data.
- README, LICENSE, `.gitignore`.
