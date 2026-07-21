# Data archive

Measurements mirrored from the **Bavarian Hydrological Service (GKD Bayern)**,
<https://www.gkd.bayern.de> — source attribution: *„Quelle: Gewässerkundlicher
Dienst Bayern (GKD), gkd.bayern.de"*.

- `lakes.json` — latest snapshot per lake, refreshed every 30 min by
  `.github/workflows/ingest.yml` (consumed by the website)
- `timeseries/lakes.csv` — append-only archive of every value seen
  (`measured_at, lake, kind, value, unit, fetched_at`); this file is the
  long-term archive and only ever grows

GKD/LfU Bavarian measurement data is published as open government data
(Datenlizenz Deutschland – Namensnennung 2.0); redistribution requires
attribution, which is provided here and on the website. Do not remove the
attribution when reusing this data.
