// script.js
// ReVanced Downloader — dynamic release asset fetch + dynamic buttons + theme + disclaimer modal + caching

// One-time migration: clear old cache keys
localStorage.removeItem("revanced_cache_v1");
localStorage.removeItem("revanced_cache_v2");

const CONFIG = {
  appsRepo: "j-hc/revanced-magisk-module",
  microgRepo: "MorpheApp/MicroG-RE",
  // mapping for apps - key used to search asset names (lowercase)
  apps: [
    { id: "youtube", title: "YouTube", keys: ["youtube-morphe"], elementId: "youtube-downloads", metaId: "youtube-meta", cardClass: "card-youtube" },
    { id: "ytmusic", title: "YouTube Music", keys: ["music-morphe"], elementId: "ytmusic-downloads", metaId: "ytmusic-meta", cardClass: "card-ytmusic" },
    { id: "photos", title: "Google Photos", keys: ["googlephotos"], elementId: "photos-downloads", metaId: "photos-meta", cardClass: "card-photos" }
  ],
  microgKeyCandidates: ["microg"],
  cacheTTLms: 1000 * 60 * 60 * 12 // 12 hours
};

// Quick check: fetch only latest release tag (lightweight, 1 API call per repo)
async function getLatestTag(repo) {
  try {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.tag_name || null;
  } catch {
    return null;
  }
}

// Utility: simple fetch wrapper with error handling
async function safeFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    if (res.status === 403 || res.status === 429)
      throw new Error("rate_limit");
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

// Parse asset name to type label
function classifyAsset() {
  return "Download";
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

// Try to extract version from asset names, fallback to release name
function extractVersion(release, assets) {
  for (const asset of assets) {
    // Match versions like "v19.09.37" or "1.2.3"
    const match = asset.name.match(/v?(\d+(?:\.\d+)+)/);
    if (match) {
      return match[0];
    }
  }
  return release.name || release.tag_name;
}



// Render assets into container
function renderAssets(containerId, metaId, releaseInfo) {
  const container = document.getElementById(containerId);
  const meta = document.getElementById(metaId);
  if (!container) return;
  const card = container.closest('.card');
  if (!card) return;

  if (!releaseInfo) {
    card.style.display = 'none';
    return;
  }

  const { release, assets } = releaseInfo;
  container.innerHTML = ""; // clear

  const installType = document.getElementById("install-type").value;
  const architecture = document.getElementById("architecture").value;

  let filteredAssets = assets;

  if (installType === "root") {
    filteredAssets = assets.filter(a => a.name.toLowerCase().includes("magisk") || a.name.toLowerCase().includes("module"));
  } else { // non-root
    filteredAssets = assets.filter(a => !a.name.toLowerCase().includes("magisk") && !a.name.toLowerCase().includes("module"));
  }

  // Now apply architecture filtering to the filteredAssets
  const arm64Assets = filteredAssets.filter(a => a.name.toLowerCase().includes("arm64") || a.name.toLowerCase().includes("v8a"));
  const armAssets = filteredAssets.filter(a => (a.name.toLowerCase().includes("arm") && !a.name.toLowerCase().includes("arm64")) || a.name.toLowerCase().includes("v7a"));
  const universalAssets = filteredAssets.filter(a => a.name.toLowerCase().includes("all") || a.name.toLowerCase().includes("universal"));
  const otherAssets = filteredAssets.filter(a => !a.name.toLowerCase().includes("arm64") && !a.name.toLowerCase().includes("v8a") && !a.name.toLowerCase().includes("arm") && !a.name.toLowerCase().includes("v7a") && !a.name.toLowerCase().includes("all") && !a.name.toLowerCase().includes("universal"));


  if (architecture === 'arm64') {
    if (arm64Assets.length > 0) filteredAssets = arm64Assets;
    else if (universalAssets.length > 0) filteredAssets = universalAssets;
    else if (otherAssets.length > 0) filteredAssets = otherAssets;
    else filteredAssets = [];
  } else if (architecture === 'arm') {
    if (armAssets.length > 0) filteredAssets = armAssets;
    else if (universalAssets.length > 0) filteredAssets = universalAssets;
    else if (otherAssets.length > 0) filteredAssets = otherAssets;
    else filteredAssets = [];
  }
  
  // Exclude HW Signed APKs
  filteredAssets = filteredAssets.filter(a => !a.name.toLowerCase().endsWith("hw-signed.apk"));

  if (filteredAssets.length === 0) {
    card.style.display = 'none';
    return;
  } else {
    card.style.display = 'block';
  }

  for (const a of filteredAssets) {
    const n = a.name;
    const label = classifyAsset();
    const sizeMB = (a.size / (1024 * 1024)).toFixed(1) + " MB";
    const link = document.createElement("a");
    link.href = a.browser_download_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "download-btn";
    link.innerHTML = `<span class="dl-label">${label}</span><span class="dl-size">${sizeMB}</span>`;
    link.title = n;
    container.appendChild(link);
  }
  
  if (meta) {
    const date = new Date(release.published_at || release.created_at);
    const version = extractVersion(release, assets);
    meta.textContent = `Version: ${version} • ${formatDateDDMMYYYY(date)}`;
  }
}

// High-level function for all apps
async function loadAllApps() {
  // Try cache first
  const cacheKey = "revanced_cache_v3";
  try {
    const cacheRaw = localStorage.getItem(cacheKey);
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw);
      if (Date.now() - cache.t < CONFIG.cacheTTLms) {
        // fill UI from cache quickly
        for (const app of CONFIG.apps) {
          renderAssets(app.elementId, app.metaId, cache[app.id]);
        }
        renderAssets("microg-downloads", "microg-meta", cache.microg);
        // Background: lightweight tag check instead of full refresh
        const cachedTags = cache._tags;
        if (cachedTags) {
          const [newAppTag, newMicrogTag] = await Promise.all([
            getLatestTag(CONFIG.appsRepo),
            getLatestTag(CONFIG.microgRepo)
          ]);
          if (newAppTag === cachedTags.appsRepo && newMicrogTag === cachedTags.microgRepo) {
            return; // cache still fresh
          }
        }
        // Tags changed or missing — full refresh
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

// Show/hide error banner
function showError(msg) {
  const banner = document.getElementById("error-banner");
  const text = document.getElementById("error-text");
  if (!banner || !text) return;
  text.textContent = msg;
  banner.setAttribute("aria-hidden", "false");
}
function hideError() {
  const banner = document.getElementById("error-banner");
  if (!banner) return;
  banner.setAttribute("aria-hidden", "true");
}

// Refresh from GitHub and store cache
async function refreshAllAndCache(cacheKey) {
  hideError();
  const resultCache = { t: Date.now() };

  // For each app, search repo
  for (const app of CONFIG.apps) {
    try {
      const matchFn = nameLower => app.keys.some(k => nameLower.includes(k));
      const found = await findAssetsAcrossReleases(CONFIG.appsRepo, matchFn, 8);
      renderAssets(app.elementId, app.metaId, found);
      resultCache[app.id] = found;
    } catch (e) {
      resultCache[app.id] = null;
    }
  }

  // MicroG
  try {
    const microgMatchFn = nameLower => CONFIG.microgKeyCandidates.some(k => nameLower.includes(k));
    const microgFound = await findAssetsAcrossReleases(CONFIG.microgRepo, microgMatchFn, 8);
    renderAssets("microg-downloads", "microg-meta", microgFound);
    resultCache.microg = microgFound;
  } catch (e) {
    resultCache.microg = null;
  }

  // Check if everything failed
  const allNull = CONFIG.apps.every(a => resultCache[a.id] === null) && resultCache.microg === null;
  if (allNull) {
    showError("Could not fetch data from GitHub. Rate limit may be exceeded or you may be offline.");
  }

  // Store latest tags for version-based cache validation
  const [appTag, microgTag] = await Promise.all([
    getLatestTag(CONFIG.appsRepo),
    getLatestTag(CONFIG.microgRepo)
  ]);
  resultCache._tags = { appsRepo: appTag, microgRepo: microgTag };

  // Save cache (only if we got at least something)
  if (!allNull) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(resultCache));
    } catch (e) {
      console.warn("Cache save failed", e);
    }
  }
}

// Theme handling
function applyInitialTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("revanced_theme");
  const themeCheckbox = document.getElementById("theme-checkbox");

  if (stored) {
    root.setAttribute("data-theme", stored);
    if (stored === "dark") {
      themeCheckbox.checked = true;
    }
    return;
  }
  // auto detect
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  if (prefersDark) {
    themeCheckbox.checked = true;
  }
}

function toggleTheme() {
  const root = document.documentElement;
  const themeCheckbox = document.getElementById("theme-checkbox");
  const newTheme = themeCheckbox.checked ? "dark" : "light";
  root.setAttribute("data-theme", newTheme);
  localStorage.setItem("revanced_theme", newTheme);
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
  document.getElementById("theme-checkbox").addEventListener("change", toggleTheme);
  initModal();

  document.getElementById("error-retry").addEventListener("click", () => loadAllApps());

  // Guide card — smart click: scroll up, change dropdown, reload
  document.querySelector(".guide-card")?.addEventListener("click", (e) => {
    const item = e.target.closest(".guide-item");
    if (!item) return;
    const label = item.querySelector(".guide-label");
    if (!label) return;
    const text = label.textContent.trim();

    const installSelect = document.getElementById("install-type");
    const archSelect = document.getElementById("architecture");
    let changed = false;

    if (text.startsWith("Non-Rooted")) {
      if (installSelect.value !== "non-root") { installSelect.value = "non-root"; loadAllApps(); }
    } else if (text.startsWith("Rooted")) {
      if (installSelect.value !== "root") { installSelect.value = "root"; loadAllApps(); }
    } else if (text.startsWith("ARM64")) {
      if (archSelect.value !== "arm64") { archSelect.value = "arm64"; loadAllApps(); }
    } else if (text.startsWith("ARM ")) {
      if (archSelect.value !== "arm") { archSelect.value = "arm"; loadAllApps(); }
    } else {
      return;
    }

    // Highlight & scroll (always, even if already selected)
    const target = text.startsWith("ARM") ? archSelect : installSelect;
    target.style.transition = "box-shadow 0.3s";
    target.style.boxShadow = "0 0 0 3px var(--accent-yt)";
    setTimeout(() => { target.style.boxShadow = ""; }, 800);

    document.querySelector(".controls")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  const installTypeSelect = document.getElementById("install-type");
  const architectureSelect = document.getElementById("architecture");

  installTypeSelect.addEventListener("change", () => loadAllApps());
  architectureSelect.addEventListener("change", () => loadAllApps());

  loadAllApps();
})();