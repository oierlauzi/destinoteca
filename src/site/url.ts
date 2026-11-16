import { getRelativeLocaleUrl } from 'astro:i18n';
import { DEFAULT_LOCALE } from '@/i18n';

/**
 * The only way to build an internal link. The site is served under a base
 * path (/destinoteca/) and may one day be served under a language prefix too;
 * this adds both, and a hand-written "/catalogo/" would get neither.
 */
export function href(path = '', locale: string = DEFAULT_LOCALE): string {
  return getRelativeLocaleUrl(locale, path.replace(/^\/+/, ''));
}

/** Where the site's own repository lives, for "edit this page" links. */
export const REPO_URL = 'https://github.com/oierlauzi/destinoteca';

export function editUrl(file: string): string {
  return `${REPO_URL}/edit/main/${file}`;
}
