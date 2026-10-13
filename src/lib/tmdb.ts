import type { ContentItem } from "@/types/content";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w780";

/**
 * Map Velto categories to TMDB genres where it makes sense.
 * Categories without a natural equivalent fall back to popular movies.
 */
export const TMDB_GENRE_MAP: Record<string, number> = {
  technology: 878, // Science Fiction
  finance: 80, // Crime
  entertainment: 35, // Comedy
  science: 99, // Documentary
};

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date: string | null;
  vote_average: number | null;
  genre_ids?: number[];
}

export interface TmdbListResponse {
  page: number;
  total_pages: number;
  results: TmdbMovie[];
  status_message?: string;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbMovieDetails extends TmdbMovie {
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  videos?: { results: TmdbVideo[] };
  status_message?: string;
}

/**
 * TMDB accepts two credential styles: a v3 API key (32 hex chars, sent as an
 * `api_key` query parameter) and a v4 read access token (sent as a Bearer
 * header). Detect which one we have and authenticate accordingly.
 */
function isV3ApiKey(key: string): boolean {
  return /^[0-9a-f]{32}$/i.test(key);
}

/** GET a TMDB endpoint with the server-side key, timeout and error normalization. */
export async function fetchTmdbJson<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (isV3ApiKey(apiKey)) {
    url.searchParams.set("api_key", apiKey);
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Could not reach TMDB.");
  }

  const data = (await response.json()) as T & { status_message?: string };
  if (!response.ok) {
    throw new Error(
      data.status_message ?? `TMDB request failed (${response.status}).`,
    );
  }
  return data;
}

/** Normalize a TMDB movie record into the shared ContentItem model. */
export function mapTmdbMovie(movie: TmdbMovie): ContentItem {
  return {
    id: `movie-${movie.id}`,
    type: "movie",
    title: movie.title,
    description: movie.overview ?? "",
    image: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : "",
    url: `https://www.themoviedb.org/movie/${movie.id}`,
    source: "TMDB",
    publishedAt: movie.release_date ?? "",
    rating:
      typeof movie.vote_average === "number" && movie.vote_average > 0
        ? movie.vote_average
        : undefined,
  };
}

export { IMAGE_BASE_URL as TMDB_IMAGE_BASE_URL, BACKDROP_BASE_URL };
