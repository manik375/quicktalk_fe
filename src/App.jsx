// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";

// Context Providers
import { SocketProvider } from "./contexts/SocketContext";
import { TypingProvider } from "./contexts/TypingContext";
import { CallProvider } from "./contexts/CallContext";

// Redux store / Pages / Actions / Selectors
import { store } from "./App/store";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { addMessageRealtime } from "./features/message/messageSlice";
import {
  updateChatLatestMessage,
  selectCurrentChat,
  removeChatById,
  updateChat, // <<< IMPORTED
  addChat, // <<< IMPORTED
} from "./features/chat/chatSlice";
import { setOnlineUsers } from "./features/presence/presenceSlice";
// Optional: Import toast library if you want notifications
// import { toast } from 'react-toastify';

// Components
import CallModal from "./components/CallModal";

const SOCKET_ENDPOINT =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentChat = useSelector(selectCurrentChat);
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Effect 1: Manage Socket Connection & Setup Listeners
  useEffect(() => {
    let newSocket = null;

    if (user?._id && !socketRef.current) {
      console.log("App Effect [Connect]: User logged in, connecting socket...");
      newSocket = io(SOCKET_ENDPOINT, {
        /* Optional configs */
      });
      socketRef.current = newSocket;
      setSocketInstance(newSocket);
      newSocket.emit("setup", user);

      // --- Standard Event Listeners ---
      newSocket.on("connected", () => {
        console.log("Socket connected successfully");
      });
      newSocket.on("get online users", (onlineUserIds) => {
        dispatch(setOnlineUsers(onlineUserIds));
      });
      newSocket.on("message received", (newMessage) => {
        const currentSelectedChatId = store.getState().chat.selectedChat?._id;
        const messageChatId =
          typeof newMessage.chat === "string"
            ? newMessage.chat
            : newMessage.chat?._id;
        if (messageChatId && messageChatId === currentSelectedChatId) {
          setTypingUsers((prev) => {
            /* ... clear typing logic ... */
            const updatedChat = { ...(prev[messageChatId] || {}) };
            if (updatedChat[newMessage.sender._id]) {
              delete updatedChat[newMessage.sender._id];
              const newState = { ...prev };
              if (Object.keys(updatedChat).length === 0) {
                delete newState[messageChatId];
              } else {
                newState[messageChatId] = updatedChat;
              }
              return newState;
            }
            return prev;
          });
          dispatch(addMessageRealtime(newMessage));
        } else {
          console.log(
            "Message received for non-active chat:",
            newMessage.chat?.chatName || messageChatId
          );
        }
      });
      newSocket.on("latest message update", (latestMessageData) => {
        console.log("Received latest message update:", latestMessageData);
        // Ensure payload is the message object itself for updateChatLatestMessage reducer
        if (
          latestMessageData &&
          typeof latestMessageData === "object" &&
          latestMessageData._id
        ) {
          dispatch(updateChatLatestMessage(latestMessageData));
        } else {
          console.warn("Invalid payload received for 'latest message update'");
        }
      });
      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
      });
      newSocket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });

      // --- Typing Indicator Listeners ---
      newSocket.on("typing", ({ userId, chatId }) => {
        if (userId === user?._id) return;
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: { ...(prev[chatId] || {}), [userId]: true },
        }));
      });
      newSocket.on("stop typing", ({ userId, chatId }) => {
        if (userId === user?._id) return;
        setTypingUsers((prev) => {
          /* ... stop typing logic ... */
          const updatedChatTyping = { ...(prev[chatId] || {}) };
          if (updatedChatTyping[userId]) {
            delete updatedChatTyping[userId];
            const newState = { ...prev };
            if (Object.keys(updatedChatTyping).length === 0) {
              delete newState[chatId];
            } else {
              newState[chatId] = updatedChatTyping;
            }
            return newState;
          }
          return prev;
        });
      });

      // --- Existing GROUP EVENT LISTENERS ---
      newSocket.on("user left group", (data) => {
        console.log(
          `[App Listener] Event 'user left group' received. Data:`,
          data
        );
        // The data here is the updated chat object - we need to update it in the Redux store
        if (data?._id) {
          console.log(
            "[App Listener 'user left group'] Dispatching updateChat action with updated chat data."
          );
          dispatch(updateChat(data)); // This will update the chat in the Redux store
        } else {
          console.warn("[App Listener 'user left group'] Invalid data received:", data);
        }
      });
      newSocket.on("removed from group", (data) => {
        console.log(
          `[App Listener] Event 'removed from group' received. Data:`,
          data
        );
        if (data?.chatId) {
          dispatch(removeChatById(data.chatId));
          // toast.info(`You left or were removed from "${data.chatName}".`);
        } else {
          console.warn("[App Listener 'removed from group'] Invalid data.");
        }
      });
      newSocket.on("group deleted", (data) => {
        console.log(
          `[App Listener] Event 'group deleted' received. Data:`,
          data
        );
        if (data?.chatId) {
          dispatch(removeChatById(data.chatId));
          // toast.warn(`Group "${data.chatName}" was deleted.`);
        } else {
          console.warn("[App Listener 'group deleted'] Invalid data.");
        }
      });

      // --- >>> LISTENERS FOR GROUP UPDATES & ADDITIONS <<< ---

      // 4. Group details updated (name, about, pic, members added/removed by admin, admin transfer)
      // Backend emits 'group updated' with the full, populated chat object
      newSocket.on("group updated", (updatedChatData) => {
        console.log(
          `[App Listener] Event 'group updated' received for chat ${updatedChatData?._id}.`
        );
        if (updatedChatData?._id) {
          console.log(
            "[App Listener 'group updated'] Dispatching updateChat action."
          );
          dispatch(updateChat(updatedChatData)); // Dispatch action to update the chat in store
          // toast.info(`Group "${updatedChatData.chatName}" was updated.`);
        } else {
          console.warn(
            "[App Listener 'group updated'] Invalid data received.",
            updatedChatData
          );
        }
      });

      // 5. Current user was added to a new group
      // Backend emits 'added to group' with the full, populated chat object
      newSocket.on("added to group", (newGroupData) => {
        console.log(
          `[App Listener] Event 'added to group' received for chat ${newGroupData?._id}.`
        );
        if (newGroupData?._id) {
          console.log(
            "[App Listener 'added to group'] Dispatching addChat action."
          );
          dispatch(addChat(newGroupData)); // Dispatch action to add the new chat to store
          // toast.success(`You were added to the group "${newGroupData.chatName}"!`);
          // Optionally auto-select the new group? Consider UX implications.
          // dispatch(setSelectedChat(newGroupData));
        } else {
          console.warn(
            "[App Listener 'added to group'] Invalid data received.",
            newGroupData
          );
        }
      });
      // --- >>> END NEW LISTENERS <<< ---
    } else if (!user?._id && socketRef.current) {
      // ... (logout disconnect logic) ...
      console.log(
        "App Effect [Disconnect]: User logged out, disconnecting socket."
      );
      if (socketRef.current) socketRef.current.disconnect(); // Check again before disconnect
      socketRef.current = null;
      setSocketInstance(null);
      dispatch(setOnlineUsers([]));
      setTypingUsers({});
    }

    // Cleanup function
    return () => {
      if (newSocket) {
        console.log(
          "App Effect Cleanup: Disconnecting socket and removing listeners."
        );
        // Standard listeners
        newSocket.off("connected");
        newSocket.off("get online users");
        newSocket.off("message received");
        newSocket.off("latest message update");
        newSocket.off("connect_error");
        newSocket.off("disconnect");
        newSocket.off("typing");
        newSocket.off("stop typing");
        // Group listeners
        newSocket.off("user left group");
        newSocket.off("removed from group");
        newSocket.off("group deleted");
        newSocket.off("group updated"); // <<< ADDED CLEANUP
        newSocket.off("added to group"); // <<< ADDED CLEANUP

        newSocket.disconnect();
        if (socketRef.current === newSocket) {
          socketRef.current = null;
          setSocketInstance(null);
          setTypingUsers({});
        }
      }
    };
  }, [user, dispatch]); // Effect dependencies

  // Effect 2: Emit 'join chat' (Keep as is)
  useEffect(() => {
    if (socketInstance && currentChat?._id) {
      console.log(`App Effect [Join Chat]: Joining room ${currentChat._id}`);
      socketInstance.emit("join chat", currentChat._id);
    }
    // Potential cleanup: emit 'leave chat' for previous chat ID?
  }, [currentChat, socketInstance]);

  // Render
  return (
    <SocketProvider value={socketInstance}>
      <TypingProvider value={typingUsers}>
        <CallProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*" element={<LoginPage />} />
            </Routes>
          </Router>
          <CallModal />
        </CallProvider>
      </TypingProvider>
    </SocketProvider>
  );
}

export default App;
