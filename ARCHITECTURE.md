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

`src/lib/sources/<id>/def.ts` is a light `SourceDef` (id, kind, what it
provides, settings schema); `index.ts` is the code, loaded on first use. An
instance receives `{ onSnapshot, onStatus, onTime }` and may implement
`focus()` to learn which services are on show.

| Source | Kind | Provides | Notes |
| --- | --- | --- | --- |
| `demo` | simulated | services | A made-up board, one per network (`red=`): Cercanías de Madrid, long and medium distance, an airport's flights, Metro Bilbao, Euskotren. It exercises long names, delays, unconfirmed platforms and gates, a dividing train |
| `mitren` | live | services | One of mitren.app's feeds over its WebSocket (`op=cercanias\|euskotren\|metro-bilbao`): Renfe Cercanías and Rodalies, Euskotren or Metro Bilbao, each with its own networks, station codes and operator; bundled station list |
| `device` | device | time | The clock of the machine the page is open on, in its own time zone or in the one Spanish stations keep, and as far off as it is told to run (`zona`, `desvio`). No trains: it is what a station clock needs, and what a board shows with nothing to announce |
| `manual` | manual | services, time | Services typed by hand in model terms, stored in the URL, and the time of day the board lives at |

### What a source knows and a display reads

A source says what it is chosen for (`provides`) and a display what it can
show of it (`reads`, in its `ReplicaDef`): both are lists of `DataKind`
(`services`, `time`). Where the two meet, the source is offered for that
display — so a clock is never offered a train feed, and no board is left
without one — and the first that fits is what it starts on
(`sourcesFor`, `sourceFits`).

The same pairing trims the settings: a field of a source's schema may say what
it is `about`, and `onlyAbout` (in `src/lib/params/`) keeps only what the
reader can use, so the manual source asks a clock for the time of day and not
for a list of trains. What is left out keeps its default and stays out of the
URL. A source named in an older link that the display cannot use gives way to
the one it would have started on, so those addresses still mean something.

**Adding a source:** a folder with `def.ts` and `index.ts`, one line in
`src/lib/sources/registry.ts`, and its strings in `src/i18n/es/`. The settings
form, URL parameters and status display come from the schema.

### The networks of the simulation

Every display was built for one kind of traffic, so the simulation is not
one board but one per network: `src/lib/sources/demo/networks.ts` is a table
of what runs on each (the places with their shorter names, the lines, the
brands or the airlines, the headway, the platforms or the gates, which
quirks to exercise, what the station announces), and `board.ts` is the one
generator that reads it. A new network is an entry in the table and no code;
its id is the value of `red=` in an embed URL, so it is never renamed, and
one that is not known falls back to the first.

A replica says which network it starts on through `sourceDefaults`, which
is how an Aena board opens on flights and a Metro Bilbao sign on its own
trains. The picker still offers the rest.

## Replicas

`def.ts` is a light `ReplicaDef`: id, intrinsic size, what it reads and needs,
its selection policy, and two schemas (`options` for appearance, `frame` for
what it shows). `index.ts` is a `ReplicaImpl`:

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

Ikusi's liquid-crystal signs share their character modules through
`replicas/ikusi/`: the rail, the modules with their grooves, the blank ones
at each end, and Ikusi's logo. The platform sign of Atocha Cercanías
(`ikusi-anden-atocha/`) and the airport boards (`ikusi-aeropuerto/`) are
both drawn from them. An airport board's row is one run of modules; its
columns are only where the controller writes and the header prints its
legends (`columns.ts`), so every airport's layout runs on the same rows.

A replica whose shape follows its settings declares `size(options)` next
to its default `viewBox` (the ADIF boards, hung several together); one that
wants a source started differently declares `sourceDefaults`, by source id
(the ADIF boards start the simulation on long-distance trains, an Aena
board on flights, a Metro Bilbao sign on the Metro's network and on the
Metro's live feed). The ADIF boards
(`mp-electronics-adif/`) also show a way to draw tens of thousands of LEDs:
each panel is a pattern of unlit LEDs under a pattern of lit ones, clipped
to the runs of lit dots, so a change of text rewrites only those paths.

**Adding a replica:** a folder with `def.ts` and `index.ts`, its id in
`src/lib/replicas/ids.ts`, a line in `registry.ts`, its strings, and
`replica: { id }` in the catalog entry. Ids appear in other people's embed
URLs: never rename one.

## Settings and URLs

`ParamSchema` (`src/lib/params/`) is a declarative list of fields. From one
schema come the form, the query-string codec and validation. A `switch` field
is the one kind that is form-only: a checkbox that turns other settings on
and off together, with no value or URL key of its own. A `select` may name
`resets`: settings its choice invalidates, which go back to their defaults
when the form changes it (the station of a live source, when another
operator's feed is picked). A replica on a
page is fully described by a `PlayerConfig` (`src/lib/player/config.ts`):

| Group | Schema | Example keys |
| --- | --- | --- |
| Mode | — | `source=demo\|mitren\|device\|manual\|raw` |
| Source settings | the source's `config` | `op`, `station`, `network`, `svc`, `hora` |
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

An entry that says `published: false` is read from its folder and goes no
further: the catalog keeps it apart from the archive, so no page, listing,
picture or link of the site knows it, and its elements may name no entry at
all. What it keeps is its addresses, which are not free to be reused: every id
and alias it answered needs a line in `src/site/withdrawn.ts`, the one table
of addresses the archive no longer has an entry for — those of entries moved
to «Por documentar» among them — each with the page the visitor is sent to.
`src/lib/catalog/facets.ts` is the single table of organising axes: the
filterable list and every taxonomy page are generated from it.

### Installations

A replica is one unit. Units that hung together at one place (four boards
with a clock between them, two split-flap boards under one printed frame)
are archive entries of their own, *installations*: `kind: installation`,
with an `installation` block listing elements (another entry, its variant and
settings, its place in centimetres) and printed panels. They live in the
same collection as everything else, and take their technologies,
manufacturers, operators and modes from their elements, so every listing
and taxonomy page includes them.

`src/lib/installations/` resolves the layout (settings: the entry's, then its
variant's, then the installation's; height from the replica's shape) and
composes one SVG from each element's own drawing. On the page, one
`SourceHub` feeds every element: a `ReplicaElement` handed a hub leaves the
source to whoever handed it. Boards in the same `serie` carry on from one
another through `Placement.skip`. Each element links to its own entry.
An installation's photographs are listed after an element's own on the
element's page (`Catalog.photos`), and can be its cover.

### Pictures for social networks

An entry with a poster is previewed on social networks by a banner
(`src/site/social.ts`, served at `social/<id>.png`): the poster on the white
stage over a dark band with the site's wordmark (the entry's name is left
to the network, which prints the page's title). Other
entries, and families, are previewed by their cover photo. The banner is
turned into a PNG at build time by sharp (librsvg), which ignores
`textLength`, so `bakeTextLength` rewrites those texts into a scale or a
letter spacing from Helvetica's widths (`hardware/fonts/helvetica.ts`,
generated by `tools/helvetica-metrics.py`); and it is drawn at three times
the size, since librsvg drops pattern tiles smaller than a pixel. Baked are
the pictures that leave the browser — the banner, and the poster file
(`src/site/poster.ts`), which a search engine rasterises the same way; the
replica on the page keeps its own SVG, which the browser sets exactly. The
build needs Liberation Sans installed.

### What a search engine is told

`/sitemap.xml` lists every page worth indexing — the fixed pages, every entry,
every page an axis gives its values — and, with each entry, its pictures, as
`<image:image>`: its photographs at the largest rendition the site serves
(`src/site/photo.ts`, the one the gallery's thumbnail links to) and its
poster. A replica is inline SVG in the page, which leaves image search no
file to index, so the poster file is what stands for it, listed with the
entry that documents it. Redirects and embeds are left out, and say
`noindex`. Only `<image:loc>` is given: Google dropped the caption, title,
licence and location tags in 2022.

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
