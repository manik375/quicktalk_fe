// src/components/CreateGroupModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createGroupChat,
  searchUsers,
  selectSearchedUsers,
  selectUserSearchIsLoading,
  selectUserSearchError,
  selectChatIsCreatingGroup,
  clearSearchedUsers,
} from "../features/chat/chatSlice";
import {
  XMarkIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline"; // Using outline for consistency

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const dispatch = useDispatch();

  // --- Local State ---
  const [groupName, setGroupName] = useState("");
  const [groupAbout, setGroupAbout] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  // --- Redux State ---
  const userSearchResults = useSelector(selectSearchedUsers);
  const isSearchLoading = useSelector(selectUserSearchIsLoading);
  const searchError = useSelector(selectUserSearchError);
  const isCreatingGroup = useSelector(selectChatIsCreatingGroup);

  // Memoized filtered search results
  const filteredSearchResults = useMemo(() => {
    return (
      userSearchResults?.filter(
        (user) => !selectedUsers.some((selected) => selected._id === user._id)
      ) || []
    );
  }, [userSearchResults, selectedUsers]);

  // Effect for debounced search
  useEffect(() => {
    setSubmissionError("");
    if (!searchQuery.trim()) {
      dispatch(clearSearchedUsers());
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        dispatch(searchUsers(searchQuery));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedUsers([]);
      setGroupName("");
      setGroupAbout("");
      setSubmissionError("");
      dispatch(clearSearchedUsers());
    }
  }, [isOpen, dispatch]);

  const handleAddUser = (userToAdd) => {
    if (!selectedUsers.some((u) => u._id === userToAdd._id)) {
      setSelectedUsers([...selectedUsers, userToAdd]);
      // Optionally clear search or keep it
      // setSearchQuery('');
      // dispatch(clearSearchedUsers());
    }
  };

  const handleRemoveUser = (userIdToRemove) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userIdToRemove));
  };

  const handleCreateGroup = async () => {
    setSubmissionError("");

    if (!groupName.trim()) {
      setSubmissionError("Group name is required.");
      return;
    }

    if (selectedUsers.length < 2) {
      setSubmissionError("At least 2 members are required.");
      return;
    }

    try {
      const resultAction = await dispatch(
        createGroupChat({
          chatName: groupName.trim(),
          users: selectedUsers.map((u) => u._id),
          about: groupAbout.trim(),
        })
      ).unwrap();

      onGroupCreated(resultAction);
      onClose(); // Close modal on success
    } catch (error) {
      console.error("Group creation failed:", error);
      setSubmissionError(
        error.message || "An unexpected error occurred during group creation."
      );
    }
  };

  if (!isOpen) return null;

  const isCreateButtonDisabled =
    !groupName.trim() || selectedUsers.length < 2 || isCreatingGroup;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out"
      aria-labelledby="create-group-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // Close modal on backdrop click
    >
      <div
        className="neumorphic-alternate-raise w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing when clicking inside modal
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <h3
            id="create-group-title"
            className="text-lg font-semibold flex items-center space-x-2 text-[color:var(--text-primary)]"
          >
            <UserGroupIcon className="w-6 h-6 text-[color:var(--primary-accent)]" />
            <span>New Group</span>
          </h3>
          <button
            onClick={onClose}
            className="neumorphic-interactive rounded-full p-2 text-[color:var(--text-secondary)]"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-grow custom-scrollbar">
          {/* Group Name */}
          <div className="space-y-2">
            <label
              htmlFor="groupName"
              className="block text-sm font-medium text-[color:var(--text-secondary)]"
            >
              Group Name *
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="neumorphic-input"
              placeholder="Enter group name"
              required
              aria-required="true"
            />
          </div>

          {/* Group About */}
          <div className="space-y-2">
            <label
              htmlFor="groupAbout"
              className="block text-sm font-medium text-[color:var(--text-secondary)]"
            >
              About (Optional)
            </label>
            <textarea
              id="groupAbout"
              rows={3}
              value={groupAbout}
              onChange={(e) => setGroupAbout(e.target.value)}
              className="neumorphic-input resize-none"
              placeholder="Group description..."
            />
          </div>

          {/* Member Search */}
          <div className="space-y-2">
            <label
              htmlFor="searchUsers"
              className="block text-sm font-medium text-[color:var(--text-secondary)]"
            >
              Add Members *{" "}
              <span className="text-xs font-normal">(min. 2)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-[color:var(--text-secondary)]" />
              </div>
              <input
                id="searchUsers"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neumorphic-input pl-10" // Keep padding for icon
                placeholder="Search users to add..."
                aria-label="Search users to add to group"
              />
              {isSearchLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-[color:var(--text-secondary)] animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchQuery.trim().length > 1 && (
              <div className="neumorphic-pressed mt-2 overflow-hidden rounded-lg">
                {" "}
                {/* Changed to pressed */}
                {isSearchLoading ? (
                  <div className="p-4 text-center text-sm text-[color:var(--text-secondary)]">
                    Searching...
                  </div>
                ) : searchError ? (
                  <div className="p-3 text-center text-sm text-red-600 dark:text-red-400 flex items-center justify-center space-x-2">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    <span>{searchError}</span>
                  </div>
                ) : filteredSearchResults.length > 0 ? (
                  <ul className="max-h-40 overflow-y-auto custom-scrollbar p-1 space-y-1">
                    {" "}
                    {/* Added padding and spacing */}
                    {filteredSearchResults.map((user) => (
                      <li
                        key={user._id}
                        className="neumorphic-interactive rounded-md px-3 py-2 flex items-center justify-between" // Interactive item
                        onClick={() => handleAddUser(user)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddUser(user)
                        }
                        aria-label={`Add ${user.name} to group`}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {" "}
                          {/* Increased space */}
                          {user.pic ? (
                            <img
                              src={user.pic}
                              alt={user.name}
                              className="w-8 h-8 rounded-full flex-shrink-0 object-cover neumorphic-raised" // Added subtle raise to image
                            />
                          ) : (
                            <div className="neumorphic-pressed rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                              {" "}
                              {/* Inset for placeholder */}
                              <UserCircleIcon className="h-5 w-5 text-[color:var(--text-secondary)]" />
                            </div>
                          )}
                          <span className="text-sm truncate text-[color:var(--text-primary)]">
                            {user.name}
                          </span>
                        </div>
                        <PlusIcon className="h-5 w-5 text-[color:var(--text-secondary)] flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-[color:var(--text-secondary)]">
                    No users found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Members */}
          {selectedUsers.length > 0 && (
            <div className="pt-2 space-y-2">
              <h4 className="text-sm font-medium text-[color:var(--text-secondary)]">
                Selected ({selectedUsers.length})
              </h4>
              <div className="neumorphic-pressed p-3 rounded-lg flex flex-wrap gap-2">
                {" "}
                {/* Pressed container */}
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="neumorphic-raised flex items-center px-2.5 py-1 rounded-full text-sm" // Raised badges
                  >
                    <span className="mr-1.5 text-[color:var(--text-primary)] truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(user._id)}
                      className="neumorphic-interactive rounded-full p-0.5 ml-0.5 text-[color:var(--primary-accent)] hover:text-[color:var(--primary-accent)]" // Interactive remove button
                      aria-label={`Remove ${user.name}`}
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
          <div
            className={`text-sm text-red-600 dark:text-red-400 text-center sm:text-left sm:flex-grow ${
              submissionError ? "opacity-100" : "opacity-0"
            } transition-opacity`}
          >
            {submissionError || "\u00A0"} {/* Keep space even when empty */}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="neumorphic-interactive px-4 py-2 text-sm font-medium rounded-lg text-[color:var(--text-secondary)] w-full sm:w-auto" // Full width on small screens
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            type="button"
            disabled={isCreateButtonDisabled}
            className={`neumorphic-interactive px-5 py-2 text-sm font-medium rounded-lg focus:outline-none flex items-center justify-center space-x-2 w-full sm:w-auto transition-colors duration-200 ease-in-out
              ${
                isCreateButtonDisabled
                  ? "text-[color:var(--text-secondary)] cursor-not-allowed opacity-70" // Disabled state - subtle neumorphic
                  : "bg-[color:var(--primary-accent)] text-white hover:brightness-105 dark:hover:brightness-110" // Enabled state
              }`}
            aria-disabled={isCreateButtonDisabled}
          >
            {isCreatingGroup ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
