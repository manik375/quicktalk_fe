// src/features/theme/themeSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Function to get the initial theme
const getInitialTheme = () => {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    return storedTheme;
  }
  // Check system preference if no theme is stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const initialState = {
  mode: getInitialTheme(), // 'light' or 'dark'
};

// Apply the initial theme to the HTML element
document.documentElement.classList.toggle("dark", initialState.mode === "dark");
localStorage.setItem("theme", initialState.mode); // Ensure localStorage is set initially

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      // Update HTML class and localStorage
      document.documentElement.classList.toggle("dark", state.mode === "dark");
      localStorage.setItem("theme", state.mode);
    },
    setTheme: (state, action) => {
      // Optional: Allow setting theme directly
      const newMode = action.payload === "dark" ? "dark" : "light";
      if (newMode !== state.mode) {
        state.mode = newMode;
        document.documentElement.classList.toggle(
          "dark",
          state.mode === "dark"
        );
        localStorage.setItem("theme", state.mode);
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

// Selector to get the current theme mode
export const selectCurrentTheme = (state) => state.theme.mode;

export default themeSlice.reducer;
