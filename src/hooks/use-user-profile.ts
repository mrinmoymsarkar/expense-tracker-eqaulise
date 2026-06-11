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
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });

    // Denormalize member info into all groups this user belongs to (best-effort)
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('memberUids', 'array-contains', user.uid));
    const snap = await getDocs(q);
    const memberInfo = {
      displayName: data.displayName ?? profile?.displayName ?? '',
      photoURL: data.photoURL ?? profile?.photoURL ?? null,
      email: data.email ?? profile?.email ?? '',
      ...(data.upiId !== undefined ? { upiId: data.upiId } : {}),
    };
    await Promise.allSettled(
      snap.docs.map((groupDoc) =>
        updateDoc(groupDoc.ref, { [`members.${user.uid}`]: memberInfo })
      )
    );
  };

  return { profile, loading, updateProfile };
}
