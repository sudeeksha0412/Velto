"use client";

import { useEffect, type RefObject } from "react";

/**
 * Calls `callback` whenever the sentinel element scrolls into view.
 * Disabled while `enabled` is false (e.g. while loading or when there is
 * nothing more to load).
 */
export function useInfiniteScroll(
  sentinelRef: RefObject<HTMLDivElement | null>,
  callback: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callback();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [sentinelRef, callback, enabled]);
}
