import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { selectOnlineUserIds } from "../features/presence/presenceSlice";
import { UserGroupIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const DEFAULT_PIC =
  "https://res.cloudinary.com/dkd5jblv5/image/upload/v1675976806/Default_ProfilePicture_gjngnb.png";

const ChatListItem = ({ chat, isSelected, onClick }) => {
  const currentUser = useSelector((state) => state.auth.user) || { _id: null };
  const onlineUserIds = useSelector(selectOnlineUserIds);

  // Memoized display info calculation
  const { displayName, displayPic, isGroup, otherUserId, isOnline } =
    useMemo(() => {
      if (!chat) {
        return {
          displayName: "...",
          displayPic: null,
          isGroup: false,
          otherUserId: null,
          isOnline: false,
        };
      }

      if (chat.isGroupChat) {
        return {
          displayName: chat.chatName || "Unnamed Group",
          displayPic: chat.groupPic,
          isGroup: true,
          otherUserId: null,
          isOnline: false,
        };
      }

      // Handle 1-on-1 chat
      if (!Array.isArray(chat.users)) {
        console.error("Invalid chat.users format:", chat.users);
        return {
          displayName: "Invalid Chat",
          displayPic: null,
          isGroup: false,
          otherUserId: null,
          isOnline: false,
        };
      }

      const otherUser = chat.users.find((u) => u?._id !== currentUser._id);
      const otherUserId = otherUser?._id;

      return {
        displayName: otherUser?.name || "User",
        displayPic: otherUser?.pic,
        isGroup: false,
        otherUserId,
        isOnline: otherUserId && onlineUserIds.includes(otherUserId),
      };
    }, [chat, currentUser._id, onlineUserIds]);

  // Memoized message preview formatting
  const { formattedMessage, formattedTime } = useMemo(() => {
    const formatLatestMessage = (latestMsg) => {
      if (!latestMsg) return isGroup ? "Group created" : "Chat started";

      const senderName = latestMsg.sender?.name;
      const isMyMessage = latestMsg.sender?._id === currentUser._id;
      const contentPreview =
        latestMsg.content?.substring(0, 35) +
          (latestMsg.content?.length > 35 ? "..." : "") || "[Attachment]";

      if (isGroup && !isMyMessage && senderName) {
        return `${senderName}: ${contentPreview}`;
      } else if (isMyMessage) {
        return `You: ${contentPreview}`;
      }
      return contentPreview;
    };

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return "";

      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";

        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          return date
            .toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .toLowerCase();
        } else if (diffDays === 1) {
          return "yesterday";
        } else if (diffDays < 7) {
          return date
            .toLocaleDateString([], { weekday: "short" })
            .toLowerCase();
        }
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      } catch (e) {
        console.error("Error formatting timestamp:", timestamp, e);
        return "";
      }
    };

    return {
      formattedMessage: formatLatestMessage(chat?.latestMessage),
      formattedTime: formatTimestamp(
        chat?.latestMessage?.createdAt || chat?.updatedAt
      ),
    };
  }, [chat?.latestMessage, chat?.updatedAt, isGroup, currentUser._id]);

  // Calculate unread count (if implemented in your backend)
  const unreadCount = chat?.unreadCount || 0;

  // Dynamic classes
  const containerClasses = `
    flex items-center p-3 rounded-lg cursor-pointer transition-colors
    ${
      isSelected
        ? "bg-indigo-50 dark:bg-zinc-700"
        : "bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-700"
    }
  `;

  const nameClasses = `
    text-sm truncate
    ${
      isSelected
        ? "text-indigo-700 dark:text-indigo-300 font-semibold"
        : "text-gray-900 dark:text-gray-100 font-medium"
    }
  `;

  const messageClasses = `
    text-xs truncate
    ${
      isSelected
        ? "text-indigo-600 dark:text-indigo-400"
        : "text-gray-500 dark:text-gray-400"
    }
  `;

  return (
    <li
      onClick={onClick}
      className={containerClasses}
      aria-current={isSelected ? "page" : undefined}
      data-testid={`chat-list-item-${chat?._id || "unknown"}`}
    >
      {/* Avatar Section */}
      <div className="relative mr-3 flex-shrink-0">
        {displayPic ? (
          <img
            src={displayPic}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PIC;
            }}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isGroup
                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                : "bg-gray-200 dark:bg-zinc-600 text-gray-500 dark:text-zinc-300"
            }`}
          >
            {isGroup ? (
              <UserGroupIcon className="w-6 h-6" />
            ) : (
              <UserCircleIcon className="w-6 h-6" />
            )}
          </div>
        )}

        {/* Online Indicator */}
        {!isGroup && isOnline && (
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-800" />
        )}
      </div>

      {/* Chat Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <p className={nameClasses}>{displayName}</p>
          <span className="text-xs text-gray-400 dark:text-zinc-400 ml-2 shrink-0">
            {formattedTime}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className={messageClasses}>{formattedMessage}</p>
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center text-xs font-bold leading-none text-white bg-indigo-600 rounded-full h-5 min-w-[20px] px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

ChatListItem.propTypes = {
  chat: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
};

export default ChatListItem;
