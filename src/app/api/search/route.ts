import type { NextRequest } from "next/server";
import type {
  ApiErrorResponse,
  ContentItem,
  SearchResponse,
  ContentType,
} from "@/types/content";
import { searchNews } from "@/lib/news";
import { fetchTmdbJson, mapTmdbMovie, type TmdbListResponse } from "@/lib/tmdb";
import { searchPosts } from "@/lib/social";

const NEWS_RESULT_LIMIT = 10;
const MOVIE_RESULT_LIMIT = 10;
const SOCIAL_RESULT_LIMIT = 12;
const MAX_QUERY_LENGTH = 100;

function errorResponse(error: string, status: number): Response {
  const body: ApiErrorResponse = { error };
  return Response.json(body, { status });
}

/**
 * GET /api/search?q=... — cross-provider search (NewsAPI + TMDB + mock social).
 * Providers are queried in parallel; individual failures are reported per
 * content type so the rest of the results still render.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length === 0) {
    return errorResponse("Missing search query (`q`).", 400);
  }

  const errors: Partial<Record<ContentType, string>> = {};
  const requests: [ContentType, Promise<ContentItem[]>][] = [];

  const newsKey = process.env.NEWS_API_KEY;
  if (newsKey) {
    requests.push(["news", searchNews(query, NEWS_RESULT_LIMIT, newsKey)]);
  } else {
    errors.news = "News search is unavailable (NEWS_API_KEY not configured).";
  }

  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    requests.push([
      "movie",
      fetchTmdbJson<TmdbListResponse>(
        "/search/movie",
        { query, page: "1", language: "en-US", include_adult: "false" },
        tmdbKey,
      ).then((data) =>
        (data.results ?? []).slice(0, MOVIE_RESULT_LIMIT).map(mapTmdbMovie),
      ),
    ]);
  } else {
    errors.movie = "Movie search is unavailable (TMDB_API_KEY not configured).";
  }

  // Mock social posts are local — they never fail and always participate.
  requests.push([
    "social",
    Promise.resolve(searchPosts(query, SOCIAL_RESULT_LIMIT)),
  ]);

  const results = await Promise.allSettled(requests.map(([, promise]) => promise));

  const items: ContentItem[] = [];
  results.forEach((result, index) => {
    const [type] = requests[index];
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors[type] =
        result.reason instanceof Error
          ? result.reason.message
          : `Could not reach the ${type} provider.`;
    }
  });

  // Every remote provider failed and social produced nothing usable:
  // still return 200 with per-provider errors (client decides how to render).
  const body: SearchResponse = { items, errors };
  return Response.json(body);
}
