// src/components/chat/ChatContainer.jsx
import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { APP } from "../../utils/constants";

const ChatContainer = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Hum array format clean rakh rahe hain: { role: 'user' | 'assistant', content: '...' }
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null); // Track the current active chat
  
  // Stream ko beech mein rokne ke liye
  const abortControllerRef = useRef(null);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleChatSelect = async (chatId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${APP.CHAT_HISTORY}/${chatId}`);
      if (!response.ok) throw new Error("Failed to fetch chat messages");
      
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setCurrentChatId(chatId);
        // Automatically close sidebar on mobile after selecting a chat
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const now = new Date().toISOString();

    // 1. User ka message UI mein add karo
    const newUserMsg = { role: "user", content: text, timestamp: now };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    // 2. AI ke answer ke liye ek khali (empty) placeholder add karo
    setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: now }]);

    // 3. AbortController setup karo (Stop button ke liye)
    abortControllerRef.current = new AbortController();

    try {
      // Axios ki jagah native Fetch use kiya kyunki ye Streams ke liye best hai
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${APP.CHAT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, chatId: currentChatId }), // Send chatId to backend
        signal: abortControllerRef.current.signal, // Stop function connect kiya
      });

      if (!response.ok) throw new Error("Network response was not ok");

      // Extract new chatId if backend created one (for first message)
      const returnedChatId = response.headers.get("x-chat-id");
      if (returnedChatId && !currentChatId) {
        setCurrentChatId(returnedChatId);
      }

      // 4. Stream padhne ka setup
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiFullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break; // Stream khatam

        // Raw bytes ko text mein decode karo
        const chunkText = decoder.decode(value, { stream: true });
        aiFullResponse += chunkText;

        // 5. State update karo taaki typing effect aaye
        setMessages((prev) => {
          const newMessages = [...prev];
          // Sabse aakhiri message (AI placeholder) ko update karo
          newMessages[newMessages.length - 1].content = aiFullResponse;
          return newMessages;
        });
      }

    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error("Chat API Error:", error);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = "Sorry, NextMind AI is having trouble connecting to the server.";
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // User jab "Stop" dabaye
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] dark:bg-[#0D0D0D] text-[#18181B] dark:text-white overflow-hidden transition-all-ease">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onNewChat={handleNewChat} 
        onChatSelect={handleChatSelect}
        currentChatId={currentChatId}
      />

      <div className="flex-1 flex flex-col relative">
        <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Hum prop bhej rahe hain taaki MessageList inko samajh sake */}
        <MessageList messages={messages} isLoading={isLoading} />

        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          onStop={handleStop} // Stop handle pass kiya
        />
      </div>

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