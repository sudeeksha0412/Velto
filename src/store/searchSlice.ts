import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ApiErrorResponse,
  ContentItem,
  ContentType,
  SearchResponse,
  FeedStatus,
} from "@/types/content";
import type { RootState } from "@/store/store";

export interface SearchState {
  /** The query the current results belong to; used to drop stale responses. */
  activeQuery: string;
  query: string;
  items: ContentItem[];
  /** Per-provider failures (the rest of the results still render). */
  errors: Partial<Record<ContentType, string>>;
  status: FeedStatus;
  /** Set only when *all* providers failed. */
  error: string | null;
  /** All/News/Movies/Social filter for the results view. */
  filter: "all" | ContentType;
}

const initialState: SearchState = {
  activeQuery: "",
  query: "",
  items: [],
  errors: {},
  status: "idle",
  error: null,
  filter: "all",
};

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as ApiErrorResponse).error === "string"
  );
}

/**
 * Search all providers through the unified /api/search route.
 * The activeQuery guard drops responses that arrive after the user typed
 * something newer, so stale results can never overwrite fresh ones.
 */
export const fetchSearch = createAsyncThunk<
  SearchResponse,
  string,
  { state: RootState }
>("search/fetch", async (query) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Bad response from search (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(
      isApiErrorResponse(body)
        ? body.error
        : `Search failed (${response.status})`,
    );
  }
  return body as SearchResponse;
});

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setFilter(state, action: PayloadAction<"all" | ContentType>) {
      state.filter = action.payload;
    },
    clearSearch() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearch.pending, (state, action) => {
        state.activeQuery = action.meta.arg;
        state.status = "loading";
        state.error = null;
        state.errors = {};
        if (action.meta.arg !== state.query) {
          // Query changed while a request was in flight — clear old results.
          state.items = [];
        }
      })
      .addCase(fetchSearch.fulfilled, (state, action) => {
        if (action.meta.arg !== state.activeQuery) {
          // A stale response from before the query changed.
          return;
        }
        // Dedupe within the payload (providers can overlap).
        const seen = new Set<string>();
        state.items = action.payload.items.filter((item) => {
          if (seen.has(item.id)) {
            return false;
          }
          seen.add(item.id);
          return true;
        });
        state.errors = action.payload.errors;
        const allFailed =
          state.items.length === 0 &&
          Object.keys(action.payload.errors).length > 0;
        state.status = allFailed ? "failed" : "succeeded";
        state.error = allFailed
          ? Object.values(action.payload.errors)[0] ?? "Search failed."
          : null;
      })
      .addCase(fetchSearch.rejected, (state, action) => {
        if (action.meta.arg !== state.activeQuery) {
          return;
        }
        state.status = "failed";
        state.error =
          action.error.message ?? "Something went wrong while searching.";
      });
  },
});

export const { setQuery, setFilter, clearSearch } = searchSlice.actions;

export default searchSlice.reducer;
