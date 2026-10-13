import type { ContentItem } from "@/types/content";

const NEWS_API_TOP_HEADLINES = "https://newsapi.org/v2/top-headlines";
const NEWS_API_EVERYTHING = "https://newsapi.org/v2/everything";

/**
 * NewsAPI has no "finance" category — it maps to "business".
 * "general" is used for the Trending page (top headlines overall).
 */
export const NEWS_CATEGORY_MAP: Record<string, string> = {
  general: "general",
  technology: "technology",
  sports: "sports",
  finance: "business",
  entertainment: "entertainment",
  health: "health",
  science: "science",
};

export interface NewsApiArticle {
  title: string | null;
  description: string | null;
  url: string | null;
  urlToImage: string | null;
  publishedAt: string | null;
  source: { name: string | null } | null;
}

interface NewsApiResponse {
  status: "ok" | "error";
  message?: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
}

export function mapNewsArticles(
  articles: NewsApiArticle[],
  category?: string,
): ContentItem[] {
  return articles
    .filter(
      (article): article is NewsApiArticle & { title: string; url: string } =>
        typeof article.title === "string" &&
        article.title.length > 0 &&
        typeof article.url === "string" &&
        article.url.length > 0,
    )
    .map((article) => ({
      id: `news-${article.url.replace(/^https?:\/\//, "")}`,
      type: "news" as const,
      title: article.title,
      description: article.description ?? "",
      image: article.urlToImage ?? "",
      url: article.url,
      source: article.source?.name ?? "NewsAPI",
      publishedAt: article.publishedAt ?? "",
      category,
    }));
}

async function requestNews(
  url: URL,
): Promise<{ articles: NewsApiArticle[]; totalResults: number }> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await response.json()) as NewsApiResponse;
  if (!response.ok || data.status !== "ok") {
    throw new Error(
      data.message ?? `NewsAPI request failed (${response.status}).`,
    );
  }
  return { articles: data.articles ?? [], totalResults: data.totalResults ?? 0 };
}

/** Fetch a page of top headlines for a mapped NewsAPI category. */
export async function fetchTopHeadlines(
  category: string,
  page: number,
  pageSize: number,
  apiKey: string,
): Promise<{ items: ContentItem[]; totalResults: number }> {
  const url = new URL(NEWS_API_TOP_HEADLINES);
  url.searchParams.set("country", "us");
  url.searchParams.set("category", NEWS_CATEGORY_MAP[category]);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("page", String(page));
  url.searchParams.set("apiKey", apiKey);

  const data = await requestNews(url);
  return {
    items: mapNewsArticles(data.articles, category),
    totalResults: data.totalResults,
  };
}

/**
 * Full-text article search via NewsAPI /v2/everything.
 * Note: the free "Developer" plan serves articles with a ~24h delay and
 * only accepts requests from localhost — documented in the README.
 */
export async function searchNews(
  query: string,
  pageSize: number,
  apiKey: string,
): Promise<ContentItem[]> {
  const url = new URL(NEWS_API_EVERYTHING);
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("apiKey", apiKey);

  const data = await requestNews(url);
  return mapNewsArticles(data.articles);
}
