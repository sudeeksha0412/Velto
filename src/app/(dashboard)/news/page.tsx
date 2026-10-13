import Feed from "@/components/Feed";

export const metadata = { title: "News — Velto" };

export default function NewsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
          News
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Top headlines from NewsAPI, matched to your selected interests.
        </p>
      </div>
      <Feed types={["news"]} />
    </>
  );
}
