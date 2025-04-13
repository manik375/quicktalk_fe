// src/components/MessageList.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectAllMessages,
  selectMessageIsLoading,
  selectMessageError,
} from "../features/message/messageSlice";
import { selectCurrentChat } from "../features/chat/chatSlice";
import { selectCurrentTheme } from "../features/theme/themeSlice";

// Simple spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full py-10">
    <svg
      className="animate-spin h-8 w-8 text-[color:var(--primary-accent)]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);

// Helper function to generate consistent color from user ID.
const getSenderColor = (userId) => {
  if (!userId) return "#6b7280"; // Default gray if no ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
};

// Message bubble component with neumorphic styling.
const MessageBubble = ({ msg, isMe, isGroupChat }) => {
  const themeMode = useSelector(selectCurrentTheme);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`
          relative max-w-[75%] lg:max-w-[70%] px-3 py-2 rounded-xl transition-all duration-200 ease-in-out
          ${
            isMe
              ? `${
                  themeMode === "light" ? "bg-emerald-500" : "bg-blue-600"
                } text-white rounded-br-lg neumorphic-raised`
              : `bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 rounded-bl-lg neumorphic-raised`
          }
        `}
      >
        {/* For group chats, display sender name above (for messages not from current user) */}
        {isGroupChat && !isMe && msg.sender?.name && (
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: getSenderColor(msg.sender._id) }}
          >
            {msg.sender.name}
          </p>
        )}
        <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
        <span
          className={`
            block text-[10px] mt-1 opacity-90
            ${
              isMe
                ? "text-emerald-100 dark:text-blue-200"
                : "text-gray-400 dark:text-zinc-400"
            }
          `}
        >
          {formatTimestamp(msg.createdAt)}
        </span>
      </div>
    </div>
  );
};

const MessageList = () => {
  const endOfMessagesRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Get the current user, chat, messages, and states from Redux.
  const currentUser = useSelector((state) => state.auth.user) || { _id: null };
  const currentChat = useSelector(selectCurrentChat);
  const messages = useSelector(selectAllMessages);
  const isLoading = useSelector(selectMessageIsLoading);
  const error = useSelector(selectMessageError);

  // Check if the current chat is a group chat.
  const isGroupChat = currentChat?.isGroupChat || false;

  // Auto-scroll logic: Scroll to bottom if user hasn't scrolled up manually.
  useEffect(() => {
    const scrollToBottom = (behavior = "smooth") => {
      endOfMessagesRef.current?.scrollIntoView({ behavior });
    };

    if (!userScrolledUp || messages.length <= 1) {
      scrollToBottom("smooth");
    }
  }, [messages, userScrolledUp]);

  // Listen for user scroll to decide whether to auto-scroll.
  useEffect(() => {
    const container = messageContainerRef.current;
    const handleScroll = () => {
      if (!container) return;
      const isScrolledToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        10;
      setUserScrolledUp(!isScrolledToBottom);
    };
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  // If messages are loading, render the spinner.
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If there was an error loading messages, display an error message.
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center text-red-500 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-12 h-12 mb-4 opacity-70"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="font-semibold">Could not load messages.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // If there are no messages, show a friendly empty state.
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center text-gray-400 dark:text-zinc-500 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
          className="w-16 h-16 mb-4 opacity-60"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.04 8.25-7.25 8.25a9.05 9.05 0 01-3.416-.713 17.98 17.98 0 01-1.96-1.253c-.41-.38-.78-.785-1.106-1.214-.327-.43-.632-.88.895-1.352.326-.1.648-.208.958-.331a4.5 4.5 0 011.814-.349 4.5 4.5 0 014.5 4.5c0 .68-.145 1.327-.4 1.909a1.5 1.5 0 01-1.606.991 1.5 1.5 0 01-1.287-1.606c0-.68.145-1.327.4-1.909.255-.582.57-1.11.93-1.581.36-.47.75-.9 1.15-1.27.4-.37.8-.69 1.18-.96.38-.27.72-.48 1.02-.63a1.5 1.5 0 001.02-1.02c.15-.3.27-.64.33-1.02.06-.38.09-.78.09-1.18 0-.4-.03-.8-.09-1.18-.06-.38-.18-.72-.33-1.02a1.5 1.5 0 00-1.02-1.02c-.3-.15-.64-.27-1.02-.33-.38-.06-.78-.09-1.18-.09-.4 0-.8.03-1.18.09-.38.06-.72.18-1.02.33a1.5 1.5 0 00-1.02 1.02c-.15.3-.27.64-.33 1.02-.06.38-.09.78-.09 1.18"
          />
        </svg>
        <p className="font-medium">No messages yet</p>
        <p className="text-sm">Be the first to send a message!</p>
      </div>
    );
  }

  // Render message bubbles inside a neumorphic container.
  return (
    <div
      ref={messageContainerRef}
      className="space-y-2 px-4 py-4 neumorphic-inset rounded-xl transition-all"
    >
      {messages.map((msg) => {
        if (!msg || !msg.sender) return null;
        const isMe = currentUser._id && msg.sender._id === currentUser._id;
        return (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isMe={isMe}
            isGroupChat={isGroupChat}
          />
        );
      })}
      <div ref={endOfMessagesRef} style={{ height: "1px" }} />
    </div>
  );
};

export default MessageList;
