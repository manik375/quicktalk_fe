// src/components/SearchUsers.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios"; // Still used for fetching user list
import { useSelector, useDispatch } from "react-redux"; // Added useDispatch
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"; // Added ArrowPathIcon for loading

// Import the chat action and selectors
import {
  accessOrCreateChat,
  selectChatIsLoading, // Loading state for accessing/creating chat
  selectChatError,
  setSelectedChat, // Error state for accessing/creating chat
} from "../features/chat/chatSlice";
import { fetchMessagesForChat } from "../features/message/messageSlice";

// Debounce function (remains the same)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Renamed prop: receives a function to call when chat is accessed/created
const SearchUsers = ({ onChatAccessed }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false); // Loading state for *fetching search results*
  const [searchError, setSearchError] = useState(""); // Error state for *fetching search results*
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);

  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  // Get loading/error state specifically for the chat access/creation action
  const chatAccessLoading = useSelector(selectChatIsLoading);
  const chatAccessError = useSelector(selectChatError); // Can be displayed if needed

  // --- User Search Logic (fetches list of users for dropdown) ---
  const performSearch = useCallback(
    debounce(async (term, token) => {
      if (!term.trim() || !token) {
        setResults([]);
        setSearchLoading(false);
        // Let onBlur or selection handle hiding if needed
        // setShowResults(results.length > 0 || !!error); // Show if there are results or error
        return;
      }
      setSearchLoading(true);
      setSearchError("");
      setShowResults(true); // Show dropdown when search starts

      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` },
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/",
        };

        // *** IMPORTANT: Verify this API endpoint path matches your backend setup ***
        // Example uses '/api/auth/user' as per your provided code. Adjust if needed (e.g., '/api/user')
        console.log(
          `Searching users with term: ${term} at ${config.baseURL}auth/user`
        );
        const { data } = await axios.get(`auth/user?search=${term}`, config);

        // Ensure data is an array before filtering
        const usersData = Array.isArray(data) ? data : [];
        const filteredData = usersData.filter(
          (user) => user._id !== currentUser?._id
        );
        setResults(filteredData);

        // Check if endpoint might be missing or returning wrong format
        if (!Array.isArray(data) && config.baseURL.includes("localhost")) {
          // Simple check
          console.warn(
            "User search endpoint might not be configured correctly or returned non-array data:",
            data
          );
          setSearchError(
            "User search failed (Check backend route: GET /api/auth/user)"
          );
        }
      } catch (err) {
        console.error("Search users error:", err.response || err);
        // Provide more specific error message if possible
        if (err.response?.status === 404) {
          setSearchError(
            "User search endpoint not found (GET /api/auth/user)."
          );
        } else {
          setSearchError(
            err.response?.data?.message ||
              err.message ||
              "Failed to search users"
          );
        }
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [currentUser?._id]
  );

  // Effect to trigger user search
  useEffect(() => {
    if (currentUser?.token) {
      performSearch(searchTerm, currentUser.token);
    } else {
      setResults([]);
      setSearchLoading(false);
      setShowResults(false);
    }
  }, [searchTerm, currentUser?.token, performSearch]);

  // --- Handle Selecting a User (Triggers Chat Access/Creation) ---
  const handleSelect = async (selectedUser) => {
    console.log(
      "Selected user, dispatching accessOrCreateChat:",
      selectedUser.name
    );
    // Hide search results immediately
    setShowResults(false);
    // Keep searchTerm briefly visible while loading chat access? Optional.
    // Or clear it: setSearchTerm('');

    // Dispatch the async thunk to access/create the chat
    const resultAction = await dispatch(accessOrCreateChat(selectedUser._id));

    // Check if the thunk completed successfully
    if (accessOrCreateChat.fulfilled.match(resultAction)) {
      const chat = resultAction.payload; // The newly accessed/created chat object
      console.log("Chat accessed/created successfully via Redux:", chat._id);
      // Clear search term after success
      setSearchTerm("");
      setResults([]);
      // Call the prop function passed from Sidebar with the CHAT object
      if (onChatAccessed) {
        onChatAccessed(chat);
      }
    } else {
      // Error is automatically set in the Redux chat slice (chatAccessError)
      // We can log it here, or display chatAccessError elsewhere if needed
      console.error(
        "Failed to access/create chat:",
        resultAction.payload || resultAction.error.message
      );
      // Optionally show a user-facing notification about the failure
      // You might want to keep the search term in this case so user doesn't lose context
    }
    // No need to clear results/searchTerm here if already done or if keeping on error
  };

  // --- Handle Clicking Outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };
    // Add listener only when dropdown is potentially visible
    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResults]); // Re-run effect only when showResults changes

  // --- Render Component ---
  return (
    <div className="relative" ref={searchContainerRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search or start new chat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            // Show results on focus only if there's a reason to (term, results, error)
            if (searchTerm || results.length > 0 || searchError)
              setShowResults(true);
          }}
          // Disable input while accessing/creating chat (different from searchLoading)
          disabled={chatAccessLoading}
          className={`neumorphic-input w-full pl-10 pr-10 py-2 ${
            chatAccessLoading ? "opacity-70 cursor-not-allowed" : ""
          }`} // Add disabled style
        />
        {/* Search Icon */}
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--text-secondary)] pointer-events-none" />

        {/* Loading Spinner (for chat access) inside input */}
        {chatAccessLoading && (
          <ArrowPathIcon className="animate-spin h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--primary-accent)]" />
        )}
      </div>

      {/* Results Dropdown */}
      {/* Show if flag is true AND there's content (term, loading, error, results) */}
      {showResults &&
        (searchTerm || searchLoading || searchError || results.length > 0) && (
          <div className="absolute z-20 mt-1 w-full neumorphic-raised rounded-md shadow-lg max-h-60 overflow-y-auto p-1 bg-[color:var(--bg-base)] custom-scrollbar">
            {/* Search Results Loading Indicator */}
            {searchLoading && (
              <div className="p-2 text-sm text-center text-[color:var(--text-secondary)]">
                Searching...
              </div>
            )}
            {/* Search Results Error Message */}
            {searchError && !searchLoading && (
              <div className="p-2 text-sm text-center text-red-500">
                {searchError}
              </div>
            )}
            {/* Display Search Results */}
            {!searchLoading && !searchError && results.length > 0 && (
              <ul className="space-y-1">
                {results.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => handleSelect(user)} // Triggers chat access/creation
                    // Consider modern hover instead of neumorphic-interactive-subtle?
                    // className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
                    className="flex items-center p-2 rounded-md hover:bg-[color:var(--primary-accent)] hover:bg-opacity-10 dark:hover:bg-opacity-20 cursor-pointer neumorphic-interactive-subtle" // Keeping subtle neumorphic for now
                  >
                    <img
                      src={
                        user.pic ||
                        `https://ui-avatars.com/api/?name=${
                          user.name?.replace(/\s+/g, "+") || "?"
                        }&background=random&color=fff&size=32`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                      {user.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {/* No Users Found Message */}
            {!searchLoading &&
              !searchError &&
              results.length === 0 &&
              searchTerm && (
                <div className="p-2 text-sm text-center text-[color:var(--text-secondary)]">
                  No users found.
                </div>
              )}
          </div>
        )}
      {/* Optional: Display chat access error below input */}
      {/* {chatAccessError && !chatAccessLoading && (
            <p className="text-xs text-red-500 mt-1 px-1">{chatAccessError}</p>
        )} */}
    </div>
  );
};

export default SearchUsers;
