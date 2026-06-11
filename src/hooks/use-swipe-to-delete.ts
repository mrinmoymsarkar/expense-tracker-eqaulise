'use client';

import { useState, useRef } from 'react';

const THRESHOLD = 60;
const MAX_TRANSLATE = 88;

export function useSwipeToDelete(onDelete: () => void): {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  translateX: number;
  swiping: boolean;
} {
  const [translateX, setTranslateX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const verticalLock = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    verticalLock.current = false;
    setSwiping(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!swiping && Math.abs(dy) > Math.abs(dx)) {
      verticalLock.current = true;
    }

    if (verticalLock.current) return;

    // Only leftward swipe
    if (dx >= 0) {
      setTranslateX(0);
      return;
    }

    setSwiping(true);
    setTranslateX(Math.max(-MAX_TRANSLATE, dx));
  };

  const onTouchEnd = (_e: React.TouchEvent) => {
    if (verticalLock.current) return;

    if (translateX <= -THRESHOLD) {
      onDelete();
    }
    setTranslateX(0);
    setSwiping(false);
  };

  return { handlers: { onTouchStart, onTouchMove, onTouchEnd }, translateX, swiping };
}
