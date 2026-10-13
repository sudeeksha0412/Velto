import Feed from "@/components/Feed";

export const metadata = { title: "Social — Velto" };

export default function SocialPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
          Social
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sample posts from the mock social dataset, filtered by your
          interests. These are not live posts from any real platform.
        </p>
      </div>
      <Feed types={["social"]} />
    </>
  );
}
