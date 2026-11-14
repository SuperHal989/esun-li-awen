import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onAccountDeleted: () => void;
}

interface InterestCategory {
  category: string;
  count: number;
}

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const message = response.status === 404
      ? 'Settings API route not found. Restart the backend server to load the latest routes.'
      : `Expected a JSON response from the server (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return response.json();
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, token, onAccountDeleted }) => {
  const [categories, setCategories] = useState<InterestCategory[]>([]);
  const [newInterestText, setNewInterestText] = useState('');
  const [newWeight, setNewWeight] = useState(3.0);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const loadCategories = async () => {
      setLoadingCategories(true);
      setError('');

      try {
        const res = await fetch('http://localhost:5000/api/settings/categories', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.error || 'Failed to load interest categories.');
        setCategories(data.categories);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load interest categories.');
      } finally {
        setLoadingCategories(false);
      }
    };

    void loadCategories();
    return () => controller.abort();
  }, [isOpen, token]);

  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterestText.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/settings/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rawText: newInterestText, weight: newWeight })
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to add interest');

      setCategories(data.categories);
      setNewInterestText('');
      setSuccess('✨ New interest vectorized & added successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete all interests in category "${categoryName}"?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/settings/category/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to delete category.');
      setCategories(data.categories);
      setSuccess(`🗑️ Category "${categoryName}" removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("⚠️ DANGER: Are you sure you want to delete your account? This action cannot be undone.")) return;
    if (!window.confirm("Final confirmation: Delete account and wipe all encrypted messages & requests?")) return;

    try {
      const res = await fetch('http://localhost:5000/api/settings/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.clear();
        onAccountDeleted();
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-pastel-blue overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-pastel-blue bg-pastel-slate flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-bold text-slate-800">Privacy & Account Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2">
            ×
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs">{success}</div>}

          {/* 1. Add New Interest */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Add New Interest</h4>
            <form onSubmit={handleAddInterest} className="space-y-3 bg-pastel-slate/50 p-4 rounded-xl border border-pastel-blue">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Interest Name (auto-vectorized)</label>
                <input
                  type="text"
                  value={newInterestText}
                  onChange={e => setNewInterestText(e.target.value)}
                  placeholder="e.g., Rock climbing, Synthesizers..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-pastel-darkblue bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Initial Weight: {newWeight}</label>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(parseFloat(e.target.value))}
                  className="w-full accent-pastel-darkgreen"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-pastel-darkgreen text-white font-medium text-xs rounded-xl hover:bg-emerald-600 transition shadow-xs"
              >
                {loading ? 'Vectorizing & Snapping...' : '+ Add Interest'}
              </button>
            </form>
          </div>

          {/* 2. Manage / Delete Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Your Interest Categories</h4>
            {loadingCategories ? (
              <p className="text-xs text-slate-400 italic">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No interests added yet.</p>
            ) : (
              <div className="space-y-2">
                {categories.map(({ category, count }) => (
                  <div key={category} className="flex justify-between items-center p-3 rounded-xl border border-pastel-blue bg-white">
                    <span className="font-medium text-slate-800 capitalize">{category}</span>
                    <span className="text-xs text-slate-500">{count} {count === 1 ? 'interest' : 'interests'}</span>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition"
                    >
                      Delete Category
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Account Deletion */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-red-600 text-xs uppercase tracking-wider">Danger Zone</h4>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 text-xs">Delete Account</p>
                <p className="text-[11px] text-slate-500">Permanently remove your profile, data, and messages.</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white font-medium text-xs rounded-xl hover:bg-red-700 transition shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};