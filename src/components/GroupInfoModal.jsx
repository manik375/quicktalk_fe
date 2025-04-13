// src/components/GroupInfoModal.jsx
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  XMarkIcon,
  UserGroupIcon,
  UserPlusIcon,
  InformationCircleIcon,
  ArrowLeftOnRectangleIcon, // Icon for Leave
  TrashIcon, // Icon for Delete
  ArrowPathIcon, // Icon for loading
  ExclamationTriangleIcon, // Icon for warning/error
} from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import {
  leaveGroup,
  deleteGroup,
  selectChatIsLeavingGroup,
  selectChatIsDeletingGroup,
} from "../features/chat/chatSlice"; // Restore imports

const GroupInfoModal = ({ group, isOpen, onClose, onAddMembers }) => {
  const dispatch = useDispatch();

  // Get current user ID from Redux
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id;

  // Restore Loading states from Redux
  const isLeaving = useSelector(selectChatIsLeavingGroup);
  const isDeleting = useSelector(selectChatIsDeletingGroup);

  // Restore Local state for errors
  const [actionError, setActionError] = useState("");

  if (!isOpen || !group || !group.isGroupChat) return null;

  // Safely access group data
  const users = Array.isArray(group.users) ? group.users : [];
  const groupAdminId = group.groupAdmin?._id;
  const isAdmin = groupAdminId === currentUserId;
  const chatId = group._id;

  // --- Restore Action Handlers ---
  const handleLeaveGroup = async () => {
    setActionError("");
    if (!chatId) return;
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await dispatch(leaveGroup(chatId)).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to leave group:", error);
      setActionError(error.message || "Could not leave the group.");
    }
  };

  const handleDeleteGroup = async () => {
    setActionError("");
    if (!chatId || !isAdmin) return;
    if (
      !window.confirm(
        "🚨 ARE YOU ABSOLUTELY SURE? 🚨\n\nDeleting this group will remove it for ALL members and cannot be undone."
      )
    )
      return;
    try {
      await dispatch(deleteGroup(chatId)).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to delete group:", error);
      setActionError(error.message || "Could not delete the group.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out"
      aria-labelledby="group-info-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Main Modal Container with Neumorphic Base */}
      <div className="neumorphic-base w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        {" "}
        {/* Apply neumorphic base */}
        {/* Header */}
        <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-[color:var(--border-color)]">
          {" "}
          {/* Use theme border color */}
          <h3
            id="group-info-title"
            className="text-lg font-semibold flex items-center space-x-2 text-[color:var(--text-primary)]" /* Use theme text color */
          >
            <UserGroupIcon className="w-6 h-6 text-[color:var(--primary-accent)]" />
            <span>Group Info</span>
          </h3>
          <button
            onClick={onClose}
            disabled={isLeaving || isDeleting}
            className="neumorphic-interactive rounded-full p-2 text-[color:var(--text-secondary)]" /* Interactive close button */
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Body (Scrollable) */}
        <div className="p-5 space-y-5 overflow-y-auto flex-grow custom-scrollbar">
          {/* Group Header */}
          <div className="flex items-center space-x-4">
            {/* Neumorphic Avatar Container */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 neumorphic-alt-static p-1">
              {" "}
              {/* Added padding for inset effect */}
              {group.groupPic ? (
                <img
                  src={group.groupPic}
                  alt="Group"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      group.chatName || "G"
                    )}&background=random&color=fff&size=64`;
                  }}
                />
              ) : (
                // Placeholder Icon within neumorphic container
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[color:var(--primary-accent-light)] to-[color:var(--primary-accent)] flex items-center justify-center opacity-70">
                  <UserGroupIcon className="w-8 h-8 text-white/80" />
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-0.5 text-[color:var(--text-secondary)]">
                {" "}
                {/* Theme text color */}
                Group Name
              </h4>
              <p className="text-lg font-semibold text-[color:var(--text-primary)] break-words">
                {" "}
                {/* Theme text color */}
                {group.chatName || "Unnamed Group"}
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="pt-2">
            <h4 className="text-sm font-medium mb-1 text-[color:var(--text-secondary)] flex items-center space-x-1.5">
              {" "}
              {/* Theme text color */}
              <InformationCircleIcon className="w-4 h-4" />
              <span>About</span>
            </h4>
            {/* Neumorphic Pressed Text Area */}
            <p className="neumorphic-pressed text-sm text-[color:var(--text-primary)] whitespace-pre-wrap break-words p-3 min-h-[4rem] rounded-lg">
              {" "}
              {/* Theme text color */}
              {group.about?.trim() ? (
                group.about
              ) : (
                <span className="italic text-[color:var(--text-secondary)] opacity-75">
                  {" "}
                  {/* Theme text color */}
                  No description provided.
                </span>
              )}
            </p>
          </div>

          {/* Members Section */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-[color:var(--text-secondary)]">
                {" "}
                {/* Theme text color */}
                Members ({users.length})
              </h4>
              {isAdmin && onAddMembers && (
                <button
                  onClick={onAddMembers}
                  disabled={isLeaving || isDeleting}
                  // Link-like appearance, maybe not neumorphic interactive button? Or style as one?
                  // Option 1: Link style
                  // className="flex items-center text-sm text-[color:var(--primary-accent)] hover:opacity-80 focus:outline-none focus:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                  // Option 2: Small Neumorphic Button
                  className="neumorphic-interactive text-xs px-2 py-1 rounded-md flex items-center space-x-1 text-[color:var(--primary-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Add members"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Members List with Neumorphic Container */}
            <div className="neumorphic-pressed space-y-1 max-h-60 overflow-y-auto custom-scrollbar p-2 rounded-lg">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user._id}
                    // Subtle interactive item on hover
                    className="flex items-center p-2 hover:neumorphic-raised-sm rounded-md space-x-3 transition-all duration-150"
                  >
                    {/* Neumorphic Static Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 neumorphic-alt-static p-0.5">
                      {user.pic ? (
                        <img
                          src={user.pic}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name || "?"
                            )}&background=random&color=fff&size=36`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white/80">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Name */}
                    <span className="text-sm text-[color:var(--text-primary)] truncate flex-grow">
                      {" "}
                      {/* Theme text color */}
                      {user.name || "Unknown User"}{" "}
                      {user._id === currentUserId ? (
                        <span className="text-xs text-[color:var(--text-secondary)]">
                          (You)
                        </span>
                      ) : (
                        ""
                      )}
                    </span>

                    {/* Admin Badge (Keep existing style or adapt) */}
                    {groupAdminId === user._id && (
                      <span className="ml-auto text-xs bg-[color:var(--primary-accent-light)] dark:bg-opacity-20 text-[color:var(--primary-accent)] dark:text-[color:var(--primary-accent-lighter)] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-[color:var(--text-secondary)] italic text-center">
                  {" "}
                  {/* Theme text color */}
                  No members listed.
                </div>
              )}
            </div>
          </div>

          {/* Restore Action Error Display */}
          {actionError && (
            <div className="neumorphic-pressed p-3 mt-4 text-sm text-red-600 dark:text-red-400 flex items-center space-x-2 rounded-lg border border-red-300/50 dark:border-red-700/50">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>{" "}
        {/* End of scrollable body */}
        {/* Footer with Neumorphic Buttons */}
        <div className="p-4 border-t border-[color:var(--border-color)] flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 flex-shrink-0">
          {/* Leave Group Button (Neumorphic) */}
          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              type="button"
              // Neumorphic interactive style for danger/warning
              className="neumorphic-interactive-negative w-full sm:w-auto flex justify-center items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLeaving ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowLeftOnRectangleIcon className="w-4 h-4" />
              )}
              {/* Text color might need adjustment based on neumorphic-interactive-negative definition */}
              <span className="text-red-600 dark:text-red-400">
                {isLeaving ? "Leaving..." : "Leave Group"}
              </span>
            </button>
          )}

          {/* Delete Group Button (Neumorphic - Strong Negative) */}
          {isAdmin && (
            <button
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              type="button"
              // More prominent negative style if available, or same as leave
              className="neumorphic-interactive-negative w-full sm:w-auto flex justify-center items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
              {/* Text color */}
              <span className="text-red-600 dark:text-red-400">
                {isDeleting ? "Deleting..." : "Delete Group"}
              </span>
            </button>
          )}

          {/* Close Button (Neumorphic) - Aligned Right */}
          <button
            onClick={onClose}
            disabled={isLeaving || isDeleting}
            type="button"
            className="neumorphic-interactive w-full sm:w-auto px-5 py-2 text-sm font-medium rounded-lg text-[color:var(--text-secondary)] disabled:opacity-50 sm:ml-auto" // ml-auto pushes right on larger screens
          >
            Close
          </button>
        </div>
      </div>{" "}
      {/* End Main Modal Container */}
    </div>
  );
};

// Restore PropTypes
GroupInfoModal.propTypes = {
  group: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    chatName: PropTypes.string,
    isGroupChat: PropTypes.bool.isRequired,
    about: PropTypes.string,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string, // Allow name to be missing temporarily
        pic: PropTypes.string,
      })
    ),
    groupAdmin: PropTypes.oneOfType([
      PropTypes.shape({ _id: PropTypes.string.isRequired }),
      PropTypes.string,
    ]),
    groupPic: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddMembers: PropTypes.func,
};

export default GroupInfoModal;
