"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Clapperboard,
  Flame,
  Heart,
  Home,
  MessagesSquare,
  Newspaper,
  Settings,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeSidebar } from "@/store/uiSlice";

const NAV_ITEMS = [
  { href: "/", label: "For You", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "/social", label: "Social", icon: MessagesSquare },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const favoriteCount = useAppSelector((state) => state.favorites.items.length);

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                : "text-zinc-600 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/favorites" && favoriteCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active
                    ? "bg-white/25 text-white"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {favoriteCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-3 py-1">
      <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
        Velto
      </span>
    </Link>
  );
}

/** Fixed desktop sidebar + mobile slide-out drawer. */
export default function Sidebar() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.sidebarOpen);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch(closeSidebar());
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, dispatch]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white px-3 py-5 lg:flex">
        <SidebarBrand />
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <p className="px-3 text-xs text-zinc-400">
          Personalized content dashboard
        </p>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => dispatch(closeSidebar())}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white px-3 py-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => dispatch(closeSidebar())}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => dispatch(closeSidebar())} />
            </div>
            <p className="px-3 pt-4 text-xs text-zinc-400">
              Personalized content dashboard
            </p>
          </div>
        </div>
      )}
    </>
  );
}
