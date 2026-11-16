'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';

type LandingTrailerProps = {
  /** Optimized poster image, e.g. /videos/equalize-demo-v1.webp */
  posterSrc: string;
  /** Encoded trailer, e.g. /videos/equalize-demo-v1.mp4 */
  videoSrc: string;
  /** Short length label shown to visitors, e.g. "0:25" */
  durationLabel?: string;
  className?: string;
};

type TrailerState = 'idle' | 'loading' | 'playing' | 'error';

const DEMO_SUMMARY =
  'The demo shows adding an expense, splitting it with a group and seeing who owes what.';

/**
 * Poster-first, click-to-play trailer for the /login entry page.
 *
 * No video element is mounted and no media is requested until the visitor
 * presses Play. Playback pauses when the tab is hidden or the player leaves
 * the viewport, and never resumes on its own. A failed video never blocks
 * sign-in: the error state offers Retry plus a written summary.
 */
export function LandingTrailer({
  posterSrc,
  videoSrc,
  durationLabel = '0:25',
  className,
}: LandingTrailerProps) {
  const [state, setState] = useState<TrailerState>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePlay = () => setState('loading');

  // The video only exists after a Play press. Try to start it from that
  // gesture; if the browser rejects the promise, the native controls stay
  // visible so the visitor can start it themselves.
  useEffect(() => {
    if (state === 'loading' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [state]);

  // Pause on hidden tab or when scrolled out of view. No auto-resume.
  useEffect(() => {
    if (state !== 'loading' && state !== 'playing') return;

    const onVisibilityChange = () => {
      if (document.hidden) videoRef.current?.pause();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) videoRef.current?.pause();
      },
      { threshold: 0.25 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
    };
  }, [state]);

  return (
    <div ref={containerRef} className={className}>
      <div className="relative aspect-video w-full overflow-hidden border border-border bg-black/5">
        {state === 'idle' && (
          <>
            <Image
              src={posterSrc}
              alt="First frame of the Equalize demo video"
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-contain"
            />
            <button
              type="button"
              onClick={handlePlay}
              aria-label={`Play the Equalize demo video, ${durationLabel}`}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="size-6" />
              </span>
            </button>
          </>
        )}

        {(state === 'loading' || state === 'playing') && (
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            poster={posterSrc}
            width={1920}
            height={1080}
            className="h-full w-full bg-black object-contain"
            onPlaying={() => setState('playing')}
            onError={() => setState('error')}
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag. {DEMO_SUMMARY}
          </video>
        )}

        {state === 'error' && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm">The demo video could not be loaded.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setState('loading')}
              className="gap-2"
            >
              <RotateCcw className="size-4" />
              Retry
            </Button>
            <p className="max-w-md text-xs text-muted-foreground">{DEMO_SUMMARY}</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Watch the {durationLabel} demo: add an expense, split it with a group, and
        see who owes what. Silent video, nothing loads until you press Play.
      </p>
    </div>
  );
}
