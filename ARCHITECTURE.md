# Architecture

destinoteca is two things in one repository: a **catalog** (history articles
and structured facts about signs, boards and clocks) and a **library of web
replicas** that can be fed with data from anywhere. This file explains how the
second is put together and where the first plugs in. For how to contribute an
entry or a photograph, see [CONTRIBUTING.md](CONTRIBUTING.md).

## The pipeline

```
source ──► BoardSnapshot ──► player ──► replica.present() ──► Frame ──► replica renderer ──► SVG
(mitren,   (shared model:    (runs the   (what this sign      (the sign's   (hardware layers,
 manual,    "what it knows")  replica's    can show of it)      native         or its own
 demo…)                       selection                         inputs)        drawing)
                              policy;                              ▲
                              owns time)        "texto libre" mode ┘ (type a Frame directly)
```

The rule that everything else follows from: **a source fills in what it
knows, a replica shows what it can.** Neither knows the other exists.

| Piece | Where | Knows about |
| --- | --- | --- |
| Data model | `src/lib/model/` | Nothing else |
| Sources | `src/lib/sources/` | The model |
| Hardware layers | `src/lib/hardware/` | SVG. Not the model |
| Replicas | `src/lib/replicas/` | The model and (optionally) the hardware layers |
| Player | `src/lib/player/` | All of the above, through their interfaces |
| Playground UI | `src/lib/ui/` | The player and the schemas |
| Catalog | `src/content/`, `src/lib/catalog/`, `src/site/` | Replica ids only |

`src/lib/` imports nothing from Astro and has no side effects at import time,
so it runs under Node (tests, build-time rendering) as well as in the browser.
`tests/rules.test.ts` enforces the boundaries a type checker cannot see.

## The data model

`src/lib/model/types.ts`. Almost every field is optional.

- A **`BoardSnapshot`** is everything a source knows about one station right
  now: every upcoming `Service` on every platform. It is never narrowed to a
  platform or to "the next train"; that is the player's job.
- A **`Service`** is one train as seen from that station: operator, product
  (service type), line, number, origin, destination, calls before and after,
  and `here` (arrival, departure, platform, what it does here). Times are
  `EventTime` triples (scheduled / estimated / actual).
- A train that **divides or was joined** is still one `Service`, with
  `portions`. Sources that list such a train as separate rows mark them with
  the same `coupling`, and `groupCoupled()` folds them. Replicas always read
  through `portionsOf()`, which returns at least one portion, so an ordinary
  train is not a special case.
- A **`Place`** carries a ladder of progressively shorter names. A narrow sign
  takes the longest that fits (`fitName`, `fitNames`) instead of inventing an
  abbreviation.
- Text can be per language (`Text`), read with `text()`.

Helpers next to the types (`bestTime`, `delayMinutes`, `minutesUntil`,
`platformDigits`, `confirmedPlatform`…) return `undefined` when the data
cannot answer, which is not the same as zero or "on time".

### From a station to one display

A replica declares a `SelectionPolicy` (`src/lib/model/selection.ts`):
departures or arrivals, one platform or the whole station, how long a train
lingers after its time, how many rows the hardware has, and whether it rotates
or pages through what does not fit. The player runs it and hands the replica a
`View` whose `services` is always a list.

So a one-line platform sign and a four-row concourse board differ only in
policy (`window.size` 1 vs 4, `platforms` `one` vs `any`), and several replicas
can share one source connection (`SourceHub`), each with its own view.

## Time

There are two clocks and they never mix.

- **Station time** (`StationClock`, one per `SourceHub`) is what every
  countdown, every "has it left yet" and any clock face reads. It follows the
  viewer's device unless the source anchors it through `onTime()`: a live feed
  reports its server's time, and the manual source can set the board to any
  time of day, running or frozen. That is what keeps a clock on a display
  consistent with the trains beside it. Nothing in `src/lib` calls
  `Date.now()` except `RealClock`.
- **Animation time** (`Ticker`) is a monotonic frame clock shared by the page.
  Scrolling text, flip sweeps and stepping through trains run on it. Displays
  subscribe to it and own no timers, so motion can be frozen or stepped in a
  test.

## Sources

`src/lib/sources/<id>/def.ts` is a light `SourceDef` (id, kind, settings
schema); `index.ts` is the code, loaded on first use. An instance receives
`{ onSnapshot, onStatus, onTime }` and may implement `focus()` to learn which
services are on show.

| Source | Kind | Notes |
| --- | --- | --- |
| `demo` | simulated | A made-up board that exercises long names, delays, unconfirmed platforms and a dividing train |
| `mitren` | live | Renfe Cercanías and Rodalies from mitren.app's WebSocket; bundled station list |
| `manual` | manual | Services typed by hand in model terms, stored in the URL |

**Adding a source:** a folder with `def.ts` and `index.ts`, one line in
`src/lib/sources/registry.ts`, and its strings in `src/i18n/es/`. The settings
form, URL parameters and status display come from the schema.

## Replicas

`def.ts` is a light `ReplicaDef`: id, intrinsic size, what it needs, its
selection policy, and two schemas (`options` for appearance, `frame` for what
it shows). `index.ts` is a `ReplicaImpl`:

| Method | Does |
| --- | --- |
| `present(view, options)` | The view as this display would show it: a `Frame`, or several pages shown in turn |
| `blank(view, options)` | What it shows with nothing to announce |
| `renderToString(frame, options)` | A standalone SVG of one settled frame (downloads, build-time rendering) |
| `mount(host, options, { ticker })` | Draws into the page and keeps it current: `setFrame`, `setOptions`, `destroy` |

A **Frame** is the display's content in its own terms. For a text sign it is
what its controller sent down the wire, which is why typing one by hand
("texto libre") is the same code path as live data.

Motion belongs to the replica. Still content can move (a marquee), and a
change of content can be animated (`DotTransition`). `renderToString` always
shows the settled frame.

### Hardware layers

Optional building blocks in `src/lib/hardware/`. A replica that looks nothing
like these draws itself however it likes; the interface above is all the
player asks for.

| Layer | File | Varies independently |
| --- | --- | --- |
| Dot matrix | `dot-matrix.ts` | Geometry, and a `DotSkin` for how a dot looks (`skins/`) |
| Character display | `character-display.ts` | Lines × cells, fonts, fields, garbled cells |
| Motion | `marquee.ts`, `transition.ts` | Scrolling; the order and timing in which dots change |
| Fonts and code pages | `fonts/` | `cp437` is the standard one; `telenorma-cp437` states that ROM's deviations explicitly; proportional fonts read from photographs say which glyphs were seen |

The PAGE Ibérica family shows how a design language is shared.
`replicas/page-iberica-electromagneticos/` holds what its signs have in
common: sizes (`dimensions.ts`), the flip-dot lines (parametric in lines and
cells), the LED row, legends, faults, the appearance settings (`parts.ts`)
and the drawing and live updating of a sign (`live.ts`). Each member is then
a housing, a layout of its characters and a presenter:
`page-iberica-anden-electromagnetico/` (one line of 16) and
`page-iberica-vestibulo/` (concourse boards of 2 or 4 lines of 20, two
replica ids from one implementation). The LED part of a sign is a panel of
one or more lines (`LedRow`), so the red row under a flip-dot line and the
two-line bicolour panel of Atocha Cercanías go through the same code. The
Atocha Cercanías signs (`page-iberica-acceso-atocha/`,
`page-iberica-anden-atocha/`) share their grey enclosure, header and
makers' plate (a vector tracing of PAGE's logo, `page-logo.ts`) through
`atocha.ts`.

**Adding a replica:** a folder with `def.ts` and `index.ts`, its id in
`src/lib/replicas/ids.ts`, a line in `registry.ts`, its strings, and
`replica: { id }` in the catalog entry. Ids appear in other people's embed
URLs: never rename one.

## Settings and URLs

`ParamSchema` (`src/lib/params/`) is a declarative list of fields. From one
schema come the form, the query-string codec and validation. A `switch` field
is the one kind that is form-only: a checkbox that turns other settings on
and off together, with no value or URL key of its own. A replica on a
page is fully described by a `PlayerConfig` (`src/lib/player/config.ts`):

| Group | Schema | Example keys |
| --- | --- | --- |
| Mode | — | `source=demo\|mitren\|manual\|raw` |
| Source settings | the source's `config` | `station`, `network`, `svc`, `hora` |
| Placement | `placementSchema` | `via`, `cycle` |
| Appearance | the replica's `options` | `dot`, `showoff`, `anim`, `hearts`… |
| Hand-typed frame | the replica's `frame` | `text`, `min`, `via`, `led` |

`/embed/<replica-id>/?…` reads exactly this, and so does the
`<destinoteca-replica query="…">` element. URL keys are a public contract: the
first replica keeps those of the original in `renfe-flipdot-re`, so old embeds
work with their query string untouched. Values reach the SVG only through
`textContent`/`setAttribute` or the escaping string builder in
`hardware/svg.ts`.

## The catalog

Astro content collections under `src/content/`, one folder per entry.
`src/content.config.ts` holds the schemas; `src/site/catalog.ts` is the only
way pages read them, and it fails the build on dangling references, duplicate
ids, unknown replica ids and articles missing required facts.
`src/lib/catalog/facets.ts` is the single table of organising axes: the
filterable list and every taxonomy page are generated from it.

Pages are thin wrappers over `src/views/`. Internal links go through
`href()` in `src/site/url.ts`, which adds the base path (and, one day, a
language prefix). UI strings live in `src/i18n/es/` behind `t()`.

## Commands

| | |
| --- | --- |
| `npm run dev` | Local site with reload |
| `npm test` | Unit tests for `src/lib` |
| `npm run check` | Types, content schemas |
| `npm run build` | The static site into `dist/` |
| `npm run lint:dist` | No link in `dist/` escapes the base path |
