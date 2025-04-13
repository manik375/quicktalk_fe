// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import themeReducer from "../features/theme/themeSlice";
import chatReducer from "../features/chat/chatSlice";
import messageReducer from "../features/message/messageSlice";
import presenceReducer from "../features/presence/presenceSlice";
import viewReducer from "../features/view/viewSlice"; // <-- 1. Import view reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    chat: chatReducer,
    message: messageReducer,
    presence: presenceReducer,
    view: viewReducer, // <-- 2. Add view reducer to the store
  },
  // Middleware is added by default (includes thunk)
  // DevTools are enabled by default in development
});
