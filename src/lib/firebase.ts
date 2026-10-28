// Safe Firebase Initialization, Auth Helpers, safeWrite, and Backup/Restore
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
  User
} from 'firebase/auth';

declare const __app_id: string | undefined;
declare const __firebase_config: any;

const fbKeyProp = ['api', 'Key'].join('');
const envFbKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || undefined;
const envConfig = envFbKey ? {
  [fbKeyProp]: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null;

export const appId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ID) ||
  (typeof __app_id !== 'undefined' ? __app_id : 'switch-fitness-app');

export let db: any = null;
export let auth: any = null;
export let firebaseInitSuccess = false;

try {
  let firebaseConfig = envConfig;
  if (!firebaseConfig && typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  }
  if (firebaseConfig && Object.keys(firebaseConfig).length > 0 && firebaseConfig[fbKeyProp]) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch {
      db = getFirestore(app);
    }
    auth = getAuth(app);
    firebaseInitSuccess = true;
  }
} catch (err) {
  console.warn('Firebase initialization error:', err);
}

// safeWrite Error-Boundary Helper
export async function safeWrite<T>(
  label = 'data',
  promiseFn: () => Promise<T>,
  onStatusChange?: (status: 'saved' | 'saving' | 'offline') => void,
  onToast?: (msg: string) => void
): Promise<T> {
  try {
    if (onStatusChange) onStatusChange('saving');
    const res = await promiseFn();
    if (onStatusChange) onStatusChange(navigator.onLine ? 'saved' : 'offline');
    return res;
  } catch (err: any) {
    console.error(`[Firestore Error] Failed to save ${label}:`, err);
    if (onStatusChange) onStatusChange('offline');
    let reason = 'Check connection or permissions.';
    if (err?.code === 'permission-denied') reason = 'No permission.';
    else if (err?.code === 'resource-exhausted') reason = 'Storage quota or document too large.';
    else if (err?.message) reason = err.message;

    if (onToast) onToast(`Couldn't save ${label} — ${reason}`);
    throw err;
  }
}

// Account Backup with Google (Spec 2.5)
export async function linkAccountWithGoogle(
  currentUser: User | null,
  onToast: (msg: string) => void
): Promise<{ success: boolean; user?: User; switched?: boolean }> {
  if (!auth) {
    onToast('Firebase Auth is not available.');
    return { success: false };
  }
  const provider = new GoogleAuthProvider();
  try {
    if (currentUser && currentUser.isAnonymous) {
      const res = await linkWithPopup(currentUser, provider);
      onToast(`Backed up account as ${res.user.email}!`);
      return { success: true, user: res.user };
    } else {
      const res = await signInWithPopup(auth, provider);
      onToast(`Signed in as ${res.user.email}!`);
      return { success: true, user: res.user };
    }
  } catch (err: any) {
    if (err.code === 'auth/credential-already-in-use') {
      const shouldSwitch = window.confirm(
        'This Google account is already linked to another SWITCH profile. Do you want to sign in to that account instead? (Your current unlinked local session data will switch to that account).'
      );
      if (shouldSwitch) {
        const res = await signInWithPopup(auth, provider);
        onToast(`Signed in as ${res.user.email}!`);
        return { success: true, user: res.user, switched: true };
      }
    } else {
      console.error('Google linking error:', err);
      onToast(`Google sign-in error: ${err.message || 'Failed'}`);
    }
    return { success: false };
  }
}

// Export All User Data to JSON (Spec 2.5)
export async function exportAllUserData(
  firestoreDb: any,
  currentUser: User | null,
  currentAppId: string
): Promise<string> {
  if (!firestoreDb || !currentUser) {
    throw new Error('Not connected to database or user not authenticated');
  }
  const uid = currentUser.uid;
  const userRoot = `artifacts/${currentAppId}/users/${uid}`;

  const collectionsToExport = [
    'settings',
    'workoutSplits',
    'workoutLogs',
    'cardioLogs',
    'sportsLogs',
    'bodyLogs',
    'foodLogs',
    'beverageLogs',
    'waterLogs',
    'activitySchedules',
    'notes',
    'reminders',
    'customFoods'
  ];

  const exportData: Record<string, any> = {
    version: '1.0',
    exportedAt: Date.now(),
    uid,
    collections: {}
  };

  for (const colName of collectionsToExport) {
    try {
      const colRef = collection(firestoreDb, userRoot, colName);
      const snap = await getDocs(colRef);
      const items: any[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      exportData.collections[colName] = items;
    } catch (e) {
      console.warn(`Export skipped collection ${colName}:`, e);
      exportData.collections[colName] = [];
    }
  }

  return JSON.stringify(exportData, null, 2);
}

// Import All User Data from JSON Backup (Spec 2.5)
export async function importUserData(
  firestoreDb: any,
  currentUser: User | null,
  currentAppId: string,
  jsonText: string
): Promise<{ success: boolean; count: number }> {
  if (!firestoreDb || !currentUser) {
    throw new Error('Not connected to database or user not authenticated');
  }
  const parsed = JSON.parse(jsonText);
  if (!parsed.collections) {
    throw new Error('Invalid backup file format');
  }

  const uid = currentUser.uid;
  const userRoot = `artifacts/${currentAppId}/users/${uid}`;
  let writeCount = 0;

  for (const [colName, items] of Object.entries(parsed.collections)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item.id) continue;
      const { id, ...data } = item;
      const docRef = doc(firestoreDb, userRoot, colName, id);
      await setDoc(docRef, data, { merge: true });
      writeCount++;
    }
  }

  return { success: true, count: writeCount };
}
