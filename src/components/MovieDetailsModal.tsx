"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeMovieDetails } from "@/store/uiSlice";
import type { MovieDetails } from "@/types/content";
import Spinner from "@/components/Spinner";

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

/**
 * Modal showing full TMDB details (poster, rating, genres, trailer) for a
 * movie. Phase is derived from which movie the loaded data belongs to, so a
 * stale response for a previously opened movie can never render.
 */
export default function MovieDetailsModal() {
  const dispatch = useAppDispatch();
  const movieId = useAppSelector((state) => state.ui.movieDetailsId);
  const [result, setResult] = useState<{
    id: number;
    details: MovieDetails;
  } | null>(null);
  const [failure, setFailure] = useState<{ id: number; message: string } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (movieId === null) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}`);
        const body: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof (body as { error?: string }).error === "string"
              ? (body as { error: string }).error
              : `Could not load movie details (${response.status}).`;
          throw new Error(message);
        }
        if (!cancelled) {
          setResult({ id: movieId, details: body as MovieDetails });
        }
      } catch (error) {
        if (!cancelled) {
          setFailure({
            id: movieId,
            message:
              error instanceof Error
                ? error.message
                : "Could not load movie details.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId, attempt]);

  // Escape closes the modal.
  useEffect(() => {
    if (movieId === null) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch(closeMovieDetails());
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movieId, dispatch]);

  if (movieId === null) {
    return null;
  }

  // Derive the current phase from which movie the data belongs to.
  const phase =
    result?.id === movieId
      ? ({ phase: "ready", details: result.details } as const)
      : failure?.id === movieId
        ? ({ phase: "error", message: failure.message } as const)
        : ({ phase: "loading" } as const);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => dispatch(closeMovieDetails())}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Movie details"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-bold text-zinc-900">
            {phase.phase === "ready" ? phase.details.title : "Movie Details"}
          </h2>
          <button
            type="button"
            onClick={() => dispatch(closeMovieDetails())}
            aria-label="Close movie details"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {phase.phase === "loading" && (
          <div className="flex flex-col items-center gap-3 p-12">
            <Spinner />
            <p className="text-sm text-zinc-500">Loading details…</p>
          </div>
        )}

        {phase.phase === "error" && (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="text-sm font-medium text-zinc-700">{phase.message}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Retry
            </button>
          </div>
        )}

        {phase.phase === "ready" && (
          <div className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 sm:h-72 sm:w-48">
                {phase.details.poster !== "" ? (
                  <Image
                    src={phase.details.poster}
                    alt={`${phase.details.title} poster`}
                    fill
                    sizes="192px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">
                    🎬
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {phase.details.rating !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-600">
                      <Star
                        className="h-3.5 w-3.5 fill-amber-400"
                        aria-hidden="true"
                      />
                      {phase.details.rating.toFixed(1)} / 10
                    </span>
                  )}
                  {phase.details.releaseDate !== "" && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                      {new Date(phase.details.releaseDate).getFullYear()}
                    </span>
                  )}
                  {phase.details.runtime !== null && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                      {formatRuntime(phase.details.runtime)}
                    </span>
                  )}
                </div>

                {phase.details.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {phase.details.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-600"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm leading-relaxed text-zinc-600">
                  {phase.details.overview !== ""
                    ? phase.details.overview
                    : "No description available."}
                </p>

                <a
                  href={phase.details.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex w-fit items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Open on TMDB
                </a>
              </div>
            </div>

            {phase.details.trailerKey !== null && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold text-zinc-900">Trailer</h3>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${phase.details.trailerKey}`}
                    title={`${phase.details.title} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
