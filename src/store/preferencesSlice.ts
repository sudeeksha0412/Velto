import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { CATEGORIES } from "@/types/content";

export const PREFERENCES_STORAGE_KEY = "velto-preferences";

const VALID_CATEGORY_IDS: string[] = CATEGORIES.map((category) => category.id);

export interface PreferencesState {
  categories: string[];
  /** True once localStorage has been read on the client (never during SSR). */
  hydrated: boolean;
}

const initialState: PreferencesState = {
  categories: ["technology"],
  hydrated: false,
};

/** Keep only known category ids so bad localStorage data can never leak in. */
export function sanitizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return VALID_CATEGORY_IDS.filter((id) => value.includes(id));
}

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    toggleCategory(state, action: PayloadAction<string>) {
      const category = action.payload;
      if (!VALID_CATEGORY_IDS.includes(category)) {
        return;
      }
      if (state.categories.includes(category)) {
        state.categories = state.categories.filter((c) => c !== category);
      } else {
        state.categories.push(category);
      }
    },
    setCategories(state, action: PayloadAction<string[]>) {
      state.categories = sanitizeCategories(action.payload);
    },
    markHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const { toggleCategory, setCategories, markHydrated } =
  preferencesSlice.actions;

export default preferencesSlice.reducer;
