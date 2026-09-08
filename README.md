# EMI Lab website

The Lab of Efficient Machine Intelligence at TU Delft. A custom Astro website migrated from [tudemi.com](https://www.tudemi.com/) on 8 September 2026.

Live site: [www.tudemi.com](https://www.tudemi.com/), hosted on GitHub Pages.

The site builds to static HTML. It has no application server, database or paid service dependency. Local JavaScript handles publication search, citation copying, category filters, the mobile menu and the image viewer.

## Run locally

Use Node.js 24 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

Open <http://localhost:4321>. For the production output:

```sh
npm run build
npm run validate
npm run preview
```

## Update the content

| Content | Edit here |
| --- | --- |
| News and announcements | `src/content/news/*.md` — one file per story |
| MSc projects, descriptions and requirements | `src/content/projects/*.md` |
| Jobs, MSc project entry point, collaboration and contact | `src/pages/join-us.astro` |
| Members, links and alumni | `src/data/people.json` |
| Personal biographies and photo collections | `src/data/profiles.json` |
| Publications, authors, venues and links | `src/data/publications.json` |
| Talks, author-written abstracts, DOI and PDF metadata | `src/data/talks.json` |
| Talk PDFs and downloadable citations | `public/files/talks/` and `public/citations/` |
| Grants, awards and sponsors | `src/data/funding.json` |
| Gallery photos, captions and original caption links | `src/data/gallery.json` |
| Research directions and selected papers | `src/data/research.ts` |
| Homepage slideshow photos, order and framing | `heroPhotos` in `src/pages/index.astro` (gallery photo IDs and object positions) |
| Homepage research illustrations | `public/images/research/` — image paths and alt text in `src/data/research.ts` |
| Browser favicon | `public/favicon.png` |
| Shared contact details | `src/lib/site.ts` |
| Colours, fonts and shared spacing | `src/styles/global.css` |
| Shared header and footer | `src/layouts/Layout.astro` |

The favicon is the supplied EMI logo centred on a transparent 2048 × 2048 canvas. The original 2048 × 1247 artwork and alpha channel are preserved without resizing or stretching. Update the version query in `src/layouts/Layout.astro` when replacing it so browsers fetch the new icon.

Copy an existing Markdown file to add a news story or project. The block between `---` delimiters contains the metadata; the rest is the article body. Existing files use JSON syntax inside the frontmatter so field names and arrays are explicit. Keep news dates in `YYYY-MM-DD` format. News sorts automatically and enters the RSS feed. Content schemas catch invalid fields at build time.

Upload an image to `public/images/` and a smaller version with the same filename to `public/images/thumbs/`. Use a root-relative path such as `/images/example.webp` in content. Internal links are automatically adjusted for GitHub Pages. Keep image captions and descriptive alt text meaningful.

The homepage automatically rotates through ten lab photos every two seconds, with a short crossfade and matching captions. It starts with Chang and Chris, Yizhuo and Chris, and Ang at ISCAS 2025. Other featured people appear once; Yizhuo appears in three photos. Hovering does not interrupt playback. Keyboard focus pauses rotation; leaving resumes after a full two seconds. A pause/play button is available on touch screens too. Background tabs pause. Reduced-motion preferences remove the crossfade animation while retaining automatic playback.

Publication records contain the original citation in `citation` and `sourceVersions`. The site does not invent missing DOIs or BibTeX metadata. Add a record with a unique `id`, its real title/authors/venue/year, an existing research topic, article URL and optional code URL. Search, year groups and research-area filters update automatically. Adjust the author-name matcher in `src/components/Publication.astro` when the lab adds an author whose abbreviated name is not yet recognised.

When a student leaves, move their record to the alumni list instead of removing their history. Set a project's `status` to `Filled` or `Archived` when its availability changes. Historical PhD announcements retain their original deadlines and are labelled as archived.

The importer and migration archive are a historical snapshot, not a CMS. **Do not rerun the importer after editorial updates** unless you intend to replace the imported data and Markdown files. Normal builds never fetch the old website.

## Talks and search discovery

The ISSCC 2026 talk has a dedicated `/talks/isscc-2026-open-source-ai-analog-correction/` page with the full abstract, author, event date, DOI, citation and direct PDF link. Its bibliographic details and author-written abstract come from the Zenodo DOI registration, cross-checked through [DataCite](https://api.datacite.org/dois/10.5281/zenodo.20402931). The PDF is an unchanged copy of the supplied 40-slide file (4,661,958 bytes). Publications and the related ISSCC news story link to both the HTML page and the PDF.

Talk pages render full text in static HTML and include Highwire `citation_*` metadata, Dublin Core fields, a self-canonical URL, and JSON-LD that identifies the resource as a presentation. Both the landing page and PDF are listed in the sitemap; `robots.txt` permits crawling. Use `updated` for an actual resource-page or PDF update date. Do not relabel slides as a journal or conference paper to influence indexing.

These settings support discovery by Google, Bing and Baidu. Search engines decide whether and when to index a resource. Google Scholar additionally requires eligible scholarly content; presentation slides are not guaranteed inclusion even when their PDF and metadata satisfy its technical rules. See the [Scholar inclusion guidelines](https://scholar.google.com/intl/en/scholar/inclusion.html). Search-console submissions and HTTPS availability must be checked separately from the local validator.

`public/indexnow-key.txt` is the public site-verification file for IndexNow submissions to Bing and participating search engines. It is not an account credential. Keep the file available after a submission so the service can verify ownership. Google Search Console and Baidu's search-resource platform use their own submission flows; an IndexNow acknowledgement is not proof of indexing.

## GitHub Pages

The check workflow validates both the root URL and `/website-emi/` on pushes and pull requests. Publishing uses a separate **manual** workflow, so pushing content does not publish the site automatically.

To publish an update to the live site:

1. In this repository, choose **Settings → Pages → Source → GitHub Actions**.
2. Run **Actions → Publish to GitHub Pages**, leaving `use_custom_domain` checked.
3. The site uses `https://www.tudemi.com/`, with `/` as the base path and a `CNAME` file in the deployment.

The project-path build is retained for validation or a future preview after removing the custom domain. To reproduce it locally:

```sh
SITE_URL=https://lab-emi.github.io BASE_PATH=/website-emi npm run build
SITE_URL=https://lab-emi.github.io BASE_PATH=/website-emi npm run validate
```

The production domain uses `www.tudemi.com` in GitHub Pages. Squarespace DNS points `www` to `lab-emi.github.io` with a CNAME, and the apex `@` uses GitHub's four A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`. GitHub redirects the apex to `www`. Keep `use_custom_domain` checked while this domain is configured. Follow GitHub's current [custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) and [workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Migration and verification

See [migration/MIGRATION.md](migration/MIGRATION.md) for the page inventory, counts, editorial decisions and preserved routes. The validator checks generated HTML, local URLs, anchors, images, metadata and source-record coverage. It does not assert the continued availability of external websites or videos.

The publication page also feature-detects the proposed WebMCP API and exposes `filter_publications` through the same visible filters. Regular browsing requires no WebMCP support. Its browser contract has not been verified in a supported WebMCP context.

Photos, figures, logos and text were supplied through the existing lab website and retain their respective ownership. The locally served Manrope and Newsreader fonts use the SIL Open Font License; their licences are included in `public/fonts/`.
