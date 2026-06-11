import type { User } from 'firebase/auth';
import { getDb } from '@/lib/firebase';
import { serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

export async function ensureUserProfile(user: User): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  const base = {
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...base,
      currency: 'INR',
      dateFormat: 'dd-MM-yyyy',
      language: 'en',
    });
  } else {
    await setDoc(ref, base, { merge: true });
  }
}
