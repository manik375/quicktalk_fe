// src/components/ThemeToggle.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme, selectCurrentTheme } from "../features/theme/themeSlice";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"; // Using Heroicons

const ThemeToggle = ({ className = "" }) => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(selectCurrentTheme);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${
        currentTheme === "light" ? "dark" : "light"
      } mode`}
      className={`neumorphic-interactive p-2 rounded-full ${className}`} // Make it round
    >
      {currentTheme === "light" ? (
        <MoonIcon className="h-5 w-5 text-[color:var(--text-primary)]" />
      ) : (
        <SunIcon className="h-5 w-5 text-[color:var(--text-primary)]" />
      )}
    </button>
  );
};

export default ThemeToggle;
