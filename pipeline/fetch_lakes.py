#!/usr/bin/env python3
"""
Allgäu Environment — GKD ingestion pipeline (v1)

Fetches the latest measurements from the Bavarian Hydrological Service (GKD)
station pages (server-rendered HTML tables, 15-minute values) and writes:

  data/lakes.json                 latest snapshot per lake (consumed by the website)
  data/timeseries/lakes.csv       append-only archive of every value seen

No third-party dependencies. Run:  python3 pipeline/fetch_lakes.py
"""

import csv
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone

BASE = "https://www.gkd.bayern.de/de/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
TS_FILE = os.path.join(DATA_DIR, "timeseries", "lakes.csv")
SNAPSHOT_FILE = os.path.join(DATA_DIR, "lakes.json")
UA = {"User-Agent": "allgaeu-environment-archive/1.0 (open data mirror)"}

# lake id -> measurement kinds -> GKD station path
STATIONS = {
    "forggensee": {
        "level": "seen/wasserstand/iller_lech/rosshaupten-seepegel-12001301",
    },
    "bodensee": {
        "temp":  "seen/wassertemperatur/iller_lech/lindau-20001001",
        "level": "seen/wasserstand/iller_lech/lindau-20001001",
    },
    "rottachsee": {
        "temp":  "seen/wassertemperatur/iller_lech/rottachsee-11444001",
        "level": "seen/wasserstand/iller_lech/rottachsee-11444001",
    },
    "gruentensee": {
        "level": "seen/wasserstand/iller_lech/gruentensee-seepegel-12403000",
    },
    "engeratsgundsee": {
        "temp": "seen/wassertemperatur/iller_lech/engeratsgundsee-11422003",
    },
    "laufbichelsee": {
        "temp": "seen/wassertemperatur/iller_lech/laufbichelsee-11422006",
    },
}

TAG_RE = re.compile(r"<[^>]+>")
TABLE_RE = re.compile(r'<table[^>]*tblsort[^>]*>(.*?)</table>', re.S | re.I)
ROW_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
CELL_RE = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S | re.I)
HEADER_RE = re.compile(
    r"<t[dh][^>]*>.*?</t[dh]>\s*<t[dh][^>]*>(.*?)</t[dh]>", re.S | re.I)


def fetch(url, retries=2):
    """GET url with simple backoff; raises after the last failed attempt."""
    last = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as res:
                return res.read().decode("utf-8", errors="replace")
        except Exception as e:
            last = e
            if attempt < retries:
                time.sleep(10 * (attempt + 1))
    raise last


def parse_latest(html):
    """Latest row of a GKD tblsort table -> dict(value, unit, measured_at).

    Handles both 2-column tables (Datum, value) and profiler tables
    (Datum, value@3m, value@6m, ...) — for profilers the shallowest
    (first numeric) depth is taken as the surface temperature.
    """
    m = TABLE_RE.search(html)
    if not m:
        raise ValueError("no measurement table found")
    body = m.group(1)

    h = HEADER_RE.search(body)
    unit = ""
    if h:
        unit = TAG_RE.sub("", h.group(1))
        bracket = re.search(r"\[(.*?)\]", unit)
        unit = bracket.group(1).strip() if bracket else unit.strip()

    for r in ROW_RE.finditer(body):
        cells = [TAG_RE.sub("", c).strip() for c in CELL_RE.findall(r.group(1))]
        if len(cells) < 2 or not re.match(r"\d{2}\.\d{2}\.\d{4}", cells[0]):
            continue  # header row
        measured_at = cells[0].replace("Uhr", "").strip()
        for raw in cells[1:]:
            try:
                value = float(raw.replace(".", "").replace(",", "."))
                return {"value": value, "unit": unit, "measured_at": measured_at}
            except ValueError:
                continue
        raise ValueError("row without numeric value")
    raise ValueError("no data row found")


def append_timeseries(rows):
    os.makedirs(os.path.dirname(TS_FILE), exist_ok=True)
    exists = os.path.exists(TS_FILE)
    seen = set()
    if exists:
        with open(TS_FILE, newline="", encoding="utf-8") as f:
            for r in csv.reader(f):
                if r and r[0] != "measured_at":
                    seen.add(tuple(r[:4]))
    new = 0
    with open(TS_FILE, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if not exists:
            w.writerow(["measured_at", "lake", "kind", "value", "unit", "fetched_at"])
        for row in rows:
            key = tuple(str(x) for x in row[:4])
            if key in seen:
                continue
            w.writerow(row)
            new += 1
    return new


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    snapshot = {"fetched_at": fetched_at, "source": "GKD Bayern (gkd.bayern.de)", "lakes": {}}
    ts_rows = []

    for lake, kinds in STATIONS.items():
        entry = {}
        for kind, path in kinds.items():
            url = BASE + path + "/messwerte"
            try:
                latest = parse_latest(fetch(url))
                entry[kind] = latest
                ts_rows.append([latest["measured_at"], lake, kind,
                                latest["value"], latest["unit"], fetched_at])
                print(f"OK   {lake:16s} {kind:5s} {latest['value']} {latest['unit']}  ({latest['measured_at']})")
            except Exception as e:  # keep going; one failed station must not kill the run
                print(f"FAIL {lake:16s} {kind:5s} {e}")
        if entry:
            snapshot["lakes"][lake] = entry

    if not snapshot["lakes"]:
        # Every station failed (e.g. GKD outage or blocking). Keep the previous
        # snapshot on disk so the website keeps serving last-good values, and
        # fail the run loudly instead of committing an empty snapshot.
        print("ERROR: all stations failed — keeping previous snapshot", file=sys.stderr)
        sys.exit(1)

    with open(SNAPSHOT_FILE, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)

    new = append_timeseries(ts_rows)
    print(f"\nSnapshot -> {SNAPSHOT_FILE}")
    print(f"Archive  -> {TS_FILE} (+{new} new rows)")


if __name__ == "__main__":
    main()
