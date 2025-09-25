// src/lib/gateway.ts
import { GatewayApiClient, RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk';

export const gateway = GatewayApiClient.initialize({
  applicationName: 'Mystery Box',
  applicationVersion: '1.0.0',
  applicationDappDefinitionAddress: undefined, // or your dApp definition if you have one
  networkId: RadixNetwork.Stokenet
});
