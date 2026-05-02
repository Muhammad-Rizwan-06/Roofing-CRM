// src/utils/password.js
const enc = new TextEncoder();

const toBase64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const fromBase64 = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const generateSalt = (bytes = 16) => {
  const salt = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64(salt);
};

export async function hashPassword(password, saltB64) {
  const salt = fromBase64(saltB64);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return toBase64(bits);
}

export async function verifyPassword(password, saltB64, hashB64) {
  const candidate = await hashPassword(password, saltB64);
  return candidate === hashB64;
}