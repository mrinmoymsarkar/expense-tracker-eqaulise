'use client';

import { useRef } from 'react';

const THRESHOLD = 80;

export function useSwipeDown(onDismiss: () => void): {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
} {
  const startY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (_e: React.TouchEvent) => {
    // no-op: we only act on end
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - startY.current;
    if (dy > THRESHOLD) {
      onDismiss();
    }
  };

  return { handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
