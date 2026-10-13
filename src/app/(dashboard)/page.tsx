"use client";

import Link from "next/link";
import Feed from "@/components/Feed";
import { useAppSelector } from "@/store/hooks";
import { CATEGORIES } from "@/types/content";

export default function ForYouPage() {
  const categories = useAppSelector((state) => state.preferences.categories);
  const selected = CATEGORIES.filter((category) =>
    categories.includes(category.id),
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            For You
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fresh news, movies and posts tuned to your interests.
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-purple-300 hover:text-purple-700"
        >
          Edit interests
        </Link>
      </div>

      {selected.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" aria-label="Selected categories">
          {selected.map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-3 py-1 text-xs font-semibold text-white"
            >
              {category.label}
            </span>
          ))}
        </div>
      )}

      <Feed />
    </>
  );
}
