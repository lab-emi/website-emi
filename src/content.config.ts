import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(), date: z.coerce.date(), summary: z.string(),
    category: z.enum(['Publication', 'Lab news', 'Award', 'Community', 'Research', 'Opportunity']),
    image: z.string(), images: z.array(z.string()), source: z.url().optional(),
    originalTitle: z.string().optional(), archivedOpportunity: z.boolean().default(false),
    titleUrl: z.url().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(), summary: z.string(), skills: z.array(z.string()),
    image: z.string().nullable(), status: z.enum(['Open', 'Filled', 'Archived']),
    source: z.url().optional(),
  }),
});

export const collections = { news, projects };
