"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { fetchFeed, resetFeed } from "@/store/contentSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ContentCard from "@/components/ContentCard";
import Skeleton from "@/components/Skeleton";
import Spinner from "@/components/Spinner";
import type { ContentType } from "@/types/content";

const SKELETON_COUNT = 6;

interface FeedProps {
  /** Restrict sources (News / Movies / Social pages). Omit for the unified feed. */
  types?: ContentType[];
}

export default function Feed({ types }: FeedProps) {
  const dispatch = useAppDispatch();
  const { categories, hydrated } = useAppSelector((state) => state.preferences);
  const { items, status, error, hasMore, page } = useAppSelector(
    (state) => state.content,
  );

  // Stable key so the effect only reruns when categories or types change.
  const typeKey = types ? [...types].sort().join(",") : "";
  const categoryKey = useMemo(
    () => [...categories].sort().join(","),
    [categories],
  );
  const argKey = `${categoryKey}::${typeKey}`;

  const parsedTypes = useMemo(
    () => (typeKey === "" ? undefined : (typeKey.split(",") as ContentType[])),
    [typeKey],
  );

  // Load page 1 whenever preferences/types change (after localStorage hydration).
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const nextCategories = categoryKey === "" ? [] : categoryKey.split(",");
    dispatch(resetFeed());
    void dispatch(fetchFeed({ categories: nextCategories, page: 1, types: parsedTypes }));
  }, [dispatch, hydrated, argKey, categoryKey, parsedTypes]);

  const loadMore = useCallback(() => {
    if (status !== "loading" && hasMore && hydrated) {
      const nextCategories = categoryKey === "" ? [] : categoryKey.split(",");
      void dispatch(
        fetchFeed({ categories: nextCategories, page: page + 1, types: parsedTypes }),
      );
    }
  }, [dispatch, status, hasMore, hydrated, categoryKey, parsedTypes, page]);

  const retryFromScratch = useCallback(() => {
    if (status === "loading") {
      return;
    }
    const nextCategories = categoryKey === "" ? [] : categoryKey.split(",");
    dispatch(resetFeed());
    void dispatch(fetchFeed({ categories: nextCategories, page: 1, types: parsedTypes }));
  }, [dispatch, status, categoryKey, parsedTypes]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useInfiniteScroll(
    sentinelRef,
    loadMore,
    (status === "idle" || status === "succeeded") && hasMore,
  );

  const isLoadingFirstPage = status === "loading" && items.length === 0;
  const isRetrying = status === "loading";

  if (isLoadingFirstPage) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Skeleton key={index} />
        ))}
      </div>
    );
  }

  if (status === "failed" && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-12 text-center shadow-md">
        <p className="text-lg font-semibold text-zinc-800">
          {error ?? "Something went wrong while loading your feed."}
        </p>
        <button
          type="button"
          onClick={retryFromScratch}
          className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-12 text-center shadow-md">
        <p className="text-lg font-semibold text-zinc-800">
          No content found. Try selecting more categories.
        </p>
        <p className="text-sm text-zinc-500">
          Open Settings to pick your interests.
        </p>
        <a
          href="/settings"
          className="mt-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Update Preferences
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <ContentCard key={item.id} item={item} priority={index < 3} />
        ))}
      </div>

      {status === "failed" && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-md">
          <p className="text-sm font-medium text-zinc-700">
            {error ?? "Could not load more content."}
          </p>
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />

      {isRetrying && items.length > 0 && (
        <div className="mt-8">
          <Spinner />
        </div>
      )}
    </>
  );
}
