'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

export function SyncBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="w-full bg-amber-500/15 py-1.5 text-center font-code text-[0.6rem] uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
      Offline — changes will sync when you reconnect
    </div>
  );
}
