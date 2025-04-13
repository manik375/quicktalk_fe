// src/features/view/viewSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentView: "chats", // 'chats' or 'groups'
};

export const viewSlice = createSlice({
  name: "view",
  initialState,
  reducers: {
    setView: (state, action) => {
      // Validate payload if needed
      if (action.payload === "chats" || action.payload === "groups") {
        state.currentView = action.payload;
      } else {
        console.warn(
          `Invalid view payload received: ${action.payload}. Setting to 'chats'.`
        );
        state.currentView = "chats"; // Default fallback
      }
    },
    // No reset needed for this simple slice currently
  },
});

// Action creators are generated for each case reducer function
export const { setView } = viewSlice.actions;

// Selector to get the current view state
export const selectCurrentView = (state) => state.view.currentView;

// Export the reducer as the default export
export default viewSlice.reducer;
