/**
 * A composition: archive entries hung together as they really were, at one
 * place, with the printed panels that went with them. Everything is measured
 * in centimetres on the wall, from its top-left corner.
 */
export type Settings = Record<string, string | number | boolean>;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A line of a printed panel. `size` is the height of its capitals, in cm. */
export interface PanelLine {
  text: string;
  size: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  /** Spacing between letters, in cm. */
  spacing?: number;
  /** Letters of brushed metal rather than printed in `color`. */
  finish?: 'brushed-aluminium';
  /** Spread the letters out to fill the plate's width, inside its margins. */
  stretch?: boolean;
}

export type PanelLogo = 'adif' | 'cercanias';

/** A printed (serigraphed) plate: a coloured ground, a few lines and perhaps a logo. */
export interface PanelSpec {
  fill: string;
  /** A thin edge around the plate. */
  edge?: string;
  /** Where the block of lines sits: in the middle, or against the top or bottom. */
  valign?: 'top' | 'middle' | 'bottom';
  lines: PanelLine[];
  /** Height of the logo in cm; it sits in the bottom right corner. `symbolColor` paints the adif symbol apart from the word. */
  logo?: { kind: PanelLogo; height: number; color?: string; symbolColor?: string };
}

/** How an element is written in the entry: an archive entry, or a printed panel. */
export interface ElementInput {
  id: string;
  /** An entry of the archive with a replica. */
  model?: string;
  variant?: string;
  /** Replica settings, by URL key, as in an embed URL. */
  params?: Settings;
  /** Height only for panels: an entry's height follows from its replica. */
  at: { x: number; y: number; width: number; height?: number };
  /** Boards in the same series carry on from one another, in list order. */
  serie?: string;
  /** The platforms a platform sign serves. */
  platforms?: string[];
  panel?: PanelSpec;
}

export interface CompositionInput {
  size: { width: number; height: number };
  background?: string;
  elements: ElementInput[];
}

/** What the layout needs to know of an archive entry. */
export interface EntryInput {
  id: string;
  name: string;
  replica?: { id: string; params?: Settings };
  variants: { id: string; name: string; replicaPreset?: Settings }[];
}

export interface ReplicaMember extends Box {
  kind: 'replica';
  id: string;
  /** The archive entry it shows, and its name. */
  entry: string;
  name: string;
  variant?: string;
  replica: string;
  /** The entry's settings, then its variant's, then the composition's own. */
  params: Settings;
  /** How many services the earlier boards of its series show. */
  skip: number;
  platforms: string[];
}

export interface PanelMember extends Box {
  kind: 'panel';
  id: string;
  panel: PanelSpec;
}

export type Member = ReplicaMember | PanelMember;

export interface ResolvedComposition {
  width: number;
  height: number;
  background?: string;
  members: Member[];
}
