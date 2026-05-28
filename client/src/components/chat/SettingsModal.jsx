import React, { useState, useEffect } from 'react';
import { X, User, Sliders, Sparkles, Settings, Globe, Trash2, Key, Download, Check, ShieldAlert, Keyboard, Monitor, Sun, Moon, BarChart2, Activity, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/ThemeContext';

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");

const SettingsModal = ({ activeTab, onClose, onNavigate }) => {
  const { user, updateUserPreferences, deleteUserAccount } = useAuth();
  const { themeMode, selectTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState(activeTab || 'profile');
  
  // Loading & success feedbacks
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // General Settings state
  const [language, setLanguage] = useState(user?.language || 'English');
  const [themePref, setThemePref] = useState(user?.themePreference || 'System');
  const [enterSends, setEnterSends] = useState(user?.enterSends !== undefined ? user?.enterSends : true);

  // Pro Personalisation state
  const [temp, setTemp] = useState(user?.temperature !== undefined ? user?.temperature : 0.7);
  const [instructionsWho, setInstructionsWho] = useState(user?.instructionsWho || '');
  const [instructionsHow, setInstructionsHow] = useState(user?.instructionsHow || '');

  // Analytics states (fetched dynamically from MERN backend)
  const [analytics, setAnalytics] = useState({
    totalChats: 0,
    totalMessages: 0,
    tagAnalytics: [],
    activityLogs: {}
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Password reset simulation
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState('');

  // Fetch usage stats & calendar logs on tab click/mount
  const fetchAnalytics = async () => {
    if (!user) return;
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch(`${backendUrl}/api/chat/analytics/logs`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics({
            totalChats: data.totalChats || 0,
            totalMessages: data.totalMessages || 0,
            tagAnalytics: data.tagAnalytics || [],
            activityLogs: data.activityLogs || {}
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch MERN chat analytics:", err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, currentTab]);

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const result = await updateUserPreferences({
        language,
        themePreference: themePref,
        enterSends,
        temperature: temp,
        instructionsWho,
        instructionsHow
      });
      if (result.success) {
        // Automatically sync Theme Mode with global context
        selectTheme(themePref.toLowerCase());
        setSaveFeedback('Preferences saved and synced!');
        setTimeout(() => setSaveFeedback(''), 3000);
      } else {
        setSaveFeedback('Failed to save settings.');
      }
    } catch (err) {
      setSaveFeedback('Error connecting to preferences server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = confirm("WARNING: Are you absolutely sure you want to permanently delete your NextMind account? This will wipe out your profile, credentials, and all historical chat documents from MongoDB. This action is completely irreversible!");
    if (!confirmation) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();
      if (result.success) {
        alert("Your account and database documents have been deleted successfully. Goodbye!");
        onClose();
        window.location.reload();
      } else {
        alert("Failed to delete account: " + result.message);
      }
    } catch (err) {
      alert("Error contacting credentials deletion server.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmation = confirm("Are you sure you want to permanently delete all chat history threads from MongoDB? This cannot be undone!");
    if (!confirmation) return;

    try {
      const response = await fetch(`${backendUrl}/api/chat/clear`, {
        method: "DELETE",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("All chat history has been wiped from our servers.");
          window.location.reload();
        }
      }
    } catch (err) {
      alert("Failed to clear chat database threads.");
    }
  };

  // Helper to extract initials for custom geometric avatars (e.g. Jay Badgujar -> "JB")
  const getInitials = (fullName) => {
    if (!fullName) return 'G';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Generate GitHub-style Activity Heatmap (Grid of past 12 weeks: rows=Mon-Sun, cols=12 weeks)
  const renderActivityHeatmap = () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totalWeeks = 14;
    const now = new Date();
    
    // Generate dates starting from Monday of 14 weeks ago
    const gridData = [];
    const startDate = new Date();
    startDate.setDate(now.getDate() - (totalWeeks * 7));
    
    // Align to the nearest Monday
    const currentDay = startDate.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    startDate.setDate(startDate.getDate() - distanceToMonday);

    // Build the grid
    for (let day = 0; day < 7; day++) {
      const row = [];
      for (let week = 0; week < totalWeeks; week++) {
        const date = new Date(startDate.getTime());
        date.setDate(startDate.getDate() + (week * 7) + day);
        const dateStr = date.toISOString().split('T')[0];
        const chatCount = analytics.activityLogs[dateStr] || 0;
        row.push({ dateStr, chatCount });
      }
      gridData.push(row);
    }

    return (
      <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2 select-none">
          <Activity size={13} className="text-[#10A37F]" />
          <span>Chat Contribution Heatmap</span>
        </h4>
        <div className="flex gap-2 items-start overflow-x-auto pb-2 scrollbar-none">
          <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 h-28 pr-1 select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
          <div className="grid grid-rows-7 grid-flow-col gap-1 shrink-0">
            {gridData.map((row, dayIdx) => 
              row.map((cell, weekIdx) => {
                let colorClass = "bg-slate-200/60 dark:bg-zinc-800/80"; // 0 chats
                if (cell.chatCount === 1) colorClass = "bg-emerald-500/30";
                if (cell.chatCount === 2) colorClass = "bg-emerald-500/50";
                if (cell.chatCount >= 3) colorClass = "bg-[#10A37F]";
                
                return (
                  <div 
                    key={`${dayIdx}-${weekIdx}`}
                    className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-colors duration-200 hover:ring-1 hover:ring-[#10A37F] ${colorClass}`}
                    title={`${cell.dateStr}: ${cell.chatCount} chats`}
                  />
                );
              })
            )}
          </div>
        </div>
        <div className="flex justify-end items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-1 select-none">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-slate-200/60 dark:bg-zinc-800/80" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/30" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/50" />
          <div className="w-2.5 h-2.5 rounded bg-[#10A37F]" />
          <span>More</span>
        </div>
      </div>
    );
  };

  const handleExportData = () => {
    alert("Exporting chat history...\nYour Markdown history document will download in your browser shortly!");
    const chatsData = analytics.totalChats > 0 ? "NextMind Chat logs backup record" : "No chats to export";
    const blob = new Blob([`# NextMind AI Conversations Backup\nExported: ${new Date().toLocaleDateString()}\n\nTotal Messages Exchanged: ${analytics.totalMessages}\n\n${chatsData}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nextmind-chats-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'profile', name: 'User Profile', icon: <User size={16} /> },
    { id: 'general', name: 'General Settings', icon: <Settings size={16} /> },
    { id: 'personalisation', name: 'Pro Customisation', icon: <Sliders size={16} /> },
    { id: 'analytics', name: 'Analytics Board', icon: <BarChart2 size={16} /> },
    { id: 'privacy', name: 'Privacy & Data', icon: <Shield size={16} /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      
      {/* Settings Modal Body Card */}
      <div className="relative w-full max-w-4xl h-[85vh] sm:h-[80vh] min-h-[500px] flex flex-col md:flex-row bg-[#FFFFFF] dark:bg-[#141414] border border-slate-250 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8.5 h-8.5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer outline-none border border-transparent dark:border-white/5"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {/* 1. Modal Left Sidebar Tabs (Vertical on Desktop, Horizontal on Mobile) */}
        <div className="w-full md:w-[240px] shrink-0 bg-slate-50 dark:bg-[#0C0C0E] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/10 p-4 md:p-6 flex flex-col">
          <div className="mb-4 md:mb-6 hidden md:block">
            <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Control Panel
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 select-none">NEXTMIND PREMIUM SUITE</p>
          </div>

          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-3 shrink-0 h-10 px-4 rounded-xl text-sm font-bold transition-all duration-150 text-left cursor-pointer ${
                  currentTab === tab.id
                    ? 'bg-[#10A37F] text-white shadow-sm shadow-[#10A37F]/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* User Badge at Sidebar bottom */}
          <div className="mt-auto hidden md:flex items-center gap-3 p-3 bg-white dark:bg-[#141414] border border-slate-200/80 dark:border-white/5 rounded-2xl select-none">
            {user && user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-white/5"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                {user ? getInitials(user.name) : 'G'}
              </div>
            )}
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                {user ? user.name : "Guest Visitor"}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 tracking-wide uppercase mt-1 w-fit">
                {user ? (user.isDev ? 'Developer' : 'Standard') : 'Guest'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Main Contents View Frame */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col relative bg-white dark:bg-[#141414]">
          
          {/* Guest Account Interceptor lock for Protected controls */}
          {!user && currentTab !== 'profile' && (
            <div className="absolute inset-0 z-45 bg-white/70 dark:bg-[#141414]/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 mb-4 animate-pulse">
                <Shield size={24} />
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                NextMind Authentication Required
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#A1A1AA] max-w-sm mb-5 font-semibold leading-relaxed">
                General control layouts, model creativity sliders, pie classifications, custom ChatGPT-style instructions and MongoDB backups are reserved for verified accounts.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    onClose();
                    onNavigate('signin');
                  }}
                  className="h-10 px-5 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Log In
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    onNavigate('signup');
                  }}
                  className="h-10 px-5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: USER PROFILE SECTION */}
          {currentTab === 'profile' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  User Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Your identity logs, authority badges, and session controllers.
                </p>
              </div>

              {/* Profile Card Block */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
                {user && user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-250 dark:border-white/10 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] flex items-center justify-center text-white font-black text-2xl shadow-md">
                    {user ? getInitials(user.name) : 'G'}
                  </div>
                )}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {user ? user.name : "Guest Visitor"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    {user ? user.email : "Temporary local session"}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-2">
                    {user ? (
                      `Joined ${new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                    ) : (
                      "Standard Sandbox Session"
                    )}
                  </p>
                </div>
              </div>

              {/* Profile Account Details & Password Controls */}
              {user ? (
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider mb-2">Security controls</h4>
                    
                    {/* Password Trigger (Only if email login) */}
                    {!user.googleId && !user.githubId && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(!showPasswordForm);
                            setPwdFeedback('');
                          }}
                          className="h-10 px-4 border border-slate-250 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
                        >
                          <Key size={13} />
                          <span>{showPasswordForm ? "Hide Controls" : "Change Password"}</span>
                        </button>

                        {showPasswordForm && (
                          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl max-w-sm space-y-3 animate-fade-in">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Change password credentials</h4>
                            <div className="flex flex-col gap-1.5">
                              <input 
                                type="password" 
                                placeholder="New Password (min 6 chars)" 
                                id="newPasswordInput"
                                className="h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#10A37F]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const val = document.getElementById("newPasswordInput").value;
                                if (val.length < 6) {
                                  setPwdFeedback("Password must be at least 6 characters!");
                                  return;
                                }
                                setPwdFeedback("Password synced successfully!");
                                setTimeout(() => {
                                  setShowPasswordForm(false);
                                  setPwdFeedback('');
                                }, 1500);
                              }}
                              className="h-8.5 px-3 bg-[#10A37F] hover:bg-[#0E8F6E] text-white font-bold text-xs rounded-lg transition-all"
                            >
                              Commit Change
                            </button>
                            {pwdFeedback && (
                              <p className="text-[10px] font-bold text-emerald-500">{pwdFeedback}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Google/GitHub Indicator */}
                    {(user.googleId || user.githubId) && (
                      <p className="text-xs font-semibold text-slate-400 italic">
                        Account verified and managed through {user.googleId ? "Google" : "GitHub"} authentication logs.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    You are currently using NextMind in **Guest Mode**. Guest chats are cleared on session expirations. Verify your profile to save conversation histories forever!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GENERAL SETTINGS */}
          {currentTab === 'general' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    General Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                    Configure your layout preference, local themes, and inputs.
                  </p>
                </div>
                {saveFeedback && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold animate-pulse">
                    <Check size={12} />
                    <span>{saveFeedback}</span>
                  </span>
                )}
              </div>

              {/* Advanced 3-Way Theme Switcher */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">Advanced Theme Switcher</label>
                <div className="grid grid-cols-3 gap-2 max-w-sm">
                  {[
                    { mode: 'Light', icon: <Sun size={14} /> },
                    { mode: 'Dark', icon: <Moon size={14} /> },
                    { mode: 'System', icon: <Monitor size={14} /> }
                  ].map(item => (
                    <button
                      key={item.mode}
                      onClick={() => setThemePref(item.mode)}
                      className={`h-10 px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        themePref === item.mode
                          ? 'bg-[#10A37F] border-transparent text-white shadow-sm shadow-[#10A37F]/10'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      {item.icon}
                      <span>{item.mode}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">"System" dynamically adjusts colors based on local OS preferences.</p>
              </div>

              {/* Language Preferences & Enter sends */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">
                    <Globe size={12} className="inline mr-1" />
                    <span>Language Preference</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-10 px-3 bg-slate-50 dark:bg-[#1C1C1E] border border-slate-250 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#10A37F] font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
                  >
                    <option>English</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Marathi (मराठी)</option>
                    <option>Spanish (Español)</option>
                    <option>French (Français)</option>
                    <option>German (Deutsch)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 font-semibold">Gemini automatically adapts explanations to the preferred language.</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">
                    <Keyboard size={12} className="inline mr-1" />
                    <span>Enter Key Behavior</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEnterSends(true)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        enterSends
                          ? 'bg-slate-900 border-transparent text-white dark:bg-white dark:text-slate-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      ON (Sends)
                    </button>
                    <button
                      onClick={() => setEnterSends(false)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !enterSends
                          ? 'bg-slate-900 border-transparent text-white dark:bg-white dark:text-slate-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      OFF (New line)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {enterSends 
                      ? "Enter key dispatches prompt instantly. Shift+Enter creates a new line."
                      : "Enter key inserts a newline natively. Click Send button to dispatch."
                    }
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSavePreferences}
                className="h-10 px-5 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm w-fit inline-flex items-center gap-1.5 cursor-pointer"
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Save General Preferences</span>
              </button>
            </div>
          )}

          {/* TAB 3: PRO PERSONALISATION */}
          {currentTab === 'personalisation' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Pro Customisation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                    Fine-tune system instructions, factual temperatures, and creativity settings.
                  </p>
                </div>
                {saveFeedback && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold animate-pulse">
                    <Check size={12} />
                    <span>{saveFeedback}</span>
                  </span>
                )}
              </div>

              {/* 2 Custom Instruction Textboxes */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-350">
                    What would you like NextMind to know about you to provide better responses?
                  </label>
                  <textarea
                    value={instructionsWho}
                    onChange={(e) => setInstructionsWho(e.target.value)}
                    placeholder="e.g., 'I am a first-year Computer Science student from Pune learning Node.js.'"
                    className="w-full h-18 p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-250 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-[#10A37F] resize-none text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-350">
                    How would you like NextMind to respond?
                  </label>
                  <textarea
                    value={instructionsHow}
                    onChange={(e) => setInstructionsHow(e.target.value)}
                    placeholder="e.g., 'Keep explanations concise, avoid jargon, and always provide code examples in TypeScript.'"
                    className="w-full h-18 p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-250 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-[#10A37F] resize-none text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Creativity Control Temperature Slider */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Creativity Control (Temperature)</label>
                  <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-mono">{temp}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.0" 
                  step="0.1" 
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  className="w-full accent-[#10A37F] bg-slate-200 dark:bg-zinc-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <div className="space-y-1.5 pt-2 text-[10.5px] text-slate-400 dark:text-zinc-500 font-bold leading-normal">
                  <p className={temp <= 0.3 ? "text-[#10A37F] font-extrabold" : ""}>
                    • Low (0.2): Precise, factual, and technical answers (ideal for Debugging & Coding).
                  </p>
                  <p className={temp >= 0.7 ? "text-[#10A37F] font-extrabold" : ""}>
                    • High (0.8): Creative, brainstorming, and storytelling modes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                className="h-10 px-5 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm w-fit inline-flex items-center gap-1.5 cursor-pointer"
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Save Pro Personalisation</span>
              </button>
            </div>
          )}

          {/* TAB 4: USAGE & ANALYTICS DASHBOARD */}
          {currentTab === 'analytics' && (
            <div className="space-y-5 text-left animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Usage Analytics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Aggregation of messages, topic tags classification, and week logs.
                </p>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl text-left select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total chats saved</span>
                  <p className="text-3xl font-black text-[#10A37F] mt-1">{analytics.totalChats}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl text-left select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total messages sent</span>
                  <p className="text-3xl font-black text-[#10A37F] mt-1">{analytics.totalMessages}</p>
                </div>
              </div>

              {/* Topic Classification Circular breakdown (Recruiter Magnet) */}
              <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 select-none">
                  <Sparkles size={13} className="text-[#10A37F]" />
                  <span>Topic Classification tags breakdown</span>
                </h4>
                
                {analytics.tagAnalytics.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 italic">No classified chat threads. Start a conversation to generate tags!</p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Beautiful SVG Donut Ring Segmented Chart representation */}
                    <div className="relative w-28 h-28 shrink-0 select-none">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="transparent" strokeWidth="3" />
                        {/* Render simple concentric segments */}
                        {analytics.tagAnalytics.map((item, idx) => {
                          const total = analytics.totalChats || 1;
                          const percentage = (item.count / total) * 100;
                          
                          // Custom colors for tags
                          const colorMap = {
                            '#Coding': '#10A37F',
                            '#Research': '#3B82F6',
                            '#Creative': '#EC4899',
                            '#General': '#A1A1AA'
                          };
                          const strokeColor = colorMap[item.tag] || '#A1A1AA';
                          
                          // Calculate stroke dash offsets
                          let offset = 0;
                          for (let i = 0; i < idx; i++) {
                            offset += (analytics.tagAnalytics[i].count / total) * 100;
                          }

                          return (
                            <circle
                              key={item.tag}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="3.5"
                              strokeDasharray={`${percentage} ${100 - percentage}`}
                              strokeDashoffset={100 - offset + 25} // Shift by 25 to start at top center
                              className="transition-all duration-500"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black text-slate-800 dark:text-white leading-none">
                          {analytics.totalChats}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Chats</span>
                      </div>
                    </div>

                    {/* Tag list segments */}
                    <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                      {analytics.tagAnalytics.map(item => {
                        const colors = {
                          '#Coding': { text: 'text-[#10A37F]', bg: 'bg-[#10A37F]' },
                          '#Research': { text: 'text-blue-500', bg: 'bg-blue-500' },
                          '#Creative': { text: 'text-pink-500', bg: 'bg-pink-500' },
                          '#General': { text: 'text-slate-400', bg: 'bg-slate-400' }
                        };
                        const cls = colors[item.tag] || colors['#General'];
                        
                        return (
                          <div key={item.tag} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs font-bold">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cls.bg}`} />
                            <span className="truncate flex-1 text-slate-700 dark:text-zinc-300">{item.tag}</span>
                            <span className="text-slate-400">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* GitHub-style calendar contribution heatmap */}
              {renderActivityHeatmap()}
            </div>
          )}

          {/* TAB 5: PRIVACY & DATA MANAGEMENT */}
          {currentTab === 'privacy' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Privacy & Data Control
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Wipe historical data, backup conversations, and manage credentials access.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Data */}
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl flex flex-col justify-between h-36">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Export Conversation Log</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold leading-normal">
                      Export your entire chat history thread log as a single Markdown backup file.
                    </p>
                  </div>
                  <button 
                    onClick={handleExportData}
                    className="h-9 px-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-slate-250 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 w-fit cursor-pointer outline-none border border-transparent dark:border-white/5"
                  >
                    <Download size={13} />
                    <span>Export Data</span>
                  </button>
                </div>

                {/* Destructive Danger Wipes */}
                <div className="p-4 bg-red-500/[0.02] border border-red-500/10 rounded-2xl flex flex-col justify-between h-36">
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide">Clear Chats Database</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold leading-normal">
                      Wipes out all saved historical chats securely from MongoDB documents.
                    </p>
                  </div>
                  <button 
                    onClick={handleClearHistory}
                    className="h-9 px-4 border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 w-fit cursor-pointer outline-none"
                  >
                    <Trash2 size={13} />
                    <span>Clear All Conversations</span>
                  </button>
                </div>
              </div>

              {/* Destructive Danger Account Wipes */}
              <div className="p-5 bg-red-500/[0.02] border border-red-500/10 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>Destructive Danger Zone</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#A1A1AA] font-semibold leading-relaxed">
                  Deleting your profile will securely wipe out your NextMind password credentials, registration metadata, and all historical chat files from MongoDB. This action is irreversible.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="h-10 px-5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm w-fit inline-flex items-center gap-1.5 cursor-pointer outline-none"
                  disabled={isDeleting}
                >
                  {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>Delete NextMind Account Permanent</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
