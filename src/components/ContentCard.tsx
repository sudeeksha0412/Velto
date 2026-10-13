"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, Star } from "lucide-react";
import type { ContentItem, ContentType } from "@/types/content";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleFavorite } from "@/store/favoritesSlice";
import { openMovieDetails } from "@/store/uiSlice";

const BADGE_STYLES: Record<ContentType, string> = {
  news: "bg-blue-100 text-blue-700",
  movie: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
};

const BADGE_LABELS: Record<ContentType, string> = {
  news: "News",
  movie: "Movie",
  social: "Sample Post",
};

const CTA_LABELS: Record<ContentType, string> = {
  news: "Read More",
  movie: "View Details",
  social: "View Profile",
};

const PLACEHOLDER_ICONS: Record<ContentType, string> = {
  news: "📰",
  movie: "🎬",
  social: "💬",
};

function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return "";
  }
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 0) {
    // Future-dated items (e.g. upcoming movie releases): show the date.
    return new Date(then).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatLikes(likes: number): string {
  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(1)}k`;
  }
  return String(likes);
}

export default function ContentCard({
  item,
  priority = false,
}: {
  item: ContentItem;
  /** Set true for above-the-fold cards so the image loads eagerly (LCP). */
  priority?: boolean;
}) {
  const dispatch = useAppDispatch();
  const [imageFailed, setImageFailed] = useState(false);
  const isFavorite = useAppSelector((state) =>
    state.favorites.items.some((saved) => saved.id === item.id),
  );
  const showImage = item.image !== "" && !imageFailed;
  const timeLabel = formatRelativeTime(item.publishedAt);
  const movieId =
    item.type === "movie" ? Number.parseInt(item.id.replace("movie-", ""), 10) : NaN;

  function handleCta(event: React.MouseEvent) {
    if (item.type === "movie" && Number.isInteger(movieId)) {
      event.preventDefault();
      dispatch(openMovieDetails(movieId));
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      {showImage ? (
        <div className="relative h-44 w-full bg-gradient-to-br from-purple-100 to-pink-100">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : item.type === "social" && item.avatar !== undefined ? (
        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
          {/* Social posts without media: show a large avatar instead. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.avatar}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-4 ring-white/70"
          />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 text-5xl">
          {PLACEHOLDER_ICONS[item.type]}
        </div>
      )}

      {/* Favorite toggle — isolated from card clicks. */}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dispatch(toggleFavorite(item));
        }}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110 hover:bg-white"
      >
        <Heart
          className={`h-4.5 w-4.5 transition ${
            isFavorite ? "fill-pink-500 text-pink-500" : "text-zinc-500"
          }`}
          aria-hidden="true"
        />
      </button>

      <span
        className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[item.type]}`}
      >
        {BADGE_LABELS[item.type]}
      </span>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Social cards: author row with avatar + handle */}
        {item.type === "social" && item.handle !== undefined && (
          <div className="flex items-center gap-2">
            {item.avatar !== undefined && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.avatar}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">
                {item.author ?? item.title}
              </p>
              <p className="truncate text-xs text-zinc-500">{item.handle}</p>
            </div>
          </div>
        )}

        {item.type !== "social" && (
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-zinc-900">
            {item.title}
          </h3>
        )}
        {item.description !== "" && (
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">
            {item.description}
          </p>
        )}

        {item.type === "social" && item.hashtags !== undefined && (
          <div className="flex flex-wrap gap-1.5">
            {item.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-zinc-500">
          <span className="truncate font-medium">{item.source}</span>
          {timeLabel !== "" && (
            <>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{timeLabel}</span>
            </>
          )}
          {typeof item.likes === "number" && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                <Heart className="h-3 w-3" aria-hidden="true" />
                {formatLikes(item.likes)}
              </span>
            </>
          )}
          {typeof item.rating === "number" && item.rating > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-500">
                <Star className="h-3 w-3 fill-amber-400" aria-hidden="true" />
                {item.rating.toFixed(1)}
              </span>
            </>
          )}
        </div>

        {item.type === "social" ? (
          // Mock posts have no real destination URL — link to nothing instead
          // of pretending to be live social content.
          <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500">
            {CTA_LABELS[item.type]}
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Sample
            </span>
          </span>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCta}
            className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {CTA_LABELS[item.type]}
          </a>
        )}
      </div>
    </article>
  );
}
