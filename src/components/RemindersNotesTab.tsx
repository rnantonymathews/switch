import React, { useState, useRef } from 'react';
import {
  Bell,
  FileText,
  ChevronDown,
  Trash2,
  Mic,
  Volume2,
  Square,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  X,
  Plus,
  Check,
  Lock,
  ChevronRight,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Note, NoteClip, Reminder } from '../types';
import { encryptNoteContent, decryptNoteContent } from '../lib/crypto';
import { soundEngine } from '../lib/sound';

interface RemindersNotesTabProps {
  remindersList: Reminder[];
  notesList: Note[];
  setNotesList: React.Dispatch<React.SetStateAction<Note[]>>;
  setRemindersList: React.Dispatch<React.SetStateAction<Reminder[]>>;
  triggerToast: (msg: string) => void;
  safeWrite: <T>(label: string, promiseFn: () => Promise<T>) => Promise<T>;
  user: any;
  db: any;
  appId: string;
}

export const RemindersNotesTab: React.FC<RemindersNotesTabProps> = ({
  remindersList,
  notesList,
  setNotesList,
  setRemindersList,
  triggerToast,
  safeWrite,
  user,
  db,
  appId
}) => {
  const [rnoOpenSection, setRnoOpenSection] = useState<'reminders' | 'notes'>('reminders');
  const [rnoActiveView, setRnoActiveView] = useState<'list' | 'reminderForm' | 'noteForm'>('list');
  const [showRnoPlusPrompt, setShowRnoPlusPrompt] = useState(false);

  // Reminders Form State
  const [editingReminder, setEditingReminder] = useState<any>({
    id: '',
    title: '',
    time: '08:00',
    category: 'hydration',
    isRepeating: true,
    repeatEvery: 'daily'
  });

  // Notes Form State
  const [editingNote, setEditingNote] = useState<any>({
    id: '',
    title: '',
    category: 'workout',
    isPinned: false,
    isLocked: false,
    body: '',
    pinInput: '',
    voiceClips: [] as NoteClip[]
  });

  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isSttListening, setIsSttListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceTimeoutRef = useRef<any>(null);

  // Locked Note PIN Unlock Modal State (Spec 2.3)
  const [pinUnlockTargetNote, setPinUnlockTargetNote] = useState<Note | null>(null);
  const [pinUnlockInput, setPinUnlockInput] = useState('');
  const [pinUnlockError, setPinUnlockError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  // Open forms
  const openNewReminderForm = () => {
    setEditingReminder({
      id: `rem-${Date.now()}`,
      title: '',
      time: '08:00',
      category: 'hydration',
      isRepeating: true,
      repeatEvery: 'daily'
    });
    setRnoActiveView('reminderForm');
    setShowRnoPlusPrompt(false);
  };

  const openExistingReminder = (rem: any) => {
    setEditingReminder({ ...rem });
    setRnoActiveView('reminderForm');
  };

  const openNewNoteForm = () => {
    setEditingNote({
      id: `note-${Date.now()}`,
      title: '',
      category: 'workout',
      isPinned: false,
      isLocked: false,
      body: '',
      pinInput: '',
      voiceClips: []
    });
    setRnoActiveView('noteForm');
    setShowRnoPlusPrompt(false);
  };

  const openExistingNote = (note: Note) => {
    if (note.isLocked) {
      setPinUnlockTargetNote(note);
      setPinUnlockInput('');
      setPinUnlockError('');
    } else {
      setEditingNote({
        ...note,
        body: note.body || '',
        pinInput: '',
        voiceClips: note.clips || []
      });
      setRnoActiveView('noteForm');
    }
  };

  // Verify PIN Unlock (Spec 2.3 Web Crypto)
  const handleVerifyNotePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinUnlockTargetNote || !pinUnlockInput) return;

    if (isLockedOut) {
      setPinUnlockError(`Too many failed attempts. Please wait ${lockoutSecondsLeft}s.`);
      return;
    }

    // 1-second intentional UI-only delay after each wrong attempt
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Legacy note migration check
      if (pinUnlockTargetNote.pinCode && !pinUnlockTargetNote.enc) {
        if (pinUnlockInput === pinUnlockTargetNote.pinCode) {
          // Migrate immediately: encrypt with Web Crypto and remove pinCode
          const encrypted = await encryptNoteContent(
            { body: pinUnlockTargetNote.body || '', checklist: pinUnlockTargetNote.checklist || [] },
            pinUnlockInput
          );
          const migratedNote: Note = {
            ...pinUnlockTargetNote,
            enc: encrypted,
            isLocked: true,
            updatedAt: Date.now()
          };
          delete (migratedNote as any).pinCode;

          setNotesList((prev) => prev.map((n) => (n.id === migratedNote.id ? migratedNote : n)));
          if (user && db) {
            await safeWrite('migrate note encryption', async () => {
              const { doc, setDoc } = await import('firebase/firestore');
              return setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', migratedNote.id), migratedNote);
            });
          }

          setEditingNote({
            ...migratedNote,
            body: pinUnlockTargetNote.body || '',
            pinInput: pinUnlockInput,
            voiceClips: pinUnlockTargetNote.clips || []
          });
          setPinUnlockTargetNote(null);
          setFailedAttempts(0);
          setRnoActiveView('noteForm');
          triggerToast('Note unlocked & migrated to secure encryption!');
          return;
        } else {
          throw new Error('Invalid PIN');
        }
      }

      // Modern Web Crypto Decryption
      if (!pinUnlockTargetNote.enc) {
        throw new Error('Encrypted payload missing');
      }

      const decrypted = await decryptNoteContent(pinUnlockTargetNote.enc, pinUnlockInput);
      setEditingNote({
        ...pinUnlockTargetNote,
        body: decrypted.body || '',
        checklist: decrypted.checklist || [],
        pinInput: pinUnlockInput,
        voiceClips: pinUnlockTargetNote.clips || []
      });
      setPinUnlockTargetNote(null);
      setFailedAttempts(0);
      setRnoActiveView('noteForm');
      triggerToast('Note unlocked!');
    } catch {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      if (nextFailed >= 5) {
        setIsLockedOut(true);
        setLockoutSecondsLeft(30);
        setPinUnlockError('Incorrect PIN. 30-second security lockout active.');
        const interval = setInterval(() => {
          setLockoutSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsLockedOut(false);
              setFailedAttempts(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setPinUnlockError(`Incorrect 6-digit PIN (${5 - nextFailed} attempts remaining).`);
      }
    }
  };

  // Toggle STT (Speech-to-Text)
  const handleToggleSttDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast('Speech Recognition not supported in this browser.');
      return;
    }
    if (isSttListening) {
      setIsSttListening(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => setIsSttListening(true);
      rec.onresult = (ev: any) => {
        const text = ev.results[0][0].transcript;
        setEditingNote((prev: any) => ({
          ...prev,
          body: prev.body ? `${prev.body} ${text}` : text
        }));
        setIsSttListening(false);
      };
      rec.onend = () => setIsSttListening(false);
      rec.onerror = () => setIsSttListening(false);
      rec.start();
    } catch {
      setIsSttListening(false);
    }
  };

  // Voice Clips Recording (Spec 2.4 - 24000 bps, 30s hard stop, max 5 clips, 700KB limit)
  const handleToggleVoiceRecording = async () => {
    if (isVoiceRecording && mediaRecorderRef.current) {
      try {
        if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
        mediaRecorderRef.current.stop();
      } catch {}
      setIsVoiceRecording(false);
      return;
    }

    if ((editingNote.voiceClips || []).length >= 5) {
      triggerToast('Maximum 5 voice clips per note allowed.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      triggerToast('Microphone not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 24000 });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (base64Audio.length > 700 * 1024) {
            triggerToast('Voice clip exceeds 700KB size limit. Try a shorter clip.');
            return;
          }

          const clipId = `clip-${Date.now()}`;
          const newClip: NoteClip = {
            id: clipId,
            durationSec: 30,
            createdAt: Date.now(),
            audioDataUrl: base64Audio
          };

          // Save clip in subcollection if connected
          if (user && db && editingNote.id) {
            try {
              const { doc, setDoc } = await import('firebase/firestore');
              const clipDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', editingNote.id, 'clips', clipId);
              await safeWrite('voice clip', () =>
                setDoc(clipDocRef, {
                  id: clipId,
                  durationSec: 30,
                  audioDataUrl: base64Audio,
                  createdAt: Date.now()
                })
              );
            } catch (e) {
              console.warn('Clip subcollection save error:', e);
            }
          }

          setEditingNote((prev: any) => ({
            ...prev,
            voiceClips: [...(prev.voiceClips || []), newClip]
          }));
          triggerToast('Voice clip attached!');
        };

        reader.readAsDataURL(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsVoiceRecording(true);

      // Hard stop at 30 seconds (Spec 2.4)
      voiceTimeoutRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsVoiceRecording(false);
          triggerToast('30s voice recording time limit reached.');
        }
      }, 30000);
    } catch {
      triggerToast('Microphone permission denied.');
    }
  };

  // Save Note with Web Crypto AES-GCM (Spec 2.3)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote?.title?.trim()) {
      triggerToast('Please enter a Note Title!');
      return;
    }

    const pin = (editingNote.pinInput || '').trim();
    if (editingNote.isLocked && !/^\d{6}$/.test(pin)) {
      triggerToast('Locking a note requires an exact 6-digit numeric PIN!');
      return;
    }

    try {
      let encPayload = undefined;
      if (editingNote.isLocked) {
        // Encrypt private fields (body, checklist, tags) with fresh IV
        encPayload = await encryptNoteContent(
          {
            body: editingNote.body || '',
            checklist: editingNote.checklist || []
          },
          pin
        );
      }

      const noteToSave: Note = {
        id: editingNote.id || `note-${Date.now()}`,
        title: editingNote.title.trim(),
        category: editingNote.category || 'workout',
        isPinned: Boolean(editingNote.isPinned),
        isLocked: Boolean(editingNote.isLocked),
        enc: encPayload,
        body: editingNote.isLocked ? undefined : editingNote.body,
        clipIds: (editingNote.voiceClips || []).map((c: any) => c.id),
        clips: editingNote.voiceClips,
        createdAt: editingNote.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      setNotesList((prev) => {
        const exists = prev.some((n) => n.id === noteToSave.id);
        return exists ? prev.map((n) => (n.id === noteToSave.id ? noteToSave : n)) : [noteToSave, ...prev];
      });

      if (user && db) {
        const { doc, setDoc } = await import('firebase/firestore');
        const docPayload = { ...noteToSave };
        delete (docPayload as any).pinCode;
        if (docPayload.isLocked) {
          delete docPayload.body;
        }

        await safeWrite('note', () =>
          setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', noteToSave.id), docPayload)
        );
      }

      setRnoActiveView('list');
      setRnoOpenSection('notes');
      triggerToast(`Saved note "${noteToSave.title}"!`);
    } catch (err) {
      console.error('Note encryption save error:', err);
      triggerToast('Failed to encrypt note. Check PIN.');
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    setNotesList((prev) => prev.filter((n) => n.id !== noteId));
    if (user && db) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await safeWrite('delete note', () =>
          deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', noteId))
        );
      } catch (err) {
        console.warn('Delete note error:', err);
      }
    }
    setRnoActiveView('list');
    triggerToast('Note deleted');
  };

  // Save Reminder
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder?.title?.trim()) {
      triggerToast('Please enter a Reminder Title!');
      return;
    }
    const cleanRem = {
      ...editingReminder,
      title: editingReminder.title.trim(),
      updatedAt: Date.now()
    };
    setRemindersList((prev: any) => {
      const exists = prev.some((r: any) => r.id === cleanRem.id);
      return exists ? prev.map((r: any) => (r.id === cleanRem.id ? cleanRem : r)) : [cleanRem, ...prev];
    });

    if (user && db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await safeWrite('reminder', () =>
          setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', cleanRem.id), cleanRem)
        );
      } catch (err) {
        console.warn('Save reminder error:', err);
      }
    }
    setRnoActiveView('list');
    setRnoOpenSection('reminders');
    triggerToast(`Saved reminder "${cleanRem.title}"!`);
  };

  // Delete Reminder
  const handleDeleteReminder = async (remId: string) => {
    setRemindersList((prev: any) => prev.filter((r: any) => r.id !== remId));
    if (user && db) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await safeWrite('delete reminder', () =>
          deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', remId))
        );
      } catch (err) {
        console.warn('Delete reminder error:', err);
      }
    }
    setRnoActiveView('list');
    triggerToast('Reminder deleted');
  };

  return (
    <div className="space-y-4 relative pb-16 font-sans">
      {/* iOS 18 UNIFIED CARD (Reminders & Notes) */}
      {rnoActiveView === 'list' && (
        <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Activities <span className="text-white/40 font-normal lowercase tracking-normal">(reminders & notes)</span>
            </h2>
          </div>

          {/* Apple-Style Segmented Track Control */}
          <div className="p-1 bg-black/40 border border-white/10 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setRnoOpenSection('reminders')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                rnoOpenSection === 'reminders'
                  ? 'bg-[#242429] text-white font-bold shadow-md border border-white/10'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${rnoOpenSection === 'reminders' ? 'text-[#D4FB45] stroke-[2.5]' : 'stroke-2'}`} />
              <span>Reminders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                rnoOpenSection === 'reminders' ? 'bg-[#D4FB45]/20 text-[#D4FB45]' : 'bg-white/10 text-white/50'
              }`}>
                {remindersList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRnoOpenSection('notes')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                rnoOpenSection === 'notes'
                  ? 'bg-[#242429] text-white font-bold shadow-md border border-white/10'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${rnoOpenSection === 'notes' ? 'text-[#D4FB45] stroke-[2.5]' : 'stroke-2'}`} />
              <span>Notes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                rnoOpenSection === 'notes' ? 'bg-[#D4FB45]/20 text-[#D4FB45]' : 'bg-white/10 text-white/50'
              }`}>
                {notesList.length}
              </span>
            </button>
          </div>

          {/* REMINDERS LIST (Apple Reminders Style) */}
          {rnoOpenSection === 'reminders' && (
            <div className="bg-[#19191D]/90 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-inner">
              {remindersList.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#D4FB45]/10 text-[#D4FB45] flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-white/60 font-medium">No reminders yet.</p>
                  <button
                    type="button"
                    onClick={openNewReminderForm}
                    className="text-xs font-bold text-[#D4FB45] hover:underline cursor-pointer"
                  >
                    + Add your first reminder
                  </button>
                </div>
              ) : (
                <>
                  {remindersList.map((rem: any, idx: number) => (
                    <div
                      key={rem.id || idx}
                      className="w-full py-3 px-3.5 flex items-center justify-between text-xs hover:bg-white/[0.04] transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(rem.id)}
                          title="Mark complete"
                          className="w-5 h-5 rounded-full border-[1.5px] border-white/30 hover:border-[#D4FB45] hover:bg-[#D4FB45]/20 flex items-center justify-center transition shrink-0 active:scale-90 cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-transparent group-hover:text-[#D4FB45]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openExistingReminder(rem)}
                          className="text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <p className="text-[13px] font-semibold text-white group-hover:text-[#D4FB45] transition-colors truncate">
                            {rem.title}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-white/60 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5 text-[#38BDF8]" />
                              <span className="font-mono text-white/70">{rem.time}</span>
                            </span>
                            {rem.isRepeating && (
                              <span className="px-1.5 py-0.2 rounded bg-[#D4FB45]/10 text-[#D4FB45] font-mono text-[9px] font-semibold">
                                Repeats {rem.repeatEvery}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => openExistingReminder(rem)}
                        className="p-1 rounded-lg text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Inline '+ New Reminder' row */}
                  <button
                    type="button"
                    onClick={openNewReminderForm}
                    className="w-full py-2.5 px-3.5 flex items-center gap-2.5 text-xs font-semibold text-[#D4FB45] hover:bg-white/[0.04] transition group cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#D4FB45]/15 border border-[#D4FB45]/30 flex items-center justify-center text-[#D4FB45] group-hover:bg-[#D4FB45] group-hover:text-black transition">
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span>New Reminder</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* NOTES LIST (Apple Notes Style) */}
          {rnoOpenSection === 'notes' && (
            <div className="bg-[#19191D]/90 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-inner">
              {notesList.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#D4FB45]/10 text-[#D4FB45] flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-white/60 font-medium">No notes yet.</p>
                  <button
                    type="button"
                    onClick={openNewNoteForm}
                    className="text-xs font-bold text-[#D4FB45] hover:underline cursor-pointer"
                  >
                    + Create a new note
                  </button>
                </div>
              ) : (
                <>
                  {notesList.map((note, idx) => (
                    <button
                      key={note.id || idx}
                      type="button"
                      onClick={() => openExistingNote(note)}
                      className="w-full py-3 px-3.5 flex items-center justify-between text-xs hover:bg-white/[0.04] transition group text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                        <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {note.isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-[#FF453A]" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-[#D4FB45]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[13px] font-semibold text-white group-hover:text-[#D4FB45] transition-colors truncate">
                              {note.title}
                            </span>
                            {note.isLocked && (
                              <span className="text-[9px] font-mono text-[#FF453A] bg-[#FF453A]/10 px-1.5 py-0.2 rounded border border-[#FF453A]/30">
                                AES-256
                              </span>
                            )}
                            {note.clips && note.clips.length > 0 && (
                              <span className="text-[9px] font-mono text-[#D4FB45] bg-[#D4FB45]/10 px-1.5 py-0.2 rounded border border-[#D4FB45]/30 flex items-center gap-1">
                                <Mic className="w-2.5 h-2.5 text-[#D4FB45]" />
                                <span>{note.clips.length}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/50 mt-0.5 truncate">
                            {note.isLocked
                              ? 'Encrypted content • PIN required to view'
                              : note.body || 'No text content'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 shrink-0 transition-all" />
                    </button>
                  ))}

                  {/* Inline '+ New Note' row */}
                  <button
                    type="button"
                    onClick={openNewNoteForm}
                    className="w-full py-2.5 px-3.5 flex items-center gap-2.5 text-xs font-semibold text-[#D4FB45] hover:bg-white/[0.04] transition group cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#D4FB45]/15 border border-[#D4FB45]/30 flex items-center justify-center text-[#D4FB45] group-hover:bg-[#D4FB45] group-hover:text-black transition">
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span>New Note</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* REMINDER FORM VIEW (Apple Inset Grouped) */}
      {rnoActiveView === 'reminderForm' && (
        <form onSubmit={handleSaveReminder} className="bg-[#141417] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <button
              type="button"
              onClick={() => setRnoActiveView('list')}
              className="text-[#D4FB45] hover:text-[#D4FB45]/80 flex items-center gap-1 text-xs font-bold ios-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h3 className="font-bold text-sm text-white">
              {editingReminder.id ? 'Edit Reminder' : 'New Reminder'}
            </h3>
            {editingReminder.id ? (
              <button
                type="button"
                onClick={() => handleDeleteReminder(editingReminder.id)}
                className="text-[#FF453A] hover:text-[#FF453A]/80 p-1.5 rounded-xl bg-[#1F1F24] border border-white/5 ios-press"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-white/60 uppercase text-[10px] tracking-wider block">Title</label>
            <input
              type="text"
              required
              value={editingReminder.title}
              onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
              placeholder="e.g., Creatine + Hydration Check"
              className="w-full bg-[#1F1F24] border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-[#D4FB45] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-white/60 uppercase text-[10px] tracking-wider block">Time</label>
              <input
                type="time"
                value={editingReminder.time}
                onChange={(e) => setEditingReminder({ ...editingReminder, time: e.target.value })}
                className="w-full bg-[#1F1F24] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-xs font-bold focus:outline-none focus:border-[#D4FB45] transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-white/60 uppercase text-[10px] tracking-wider block">Repetition</label>
              <select
                value={editingReminder.repeatEvery}
                onChange={(e) => setEditingReminder({ ...editingReminder, repeatEvery: e.target.value })}
                className="w-full bg-[#1F1F24] border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-[#D4FB45] transition"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary-green w-full py-3.5 rounded-2xl text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Reminder</span>
          </button>
        </form>
      )}

      {/* NOTE FORM VIEW (Apple Notes Aesthetic with Web Crypto AES-256) */}
      {rnoActiveView === 'noteForm' && (
        <form onSubmit={handleSaveNote} className="bg-[#141417] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <button
              type="button"
              onClick={() => setRnoActiveView('list')}
              className="text-[#D4FB45] hover:text-[#D4FB45]/80 flex items-center gap-1 text-xs font-bold ios-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h3 className="font-bold text-sm text-white">
              {editingNote.id ? 'Edit Note' : 'New Note'}
            </h3>
            {editingNote.id ? (
              <button
                type="button"
                onClick={() => handleDeleteNote(editingNote.id)}
                className="text-[#FF453A] hover:text-[#FF453A]/80 p-1.5 rounded-xl bg-[#1F1F24] border border-white/5 ios-press"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-white/60 uppercase text-[10px] tracking-wider block">Note Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Heavy Leg Day Protocol & Cues"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              className="w-full bg-[#1F1F24] border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-[#D4FB45] transition"
            />
          </div>

          {/* Notes Body + STT + Voice Clips Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white/60 uppercase text-[10px] tracking-wider">
                Note Content
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleSttDictation}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 border transition ios-press ${
                    isSttListening
                      ? 'bg-[#FF453A] text-white border-[#FF453A] animate-pulse'
                      : 'bg-[#1F1F24] border-white/10 text-[#D4FB45] hover:border-[#D4FB45]/40'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isSttListening ? 'Listening...' : 'Dictate'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleVoiceRecording}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 border transition ios-press ${
                    isVoiceRecording
                      ? 'bg-[#FF453A] text-white border-[#FF453A] animate-pulse'
                      : 'bg-[#1F1F24] border-white/10 text-white/80 hover:border-[#D4FB45]/40'
                  }`}
                >
                  {isVoiceRecording ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-[#D4FB45]" />}
                  <span>{isVoiceRecording ? 'Stop Rec (30s)' : '+ Voice Clip'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              placeholder="Type your workout thoughts, cues, or meal notes..."
              value={editingNote.body || ''}
              onChange={(e) => setEditingNote({ ...editingNote, body: e.target.value })}
              className="w-full bg-[#1F1F24] border border-white/10 rounded-2xl p-4 text-white font-medium leading-relaxed text-xs focus:outline-none focus:border-[#D4FB45] transition"
            />

            {/* Attached Voice Clips (iOS Voice Memos style) */}
            {Array.isArray(editingNote.voiceClips) && editingNote.voiceClips.length > 0 && (
              <div className="bg-[#1F1F24] border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#D4FB45]">
                    Attached Voice Memos ({editingNote.voiceClips.length}/5)
                  </span>
                  <span className="text-[10px] text-white/50 font-mono">Max 30s • 24kbps</span>
                </div>
                {editingNote.voiceClips.map((vc: NoteClip, vIdx: number) => (
                  <div
                    key={vc.id || vIdx}
                    className="flex items-center justify-between bg-[#141417] border border-white/5 rounded-xl px-3 py-2"
                  >
                    <span className="font-bold text-white text-[11px] flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D4FB45]" />
                      <span>Memo #{vIdx + 1}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {vc.audioDataUrl && (
                        <audio controls src={vc.audioDataUrl} className="h-7 w-36 accent-[#D4FB45]" />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingNote({
                            ...editingNote,
                            voiceClips: editingNote.voiceClips.filter((_: any, i: number) => i !== vIdx)
                          })
                        }
                        className="text-white/40 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Web Crypto AES-GCM Note Lock (Spec 2.3) */}
          <div className="bg-[#1F1F24] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/5 text-white/70 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#D4FB45]" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">Lock with AES-256</span>
                  <span className="text-[10px] text-white/50">Hardware-grade Web Crypto protection</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNote({ ...editingNote, isLocked: !editingNote.isLocked })}
                className={`px-3 py-1.5 rounded-full font-bold text-[10px] uppercase transition ios-press ${
                  editingNote.isLocked ? 'bg-[#D4FB45] text-black shadow-md shadow-[#D4FB45]/20' : 'bg-black/40 text-white/50 border border-white/10'
                }`}
              >
                {editingNote.isLocked ? 'LOCKED' : 'OFF'}
              </button>
            </div>

            {editingNote.isLocked && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[10px] text-white/60 font-bold block">
                  Enter 6-Digit Numeric PIN to Lock:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={editingNote.pinInput || ''}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, pinInput: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  className="w-full bg-[#141417] border border-[#D4FB45]/50 rounded-2xl px-4 py-3 text-center tracking-[0.5em] font-mono text-base font-black text-white focus:outline-none"
                />
                <p className="text-[10px] text-white/50 leading-relaxed pt-1">
                  Locks this note with your PIN. If you forget it, the note cannot be recovered.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary-green w-full py-3.5 rounded-2xl text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Note</span>
          </button>
        </form>
      )}


      {/* 6-DIGIT PIN UNLOCK MODAL (iOS Native Passcode Prompt) */}
      {pinUnlockTargetNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleVerifyNotePin}
            className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-xs p-6 space-y-4 shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#FF453A]/15 text-[#FF453A] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white truncate">{pinUnlockTargetNote.title}</h4>
              <p className="text-[11px] text-[#8E8E93] mt-1">
                Enter your 6-digit PIN to decrypt this note.
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              disabled={isLockedOut}
              placeholder="••••••"
              value={pinUnlockInput}
              onChange={(e) => setPinUnlockInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-2xl py-3 text-center tracking-[0.5em] font-mono text-lg font-black text-white focus:outline-none focus:border-[#FF453A]"
            />
            {pinUnlockError && <p className="text-[11px] text-[#FF453A] font-bold">{pinUnlockError}</p>}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPinUnlockTargetNote(null)}
                className="py-2.5 rounded-xl bg-[#2C2C2E] text-[#8E8E93] hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLockedOut || pinUnlockInput.length !== 6}
                className={`py-2.5 rounded-xl font-black text-xs uppercase transition ${
                  isLockedOut || pinUnlockInput.length !== 6
                    ? 'bg-[#3A3A3C] text-[#8E8E93] cursor-not-allowed'
                    : 'bg-[#FF453A] text-white shadow-lg shadow-[#FF453A]/30 ios-press'
                }`}
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
