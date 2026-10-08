/* Aplikasi utama Hikimori Const.
   Komponen & util bersama ada di src/app/core.jsx; tiap halaman berat dimuat lazy dari src/pages/*
   sehingga pengunjung hanya mengunduh kode halaman yang benar-benar dibuka. */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { withLazy, prefetchWhenIdle } from "./app/lazy.jsx";
import LeadForm from "./marketing/LeadForm.jsx";
import SocialFeed from "./marketing/SocialFeed.jsx";
import ConsentBanner from "./marketing/ConsentBanner.jsx";
import { resolveMarketing } from "./marketing/config.js";
import { initTracking, initAutoTracking, trackPageView, trackEvent, notifyRouteChange } from "./marketing/tracking.js";
import { initPerformanceMode, shouldUseLiteMode, isFinePointer, cld, videoPoster } from "./lib/net.js";
import { fsGet, fsGetWithRetry, fsSet, getAuthBits, fbSignOutSafe } from "./lib/firebase.js";
import { DEFAULT_HERO_VIDEO } from "./config/infra.js";
import { DEFAULT_DATA, HARDCODED_USERS, HIKIMORI_LOGO_URL, HOME_SERVICES_DEFAULT, HikimoriFooter, INT_PAGE_CRUD_KEY, LEGACY_TEXT_MIGRATIONS, LogoDisplay, MobileLayananAccordion, MobileTemaRumahAccordion, NavDropdownGaleri, NavDropdownLayanan, NavDropdownTemaRumah, PAGE_TO_PATH, PATH_TO_PAGE, RunningPhotoRow, RunningTextMarquee, TEMA_DATA, TemaPhotoSlideshow, WaPickerModal, adminSlugToTab, adminTabToPath, articleUrl, buildWaMsg, catalogItemUrl, displayPhone, genOTP, getAutoHomeRunningImages, getInitialAdminTab, getInitialPage, getInitialShowAdmin, interleaveArrays, onImgError, paketUrl, parseArtikelPath, parseCatalogItemPath, parsePaketPath, parseTemaPath, rebrandDeep, sendOTPEmail, sessionClear, sessionLoad, sessionSave, temaDetailUrl } from "./app/core.jsx";
/* ── Halaman dimuat sesuai kebutuhan (code splitting) ──
   withLazy = React.lazy + batas <Suspense> sendiri, jadi saat chunk diunduh hanya area halaman itu
   yang menampilkan penanda muat — navbar, footer, dan tombol mengambang tetap di tempat. */
const PromoPage = withLazy(() => import("./marketing/PromoPage.jsx"));
const AdminPanel = withLazy(() => import("./pages/admin-panel.jsx").then(m => ({ default: m.AdminPanel })), { panel: true });
const ServicesPage = withLazy(() => import("./pages/services.jsx").then(m => ({ default: m.ServicesPage })));
const AboutPage = withLazy(() => import("./pages/about.jsx").then(m => ({ default: m.AboutPage })));
const DesainRabPage = withLazy(() => import("./pages/desainrab.jsx").then(m => ({ default: m.DesainRabPage })));
const TemaRumahPage = withLazy(() => import("./pages/tema.jsx").then(m => ({ default: m.TemaRumahPage })));
const LandscapePage = withLazy(() => import("./pages/landscape.jsx").then(m => ({ default: m.LandscapePage })));
const PembangunanCafePage = withLazy(() => import("./pages/programs.jsx").then(m => ({ default: m.PembangunanCafePage })));
const PembangunanKostPage = withLazy(() => import("./pages/programs.jsx").then(m => ({ default: m.PembangunanKostPage })));
const PembangunanRukoPage = withLazy(() => import("./pages/programs.jsx").then(m => ({ default: m.PembangunanRukoPage })));
const RumahSubsidiPage = withLazy(() => import("./pages/programs.jsx").then(m => ({ default: m.RumahSubsidiPage })));
const AluminiumPage = withLazy(() => import("./pages/catalog.jsx").then(m => ({ default: m.AluminiumPage })));
const InteriorPage = withLazy(() => import("./pages/catalog.jsx").then(m => ({ default: m.InteriorPage })));
const KanopiPage = withLazy(() => import("./pages/catalog.jsx").then(m => ({ default: m.KanopiPage })));
const PagarPage = withLazy(() => import("./pages/catalog.jsx").then(m => ({ default: m.PagarPage })));
const SubEksteriorPage = withLazy(() => import("./pages/catalog.jsx").then(m => ({ default: m.SubEksteriorPage })));
const SubInteriorPage = withLazy(() => import("./pages/catalog.jsx").then(m => ({ default: m.SubInteriorPage })));
const CustomFurniturPage = withLazy(() => import("./pages/furnitur.jsx").then(m => ({ default: m.CustomFurniturPage })));
const FurniturPage = withLazy(() => import("./pages/furnitur.jsx").then(m => ({ default: m.FurniturPage })));
const ArticleDetail = withLazy(() => import("./pages/article.jsx").then(m => ({ default: m.ArticleDetail })));
const SectionPage = withLazy(() => import("./pages/article.jsx").then(m => ({ default: m.SectionPage })));
const ReviewForm = withLazy(() => import("./pages/review.jsx").then(m => ({ default: m.ReviewForm })));
export default function HikimoriConstApp() {
  const [data, setData] = useState(DEFAULT_DATA);
  const dataRef = useRef(DEFAULT_DATA); // selalu up-to-date, aman dipakai di closure stale (popstate)
  const [isLoading, setIsLoading] = useState(true);
  const [fsLoadError, setFsLoadError] = useState(false); // true jika Firestore gagal dibaca sama sekali (bukan sekadar kosong)
  /* dataReady BEDA dari isLoading: isLoading cuma soal tampilan (biar halaman langsung muncul,
     tidak nunggu). dataReady baru true setelah percobaan baca Firestore BENAR-BENAR selesai
     (berhasil ataupun gagal). Ini dipakai untuk mengunci Control Panel — mencegah admin bisa
     klik Edit/Simpan/Hapus memakai data lama/default SEBELUM data asli dari Firestore sempat
     termuat, yang selama ini jadi celah race-condition penyebab data tertimpa. */
  const [dataReady, setDataReady] = useState(false);
  const [user, setUser] = useState(() => sessionLoad()); // ← restore session saat reload
  // Fix #3: gunakan lazy initializer agar window.location dibaca saat render, bukan module load
  const [page, setPage] = useState(() => getInitialPage()); // home | about | news | shop | destinations | services
  // -- Native history tracking (tidak pakai custom stack) ------------------
  // spaDepth: seberapa jauh dari entry awal (disimpan di pushState state.depth)
  // spaMaxDepth: titik terjauh yang pernah dicapai → untuk canForward
  const spaDepth    = useRef(0);
  const spaMaxDepth = useRef(0);
  const [canBack, setCanBack] = useState(false);
  const [canFwd,  setCanFwd]  = useState(false);
  const [readPost, setReadPost] = useState(null);
  const [temaSlug, setTemaSlug] = useState(() => parseTemaPath(window.location.pathname));
  // Slug produk katalog (Plafon, Pagar, Kanopi, dll) yang sedang dibuka via link share — restore dari URL saat load
  const [catalogItemSlug, setCatalogItemSlug] = useState(() => parseCatalogItemPath(window.location.pathname)?.itemSlug || null);
  const [showLogin, setShowLogin] = useState(false);
  const [comingSoon, setComingSoon] = useState(null); // null | "google" | "apple"
  const [showAdmin, setShowAdmin] = useState(() => getInitialShowAdmin()); // restore dari URL /control-panel
  const [adminTab, setAdminTab] = useState(() => getInitialAdminTab());
  const [adminSection, setAdminSection] = useState("news");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const [comingSoonPopup, setComingSoonPopup] = useState(false);
  // Forgot password flow: null | "input_user" | "input_email" | "input_otp" | "input_newpass"
  const [forgotStep, setForgotStep] = useState(null);
  const [forgotUser, setForgotUser] = useState("");
  const [forgotSearchBy, setForgotSearchBy] = useState("username"); // "username" | "email" | "phone"
  const [forgotFoundUser, setForgotFoundUser] = useState(null); // username string found after step1
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState({ code: "", input: "", expiry: 0, sending: false });
  const [forgotNewPass, setForgotNewPass] = useState({ val: "", confirm: "" });
  const [forgotErr, setForgotErr] = useState("");
  const [notif, setNotif] = useState(null);
  const [saveProgress, setSaveProgress] = useState(null); // null | { pct, label, status: "saving"|"success"|"error", msg? }
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editImg, setEditImg] = useState({ group: null, idx: null, url: "" });
  const [editContent, setEditContent] = useState({});
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [waPicker, setWaPicker] = useState(null); // null | { msgText: "" }
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [emailSub, setEmailSub] = useState("");
  const [cmsEditPost, setCmsEditPost] = useState(null); // null | "new" | post object
  const [cmsSection, setCmsSection] = useState("news");
  const [showDevProfile, setShowDevProfile] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState("");
  const [mapLocation, setMapLocation] = useState("Malang, Jawa Timur, Indonesia");
  const mapDebounceRef = useRef(null);
  const heroVideoRef = useRef(null); // force-autoplay hero background video
  /* Video hero: poster tampil dulu (LCP cepat), video dimuat SETELAH halaman selesai load, dan tidak dimuat
     sama sekali di koneksi lambat / Data Saver / perangkat lemah / pengguna minta animasi dikurangi. */
  const [heroLite] = useState(() => shouldUseLiteMode());
  const [heroVideoOn, setHeroVideoOn] = useState(false);
  useEffect(() => {
    if (heroLite) return;
    let t;
    const go = () => { t = setTimeout(() => setHeroVideoOn(true), 700); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
    return () => { clearTimeout(t); window.removeEventListener("load", go); };
  }, [heroLite]);
  const mk = useMemo(() => resolveMarketing(data.content?.marketing), [data.content?.marketing]);
  // openWaPicker menerima string langsung ATAU {key, vars} untuk template
  const openWaPicker = (msgOrObj = "") => {
    trackEvent("cta_click", { content_name: "wa_picker_open" }, { server: false });
    if (typeof msgOrObj === "object" && msgOrObj !== null && msgOrObj.key) {
      const { key, vars = {} } = msgOrObj;
      const tpl = data.content.waTemplates || {};
      setWaPicker({ msgText: buildWaMsg(tpl, key, vars) });
    } else {
      // backward compat: string biasa → override langsung tanpa template
      // KECUALI string kosong → pakai template "umum"
      if (!msgOrObj) {
        const tpl = data.content.waTemplates || {};
        setWaPicker({ msgText: buildWaMsg(tpl, "umum", {}) });
      } else {
        setWaPicker({ msgText: String(msgOrObj) });
      }
    }
  };

  // -- Scroll Reveal for RE home --
  // -- Force autoplay hero video (bypass browser autoplay policy) ----------
  useEffect(() => {
    const vid = heroVideoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.volume = 0;
    const tryPlay = () => {
      vid.play().catch(() => {
        // Jika gagal, tunggu interaksi user pertama lalu play otomatis
        const onInteract = () => {
          vid.play().catch(() => {});
        };
        document.addEventListener("click", onInteract, { once: true });
        document.addEventListener("touchstart", onInteract, { once: true });
        document.addEventListener("keydown", onInteract, { once: true });
      });
    };
    // Play ulang saat tab kembali aktif
    const onVisible = () => {
      if (document.visibilityState === "visible") vid.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    if (vid.readyState >= 2) {
      tryPlay();
    } else {
      vid.addEventListener("canplay", tryPlay, { once: true });
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [heroVideoOn]); // video baru ter-mount setelah heroVideoOn → pasang ulang autoplay

  useEffect(() => {
    if (page !== "home") return;
    const SELECTORS = ".re-reveal,.re-slide-left,.re-slide-right,.re-scale-in";
    // Reveal SEKALI SAJA lalu stop observe (hindari kedip saat momentum scroll di HP).
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    const seen = new WeakSet();
    const scan = (root) => {
      (root.querySelectorAll ? root.querySelectorAll(SELECTORS) : []).forEach(el => {
        if (!seen.has(el)) { seen.add(el); obs.observe(el); }
      });
    };
    scan(document);
    /* BUGFIX: elemen yang baru muncul setelah data Firestore/CMS termuat (kartu layanan, galeri, dst.)
       dulu TIDAK pernah diamati → tetap opacity:0 (tidak terlihat). MutationObserver menangkap node baru. */
    let raf = 0;
    const mo = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; scan(document); });
    });
    mo.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    /* Jaring pengaman: bila IntersectionObserver gagal/macet, tampilkan semua konten setelah 4 dtk */
    const failSafe = setTimeout(() => {
      document.querySelectorAll(SELECTORS).forEach(el => { if (!el.classList.contains("visible")) el.classList.add("visible"); });
    }, 4000);
    return () => { obs.disconnect(); mo.disconnect(); clearTimeout(failSafe); if (raf) cancelAnimationFrame(raf); };
  }, [page]);
  // Profile editing state
  const [profileEdit, setProfileEdit] = useState({ name: "", phone: "", email: "", desc: "", photo: "", oldPass: "", newPass: "", confirmPass: "" });
  const [userMgmtForm, setUserMgmtForm] = useState({ username: "", password: "", role: "content_writer", email: "", name: "" });
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [editRoleId, setEditRoleId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviewTokenParam, setReviewTokenParam] = useState(() => {
    try {
      const m = window.location.pathname.match(/^\/UlasanPelayanan\/(.+)$/);
      return m ? m[1] : "";
    } catch { return ""; }
  });

  /* ── Desktop cursor glow + scroll-reveal (desktop width only) ── */
  useEffect(() => {
    const isDesktop = window.innerWidth > 900;
    if (!isDesktop) return;


    // Scroll-reveal IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove("exit");
          void e.target.offsetWidth;
          e.target.classList.add("visible");
        } else {
          if (e.target.classList.contains("visible")) {
            e.target.classList.remove("visible");
            void e.target.offsetWidth;
            e.target.classList.add("exit");
          }
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".anim-fade-up, .anim-zoom").forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ── Fix #2: popstate listener — sync React state saat user tekan Back/Forward browser ── */
  useEffect(() => {
    const onPopState = (e) => {
      const pathname = window.location.pathname;
      // /UlasanPelayanan/{token}
      const reviewMatch = pathname.match(/^\/UlasanPelayanan\/(.+)$/);
      if (reviewMatch) {
        setReviewTokenParam(reviewMatch[1]);
        setShowAdmin(false);
        return;
      }
      setReviewTokenParam("");
      // /control-panel atau /control-panel/<slug> -- restore tab dari URL slug (fallback ke history state)
      if (pathname === "/control-panel" || pathname.startsWith("/control-panel/") || e.state?.admin) {
        // Jika sedang dalam mode edit paket dan user tekan Back → keluar edit dulu
        if (false) {
          window.history.pushState({ admin: true, adminTab: adminTabRef.current, depth: (e.state?.depth ?? 0) }, "", adminTabToPath(adminTabRef.current));
          return;
        }
        setShowAdmin(true);
        const slugMatch = pathname.match(/^\/control-panel\/([^/]+)$/);
        if (slugMatch) {
          setAdminTab(adminSlugToTab(slugMatch[1]));
          setCmsEditPost(null);
        } else if (e.state?.adminTab) {
          setAdminTab(e.state.adminTab);
          setCmsEditPost(null);
        }
        _syncDepth(e.state?.depth);
        return;
      }
      setShowAdmin(false);
      // /services/{category}/{slug}/{id} → buka detail paket
      const pkgParsed = parsePaketPath(pathname);
      if (pkgParsed) {
        setPage("services");
        setActivePaket({ id: pkgParsed.id, category: pkgParsed.category });
        setMobileMenu(false);
        window.scrollTo(0, 0);
        _syncDepth(e.state?.depth);
        return;
      }
      // /artikel/{section}/{slug}-{id} → buka detail artikel
      const artParsed = parseArtikelPath(pathname);
      if (artParsed) {
        const sectionPage = { news: "news", shop: "shop", destinations: "destinations" }[artParsed.section] || "news";
        setPage(sectionPage);
        // Restore readPost dari dataRef (selalu fresh, tidak stale)
        const allP = Object.values(dataRef.current?.posts || {}).flat();
        const found = allP.find(p => p.id === artParsed.id || String(p.id) === String(artParsed.id));
        if (found) setReadPost(found);
        setMobileMenu(false);
        window.scrollTo(0, 0);
        _syncDepth(e.state?.depth);
        return;
      }
      // /tema-rumah/{slug} → buka detail tema rumah
      const temaSlugParsed = parseTemaPath(pathname);
      if (temaSlugParsed) {
        setPage("temarumah");
        setTemaSlug(temaSlugParsed);
        setMobileMenu(false);
        window.scrollTo(0, 0);
        _syncDepth(e.state?.depth);
        return;
      }
      // /interior/{sub}/{item-slug} atau /eksterior/{sub}/{item-slug} → buka detail produk katalog (Plafon, Pagar, dll)
      const catItemParsed = parseCatalogItemPath(pathname);
      if (catItemParsed) {
        setPage(catItemParsed.pageKey);
        setCatalogItemSlug(catItemParsed.itemSlug);
        setMobileMenu(false);
        window.scrollTo(0, 0);
        _syncDepth(e.state?.depth);
        return;
      }
      // Sub-route interior/* dan eksterior/*
      if (pathname.startsWith("/interior/") || pathname.startsWith("/eksterior/")) {
        const key = pathname.replace("/","");
        setPage(key); setCatalogItemSlug(null); setMobileMenu(false); window.scrollTo(0,0); _syncDepth(e.state?.depth); return;
      }
      // Normal page -- tutup detail paket, artikel & tema rumah
      setActivePaket(null);
      setReadPost(null);
      setTemaSlug(null);
      setCatalogItemSlug(null);
      const p = e.state?.page || PATH_TO_PAGE[pathname] || "home";
      setPage(p);
      setMobileMenu(false);
      window.scrollTo(0, 0);
      _syncDepth(e.state?.depth);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Helper: sync spaDepth + canBack/canFwd dari depth yang disimpan di history state.
   *  Gunakan spaMaxDepth (ref) langsung — tidak pernah stale. */
  const _syncDepth = (depth) => {
    const d = depth ?? 0;
    spaDepth.current = d;
    setCanBack(d > 0);
    setCanFwd(d < spaMaxDepth.current);
  };

  /* ─── Deep-merge helper ──────────────────────────────────────────────────
     Menggabungkan data yang disimpan (saved) dengan DEFAULT_DATA sehingga:
     • Semua data lama (konten, gambar, post, pesan, user, dsb.) TETAP ada
     • Field BARU yang ditambahkan lewat git push (nav6, services, dsb.)
       otomatis muncul dengan nilai default — tidak perlu reset manual
     ─────────────────────────────────────────────────────────────────────── */
  const mergeWithDefaults = (saved, defaults) => {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return saved ?? defaults;
    const result = { ...defaults };
    for (const key of Object.keys(saved)) {
      const sv = saved[key];
      const dv = defaults?.[key];
      if (sv !== null && typeof sv === "object" && !Array.isArray(sv) && dv !== null && typeof dv === "object" && !Array.isArray(dv)) {
        // Objek nested → merge rekursif
        result[key] = mergeWithDefaults(sv, dv);
      } else if (key === "services" && Array.isArray(sv) && Array.isArray(dv)) {
        // Array services: gabungkan data Firebase + item DEFAULT yang id-nya belum ada.
        // JUGA: merge field baru (facilities, destinations, services) ke tiap item lama
        // yang tersimpan di Firebase namun belum punya field tersebut.
        // CATATAN: dulu ada cabang "kalau sv kosong, langsung ganti seluruhnya dengan default"
        // di sini — itu pola yang SAMA seperti bug auto-seed yang sudah diperbaiki di tempat
        // lain, jadi dihapus. Sekarang array kosong tetap diproses lewat logika per-id yang
        // sama di bawah (aman: hanya MENAMBAHKAN paket default yang id-nya belum ada, tidak
        // pernah mengganti/menghapus apa pun yang sudah tersimpan).
        {
          const defaultById = Object.fromEntries(dv.map(s => [s.id, s]));
          const merged = sv.map(savedItem => {
            const def = defaultById[savedItem.id];
            if (!def) return savedItem; // item custom user, tidak ada di DEFAULT → biarkan
            // Inject field baru dari DEFAULT jika belum ada di item tersimpan
            const patched = { ...savedItem };
            // Untuk paket traveling: PAKSA sync field kritis dari DEFAULT
            // (pastikan filter category==="traveling" & pkgId selalu benar)
            if (def.category === "traveling") {
              patched.category  = def.category;  // WAJIB: agar lolos filter Traveling
              patched.pkgId     = def.pkgId;      // WAJIB: agar tidak salah bucket
              // JANGAN overwrite destinations/facilities/prices jika user sudah punya data
              if (!savedItem.destinations?.length && def.destinations) patched.destinations = def.destinations;
              if (!savedItem.facilities?.length   && def.facilities)   patched.facilities   = def.facilities;
              if (!savedItem.paketTypes?.length    && def.paketTypes)   patched.paketTypes   = def.paketTypes;
              if (!savedItem.services?.length      && def.services)     patched.services     = def.services;
              // highlight hanya inject jika belum pernah di-set user
              if (savedItem.highlight === undefined) patched.highlight = def.highlight;
            }
            for (const field of ["facilities", "destinations", "services", "images", "pkgId", "tagline", "accent", "accentLight", "duration", "minPeserta", "description", "features", "highlight", "badge", "badgeColor", "priceNote", "category"]) {
              // Hanya inject dari DEFAULT jika field benar-benar belum ada (undefined/null)
              // Jangan overwrite array kosong [] karena user mungkin sengaja mengosongkan
              if (patched[field] === undefined || patched[field] === null) {
                if (def[field] !== undefined) patched[field] = def[field];
              }
            }
            return patched;
          });
          const existingIds = new Set(sv.map(s => s.id));
          const deletedIds = new Set(saved.deletedServiceIds || []);
          const missing = dv.filter(s => !existingIds.has(s.id) && !deletedIds.has(s.id));
          result[key] = [...merged, ...missing];
        }
      } else {
        // Primitif atau array lain → pakai nilai yang disimpan
        // (kecuali teks lama yang sudah dijadwalkan diganti, lihat LEGACY_TEXT_MIGRATIONS)
        const mig = LEGACY_TEXT_MIGRATIONS[key];
        result[key] = (mig && sv === mig.from) ? mig.to : sv;
      }
    }
    return result;
  };

  useEffect(() => {
    // Langsung selesaikan loading dengan DEFAULT_DATA agar halaman langsung tampil
    setIsLoading(false);

    // Fast path: baca localStorage synchronously sebelum async ops
    try {
      const lsCache = localStorage.getItem("hikimori-const-cache-v1");
      if (lsCache) {
        const merged = mergeWithDefaults(rebrandDeep(JSON.parse(lsCache)), DEFAULT_DATA);
        setData(merged);
        dataRef.current = merged;
      }
    } catch {}

    (async () => {
      try {
        // 1. Load dari cache lokal dulu (lebih cepat)
        try {
          const r = await window.storage?.get("hikimori-const-v1");
          if (r?.value) {
            const parsed = JSON.parse(r.value);
            const merged = mergeWithDefaults(rebrandDeep(parsed), DEFAULT_DATA);
            setData(merged);
            dataRef.current = merged;
          }
        } catch {}

        // 2. Load Firestore di background → update data jika lebih baru
        //    Pakai fsGetWithRetry: kalau gagal (bukan sekadar dokumen kosong), coba lagi
        //    sampai 4x dengan jeda makin lama (total budget waktu tunggu ±14 detik) sebelum
        //    benar-benar menyerah — supaya server gratisan yang lambat/cold-start dapat
        //    kesempatan lebih banyak sebelum dianggap gagal.
        try {
          const fsData = await fsGetWithRetry("main", { retries: 4, baseDelayMs: 1500 });
          if (fsData?.payload) {
            const parsed = JSON.parse(fsData.payload);
            const merged = mergeWithDefaults(rebrandDeep(parsed), DEFAULT_DATA);
            setData(merged);
            dataRef.current = merged;
            // Sync ke localStorage untuk fast-path berikutnya
            try { localStorage.setItem("hikimori-const-cache-v1", fsData.payload); } catch {}
          }
        } catch (fsErr) {
          // Sudah dicoba berkali-kali dan tetap gagal — kemungkinan besar memang masalah
          // koneksi/izin/konfigurasi, bukan sekadar lambat. Tampilkan peringatan alih-alih
          // diam-diam pakai default, supaya tidak disalahartikan sebagai "data hilang".
          console.error("[RealEstate] Firestore gagal diakses setelah beberapa kali percobaan:", fsErr);
          setFsLoadError(true);
        }
        // Percobaan baca Firestore sudah tuntas (berhasil atau gagal) → aman membuka Control Panel.
        setDataReady(true);
      } catch (e) {
        console.warn("[RealEstate] Gagal load data, pakai default.", e);
        setDataReady(true);
      }
    })();
  }, []);

  // Setelah data selesai load → resolve artikel atau paket dari URL saat mount
  useEffect(() => {
    if (isLoading) return;
    const pathname = window.location.pathname;
    // /artikel/{section}/{slug}-{id}
    const artParsed = parseArtikelPath(pathname);
    if (artParsed) {
      const allP = Object.values(data.posts || {}).flat();
      const found = allP.find(p => p.id === artParsed.id || String(p.id) === String(artParsed.id));
      if (found) {
        // Set page ke section yang sesuai, tapi jangan push URL lagi
        const sectionPage = { news: "news", shop: "shop", destinations: "destinations" }[found.section] || "news";
        setPage(sectionPage);
        setReadPost(found);
      }
      return;
    }
    // /paket/{category}/{id}
    const pkgParsed = parsePaketPath(pathname);
    if (pkgParsed) {
      const found = (data.services || []).find(s => s.id === pkgParsed.id || String(s.id) === String(pkgParsed.id));
      if (found) {
        setPage("services");
        setActivePaket({ id: found.id, category: found.category });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, (data.services || []).length]);

  /* ── Structured data (JSON-LD) dari data CMS untuk SEO lokal ── */
  useEffect(() => {
    const c = data.content || {};
    const origin = window.location.origin;
    const ld = {
      "@context": "https://schema.org", "@type": "GeneralContractor", name: "Hikimori Const", url: origin,
      logo: `${origin}/images/hikimori-const-logo.svg`, image: `${origin}/marketing/og-image.png`,
      description: "Jasa desain, bangun, renovasi, interior dan landscape rumah — Hikimori Const.",
      ...(c.phone ? { telephone: c.phone } : {}), ...(c.email ? { email: c.email } : {}),
      ...(c.address ? { address: { "@type": "PostalAddress", streetAddress: c.address, addressCountry: "ID" } } : {}),
      ...(c.hours ? { openingHours: c.hours } : {}),
      sameAs: [c.igLink, c.fbLink, mk.instagramUser && `https://instagram.com/${mk.instagramUser}`, mk.tiktokUser && `https://tiktok.com/@${mk.tiktokUser}`].filter(Boolean),
    };
    let el = document.getElementById("ld-org");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "ld-org"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(ld);
  }, [data.content, mk]);

  // Sync adminTabRef dengan adminTab state
  useEffect(() => { adminTabRef.current = adminTab; }, [adminTab]);

  // Force light mode -- inject meta color-scheme ke <head> sekali saat mount
  useEffect(() => {
    // Meta color-scheme
    let meta = document.querySelector("meta[name='color-scheme']");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      document.head.appendChild(meta);
    }
    meta.content = "only light";
    // Meta theme-color untuk address bar browser mobile
    let themeMeta = document.querySelector("meta[name='theme-color']");
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = "#2E3D3F";
    // Paksa html & body pakai color-scheme light -- kebal dark mode
    document.documentElement.style.colorScheme = "only light";
    document.documentElement.style.forcedColorAdjust = "none";
    document.documentElement.style.webkitForcedColorAdjust = "none";
    document.documentElement.style.filter = "none";
    document.documentElement.setAttribute("data-color-scheme", "light");
    document.body.style.colorScheme = "only light";
    document.body.style.forcedColorAdjust = "none";
    document.body.style.filter = "none";
  }, []);

  // -- Static Glitch Pixel Cursor -------------------------------------------
  useEffect(() => {
    if (shouldUseLiteMode() || !isFinePointer()) return; // cursor kustom hanya untuk desktop bertenaga
    const S = 2; // ukuran 1 pixel art = 2px
    const size = 64;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");

    // Helper
    const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x*S, y*S, S, S); };

    // Outline hitam
    const outline = [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],
      [1,0],[1,13],[2,13],[3,13],[4,13],
      [1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],
      [2,12],[3,11],[4,10],[5,9],[6,8],[7,7],
      [5,13],[5,14],[6,14],[6,15],[7,14],[7,15],[4,14],
      [6,12],[7,12],[8,12],[8,11],[9,11],[9,10],
    ];
    outline.forEach(([x,y]) => px(x,y,"#111111"));

    // Fill putih
    const fill = [
      [1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[1,9],[1,10],[1,11],[1,12],
      [2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
      [3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],
      [4,5],[4,6],[4,7],[4,8],[4,9],
      [5,6],[5,7],[5,8],
      [6,7],
      [5,10],[5,11],[5,12],[6,11],[6,12],[6,13],[7,13],
    ];
    fill.forEach(([x,y]) => px(x,y,"#ffffff"));

    // Glitch merah (chromatic aberration kiri)
    const red = [
      [-1,0],[-1,1],[-1,2],[-1,3],[0,-1],
      [-1,7],[-1,8],
      [4,13],[4,14],[5,14],[5,15],
    ];
    red.forEach(([x,y]) => { if(x*S>=0 && y*S>=0 && (x+1)*S<=size && (y+1)*S<=size) px(x,y,"#ff2020"); });

    // Glitch cyan (chromatic aberration kanan)
    const cyan = [
      [1,0],[12,10],[13,10],[14,10],
      [12,11],[13,11],[14,11],
      [8,14],[9,14],[10,13],[10,14],
    ];
    cyan.forEach(([x,y]) => { if(x*S>=0 && y*S>=0 && (x+1)*S<=size && (y+1)*S<=size) px(x,y,"#00e5ff"); });

    const dataUrl = c.toDataURL("image/png");
    const styleEl = document.createElement("style");
    styleEl.id = "glitch-cursor-style";
    // hotspot 0,0 = ujung panah di kiri atas
    styleEl.textContent = `*, *::before, *::after { cursor: url('${dataUrl}') 0 0, auto !important; }`;
    document.head.appendChild(styleEl);

    return () => { styleEl.remove(); };
  }, []);
  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']") || (() => {
      const l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); return l;
    })();
    favicon.href = data.content.logoImage || HIKIMORI_LOGO_URL;
    favicon.type = "image/png";
  }, [data.content.logoImage]);

  // Sync browser tab title -- selalu satu baris, ikuti logoText
  useEffect(() => {
    const raw = data.content.logoText || "HIKIMORI CONST";
    const oneLiner = raw.replace(/\n/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
    document.title = oneLiner;
  }); // tanpa dependency array → jalan setiap render, selalu up-to-date

  const save = async (d) => {
    // Tampilkan progress bar
    setSaveProgress({ pct: 5, label: "Menyiapkan data...", status: "saving" });
    await new Promise(r => setTimeout(r, 80));

    // Selalu merge dengan DEFAULT_DATA sebelum simpan
    const safeData = mergeWithDefaults(d, DEFAULT_DATA);
    setData(safeData);
    dataRef.current = safeData;
    const payload = JSON.stringify(safeData);
    if (payload.length > 950000) {
      console.warn("[Firestore] Ukuran data " + Math.round(payload.length / 1024) + " KB mendekati batas dokumen 1 MiB. Hindari menyimpan gambar base64 — gunakan upload Cloudinary.");
      setNotif({ msg: "Peringatan: data website hampir melewati batas 1 MB Firestore. Gunakan upload gambar (bukan base64).", type: "error" });
    }

    setSaveProgress({ pct: 30, label: "Menyimpan ke lokal...", status: "saving" });
    await new Promise(r => setTimeout(r, 80));

    // 1. Simpan lokal dulu (cepat)
    try { localStorage.setItem("hikimori-const-cache-v1", payload); } catch {}
    try { await window.storage?.set("hikimori-const-v1", payload); } catch {}

    setSaveProgress({ pct: 60, label: "Sinkronisasi ke cloud...", status: "saving" });

    // 2. Firestore cloud sync
    let fsOk = false;
    try {
      await fsSet("main", { payload, updatedAt: Date.now() });
      fsOk = true;
    } catch (err) {
      console.warn("[Firestore] Sync gagal:", err?.message || err);
    }

    setSaveProgress({ pct: 100, label: fsOk ? "Tersimpan!" : "Lokal OK, cloud tertunda", status: fsOk ? "success" : "warning" });
    await new Promise(r => setTimeout(r, 1800));
    setSaveProgress(null);
  };

  const notify = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3200);
  };

  const login = async () => {
    if (loginLoading) return;
    setLoginErr("");
    // Mulai animasi loading
    setLoginLoading(true);
    setLoginProgress(10);
    const tick = setInterval(() => setLoginProgress(p => p < 85 ? p + Math.random() * 18 : p), 180);
    try {
      await new Promise(r => setTimeout(r, 420)); // natural delay
      const u = HARDCODED_USERS.find(x => x.username.toLowerCase() === loginForm.username.trim().toLowerCase());
      setLoginProgress(55);
      if (!u) {
        clearInterval(tick);
        setLoginProgress(100);
        await new Promise(r => setTimeout(r, 220));
        setLoginLoading(false); setLoginProgress(0);
        setLoginErr("Username atau password salah.");
        return;
      }
      // Cek status aktif/nonaktif dari panel "Kelola Pengguna" (data.users) — sebelumnya toggle
      // "Nonaktifkan" di panel itu cuma kosmetik dan TIDAK benar-benar memblokir login, jadi akun
      // yang sudah dinonaktifkan tetap bisa masuk seolah-olah masih aktif. Sekarang benar dicek.
      const userRecord = (data.users || []).find(x => x.username.toLowerCase() === loginForm.username.trim().toLowerCase());
      if (userRecord && userRecord.active === false) {
        clearInterval(tick);
        setLoginProgress(100);
        await new Promise(r => setTimeout(r, 220));
        setLoginLoading(false); setLoginProgress(0);
        setLoginErr("Akun ini telah dinonaktifkan. Hubungi administrator.");
        return;
      }
      // Urutan sumber password (yang paling baru/spesifik menang):
      // 1. profile-<username>._password → hasil ganti password sendiri lewat halaman Profil
      // 2. data.users[].password        → hasil admin set password lewat panel "Kelola Pengguna"
      //    (sebelumnya field ini tersimpan tapi TIDAK PERNAH benar-benar dipakai untuk cek login)
      // 3. HARDCODED_USERS.password     → password default/asli akun ini
      let savedPass = userRecord?.password || u.password;
      let profile = { name: u.name, phone: u.phone, email: u.email, desc: u.desc, photo: u.photo };
      try {
        const r = await fsGet(`profile-${u.username}`);
        if (r) {
          if (r._password) savedPass = r._password;
          profile = { name: r.name ?? profile.name, phone: r.phone ?? profile.phone, email: r.email ?? profile.email, desc: r.desc ?? profile.desc, photo: r.photo ?? profile.photo };
        }
      } catch {}
      setLoginProgress(80);
      if (loginForm.password !== savedPass) {
        clearInterval(tick);
        setLoginProgress(100);
        await new Promise(r => setTimeout(r, 220));
        setLoginLoading(false); setLoginProgress(0);
        setLoginErr("Username atau password salah.");
        return;
      }
      clearInterval(tick);
      setLoginProgress(100);
      await new Promise(r => setTimeout(r, 340));
      const sessionUser = { ...u, ...profile };
      delete sessionUser.password; // JANGAN simpan password (walau ter-hash sekalipun) ke sessionStorage —
                                    // itu bisa dibaca lewat DevTools atau lewat XSS apa pun yang berhasil jalan.
                                    // Password cuma perlu dicek sesaat waktu proses login di atas, tidak perlu
                                    // ikut terbawa di objek user yang disimpan/dipakai sepanjang sesi.
      setUser(sessionUser);
      sessionSave(sessionUser);
      setShowLogin(false); setLoginErr(""); setLoginForm({ username: "", password: "" });
      setLoginLoading(false); setLoginProgress(0);
      notify(`Selamat datang, ${profile.name || u.username}!`);
    } catch {
      clearInterval(tick);
      setLoginLoading(false); setLoginProgress(0);
      setLoginErr("Terjadi kesalahan. Coba lagi.");
    }
  };

  /* ── Forgot Password: Step 1 — cari username ── */
  const forgotStep1 = async () => {
    if (!forgotUser.trim()) { setForgotErr(`Masukkan ${forgotSearchBy === "username" ? "username" : forgotSearchBy === "email" ? "email" : "nomor HP"}.`); return; }
    let found = null;
    // Search in HARDCODED_USERS first
    if (forgotSearchBy === "username") {
      found = HARDCODED_USERS.find(x => x.username.toLowerCase() === forgotUser.trim().toLowerCase()) || null;
    } else if (forgotSearchBy === "email") {
      found = HARDCODED_USERS.find(x => x.email && x.email.toLowerCase() === forgotUser.trim().toLowerCase()) || null;
    } else {
      found = HARDCODED_USERS.find(x => x.phone && x.phone.replace(/\D/g,"") === forgotUser.trim().replace(/\D/g,"")) || null;
    }
    // If not found in hardcoded, also search Firestore profiles
    if (!found) {
      for (const u of HARDCODED_USERS) {
        try {
          const r = await fsGet(`profile-${u.username}`);
          if (!r) continue;
          if (forgotSearchBy === "email" && r.email && r.email.toLowerCase() === forgotUser.trim().toLowerCase()) { found = { ...u, email: r.email, phone: r.phone || u.phone }; break; }
          if (forgotSearchBy === "phone" && r.phone && r.phone.replace(/\D/g,"") === forgotUser.trim().replace(/\D/g,"")) { found = { ...u, email: r.email || u.email, phone: r.phone }; break; }
        } catch {}
      }
    }
    if (!found) { setForgotErr("Akun tidak ditemukan. Periksa kembali data yang dimasukkan."); return; }
    setForgotFoundUser(found.username);
    setForgotErr("");
    setForgotStep("input_email");
  };

  /* ── Forgot Password: Step 2 — verifikasi email & kirim OTP ── */
  const forgotStep2 = async () => {
    setForgotErr("");
    const targetUser = forgotFoundUser || forgotUser.trim();
    const u = HARDCODED_USERS.find(x => x.username.toLowerCase() === targetUser.toLowerCase());
    // Ambil email dari Firestore atau hardcoded
    let storedEmail = u?.email || "";
    try {
      const r = await fsGet(`profile-${u.username}`);
      if (r?.email) storedEmail = r.email;
    } catch {}
    if (!storedEmail) { setForgotErr("Akun ini belum memiliki email terdaftar. Hubungi administrator."); return; }
    if (forgotEmail.trim().toLowerCase() !== storedEmail.toLowerCase()) {
      setForgotErr("Email tidak cocok dengan data akun ini."); return;
    }
    setForgotOTP(p => ({ ...p, sending: true }));
    try {
      const code = genOTP();
      await sendOTPEmail(storedEmail, code);
      setForgotOTP({ code, input: "", expiry: Date.now() + 15 * 60 * 1000, sending: false });
      setForgotStep("input_otp");
    } catch (e) {
      setForgotErr("Gagal mengirim OTP: " + (e.message || "Error")); 
      setForgotOTP(p => ({ ...p, sending: false }));
    }
  };

  /* ── Forgot Password: Step 3 — verifikasi OTP ── */
  const forgotStep3 = () => {
    if (Date.now() > forgotOTP.expiry) { setForgotErr("OTP sudah kadaluarsa. Kirim ulang."); return; }
    if (forgotOTP.input.trim() !== forgotOTP.code) { setForgotErr("Kode OTP salah."); return; }
    setForgotErr("");
    setForgotStep("input_newpass");
  };

  /* ── Forgot Password: Step 4 — simpan password baru ── */
  const forgotStep4 = async () => {
    if (forgotNewPass.val.length < 6) { setForgotErr("Password minimal 6 karakter."); return; }
    if (forgotNewPass.val !== forgotNewPass.confirm) { setForgotErr("Konfirmasi password tidak cocok."); return; }
    const targetUser = forgotFoundUser || forgotUser.trim();
    try {
      const prev = await fsGet(`profile-${targetUser}`) || {};
      await fsSet(`profile-${targetUser}`, { ...prev, _password: forgotNewPass.val });
    } catch {}
    // Reset state
    setForgotStep(null); setForgotUser(""); setForgotEmail("");
    setForgotFoundUser(null);
    setForgotOTP({ code: "", input: "", expiry: 0, sending: false });
    setForgotNewPass({ val: "", confirm: "" }); setForgotErr("");
    notify("Password berhasil direset! Silakan login.");
  };

  const closeForgot = () => {
    setForgotStep(null); setForgotUser(""); setForgotEmail("");
    setForgotFoundUser(null); setForgotSearchBy("username");
    setForgotOTP({ code: "", input: "", expiry: 0, sending: false });
    setForgotNewPass({ val: "", confirm: "" }); setForgotErr("");
  };

  /* ── Login dengan Google (Firebase Authentication) ──
     Akun Google TIDAK otomatis jadi admin — hanya email yang cocok dengan salah satu
     staf terdaftar (HARDCODED_USERS atau data.users hasil "Kelola Pengguna") yang boleh
     masuk. Kalau tidak cocok, langsung sign-out dari Firebase Auth dan ditolak. */
  const googleLogin = async () => {
    if (googleLoginLoading) return;
    setLoginErr("");
    setGoogleLoginLoading(true);
    try {
      // Sesi Google mengikuti pola sesi yang sudah ada di app ini: hilang saat browser ditutup,
      // bukan tersimpan permanen — konsisten dengan login username/password.
      // SDK Firebase Auth baru diunduh di sini — saat tombol login Google benar-benar ditekan.
      const { auth: _auth, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } = await getAuthBits();
      try { await setPersistence(_auth, browserSessionPersistence); } catch {}
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(_auth, provider);
      const gUser = result.user;
      const gEmail = (gUser.email || "").trim().toLowerCase();
      if (!gEmail) {
        await fbSignOutSafe();
        setLoginErr("Akun Google ini tidak punya email yang bisa diverifikasi.");
        return;
      }
      // 1. Cocokkan ke daftar staf resmi (HARDCODED_USERS)
      let matched = HARDCODED_USERS.find(u => (u.email || "").toLowerCase() === gEmail);
      // 2. Kalau tidak ketemu, cek juga data.users (mis. email di-update lewat panel "Kelola Pengguna")
      if (!matched) {
        const rec = (data.users || []).find(u => (u.email || "").toLowerCase() === gEmail);
        if (rec) matched = HARDCODED_USERS.find(u => u.username.toLowerCase() === rec.username.toLowerCase());
      }
      if (!matched) {
        await fbSignOutSafe();
        setLoginErr(`Akun Google (${gUser.email}) belum terdaftar sebagai staf. Hubungi administrator.`);
        return;
      }
      // Cek status aktif/nonaktif (sama seperti login username/password)
      const userRecord = (data.users || []).find(x => x.username.toLowerCase() === matched.username.toLowerCase());
      if (userRecord && userRecord.active === false) {
        await fbSignOutSafe();
        setLoginErr("Akun ini telah dinonaktifkan. Hubungi administrator.");
        return;
      }
      // Profil (nama/foto/dll) — ambil override dari Firestore kalau ada, fallback ke foto profil Google
      let profile = { name: matched.name, phone: matched.phone, email: matched.email, desc: matched.desc, photo: matched.photo };
      try {
        const r = await fsGet(`profile-${matched.username}`);
        if (r) profile = { name: r.name ?? profile.name, phone: r.phone ?? profile.phone, email: r.email ?? profile.email, desc: r.desc ?? profile.desc, photo: r.photo ?? profile.photo };
      } catch {}
      const sessionUser = { ...matched, ...profile, photo: profile.photo || gUser.photoURL || "", loginMethod: "google" };
      delete sessionUser.password; // sama seperti login biasa — jangan simpan password ke sesi
      setUser(sessionUser);
      sessionSave(sessionUser);
      setShowLogin(false);
      setLoginErr("");
      notify(`Selamat datang, ${sessionUser.name || gUser.displayName || "Admin"}!`);
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // User membatalkan sendiri (menutup popup) — tidak perlu tampilkan sebagai error.
      } else if (err?.code === "auth/unauthorized-domain") {
        setLoginErr("Domain situs ini belum diizinkan untuk Google Login. Tambahkan domainnya di Firebase Console → Authentication → Settings → Authorized domains.");
      } else {
        setLoginErr("Login Google gagal: " + (err?.message || "Terjadi kesalahan, coba lagi."));
      }
    }
    setGoogleLoginLoading(false);
  };

  const logout = () => {
    setUser(null);
    sessionClear();
    fbSignOutSafe(); // jaga-jaga kalau sesi ini berasal dari Google Login (no-op bila Auth belum pernah dimuat)
    closeAdmin();
    notify("Logged out.");
  };

  const content  = data.content || {}; // shorthand alias (guard untuk undefined)
  const isAdmin = user?.role === "admin";
  const canEdit = user?.role === "admin" || user?.role === "content_writer";
  const canCS   = user?.role === "admin" || user?.role === "customer_services";

  const navigateTo = (p) => {
    /* Cari path dari PAGE_TO_PATH, fallback ke "/" + p untuk sub-routes */
    const navPath = PAGE_TO_PATH[p] || ("/" + p);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ page: p, depth: newDepth }, "", navPath);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setPage(p); setReadPost(null); setActivePaket(null); setTemaSlug(null); setMobileMenu(false);
    window.scrollTo(0, 0);
  };

  /** Buka artikel: push URL /artikel/{section}/{slug}-{id} + set state */
  const openArticle = (post) => {
    const url = articleUrl(post);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ artikelId: post.id, section: post.section, depth: newDepth }, "", url);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setReadPost(post);
    setMobileMenu(false);
    window.scrollTo(0, 0);
  };

  /** Tutup artikel: native back — biar onPopState yang atur state */
  const closeArticle = () => {
    window.history.back();
  };

  /** Buka admin panel: set state + sync URL ke /control-panel/dashboard */
  const openAdmin = () => {
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ admin: true, adminTab: "dashboard", depth: newDepth }, "", adminTabToPath("dashboard"));
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setShowAdmin(true);
    setAdminTab("dashboard");
  };

  /** Tutup admin panel: native back */
  const closeAdmin = () => {
    window.history.pushState({}, "", "/");
    setShowAdmin(false);
    window.scrollTo(0, 0);
  };

  /** Navigasi antar tab admin — push ke browser history agar tombol ← browser bisa step-back.
      Setiap tab punya slug URL sendiri, contoh: /control-panel/plafon, /control-panel/kamar-tidur */
  const navigateAdminTab = (tab, extra = {}) => {
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ admin: true, adminTab: tab, depth: newDepth, ...extra }, "", adminTabToPath(tab));
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setAdminTab(tab);
    setCmsEditPost(null);
    setSidebarOpen(false);
  };

  /** openPaket / closePaket — URL sync untuk halaman detail paket */
  // State ini dioper ke ServicesPage sebagai prop
  const [activePaket, setActivePaket] = useState(() => {
    // Restore dari URL /paket/{category}/{id} saat mount
    const parsed = parsePaketPath(window.location.pathname);
    return parsed ? parsed : null; // { category, id } -- ServicesPage cari svc-nya
  });

  /* ── Mode performa (lite) + tracking marketing ── */
  /* Foto berjalan di beranda memakai gambar dari CMS; bila sebuah kategori belum diisi, dipakai
     katalog bawaan (±52 KB). Katalog itu TIDAK ikut bundle awal — baru diunduh di latar belakang
     kalau memang masih ada kategori yang kosong, dan bagian ini berada di bawah lipatan layar. */
  const [catalogFallback, setCatalogFallback] = useState(null);
  useEffect(() => {
    if (page !== "home" || catalogFallback) return;
    const adaKategoriKosong = Object.values(INT_PAGE_CRUD_KEY)
      .some((k) => !(Array.isArray(data?.[k]) && data[k].length > 0));
    if (!adaKategoriKosong) return;   // semua kategori sudah diisi admin → katalog bawaan tak diperlukan
    let hidup = true;
    import("./data/catalog.js")
      .then((m) => { if (hidup) setCatalogFallback(m.CATALOG_DATA); })
      .catch(() => {});
    return () => { hidup = false; };
  }, [page, data, catalogFallback]);

  useEffect(() => initPerformanceMode(), []);
  /* Setelah halaman pertama selesai dimuat, ambil chunk halaman lain saat browser menganggur —
     supaya klik menu terasa instan. Dilewati di koneksi lambat/Data Saver agar tidak boros kuota. */
  useEffect(() => prefetchWhenIdle(
    /* Hanya tiga tujuan menu yang paling sering dibuka — prefetch berlebihan justru memakan kuota
       pengunjung yang cuma melihat beranda. Halaman lain tetap dimuat cepat saat diklik. */
    [ServicesPage, TemaRumahPage, AboutPage].map((C) => C.preload),
    shouldUseLiteMode()
  ), []);
  useEffect(() => { initTracking(data.content?.marketing); }, [data.content?.marketing]);
  useEffect(() => initAutoTracking(), []);
  useEffect(() => {
    if (showAdmin || reviewTokenParam) return;
    trackPageView(window.location.pathname);
    notifyRouteChange();
    const name = readPost?.title || (activePaket?.id != null && `paket-${activePaket.id}`) || temaSlug || catalogItemSlug;
    if (name) trackEvent("view_content", { content_name: String(name).slice(0, 80), content_category: page }, { server: false });
  }, [page, readPost, temaSlug, activePaket, catalogItemSlug, showAdmin, reviewTokenParam]);


  const openPaket = (svc) => {
    const url = paketUrl(svc);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ paketId: svc.id, category: svc.category, depth: newDepth }, "", url);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setActivePaket({ id: svc.id, category: svc.category });
    window.scrollTo(0, 0);
  };

  const closePaket = () => {
    window.history.back();
  };

  /** Buka detail tema rumah: push URL /tema-rumah/{slug} + set state — agar bisa di-share sebagai link sendiri */
  const openTemaDetail = (slug) => {
    const url = temaDetailUrl(slug);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ temaSlug: slug, depth: newDepth }, "", url);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setTemaSlug(slug);
    window.scrollTo(0, 0);
  };

  /** Tutup detail tema rumah: native back — biar onPopState yang atur state */
  const closeTemaDetail = () => {
    window.history.back();
  };

  /** Buka detail produk katalog (Plafon, Pagar, Kanopi, dll): push URL /{pageKey}/{item-slug} + set state
   *  — agar bisa di-share sebagai link sendiri, seperti tema rumah */
  const openCatalogItem = (pageKeyForUrl, itemSlug) => {
    const url = catalogItemUrl(pageKeyForUrl, itemSlug);
    const newDepth = spaDepth.current + 1;
    window.history.pushState({ catalogPageKey: pageKeyForUrl, catalogItemSlug: itemSlug, depth: newDepth }, "", url);
    spaDepth.current = newDepth;
    spaMaxDepth.current = newDepth;
    setCanBack(true);
    setCanFwd(false);
    setCatalogItemSlug(itemSlug);
    window.scrollTo(0, 0);
  };

  /** Tutup detail produk katalog: native back — biar onPopState yang atur state */
  const closeCatalogItem = () => {
    window.history.back();
  };

  const adminTabRef = useRef("dashboard"); // selalu sync dengan adminTab untuk akses di popstate

  const spaBack = () => {
    window.history.back(); // onPopState yang handle state React + _syncDepth
  };

  const spaForward = () => {
    window.history.forward(); // onPopState yang handle state React + _syncDepth
  };

  // Post operations
  // silent=true → auto-save, tetap di editor, tanpa notif
  const savePost = (post, silent = false) => {
    // Validasi section -- jika tidak valid, fallback ke "news"
    const validSections = ["news", "shop", "destinations"];
    const section = validSections.includes(post.section) ? post.section : "news";
    const postWithSection = { ...post, section };
    const existing = (data.posts[section] || []);
    const idx = existing.findIndex(p => p.id === postWithSection.id);
    // Jika post lama ada di seksi yang berbeda, hapus dari seksi lama dulu
    let newPosts = { ...data.posts };
    if (idx < 0) {
      validSections.forEach(sec => {
        if (sec !== section) {
          newPosts[sec] = (newPosts[sec] || []).filter(p => p.id !== postWithSection.id);
        }
      });
    }
    const updated = idx >= 0
      ? existing.map((p, i) => i === idx ? postWithSection : p)
      : [...existing, postWithSection];
    newPosts = { ...newPosts, [section]: updated };
    save({ ...data, posts: newPosts });
    if (!silent) {
      setCmsEditPost(null);
      notify(postWithSection.status === "published" ? "Post published!" : "Saved as draft.");
    }
  };

  const deletePost = (section, id) => {
    const newPosts = { ...data.posts, [section]: (data.posts[section] || []).filter(p => p.id !== id) };
    save({ ...data, posts: newPosts });
    notify("Post deleted.");
  };

  const allPosts       = Object.values(data.posts || {}).flat();
  const publishedCount = allPosts.filter(p => p.status === "published").length;
  const draftCount     = allPosts.filter(p => p.status === "draft").length;

  /* Tambah pesan/lead ke inbox TANPA menimpa data terbaru di Firestore.
     Pengunjung publik memegang salinan data yang bisa sudah basi; menyimpan seluruh dokumen dari sana
     bisa menghapus perubahan admin. Jadi: baca versi terbaru → tambahkan pesan → tulis kembali. */
  const appendMessageSafely = async (msg) => {
    try {
      const fs = await fsGetWithRetry("main", { retries: 1, baseDelayMs: 800 });
      const base = fs?.payload ? mergeWithDefaults(rebrandDeep(JSON.parse(fs.payload)), DEFAULT_DATA) : dataRef.current;
      const next = { ...base, messages: [...(base.messages || []), msg] };
      const payload = JSON.stringify(next);
      if (payload.length > 950000) console.warn("[Firestore] Dokumen utama mendekati batas 1 MiB — kurangi gambar base64/konten.");
      await fsSet("main", { payload, updatedAt: Date.now() });
      setData(next); dataRef.current = next;
      try { localStorage.setItem("hikimori-const-cache-v1", payload); } catch {}
    } catch (err) {
      console.warn("[Lead] Gagal menyimpan ke inbox cloud:", err?.message || err);
    }
  };

  /* Dipanggil oleh LeadForm (beranda & /promo): simpan ke inbox CMS lalu buka pilihan WhatsApp */
  const handleLead = (lead) => {
    const detail = [lead.service, lead.budget, lead.location].filter(Boolean).join(" · ");
    appendMessageSafely({
      id: Date.now(), name: lead.name, email: lead.email || "", phone: lead.phone || "",
      message: `${detail ? `[${detail}] ` : ""}${lead.message || ""}`.trim() || "(tanpa pesan)",
      date: new Date().toLocaleDateString("id-ID"), read: false, replies: [],
      source: lead.source || "", utm: lead.attribution?.last?.utm_source || lead.attribution?.first?.utm_source || "",
    });
    const text = [
      "Halo HIKIMORI CONST!", "",
      `Nama: ${lead.name}`, `WhatsApp: ${lead.phone}`, lead.email ? `Email: ${lead.email}` : null,
      `Kebutuhan: ${lead.service || "-"}`, lead.budget ? `Budget: ${lead.budget}` : null, lead.location ? `Lokasi: ${lead.location}` : null,
      lead.message ? `\nPesan:\n${lead.message}` : null, "", "Mohon info lebih lanjut. Terima kasih!",
    ].filter((x) => x !== null).join("\n");
    openWaPicker(text);
  };

  // Contacts
  const submitMsg = () => {
    if (!contact.name || !contact.email || !contact.message) return notify("Fill all fields.", "error");
    const msg = { ...contact, id: Date.now(), date: new Date().toLocaleDateString("id-ID"), read: false, replies: [] };
    appendMessageSafely(msg);
    trackEvent("lead", { content_name: "contact_form" }, { user: { email: contact.email, name: contact.name }, server: false });
    // Redirect to WhatsApp
    const text = `Halo HIKIMORI CONST!\n\nNama: ${contact.name}\nEmail: ${contact.email}\n\nPesan:\n${contact.message}\n\nSalam,\n${contact.name}`;
    openWaPicker(text);
    setContact({ name: "", email: "", message: "" });
    notify("Mengarahkan ke WhatsApp...");
  };

  const replyMsg = (id) => {
    if (!replyText.trim()) return;
    const msgs = data.messages.map(m => m.id === id
      ? { ...m, replies: [...(m.replies || []), { text: replyText, date: new Date().toLocaleDateString("id-ID"), author: user.username }], read: true }
      : m);
    save({ ...data, messages: msgs });
    setReplyTo(null); setReplyText("");
    notify("Reply sent!");
  };

  const updateImg = () => {
    if (!editImg.url.trim()) return notify("Please enter image URL.", "error");
    const imgs = { ...data.images };
    const arr = [...imgs[editImg.group]];
    arr[editImg.idx] = editImg.url.trim();
    imgs[editImg.group] = arr;
    save({ ...data, images: imgs });
    setEditImg({ group: null, idx: null, url: "" });
    notify("Image updated!");
  };

  const saveContent = (key) => {
    if (editContent[key] !== undefined) {
      save({ ...data, content: { ...data.content, [key]: editContent[key] } });
      setEditContent(p => { const n = { ...p }; delete n[key]; return n; });
      notify("Content saved!");
    }
  };

  const getCEFVal = (cKey) => editContent[cKey] !== undefined ? editContent[cKey] : data.content[cKey];

  const navItems = [
    { key: "home",  label: data.content.nav1 || "Home" },
    { key: "about", label: data.content.nav2 || "About" },
  ];
  // Dropdown: Layanan Developer (termasuk Interior & Eksterior)
  const navDropdownLayanan = [
    { key: "services",  label: data.content.nav6  || "Layanan Kami" },
    { key: "desainrab", label: data.content.nav7  || "Jasa Desain & RAB" },
    { key: "temarumah", label: data.content.nav8  || "Tema Rumah" },
    { key: "_divider",  label: null },
    { key: "interior",  label: data.content.nav9  || "Interior" },
    { key: "pagar",     label: data.content.nav10 || "Pagar Rumah" },
    { key: "kanopi",    label: data.content.nav11 || "Kanopi" },
    { key: "aluminium", label: data.content.nav12 || "Aluminium" },
    { key: "furnitur",  label: "Furnitur" },
    { key: "custom-furnitur", label: "Custom Furnitur" },
  ];
  // Interior & Eksterior sudah digabung ke navDropdownLayanan
  const navDropdownInterior = [];
  // Dropdown: Program Renovasi -- Rumah Subsidi & Landscape & Taman
  const navDropdownGaleri = [
    { key: "shop",      label: "Paket Rumah Subsidi" },
    { key: "kost",      label: "Pembangunan Kost" },
    { key: "cafe",      label: "Pembangunan Cafe" },
    { key: "ruko",      label: "Pembangunan Ruko" },
    { key: "landscape", label: data.content.nav13 || "Landscape & Taman" },
  ];
  // All keys that are "active" as pages for highlight purposes
  const allNavKeys = [
    ...navItems.map(i=>i.key),
    ...navDropdownLayanan.map(i=>i.key),
    ...navDropdownInterior.map(i=>i.key),
    ...navDropdownGaleri.map(i=>i.key),
  ];
  // Legacy flat list for mobile menu
  const allNavItemsFlat = [
    ...navItems,
    ...navDropdownLayanan,
    ...navDropdownInterior,
    ...navDropdownGaleri,
  ];

  /* ─── RENDER ─── */
  return (
    <div className="page-wrap" style={{ position: "relative", minHeight: "100vh" }}>

      {/* -- PERINGATAN: Firestore gagal diakses (bukan sekadar kosong) -- tampil ke semua orang
           supaya jelas ini masalah koneksi/konfigurasi, BUKAN data yang hilang/ter-reset. -- */}
      {fsLoadError && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, background: "#fef3c7", color: "#78350f", padding: "10px 16px", fontSize: 13, fontWeight: 600, textAlign: "center", borderBottom: "1px solid #f59e0b" }}>
          ⚠️ Gagal terhubung ke server data (Firestore). Konten yang tampil saat ini mungkin bukan versi terbaru.
          Data Anda tidak hilang — coba muat ulang halaman, atau hubungi developer jika masalah berlanjut.
        </div>
      )}

      {/* -- LOADING SKELETON -- */}
      {isLoading && !reviewTokenParam && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9990, background: "#FDFAF4", display: "flex", flexDirection: "column" }}>
          <style>{`
            @keyframes shimmer { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
            .sk { background: linear-gradient(90deg,#F5EDD8 25%,#FAF7F0 50%,#F5EDD8 75%); background-size:800px 100%; animation: shimmer 1.5s infinite; border-radius:6px; }
          `}</style>
          {/* Navbar skeleton */}
          <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #E8DCC8", display: "flex", alignItems: "center", padding: "0 5%", gap: 24 }}>
            <div className="sk" style={{ width: 120, height: 32 }} />
            <div style={{ flex: 1 }} />
            {[80,70,90,70,80].map((w,i) => <div key={i} className="sk" style={{ width: w, height: 14 }} />)}
          </div>
          {/* Hero skeleton */}
          <div className="sk" style={{ height: 480, margin: "0", borderRadius: 0 }} />
          {/* Cards skeleton */}
          <div style={{ padding: "40px 5%", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="sk" style={{ height: 180, borderRadius: 0 }} />
                <div style={{ padding: 16, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="sk" style={{ height: 16, width: "80%" }} />
                  <div className="sk" style={{ height: 12, width: "60%" }} />
                  <div className="sk" style={{ height: 12, width: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP CURSOR GLOW + SCROLL ANIMATIONS */}
      {typeof window !== "undefined" && (() => {
        // Only on desktop width (>900px)
        const isDesktop = window.innerWidth > 900;
        if (!isDesktop) return null;
        return null; // rendered via useEffect below
      })()}

      {/* NOTIFICATION */}
      {notif && (
        <div className="toast-notif" style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: notif.type === "error" ? "#e74c3c" : notif.type === "warning" ? "#f39c12" : "#27ae60",
          color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,.22)", maxWidth: 340, minWidth: 240,
          animation: "toastSlideIn .3s cubic-bezier(.21,1.02,.73,1) forwards",
          overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              {notif.type === "error" ? "" : notif.type === "warning" ? "" : ""}
            </span>
            <span>{notif.msg}</span>
          </div>
          {/* Progress bar countdown */}
          <div style={{ height: 3, background: "rgba(255,255,255,.25)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.7)",
              animation: "toastCountdown 3.2s linear forwards", transformOrigin: "left" }} />
          </div>
        </div>
      )}

      {/* ── SAVE PROGRESS OVERLAY ── */}
      {saveProgress && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 10001,
          width: 300, background: "#fff", borderRadius: 14,
          boxShadow: "0 12px 48px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden",
          animation: "saveBarIn .35s cubic-bezier(.21,1.02,.73,1) forwards",
          border: saveProgress.status === "success" ? "1.5px solid #27ae60"
                : saveProgress.status === "warning"  ? "1.5px solid #f39c12"
                : saveProgress.status === "error"    ? "1.5px solid #e74c3c"
                : "1.5px solid #E8DCC8",
        }}>
          {/* Header */}
          <div style={{
            padding: "13px 16px 10px",
            display: "flex", alignItems: "center", gap: 10,
            background: saveProgress.status === "success" ? "#f0fff6"
                      : saveProgress.status === "warning"  ? "#fffbf0"
                      : saveProgress.status === "error"    ? "#fff5f5"
                      : "#FDFAF4",
          }}>
            {/* Icon */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              background: saveProgress.status === "success" ? "#27ae60"
                        : saveProgress.status === "warning"  ? "#f39c12"
                        : saveProgress.status === "error"    ? "#e74c3c"
                        : "#2E3D3F",
              animation: saveProgress.status === "success" ? "saveCheckPop .45s cubic-bezier(.34,1.56,.64,1) forwards"
                       : saveProgress.status === "error"   ? "saveErrShake .4s ease forwards"
                       : "none",
            }}>
              {saveProgress.status === "success" ? "✓"
               : saveProgress.status === "warning" ? ""
               : saveProgress.status === "error"   ? "✕"
               : <span style={{ display:"inline-block", animation:"spin .7s linear infinite", fontSize:15 }}>⟳</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: saveProgress.status === "success" ? "#27ae60"
                     : saveProgress.status === "warning"  ? "#b7770d"
                     : saveProgress.status === "error"    ? "#e74c3c"
                     : "#2E3D3F",
              }}>
                {saveProgress.status === "success" ? "Berhasil Disimpan"
                 : saveProgress.status === "warning" ? "Tersimpan (Lokal)"
                 : saveProgress.status === "error"   ? "Gagal Menyimpan"
                 : "Menyimpan..."}
              </div>
              <div style={{ fontSize: 11, color: "#5A6A6C", marginTop: 1 }}>
                {saveProgress.label}
              </div>
            </div>
            {/* Persentase */}
            <div style={{
              fontSize: 15, fontWeight: 900, minWidth: 40, textAlign: "right",
              color: saveProgress.status === "success" ? "#27ae60"
                   : saveProgress.status === "warning"  ? "#f39c12"
                   : saveProgress.status === "error"    ? "#e74c3c"
                   : "#8B6914",
              fontFamily: "'Playfair Display', serif",
            }}>
              {saveProgress.pct}%
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: "#F5EDD8", position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${saveProgress.pct}%`,
              background: saveProgress.status === "success"
                ? "linear-gradient(90deg,#27ae60,#2ecc71)"
                : saveProgress.status === "warning"
                ? "linear-gradient(90deg,#f39c12,#f1c40f)"
                : saveProgress.status === "error"
                ? "linear-gradient(90deg,#e74c3c,#c0392b)"
                : "linear-gradient(90deg,#2E3D3F,#8B6914,#C9AA71)",
              transition: "width .45s cubic-bezier(.4,0,.2,1)",
              borderRadius: "0 3px 3px 0",
            }} />
            {/* Shimmer saat loading */}
            {saveProgress.status === "saving" && (
              <div style={{
                position: "absolute", top: 0, bottom: 0, left: 0,
                width: `${saveProgress.pct}%`,
                background: "linear-gradient(90deg,transparent 30%,rgba(255,255,255,.45) 60%,transparent 90%)",
                backgroundSize: "200% 100%",
                animation: "galScroll 1.2s linear infinite",
                borderRadius: "0 3px 3px 0",
              }} />
            )}
          </div>

          {/* Steps indicator */}
          <div style={{ padding: "8px 16px 11px", display: "flex", gap: 6, alignItems: "center" }}>
            {[
              { pct: 30,  label: "Lokal",  icon: "" },
              { pct: 60,  label: "Cloud",  icon: "" },
              { pct: 100, label: "Selesai",icon: "" },
            ].map((step, i) => {
              const done = saveProgress.pct >= step.pct;
              const active = saveProgress.pct >= (i === 0 ? 5 : i === 1 ? 30 : 60) && !done;
              return (
                <React.Fragment key={step.label}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, flex:1 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize: 11,
                      background: done
                        ? (saveProgress.status === "error" && i === 2 ? "#e74c3c" : saveProgress.status === "warning" && i === 2 ? "#f39c12" : "#27ae60")
                        : active ? "#F5EDD8" : "#F0EBE0",
                      border: done ? "none" : active ? "1.5px solid #C9AA71" : "1.5px solid #E8DCC8",
                      transition: "all .3s",
                      fontWeight: 700, color: done ? "#fff" : "#5A6A6C",
                    }}>
                      {done ? (i === 2 && saveProgress.status === "error" ? "✕" : i === 2 && saveProgress.status === "warning" ? "!" : "✓") : (active ? <span style={{ animation:"spin .7s linear infinite", display:"inline-block", fontSize:10 }}>⟳</span> : i+1)}
                    </div>
                    <span style={{ fontSize: 9, color: done ? "#27ae60" : "#A89070", fontWeight: done ? 700 : 500 }}>{step.label}</span>
                  </div>
                  {i < 2 && <div style={{ flex:2, height:1.5, background: saveProgress.pct > (i===0?30:60) ? "#27ae60" : "#E8DCC8", transition:"background .4s", marginBottom:12 }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* -- Coming Soon Popup -- */}
      {comingSoonPopup && (
        <div onClick={() => setComingSoonPopup(false)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, padding: "44px 40px", maxWidth: 360, width: "90%",
              boxShadow: "0 24px 80px rgba(0,0,0,.25)", textAlign: "center", position: "relative",
              animation: "popIn .35s cubic-bezier(.34,1.56,.64,1) forwards" }}>
            <button onClick={() => setComingSoonPopup(false)}
              style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none",
                fontSize: 20, color: "#A89070", cursor: "pointer" }}>✕</button>
            {/* Rocket icon */}
            <div style={{ width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg,#2E3D3F,#C9AA71)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 32, boxShadow: "0 8px 24px rgba(201,170,113,.35)",
              animation: "floatBob 2.4s ease-in-out infinite" }}></div>
            <div style={{ fontSize: 10, letterSpacing: "3px", color: "#C9AA71", textTransform: "uppercase",
              fontWeight: 800, marginBottom: 10 }}>Segera Hadir</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#2E3D3F", marginBottom: 10, lineHeight: 1.25 }}>
              Coming Soon
            </h2>
            <p style={{ fontSize: 14, color: "#5A6A6C", lineHeight: 1.7, marginBottom: 24 }}>
              Login dengan Apple ID sedang dalam tahap pengembangan.<br/>
              Gunakan <strong>username & password</strong> atau <strong>Google</strong> untuk saat ini.
            </p>
            {/* Progress dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 24 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%",
                  background: i === 0 ? "#C9AA71" : "#E8DCC8",
                  animation: `dotPulse 1.4s ${i * .22}s ease-in-out infinite` }} />
              ))}
            </div>
            <button onClick={() => setComingSoonPopup(false)}
              style={{ background: "linear-gradient(130deg,#2E3D3F,#C9AA71)", color: "#fff", border: "none",
                borderRadius: 10, padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(139,105,20,.3)", transition: "transform .15s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* DEV PROFILE POPUP */}
      {showDevProfile && (
        <div onClick={() => setShowDevProfile(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,20,30,.45)",
            backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, padding: "36px 40px", maxWidth: 360, width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)", textAlign: "center", position: "relative" }}>
            {/* Close */}
            <button onClick={() => setShowDevProfile(false)}
              style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none",
                fontSize: 18, color: "#A89070", cursor: "pointer", lineHeight: 1 }}>✕</button>
            {/* Power Icon */}
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FAF7F0",
              border: "2px solid #E8DCC8", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C9AA71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </div>
            <div style={{ fontSize: 10, letterSpacing: "2px", color: "#5A6A6C", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Developer Profile</div>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 400, color: "#2E3D3F", marginBottom: 6, lineHeight: 1.2 }}>
              Mahfud Febry Styanto
            </h2>
            <div style={{ width: 32, height: 2, background: "#C9AA71", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="https://wa.me/6282234651413" target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                  background: "#FAF7F0", borderRadius: 8, textDecoration: "none",
                  transition: "background .2s", border: "1px solid #F5EDD8" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5EDD8"}
                onMouseLeave={e => e.currentTarget.style.background = "#FAF7F0"}>
                <span style={{ fontSize: 18 }}></span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>WhatsApp</div>
                  <div style={{ fontSize: 14, color: "#2E3D3F", fontWeight: 500 }}>082234651413</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#C9AA71", fontWeight: 500 }}>Hubungi →</span>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                background: "#FAF7F0", borderRadius: 8, border: "1px solid #F5EDD8" }}>
                <span style={{ fontSize: 18 }}></span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>Email</div>
                  <div style={{ fontSize: 13, color: "#2E3D3F" }}>mahfudfebrys@gmail.com</div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#A89070", marginTop: 20, fontStyle: "italic" }}>
              Website developed & designed by Mahfud Febry Styanto
            </p>
          </div>
        </div>
      )}

      {/* ====== REVIEW FORM (token-based, public) ====== */}
      {reviewTokenParam && (
        <ReviewForm token={reviewTokenParam} data={data} save={save} notify={notify} isLoading={isLoading} />
      )}

      {/* ====== LOGIN MODAL ====== */}
      {showLogin && (
        <div onClick={() => setShowLogin(false)} 
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,20,30,.50)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="login-modal" 
            style={{ background: "#fff", borderRadius: 12, padding: "48px 44px", width: "90%", maxWidth: 400, 
              position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <button onClick={() => setShowLogin(false)} 
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none",
                fontSize: 24, color: "#2E3D3F", cursor: "pointer", lineHeight: 1 }}>✕</button>
            
            {!forgotStep ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <img loading="lazy" decoding="async" src={cld(data.content.logoImage || HIKIMORI_LOGO_URL)} alt="Logo Perusahaan"
                    style={{ width: 54, height: 54, objectFit: "contain", margin: "0 auto 10px", display: "block" }}
                    onError={onImgError} />
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "1.5px", color: "#2E3D3F", textTransform: "uppercase", fontFamily: "'Playfair Display', serif" }}>
                    {(data.content.logoText || "HIKIMORI CONST").replace("\n", " ")}
                  </div>
                  <div style={{ fontSize: 11, color: "#A89070", marginTop: 3, fontWeight: 600, letterSpacing: ".3px" }}>
                    Solusi Desain &amp; Konstruksi Terpercaya
                  </div>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2E3D3F", marginBottom: 4, textAlign: "center" }}>Login</h2>
                <p style={{ fontSize: 13, color: "#5A6A6C", textAlign: "center", marginBottom: 28 }}>Akses control panel Anda</p>
                
                {loginErr && <div style={{ background: "#fceaea", borderLeft: "3px solid #e74c3c", padding: "12px 14px", borderRadius: 6, fontSize: 12, color: "#c0392b", marginBottom: 16 }}>{loginErr}</div>}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#2E3D3F", marginBottom: 6, letterSpacing: ".5px" }}>USERNAME</label>
                    <input type="text" value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                      placeholder="administrator / writer1 / cs1"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, 
                        fontSize: 13, outline: "none", background: "#FDFAF4", color: "#2E3D3F",
                        transition: "border .2s" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#2E3D3F", marginBottom: 6, letterSpacing: ".5px" }}>PASSWORD</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input type={showPassword ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        onKeyDown={e => e.key === "Enter" && login()}
                        style={{ width: "100%", padding: "11px 14px", paddingRight: 42, border: "1.5px solid #E8DCC8", borderRadius: 8, 
                          fontSize: 13, outline: "none", background: "#FDFAF4", color: "#2E3D3F",
                          transition: "border .2s" }}
                        onFocus={e => e.target.style.borderColor = "#8B6914"}
                        onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                      <button onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        style={{ position: "absolute", right: 8, background: "none", border: "none", 
                          cursor: "pointer", padding: "6px 8px", borderRadius: "50%", 
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 36, height: 36, transition: "all .2s",
                          color: "#8B6914", fontSize: 18 }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,105,20,.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                        {showPassword ? (
                          // Eye open icon
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          // Eye closed icon with slash
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={login} disabled={loginLoading}
                  style={{ width: "100%", marginTop: 20, padding: "0", background: loginLoading
                    ? "linear-gradient(130deg,#3D5254 0%,#2E3D3F 100%)"
                    : "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)",
                    color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
                    cursor: loginLoading ? "default" : "pointer", transition: "all .2s",
                    position: "relative", overflow: "hidden", height: 46 }}
                  onMouseEnter={e => !loginLoading && (e.currentTarget.style.boxShadow = "0 8px 20px rgba(139,105,20,.35)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                  {/* Progress bar */}
                  {loginLoading && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: "#C9AA71",
                      width: `${loginProgress}%`, transition: "width .18s ease", borderRadius: "0 2px 2px 0" }} />
                  )}
                  {loginLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span style={{ display: "inline-block", width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Memverifikasi… {Math.round(loginProgress)}%
                    </span>
                  ) : "Masuk"}
                </button>

                {/* -- Divider -- */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 14px" }}>
                  <div style={{ flex: 1, height: 1, background: "#E8DCC8" }} />
                  <span style={{ fontSize: 11, color: "#A89070", fontWeight: 600, whiteSpace: "nowrap" }}>atau masuk dengan</span>
                  <div style={{ flex: 1, height: 1, background: "#E8DCC8" }} />
                </div>

                {/* -- Google & Apple -- */}
                <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                  <button onClick={googleLogin} disabled={googleLoginLoading}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                      padding: "10px 0", background: "#fff", border: "1.5px solid #E8DCC8", borderRadius: 8,
                      fontSize: 13, fontWeight: 600, color: "#2E3D3F", cursor: googleLoginLoading ? "default" : "pointer", transition: "all .18s",
                      opacity: googleLoginLoading ? 0.65 : 1 }}
                    onMouseEnter={e => { if (!googleLoginLoading) { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#bbb"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.08)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E8DCC8"; e.currentTarget.style.boxShadow = "none"; }}>
                    {googleLoginLoading ? (
                      <span style={{ width: 16, height: 16, border: "2px solid #E8DCC8", borderTopColor: "#8B6914", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.2 0 5.6 1.1 7.3 2.8l5.4-5.4C33.5 3.5 29.1 1.5 24 1.5 14.8 1.5 7 7.4 3.8 15.6l6.3 4.9C11.7 14 17.4 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.1 24.6c0-1.7-.1-3-.4-4.4H24v8.3h12.5c-.6 3-2.3 5.5-4.8 7.2l7.3 5.7c4.3-4 6.1-9.8 6.1-16.8z"/>
                        <path fill="#FBBC05" d="M10.2 28.5A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.1.7-4.5l-6.3-4.9A22.6 22.6 0 0 0 1.5 24c0 3.7.9 7.2 2.4 10.3l6.3-4.9z"/>
                        <path fill="#4285F4" d="M24 46.5c5.1 0 9.4-1.7 12.6-4.6l-7.3-5.7c-1.7 1.1-3.9 1.8-5.3 1.8-6.6 0-12.2-4.5-14-10.5l-6.3 4.9C7 40.6 14.8 46.5 24 46.5z"/>
                      </svg>
                    )}
                    {googleLoginLoading ? "Memproses..." : "Google"}
                  </button>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <button onClick={() => setComingSoonPopup(true)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                      padding: "10px 0", background: "#000", border: "1.5px solid #000", borderRadius: 8,
                      fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", transition: "all .18s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#222"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.boxShadow = "none"; }}>
                    <svg width="16" height="18" viewBox="0 0 384 512" fill="#fff">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-47.4-42.1-84.8-45-35.4-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.5-76.4-19.5C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    Apple ID
                  </button>
                </div>

                <button onClick={() => { setForgotStep("input_user"); setLoginErr(""); }}
                  style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "transparent", 
                    color: "#8B6914", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    textDecoration: "underline", letterSpacing: ".3px" }}>
                  Lupa Password?
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2E3D3F", marginBottom: 4, textAlign: "center" }}>Reset Password</h2>
                <p style={{ fontSize: 12, color: "#5A6A6C", textAlign: "center", marginBottom: 20 }}>Pulihkan akses Anda</p>
                
                {forgotErr && <div style={{ background: "#fceaea", borderLeft: "3px solid #e74c3c", padding: "10px 12px", borderRadius: 6, fontSize: 11, color: "#c0392b", marginBottom: 14 }}>{forgotErr}</div>}

                {forgotStep === "input_user" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>CARI BERDASARKAN</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      {[{k:"username",l:"Username"}, {k:"email",l:"Email"}, {k:"phone",l:"No. HP"}].map(o => (
                        <button key={o.k} onClick={() => setForgotSearchBy(o.k)}
                          style={{ flex: 1, padding: "7px", fontSize: 11, fontWeight: 600, border: "1px solid",
                            borderRadius: 6, background: forgotSearchBy === o.k ? "#2E3D3F" : "#FDFAF4",
                            color: forgotSearchBy === o.k ? "#fff" : "#5A6A6C",
                            borderColor: forgotSearchBy === o.k ? "#2E3D3F" : "#E8DCC8",
                            cursor: "pointer" }}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)}
                      placeholder={forgotSearchBy === "username" ? "username" : forgotSearchBy === "email" ? "email@domain.com" : "0812..."}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep1}
                      style={{ width: "100%", marginTop: 16, padding: "10px", background: "#2E3D3F", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Lanjut
                    </button>
                  </>
                )}

                {forgotStep === "input_email" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>EMAIL TERDAFTAR</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="email@domain.com"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 14 }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep2} disabled={forgotOTP.sending}
                      style={{ width: "100%", padding: "10px", background: forgotOTP.sending ? "#ccc" : "#27ae60", 
                        color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {forgotOTP.sending ? "Mengirim..." : "Kirim OTP"}
                    </button>
                  </>
                )}

                {forgotStep === "input_otp" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>MASUKKAN KODE OTP</label>
                    <input type="text" value={forgotOTP.input} onChange={e => setForgotOTP(p => ({ ...p, input: e.target.value }))}
                      placeholder="000000"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 14, letterSpacing: "3px" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep3}
                      style={{ width: "100%", padding: "10px", background: "#2E3D3F", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Verifikasi OTP
                    </button>
                  </>
                )}

                {forgotStep === "input_newpass" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>PASSWORD BARU</label>
                    <input type="password" value={forgotNewPass.val} onChange={e => setForgotNewPass(p => ({ ...p, val: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 10 }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", marginBottom: 8 }}>KONFIRMASI PASSWORD</label>
                    <input type="password" value={forgotNewPass.confirm} onChange={e => setForgotNewPass(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8,
                        fontSize: 13, outline: "none", background: "#FDFAF4", marginBottom: 14 }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#E8DCC8"} />
                    <button onClick={forgotStep4}
                      style={{ width: "100%", padding: "10px", background: "#27ae60", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Simpan Password
                    </button>
                  </>
                )}

                <button onClick={closeForgot}
                  style={{ width: "100%", marginTop: 12, padding: "10px", background: "transparent",
                    color: "#5A6A6C", border: "1px solid #E8DCC8", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                  Kembali
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====== PUBLIC WEBSITE ====== */}
      {!showAdmin && !reviewTokenParam && (
        <>
          {/* NAVBAR -- Fixed floating always */}
          <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            background: "rgba(255,255,255,.94)",
            backdropFilter: "blur(18px) saturate(1.2)",
            borderBottom: "1px solid rgba(158,155,150,.18)",
            boxShadow: "0 2px 32px rgba(20,18,16,.08), 0 1px 0 rgba(255,255,255,.9) inset",
            padding: "0 5%", overflow: "visible" }}>
            {/* -- Smoke & flare layer -- white/grey -- */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
              {/* Smoke left */}
              <div style={{ position: "absolute", left: "15%", top: "-30%", width: 180, height: "170%",
                background: "radial-gradient(ellipse at 50% 50%, rgba(235,232,226,.55) 0%, rgba(240,238,234,.15) 55%, transparent 100%)",
                filter: "blur(22px)", transform: "rotate(-10deg)" }} />
              {/* Flare at junction */}
              <div style={{ position: "absolute", left: "calc(22% - 40px)", top: "50%", transform: "translateY(-50%)",
                width: 80, height: 80,
                background: "radial-gradient(circle, rgba(158,155,150,.38) 0%, rgba(158,155,150,.12) 45%, transparent 80%)",
                filter: "blur(10px)" }} />
              {/* Sash / selendang line */}
              <div style={{ position: "absolute", top: "50%", left: "10%", width: "80%", height: 1,
                background: "linear-gradient(90deg,transparent,rgba(158,155,150,.12),transparent)",
                transform: "translateY(-50%)" }} />
              {/* Smoke right */}
              <div style={{ position: "absolute", right: "12%", top: "-20%", width: 200, height: "140%",
                background: "radial-gradient(ellipse at 40% 60%, rgba(74,72,69,.08) 0%, transparent 100%)",
                filter: "blur(28px)", transform: "rotate(6deg)" }} />
            </div>
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", height: 82, maxWidth: 1200, margin: "0 auto", gap: 20 }}>

              {/* -- LOGO -- */}
              <button onClick={() => navigateTo("home")} style={{ border: "none", background: "none", padding: 0, flexShrink: 0, height: "100%", display: "flex", alignItems: "center", overflow: "visible", minWidth: 0 }}>
                <span className="hide-sm">
                  <LogoDisplay content={data.content} size="nav" />
                </span>
                <span className="show-sm">
                  <LogoDisplay content={data.content} size="mobile-nav" />
                </span>
              </button>

              {/* -- DESKTOP NAV with Dropdowns -- */}
              <div className="hide-sm" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, paddingLeft: 8, flexWrap: "wrap" }}>
                {/* Flat nav items */}
                {navItems.map(item => (
                  <button key={item.key} onClick={() => navigateTo(item.key)}
                    className={`nav-link${page === item.key ? " active" : ""}`}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 2px" }}>
                    {item.label}
                  </button>
                ))}

                {/* Dropdown: Tema Rumah — tepat di bawah About */}
                <NavDropdownTemaRumah page={page} navigateTo={navigateTo}
                  temaList={((data.temaData && data.temaData.length > 0) ? data.temaData : TEMA_DATA).filter(t => !t.hidden)} temaSlug={temaSlug} openTemaDetail={openTemaDetail} />

                {/* Dropdown: Paket Layanan Kami */}
                <NavDropdownLayanan page={page} navigateTo={navigateTo} navDropdownLayanan={navDropdownLayanan} />

                {/* Interior & Eksterior sudah digabung ke dropdown Layanan */}

                {/* Dropdown: Galeri & Proyek */}
                <NavDropdownGaleri page={page} navigateTo={navigateTo} navDropdownGaleri={navDropdownGaleri} />
              </div>

              {/* -- LOGIN / USER (desktop) -- */}
              <div className="hide-sm" style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                {user
                  ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Avatar dengan organic border shape */}
                      <div style={{
                        width: 38, height: 38, flexShrink: 0,
                        background: user.photo ? "transparent" : "linear-gradient(135deg,#3D5254,#C9AA71)",
                        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                        border: "2.5px solid rgba(255,255,255,.75)",
                        boxShadow: "0 0 0 3px rgba(139,105,20,.4), 0 4px 14px rgba(0,0,0,.22)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", transition: "border-radius .4s ease, box-shadow .3s"
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderRadius = "50%"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,170,113,.6), 0 6px 20px rgba(0,0,0,.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderRadius = "30% 70% 70% 30% / 30% 30% 70% 70%"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,105,20,.4), 0 4px 14px rgba(0,0,0,.22)"; }}>
                        {user.photo
                          ? <img decoding="async" loading="lazy" src={cld(user.photo)} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>{(user.name || user.username || "?")[0].toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, lineHeight: 1.2, animation: "navPulse 90s ease-in-out infinite" }}>
                          {user.name || user.username}
                        </span>
                        {/* CP button dengan border shape asimetris */}
                        <button onClick={() => openAdmin()}
                          style={{
                            fontSize: "0.6rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 800,
                            color: "#fff",
                            background: "linear-gradient(130deg,rgba(8,145,178,.65),rgba(10,168,191,.45))",
                            border: "1px solid rgba(255,255,255,.6)",
                            cursor: "pointer", lineHeight: 1.3,
                            padding: "2px 10px",
                            borderRadius: "14px 4px 14px 4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                            transition: "all .25s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.28)"; e.currentTarget.style.borderRadius = "4px 14px 4px 14px"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.28)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(130deg,rgba(8,145,178,.65),rgba(10,168,191,.45))"; e.currentTarget.style.borderRadius = "14px 4px 14px 4px"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.18)"; }}>
                          Control Panel
                        </button>
                        {/* Tombol Logout */}
                        <button onClick={() => logout()}
                          style={{
                            fontSize: "0.6rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 800,
                            color: "#fff",
                            background: "linear-gradient(130deg,rgba(180,40,40,.65),rgba(210,60,60,.45))",
                            border: "1px solid rgba(255,255,255,.5)",
                            cursor: "pointer", lineHeight: 1.3,
                            padding: "2px 10px",
                            borderRadius: "4px 14px 4px 14px",
                            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                            transition: "all .25s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,.45)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(130deg,rgba(180,40,40,.65),rgba(210,60,60,.45))"; }}>
                          ⏻ Logout
                        </button>
                      </div>
                    </div>
                  : <button onClick={() => setShowLogin(true)}
                    className="login-collapse-btn"
                    style={{
                      display: "flex", alignItems: "center", gap: 0, overflow: "hidden",
                      width: 36, border: "1.5px solid rgba(20,18,16,.35)", borderRadius: 4,
                      fontSize: "0.75rem", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700,
                      background: "transparent", color: "var(--re-black)", padding: "7px 9px",
                      cursor: "pointer", transition: "width .28s cubic-bezier(.4,0,.2,1), padding .28s, background .18s, color .18s", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.width = "90px"; b.style.paddingRight = "14px"; b.style.gap = "7px"; b.style.background = "var(--re-black)"; b.style.color = "#fff"; b.querySelector(".lcb-text").style.opacity = "1"; b.querySelector(".lcb-text").style.maxWidth = "80px"; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.width = "36px"; b.style.paddingRight = "9px"; b.style.gap = "0"; b.style.background = "transparent"; b.style.color = "var(--re-black)"; b.querySelector(".lcb-text").style.opacity = "0"; b.querySelector(".lcb-text").style.maxWidth = "0"; }}>
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" style={{ flexShrink: 0 }}>
                      <rect y="0" width="16" height="2" rx="1" fill="currentColor"/>
                      <rect y="5" width="16" height="2" rx="1" fill="currentColor"/>
                      <rect y="10" width="16" height="2" rx="1" fill="currentColor"/>
                    </svg>
                    <span className="lcb-text" style={{ maxWidth: 0, opacity: 0, overflow: "hidden", transition: "max-width .28s cubic-bezier(.4,0,.2,1), opacity .2s", fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
                      {data.content.loginBtnText || "LOGIN"}
                    </span>
                  </button>
                }
              </div>
              <button className="show-sm" onClick={() => setMobileMenu(!mobileMenu)}
                style={{ 
                  fontSize: 22, 
                  color: "var(--re-black)", 
                  background: "transparent",
                  border: "1.5px solid rgba(20,18,16,.25)",
                  borderRadius: 6,
                  width: 38, height: 38,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "background .2s"
                }} 
                aria-label="Menu">
                {mobileMenu ? "✕" : "☰"}
              </button>
            </div>
            {mobileMenu && (
              <div className="mobile-dropdown" style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "rgba(255,255,255,.97)",
                borderTop: "1px solid rgba(158,155,150,.18)",
                boxShadow: "0 20px 60px rgba(20,18,16,.15)",
                backdropFilter: "blur(20px)",
                display: "flex", flexDirection: "column", gap: 2,
                padding: "16px 5% 24px", zIndex: 9999,
                animation: "fadeIn .25s ease",
                maxHeight: "calc(100vh - 72px)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch"
              }}>
                {/* -- Mobile: main nav items -- */}
                {navItems.map(item => (
                  <button key={item.key} onClick={() => { navigateTo(item.key); setMobileMenu(false); }}
                    style={{ fontSize:".8rem", letterSpacing:".14em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
                      color:page===item.key?"var(--re-black)":"var(--re-grey-dk)", fontWeight:page===item.key?700:400,
                      border:"none", background:"transparent", textAlign:"left", padding:"13px 18px", borderRadius:6, width:"100%",
                      borderLeft:page===item.key?"2px solid var(--re-black)":"2px solid transparent", transition:"all .15s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--re-grey-lt)"; e.currentTarget.style.borderLeft="2px solid var(--re-black)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.borderLeft=page===item.key?"2px solid var(--re-black)":"2px solid transparent";}}>
                    {item.label}
                  </button>
                ))}

                {/* -- Mobile: Tema Rumah (accordion) — tepat di bawah About -- */}
                <MobileTemaRumahAccordion page={page} navigateTo={navigateTo} setMobileMenu={setMobileMenu}
                  temaList={((data.temaData && data.temaData.length > 0) ? data.temaData : TEMA_DATA).filter(t => !t.hidden)} temaSlug={temaSlug} openTemaDetail={openTemaDetail} />

                {/* -- Mobile: Paket Layanan Kami (accordion) -- */}
                <MobileLayananAccordion page={page} navigateTo={navigateTo} setMobileMenu={setMobileMenu} navDropdownLayanan={navDropdownLayanan} />

                {/* -- Mobile: Program Renovasi -- */}
                <div style={{ padding:"10px 18px 4px", fontSize:"0.6rem", fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:"#8B6914", opacity:0.8 }}>Program Renovasi & Pembangunan</div>
                {navDropdownGaleri.filter(item=>item.key!=="landscape").map(item=>(
                  <button key={item.key} onClick={()=>{ navigateTo(item.key); setMobileMenu(false); }}
                    style={{ fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
                      color:page===item.key?"var(--re-black)":"var(--re-grey-dk)", fontWeight:page===item.key?700:400,
                      border:"none", background:"transparent", textAlign:"left", padding:"11px 28px", borderRadius:6, width:"100%",
                      borderLeft:page===item.key?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--re-grey-lt)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                    {item.label}
                  </button>
                ))}

                {/* -- Mobile: Produk Retail Furnitur -- */}
                <div style={{ padding:"10px 18px 4px", fontSize:"0.6rem", fontWeight:800, letterSpacing:".18em", textTransform:"uppercase", color:"#8B6914", opacity:0.8 }}>Produk Retail</div>
                <button onClick={()=>{ navigateTo("furnitur"); setMobileMenu(false); }}
                  style={{ fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
                    color:page==="furnitur"?"var(--re-black)":"var(--re-grey-dk)", fontWeight:page==="furnitur"?700:400,
                    border:"none", background:"transparent", textAlign:"left", padding:"11px 28px", borderRadius:6, width:"100%",
                    borderLeft:page==="furnitur"?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="var(--re-grey-lt)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                  Produk Furnitur
                </button>
                <button onClick={()=>{ navigateTo("custom-furnitur"); setMobileMenu(false); }}
                  style={{ fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
                    color:page==="custom-furnitur"?"var(--re-black)":"var(--re-grey-dk)", fontWeight:page==="custom-furnitur"?700:400,
                    border:"none", background:"transparent", textAlign:"left", padding:"11px 28px", borderRadius:6, width:"100%",
                    borderLeft:page==="custom-furnitur"?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="var(--re-grey-lt)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                  Custom Furnitur
                </button>
                {user && (
                  <div style={{ padding: "12px 4px 4px", borderTop: "1px solid var(--re-grey-lt)", marginTop: 8 }}>
                    <div style={{ fontSize: ".8125rem", color: "var(--re-grey-md)", marginBottom: 10, padding: "0 12px" }}>
                      Login sebagai <strong style={{ color: "var(--re-black)" }}>{user.name || user.username}</strong>
                    </div>
                    <button onClick={() => { openAdmin(); setMobileMenu(false); }}
                      style={{ fontSize: ".875rem", color: "#fff", background: "var(--re-black)", border: "none", borderRadius: 6, padding: "11px 16px", fontWeight: 700, width: "100%", marginBottom: 8, fontFamily:"'Jost',sans-serif" }}>
                      Admin Panel
                    </button>
                    <button onClick={() => { logout(); setMobileMenu(false); }}
                      style={{ fontSize: ".875rem", color: "rgba(160,40,40,.9)", background: "rgba(200,50,50,.08)", border: "1px solid rgba(200,50,50,.2)", borderRadius: 6, padding: "10px 16px", width: "100%", fontFamily:"'Jost',sans-serif" }}>
                      Logout
                    </button>
                  </div>
                )}
                {/* -- Gear icon tersembunyi -- hanya untuk admin login, tanpa teks -- */}
                {!user && (
                  <div style={{ display: "flex", justifyContent: "flex-start", padding: "10px 4px 0", borderTop: "1px solid var(--re-grey-lt)", marginTop: 8 }}>
                    <button
                      onClick={() => { setShowLogin(true); setMobileMenu(false); }}
                      style={{
                        width: 28, height: 28,
                        border: "none", background: "transparent",
                        cursor: "pointer", opacity: 0.22,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "opacity .2s", borderRadius: 4,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "0.55"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "0.22"; }}
                      aria-label="Login admin"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ color: "var(--re-black)" }}>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Spacer to push content below fixed navbar */}
          <div style={{ height: "clamp(60px,10vw,96px)" }} />

          {/* -- Ukuran tombol floating (YouTube/Instagram/WhatsApp) menyesuaikan layar:
                lebih kecil di mobile supaya tidak menutupi terlalu banyak area viewport -- */}
          <style>{`
            .float-social-btn { width: 52px; height: 52px; }
            .float-social-icon { width: 24px; height: 24px; }
            .float-yt-btn { bottom: 160px; }
            .float-ig-btn { bottom: 92px; }
            .float-wa-btn { width: 58px; height: 58px; }
            .float-wa-icon { width: 30px; height: 30px; }
            @media (max-width: 768px) {
              .float-social-btn { width: 40px !important; height: 40px !important; right: 14px !important; }
              .float-social-icon { width: 19px !important; height: 19px !important; }
              .float-yt-btn { bottom: 122px !important; }
              .float-ig-btn { bottom: 70px !important; }
              .float-wa-btn { width: 48px !important; height: 48px !important; bottom: 16px !important; right: 14px !important; }
              .float-wa-icon { width: 25px !important; height: 25px !important; }
            }
          `}</style>

          {/* -- YOUTUBE FLOATING BUTTON -- */}
          <a href="https://youtube.com/@hikimoriconst" target="_blank" rel="noopener noreferrer"
            title="Kunjungi YouTube Hikimori Const" className="float-social-btn float-yt-btn"
            style={{
              position: "fixed", right: 20, zIndex: 9989,
              borderRadius: "50%",
              background: "#FF0000",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 18px rgba(255,0,0,.45), 0 2px 8px rgba(0,0,0,.2)",
              border: "none", cursor: "pointer", transition: "transform .18s, box-shadow .18s", textDecoration: "none",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(255,0,0,.6), 0 4px 12px rgba(0,0,0,.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(255,0,0,.45), 0 2px 8px rgba(0,0,0,.2)"; }}>
            <svg className="float-social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="#fff"/>
              <path d="M9.6 15.6 15.8 12 9.6 8.4v7.2z" fill="#FF0000"/>
            </svg>
          </a>

          {/* -- INSTAGRAM FLOATING BUTTON -- */}
          <a href="https://www.instagram.com/hikimori_const" target="_blank" rel="noopener noreferrer"
            title="Ikuti Instagram @hikimori_const" className="float-social-btn float-ig-btn"
            style={{
              position: "fixed", right: 20, zIndex: 9989,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 18px rgba(238,42,123,.45), 0 2px 8px rgba(0,0,0,.2)",
              border: "none", cursor: "pointer", transition: "transform .18s, box-shadow .18s", textDecoration: "none",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(238,42,123,.6), 0 4px 12px rgba(0,0,0,.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(238,42,123,.45), 0 2px 8px rgba(0,0,0,.2)"; }}>
            <svg className="float-social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="6" stroke="#fff" strokeWidth="2"/>
              <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="2"/>
              <circle cx="17.4" cy="6.6" r="1.3" fill="#fff"/>
            </svg>
          </a>

          {/* -- WA PICKER MODAL -- */}
          {waPicker && (
            <WaPickerModal
              admins={content.waAdmins}
              msgText={waPicker.msgText}
              onClose={() => setWaPicker(null)}
            />
          )}

          {/* -- WHATSAPP FLOATING BUTTON -- */}
          <button onClick={() => openWaPicker()}
            title="Hubungi Kami via WhatsApp" className="float-wa-btn"
            style={{
              position: "fixed", bottom: 24, right: 20, zIndex: 9990,
              borderRadius: "50%",
              background: "#25d366",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(37,211,102,.5), 0 2px 8px rgba(0,0,0,.2)",
              border: "none", cursor: "pointer", transition: "transform .2s, box-shadow .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,211,102,.65), 0 4px 12px rgba(0,0,0,.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,.5), 0 2px 8px rgba(0,0,0,.2)"; }}>
            {/* WhatsApp SVG Icon */}
            <svg className="float-wa-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3C8.82 3 3 8.82 3 16c0 2.38.65 4.61 1.78 6.53L3 29l6.64-1.74A12.93 12.93 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3z" fill="#fff"/>
              <path d="M16 5.5c-5.79 0-10.5 4.71-10.5 10.5 0 2.03.58 3.93 1.59 5.54l.28.45-.97 3.54 3.65-.95.43.25A10.44 10.44 0 0 0 16 26.5c5.79 0 10.5-4.71 10.5-10.5S21.79 5.5 16 5.5zm5.32 14.57c-.22.62-1.28 1.18-1.76 1.23-.45.05-.87.22-2.93-.61-2.49-1-4.07-3.54-4.2-3.7-.12-.17-.99-1.32-.99-2.52 0-1.2.63-1.79.85-2.03.22-.25.49-.31.65-.31l.47.01c.15.01.36-.06.56.43.21.5.72 1.76.78 1.89.07.13.11.28.02.45-.08.17-.13.28-.25.43l-.38.44c-.12.13-.25.26-.11.51.14.25.63 1.04 1.35 1.68.93.83 1.71 1.09 1.96 1.21.25.12.39.1.54-.06.15-.16.62-.72.78-.97.16-.25.33-.21.55-.13.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.58-.16 1.2z" fill="#25d366"/>
            </svg>
            {/* Pulse ring animation */}
            <style>{`
              @keyframes waPulse {
                0% { transform: scale(1); opacity: .6; }
                100% { transform: scale(1.7); opacity: 0; }
              }
              .wa-float-ring {
                position: absolute; inset: 0; border-radius: 50%;
                border: 2px solid #25d366;
                animation: waPulse 2s ease-out infinite;
                pointer-events: none;
              }
              @media(max-width:768px){ .hero-arrow{ display:none !important; } }
            `}</style>
            <div className="wa-float-ring" />
          </button>

          {/* -- ARTICLE DETAIL -- */}
          {readPost && (
            <>
              <ArticleDetail post={readPost} onBack={closeArticle} allPosts={allPosts} onReadPost={(p) => openArticle(p)} />
              <HikimoriFooter data={data} navigateTo={navigateTo} onWaOpen={openWaPicker} showDevProfile={() => setShowDevProfile(true)} />
            </>
          )}

          {/* -- PAGE CONTENT -- */}
          {!readPost && (
            <>
              {/* HOME */}
              {page === "home" && (
                <>
                  {/* == HERO == */}
                  <section className="re-hero">
                    {/* Background: Video (default) atau Gambar Statis tergantung heroMode */}
                    {(data.content?.heroMode === "video" || !data.content?.heroMode || data.content?.heroMode === "slideshow") ? (
                      (() => {
                        const vUrl = data.content?.heroVideoUrl || DEFAULT_HERO_VIDEO;
                        const poster = data.content?.heroPoster || videoPoster(vUrl, heroLite ? 960 : 1600);
                        if (!heroVideoOn) {
                          // fase awal / mode lite: gambar poster saja (ringan)
                          return poster
                            ? <img className="re-hero-img" src={poster} alt="" fetchpriority="high" decoding="async" style={{ objectFit:"cover", objectPosition:"center center" }} />
                            : <div className="re-hero-img" style={{ background:"linear-gradient(160deg,#1f2b2d,#2E3D3F)" }} />;
                        }
                        return (
                          <video
                            ref={heroVideoRef}
                            className="re-hero-img"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            poster={poster || undefined}
                            style={{ objectFit:"cover", objectPosition:"center center" }}
                          >
                            <source src={vUrl} type="video/mp4" />
                          </video>
                        );
                      })()
                    ) : data.content?.heroMode === "static" ? (
                      <img decoding="async" loading="lazy"
                        className="re-hero-img"
                        src={cld(data.content?.heroStaticImage || "")}
                        alt="Hero Background"
                        style={{ objectFit:"cover", objectPosition:"center center" }}
                      />
                    ) : null}
                    <div className="re-hero-overlay" />
                    {/* Smoke ornaments */}
                    <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:1,overflow:"hidden" }}>
                      <div className="re-smoke-orb" style={{ width:420,height:420,top:"10%",left:"60%",animationDelay:"0s" }} />
                      <div className="re-smoke-orb" style={{ width:280,height:280,top:"55%",right:"8%",animationDelay:"3s" }} />
                      <div className="re-flare" style={{ width:160,height:160,top:"20%",left:"72%",animationDelay:"1.5s" }} />
                      {/* Selendang / sash decorative line */}
                      <div className="re-sash" style={{ top:"30%",left:"0",animationDelay:"0s" }} />
                      <div className="re-sash" style={{ top:"65%",right:"0",width:"45%",left:"auto",animationDelay:"2s" }} />
                    </div>
                    <div className="re-hero-content">
                      <div className="re-hero-eyebrow">HIKIMORI CONST</div>
                      <h1 className="re-hero-h1">
                        Ubah Rumah Impian<br />Menjadi Kenyataan
                      </h1>
                      <button
                        className="re-btn re-btn-ghost"
                        onClick={() => document.getElementById("re-contact-section")?.scrollIntoView({ behavior:"smooth" })}
                      >
                        Ajukan Pertanyaan
                      </button>
                    </div>
                  </section>

                  {/* == RUNNING TEXT / MARQUEE == */}
                  <RunningTextMarquee
                    text="PUNYA INFO PROYEK KONSTRUKSI? Referensikan kepada perusahaan kami dan dapatkan komisi hingga 3% dari nilai proyek apabila kami terpilih sebagai mitra pelaksana. Legal, transparan, dan tanpa modal. Hubungi kami sekarang!"
                    speedPxPerSec={70}
                  />

                  {/* == RUNNING PHOTO STRIP == */}
                  <section style={{ background:"#F8F5EE", padding:"56px 0 52px", overflow:"hidden" }}>
                    {/* Label */}
                    <div style={{ textAlign:"center", marginBottom:32 }}>
                      <p style={{ fontSize:"0.7rem", letterSpacing:"3px", color:"#8B6914", fontWeight:700, textTransform:"uppercase", fontFamily:"'Jost',sans-serif", marginBottom:10 }}>Koleksi Kami</p>
                      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.4rem,3vw,2rem)", fontWeight:800, color:"#2E3D3F", margin:0, letterSpacing:"-0.01em" }}>
                        Tema Rumah · Interior · Eksterior · Furnitur
                      </h2>
                    </div>

                    {(() => {
                      const DEFAULT_RUNNING = [
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
                        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80",
                        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
                        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
                        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
                        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80",
                        "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80",
                        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
                        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80",
                        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
                        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
                        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
                        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
                        "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80",
                        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80",
                        "https://images.unsplash.com/photo-1556909172-89cf0b8d8a5b?w=600&q=80",
                      ];
                      const manual = data.images?.running || [];
                      const auto = getAutoHomeRunningImages(data, catalogFallback).slice(0, 24);
                      const combined = interleaveArrays(manual, auto);
                      const running = combined.length > 0 ? combined : DEFAULT_RUNNING;
                      const mid = Math.max(1, Math.ceil(running.length / 2));
                      const row1 = running.slice(0, mid);
                      const row2 = running.length > mid ? running.slice(mid) : row1;
                      return (
                        <>
                          {/* Baris 1 — bergerak ke kanan */}
                          <div style={{ marginBottom:14 }}>
                            <RunningPhotoRow items={row1} direction="right" speedPxPerSec={45} />
                          </div>
                          {/* Baris 2 — bergerak ke kiri */}
                          <RunningPhotoRow items={row2} direction="left" speedPxPerSec={45} />
                        </>
                      );
                    })()}
                  </section>

                  {/* == QUOTE / PARALLAX IMAGE == */}
                  <section className="re-quote-img re-scale-in">
                    <img decoding="async" loading="lazy"
                      src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=85&auto=format&fit=crop"
                      alt="Interior Modern"
                    />
                    <div className="re-quote-img-overlay" />
                    {/* Flare top-right */}
                    <div className="re-flare" style={{ width:200,height:200,top:"10%",right:"12%",animationDelay:"2s" }} />
                    <div className="re-quote-content">
                      <p className="re-quote-text">
                        Bisnis kami yang sebenarnya bukanlah menjual properti, melainkan membantu klien dalam mengambil keputusan yang paling cocok bagi mereka.
                      </p>
                    </div>
                  </section>

                  {/* == ACTIVE LISTINGS == */}
                  <section className="re-listings">
                    <div style={{ maxWidth:1200,margin:"0 auto" }}>
                      <p className="re-about-label re-reveal" style={{ marginBottom:48 }}>Listing Aktif Kami</p>

                      {((data.temaData && data.temaData.length > 0) ? data.temaData : TEMA_DATA).filter(t => !t.hidden).map((tema, i) => {
                        const imgRight = i % 2 === 1;
                        return (
                        <div key={tema.slug || tema.id || i} className="re-listing-item" style={{ direction: imgRight ? "rtl" : "ltr" }}>
                          <div className={`re-listing-img-wrap ${imgRight ? "re-slide-right" : "re-slide-left"} delay-${(i%3)+1}`} style={{ direction:"ltr" }}>
                            <TemaPhotoSlideshow slug={tema.slug} nama={tema.nama} cmsData={data} duration={10000} fallbackImg={tema.img} />
                          </div>
                          <div className={`re-listing-info re-reveal delay-${(i%3)+2}`} style={{ direction:"ltr" }}>
                            <h3 className="re-listing-title">{tema.nama}</h3>
                            <p className="re-listing-desc">{tema.deskripsi}</p>
                            <button
                              className="re-btn re-btn-outline"
                              onClick={() => document.getElementById("re-contact-section")?.scrollIntoView({ behavior:"smooth" })}
                            >
                              Ajukan Pertanyaan
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* == SERVICES == */}
                  <section className="re-services" style={{ position:"relative", overflow:"hidden" }}>
                    {/* Smoke ornament */}
                    <div className="re-smoke-orb" style={{ width:450,height:450,top:"-80px",right:"-60px",animationDelay:"2s" }} />
                    <div style={{ maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1 }}>
                      <h2 className="re-services-h2 re-reveal">Layanan HIKIMORI CONST Kami</h2>
                      <div className="re-services-grid">
                        {((data.homeServices && data.homeServices.length > 0) ? data.homeServices : HOME_SERVICES_DEFAULT).map((svc, i) => (
                          <div key={i} className={`re-service-card ${i%2===0 ? "re-slide-left" : "re-slide-right"} delay-${(i%5)+1}`}>
                            <div className="re-service-card-img">
                              <img decoding="async" loading="lazy" src={cld(svc.img)} alt={svc.title} />
                            </div>
                            <div className="re-service-card-body">
                              <div className="re-service-num">{svc.num || String(i+1).padStart(2,"0")}</div>
                              <div className="re-service-title">{svc.title}</div>
                              <div className="re-service-desc">{svc.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* == CONTACT == */}
                  <section className="re-contact" id="re-contact-section">
                    <div className="re-contact-grid">
                      <div className="re-slide-left">
                        <img loading="lazy" decoding="async"
                          src={cld(data.content.footerLogoImage || data.content.logoImage || HIKIMORI_LOGO_URL)}
                          alt={data.content.logoText?.replace("\n"," ") || "HIKIMORI CONST"}
                          style={{ height: 72, maxWidth: 200, objectFit: "contain", display: "block", marginBottom: 16 }}
                        />
                        <p style={{ fontFamily:"'Jost',sans-serif", fontSize:".85rem", color:"var(--re-grey-md)", lineHeight:1.8, marginBottom:14 }}>
                          {data.content.email || "halo@hikimoriconst.com"}
                        </p>
                      </div>
                      <div className="re-slide-right" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"32px 48px" }}>
                        <div>
                          <div className="re-contact-label">Alamat Kantor</div>
                          <div className="re-contact-val">
                            {data.content.address || "Jl. Asem Jawa 40, Cibodas,\nTangerang 15401"}
                          </div>
                          <div className="re-contact-note">Kantor kami memiliki ramp dan lift untuk kemudahan akses.</div>
                        </div>
                        <div>
                          <div className="re-contact-label">Telepon</div>
                          <div className="re-contact-val">{displayPhone(data.content) || "021 123 456 7890"}</div>
                          <div className="re-contact-label" style={{ marginTop:20 }}>Email</div>
                          <div className="re-contact-val">{data.content.email || "halo@hikimoriconst.com"}</div>
                        </div>
                        <div style={{ gridColumn:"1 / -1", marginTop:8 }}>
                          <button
                            className="re-btn re-btn-dark"
                            onClick={() => openWaPicker({ key: "konsultasi", vars: {} })}
                          >
                            Hubungi Kami
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* == CLOSING HERO == */}
                  <section className="re-closing-hero re-scale-in">
                    <img decoding="async" loading="lazy"
                      src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=85&auto=format&fit=crop"
                      alt="Dream Home"
                    />
                    <div className="re-closing-hero-overlay" />
                    {/* Smoke + flare ornaments */}
                    <div className="re-smoke-orb" style={{ width:360,height:360,top:"5%",right:"15%",zIndex:1,animationDelay:"0s" }} />
                    <div className="re-flare" style={{ width:140,height:140,top:"20%",right:"30%",zIndex:1,animationDelay:"3s" }} />
                    <div className="re-closing-content" style={{ zIndex:2 }}>
                      <p className="re-closing-label">HIKIMORI CONST</p>
                      <h2 className="re-closing-h2">Wujudkan rumah<br />impian Anda</h2>
                    </div>
                  </section>

                  {/* == KONSULTASI GRATIS (lead) + SOSIAL == */}
                  <section className="hc" style={{ background: "#FAF7F0", padding: "clamp(3rem,6vw,5rem) 0", contentVisibility: "auto", containIntrinsicSize: "auto 640px" }} aria-label="Konsultasi gratis">
                    <div className="hc-container hc-hero-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div>
                        <div className="hc-eyebrow">Konsultasi Gratis</div>
                        <h2 className="hc-h2">Ceritakan proyek Anda, kami siapkan solusinya</h2>
                        <p className="hc-lead">Isi formulir singkat — tim kami menghubungi Anda via WhatsApp untuk diskusi kebutuhan, estimasi, dan jadwal survei.</p>
                        <ul className="hc-bullets" style={{ color: "#2E3D3F" }}>
                          <li style={{ color: "#2E3D3F" }}>RAB detail & transparan</li>
                          <li style={{ color: "#2E3D3F" }}>Tanpa biaya konsultasi awal</li>
                          <li style={{ color: "#2E3D3F" }}>Respon cepat di jam kerja</li>
                        </ul>
                      </div>
                      <div className="hc-card"><LeadForm source="home" onSuccess={handleLead} compact /></div>
                    </div>
                  </section>
                  <SocialFeed marketing={mk} />

                  {/* == HIKIMORI FOOTER == */}
                  <HikimoriFooter data={data} navigateTo={navigateTo} onWaOpen={openWaPicker} showDevProfile={() => setShowDevProfile(true)} />
                </>
              )}


              {/* ABOUT PAGE */}
              {page === "about" && (
                <AboutPage
                  content={data.content}
                  images={data.images}
                  teamMembers={data.teamMembers || []}
                  aboutStats={data.aboutStats || []}
                  aboutMisiList={data.aboutMisiList || []}
                  aboutWhyList={data.aboutWhyList || []}
                  aboutLayananList={data.aboutLayananList || []}
                  temaData={data.temaData || []}
                  cmsData={data}
                  openTemaDetail={openTemaDetail}
                  navigateTo={navigateTo}
                  onWaOpen={openWaPicker}
                />
              )}

              {/* SERVICES PAGE */}
              {(page === "services" || activePaket) && <ServicesPage content={data.content} services={data.services || []} navigateTo={navigateTo} activePaket={activePaket} onOpenPaket={openPaket} onClosePaket={closePaket} onWaOpen={openWaPicker} />}

              {/* SUB-SERVICE PAGES */}
              {page === "desainrab"   && <DesainRabPage   onWaOpen={openWaPicker} />}
              {page === "temarumah"   && <TemaRumahPage   onWaOpen={openWaPicker} temaSlug={temaSlug} openTemaDetail={openTemaDetail} closeTemaDetail={closeTemaDetail} cmsData={data} />}
              {page === "interior"    && <InteriorPage    onWaOpen={openWaPicker} />}
              {page === "pagar"       && <PagarPage       onWaOpen={openWaPicker} />}
              {page === "kanopi"      && <KanopiPage      onWaOpen={openWaPicker} />}
              {page === "aluminium"   && <AluminiumPage   onWaOpen={openWaPicker} />}
              {page === "landscape"   && <LandscapePage   onWaOpen={openWaPicker} categories={data.landscapeCategories} />}
              {page === "promo" && <PromoPage marketing={mk} content={data.content} onLead={handleLead} onWaOpen={openWaPicker} />}
              {page === "furnitur"    && <FurniturPage    data={data} onWaOpen={openWaPicker} />}
              {page === "custom-furnitur" && <CustomFurniturPage data={data} onWaOpen={openWaPicker} />}
              {/* -- Sub-halaman Interior -- */}
              {["interior/kamar-tidur","interior/kamar-mandi","interior/ruang-keluarga","interior/ruang-tamu","interior/kitchen-set","interior/ruang-kerja","interior/plafon-modern","interior/backdrop"].includes(page) &&
                <SubInteriorPage pageKey={page} onWaOpen={openWaPicker} navigateTo={navigateTo} data={data} itemSlug={catalogItemSlug} openItem={openCatalogItem} closeItem={closeCatalogItem} />}
              {/* -- Sub-halaman Eksterior -- */}
              {["eksterior/pagar","eksterior/kanopi","eksterior/kusen-partisi","eksterior/taman-landscape"].includes(page) &&
                <SubEksteriorPage pageKey={page} onWaOpen={openWaPicker} navigateTo={navigateTo} data={data} itemSlug={catalogItemSlug} openItem={openCatalogItem} closeItem={closeCatalogItem} />}

              {/* PROGRAM RENOVASI RUMAH SUBSIDI -- Magazine Mixing Grid */}
              {page === "shop" && <RumahSubsidiPage onWaOpen={openWaPicker} paketData={data.rumahSubsidiPaket} />}

              {/* PROGRAM PEMBANGUNAN KOST -- Magazine Mixing Grid */}
              {page === "kost" && <PembangunanKostPage onWaOpen={openWaPicker} paketData={data.pembangunanKostPaket} />}

              {/* PROGRAM PEMBANGUNAN CAFE -- Magazine Mixing Grid */}
              {page === "cafe" && <PembangunanCafePage onWaOpen={openWaPicker} paketData={data.pembangunanCafePaket} />}

              {/* PROGRAM PEMBANGUNAN RUKO -- Magazine Mixing Grid */}
              {page === "ruko" && <PembangunanRukoPage onWaOpen={openWaPicker} paketData={data.pembangunanRukoPaket} />}

              {/* NEWS / DESTINATIONS */}
              {["news", "destinations"].includes(page) && (
                <SectionPage
                  section={page}
                  posts={data.posts || {}}
                  onReadPost={(post) => openArticle(post)}
                />
              )}

              {/* == HIKIMORI FOOTER -- muncul di semua halaman kecuali home == */}
              {page !== "home" && !["home"].includes(page) && (
                <HikimoriFooter data={data} navigateTo={navigateTo} onWaOpen={openWaPicker} showDevProfile={() => setShowDevProfile(true)} />
              )}
            </>
          )}
        </>
      )}

      {!showAdmin && !reviewTokenParam && <ConsentBanner marketing={mk} />}

      {/* ADMIN PANEL */}
      {showAdmin && !reviewTokenParam && !dataReady && (
        // Data dari Firestore belum selesai dicek — TAHAN dulu seluruh Control Panel supaya
        // tidak mungkin ada aksi (edit/simpan/hapus) yang kejalan berbasis data lama/default
        // sebelum data asli benar-benar termuat. Ini menutup celah race-condition yang
        // sebelumnya menyebabkan konfigurasi tertimpa.
        <div style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E8DCC8", borderTopColor: "#8B6914", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ color: "#5A6A6C", fontSize: 14, fontWeight: 600 }}>Memuat data dari server, mohon tunggu...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {showAdmin && !reviewTokenParam && dataReady && (
        <AdminPanel {...{ adminTab, allPosts, canCS, canEdit, closeAdmin, data, dataReady, draftCount, editRoleId, editUserForm, editUserId, getCEFVal, isAdmin, navigateAdminTab, notify, profileEdit, profileEditMode, publishedCount, replyMsg, replyText, replyTo, reviewTokenParam, save, saveContent, setCmsEditPost, setEditContent, setEditRoleId, setEditUserForm, setEditUserId, setProfileEdit, setProfileEditMode, setReplyText, setReplyTo, setSidebarOpen, setUser, setUserMgmtForm, setUserMgmtOpen, showAdmin, sidebarOpen, user, userMgmtForm, userMgmtOpen }} />
      )}
    </div>
  );
}
