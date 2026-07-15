import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()),
    githubUrl: z.string().url(),
    language: z.string(),
    license: z.string(),
    stars: z.number(),
    ratings: z.object({
      activity: z.number(),
      documentation: z.number(),
      easeOfUse: z.number(),
      community: z.number(),
      overall: z.number(),
    }),
  }),
});

export const collections = { reports };
