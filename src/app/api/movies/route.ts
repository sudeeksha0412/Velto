import type { NextRequest } from "next/server";
import type { ApiErrorResponse, ContentItem, FeedResponse } from "@/types/content";
import {
  fetchTmdbJson,
  mapTmdbMovie,
  TMDB_GENRE_MAP,
  type TmdbListResponse,
} from "@/lib/tmdb";

function errorResponse(error: string, status: number): Response {
  const body: ApiErrorResponse = { error };
  return Response.json(body, { status });
}

export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const pageParam = params.get("page");
  const page = pageParam === null ? 1 : Number.parseInt(pageParam, 10);
  if (!Number.isInteger(page) || page < 1) {
    return errorResponse("The `page` parameter must be a positive integer.", 400);
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return errorResponse("TMDB_API_KEY is not configured on the server.", 500);
  }

  const trending = params.get("trending") === "1";
  const categories = (params.get("categories") ?? "")
    .split(",")
    .map((category) => category.trim())
    .filter((category) => category.length > 0);

  const genreIds = [
    ...new Set(
      categories
        .map((category) => TMDB_GENRE_MAP[category])
        .filter((id): id is number => typeof id === "number"),
    ),
  ];

  // Trending page: TMDB's real trending endpoint. Otherwise: preference-based
  // discover (or popular when no category maps to a genre).
  let path: string;
  const query: Record<string, string> = {
    page: String(page),
    language: "en-US",
  };
  if (trending) {
    path = "/trending/movie/day";
  } else if (genreIds.length > 0) {
    path = "/discover/movie";
    query.include_adult = "false";
    query.sort_by = "popularity.desc";
    query.with_genres = genreIds.join("|");
  } else {
    path = "/movie/popular";
  }

  let data: TmdbListResponse;
  try {
    data = await fetchTmdbJson<TmdbListResponse>(path, query, apiKey);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Could not reach TMDB.",
      502,
    );
  }

  const items: ContentItem[] = (data.results ?? []).map(mapTmdbMovie);

  const body: FeedResponse = {
    items,
    hasMore: data.page < data.total_pages,
  };
  return Response.json(body);
}
