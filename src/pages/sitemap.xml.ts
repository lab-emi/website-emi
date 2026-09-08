import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { href } from '../lib/site';
import profiles from '../data/profiles.json';
import { research } from '../data/research';
import talks from '../data/talks.json';

export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/people/', '/publications/', '/research/', '/news/', '/gallery/', '/open-positions/', '/msc-projects/', '/grants-awards/', '/join-us/', ...profiles.map(p=>`/${p.id}/`), ...research.map(r=>`/research/${r.id}/`), ...(await getCollection('news')).map(n=>`/news/${n.id}/`), ...(await getCollection('projects')).map(p=>`/msc-projects/${p.id}/`)];
  const talkPaths = talks.flatMap(talk => [{ path: `/talks/${talk.id}/`, lastmod: talk.updated }, { path: talk.pdf, lastmod: talk.updated }]);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${new URL(href(path),site)}</loc></url>`).join('')}${talkPaths.map(({path,lastmod})=>`<url><loc>${new URL(href(path),site)}</loc><lastmod>${lastmod}</lastmod></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
