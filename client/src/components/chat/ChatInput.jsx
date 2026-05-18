import React, { useState } from 'react';
import { Send, Paperclip, Square, Mic } from 'lucide-react';

const ChatInput = ({ onSendMessage, isLoading, onStop }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput(''); // Clear input after sending
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-[#F5F5F5] dark:from-[#0D0D0D] to-transparent sticky bottom-0 w-full z-10">
      <form 
        onSubmit={handleSubmit} 
        className="max-w-3xl mx-auto relative flex items-center h-16 bg-[#FFFFFF] dark:bg-[#181818] border border-[#E4E4E7] dark:border-white/10 rounded-full px-2 focus-within:border-[#10A37F]/50 focus-within:ring-1 focus-within:ring-[#10A37F]/50 transition-all-ease shadow-sm"
      >
        <button type="button" className="p-3 text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white transition-colors">
          <Paperclip size={20} />
        </button>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Message NextMind..."
          className="flex-1 bg-transparent border-none text-[16px] text-[#18181B] dark:text-white px-2 focus:outline-none placeholder-[#71717A] disabled:opacity-50"
          disabled={isLoading} 
        />
        
        {isLoading ? (
          <button 
            type="button" 
            onClick={onStop} 
            className="w-10 h-10 ml-2 rounded-full bg-[#10A37F]/20 text-[#10A37F] hover:bg-[#10A37F]/30 transition-colors flex items-center justify-center shrink-0"
            title="Stop generating"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              className="p-3 text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white transition-colors"
            >
              <Mic size={20} />
            </button>
            <button 
              type="submit" 
              disabled={!input.trim()} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all-ease shrink-0 ${
                input.trim() ? 'bg-[#10A37F] text-white hover:bg-[#0E8F6E]' : 'bg-[#E4E4E7] dark:bg-[#202020] text-[#A1A1AA]'
              }`}
            >
              <Send size={18} className={input.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
            </button>
          </div>
        )}
      </form>
      <p className="text-center text-xs text-[#71717A] mt-3">
        NextMind can make mistakes. Consider checking important information.
      </p>
    </div>
  );
};

export default ChatInput;