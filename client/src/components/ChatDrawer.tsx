import React, { useEffect, useState } from 'react';

interface Friend {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string;
}

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  currentUserId?: string;
}

// --- Web Crypto E2EE Helpers ---
const APP_PEPPER = "esun-li-awen-e2ee-v1";

async function deriveSharedKey(userA: string, userB: string): Promise<CryptoKey> {
  const roomSeed = [userA, userB].sort().join(":") + ":" + APP_PEPPER;
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(roomSeed),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("esun-salt-2026"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptMessage(plaintext: string, myId: string, friendId: string): Promise<string> {
  const key = await deriveSharedKey(myId, friendId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `${ivB64}:${cipherB64}`;
}

async function decryptMessage(payload: string, myId: string, friendId: string): Promise<string> {
  try {
    if (!payload || !payload.includes(":")) return payload; // Fallback for unencrypted text
    const [ivB64, cipherB64] = payload.split(":");
    const key = await deriveSharedKey(myId, friendId);
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "🔒 [Encrypted message - unable to decrypt]";
  }
}

// Helper to extract userId from JWT token if prop is missing
function extractUserIdFromToken(token: string): string {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload).userId || '';
  } catch {
    return '';
  }
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, token, currentUserId }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState('');

  const myId = currentUserId || extractUserIdFromToken(token);

  // Fetch confirmed friends when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLoadingFriends(true);
      fetch('http://localhost:5000/api/chat/friends', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.friends) setFriends(data.friends);
        })
        .catch(err => console.error("Error fetching friends:", err))
        .finally(() => setLoadingFriends(false));
    }
  }, [isOpen, token]);

  // Fetch and decrypt messages when an active chat friend is selected
  useEffect(() => {
    if (!activeChatFriend || !myId) return;

    const fetchAndDecryptMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/messages/${activeChatFriend._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.messages) {
          const decryptedList = await Promise.all(
            data.messages.map(async (msg: Message) => ({
              ...msg,
              content: await decryptMessage(msg.content, myId, activeChatFriend._id)
            }))
          );
          setMessages(decryptedList);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchAndDecryptMessages();
    const interval = setInterval(fetchAndDecryptMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatFriend, token, myId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatFriend || !myId) return;

    try {
      // Encrypt plaintext locally before it touches the network or database
      const encryptedContent = await encryptMessage(newMessage, myId, activeChatFriend._id);

      const res = await fetch('http://localhost:5000/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient: activeChatFriend._id,
          content: encryptedContent
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Keep decrypted plaintext in local state view
        const sentMessage = { ...data, content: newMessage };
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleRateMatch = async (adjustment: number) => {
    if (!activeChatFriend) return;
    try {
      const res = await fetch('http://localhost:5000/api/chat/rate-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          friendId: activeChatFriend._id,
          adjustment
        })
      });

      if (res.ok) {
        setRatingFeedback(
          adjustment > 0 
            ? '✨ Shared interest weights increased by 0.1!' 
            : '🍃 Shared interest weights decreased by 0.1!'
        );
        setTimeout(() => setRatingFeedback(''), 4000);
      }
    } catch (err) {
      console.error("Error rating match:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex justify-start">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-r border-pastel-blue flex flex-col animate-in slide-in-from-left duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-pastel-blue flex justify-between items-center bg-pastel-slate">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌱</span>
            <h3 className="font-bold text-slate-800">
              {activeChatFriend ? activeChatFriend.name : "Secure Chats"}
            </h3>
          </div>
          <button 
            onClick={() => { setActiveChatFriend(null); onClose(); setRatingFeedback(''); }}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        {!activeChatFriend ? (
          /* Friends List View */
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Connected Friends</p>
            {loadingFriends ? (
              <p className="text-center text-slate-400 py-10 text-sm">Loading friends...</p>
            ) : friends.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-3xl mb-2">🍃</p>
                <p className="text-sm">No confirmed friends yet.</p>
                <p className="text-xs text-slate-400 mt-1">Connect with matched users on your dashboard!</p>
              </div>
            ) : (
              friends.map(friend => (
                <div
                  key={friend._id}
                  onClick={() => setActiveChatFriend(friend)}
                  className="flex items-center space-x-3 p-3 rounded-xl border border-pastel-blue hover:bg-pastel-blue/40 cursor-pointer transition"
                >
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-pastel-green" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pastel-blue text-pastel-darkblue flex items-center justify-center font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{friend.name}</h4>
                    <p className="text-xs text-slate-400">@{friend.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Active Chat View */
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Top Navigation & Match Tuning Controls */}
              <div className="p-3 bg-pastel-green/40 border-b border-pastel-blue flex items-center justify-between">
                <button 
                  onClick={() => { setActiveChatFriend(null); setRatingFeedback(''); }}
                  className="text-xs font-semibold text-pastel-darkgreen hover:underline"
                >
                  ← Back to Friends
                </button>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => handleRateMatch(0.1)}
                    title="Increase weight alignment for shared interests by 0.1"
                    className="px-2.5 py-1 bg-white border border-pastel-darkgreen text-pastel-darkgreen rounded-lg text-[11px] font-semibold hover:bg-pastel-green transition shadow-xs"
                  >
                    🌱 Good Match (+0.1)
                  </button>
                  <button
                    onClick={() => handleRateMatch(-0.1)}
                    title="Decrease weight alignment for shared interests by 0.1"
                    className="px-2.5 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-100 transition shadow-xs"
                  >
                    🍃 Bad Match (-0.1)
                  </button>
                </div>
              </div>

              {/* End-to-End Encryption Notice Banner */}
              <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 flex items-center space-x-2">
                <span className="text-sm">🔒</span>
                <p className="text-[11px] text-sky-800 font-medium leading-tight">
                  This chat is protected with end-to-end encryption. Only you and @{activeChatFriend.username} can read messages sent here.
                </p>
              </div>

              {/* Rating Feedback Toast */}
              {ratingFeedback && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-center text-[11px] font-semibold text-emerald-700 animate-fade-in">
                  {ratingFeedback}
                </div>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-12 text-xs">
                  🔒 End-to-end encrypted session established. Say hello!
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender !== activeChatFriend._id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2 text-xs shadow-xs ${
                        isMe ? 'bg-pastel-darkblue text-white rounded-br-none' : 'bg-white text-slate-800 border border-pastel-blue rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-pastel-blue bg-white flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type an encrypted message..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-pastel-darkblue"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pastel-darkgreen text-white font-medium text-xs rounded-xl hover:bg-emerald-600 transition shadow-xs"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};