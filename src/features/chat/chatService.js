// src/features/chat/chatService.js
import axios from "axios";
// Import the updated authService which now HAS getToken
import authService from "../auth/authService";

// Ensure API_URL is correctly set in your .env (e.g., VITE_API_URL=http://localhost:5000/api/)
const API_URL = import.meta.env.VITE_API_URL || "/api/"; // Default fallback added

// Create an Axios instance for your API
// All requests using apiClient will automatically have the base URL prepended
const apiClient = axios.create({
  baseURL: API_URL, // e.g., http://localhost:5000/api/
});

// --- Request Interceptor ---
// This runs BEFORE every request made using 'apiClient'
apiClient.interceptors.request.use(
  (config) => {
    // Get token from the dedicated function in authService
    const token = authService.getToken();
    if (token) {
      // Add the Authorization header if token exists
      config.headers.Authorization = `Bearer ${token}`;
      // Optional: Log that the token is being added (useful for debugging)
      // console.log(`[Interceptor] Adding token to request for ${config.baseURL}${config.url}`);
    } else {
      // Optional: Log if no token was found (might indicate user isn't logged in)
      // console.log(`[Interceptor] No token found for ${config.baseURL}${config.url}`);
    }
    // Must return the config object for the request to proceed
    return config;
  },
  (error) => {
    // Handle errors during request setup (rare)
    console.error("[Interceptor] Request Error:", error);
    return Promise.reject(error); // Reject the promise to propagate the error
  }
);

// --- Service Functions ---
// These functions now rely on the interceptor to handle authentication.
// They DO NOT need the 'token' argument passed from the thunks anymore.
// Paths used here ('chat', 'chat/group', 'auth/user') are relative to the baseURL.

/**
 * Accesses or creates a 1-on-1 chat with the specified user.
 * @param {string} userId - The ID of the target user.
 * @returns {Promise<object>} The API response data (expects { success: true, chat: {...} }).
 */
const accessChat = async (userId) => {
  console.log(`[ChatService] accessChat called for user: ${userId}`);
  // Makes POST request to: baseURL + 'chat' (e.g., http://localhost:5000/api/chat)
  const response = await apiClient.post("chat", { userId });
  return response.data;
};

/**
 * Fetches all chats (1-on-1 and group) for the currently authenticated user.
 * @returns {Promise<object>} The API response data (expects { success: true, chats: [...] }).
 */
const fetchChats = async () => {
  console.log("[ChatService] fetchChats called");
  // Makes GET request to: baseURL + 'chat' (e.g., http://localhost:5000/api/chat)
  const response = await apiClient.get("chat");
  return response.data;
};

/**
 * Creates a new group chat.
 * @param {object} groupData - Data for the new group (e.g., { chatName: 'Name', users: ['id1', 'id2'], about: 'Desc' }).
 * @returns {Promise<object>} The API response data (expects { success: true, chat: {...} }).
 */
const createGroupChat = async (groupData) => {
  console.log(
    `[ChatService] createGroupChat called with name: ${groupData.chatName}`
  );
  // Makes POST request to: baseURL + 'chat/group' (e.g., http://localhost:5000/api/chat/group)
  const response = await apiClient.post("chat/group", groupData);
  return response.data;
};

/**
 * Searches for users based on a query string.
 * @param {string} searchQuery - The search term.
 * @returns {Promise<Array>} The API response data (expects an array of user objects).
 */
const searchUsers = async (searchQuery) => {
  console.log(`[ChatService] searchUsers called with query: ${searchQuery}`);
  // Makes GET request to: baseURL + 'auth/user' with query params
  // e.g., http://localhost:5000/api/auth/user?search=...
  const response = await apiClient.get("auth/user", {
    params: { search: searchQuery },
  });
  return response.data;
};

/**
 * Removes a user from a group chat (used for leaving or admin removal).
 * @param {string} chatId - The ID of the group chat.
 * @param {string} userId - The ID of the user to remove.
 * @returns {Promise<object>} The API response data (expects { success: true, message: '...', chatId: '...', removedUserId: '...' } or { success: true, chat: {...} }).
 */
const removeFromGroup = async (chatId, userId) => {
  console.log(
    `[ChatService] removeFromGroup called for chat ${chatId}, user ${userId}`
  );
  // Makes PUT request to: baseURL + 'chat/groupremove'
  const response = await apiClient.put("chat/groupremove", { chatId, userId });
  return response.data;
};

/**
 * Deletes a group chat (admin only).
 * @param {string} chatId - The ID of the group chat to delete.
 * @returns {Promise<object>} The API response data (expects { success: true, message: '...', chatId: '...' }).
 */
const deleteGroup = async (chatId) => {
  console.log(`[ChatService] deleteGroup called for chat ${chatId}`);
  // Makes DELETE request to: baseURL + 'chat/:chatId'
  const response = await apiClient.delete(`chat/${chatId}`);
  return response.data;
};

// --- Export the service functions ---
const chatService = {
  accessChat,
  fetchChats,
  createGroupChat,
  searchUsers,
  removeFromGroup, // Added
  deleteGroup, // Added
};

export default chatService;
