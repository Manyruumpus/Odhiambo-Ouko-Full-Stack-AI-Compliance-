// src/lib/radix.ts
import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';

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

// Initialize RDT with the saved/env address
export const rdt = RadixDappToolkit({
  dAppDefinitionAddress: getSavedDappDefinitionAddress(),
  networkId: 2 // Stokenet
});
