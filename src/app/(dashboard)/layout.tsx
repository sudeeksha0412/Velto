import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MovieDetailsModal from "@/components/MovieDetailsModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="lg:pl-60">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
      {/* Global movie details modal (renders only while a movie is open). */}
      <MovieDetailsModal />
    </div>
  );
}
