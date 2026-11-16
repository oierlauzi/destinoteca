import { defineConfig } from 'astro/config';

// Published as a GitHub Pages project site, so everything lives under /destinoteca/.
// Internal links must go through src/lib/site/url.ts, never be written by hand.
export default defineConfig({
  site: 'https://oierlauzi.github.io',
  base: '/destinoteca',
  trailingSlash: 'always',
  // Spanish only for now, served unprefixed. Declared up front so that a later
  // /en/ can be added without moving any existing URL.
  i18n: {
    locales: ['es'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
});
