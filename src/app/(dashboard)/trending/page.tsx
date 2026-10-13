"use client";

import { useCallback, useEffect } from "react";
import { Flame, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrending } from "@/store/trendingSlice";
import ContentCard from "@/components/ContentCard";
import Skeleton from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import FilterTabs, { type ContentFilter } from "@/components/FilterTabs";
import { useState } from "react";
import type { ContentItem, FeedStatus } from "@/types/content";

interface SectionProps {
  title: string;
  items: ContentItem[];
  status: FeedStatus;
  error: string | null;
  visible: boolean;
  onRetry: () => void;
}

function TrendingSection({
  title,
  items,
  status,
  error,
  visible,
  onRetry,
}: SectionProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-zinc-900">{title}</h2>
      {status === "loading" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      )}
      {status === "failed" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-md">
          <p className="text-sm font-medium text-zinc-700">
            {error ?? "Could not load this section."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}
      {status === "succeeded" && items.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-md">
          Nothing trending here right now.
        </p>
      )}
      {status === "succeeded" && items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <ContentCard key={item.id} item={item} priority={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TrendingPage() {
  const dispatch = useAppDispatch();
  const trending = useAppSelector((state) => state.trending);
  const [filter, setFilter] = useState<ContentFilter>("all");

  useEffect(() => {
    void dispatch(fetchTrending());
  }, [dispatch]);

  const retry = useCallback(() => {
    void dispatch(fetchTrending());
  }, [dispatch]);

  const anyLoaded =
    trending.news.status === "succeeded" ||
    trending.movies.status === "succeeded" ||
    trending.social.status === "succeeded";
  const allFailed =
    trending.news.status === "failed" &&
    trending.movies.status === "failed" &&
    trending.social.status === "failed";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-zinc-900">
            <Flame className="h-6 w-6 text-orange-500" aria-hidden="true" />
            Trending
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Top headlines, trending movies and the most-liked sample posts.
          </p>
        </div>
        <FilterTabs value={filter} onChange={setFilter} />
      </div>

      {allFailed && !anyLoaded ? (
        <EmptyState
          icon={RefreshCw}
          title="Trending is unavailable right now"
          message="Every content source failed to load. Check your connection and try again."
          actionLabel="Retry"
          onAction={retry}
        />
      ) : (
        <>
          <TrendingSection
            title="Top Headlines"
            items={trending.news.items}
            status={trending.news.status}
            error={trending.news.error}
            visible={filter === "all" || filter === "news"}
            onRetry={retry}
          />
          <TrendingSection
            title="Trending Movies"
            items={trending.movies.items}
            status={trending.movies.status}
            error={trending.movies.error}
            visible={filter === "all" || filter === "movie"}
            onRetry={retry}
          />
          <TrendingSection
            title="Popular Sample Posts"
            items={trending.social.items}
            status={trending.social.status}
            error={trending.social.error}
            visible={filter === "all" || filter === "social"}
            onRetry={retry}
          />
        </>
      )}
    </>
  );
}
