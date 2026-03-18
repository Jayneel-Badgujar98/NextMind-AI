// src/components/chat/ChatContainer.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import axios from "axios";
import { APP } from "../../utils/constants";

const ChatContainer = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // Ye function abhi ke liye dummy delay create karta hai
  const handleSendMessage = async (text) => {
    // 1. User ka message add karo
    setMessages((prev) => [...prev, { text, isAI: false }]);
    setIsLoading(true);

    // API Calling to the backend chat ai endpoint 
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}${APP.CHAT}`, { message: text });
      const aiText = response.data.reply;

      setAiResponse(aiText);
      console.log("AI Response:", response.data);

      setMessages((prev) => [
        ...prev,
        { text: aiText, isAI: true }
      ]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I am having trouble connecting to the server.", isAI: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Pura page dark background aur full height ke sath
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">

      <Sidebar isOpen={isSidebarOpen} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <MessageList messages={messages} isLoading={isLoading} />

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatContainer;