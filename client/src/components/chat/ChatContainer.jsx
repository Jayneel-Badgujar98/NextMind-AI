// src/components/chat/ChatContainer.jsx
import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SettingsModal from './SettingsModal';
import { APP } from "../../utils/constants";
import { useTheme } from '../../context/ThemeContext';

const ChatContainer = ({ onNavigate }) => {
  const [activeModalTab, setActiveModalTab] = useState(null); // 'profile' | 'personalisation' | 'upgrade' | 'settings' | null
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null); // Track active chat session

  // Abort controller for halting stream generation
  const abortControllerRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  const handleChatSelect = async (chatId) => {
    setIsSidebarOpen(false);
    setIsLoading(true);
    try {
      const response = await fetch(`${APP.BACKEND_URL}${APP.CHAT_HISTORY}/${chatId}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch chat messages");

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text, attachments = [], customMessages = null, overwriteMessages = false) => {
    // Prevent sending empty prompts
    if (!text.trim() && attachments.length === 0 && !customMessages) return;

    const now = new Date().toISOString();
    let targetMessages;

    if (customMessages) {
      targetMessages = customMessages;
    } else {
      const newUserMsg = { role: "user", content: text, attachments, timestamp: now };
      targetMessages = [...messages, newUserMsg];
    }

    setMessages(targetMessages);
    setIsLoading(true);

    // 2. Add assistant response placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: now }]);

    // 3. Setup AbortController for stop generation triggers
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${APP.BACKEND_URL}${APP.CHAT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Sync cookie sessions automatically
        body: JSON.stringify({
          messages: targetMessages,
          chatId: currentChatId,
          overwriteMessages: overwriteMessages
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Network response was not ok");

      // Extract new chatId if server created one (for first message)
      const returnedChatId = response.headers.get("x-chat-id");
      if (returnedChatId && !currentChatId) {
        setCurrentChatId(returnedChatId);
      }

      // 4. Stream reader pipeline
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiFullResponse = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        aiFullResponse += chunkText;

        // Update last message in array (the assistant placeholder)
        setMessages((prev) => {
          const newMessages = [...prev];
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

  const handleEditMessage = async (index, newText) => {
    const now = new Date().toISOString();

    // Update content of edited message
    const editedMsg = {
      ...messages[index],
      content: newText,
      timestamp: now
    };

    // Truncate everything after the edited message
    const customMessages = [...messages.slice(0, index), editedMsg];

    // Resubmit using the overwriteMessages driver
    await handleSendMessage("", [], customMessages, true);
  };

  const handleRegenerateResponse = async (index) => {
    // Truncate the assistant message at target index and everything after it
    const customMessages = messages.slice(0, index);

    // Resubmit preceding user query using the overwriteMessages driver
    await handleSendMessage("", [], customMessages, true);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0D0D0D] text-slate-800 dark:text-white overflow-hidden transition-all-ease">
      <Sidebar
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        onChatSelect={handleChatSelect}
        currentChatId={currentChatId}
        onNavigate={onNavigate}
        onOpenSettingsTab={(tab) => setActiveModalTab(tab)}
      />

      <div className="flex-1 flex flex-col relative">
        <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onNavigate={onNavigate} />

        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onRegenerateResponse={handleRegenerateResponse}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
        />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {activeModalTab && (
        <SettingsModal
          activeTab={activeModalTab}
          onClose={() => setActiveModalTab(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default ChatContainer;