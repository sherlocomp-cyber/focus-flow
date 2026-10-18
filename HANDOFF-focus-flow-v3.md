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

Akses repo: konektor `githubku` (`get_file`/`put_file`, menulis ulang seluruh berkas) atau sesi dengan clone (`git`). Dengan konektor saja **tidak bisa menjalankan uji**; tandai hasil sebagai "belum diuji" (bagian 6). Sandbox sesi konektor bisa tanpa jaringan (tidak bisa `git clone` atau `npm`): cek dulu dengan `git ls-remote` dan `npm view @capacitor/app version` sebelum menjanjikan apa pun.

## 1. Prinsip kerja (ringkas)

- karpathy-guidelines: asumsi dinyatakan, perubahan bedah, kriteria sukses terverifikasi.
- Fitur baru = **lapisan tambahan** di `ux2.js` / `ux2.css` (sudah terdaftar di `index.html`, `sw.js`, `prepare-www.js`), setiap blok dibungkus `step(nama, fn)` ber-`try/catch`. Berkas inti jarang disentuh.
- Aksen UI: `var(--primary)`, bukan `--primary-1`. Cek di tema terang, gelap, kertas.
- `sw.js` memakai strategi **jaringan dulu**, jadi berkas berubah sampai ke pengguna online tanpa menaikkan `CACHE`. Versi tetap dinaikkan saat rilis (core.js `APP_VERSION`, sw.js `CACHE`, package.json, CHANGELOG).
- **JANGAN mengubah `package.json` dependensi atau `package-lock.json` dari konektor**: CI memakai `npm ci`; kunci yang tidak cocok akan merusak build APK. Penambahan plugin Capacitor hanya dari sesi dengan clone (`npm i` + commit lock + `npx cap sync`).
- **Nama id/kelas baru harus unik di seluruh berkas JS/CSS** (cari dulu dengan membaca `focus-plus.js`, `features.js`, `improve.js`): `#ffDaily` dan `.ff-daily` sudah dipakai `focus-plus.js` dan sempat bertabrakan dengan bilah Beranda (Tahap 3).
- Menulis ulang berkas besar lewat konektor rawan salah ketik: setelah `put_file`, baca ulang (`get_file`) dan periksa; untuk kode baru jalankan `node --check` pada potongannya bila ada sandbox.

## 2. Model data singkat (core.js)

`DB.{goals,habits,habitLogs,tasks,projects,sessions,profile}`; `DB.profile.settings` berisi `theme, focusMin, shortBreakMin, longBreakMin, autoStart, ambient, volume` + tambahan lapisan (`autoZen`, `noBreak`, `amoled`, `haptics`, `dailyGoalMin`, dan dari focus-plus `dailyTargetMin`). `saveDB()` menormalkan dan menyimpan (kunci pengaturan tak dikenal tetap tersimpan). Tugas: `status` (`inbox|todo|doing|done`), `priority 1-4`, `dueDate`, `estimatePomodoro`, `actualPomodoro`; tugas berulang: `recurrence {freq:"harian|mingguan|bulanan", interval}` dan `nextId` (id salinan berikutnya, dicatat Tahap 5). Sesi: `completed`, `actualMin`, `startedAt`. Rute lewat `goTo(key)`/`currentRoute` (bukan hash; tidak memakai `history`). Halaman Pengaturan = deretan `article.bento-card`; kartu baru disisipkan dengan `insertAdjacentHTML` setelah kartu yang ada. Nilai `data-theme` di `<html>`: `system`, `light`, `dark` (core.js `applyTheme`) dan `paper` (paper.js).

## 3. Rencana tahap

| Tahap | Isi | Bisa dari konektor? |
| --- | --- | --- |
| **3** | (a) Hitam murni AMOLED, (b) getar sentuhan, (c) target fokus harian + bilah progres di Beranda | Ya (**ditulis, belum diuji**) |
| **4** | Plugin Capacitor via sesi clone: `@capacitor/app` (tombol Kembali Android: tutup modal → Beranda → keluar), `@capacitor/local-notifications` (pengingat habit dan akhir sesi saat layar mati; paling penting karena WebView membekukan timer di latar), `@capacitor/haptics`, `@capacitor/status-bar` (warna bilah sistem ikut tema), `@capacitor-community/keep-awake` (opsional, pengganti Wake Lock). Naikkan versi 1.2.0 | Sebagian: **jembatan JS ditulis (belum diuji)**; pemasangan plugin tidak (butuh `npm`, `cap sync`, uji APK) |
| **5** | Fitur isi: tugas berulang, pengingat habit per jam, filter "Hari ini" di Tugas, geser kartu tugas (kanan = selesai, kiri = hapus + Urungkan), ekspor ringkasan mingguan | Sebagian: **5a–5d sudah ditulis (belum diuji)**; pengingat habit per jam menunggu Tahap 4 |
| **6** | Kebersihan backlog v2 bagian 6 (Wake Lock ganda, `.setting-row` ganda, emoji vs tema kertas, `build-apk.yml` ganda) | Perlu uji |

Alasan tombol Kembali ditunda ke Tahap 4: memakai `history.pushState` dari lapisan JS tanpa uji berisiko membuat Kembali tidak berfungsi atau perlu ditekan berkali-kali (modal membuka tanpa fungsi pusat, penutupan `history.back()` bersifat asinkron). Perbaikan benar: pendengar `backButton` dari `@capacitor/app`.

## 4. Status tahap (perbarui setiap selesai)

- [x] v2 selesai (1.1.1) + commit 18 Okt: hapus kode mati `"v1.5.1"` (improve.js), ketuk "i" di tombol mode tidak ganti mode (ux2.js bagian 7)
- [~] **Tahap 3: kode sudah di `main`, BELUM DIUJI, versi BELUM dinaikkan.** **Koreksi 18 Okt (konektor, belum diuji):** bilah target Beranda tidak pernah muncul karena `#ffDaily` sudah dipakai `focus-plus.js` (tombol target di halaman Fokus); kode lama menemukan tombol itu, menimpa isinya, dan `updateDaily()` focus-plus bisa error. Kini bilah Beranda memakai `#ffHomeDaily` / `.ff-home-daily` (ux2.js bagian 10, ux2.css 3c). Sisa: jalankan `tests-real/stage3.py` (+ `smoke*.py`, `type.py`, `cycle.py` dari zip v2) di sesi dengan clone, perbaiki (skrip lama mungkin masih mencari `#ffDaily` untuk bilah Beranda), cek manual di HP (bagian 7), lalu naikkan versi ke 1.2.0 (core.js, sw.js, package.json, CHANGELOG) bersama rilis Tahap 4
- [~] **Tahap 4 (sebagian, 18 Okt, konektor-saja): jembatan JS ada di `ux2.js` bagian 15 (15a tombol Kembali, 15b getar via Haptics, 15c warna bilah status), BELUM DIUJI di APK.** Aktif hanya bila `window.Capacitor.Plugins.<App|Haptics|StatusBar>` ada; di browser/PWA tidak ada yang berubah. **Sisa (butuh sesi dengan clone):** `npm i @capacitor/app @capacitor/haptics @capacitor/status-bar` (+ `@capacitor/local-notifications`, opsional `@capacitor-community/keep-awake`), commit `package-lock.json`, `npx cap sync`, uji APK di iQOO 15R, tulis pengingat lokal (akhir sesi dan habit), naikkan versi 1.2.0. Pengingat habit per jam (Tahap 5) bergantung pada plugin ini
- [~] **Tahap 5 (sebagian, 18 Okt): 5a–5d ada di `ux2.js` bagian 11–14 di `main`, BELUM DIUJI di browser/HP, versi BELUM dinaikkan.** Selesai: 5a filter "Hari ini", 5b geser kartu tugas, 5c tugas berulang, 5d ringkasan mingguan (rincian di bagian 5). **Sisa Tahap 5:** pengingat habit per jam (menunggu Tahap 4). Tahap 5 ditutup setelah sisa itu selesai dan 5a–5d lolos uji (bagian 6–7)
- [~] **Tahap 6 (sebagian, 18 Okt, konektor-saja):** **6a selesai, BELUM DIUJI:** Wake Lock ganda dihapus dari `features.js` (zen, bagian 3); yang tersisa hanya `improve.js` bagian 10 (`syncWakeLock`). Cek di HP: layar tetap menyala saat timer jalan, dan mati normal setelah jeda/reset. **Catatan, tidak diubah:** guard `wakePending` di `improve.js` ikut dihapus oleh `finally` pada jalur `return` awal, jadi permintaan kunci bisa tumpang tindih bila `request()` lebih lambat dari 250 ms (kecil kemungkinannya; perbaikan: pindahkan pengecekan `wakePending` ke luar `try`). **Sisa:** `.setting-row` ganda (di `styles.css` ada dua aturan; hasil akhirnya gap 8px dan font 12px; menghapus salah satu mengubah tampilan, jadi tunggu uji visual), emoji vs tema kertas (butuh pemeriksaan visual di tema kertas), `build-apk.yml` ganda (butuh CI)

## 5. Rincian Tahap 3 (yang ada di kode)

Semua di `ux2.js` bagian 8–10 dan `ux2.css` bagian 5 (tiap blok `step()`, kegagalan satu blok tidak memengaruhi yang lain).

- **Hitam murni (AMOLED)**: pengaturan `amoled` (bawaan mati). Kelas `ff-amoled` di `<html>`; CSS hanya berlaku di tema gelap atau sistem-gelap (`--bg:#000`, kartu `#0A0D0B`, nav bawah gelap). `<meta theme-color>` ikut `#000000` saat gelap + AMOLED; `improve.js` mengatur ulang meta itu tiap `applyTheme`, jadi `ux2.js` membungkus `applyTheme` dan menerapkan lagi. Tema terang dan kertas tidak berubah.
- **Getar sentuhan**: pengaturan `haptics` (bawaan nyala). Satu pendengar klik fase capture: 8 ms pada tab nav, toggle, mode, tab tugas, tombol primer, Mulai; 12 ms pada centang tugas/habit. Memakai `navigator.vibrate`; di WebView APK ini hanya bekerja bila manifest punya izin `VIBRATE` (plugin `@capacitor/haptics` menambahkannya, jadi sebelum Tahap 4 terpasang getar di APK bisa tidak terasa sama sekali).
- **Target fokus harian**: `dailyGoalMin` (bawaan 60; 0 = mati). Bilah di kartu "Fokus 7 hari" Beranda (`#ffHomeDaily`): menit hari ini = `focusByDay()[6]`. Selebrasi (toast + getar) sekali saat melintasi target selama aplikasi terbuka. Dirender ulang lewat pembungkus `renderHome`.
- **Kartu Pengaturan "Tampilan & sentuhan"**: disisipkan setelah kartu Streak freeze (id `ffLookCard`), berisi tiga kontrol di atas.

**Keputusan yang diambil (dapat diubah pemilik):** bawaan target 60 menit (bilah langsung terlihat), AMOLED mati (perubahan visual besar sebaiknya opt-in), getar nyala.

**Temuan untuk diputuskan pemilik (belum diubah):** ada **dua target fokus harian** yang tidak saling terhubung: (1) halaman Fokus, tombol `#ffDaily` dari `focus-plus.js`, setelan `dailyTargetMin` (bawaan 120, rentang 15–600, ubah dengan mengetuk tombolnya, toast "🎯 tercapai" di modal refleksi); (2) Beranda, setelan `dailyGoalMin` (bawaan 60, 0 = mati, dipilih di Pengaturan > Tampilan & sentuhan, toast sendiri). Dua angka berbeda bisa tampil bersamaan. Usul: satukan memakai satu setelan (mis. Pengaturan menulis `dailyTargetMin`, bilah Beranda membacanya) dan hapus salah satu toast selebrasi.

### 5b. Rincian Tahap 5 (yang ada di kode, `ux2.js` bagian 11–14)

Tiap blok `step()`; CSS kecil untuk geser disuntikkan dari JS (pola yang sama dengan `features.js`), jadi `ux2.css` tidak disentuh.

- **5a Filter "Hari ini" (bagian 11)**: tombol `#ffTodayBtn` ("Hari ini · n") di toolbar **Tugas > Daftar**. Menyala = hanya tugas belum selesai dengan `dueDate` ≤ hari ini (yang terlambat ikut). Hanya di memori; Inbox tidak terpengaruh. Memakai pembungkus `taskMatches`, `renderTaskList`, `bindTaskEvents`.
- **5b Geser kartu (bagian 12)**: kartu `.tm-row` di **Inbox dan Daftar** (bukan Matriks/Kanban/Beranda). Ambang 90 px, harus dominan horizontal; `touch-action: pan-y` agar gulir vertikal tetap jalan. Kanan = `completeTaskModule` (tugas yang sudah selesai: hanya toast, tidak dibuka kembali); kiri = klik tombol 🗑 milik `improve.js`. Keduanya sudah memberi toast Urungkan. Petunjuk teks di bawah daftar. Tombol di kartu tetap ada (geser hanya tambahan).
- **5c Tugas berulang (bagian 13)**: formulir sudah menyimpan `recurrence`, tetapi dulu tidak ada yang membuat tugas berikutnya. Kini pembungkus `saveDB` membuat satu salinan (status `todo`, subtask direset, XP/Ivy Lee/`completedAt` dibuang) saat tugas berulang **baru** selesai (`completedAt` < 2 menit); `nextId` mencatatnya sehingga tidak menggandakan. Diurungkan → salinan yang belum disentuh (belum done, `actualPomodoro` 0) dihapus. Tenggat berikutnya = satu periode setelah tenggat lama, dimajukan sampai lewat hari ini (selesai telat tidak menumpuk tugas terlambat; bulanan dari tanggal asal: 31 Jan → 28 Feb → 31 Mar). Tugas lama yang sudah selesai tidak ikut (completedAt-nya lama). Kartu tugas kini menampilkan tag tenggat ("18 Okt") dan "↻ frekuensi" (pembungkus `taskCard`).
- **5d Ringkasan mingguan (bagian 14)**: tombol `#ffWeeklyBtn` di **Pengaturan > Data**, mengunduh `focusflow-ringkasan-mingguan-<stempel>.md` untuk 7 hari terakhir: skor, menit fokus per hari, tugas selesai (maks 30), habit (hari selesai dari 7), tujuan aktif. Hanya membaca data; bukan cadangan (tidak menyentuh `lastExportAt`).

**Keputusan yang diambil (dapat diubah pemilik):** Hari ini = tenggat ≤ hari ini; geser hanya di Inbox/Daftar; salinan berulang berstatus `todo` (bukan `inbox`) dan mewarisi `goalId` (jadi menambah penyebut progres goal tertaut); ringkasan berformat Markdown unduhan (bukan share sheet).

### 5c. Rincian jembatan Capacitor (Tahap 4, `ux2.js` bagian 15)

Semua lewat `capPlugins()`: mengembalikan `window.Capacitor.Plugins` hanya bila ada dan (jika `isNativePlatform` tersedia) berjalan native; selain itu `null` dan blok tidak melakukan apa-apa.

- **15a Tombol Kembali** (`@capacitor/app`, `addListener("backButton")`): urutan tutup modal → keluar layar penuh → keluar imersif (klik `#ffZen`) → ke Beranda (`goTo("beranda")`) → `App.exitApp()`. Dapat dipanggil dari konsol: `window.__ffBack()` (mengembalikan `"modal"|"fullscreen"|"zen"|"beranda"|"exit"`).
- **15b Getar** (`@capacitor/haptics`): `navigator.vibrate` dibungkus; angka 1–20 ms dialihkan ke `Haptics.impact` (`LIGHT` untuk < 12 ms, `MEDIUM` untuk ≥ 12 ms); pola array dan angka besar tetap ke `vibrate` asli. Bagian 9, 10, dan 12 tidak diubah.
- **15c Bilah status** (`@capacitor/status-bar`): setelah tiap `applyTheme` (dan saat muat) membaca `--bg` dari `<html>` (terang, gelap, hitam murni, kertas; hanya format `#rgb`/`#rrggbb`, yang lain dilewati), memanggil `setBackgroundColor` dan `setStyle` (`DARK` bila latar gelap). `window.__ffStatusBarSync()` untuk uji.

**Keputusan yang diambil (dapat diubah pemilik):** Kembali di Beranda langsung keluar tanpa konfirmasi "tekan sekali lagi"; Kembali di modal wizard (tujuan/habit) menutup seluruh modal, bukan mundur satu langkah (tombol `#modalBack` tidak dipakai karena logika langkahnya ada di `habits-focus.js`/`goals-tasks.js`, belum dibaca); `@capacitor-community/keep-awake` dan `@capacitor/local-notifications` sengaja belum disentuh.

**Catatan penulisan:** `ux2.js` ditulis ulang utuh lewat konektor. `git diff` terhadap commit sebelum 18 Okt malam harus hanya menampilkan: header (dua baris Tahap 4), komentar dan penggantian `ffDaily` → `ffHomeDaily`/`ff-home-daily`/`ff-home-daily-top` di bagian 10, dan blok bagian 15 sebelum `})();`. Diff selain itu = salah salin; kembalikan. Untuk `features.js`: hanya header baris 6 dan blok Wake Lock (diganti komentar) yang berubah.

## 6. Verifikasi

- Skrip lama (`smoke.py`, `smoke2.py`, `type.py`, `cycle.py`) ada di zip handoff v2 (`tests-real/`). **Skrip Tahap 3: `tests-real/stage3.py` di repo ini** (Playwright; server `python3 -m http.server 8765 --bind 127.0.0.1` dari akar repo). Skrip ini **belum pernah dijalankan**; mungkin perlu perbaikan kecil. **Belum ada skrip uji untuk Tahap 5**; tulis `tests-real/stage5.py` saat ada sesi dengan clone.
- Yang SUDAH diperiksa: sintaks blok Tahap 3 dengan `node --check` (lolos). Bagian 11–14 (Tahap 5): `node --check` pada bungkus IIFE (lolos) dan **36 asersi di Node dengan DOM stub** (lolos): tenggat berikutnya harian/mingguan/bulanan/interval/telat, pembuatan salinan + subtask + `scheduledStart`, tidak menggandakan, Urungkan menghapus salinan, salinan yang sudah dikerjakan tetap ada, `freq` aneh (`"constructor"`) diabaikan, tag kartu, tombol dan hitungan "Hari ini", isi ringkasan, geser kanan/kiri/vertikal/pendek/mulai dari tombol/tugas sudah selesai. **Bagian 15 (jembatan):** potongan diperiksa sintaksnya dan diuji dengan stub Node (`vm`): tanpa Capacitor / non-native / tanpa plugin tidak mengubah apa pun; Kembali memilih tindakan sesuai urutan (modal menang atas semuanya); getar 8 → `LIGHT`, 12 → `MEDIUM`, pola array/180/0 tetap ke `vibrate` asli, plugin melempar galat → jatuh ke `vibrate` asli; bilah status mengirim warna dan gaya benar untuk `#F6F3EE` (LIGHT), `#000` → `#000000` (DARK), `#101412` (DARK), dan melewati nilai non-hex. Skrip uji itu hanya ada di sandbox sesi dan **tidak di-commit**. Selain itu tidak ada.
- **Belum terverifikasi:** semua perilaku di browser/HP sungguhan (AMOLED di panel asli, getar di iQOO 15R, bilah target, tata letak kartu baru di 3 tema, tanpa galat konsol), build APK. Khusus Tahap 5: efek `touch-action: pan-y` pada gulir kartu dan pada tekan-tahan seret (pendengar pointer di goals-tasks.js), asumsi tanda tangan `habitDoneOnDate(habit, Date)` (disalin dari pemakaian di `features.js`/`improve.js`), unduhan `.md` di WebView APK (sama rentannya dengan ekspor JSON/CSV yang ada), dan `structuredClone` di WebView lama (sudah dipakai `core.js`). Khusus 6a: `features.js` hanya dibaca ulang setelah commit; tidak dijalankan. Khusus bagian 15: asumsi bahwa `Capacitor.Plugins.App/Haptics/StatusBar` tersedia pada APK tanpa bundler (seharusnya lewat native bridge setelah plugin terpasang; **belum dibuktikan di APK**), nama gaya `LIGHT`/`MEDIUM` (Haptics) dan `DARK`/`LIGHT` (StatusBar), dan perilaku Kembali saat tombol sistem ditekan di dalam modal wizard. Khusus koreksi `ffHomeDaily`: bilah Beranda belum pernah terlihat berjalan; periksa tata letak dan warna di tiga tema.
- Jebakan uji (dari v2): `MutationObserver` aria-checked asinkron → baca setelah satu tick; tutup onboarding dulu.

## 7. Daftar periksa manual (HP, bukan sandbox)

1. Muat ulang keras; Pengaturan → kartu **Tampilan & sentuhan** tampil (setelah Streak freeze, sebelum Data).
2. Tema Gelap + Hitam murni: latar benar-benar hitam (#000) di semua halaman, kartu dan nav masih terbaca; tema Terang tidak berubah.
3. Getar sentuhan: ketuk tab bawah dan centang tugas terasa getaran halus; mematikan di pengaturan menghentikannya.
4. Target fokus harian: bilah "Target hari ini" di Beranda ("Fokus 7 hari", `#ffHomeDaily`); selesaikan sesi → angka bertambah; saat melewati target muncul toast; pilih "Mati" → bilah hilang. **Tombol target di halaman Fokus tetap menampilkan "Hari ini x dari y menit fokus" (target 120 bawaan) dan tidak berubah isinya.**
5. Tidak ada galat saat membuka tiap halaman; konten tidak tertutup lubang kamera atau bilah gestur.
6. Ketuk "i" di Deep Work/Flow: hanya tooltip, mode tidak berganti.
7. **(Tahap 5a)** Tugas > Daftar: tombol "Hari ini · n" ada di toolbar; menyalakannya hanya menampilkan tugas belum selesai bertenggat hari ini atau lebih awal; mematikan mengembalikan semua; terbaca di tema Terang, Gelap, Kertas; tag tenggat di kartu tampil.
8. **(Tahap 5b)** Geser kartu di Inbox/Daftar: kanan melewati ±90 px → selesai + toast Urungkan; kiri → terhapus + Urungkan; geser pendek memantul balik; gulir vertikal daftar tetap lancar; tombol ▶ Fokus, 🗑, dan centang tetap bisa diketuk; tekan-tahan seret di Kanban/Matriks masih jalan.
9. **(Tahap 5c)** Buat tugas "Setiap hari" bertenggat hari ini → centang selesai → muncul tugas baru bertenggat besok dengan tag "↻ harian"; Urungkan → tugas baru hilang; ulangi untuk mingguan dan bulanan; tugas berulang lama yang sudah selesai tidak membuat salinan; selesaikan lewat Beranda dan lewat seret ke Done juga membuat salinan.
10. **(Tahap 5d)** Pengaturan > Data: "Ringkasan mingguan" mengunduh berkas `.md` yang isinya cocok dengan data minggu ini; banner pengingat cadangan tidak berubah.
11. Konsol bersih dari `[ux2] today-filter`, `swipe-task`, `recurring`, `recur-reconcile`, `weekly-summary`, `daily-render`, `native-back`, `native-haptics`, `native-statusbar`, `statusbar-sync`.
12. **(Tahap 6a)** Mulai timer → layar tidak padam sendiri; jeda atau reset → layar kembali padam normal; buka tab lain lalu kembali → layar tetap menyala selama timer jalan.
13. **(Tahap 4, hanya APK dengan plugin terpasang)** Tombol/gestur Kembali: buka modal → Kembali menutup modal; di halaman selain Beranda → ke Beranda; di Beranda → aplikasi keluar; di mode Imersif → keluar imersif dulu.
14. **(Tahap 4, APK)** Getar terasa halus saat mengetuk tab bawah dan centang; bilah status mengikuti tema (terang, gelap, hitam murni, kertas) dengan ikon terbaca (gelap di latar terang, terang di latar gelap) setelah ganti tema dari Pengaturan.
15. **(Tahap 4, browser/PWA tanpa plugin)** Tidak ada perubahan perilaku dan tidak ada galat konsol dari `native-*`.
