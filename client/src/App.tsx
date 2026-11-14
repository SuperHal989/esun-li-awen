import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { RegisterPage } from './components/RegisterPage';
import { LoginModal } from './components/LoginModal';
import { MatchPage } from './components/MatchPage';
import { ChatDrawer } from './components/ChatDrawer'; // 👈 Import ChatDrawer
import { SettingsModal } from './components/SettingsModal'; // 👈 Import SettingsModal

export function App() {
  const [view, setView] = useState<'landing' | 'register'>('landing');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('username'));
  const [userToken, setUserToken] = useState<string | null>(localStorage.getItem('token'));
  const [isChatOpen, setIsChatOpen] = useState(false); // 👈 Drawer toggle state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 👈 Settings modal toggle state

  const handleAuthSuccess = (token: string, username: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setUserToken(token);
    setCurrentUser(username);
    setShowLoginModal(false);
    setView('landing');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUserToken(null);
    setCurrentUser(null);
    setView('landing');
    setShowLoginModal(false);
    setIsSettingsOpen(false);
    setIsChatOpen(false);
  };

  return (
    <div className="min-h-screen bg-pastel-slate">
      <Navbar 
        isLoggedIn={currentUser !== null}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          setUserToken(null);
          setCurrentUser(null);
          setView('landing');
          setShowLoginModal(false);
        }}
        onOpenAuth={(mode) => {
          if (mode === 'login') setShowLoginModal(true);
          else setView('register');
        }}
        onOpenChatDrawer={() => setIsChatOpen(true)} // 👈 Opens drawer when sprout is clicked
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {currentUser && userToken ? (
        <MatchPage token={userToken} currentUser={currentUser} />
      ) : view === 'landing' ? (
        <LandingPage onGetStarted={() => setView('register')} />
      ) : (
        <RegisterPage 
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => { setView('landing'); setShowLoginModal(true); }}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => { setShowLoginModal(false); setView('register'); }}
        />
      )}

      {/* 👈 Render Chat Drawer when user is logged in */}
      {currentUser && userToken && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          token={userToken}
          currentUserId="" 
        />
      )}
      {currentUser && userToken && (
        <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        token={userToken}
        onAccountDeleted={handleLogout}
      />
      )}
    </div>
  );
}

export default App;