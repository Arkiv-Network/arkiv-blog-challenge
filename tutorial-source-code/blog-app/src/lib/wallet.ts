import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";
import "viem/window";

/**
 * Switch MetaMask to the Kaolin Arkiv testnet, adding it if necessary.
 */
async function switchToKaolinChain(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const chainIdHex = `0x${kaolin.id.toString(16)}`;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: unknown) {
    // 4902: chain not added to wallet — add it then continue.
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

/**
 * Prompt the user to connect their MetaMask wallet and switch to Kaolin.
 * Returns the connected account address.
 */
export async function connectWallet(): Promise<`0x${string}`> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  await switchToKaolinChain();

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as `0x${string}`[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No account returned from MetaMask");
  }

  return accounts[0];
}

/**
 * Build Arkiv clients. The public client is always safe to use (read-only).
 * The wallet client requires MetaMask and a connected account for writes.
 */
export function createArkivClients(account?: `0x${string}`) {
  const publicClient = createPublicClient({
    chain: kaolin,
    transport: http(),
  });

  if (!window.ethereum || !account) {
    return { publicClient, walletClient: null };
  }

  const walletClient = createWalletClient({
    chain: kaolin,
    transport: custom(window.ethereum),
    account,
  });

  return { publicClient, walletClient };
}

/** Public (read-only) Arkiv client. Safe to call from anywhere. */
export const publicClient = createPublicClient({
  chain: kaolin,
  transport: http(),
});
