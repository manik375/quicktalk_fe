// src/contexts/ChatContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { initializeSocket, getSocket } from "../services/socket";
import { useDispatch, useSelector } from "../store/hooks";
import { addMessage } from "../store/chatSlice";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Initialize socket when user is available
  useEffect(() => {
    if (user?.token) {
      initializeSocket(user.token);
      connectSocket();
    }
  }, [user?.token]);

  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("receive_message", (message) => {
      dispatch(addMessage(message));
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop_typing", () => setIsTyping(false));
    socket.on("online_users", (users) => setOnlineUsers(users));

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("online_users");
    };
  }, [socket, dispatch]);

  const sendMessage = (messageData) => {
    socket.emit("send_message", messageData);
  };

  const emitTyping = (chatId) => {
    socket.emit("typing", chatId);
  };

  const emitStopTyping = (chatId) => {
    socket.emit("stop_typing", chatId);
  };

  return (
    <ChatContext.Provider
      value={{
        sendMessage,
        isTyping,
        onlineUsers,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
