import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  COUNTRY_PATTERN,
  FEATURES,
  ID_PATTERN,
  INSTALLATION_STATUSES,
  KINDS,
  LICENSES,
  MANUFACTURER_ROLES,
  OPERATOR_ROLES,
  SITE_TYPES,
  STAGES,
  STATUSES,
  TRANSPORT_MODES,
} from './lib/catalog/vocab';
import { REPLICA_IDS } from './lib/replicas/ids';

/*
 * The catalog. One folder per entry, named after its id, holding `index.md`
 * (frontmatter = facts, body = the article in Spanish) and, for models, its
 * photos. Only files called index.md are entries, so a future `en.md` beside it will not
 * turn into a second entry.
 *
 * Schemas check shape only. What needs the whole catalog (dangling
 * references, id collisions, what an `article` must have) is checked in
 * src/site/catalog.ts, which every page goes through.
 */

const entries = (folder: string) => glob({ base: `./src/content/${folder}`, pattern: '*/index.md' });

const id = z.string().regex(ID_PATTERN, { error: 'lower-case words joined by hyphens' });
const country = z.string().regex(COUNTRY_PATTERN, { error: 'lower-case ISO 3166-1 alpha-2 code' });
const year = z.number().int().min(1800).max(2100);
/** Replica settings by URL key, as in an embed URL. */
const settings = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
/** A date as precise as is known: YYYY, YYYY-MM or YYYY-MM-DD. Quoted in YAML. */
const partialDate = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, { error: 'YYYY, YYYY-MM or YYYY-MM-DD, in quotes' });

/** Bibliography: what an entry's facts come from. */
const references = z
  .array(
    z.object({
      title: z.string(),
      author: z.string().optional(),
      publication: z.string().optional(),
      date: partialDate.optional(),
      url: z.url().optional(),
      note: z.string().optional(),
    }),
  )
  .default([]);

const models = defineCollection({
  loader: entries('models'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Other names it goes by, for search. */
      alsoKnownAs: z.array(z.string()).default([]),
      summary: z.string().max(300),
      kind: z.enum(KINDS),
      /** A composition takes these from its elements as well; anything else needs at least one of each. */
      technologies: z.array(reference('technologies')).default([]),
      transportModes: z.array(z.enum(TRANSPORT_MODES)).default([]),
      features: z.array(z.enum(FEATURES)).default([]),
      manufacturers: z.array(z.object({ ref: reference('manufacturers'), role: z.enum(MANUFACTURER_ROLES) })).default([]),
      manufacturerUnknown: z.boolean().default(false),
      operators: z
        .array(
          z.object({
            ref: reference('operators'),
            role: z.enum(OPERATOR_ROLES).default('operator'),
            from: year.optional(),
            to: year.optional(),
          }),
        )
        .default([]),
      /** The families it belongs to; one can be in several (all of a network, and those of one station). */
      families: z.array(reference('families')).default([]),
      /** Countries of use. Where it was made is the manufacturer's business. */
      countries: z.array(country).default([]),
      years: z.object({ from: year.optional(), to: year.optional(), circa: z.boolean().optional() }).optional(),
      status: z.enum(STATUSES).default('unknown'),
      /** The parts an assembly is made of, when they have names of their own. */
      components: z
        .array(
          z.object({
            name: z.string(),
            designation: z.string().optional(),
            description: z.string().optional(),
            manufacturer: reference('manufacturers').optional(),
          }),
        )
        .default([]),
      /** Where units stood. Exactly one of site, placeName or fleet. */
      installations: z
        .array(
          z
            .object({
              site: reference('sites').optional(),
              placeName: z.string().optional(),
              fleet: z.string().optional(),
              line: z.string().optional(),
              from: year.optional(),
              to: year.optional(),
              status: z.enum(INSTALLATION_STATUSES).default('unknown'),
              note: z.string().optional(),
            })
            .refine((i) => [i.site, i.placeName, i.fleet].filter((v) => v !== undefined).length === 1, {
              error: 'give exactly one of site, placeName or fleet',
            }),
        )
        .default([]),
      /** Differences that do not need a replica of their own: mounting, lettering, colour. */
      variants: z
        .array(
          z.object({
            id,
            name: z.string(),
            description: z.string().optional(),
            /** Replica settings that show this variant, by URL key. */
            replicaPreset: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
          }),
        )
        .default([]),
      photos: z
        .array(
          z.object({
            id,
            src: image(),
            alt: z.string().min(10),
            caption: z.string().optional(),
            date: partialDate.optional(),
            place: z.string().optional(),
            author: z.string().optional(),
            /** True for a photograph taken by whoever contributes it. */
            ownWork: z.boolean().default(false),
            sourceUrl: z.url().optional(),
            /** Where it comes from when there is no URL: a magazine, an archive. */
            source: z.string().optional(),
            license: z.enum(LICENSES),
            permission: z.string().optional(),
          }),
        )
        .default([]),
      /** Id of the photo used on cards. Defaults to the first. */
      cover: id.optional(),
      /** Bibliography. */
      references,
      replica: z
        .object({
          id: z.enum(REPLICA_IDS),
          /** Initial settings, by URL key, as in an embed URL. */
          params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
          /**
           * What the replica shows in the still image used on catalog cards:
           * a hand-typed frame and appearance, by URL key, as in an embed URL.
           */
          poster: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
        })
        .optional(),
      /**
       * For `kind: composition`: entries of the archive hung together as they
       * were at the place of its one installation, with the printed panels
       * that went with them. Measured in centimetres from the top left.
       */
      composition: z
        .object({
          size: z.object({ width: z.number().positive(), height: z.number().positive() }),
          /** The wall behind, when it shows between the elements. */
          background: z.string().optional(),
          elements: z
            .array(
              z
                .object({
                  id,
                  /** An entry of the archive with a replica. */
                  model: reference('models').optional(),
                  variant: id.optional(),
                  /** Replica settings, by URL key, over the entry's and its variant's. */
                  params: settings.optional(),
                  /** An entry's height follows from its replica; a panel gives its own. */
                  at: z.object({ x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive().optional() }),
                  /** Boards of one series carry on from one another, in the order listed. */
                  serie: z.string().optional(),
                  platforms: z.array(z.string()).optional(),
                  /** A printed plate that belongs to the installation rather than to any entry. */
                  panel: z
                    .object({
                      fill: z.string(),
                      edge: z.string().optional(),
                      valign: z.enum(['top', 'middle', 'bottom']).optional(),
                      lines: z.array(
                        z.object({
                          text: z.string(),
                          /** Height of the capitals, in cm. */
                          size: z.number().positive(),
                          weight: z.number().optional(),
                          color: z.string().optional(),
                          align: z.enum(['left', 'center', 'right']).optional(),
                          spacing: z.number().optional(),
                          /** Letters of satin aluminium standing off the wall, rather than printed in `color`. */
                          finish: z.enum(['aluminium']).optional(),
                          /** Spread the letters out to fill the plate's width. */
                          stretch: z.boolean().optional(),
                        }),
                      ),
                      logo: z
                        .object({ kind: z.enum(['adif', 'cercanias']), height: z.number().positive(), color: z.string().optional(), symbolColor: z.string().optional() })
                        .optional(),
                    })
                    .optional(),
                })
                .refine((e) => (e.model === undefined) !== (e.panel === undefined), { error: 'give exactly one of model or panel' })
                .refine((e) => e.panel === undefined || e.at.height !== undefined, { error: 'a panel needs at.height' }),
            )
            .min(1),
        })
        .optional(),
      /** Former ids of this entry. Each leaves a redirect behind. */
      aliases: z.array(id).default([]),
      stage: z.enum(STAGES).default('stub'),
    }),
});

const families = defineCollection({
  loader: entries('families'),
  schema: z.object({
    name: z.string(),
    summary: z.string().max(300),
    manufacturers: z.array(reference('manufacturers')).default([]),
    /** The member that pictures the family on cards: one of its own models. */
    cover: reference('models').optional(),
    /** Sources for what the family's article says of all its members. */
    references,
    aliases: z.array(id).default([]),
  }),
});

const manufacturers = defineCollection({
  loader: entries('manufacturers'),
  schema: z.object({
    name: z.string(),
    alsoKnownAs: z.array(z.string()).default([]),
    summary: z.string().max(300),
    /** Where the company is, or was, based. */
    country: country.optional(),
    city: z.string().optional(),
    /** What became of it, in words; it may not be in the catalog. */
    successor: z.string().optional(),
    website: z.url().optional(),
    aliases: z.array(id).default([]),
  }),
});

const operators = defineCollection({
  loader: entries('operators'),
  schema: z.object({
    name: z.string(),
    alsoKnownAs: z.array(z.string()).default([]),
    summary: z.string().max(300),
    /** The company a brand or network belongs to. */
    parent: reference('operators').optional(),
    country: country.optional(),
    transportModes: z.array(z.enum(TRANSPORT_MODES)).default([]),
    website: z.url().optional(),
    aliases: z.array(id).default([]),
  }),
});

const technologies = defineCollection({
  loader: entries('technologies'),
  schema: z.object({
    name: z.string(),
    alsoKnownAs: z.array(z.string()).default([]),
    summary: z.string().max(300),
    aliases: z.array(id).default([]),
  }),
});

/** Places where equipment stood. Data only; ids are `<country>/<name>`. */
const sites = defineCollection({
  loader: glob({ base: './src/content/sites', pattern: '**/*.yaml' }),
  schema: z.object({
    name: z.string(),
    alsoKnownAs: z.array(z.string()).default([]),
    type: z.enum(SITE_TYPES).default('station'),
    country,
    /** ISO 3166-2, e.g. ES-MD. */
    region: z.string().optional(),
    town: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    /** By scheme: adif, uic, iata... */
    codes: z.record(z.string(), z.string()).default({}),
  }),
});

export const collections = { models, families, manufacturers, operators, technologies, sites };
