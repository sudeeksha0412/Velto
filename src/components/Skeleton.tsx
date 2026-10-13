export default function Skeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-md">
      <div className="h-44 w-full bg-zinc-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 rounded bg-purple-200" />
        <div className="h-4 w-4/5 rounded bg-zinc-200" />
        <div className="h-3 w-full rounded bg-zinc-200" />
        <div className="h-3 w-2/3 rounded bg-zinc-200" />
        <div className="h-9 w-28 rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}
