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

3. Fill in your local `.env` with your own values.

Do not commit `.env`. It is already ignored by Git.

4. Start the app:

```bash
npm run dev
```

## Environment Variables

Add these variable names locally and in Vercel:

```bash
VITE_STARKNET_RPC_URL=your_rpc_url
VITE_CARTRIDGE_RPC_URL=your_cartridge_rpc_url
VITE_CIRCLE_FACTORY=your_circle_factory_address
VITE_REPUTATION=your_reputation_address
VITE_COLLATERAL_MANAGER=your_collateral_manager_address
```

These are client-side `VITE_` variables. Keep the actual values out of Git and set them in your local `.env` and in Vercel Project Settings.

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

7. In Vercel go to `Project Settings -> Environment Variables`.
8. Add these keys:

```bash
VITE_STARKNET_RPC_URL
VITE_CARTRIDGE_RPC_URL
VITE_CIRCLE_FACTORY
VITE_REPUTATION
VITE_COLLATERAL_MANAGER
```

9. Paste your real values there.
10. Deploy.

## Notes

- The deployed app is frontend-only.
- The `contracts/` folder is not needed for Vercel deployment and is excluded from upload.
- If you update deployed Starknet addresses later, update your local `.env` and the Vercel environment variables.

## Build Check

```bash
npm run build
```
