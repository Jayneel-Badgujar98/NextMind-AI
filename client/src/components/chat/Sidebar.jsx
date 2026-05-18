import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, Settings, Loader2, Sun, Moon, MoreHorizontal } from 'lucide-react';
import { APP } from "../../utils/constants";
import { useTheme } from "../../context/ThemeContext";
import { formatRelativeTime } from "../../utils/helpers";

const Sidebar = ({ isOpen, onNewChat, onChatSelect, currentChatId }) => {
  const [sidebarWidth, setSidebarWidth] = useState(260); // 260px as per spec
  const [isResizing, setIsResizing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { theme, toggleTheme } = useTheme();

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${APP.CHAT_HISTORY}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatHistory(data.chats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [currentChatId]);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 480) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div 
      style={{ width: `${sidebarWidth}px` }}
      className={`fixed inset-y-0 left-0 z-20 bg-[#FFFFFF] dark:bg-[#111111] border-r border-[#E4E4E7] dark:border-white/10 transform transition-all-ease flex flex-col flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
    >
      
      {/* App Logo */}
      <div className={`h-[74px] px-6 flex items-center gap-3 bg-${theme === 'dark' ? 'black/40' : 'white/40'}`}>
        <img 
          src={theme === 'dark' ? '/LOGO_NAME_DARK_THEME.png' : '/LOGO_NAME_LIGHT_THEME.png'} 
          alt="NextMind Logo" 
          className="h-30 object-contain" 
        />
      </div>

      {/* New Chat Button */}
      <div className="px-4 pt-2">
        <button 
          onClick={onNewChat} 
          className="flex items-center justify-between w-full h-12 bg-[#10A37F] hover:bg-[#0E8F6E] text-white px-4 rounded-2xl transition-all-ease font-medium"
        >
          <div className="flex items-center gap-2">
            <Plus size={18} />
            <span className="truncate">New Chat</span>
          </div>
          <span className="text-xs opacity-80">⌘ K</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 mt-6 space-y-1">
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
          <span>Recent</span>
          {isLoadingHistory && <Loader2 size={12} className="animate-spin opacity-50" />}
        </p>

        {chatHistory.length === 0 && !isLoadingHistory && (
          <p className="text-xs text-[#52525B] dark:text-[#71717A] px-2 italic">No chats yet</p>
        )}

        {chatHistory.map((chat) => (
          <button 
            key={chat._id}
            onClick={() => onChatSelect(chat._id)}
            className={`flex items-center justify-between w-full h-[44px] text-left px-3 rounded-xl transition-all-ease group ${
              currentChatId === chat._id 
                ? 'bg-[#E4E4E7] dark:bg-[#202020] text-[#18181B] dark:text-white font-medium' 
                : 'text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#202020] hover:text-[#18181B] dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 truncate">
              <MessageSquare size={18} className={currentChatId === chat._id ? 'text-[#18181B] dark:text-white shrink-0' : 'text-[#A1A1AA] shrink-0 group-hover:text-[#18181B] dark:group-hover:text-white transition-colors'} />
              <span className="truncate text-[15px]">{chat.title || "New Chat"}</span>
            </div>
            {chat.updatedAt && (
              <span className="text-[11px] opacity-60 shrink-0 ml-2">
                {formatRelativeTime(chat.updatedAt)}
              </span>
            )}
          </button>
        ))}
        {chatHistory.length > 0 && (
          <button className="text-xs text-[#10A37F] font-medium px-3 pt-3 pb-1 hover:underline">
            View all &gt;
          </button>
        )}
      </div>

      {/* User / Settings Area */}
      <div className="px-4 pb-4 space-y-1">
        
        {/* Settings */}
        <button className="flex items-center gap-3 w-full h-[44px] px-3 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#202020] rounded-xl transition-all-ease">
          <Settings size={18} className="shrink-0" />
          <span className="truncate text-[15px] font-medium">Settings</span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between w-full h-[44px] px-3 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#202020] rounded-xl transition-all-ease"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
            <span className="truncate text-[15px] font-medium">Theme</span>
          </div>
          {/* Theme change icon in the ending */}
          <div className="w-8 h-5 bg-[#E4E4E7] dark:bg-[#181818] rounded-full flex items-center px-1 border border-[#E4E4E7] dark:border-white/10 relative">
            <div className={`w-3.5 h-3.5 rounded-full bg-[#10A37F] absolute transition-all-ease ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
          </div>
        </button>
        
        {/* Account Profile Box */}
        <div className="mt-2 p-3 flex items-center justify-between rounded-xl bg-[#F5F5F5] dark:bg-[#181818] border border-[#E4E4E7] dark:border-white/10 cursor-pointer hover:bg-[#E4E4E7] dark:hover:bg-[#202020] transition-all-ease">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#10A37F] flex items-center justify-center text-white font-bold text-sm shrink-0">
              A
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-[#18181B] dark:text-white leading-tight">Aryan Verma</span>
              <span className="text-xs text-[#52525B] dark:text-[#A1A1AA]">Free Plan</span>
            </div>
          </div>
          <MoreHorizontal size={18} className="text-[#A1A1AA]" />
        </div>
      </div>

      {/* Resizer Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#10A37F]/50 active:bg-[#10A37F] transition-colors z-30"
      />
    </div>
  );
};

export default Sidebar;