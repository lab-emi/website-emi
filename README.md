# EMI Lab website

The Lab of Efficient Machine Intelligence at TU Delft. A custom Astro website migrated from [tudemi.com](https://www.tudemi.com/) on 8 September 2026.

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
| Members, links and alumni | `src/data/people.json` |
| Personal biographies and photo collections | `src/data/profiles.json` |
| Publications, authors, venues and links | `src/data/publications.json` |
| Grants, awards and sponsors | `src/data/funding.json` |
| Gallery photos, captions and original caption links | `src/data/gallery.json` |
| Research directions and selected papers | `src/data/research.ts` |
| Homepage slideshow photos and order | `heroPhotos` in `src/pages/index.astro` (gallery photo IDs) |
| Shared contact details | `src/lib/site.ts` |
| Colours, fonts and shared spacing | `src/styles/global.css` |
| Shared header and footer | `src/layouts/Layout.astro` |

Copy an existing Markdown file to add a news story or project. The block between `---` delimiters contains the metadata; the rest is the article body. Existing files use JSON syntax inside the frontmatter so field names and arrays are explicit. Keep news dates in `YYYY-MM-DD` format. News sorts automatically and enters the RSS feed. Content schemas catch invalid fields at build time.

Upload an image to `public/images/` and a smaller version with the same filename to `public/images/thumbs/`. Use a root-relative path such as `/images/example.webp` in content. Internal links are automatically adjusted for GitHub Pages. Keep image captions and descriptive alt text meaningful.

The homepage rotates through six lab photos every two seconds, with a short crossfade and matching captions. Hovering or keyboard focus pauses rotation; leaving resumes after a full two seconds. A pause/play button is available on touch screens too. Background tabs pause, and the slideshow starts paused when the visitor prefers reduced motion.

Publication records contain the original citation in `citation` and `sourceVersions`. The site does not invent missing DOIs or BibTeX metadata. Add a record with a unique `id`, its real title/authors/venue/year, an existing research topic, article URL and optional code URL. Search, year groups and research-area filters update automatically. Adjust the author-name matcher in `src/components/Publication.astro` when the lab adds an author whose abbreviated name is not yet recognised.

When a student leaves, move their record to the alumni list instead of removing their history. Set a project's `status` to `Filled` or `Archived` when its availability changes. Historical PhD announcements retain their original deadlines and are labelled as archived.

The importer and migration archive are a historical snapshot, not a CMS. **Do not rerun the importer after editorial updates** unless you intend to replace the imported data and Markdown files. Normal builds never fetch the old website.

## GitHub Pages

The check workflow validates both the root URL and `/website-emi/` on pushes and pull requests. Publishing uses a separate **manual** workflow, so pushing content while the design is being reviewed does not publish the site.

To publish a GitHub Pages preview after review:

1. In this repository, choose **Settings → Pages → Source → GitHub Actions**.
2. Run **Actions → Publish to GitHub Pages**, leaving `use_custom_domain` unchecked.
3. The site will use `https://lab-emi.github.io/website-emi/`.

To reproduce this path locally:

```sh
SITE_URL=https://lab-emi.github.io BASE_PATH=/website-emi npm run build
SITE_URL=https://lab-emi.github.io BASE_PATH=/website-emi npm run validate
```

When the approved site is ready for the existing domain, configure `www.tudemi.com` in GitHub Pages, update the domain's DNS and rerun the manual publishing workflow with `use_custom_domain` checked. It builds with `/` as the base and includes `CNAME`. No domain or DNS settings were changed during this migration. Follow GitHub's current [custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) and [workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Migration and verification

See [migration/MIGRATION.md](migration/MIGRATION.md) for the page inventory, counts, editorial decisions and preserved routes. The validator checks generated HTML, local URLs, anchors, images, metadata and source-record coverage. It does not assert the continued availability of external websites or videos.

The publication page also feature-detects the proposed WebMCP API and exposes `filter_publications` through the same visible filters. Regular browsing requires no WebMCP support. Its browser contract has not been verified in a supported WebMCP context.

Photos, figures, logos and text were supplied through the existing lab website and retain their respective ownership. The locally served Manrope and Newsreader fonts use the SIL Open Font License; their licences are included in `public/fonts/`.
