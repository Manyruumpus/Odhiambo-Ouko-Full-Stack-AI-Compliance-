// src/lib/radix.ts
import { RadixDappToolkit, RadixNetwork, DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit';

export const rdt = RadixDappToolkit({
  networkId: RadixNetwork.Stokenet,
  applicationName: 'Mystery Box',
  applicationVersion: '1.0.0',
  dAppDefinitionAddress: 'account_tdx_2_129tv3jlmex3z72dk060k0lur3hkqmcswgc3ynh90rfd3mtywpkza7z', // any valid Stokenet account id is acceptable here
});

// Request: at least one account (ongoing permission)
rdt.walletApi.setRequestData(
  DataRequestBuilder.config({
    accounts: { numberOfAccounts: { quantifier: 'atLeast', quantity: 1 } },
  })
);
