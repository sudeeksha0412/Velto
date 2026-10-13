import Feed from "@/components/Feed";

export const metadata = { title: "Movies — Velto" };

export default function MoviesPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
          Movies
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          TMDB recommendations mapped from your interests. Open any card for
          ratings, genres and trailers.
        </p>
      </div>
      <Feed types={["movie"]} />
    </>
  );
}
