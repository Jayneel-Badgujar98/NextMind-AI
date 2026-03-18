// src/components/chat/TypingIndicator.jsx
import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 p-4 bg-gray-800 rounded-2xl rounded-tl-none w-fit max-w-[80%] border border-gray-700">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

export default TypingIndicator;