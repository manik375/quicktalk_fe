// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

// Reusable Navbar Button Component (No rounded corners, uses CSS variables)
const NavbarButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  isCollapsed,
  className = "",
  // Default hover uses --text-primary, override via prop if needed
  hoverColorClass = "hover:text-[color:var(--text-primary)]",
  // Active color uses --primary-accent
  activeColorClass = "text-[color:var(--primary-accent)]",
  // Inactive color uses --text-secondary
  inactiveColorClass = "text-[color:var(--text-secondary)]",
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`
      w-full flex items-center p-2.5 md:p-3 /* NO rounded-lg */
      transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--primary-accent)] dark:focus:ring-offset-[color:var(--bg-base)]
      ${
        isActive
          ? `neumorphic-pressed ${activeColorClass}` // Uses neumorphic-pressed & accent color
          : `neumorphic-interactive ${inactiveColorClass} ${hoverColorClass}` // Uses neumorphic-interactive, secondary color, and specified hover
      }
      ${isCollapsed ? "justify-center" : "flex-col"}
      ${className}
    `}
  >
    {/* Icons use currentColor by default, inheriting from the button's text color */}
    <Icon className={`h-6 w-6 ${isCollapsed ? "" : "mb-1.5"}`} />
    {!isCollapsed && (
      <span className="text-xs font-medium tracking-wide">{label}</span>
    )}
  </button>
);

// Compact Neumorphic Theme Toggle - ONLY for COLLAPSED/Desktop View (Uses CSS Variables)
const CompactNeumorphicThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === "dark";

  // Button uses neumorphic-interactive which applies shadows/bg from CSS vars
  const trackClasses = `
    relative w-10 h-10 flex items-center justify-center cursor-pointer neumorphic-interactive rounded-full
    transition-colors duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--primary-accent)] dark:focus:ring-offset-[color:var(--bg-base)]
  `;

  // Handle uses neumorphic-raised and bg-base from CSS vars
  const handleClasses = `
    absolute inset-1 neumorphic-raised rounded-full
    flex items-center justify-center
    transition-all duration-300 ease-in-out shadow-sm
    bg-[color:var(--bg-base)] /* Explicitly use bg-base for inner circle */
  `;

  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={trackClasses}
    >
      <div className={handleClasses}>
        {/* Specific icon colors kept for semantic clarity */}
        {isDark ? (
          <SunIcon className="h-5 w-5 text-yellow-400" />
        ) : (
          <MoonIcon className="h-5 w-5 text-indigo-400" />
        )}
      </div>
    </button>
  );
};

const Navbar = ({ onLogout, activeTab, onTabChange }) => {
  // --- State ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navbarRef = useRef(null);
  const mobileNavbarWidth = "240px";

  // --- Theme State ---
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Ensure this check runs only once on mount
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      );
    }
    return "light"; // Default if window is not available (SSR)
  });

  useEffect(() => {
    // Apply theme class to HTML element
    const root = document.documentElement;
    if (currentTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Persist preference
    try {
      localStorage.setItem("theme", currentTheme);
    } catch (error) {
      console.error("Could not save theme to localStorage:", error);
    }
  }, [currentTheme]);

  const handleThemeToggle = () => {
    setCurrentTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  // --- End Theme State ---

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    // Check if window exists before adding listener (for SSR safety)
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      // Initial check in case the component mounts after the initial state check
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isMobileNavOpen]);

  // --- Handlers ---
  const handleTabClick = (tabName) => {
    if (onTabChange) {
      onTabChange(tabName);
    }
    if (isMobile) {
      setIsMobileNavOpen(false);
    }
  };

  const toggleMobileNavbar = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const handleLogout = () => {
    if (onLogout) {
      // Check if onLogout exists before calling
      onLogout();
    }
    if (isMobile) {
      setIsMobileNavOpen(false);
    }
  };

  // --- Render Logic ---

  // Mobile Navbar
  if (isMobile) {
    return (
      <>
        {/* Mobile Nav Toggle Handle - NO NEUMORPHIC, uses CSS Vars */}
        <button
          onClick={toggleMobileNavbar}
          aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
          className={`
            fixed top-1/2 left-0 transform -translate-y-1/2 z-50
            px-1 py-3
            text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] /* Use CSS vars */
            bg-[color:var(--bg-base)] /* Use CSS var */
            border border-black/10 dark:border-white/10 /* Subtle border using transparency */
            border-l-0
            rounded-r-md /* Keep slight rounding only on the handle's right edge */
            transition-all duration-300 ease-in-out
            hover:brightness-95 dark:hover:brightness-110 /* Use brightness for hover */
            focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--primary-accent)] /* Use CSS var */
          `}
          style={{
            transform: isMobileNavOpen
              ? `translateX(${mobileNavbarWidth}) translateY(-50%)`
              : "translateY(-50%)",
          }}
        >
          {/* Icons use currentColor to inherit button text color */}
          {isMobileNavOpen ? (
            <ChevronLeftIcon className="h-5 w-5" />
          ) : (
            <ChevronRightIcon className="h-5 w-5" />
          )}
        </button>

        {/* Backdrop Overlay */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={toggleMobileNavbar}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sliding Panel - Uses neumorphic-raised (CSS Vars), NO ROUNDING */}
        <div
          ref={navbarRef}
          className={`
            neumorphic-raised fixed top-0 left-0 h-full z-40 /* Uses CSS vars for shadow/bg */
            flex flex-col items-center p-4 space-y-5
            transform transition-transform duration-300 ease-in-out
            ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ width: mobileNavbarWidth }}
          role="navigation"
          aria-label="Main Navigation"
        >
          {/* Logo - Uses neumorphic-pressed & CSS Vars */}
          <div className="h-12 w-12 neumorphic-pressed rounded-full flex items-center justify-center text-2xl font-bold text-[color:var(--primary-accent)] mb-3 flex-shrink-0">
            N
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-3 w-full flex-grow">
            {/* NavbarButtons use CSS vars internally */}
            <NavbarButton
              icon={ChatBubbleLeftEllipsisIcon}
              label="Chats"
              isActive={activeTab === "Chats"}
              onClick={() => handleTabClick("Chats")}
              isCollapsed={false}
            />
            <NavbarButton
              icon={UserGroupIcon}
              label="Groups"
              isActive={activeTab === "Groups"}
              onClick={() => handleTabClick("Groups")}
              isCollapsed={false}
            />
            <NavbarButton
              icon={Cog6ToothIcon}
              label="Settings"
              isActive={activeTab === "Settings"}
              onClick={() => handleTabClick("Settings")}
              isCollapsed={false}
            />
          </nav>

          {/* Bottom Controls */}
          <div className="flex flex-col space-y-3 w-full flex-shrink-0">
            {/* Simple Theme Toggle for Mobile using NavbarButton (CSS Vars) */}
            <NavbarButton
              // Icons use specific colors, but could be themed if needed
              icon={currentTheme === "dark" ? SunIcon : MoonIcon}
              label={currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
              isActive={false}
              onClick={handleThemeToggle}
              isCollapsed={false}
              // Add specific icon colors within the button if needed
              className={
                currentTheme === "dark" ? "text-yellow-400" : "text-indigo-500"
              } // Color the icon via text color
              hoverColorClass={
                currentTheme === "dark"
                  ? "hover:text-yellow-300"
                  : "hover:text-indigo-400"
              } // Hover color for icon
            />
            {/* Logout Button - Uses NavbarButton (CSS Vars) + specific semantic hover */}
            <NavbarButton
              icon={ArrowLeftOnRectangleIcon}
              label="Logout"
              isActive={false}
              onClick={handleLogout}
              isCollapsed={false}
              // Keep semantic red hover using Tailwind classes
              hoverColorClass="hover:text-red-500 dark:hover:text-red-400"
            />
          </div>
        </div>
      </>
    );
  }

  // --- Desktop Navbar (Icon-only) ---
  const isDesktopCollapsed = true;

  return (
    // Desktop Sidebar - Uses neumorphic-raised (CSS Vars), NO ROUNDING
    <div
      className="hidden md:flex flex-col items-center w-20 p-3 space-y-5 neumorphic-borderless flex-shrink-0 h-full /* Uses CSS vars for shadow/bg */"
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Logo - Uses neumorphic-pressed & CSS Vars */}
      <div className="h-10 w-10 neumorphic-pressed rounded-full flex items-center justify-center text-xl font-bold text-[color:var(--primary-accent)] mb-3 flex-shrink-0">
        N
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-3 w-full flex-grow">
        {/* NavbarButtons use CSS vars internally */}
        <NavbarButton
          icon={ChatBubbleLeftEllipsisIcon}
          label="Chats"
          isActive={activeTab === "Chats"}
          onClick={() => handleTabClick("Chats")}
          isCollapsed={isDesktopCollapsed}
        />
        <NavbarButton
          icon={UserGroupIcon}
          label="Groups"
          isActive={activeTab === "Groups"}
          onClick={() => handleTabClick("Groups")}
          isCollapsed={isDesktopCollapsed}
        />
        <NavbarButton
          icon={Cog6ToothIcon}
          label="Settings"
          isActive={activeTab === "Settings"}
          onClick={() => handleTabClick("Settings")}
          isCollapsed={isDesktopCollapsed}
        />
      </nav>

      {/* Bottom Controls */}
      <div className="flex flex-col space-y-3 w-full flex-shrink-0 items-center">
        {/* Compact Neumorphic Theme Toggle for Desktop (Uses CSS Vars) */}
        <CompactNeumorphicThemeToggle
          theme={currentTheme}
          onToggle={handleThemeToggle}
        />
        {/* Logout Button - Uses NavbarButton (CSS Vars) + specific semantic hover */}
        <NavbarButton
          icon={ArrowLeftOnRectangleIcon}
          label="Logout"
          isActive={false}
          onClick={handleLogout}
          isCollapsed={isDesktopCollapsed}
          // Keep semantic red hover using Tailwind classes
          hoverColorClass="hover:text-red-500 dark:hover:text-red-400"
        />
      </div>
    </div>
  );
};

export default Navbar;
