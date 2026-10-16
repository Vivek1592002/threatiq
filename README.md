# Rdr — Narrative Radar

A live portal for tracking how a release is being talked about online: a threat score, the narratives driving it, and who is in the audience. It is built with React 19, TypeScript, Vite, TanStack Query, Zustand, D3 (for the maths only) and Motion. For now it runs on dummy data.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle (dist/)
npm run test       # unit tests for the analytics layer
npm run lint
```

## Views

| Route | What it shows |
| --- | --- |
| `/pulse` | Radar threat gauge (overall or per platform), a 7-day trajectory modal, 365-day high/median/low and rolling ranges, a threat trend with key-moment markers (3D–1Y), the last 6-hour cycle, and critical/high alerts |
| `/narratives` | Track a new narrative (shown as pending until its first cycle), filters/sort/search kept in the URL, sortable columns, buckets (select → create/add/remove, filter chips, group-by), delete with a confirm step |
| `/audience` | Channel cards with a sentiment split, conversation volume history, emotions, language communities, and an India choropleth linked to a ranked region list |
| `?narrative=<id>[&tab=spread]` | The narrative deep-dive. It opens over any tab, can be linked to, and Back or Esc closes it. Overview: hero gauge per platform, platform breakdown, volume by platform, a positive-comment seeding simulator, posts by platform, and claims. Spread: authenticity and bots, copy-paste clusters, the coordination cluster, the contagion timeline, the amplifier leaderboard, influence tiers, and origin |

## Structure

```
src/
  app/            providers, router (lazy routes), error boundary, dashboard context
  layout/         shell, top bar, animated tab nav, footer
  features/       pulse · narratives · narrative-detail · audience · shared
  components/
    ui/           design-system primitives (Panel, Button, Select, Segmented, Modal, Sheet, Pill, Stat…)
    charts/       SVG charts: RadarGauge, TimeSeriesChart, MultiLineChart, ContagionChart, IndiaMap, Sparkline, BarList
    brand/        Rdr mark + logo lockup (vector, animated sweep)
  services/       data seam: http client, dashboard service, normaliser, query hooks
  store/          Zustand: tracking (persisted), theme (persisted), feedback (toast/confirm)
  lib/            pure logic — analytics, formatting, threat zoning, sanitisation
  types/          api.types.ts (wire format) vs domain.ts (what the UI uses)
  mocks/raw/      dummy dashboard payload + India boundaries
  styles/         design tokens (dark + light) and global CSS
```

**How data flows:** the API payload (`RawDashboard`) goes through `normalizeDashboard()` to become a `Dashboard`. `AppShell` provides that object through context, and components read it with `useDashboard()`. Everything the UI derives from it (per-platform threat, the seeding maths, tiers and so on) lives in `lib/analytics.ts` as pure, tested functions.

**Connecting the real backend:** set `VITE_API_BASE_URL`. The service will then `GET {base}/v1/dashboard` and run the same normaliser over the response. No component needs to change.

**State:**
- Server data lives in TanStack Query. It refetches every 15 minutes, which keeps the view current against the 6-hour cadence.
- User data (tracked or removed narratives and buckets) lives in Zustand and is persisted to `localStorage`. The persisted data is checked when it is loaded, so tampered values are dropped.
- View state (filters, the open narrative, the deep-dive tab) lives in the URL.

## Security

- **No raw HTML:** there is no `dangerouslySetInnerHTML` anywhere, and an ESLint rule blocks it.
- **External links:** links pass through `safeExternalUrl` (https only, platform allow-list) and open with `rel="noopener noreferrer nofollow"`.
- **CSP:** a strict Content-Security-Policy is injected into the production HTML (`script-src 'self'`, no third-party origins). Fonts are bundled locally rather than loaded from a CDN. Set `frame-ancestors` and HSTS as response headers on the host.
- **Input and text handling:**
  - User input is trimmed, length-capped and has control characters stripped.
  - Profanity in user-generated content is masked.
  - Error boundaries never show stack traces.

## Map data

`src/mocks/raw/india.geo.json` has the current 36 states and union territories. They are drawn on India's official boundary, so Jammu & Kashmir and Ladakh appear in full, including Gilgit-Baltistan and Aksai Chin, as in Survey of India maps.

- **Source:** the community `india_states.geojson` (jbrobst gist), which matches datameet's national outline.
- **Processing:**
  - coordinates rounded to 3 decimal places
  - simplified with Douglas–Peucker (tolerance about 0.9 km)
  - polygon rings rewound for d3's spherical Mercator projection
- **Before production:** confirm the dataset's licence, or swap in Survey of India–derived boundaries. The property used is `st` (state name).

## Design notes

- **Theme:** dark-first. On a first visit the theme follows the OS; an explicit toggle is remembered.
- **Colour:** every colour is a token, so the light and dark themes and the charts stay in sync.
- **Gauge:** the threat gauge is a radar scope rather than a speedometer, to match the brand.
- **Charts:** threat lines change colour exactly at the zone thresholds. Charts can be navigated with the keyboard (← → Home End).
- **Motion:** animation respects `prefers-reduced-motion`.
