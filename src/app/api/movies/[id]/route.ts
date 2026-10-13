import type { NextRequest } from "next/server";
import type { ApiErrorResponse, MovieDetails } from "@/types/content";
import {
  BACKDROP_BASE_URL,
  fetchTmdbJson,
  TMDB_IMAGE_BASE_URL,
  type TmdbMovieDetails,
} from "@/lib/tmdb";

function errorResponse(error: string, status: number): Response {
  const body: ApiErrorResponse = { error };
  return Response.json(body, { status });
}

/** GET /api/movies/[id] — full TMDB details + trailer key for the modal. */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const tmdbId = Number.parseInt(id, 10);
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    return errorResponse("Invalid movie id.", 400);
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return errorResponse("TMDB_API_KEY is not configured on the server.", 500);
  }

  let data: TmdbMovieDetails;
  try {
    data = await fetchTmdbJson<TmdbMovieDetails>(
      `/movie/${tmdbId}`,
      { append_to_response: "videos" },
      apiKey,
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Could not reach TMDB.",
      502,
    );
  }

  const videos = data.videos?.results ?? [];
  const trailer =
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer");

  const body: MovieDetails = {
    id: data.id,
    title: data.title,
    overview: data.overview ?? "",
    poster: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : "",
    backdrop: data.backdrop_path ? `${BACKDROP_BASE_URL}${data.backdrop_path}` : "",
    rating: typeof data.vote_average === "number" && data.vote_average > 0 ? data.vote_average : null,
    releaseDate: data.release_date ?? "",
    genres: (data.genres ?? []).map((genre) => genre.name),
    runtime: typeof data.runtime === "number" && data.runtime > 0 ? data.runtime : null,
    trailerKey: trailer?.key ?? null,
    url: `https://www.themoviedb.org/movie/${data.id}`,
  };
  return Response.json(body);
}
