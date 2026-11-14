import React from 'react';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onOpenChatDrawer?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuth, 
  isLoggedIn, 
  onLogout, 
  onOpenChatDrawer,
  onOpenSettings
}) => {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-pastel-blue sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
      <div 
        onClick={isLoggedIn ? onOpenChatDrawer : undefined} 
        className={`flex items-center space-x-3 ${isLoggedIn ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
      >
        <span className="text-2xl">🌱</span>
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">esun li awen</h1>
          <p className="text-xs text-slate-500 italic">"The exchange is secure"</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {isLoggedIn ? (
          <div className="flex items-center space-x-2">
            {/* 👈 Settings Gear Button */}
            <button
              onClick={onOpenSettings}
              title="Settings & Privacy"
              className="p-2 text-slate-600 bg-pastel-blue hover:bg-pastel-blue rounded-lg transition shadow-xs flex items-center justify-center"
            >
              Settings ⚙️
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium bg-pastel-darkgreen text-white hover:bg-emerald-600 rounded-lg shadow-sm transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-medium text-pastel-darkblue hover:bg-pastel-blue/50 rounded-lg transition"
            >
              Log In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-sm font-medium bg-pastel-darkgreen text-white hover:bg-emerald-600 rounded-lg shadow-sm transition"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
};