// client/src/utils/e2ee.ts

const APP_PEPPER = "esun-li-awen-e2ee-v1"; // Static domain separator

// Derives a shared 256-bit AES-GCM key locally between two users
async function deriveSharedKey(userA: string, userB: string): Promise<CryptoKey> {
  // Sort IDs so User A -> User B and User B -> User A derive the exact same key
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

// Encrypts plaintext into "ivBase64:ciphertextBase64" before sending to server
export async function encryptMessage(plaintext: string, myId: string, friendId: string): Promise<string> {
  const key = await deriveSharedKey(myId, friendId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Unique random IV per message
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

// Decrypts "ivBase64:ciphertextBase64" locally in the recipient's browser
export async function decryptMessage(payload: string, myId: string, friendId: string): Promise<string> {
  try {
    if (!payload.includes(":")) return payload; // Fallback for older unencrypted test messages
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
    return "🔒 [Unable to decrypt message]";
  }
}