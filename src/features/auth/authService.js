// src/features/auth/authService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api/";
const AUTH_API_URL = `${API_URL}auth/`;

const USER_STORAGE_KEY = "user"; // Define key for local storage

// Register user
const register = async (userData) => {
  const response = await axios.post(AUTH_API_URL + "register", userData);
  // IMPORTANT: Store the whole user object which includes the token
  if (response.data && response.data.token) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
  }
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(AUTH_API_URL + "login", userData);
  // IMPORTANT: Store the whole user object which includes the token
  if (response.data && response.data.token) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
  }
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  // NOTE: Consider dispatching reset actions for other slices (like chatSlice) from authSlice logout thunk
};

// Search users by query string
const searchUsers = async (query, token) => {
  // This function STILL needs the token passed explicitly because it might be called
  // outside the interceptor flow, or for clarity. The interceptor will likely add
  // the header again, but Axios handles duplicate headers reasonably.
  if (!token) throw new Error("Token required for searching users.");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params: { search: query },
  };
  const response = await axios.get(AUTH_API_URL + "user", config);
  return response.data;
};

// --- ADD THIS getToken FUNCTION ---
// Retrieves the token from localStorage
const getToken = () => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user?.token || null; // Return the token if user and token exist
    } catch (e) {
      console.error("Error parsing user data from localStorage", e);
      return null;
    }
  }
  return null; // No user data found
};
// --- END ---

// Update user profile
const updateProfile = async (formData) => {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  // Log the FormData entries
  console.log("FormData entries:");
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await axios.put(AUTH_API_URL + "update-profile", formData, config);
  
  // Log the response data
  console.log("Profile update response:", response.data);
  
  // Update localStorage with new user data if successful
  if (response.data) {
    // Get current user from localStorage to preserve any fields not returned by the API
    const currentUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
    
    // Make sure status is explicitly included in the updated user data
    const updatedUser = { 
      ...currentUser, 
      ...response.data,
      status: response.data.status || currentUser.status // Explicitly ensure status is preserved
    };
    
    // Log the data being saved to localStorage
    console.log("Saving to localStorage:", updatedUser);
    
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  }
  
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  searchUsers,
  updateProfile,
  getToken,
};

export default authService;
