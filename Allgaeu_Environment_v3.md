# Allgäu Environment

### A Website and App for Environmental Information in the Allgäu Region

---

## What Is This?

**Allgäu Environment** is a website and app that brings together publicly
available environmental data about the Allgäu region in southern Germany. It
provides current conditions, short-term forecasts, and historical records —
all in one place, through a clean and visually appealing interface.

The product is designed to be equally useful for someone checking lake
temperatures before a weekend trip and for a researcher exploring decade-long
groundwater trends. Good design, clear visuals, and intuitive navigation are
as important as the underlying data.

Behind the scenes, the platform continuously records incoming data to build a
growing historical archive.

---

## Data Covered

The platform would collect and present the following, where publicly available:

| Category | Variables |
|----------|-----------|
| **Weather** | Temperature, rainfall, snow, storms, humidity, UV index, wind, air pressure, solar radiation |
| **Lakes** | Water temperature, water levels |
| **Groundwater** | Groundwater levels |
| **Air quality** | PM2.5, PM10, O₃, SO₂, NO₂ |
| **Fires** | Active fire detections |
| **Vegetation** | Satellite imagery (NDVI, land surface changes) |

---

## What the Platform Provides

For each data category, three layers of information:

| Layer | Description |
|-------|-------------|
| **Current conditions** | What is happening right now |
| **Short-term forecast** | What is expected in the coming hours/days (from official forecast sources) |
| **Historical record** | What happened in the past — recorded continuously by the platform |

The historical archive grows over time, making it increasingly useful for
spotting trends and anomalies.

---

## Target Audiences

### 1. Residents and Visitors

People living in or visiting the Allgäu who want practical, up-to-date
environmental information in one place.

**Typical use cases:**

- Check current weather, lake temperature, and air quality before planning
  outdoor activities (swimming, hiking, cycling, skiing)
- See if storms or poor air quality are expected
- Look up UV index or snow conditions
- Quickly understand current environmental conditions without visiting
  multiple websites

### 2. Researchers and the General Public (Long-term Trends)

People interested in how the environment is changing over time — whether for
scientific study, journalism, education, or personal awareness.

**Typical use cases:**

- Explore how average temperatures have shifted over years
- Track groundwater level trends
- Observe whether lakes are warming
- Compare current conditions to historical baselines
- Raise awareness of long-term environmental changes that may be related
  to climate change
- Access downloadable datasets for further analysis

---

## How It Works

1. **Collect** — Scheduled jobs periodically download data from public sources
   (weather services, environment agencies, satellite providers)
2. **Store** — All data is recorded in a database, building the historical
   archive over time
3. **Present** — The website and app display current conditions, forecasts, and
   historical context through well-designed, interactive interfaces

```
Public data sources (DWD, LfU, Copernicus, UBA, NASA)
        |
        v
  Ingestion pipeline (scheduled downloads)
        |
        v
  Database (time-series archive)
        |
        v
  Website & App (designed for clarity and ease of use)
```

Key product qualities:

- **Visually compelling** — clear charts, maps, and summaries that make data
  immediately understandable
- **Accessible** — usable by anyone, not just technical users; no jargon
  required
- **Responsive** — works well on phones, tablets, and desktops
- **Depth on demand** — simple overview by default, with the ability to dig
  into detailed data and download datasets for research

---

## Data Sources

All data comes from publicly available official sources:

### Weather & Climate

| Source | Description | URL |
|--------|-------------|-----|
| DWD Open Data | German Weather Service — station data, radar, forecasts | https://opendata.dwd.de/ |
| DWD CDC | Climate Data Center — historical climate records | https://cdc.dwd.de/portal/ |
| Open-Meteo | Free weather API (aggregates DWD and others) | https://open-meteo.com/ |
| Bright Sky | Developer-friendly API for DWD data | https://brightsky.dev/ |

### Water (Lakes & Groundwater)

| Source | Description | URL |
|--------|-------------|-----|
| Bavarian Hydrological Service (GKD) | Water levels, discharge, water temperature | https://www.gkd.bayern.de/ |
| LfU Bayern | Lake temperatures, groundwater levels | https://www.lfu.bayern.de/ |

### Air Quality

| Source | Description | URL |
|--------|-------------|-----|
| Umweltbundesamt (UBA) | Federal air quality monitoring data | https://www.umweltbundesamt.de/daten/luft/luftdaten |
| LfU Bayern Air | Bavarian air monitoring network | https://www.lfu.bayern.de/luft/ |

### Fires

| Source | Description | URL |
|--------|-------------|-----|
| NASA FIRMS | Active fire detections (MODIS/VIIRS) | https://firms.modaps.eosdis.nasa.gov/ |

### Satellite Imagery & Vegetation

| Source | Description | URL |
|--------|-------------|-----|
| Copernicus Data Space | Sentinel-2 satellite imagery | https://dataspace.copernicus.eu/ |
| Copernicus Land Monitoring | NDVI, land cover, snow cover | https://land.copernicus.eu/ |
| USGS EarthExplorer | Landsat imagery | https://earthexplorer.usgs.gov/ |

---

## Homepage Mockup

![Homepage Mockup](homepage_mockup.png)

*A rough layout of the homepage: condition summary cards, a chart comparing
current data to historical averages, a map of data stations, and data
freshness indicators.*

---

## Summary

| Aspect | Detail |
|--------|--------|
| **What** | A website and app for environmental information about the Allgäu |
| **Design** | Visually appealing, intuitive, accessible to non-technical users |
| **Data** | Weather, lake temps & levels, groundwater, air quality, fires, vegetation |
| **Layers** | Current conditions, short-term forecasts, historical archive |
| **Audience 1** | Residents & visitors — one hub for practical environmental info |
| **Audience 2** | Researchers & general public — long-term trends and awareness |
| **Sources** | Official public APIs (DWD, LfU, UBA, Copernicus, NASA) |
| **Archive** | All data recorded continuously to build historical depth over time |

---

*July 2026*
