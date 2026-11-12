// =========================================================================
// KONFIGURASI SUPABASE (GUNAKAN HANYA PROJECT URL & ANON PUBLIC KEY)
// =========================================================================
const SUPABASE_URL = "https://PROJECT_ID_ANDA.supabase.co";
const SUPABASE_ANON_KEY = "SUPABASE_ANON_PUBLIC_KEY_ANDA";

const supabaseClient =
  SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PROJECT_ID_ANDA")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const fallbackTracks = [
  {
    id: "1",
    title: "TORU RE",
    release_type: "Single",
    release_year: "2026",
    cover_url: "",
    audio_url: "",
    spotify_url: "https://open.spotify.com",
    youtube_url: "https://music.youtube.com",
    apple_url: "https://music.apple.com",
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
    youtube_url: "https://music.youtube.com",
    apple_url: "https://music.apple.com",
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
    youtube_url: "https://music.youtube.com",
    apple_url: "https://music.apple.com",
    is_featured: false
  }
];

let tracks = [];
let currentIndex = -1;
let isPlaying = false;
let audioCtx = null;
let synthInterval = null;
let progressInterval = null;
let progress = 0;

// DOM Elements
const siteHeader = document.getElementById("siteHeader");
const heroBackdrop = document.getElementById("heroBackdrop");
const heroTrackTitle = document.getElementById("heroTrackTitle");
const heroPlayBtn = document.getElementById("heroPlayBtn");
const discographyGrid = document.getElementById("discographyGrid");

const spotlightArt = document.getElementById("spotlightArt");
const spotlightArtTitle = document.getElementById("spotlightArtTitle");
const spotlightTitle = document.getElementById("spotlightTitle");
const spotlightMeta = document.getElementById("spotlightMeta");
const spotlightDsps = document.getElementById("spotlightDsps");

const dockPlayer = document.getElementById("dockPlayer");
const dockThumb = document.getElementById("dockThumb");
const dockTitle = document.getElementById("dockTitle");
const dockToggleBtn = document.getElementById("dockToggleBtn");
const dockProgressFill = document.getElementById("dockProgressFill");
const dockCloseBtn = document.getElementById("dockCloseBtn");
const realAudio = document.getElementById("realAudioPlayer");

document.getElementById("year").textContent = new Date().getFullYear();

// Header blur on scroll
window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    siteHeader.classList.add("scrolled");
  } else {
    siteHeader.classList.remove("scrolled");
  }
});

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

async function initArtistSite() {
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

  renderFeaturedHeroAndSpotlight();
  renderDiscographyGrid();
}

function renderFeaturedHeroAndSpotlight() {
  const featuredIdx = tracks.findIndex((t) => t.is_featured);
  const idx = featuredIdx !== -1 ? featuredIdx : 0;
  const featured = tracks[idx];
  if (!featured) return;

  // Hero Update
  heroTrackTitle.textContent = featured.title;
  if (featured.cover_url) {
    heroBackdrop.style.backgroundImage = `url('${encodeURI(featured.cover_url)}')`;
  }
  heroPlayBtn.disabled = false;
  heroPlayBtn.onclick = () => toggleTrack(idx);

  // Spotlight Update
  spotlightTitle.textContent = featured.title;
  spotlightArtTitle.textContent = featured.title;
  spotlightMeta.textContent = `${featured.release_type || "Single"} • ${featured.release_year || "2026"} • Ferwap Music Entertainment`;

  if (featured.cover_url) {
    spotlightArt.style.backgroundImage = `url('${encodeURI(featured.cover_url)}')`;
    spotlightArt.classList.add("has-img");
  }

  const dspButtons = [];
  if (featured.spotify_url) {
    dspButtons.push(`<a href="${escapeHTML(featured.spotify_url)}" target="_blank" rel="noopener noreferrer" class="dsp-pill">Spotify</a>`);
  }
  if (featured.apple_url) {
    dspButtons.push(`<a href="${escapeHTML(featured.apple_url)}" target="_blank" rel="noopener noreferrer" class="dsp-pill">Apple Music</a>`);
  }
  if (featured.youtube_url) {
    dspButtons.push(`<a href="${escapeHTML(featured.youtube_url)}" target="_blank" rel="noopener noreferrer" class="dsp-pill">YouTube Music</a>`);
  }
  if (dspButtons.length > 0) {
    spotlightDsps.innerHTML = dspButtons.join("");
  }
}

function renderDiscographyGrid() {
  discographyGrid.innerHTML = tracks
    .map((track, idx) => {
      const playing = idx === currentIndex && isPlaying;
      const bgStyle = track.cover_url ? `style="background-image: url('${encodeURI(track.cover_url)}')"` : "";
      const placeholder = track.cover_url
        ? ""
        : `<div class="album-cover-placeholder">
             <span>ANDER</span>
             <strong>${escapeHTML(track.title)}</strong>
           </div>`;

      return `
        <article class="album-card ${playing ? "playing" : ""}">
          <div class="album-cover" ${bgStyle}>
            ${placeholder}
            <div class="cover-play-overlay">
              <button class="circle-play" data-idx="${idx}" aria-label="Putar ${escapeHTML(track.title)}">
                ${playing ? "&#10074;&#10074;" : "&#9654;"}
              </button>
            </div>
          </div>
          <div class="album-body">
            <h3>${escapeHTML(track.title)}</h3>
            <span class="album-sub">${escapeHTML(track.release_type || "Single")} &bull; ${escapeHTML(track.release_year || "2026")}</span>
            <div class="album-dsps">
              ${track.spotify_url ? `<a href="${escapeHTML(track.spotify_url)}" target="_blank" rel="noopener noreferrer" class="dsp-mini">Spotify</a>` : ""}
              ${track.apple_url ? `<a href="${escapeHTML(track.apple_url)}" target="_blank" rel="noopener noreferrer" class="dsp-mini">Apple</a>` : ""}
              ${track.youtube_url ? `<a href="${escapeHTML(track.youtube_url)}" target="_blank" rel="noopener noreferrer" class="dsp-mini">YouTube</a>` : ""}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".circle-play").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleTrack(Number(btn.getAttribute("data-idx")));
    });
  });
}

function stopAudio(hideDock = false) {
  isPlaying = false;
  clearInterval(synthInterval);
  clearInterval(progressInterval);
  realAudio.pause();
  realAudio.currentTime = 0;
  progress = 0;
  dockProgressFill.style.width = "0%";
  dockToggleBtn.innerHTML = "&#9654;";
  if (hideDock) {
    dockPlayer.classList.add("hidden");
  }
  renderDiscographyGrid();
}

function playSynthPreview() {
  const notes = [261.63, 329.63, 392.0, 493.88];
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let step = 0;
  const playNote = () => {
    if (!isPlaying) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = notes[step % notes.length];
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.58);
    step++;
  };

  playNote();
  synthInterval = setInterval(playNote, 600);
}

function toggleTrack(idx) {
  if (currentIndex === idx && isPlaying) {
    stopAudio(false);
    return;
  }

  stopAudio(false);
  currentIndex = idx;
  isPlaying = true;
  const track = tracks[idx];

  dockTitle.textContent = track.title;
  dockThumb.style.backgroundImage = track.cover_url ? `url('${encodeURI(track.cover_url)}')` : "";
  dockToggleBtn.innerHTML = "&#10074;&#10074;";
  dockPlayer.classList.remove("hidden");
  renderDiscographyGrid();

  if (track.audio_url) {
    realAudio.src = track.audio_url;
    realAudio.play();
    realAudio.ontimeupdate = () => {
      if (realAudio.duration) {
        dockProgressFill.style.width = `${(realAudio.currentTime / realAudio.duration) * 100}%`;
      }
    };
    realAudio.onended = () => stopAudio(false);
  } else {
    playSynthPreview();
    progress = 0;
    progressInterval = setInterval(() => {
      progress += 2;
      dockProgressFill.style.width = `${progress}%`;
      if (progress >= 100) stopAudio(false);
    }, 300);
  }
}

dockToggleBtn.addEventListener("click", () => {
  if (currentIndex !== -1) toggleTrack(currentIndex);
});

dockCloseBtn.addEventListener("click", () => {
  stopAudio(true);
  currentIndex = -1;
});

initArtistSite();
