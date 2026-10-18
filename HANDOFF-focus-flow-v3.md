# HANDOFF v3 — FocusFlow (tahap fitur & UX untuk iQOO 15R)

> Dibuat 18 Okt 2026. Bahasa kerja: **Bahasa Indonesia**. Repo: `sherlocomp-cyber/focus-flow`, cabang `main`.
> Menggantikan `HANDOFF-focus-flow-v2.md` (arsitektur, pola uji, dan aturan di sana tetap berlaku; baca bagian 3 dan 5 di v2).
> **Target perangkat: iQOO 15R** (HP Android, layar AMOLED, bezel tipis, lubang kamera di atas, navigasi gestur). Aplikasi dibungkus APK lewat Capacitor + GitHub Actions.

## 0. Cara melanjutkan (untuk akun/chat baru)

Tempel ini ke chat baru:

```
Cek repo sherlocomp-cyber/focus-flow dan lanjutkan HANDOFF-focus-flow-v3.md (bagian 4: status tahap).
Pakai karpathy-guidelines. Jawab dalam Bahasa Indonesia. Jangan mengulang audit; kerjakan tahap berikutnya yang belum bertanda selesai.
Perbarui bagian 4 handoff ini setelah setiap tahap selesai (commit terpisah).
```

Akses repo: konektor `githubku` (`get_file`/`put_file`, menulis ulang seluruh berkas) atau sesi dengan clone (`git`). Dengan konektor saja **tidak bisa menjalankan uji**; tandai hasil sebagai "belum diuji" (bagian 6).

## 1. Prinsip kerja (ringkas)

- karpathy-guidelines: asumsi dinyatakan, perubahan bedah, kriteria sukses terverifikasi.
- Fitur baru = **lapisan tambahan** di `ux2.js` / `ux2.css` (sudah terdaftar di `index.html`, `sw.js`, `prepare-www.js`), setiap blok dibungkus `step(nama, fn)` ber-`try/catch`. Berkas inti jarang disentuh.
- Aksen UI: `var(--primary)`, bukan `--primary-1`. Cek di tema terang, gelap, kertas.
- `sw.js` memakai strategi **jaringan dulu**, jadi berkas berubah sampai ke pengguna online tanpa menaikkan `CACHE`. Versi tetap dinaikkan saat rilis (core.js `APP_VERSION`, sw.js `CACHE`, package.json, CHANGELOG).
- **JANGAN mengubah `package.json` dependensi atau `package-lock.json` dari konektor**: CI memakai `npm ci`; kunci yang tidak cocok akan merusak build APK. Penambahan plugin Capacitor hanya dari sesi dengan clone (`npm i` + commit lock + `npx cap sync`).
- Menulis ulang berkas besar lewat konektor rawan salah ketik: setelah `put_file`, baca ulang (`get_file`) dan periksa; untuk kode baru jalankan `node --check` pada potongannya bila ada sandbox.

## 2. Model data singkat (core.js)

`DB.{goals,habits,habitLogs,tasks,projects,sessions,profile}`; `DB.profile.settings` berisi `theme, focusMin, shortBreakMin, longBreakMin, autoStart, ambient, volume` + tambahan lapisan (`autoZen`, `noBreak`, `amoled`, `haptics`, `dailyGoalMin`). `saveDB()` menormalkan dan menyimpan (kunci pengaturan tak dikenal tetap tersimpan). Tugas: `status` (`inbox|todo|doing|done`), `priority 1-4`, `dueDate`, `estimatePomodoro`, `actualPomodoro`. Sesi: `completed`, `actualMin`, `startedAt`. Rute lewat `goTo(key)`/`currentRoute` (bukan hash; tidak memakai `history`). Halaman Pengaturan = deretan `article.bento-card`; kartu baru disisipkan dengan `insertAdjacentHTML` setelah kartu yang ada.

## 3. Rencana tahap

| Tahap | Isi | Bisa dari konektor? |
| --- | --- | --- |
| **3** | (a) Hitam murni AMOLED, (b) getar sentuhan, (c) target fokus harian + bilah progres di Beranda | Ya (**ditulis, belum diuji**) |
| **4** | Plugin Capacitor via sesi clone: `@capacitor/app` (tombol Kembali Android: tutup modal → Beranda → keluar), `@capacitor/local-notifications` (pengingat habit dan akhir sesi saat layar mati; paling penting karena WebView membekukan timer di latar), `@capacitor/haptics`, `@capacitor/status-bar` (warna bilah sistem ikut tema), `@capacitor-community/keep-awake` (opsional, pengganti Wake Lock). Naikkan versi 1.2.0 | Tidak (butuh `npm`, `cap sync`, uji APK) |
| **5** | Fitur isi: tugas berulang, pengingat habit per jam, filter "Hari ini" di Tugas, geser kartu tugas (kanan = selesai, kiri = hapus + Urungkan), ekspor ringkasan mingguan | Sebagian, setelah Tahap 4 |
| **6** | Kebersihan backlog v2 bagian 6 (Wake Lock ganda, `.setting-row` ganda, emoji vs tema kertas, `build-apk.yml` ganda) | Perlu uji |

Alasan tombol Kembali ditunda ke Tahap 4: memakai `history.pushState` dari lapisan JS tanpa uji berisiko membuat Kembali tidak berfungsi atau perlu ditekan berkali-kali (modal membuka tanpa fungsi pusat, penutupan `history.back()` bersifat asinkron). Perbaikan benar: pendengar `backButton` dari `@capacitor/app`.

## 4. Status tahap (perbarui setiap selesai)

- [x] v2 selesai (1.1.1) + commit 18 Okt: hapus kode mati `"v1.5.1"` (improve.js), ketuk "i" di tombol mode tidak ganti mode (ux2.js bagian 7)
- [~] **Tahap 3: kode sudah di `main`, BELUM DIUJI, versi BELUM dinaikkan.** Sisa: jalankan `tests-real/stage3.py` (+ `smoke*.py`, `type.py`, `cycle.py` dari zip v2) di sesi dengan clone, perbaiki, cek manual di HP (bagian 7), lalu naikkan versi ke 1.2.0 (core.js, sw.js, package.json, CHANGELOG) bersama rilis Tahap 4
- [ ] Tahap 4
- [ ] Tahap 5
- [ ] Tahap 6

## 5. Rincian Tahap 3 (yang ada di kode)

Semua di `ux2.js` bagian 8–10 dan `ux2.css` bagian 5 (tiap blok `step()`, kegagalan satu blok tidak memengaruhi yang lain).

- **Hitam murni (AMOLED)**: pengaturan `amoled` (bawaan mati). Kelas `ff-amoled` di `<html>`; CSS hanya berlaku di tema gelap atau sistem-gelap (`--bg:#000`, kartu `#0A0D0B`, nav bawah gelap). `<meta theme-color>` ikut `#000000` saat gelap + AMOLED; `improve.js` mengatur ulang meta itu tiap `applyTheme`, jadi `ux2.js` membungkus `applyTheme` dan menerapkan lagi. Tema terang dan kertas tidak berubah.
- **Getar sentuhan**: pengaturan `haptics` (bawaan nyala). Satu pendengar klik fase capture: 8 ms pada tab nav, toggle, mode, tab tugas, tombol primer, Mulai; 12 ms pada centang tugas/habit. Memakai `navigator.vibrate` (WebView Android mendukung). Plugin `@capacitor/haptics` (Tahap 4) memberi umpan lebih halus.
- **Target fokus harian**: `dailyGoalMin` (bawaan 60; 0 = mati). Bilah di kartu "Fokus 7 hari" Beranda: menit hari ini = `focusByDay()[6]`. Selebrasi (toast + getar) sekali saat melintasi target selama aplikasi terbuka. Dirender ulang lewat pembungkus `renderHome`.
- **Kartu Pengaturan "Tampilan & sentuhan"**: disisipkan setelah kartu Streak freeze (id `ffLookCard`), berisi tiga kontrol di atas.

**Keputusan yang diambil (dapat diubah pemilik):** bawaan target 60 menit (bilah langsung terlihat), AMOLED mati (perubahan visual besar sebaiknya opt-in), getar nyala.

## 6. Verifikasi

- Skrip lama (`smoke.py`, `smoke2.py`, `type.py`, `cycle.py`) ada di zip handoff v2 (`tests-real/`). **Skrip Tahap 3: `tests-real/stage3.py` di repo ini** (Playwright; server `python3 -m http.server 8765 --bind 127.0.0.1` dari akar repo). Skrip ini **belum pernah dijalankan**; mungkin perlu perbaikan kecil.
- Yang SUDAH diperiksa: sintaks blok Tahap 3 dengan `node --check` (lolos). Selain itu tidak ada.
- **Belum terverifikasi:** semua perilaku (AMOLED di panel asli, getar di iQOO 15R, bilah target, tata letak kartu baru di 3 tema, tanpa galat konsol), build APK.
- Jebakan uji (dari v2): `MutationObserver` aria-checked asinkron → baca setelah satu tick; tutup onboarding dulu.

## 7. Daftar periksa manual (HP, bukan sandbox)

1. Muat ulang keras; Pengaturan → kartu **Tampilan & sentuhan** tampil (setelah Streak freeze, sebelum Data).
2. Tema Gelap + Hitam murni: latar benar-benar hitam (#000) di semua halaman, kartu dan nav masih terbaca; tema Terang tidak berubah.
3. Getar sentuhan: ketuk tab bawah dan centang tugas terasa getaran halus; mematikan di pengaturan menghentikannya.
4. Target fokus harian: bilah di Beranda ("Fokus 7 hari"); selesaikan sesi → angka bertambah; saat melewati target muncul toast; pilih "Mati" → bilah hilang.
5. Tidak ada galat saat membuka tiap halaman; konten tidak tertutup lubang kamera atau bilah gestur.
6. Ketuk "i" di Deep Work/Flow: hanya tooltip, mode tidak berganti.
