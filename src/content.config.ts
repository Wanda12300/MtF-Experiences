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
  }).strict(),
});

export const collections = { listings };
