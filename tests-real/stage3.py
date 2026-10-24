"""Uji Tahap 3 (hitam murni AMOLED, getar sentuhan, target fokus harian) + regresi tombol "i" di mode fokus.

Pakai:  python3 -m http.server 8765 --bind 127.0.0.1 &   (dari akar repo)
        python3 tests-real/stage3.py
Butuh: playwright (chromium). Status: DIJALANKAN 24 Okt 2026 (sesi dengan clone): 14 uji, 0 gagal.
Selektor bilah target Beranda = #ffHomeDaily (bukan #ffDaily, itu tombol target di halaman Fokus milik focus-plus.js).
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
res = []


def ok(n, c, i=""):
    res.append(bool(c))
    print(("PASS " if c else "FAIL ") + n + ((" | " + str(i)) if i != "" else ""))


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    # hitung panggilan navigator.vibrate
    ctx.add_init_script("window.__vib=0;navigator.vibrate=function(){window.__vib++;return true}")
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(600)
    sk = pg.get_by_role("button", name="Lewati")
    if sk.count() and sk.first.is_visible():
        sk.first.click()
        pg.wait_for_timeout(400)

    # --- kartu pengaturan ---
    pg.evaluate("goTo('pengaturan')")
    pg.wait_for_timeout(400)
    ok("kartu 'Tampilan & sentuhan' ada dengan 3 kontrol",
       pg.locator("#ffLookCard #ffAmoled, #ffLookCard #ffHaptics, #ffLookCard #ffDailyGoal").count() == 3)
    st = pg.evaluate("()=>[ffHaptics.getAttribute('aria-checked'),ffAmoled.getAttribute('aria-checked'),ffDailyGoal.value]")
    ok("bawaan: getar nyala, AMOLED mati, target 60", st == ["true", "false", "60"], st)

    # --- AMOLED ---
    pg.evaluate("()=>{DB.profile.settings.theme='gelap';saveDB();applyTheme()}")
    bg0 = pg.evaluate("()=>getComputedStyle(document.body).backgroundColor")
    pg.click("#ffAmoled")
    pg.wait_for_timeout(200)
    st = pg.evaluate("()=>({cls:document.documentElement.classList.contains('ff-amoled'),bg:getComputedStyle(document.body).backgroundColor,aria:ffAmoled.getAttribute('aria-checked'),meta:[...document.querySelectorAll('meta[name=theme-color]')].map(m=>m.content)})")
    ok("AMOLED nyala: kelas + latar hitam + aria-checked", st["cls"] and st["bg"] == "rgb(0, 0, 0)" and st["aria"] == "true", st)
    ok("AMOLED nyala: theme-color #000000", all(m == "#000000" for m in st["meta"]), st["meta"])
    pg.screenshot(path="s3-amoled-pengaturan.png")
    pg.click("#ffAmoled")
    pg.wait_for_timeout(200)
    bg1 = pg.evaluate("()=>getComputedStyle(document.body).backgroundColor")
    ok("AMOLED mati: latar kembali bukan hitam murni", bg1 != "rgb(0, 0, 0)", bg1)
    pg.evaluate("()=>{DB.profile.settings.theme='terang';saveDB();applyTheme();DB.profile.settings.amoled=true;saveDB();applyTheme()}")
    bg2 = pg.evaluate("()=>getComputedStyle(document.body).backgroundColor")
    ok("AMOLED tidak memengaruhi tema terang", bg2 != "rgb(0, 0, 0)", bg2)
    pg.evaluate("()=>{DB.profile.settings.amoled=false;DB.profile.settings.theme='system';saveDB();applyTheme()}")

    # --- getar ---
    v0 = pg.evaluate("window.__vib")
    pg.click(".nav-bottom .nav-item[data-route='beranda']")
    v1 = pg.evaluate("window.__vib")
    ok("ketuk tab bawah -> getar", v1 > v0, [v0, v1])
    pg.evaluate("goTo('pengaturan')")
    pg.wait_for_timeout(300)
    pg.click("#ffHaptics")  # matikan
    v2 = pg.evaluate("window.__vib")
    pg.click(".nav-bottom .nav-item[data-route='beranda']")
    v3 = pg.evaluate("window.__vib")
    ok("getar dimatikan -> tidak ada getar lagi", v3 == v2, [v2, v3])
    pg.evaluate("goTo('pengaturan')")
    pg.click("#ffHaptics")  # nyalakan lagi

    # --- target harian ---
    pg.evaluate("goTo('beranda')")
    pg.wait_for_timeout(300)
    ok("bilah target ada (0 / 60)", "0 / 60" in pg.inner_text("#ffHomeDaily"), pg.inner_text("#ffHomeDaily"))
    pg.evaluate("()=>{DB.sessions.push({id:'t1',completed:true,actualMin:30,startedAt:new Date().toISOString()});saveDB();renderHome()}")
    t = pg.inner_text("#ffHomeDaily")
    ok("30 menit -> '30 / 60'", "30 / 60" in t, t)
    pg.evaluate("()=>{DB.sessions.push({id:'t2',completed:true,actualMin:35,startedAt:new Date().toISOString()});saveDB();renderHome()}")
    pg.wait_for_timeout(200)
    t = pg.inner_text("#ffHomeDaily")
    toast = pg.inner_text("#toast")
    ok("65 menit -> tercapai (hit) + toast selebrasi", pg.evaluate("ffHomeDaily.classList.contains('hit')") and "tercapai" in toast, [t, toast])
    pg.screenshot(path="s3-target-beranda.png")
    pg.evaluate("goTo('pengaturan')")
    pg.select_option("#ffDailyGoal", "0")
    pg.evaluate("goTo('beranda')")
    pg.wait_for_timeout(200)
    ok("target 'Mati' -> bilah hilang", pg.locator("#ffHomeDaily").count() == 0)

    # --- regresi: ketuk 'i' di mode fokus tidak mengganti mode ---
    pg.evaluate("goTo('fokus')")
    pg.wait_for_timeout(300)
    pg.click(".mode-btn[data-mode='deepwork'] .info")
    pg.wait_for_timeout(200)
    act = pg.evaluate("()=>document.querySelector('.mode-btn.active').dataset.mode")
    ok("ketuk 'i' Deep Work: mode tetap klasik + tooltip tampil", act == "klasik" and "Kenapa ini" in pg.inner_text("#toast"), act)

    ok("tanpa galat konsol", not errs, errs[:3])
    ctx.close()
    b.close()
print("\nTOTAL", len(res), "uji, gagal", res.count(False))
sys.exit(1 if False in res else 0)
