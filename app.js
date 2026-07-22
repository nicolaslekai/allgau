/* Allgäu Environment — live data via Open-Meteo, GKD Bayern & Foto-Webcam.eu */

const LOCATIONS = {
  kempten:    { name: "Kempten",    lat: 47.7267, lon: 10.3139 },
  oberstdorf: { name: "Oberstdorf", lat: 47.4098, lon: 10.2792 },
  fuessen:    { name: "Füssen",     lat: 47.5714, lon: 10.7017 },
};

const WMO = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"], 45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"], 77: ["Snow grains", "❄️"],
  80: ["Light showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Violent showers", "⛈️"],
  85: ["Snow showers", "🌨️"], 86: ["Snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm, hail", "⛈️"], 99: ["Thunderstorm, hail", "⛈️"],
};

const COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const windCompass = (deg) => COMPASS[Math.round(deg / 22.5) % 16];

/* ---------- lakes ---------- */
/*
 * Live values come from the Bavarian Hydrological Service (GKD) station pages,
 * which publish 15-minute measurements as server-rendered HTML tables.
 * GKD sends no CORS headers, so fetches go through a public CORS proxy.
 * (The archive's own ingestion pipeline will replace the proxy later.)
 * alt = metres above sea level, area = km², depth = max depth in m (approx.).
 */
const GKD_BASE = "https://www.gkd.bayern.de/de/";

const LAKES = [
  {
    id: "forggensee", name: "Forggensee", alt: 781, area: 15.2, depth: 62,
    img: "images/free/forggensee_aerial.jpg", imgAlt: "Aerial view of Forggensee",
    gkd: { level: "seen/wasserstand/iller_lech/rosshaupten-seepegel-12001301" },
    note: "Germany's largest reservoir · full supply (Vollstau) 781.0 m ü. NN",
    vollstau: 781.0,
  },
  {
    id: "bodensee", name: "Bodensee — Lindau gauge", alt: 395, area: 536, depth: 254,
    img: "images/free/bodensee.jpg", imgAlt: "Lindau harbour on Lake Constance with the Mangturm tower",
    gkd: {
      temp:  "seen/wassertemperatur/iller_lech/lindau-20001001",
      level: "seen/wasserstand/iller_lech/lindau-20001001",
    },
    note: "Measured at Lindau harbour",
  },
  {
    id: "rottachsee", name: "Rottachsee", alt: 785, area: 2.96, depth: 25,
    img: "images/free/rottachsee.jpg", imgAlt: "Aerial view of the Rottachsee",
    gkd: {
      temp:  "seen/wassertemperatur/iller_lech/rottachsee-11444001",
      level: "seen/wasserstand/iller_lech/rottachsee-11444001",
    },
    note: "Drinking-water reservoir near Rettenberg",
  },
  {
    id: "gruentensee", name: "Grüntensee", alt: 873, area: 1.66, depth: 14,
    img: "images/free/gruentensee.jpg", imgAlt: "Aerial view of the Grüntensee",
    gkd: { level: "seen/wasserstand/iller_lech/gruentensee-seepegel-12403000" },
    note: "Near Oy-Mittelberg",
  },
  {
    id: "engeratsgundsee", name: "Engeratsgundsee", alt: 1876, area: 0.035, depth: 9,
    img: "images/free/engeratsgundsee.jpg", imgAlt: "Engeratsgundsee below the Großer Daumen",
    gkd: { temp: "seen/wassertemperatur/iller_lech/engeratsgundsee-11422003" },
    note: "High-alpine lake below the Großer Daumen, Oberstdorf",
  },
  {
    id: "laufbichelsee", name: "Laufbichelsee", alt: 2029, area: 0.03, depth: 8,
    img: "images/free/laufbichelsee.jpg", imgAlt: "Laufbichelsee in the Allgäu high Alps",
    gkd: { temp: "seen/wassertemperatur/iller_lech/laufbichelsee-11422006" },
    note: "One of the highest gauged lakes in Germany, Allgäu Alps",
  },
  /* — no public continuous gauge: metadata only — */
  { id: "grosser-alpsee", name: "Großer Alpsee", alt: 725, area: 2.47, depth: 23,
    img: "images/free/alpsee_aerial.jpg", imgAlt: "Aerial view of the Alpsee near Immenstadt",
    note: "Largest natural lake in the Allgäu" },
  { id: "bannwaldsee", name: "Bannwaldsee", alt: 786, area: 2.27, depth: 12,
    img: "images/free/bannwaldsee.jpg", imgAlt: "Bannwaldsee near Schwangau with mountain backdrop",
    note: "Near Schwangau, views of Neuschwanstein" },
  { id: "hopfensee", name: "Hopfensee", alt: 961, area: 1.94, depth: 10,
    img: "images/free/hopfensee.jpg", imgAlt: "Aerial view of the Hopfensee from the south",
    note: "Warm bathing lake at Hopfen am See" },
  { id: "weissensee", name: "Weissensee", alt: 927, area: 1.34, depth: 25,
    img: "images/free/weissensee.jpg", imgAlt: "Aerial view of the Weissensee from the southeast",
    note: "Fjord-like lake near Füssen" },
  { id: "niedersonthofener-see", name: "Niedersonthofener See", alt: 704, area: 1.35, depth: 13,
    img: "images/free/niedersonthofener-see.jpg", imgAlt: "Aerial view of Niedersonthofener See from the east",
    note: "Near Waltenhofen" },
  { id: "freibergsee", name: "Freibergsee", alt: 931, area: 0.18, depth: 25,
    img: "images/free/freibergsee.jpg", imgAlt: "Freibergsee above Oberstdorf",
    note: "Bathing lake above Oberstdorf" },
  { id: "alatsee", name: "Alatsee", alt: 796, area: 0.12, depth: 32,
    img: "images/free/alatsee.jpg", imgAlt: "Aerial view of the Alatsee from the southwest",
    note: "Meromictic lake near Füssen" },
  { id: "christlessee", name: "Christlessee", alt: 916, area: 0.09, depth: 20,
    img: "images/free/christlessee.jpg", imgAlt: "Christlessee in the Trettach valley near Oberstdorf",
    note: "In the Trettach valley, Oberstdorf" },
  { id: "schwaltenweiher", name: "Schwaltenweiher", alt: 813, area: 0.14, depth: 4,
    img: "images/free/schwaltenweiher.jpg", imgAlt: "Schwaltenweiher near Seeg in the Ostallgäu",
    note: "Near Seeg, Ostallgäu" },
  { id: "eschacher-weiher", name: "Eschacher Weiher", alt: 905, area: 0.05, depth: 6,
    img: "images/free/eschacher-weiher.jpg", imgAlt: "Eschacher Weiher in autumn near Buchenberg",
    note: "Near Buchenberg" },
];

/* ---------- webcams (Foto-Webcam.eu — free to embed with attribution) ---------- */

const WEBCAMS = [
  { slug: "nebelhorn",            title: "Nebelhorn summit",                 place: "Oberstdorf · 2,224 m · view SE" },
  { slug: "fellhorn",             title: "Fellhorn summit",                  place: "Oberstdorf · 2,037 m · view SE" },
  { slug: "skiflugschanze",       title: "Heini-Klopfer ski flying hill",    place: "Oberstdorf · view NE" },
  { slug: "sonthofen",            title: "Sonthofer Hof",                    place: "Sonthofen · view NW" },
  { slug: "tegelberg",            title: "Tegelberg — Füssen, Schwangau & Forggensee", place: "Schwangau · 1,720 m" },
  { slug: "hochgrat",             title: "Hochgrat",                         place: "Oberstaufen · 1,834 m · view N" },
  { slug: "oberstaufen",          title: "Haubers Naturresort",              place: "Oberstaufen · view SW" },
  { slug: "obermaiselstein",      title: "Großer Herrenberg",                place: "Obermaiselstein · view E" },
  { slug: "balderschwang-kreuzle",title: "Kreuzle",                          place: "Balderschwang · view W" },
  { slug: "sibratsgfaell",        title: "Sibratsgfäll",                     place: "Bregenzerwald / W. Allgäu · view SE" },
  { slug: "hanuselhof",           title: "Hanusel Hof",                      place: "Amtzell / Wangen · view E" },
];

const CAM_REFRESH_MS = 5 * 60 * 1000;

let forecastChart = null;
let currentLoc = "kempten";

/* ---------- fetch + render ---------- */

async function loadLocation(key) {
  currentLoc = key;
  const loc = LOCATIONS[key];
  document.getElementById("forecast-loc").textContent = loc.name;

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,snowfall_sum` +
    `&timezone=Europe%2FBerlin&forecast_days=7`;

  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide&timezone=Europe%2FBerlin`;

  try {
    const [w, a] = await Promise.all([
      fetch(weatherUrl).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(airUrl).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    ]);
    renderWeather(w);
    renderAir(a);
    renderForecast(w);
    document.getElementById("updated-at").textContent =
      new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    document.getElementById("weather-cards").innerHTML =
      `<div class="card"><p class="card-label">Live data unavailable</p>
       <p class="card-note">Could not reach Open-Meteo (${err.message}). Please reload to retry.</p></div>`;
  }
}

function card(label, value, unit, note) {
  return `<div class="card">
    <p class="card-label">${label}</p>
    <p class="card-value">${value}<small> ${unit}</small></p>
    ${note ? `<p class="card-note">${note}</p>` : ""}
  </div>`;
}

function renderWeather(w) {
  const c = w.current;
  const d = w.daily;
  const [desc, icon] = WMO[c.weather_code] || ["—", "·"];
  document.getElementById("weather-cards").innerHTML = [
    card("Temperature", c.temperature_2m.toFixed(1), "°C",
      `${icon} ${desc} · feels ${c.apparent_temperature.toFixed(1)}°`),
    card("Wind", c.wind_speed_10m.toFixed(0), "km/h", `from ${windCompass(c.wind_direction_10m)}`),
    card("Humidity", c.relative_humidity_2m, "%", ""),
    card("Pressure", c.surface_pressure.toFixed(0), "hPa", ""),
    card("UV index (max today)", d.uv_index_max[0].toFixed(1), "", uvNote(d.uv_index_max[0])),
    card("Precipitation", c.precipitation.toFixed(1), "mm",
      d.snowfall_sum[0] > 0 ? `❄️ ${d.snowfall_sum[0].toFixed(1)} cm snow today` : "last hour"),
  ].join("");
}

function uvNote(uv) {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  return "very high";
}

function renderAir(a) {
  const c = a.current;
  const [label, cls] = aqiLabel(c.european_aqi);
  document.getElementById("air-cards").innerHTML = [
    `<div class="card ${cls}">
       <p class="card-label">Air quality (European AQI)</p>
       <p class="card-value">${Math.round(c.european_aqi)}</p>
       <p class="card-note">${label}</p>
     </div>`,
    card("PM2.5", c.pm2_5.toFixed(1), "µg/m³", ""),
    card("PM10", c.pm10.toFixed(1), "µg/m³", ""),
    card("Ozone", c.ozone.toFixed(0), "µg/m³", ""),
    card("NO₂", c.nitrogen_dioxide.toFixed(1), "µg/m³", ""),
    card("SO₂", c.sulphur_dioxide.toFixed(1), "µg/m³", ""),
  ].join("");
}

function aqiLabel(v) {
  if (v <= 20) return ["Good", "card-aqi-good"];
  if (v <= 40) return ["Fair", "card-aqi-fair"];
  if (v <= 60) return ["Moderate", "card-aqi-mod"];
  if (v <= 80) return ["Poor", "card-aqi-poor"];
  return ["Very poor", "card-aqi-vpoor"];
}

function renderForecast(w) {
  const d = w.daily;
  const labels = d.time.map((t) =>
    new Date(t + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }));

  // day tiles
  document.getElementById("forecast-strip").innerHTML = d.time.map((t, i) => {
    const [desc, icon] = WMO[d.weather_code[i]] || ["—", "·"];
    const pp = d.precipitation_probability_max[i];
    return `<div class="day-tile" title="${desc}">
      <p class="dow">${new Date(t + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" })}</p>
      <p class="icon">${icon}</p>
      <p class="temps">${Math.round(d.temperature_2m_max[i])}° <span>${Math.round(d.temperature_2m_min[i])}°</span></p>
      ${pp != null && pp > 0 ? `<p class="precip">💧 ${pp}%</p>` : `<p class="precip">&nbsp;</p>`}
    </div>`;
  }).join("");

  // chart
  const ctx = document.getElementById("forecast-chart");
  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: "line", label: "High °C", data: d.temperature_2m_max,
          borderColor: "#d9663f", backgroundColor: "#d9663f", tension: 0.35, yAxisID: "y",
        },
        {
          type: "line", label: "Low °C", data: d.temperature_2m_min,
          borderColor: "#2f6f8f", backgroundColor: "#2f6f8f", tension: 0.35, yAxisID: "y",
        },
        {
          type: "bar", label: "Precip. probability %", data: d.precipitation_probability_max,
          backgroundColor: "rgba(47,111,143,0.25)", yAxisID: "y1", borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: { title: { display: true, text: "°C" }, grid: { color: "rgba(0,0,0,0.06)" } },
        y1: { position: "right", min: 0, max: 100, title: { display: true, text: "%" },
              grid: { drawOnChartArea: false } },
      },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

/* ---------- GKD live lake data ---------- */

/*
 * Primary source: data/lakes.json in the project repo, refreshed every 30 min
 * by the ingestion pipeline (GitHub Action). raw.githubusercontent.com is
 * CORS-open, so this works from any static host.
 * Fallback: scrape the GKD station pages live through a public CORS proxy.
 */
const LAKES_JSON =
  "https://raw.githubusercontent.com/nicolaslekai/allgau/main/data/lakes.json";

/* Fetch a URL, trying direct first, then a public CORS proxy (GKD sends no CORS headers). */
async function fetchWithProxy(url, timeoutMs = 12000) {
  const attempts = [
    (u) => u,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];
  let lastErr;
  for (const wrap of attempts) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(wrap(url), { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) { lastErr = err; }
  }
  throw lastErr;
}

/* Parse the latest row of a GKD tblsort measurement table → {value, unit, measured_at}.
   Handles 2-column tables and profiler tables (Datum + one value per depth;
   the shallowest depth is used). */
function parseGkdLatest(html) {
  const table = html.match(/<table[^>]*tblsort[^>]*>([\s\S]*?)<\/table>/i);
  if (!table) throw new Error("no table");
  const header = table[1].match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>\s*<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i);
  let unit = "";
  if (header) {
    const txt = header[1].replace(/<[^>]+>/g, "");
    const bracket = txt.match(/\[(.*?)\]/);
    unit = (bracket ? bracket[1] : txt).trim();
  }
  const rows = table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const r of rows) {
    const cells = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((c) => c[1].replace(/<[^>]+>/g, "").trim());
    if (cells.length < 2 || !/^\d{2}\.\d{2}\.\d{4}/.test(cells[0])) continue; // header
    for (const raw of cells.slice(1)) {
      const value = parseFloat(raw.replace(/\./g, "").replace(",", "."));
      if (!Number.isNaN(value)) {
        return { value, unit, measured_at: cells[0].replace(/\s*Uhr\s*$/, "").trim() };
      }
    }
    throw new Error("row without numeric value");
  }
  throw new Error("no data row");
}

async function gkdLatest(path) {
  const html = await fetchWithProxy(GKD_BASE + path + "/messwerte");
  return parseGkdLatest(html);
}

/* Load the archived snapshot; returns null when unavailable.
   Same-origin first (works on GitHub Pages and local dev), GitHub raw as fallback. */
async function loadLakesSnapshot() {
  for (const url of ["data/lakes.json", LAKES_JSON]) {
    try {
      const res = await fetch(url + "?r=" + Date.now());
      if (res.ok) return await res.json();
    } catch { /* try next */ }
  }
  return null;
}

const fmtDE = (v, dec = 1) => v.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function lakeCard(l, live) {
  const liveStats = [];
  if (live.temp) {
    liveStats.push(`<p class="lake-stat">${fmtDE(live.temp.value)}°C
      <span class="lake-dim">water temp · ${live.temp.measured_at}</span></p>`);
  }
  if (live.level) {
    let levelNote = `level · ${live.level.measured_at}`;
    if (l.vollstau && live.level.unit.includes("NN")) {
      const diff = Math.round((l.vollstau - live.level.value) * 100);
      levelNote = diff > 0 ? `${diff} cm below full supply` : `${-diff} cm above full supply`;
    }
    liveStats.push(`<p class="lake-stat small">${fmtDE(live.level.value, live.level.unit.includes("NN") ? 2 : 0)}
      <span class="lake-dim">${live.level.unit || "level"} · ${levelNote}</span></p>`);
  }
  const isLive = live.temp || live.level;
  const statsHtml = isLive
    ? liveStats.join("")
    : l.gkd
      ? `<p class="lake-stat small lake-nogauge">Gauge currently offline</p>
         <p class="lake-dim">Seasonal profiler buoy — the archive records it automatically when it reports again.</p>`
      : `<p class="lake-stat small lake-nogauge">No public continuous gauge</p>
         <p class="lake-dim">The archive records the GKD network; ungauged lakes are covered by weekly LfU bathing-temp checks in summer.</p>`;

  return `<article class="lake-card">
    ${l.img ? `<img src="${l.img}" alt="${l.imgAlt}" loading="lazy">` : ""}
    <div class="lake-body">
      <h3>${l.name} ${isLive ? '<span class="live-badge"><span class="live-dot"></span>LIVE</span>' : ""}</h3>
      ${statsHtml}
      <p class="lake-meta">${l.alt.toLocaleString("en-GB")} m a.s.l. · ${l.area} km² · max ${l.depth} m deep</p>
      <p class="lake-note">${l.note}</p>
      ${isLive ? `<p class="lake-src">Source: <a href="${GKD_BASE}${(l.gkd.temp || l.gkd.level)}/messwerte" target="_blank" rel="noopener">GKD Bayern</a>, 15-min values</p>` : ""}
    </div>
  </article>`;
}

async function loadLakes() {
  const grid = document.getElementById("lake-grid");
  // render immediately with placeholders, then fill in live values as they arrive
  grid.innerHTML = LAKES.map((l) => lakeCard(l, {})).join("");

  // 1) archived snapshot from the ingestion pipeline (fast, reliable, CORS-open)
  const snapshot = await loadLakesSnapshot();
  const snapshotLakes = snapshot ? snapshot.lakes : {};

  await Promise.all(LAKES.map(async (l, i) => {
    if (!l.gkd) return;
    const live = {};
    const snap = snapshotLakes[l.id] || {};
    for (const kind of ["temp", "level"]) {
      if (!l.gkd[kind]) continue;
      if (snap[kind]) { live[kind] = snap[kind]; continue; }
      // 2) fallback: scrape GKD live through a CORS proxy
      try { live[kind] = await gkdLatest(l.gkd[kind]); } catch { /* leave absent */ }
    }
    const cards = grid.children;
    if (cards[i]) cards[i].outerHTML = lakeCard(l, live);
  }));
}

/* ---------- webcams ---------- */

const camImg = (slug, w = 640) => `https://www.foto-webcam.eu/webcam/${slug}/current/${w}.jpg`;
const camPage = (slug) => `https://www.foto-webcam.eu/webcam/${slug}/`;

function renderWebcams() {
  document.getElementById("webcam-grid").innerHTML = WEBCAMS.map((c) => `
    <figure class="cam-card">
      <a href="${camPage(c.slug)}" target="_blank" rel="noopener">
        <img src="${camImg(c.slug)}" alt="Live webcam: ${c.title}, ${c.place}" loading="lazy"
             data-cam="${c.slug}" onerror="this.closest('.cam-card').classList.add('cam-off')">
      </a>
      <figcaption>
        <strong>${c.title}</strong>
        <span>${c.place}</span>
      </figcaption>
    </figure>`).join("");
}

function refreshWebcams() {
  const bust = Date.now();
  document.querySelectorAll("img[data-cam]").forEach((img) => {
    img.src = `${camImg(img.dataset.cam)}?r=${bust}`;
  });
  document.getElementById("cams-updated").textContent =
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/* ---------- long-term trend chart (real ERA5 data from the archive) ---------- */

/*
 * Monthly mean temperatures, 1940–today, backfilled by pipeline/backfill_trends.py
 * from the ERA5 reanalysis (Open-Meteo archive API) and refreshed monthly.
 * The JSON lives in the repo: data/trends/<loc>.monthly.json
 */
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BASELINE_START = 1961, BASELINE_END = 1990;

let trendChart = null;
let trendMonth = 7;          // 1–12, or 0 for annual mean
let trendData = null;        // { months: {"YYYY-MM": value} } for currentLoc
const trendCache = {};

async function loadTrend(locKey) {
  if (trendCache[locKey]) { trendData = trendCache[locKey]; renderTrend(); return; }
  const rel = `data/trends/${locKey}.monthly.json`;
  const raw = `https://raw.githubusercontent.com/nicolaslekai/allgau/main/${rel}`;
  for (const url of [rel, raw]) {
    try {
      const res = await fetch(url + "?r=" + Date.now());
      if (res.ok) {
        trendCache[locKey] = await res.json();
        trendData = trendCache[locKey];
        renderTrend();
        return;
      }
    } catch { /* try next */ }
  }
  document.getElementById("trend-title").textContent =
    "Trend data not archived yet — the pipeline backfills it monthly.";
}

/* yearly mean for the selected month (or annual mean for month 0) */
function trendSeries() {
  const byYear = {};
  for (const [ym, v] of Object.entries(trendData.months)) {
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    if (trendMonth === 0) {
      (byYear[y] = byYear[y] || []).push(v);
    } else if (m === trendMonth) {
      byYear[y] = [v];
    }
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  // annual mean only for years with all 12 months
  const vals = years.map((y) =>
    byYear[y].length === (trendMonth === 0 ? 12 : 1)
      ? byYear[y].reduce((a, b) => a + b, 0) / byYear[y].length
      : null);
  return { years, vals };
}

function movingAverage(years, vals, half = 5) {
  return years.map((_, i) => {
    let s = 0, n = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < vals.length && vals[j] != null) { s += vals[j]; n++; }
    }
    return n ? +(s / n).toFixed(2) : null;
  });
}

function linearTrend(years, vals) {
  const pts = years.map((y, i) => [y, vals[i]]).filter(([, v]) => v != null);
  const n = pts.length;
  if (n < 10) return null;
  const sx = pts.reduce((a, [x]) => a + x, 0), sy = pts.reduce((a, [, v]) => a + v, 0);
  const sxx = pts.reduce((a, [x]) => a + x * x, 0), sxy = pts.reduce((a, [x, v]) => a + x * v, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { slope, delta: slope * (pts[n - 1][0] - pts[0][0]) };
}

function renderTrend() {
  if (!trendData) return;
  const { years, vals } = trendSeries();
  const smooth = movingAverage(years, vals);
  const trend = linearTrend(years, vals);

  const label = trendMonth === 0 ? "Annual mean" : `Mean ${MONTH_NAMES[trendMonth - 1]}`;
  const firstYear = years.find((_, i) => vals[i] != null);
  const lastYear = [...years].reverse().find((_, i) => vals[years.length - 1 - i] != null);
  document.getElementById("trend-title").textContent =
    `${label} temperature · ${trendData.name} · ${firstYear}–${lastYear}`;

  const base = (() => {
    const b = years.map((y, i) => (y >= BASELINE_START && y <= BASELINE_END) ? vals[i] : null)
      .filter((v) => v != null);
    return b.length ? b.reduce((a, v) => a + v, 0) / b.length : null;
  })();
  const parts = [];
  if (base != null) parts.push(`${BASELINE_START}–${BASELINE_END} mean: ${fmtDE(base)} °C`);
  if (trend) parts.push(`linear trend: ${trend.delta >= 0 ? "+" : ""}${fmtDE(trend.delta)} °C since ${firstYear}`);
  parts.push("ERA5 reanalysis via Open-Meteo · backfilled by the archive pipeline");
  document.getElementById("trend-sub").textContent = parts.join("  ·  ");

  const ctx = document.getElementById("trend-chart");
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: `${label} °C (per year)`,
          data: vals,
          borderColor: "rgba(127,179,200,0.45)",
          backgroundColor: "rgba(127,179,200,0.08)",
          borderWidth: 1, pointRadius: 0, tension: 0.3, fill: true,
        },
        {
          label: "11-year mean",
          data: smooth,
          borderColor: "#e8a04c",
          backgroundColor: "#e8a04c",
          borderWidth: 2.5, pointRadius: 0, tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { ticks: { color: "rgba(238,244,241,0.6)", maxTicksLimit: 12 },
             grid: { color: "rgba(255,255,255,0.06)" } },
        y: { ticks: { color: "rgba(238,244,241,0.6)" },
             grid: { color: "rgba(255,255,255,0.06)" },
             title: { display: true, text: "°C", color: "rgba(238,244,241,0.6)" } },
      },
      plugins: { legend: { labels: { color: "rgba(238,244,241,0.8)" } } },
    },
  });
}

/* ---------- hero wireframe reveal (cursor-follow) ---------- */

/*
 * The hero shows the Nebelhorn photograph; a wireframe render of the same
 * scene (images/hero_wireframe.jpg, generated with the illustration pipeline)
 * is unmasked inside a cursor-following zone. The layer only activates when
 * the asset actually loads — without it, the hero is just the photo + grid.
 */
function initHeroWire() {
  const hero = document.querySelector(".hero");
  const wire = document.querySelector(".hero-wire");
  if (!hero || !wire) return;
  if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;

  const img = new Image();
  img.onload = () => {
    wire.style.setProperty("--hero-wire-img", `url("${img.src}")`);
    hero.classList.add("wire-on");
  };
  img.src = "images/hero_wireframe.jpg";

  let tx = 0.62, ty = 0.38, cx = tx, cy = ty, raf = null;
  const tick = () => {
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    wire.style.setProperty("--mx", (cx * 100).toFixed(2) + "%");
    wire.style.setProperty("--my", (cy * 100).toFixed(2) + "%");
    const ret = document.querySelector(".hero-reticle");
    if (ret) {
      ret.style.setProperty("--mx", (cx * 100).toFixed(2) + "%");
      ret.style.setProperty("--my", (cy * 100).toFixed(2) + "%");
    }
    if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) raf = requestAnimationFrame(tick);
    else raf = null;
  };
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(tick);
  });
}

/* ---------- wiring ---------- */

document.getElementById("location-switch").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll("#location-switch .chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  loadLocation(btn.dataset.loc);
  loadTrend(btn.dataset.loc);
});

document.getElementById("month-switch").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll("#month-switch .chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  trendMonth = +btn.dataset.month;
  renderTrend();
});

window.addEventListener("scroll", () => {
  document.getElementById("nav").classList.toggle("scrolled", window.scrollY > 40);
});

loadLocation(currentLoc);
loadLakes();
renderWebcams();
refreshWebcams();
setInterval(refreshWebcams, CAM_REFRESH_MS);
loadTrend(currentLoc);
initHeroWire();
