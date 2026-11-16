# Landing trailer (/login)

Short click-to-play product demo on the sign-in entry page. Poster first,
video only after a visitor presses Play. This doc covers the footage,
export recipe and checks. Component: `src/components/landing-trailer.tsx`.

## Assets

Expected files (not committed yet, see "Status" below):

- `public/videos/equalize-demo-v1.mp4` - the trailer
- `public/videos/equalize-demo-v1.webp` - poster frame, 16:9

Bump the `v1` in both the file names and the `LandingTrailer` props in
`src/app/login/page.tsx` when replacing the video, so caches never serve a
stale mix.

## Storyboard (20-25 s)

1. 0-3 s: the promise - "Every shared expense, clear."
2. 3-10 s: add one expense.
3. 10-18 s: split it in a group; show who owes whom.
4. 18-25 s: the updated dashboard, then a short sign-up prompt.

Record a clean, high-resolution master using synthetic names and expenses
only: no real balances, emails, receipts or notifications. Crop into each
task and enlarge key labels; a whole desktop screen shrunk to phone width
is unreadable even at 1080p.

## Export recipe (starting point, tune by eye)

```
ffmpeg -i master.mov -vf scale=1920:-2 -c:v libx264 -crf 24 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an public/videos/equalize-demo-v1.mp4
```

- 1920x1080, 24-30 fps, H.264 MP4, no audio track.
- Budget: 3-5 MB for 20-25 s (about 1.6 Mb/s average). Judge compression
  on small text and transitions, not resolution alone. If text degrades,
  simplify motion or shorten the edit before accepting blur.
- Poster: a representative frame, WebP, roughly 50-100 KB:

```
ffmpeg -ss 2 -i public/videos/equalize-demo-v1.mp4 -frames:v 1 \
  -vf scale=1280:-2 -quality 82 public/videos/equalize-demo-v1.webp
```

- Only add a WebM/VP9 source if a measured encode is smaller at comparable
  quality; then list it first in the `<video>` element.

## Behavior contract (implemented in the component)

- Zero trailer-media requests before Play (poster image only).
- Native `<video>` with controls, `playsInline`, 16:9, `object-contain`
  (no cropping of UI text).
- No autoplay, no loop, no motion for reduced-motion visitors beyond what
  they start themselves.
- Pauses on hidden tab and when scrolled out of view; never auto-resumes.
- Load failure shows Retry plus the written summary; sign-in is never
  blocked.
- If the poster asset is missing entirely (for example before the trailer
  is produced), the component renders its `fallback` content instead of a
  broken image: the original sample ledger rows on desktop, nothing on
  mobile.
- Keyboard: the Play control is a real button with an accessible name;
  the native controls handle the rest.

## Checks before shipping

- Cold-load /login on a throttled mobile connection: no MP4 request until
  Play; poster within budget.
- Playback inspected at 320/390 px, tablet, desktop and fullscreen; small
  text readable, controls usable (Chrome, Firefox, Android Chrome, iOS
  Safari incl. low-power mode).
- Keyboard-only Play/pause/seek; visible focus.
- Sign-in, sign-up, Google sign-in, reset password and email verification
  regression pass with the trailer present.
- `npm run typecheck` and `npm run build` pass (the build ignores TS/ESLint
  errors, so run typecheck separately).
- Keep trailer files out of the service worker: `public/sw.js` passes
  `/videos/` through; do not precache multi-MB media.

## Status

- [ ] Record master footage (synthetic data)
- [ ] Encode MP4 + poster, verify sizes against the budget
- [ ] Commit assets, then merge the login-page wiring PR
