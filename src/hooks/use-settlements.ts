'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getDb } from '@/lib/firebase';
import type { Settlement, SettlementMethod } from '@/lib/types';

export function useSettlements(groupId: string | null): {
  settlements: Settlement[];
  loading: boolean;
  recordSettlement: (data: {
    fromUid: string;
    toUid: string;
    amount: number;
    method: SettlementMethod;
    note: string;
  }) => Promise<void>;
} {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) {
      setSettlements([]);
      setLoading(false);
      return;
    }

    const db = getDb();
    const ref = collection(db, 'groups', groupId, 'settlements');
    const q = query(ref, orderBy('date', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      setSettlements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Settlement)));
      setLoading(false);
    });

    return unsub;
  }, [user, groupId]);

  const recordSettlement = async (data: {
    fromUid: string;
    toUid: string;
    amount: number;
    method: SettlementMethod;
    note: string;
  }) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const ref = collection(db, 'groups', groupId, 'settlements');
    await addDoc(ref, {
      ...data,
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });
  };

  return { settlements, loading, recordSettlement };
}
