// src/services/socket.js
import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_URL;
let socket;

export const initializeSocket = (token) => {
  socket = io(URL, {
    autoConnect: false,
    withCredentials: true,
    auth: { token },
  });
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized!");
  }
  return socket;
};

export const connectSocket = () => {
  socket.connect();
};

export default socket;
