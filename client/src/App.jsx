import React, { useState } from 'react';
import ChatPage from './pages/ChatPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useAuth } from './context/authContext';
import { Compass } from 'lucide-react';

function App() {
  const [view, setView] = useState('chat'); // 'chat' | 'signin' | 'signup'
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F5] dark:bg-[#0D0D0D] transition-colors duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#10A37F] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#10A37F]/20 animate-pulse">
          <Compass size={32} className="animate-spin-slow" />
        </div>
        <p className="text-sm font-semibold text-[#52525B] dark:text-[#A1A1AA] uppercase tracking-widest animate-pulse">
          Loading NextMind...
        </p>
      </div>
    );
  }

  const navigateTo = (newView) => {
    setView(newView);
  };

  if (view === 'signin') {
    return <SignIn onNavigate={navigateTo} />;
  }
  
  if (view === 'signup') {
    return <SignUp onNavigate={navigateTo} />;
  }

  return <ChatPage onNavigate={navigateTo} />;
}

export default App;