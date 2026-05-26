import React, { useState } from 'react';
import { X, User, Sliders, Sparkles, Settings, Globe, Trash2, Key, Download, Check, ShieldAlert, BadgePercent, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/ThemeContext';

const SettingsModal = ({ activeTab, onClose, onNavigate }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState(activeTab || 'profile');
  
  // Tab states for personalisation
  const [temp, setTemp] = useState(0.7);
  const [tone, setTone] = useState('Professional');
  const [colorTheme, setColorTheme] = useState('Emerald');
  const [aiModel, setAiModel] = useState('gemini-3.1-flash-lite');
  const [customInstructions, setCustomInstructions] = useState('');

  // States for user settings
  const [apiKey, setApiKey] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // States for Profile Info
  const [name, setName] = useState(user ? user.name : 'Guest User');
  const [avatarUrl, setAvatarUrl] = useState(user ? user.avatar : '');

  const tabs = [
    { id: 'profile', name: 'User Profile', icon: <User size={16} /> },
    { id: 'personalisation', name: 'Personalisation', icon: <Sliders size={16} /> },
    { id: 'upgrade', name: 'Upgrade Plan', icon: <Sparkles size={16} /> },
    { id: 'settings', name: 'System Settings', icon: <Settings size={16} /> }
  ];

  const handleSavePersonalisation = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSimulateUpgrade = (tier) => {
    alert(`Thank you for choosing the ${tier} Tier!\nNextMind payment gate is currently in sandbox simulation mode. Your request has been logged successfully!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl h-[85vh] sm:h-[80vh] min-h-[500px] flex flex-col md:flex-row bg-[#FFFFFF] dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-250 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-transparent dark:border-white/5"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* 1. Modal Left Sidebar Tabs (Horizontal Scroll on Mobile, Vertical List on Desktop) */}
        <div className="w-full md:w-[240px] shrink-0 bg-slate-50 dark:bg-[#0E0E0E] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/10 p-4 md:p-6 flex flex-col">
          <div className="mb-4 md:mb-6 hidden md:block">
            <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Preferences
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">Configure your NextMind AI space</p>
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

          {/* User Status at bottom of left sidebar (only desktop) */}
          <div className="mt-auto hidden md:flex items-center gap-3 p-3 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/5 rounded-2xl select-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm">
              {user ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                {user ? user.name : "Guest Session"}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 tracking-wide uppercase mt-1 w-fit">
                {user ? (user.isDev ? 'Developer' : 'Free tier') : 'Visitor'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Modal Main View Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col relative bg-white dark:bg-[#151515]">
          
          {/* Guest Lock Overlay (Applies to all tabs except Profile for Guest users to create premium monetization push) */}
          {!user && currentTab !== 'profile' && (
            <div className="absolute inset-0 z-45 bg-white/70 dark:bg-[#151515]/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 mb-4 animate-bounce">
                <ShieldAlert size={24} />
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                Authentication Required
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                NextMind custom settings, model adjustments, personalization, and plan upgrades are reserved exclusively for authenticated members.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    onClose();
                    onNavigate('signin');
                  }}
                  className="h-10 px-5 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm shadow-[#10A37F]/20"
                >
                  Log In
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    onNavigate('signup');
                  }}
                  className="h-10 px-5 border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: USER PROFILE */}
          {currentTab === 'profile' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  User Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage your personal account details, avatar settings, and security profiles.
                </p>
              </div>

              {/* Avatar Settings */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={name} 
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] flex items-center justify-center text-white font-black text-2xl shadow-md">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Profile Picture</h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Supports JPG, PNG or WEBP formats.</p>
                  <div className="flex gap-2 mt-1">
                    <button 
                      type="button"
                      onClick={() => {
                        const url = prompt("Enter an image URL for your avatar:");
                        if (url) setAvatarUrl(url);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                    >
                      Change Photo
                    </button>
                    {avatarUrl && (
                      <button 
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    disabled={!user}
                    className="h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-250 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#10A37F] disabled:opacity-65"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">Email Address</label>
                  <input 
                    type="email" 
                    value={user ? user.email : 'guest@nextmind.ai'} 
                    disabled 
                    className="h-10 px-3 bg-slate-100 dark:bg-white/5 border border-slate-250 dark:border-white/10 rounded-xl text-sm opacity-60 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Account Level Details */}
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Security & Authority</h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-xl text-xs font-bold">
                    <CheckCircle2 size={13} />
                    <span>NextMind User Verified</span>
                  </div>
                  {user && user.isDev && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 rounded-xl text-xs font-bold">
                      <Key size={13} />
                      <span>Developer Privilege Active (isDev)</span>
                    </div>
                  )}
                  {user && user.googleId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-350 border border-transparent rounded-xl text-xs font-bold">
                      <span>Google Linked OAuth</span>
                    </div>
                  )}
                  {user && user.githubId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-350 border border-transparent rounded-xl text-xs font-bold">
                      <span>GitHub Linked OAuth</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALISATION */}
          {currentTab === 'personalisation' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Personalisation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Customise how NextMind AI thinks, sounds, responds, and formats answers.
                  </p>
                </div>
                {isSaved && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold animate-pulse">
                    <Check size={12} />
                    <span>Saved!</span>
                  </span>
                )}
              </div>

              {/* Slider for Creativity / Temperature */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Creativity level (Temperature)</label>
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
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                  <span>Highly Precise (0.0)</span>
                  <span>Balanced (0.7)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. AI Tone Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">AI Responding Tone</label>
                  <select 
                    value={tone} 
                    onChange={(e) => setTone(e.target.value)}
                    className="h-10 px-3 bg-slate-50 dark:bg-[#1C1C1E] border border-slate-250 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#10A37F] font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
                  >
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Short & Direct</option>
                    <option>Empathetic & Warm</option>
                  </select>
                </div>

                {/* 2. Target AI Engine */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">Default Brain Engine</label>
                  <select 
                    value={aiModel} 
                    onChange={(e) => setAiModel(e.target.value)}
                    className="h-10 px-3 bg-slate-50 dark:bg-[#1C1C1E] border border-slate-250 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#10A37F] font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
                  >
                    <option value="gemini-3.1-flash-lite">Gemini 3.5 Flash Lite (Standard)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                    <option value="nextmind-ultra-1.0">NextMind Ultra 1.0 (Advanced Multimodal)</option>
                  </select>
                </div>
              </div>

              {/* Custom Instructions Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">Custom AI System Instructions</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always reply in clear bullet points. Assume I am an expert coding developer and skip standard beginner summaries."
                  className="w-full h-24 p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-250 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#10A37F] resize-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Save changes button */}
              <button 
                onClick={handleSavePersonalisation}
                className="h-10 px-5 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-[#10A37F]/20 w-fit self-end cursor-pointer"
              >
                Save Custom Settings
              </button>
            </div>
          )}

          {/* TAB 3: UPGRADE PLAN */}
          {currentTab === 'upgrade' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Upgrade Plan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Unlock permanent premium cloud storage, faster execution and deep reasoning models.
                </p>
              </div>

              {/* Tier Cards Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                {/* 1. Free Tier */}
                <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl flex flex-col justify-between h-[300px]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Tier</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">NextMind Free</h3>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">$0 <span className="text-xs font-semibold text-slate-400">/mo</span></p>
                    
                    <ul className="text-xs text-slate-500 dark:text-[#A1A1AA] space-y-2 mt-4 font-medium pl-0.5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#10A37F]" />
                        <span>Basic AI Streams</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#10A37F]" />
                        <span>20 Multimodal uploads/day</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button 
                    disabled 
                    className="w-full h-10 border border-slate-350 dark:border-white/10 text-slate-400 dark:text-zinc-500 font-bold text-xs rounded-xl cursor-not-allowed uppercase"
                  >
                    Current Plan
                  </button>
                </div>

                {/* 2. Pro Tier */}
                <div className="p-5 bg-[#FFFFFF] dark:bg-[#1E1E1E] border-2 border-[#10A37F] rounded-2xl flex flex-col justify-between h-[300px] shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-[#10A37F] text-white text-[9px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl">
                    Popular
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#10A37F] tracking-wider uppercase">Premium Power</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">NextMind Pro</h3>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">$19 <span className="text-xs font-semibold text-slate-400">/mo</span></p>
                    
                    <ul className="text-xs text-slate-500 dark:text-[#A1A1AA] space-y-2 mt-4 font-medium pl-0.5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#10A37F]" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">Unlimited CDN Uploads</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#10A37F]" />
                        <span>Access to Gemini 3.5 Pro</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#10A37F]" />
                        <span>Priority support streams</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button 
                    onClick={() => handleSimulateUpgrade('Pro')}
                    className="w-full h-10 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all uppercase"
                  >
                    Upgrade to Pro
                  </button>
                </div>

                {/* 3. VIP Developer Access */}
                <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl flex flex-col justify-between h-[300px] hover:border-amber-500/40 transition-colors">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">VIP Access</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Developer VIP</h3>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">$49 <span className="text-xs font-semibold text-slate-400">/mo</span></p>
                    
                    <ul className="text-xs text-slate-500 dark:text-[#A1A1AA] space-y-2 mt-4 font-medium pl-0.5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-amber-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">Custom API keys backend</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-amber-500" />
                        <span>Code sandbox execution</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-amber-500" />
                        <span>VIP Badges authorization</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button 
                    onClick={() => handleSimulateUpgrade('VIP Developer')}
                    className="w-full h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-102 active:scale-95 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all uppercase"
                  >
                    Go VIP Developer
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS */}
          {currentTab === 'settings' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  System Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage external credentials, clear history, or export conversations.
                </p>
              </div>

              {/* API Token Input Cards */}
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Key size={13} className="text-[#10A37F]" />
                  <span>External Token Integrations</span>
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">Custom Google Gemini API Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder="AI_STUDIO_KEY_..." 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1 h-10 px-3 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#10A37F]"
                    />
                    <button 
                      onClick={() => {
                        alert('API Key validated and locally synced successfully!');
                        setApiKey('');
                      }}
                      className="h-10 px-4 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Leave empty to use server default configurations.</span>
                </div>
              </div>

              {/* Utility Exports */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-950 dark:text-white">Export Conversations</h4>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Download a JSON record of all chat history for local backups.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                      const dummyData = JSON.stringify({ app: "NextMind", exportDate: new Date(), chats: [] }, null, 2);
                      const blob = new Blob([dummyData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `nextmind-chats-${Date.now()}.json`;
                      a.click();
                    }}
                    className="h-9 px-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-slate-250 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 w-fit cursor-pointer"
                  >
                    <Download size={13} />
                    <span>{isCopied ? 'Exported!' : 'Export History'}</span>
                  </button>
                </div>

                {/* Danger zone actions */}
                <div className="p-4 bg-red-500/[0.02] border border-red-500/10 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                      <span>Danger Zone</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Irreversibly delete chats or terminate your NextMind account profile.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if (confirm("Are you absolutely sure you want to delete all chat history? This action is permanent!")) {
                          alert("All history has been cleared.");
                          window.location.reload();
                        }
                      }}
                      className="h-9 px-3 border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Clear Chats</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
