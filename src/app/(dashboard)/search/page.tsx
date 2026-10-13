"use client";

import { Suspense, useEffect } from "react";
import { Search, SearchX, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSearch,
  fetchSearch,
  setFilter,
} from "@/store/searchSlice";
import ContentCard from "@/components/ContentCard";
import EmptyState from "@/components/EmptyState";
import FilterTabs from "@/components/FilterTabs";
import Skeleton from "@/components/Skeleton";

const SKELETON_COUNT = 6;

function SearchResults() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = (params.get("q") ?? "").trim();
  const { activeQuery, items, status, error, errors, filter } = useAppSelector(
    (state) => state.search,
  );

  // Drive the search from the URL so refresh + back/forward work. `activeQuery`
  // is the query whose results are currently (or being) loaded, so we only
  // fetch when the URL changes to a query we haven't already requested — this
  // prevents the effect from refiring (and refetching) when Redux state updates.
  useEffect(() => {
    if (urlQuery === "") {
      dispatch(clearSearch());
      return;
    }
    if (urlQuery === activeQuery) {
      // Already loaded (or in flight) for this exact query.
      return;
    }
    void dispatch(fetchSearch(urlQuery));
  }, [urlQuery, activeQuery, dispatch]);

  const visible =
    filter === "all" ? items : items.filter((item) => item.type === filter);
  const providerWarnings = Object.entries(errors);

  if (urlQuery === "") {
    return (
      <EmptyState
        icon={Search}
        title="Search Velto"
        message="Type a topic in the search bar to find news, movies and sample posts."
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Results for “{urlQuery}”
          </h1>
          <p className="mt-1 text-sm text-zinc-500" role="status">
            {status === "succeeded" &&
              `${items.length} ${items.length === 1 ? "result" : "results"} found`}
            {status === "loading" && "Searching…"}
          </p>
        </div>
        {items.length > 0 && (
          <FilterTabs value={filter} onChange={(f) => dispatch(setFilter(f))} />
        )}
      </div>

      {/* Partial provider failures: results still render, but say what's missing. */}
      {providerWarnings.length > 0 && status !== "failed" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Some sources are unavailable:</p>
          <ul className="mt-1 list-inside list-disc">
            {providerWarnings.map(([type, message]) => (
              <li key={type}>
                {type}: {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === "loading" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      )}

      {status === "failed" && (
        <EmptyState
          icon={RefreshCw}
          title="Search failed"
          message={error ?? "Something went wrong while searching."}
          actionLabel="Try again"
          onAction={() => void dispatch(fetchSearch(urlQuery))}
        />
      )}

      {status === "succeeded" && visible.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={`No ${filter === "all" ? "" : `${filter} `}results for “${urlQuery}”`}
          message="Try different keywords, or clear the search to return to your feed."
          actionLabel="Clear search"
          onAction={() => {
            dispatch(clearSearch());
            router.push("/");
          }}
        />
      )}

      {status === "succeeded" && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
