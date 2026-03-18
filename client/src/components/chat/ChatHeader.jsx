// src/components/chat/ChatHeader.jsx
import React from 'react';
import { Menu, Share, Sparkles } from 'lucide-react';
import { APP } from "../../utils/constants"

const ChatHeader = ({ toggleSidebar }) => {
  const { NAME } = APP;
  return (
    <header className="h-16 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-400 hover:text-white">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
          <span className="font-semibold text-gray-200">{NAME} PRO</span>
          <Sparkles size={16} className="text-blue-400" />
        </div>
      </div>
      
      <div>
        <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
          <Share size={20} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;