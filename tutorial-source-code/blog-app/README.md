# Arkiv Blog

Vite + React app demonstrating CRUD on top of the [Arkiv](https://arkiv.network)
Kaolin testnet.

## Roles

The connected wallet address determines what you can do:

- **Admin** (`0x86d5Ef282afeA49720B424D0B87BAA145D331c79`) — can create, edit and
  delete blog posts.
- **Anyone else (or no wallet connected at all)** — read-only view of posts
  authored by the admin.

The admin's private key for the Kaolin testnet is provided at the repo root
(`admin_key_tests.priv`). Import it into MetaMask to use the admin role.

## How it works

- All posts are stored as Arkiv entities tagged with the project attribute
  `project=arkiv-blog-challenge-v1` and `entityType=blog-post`.
- A numeric `createdAt` attribute is stored on every entity and used as the
  sort key (`orderBy(desc("createdAt", "number"))`) so posts always come
  back newest-first.
- The post list is filtered by `.ownedBy(ADMIN_ADDRESS)` so only entities
  owned by the trusted admin wallet are surfaced — even if someone else
  attaches the same project attribute, those entities will not appear.

## Develop

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. You'll need MetaMask installed in the browser.

## Build

```bash
npm run build
```

## Deploy

The repository's GitHub Actions workflow (`.github/workflows/deploy.yml`)
builds this app and the metamask sketch tutorial side-by-side and publishes
both to GitHub Pages on every push to `main`.
