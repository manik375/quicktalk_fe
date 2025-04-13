import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeChat: null,
  chats: [],
  messages: [],
  contacts: [],
  searchResults: [],
  isTyping: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    addChat: (state, action) => {
      state.chats.unshift(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setContacts: (state, action) => {
      state.contacts = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
  },
});

export const {
  setActiveChat,
  setChats,
  addChat,
  setMessages,
  addMessage,
  setContacts,
  setSearchResults,
  setTyping,
} = chatSlice.actions;

export default chatSlice.reducer;
