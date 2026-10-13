export type ContentType = "news" | "movie" | "social";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  image: string;
  url: string;
  source: string;
  publishedAt: string;
  /** Social posts: display name, @handle, avatar and engagement. */
  author?: string;
  handle?: string;
  avatar?: string;
  likes?: number;
  hashtags?: string[];
  /** Movies: TMDB rating (0–10). */
  rating?: number;
  /** News/movies: category or genre labels for filtering and badges. */
  category?: string;
}

export const CATEGORIES = [
  { id: "technology", label: "Technology" },
  { id: "sports", label: "Sports" },
  { id: "finance", label: "Finance" },
  { id: "entertainment", label: "Entertainment" },
  { id: "health", label: "Health" },
  { id: "science", label: "Science" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type FeedStatus = "idle" | "loading" | "succeeded" | "failed";

/** Normalized response returned by every /api feed route. */
export interface FeedResponse {
  items: ContentItem[];
  hasMore: boolean;
}

/** Error payload returned by every /api route when something goes wrong. */
export interface ApiErrorResponse {
  error: string;
}

/** Response from /api/search — partial provider failures are reported per type. */
export interface SearchResponse {
  items: ContentItem[];
  errors: Partial<Record<ContentType, string>>;
}

/** Response from /api/movies/[id] — TMDB details + trailer for the modal. */
export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster: string;
  backdrop: string;
  rating: number | null;
  releaseDate: string;
  genres: string[];
  runtime: number | null;
  trailerKey: string | null;
  url: string;
}

/** Raw record stored in src/data/socialPosts.json (mock social API). */
export interface SocialPost {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  text: string;
  hashtag: string;
  image: string | null;
  likes: number;
  timestamp: string;
}
