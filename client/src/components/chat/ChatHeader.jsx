import React from 'react';
import { Menu, History, Sun, Moon, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/ThemeContext';

const ChatHeader = ({ toggleSidebar, onNavigate }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-[72px] flex items-center justify-between px-4 md:px-8 bg-[#F8FAFC]/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/5 sticky top-0 z-10 transition-colors duration-300">
      
      {/* Top Left Section: Sidebar Toggle & Theme Switcher & Logo */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar} 
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all duration-200"
          aria-label="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Theme Toggler (Top-Left!) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all duration-200 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181818] shadow-sm cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex flex-col ml-1">
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
            NextMind
          </h1>
          <span className="text-[10px] md:text-xs font-bold text-[#10A37F]">
            Your Intelligent Assistant
          </span>
        </div>
      </div>
      
      {/* Top Right Section: History (If User) or Login/Signup (If Guest) */}
      <div className="flex items-center gap-3">
        {user ? (
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#A1A1AA] hover:text-slate-950 dark:hover:text-white bg-white dark:bg-[#181818] hover:bg-slate-50 dark:hover:bg-[#202020] transition-all duration-200 shadow-sm cursor-pointer"
            title="Chat History"
          >
            <History size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Log In Button */}
            <button 
              onClick={() => onNavigate('signin')}
              className="h-9 px-3 md:px-4 flex items-center gap-1.5 rounded-xl text-xs md:text-sm font-bold text-[#10A37F] border border-[#10A37F]/20 hover:border-[#10A37F]/60 hover:bg-[#10A37F]/5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">Log In</span>
            </button>

            {/* Sign Up Button */}
            <button 
              onClick={() => onNavigate('signup')}
              className="h-9 px-3 md:px-4 flex items-center gap-1.5 rounded-xl text-xs md:text-sm font-bold text-white bg-[#10A37F] hover:bg-[#0E8F6E] hover:shadow-md hover:shadow-[#10A37F]/10 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Sign Up</span>
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default ChatHeader;