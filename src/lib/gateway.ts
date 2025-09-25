// src/lib/gateway.ts
import { GatewayApiClient, RadixNetwork } from '@radixdlt/babylon-gateway-api-sdk';

export const gateway = GatewayApiClient.initialize({ networkId: RadixNetwork.Stokenet });
