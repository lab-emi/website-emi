import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { href, site, escapeXml } from '../lib/site';

export const GET: APIRoute = async ({ site: origin }) => {
  const news = (await getCollection('news')).sort((a,b)=>b.data.date.getTime()-a.data.date.getTime());
  const absolute = (path: string) => new URL(href(path), origin).href;
  const items = news.map(n => `<item><title>${escapeXml(n.data.title)}</title><link>${absolute(`/news/${n.id}/`)}</link><guid isPermaLink="true">${absolute(`/news/${n.id}/`)}</guid><pubDate>${n.data.date.toUTCString()}</pubDate><description>${escapeXml(n.data.summary)}</description><category>${n.data.category}</category></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>EMI Lab news</title><link>${absolute('/')}</link><description>${escapeXml(site.description)}</description><language>en</language><atom:link href="${absolute('/feed.xml')}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
