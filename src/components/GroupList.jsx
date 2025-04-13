// src/components/GroupList.jsx
import React from "react";
import ChatListItem from "./ChatListItem";

const GroupList = ({ chats, onSelectGroup, selectedGroupId }) => {
  const groups = chats.filter((chat) => chat.isGroupChat);

  if (!groups || groups.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        No groups available. <br /> Create a new group to get started!
      </div>
    );
  }

  return (
    <div className="py-1">
      {groups.map((group) => (
        <ChatListItem
          key={group._id}
          chat={group}
          isSelected={selectedGroupId === group._id}
          onClick={() => onSelectGroup(group)}
        />
      ))}
    </div>
  );
};

export default GroupList;
