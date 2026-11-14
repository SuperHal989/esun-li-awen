import React, { useEffect, useState } from 'react';

interface MatchUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  sharedCount: number;
  sharedCategories: string[];
  compatibilityScore: number;
  requestStatus: 'none' | 'pending' | 'incoming';
}

interface MatchPageProps {
  token: string;
  currentUser: string;
}

export const MatchPage: React.FC<MatchPageProps> = ({ token, currentUser }) => {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/match', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load matches');
      setMatches(data.matches);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleAddFriend = async (targetId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/match/add-friend/${targetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'friends') {
          // If it became mutual (accepting an incoming request), remove them from discovery
          setMatches(prev => prev.filter(m => m.id !== targetId));
        } else {
          // Otherwise, transition to pending
          setMatches(prev =>
            prev.map(m => (m.id === targetId ? { ...m, requestStatus: 'pending' } : m))
          );
        }
      }
    } catch (err) {
      console.error('Failed to add friend:', err);
    }
  };

  const handleCancelRequest = async (targetId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/match/cancel-request/${targetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Revert back to 'none' so they can add them again if they want
        setMatches(prev =>
          prev.map(m => (m.id === targetId ? { ...m, requestStatus: 'none' } : m))
        );
      }
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-pastel-blue gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {currentUser} 🌱</h2>
          <p className="text-xs text-slate-500">
            Discovering connections privately via blind HMAC-SHA256 hash overlap & weight proximity.
          </p>
        </div>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 bg-pastel-blue text-pastel-darkblue rounded-xl text-xs font-semibold hover:bg-sky-200 transition"
        >
          Refresh Matches
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">
          Comparing blind cryptographic hashes...
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pastel-blue p-12 text-center shadow-xs">
          <div className="text-4xl mb-3">🍃</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Nobody available right now</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            There are currently no unfriended users who share one or more of your interests. Check back later as new members join!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl border border-pastel-blue p-6 shadow-xs flex flex-col justify-between hover:border-pastel-darkblue transition"
            >
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  {match.avatarUrl ? (
                    <img
                      src={match.avatarUrl}
                      alt={match.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-pastel-green"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-pastel-blue text-pastel-darkblue flex items-center justify-center font-bold text-lg">
                      {match.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{match.name}</h3>
                    <p className="text-xs text-slate-400">@{match.username}</p>
                  </div>
                </div>

                <div className="bg-pastel-slate rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Shared Interests:</span>
                    <span className="font-bold text-pastel-darkgreen">
                      {match.sharedCount} {match.sharedCount === 1 ? 'match' : 'matches'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Weight Alignment Score:</span>
                    <span className="font-bold text-pastel-darkblue">
                      {match.compatibilityScore} pts
                    </span>
                  </div>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {match.sharedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 bg-pastel-green text-pastel-darkgreen text-[11px] font-medium rounded-full capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Action Buttons based on requestStatus */}
              {match.requestStatus === 'incoming' ? (
                <button
                  onClick={() => handleAddFriend(match.id)}
                  className="w-full py-2.5 bg-amber-500 text-white font-medium text-sm rounded-xl hover:bg-amber-600 transition shadow-xs animate-pulse"
                >
                  ✨ Accept Incoming Request
                </button>
              ) : match.requestStatus === 'pending' ? (
                <button
                  onClick={() => handleCancelRequest(match.id)}
                  className="w-full py-2.5 bg-pastel-blue text-pastel-darkblue font-medium text-sm rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-pastel-blue transition shadow-xs group"
                >
                  <span className="group-hover:hidden">⏳ Request Pending</span>
                  <span className="hidden group-hover:inline">✕ Cancel Request</span>
                </button>
              ) : (
                <button
                  onClick={() => handleAddFriend(match.id)}
                  className="w-full py-2.5 bg-pastel-darkgreen text-white font-medium text-sm rounded-xl hover:bg-emerald-600 transition shadow-xs"
                >
                  + Send Friend Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};