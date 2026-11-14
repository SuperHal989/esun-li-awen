import React, { useState } from 'react';

interface RegisterPageProps {
  onSuccess: (token: string, username: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state across all steps
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  
  const [rawInterestInput, setRawInterestInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Format interests into an array of strings for your Gemini + Voyage pipeline
      const interestsArray = rawInterestInput
        ? rawInterestInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        username,
        password,
        name,
        birthday,
        avatarUrl,
        interests: interestsArray
      };

      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Automatically log them in right after successful registration to get a token
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const loginData = await loginRes.json();

      if (loginRes.ok) {
        localStorage.setItem('token', loginData.token);
        onSuccess(loginData.token, loginData.user.username);
      } else {
        onSwitchToLogin();
      }
    } catch (err: any) {
      setError(err.message);
      setStep(1); // send back to start if error occurs
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-lg border border-pastel-blue p-8">
      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Create Secure Account</h2>
          <p className="text-xs text-slate-500">Step {step} of 3</p>
        </div>
        <div className="flex space-x-1">
          <span className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-pastel-darkgreen' : 'bg-slate-200'}`} />
          <span className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-pastel-darkgreen' : 'bg-slate-200'}`} />
          <span className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-pastel-darkgreen' : 'bg-slate-200'}`} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* STEP 1: Credentials & Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pastel-darkblue"
              placeholder="e.g. toki_coder"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pastel-darkblue"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pastel-darkblue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pastel-darkblue"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            disabled={!username || !password || !name || !birthday}
            onClick={() => setStep(2)}
            className="w-full py-2.5 bg-pastel-darkgreen text-white font-medium text-sm rounded-xl hover:bg-emerald-600 transition shadow-sm disabled:opacity-50"
          >
            Next: Add Interests →
          </button>
        </div>
      )}

      {/* STEP 2: AI Interest Drop */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              What are your hobbies or interests?
            </label>
            <textarea
              value={rawInterestInput}
              onChange={(e) => setRawInterestInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pastel-darkblue"
              placeholder="e.g. Hiking on weekends, Competitive Pokémon, reading sci-fi novels"
              rows={4}
            />
            <p className="text-[11px] text-pastel-darkgreen mt-2 bg-pastel-green p-2 rounded-lg">
              🤖 Google Gemini will normalize these into canonical tags, and Voyage AI will vectorize them. Zero plaintext data is saved to disk!
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-2.5 bg-slate-100 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-200 transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-2/3 py-2.5 bg-pastel-darkgreen text-white font-medium text-sm rounded-xl hover:bg-emerald-600 transition shadow-sm"
            >
              Next: Avatar →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Avatar & Finalize */}
      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Avatar Image URL <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pastel-darkblue"
              placeholder="https://example.com/avatar.jpg"
            />
            {avatarUrl && (
              <div className="mt-3 flex justify-center">
                <img src={avatarUrl} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover border-2 border-pastel-blue" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
              </div>
            )}
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-2.5 bg-slate-100 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-200 transition"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 bg-pastel-darkgreen text-white font-medium text-sm rounded-xl hover:bg-emerald-600 transition shadow-sm"
            >
              {loading ? 'Securing & Registering...' : 'Complete Registration 🔒'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-pastel-darkblue font-medium hover:underline">
          Sign in
        </button>
      </div>
    </div>
  );
};