// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService"; // <--- Import the actual service

// Get user from localStorage if exists
const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const initialState = {
  user: user,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

// --- Async Thunks (Using authService) ---

// Register User Thunk
export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      // --- REPLACE SIMULATION WITH SERVICE CALL ---
      return await authService.register(userData);
      // --- END REPLACEMENT ---
    } catch (error) {
      // The service now throws an error with a message
      const message = error.message || error.toString();
      console.error("Register Thunk Error caught:", message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login User Thunk
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      // --- REPLACE SIMULATION WITH SERVICE CALL ---
      return await authService.login(userData);
      // --- END REPLACEMENT ---
    } catch (error) {
      const message = error.message || error.toString();
      console.error("Login Thunk Error caught:", message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout User Thunk
export const logout = createAsyncThunk("auth/logout", async () => {
  // Call the service's logout function
  authService.logout();
  // No need to return anything specific unless the service call was async and returned data
});

// Update Profile Thunk
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, thunkAPI) => {
    try {
      return await authService.updateProfile(formData);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      console.error("Update Profile Thunk Error:", message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- Auth Slice Definition (Remains the same as before) ---
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Register Cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.message = "Registration successful!";
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // Login Cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.message = "Login successful!";
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // Logout Case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isSuccess = false;
        state.isLoading = false;
        state.isError = false;
        state.message = "Successfully logged out.";
      })
      // Update Profile Cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.message = "Profile updated successfully!";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;
