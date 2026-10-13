"use client";

import { CheckCircle2 } from "lucide-react";
import { CATEGORIES } from "@/types/content";
import { toggleCategory } from "@/store/preferencesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { categories, hydrated } = useAppSelector((state) => state.preferences);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
        Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Choose the topics you care about. Your For You feed, movies and social
        posts update instantly and stay saved on this device.
      </p>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-bold text-zinc-900">Interests</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select one or more categories. Select none to see the empty state.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((category) => {
            const checked = categories.includes(category.id);
            return (
              <label
                key={category.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition ${
                  checked
                    ? "border-purple-400 bg-purple-50 text-purple-800"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => dispatch(toggleCategory(category.id))}
                  className="h-4 w-4 accent-purple-600"
                />
                {category.label}
              </label>
            );
          })}
        </div>

        {hydrated && categories.length > 0 && (
          <p
            role="status"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Preferences saved — your feed has been refreshed.
          </p>
        )}
        {hydrated && categories.length === 0 && (
          <p
            role="status"
            className="mt-5 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
          >
            No categories selected — your feed will be empty. Pick at least one.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-bold text-zinc-900">Account</h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-lg font-bold text-white">
            G
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Guest user</p>
            <p className="text-xs text-zinc-500">
              Velto runs without sign-in; your preferences and favorites are
              stored locally in this browser.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
