/*
 * Addresses of equipment the archive no longer shows: entries moved to «Por
 * documentar» (src/texts/es/pendientes.md), whose folder is gone, and entries
 * kept on file but taken off the site with `published: false`. Either way the
 * address may be linked from elsewhere, so each id keeps a page that sends the
 * visitor where something is still said about that equipment.
 *
 * An id here must not be held by a published entry or an alias. If the
 * equipment comes back, give it this id again and remove the line.
 */
export const WITHDRAWN: Readonly<Record<string, string>> = {
  /** Site path the visitor is sent to, under the base path. */
  'page-iberica-vestibulo-atocha': 'pendientes/#panel-del-vestíbulo-de-atocha-cercanías',
  /** Its boards carry DSTA's plate, and «Por documentar» is where they are described. */
  'tableros-alta-velocidad-sevilla-santa-justa': 'pendientes/#dsta',
  /** Its boards are the ADIF board of MP Electronics, which has an entry of its own. */
  'acceso-vestibulo-subterraneo-chamartin': 'catalogo/mp-electronics-adif-teleindicador/',
  /** The former id of that installation, which can no longer redirect to it. */
  'salidas-vestibulo-subterraneo-chamartin': 'catalogo/mp-electronics-adif-teleindicador/',
};
