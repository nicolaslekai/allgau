# Allgäu Environment

### The open environmental data archive for the Allgäu region

*v4 — July 2026. Supersedes v3: the project is now positioned archive-first.*

---

## What Is This?

**Allgäu Environment** is an open, continuously growing **archive of
environmental measurements** for the Allgäu region in southern Germany — with
a website that makes the data immediately useful to everyone.

The re-ordering of those two things is the core of v4. The website is the
front door; the archive is the product. A well-designed page showing today's
lake temperature is useful for a weekend; a clean, unified record of every
lake temperature since the archive started — plus reanalysis data back to
1940 — is useful for decades.

Three principles follow from that:

1. **The ingestion pipeline comes first.** Every source we add starts
   recording from the day it lands. Frontend polish can happen at leisure;
   missed measurements are gone forever.
2. **Data access is a first-class product feature.** Public, stable URLs for
   every dataset, bulk downloads (CSV now, Parquet as the archive grows), and
   clear licensing — not an afterthought behind the charts.
3. **Backfill wherever history exists.** Sources like ERA5 and DWD CDC carry
   decades of history. The archive should never start empty when it doesn't
   have to.

---

## What Exists Today (July 2026)

Live at **https://nicolaslekai.github.io/allgau/** — static site, no build
step, hosted on GitHub Pages from the same repository that holds the archive.

| Piece | Status |
|-------|--------|
| **Ingestion pipeline** | GitHub Action fetches all GKD gauges (lakes + Iller river) every ~30 min; snapshot (`data/lakes.json`) + append-only time series (`data/timeseries/lakes.csv`) committed to the repo. Survives partial and total source outages (last-good snapshot kept, loud failure). |
| **Lakes** | 16 Allgäu lakes with photos; 4 live gauges, 2 seasonal profiler buoys, 10 metadata-only. |
| **Rivers** | Iller gauges at Kempten and Sonthofen — water temperature, level, discharge, 15-min values. |
| **Weather & air** | Live conditions, 7-day forecast, and CAMS air quality for Kempten / Oberstdorf / Füssen via Open-Meteo (CORS-open, no key). |
| **Long-term trends** | Real ERA5 monthly means 1940–today per location (`data/trends/*.monthly.json`), backfilled by `pipeline/backfill_trends.py`, extended monthly by a scheduled workflow. Month selector, 11-year mean, linear trend vs. the 1961–1990 baseline. |
| **Webcams** | 11 foto-webcam.eu cams (free embed with attribution), 5-min refresh. |
| **Design** | Lake-blue/turquoise palette, Nano Banana Pro illustration set (shared seed 470010), WebGL "water drop" hero lens with CSS fallback. |

The repository **is** the archive today: raw.githubusercontent.com serves
every dataset CORS-open at a stable URL. That is deliberately simple and will
carry the project for a long time before a database is warranted.

---

## Data Access (first-class)

Every dataset the site displays is downloadable at a stable URL:

| Dataset | URL (stable) | Format |
|---------|--------------|--------|
| Latest gauge snapshot | `data/lakes.json` | JSON |
| Full gauge time series | `data/timeseries/lakes.csv` | CSV, append-only |
| Monthly temperature record per town | `data/trends/<loc>.monthly.json` | JSON, 1940–today |

Planned: Parquet exports once the CSV grows past comfortable size, a small
JSON index of all datasets, and per-dataset documentation pages.

### Licensing (verified July 2026)

- **GKD Bayern measurement data** (all lake and river gauges): licensed
  **CC BY 4.0**. Required attribution: *"Datenquelle: Bayerisches Landesamt
  für Umwelt, www.lfu.bayern.de"*. Redistribution — including our archive and
  bulk downloads — is explicitly permitted, commercial use included. The
  attribution is baked into the site footer and into every snapshot the
  pipeline writes.
- **LfU Bayern website content** (e.g. the weekly bathing-water temperature
  pages): general site content is conventional copyright, **not** CC — only
  LfU's dedicated open-data/download services carry open licenses. Before the
  weekly bathing temps become a redistributed dataset, use an LfU open-data
  endpoint where one exists or get written confirmation. Until then the site
  may display current values with attribution but should not offer them as
  bulk downloads.
- **ERA5 / Open-Meteo**: open (CC BY 4.0 / Open-Meteo terms), attribution in
  place.
- **Foto-Webcam.eu**: embedding permitted with attribution; images are hotlinked,
  never archived by us.

---

## Data Covered

| Category | Variables | Status |
|----------|-----------|--------|
| **Weather** | Temperature, rain, snow, wind, humidity, pressure, UV | live (model data) |
| **Lakes** | Water temperature, levels | live + archived |
| **Rivers** | Water temperature, level, discharge (Iller) | live + archived |
| **Climate record** | Monthly means 1940–today (ERA5) | archived, monthly refresh |
| **Air quality** | European AQI, PM2.5, PM10, O₃, NO₂, SO₂ | live (CAMS) |
| **Groundwater** | Levels (LfU wells) | planned |
| **Fires** | Active fire detections (NASA FIRMS) | planned |
| **Vegetation** | NDVI / snow cover (Sentinel-2) | planned |

---

## Target Audiences

### 1. Residents and Visitors
One clean page for the practical questions: swimmable? stormy? snow? air OK?
Served by the live layers — no login, no app install required.

### 2. Researchers, Journalists, Educators
The archive audience. Decade-scale questions — lake warming, groundwater
response to low-snow winters, temperature shift vs. the 1961–1990 baseline —
answered with downloadable, cleanly licensed, continuously extended datasets.

---

## How It Works

```
Public data sources (GKD/LfU, Open-Meteo/ERA5, DWD, Copernicus, NASA)
        |
        v
  Ingestion pipeline  — scheduled GitHub Actions, retry + last-good logic
        |
        v
  Archive in the repo — JSON snapshots, append-only CSV, monthly JSON
        |                (stable raw URLs, CORS-open, CC BY 4.0 attribution)
        v
  Website             — static, no build step; reads the archive first,
                        falls back to live scraping through a CORS proxy
```

---

## Roadmap (ordered)

1. **More sources into the pipeline** — LfU groundwater wells; DWD CDC
   station backfill (decades of daily station data for Kempten/Oberstdorf);
   LfU weekly bathing temps *after* the licensing question above is settled.
2. **Dataset index + docs** — one JSON/page listing every dataset, its URL,
   update cadence, and license.
3. **Parquet exports** when CSV size warrants it.
4. **Groundwater section** on the site once the data flows.
5. **Satellite layers** (NDVI, snow cover) — archive first, visuals second.

---

## Summary

| Aspect | Detail |
|--------|--------|
| **What** | An open environmental data **archive** for the Allgäu, with a public website as its front door |
| **Strategy** | Archive-first: pipeline before polish, backfill wherever history exists |
| **Data access** | Stable URLs, bulk downloads, verified licensing (CC BY 4.0 with LfU attribution) |
| **Live today** | Weather, air, 16 lakes, Iller river gauges, webcams, 1940– climate record |
| **Stack** | Static site + GitHub Actions + repo-as-archive; no servers, no database yet |
| **Audiences** | Residents & visitors (live layers) · researchers & journalists (the archive) |

---

*July 2026 — v4*
