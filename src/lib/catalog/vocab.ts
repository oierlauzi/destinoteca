/**
 * The controlled vocabularies of the catalog. Ids are neutral English slugs:
 * they are stored in content files and appear in URLs and query strings, so
 * they are never renamed. Their Spanish names live in the i18n dictionary
 * under `catalog.<vocabulary>.<id>`.
 */

/** What the equipment is for. Single-valued: an entry is one kind of thing. */
export const KINDS = [
  'platform-indicator',
  'departure-board',
  'concourse-board',
  'clock',
  'onboard-display',
  'other',
] as const;
export type Kind = (typeof KINDS)[number];

export const TRANSPORT_MODES = ['rail', 'metro', 'tram', 'bus', 'air', 'ferry'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

/** Where the model stands today, as a whole. Single units carry their own status in `installations`. */
export const STATUSES = ['in-service', 'retiring', 'retired', 'unknown'] as const;
export type Status = (typeof STATUSES)[number];

export const INSTALLATION_STATUSES = ['in-service', 'retired', 'preserved', 'unknown'] as const;
export type InstallationStatus = (typeof INSTALLATION_STATUSES)[number];

/** Noteworthy extras, from a closed list so that they can be filtered on. */
export const FEATURES = [
  'integrated-clock',
  'double-sided',
  'scrolling-text',
  'night-lighting',
  'printed-legends',
  'sound',
] as const;
export type Feature = (typeof FEATURES)[number];

/** What a company did for a model. One company can appear once per role. */
export const MANUFACTURER_ROLES = ['manufacturer', 'integrator', 'electronics', 'software', 'design', 'licensee'] as const;
export type ManufacturerRole = (typeof MANUFACTURER_ROLES)[number];

export const OPERATOR_ROLES = ['operator', 'owner', 'brand'] as const;
export type OperatorRole = (typeof OPERATOR_ROLES)[number];

export const SITE_TYPES = ['station', 'airport', 'bus-station', 'museum', 'other'] as const;
export type SiteType = (typeof SITE_TYPES)[number];

/**
 * Photo licences. `rights-reserved-credited` is somebody else's photograph,
 * reproduced with credit for documentation; it is removed on request.
 */
export const LICENSES = [
  'cc0',
  'public-domain',
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc-by-sa-3.0',
  'cc-by-nc-sa-4.0',
  'rights-reserved-credited',
] as const;
export type License = (typeof LICENSES)[number];

/** Licences that do not require naming an author. */
export const LICENSES_WITHOUT_AUTHOR: readonly License[] = ['cc0', 'public-domain'];

export const LICENSE_URLS: Partial<Record<License, string>> = {
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/deed.es',
  'cc-by-4.0': 'https://creativecommons.org/licenses/by/4.0/deed.es',
  'cc-by-sa-4.0': 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
  'cc-by-sa-3.0': 'https://creativecommons.org/licenses/by-sa/3.0/deed.es',
  'cc-by-nc-sa-4.0': 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es',
};

/** `stub`: enough to be listed. `article`: a full entry, held to the rules in validate.ts. */
export const STAGES = ['stub', 'article'] as const;
export type Stage = (typeof STAGES)[number];

/** Flat, lower-case, hyphenated; no dots (they vanish from URLs) and no path segments. */
export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** ISO 3166-1 alpha-2, lower case. */
export const COUNTRY_PATTERN = /^[a-z]{2}$/;
