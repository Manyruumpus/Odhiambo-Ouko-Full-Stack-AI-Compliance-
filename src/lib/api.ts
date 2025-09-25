// src/lib/api.ts
export type MintRequest = {
  account: string;
  badgeClass: number; // outcome
  clientSeed: string; // uuid for audit
  ts: number;
};

export async function postMint(req: MintRequest): Promise<{ ok: true }> {
  const res = await fetch('/api/mint', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error(`Mint failed ${res.status}`);
  return { ok: true };
}
