import { createHash } from 'node:crypto';
import { getImage } from 'astro:assets';
import sharp from 'sharp';
import { bakeTextLength, h, SVG_NS, toString } from '@/lib/hardware';
import { nestSvg } from '@/lib/installations/render';
import type { Model, Photo } from '@/site/catalog';
import { hasPoster, posterSvg } from '@/site/poster';
import { href } from '@/site/url';
import { wordmark } from '@/site/wordmark';

/*
 * The picture a social network shows when an entry is shared: the entry's
 * poster (its replica, or its installation) on the white ground replicas
 * stand on across the site, over a dark band with the site's name, so the
 * picture says where it comes from. The entry's name is left to the network,
 * which prints the page's title beside it. Networks want a raster image, so
 * it is drawn as SVG and turned into a PNG at build time.
 */

export const BANNER = { width: 1200, height: 630 } as const;

const BAND = 84;
const PAD = { x: 48, y: 40 };
const STAGE = '#ffffff';
const HOUSING = '#121212';
const DOT = '#aede5a';
const MARK_HEIGHT = 30;

/** Whether an entry has a banner of its own; otherwise its cover photo stands in. */
export const hasBanner = hasPoster;

/** The viewBox's aspect of a standalone SVG. */
function aspect(svg: string): number {
  const box = /<svg[^>]*\sviewBox="([^"]+)"/.exec(svg)?.[1]?.trim().split(/[\s,]+/).map(Number);
  if (!box || box.length !== 4 || !(box[2]! > 0) || !(box[3]! > 0)) throw new Error('Banner: the poster has no viewBox');
  return box[2]! / box[3]!;
}

/** The banner as SVG, from an entry's poster. */
export function composeBanner(poster: string): string {
  const { width: W, height: H } = BANNER;
  const stage = H - BAND;
  const room = { width: W - 2 * PAD.x, height: stage - 2 * PAD.y };
  const ratio = aspect(poster);
  const size = ratio > room.width / room.height ? { width: room.width, height: room.width / ratio } : { width: room.height * ratio, height: room.height };
  const box = { x: (W - size.width) / 2, y: (stage - size.height) / 2, ...size };

  const mark = wordmark();
  const markWidth = (mark.width * MARK_HEIGHT) / mark.height;
  const markBox = { x: (W - markWidth) / 2, y: stage + (BAND - MARK_HEIGHT) / 2 };
  const body =
    toString(h('rect', { x: 0, y: 0, width: W, height: stage, fill: STAGE })) +
    toString(h('rect', { x: 0, y: stage, width: W, height: BAND, fill: HOUSING })) +
    `<svg x="${markBox.x}" y="${markBox.y}" width="${markWidth}" height="${MARK_HEIGHT}" viewBox="0 0 ${mark.width} ${mark.height}" color="${DOT}">${mark.dots}</svg>` +
    nestSvg(poster, 'poster', box);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="${SVG_NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>\n`;
}

const banners = new Map<string, Promise<string>>();

/** An entry's banner as SVG, drawn once per build. */
export function bannerSvg(model: Model): Promise<string> {
  let svg = banners.get(model.id);
  if (!svg) {
    svg = posterSvg(model).then((poster) => composeBanner(poster));
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
