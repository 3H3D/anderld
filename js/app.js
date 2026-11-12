// =========================================================================
// KONTROL SUPABASE (AMAN UNTUK GITHUB PUBLIK DENGAN RLS AKTIF)
// =========================================================================
const SUPABASE_URL = "https://PROJECT_ID_ANDA.supabase.co";
const SUPABASE_ANON_KEY = "SUPABASE_ANON_PUBLIC_KEY_ANDA";

const supabaseClient =
  SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PROJECT_ID_ANDA")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const fallbackTracks = [
  { id: "1", title: "TORU RE", release_type: "Single", release_year: "2026", spotify_url: "https://open.spotify.com", youtube_url: "https://music.youtube.com" },
  { id: "2", title: "Kwiregtori", release_type: "Single", release_year: "2026", spotify_url: "https://open.spotify.com", youtube_url: "https://music.youtube.com" },
  { id: "3", title: "Sogdai Ya", release_type: "Single", release_year: "2026", spotify_url: "https://open.spotify.com", youtube_url: "https://music.youtube.com" }
];

let tracks = [];
let currentIndex = -1;
let isPlaying = false;
let audioCtx = null;
let synthInterval = null;

const releaseStack = document.getElementById("releaseStack");
const miniPlayer = document.getElementById("miniPlayer");
const playerTitle = document.getElementById("playerTitle");
const playerStatus = document.getElementById("playerStatus");
const playToggleBtn = document.getElementById("playToggleBtn");
const closePlayerBtn = document.getElementById("closePlayerBtn");
const audioElement = document.getElementById("audioElement");

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

    tracks = !error && data && data.length > 0 ? data : fallbackTracks;
  } else {
    tracks = fallbackTracks;
  }

  renderReleases();
}

function renderReleases() {
  releaseStack.innerHTML = tracks
    .map((track, idx) => {
      const playing = idx === currentIndex && isPlaying;
      return `
        <div class="release-row">
          <div class="release-info">
            <h3>${escapeHTML(track.title)}</h3>
            <span>${escapeHTML(track.release_type || "Single")} &bull; ${escapeHTML(track.release_year || "2026")}</span>
          </div>
          <div class="release-actions">
            <button class="btn-play" onclick="toggleTrack(${idx})">
              ${playing ? "Jeda" : "Putar"}
            </button>
            <div class="dsp-links">
              ${track.spotify_url ? `<a href="${escapeHTML(track.spotify_url)}" target="_blank" rel="noopener">Spotify</a>` : ""}
              ${track.youtube_url ? `<a href="${escapeHTML(track.youtube_url)}" target="_blank" rel="noopener">YouTube</a>` : ""}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function stopAudio() {
  isPlaying = false;
  clearInterval(synthInterval);
  audioElement.pause();
  audioElement.currentTime = 0;
  miniPlayer.classList.remove("visible");
  renderReleases();
}

function playSynth() {
  const notes = [261.63, 329.63, 392.0, 329.63];
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();

  let step = 0;
  synthInterval = setInterval(() => {
    if (!isPlaying) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = notes[step % notes.length];
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.55);
    step++;
  }, 600);
}

function toggleTrack(idx) {
  if (currentIndex === idx && isPlaying) {
    stopAudio();
    return;
  }

  stopAudio();
  currentIndex = idx;
  isPlaying = true;
  const track = tracks[idx];

  playerTitle.textContent = track.title;
  playerStatus.textContent = "Memutar pratinjau";
  playToggleBtn.textContent = "Jeda";
  miniPlayer.classList.add("visible");
  renderReleases();

  if (track.audio_url) {
    audioElement.src = track.audio_url;
    audioElement.play();
    audioElement.onended = stopAudio;
  } else {
    playSynth();
  }
}

playToggleBtn.addEventListener("click", () => {
  if (currentIndex !== -1) {
    if (isPlaying) {
      stopAudio();
      playToggleBtn.textContent = "Putar";
    } else {
      toggleTrack(currentIndex);
    }
  }
});

closePlayerBtn.addEventListener("click", () => {
  stopAudio();
  currentIndex = -1;
});

init();
