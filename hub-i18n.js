(function () {
  const STORAGE_KEY = "gameistLang";
  const GEO_CACHE_KEY = "gameistGeo";
  const GEO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

  const I18N = {
    tr: {
      lang_label: "Dil",
      brand_sub: "Premium Gaming Hub",
      section_popular_games: "Popüler Oyunlar",
      section_popular_subtitle: "Hemen oynamaya başla ve eğlenceyi keşfet!",
      cta_title: "Bizi takip et!",
      cta_description:
        "Yeni oyunlar ve özellikler üzerinde çalışıyoruz. Güncellemeler için takipte kalın!",

      badge_popular: "Popüler",
      badge_classic: "Klasik",
      badge_brain: "Zeka",
      badge_pool: "Rick'in uğrak alanı",

      game_elementist_title: "Elementist",
      game_elementist_desc:
        "Elementlerin gücünü keşfet, düşmanları alt et ve hayatta kalabileceğin en zorlu arenada savaş!",
      tag_roguelite: "Roguelite (Brotato tarzı)",

      game_2048_title: "2048",
      game_2048_desc: "Sayıları birleştir, stratejini kur ve 2048'e ulaş!",
      tag_strategy: "Strateji",

      game_wordlist_title: "Wordlist",
      game_wordlist_desc:
        "Kelime ustası ol! Harfleri birleştir, gizli kelimeleri bul. Beyin gelişimi ve jimnastiği için mükemmel bir deneyim.",
      tag_brain_training: "Zeka Geliştirici",

      game_bilardist_title: "Bilardist",
      game_bilardist_desc:
        "Uzaydan gelen premium bilardo deneyimi. Gerçekçi fizik motoru ve muhteşem grafiklerle bilardo oynamanın keyfini çıkar!",
      tag_realistic_physics: "Gerçekçi Fizik",

      seo_title: "Gameist | Elementist, 2048, Wordlist, Bilardist - Ücretsiz Online Oyun Hub'ı",
      seo_description:
        "Gameist: Elementist, 2048, Wordlist ve Bilardist gibi oyunları tek yerde toplayan premium oyun hub'ı. Hemen oyna!",
      seo_og_title: "Gameist - Premium Oyun Deneyimi",
      seo_og_description:
        "Elementist, 2048, Wordlist ve Bilardist: hepsi Gameist ana menüsünde.",
      seo_twitter_title: "Gameist - Premium Oyun Deneyimi",
      seo_twitter_description:
        "Elementist, 2048, Wordlist ve Bilardist oyunlarına tek yerden ulaş.",

      footer_copyright: "© 2026 Gameist by Batuhan Berk – Antalya",
      footer_contact: "İletişim: DM @batuhanberk.space | batuhanberk.space",
    },
    en: {
      lang_label: "Language",
      brand_sub: "Premium Gaming Hub",
      section_popular_games: "Popular Games",
      section_popular_subtitle: "Start playing now and discover the fun!",
      cta_title: "Follow us!",
      cta_description:
        "We're working on new games and features. Stay tuned for updates!",

      badge_popular: "Popular",
      badge_classic: "Classic",
      badge_brain: "Brain",
      badge_pool: "Rick's hangout",

      game_elementist_title: "Elementist",
      game_elementist_desc:
        "Discover the power of the elements, defeat your enemies, and fight to survive in the toughest arena!",
      tag_roguelite: "Roguelite (Brotato-like)",

      game_2048_title: "2048",
      game_2048_desc: "Combine the numbers, plan your moves, and reach 2048!",
      tag_strategy: "Strategy",

      game_wordlist_title: "Wordlist",
      game_wordlist_desc:
        "Become a word master! Combine letters and find the hidden words. A perfect experience for brain training.",
      tag_brain_training: "Brain training",

      game_bilardist_title: "Bilardist",
      game_bilardist_desc:
        "A premium billiards experience from space. Enjoy playing pool with realistic physics and stunning visuals!",
      tag_realistic_physics: "Realistic physics",

      seo_title: "Gameist | Elementist, 2048, Wordlist, Bilardist - Free Online Games Hub",
      seo_description:
        "Gameist is a premium gaming hub bringing Elementist, 2048, Wordlist and Bilardist together in one place. Play now!",
      seo_og_title: "Gameist - Premium Gaming Hub",
      seo_og_description:
        "Elementist, 2048, Wordlist and Bilardist — all available from the Gameist main menu.",
      seo_twitter_title: "Gameist - Premium Gaming Hub",
      seo_twitter_description:
        "Access Elementist, 2048, Wordlist and Bilardist from a single hub.",

      footer_copyright: "© 2026 Gameist by Batuhan Berk – Antalya",
      footer_contact: "Contact: DM @batuhanberk.space | batuhanberk.space",
    },
  };

  function normalizeLang(lang) {
    const raw = String(lang || "").toLowerCase();
    if (raw.startsWith("tr")) return "tr";
    return "en";
  }

  async function detectLangByCountry() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeLang(saved);

    try {
      const cachedRaw = localStorage.getItem(GEO_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const cc = String(cached && cached.country_code).toUpperCase();
        const ts = Number(cached && cached.ts);
        if (cc && ts && Date.now() - ts < GEO_CACHE_TTL_MS) {
          return cc === "TR" ? "tr" : "en";
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("https://ipapi.co/json/", {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const cc = String(data && (data.country_code || data.country)).toUpperCase();
        try {
          if (cc) {
            localStorage.setItem(
              GEO_CACHE_KEY,
              JSON.stringify({ country_code: cc, ts: Date.now() })
            );
          }
        } catch (e) {
          // ignore
        }
        if (cc === "TR") return "tr";
        if (cc) return "en";
      }
    } catch (e) {
      // ignore
    }

    return normalizeLang(navigator.language || "en");
  }

  function setMeta(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.setAttribute("content", value);
  }

  function applySEO(dict, lang) {
    if (typeof dict.seo_title === "string") {
      document.title = dict.seo_title;
    }

    if (typeof dict.seo_description === "string") {
      setMeta('meta[name="description"]', dict.seo_description);
    }

    if (typeof dict.seo_og_title === "string") {
      setMeta('meta[property="og:title"]', dict.seo_og_title);
    }

    if (typeof dict.seo_og_description === "string") {
      setMeta('meta[property="og:description"]', dict.seo_og_description);
    }

    if (typeof dict.seo_twitter_title === "string") {
      setMeta('meta[name="twitter:title"]', dict.seo_twitter_title);
    }

    if (typeof dict.seo_twitter_description === "string") {
      setMeta('meta[name="twitter:description"]', dict.seo_twitter_description);
    }

    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld && ld.textContent) {
      try {
        const obj = JSON.parse(ld.textContent);
        if (obj && typeof obj === "object") {
          obj.inLanguage = lang;
          if (typeof dict.seo_description === "string") {
            obj.description = dict.seo_description;
          }
          ld.textContent = JSON.stringify(obj);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  function applyI18n(lang) {
    const l = normalizeLang(lang);
    const dict = I18N[l] || I18N.en;

    document.documentElement.lang = l;

    applySEO(dict, l);

    const nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const value = dict[key];
      if (typeof value === "string") {
        el.textContent = value;
      }
    });

    const select = document.getElementById("gameistLangSelect");
    if (select) {
      select.value = l;
    }
  }

  function bindSelector() {
    const select = document.getElementById("gameistLangSelect");
    if (!select) return;

    if (!select.__bound) {
      select.addEventListener("change", () => {
        const chosen = normalizeLang(select.value);
        localStorage.setItem(STORAGE_KEY, chosen);
        applyI18n(chosen);
      });
      select.__bound = true;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = normalizeLang(saved || navigator.language || "en");
    applyI18n(initial);
    bindSelector();

    detectLangByCountry().then((lang) => {
      const stillSaved = localStorage.getItem(STORAGE_KEY);
      if (stillSaved) return;
      const resolved = normalizeLang(lang);
      if (resolved !== initial) {
        applyI18n(resolved);
      }
    });
  });
})();
