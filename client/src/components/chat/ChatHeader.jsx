import React from 'react';
import { Menu, History } from 'lucide-react';

const ChatHeader = ({ toggleSidebar }) => {
  return (
    <header className="h-[72px] flex items-center justify-between px-6 md:px-8 bg-[#F5F5F5] dark:bg-[#0D0D0D] border-b border-transparent sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="md:hidden p-2 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white rounded-xl hover:bg-[#E4E4E7] dark:hover:bg-[#181818] transition-all-ease"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-bold text-[#18181B] dark:text-white tracking-tight leading-none mb-1">
            NextMind
          </h1>
          <span className="text-xs md:text-sm font-medium text-[#10A37F]">
            Your Intelligent Assistant
          </span>
        </div>
      </div>
      
      <div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E4E4E7] dark:border-white/10 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white bg-[#FFFFFF] dark:bg-[#181818] hover:bg-[#F5F5F5] dark:hover:bg-[#202020] transition-all-ease shadow-sm">
          <History size={18} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;