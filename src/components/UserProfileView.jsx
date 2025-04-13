// src/components/UserProfileView.jsx
import React from "react";
import {
  UserGroupIcon,
  InformationCircleIcon,
  UserCircleIcon, // Using UserCircleIcon as a fallback
} from "@heroicons/react/24/outline"; // Changed to outline consistently
import PropTypes from "prop-types";

const UserProfileView = ({ profileData }) => {
  // --- Fallback for missing profile ---
  if (!profileData) {
    return (
      <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-[color:var(--text-secondary)]">
        <InformationCircleIcon className="w-12 h-12 mb-4 text-[color:var(--text-secondary)] opacity-50" />
        <p>Could not load profile information.</p>
      </div>
    );
  }

  // --- Render Group Profile ---
  if (profileData.isGroup) {
    const groupName = profileData.chatName || profileData.name || "Group";
    const members = Array.isArray(profileData.users) ? profileData.users : [];
    const groupAdmin = profileData.groupAdmin || null;
    const about = profileData.about || "No description provided.";
    const groupPic = profileData.groupPic || null;

    return (
      <div className="flex-grow overflow-y-auto p-3 sm:p-6 flex flex-col items-center custom-scrollbar">
        {/* Main Card */}
        <div className="neumorphic-raised w-full max-w-lg text-center p-4 sm:p-6 md:p-8">
          {/* Group Icon Container */}
          <div className="neumorphic-pressed rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4 p-1 flex items-center justify-center overflow-hidden">
            {groupPic ? (
              <img
                src={groupPic}
                alt={groupName}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling?.classList.remove("hidden");
                }} // Hide img, show fallback icon
              />
            ) : null}
            {/* Fallback Icon - always render but hide if image loads */}
            <UserGroupIcon
              className={`w-12 h-12 sm:w-16 sm:h-16 text-[color:var(--text-secondary)] ${
                groupPic ? "hidden" : ""
              }`} // Hide initially if pic exists
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-[color:var(--text-primary)]">
            {groupName}
          </h2>

          <p className="text-sm text-[color:var(--text-secondary)] mb-4 sm:mb-6">
            {members.length} members
          </p>

          {/* Details Section */}
          <div className="text-left space-y-4 mt-4 sm:mt-6 pt-4 sm:pt-6">
            {" "}
            {/* Removed border, adjusted spacing */}
            {/* About Section */}
            <div className="neumorphic-pressed p-3 sm:p-4 rounded-lg">
              <div className="flex items-center space-x-1.5 mb-1">
                <InformationCircleIcon className="w-4 h-4 text-[color:var(--text-secondary)]" />
                <p className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">
                  About
                </p>
              </div>
              <p className="text-sm text-[color:var(--text-primary)] mt-1 whitespace-pre-wrap break-words">
                {about}
              </p>
            </div>
            {/* Members Section */}
            <div className="neumorphic-pressed p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">
                  Members ({members.length})
                </p>
                {/* Optional: Add Member button could go here */}
              </div>

              <div className="space-y-1.5 max-h-48 sm:max-h-60 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {" "}
                {/* Negative margin + padding to hide scrollbar track slightly */}
                {members.length > 0 ? (
                  members.map((user) => (
                    <div
                      key={user._id}
                      className="neumorphic-interactive flex items-center p-2 rounded-md space-x-2 sm:space-x-3" // Interactive item
                    >
                      {/* User Avatar */}
                      <div className="neumorphic-raised rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user.pic ? (
                          <img
                            src={user.pic}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null; // Prevent infinite loop
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.name
                              )}&background=random&color=fff&size=96`;
                            }}
                          />
                        ) : (
                          <UserCircleIcon className="w-6 h-6 text-[color:var(--text-secondary)]" />
                        )}
                      </div>

                      {/* User Name */}
                      <span className="text-sm text-[color:var(--text-primary)] truncate flex-grow">
                        {user.name}
                      </span>

                      {/* Admin Badge */}
                      {groupAdmin?._id === user._id && (
                        <span
                          className="neumorphic-raised ml-auto text-xs text-[color:var(--primary-accent)] px-2 py-0.5 rounded-full font-medium"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {" "}
                          {/* Smaller neumorphic badge */}
                          Admin
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-[color:var(--text-secondary)] italic">
                    No members listed.
                  </div>
                )}
              </div>
            </div>
            {/* Group Details */}
            <div className="neumorphic-pressed p-3 sm:p-4 rounded-lg">
              <p className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-2">
                Group Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Group ID
                  </p>
                  <p className="text-sm text-[color:var(--text-primary)] truncate">
                    {profileData._id}
                  </p>
                </div>
                {profileData.createdAt && (
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      Created On
                    </p>
                    <p className="text-sm text-[color:var(--text-primary)]">
                      {new Date(profileData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 flex justify-center">
            {" "}
            {/* Removed border */}
            <button className="neumorphic-interactive min-w-24 px-5 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
              Leave Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render 1-on-1 User Profile ---
  const userName = profileData.name || "User";
  const userEmail = profileData.email || "Email not available";
  const userStatus = profileData.status || "Hey there! I am using NeumoChat.";
  const userPic = profileData.pic || null;
  const userJoinedDate = profileData.createdAt;
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName
  )}&background=random&color=fff&size=128`;

  return (
    <div className="flex-grow overflow-y-auto p-3 sm:p-6 flex flex-col items-center custom-scrollbar">
      {/* Main Card */}
      <div className="neumorphic-raised w-full max-w-md text-center p-4 sm:p-6 md:p-8">
        {/* Avatar Container */}
        <div className="neumorphic-pressed rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4 p-1 flex items-center justify-center overflow-hidden">
          <img
            src={userPic || defaultAvatarUrl}
            alt={userName}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              if (e.target.src !== defaultAvatarUrl) {
                // Prevent loop if default fails
                e.target.onerror = null;
                e.target.src = defaultAvatarUrl;
              }
            }}
          />
        </div>

        {/* Name & Email */}
        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-[color:var(--text-primary)]">
          {userName}
        </h2>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4 sm:mb-6 break-all">
          {userEmail}
        </p>

        {/* Details Section */}
        <div className="text-left space-y-4 mt-4 sm:mt-6 pt-4 sm:pt-6">
          {" "}
          {/* Removed border, adjusted spacing */}
          {/* Status */}
          <div className="neumorphic-pressed p-3 sm:p-4 rounded-lg">
            <p className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">
              Status
            </p>
            <p className="text-sm text-[color:var(--text-primary)] mt-1 break-words">
              {userStatus}
            </p>
          </div>
          {/* Joined Date */}
          {userJoinedDate && (
            <div className="neumorphic-pressed p-3 sm:p-4 rounded-lg">
              <p className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">
                Joined
              </p>
              <p className="text-sm text-[color:var(--text-primary)] mt-1">
                {new Date(userJoinedDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          {" "}
          {/* Removed border */}
          <button className="neumorphic-interactive w-full sm:w-auto px-5 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
            Block {/* userName */} {/* Shortened button text slightly */}
          </button>
          <button className="neumorphic-interactive w-full sm:w-auto px-5 py-2 text-sm font-medium rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors">
            Mute {/* Notifications */} {/* Shortened button text slightly */}
          </button>
        </div>
      </div>
    </div>
  );
};

UserProfileView.propTypes = {
  profileData: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    chatName: PropTypes.string,
    email: PropTypes.string,
    status: PropTypes.string,
    pic: PropTypes.string,
    groupPic: PropTypes.string,
    about: PropTypes.string,
    isGroup: PropTypes.bool,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        pic: PropTypes.string,
      })
    ),
    groupAdmin: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    }),
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
  }),
};

export default UserProfileView;
