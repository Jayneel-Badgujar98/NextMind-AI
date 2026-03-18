// src/components/chat/Sidebar.jsx
import React from 'react';
import { Plus, MessageSquare, Settings } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-20 w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      
      {/* New Chat Button */}
      <div className="p-4">
        <button className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-all font-medium">
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {/* Chat History (Dummy for now) */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 mt-4">Recent</p>
        <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
          <MessageSquare size={16} className="text-gray-500" />
          <span className="truncate text-sm">React Components Setup</span>
        </button>
        <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
          <MessageSquare size={16} className="text-gray-500" />
          <span className="truncate text-sm">Tailwind CSS Errors</span>
        </button>
      </div>

      {/* User / Settings Area */}
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 w-full px-2 py-2 text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;