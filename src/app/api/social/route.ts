import type { NextRequest } from "next/server";
import type { ApiErrorResponse, ContentItem, FeedResponse } from "@/types/content";
import { mapSocialPost, POSTS } from "@/lib/social";

const DEFAULT_PAGE_SIZE = 4;
const MAX_PAGE_SIZE = 20;

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

  const limitParam = params.get("limit");
  let limit = DEFAULT_PAGE_SIZE;
  if (limitParam !== null) {
    const parsed = Number.parseInt(limitParam, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return errorResponse("The `limit` parameter must be a positive integer.", 400);
    }
    limit = Math.min(parsed, MAX_PAGE_SIZE);
  }

  const trending = params.get("sort") === "trending";
  const hashtag = (params.get("hashtag") ?? "").trim().replace(/^#/, "").toLowerCase();
  let filtered =
    hashtag.length > 0
      ? POSTS.filter((post) => post.hashtag.toLowerCase() === hashtag)
      : POSTS;

  // Trending = mock engagement ranking (likes), clearly sample data.
  if (trending) {
    filtered = [...filtered].sort((a, b) => b.likes - a.likes);
  }

  const start = (page - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  const items: ContentItem[] = pageItems.map(mapSocialPost);

  const body: FeedResponse = {
    items,
    hasMore: start + limit < filtered.length,
  };
  return Response.json(body);
}
