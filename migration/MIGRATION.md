# tudemi.com migration — 8 September 2026

This migration uses all nine publicly discoverable content pages from the original Google Sites website. Raw source pages are retained in `raw/`, the extracted inventory in `content-inventory.json`, and the mapping from source image URLs to local files in `assets.json`. These archives are not included in the public build.

| Source page | Migrated destination and coverage |
| --- | --- |
| `/home` | Homepage, 21 full news articles (2024–2026), research demonstrations and contact information |
| `/people` | 21 current member records: 1 PI, 8 PhD researchers, 10 MSc students and 2 visitors; 16 alumni entries; all portraits and links |
| `/publications` | All 50 original citation entries, presented as 49 distinct records, including one patent |
| `/grants-awards` | 7 grants, 10 awards and 5 sponsor logos |
| `/msc-projects_1` | All 4 project descriptions, original skills, contacts and illustrations |
| `/gallery` | 30 photos, original grouping, captions and linked names |
| `/join-us` | Original PhD placeholder and image, with clearer routes to MSc projects and enquiries |
| `/zitao-liang` | Complete biography, profile portrait, mountain photograph and all 14 carousel images |
| `/pepijn-kremers` | Complete biography and portrait |

All 104 distinct source image URLs have local WebP versions and thumbnails. The optimized main images total approximately 15.9 MB; thumbnails add approximately 4.8 MB. The three original YouTube demonstrations retain their video IDs and include direct watch links. The original location map remains embedded. Videos and the map require their external providers; photos and fonts do not.

## Editorial decisions

- **JaneEye** appeared under both 2025 and 2026 with the same title. It appears once in the publication list, with both original citations in its expandable publication history.
- **RadMamba** was listed under 2025, while its citation specifies ICASSP 2026. It is grouped under 2026 and retains `sourceYear: 2025` and the original citation.
- The **AIRHAR** announcement repeated the Nature Communications headline even though its body described AIRHAR. Its new title describes that body; `originalTitle` preserves the original heading.
- The March 2025 PhD vacancy announcement keeps its complete text and original deadline, with an archived-opportunity notice.
- Trivial spacing errors in names/years and the misspelling “Staring on Oct 1” were cleaned up. Citation wording and uncertain source spellings remain in the preserved source records.
- The PI's Google Scholar link uses `scholar.google.com` instead of `scholar.google.ch` with the same profile ID. The TU Delft profile URL uses HTTPS.
- Research descriptions, category labels and concise project summaries were synthesized from the supplied news, papers and projects. They introduce navigation and context, not new scientific claims or unverified openings.
- No awards, members, publications, funding amounts or project availability were independently invented. Availability and affiliations are a snapshot of the source website and should be maintained by the lab.

## Routes

The original `/people/`, `/publications/`, `/grants-awards/`, `/gallery/`, `/join-us/`, `/zitao-liang/` and `/pepijn-kremers/` paths remain available. `/msc-projects_1/` redirects to `/msc-projects/`. `/home/` redirects to the new homepage and maps the imported news section fragments to their dedicated article pages when JavaScript is enabled. Other old Google Sites heading fragments are not guaranteed to resolve.

New routes include `/research/`, four research-area pages, `/news/`, individual news and project pages, `/feed.xml`, `/sitemap.xml` and a useful 404 page.

## Verification

`npm run build` checks Astro and TypeScript before generating static HTML. `npm run validate` checks all 43 generated HTML pages, internal links/anchors, local assets, alt attributes, iframe titles, page metadata and migration record coverage. CI repeats these checks at `/` and `/website-emi/`.

This automated validation does not claim a visual browser review or test third-party website availability. The final local browser preview is provided for the owner's review. The optional WebMCP interface remains unverified in a supported browser context.

No GitHub Pages deployment or DNS cutover was performed as part of the local review handoff.
