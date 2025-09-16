// script.js
// ReVanced Downloader — dynamic release asset fetch + dynamic buttons + theme + disclaimer modal + caching

const CONFIG = {
  appsRepo: "j-hc/revanced-magisk-module",
  microgRepo: "ReVanced/GmsCore",
  // mapping for apps - key used to search asset names (lowercase)
  apps: [
    { id: "youtube", title: "YouTube", keys: ["youtube-revanced", "youtube-revanced-magisk", "youtube-revanced-v", "youtube-revanced"] , elementId: "youtube-downloads", metaId: "youtube-meta", cardClass: "card-youtube" },
    { id: "ytmusic", title: "YouTube Music", keys: ["music-revanced", "ytmusic", "music-revanced-magisk", "music-revanced-v"], elementId: "ytmusic-downloads", metaId: "ytmusic-meta", cardClass: "card-ytmusic" },
    { id: "photos", title: "Google Photos", keys: ["googlephotos-revanced", "googlephotos", "photos-revanced", "googlephotos"], elementId: "photos-downloads", metaId: "photos-meta", cardClass: "card-photos" },
    { id: "spotify", title: "Spotify", keys: ["spotify-revanced", "spotify-revanced-v", "spotify"], elementId: "spotify-downloads", metaId: "spotify-meta", cardClass: "card-spotify" }
  ],
  microgKeyCandidates: ["app.revanced.android.gms", "gmscore", "revanced-gmscore"],
  cacheTTLms: 1000 * 60 * 60 * 6 // 6 hours
};

// Utility: simple fetch wrapper with error handling
async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("Fetch failed:", url, e);
    throw e;
  }
}

// Parse asset name to type label
function classifyAsset(nameLower) {
  if (nameLower.includes("v7a.zip")) return "Magisk Module ARM";
  if (nameLower.includes("v8a.zip")) return "Magisk Module ARM64";
  if (nameLower.includes("arm64") || nameLower.includes("arm64-v8a")) return "ARM64 APK";
  // arm-v7a detection should be checked before generic 'arm' so 'arm64' not miscaptured
  if (nameLower.includes("arm-v7a") || nameLower.includes("armeabi-v7a") || (nameLower.includes("arm") && !nameLower.includes("arm64"))) return "ARM APK";
//  if (nameLower.includes("-all.zip") || nameLower.includes("universal Magisk") || nameLower.includes("all.apk")) return "Universal APK";
  if (nameLower.includes("-all.zip")) return "Universal Magisk Module";
  if (nameLower.includes("-all.apk")) return "Universal APK";
  //if (nameLower.includes("-signed.apk")) return "Signed APK";
  if (nameLower.endsWith("hw-signed.apk")) return "HW Signed APK";
  return "Signed APk";
}

// Format date to DD/MM/YYYY HH:MM AM/PM
function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

// Try to find assets across releases pages until matches found (fallback)
async function findAssetsAcrossReleases(repo, assetMatchFn, maxPages = 5) {
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.github.com/repos/${repo}/releases?page=${page}&per_page=10`;
    let releases;
    try {
      releases = await safeFetch(url);
    } catch (e) {
      // stop trying if API unreachable
      console.error("GitHub fetch error", e);
      return null;
    }
    if (!Array.isArray(releases) || releases.length === 0) break;
    for (const rel of releases) {
      const assets = rel.assets || [];
      const matched = assets.filter(a => assetMatchFn(a.name.toLowerCase()));
      if (matched.length) {
        return { release: rel, assets: matched };
      }
    }
    // continue to next page (older releases)
  }
  return null;
}

// Render assets into container
function renderAssets(containerId, metaId, releaseInfo, cardClass) {
  const container = document.getElementById(containerId);
  const meta = document.getElementById(metaId);
  if (!container) return;

  if (!releaseInfo) {
    container.innerHTML = "<div class='no'>No downloads found.</div>";
    if (meta) meta.textContent = "";
    return;
  }

  const { release, assets } = releaseInfo;
  container.innerHTML = ""; // clear
  // sort assets: prefer ARM64 then ARM then Magisk then Universal
  assets.sort((a, b) => {
    const p = ["arm64", "arm-v7a", "arm", "magisk", "all", "universal", "signed.apk"];
    const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
    const ai = p.findIndex(k => an.includes(k));
    const bi = p.findIndex(k => bn.includes(k));
    return ai - bi;
  });

  for (const a of assets) {
    const n = a.name;
    const label = classifyAsset(n.toLowerCase());
    const link = document.createElement("a");
    link.href = a.browser_download_url;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "download-btn";
    link.textContent = label;
    // Add title with name and size/time
    const sizeMB = (a.size / (1024 * 1024)).toFixed(1) + " MB";
    link.title = `${n} — ${sizeMB}`;
    container.appendChild(link);
  }
  if (meta) {
    const date = new Date(release.published_at || release.created_at);
    meta.textContent = `Release: ${release.name || release.tag_name} • ${formatDateDDMMYYYY(date)}`;
  }
}

// High-level function for all apps
async function loadAllApps() {
  // Try cache first
  const cacheKey = "revanced_cache_v1";
  try {
    const cacheRaw = localStorage.getItem(cacheKey);
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw);
      if (Date.now() - cache.t < CONFIG.cacheTTLms) {
        // fill UI from cache quickly
        for (const app of CONFIG.apps) {
          renderAssets(app.elementId, app.metaId, cache[app.id], app.cardClass);
        }
        renderAssets("microg-downloads", "microg-meta", cache.microg, "card-microg");
        // still attempt to refresh in background
        refreshAllAndCache(cacheKey);
        return;
      }
    }
  } catch (e) {
    console.warn("Cache read failed", e);
  }

  // No valid cache — fetch fresh and save
  await refreshAllAndCache(cacheKey);
}

// Refresh from GitHub and store cache
async function refreshAllAndCache(cacheKey) {
  const resultCache = { t: Date.now() };

  // For each app, search repo
  for (const app of CONFIG.apps) {
    const elementId = app.elementId;
    const metaId = app.metaId;
    // matching function checks asset name contains any key for this app
    const matchFn = nameLower => app.keys.some(k => nameLower.includes(k));
    const found = await findAssetsAcrossReleases(CONFIG.appsRepo, matchFn, 8);
    renderAssets(elementId, metaId, found, app.cardClass);
    resultCache[app.id] = found;
  }

  // Spotify sometimes named with 'spotify' assets in same repo
  // MicroG
  const microgMatchFn = nameLower => CONFIG.microgKeyCandidates.some(k => nameLower.includes(k)) && nameLower.includes("signed.apk");
  const microgFound = await findAssetsAcrossReleases(CONFIG.microgRepo, microgMatchFn, 8);
  renderAssets("microg-downloads", "microg-meta", microgFound, "card-microg");
  resultCache.microg = microgFound;

  // Save cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify(resultCache));
  } catch (e) {
    console.warn("Cache save failed", e);
  }
}

// Theme handling
function applyInitialTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("revanced_theme");
  if (stored) {
    root.setAttribute("data-theme", stored);
    updateThemeIcon(stored);
    return;
  }
  // auto detect
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  updateThemeIcon(prefersDark ? "dark" : "light");
}
function updateThemeIcon(theme) {
  const icon = document.getElementById("theme-icon");
  if (!icon) return;
  icon.textContent = theme === "dark" ? "☀️" : "🌙";
}
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("revanced_theme", next);
  updateThemeIcon(next);
}

// Modal (disclaimer)
function initModal() {
  const modal = document.getElementById("disclaimer-modal");
  document.getElementById("open-disclaimer").addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "false");
  });
  document.getElementById("close-disclaimer").addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
  });
  document.getElementById("ack-disclaimer").addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.setAttribute("aria-hidden", "true");
  });
}

// Init
(function init() {
  applyInitialTheme();
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  initModal();
  loadAllApps();

  // small UX: click handler for downloads to open in new tab by default (anchor target already _blank)
  document.body.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.href) {
      // do nothing; anchors already set to open in new tab
    }
  });
})();
