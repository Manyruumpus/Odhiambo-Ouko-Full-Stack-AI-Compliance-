// src/lib/rng.ts
export function csprngInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error('maxExclusive must be > 0');
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Use 32-bit value and reduce bias with rejection sampling
  const range = 0x100000000; // 2^32
  const limit = range - (range % maxExclusive);
  let x = buf[0];
  if (x >= limit) {
    // retry until within limit
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  }
  return x % maxExclusive;
}
export function randomUUID(): string {
  return crypto.randomUUID();
}
