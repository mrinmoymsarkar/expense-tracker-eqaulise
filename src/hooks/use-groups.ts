'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getDb } from '@/lib/firebase';
import type { Group } from '@/lib/types';

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => INVITE_CHARS[b % INVITE_CHARS.length])
    .join('');
}

export function useGroups(): {
  groups: Group[];
  loading: boolean;
  createGroup: (data: { name: string }) => Promise<string>;
  joinGroupByCode: (code: string) => Promise<void>;
} {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const db = getDb();
    const groupsRef = collection(db, 'groups');

    const attachWithOrderBy = () => {
      const q = query(
        groupsRef,
        where('memberUids', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc')
      );
      return onSnapshot(
        q,
        (snap) => {
          setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
          setLoading(false);
        },
        () => {
          // Composite index missing: fall back to client-side sort
          attachWithoutOrderBy();
        }
      );
    };

    let unsub: (() => void) | undefined;

    const attachWithoutOrderBy = () => {
      if (unsub) unsub();
      const q = query(groupsRef, where('memberUids', 'array-contains', user.uid));
      unsub = onSnapshot(q, (snap) => {
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Group))
          .sort((a, b) => {
            const aMs = a.updatedAt?.toMillis?.() ?? 0;
            const bMs = b.updatedAt?.toMillis?.() ?? 0;
            return bMs - aMs;
          });
        setGroups(sorted);
        setLoading(false);
      });
    };

    unsub = attachWithOrderBy();
    return () => unsub?.();
  }, [user]);

  const createGroup = async (data: { name: string }): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const db = getDb();
    const groupRef = doc(collection(db, 'groups'));
    const inviteCode = generateInviteCode();

    const memberInfo = {
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
      photoURL: user.photoURL ?? null,
      email: user.email ?? '',
    };

    // Firestore offline persistence: onSnapshot reflects the write from local cache
    // immediately; awaiting server ACK hangs the UI, so fire and forget.
    setDoc(groupRef, {
      name: data.name,
      imageUrl: 'https://placehold.co/400x200.png',
      imageHint: 'group image',
      createdBy: user.uid,
      memberUids: [user.uid],
      members: { [user.uid]: memberInfo },
      inviteCode,
      totalExpenses: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(console.error);

    setDoc(doc(db, 'inviteCodes', inviteCode), {
      groupId: groupRef.id,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      expiresAt: null,
    }).catch(console.error);

    return groupRef.id;
  };

  const joinGroupByCode = async (code: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const db = getDb();
    const normalized = code.trim().toUpperCase();
    const codeSnap = await getDoc(doc(db, 'inviteCodes', normalized));

    if (!codeSnap.exists()) {
      throw new Error('Invalid invite code');
    }

    const { groupId } = codeSnap.data() as { groupId: string };
    const memberInfo = {
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
      photoURL: user.photoURL ?? null,
      email: user.email ?? '',
    };

    updateDoc(doc(db, 'groups', groupId), {
      memberUids: arrayUnion(user.uid),
      [`members.${user.uid}`]: memberInfo,
      updatedAt: serverTimestamp(),
    }).catch(console.error);
  };

  return { groups, loading, createGroup, joinGroupByCode };
}
