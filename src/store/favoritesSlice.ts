import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ContentItem } from "@/types/content";

export const FAVORITES_STORAGE_KEY = "velto-favorites";
const MAX_FAVORITES = 200;

export interface FavoritesState {
  /** Full item metadata is stored so Favorites renders even for items no longer returned by APIs. */
  items: ContentItem[];
  /** True once localStorage has been read on the client (never during SSR). */
  hydrated: boolean;
}

const initialState: FavoritesState = {
  items: [],
  hydrated: false,
};

/** Keep only well-formed items so corrupt localStorage data can never leak in. */
export function sanitizeFavorites(value: unknown): ContentItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const items: ContentItem[] = [];
  for (const entry of value) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as ContentItem).id === "string" &&
      typeof (entry as ContentItem).type === "string" &&
      typeof (entry as ContentItem).title === "string" &&
      !seen.has((entry as ContentItem).id)
    ) {
      seen.add((entry as ContentItem).id);
      items.push(entry as ContentItem);
    }
  }
  return items.slice(0, MAX_FAVORITES);
}

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<ContentItem>) {
      const existing = state.items.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (existing >= 0) {
        state.items.splice(existing, 1);
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeFavorite(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setFavorites(state, action: PayloadAction<ContentItem[]>) {
      state.items = action.payload;
    },
    markFavoritesHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const {
  toggleFavorite,
  removeFavorite,
  setFavorites,
  markFavoritesHydrated,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;

/** Selector helper: is a given item id saved? */
export function selectIsFavorite(id: string) {
  return (state: { favorites: FavoritesState }) =>
    state.favorites.items.some((item) => item.id === id);
}
