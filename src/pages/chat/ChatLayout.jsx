// src/pages/chat/ChatLayout.jsx
import { useChat } from "../../contexts/ChatContext";
import Sidebar from "../../components/Sidebar";
import ChatArea from "../../components/ChatArea";

const ChatLayout = () => {
  const { currentChat } = useChat();

  return (
    <div className="flex h-screen">
      <Sidebar />
      {currentChat ? (
        <ChatArea />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p>Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
