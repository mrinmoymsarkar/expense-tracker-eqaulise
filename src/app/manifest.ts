import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Equalize — Split Expenses, Not Friendships',
    short_name: 'Equalize',
    description:
      'Split expenses fairly with friends, family, and colleagues. Track who owes what, settle up instantly.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f2efe5',
    theme_color: '#1c503f',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
