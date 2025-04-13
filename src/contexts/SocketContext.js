// client/src/contexts/SocketContext.js
import React, { createContext, useContext } from "react";

// Create the context with null as the default value
const SocketContext = createContext(null);

// Custom hook to use the socket context easily
export const useSocket = () => {
  return useContext(SocketContext);
};

// Export the provider component directly (optional, can also be used inline)
export const SocketProvider = SocketContext.Provider;

// Export the context itself if needed elsewhere (less common)
export default SocketContext;
