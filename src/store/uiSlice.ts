import { createSlice } from "@reduxjs/toolkit";

interface UiState {
  /** TMDB id of the movie whose details modal is open, or null. */
  movieDetailsId: number | null;
  /** Mobile navigation drawer. */
  sidebarOpen: boolean;
}

const initialState: UiState = {
  movieDetailsId: null,
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openMovieDetails(state, action: { payload: number }) {
      state.movieDetailsId = action.payload;
    },
    closeMovieDetails(state) {
      state.movieDetailsId = null;
    },
    openSidebar(state) {
      state.sidebarOpen = true;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
  },
});

export const {
  openMovieDetails,
  closeMovieDetails,
  openSidebar,
  closeSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
