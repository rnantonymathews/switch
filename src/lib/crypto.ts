// Web Crypto PBKDF2 + AES-GCM 256 Encryption Engine for Notes and Sensitive Data
import { EncryptedPayload } from '../types';

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API is not available in this environment');
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptNoteContent(data: any, pin: string): Promise<EncryptedPayload> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const plainText = JSON.stringify(data);
  const ctBuffer = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText)
  );

  return {
    v: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ct: bufferToBase64(ctBuffer)
  };
}

export async function decryptNoteContent(enc: EncryptedPayload, pin: string): Promise<any> {
  const cryptoObj = getCrypto();
  const decoder = new TextDecoder();
  const salt = base64ToBuffer(enc.salt);
  const iv = base64ToBuffer(enc.iv);
  const ct = base64ToBuffer(enc.ct);

  const key = await deriveKey(pin, salt);
  const decryptedBuffer = await cryptoObj.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct
  );

  const plainText = decoder.decode(decryptedBuffer);
  return JSON.parse(plainText);
}

// Generate 8-character random Zest code from ABCDEFGHJKMNPQRSTUVWXYZ23456789 (Spec 2.2)
export function generateZestCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const cryptoObj = getCrypto();
  const randomBytes = cryptoObj.getRandomValues(new Uint8Array(8));
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}
