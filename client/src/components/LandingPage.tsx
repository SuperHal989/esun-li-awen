import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-2 bg-pastel-green px-3 py-1 rounded-full text-pastel-darkgreen text-xs font-semibold mb-6 shadow-xs">
        <span>🔒 Zero-Knowledge Privacy Architecture</span>
      </div>

      {/* Hero Title */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
        Find friends who share your passions, <span className="text-pastel-darkblue">without sharing your data.</span>
      </h1>

      <p className="text-lg text-slate-600 max-w-2xl mb-10">
        esun li awen uses end-to-end encryption, AI interest normalization, and anonymous HMAC hashes. No plaintext hobbies ever touch our database servers.
      </p>

      {/* Call to Action */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-16">
        <button
          onClick={onGetStarted}
          className="px-8 py-3 bg-pastel-darkblue text-white font-medium rounded-xl shadow-md hover:bg-sky-700 transition text-lg"
        >
          Create Secure Account
        </button>
      </div>

      {/* Feature Grid highlighting project specs */}
      <div className="grid md:grid-cols-3 gap-6 w-full text-left">
        <div className="bg-white p-6 rounded-2xl border border-pastel-blue shadow-xs">
          <div className="text-2xl mb-3">🤖</div>
          <h3 className="font-bold text-slate-800 mb-1">AI Normalization</h3>
          <p className="text-sm text-slate-500">
            AI Agents anonymously normalize user interests. No one agent will remember two of your interests at the same time, guaranteeing anonymity.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-pastel-green shadow-xs">
          <div className="text-2xl mb-3">🛡️</div>
          <h3 className="font-bold text-slate-800 mb-1">Blind Hashing</h3>
          <p className="text-sm text-slate-500">
            Interests are converted to hashes immediately, never saved in the database. Nobody can see your interests.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl mb-3">⏳</div>
          <h3 className="font-bold text-slate-800 mb-1">Future-Proof Design</h3>
          <p className="text-sm text-slate-500">
            Choose to bulk wipe your categories at will in case your interests change, true account deletion, and automatic 1-year account auto-expiry, so if you stop using this app, your account will be deleted automatically.
          </p>
        </div>
      </div>
      <br />

            <div className="grid md:grid-cols-3 gap-6 w-full text-left">
        <div className="bg-white p-6 rounded-2xl border border-pastel-blue shadow-xs">
          <div className="text-2xl mb-3">🖼️</div>
          <h3 className="font-bold text-slate-800 mb-1">Image Embedding</h3>
          <p className="text-sm text-slate-500">
            Send images in chat. The images aren't hosted on our servers, so they last as long as you want them to be.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-pastel-green shadow-xs">
          <div className="text-2xl mb-3">🗑️</div>
          <h3 className="font-bold text-slate-800 mb-1">True Message Deletion</h3>
          <p className="text-sm text-slate-500">
            Messages are deleted from the database immediately when you delete them. No fake deletions here.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl mb-3">🔒</div>
          <h3 className="font-bold text-slate-800 mb-1">End-to-End Encryption</h3>
          <p className="text-sm text-slate-500">
            All messages are encrypted from end to end, ensuring your privacy and security, even on public wifi networks.
          </p>
        </div>
      </div>
    </div>
  );
};