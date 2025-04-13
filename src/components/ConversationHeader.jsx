// src/components/ConversationHeader.jsx
import React from "react";
import { useSelector } from "react-redux";
import {
  ArrowLeftIcon,
  PhoneIcon,
  VideoCameraIcon,
  XMarkIcon,
  UserCircleIcon,
  UserGroupIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { selectOnlineUserIds } from "../features/presence/presenceSlice";
import { useCall } from "../contexts/CallContext";

const ConversationHeader = ({
  chat,
  onHeaderClick,
  onBack,
  isProfileVisible,
  onGroupInfoClick,
}) => {
  const currentUser = useSelector((state) => state.auth.user);
  const onlineUserIds = useSelector(selectOnlineUserIds);
  const { initiateCall, callAccepted } = useCall();

  const getHeaderInfo = () => {
    if (!chat)
      return {
        name: "Chat",
        pic: null,
        status: "Offline",
        isGroup: false,
      };

    if (chat.isGroupChat) {
      const onlineCount = chat.users.filter(
        (u) => u?._id !== currentUser._id && onlineUserIds.includes(u._id)
      ).length;

      return {
        name: chat.chatName || "Group Chat",
        pic: chat.groupPic,
        status: `${chat.users.length} members • ${onlineCount} online`,
        isGroup: true,
      };
    } else {
      const otherUser = chat.users.find((u) => u?._id !== currentUser._id);
      const isOnline = otherUser && onlineUserIds.includes(otherUser._id);

      return {
        name: otherUser?.name || "User",
        pic: otherUser?.pic,
        status: isOnline ? "Online" : otherUser?.status || "Offline",
        isGroup: false,
      };
    }
  };

  const { name, pic, status, isGroup } = getHeaderInfo();

  const otherUser = !isGroup && chat ? chat.users.find((u) => u?._id !== currentUser._id) : null;
  const otherUserId = otherUser?._id;
  const otherUserName = otherUser?.name;

  const handleStartCall = (type) => {
    if (otherUserId && otherUserName && !callAccepted) {
      initiateCall(otherUserId, type, otherUserName);
    } else if (otherUserId && !otherUserName && !callAccepted) {
      console.warn('Initiating call without callee name available.');
      initiateCall(otherUserId, type, 'User');
    }
  };

  return (
    <div className="flex items-center justify-between p-3 md:p-4 bg-[color:var(--bg-base)] neumorphic-raised rounded-lg transition-all duration-200">
      <div className="flex items-center space-x-2 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-2 rounded-full neumorphic-interactive text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <div
          onClick={onHeaderClick}
          className="flex items-center cursor-pointer rounded-md p-1 neumorphic-inset hover:scale-105 transition-all min-w-0"
        >
          <div className="relative flex-shrink-0">
            {pic ? (
              <img
                src={pic}
                alt={name}
                className="w-9 h-9 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name
                  )}&background=random&color=fff&size=40`;
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                {isGroup ? (
                  <UserGroupIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            )}

            {!isGroup && status === "Online" && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-800"></span>
            )}
          </div>

          <div className="ml-2.5 overflow-hidden">
            <h2 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
              {name}
            </h2>
            <p
              className={`text-xs md:text-sm truncate ${
                status.includes("Online")
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {status}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
        {isProfileVisible ? (
          <button
            onClick={onHeaderClick}
            className="p-2 rounded-full neumorphic-interactive text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : isGroup ? (
          <>
            <button
              onClick={onGroupInfoClick}
              className="p-2 rounded-full neumorphic-interactive text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full neumorphic-interactive text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleStartCall('audio')}
              disabled={!otherUserId || callAccepted}
              className="p-2 rounded-full neumorphic-interactive text-[color:var(--text-secondary)] hover:text-[color:var(--primary-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Start audio call"
            >
              <PhoneIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              disabled={!otherUserId || callAccepted}
              className="p-2 rounded-full neumorphic-interactive text-[color:var(--text-secondary)] hover:text-[color:var(--primary-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Start video call"
            >
              <VideoCameraIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onHeaderClick}
              className="p-2 rounded-full neumorphic-interactive text-[color:var(--text-secondary)] hover:text-[color:var(--primary-accent)]"
              aria-label={isProfileVisible ? "Close profile" : "View profile"}
            >
              {isProfileVisible ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <UserCircleIcon className="h-5 w-5" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;
