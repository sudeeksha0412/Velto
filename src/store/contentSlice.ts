import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import type {
  ApiErrorResponse,
  ContentItem,
  ContentType,
  FeedResponse,
  FeedStatus,
} from "@/types/content";
import type { RootState } from "@/store/store";

const ALL_TYPES: ContentType[] = ["news", "movie", "social"];

export interface FetchFeedArg {
  categories: string[];
  page: number;
  /** Restrict the sources fetched (used by the News/Movies/Social pages). */
  types?: ContentType[];
}

interface FetchFeedPayload {
  items: ContentItem[];
  hasMore: boolean;
  key: string;
}

export interface ContentState {
  items: ContentItem[];
  page: number;
  hasMore: boolean;
  status: FeedStatus;
  error: string | null;
  /** Preference key the current items belong to; used to drop stale responses. */
  activeKey: string;
}

const initialState: ContentState = {
  items: [],
  page: 1,
  hasMore: true,
  status: "idle",
  error: null,
  activeKey: "",
};

/** Stable key covering both the categories AND the source types in flight. */
function feedKey(categories: string[], types?: ContentType[]): string {
  const typePart = types ? [...types].sort().join(",") : "*";
  return `${[...categories].sort().join("|")}::${typePart}`;
}

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

/** Round-robin the sources so the unified feed feels mixed. */
function interleave(items: ContentItem[]): ContentItem[] {
  const buckets: Record<ContentType, ContentItem[]> = {
    news: [],
    movie: [],
    social: [],
  };
  for (const item of items) {
    buckets[item.type].push(item);
  }
  const order: ContentType[] = ["news", "movie", "social"];
  const interleaved: ContentItem[] = [];
  let index = 0;
  while (order.some((type) => buckets[type].length > 0)) {
    const type = order[index % order.length];
    const next = buckets[type].shift();
    if (next) {
      interleaved.push(next);
    }
    index += 1;
  }
  return interleaved;
}

/**
 * Fetch one page of the unified feed. Every source is requested in parallel
 * and awaited with Promise.allSettled, so a single failing API never breaks
 * the others. The thunk only rejects when *all* requested sources fail.
 */
export const fetchFeed = createAsyncThunk<
  FetchFeedPayload,
  FetchFeedArg,
  { state: RootState }
>("content/fetchFeed", async ({ categories, page, types }) => {
  const key = feedKey(categories, types);

  if (categories.length === 0) {
    return { items: [], hasMore: false, key };
  }

  const wanted = types ?? ALL_TYPES;
  const requests: Promise<FeedResponse>[] = [];

  if (wanted.includes("news")) {
    for (const category of categories) {
      requests.push(
        getFeed(`/api/news?category=${encodeURIComponent(category)}&page=${page}`),
      );
    }
  }
  if (wanted.includes("movie")) {
    requests.push(
      getFeed(
        `/api/movies?page=${page}&categories=${encodeURIComponent(categories.join(","))}`,
      ),
    );
  }
  if (wanted.includes("social")) {
    for (const category of categories) {
      requests.push(
        getFeed(
          `/api/social?page=${page}&hashtag=${encodeURIComponent(category)}`,
        ),
      );
    }
  }

  const results = await Promise.allSettled(requests);
  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<FeedResponse> =>
      result.status === "fulfilled",
  );

  if (fulfilled.length === 0) {
    const firstFailure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    throw new Error(
      firstFailure?.reason instanceof Error
        ? firstFailure.reason.message
        : "Could not load content from any source",
    );
  }

  const items = fulfilled.flatMap((result) => result.value.items);
  const hasMore = fulfilled.some((result) => result.value.hasMore);

  return { items: interleave(items), hasMore, key };
});

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    resetFeed(state) {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        state.activeKey = feedKey(
          action.meta.arg.categories,
          action.meta.arg.types,
        );
        state.status = "loading";
        state.error = null;
        if (action.meta.arg.page === 1) {
          state.items = [];
          state.page = 1;
        }
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        if (action.payload.key !== state.activeKey) {
          // A stale response from before the preferences changed.
          return;
        }
        // Dedupe within the payload itself (sources can overlap).
        const seen = new Set<string>();
        const fresh = action.payload.items.filter((item) => {
          if (seen.has(item.id)) {
            return false;
          }
          seen.add(item.id);
          return true;
        });
        if (action.meta.arg.page === 1) {
          state.items = fresh;
        } else {
          const existing = new Set(state.items.map((item) => item.id));
          state.items = [
            ...state.items,
            ...fresh.filter((item) => !existing.has(item.id)),
          ];
        }
        state.page = action.meta.arg.page;
        state.hasMore = action.payload.hasMore;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        if (
          feedKey(action.meta.arg.categories, action.meta.arg.types) !==
          state.activeKey
        ) {
          return;
        }
        state.status = "failed";
        state.error =
          action.error.message ?? "Something went wrong while loading the feed.";
      });
  },
});

export const { resetFeed } = contentSlice.actions;

export default contentSlice.reducer;
