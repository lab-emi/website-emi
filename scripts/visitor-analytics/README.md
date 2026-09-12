# Homepage visitor statistics

The static homepage reads a public, read-only Google Apps Script endpoint. Google holds the owner's Analytics authorization server-side. The public response contains country-level aggregates and dates only; it contains no credentials, IP addresses, user identifiers, referrers or individual events.

The configured service was deployed on 12 September 2026 as **EMI Visitor Statistics**, using the owner's explicitly approved `analytics.readonly` permission. Both unauthenticated JSON and JSONP were verified against real GA4 data. The initial historical report spans 6 August 2022 through 11 September 2026, with 8,019 distinct users across 92 located countries and territories. These are verification results, not values hardcoded into the widget.

## Data contract

- Historical metric: GA4 `totalUsers`, from all available records through yesterday, filtered to stream `3883300841` and hostnames `www.tudemi.com` / `tudemi.com`. The earliest reported date is discovered from GA4 rather than assumed. The query floor is 2020-01-01, before this GA4 property's creation.
- Realtime metric: GA4 `activeUsers` over minutes 29–0, filtered to the same web stream. The realtime API has no hostname dimension. Keep this stream exclusive to the EMI website. A 30-minute active user is not necessarily still viewing the page.
- Totals are separate undimensioned reports. Never add daily or country unique-user counts to derive a global unique-user total.
- Historical results cache for six hours; realtime results cache for one minute. Locking prevents concurrent refreshes. Failures cache briefly, return `status: unavailable`, and never masquerade as zero. Google may evict cached entries early.
- The homepage polls once per minute while visible, expires realtime responses after two minutes, and rejects malformed responses. Google thresholds and collection gaps can make reports incomplete.
- An absent country row means no reported visits, not proof of zero visitors. Unlocated visits can appear as “Location unavailable”.
- GA4 returned both empty and `(not set)` country identifiers. Their combined distinct-user total is queried separately, so the public payload has one unlocated row without adding possibly overlapping buckets.

## Google setup

1. Create a standalone Apps Script project in the Google account that can read this GA4 property.
2. Copy `Code.gs` into its editor. In Project Settings, show the `appsscript.json` manifest; replace it with the manifest here. It enables Analytics Data API v1beta and requests only `analytics.readonly`.
3. Run `verifyVisitorSource` and authorize the Google Analytics read-only scope. Verify both reports succeed and inspect the actual first date, total and country rows. The execution log is owner-only.
4. Deploy a version as a web app, executing as the owner, with access “Anyone”. Only `doGet` is public. Do not expose tokens or general-purpose Analytics query parameters. The callback is validated and all Analytics queries are fixed in source.
5. Copy the deployment's `/exec` URL into `src/data/visitor-config.json`. The URL is public, not a credential. Fetch it unauthenticated and validate the response with `parseVisitorData` before publishing the homepage.
6. Future code updates require a new Apps Script deployment version. Merely saving the editor does not update `/exec`.

`Code.gs` is the maintained source. Keep the deployed script and manifest aligned with these files. Revoking its Google authorization or deleting its deployment makes the homepage show an unavailable state. Do not use browser cookies or a GA OAuth token in GitHub Actions or frontend code.

Google documents [the Analytics Data service](https://developers.google.com/apps-script/advanced/analyticsdata), [country and visitor metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema), [realtime reporting](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport) and [ContentService JSONP](https://developers.google.com/apps-script/guides/content). JSONP is used for this intentionally public aggregate feed because Apps Script's redirecting content endpoint does not provide configurable CORS headers.

## Verification

Run `node --test scripts/visitor-analytics/visitor-statistics.test.mjs`, `npm run build`, and `npm run validate`. The focused tests use explicitly synthetic fixtures outside production data to check deduplication, unavailable vs zero, fixed query scope, caching, callback validation and stale realtime expiration. They do not claim live Google access has been verified.

## Map provenance

`src/data/world-map.json` is derived from `@svg-maps/world` 2.0.0 ([npm archive](https://registry.npmjs.org/@svg-maps/world/-/world-2.0.0.tgz)), by Victor Cazanave, based on [MapSVG](https://mapsvg.com/maps/world), under CC BY 4.0. Country polygon paths were converted to absolute coordinates, simplified using a 0.17-unit Ramer–Douglas–Peucker tolerance, and rounded to two decimals. Region IDs are preserved; markers identify very small polygons. Attribution and the full license are served with the page. This is map geometry, not visitor data. The list includes visitor countries even when map geometry is absent.
