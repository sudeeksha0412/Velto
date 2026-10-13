import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ApiErrorResponse,
  ContentItem,
  ContentType,
  FeedResponse,
  FeedStatus,
} from "@/types/content";
import type { RootState } from "@/store/store";

interface SourceBucket {
  items: ContentItem[];
  status: FeedStatus;
  error: string | null;
}

export interface TrendingState {
  news: SourceBucket;
  movies: SourceBucket;
  social: SourceBucket;
}

type TrendingSources = "news" | "movies" | "social";

interface TrendingPayload {
  news?: ContentItem[];
  movies?: ContentItem[];
  social?: ContentItem[];
  errors: Partial<Record<TrendingSources, string>>;
}

const emptyBucket = (): SourceBucket => ({
  items: [],
  status: "idle",
  error: null,
});

const initialState: TrendingState = {
  news: emptyBucket(),
  movies: emptyBucket(),
  social: emptyBucket(),
};

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as ApiErrorResponse).error === "string"
  );
}

async function getFeed(path: string): Promise<FeedResponse> {
  const response = await fetch(path);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Bad response from ${path} (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(
      isApiErrorResponse(body) ? body.error : `Request failed (${response.status})`,
    );
  }
  return body as FeedResponse;
}

/**
 * Fetch trending content from all three sources in parallel. Each source
 * succeeds or fails independently so one broken API never hides the others.
 */
export const fetchTrending = createAsyncThunk<
  TrendingPayload,
  void,
  { state: RootState }
>("trending/fetch", async () => {
  const requests: [TrendingSources, Promise<FeedResponse>][] = [
    // NewsAPI top-headlines (country-wide) IS the supported "trending news" source.
    ["news", getFeed("/api/news?category=general&page=1")],
    // TMDB's real /trending/movie/day endpoint.
    ["movies", getFeed("/api/movies?trending=1&page=1")],
    // Mock posts ranked by their sample engagement metric.
    ["social", getFeed("/api/social?sort=trending&limit=8")],
  ];

  const results = await Promise.allSettled(requests.map(([, p]) => p));
  const payload: TrendingPayload = { errors: {} };

  results.forEach((result, index) => {
    const [source] = requests[index];
    if (result.status === "fulfilled") {
      payload[source] = result.value.items;
    } else {
      payload.errors[source] =
        result.reason instanceof Error
          ? result.reason.message
          : "Could not load trending content.";
    }
  });

  if (
    payload.news === undefined &&
    payload.movies === undefined &&
    payload.social === undefined
  ) {
    throw new Error(
      Object.values(payload.errors)[0] ?? "Could not load trending content.",
    );
  }

  return payload;
});

const trendingSlice = createSlice({
  name: "trending",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrending.pending, (state) => {
        for (const source of ["news", "movies", "social"] as const) {
          state[source].status = "loading";
          state[source].error = null;
        }
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        const { news, movies, social, errors } = action.payload;
        const buckets: [TrendingSources, ContentItem[] | undefined][] = [
          ["news", news],
          ["movies", movies],
          ["social", social],
        ];
        for (const [source, items] of buckets) {
          if (items !== undefined) {
            state[source].items = items;
            state[source].status = "succeeded";
            state[source].error = null;
          } else {
            state[source].items = [];
            state[source].status = "failed";
            state[source].error = errors[source] ?? "Could not load content.";
          }
        }
      })
      .addCase(fetchTrending.rejected, (state, action) => {
        for (const source of ["news", "movies", "social"] as const) {
          state[source].status = "failed";
          state[source].error =
            action.error.message ?? "Could not load trending content.";
        }
      });
  },
});

export default trendingSlice.reducer;

/** Convenience selector returning all trending items flat (for count badges etc.). */
export function selectTrendingItems(state: RootState): ContentItem[] {
  return [
    ...state.trending.news.items,
    ...state.trending.movies.items,
    ...state.trending.social.items,
  ];
}

export type { ContentType };
