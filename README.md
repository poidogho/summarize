# summarize
AI tooling to summarize web pages and documents

## Prerequisites
- Node.js 18.12+ (recommended)
- pnpm 9+ (works with Node 18+)

If you are on Node 16, use `npx pnpm@7` for install/run commands.

## Install dependencies
From the repo root:
```
pnpm install
```
Node 16 fallback:
```
npx pnpm@7 install
```

## Run all packages together
Run each package in a separate terminal:
```
pnpm --filter web dev
pnpm --filter server dev
```
Node 16 fallback:
```
npx pnpm@7 --filter web dev
npx pnpm@7 --filter server dev
```

Web runs on `http://localhost:3000` by default.  
Server runs on `http://localhost:4000` by default.

## Run packages individually
Web:
```
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web start
```

Server:
```
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server start
```

Node 16 fallback:
```
npx pnpm@7 --filter web dev
npx pnpm@7 --filter server dev
```
