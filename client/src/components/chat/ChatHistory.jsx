// src/components/chat/ChatHistory.jsx
import React from 'react';
import { Trash2, Search, FileText } from 'lucide-react';
import { APP } from '../../utils/constants';

// here we will make a api call to the backend to fetch the previous chat histories titles
// 

const ChatHistory = () => {
  return (
    <div className="flex-1 overflow-y-auto px-3 space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 mt-4">Recent</p>

      <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
        <FileText size={16} className="text-gray-500 shrink-0" />
        <span className="truncate text-sm">React Components Setup</span>
      </button>

      <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
        <FileText size={16} className="text-gray-500 shrink-0" />
        <span className="truncate text-sm">Tailwind CSS Errors</span>
      </button>
      
    </div>
  );
};

export default ChatHistory;