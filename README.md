# Velto ⚡

A personalized content dashboard for Gen Z. Velto pulls **news**, **movie
recommendations**, and **social posts** into one unified, infinite-scrolling
feed — filtered by the categories you pick.

Built with Next.js (App Router) + TypeScript, Redux Toolkit, and Tailwind CSS.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your API keys

Copy the example env file and fill in your own free keys:

```bash
cp .env.example .env.local
```

| Key              | Where to get it (free)                                                |
| ---------------- | --------------------------------------------------------------------- |
| `NEWS_API_KEY`   | [newsapi.org/register](https://newsapi.org/register) — instant signup |
| `TMDB_API_KEY`   | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) — create an account, then request an API key (choose "Developer") |

`.env.local` is gitignored and the keys are only ever read **on the server**,
inside the API routes. No key is shipped to the browser.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Settings** in the
header, toggle your interests, and the feed refreshes instantly.

> Without keys configured, the feed still works — it shows whatever sources
> succeed (the mock social API needs no key) and surfaces a friendly error
> with a Retry button when every live source fails.

## How It Works (Architecture)

```
Browser (client components)
  └── Redux store
        ├── preferencesSlice  — selected categories, persisted to localStorage
        └── contentSlice      — fetchFeed thunk, feed items/page/status
                │  fetch("/api/...")  ×  Promise.allSettled
                ▼
Next.js API routes (server, keys stay here)
  ├── /api/news     → NewsAPI top-headlines (one call per selected category)
  ├── /api/movies   → TMDB discover/popular (genre-mapped from categories)
  └── /api/social   → mock JSON, paginated + filtered by hashtag
```

### Data flow

1. **Preferences** live in `preferencesSlice` (`categories: string[]`,
   default `["technology"]`). `toggleCategory` / `setCategories` update them.
   On app start, `providers.tsx` reads them from `localStorage` inside a
   `useEffect` (never during SSR, so no hydration mismatch) and writes them
   back on every change.
2. **Fetching** happens in `contentSlice`'s `fetchFeed` thunk. It fires one
   request per selected category for news and social, one request for movies,
   and awaits them all with `Promise.allSettled` — so a failing source (bad
   key, rate limit, offline) never breaks the others. The thunk rejects only
   if *every* source fails, which drives the error + Retry state.
3. **Normalization**: each API route maps its provider's response into one
   shared `ContentItem` shape (`id`, `type`, `title`, `description`, `image`,
   `url`, `source`, `publishedAt`), so the UI never branches on the origin.
4. **Interleaving**: the thunk round-robins news → movie → social so the
   unified feed feels mixed instead of blocked by source.
5. **Infinite scroll**: `useInfiniteScroll` observes a sentinel `div` with
   `IntersectionObserver`; when it enters the viewport (and the feed isn't
   already loading and `hasMore` is true) the next page is fetched and
   appended. Duplicate ids are dropped on merge.
6. **Preference changes** reset the feed: the thunk tags each request with a
   sorted category key, stale responses from a previous key are discarded,
   and page 1 is refetched (skeletons shown while loading).

### UI states

- **First load** → skeleton cards
- **Empty** → "No content found. Try selecting more categories."
- **Error** (all sources failed) → message + Retry button
- **Loading more** → spinner above the sentinel

## Project Structure

```
src/
  app/
    page.tsx            # Dashboard shell
    layout.tsx          # Inter font, metadata, Redux provider
    providers.tsx       # Client wrapper: localStorage load/save
    api/news/route.ts   # Server proxy → NewsAPI
    api/movies/route.ts # Server proxy → TMDB
    api/social/route.ts # Mock API over data/socialPosts.json
  components/
    Header.tsx          # Gradient logo + Settings button
    SettingsPanel.tsx   # Category checkboxes (modal)
    Feed.tsx            # Grid, states, infinite scroll wiring
    ContentCard.tsx     # One card design for all three types
    Skeleton.tsx        # Loading placeholder
    Spinner.tsx         # Load-more spinner
  store/
    store.ts            # configureStore
    preferencesSlice.ts
    contentSlice.ts     # fetchFeed thunk + allSettled merging
    hooks.ts            # typed useAppDispatch / useAppSelector
  hooks/
    useInfiniteScroll.ts
  types/
    content.ts          # ContentItem, categories, API response types
  data/
    socialPosts.json    # ~40 fake posts for the mock social API
```

## Available Scripts

```bash
npm run dev    # start the dev server
npm run build  # production build
npm run start  # serve the production build
npm run lint   # eslint
```
