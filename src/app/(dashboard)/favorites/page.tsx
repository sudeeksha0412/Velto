"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import ContentCard from "@/components/ContentCard";
import EmptyState from "@/components/EmptyState";
import FilterTabs, { type ContentFilter } from "@/components/FilterTabs";

export default function FavoritesPage() {
  const { items, hydrated } = useAppSelector((state) => state.favorites);
  const [filter, setFilter] = useState<ContentFilter>("all");

  const filtered =
    filter === "all" ? items : items.filter((item) => item.type === filter);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-zinc-900">
            <Heart className="h-6 w-6 text-pink-500" aria-hidden="true" />
            Favorites
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {hydrated
              ? `${items.length} saved ${items.length === 1 ? "item" : "items"} — synced across feed, trending and search.`
              : "Loading your saved items…"}
          </p>
        </div>
        {items.length > 0 && (
          <FilterTabs value={filter} onChange={setFilter} />
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          message="Tap the heart on any card in your feed, trending or search results to save it here."
          actionLabel="Back to For You"
          actionHref="/"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={`No ${filter === "movie" ? "movies" : `${filter} items`} saved`}
          message="Save some items of this type and they will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
