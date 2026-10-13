import type { NextRequest } from "next/server";
import type { ApiErrorResponse, FeedResponse } from "@/types/content";
import { fetchTopHeadlines, NEWS_CATEGORY_MAP } from "@/lib/news";

const PAGE_SIZE = 10;

function errorResponse(error: string, status: number): Response {
  const body: ApiErrorResponse = { error };
  return Response.json(body, { status });
}

export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const category = params.get("category") ?? "technology";
  const pageParam = params.get("page");

  if (!Object.prototype.hasOwnProperty.call(NEWS_CATEGORY_MAP, category)) {
    return errorResponse(`Unknown category "${category}".`, 400);
  }

  const page = pageParam === null ? 1 : Number.parseInt(pageParam, 10);
  if (!Number.isInteger(page) || page < 1) {
    return errorResponse("The `page` parameter must be a positive integer.", 400);
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return errorResponse("NEWS_API_KEY is not configured on the server.", 500);
  }

  let result: { items: FeedResponse["items"]; totalResults: number };
  try {
    result = await fetchTopHeadlines(category, page, PAGE_SIZE, apiKey);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Could not reach NewsAPI.",
      502,
    );
  }

  const body: FeedResponse = {
    items: result.items,
    hasMore: result.totalResults > page * PAGE_SIZE,
  };
  return Response.json(body);
}
