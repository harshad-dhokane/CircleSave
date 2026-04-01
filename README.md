# CircleSave

CircleSave is a Starknet Sepolia app for social savings circles built around the StarkZap v2 release. The product idea is simple:

- users create or join savings circles on-chain
- users fund those circles with StarkZap-powered swap, DCA, and lending flows
- public logs and dashboard activity are read from contracts, not browser-only storage

This repo is the frontend for that experience. It combines CircleSave contract flows with StarkZap v2 routing, order automation, Vesu lending, and contract-backed activity views.

## Live Help Center

For the full in-app product guide, implementation walkthrough, and route-by-route StarkZap v2 feature map, open the deployed Help Center:

[https://circlesavezap.vercel.app/sdk](https://circlesavezap.vercel.app/sdk)

Alias route:

[https://circlesavezap.vercel.app/help](https://circlesavezap.vercel.app/help)

## Core Idea

CircleSave is not just a swap demo or a plain circle manager.

The goal of the build is to show StarkZap v2 as the execution layer behind a more useful product:

- social savings circles are the product surface
- StarkZap v2 powers how users get funds into those circles
- Circle creation, participation, automation, and visibility are tied together in one flow

That means users can:

- discover circles
- create circles
- join and contribute on-chain
- swap into STRK before joining or contributing
- create recurring DCA orders to accumulate STRK
- use Vesu lending actions before funding a circle
- inspect public contract activity without signing in
- inspect wallet-specific activity inside the dashboard
