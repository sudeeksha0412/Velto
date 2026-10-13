import type { ContentItem, SocialPost } from "@/types/content";
import rawPosts from "@/data/socialPosts.json";

/** Sample/mock dataset — clearly labeled as such in the UI. */
export const POSTS: SocialPost[] = rawPosts as SocialPost[];

/** Normalize a mock post into the shared ContentItem model. */
export function mapSocialPost(post: SocialPost): ContentItem {
  return {
    id: post.id,
    type: "social",
    title: post.username,
    description: post.text,
    image: post.image ?? "",
    url: "",
    source: post.handle,
    publishedAt: post.timestamp,
    author: post.username,
    handle: post.handle,
    avatar: post.avatar,
    likes: post.likes,
    hashtags: [post.hashtag],
    category: post.hashtag,
  };
}

/** Case-insensitive search across post text, author, handle and hashtag. */
export function searchPosts(query: string, limit: number): ContentItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [];
  }
  return POSTS.filter(
    (post) =>
      post.text.toLowerCase().includes(needle) ||
      post.username.toLowerCase().includes(needle) ||
      post.handle.toLowerCase().includes(needle) ||
      post.hashtag.toLowerCase().includes(needle),
  )
    .slice(0, limit)
    .map(mapSocialPost);
}
