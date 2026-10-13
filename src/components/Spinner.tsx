"use client";

export default function Spinner() {
  return (
    <div
      role="status"
      aria-label="Loading more content"
      className="mx-auto h-9 w-9 rounded-full border-[3px] border-purple-200 border-t-purple-600 animate-spin"
    />
  );
}
