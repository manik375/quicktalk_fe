// client/src/features/presence/presenceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  onlineUserIds: [], // Array to store IDs of currently online users
};

export const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    // Action to set the entire list of online users (received from server)
    setOnlineUsers: (state, action) => {
      // Ensure payload is an array, default to empty array if not
      state.onlineUserIds = Array.isArray(action.payload)
        ? [...new Set(action.payload)]
        : []; // Ensure unique IDs
    },
    // --- IMPLEMENTED: Add a single user ID ---
    addUserOnline: (state, action) => {
      const userId = action.payload;
      if (userId && !state.onlineUserIds.includes(userId)) {
        state.onlineUserIds.push(userId);
      }
    },
    // --- IMPLEMENTED: Remove a single user ID ---
    removeUserOffline: (state, action) => {
      const userId = action.payload;
      state.onlineUserIds = state.onlineUserIds.filter((id) => id !== userId);
    },
    // --- IMPLEMENTED: Reset state (e.g., on logout) ---
    resetPresenceState: (state) => {
      state.onlineUserIds = initialState.onlineUserIds; // Reset to initial empty array
    },
  },
});

// --- UPDATED: Export all action creators ---
export const {
  setOnlineUsers,
  addUserOnline,
  removeUserOffline,
  resetPresenceState, // Add resetPresenceState here
} = presenceSlice.actions;

// --- Selectors ---

// Select the raw array of online user IDs
export const selectOnlineUserIds = (state) => state.presence.onlineUserIds;

// Selector creator: Creates a selector to check if a *specific* user ID is online
// Usage: const isUserOnline = useSelector(selectIsUserOnline(userIdToCheck));
export const selectIsUserOnline = (userId) => (state) =>
  state.presence.onlineUserIds.includes(userId);

export default presenceSlice.reducer;
