import { catalog } from './catalog';
import { adif } from './adif';
import { mitren } from './mitren';
import { player } from './player';
import { site } from './site';

// One file per area so that they can grow independently. Keys are prefixed by
// area (`site.`, `catalog.`, `player.`, `mitren.`, `adif.`), so they cannot collide.
export const es: Record<string, string> = { ...site, ...catalog, ...player, ...mitren, ...adif };
