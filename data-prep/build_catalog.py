#!/usr/bin/env python3
"""
build_catalog.py — convert OpenNGC into the catalog shipped by messier-explorer.

Source: OpenNGC by Mattia Verga (https://github.com/mattiaverga/OpenNGC),
licensed CC-BY-SA-4.0. This script reads OpenNGC's `NGC.csv` + `addendum.csv`
and emits `catalog.csv` at the repo root — a trimmed, app-ready catalog of the
full NGC + IC (Abell excluded), with Messier/Caldwell cross-IDs, common names,
and a computed "Best Viewing" season (issue #6).

The derived catalog inherits OpenNGC's CC-BY-SA-4.0 license.

Usage:
    python3 data-prep/build_catalog.py

Source CSVs are downloaded from OpenNGC's master branch if not already present
in this directory. Pass --offline to require the local copies.
"""

import argparse
import csv
import math
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT_PATH = os.path.join(REPO, "catalog.csv")

OPENNGC_BASE = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/"
SOURCE_FILES = ["NGC.csv", "addendum.csv"]

# Observer latitude for the "Best Viewing" season calc (issue #6). Kept generic
# so the generator stays catalog-agnostic.
SEASON_LAT_DEG = 40.0
SEASON_LON_DEG = 0.0  # longitude cancels out of a season (peak-month) calc

# Rows that aren't real, distinct observable targets.
DROP_TYPES = {"Dup", "NonEx"}

# IAU 3-letter constellation abbreviations -> full English names (app filters +
# constellation lines key off full names).
CONSTELLATIONS = {
    "And": "Andromeda", "Ant": "Antlia", "Aps": "Apus", "Aqr": "Aquarius",
    "Aql": "Aquila", "Ara": "Ara", "Ari": "Aries", "Aur": "Auriga",
    "Boo": "Boötes", "Cae": "Caelum", "Cam": "Camelopardalis", "Cnc": "Cancer",
    "CVn": "Canes Venatici", "CMa": "Canis Major", "CMi": "Canis Minor",
    "Cap": "Capricornus", "Car": "Carina", "Cas": "Cassiopeia", "Cen": "Centaurus",
    "Cep": "Cepheus", "Cet": "Cetus", "Cha": "Chamaeleon", "Cir": "Circinus",
    "Col": "Columba", "Com": "Coma Berenices", "CrA": "Corona Australis",
    "CrB": "Corona Borealis", "Crv": "Corvus", "Crt": "Crater", "Cru": "Crux",
    "Cyg": "Cygnus", "Del": "Delphinus", "Dor": "Dorado", "Dra": "Draco",
    "Equ": "Equuleus", "Eri": "Eridanus", "For": "Fornax", "Gem": "Gemini",
    "Gru": "Grus", "Her": "Hercules", "Hor": "Horologium", "Hya": "Hydra",
    "Hyi": "Hydrus", "Ind": "Indus", "Lac": "Lacerta", "Leo": "Leo",
    "LMi": "Leo Minor", "Lep": "Lepus", "Lib": "Libra", "Lup": "Lupus",
    "Lyn": "Lynx", "Lyr": "Lyra", "Men": "Mensa", "Mic": "Microscopium",
    "Mon": "Monoceros", "Mus": "Musca", "Nor": "Norma", "Oct": "Octans",
    "Oph": "Ophiuchus", "Ori": "Orion", "Pav": "Pavo", "Peg": "Pegasus",
    "Per": "Perseus", "Phe": "Phoenix", "Pic": "Pictor", "Psc": "Pisces",
    "PsA": "Piscis Austrinus", "Pup": "Puppis", "Pyx": "Pyxis",
    "Ret": "Reticulum", "Sge": "Sagitta", "Sgr": "Sagittarius", "Sco": "Scorpius",
    "Scl": "Sculptor", "Sct": "Scutum", "Ser": "Serpens", "Sex": "Sextans",
    "Tau": "Taurus", "Tel": "Telescopium", "Tri": "Triangulum",
    "TrA": "Triangulum Australe", "Tuc": "Tucana", "UMa": "Ursa Major",
    "UMi": "Ursa Minor", "Vel": "Vela", "Vir": "Virgo", "Vol": "Volans",
    "Vul": "Vulpecula",
}


# ── Astronomy (mirrors the formulas in app.js so season matches the app) ───────

def gmst_deg(jd):
    T = (jd - 2451545.0) / 36525.0
    gmst = (280.46061837
            + 360.98564736629 * (jd - 2451545.0)
            + 0.000387933 * T * T
            - T * T * T / 38710000)
    return gmst % 360


def lst_deg(jd, lon_deg):
    return (gmst_deg(jd) + lon_deg) % 360


def altitude_deg(ra_deg, dec_deg, lst, lat_deg):
    ha = math.radians((lst - ra_deg) % 360)
    dec = math.radians(dec_deg)
    lat = math.radians(lat_deg)
    return math.degrees(math.asin(
        math.sin(lat) * math.sin(dec) + math.cos(lat) * math.cos(dec) * math.cos(ha)
    ))


def sun_ra_dec(jd):
    n = jd - 2451545.0
    L = (280.460 + 0.9856474 * n) % 360
    g = math.radians((357.528 + 0.9856003 * n) % 360)
    lam = math.radians(L + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439)
    ra = (math.degrees(math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam)))) % 360
    dec = math.degrees(math.asin(math.sin(eps) * math.sin(lam)))
    return ra, dec


# Days from 1970-01-01 to the 15th of each month in a non-leap year, at 00:00 UTC.
_MONTH_15_DAYS = [14, 45, 73, 104, 134, 165, 195, 226, 257, 287, 318, 348]

_MONTH_TO_SEASON = {  # Northern-hemisphere meteorological seasons
    12: "Winter", 1: "Winter", 2: "Winter",
    3: "Spring", 4: "Spring", 5: "Spring",
    6: "Summer", 7: "Summer", 8: "Summer",
    9: "Autumn", 10: "Autumn", 11: "Autumn",
}


def best_viewing_season(ra_deg, dec_deg, lat_deg=SEASON_LAT_DEG, lon_deg=SEASON_LON_DEG):
    """Peak dark-hours month -> season, using the same metric as the app's
    monthly-visibility chart (object above 20° while the Sun is below -18°)."""
    best_month = None
    best_hours = -1.0
    for m in range(12):
        # JD at noon UTC on the 15th, then step every 15 min for 24 h.
        base_jd = 2440587.5 + _MONTH_15_DAYS[m] + 0.5
        dark_hours = 0.0
        for step in range(96):
            jd = base_jd + step * (0.25 / 24.0)
            lst = lst_deg(jd, lon_deg)
            sra, sdec = sun_ra_dec(jd)
            if altitude_deg(sra, sdec, lst, lat_deg) < -18:
                if altitude_deg(ra_deg, dec_deg, lst, lat_deg) > 20:
                    dark_hours += 0.25
        if dark_hours > best_hours:
            best_hours = dark_hours
            best_month = m + 1
    if best_hours <= 0:
        # Never rises above 20° in darkness from this latitude (far-southern
        # objects); still catalogued, but has no meaningful season here.
        return "Unknown"
    return _MONTH_TO_SEASON[best_month]


# ── Parsing helpers ────────────────────────────────────────────────────────────

def ra_to_deg(s):
    s = s.strip()
    if not s:
        return None
    h, m, sec = s.split(":")
    return (float(h) + float(m) / 60 + float(sec) / 3600) * 15


def dec_to_deg(s):
    s = s.strip()
    if not s:
        return None
    sign = -1 if s[0] == "-" else 1
    d, m, sec = s.lstrip("+-").split(":")
    return sign * (float(d) + float(m) / 60 + float(sec) / 3600)


# M102's identity is historically disputed; OpenNGC records it only as a "Dup"
# of M101. Modern catalogs assign M102 to NGC 5866 (the Spindle Galaxy), so we
# restore it here to ship the full 110 Messier objects.
MESSIER_OVERRIDES = {"NGC5866": 102}


def messier_id(row):
    name = row["Name"].strip()
    if name in MESSIER_OVERRIDES:
        return f"M{MESSIER_OVERRIDES[name]}"
    m = row["M"].strip()
    return f"M{int(m)}" if m else ""


CALDWELL_RE = re.compile(r"(?:^|,)\s*C\s*0*(\d{1,3})\b")


def caldwell_id(row):
    m = CALDWELL_RE.search(row["Identifiers"])
    return f"C{int(m.group(1))}" if m else ""


def _num_suffix(v):
    """'4414A' -> '4414A' with the numeric part un-zero-padded ('0224' -> '224')."""
    m = re.match(r"0*(\d+)([A-Za-z]*)$", v.strip())
    return f"{m.group(1)}{m.group(2)}" if m else v.strip()


def ngc_ic_designation(row):
    # The primary designation is the Name (e.g. "NGC1952", "IC0434"); the
    # NGC/IC columns only cross-list objects primarily catalogued elsewhere.
    name = row["Name"].strip()
    m = re.match(r"(NGC|IC)0*(\d+[A-Za-z]*)$", name)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    # addendum objects (e.g. Mel022, B033, ESO…) keep their raw name
    return name


def first_common_name(row):
    names = row["Common names"].strip()
    return names.split(",")[0].strip() if names else ""


def magnitude(row):
    for key in ("V-Mag", "B-Mag"):
        v = row[key].strip()
        if v:
            try:
                return f"{float(v):g}"
            except ValueError:
                pass
    return ""


def build_all_ids(mess, cald, desig, common, row):
    ids = []
    cross = []
    if row["NGC"].strip():
        cross.append(f"NGC {_num_suffix(row['NGC'])}")
    if row["IC"].strip():
        cross.append(f"IC {_num_suffix(row['IC'])}")
    for x in [mess, cald, desig, *cross]:
        if x and x not in ids:
            ids.append(x)
    if common:
        for nm in row["Common names"].split(","):
            nm = nm.strip()
            if nm and nm not in ids:
                ids.append(nm)
    return ",".join(ids)


# ── Main ────────────────────────────────────────────────────────────────────────

def ensure_sources(offline):
    for fname in SOURCE_FILES:
        path = os.path.join(HERE, fname)
        if os.path.exists(path):
            continue
        if offline:
            sys.exit(f"Missing {path} and --offline was set. Download it from "
                     f"{OPENNGC_BASE}{fname}")
        url = OPENNGC_BASE + fname
        print(f"Downloading {url} …")
        urllib.request.urlretrieve(url, path)


def read_source():
    rows = []
    for fname in SOURCE_FILES:
        with open(os.path.join(HERE, fname), newline="", encoding="utf-8") as f:
            rows.extend(csv.DictReader(f, delimiter=";"))
    return rows


def catalog_of(mess, cald, row):
    if mess:
        return "Messier"
    if cald:
        return "Caldwell"
    name = row["Name"].strip()
    if name.startswith("NGC"):
        return "NGC"
    if name.startswith("IC"):
        return "IC"
    return "Other"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--offline", action="store_true",
                    help="require local OpenNGC CSVs (do not download)")
    args = ap.parse_args()

    ensure_sources(args.offline)
    src = read_source()

    out_rows = []
    dropped = skipped_coords = 0
    for row in src:
        if row["Type"] in DROP_TYPES:
            dropped += 1
            continue
        ra = ra_to_deg(row["RA"])
        dec = dec_to_deg(row["Dec"])
        if ra is None or dec is None:
            skipped_coords += 1
            continue

        mess = messier_id(row)
        cald = caldwell_id(row)
        desig = ngc_ic_designation(row)
        common = first_common_name(row)

        out_rows.append({
            "id": row["Name"].strip(),
            "catalog": catalog_of(mess, cald, row),
            "messier": mess,
            "caldwell": cald,
            "ngc_ic": desig,
            "name": common,
            "all_ids": build_all_ids(mess, cald, desig, common, row),
            "type": row["Type"].strip(),
            "mag": magnitude(row),
            "constellation": CONSTELLATIONS.get(row["Const"].strip(), row["Const"].strip()),
            "size_arcmin": row["MajAx"].strip(),
            "ra_deg": f"{ra:.5f}",
            "dec_deg": f"{dec:.5f}",
            "season": best_viewing_season(ra, dec),
        })

    fields = ["id", "catalog", "messier", "caldwell", "ngc_ic", "name", "all_ids",
              "type", "mag", "constellation", "size_arcmin", "ra_deg", "dec_deg",
              "season"]
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out_rows)

    # Summary
    n_mess = sum(1 for r in out_rows if r["messier"])
    n_cald = sum(1 for r in out_rows if r["caldwell"])
    n_named = sum(1 for r in out_rows if r["name"])
    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"Wrote {len(out_rows):,} objects to {OUT_PATH} ({size_kb:.0f} KB)")
    print(f"  Messier: {n_mess}   Caldwell: {n_cald}   named: {n_named}")
    print(f"  Dropped {dropped} Dup/NonEx, skipped {skipped_coords} without coords")


if __name__ == "__main__":
    main()
