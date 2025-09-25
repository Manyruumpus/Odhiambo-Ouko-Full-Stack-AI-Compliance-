import { RadixDappToolkit, DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit';

const KEY = 'mysterybox.dappDefAddr';

export function getSavedDappDefinitionAddress(): string {
  return (
    (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null) ||
    import.meta.env.VITE_DAPP_DEFINITION_ADDRESS ||
    ''
  );
}

export function saveDappDefinitionAddress(addr: string) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, addr.trim());
}

export const rdt = RadixDappToolkit({
  dAppDefinitionAddress: getSavedDappDefinitionAddress(),
  networkId: 2 // Stokenet [web:357]
});

// Ongoing: ask the wallet to share >= 1 account
rdt.walletApi.setRequestData(
  DataRequestBuilder.accounts().atLeast(1)
);

// Fallback one‑time request if user connected but didn’t share an account
export async function requestAccountsOnce() {
  return rdt.walletApi.sendOneTimeRequest(
    DataRequestBuilder.accounts().atLeast(1)
  );
}
