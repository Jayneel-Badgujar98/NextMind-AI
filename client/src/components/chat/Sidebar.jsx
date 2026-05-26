import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, MessageSquare, Settings, Loader2, Sun, Moon, MoreHorizontal, Shield, LogOut, Compass, Search, User, Sliders, Sparkles } from 'lucide-react';
import { APP } from "../../utils/constants";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/authContext";
import { formatRelativeTime } from "../../utils/helpers";

const Sidebar = ({ isOpen, onNewChat, onChatSelect, currentChatId, onNavigate, onOpenSettingsTab }) => {
  const [sidebarWidth, setSidebarWidth] = useState(260); // 260px as per spec
  const [isResizing, setIsResizing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const fetchChatHistory = async () => {
    // Only logged-in users have persistent chat history
    if (!user) {
      setChatHistory([]);
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${APP.CHAT_HISTORY}`, {
        credentials: "include" // Crucial to send credentials cookie with fetch
      });
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
  }, [currentChatId, user]);

  // Click outside handler to close the profile dropdown popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Filter history based on search query
  const filteredHistory = chatHistory.filter((chat) => 
    (chat.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      style={{ width: `${sidebarWidth}px` }}
      className={`fixed inset-y-0 left-0 z-20 max-w-[85vw] md:max-w-none bg-[#FFFFFF] dark:bg-[#111111] border-r border-slate-200/80 dark:border-white/10 transform transition-all-ease flex flex-col flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
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
          className="flex items-center justify-between w-full h-12 bg-[#10A37F] hover:bg-[#0E8F6E] text-white px-4 rounded-2xl transition-all duration-200 font-bold active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus size={18} />
            <span className="truncate">New Chat</span>
          </div>
        </button>
      </div>

      {/* Real-time Search Input Bar */}
      {user && chatHistory.length > 0 && (
        <div className="px-4 pt-3">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-10 pl-9 pr-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-[13px] focus:outline-none focus:border-[#10A37F] placeholder-slate-400 dark:placeholder-zinc-500 font-medium transition-all"
            />
            <Search size={15} className="absolute left-3 top-3 text-slate-400 dark:text-[#71717A]" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 w-5 h-5 rounded-full flex items-center justify-center bg-slate-200 hover:bg-slate-350 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer font-bold text-[10px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent History Area / Promotional Guest Card */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-1">
        <p className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider mb-2 px-2 flex items-center justify-between">
          <span>{searchQuery ? 'Search Results' : 'Recent'}</span>
          {isLoadingHistory && <Loader2 size={12} className="animate-spin opacity-50" />}
        </p>

        {user ? (
          <>
            {filteredHistory.length === 0 && !isLoadingHistory && (
              <p className="text-xs text-slate-400 dark:text-[#71717A] px-2 italic">
                {searchQuery ? 'No matching chats found' : 'No chats yet'}
              </p>
            )}

            {filteredHistory.map((chat) => (
              <button 
                key={chat._id}
                onClick={() => onChatSelect(chat._id)}
                className={`flex items-center justify-between w-full h-[44px] text-left px-3 rounded-xl transition-all-ease group ${
                  currentChatId === chat._id 
                    ? 'bg-slate-100 dark:bg-[#202020] text-slate-900 dark:text-white font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare size={18} className={currentChatId === chat._id ? 'text-slate-900 dark:text-white shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} />
                  <span className="truncate text-[15px]">{chat.title || "New Chat"}</span>
                </div>
                {chat.updatedAt && (
                  <span className="text-[11px] opacity-60 shrink-0 ml-2">
                    {formatRelativeTime(chat.updatedAt)}
                  </span>
                )}
              </button>
            ))}
          </>
        ) : (
          /* Premium Promo Card for Guest Users */
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-3 mt-2 select-none">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
              Sign in to save your chats
            </h4>
            <ul className="text-[11px] text-slate-600 dark:text-[#A1A1AA] space-y-2 pl-0.5 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10A37F]" />
                <span>Unlimited chat history</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10A37F]" />
                <span>Cross-device sync</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10A37F]" />
                <span>Custom user profile</span>
              </li>
            </ul>
            <button 
              onClick={() => onNavigate('signin')}
              className="w-full h-9 mt-1 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Compass size={13} className="animate-spin-slow" />
              <span>Sign In to NextMind</span>
            </button>
          </div>
        )}
      </div>

      {/* User / Settings Profile Area */}
      <div className="px-4 pb-4 relative" ref={dropdownRef}>
        
        {/* Animated Glassmorphic Popover Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute bottom-20 left-4 right-4 z-30 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 transition-all duration-200 animate-slide-up select-none">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1.5 flex flex-col text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user ? user.name : "Guest User"}
              </span>
              <span className="text-[11px] text-slate-400 truncate mt-0.5">
                {user ? user.email : "Temporary session"}
              </span>
            </div>

            {/* Dropdown Options */}
            {/* 1. User Profile */}
            <button 
              onClick={() => {
                setIsDropdownOpen(false);
                if (onOpenSettingsTab) {
                  onOpenSettingsTab('profile');
                } else {
                  alert("Please log in to manage your profile.");
                  onNavigate('signin');
                }
              }}
              className="flex items-center gap-3 w-full h-[40px] px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all duration-150 font-medium text-left cursor-pointer"
            >
              <User size={16} />
              <span className="text-sm">User Profile</span>
            </button>

            {/* 2. Personalisation */}
            <button 
              onClick={() => {
                setIsDropdownOpen(false);
                if (onOpenSettingsTab) {
                  onOpenSettingsTab('personalisation');
                } else {
                  alert("Please log in to customize NextMind AI.");
                  onNavigate('signin');
                }
              }}
              className="flex items-center gap-3 w-full h-[40px] px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all duration-150 font-medium text-left cursor-pointer"
            >
              <Sliders size={16} />
              <span className="text-sm">Personalisation</span>
            </button>

            {/* 3. Upgrade Plan */}
            <button 
              onClick={() => {
                setIsDropdownOpen(false);
                if (onOpenSettingsTab) {
                  onOpenSettingsTab('upgrade');
                } else {
                  alert("Please log in to view upgrade plans.");
                  onNavigate('signin');
                }
              }}
              className="flex items-center justify-between w-full h-[40px] px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all duration-150 font-medium cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-sm">Upgrade Plan</span>
              </div>
              {user && !user.isDev && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                  Pro
                </span>
              )}
            </button>

            {/* 4. Settings */}
            <button 
              onClick={() => {
                setIsDropdownOpen(false);
                if (onOpenSettingsTab) {
                  onOpenSettingsTab('settings');
                } else {
                  alert("Please log in to edit system settings.");
                  onNavigate('signin');
                }
              }}
              className="flex items-center gap-3 w-full h-[40px] px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all duration-150 font-medium text-left cursor-pointer"
            >
              <Settings size={16} />
              <span className="text-sm">Settings</span>
            </button>

            {/* 5. Appearance */}
            <button 
              onClick={() => {
                toggleTheme();
              }}
              className="flex items-center justify-between w-full h-[40px] px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all duration-150 font-medium cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span className="text-sm">Appearance</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 uppercase">
                {theme}
              </span>
            </button>

            <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1" />

            {/* Sign In / Sign Out */}
            {user ? (
              <button 
                onClick={async () => {
                  setIsDropdownOpen(false);
                  onNewChat(); // Clear chats
                  await logout();
                }}
                className="flex items-center gap-3 w-full h-[40px] px-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-150 font-medium text-left cursor-pointer"
              >
                <LogOut size={16} />
                <span className="text-sm font-bold">Sign Out</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  onNavigate('signin');
                }}
                className="flex items-center gap-3 w-full h-[40px] px-3 text-[#10A37F] hover:bg-[#10A37F]/10 rounded-xl transition-all duration-150 font-medium text-left cursor-pointer"
              >
                <Shield size={16} />
                <span className="text-sm font-bold">Sign In</span>
              </button>
            )}

          </div>
        )}
        
        {/* Account Profile Box */}
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`mt-2 p-3 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-100/85 dark:hover:bg-white/10 transition-all duration-200 select-none ${isDropdownOpen ? 'ring-2 ring-[#10A37F]/20' : ''}`}
        >
          <div className="flex items-center gap-3 truncate">
            {user && user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-white/5"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm shadow-[#10A37F]/20">
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <div className="flex flex-col text-left truncate">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                {user ? user.name : "Guest User"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user ? (user.isDev ? 'Developer' : 'Free tier') : "Temporary Session"}
              </span>
            </div>
          </div>
          <MoreHorizontal size={16} className="text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Resizer Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#10A37F]/50 active:bg-[#10A37F] transition-colors z-30 hidden md:block"
      />
    </div>
  );
};

export default Sidebar;