// src/components/chat/MessageList.jsx
import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Compass, Sparkles, Code, MessageSquare, Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const MessageList = ({ messages, isLoading, onSendMessage, onEditMessage, onRegenerateResponse }) => {
  const endOfMessagesRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isLoading, messages.length]);

  const suggestions = [
    {
      title: "Write a landing page",
      desc: "HTML and CSS outline for a modern green store",
      icon: <Code size={18} className="text-[#10A37F]" />,
      prompt: "Can you write a clean, responsive HTML and CSS code structure for a sustainable organic coffee shop landing page?"
    },
    {
      title: "JS Array Reduce",
      desc: "Explain reduce with 3 practical code examples",
      icon: <Terminal size={18} className="text-[#3B82F6]" />,
      prompt: "Explain the JavaScript Array.prototype.reduce() method with 3 practical, real-world development code examples."
    },
    {
      title: "Sick Leave Email",
      desc: "Professional leave request draft for tech lead",
      icon: <MessageSquare size={18} className="text-[#F59E0B]" />,
      prompt: "Draft a professional email requesting a medical/sick leave of 2 days to my Tech Lead, keeping a polite and clear tone."
    },
    {
      title: "Sick Leave Email", // Maintain original duplicate fallback just to be safe
      desc: "Professional leave request draft for tech lead",
      icon: <MessageSquare size={18} className="text-[#F59E0B]" />,
      prompt: "Draft a professional email requesting a medical/sick leave of 2 days to my Tech Lead, keeping a polite and clear tone."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 ? (
          <div className="min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-4 sm:py-8">

            {/* Animated Brand Emblem */}
            {/* Avatar (Only for AI) */}


            <img
              src={theme === "dark" ? "/LOGO_DARK.png" : "/LOGO_LIGHT.png"}
              alt="NextMind Logo"
              className="
    h-12 w-12
    sm:h-14 sm:w-14
    md:h-20 md:w-20

    object-contain
    rounded-full
    p-1.5

    transition-all duration-300
  "
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />



            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 sm:mb-3 font-sans">
              Welcome to NextMind
            </h2>
            <p className="text-xs sm:text-sm md:text-base font-medium text-slate-500 dark:text-zinc-400 max-w-md mb-6 sm:mb-12">
              Your next-generation intelligent assistant. Start typing to begin.
            </p>

            {/* Suggestions Grid: Hidden on mobile/smaller devices, visible on laptops/desktops */}
            <div className="w-full hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage && onSendMessage(item.prompt)}
                  className="p-4 text-left bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-350 dark:hover:border-white/20 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between min-h-[110px] active:scale-[0.98] outline-none"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={index}
              index={index}
              message={msg.content}
              isAI={msg.role === 'assistant'}
              timestamp={msg.timestamp}
              attachments={msg.attachments}
              onEditMessage={onEditMessage}
              onRegenerateResponse={onRegenerateResponse}
              isLastAI={msg.role === 'assistant' && index === messages.length - 1}
            />
          ))
        )}

        {isLoading && (
          <div className="flex w-full justify-start mb-6">
            <TypingIndicator />
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default MessageList;