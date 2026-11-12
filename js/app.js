// =========================================================================
// SUPABASE CONFIG (AMAN UNTUK GITHUB PUBLIK SELAMA RLS AKTIF)
// =========================================================================
const SUPABASE_URL = "https://PROJECT_ID_ANDA.supabase.co";
const SUPABASE_ANON_KEY = "SUPABASE_ANON_PUBLIC_KEY_ANDA";

const supabaseClient =
  SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PROJECT_ID_ANDA")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const fallbackReleases = [
  {
    id: "1",
    title: "TORU RE",
    release_type: "Single",
    release_year: "2026",
    cover_url: "",
    audio_url: "",
    spotify_url: "https://open.spotify.com",
    apple_url: "https://music.apple.com",
    youtube_url: "https://music.youtube.com",
    is_featured: true
  },
  {
    id: "2",
    title: "Kwiregtori",
    release_type: "Single",
    release_year: "2026",
    cover_url: "",
    audio_url: "",
    spotify_url: "https://open.spotify.com",
    apple_url: "https://music.apple.com",
    youtube_url: "https://music.youtube.com",
    is_featured: false
  },
  {
    id: "3",
    title: "Sogdai Ya",
    release_type: "Single",
    release_year: "2026",
    cover_url: "",
    audio_url: "",
    spotify_url: "https://open.spotify.com",
    apple_url: "https://music.apple.com",
    youtube_url: "https://music.youtube.com",
    is_featured: false
  }
];

let releases = [];
let currentIdx = -1;
let isPlaying = false;
let audioCtx = null;
let synthLoop = null;

// DOM Elements
const artistVisual = document.getElementById("artistVisual");
const latestTitle = document.getElementById("latestTitle");
const latestPlayBtn = document.getElementById("latestPlayBtn");
const latestLinks = document.getElementById("latestLinks");
const catalogList = document.getElementById("catalogList");

const playerDock = document.getElementById("playerDock");
const dockTrackName = document.getElementById("dockTrackName");
const dockPlayPause = document.getElementById("dockPlayPause");
const dockClose = document.getElementById("dockClose");
const audioEngine = document.getElementById("audioEngine");

document.getElementById("year").textContent = new Date().getFullYear();

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

async function init() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("artist_releases")
      .select("*")
      .eq("artist_slug", "ander")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    releases = !error && data && data.length > 0 ? data : fallbackReleases;
  } else {
    releases = fallbackReleases;
  }

  renderVisualAndLatest();
  renderCatalogList();
}

function renderVisualAndLatest() {
  const fIdx = releases.findIndex((r) => r.is_featured);
  const idx = fIdx !== -1 ? fIdx : 0;
  const featured = releases[idx];
  if (!featured) return;

  latestTitle.textContent = featured.title;

  // Foto Artis / Cover Featured muncul di panel kiri penuh
  if (featured.cover_url) {
    artistVisual.style.backgroundImage = `url('${encodeURI(featured.cover_url)}')`;
  }

  latestPlayBtn.disabled = false;
  latestPlayBtn.onclick = () => toggleAudio(idx);

  const links = [];
  if (featured.spotify_url) links.push(`<a href="${escapeHTML(featured.spotify_url)}" target="_blank" rel="noopener">SPOTIFY</a>`);
  if (featured.apple_url) links.push(`<a href="${escapeHTML(featured.apple_url)}" target="_blank" rel="noopener">APPLE</a>`);
  if (featured.youtube_url) links.push(`<a href="${escapeHTML(featured.youtube_url)}" target="_blank" rel="noopener">YOUTUBE</a>`);
  if (links.length) latestLinks.innerHTML = links.join("");
}

function renderCatalogList() {
  catalogList.innerHTML = releases
    .map((item, idx) => {
      const active = idx === currentIdx && isPlaying;
      const thumbStyle = item.cover_url ? `style="background-image: url('${encodeURI(item.cover_url)}')"` : "";
      const thumbLabel = item.cover_url ? "" : "ANDER";

      return `
        <div class="track-item ${active ? "active" : ""}">
          <div class="track-left">
            <div class="track-thumb" ${thumbStyle}>${thumbLabel}</div>
            <div class="track-details">
              <h4>${escapeHTML(item.title)}</h4>
              <span>${escapeHTML(item.release_type || "Single")} &bull; ${escapeHTML(item.release_year || "2026")}</span>
            </div>
          </div>

          <div class="track-right">
            <button class="btn-track-play" onclick="toggleAudio(${idx})">
              ${active ? "PAUSE" : "PLAY"}
            </button>
            <div class="track-dsps">
              ${item.spotify_url ? `<a href="${escapeHTML(item.spotify_url)}" target="_blank" rel="noopener">SPOTIFY</a>` : ""}
              ${item.apple_url ? `<a href="${escapeHTML(item.apple_url)}" target="_blank" rel="noopener">APPLE</a>` : ""}
              ${item.youtube_url ? `<a href="${escapeHTML(item.youtube_url)}" target="_blank" rel="noopener">YT</a>` : ""}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function stopAudio(hideDock = false) {
  isPlaying = false;
  clearInterval(synthLoop);
  audioEngine.pause();
  audioEngine.currentTime = 0;
  dockPlayPause.textContent = "PLAY";
  if (hideDock) playerDock.classList.remove("show");
  renderCatalogList();
}

function playSynth() {
  const notes = [261.63, 329.63, 392.0, 329.63];
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  let step = 0;
  synthLoop = setInterval(() => {
    if (!isPlaying) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = notes[step % notes.length];
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.55);
    step++;
  }, 600);
}

function toggleAudio(idx) {
  if (currentIdx === idx && isPlaying) {
    stopAudio(false);
    return;
  }

  stopAudio(false);
  currentIdx = idx;
  isPlaying = true;
  const item = releases[idx];

  dockTrackName.textContent = item.title;
  dockPlayPause.textContent = "PAUSE";
  playerDock.classList.add("show");
  renderCatalogList();

  if (item.audio_url) {
    audioEngine.src = item.audio_url;
    audioEngine.play();
    audioEngine.onended = () => stopAudio(false);
  } else {
    playSynth();
  }
}

dockPlayPause.addEventListener("click", () => {
  if (currentIdx !== -1) toggleAudio(currentIdx);
});

dockClose.addEventListener("click", () => {
  stopAudio(true);
  currentIdx = -1;
});

init();
