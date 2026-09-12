import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { parse } from 'parse5';

const root = resolve('dist');
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const site = process.env.SITE_URL || 'https://www.tudemi.com';
const errors = [];
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]); }
const files = walk(root);
const pages = new Map();
const imagePaths = new Set();
const outbound = new Set();
const attrs = node => Object.fromEntries((node.attrs || []).map(a=>[a.name,a.value]));
function nodes(tree) { return [tree, ...(tree.childNodes || []).flatMap(nodes)]; }
function contentText(node) { return ['script','style'].includes(node.tagName)?'':node.nodeName==='#text'?node.value:(node.childNodes||[]).map(contentText).join(' '); }
const normalize = text => text.normalize('NFKC').replace(/[\s\u200b\u200e\u200f\u2066-\u2069\ufeff]+/g,' ').replace(/\s+([,.;:)])/g,'$1').trim();
const json = name => JSON.parse(readFileSync(name,'utf8'));
function assert(condition, message) { if(!condition) errors.push(message); }

for(const file of files.filter(f=>f.endsWith('.html'))) {
  const tree = parse(readFileSync(file,'utf8'));
  const elements = nodes(tree).filter(n=>n.tagName);
  const ids = elements.map(n=>attrs(n).id).filter(Boolean);
  assert(ids.length===new Set(ids).size,`Duplicate element id: ${relative(root,file)}`);
  const redirect = elements.some(n=>n.tagName==='meta'&&attrs(n)['http-equiv']==='refresh');
  assert(elements.filter(n=>n.tagName==='title' && n.namespaceURI==='http://www.w3.org/1999/xhtml').length===1,`Missing/duplicate title: ${relative(root,file)}`);
  if(!redirect) {
    assert(elements.filter(n=>n.tagName==='h1').length===1,`Expected one H1: ${relative(root,file)}`);
    assert(elements.some(n=>n.tagName==='meta'&&attrs(n).name==='description'&&attrs(n).content),`Missing description: ${relative(root,file)}`);
    assert(elements.some(n=>n.tagName==='main'),`Missing main landmark: ${relative(root,file)}`);
  }
  pages.set(file,{elements,ids:new Set(ids),text:normalize(contentText(tree))});
}

let checkedLinks=0;
function checkUrl(raw, file) {
  if(!raw || /^(mailto:|tel:|data:|javascript:)/i.test(raw)) return;
  const route = '/' + relative(root,file).replace(/index\.html$/,'');
  const url = new URL(raw, site + base + route);
  if(url.origin!==new URL(site).origin) { outbound.add(url.href); return; }
  if(base && url.pathname!==base && !url.pathname.startsWith(base+'/')) { errors.push(`URL escapes base ${base}: ${raw} in ${relative(root,file)}`); return; }
  const path = decodeURIComponent(url.pathname.slice(base.length));
  let target = join(root,path);
  if(existsSync(target)&&statSync(target).isDirectory())target=join(target,'index.html');
  checkedLinks++;
  assert(existsSync(target),`Missing link/asset ${raw} in ${relative(root,file)}`);
  if(url.hash&&pages.has(target))assert(pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1))),`Missing anchor ${raw} in ${relative(root,file)}`);
  if(path.startsWith('/images/')) imagePaths.add(path.replace('/images/thumbs/','/images/'));
}
for(const [file,{elements}] of pages) for(const node of elements) {
  const a=attrs(node);
  if(node.tagName==='img') {
    assert('alt' in a,`Image lacks alt text: ${relative(root,file)} ${a.src}`);
    if(a.src)assert(a.width&&a.height,`Image lacks dimensions: ${relative(root,file)} ${a.src}`);
    if(a.src)assert(!/googleusercontent\.com/.test(a.src),`Remote source image: ${a.src}`);
  }
  if(node.tagName==='iframe')assert(a.title,`Iframe lacks title: ${relative(root,file)}`);
  if(node.tagName==='link'&&a.rel==='canonical')continue;
  for(const key of ['href','src','poster'])if(a[key])checkUrl(a[key],file);
}
for(const file of files.filter(f=>f.endsWith('.css')))for(const match of readFileSync(file,'utf8').matchAll(/url\(["']?([^)'"\s]+)["']?\)/g))checkUrl(match[1],file);

// Verify migration records actually reach the generated pages, not only the data files.
const people=json('src/data/people.json'), pubs=json('src/data/publications.json'), gallery=json('src/data/gallery.json'), funding=json('src/data/funding.json'), profiles=json('src/data/profiles.json');
const pageText=path=>pages.get(join(root,path,'index.html'))?.text || '';
for(const p of people.members)assert(pageText('people').includes(normalize(p.name)),`Member omitted: ${p.name}`);
for(const a of people.alumni)assert(pageText('people').includes(normalize(a.text)),`Alumnus omitted: ${a.text}`);
for(const p of pubs)for(const version of p.sourceVersions)assert(pageText('publications').includes(normalize(version.citation)),`Citation omitted: ${p.title}`);
for(const g of gallery) { assert(pageText('gallery').includes(normalize(g.caption)),`Gallery caption omitted: ${g.caption}`);assert(imagePaths.has(g.image),`Gallery image omitted: ${g.image}`); }
for(const category of ['grants','awards'])for(const f of funding[category])assert(pageText('grants-awards').includes(normalize(f.text)),`Funding/award omitted: ${f.text}`);
for(const collection of ['news','projects'])for(const file of readdirSync(`src/content/${collection}`).filter(f=>f.endsWith('.md'))) {
  const source=readFileSync(`src/content/${collection}/${file}`,'utf8');
  const data=JSON.parse(source.split('---')[1]);
  const path=`${collection==='news'?'news':'msc-projects'}/${file.replace(/\.md$/,'')}`;
  assert(pageText(path).includes(normalize(data.title)),`Content page omitted: ${file}`);
  for(const image of data.images || (data.image?[data.image]:[]))assert(imagePaths.has(image),`Content image omitted: ${file} ${image}`);
}
for(const p of profiles)assert(pageText(p.id).includes(p.name),`Profile omitted: ${p.id}`);
const inventory=json('migration/content-inventory.json');
const migratedAssets=new Set(Object.values(json('migration/assets.json')).map(a=>a.src));
for(const image of migratedAssets)assert(existsSync(join(root,image))&&existsSync(join(root,image.replace('/images/','/images/thumbs/'))),`Missing migrated image: ${image}`);
assert(pubs.length>=49&&pubs.reduce((n,p)=>n+p.sourceVersions.length,0)>=50,'Publication migration count decreased; review the source inventory.');
assert(people.members.length+people.alumni.length>=37,'People migration count decreased; review the source inventory.');
assert(gallery.length>=30&&funding.grants.length>=7&&funding.awards.length>=10,'Gallery/funding migration count decreased; review the source inventory.');
assert(inventory.length===9,'Expected all nine source pages in the migration archive.');
assert(readFileSync(join(root,'feed.xml'),'utf8').match(/<item>/g)?.length>=21,'RSS must include all 21 migrated news stories.');

// Academic-resource checks: a discoverable HTML abstract must lead to a public,
// searchable PDF through an absolute citation_pdf_url, including on project URLs.
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
for (const talk of json('src/data/talks.json')) {
  const route = `/talks/${talk.id}/`;
  const page = pages.get(join(root, route, 'index.html'));
  const metadata = page?.elements.filter(n => n.tagName === 'meta').map(attrs) || [];
  const meta = name => metadata.find(a => a.name === name)?.content;
  const url = path => new URL(base + path, site).href;
  assert(meta('citation_title') === talk.title && meta('citation_author') && meta('citation_publication_date'), `Missing academic citation metadata: ${route}`);
  assert(meta('citation_pdf_url') === url(talk.pdf), `Incorrect absolute citation PDF URL: ${route}`);
  assert(!metadata.some(a => /^(robots|googlebot|bingbot|baiduspider)$/i.test(a.name || '') && /noindex|nofollow|none/i.test(a.content || '')), `Talk must remain indexable: ${route}`);
  assert(talk.abstract.every(paragraph => page?.text.includes(normalize(paragraph))), `Author-written abstract must appear in the static HTML: ${route}`);
  const pdf = readFileSync(join(root, talk.pdf));
  assert(talk.pdf.endsWith('.pdf') && pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length < 5_000_000, `Talk must link to a PDF under Scholar's 5 MB limit: ${route}`);
  assert(pdf.length === talk.bytes, `Update the displayed PDF size after replacing the file: ${route}`);
  assert(sitemap.includes(`<loc>${url(route)}</loc>`) && sitemap.includes(`<loc>${url(talk.pdf)}</loc>`), `Talk and PDF missing from sitemap: ${route}`);
  const publicationLinks = pages.get(join(root, 'publications/index.html'))?.elements.filter(n => n.tagName === 'a').map(attrs) || [];
  assert(publicationLinks.some(a => a.href === base + route) && publicationLinks.some(a => a.href === base + talk.pdf), `Talk and PDF need plain HTML links on Publications: ${route}`);
}

if(errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} validation failure(s).`); process.exit(1); }
console.log(`Validated ${pages.size} HTML pages, ${checkedLinks} local links/assets, ${migratedAssets.size} migrated images and all source record counts.`);
console.log(`Base path: ${base || '/'} · ${outbound.size} external URLs preserved (network availability not asserted).`);
