import { describe, it, expect } from 'vitest';
import {
  encryptNoteContent,
  decryptNoteContent,
  generateZestCode
} from '../src/lib/crypto';

describe('Web Crypto Note Encryption (Spec 2.3)', () => {
  const secretNote = {
    body: 'My highly confidential personal thoughts and checklist',
    checklist: [
      { id: 'c-1', text: 'Buy creatine', done: true },
      { id: 'c-2', text: 'Plan next cycle', done: false }
    ],
    tags: ['private', 'goals']
  };

  it('encrypts then decrypts successfully with the correct PIN', async () => {
    const pin = '482910';
    const encrypted = await encryptNoteContent(secretNote, pin);

    expect(encrypted.v).toBe(1);
    expect(typeof encrypted.salt).toBe('string');
    expect(typeof encrypted.iv).toBe('string');
    expect(typeof encrypted.ct).toBe('string');
    expect(encrypted.ct).not.toContain('confidential');

    const decrypted = await decryptNoteContent(encrypted, pin);
    expect(decrypted).toEqual(secretNote);
  }, 15000);

  it('fails decryption and throws an error when given a wrong PIN', async () => {
    const pin = '123456';
    const wrongPin = '654321';
    const encrypted = await encryptNoteContent(secretNote, pin);

    await expect(decryptNoteContent(encrypted, wrongPin)).rejects.toThrow();
  }, 15000);

  it('produces different ciphertexts and ivs for two encryptions of the same content', async () => {
    const pin = '999111';
    const enc1 = await encryptNoteContent(secretNote, pin);
    const enc2 = await encryptNoteContent(secretNote, pin);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.salt).not.toBe(enc2.salt);
    expect(enc1.ct).not.toBe(enc2.ct);
  }, 20000);

  it('generates an 8-character Zest code using allowed characters only', () => {
    const code = generateZestCode();
    expect(code.length).toBe(8);
    // Allowed: ABCDEFGHJKMNPQRSTUVWXYZ23456789
    expect(/^[A-HJ-NP-Z2-9]{8}$/.test(code)).toBe(true);
  });
});
