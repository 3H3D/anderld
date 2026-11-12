// =========================================================================
// SUPABASE CONFIG (AMAN UNTUK GITHUB PUBLIK SELAMA RLS AKTIF)
// =========================================================================
const SUPABASE_URL = "https://PROJECT_ID_ANDA.supabase.co";
const SUPABASE_ANON_KEY = "SUPABASE_ANON_PUBLIC_KEY_ANDA";

const supabaseClient =
  SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PROJECT_ID_ANDA")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const defaultCatalog = [
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
let activeIdx = -1;
let isPlaying = false;
let audioCtx = null;
let synthTimer = null;

// DOM
const heroSection = document.getElementById("heroSection");
const heroTitle = document.getElementById("heroTitle");
const heroPlayBtn = document.getElementById("heroPlayBtn");
const heroDsps = document.getElementById("heroDsps");
const musicGrid = document.getElementById("musicGrid");

const audioBar = document.getElementById("audioBar");
const npTitle = document.getElementById("npTitle");
const npToggleBtn = document.getElementById("npToggleBtn");
const npCloseBtn = document.getElementById("npCloseBtn");
const audioPlayer = document.getElementById("audioPlayer");

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

    releases = !error && data && data.length > 0 ? data : defaultCatalog;
  } else {
    releases = defaultCatalog;
  }

  renderHero();
  renderGrid();
}

function renderHero() {
  const fIndex = releases.findIndex((item) => item.is_featured);
  const idx = fIndex !== -1 ? fIndex : 0;
  const item = releases[idx];
  if (!item) return;

  heroTitle.textContent = item.title;

  // Jika di Supabase Anda mengisi cover_url (atau url foto artis/sampul),
  // itu akan otomatis dijadikan background di bagian atas.
  if (item.cover_url) {
    heroSection.style.backgroundImage = `url('${encodeURI(item.cover_url)}')`;
  }

  heroPlayBtn.disabled = false;
  heroPlayBtn.onclick = () => playOrPause(idx);

  const links = [];
  if (item.spotify_url) links.push(`<a href="${escapeHTML(item.spotify_url)}" target="_blank" rel="noopener noreferrer">SPOTIFY</a>`);
  if (item.apple_url) links.push(`<a href="${escapeHTML(item.apple_url)}" target="_blank" rel="noopener noreferrer">APPLE MUSIC</a>`);
  if (item.youtube_url) links.push(`<a href="${escapeHTML(item.youtube_url)}" target="_blank" rel="noopener noreferrer">YOUTUBE MUSIC</a>`);
  if (links.length) heroDsps.innerHTML = links.join("");
}

function renderGrid() {
  musicGrid.innerHTML = releases
    .map((item, idx) => {
      const playing = idx === activeIdx && isPlaying;
      const bg = item.cover_url ? `style="background-image: url('${encodeURI(item.cover_url)}')"` : "";
      const fallback = item.cover_url
        ? ""
        : `<div class="card-cover-fallback">
             <span>ANDER</span>
             <strong>${escapeHTML(item.title)}</strong>
           </div>`;

      return `
        <div class="release-card ${playing ? "is-playing" : ""}">
          <div class="card-cover" ${bg}>
            ${fallback}
            <div class="card-overlay">
              <button class="overlay-btn" onclick="playOrPause(${idx})">
                ${playing ? "PAUSE" : "LISTEN"}
              </button>
            </div>
          </div>
          <div class="card-meta">
            <h3>${escapeHTML(item.title)}</h3>
            <p>${escapeHTML(item.release_type || "Single")} &bull; ${escapeHTML(item.release_year || "2026")}</p>
            <div class="card-links">
              ${item.spotify_url ? `<a href="${escapeHTML(item.spotify_url)}" target="_blank" rel="noopener noreferrer">SPOTIFY</a>` : ""}
              ${item.apple_url ? `<a href="${escapeHTML(item.apple_url)}" target="_blank" rel="noopener noreferrer">APPLE</a>` : ""}
              ${item.youtube_url ? `<a href="${escapeHTML(item.youtube_url)}" target="_blank" rel="noopener noreferrer">YOUTUBE</a>` : ""}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function stopPlayback(hideBar = false) {
  isPlaying = false;
  clearInterval(synthTimer);
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  npToggleBtn.textContent = "PLAY";
  if (hideBar) audioBar.classList.remove("active");
  renderGrid();
}

function startSynth() {
  const notes = [261.63, 329.63, 392.0, 329.63];
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  let step = 0;
  synthTimer = setInterval(() => {
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

function playOrPause(idx) {
  if (activeIdx === idx && isPlaying) {
    stopPlayback(false);
    return;
  }

  stopPlayback(false);
  activeIdx = idx;
  isPlaying = true;
  const item = releases[idx];

  npTitle.textContent = item.title;
  npToggleBtn.textContent = "PAUSE";
  audioBar.classList.add("active");
  renderGrid();

  if (item.audio_url) {
    audioPlayer.src = item.audio_url;
    audioPlayer.play();
    audioPlayer.onended = () => stopPlayback(false);
  } else {
    startSynth();
  }
}

npToggleBtn.addEventListener("click", () => {
  if (activeIdx !== -1) playOrPause(activeIdx);
});

npCloseBtn.addEventListener("click", () => {
  stopPlayback(true);
  activeIdx = -1;
});

init();
