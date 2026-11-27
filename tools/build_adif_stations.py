#!/usr/bin/env python3
"""Build src/lib/sources/adif/stations.data.json: the stations the ADIF source can search.

ADIF's hub names every station a board mentions, but it has no list to search
and nothing on info.adif.es answers a cross-origin request, so the list is
baked into the site. It is put together from three places, best first:

  boards captured from ADIF      tools/capture-adif.mjs. Each board carries
                                 ADIF's own name for every station its trains
                                 touch, with ADIF's shorter forms: the names
                                 its screens print.
  mitren.app's station list      src/lib/sources/mitren/stations.data.json:
                                 Renfe's Cercanías stations, whose codes are
                                 ADIF's, with their towns.
  Renfe's register of stations   https://data.renfe.com/dataset/estaciones-listado-completo
                                 (CC BY 4.0): the code, which is ADIF's own,
                                 the town and the province. Names are in
                                 capitals.

A station is listed if any of the three knows it: the register, despite its
name, lacks hundreds of Cercanías stations. Its name is the first of the three
that has one (the register's put into title case), and its town and province
come from the register, or from mitren.app.

Usage:
  curl -o estaciones.csv https://ssl.renfe.com/ftransit/Fichero_estaciones/estaciones.csv
  node tools/capture-adif.mjs boards 17000 60000 71801 ...   # optional, the more the better
  python3 tools/build_adif_stations.py estaciones.csv [boards] > src/lib/sources/adif/stations.data.json

The output is deterministic. Each station is one line, a positional array in
the order given by "fields", so that a diff shows which stations changed.
"""

import csv
import io
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MITREN = ROOT / "src" / "lib" / "sources" / "mitren" / "stations.data.json"

SMALL_WORDS = {"de", "del", "la", "las", "los", "el", "y", "i", "a", "en", "d", "l", "les", "els", "o", "da", "do", "das", "dos"}
# Words the register writes in capitals that stay so.
# What the register writes where it does not know.
UNKNOWN = {"", "DESCONOCIDO", "DESCONOCIDA"}
UPPER = {"av", "t1", "t2", "t4", "ii", "iii", "iv", "uab", "ave"}


def title_case(upper):
    """'MADRID-CHAMARTÍN-CLARA CAMPOAMOR' -> 'Madrid-Chamartín-Clara Campoamor'."""
    words = re.split(r"(\s+|-|/|\(|\)|')", upper.strip().lower())
    out = []
    for i, w in enumerate(words):
        if w in UPPER:
            out.append(w.upper())
        elif i and w in SMALL_WORDS:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    return "".join(out)


def ladder(forms):
    """ADIF's forms of a name, longest first, without repeats.

    ADIF lists a name and its shorter forms, but not always in order (the full
    name is sometimes repeated at the end) and sometimes with a form that only
    drops a space, written for a line break. Those add nothing to a ladder.
    """
    seen = []
    squeezed = set()
    for form in forms:
        form = str(form).strip()
        key = re.sub(r"\s+", "", form)
        if not form or key in squeezed:
            continue
        squeezed.add(key)
        seen.append(form)
    # Stable: equal lengths keep ADIF's order.
    return sorted(seen, key=len, reverse=True)


def read_register(path):
    raw = Path(path).read_bytes()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    rows = list(csv.DictReader(io.StringIO(text), delimiter=";"))
    out = {}
    for row in rows:
        code = (row.get("CODIGO") or "").strip()
        name = (row.get("DESCRIPCION") or "").strip()
        if not re.fullmatch(r"\d{1,5}", code) or not name:
            continue
        clean = lambda value: "" if (value or "").strip().upper() in UNKNOWN else (value or "").strip()
        out[code.zfill(5)] = {
            "name": name,
            "town": clean(row.get("POBLACION")),
            "province": clean(row.get("PROVINCIA")),
        }
    return out


def read_boards(directory):
    """ADIF's ladders by five-digit code, from every captured board."""
    names = {}
    for path in sorted(Path(directory).glob("*.json")):
        board = json.loads(path.read_text(encoding="utf-8"))
        settings = board.get("station_settings") or {}
        for code, entry in (board.get("stations") or {}).items():
            forms = entry.get("name") if isinstance(entry, dict) else None
            if isinstance(forms, str):
                forms = [forms]
            if re.fullmatch(r"\d{1,5}", str(code)) and forms:
                names.setdefault(str(code).zfill(5), ladder(forms))
        code, name = str(settings.get("code") or ""), settings.get("name")
        if re.fullmatch(r"\d{1,5}", code) and name:
            names.setdefault(code.zfill(5), [str(name).strip()])
    return names


def read_mitren():
    data = json.loads(MITREN.read_text(encoding="utf-8"))
    feed = {n["id"]: n["feed"] for n in data["networks"]}
    names, towns = {}, {}
    for network, code, name, short, mini, town, *_ in data["stations"]:
        if feed.get(network) == "cercanias" and re.fullmatch(r"\d{5}", code):
            names.setdefault(code, ladder([name, short, mini]))
            if town:
                towns.setdefault(code, town)
    return names, towns


def main(register_path, boards_dir=None):
    register = read_register(register_path)
    adif = read_boards(boards_dir) if boards_dir else {}
    mitren, mitren_towns = read_mitren()

    stations = []
    for code in sorted(set(register) | set(adif) | set(mitren)):
        row = register.get(code, {})
        forms = adif.get(code) or mitren.get(code) or [title_case(row["name"])]
        name, *shorter = forms
        town = title_case(row["town"]) if row.get("town") else mitren_towns.get(code, "")
        stations.append([
            code,
            name,
            "|".join(shorter),
            town,
            title_case(row["province"]) if row.get("province") else "",
        ])

    out = sys.stdout
    out.write("{\n")
    out.write('  "source": "Renfe, estaciones.csv (CC BY 4.0); names from ADIF\'s boards and mitren.app",\n')
    out.write('  "fields": ["code", "name", "shorter", "town", "province"],\n')
    out.write('  "stations": [\n')
    out.write(",\n".join("    " + json.dumps(s, ensure_ascii=False) for s in stations))
    out.write("\n  ]\n}\n")


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    main(*sys.argv[1:])
