# AGENTS.md

Notes for coding agents working on destinoteca. Read
[ARCHITECTURE.md](ARCHITECTURE.md) for how the code fits together and
[CONTRIBUTING.md](CONTRIBUTING.md) for the archive's rules; this file adds what
is easy to get wrong.

## What this is

A static Astro site: a Spanish-language **archive** documenting and preserving
railway passenger-information signs (platform indicators, departure boards,
station clocks), each entry with its history, photographs, sources and, where
possible, an interactive web replica. It is published on GitHub Pages under
`/destinoteca/`.

## Commands

```sh
npm ci
npm run check      # astro check: must end with 0 errors, 0 warnings, 0 hints
npm test           # vitest
npm run build      # also validates the whole catalog (src/site/catalog.ts)
npm run lint:dist  # every built link must stay under /destinoteca/
```

A change is done when all four pass. For anything visual, also render it in
Chromium (Playwright is preinstalled) and look at it next to the photographs
it is drawn from. Replicas that a change should not touch must still render
byte for byte the same; compare their `renderToString` output before and after.

## Writing the archive

- **Spanish**, plain and factual. Call the site an *archivo*, never a
  *catálogo*, and never say anything about selling or buying equipment.
- **Only what can be sustained.** Every fact traces to a source or a
  photograph; guesses are labelled as such, and what is not known goes in
  the "Lo que no se sabe" section. No invented dates: ADIF exists since 2005,
  so no ADIF equipment is dated earlier unless a source proves a refurbished
  older unit.
- **Proportions, not sizes.** Photographs give proportions only. Never
  estimate an absolute size (cm, m) from them, in an entry or in a code
  comment; geometry is measured in units of one of the sign's own parts,
  such as a character's pitch. Sizes appear only when a source states them.
- **No over-literal descriptions.** Captions, alt texts and articles do not
  transcribe what a screen shows in a photograph; they say what the picture
  is.
- **No sections** on faults ("Averías"), on the replica itself ("La
  réplica") or listing components.
- **Manufacturer pages** describe the company, not its products; the products
  are the entries that link to it.
- **Families** tell what their members share (history, where they were put, how the
  system worked, curiosities); an entry tells only what is its own. An entry
  can belong to several families (`families:`), such as a city's network and
  one station's signs.
- Entry ids are permanent. To rename, move the folder and keep the old id in
  `aliases`.
- Equipment found in a source but not ready for an entry (unknown place,
  photos too poor, credit missing) goes in the public page
  `src/texts/es/pendientes.md` («Por documentar»), with links and what is
  missing, so readers can fill the gaps. Move it out when it gets an entry.
  An entry moved back there leaves its id in `src/site/moved.ts`, which
  keeps the old address redirecting to its section.

## Photographs

- Downscale to at most 2400 px, JPEG quality 85, EXIF stripped.
- Credit every photo: `author`, and `sourceUrl` or `source`, plus `license`.
  Photos from Google Maps are credited to "Usuario de Google Maps".
- The maintainer's own photos are `ownWork: true`, `cc-by-sa-4.0`. Other
  people's photos the maintainer sends are published credited,
  `rights-reserved-credited`, unless told otherwise.
- **Reference-only material is never committed**, not even temporarily:
  zips or photos the maintainer sends "for reference" or "for
  photogrammetry" are used to measure and read, then left out.
- Logos are SVG vector paths, drawn from the official artwork, never raster
  images.

## Replicas

- One replica draws **one unit**. Units hung together at a place are an
  *installation* (an archive entry with `kind: installation`), not an option
  of the replica. Printed plates that belong to the installation go in it;
  parts of the unit itself (an MP board's green header) stay in the replica.
- Where an entry's units stood is its `locations` («Ubicaciones conocidas»),
  not to be confused with installations.
- Replica ids, option `urlKey`s and frame keys appear in embed URLs on other
  sites: never rename them. Unknown keys in old URLs must keep decoding to
  something sensible.
- Text that has to look the same everywhere uses a font stack with known
  metrics (Helvetica, Arial, Liberation Sans) and, where it must fit a box,
  `textLength`.
- Fonts read from photographs keep a `SEEN` set and a `RECONSTRUCTED` set, so
  that what was observed stays apart from what was drawn to match.
- A new replica is registered in `src/lib/replicas/ids.ts`,
  `src/lib/replicas/registry.ts` and `src/i18n/es/player.ts`, with tests in
  `tests/`.

## Installations

- Laid out in centimetres from the wall's top-left corner; an element's
  height follows from its replica's shape. These are the drawing's units,
  scaled from proportions measured in photographs, not measured sizes, and
  the entry says so.
- Every element is an archive entry; the page links each one, and each entry
  lists the installations it is part of.
- Boards that carry on from one another share a `serie`.
- A photograph of an installation goes in the installation only: it also
  shows on the page of each element, whose `cover` can name it.

## Git

- Commit straight to `main` and push; the deploy runs on every push.
- Commit messages: a short imperative subject, and a body saying why when it
  is not obvious. Never force-push or rewrite published history.
