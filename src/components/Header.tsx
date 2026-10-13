"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, Settings, User, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch } from "@/store/hooks";
import { openSidebar } from "@/store/uiSlice";
import { setQuery } from "@/store/searchSlice";

/**
 * Top header: mobile menu button, logo, debounced global search,
 * settings shortcut and a guest avatar indicator.
 */
export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const debounced = useDebounce(input, 400);
  const lastNavigation = useRef("");

  // Navigate to /search once the debounced query becomes non-empty and
  // different from what the URL already shows. Empty query returns to the feed.
  useEffect(() => {
    const query = debounced.trim();
    if (query === "") {
      if (pathname === "/search") {
        router.push("/");
      }
      return;
    }
    if (lastNavigation.current === query && pathname === "/search") {
      return;
    }
    lastNavigation.current = query;
    dispatch(setQuery(query));
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [debounced, pathname, router, dispatch]);

  // When the user leaves /search through other navigation (sidebar, links),
  // clear the visible query so the input matches the page.
  useEffect(() => {
    if (pathname !== "/search" && lastNavigation.current !== "") {
      lastNavigation.current = "";
      setInput("");
    }
  }, [pathname]);

  function submitNow(event: React.FormEvent) {
    event.preventDefault();
    const query = input.trim();
    if (query === "") {
      return;
    }
    lastNavigation.current = query;
    dispatch(setQuery(query));
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => dispatch(openSidebar())}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link href="/" className="shrink-0 lg:hidden">
          <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Velto
          </span>
        </Link>

        <form
          onSubmit={submitNow}
          role="search"
          className="relative ml-auto w-full max-w-md lg:ml-0"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search news, movies, and posts..."
            aria-label="Search news, movies, and posts"
            className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-9 text-sm text-zinc-800 placeholder:text-zinc-400 transition focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          {input !== "" && (
            <button
              type="button"
              onClick={() => setInput("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-purple-700"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 py-1.5 pl-1.5 pr-3 text-white"
            title="Guest user"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">Guest</span>
          </div>
        </div>
      </div>
    </header>
  );
}
