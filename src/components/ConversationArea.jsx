// src/components/ConversationArea.jsx
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import ConversationHeader from "./ConversationHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import UserProfileView from "./UserProfileView"; // Assuming this exists
import { useTyping } from "../contexts/TypingContext";
import PropTypes from "prop-types"; // Import PropTypes

// Typing Indicator Component (Keep as is)
const TypingIndicatorDots = () => (
  <span className="inline-flex items-center ml-1">
    <span className="w-1.5 h-1.5 mx-px rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-1.5 h-1.5 mx-px rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-1.5 h-1.5 mx-px rounded-full bg-current animate-bounce"></span>
  </span>
);

// *** FIX: Accept onGroupInfoClick in props ***
const ConversationArea = ({ chat, onBack, isMobile, onGroupInfoClick }) => {
  const [showProfile, setShowProfile] = useState(false);
  const currentUser = useSelector((state) => state.auth.user);
  const allTypingUsers = useTyping();

  // Handler to toggle the profile view (Keep as is)
  const handleHeaderClick = () => {
    // Only allow toggling profile for non-group chats for now, or handle group info separately
    if (chat && !chat.isGroupChat) {
      setShowProfile(!showProfile);
    } else if (chat && chat.isGroupChat) {
      // If header is clicked for a group, maybe open group info? Or do nothing.
      // Currently, the dedicated info button handles opening group info.
      console.log("Header clicked for group chat - doing nothing or TBD.");
    }
  };

  // Function to determine the target for the profile view (Keep as is)
  const getProfileTarget = (chat, currentUser) => {
    if (!chat || !currentUser) return null;
    // If showing profile view for a group, we might want different data
    // For now, it seems designed for 1-on-1 user profiles.
    if (chat.isGroupChat) {
      // Maybe return null or specific group data if UserProfileView handles groups?
      return null; // Or { ...chat, isGroup: true } if UserProfileView supports groups
    }
    return chat.users.find((user) => user?._id !== currentUser._id);
  };

  const profileTarget = getProfileTarget(chat, currentUser);

  // Memoized calculation for typing indicator message (Keep as is)
  const typingDisplayMessage = useMemo(() => {
    if (!chat?._id || !allTypingUsers[chat._id]) return null;

    const typingInThisChat = allTypingUsers[chat._id];
    const otherTypingUserIds = Object.keys(typingInThisChat).filter(
      (id) => id !== currentUser?._id
    );

    if (otherTypingUserIds.length === 0) return null;

    // Find names based on the current chat's user list
    const typingUserNames = otherTypingUserIds
      .map((id) => chat?.users?.find((u) => u._id === id)?.name)
      .filter((name) => !!name); // Filter out undefined names

    if (typingUserNames.length === 0) return null;

    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing`;
    } else {
      return "Multiple users are typing";
    }
  }, [allTypingUsers, chat, currentUser?._id]);

  // Fallback if chat is not selected (Should ideally be handled by HomePage)
  if (!chat) {
    return null; // Or a placeholder, but HomePage logic should prevent this render ideally
  }

  // Determine if the UserProfileView should be shown
  // Show profile only if toggled AND it's NOT a group chat (based on current design)
  const shouldShowUserProfile = showProfile && !chat.isGroupChat;

  return (
    // Main container styling
    <div className="flex flex-col h-full overflow-hidden bg-[color:var(--bg-base)] neumorphic-raised rounded-xl transition-all duration-300">
      {/* Conversation Header */}
      <ConversationHeader
        chat={chat}
        onHeaderClick={handleHeaderClick} // Handles toggling profile for 1-on-1
        onBack={onBack} // For mobile back button
        isProfileVisible={shouldShowUserProfile} // Pass calculated state
        // *** FIX: Pass the received onGroupInfoClick prop down ***
        onGroupInfoClick={onGroupInfoClick}
        // showBackButton={isMobile} // Prop name used in ConversationHeader? Verify. Assuming it exists.
      />

      {/* Conditional Content: Profile View OR Messages+Input */}
      {shouldShowUserProfile ? (
        // User Profile View for 1-on-1 chats
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 neumorphic-inset rounded-xl">
          {/* Ensure UserProfileView exists and accepts profileData */}
          {profileTarget ? (
            <UserProfileView profileData={profileTarget} />
          ) : (
            <div className="text-center text-gray-500 p-4">
              User profile unavailable.
            </div>
          )}
        </div>
      ) : (
        // Standard Chat View (Messages + Input)
        <>
          {/* Message List */}
          <div
            id="message-list-container"
            className="flex-grow overflow-y-auto custom-scrollbar p-3 neumorphic-inset rounded-xl transition-all"
          >
            {/* Ensure MessageList uses chatId */}
            <MessageList chatId={chat._id} />
          </div>

          {/* Typing Indicator */}
          {typingDisplayMessage && (
            <div className="px-4 pt-1 pb-0 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 h-6 flex items-center">
              {typingDisplayMessage}
              <TypingIndicatorDots />
            </div>
          )}

          {/* Message Input */}
          <div
            className={`
                            p-3 border-t border-transparent flex-shrink-0 bg-[color:var(--bg-base)]
                            neumorphic-inset rounded-t-xl sticky bottom-0 transition-all
                            ${
                              typingDisplayMessage ? "pt-1" : ""
                            } /* Adjust padding if typing indicator is shown */
                        `}
          >
            {/* Ensure MessageInput uses chatId */}
            <MessageInput chatId={chat._id} />
          </div>
        </>
      )}
    </div>
  );
};

// *** FIX: Add PropTypes validation ***
ConversationArea.propTypes = {
  chat: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    isGroupChat: PropTypes.bool,
    users: PropTypes.arrayOf(PropTypes.object), // More specific shape if possible
    // Add other expected chat properties
  }), // Can be null initially, but required when rendering content
  onBack: PropTypes.func.isRequired, // For mobile navigation
  isMobile: PropTypes.bool.isRequired,
  onGroupInfoClick: PropTypes.func.isRequired, // Function to open group info modal
};

export default ConversationArea;
