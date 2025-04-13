// client/src/contexts/TypingContext.js
import React, { createContext, useContext } from "react";

// The context will hold an object like: { chatId: { userId1: true, userId2: true }, ... }
const TypingContext = createContext({}); // Default to empty object

// Custom hook
export const useTyping = () => {
  return useContext(TypingContext);
};

// Provider component
export const TypingProvider = TypingContext.Provider;

export default TypingContext;
