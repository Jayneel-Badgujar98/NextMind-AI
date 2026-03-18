// src/components/chat/ChatInput.jsx
import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-gray-900/80 backdrop-blur-md border-t border-gray-800">
      <form 
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto relative flex items-center bg-gray-800 border border-gray-700 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-blue-500 transition-all"
      >
        <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
          <Paperclip size={20} />
        </button>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask NexMind anything..."
          className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:outline-none placeholder-gray-500"
          disabled={isLoading}
        />
        
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
            input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-gray-500'
          }`}
        >
          <Send size={18} />
        </button>
      </form>
      <p className="text-center text-xs text-gray-500 mt-3">
        NexMind AI can make mistakes. Consider verifying important information.
      </p>
    </div>
  );
};

export default ChatInput;