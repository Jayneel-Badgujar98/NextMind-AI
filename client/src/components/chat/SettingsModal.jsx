import React, { useState, useEffect } from 'react';
import { X, User, Settings, Trash2, Check, Sun, Moon, Monitor, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/ThemeContext';

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");

const SettingsModal = ({ activeTab, onClose, onNavigate }) => {
  const { user, updateUserPreferences, deleteUserAccount } = useAuth();
  const { themeMode, selectTheme } = useTheme();
  
  const [currentTab, setCurrentTab] = useState(activeTab || 'profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [themePref, setThemePref] = useState(user?.themePreference || 'System');
  const [enterSends, setEnterSends] = useState(user?.enterSends !== undefined ? user?.enterSends : true);
  const [instructionsWho, setInstructionsWho] = useState(user?.instructionsWho || '');

  useEffect(() => {
    if (user) {
      setThemePref(user.themePreference || 'System');
      setEnterSends(user.enterSends !== undefined ? user.enterSends : true);
      setInstructionsWho(user.instructionsWho || '');
    }
  }, [user]);

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const result = await updateUserPreferences({
        themePreference: themePref,
        enterSends,
        instructionsWho,
        language: user.language || 'English',
        temperature: user.temperature || 0.7,
        instructionsHow: user.instructionsHow || ''
      });
      if (result.success) {
        selectTheme(themePref.toLowerCase());
        setSaveFeedback('Preferences saved and synced!');
        setTimeout(() => setSaveFeedback(''), 3000);
      } else {
        setSaveFeedback('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      setSaveFeedback('Error connecting to preferences server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = confirm("WARNING: Are you absolutely sure you want to permanently delete your NextMind account? This action is completely irreversible!");
    if (!confirmation) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();
      if (result.success) {
        alert("Your account has been deleted successfully.");
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
    const confirmation = confirm("Are you sure you want to permanently delete all chat history threads? This cannot be undone!");
    if (!confirmation) return;

    try {
      const response = await fetch(`${backendUrl}/api/chats/clear`, {
        method: "DELETE",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("All chat history has been cleared.");
          window.location.reload();
        }
      } else {
        alert("Failed to clear chat database threads.");
      }
    } catch (err) {
      alert("Error connecting to server to clear chat threads.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[550px] animate-scale-up">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[220px] bg-slate-50 dark:bg-[#121212] p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2">Settings</h3>
            <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
              <button
                onClick={() => setCurrentTab('profile')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left shrink-0 cursor-pointer ${
                  currentTab === 'profile'
                    ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => setCurrentTab('settings')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left shrink-0 cursor-pointer ${
                  currentTab === 'settings'
                    ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings size={16} />
                <span>Preferences</span>
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <span className="text-[11px] text-slate-400 dark:text-zinc-600 font-bold">NextMind AI v1.0.0</span>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF] dark:bg-[#181818]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentTab === 'profile' ? 'Profile Details' : 'System Preferences'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-450 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentTab === 'profile' && (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0">
                    {user ? user.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{user ? user.name : "Guest User"}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{user ? user.email : "No account connected"}</p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-2 bg-[#10A37F]/10 text-[#10A37F] dark:text-[#10A37F] rounded-full uppercase tracking-wider">
                      {user ? (user.isDev ? 'Developer' : 'Free tier') : "Temporary Session"}
                    </span>
                  </div>
                </div>

                {/* Account Operations */}
                {user && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danger Zone</h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleClearHistory}
                        className="flex items-center justify-between p-3.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left"
                      >
                        <div>
                          <p className="font-bold">Clear Chat History</p>
                          <p className="text-xs opacity-80 mt-0.5">Delete all conversations from our servers.</p>
                        </div>
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex items-center justify-between p-3.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left disabled:opacity-50"
                      >
                        <div>
                          <p className="font-bold">Delete Account</p>
                          <p className="text-xs opacity-80 mt-0.5">Permanently erase your account and database files.</p>
                        </div>
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentTab === 'settings' && (
              <div className="space-y-5">
                {/* Theme Preference Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Light', icon: Sun },
                      { name: 'Dark', icon: Moon },
                      { name: 'System', icon: Monitor }
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = themePref === t.name;
                      return (
                        <button
                          key={t.name}
                          onClick={() => setThemePref(t.name)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                              : 'bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Keyboard / Input Preference */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl">
                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Enter Key Sends</label>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Press Enter to send messages directly. Use Shift+Enter for new line.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enterSends}
                    onChange={(e) => setEnterSends(e.target.checked)}
                    className="w-5 h-5 accent-[#10A37F] cursor-pointer"
                  />
                </div>

                {/* Memory Settings Option (ChatGPT memory style) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Memory (Remember User Info)</label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                    Provide instructions or details you want NextMind AI to remember about you across all conversations (e.g., programming language preferences, writing style, hobbies, occupation).
                  </p>
                  <textarea
                    rows={4}
                    value={instructionsWho}
                    onChange={(e) => setInstructionsWho(e.target.value)}
                    placeholder="E.g. 'I am a software engineer building React apps. Always answer with clean JavaScript code and prioritize performance.'"
                    className="w-full p-3 bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:border-[#10A37F] placeholder-slate-400 dark:placeholder-zinc-650 resize-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions (Only for Preferences tab to save) */}
          {currentTab === 'settings' && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-950/20">
              <span className="text-xs text-[#10A37F] font-semibold">{saveFeedback}</span>
              <button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="px-5 h-10 bg-[#10A37F] hover:bg-[#0E8F6E] disabled:bg-[#10A37F]/50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                <span>Save preferences</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
