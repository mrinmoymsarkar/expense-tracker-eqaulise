'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getDb } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

export function useUserProfile(): {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => Promise<void>;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const db = getDb();
    const ref = doc(db, 'users', user.uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const updateProfile = async (data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => {
    if (!user) return;
    const db = getDb();
    // Firestore offline persistence: write promises resolve only on server ACK,
    // but the local cache + onSnapshot reflect the change immediately. Awaiting
    // them hangs the UI (spinner stuck) until the server responds, so we fire the
    // writes and let them settle in the background.
    setDoc(doc(db, 'users', user.uid), data, { merge: true }).catch(console.error);

    const displayChanged =
      data.displayName !== undefined ||
      data.photoURL !== undefined ||
      data.email !== undefined ||
      data.upiId !== undefined;
    if (!displayChanged) return;

    if (data.displayName !== undefined || data.photoURL !== undefined) {
      const { auth } = await import('@/lib/firebase');
      const { updateProfile: updateAuthProfile } = await import('firebase/auth');
      if (auth.currentUser) {
        updateAuthProfile(auth.currentUser, {
          ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
          ...(data.photoURL !== undefined ? { photoURL: data.photoURL } : {}),
        }).catch(console.error);
      }
    }

    // Denormalize member info into all groups this user belongs to (best-effort,
    // non-blocking — only when display fields changed).
    const memberInfo = {
      displayName: data.displayName ?? profile?.displayName ?? '',
      photoURL: data.photoURL ?? profile?.photoURL ?? null,
      email: data.email ?? profile?.email ?? '',
      ...(data.upiId !== undefined ? { upiId: data.upiId } : {}),
    };
    (async () => {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('memberUids', 'array-contains', user.uid));
      const snap = await getDocs(q);
      await Promise.allSettled(
        snap.docs.map((groupDoc) =>
          updateDoc(groupDoc.ref, { [`members.${user.uid}`]: memberInfo })
        )
      );
    })().catch(console.error);
  };

  return { profile, loading, updateProfile };
}
