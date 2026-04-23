import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";
import "viem/window";

/**
 * The wallet address allowed to create, edit, and delete blog posts.
 * All other connected wallets get a read-only view.
 */
export const ADMIN_ADDRESS =
  "0x86d5Ef282afeA49720B424D0B87BAA145D331c79".toLowerCase() as `0x${string}`;

/**
 * Per Arkiv best practice #1: every entity created by this app shares this
 * attribute so we can filter our project's data out of the shared database.
 */
export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "arkiv-blog-challenge-2026",
} as const;

export const POST_ENTITY_TYPE = "blogPost";

/** True when the connected address matches the admin address (case-insensitive). */
export function isAdmin(address: string | null | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS;
}

async function switchToKaolinChain() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const chainIdHex = `0x${kaolin.id.toString(16)}`;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 4902
    ) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: kaolin.name,
            nativeCurrency: kaolin.nativeCurrency,
            rpcUrls: kaolin.rpcUrls.default.http,
            blockExplorerUrls: [kaolin.blockExplorers.default.url],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

export async function connectWallet(): Promise<`0x${string}`> {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  await switchToKaolinChain();

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as `0x${string}`[];

  return accounts[0];
}

/**
 * Create the read-only public client. Safe to use without a connected wallet.
 */
export function createReadClient() {
  return createPublicClient({
    chain: kaolin,
    transport: http(),
  });
}

/**
 * Create the wallet client used for write operations. Requires MetaMask and a
 * connected account.
 */
export function createWriteClient(account: `0x${string}`) {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  return createWalletClient({
    chain: kaolin,
    transport: custom(window.ethereum),
    account,
  });
}
