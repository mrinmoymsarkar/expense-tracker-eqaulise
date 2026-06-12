'use client';

import { useState, useEffect } from 'react';

export function useVisualViewport(): { vvHeight: number | null; keyboardOpen: boolean } {
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      const h = Math.round(vv!.height);
      setVvHeight(h);
      setKeyboardOpen(window.innerHeight - vv!.height > 100);
    }

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return { vvHeight, keyboardOpen };
}
