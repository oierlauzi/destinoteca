import { createHash } from 'node:crypto';
import { getImage } from 'astro:assets';
import sharp from 'sharp';
import { bakeTextLength, h, helveticaWidth, SVG_NS, toString } from '@/lib/hardware';
import { nestSvg } from '@/lib/installations/render';
import type { Model, Photo } from '@/site/catalog';
import { hasPoster, posterSvg } from '@/site/poster';
import { href } from '@/site/url';
import { wordmark } from '@/site/wordmark';

/*
 * The picture a social network shows when an entry is shared: the entry's
 * poster (its replica, or its installation) on the white ground replicas
 * stand on across the site, over a dark band with the site's name and the
 * entry's. Networks want a raster image, so it is drawn as SVG and turned
 * into a PNG at build time.
 */

export const BANNER = { width: 1200, height: 630 } as const;

const BAND = 112;
const PAD = { x: 48, y: 36 };
const STAGE = '#ffffff';
const HOUSING = '#121212';
const HOUSING_INK = '#f4f2e9';
const DOT = '#aede5a';
const FONT = "'Liberation Sans', Arial, Helvetica, sans-serif";
const MARK_HEIGHT = 26;
/** Sizes the name may take on one line, and then on two. */
const ONE_LINE = { max: 36, min: 28 };
const TWO_LINES = { max: 30, min: 22 };
const LEADING = 1.18;

/** Whether an entry has a banner of its own; otherwise its cover photo stands in. */
export const hasBanner = hasPoster;

/** The lines and size the name is set in to fit `room`, shrinking, then wrapping, then cutting short. */
export function fitName(name: string, room: number): { lines: string[]; size: number } {
  const width = (text: string, size: number) => helveticaWidth(text, size, true);
  for (let size = ONE_LINE.max; size >= ONE_LINE.min; size--) if (width(name, size) <= room) return { lines: [name], size };
  const words = name.split(' ');
  for (let size = TWO_LINES.max; size >= TWO_LINES.min; size--) {
    // The break that leaves the longer line shortest.
    let best: string[] | undefined;
    let bestWidth = Infinity;
    for (let i = 1; i < words.length; i++) {
      const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
      const widest = Math.max(...lines.map((line) => width(line, size)));
      if (widest <= room && widest < bestWidth) [best, bestWidth] = [lines, widest];
    }
    if (best) return { lines: best, size };
  }
  const size = TWO_LINES.min;
  let first = '';
  let i = 0;
  while (i < words.length && width(`${first} ${words[i]}`.trim(), size) <= room) first = `${first} ${words[i++]}`.trim();
  let rest = words.slice(i).join(' ');
  while (rest && width(`${rest}…`, size) > room) rest = rest.slice(0, -1).trimEnd();
  return { lines: [first, `${rest}…`], size };
}

/** The viewBox's aspect of a standalone SVG. */
function aspect(svg: string): number {
  const box = /<svg[^>]*\sviewBox="([^"]+)"/.exec(svg)?.[1]?.trim().split(/[\s,]+/).map(Number);
  if (!box || box.length !== 4 || !(box[2]! > 0) || !(box[3]! > 0)) throw new Error('Banner: the poster has no viewBox');
  return box[2]! / box[3]!;
}

/** The banner as SVG, from an entry's poster and its name. */
export function composeBanner(poster: string, name: string): string {
  const { width: W, height: H } = BANNER;
  const stage = H - BAND;
  const room = { width: W - 2 * PAD.x, height: stage - 2 * PAD.y };
  const ratio = aspect(poster);
  const size = ratio > room.width / room.height ? { width: room.width, height: room.width / ratio } : { width: room.height * ratio, height: room.height };
  const box = { x: (W - size.width) / 2, y: (stage - size.height) / 2, ...size };

  const mark = wordmark();
  const markWidth = (mark.width * MARK_HEIGHT) / mark.height;
  const title = fitName(name, W - 3 * PAD.x - markWidth);
  const lineHeight = title.size * LEADING;
  // Cap height of the font, to centre the lines on the band by their letters.
  const cap = 0.716 * title.size;
  const first = stage + (BAND - (cap + lineHeight * (title.lines.length - 1))) / 2 + cap;

  const nodes = [
    h('rect', { x: 0, y: 0, width: W, height: stage, fill: STAGE }),
    h('rect', { x: 0, y: stage, width: W, height: BAND, fill: HOUSING }),
    h(
      'text',
      { x: PAD.x, 'font-family': FONT, 'font-size': title.size, 'font-weight': 700, fill: HOUSING_INK },
      title.lines.map((line, i) => h('tspan', { x: PAD.x, y: Math.round((first + i * lineHeight) * 100) / 100 }, [line])),
    ),
  ];
  const markBox = { x: W - PAD.x - markWidth, y: stage + (BAND - MARK_HEIGHT) / 2 };
  const body = nodes.map(toString).join('') +
    `<svg x="${markBox.x}" y="${markBox.y}" width="${markWidth}" height="${MARK_HEIGHT}" viewBox="0 0 ${mark.width} ${mark.height}" color="${DOT}">${mark.dots}</svg>` +
    nestSvg(poster, 'poster', box);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="${SVG_NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>\n`;
}

const banners = new Map<string, Promise<string>>();

/** An entry's banner as SVG, drawn once per build. */
export function bannerSvg(model: Model): Promise<string> {
  let svg = banners.get(model.id);
  if (!svg) {
    svg = posterSvg(model).then((poster) => composeBanner(poster, model.data.name));
    banners.set(model.id, svg);
  }
  return svg;
}

/**
 * Drawn three times as large and then scaled down: librsvg drops pattern
 * tiles smaller than a pixel or so, and an LED board in an installation has
 * dots that small.
 */
const SUPERSAMPLE = 3;

/** An entry's banner as a PNG file. */
export async function bannerPng(model: Model): Promise<Buffer> {
  const svg = bakeTextLength(await bannerSvg(model));
  const big = await sharp(Buffer.from(svg), { density: 72 * SUPERSAMPLE }).png().toBuffer();
  return sharp(big).resize(BANNER.width, BANNER.height).png({ compressionLevel: 9 }).toBuffer();
}

/** The address of an entry's banner, with the fingerprint of what it shows. */
export async function bannerHref(model: Model): Promise<string> {
  const version = createHash('sha1').update(await bannerSvg(model)).digest('hex').slice(0, 10);
  return `${href(`social/${model.id}.png`).replace(/\/$/, '')}?v=${version}`;
}

/** A photograph as a preview: a JPEG at most 1200 pixels wide, which every network takes (not all take WebP). */
export async function photoPreview(photo: Photo): Promise<{ src: string; width: number; height: number; alt: string }> {
  const image = await getImage({ src: photo.src, width: Math.min(photo.src.width, 1200), format: 'jpg' });
  return { src: image.src, width: Number(image.attributes.width), height: Number(image.attributes.height), alt: photo.alt };
}
