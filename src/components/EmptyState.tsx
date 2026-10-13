"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

/** Shared empty / error state with an optional functional action. */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  const action =
    actionLabel !== undefined && (onAction !== undefined || actionHref !== undefined) ? (
      actionHref !== undefined ? (
        <Link
          href={actionHref}
          className="mt-2 inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      )
    ) : null;

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-12 text-center shadow-md">
      <Icon className="h-10 w-10 text-zinc-300" aria-hidden="true" />
      <p className="text-lg font-semibold text-zinc-800">{title}</p>
      {message !== undefined && (
        <p className="max-w-md text-sm text-zinc-500">{message}</p>
      )}
      {action}
    </div>
  );
}
