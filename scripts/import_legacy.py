"""One-time, reproducible migration. Run with:
uv run --with beautifulsoup4 --with pillow --with markdownify python scripts/import_legacy.py

Reads the archived source pages. Never scrapes or rewrites content during a site build.
Original image downloads are kept in .local/originals; optimized copies are committed.
"""
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
from urllib.request import urlopen, Request
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps
from markdownify import markdownify
import re, json, hashlib, unicodedata, io

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['home','people','publications','grants-awards','msc-projects_1','gallery','join-us','zitao-liang','pepijn-kremers']
for folder in ['migration/raw','src/data','src/content/news','src/content/projects','public/images','public/images/thumbs','.local/originals']:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)

def write_json(path, data):
    (ROOT/path).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')

def text(el):
    value = el.get_text() if hasattr(el,'get_text') else str(el)
    value = re.sub(r'[\u200b\u200e\u200f\u2066-\u2069\ufeff]', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    value = re.sub(r'202\s+([0-9])', r'202\1', value)
    value = value.replace('201 7','2017').replace('N etherlands','Netherlands').replace('Ne therlands','Netherlands').replace('Smart S ens','SmartSens')
    return value

def slug(value):
    value=unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',value).strip('-')

def url(value):
    parsed=urlparse(value)
    if parsed.hostname in ['www.google.com','google.com'] and parsed.path=='/url':
        value=parse_qs(parsed.query).get('q',[value])[0]
    value=value.replace('https://www.tudemi.com/','/').replace('https://tudemi.com/','/')
    if value == '/home': return '/'
    if value.startswith('/') and not value.startswith('//'):
        value = value.replace('/msc-projects_1','/msc-projects')
        if '#' not in value and not Path(value).suffix: value=value.rstrip('/')+'/'
    return value

soups={}
for page in PAGES:
    path=ROOT/f'migration/raw/{page}.html'
    if not path.exists(): path.write_bytes(urlopen('https://www.tudemi.com/'+page).read())
    soups[page]=BeautifulSoup(path.read_text(),'html.parser')

def image_sources(element):
    results=[]
    for node in element.select('img[src], [style*="background-image"]'):
        src=node.get('src')
        if not src:
            found=re.search(r'url\([\"\']?(https?[^)\"\']+)',node.get('style',''))
            if found: src=found[1]
        if src and ('googleusercontent.com' in src): results.append(src)
    return list(dict.fromkeys(results))

sources=list(dict.fromkeys(src for s in soups.values() for sec in s.select('section') for src in image_sources(sec)))
asset_cache=ROOT/'migration/assets.json'
assets=json.loads(asset_cache.read_text()) if asset_cache.exists() else {}

def download(source):
    if source in assets and (ROOT/'public'/assets[source]['src'].lstrip('/')).exists(): return source,assets[source]
    key=hashlib.sha256(source.encode()).hexdigest()[:14]
    path=ROOT/f'.local/originals/{key}'
    if not path.exists():
        try:
            path.write_bytes(urlopen(Request(source,headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.tudemi.com/'}),timeout=40).read())
        except Exception as error:
            print('ASSET ERROR', source, str(error), flush=True)
            raise
    data=path.read_bytes()
    im=ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
    original_size=im.size
    im=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    im.thumbnail((2400,2400),Image.Resampling.LANCZOS)
    full=ROOT/f'public/images/{key}.webp'
    im.save(full,format='WEBP',quality=90,method=5)
    width,height=im.size
    im.thumbnail((800,800),Image.Resampling.LANCZOS)
    im.save(ROOT/f'public/images/thumbs/{key}.webp',format='WEBP',quality=84,method=5)
    return source,{'src':f'/images/{key}.webp','thumb':f'/images/thumbs/{key}.webp','width':width,'height':height,'originalWidth':original_size[0],'originalHeight':original_size[1],'sha256':hashlib.sha256(data).hexdigest(),'bytes':full.stat().st_size}

with ThreadPoolExecutor(max_workers=8) as pool:
    for source,data in pool.map(download,sources):
        assets[source]=data
        write_json('migration/assets.json',assets)
write_json('migration/assets.json',assets)
print(f'Downloaded {len(assets)} source assets; web copies: {sum(a["bytes"] for a in assets.values())/1e6:.1f} MB',flush=True)

def images(element): return [assets[src] for src in image_sources(element)]

def clean(element):
    doc=BeautifulSoup(str(element),'html.parser')
    for x in doc.select('script, style, svg, [aria-hidden="true"], a[aria-label="Copy heading link"]'): x.decompose()
    for x in list(doc.find_all(True)):
        if x.name is None: continue
        if x.name=='span':
            style=x.get('style','')
            if 'font-weight: 700' in style: x.name='strong'
            elif 'font-style: italic' in style: x.name='em'
            else: x.unwrap();continue
        if x.name not in ['p','strong','em','u','sub','sup','ul','ol','li','a','h1','h2','h3','h4','br','blockquote','table','thead','tbody','tr','th','td']:
            x.unwrap();continue
        href=x.get('href','')
        x.attrs={}
        if x.name=='a':
            href=url(href)
            if href.startswith(('https://','http://','/','#','mailto:')): x['href']=href
            else: x.unwrap()
    for x in list(doc.find_all(['p','strong','em','a'])):
        if not text(x): x.decompose()
    return str(doc)

def content(element): return '\n'.join(clean(x) for x in element.select('.tyJCtd.mGzaTb'))
def frontmatter(data,body): return '---\n'+json.dumps(data,ensure_ascii=False,indent=2)+'\n---\n\n'+markdownify(body,heading_style='ATX',bullets='-').strip()+'\n'
def links(element):
    out=[]
    for a in element.select('a[href]'):
        href=url(a['href'])
        if not href.startswith('#') and href:
            label=text(a) or (a.select_one('img').get('alt','') if a.select_one('img') else '')
            if label and {'label':label,'url':href} not in out: out.append({'label':label,'url':href})
    return out

# News: preserve each full article, all images and all original outbound links.
dates=['2026-07-13','2026-07-03','2026-06-18','2026-06-15','2026-05-06','2026-03-13','2026-02-23','2025-11-11','2025-11-11','2025-09-05','2025-06-20','2025-05-23','2025-04-30','2025-03-21','2025-03-10','2025-02-15','2024-07-18','2024-05-29','2024-04-17','2024-02-02','2024-01-19']
news=[]
for i,sec in enumerate(soups['home'].select('section')[2:23]):
    original=text(sec.select_one('h1'))
    title=re.sub(r'^[^A-Za-z]+','',original).replace(' ✨','')
    if i==8: title='AIRHAR: energy-efficient radar intelligence, from algorithms to hardware'
    doc=BeautifulSoup(content(sec),'html.parser')
    heading=doc.find('h1')
    if heading:heading.decompose()
    first=doc.find('p')
    if first:
        match=re.match(r'^\s*(?:[A-Za-z]+\.?\s*)[\d\s]+,?\s*20[\d\s]{2,3}',first.get_text())
        # Remove date text nodes in order, preserving subsequent article formatting.
        if match:
            remain=len(match[0])
            for node in list(first.find_all(string=True)):
                if remain<=0:break
                n=len(str(node));node.replace_with(str(node)[remain:]);remain-=n
        if not text(first):first.decompose()
    paragraphs=[text(p) for p in doc.find_all('p') if len(text(p))>50]
    excerpt=paragraphs[0] if paragraphs else text(doc)
    if len(excerpt)>220: excerpt=excerpt[:217].rsplit(' ',1)[0]+'…'
    category='Publication' if any(t in title.lower() for t in ['published','accepted','paper']) else 'Lab news'
    if any(t in title.lower() for t in ['grant','fellowship','won','award','prize']):category='Award'
    if any(t in title.lower() for t in ['visit','lecture','speaks']):category='Community'
    if i in [8,14,18]:category='Research'
    if i==13:category='Opportunity'
    item={'title':title,'date':dates[i],'summary':excerpt,'category':category,'image':images(sec)[0]['src'],'images':[a['src'] for a in images(sec)],'source':'https://www.tudemi.com/home#'+sec['id'],'originalTitle':original}
    heading_links=links(sec.select_one('h1'))
    if heading_links:item['titleUrl']=heading_links[0]['url']
    if i==13:item['archivedOpportunity']=True
    key=dates[i]+'-'+slug(title)
    (ROOT/f'src/content/news/{key}.md').write_text(frontmatter(item,str(doc)))
    news.append({'id':key,**item})

# People: photos and labels share the same Google Sites layout column.
people=[];sections=soups['people'].select('section')
pi={'id':'chang-gao','name':'Chang Gao','role':'Group leader','detail':'Assistant Professor of Edge AI','image':images(sections[1])[0]['src'],'url':'https://gaochangw.github.io','links':links(sections[1]),'bioHtml':content(sections[1])}
people.append(pi)
for indices,role in [([3,4],'PhD researcher'),([6,7,8],'MSc student'),([10],'Visitor')]:
    for index in indices:
        for col in sections[index].select('.LS81yb > .JNdkSc'):
            if not col.select('img'): continue
            line=text(col);first_link=links(col)[0]
            raw_name=first_link['label'].split('(')[0].strip()
            name=' '.join(reversed(raw_name.split(', '))) if ', ' in raw_name else raw_name
            detail=line[len(raw_name):].strip().strip('()').replace('Co-supervised','Co-supervised').replace('Staring on Oct 1','Starting on Oct 1')
            people.append({'id':slug(name),'name':name,'role':role,'detail':detail,'image':images(col)[0]['src'],'url':first_link['url'],'links':links(col),'sourceText':line})
alumni=[]
for li in sections[12].select('li'):
    if li.find('li'): continue
    if len(text(li))<5: continue
    a=links(li)
    alumni.append({'text':text(li),'html':clean(li),'url':a[0]['url'] if a else ''})
write_json('src/data/people.json',{'members':people,'alumni':alumni,'alumniImage':images(sections[12])[0]['src']})

# Gallery: retain every image, caption and original grouping.
gallery=[];group='Our students'
for sec in soups['gallery'].select('section')[:-1]:
    if not images(sec):
        group=text(sec);continue
    caption_nodes=[x for x in sec.select('.zfr3Q') if text(x)]
    captions=[text(x) for x in caption_nodes]
    assert len(captions)==len(images(sec)), ('Gallery caption mismatch',sec['id'])
    for im,caption,node in zip(images(sec),captions,caption_nodes):
        gallery.append({'id':'photo-'+str(len(gallery)+1),'group':group,'caption':caption,'captionHtml':clean(node),'image':im['src'],'width':im['width'],'height':im['height']})
write_json('src/data/gallery.json',gallery)

# Publications: keep original citations in the dataset; merge the one exact title duplicate.
publications=[];year=2026
for node in soups['publications'].select('section')[1].find_all(['p','li']):
    if node.name=='p' and not node.find_parent('li'):
        if re.fullmatch(r'20\d{2}',text(node)):year=int(text(node))
        continue
    if node.name!='li' or node.find('li') or len(text(node))<60:continue
    citation=text(node)
    match=re.search(r'[“\"](.+?)[”\"]',citation)
    if not match:raise ValueError('Unparsed publication: '+citation)
    title=match[1].rstrip(',').strip()
    authors=citation[:match.start()].rstrip(' ,')
    venue=citation[match.end():].lstrip(' ,')
    venue=re.sub(r'\(?\s*Code:\s*https?[^)\s]+\)?','',venue).strip()
    entry_links=links(node)
    primary=next((a['url'] for a in entry_links if len(a['label'])>35),entry_links[0]['url'] if entry_links else '')
    code=next((a['url'] for a in entry_links if 'github.com' in a['url']),None)
    effective_year=2026 if title.startswith('RadMamba:') else year
    existing=next((p for p in publications if p['title']==title),None)
    if existing:
        existing['sourceVersions'].append({'year':year,'citation':citation,'html':clean(node)})
        continue
    tag='Sparse computing'
    lower=(title+' '+venue).lower()
    if any(k in lower for k in ['predistort','dpd','amplifier','gan devices']):tag='RF & mixed-signal AI'
    elif any(k in lower for k in ['eye track','event-based','event based','vision','extended reality','xr ','hand track']):tag='Event-based vision'
    elif any(k in lower for k in ['speech','audio','keyword','radar','seizure','cochlea','spoken','language','prosthesis','implantable']):tag='Speech & sensing'
    pub={'id':slug(title[:90]),'title':title,'authors':authors,'venue':venue,'year':effective_year,'sourceYear':year,'type':'Patent' if 'U.S. Patent' in citation else 'Publication','topic':tag,'url':primary,'code':code,'links':entry_links,'citation':citation,'sourceVersions':[{'year':year,'citation':citation,'html':clean(node)}]}
    publications.append(pub)
write_json('src/data/publications.json',publications)

# Full project descriptions are Markdown, including skill requirements and contacts.
projects=[]
for i,sec in enumerate(soups['msc-projects_1'].select('section')[1:5]):
    title=text(sec.select_one('h2'));doc=BeautifulSoup(content(sec),'html.parser');doc.find('h2').decompose()
    item={'title':title,'summary':['Design and measure an FPGA accelerator that learns to correct ADC non-idealities.','Co-design an efficient neural speech model and FPGA implementation for real-time voice cloning.','Pair low-power ADC front-ends with task-specific neural signal enhancement.','Adapt learning-based calibration to phase-locked loop non-idealities.'][i],'skills':[['PyTorch','SystemVerilog / VHDL','Vivado'],['Python / PyTorch','Verilog / SystemVerilog','Vivado / Vitis'],['PyTorch','Signal processing','Embedded systems'],['MATLAB / Simulink','PyTorch','RF fundamentals']][i],'image':images(sec)[0]['src'] if images(sec) else None,'status':'Open','source':'https://www.tudemi.com/msc-projects_1'}
    key=slug(title);(ROOT/f'src/content/projects/{key}.md').write_text(frontmatter(item,str(doc)))
    projects.append({'id':key,**item})

grants_sec=soups['grants-awards'].select('section')
grants=[];scope='Led by EMI'
for node in grants_sec[1].find_all(['p','li']):
    if node.name=='p' and not node.find_parent('li'):
        if 'core member' in text(node):scope='EMI as a core member'
    elif node.name=='li' and not node.find('li'):
        grants.append({'text':text(node),'html':clean(node),'scope':scope})
awards=[{'text':text(li),'html':clean(li)} for li in grants_sec[3].select('li') if not li.find('li') and text(li)]
sponsors=[{'name':name,'image':im['src']} for name,im in zip(['Dutch Research Council (NWO)','European Commission (MSCA)','NXP','Ampleon','GlobalFoundries'],images(grants_sec[5]))]
write_json('src/data/funding.json',{'grants':grants,'awards':awards,'sponsors':sponsors})

profiles=[]
for page in ['zitao-liang','pepijn-kremers']:
    s=soups[page];secs=s.select('section')[1:-1]
    profiles.append({'id':page,'name':text(secs[0].find(['h1','h2'])),'html':'\n'.join(content(sec) for sec in secs),'images':[im for sec in secs for im in images(sec)],'links':[a for sec in secs for a in links(sec)],'carouselCaptions':[text(x) for x in s.select('.Ecdcnc') if text(x)],'source':'https://www.tudemi.com/'+page})
write_json('src/data/profiles.json',profiles)

home_secs=soups['home'].select('section')
write_json('src/data/legacy.json',{'logo':images(home_secs[0])[0]['src'],'homeIntroHtml':content(home_secs[0]),'demosHtml':content(home_secs[24]),'videoEmbeds':[x.get('src') or x.get('data-src') for x in home_secs[24].select('iframe')],'contactHtml':content(home_secs[26]),'contactEmbeds':[x.get('src') or x.get('data-src') for x in home_secs[26].select('iframe')],'joinHtml':content(soups['join-us'].select('section')[0]),'joinImages':[im for sec in soups['join-us'].select('section') for im in images(sec)]})

# Archive extracted page text, image inventory and outbound links for a completeness audit.
archive=[]
for page,s in soups.items():
    secs=s.select('section')
    archive.append({'page':page,'source':'https://www.tudemi.com/'+page,'text':'\n\n'.join(text(sec) for sec in secs),'images':[im['src'] for sec in secs for im in images(sec)],'links':[link for sec in secs for link in links(sec)]})
write_json('migration/content-inventory.json',archive)
write_json('migration/summary.json',{'date':'2026-09-08','pages':len(PAGES),'news':len(news),'memberRecords':len(people),'alumniRecords':len(alumni),'sourcePublicationEntries':50,'distinctPublicationAndPatentRecords':len(publications),'mscProjects':len(projects),'galleryPhotos':len(gallery),'profileCarouselImages':14,'assets':len(assets),'grants':len(grants),'awards':len(awards),'sponsors':len(sponsors)})
print((ROOT/'migration/summary.json').read_text(),flush=True)
