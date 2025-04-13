// src/features/message/messageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import messageService from "./messageService";

// Helper function to extract error messages
const getErrorMessage = (error) => {
  return (
    error.response?.data?.message || // Server-specific message first
    error.message || // Generic Axios/JS error message
    error.toString() // Fallback
  );
};

// Simplified Helper function to get token
const getTokenAndReject = (thunkAPI) => {
  const token = thunkAPI.getState().auth?.user?.token;
  if (!token) {
    console.error("Auth token not found in state.");
    return thunkAPI.rejectWithValue("User not authenticated. Please log in.");
  }
  return token;
};

const initialState = {
  messages: [], // Messages for the currently selected chat
  isLoading: false, // For fetching messages
  isSending: false, // For sending a message
  isError: false,
  message: "", // Status or error message string
};

// --- Async Thunks ---

export const sendMessage = createAsyncThunk(
  "message/sendMessage",
  async (messageData, thunkAPI) => {
    // messageData = { content, chatId }
    const token = getTokenAndReject(thunkAPI);
    if (token?.payload && thunkAPI.rejected.match(token)) return token;

    try {
      // API call returns the fully populated, saved message object
      const newMessage = await messageService.sendMessage(messageData, token);
      // SUCCESS: Return the object for the component to use (e.g., trigger socket emit)
      return newMessage;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Error in sendMessage:", message, error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchMessagesForChat = createAsyncThunk(
  "message/fetchMessages",
  async (chatId, thunkAPI) => {
    const token = getTokenAndReject(thunkAPI);
    if (token?.payload && thunkAPI.rejected.match(token)) return token;

    if (!chatId) {
      return thunkAPI.rejectWithValue("Chat ID is required to fetch messages.");
    }

    try {
      const messages = await messageService.fetchMessages(chatId, token);
      return messages; // Returns array of message objects
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(
        `Error fetching messages for chat ${chatId}:`,
        message,
        error
      );
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- Slice Definition ---
export const messageSlice = createSlice({
  name: "message",
  initialState,
  // --- Synchronous Reducers ---
  reducers: {
    // Add a message received via Socket.IO EVENT ('message received')
    // IMPORTANT: This should ONLY be dispatched if the received message
    // belongs to the CURRENTLY SELECTED CHAT (check in the listener).
    addMessageRealtime: (state, action) => {
      const newMessage = action.payload;
      if (!newMessage?._id) {
        console.warn(
          "Reducer addMessageRealtime: Invalid message payload.",
          newMessage
        );
        return;
      }
      // Prevent adding duplicates (though socket events should ideally be unique)
      const exists = state.messages.some((msg) => msg._id === newMessage._id);
      if (!exists) {
        console.log(
          "Reducer addMessageRealtime: Adding message",
          newMessage._id
        );
        state.messages.push(newMessage); // Add to the end
      } else {
        console.log(
          "Reducer addMessageRealtime: Message",
          newMessage._id,
          "already exists."
        );
      }
    },
    // Reset the message state (e.g., on logout or when changing chat selection)
    resetMessageState: (state) => {
      console.log(
        "Reducer resetMessageState: Clearing messages and resetting state."
      );
      Object.assign(state, initialState);
    },
  },
  // --- Async Thunk Reducers ---
  extraReducers: (builder) => {
    builder
      // --- Send Message Lifecycle ---
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.isError = false;
        state.message = ""; // Clear previous messages
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        // state.message = "Message sent!"; // Optional success message
        console.log(
          "Reducer sendMessage.fulfilled: API call successful for msg",
          action.payload?._id
        );
        // *** NO state.messages.push(action.payload) HERE ***
        // Real-time addition is handled by addMessageRealtime via socket event.
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.isError = true;
        state.message = action.payload || "Failed to send message.";
        console.error("Reducer sendMessage.rejected:", action.payload);
      })

      // --- Fetch Messages Lifecycle ---
      .addCase(fetchMessagesForChat.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "Loading messages...";
        state.messages = []; // Clear previous messages immediately
      })
      .addCase(fetchMessagesForChat.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload; // Replace with fetched messages
        // state.message = "Messages loaded."; // Optional success message
      })
      .addCase(fetchMessagesForChat.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to load messages.";
        state.messages = []; // Ensure messages are cleared on error
        console.error("Reducer fetchMessagesForChat.rejected:", action.payload);
      });
  },
});

// Export synchronous actions
export const { addMessageRealtime, resetMessageState } = messageSlice.actions;

// Export selectors
export const selectAllMessages = (state) => state.message.messages;
export const selectMessageIsLoading = (state) => state.message.isLoading;
export const selectMessageIsSending = (state) => state.message.isSending;
export const selectMessageError = (state) =>
  state.message.isError ? state.message.message : ""; // Return message only if isError is true

// Export the reducer
export default messageSlice.reducer;
