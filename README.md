# Arkiv Blog Challenge

A Vite + React web application that uses [Arkiv](https://arkiv.network) (Kaolin testnet) as a backend for a small blog.

- **Admin** (`0x86d5Ef282afeA49720B424D0B87BAA145D331c79`) can create, edit, and delete posts after connecting MetaMask.
- **Everyone else** sees a read-only feed pulled directly from Arkiv.
- Posts are stored as Arkiv entities and sorted by a numeric `createdAt` attribute (newest first).
- Read queries are scoped by both the project attribute and `.createdBy(ADMIN_ADDRESS)` so unrelated entities can't show up in the feed.

The Arkiv usage patterns follow the rules in [`skills/skills/arkiv-best-practices/SKILL.md`](skills/skills/arkiv-best-practices/SKILL.md), and the MetaMask wiring is adapted from [`tutorial-source-code/metamask-tutorial`](tutorial-source-code/metamask-tutorial).

## Project layout

```
blog-app/                          # Vite + React + TypeScript blog app (this challenge)
tutorial-source-code/
  metamask-tutorial/               # Original sketch app the wallet wiring is based on
skills/                            # Arkiv best-practices skill used as a reference
admin_key_tests.priv               # Test-only private key (already funded on Kaolin)
admin_addr_tests.txt               # Matching admin address
```

## Running the blog app locally

```bash
cd blog-app
npm install
npm run dev
```

Then visit `http://localhost:5173/`.

You'll need MetaMask installed. The app will prompt you to switch to / add the Kaolin chain (id `60138453025`). Connect with the admin wallet to get the admin UI; connect with any other wallet to see the read-only viewer.

### About `admin_key_tests.priv`

The file contains the private key for the admin wallet on the Kaolin testnet. It is included so that you can import it into MetaMask for testing the admin flow. **Do not put any real funds on this address** — the key is public.

## Building

```bash
cd blog-app
npm run build
```

Static files are emitted to `blog-app/dist/`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which:

1. Builds the blog app with `--base=/<repo-name>/` and uploads it as the root of the GitHub Pages site.
2. Builds the original sketch tutorial with `--base=/<repo-name>/tutorial/` and publishes it under `/tutorial/`.
3. Deploys the combined output to GitHub Pages.

After deployment the blog will live at `https://arkiv-network.github.io/arkiv-blog-challenge/` and the tutorial at `https://arkiv-network.github.io/arkiv-blog-challenge/tutorial/`.
