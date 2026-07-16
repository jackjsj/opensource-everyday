import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const reports = await getCollection('reports');
  const index = reports.map(r => ({
    title: r.data.title,
    description: r.data.description,
    tags: r.data.tags,
    date: r.data.date,
    url: `${import.meta.env.BASE_URL}reports/${r.id}/`,
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' }
  });
};
