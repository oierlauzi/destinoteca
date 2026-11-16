#!/usr/bin/env python3
"""Build src/lib/sources/mitren/stations.data.json from a checkout of dondeestamitren.

The live source reads departures from mitren.app over a WebSocket, but
mitren.app's search API sends no CORS header, so a page on GitHub Pages cannot
ask it for station names. This bakes the names into the site instead, from the
same data mitren.app itself ships (Apache-2.0, credited in NOTICE):

  app/data/config/nuclei_data.csv              networks, and their city slug
  app/data/custom/station_municipality_boundary.csv
                                               every station per network, with
                                               its name and municipality
  app/data/overrides/station/<network>.csv     mitren.app's curated display,
                                               short and mini names
  app/data/custom/DependenciasAdif.csv         ADIF's register, for the
                                               networks the first file lacks

Usage:
  git clone --depth 1 https://github.com/jotaelediaz/dondeestamitren
  python3 tools/build_stations.py dondeestamitren > src/lib/sources/mitren/stations.data.json

The output is deterministic, so rerunning it on the same checkout is a no-op.
Each station is one line, a positional array in the order given by "fields",
so that a diff shows exactly which stations changed.
"""

import csv
import json
import re
import subprocess
import sys
from pathlib import Path

# Only Renfe's suburban networks: those are the ones mitren.app's board socket
# serves, and the only ones whose station codes are ADIF/Renfe codes.
OPERATOR = "renfe"
MODE = "cercanias"

SMALL_WORDS = {"de", "del", "la", "las", "los", "el", "y", "i", "a", "en", "d", "l"}


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        lines = [line for line in f if not line.startswith("#")]
    return list(csv.DictReader(lines))


def title_case(upper):
    """ADIF's register is in capitals: 'ORIHUELA - MIGUEL HERNANDEZ'."""
    name = re.sub(r"\s*\((APD|APT|CGD)\)\s*$", "", upper.strip())
    words = re.split(r"(\s+|-|/)", name.lower())
    out = []
    for i, w in enumerate(words):
        out.append(w if (i and w in SMALL_WORDS) else w[:1].upper() + w[1:])
    return "".join(out)


def main(root):
    root = Path(root)
    data = root / "app" / "data"

    networks = [
        row for row in read_csv(data / "config" / "nuclei_data.csv")
        if row["operator_id"] == OPERATOR and row["transport_mode"] == MODE
    ]

    by_network = {}
    for row in read_csv(data / "custom" / "station_municipality_boundary.csv"):
        by_network.setdefault(row["nucleus_slug"], {})[row["station_id"]] = {
            "name": row["station_name"].strip(),
            "town": row["municipality"].strip(),
        }

    adif = {
        row["cod_depend"].strip(): title_case(row["nombre"])
        for row in read_csv(data / "custom" / "DependenciasAdif.csv")
    }

    stations = []
    for net in networks:
        slug = net["nucleus_slug"]
        known = by_network.get(slug, {})
        overrides = {}
        override_path = data / "overrides" / "station" / f"{slug}.csv"
        if override_path.exists():
            overrides = {row["station_id"]: row for row in read_csv(override_path)}

        for code in sorted(set(known) | set(overrides)):
            base = known.get(code, {})
            extra = overrides.get(code, {})
            name = (extra.get("display_name") or "").strip() or base.get("name") or adif.get(code)
            if not name:
                continue
            short = (extra.get("short_name") or "").strip()
            mini = (extra.get("mini_name") or "").strip()
            aliases = [a.strip() for a in (extra.get("search_aliases") or "").split("|") if a.strip()]
            stations.append([
                slug, code, name,
                short if short != name else "",
                mini if mini not in (name, short) else "",
                base.get("town", ""),
                "|".join(aliases),
            ])

    try:
        commit = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        commit = "unknown"

    payload = {
        "source": f"jotaelediaz/dondeestamitren@{commit}",
        "networks": [
            {"id": n["nucleus_slug"], "name": n["transport_name"], "city": n["city_slug"]}
            for n in networks
        ],
        "fields": ["network", "code", "name", "short", "mini", "town", "aliases"],
        "stations": stations,
    }

    out = sys.stdout
    out.write("{\n")
    out.write(f'  "source": {json.dumps(payload["source"])},\n')
    out.write('  "license": "Apache-2.0",\n')
    out.write(f'  "fields": {json.dumps(payload["fields"])},\n')
    out.write('  "networks": [\n')
    out.write(",\n".join("    " + json.dumps(n, ensure_ascii=False) for n in payload["networks"]))
    out.write('\n  ],\n  "stations": [\n')
    out.write(",\n".join("    " + json.dumps(s, ensure_ascii=False) for s in stations))
    out.write("\n  ]\n}\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
