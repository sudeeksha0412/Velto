"use client";

import type { ContentType } from "@/types/content";

export type ContentFilter = "all" | ContentType;

const FILTERS: { id: ContentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "news", label: "News" },
  { id: "movie", label: "Movies" },
  { id: "social", label: "Social" },
];

/** Shared All / News / Movies / Social tab bar used by Trending, Favorites and Search. */
export default function FilterTabs({
  value,
  onChange,
}: {
  value: ContentFilter;
  onChange: (filter: ContentFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter content by type"
      className="flex flex-wrap gap-2"
    >
      {FILTERS.map((filter) => {
        const active = value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                : "border border-zinc-200 bg-white text-zinc-600 hover:border-purple-300 hover:text-purple-700"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
