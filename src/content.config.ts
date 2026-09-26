import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { resourceCategories } from './content/categories/index';

const categorySlugs: Set<string> = new Set(resourceCategories.map(({ slug }) => slug));

const listings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/listings' }),
  schema: z.object({
    name: z.string().min(1),
    category: z.string().refine((slug) => categorySlugs.has(slug), 'Unknown resource category'),
    url: z.url().refine((value) => /^https?:\/\//i.test(value), 'URL must use HTTP or HTTPS').optional(),
    strikethrough: z.boolean().default(false),
    featuredOrder: z.number().int().positive().optional(),
  }).strict(),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    pageTitle: z.string().min(1).optional(),
    intro: z.string().min(1).optional(),
    searchHint: z.string().min(1).optional(),
    featuredEyebrow: z.string().min(1).optional(),
    featuredTitle: z.string().min(1).optional(),
    viewAll: z.string().min(1).optional(),
  }).strict(),
});

export const collections = { listings, pages };
