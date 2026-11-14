import React, { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (token: string, username: string) => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');

      localStorage.setItem('token', data.token);
      onSuccess(data.token, data.user.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-pastel-blue w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        
        <h2 className="text-lg font-bold text-slate-800 mb-4">Welcome back to esun li awen</h2>
        
        {error && <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-pastel-darkblue text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          Need an account? <button onClick={onSwitchToRegister} className="text-pastel-darkgreen font-medium hover:underline">Register</button>
        </div>
      </div>
    </div>
  );
};