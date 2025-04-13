// src/components/ChatList.jsx
import React from "react";
import ChatListItem from "./ChatListItem";
import {
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

const ChatList = ({ chats, selectedChatId, onSelectChat, emptyMessage }) => {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center neumorphic-raised rounded-xl">
        {emptyMessage.toLowerCase().includes("group") ? (
          <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-zinc-600 mb-4" />
        ) : (
          <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-gray-400 dark:text-zinc-600 mb-4" />
        )}
        <p className="text-gray-500 dark:text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {chats.map((chat) => (
        <div key={chat._id} className="neumorphic-interactive p-2 rounded-xl">
          <ChatListItem
            chat={chat}
            isSelected={selectedChatId === chat._id}
            onClick={() => onSelectChat(chat)}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatList;
