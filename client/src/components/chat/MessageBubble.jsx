// src/components/chat/MessageBubble.jsx
import React from 'react';
import { Bot, User } from 'lucide-react';

const MessageBubble = ({ message, isAI }) => {
  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] gap-4 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isAI ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-700'}`}>
          {isAI ? <Bot size={18} className="text-white" /> : <User size={18} className="text-gray-300" />}
        </div>

        {/* Message Content */}
        <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
          isAI 
            ? 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700' 
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;