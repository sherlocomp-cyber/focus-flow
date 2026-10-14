# Changelog

## [1.0.2] — 2026-10-15

Sinkronisasi berkas aplikasi, service worker, dan dokumentasi.

### Diperbaiki
- `ux.css` ternyata belum dimuat oleh `index.html`, sehingga perbaikan UI/UX v1.0.1 tidak aktif. Kini dimuat setelah `improve.css` dan sebelum `paper.css` (tema Kertas tetap menang untuk aturan tema).
- `sw.js`: daftar `ASSETS` kini memuat `improve.css`, `ux.css`, `paper.css`, `improve.js`, `paper.js`. Aset di-cache satu per satu, jadi satu berkas yang gagal tidak lagi membatalkan pemasangan service worker.
- `prepare-www.js`: `ux.css` ikut disalin ke APK.

### Diubah
- Dokumentasi (README) mencatat `improve.css`, `improve.js`, `paper.css`, dan `paper.js`.

## [1.0.1] — 2026-10-15

Perbaikan UI/UX berdasarkan pemeriksaan tampilan di mobile (390 px) dan desktop (1280 px).

### Diperbaiki
- **Banner peringatan selalu tampil** ("Penyimpanan diblokir" dan "Saatnya simpan cadangan") walau tidak diperlukan, karena `display:flex` mengalahkan atribut `hidden`. Kini hanya muncul saat relevan.
- **Kartu habit di mobile rusak**: nama terjepit di kolom sempit dan banyak ruang kosong. Tata letak baru: ikon, nama, streak, lalu tiga tombol status selebar kartu.
- **Tombol info "i" terlalu besar** (lingkaran 44 px yang menimpa teks). Kini 20 px, area sentuh tetap luas.
- **Kotak centang tugas** diganti lingkaran ringan 28 px (area sentuh tetap luas).
- Petunjuk "Geser →" menimpa tab Kanban; diganti pudar di tepi kanan.
- Di desktop, menu navigasi menutupi avatar; kini di tengah, dan pada lebar 1080–1279 px hanya tab aktif yang berlabel.
- Label hari di streak mingguan ambigu ("Se" untuk Senin dan Selasa); kini tiga huruf (Sen, Sel, Rab, …).
- Kolom tulis cepat Inbox terpotong di mobile; tombol Tambah turun ke baris sendiri.
- Chip tidak lagi patah baris; efek hover tidak menempel di layar sentuh.

### Ditambahkan
- `ux.css`: lapisan penyempurnaan yang dimuat setelah `styles.css`.

## [1.0.0] — 2026-10-14

Rilis pertama di GitHub, hasil audit.

### Diperbaiki
- **Tanggal "hari ini" bergeser satu hari di zona waktu WIB** (`isoDay` memakai UTC). Kini memakai tanggal lokal; memengaruhi deadline, log habit, streak, grafik fokus, dan insight.
- **Impor JSON**: `id` dan field angka/tanggal/warna disanitasi saat load dan impor, sehingga file cadangan yang dimodifikasi tidak bisa menyuntik HTML lewat atribut. Batas ukuran file 5 MB.
- Teks pengguna yang belum di-escape (Key Results, Milestone, kapan/di mana habit) kini di-escape.
- Impor goal minimal (tanpa `type`/`status`) tidak lagi membuat halaman Goal error.

### Diubah
- Satu file HTML dipecah menjadi `index.html`, `styles.css`, dan empat file JS (`core.js`, `goals-tasks.js`, `habits-focus.js`, `init.js`). Isi dan perilaku aplikasi sama; kode hanya dipindah.
- Data awal netral (tanpa tugas/goal/habit contoh, nama "Teman"); sebelumnya berisi data demo.
- Tombol reset kini mengembalikan aplikasi ke kondisi kosong, bukan ke data contoh.
- Versi aplikasi dipindah ke Pengaturan → Tentang.

### Ditambahkan
- Aksesibilitas modal: fokus masuk ke dialog, jebakan Tab, fokus dikembalikan saat ditutup; toast `aria-live`.
- PWA: `manifest.webmanifest`, `icon.svg`, service worker offline, meta description.
- Penanda versi skema data.
- README, LICENSE, `.gitignore`.
