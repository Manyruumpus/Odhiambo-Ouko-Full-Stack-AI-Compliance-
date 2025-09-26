# Mystery Box (Radix Stokenet)

One-hand, swipe-based mystery-box mobile web app built with React + Radix dApp Toolkit. Connect wallet, see live XRD balance (5 s), open the box with tap/swipe, and queue “mint” requests offline that sync when back online.

## Live Demo
- URL: https: https://odhiambo-ouko-full-stack-ai-complia-nine.vercel.app/
- 30-sec demo GIF: https://www.loom.com/share/fd9d18754b1e4f31839d3e09711335a1?sid=13b6c74a-5725-4e4c-bf49-25d12c65d95c

## Features (Challenge Mapping)
- Wallet & Balance
  - √ Connect any Radix wallet (one tap) [RDT √ button]
  - Live XRD balance (poll every 5 s, visibility-aware)
  - Auto-disconnect after 5 min idle (hook-based)
- Mystery-Box Flow
  - Tap or swipe up to open the box
  - RNG outcome (Web Crypto) → queued mint POST (offline ready)
  - 400 ms CSS reveal animation (< 30 KB)
  - Offline-first: Workbox Background Sync queues /api/mint and replays
- Share + Polish
  - Native Web Share (clipboard fallback)
  - Daily streak counter with localStorage (+1 per day, resets on gap)

## Tech
- React + Vite, TypeScript
- @radixdlt/radix-dapp-toolkit (RDT) for wallet connection
- Babylon Gateway API for balances (Stokenet)
- Workbox Background Sync for offline queue/replay
- Web Crypto for RNG, Web Share API for sharing
- PWA: manifest.json + service worker

## Setup
- npm i
- npm run dev

- Use Radix Wallet on Stokenet; copy your Stokenet account address into lib/radix.ts as dAppDefinitionAddress if needed.
- Faucet (Stokenet) to get test XRD for balance testing.

## Build
- npm run build
- npm run preview


## How it works
- Wallet: RDT √ Connect Button renders a secure connect flow and exposes walletData$ for accounts.
- Balance: Gateway POST /state/entity/page/fungibles is polled every 5 s (paused when tab hidden); XRD entry is extracted.
- Idle disconnect: hook uses Idle Detection (fallback to timer + visibility) to call rdt.disconnect() after 5 minutes idle.
- RNG + mint: crypto.getRandomValues selects a badge class. Client POST /api/mint is sent; when offline, Workbox queues and replays later.
- Share: navigator.share() if available; otherwise URL copied to clipboard.
- Streak: localStorage stores last-visited day and increments on day changes.

## File Map
- src/App.tsx — UI + logic (connect, polling, box, RNG, share, streak)
- src/lib/radix.ts — RDT init (dAppDefinitionAddress)
- src/lib/rng.ts — CSPRNG helpers
- src/lib/api.ts — postMint wrapper
- src/lib/streak.ts — streak helpers
- src/lib/share.ts — Web Share helper
- src/hooks/useIdleDisconnect.ts — idle auto-disconnect
- public/sw.js — Workbox Background Sync for /api/mint
- public/manifest.json — PWA manifest
- src/styles/box.css — lightweight 400 ms animation + layout

## Screenshots
- assets/1-connect.png
- assets/2-balance.png
- assets/3-open-box.png
- assets/4-offline-queued.png

## Notes
- The on-chain mint endpoint can replace the dev POST stub without UI changes; offline queue continues to work.
- CSS kept lightweight; dvh + safe-area used for mobile layout.

## License
MIT
