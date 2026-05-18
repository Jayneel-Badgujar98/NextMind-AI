// src/components/chat/MessageList.jsx
import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-20">
            <h2 className="text-[28px] font-bold text-[#18181B] dark:text-white tracking-tight mb-2">
              Welcome to NextMind
            </h2>
            <p className="text-[#52525B] dark:text-[#A1A1AA]">How can I assist you today?</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg.content}
              isAI={msg.role === 'assistant'}
              timestamp={msg.timestamp}
            />
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