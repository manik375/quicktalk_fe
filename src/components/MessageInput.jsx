// src/components/MessageInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  MicrophoneIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  sendMessage,
  selectMessageIsSending,
} from "../features/message/messageSlice";
import { selectCurrentChat } from "../features/chat/chatSlice";
import { useSocket } from "../contexts/SocketContext"; // Ensure correct path

const TYPING_TIMER_LENGTH = 3000; // ms

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false); // For future feature

  const dispatch = useDispatch();
  const isSending = useSelector(selectMessageIsSending);
  const currentChat = useSelector(selectCurrentChat);
  const socket = useSocket();

  // Refs for typing logic
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Effect to clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // --- Handler for sending message ---
  const handleSend = (e) => {
    if (e) e.preventDefault();

    const trimmedMessage = message.trim();

    if (
      !currentChat ||
      !currentChat._id ||
      !trimmedMessage ||
      isRecording ||
      isSending
    ) {
      console.warn("Message send aborted. Conditions:", {
        chatSelected: !!currentChat?._id,
        messageNotEmpty: !!trimmedMessage,
        notRecording: !isRecording,
        notSending: !isSending,
      });
      return;
    }

    // Stop typing indicator logic
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current && socket) {
      socket.emit("stop typing", currentChat._id);
      isTypingRef.current = false;
    }

    console.log(
      `handleSend: Dispatching sendMessage for chat ${currentChat._id}`
    );
    const messageData = { content: trimmedMessage, chatId: currentChat._id };

    dispatch(sendMessage(messageData))
      .unwrap()
      .then(() => {
        console.log("handleSend: sendMessage successful.");
        setMessage("");
      })
      .catch((error) => {
        console.error("handleSend: sendMessage failed:", error);
      });
  };

  // --- Handler for input changes (includes typing logic) ---
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (!socket || !currentChat?._id) return;

    if (!isTypingRef.current) {
      socket.emit("typing", currentChat._id);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && socket) {
        socket.emit("stop typing", currentChat._id);
        isTypingRef.current = false;
      }
    }, TYPING_TIMER_LENGTH);
  };

  // --- Handler for Enter key press ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(null);
    }
  };

  // --- Handler for Mic/Record button (placeholder) ---
  const handleRecordToggle = () => {
    if (message.trim()) return; // Don't record if text is present
    setIsRecording(!isRecording);
    console.log("Toggle recording state:", !isRecording);
    // Add actual recording logic later
  };

  // Determine button states for clarity
  const canSendMessage = !!message.trim();
  const showMicButton = !canSendMessage && !isSending;
  const isSubmitButtonDisabled = !currentChat || isSending;

  return (
    <form
      onSubmit={handleSend}
      className="flex items-center space-x-2 px-2 py-1 bg-[color:var(--bg-base)] neumorphic-raised rounded-full transition-all duration-200"
    >
      {/* Attachment Button */}
      <button
        type="button"
        disabled={!currentChat || isSending || isRecording}
        className="p-2 rounded-full neumorphic-interactive text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="Attach file"
      >
        <PaperClipIcon className="h-5 w-5" />
      </button>

      {/* Input Field & Send/Mic Button */}
      <div className="flex-grow relative min-w-0">
        <input
          type="text"
          placeholder={
            !currentChat
              ? "Select a chat"
              : isRecording
              ? "Recording..."
              : "Type a message..."
          }
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!currentChat || isSending || isRecording}
          className="w-full px-4 py-2 pr-10 rounded-full neumorphic-input border border-transparent bg-[color:var(--bg-base)] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[color:var(--primary-accent)] placeholder-gray-400 dark:placeholder-zinc-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150"
          aria-label="Message input"
        />
        <button
          type={canSendMessage ? "submit" : "button"}
          onClick={showMicButton ? handleRecordToggle : undefined}
          disabled={isSubmitButtonDisabled}
          className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full neumorphic-interactive flex items-center justify-center transition-colors duration-150 ease-in-out flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
            canSendMessage && !isSending
              ? "bg-emerald-500 dark:bg-blue-600 text-white hover:bg-emerald-600 dark:hover:bg-blue-500"
              : isSending
              ? "bg-gray-400 dark:bg-zinc-600 text-white cursor-wait"
              : isRecording
              ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
              : "bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
          }`}
          aria-label={
            isSending
              ? "Sending..."
              : canSendMessage
              ? "Send message"
              : isRecording
              ? "Stop recording"
              : "Record audio"
          }
        >
          {isSending ? (
            <ArrowPathIcon className="animate-spin h-5 w-5 text-white" />
          ) : canSendMessage ? (
            <PaperAirplaneIcon className="h-5 w-5" />
          ) : (
            <MicrophoneIcon
              className={`h-5 w-5 ${
                isRecording ? "text-red-500 dark:text-red-400" : ""
              }`}
            />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
