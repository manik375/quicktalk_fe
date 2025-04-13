// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, resetAuthStatus } from "../features/auth/authSlice";
import {
  selectCurrentChat, // Alias for selectSelectedChat used here
  setSelectedChat,
  resetChatState,
  fetchUserChats,
  selectChatIsLoading,
  clearSearchedUsers,
  selectChatError,
} from "../features/chat/chatSlice";
import {
  fetchMessagesForChat,
  resetMessageState,
} from "../features/message/messageSlice";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ConversationArea from "../components/ConversationArea";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupInfoModal from "../components/GroupInfoModal";
import SettingsPage from "../components/SettingsPage";
import {
  UserGroupIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon, // Changed placeholder icon
} from "@heroicons/react/24/outline";

// --- Helper Components (Keep as is) ---

const SidebarLoading = () => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-sm text-[color:var(--text-secondary)]">
    <svg
      className="animate-spin h-5 w-5 mb-2 text-[color:var(--primary-accent)]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    Loading chats...
  </div>
);

const SidebarError = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-sm text-red-600 dark:text-red-400 text-center">
    <ExclamationCircleIcon className="h-8 w-8 mb-2" />
    <p className="mb-3 font-medium">Error loading chats:</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
      {message || "An unknown error occurred."}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 text-xs font-medium rounded bg-[color:var(--primary-accent)] text-white hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    )}
  </div>
);

// SettingsPlaceholder is no longer needed since we're using the actual component
// But we'll keep it for now in case there are other references to it

// --- HomePage Component ---

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Redux State ---
  const { user } = useSelector((state) => state.auth);
  // Use selectCurrentChat which is an alias for selectSelectedChat in chatSlice
  const currentChat = useSelector(selectCurrentChat);
  const chatListIsLoading = useSelector(selectChatIsLoading);
  const chatError = useSelector(selectChatError);

  // --- Component State ---
  const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState("Chats"); // 'Chats', 'Groups', 'Settings'
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [groupInfoTarget, setGroupInfoTarget] = useState(null); // State for modal data

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Initial setup based on width
    setIsMobileSidebarVisible(
      window.innerWidth >= 768 || activeTab !== "Settings"
    );

    return () => window.removeEventListener("resize", handleResize);
  }, []); // Run only on mount/unmount

  // Separate effect to handle visibility changes based on tab/width
  useEffect(() => {
    if (windowWidth < 768) {
      // On mobile, sidebar visibility depends on chat selection AND tab
      if (currentChat && activeTab !== "Settings") {
        setIsMobileSidebarVisible(false); // Hide sidebar when chat selected on mobile
      } else if (activeTab === "Settings") {
        setIsMobileSidebarVisible(false); // Hide sidebar if settings selected on mobile
      } else {
        setIsMobileSidebarVisible(true); // Show sidebar otherwise (list view)
      }
    } else {
      // On desktop, always show sidebar unless settings is active
      setIsMobileSidebarVisible(activeTab !== "Settings");
    }
  }, [windowWidth, currentChat, activeTab]);

  useEffect(() => {
    // Auth check effect
    if (!user) {
      console.log(
        "HomePage Effect: No user found, resetting state and navigating to login."
      );
      dispatch(resetChatState());
      dispatch(resetMessageState());
      dispatch(resetAuthStatus());
      navigate("/login", { replace: true });
    }
  }, [user, navigate, dispatch]);

  useEffect(() => {
    // Fetch chats effect
    if (user && user.token) {
      console.log("HomePage Effect: User found, fetching chats.");
      dispatch(fetchUserChats());
    }
  }, [user, dispatch]); // Removed user.token dependency, user object check is sufficient

  // --- Handlers ---
  const handleTabChange = (tab) => {
    console.log(`HomePage: Tab changed to ${tab}`);
    setActiveTab(tab);
    dispatch(setSelectedChat(null)); // Deselect chat when changing main tabs
    dispatch(resetMessageState()); // Clear messages
    // Mobile visibility handled by the dedicated effect now
  };

  const handleChatSelection = (chat) => {
    if (!chat) return;
    console.log(
      `HomePage: Chat selected: ID=${chat._id}, Name=${
        chat.chatName || "1-on-1"
      }`
    );
    // Only dispatch if it's a different chat
    if (!currentChat || currentChat._id !== chat._id) {
      dispatch(setSelectedChat(chat));
      dispatch(fetchMessagesForChat(chat._id));
    }
    // Mobile visibility handled by the dedicated effect now
  };

  const handleShowSidebarMobile = () => {
    // This function is called when clicking "Back" in ConversationArea on mobile
    console.log("HomePage: handleShowSidebarMobile called.");
    dispatch(setSelectedChat(null)); // Deselect chat
    dispatch(resetMessageState()); // Clear messages
    // The effect watching currentChat will make the sidebar visible
  };

  const handleLogout = () => {
    console.log("HomePage: Logout requested.");
    dispatch(logout());
    // Auth effect will handle navigation
  };

  const handleOpenCreateGroupModal = () => {
    console.log("HomePage: Opening Create Group Modal.");
    setIsCreateGroupModalOpen(true);
  };

  const handleCloseCreateGroupModal = () => {
    console.log("HomePage: Closing Create Group Modal.");
    setIsCreateGroupModalOpen(false);
    dispatch(clearSearchedUsers()); // Clear search results on close
  };

  const handleGroupCreated = (newGroup) => {
    // Optional: Could use the newGroup data if needed
    console.log(
      "HomePage: Group created callback received, switching to Groups tab.",
      newGroup
    );
    setActiveTab("Groups"); // Switch tab
    // Selection/visibility handled by other logic/effects
  };

  const handleOpenGroupInfoModal = () => {
    // --- CRITICAL DEBUGGING AREA ---
    console.log("HomePage: handleOpenGroupInfoModal triggered.");
    console.log("HomePage: Current selected chat:", currentChat); // Log the chat data available RIGHT NOW

    if (currentChat?.isGroupChat) {
      console.log(
        "HomePage: Confirmed selected chat is a group. Checking admin data:",
        currentChat.groupAdmin
      ); // Log admin specifically
      setGroupInfoTarget(currentChat); // Set the dedicated state for the modal
      setIsGroupInfoModalOpen(true); // Open the modal
      console.log(
        "HomePage: GroupInfoModal should now open with target:",
        currentChat._id
      );
    } else {
      console.error(
        "HomePage: Cannot open group info modal - currentChat is null, undefined, or not a group chat.",
        currentChat
      );
      setGroupInfoTarget(null); // Ensure target is cleared if conditions aren't met
    }
    // --- END CRITICAL DEBUGGING AREA ---
  };

  const handleCloseGroupInfoModal = () => {
    console.log("HomePage: Closing Group Info Modal.");
    setIsGroupInfoModalOpen(false);
    setGroupInfoTarget(null); // Clear the target state when closing
  };

  const handleAddMembers = () => {
    // Placeholder/future implementation
    console.log(
      "HomePage: Add Members trigger clicked for group:",
      groupInfoTarget?._id
    );
    handleCloseGroupInfoModal(); // Close info modal to potentially open add member modal later
    // TODO: Implement Add Members functionality (likely open another modal)
  };

  const handleRetryFetchChats = () => {
    console.log("HomePage: Retrying fetch chats...");
    if (user && user.token) {
      dispatch(fetchUserChats());
    }
  };

  // --- Sidebar Content Logic ---
  let sidebarDisplayContent;
  const shouldRenderSidebar = activeTab !== "Settings"; // Sidebar doesn't render for Settings tab

  if (shouldRenderSidebar) {
    if (chatListIsLoading) {
      sidebarDisplayContent = <SidebarLoading />;
    } else if (chatError) {
      sidebarDisplayContent = (
        <SidebarError message={chatError} onRetry={handleRetryFetchChats} />
      );
    } else {
      // Pass down necessary props to Sidebar
      sidebarDisplayContent = (
        <Sidebar
          onSelectChat={handleChatSelection}
          activeTab={activeTab} // Pass activeTab
          onCreateGroup={handleOpenCreateGroupModal} // Pass handler
        />
      );
    }
  } else {
    sidebarDisplayContent = null; // Don't render anything if sidebar shouldn't show
  }

  // --- Main Content Area Logic ---
  let mainContent;
  if (activeTab === "Settings") {
    mainContent = <SettingsPage />;
  } else if (currentChat) {
    // If a chat is selected (and not Settings tab)
    mainContent = (
      <ConversationArea
        key={currentChat._id} // Ensures component remounts on chat change
        chat={currentChat}
        onBack={handleShowSidebarMobile} // Handler for mobile back button
        isMobile={windowWidth < 768}
        onGroupInfoClick={handleOpenGroupInfoModal} // Pass handler for group info icon
      />
    );
  } else {
    // Placeholder if no chat selected (and not Settings tab)
    const PlaceholderIcon =
      activeTab === "Groups" ? UserGroupIcon : ChatBubbleLeftRightIcon;
    const title =
      activeTab === "Groups" ? "Select a Group" : "Select a Conversation";
    const text =
      activeTab === "Groups"
        ? "Choose from existing groups or create a new one."
        : "Choose from existing chats or start a new one.";

    mainContent = (
      // Use 'hidden md:flex' to hide on mobile, show on desktop flex container
      <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-10 text-gray-400 dark:text-zinc-500">
        <PlaceholderIcon className="w-20 h-20 mb-6 opacity-60" />
        <p className="text-lg font-medium mb-1 text-gray-600 dark:text-zinc-400">
          {title}
        </p>
        <p className="text-sm max-w-xs">{text}</p>
      </div>
    );
  }

  // --- Render ---
  // Loading state while user data is initially checked
  // Note: This might flash briefly if auth check is fast. Consider a more robust loading indicator if needed.
  //   if (!user && !authLoading && !authError) { // Check auth state if available
  //     return (
  //       <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-900">
  //         Authenticating...
  //       </div>
  //     );
  //   }
  // Simple check - assumes user object exists once logged in.
  if (!user) return null; // Or a dedicated loading spinner

  // --- Final JSX Structure ---
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
      {/* Navbar (Always Visible) */}
      <Navbar
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Flexible Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {" "}
        {/* Use relative for absolute positioning of mobile sidebar */}
        {/* Sidebar Container */}
        {shouldRenderSidebar && (
          <div
            className={`
              neumorphic-base
              shadow-[var(--shadow-outset)] /* Or appropriate neumorphic shadow */
              /* rounded-none rounded-r-2xl */ /* Removed conflicting rounding */
              flex flex-col w-full md:w-[320px] lg:w-[360px] flex-shrink-0 h-full
              transition-transform duration-300 ease-in-out /* Changed transition property */
              absolute md:relative z-20 md:z-auto /* Higher z-index for mobile overlay */
              bg-inherit /* Ensure background matches parent */
              ${
                isMobileSidebarVisible ? "translate-x-0" : "-translate-x-full"
              } md:translate-x-0
            `}
          >
            {sidebarDisplayContent}
          </div>
        )}
        {/* Main Content Area (Conversation or Placeholders) */}
        <div className="flex flex-col flex-1 bg-gray-50 dark:bg-zinc-900/95 overflow-hidden">
          {" "}
          {/* Slightly different bg */}
          {mainContent}
        </div>
      </div>

      {/* Modals (Rendered at top level for stacking context) */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={handleCloseCreateGroupModal}
        onGroupCreated={handleGroupCreated}
      />
      {/* Pass the confirmed groupInfoTarget to the modal */}
      <GroupInfoModal
        group={groupInfoTarget} // Use the state variable
        isOpen={isGroupInfoModalOpen}
        onClose={handleCloseGroupInfoModal}
        onAddMembers={handleAddMembers} // Pass handler
      />
    </div>
  );
};

export default HomePage;
