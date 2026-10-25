import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { href } from '../lib/site';
import profiles from '../data/profiles.json';
import { allResearch } from '../data/research';
import talks from '../data/talks.json';

export const GET: APIRoute = async ({ site }) => {
  const news = (await getCollection('news')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const latestNewsDate = news[0]?.data.date.toISOString().slice(0, 10);
  const entries: Array<{ path: string; lastmod?: string }> = [
    { path: '/', lastmod: latestNewsDate },
    { path: '/people/' },
    { path: '/publications/' },
    { path: '/research/', lastmod: latestNewsDate },
    { path: '/news/', lastmod: latestNewsDate },
    { path: '/gallery/' },
    { path: '/msc-projects/' },
    { path: '/grants-awards/' },
    { path: '/join-us/' },
    ...profiles.map(p => ({ path: `/${p.id}/` })),
    ...allResearch.map(r => ({ path: `/research/${r.id}/`, ...(r.id === 'ai-native-chip-design' ? { lastmod: latestNewsDate } : {}) })),
    ...news.map(n => ({ path: `/news/${n.id}/`, lastmod: n.data.date.toISOString().slice(0, 10) })),
    ...(await getCollection('projects')).map(p => ({ path: `/msc-projects/${p.id}/` })),
    ...talks.flatMap(talk => [{ path: `/talks/${talk.id}/`, lastmod: talk.updated }, { path: talk.pdf, lastmod: talk.updated }]),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(({ path, lastmod }) => `<url><loc>${new URL(href(path), site)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
