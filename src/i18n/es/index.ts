import { catalog } from './catalog';
import { mitren } from './mitren';
import { player } from './player';
import { site } from './site';

// One file per area so that they can grow independently. Keys are prefixed by
// area (`site.`, `catalog.`, `player.`, `mitren.`), so they cannot collide.
export const es: Record<string, string> = { ...site, ...catalog, ...player, ...mitren };
