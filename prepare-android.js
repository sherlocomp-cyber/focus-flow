// Dijalankan setelah `npx cap add android`: tanda tangan tetap, izin getar, ikon, versi.
const fs = require('fs'), path = require('path');
const sharp = require('sharp');

(async () => {
  const app = 'android/app';
  const res = path.join(app, 'src/main/res');
  const run = process.env.GITHUB_RUN_NUMBER || '1';

  // 1. Keystore tetap (dari base64) agar APK baru bisa menimpa versi lama tanpa hapus data
  fs.writeFileSync('focusflow-debug.keystore',
    Buffer.from(fs.readFileSync('focusflow-debug.keystore.b64', 'utf8').trim(), 'base64'));

  // 2. Gradle: tanda tangan + versi
  const gp = path.join(app, 'build.gradle');
  let g = fs.readFileSync(gp, 'utf8');
  if (!g.includes('focusflow-debug.keystore')) {
    g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        debug {
            storeFile file("../../focusflow-debug.keystore")
            storePassword "focusflow26"
            keyAlias "focusflow"
            keyPassword "focusflow26"
        }
    }`);
  }
  g = g.replace(/versionCode\s+\d+/, `versionCode ${run}`)
       .replace(/versionName\s+"[^"]*"/, `versionName "1.1.${run}"`);
  fs.writeFileSync(gp, g);

  // 3. Izin getar (navigator.vibrate saat sesi fokus selesai)
  const mp = path.join(app, 'src/main/AndroidManifest.xml');
  let m = fs.readFileSync(mp, 'utf8');
  if (!m.includes('android.permission.VIBRATE')) {
    m = m.replace(/(<uses-permission android:name="android.permission.INTERNET"\s*\/>)/,
      '$1\n    <uses-permission android:name="android.permission.VIBRATE" />');
    fs.writeFileSync(mp, m);
  }

  // 4. Ikon launcher dari icon.svg
  const icon = fs.readFileSync('icon.svg');
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(sizes)) {
    const dir = path.join(res, 'mipmap-' + d);
    if (!fs.existsSync(dir)) continue;
    const png = await sharp(icon, { density: 384 }).resize(s, s).png().toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png);
    fs.rmSync(path.join(dir, 'ic_launcher_foreground.png'), { force: true });
  }

  // 5. Ikon adaptif (Android 8+): latar hijau + lingkaran di zona aman
  const fg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><circle cx="54" cy="54" r="28.8" fill="none" stroke="#FFF6E5" stroke-width="8.5"/><circle cx="54" cy="54" r="11" fill="#F5A04A"/></svg>`;
  fs.mkdirSync(path.join(res, 'drawable-nodpi'), { recursive: true });
  fs.writeFileSync(path.join(res, 'drawable-nodpi/ic_launcher_fg.png'),
    await sharp(Buffer.from(fg), { density: 384 }).resize(432, 432).png().toBuffer());
  fs.mkdirSync(path.join(res, 'values'), { recursive: true });
  fs.writeFileSync(path.join(res, 'values/ic_launcher_background.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F5A43</color>
</resources>
`);
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_fg"/>
</adaptive-icon>
`;
  const any = path.join(res, 'mipmap-anydpi-v26');
  fs.mkdirSync(any, { recursive: true });
  fs.writeFileSync(path.join(any, 'ic_launcher.xml'), adaptive);
  fs.writeFileSync(path.join(any, 'ic_launcher_round.xml'), adaptive);
  fs.rmSync(path.join(res, 'drawable-v24/ic_launcher_foreground.xml'), { force: true });
  fs.rmSync(path.join(res, 'drawable/ic_launcher_background.xml'), { force: true });

  console.log('Android siap: tanda tangan, izin getar, ikon, versi 1.1.' + run);
})().catch(e => { console.error(e); process.exit(1); });
