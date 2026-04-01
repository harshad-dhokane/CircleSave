# CircleSave

CircleSave is a Starknet Sepolia frontend for social savings circles plus StarkZap-powered wallet actions like swap, DCA, and lending.

## Stack

- React 19
- TypeScript
- Vite
- Starknet React
- starknet.js
- StarkZap SDK v2

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

## Environment Variables

Set these values locally and in Vercel:

```bash
VITE_STARKNET_RPC_URL=https://starknet-sepolia-rpc.publicnode.com
VITE_CARTRIDGE_RPC_URL=https://api.cartridge.gg/x/starknet/sepolia
VITE_CIRCLE_FACTORY=0x59f8d156789b2c2dba46a36998dfff79f83acc6e6f355f09d3cc42cca97500
VITE_REPUTATION=0x5f67b0d4c13b2d1919f85494783746995157cb88b3de2999fa12db021cd5395
VITE_COLLATERAL_MANAGER=0x30437d641289c541df8f3a5f3f3a9fc6795d1622941a0cef682874c2d9e1b8b
```

These are client-side `VITE_` variables, so they are safe to configure as public frontend env vars in Vercel.

## Vercel Deployment

This repo is set up for Vercel frontend deployment:

- `vercel.json` adds SPA rewrites so client-side routes like `/profile`, `/swap`, and `/circles/:id` work after refresh.
- `.vercelignore` excludes `contracts/` and other non-frontend files from the Vercel upload.
- `vite.config.ts` uses `base: '/'` so nested routes load assets correctly on Vercel.

### Deploy Steps

1. Push this frontend folder to GitHub.
2. Import the repo into Vercel.
3. Keep the project root at the repo root.
4. Framework preset: `Vite`.
5. Build command:

```bash
npm run build
```

6. Output directory:

```bash
dist
```

7. Add the environment variables from `.env.example` in the Vercel dashboard.
8. Deploy.

## Notes

- The deployed app is frontend-only.
- The `contracts/` folder is not needed for Vercel deployment and is excluded from upload.
- If you update deployed Starknet addresses later, update both `.env` and the Vercel environment variables.

## Build Check

```bash
npm run build
```
