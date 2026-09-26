import { z } from 'astro/zod';
import categories from './categories.json' with { type: 'json' };

const categorySchema = z.array(z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
}).strict()).min(1).refine((items) => new Set(items.map(({ slug }) => slug)).size === items.length,
  'Category slugs must be unique');

export const resourceCategories = categorySchema.parse(categories).sort((a, b) => a.order - b.order);
