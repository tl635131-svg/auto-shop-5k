# Cinderline Auto — buyer handoff README

This is a finished static website template for a fictional demo auto repair shop. It is prepared for hosting as a GitHub Pages project site at `/auto-shop-5k/`, uses Canadian English and CAD, and has eight pages. There is no build step: edit the files and publish them as-is. No `npm install`, bundler or compile step is required.

## Serve it locally

From the published site folder—the folder containing `index.html`—run:

```bash
python3 -m http.server 8000
```

Then open the local URL shown, usually `http://localhost:8000/`. To test the project subpath, place this publish folder under a parent directory with the name `auto-shop-5k`, run `python3 -m http.server 8000` from that parent, and visit `http://localhost:8000/auto-shop-5k/`. When working in the assembly workspace, use a separate local mapping directory pointing `auto-shop-5k` to this folder; serving the workspace parent directly would expose the workspace rather than this publish folder.

Do not rely on opening `index.html` directly as a `file://` URL. The site uses JavaScript ES modules, including the dynamic import of the config, and browsers often block or mishandle module loading from local files. JavaScript is required because business details such as the shop name, phone, email, address, hours, socials, service prices, packages and demo notices render from `assets/js/config.js`. If the config fails to import or validate, the site shows a visible config status and does not enable dependent features.

## The eight pages

- `index.html` — Home: full-bleed hero, CTA, three trust counters, eight service cards, three why-us features, four process steps, testimonials, illustrative comparison and closing CTA.
- `services.html` — Services: jump index and eight full service detail sections with anchors, icons, inclusions, configurable from-prices and booking links.
- `about.html` — About: story, three values, shop image, three team portraits and bios, and a clearly labelled practice-theme marquee.
- `pricing.html` — Pricing: billing control, three package cards, five-row comparison table and terms.
- `gallery.html` — Gallery: four filters, six items, lightbox and illustrative before/after comparison.
- `booking.html` — Booking: three-step demo form, bound contact details and hours, and a styled map placeholder.
- `faq.html` — FAQ: eight native accordions, fictional review summary and three sample reviews.
- `404.html` — Not found: recovery links plus the shared header and footer.

## Rebrand in one file

The main rebrand is one file: `assets/js/config.js`. It is a named ES-module export (`export const config = …;`), not JSON and not a default export. Keep every key and the schema shape; do not rename keys. The page copy and the three sample testimonial quotes remain in the page files, but business details, pricing, demo-claim summaries, team, certifications, booking rules and site metadata are driven from this file.

Use plain text in config strings; the site binds them as text. Use only `tel:` for phone, `mailto:` for email, and HTTPS social URLs. A `null` social URL hides that link. All keys are required. Prices and package amounts are integer cents. `site.basePath` must start and end with `/`; `site.publicOrigin` must be an HTTPS origin with no trailing slash.

### Placeholder map

| Key | What it controls | Where it appears |
|---|---|---|
| `business.name` | Shop name | Header/footer, contact details, titles/metadata built from config |
| `business.tagline` | Short brand tagline | Hero and footer |
| `business.isDemo` | Demo flag; the schema fixes this to `true` | Demo notices and labels |
| `business.phone.display` / `business.phone.href` | Display phone and `tel:` link | Header/footer, contact and booking areas |
| `business.email.display` / `business.email.href` | Display email and `mailto:` link | Contact, footer and booking areas |
| `business.address.street`, `.locality`, `.region`, `.postalCode`, `.country`, `.display` | Structured and display address | Contact/about/footer and map placeholder text |
| `business.timezone` | IANA timezone for local date/hour logic | Booking date validation and hours context |
| `business.hours[]` with `day`, `opens`, `closes`, `closed` | Seven Monday–Sunday hours entries | Footer/contact/booking hours; closed days say “Closed” |
| `business.socials.instagram.label` / `.url` | Instagram label and safe HTTPS URL; `null` hides the link | Footer/contact social links |
| `business.socials.facebook.label` / `.url` | Facebook label and safe HTTPS URL; `null` hides the link | Footer/contact social links |
| `site.basePath` | Project base path for canonical/OG absolute URLs | Canonical and OG URLs only |
| `site.publicOrigin` | HTTPS origin for canonical/OG absolute URLs | Canonical and OG URLs |
| `site.locale` | Locale; enum `en-CA` | Formatting and locale behaviour |
| `site.currency` | Currency; enum `CAD` | Pricing and money display |
| `site.defaultOgImage` | Default relative OG image path | Social previews; currently `assets/images/hero-workshop.webp` |
| `pricing.taxIncluded` | Whether displayed prices are tax-included in terms/labels | Pricing terms/price notes; the site does not calculate taxes |
| `pricing.serviceStartingCents.<service>` | Starting price in cents for each service | Service cards and detail from-prices |
| `pricing.packages.{essential,plus,complete}.name` | Package name | Pricing cards and booking package select |
| `pricing.packages.{essential,plus,complete}.monthlyCents` | Monthly bill in cents | Pricing monthly billing and calculations |
| `pricing.packages.{essential,plus,complete}.discountPercent` | Annual discount percent | Pricing annual calculation |
| `pricing.packages.{essential,plus,complete}.annualCents`, `.savingsCents`, `.equivalentMonthlyCents` | Frozen expected totals for validation; runtime derives them from monthly price and discount | Pricing billing display |
| `pricing.packages.{essential,plus,complete}.features.inspections`, `.oilCredits`, `.tireRotations`, `.priorityBooking`, `.detailCredits` | Package inclusions and allowances | Pricing card inclusions and comparison table |
| `demo.stats.serviceCategories`, `.processSteps`, `.packageChoices` | Trust counters: 8, 4 and 3 | Home |
| `demo.reviews.rating`, `.count`, `.scale` | Fictional review summary; scale is 5 | Review summary |
| `demo.team.{maya,elias,jordan}.name` / `.role` | Fictional team names and roles | About team cards and team portrait alt tokens |
| `demo.certifications.inspection.label`, `.ev.label`, `.care.label` | Practice-theme labels, not credentials | About marquee |
| `booking.mode` | Demo booking mode; enum `demo` | Booking |
| `booking.minLeadDays` | Earliest bookable day; currently 1 | Booking date validation |
| `booking.maxAdvanceDays` | Latest bookable day; currently 90 | Booking date validation |
| `booking.timeWindows.morning` / `.afternoon` | Time-window labels | Booking step 2 |
| `booking.retention` | Retention behaviour; enum `memory-only` | Booking; data is not persisted |

Service starting-price keys are `diagnostics`, `brakes`, `oil-maintenance`, `tires-alignment`, `ev-hybrid`, `engine-transmission`, `ac-climate` and `detailing`. Hours must contain exactly seven unique Monday–Sunday entries in order; a closed day must have `opens` and `closes` set to `null`. Package annual, savings and monthly-equivalent totals are QA expectations: the runtime derives them from `monthlyCents` and `discountPercent` using integer cents. Booking allows tomorrow through 90 calendar days inclusive, on open weekdays only; same-day booking and holiday modelling are not included.

## Fonts, logo, favicon, icons and colours

- Fonts: edit the shared stylesheet copied from `assets/css/styles.css`. Update the font-family stacks or `@font-face` sources there, keep readable fallbacks, and recheck layout and contrast.
- Logo: replace the SVG logo markup used by the shared header/footer. Keep its viewBox, display sizing and accessible name/label intact.
- Favicon: replace the SVG `favicon.svg` from the icon set and keep the final copied favicon reference working.
- Icons: update the SVG sprite `sprite.svg`. Service cards reference icon IDs such as `service-brakes`; keep those IDs or update every reference consistently.
- Colours: edit the colour tokens in the shared stylesheet, then use the permitted colour pairs described below to check permitted role pairs and WCAG AA contrast. Do not create unlisted role pairings without a contract revision.

The logo and favicon are SVG code and are not counted among the 19 photos.

## Replacing images

All 19 image slots live under `assets/images/` and must keep the exact filenames below. Use WebP in sRGB, remove location/EXIF data, set explicit HTML dimensions, do not upscale to fake resolution, and respect the decimal byte caps. For every slot, the alt-text intent is: describe visible action or fictional person; no unverified outcome or qualification claims. Use the specific alt text shown. Team alt tokens resolve from config.

| Slot / filename | Required dimensions | Max bytes | Alt text | Used on |
|---|---:|---:|---|---|
| `hero-workshop.webp` | 1920×1080 | 350,000 | “Unbranded coupe in a softly lit automotive workshop.” | Home hero; shared OG |
| `service-diagnostics.webp` | 960×640 | 200,000 | “Technician checking a diagnostic tablet beside an unbranded car.” | Home, Services |
| `service-brakes.webp` | 960×640 | 200,000 | “Gloved hands inspecting a wheel brake assembly.” | Home, Services |
| `service-oil-maintenance.webp` | 960×640 | 200,000 | “Technician changing oil during routine maintenance.” | Home, Services |
| `service-tires-alignment.webp` | 960×640 | 200,000 | “Wheel mounted on alignment equipment in a workshop.” | Home, Services |
| `service-ev-hybrid.webp` | 960×640 | 200,000 | “Technician inspecting an unbranded electric vehicle with insulated tools.” | Home, Services |
| `service-engine-transmission.webp` | 960×640 | 200,000 | “Technician inspecting a clean engine bay.” | Home, Services |
| `service-ac-climate.webp` | 960×640 | 200,000 | “Technician measuring air vent temperature.” | Home, Services |
| `service-detailing.webp` | 960×640 | 200,000 | “Detailer wiping an unbranded car with a microfiber cloth.” | Home, Services |
| `shop-interior.webp` | 1440×960 | 200,000 | “Orderly workshop bays with tools and an unbranded car.” | About |
| `team-maya.webp` | 720×900 | 200,000 | “the configured service lead name in the demo workshop.” | About |
| `team-elias.webp` | 720×900 | 200,000 | “the configured technician name in the demo workshop.” | About |
| `team-jordan.webp` | 720×900 | 200,000 | “the configured advisor name in the demo workshop.” | About |
| `gallery-brakes.webp` | 1200×800 | 200,000 | “Brake inspection at a workshop bench.” | Gallery |
| `gallery-alignment.webp` | 1200×800 | 200,000 | “Unbranded car positioned on an alignment rack.” | Gallery |
| `gallery-ev-check.webp` | 1200×800 | 200,000 | “Technician inspecting an electric vehicle in a service bay.” | Gallery |
| `gallery-interior.webp` | 1200×800 | 200,000 | “Clean unbranded car interior after a surface detail.” | Gallery |
| `gallery-before.webp` | 1200×800 | 200,000 | “Dusty charcoal coupe before the illustrative detail.” | Gallery, Home; comparison pair `detail-demo` |
| `gallery-after.webp` | 1200×800 | 200,000 | “The same charcoal coupe after the illustrative detail.” | Gallery, Home; comparison pair `detail-demo` |

When you replace a photo, keep the slot ID and filename and update `assets/images/manifest.json` with actual byte size, generator/model/date, prompt, provenance, comparison pair and visual inspection status. `hero-workshop.webp` is also the default OG image; there is no additional OG image slot.

## Demo pricing and claims

Prices, packages, review summaries, ratings, team members and certifications are fictional demonstration content and are labelled as demo content. `business.isDemo` is fixed to `true` by the schema, so keep the demo notices and labels visible.

- Replace service starting prices in `pricing.serviceStartingCents.*` and package values in `pricing.packages.*`. Use integer cents and CAD. `taxIncluded` is a flag for terms/labels; the site does not estimate taxes.
- For packages, set `monthlyCents` and `discountPercent`; the runtime derives annual, savings and equivalent-monthly totals. The config’s stored annual/savings/equivalent values are validation expectations and must match the derived totals.
- Replace the fictional review summary in `demo.reviews.rating`, `.count` and `.scale`. The three displayed fictional quotes are a curated sample, not the dataset used to compute that summary; replace them in the page copy and keep the demo label. Do not emit `LocalBusiness` `aggregateRating` or certification structured claims.
- Replace team names and roles in `demo.team.{maya,elias,jordan}`. Replace practice-theme labels in `demo.certifications.*`; these are visibly labelled practice themes, never actual credentials.
- Replace trust counters in `demo.stats.*` only with truthful values.
- The before/after comparison uses `gallery-before.webp` and `gallery-after.webp` with identical geometry and the shared comparison pair `detail-demo`. It is illustrative only: label it as illustrative and never claim a real customer result.

## Accessible motion

The site supports `prefers-reduced-motion` and observes changes live. Under reduced motion:

- Reveal and stagger effects show immediately with no offset or delays.
- Hero Ken Burns and parallax become static, with scale 1 and zero offset.
- Animated counters show the final value immediately.
- Tilt, magnetic movement and image zoom are disabled; keyboard focus remains visible.
- The certification marquee becomes a static single list; the duplicated strip and pause control are hidden.
- Smooth scrolling and page fades are disabled, and same-origin page-fade interception does not run.
- Continuous motion pauses when the document is hidden or the component is offscreen, and the explicit marquee pause button works.

No essential information relies on motion. Motion only animates transform and opacity.

## Contact form

The shipped booking/contact form (`#booking-form`) only simulates success and sends nothing. It has no action endpoint, makes no `fetch`, `XMLHttpRequest` or `sendBeacon` call, uses no external form service, writes nothing to browser storage and uses no analytics. It validates locally, keeps data in memory only, and shows a local success state. Do not treat the success message as a real booking or message sent to the business.

### Connect Formspree

1. Create a form in Formspree and copy its endpoint, for example `https://formspree.io/f/your-id`.
2. On `booking.html`, set the form action/endpoint: `action="https://formspree.io/f/your-id"` and `method="post"` on `form#booking-form`.
3. Because the shipped JavaScript prevents every submit and simulates success, you must deliberately change or remove that demo submit interception, or add your own submission code, so the form actually posts to Formspree. Changing `action` alone is not enough.
4. Serve the site, submit a valid test booking, confirm receipt in Formspree, and test required-field errors, reset and success behaviour. Keep secrets out of `config.js`.

### Connect Netlify Forms

1. Add the Netlify attribute `data-netlify="true"` to `form#booking-form`, add `method="post"`, and set a form name such as `name="booking-form"`.
2. Add the hidden form-name field: `<input type="hidden" name="form-name" value="booking-form">`. The value must match the form name.
3. Allow a native form POST—remove or disable the shipped demo submission interception, or post to Netlify in your own code—then deploy the site to Netlify.
4. Check the Forms area in the Netlify dashboard and submit a test. Netlify Forms only works when the site is hosted on Netlify; it does not work on GitHub Pages.

## Project-path URLs and moving domains

Internal links and asset references are relative, so the site can move without rewriting every page. Do not change internal links or image paths to start with `/`; image paths must never start with `/`.

The current seed uses:

```js
basePath: "/auto-shop-5k/",
publicOrigin: "https://tl635131-svg.github.io"
```

These values build absolute canonical, Open Graph and Twitter URLs; internal navigation stays relative. To move to a root domain or custom domain:

1. Keep internal page, CSS, JS and image links relative.
2. Set `site.basePath` to `/` for a root domain, or keep your project path such as `/auto-shop-5k/` for a GitHub Pages project site. It must start and end with `/`.
3. Set `site.publicOrigin` to your HTTPS origin, for example `https://your-domain.ca`, with no trailing slash.
4. Keep `site.defaultOgImage` as a relative image path such as `assets/images/hero-workshop.webp`.
5. In the development workspace, run `python3 -B tools/qa/sync_static.py` after editing config. This refreshes static business text and crawler metadata on all eight pages; run `python3 -B tools/qa/static_check.py` to catch drift. The published site has no build dependency.
6. In `404.html`, change the early bootstrap variable `p` from `/auto-shop-5k/` to the same value as `site.basePath`. This one-line deployment prefix is required before relative assets load; the config module loads too late to supply it.
7. Test canonical/OG/Twitter URLs and all eight pages at the new address, including a deep missing path.

## No secrets

The site contains no API keys. `assets/js/config.js` is public client-side code: never put secrets, private tokens, SMTP passwords or private API keys in it. Form endpoints are public actions, but any secret credentials belong in server or hosting-provider settings, not in this repository.

## Launch checklist

For the corrected booking browser scenario, run `python3 -B tools/qa/booking_check.py`
from the workspace root (or `python3 -B ../tools/qa/booking_check.py` from this folder).
It supersedes the booking scenario in `tools/qa/test_browser.py`, whose selectors
do not match this assembled DOM. It uses the existing Playwright installation
and an installed Chromium browser; set `QA_CHROME` to its executable if needed.
It routes local site files in memory, tests both project and root paths, checks
the live contact review, validates success/reset, and measures service link
targets at six viewport widths. No server or external requests are needed.
Run `node tools/qa/config-check.mjs` from the workspace root for base-path regression
assertions. These QA files live outside the publish directory and do not load in any site page.

- Fill every required key in `assets/js/config.js`; keep key names and schema shape unchanged.
- Use `tel:` phone, `mailto:` email, HTTPS social URLs or `null` to hide social links; keep exactly seven ordered Monday–Sunday hours.
- Replace all 19 images with the exact filenames and dimensions, respect byte caps, and update `assets/images/manifest.json`.
- Replace SVG logo, favicon, icons and fonts as needed; check colour pairs against the permitted colour pairs described below for AA.
- Replace fictional prices, review summary, team, certifications and stats; keep demo labels and treat the comparison as illustrative.
- Set `site.basePath` and `site.publicOrigin` for the final hosting location.
- Decide whether to keep the simulated form or connect Formspree/Netlify Forms; test real submission if connected. Remember Netlify Forms requires Netlify hosting.
- Confirm no secrets are in `config.js` or any published file.
- Serve locally and test all eight pages, the 404, keyboard navigation, reduced motion, mobile layout, links, images and social previews.
- Deploy, test the live project path or custom domain, and re-test the form state if you changed it.

## Metadata, colour and error-page notes

Static titles, business fields, canonical URLs, Open Graph and Twitter metadata are snapshots of `assets/js/config.js`; crawlers receive the configured brand and absolute URLs without JavaScript. Refresh these snapshots after a rebrand using the development QA commands above. Runtime bindings remain in place. If you received only the `site/` folder, no QA tool is required: after editing config, update the matching text in every HTML element with `data-config-text`, the `data-config-meta` contents, page titles, canonical links and all `og:*` / `twitter:*` metadata in each of the eight HTML files. Build absolute crawler URLs from `site.publicOrigin` + `site.basePath` + the page or image path; then compare page source against config with JavaScript disabled. Alternatively, request the development workspace containing `tools/qa/` for automated refresh and validation.

Keep light text (#F5F3EE/#FFFFFF) and secondary text (#BBC0C4) on graphite (#171A1D) or surface (#24292E). On light/white backgrounds, use ink (#202428), subdued (#525B63) and deep orange (#8A2900). Filled orange controls (#FF7139) use graphite text and a deep-orange boundary on light backgrounds. Recheck AA contrast after changing colours.

The 404 page uses relative asset and recovery URLs. Its early inline script normalizes nested missing URLs under its explicitly set deployment prefix to `404.html` before assets load; the originally requested path stays in memory only. Without JavaScript, assets and recovery links on arbitrarily nested missing URLs may not resolve. Use the browser address bar to return to the project root. A plain Python server returns its own 404 for unknown URLs; the custom `404.html` must be configured by the hosting service.

This assembly has not been deployed or published. See the assembly report supplied with the development workspace for validation limits; browser and live HTTP verification remain required before release.

Fonts are self-hosted in `assets/fonts/` (Barlow Condensed 600/700 and Inter 400–600, Latin subsets). Both families retain their SIL Open Font License notices in that directory. No Google Fonts runtime request is required. Only display 700 and the shared Inter font are preloaded; display 600 loads on demand.
