import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowUp, Square, X, Camera, Image, FileText } from 'lucide-react';
import { useAuth } from '../../context/authContext';

const ChatInput = ({ onSendMessage, isLoading, onStop }) => {
  const { user } = useAuth();
  const enterSends = user?.enterSends !== undefined ? user.enterSends : true;

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]); // Array of { name, type, base64 }
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showAttachMenu && !e.target.closest('.attach-menu-container')) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showAttachMenu]);

  // Auto-resize text area height dynamically based on content lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);



  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setAttachments(prev => [
          ...prev, 
          {
            name: file.name,
            type: file.type,
            base64: base64String
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset values
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    setShowAttachMenu(false);
  };

  const handleRemoveAttachment = (idxToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0D0D0D] via-[#F8FAFC]/90 dark:via-[#0D0D0D]/90 to-transparent sticky bottom-0 w-full z-10 font-sans">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,application/pdf"
        className="hidden"
      />
      <input 
        type="file" 
        multiple
        ref={photoInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      <input 
        type="file" 
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="max-w-3xl mx-auto flex flex-col gap-2 relative">


        {/* Gemini-Style Chat Capsule Card */}
        <div className="flex flex-col bg-[#FFFFFF] dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-[28px] p-3 shadow-md hover:shadow-lg focus-within:shadow-lg focus-within:border-slate-300 dark:focus-within:border-white/20 transition-all duration-300">
          
          {/* Inner Previews Row (Only rendered when files are attached) */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 px-3 pt-1 pb-3 overflow-x-auto max-h-32 scrollbar-none animate-fade-in">
              {attachments.map((file, idx) => (
                <div 
                  key={idx} 
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 shadow-sm bg-slate-50 dark:bg-zinc-900 group"
                >
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={file.base64} 
                      alt={file.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full text-red-500 flex flex-col items-center justify-center p-1">
                      <FileText size={28} />
                      <span className="text-[9px] font-bold truncate max-w-full px-1">{file.name}</span>
                    </div>
                  )}
                  {/* Circle X delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white dark:bg-[#202020] text-slate-800 dark:text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer border border-slate-100 dark:border-transparent z-20"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input Row */}
          <div className="flex items-center gap-1">
            {/* Plus Icon Trigger & Floating Attach Menu */}
            <div className="relative attach-menu-container shrink-0">
              <button 
                type="button" 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer outline-none ${
                  showAttachMenu ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white' : ''
                }`}
                title="Add attachment"
              >
                <Plus size={20} />
              </button>

              {/* Floating Menu Popover */}
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 z-50 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl py-2 w-48 text-xs font-bold flex flex-col gap-0.5 animate-fade-in">
                  {isMobile ? (
                    <>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Camera size={16} className="text-slate-400" />
                        <span>Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Image size={16} className="text-slate-400" />
                        <span>Photos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <FileText size={16} className="text-slate-400" />
                        <span>Files</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Plus size={16} className="text-slate-400" />
                      <span>Add Photos & Files</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Premium Auto-Resizing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)} 
              placeholder={attachments.length > 0 ? "Describe these attachments..." : "Ask anything..."}
              className="flex-1 bg-transparent border-none text-[15px] sm:text-[16px] text-slate-800 dark:text-white px-2 focus:outline-none placeholder-slate-400 disabled:opacity-50 min-w-0 resize-none max-h-28 py-2.5 leading-normal scrollbar-none font-medium align-middle"
              disabled={isLoading} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (enterSends) {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  } else {
                    // Enter key defaults to inserting a new line. Shift+Enter can still submit or act naturally
                  }
                }
              }}
            />



            {/* Send circle Up Arrow button / Stop button */}
            {isLoading ? (
              <button 
                type="button" 
                onClick={onStop} 
                className="w-10 h-10 rounded-full bg-[#10A37F]/20 text-[#10A37F] hover:bg-[#10A37F]/30 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title="Stop generating"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && attachments.length === 0} 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  (input.trim() || attachments.length > 0) 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:scale-105 active:scale-95' 
                    : 'bg-slate-100 dark:bg-[#202020] text-slate-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;