// src/components/chat/MessageList.jsx
import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-20">
            <h2 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Welcome to NexMind AI
            </h2>
            <p className="text-gray-400">How can I assist you today?</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg.text} isAI={msg.isAI} />
          ))
        )}
        
        {isLoading && (
          <div className="flex w-full justify-start mb-6">
            <TypingIndicator />
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default MessageList;