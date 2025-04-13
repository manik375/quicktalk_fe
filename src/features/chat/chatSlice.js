// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import chatService from "./chatService"; // Assuming chatService has/will have addMembersToGroup

// Helper function to extract error messages
const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    // Simplified check
    return error.response.data.message;
  }
  return error.message || error.toString();
};

// Helper to get token or reject if unavailable (Used as an auth GUARD)
const getTokenAndReject = (thunkAPI) => {
  try {
    const token = thunkAPI.getState()?.auth?.user?.token;
    if (!token) {
      console.error(
        "Auth token check failed in thunk guard (state.auth.user.token)."
      );
      return thunkAPI.rejectWithValue(
        "User not authenticated or token missing"
      );
    }
    return token;
  } catch (error) {
    console.error("Unexpected error checking token state:", error);
    return thunkAPI.rejectWithValue("Authentication state error");
  }
};

// Initial State
const initialState = {
  chats: [],
  selectedChat: null,
  users: [], // User search results
  isLoading: false, // General loading for fetch/access
  isCreatingGroup: false,
  isLeavingGroup: false,
  isDeletingGroup: false,
  isAddingMembers: false, // <<< ADDED: Loading state for Add Members
  isError: false, // General error flag
  message: "", // General message/error display
  searchError: "", // Specific error for user search
  isSearchLoading: false, // Specific loading for user search
  lastUpdated: null,
};

// --- Async Thunks ---

export const accessOrCreateChat = createAsyncThunk(
  "chat/accessOrCreate",
  async (targetUserId, thunkAPI) => {
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    try {
      const response = await chatService.accessChat(targetUserId);
      if (!response?.chat)
        throw new Error("Invalid response from accessChat API");
      return response.chat;
    } catch (error) {
      console.error("accessOrCreateChat Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchUserChats = createAsyncThunk(
  "chat/fetchUserChats",
  async (_, thunkAPI) => {
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    try {
      const response = await chatService.fetchChats();
      if (!response || !Array.isArray(response.chats))
        throw new Error("Invalid response from fetchChats API");
      return response.chats; // Pass only the chats array
    } catch (error) {
      console.error("fetchUserChats Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createGroupChat = createAsyncThunk(
  "chat/createGroup",
  async (groupData, thunkAPI) => {
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    try {
      const creatorId = thunkAPI.getState().auth?.user?._id;
      if (creatorId && !groupData.users.includes(creatorId)) {
        groupData.users.push(creatorId);
      }
      const response = await chatService.createGroupChat(groupData);
      if (!response?.chat)
        throw new Error("Invalid response from createGroupChat API");
      return response.chat;
    } catch (error) {
      console.error("createGroupChat Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (searchQuery, thunkAPI) => {
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    if (!searchQuery || searchQuery.trim().length < 1) return [];
    try {
      const results = await chatService.searchUsers(searchQuery.trim());
      return results || []; // Ensure array format
    } catch (error) {
      console.error("searchUsers Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const leaveGroup = createAsyncThunk(
  "chat/leaveGroup",
  async (chatId, thunkAPI) => {
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    try {
      const userId = thunkAPI.getState().auth?.user?._id;
      if (!userId) throw new Error("Could not identify current user.");
      const response = await chatService.removeFromGroup(chatId, userId);
      if (!response.success)
        throw new Error(response.message || "Failed to leave group.");
      return { chatId, message: response.message };
    } catch (error) {
      console.error("leaveGroup Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteGroup = createAsyncThunk(
  "chat/deleteGroup",
  async (chatId, thunkAPI) => {
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    try {
      const response = await chatService.deleteGroup(chatId);
      if (!response.success)
        throw new Error(response.message || "Failed to delete group.");
      return { chatId, message: response.message };
    } catch (error) {
      console.error("deleteGroup Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

// --- >> NEW: Add Members Thunk << ---
export const addMembersToGroup = createAsyncThunk(
  "chat/addMembers",
  async ({ chatId, userIds }, thunkAPI) => {
    // Destructure payload
    const tokenCheck = getTokenAndReject(thunkAPI);
    if (tokenCheck?.payload) return tokenCheck;
    if (!chatId || !Array.isArray(userIds) || userIds.length === 0) {
      return thunkAPI.rejectWithValue("Chat ID and user IDs array required.");
    }
    try {
      // Assuming chatService will have addMembersToGroup function making PUT /api/chat/groupadd
      const response = await chatService.addMembersToGroup(chatId, userIds);
      if (!response?.chat)
        throw new Error("Invalid response from addMembers API");
      return response.chat; // Return the updated chat object
    } catch (error) {
      console.error("addMembersToGroup Error in thunk:", error);
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);
// --- >> END NEW THUNK << ---

// --- Slice Definition ---
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
      state.isError = false;
      state.message = "";
    },
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },
    updateChatLatestMessage: (state, action) => {
      const latestMessage = action.payload;
      if (!latestMessage?.chat) {
        console.warn("updateChatLatestMessage: Invalid payload", latestMessage);
        return;
      }
      const chatId =
        typeof latestMessage.chat === "string"
          ? latestMessage.chat
          : latestMessage.chat._id;
      if (!chatId) return;
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].latestMessage = latestMessage;
        state.chats[chatIndex].updatedAt =
          latestMessage.createdAt || new Date().toISOString();
        if (chatIndex > 0) {
          const [chatToMove] = state.chats.splice(chatIndex, 1);
          state.chats.unshift(chatToMove);
        }
        if (state.selectedChat?._id === chatId) {
          state.selectedChat = state.chats[0];
        }
      } else {
        console.warn(
          `Chat ${chatId} not found locally for latest message update.`
        );
      }
    },
    clearSearchedUsers: (state) => {
      state.users = [];
      state.searchError = "";
    },
    removeChatById: (state, action) => {
      const chatIdToRemove = action.payload;
      if (!chatIdToRemove) {
        console.warn("removeChatById: No chatId provided.");
        return;
      }
      const initialLength = state.chats.length;
      state.chats = state.chats.filter((chat) => chat._id !== chatIdToRemove);
      const removed = initialLength > state.chats.length;
      console.log(
        `removeChatById: Attempted ${chatIdToRemove}. ${
          removed ? "Removed" : "Not found"
        }. Count: ${state.chats.length}`
      );
      if (state.selectedChat?._id === chatIdToRemove) {
        state.selectedChat = null;
        console.log(`removeChatById: Deselected ${chatIdToRemove}.`);
      }
    },
    // --- >> NEW: Reducers for Socket Events & Thunk Updates << ---
    updateChat: (state, action) => {
      const updatedChat = action.payload;
      if (!updatedChat?._id) {
        console.warn("updateChat reducer: Invalid payload.", updatedChat);
        return;
      }
      const index = state.chats.findIndex(
        (chat) => chat._id === updatedChat._id
      );
      if (index !== -1) {
        console.log(
          `updateChat reducer: Updating chat ${updatedChat._id} at index ${index}.`
        );
        // Merge updated data, potentially preserving fields not sent in update (like latestMessage if only members changed)
        state.chats[index] = { ...state.chats[index], ...updatedChat };
        if (state.selectedChat?._id === updatedChat._id) {
          state.selectedChat = state.chats[index];
          console.log(`updateChat reducer: Updated selectedChat reference.`);
        }
        // Consider moving updated chat to top? Depends on desired UX
        // if (index > 0) { /* ... move logic ... */ }
      } else {
        console.warn(
          `updateChat reducer: Chat ${updatedChat._id} not found. Adding instead.`
        );
        // If receiving an update for a chat not locally present, add it.
        state.chats.unshift(updatedChat);
        state.lastUpdated = Date.now();
      }
    },
    addChat: (state, action) => {
      const newChat = action.payload;
      if (!newChat?._id) {
        console.warn("addChat reducer: Invalid payload.", newChat);
        return;
      }
      const exists = state.chats.some((chat) => chat._id === newChat._id);
      if (!exists) {
        console.log(`addChat reducer: Adding new chat ${newChat._id}.`);
        state.chats.unshift(newChat);
        state.lastUpdated = Date.now();
      } else {
        console.log(
          `addChat reducer: Chat ${newChat._id} already exists. Ignoring.`
        );
      }
    },
    // --- >> END NEW REDUCERS << ---
  },
  // Handle async thunk lifecycle actions
  extraReducers: (builder) => {
    builder
      // --- Access/Create Chat ---
      .addCase(accessOrCreateChat.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(accessOrCreateChat.fulfilled, (state, action) => {
        state.isLoading = false;
        const chat = action.payload;
        state.selectedChat = chat;
        const index = state.chats.findIndex((c) => c._id === chat._id);
        if (index === -1) {
          state.chats.unshift(chat);
        } else {
          state.chats.splice(index, 1);
          state.chats.unshift(chat);
        }
        state.lastUpdated = Date.now();
      })
      .addCase(accessOrCreateChat.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed access chat";
      })

      // --- Fetch Chats ---
      .addCase(fetchUserChats.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
        state.lastUpdated = Date.now();
        if (
          state.selectedChat &&
          !action.payload.some((c) => c._id === state.selectedChat._id)
        ) {
          state.selectedChat = null;
        }
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed fetch chats";
        state.chats = [];
        state.selectedChat = null;
      })

      // --- Create Group ---
      .addCase(createGroupChat.pending, (state) => {
        state.isCreatingGroup = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.isCreatingGroup = false;
        const group = action.payload;
        if (!state.chats.some((c) => c._id === group._id)) {
          state.chats.unshift(group);
        }
        state.selectedChat = group;
        state.users = [];
        state.searchError = "";
        state.lastUpdated = Date.now();
        state.message = "Group created.";
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.isCreatingGroup = false;
        state.isError = true;
        state.message = action.payload || "Failed create group";
      })

      // --- Search Users ---
      .addCase(searchUsers.pending, (state) => {
        state.isSearchLoading = true;
        state.searchError = "";
        state.users = [];
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isSearchLoading = false;
        state.users = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isSearchLoading = false;
        state.searchError = action.payload || "Failed search users";
        state.users = [];
      })

      // --- Leave Group ---
      .addCase(leaveGroup.pending, (state) => {
        state.isLeavingGroup = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.isLeavingGroup = false;
        const { chatId } = action.payload;
        chatSlice.caseReducers.removeChatById(state, { payload: chatId }); // Use reducer
        state.message = action.payload.message || "Left group.";
        state.lastUpdated = Date.now();
        console.log(`leaveGroup fulfilled reducer done for ${chatId}`);
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.isLeavingGroup = false;
        state.isError = true;
        state.message = action.payload || "Failed leave group";
        console.error("leaveGroup rejected:", action.payload);
      })

      // --- Delete Group ---
      .addCase(deleteGroup.pending, (state) => {
        state.isDeletingGroup = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.isDeletingGroup = false;
        const { chatId } = action.payload;
        chatSlice.caseReducers.removeChatById(state, { payload: chatId }); // Use reducer
        state.message = action.payload.message || "Group deleted.";
        state.lastUpdated = Date.now();
        console.log(`deleteGroup fulfilled reducer done for ${chatId}`);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.isDeletingGroup = false;
        state.isError = true;
        state.message = action.payload || "Failed delete group";
        console.error("deleteGroup rejected:", action.payload);
      })

      // --- >> NEW: Add Members Reducers << ---
      .addCase(addMembersToGroup.pending, (state) => {
        state.isAddingMembers = true;
        state.isError = false;
        state.message = "";
        console.log("addMembersToGroup pending..."); // Log pending state
      })
      .addCase(addMembersToGroup.fulfilled, (state, action) => {
        state.isAddingMembers = false;
        const updatedChat = action.payload;
        // Use the updateChat reducer logic to update the chat in the list
        chatSlice.caseReducers.updateChat(state, { payload: updatedChat });
        state.message = "Members added successfully.";
        state.lastUpdated = Date.now();
        console.log(
          `addMembersToGroup fulfilled reducer completed for chat ${updatedChat._id}`
        );
      })
      .addCase(addMembersToGroup.rejected, (state, action) => {
        state.isAddingMembers = false;
        state.isError = true;
        state.message = action.payload || "Failed to add members";
        console.error("addMembersToGroup rejected in reducer:", action.payload);
      });
    // --- >> END NEW REDUCERS << ---
  },
});

// --- Export Actions ---
export const {
  setSelectedChat,
  resetChatState,
  updateChatLatestMessage,
  clearSearchedUsers,
  removeChatById,
  updateChat, // <<< EXPORTED
  addChat, // <<< EXPORTED
} = chatSlice.actions;

// --- Selectors ---
const selectAllChatsState = (state) => state.chat.chats;
export const selectCurrentChat = (state) => state.chat.selectedChat;
export const selectSelectedChat = (state) => state.chat.selectedChat;
export const selectChatIsLoading = (state) => state.chat.isLoading;
export const selectChatIsCreatingGroup = (state) => state.chat.isCreatingGroup;
export const selectChatIsLeavingGroup = (state) => state.chat.isLeavingGroup;
export const selectChatIsDeletingGroup = (state) => state.chat.isDeletingGroup;
export const selectChatIsAddingMembers = (state) => state.chat.isAddingMembers; // <<< ADDED
export const selectChatError = (state) =>
  state.chat.isError ? state.chat.message : null;
export const selectSearchedUsers = (state) => state.chat.users;
export const selectUserSearchError = (state) => state.chat.searchError;
export const selectUserSearchIsLoading = (state) => state.chat.isSearchLoading;
export const selectAllUserChats = selectAllChatsState;

// --- Memoized Selectors ---
export const selectPersonalChats = createSelector(
  [selectAllChatsState],
  (chats) => chats.filter((chat) => !chat.isGroupChat)
);
export const selectGroupChats = createSelector([selectAllChatsState], (chats) =>
  chats.filter((chat) => chat.isGroupChat)
);

export default chatSlice.reducer;
