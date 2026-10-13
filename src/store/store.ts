import { configureStore } from "@reduxjs/toolkit";
import preferencesReducer from "@/store/preferencesSlice";
import contentReducer from "@/store/contentSlice";
import favoritesReducer from "@/store/favoritesSlice";
import trendingReducer from "@/store/trendingSlice";
import searchReducer from "@/store/searchSlice";
import uiReducer from "@/store/uiSlice";

export const store = configureStore({
  reducer: {
    preferences: preferencesReducer,
    content: contentReducer,
    favorites: favoritesReducer,
    trending: trendingReducer,
    search: searchReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
