#!/usr/bin/env python3
"""
Allgäu Environment — climate trend backfill (ERA5 via Open-Meteo archive)

Builds the long-term monthly temperature record for each site and writes:

  data/trends/<loc>.monthly.json        monthly mean temperatures (consumed by the website)
  data/timeseries/monthly_temperature.csv  same record as a flat archive table

Source: ERA5 reanalysis (0.25° grid), served by the Open-Meteo archive API
(https://archive-api.open-meteo.com). ERA5 daily means are aggregated to
calendar-month means here. Idempotent: already-recorded months are kept,
only missing months are fetched. Run once for the 1940 backfill, then
monthly via .github/workflows/trends.yml.

No third-party dependencies. Run:  python3 pipeline/backfill_trends.py
"""

import csv
import json
import os
import sys
import time
import urllib.request
from datetime import date

ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREND_DIR = os.path.join(ROOT, "data", "trends")
TS_FILE = os.path.join(ROOT, "data", "timeseries", "monthly_temperature.csv")
UA = {"User-Agent": "allgaeu-environment-archive/1.0 (open data mirror)"}

START_YEAR = 1940  # ERA5 starts 1940

LOCATIONS = {
    "kempten":    {"name": "Kempten",    "lat": 47.7267, "lon": 10.3139},
    "oberstdorf": {"name": "Oberstdorf", "lat": 47.4098, "lon": 10.2792},
    "fuessen":    {"name": "Füssen",     "lat": 47.5714, "lon": 10.7017},
}


def fetch_daily(loc, start, end):
    """Daily mean temperatures for a date range -> {date: value} (nulls dropped)."""
    url = (f"{ARCHIVE}?latitude={loc['lat']}&longitude={loc['lon']}"
           f"&start_date={start}&end_date={end}"
           f"&daily=temperature_2m_mean&timezone=Europe%2FBerlin")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as res:
        payload = json.loads(res.read().decode("utf-8"))
    daily = payload.get("daily") or {}
    times, values = daily.get("time", []), daily.get("temperature_2m_mean", [])
    return {t: v for t, v in zip(times, values) if v is not None}


def last_complete_month(today=None):
    """Most recent month that is fully over (ERA5 lags ~5 days anyway)."""
    today = today or date.today()
    y, m = today.year, today.month - 1
    if m == 0:
        y, m = y - 1, 12
    return y, m


def missing_ranges(have_months, upto):
    """Contiguous (start_year, end_year) decade-sized ranges to fetch."""
    if have_months:
        last = max(have_months)  # "YYYY-MM"
        start_year = int(last[:4])
        # re-fetch the last recorded month only if it might have been partial:
        # monthly means for past months never change, so start the month after
        y, m = start_year, int(last[5:7]) + 1
        if m == 13:
            y, m = y + 1, 1
        start = date(y, m, 1)
    else:
        start = date(START_YEAR, 1, 1)
    end = date(upto[0], upto[1], 1)
    if start > end:
        return []
    ranges = []
    y = start.year
    while y <= end.year:
        ranges.append((max(start, date(y, 1, 1)).isoformat(),
                       min(end, date(y, 12, 1)).isoformat()))
        y += 1
    return ranges


def aggregate_monthly(daily):
    """{YYYY-MM-DD: value} -> {YYYY-MM: monthly mean}."""
    sums, counts = {}, {}
    for day, v in daily.items():
        key = day[:7]
        sums[key] = sums.get(key, 0.0) + v
        counts[key] = counts.get(key, 0) + 1
    return {k: round(s / counts[k], 2) for k, s in sums.items()}


def backfill(loc_id, loc):
    path = os.path.join(TREND_DIR, f"{loc_id}.monthly.json")
    months = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            months = json.load(f).get("months", {})

    upto = last_complete_month()
    ranges = missing_ranges(months, upto)
    if not ranges:
        print(f"OK   {loc_id:12s} up to date ({len(months)} months, through {max(months)})")
        return months, 0

    added = 0
    for start, end in ranges:
        try:
            new = aggregate_monthly(fetch_daily(loc, start, end))
            months.update(new)
            added += len(new)
            print(f"OK   {loc_id:12s} {start}..{end}  +{len(new)} months")
        except Exception as e:
            print(f"FAIL {loc_id:12s} {start}..{end}  {e}")
        time.sleep(1)  # be polite to the free API

    record = {
        "location": loc_id,
        "name": loc["name"],
        "lat": loc["lat"],
        "lon": loc["lon"],
        "variable": "temperature_2m_mean",
        "unit": "°C",
        "aggregation": "calendar-month mean of daily means",
        "source": "ERA5 reanalysis via Open-Meteo archive API",
        "first_year": START_YEAR,
        "months": dict(sorted(months.items())),
    }
    os.makedirs(TREND_DIR, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=1)
    return months, added


def write_csv(all_months):
    """Flat archive table: one row per location/month. Rewritten wholesale —
    monthly means for past months never change, so this stays idempotent."""
    os.makedirs(os.path.dirname(TS_FILE), exist_ok=True)
    with open(TS_FILE, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["location", "month", "temp_mean_c", "source"])
        for loc_id in sorted(all_months):
            for month, v in sorted(all_months[loc_id].items()):
                w.writerow([loc_id, month, v, "ERA5/Open-Meteo"])


def main():
    all_months = {}
    total_added = 0
    for loc_id, loc in LOCATIONS.items():
        months, added = backfill(loc_id, loc)
        all_months[loc_id] = months
        total_added += added
    if not all_months:
        print("ERROR: no data for any location", file=sys.stderr)
        sys.exit(1)
    write_csv(all_months)
    print(f"\nTrends -> {TREND_DIR}  (+{total_added} months)")
    print(f"Archive -> {TS_FILE}")


if __name__ == "__main__":
    main()
