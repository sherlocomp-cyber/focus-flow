// Menyiapkan folder www/ untuk Capacitor: salin semua berkas web aplikasi.
// sw.js sengaja tidak disalin: di dalam APK semua aset sudah lokal, jadi service worker tidak diperlukan.
const fs = require('fs');
const files = [
  'index.html', 'styles.css', 'improve.css', 'ux.css', 'paper.css',
  'core.js', 'goals-tasks.js', 'habits-focus.js', 'init.js', 'improve.js', 'paper.js', 'focus-plus.js', 'features.js',
  'manifest.webmanifest', 'icon.svg'
];
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www', { recursive: true });
for (const f of files) {
  if (!fs.existsSync(f)) { console.error('Berkas tidak ditemukan: ' + f); process.exit(1); }
  fs.copyFileSync(f, 'www/' + f);
}
console.log('www/ siap (' + files.length + ' berkas)');
