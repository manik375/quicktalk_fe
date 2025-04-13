// src/components/Sidebar.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPersonalChats,
  selectGroupChats,
  selectSelectedChat,
  setSelectedChat,
  accessOrCreateChat,
} from "../features/chat/chatSlice"; // Adjust path as needed
import SearchUsers from "./SearchUsers"; // Assuming this is also styled neumorphically
import ChatList from "./ChatList"; // Assuming this is also styled neumorphically
import { PlusIcon } from "@heroicons/react/24/outline";

const Sidebar = ({ onSelectChat, activeTab, onCreateGroup }) => {
  const dispatch = useDispatch();

  // Retrieve chats and selected chat from Redux
  const personalChats = useSelector(selectPersonalChats);
  const groupChats = useSelector(selectGroupChats);
  const selectedChat = useSelector(selectSelectedChat);
  const chatsToDisplay = activeTab === "Groups" ? groupChats : personalChats;

  // Handler for selecting an existing chat
  const handleExistingChatSelection = (chat) => {
    if (!chat) return;
    // Avoid redundant dispatch if already selected
    if (selectedChat?._id !== chat._id) {
      dispatch(setSelectedChat(chat));
    }
    if (onSelectChat) onSelectChat(chat);
  };

  // Handler for creating/accessing chat from search results
  const handleUserSelectionFromSearch = async (user) => {
    if (!user || !user._id) return;
    try {
      // Dispatch the action and wait for it to complete
      const actionResult = await dispatch(
        accessOrCreateChat(user._id)
      ).unwrap();
      // 'unwrap' will throw an error if the action is rejected
      // If successful, select the chat
      if (onSelectChat) {
        onSelectChat(actionResult); // actionResult is the fulfilled payload (the chat object)
      }
    } catch (error) {
      // unwrap throws the error payload or a generic error
      console.error("Failed to access or create chat:", error);
      // TODO: Optionally show a user-facing error message here
    }
  };

  return (
    // Main Sidebar Container: Raised effect, consistent padding and rounding
    <div className="neumorphic-borderless flex flex-col h-full p-3 md:p-4  transition-all duration-300 ease-in-out">
      {/* Sidebar Header: Inset effect */}
      <header className="neumorphic-inset p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-4 transition-colors duration-200 ease-in-out flex-shrink-0">
        {/* Header Top Row: Title and Create Button */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base md:text-lg font-semibold text-[color:var(--text-primary)] capitalize pl-1">
            {/* Always display the active tab name */}
            {activeTab.toLowerCase()}
          </h2>
          {/* Show Create Group Button only on Groups tab */}
          {activeTab === "Groups" && (
            <button
              onClick={onCreateGroup}
              className="neumorphic-interactive rounded-full p-1.5 md:p-2 text-[color:var(--primary-accent)] transition-all duration-200 ease-in-out"
              title="Create new group"
              aria-label="Create new group"
            >
              <PlusIcon className="h-5 w-5 md:h-5 md:w-5" />{" "}
              {/* Consistent icon size */}
            </button>
          )}
        </div>

        {/* Search Bar: Show only on Chats tab */}
        {activeTab === "Chats" && (
          <div className="mt-1">
            {/* Assuming SearchUsers component uses neumorphic-input internally */}
            <SearchUsers onUserSelected={handleUserSelectionFromSearch} />
          </div>
        )}
      </header>

      {/* Chat List Section: Inset effect, takes remaining space */}
      <main className="neumorphic-inset flex-1 overflow-y-auto rounded-lg md:rounded-xl p-1.5 md:p-2 custom-scrollbar transition-colors duration-200 ease-in-out">
        <ChatList
          chats={chatsToDisplay}
          selectedChatId={selectedChat?._id}
          onSelectChat={handleExistingChatSelection}
          emptyMessage={
            activeTab === "Groups"
              ? "No groups yet. Click '+' to create one!"
              : "No chats yet. Search for users above."
          }
        />
      </main>
    </div>
  );
};

export default Sidebar;
