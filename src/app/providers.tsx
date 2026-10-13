"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  markHydrated,
  PREFERENCES_STORAGE_KEY,
  sanitizeCategories,
  setCategories,
} from "@/store/preferencesSlice";
import {
  FAVORITES_STORAGE_KEY,
  markFavoritesHydrated,
  sanitizeFavorites,
  setFavorites,
} from "@/store/favoritesSlice";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Reads localStorage on the client after mount (never during SSR, so there is
 * no hydration mismatch) and persists preferences + favorites whenever they
 * change afterwards.
 */
function PersistenceBridge({ children }: ProvidersProps) {
  const dispatch = useAppDispatch();
  const { categories, hydrated } = useAppSelector((state) => state.preferences);
  const favorites = useAppSelector((state) => state.favorites);

  // Hydrate preferences from localStorage.
  useEffect(() => {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        const stored = sanitizeCategories(
          (parsed as { categories?: unknown } | null)?.categories,
        );
        if (stored.length > 0) {
          dispatch(setCategories(stored));
        }
      } catch {
        // Corrupt data: fall back to the default category.
      }
    }
    dispatch(markHydrated());
  }, [dispatch]);

  // Hydrate favorites from localStorage.
  useEffect(() => {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        const stored = sanitizeFavorites(
          (parsed as { items?: unknown } | null)?.items,
        );
        if (stored.length > 0) {
          dispatch(setFavorites(stored));
        }
      } catch {
        // Corrupt data: start with an empty favorites list.
      }
    }
    dispatch(markFavoritesHydrated());
  }, [dispatch]);

  // Persist preferences whenever they change (after hydration only).
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ categories }),
    );
  }, [categories, hydrated]);

  // Persist favorites whenever they change (after hydration only).
  useEffect(() => {
    if (!favorites.hydrated) {
      return;
    }
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({ items: favorites.items }),
    );
  }, [favorites.items, favorites.hydrated]);

  return <>{children}</>;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistenceBridge>{children}</PersistenceBridge>
    </Provider>
  );
}
