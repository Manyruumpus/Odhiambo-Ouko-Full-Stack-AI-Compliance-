// src/App.tsx
import { useEffect, useMemo, useState } from 'react';
import { rdt } from './lib/radix';
import { useIdleDisconnect } from './hooks/useIdleDisconnect';
import './styles/box.css';
import { csprngInt, randomUUID } from './lib/rng';
import { postMint } from './lib/api';
import { updateStreakOnVisit, loadStreak } from './lib/streak';
import { shareApp } from './lib/share';

type Account = { address: string };

const GATEWAY = 'https://stokenet.radixdlt.com';

// ---------- Gateway helpers ----------
async function fetchEntityFungibles(address: string) {
  const res = await fetch(`${GATEWAY}/state/entity/page/fungibles`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
    body: JSON.stringify({
      address,
      aggregation_level: 'Global',
      limit_per_page: 200
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${res.status}: ${text}`);
  }
  return res.json();
}

function extractXrdAmount(resp: any): number {
  const list = resp?.items ?? resp?.fungible_resources?.items ?? [];
  const x = list.find(
    (b: any) =>
      typeof b.resource_address === 'string' &&
      b.resource_address.toLowerCase().includes('xrd')
  );
  return x ? Number(x.amount) : 0;
}

// ---------- Component ----------
export default function App() {
  // Wallet/account + balance
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [xrdBalance, setXrdBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Box UI
  const [revealed, setRevealed] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('');

  // Share + streak
  const [streak, setStreak] = useState<number>(loadStreak());

  // Ensure √ Connect Button web component is defined
  useEffect(() => {
    import('@radixdlt/radix-dapp-toolkit');
  }, []);

  // Initialize streak on visit
  useEffect(() => {
    setStreak(updateStreakOnVisit());
  }, []);

  // Subscribe to wallet connection state
  useEffect(() => {
    const sub = rdt.walletApi.walletData$.subscribe((walletData: any) => {
      setAccounts(walletData?.accounts ?? []);
    });
    return () => sub.unsubscribe();
  }, []);

  const accountAddress = useMemo(
    () => (accounts.length ? accounts[0].address : ''),
    [accounts]
  );

  // Idle auto-disconnect when connected
  useIdleDisconnect(!!accountAddress);

  // Visibility-aware 5s polling for XRD balance
  useEffect(() => {
    if (!accountAddress) return;

    let active = true;
    let timer: number | undefined;

    async function poll() {
      try {
        const resp = await fetchEntityFungibles(accountAddress);
        if (!active) return;
        setXrdBalance(extractXrdAmount(resp));
        setError(null);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Balance fetch failed');
        setXrdBalance(null);
      } finally {
        if (active && document.visibilityState === 'visible') {
          timer = window.setTimeout(poll, 5000);
        }
      }
    }

    function handleVisibility() {
      if (!active) return;
      if (timer) window.clearTimeout(timer);
      if (document.visibilityState === 'visible') {
        poll();
      }
    }

    if (document.visibilityState === 'visible') {
      poll();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [accountAddress]);

  // Gesture + RNG + mint
  function onReveal(outcome: number) {
    setLastOutcome(outcome);
    setRevealed(true);
    setTimeout(() => setRevealed(false), 450);
  }

  async function openMysteryBox() {
    if (!accountAddress) {
      setStatus('Connect wallet first');
      return;
    }
    const outcome = csprngInt(5); // badge classes 0..4
    onReveal(outcome);
    setStatus('Queuing mint…');
    const req = {
      account: accountAddress,
      badgeClass: outcome,
      clientSeed: randomUUID(),
      ts: Date.now()
    };
    try {
      await postMint(req);
      setStatus('Mint submitted');
    } catch {
      setStatus('Queued offline (will sync)');
    }
  }

  // Simple swipe-up detection
  let startY = 0;
  function onTouchStart(e: React.TouchEvent) { startY = e.touches[0].clientY; }
  function onTouchEnd(e: React.TouchEvent) {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 30) openMysteryBox();
  }

  // Programmatic connect (optional)
  const programmaticConnect = async () => {
    const result = await rdt.walletApi.sendRequest();
    if (result.isErr()) console.error(result.error);
  };

  // ---- UI ----
  return (
    <div className="screen" style={{ color: '#fff' }}>
      <div className="stack" style={{ color: '#fff' }}>
        <h1 className="title" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
          Mystery Box
        </h1>

        <div
          className={`card ${revealed ? 'revealed' : ''}`}
          onClick={openMysteryBox}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="button"
          aria-label="Open mystery box"
          style={{ color: '#fff' }}
        >
          {/* Center title on the box (always visible, fades out slightly when revealed) */}
          <div
            style={{
              position: 'absolute',
              top: '38%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 0.3,
              opacity: revealed ? 0 : 0.95,
              transition: 'opacity 400ms ease',
              pointerEvents: 'none',
              textShadow: '0 1px 2px rgba(0,0,0,.8)'
            }}
          >
            Mystery Box
          </div>

          {/* Sliding lid */}
          <div className="lid" />

          <div className="body">
            {/* Result pill (appears after reveal) */}
            <div
              style={{
                position: 'absolute',
                top: '22%',
                left: '50%',
                transform: `translate(-50%, ${revealed ? '0' : '18px'})`,
                opacity: revealed ? 1 : 0,
                transition: 'transform 400ms ease, opacity 400ms ease',
                background: 'rgba(16,185,129,0.95)',
                color: '#0b0f12',
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 800,
                letterSpacing: 0.3,
                boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
                pointerEvents: 'none'
              }}
            >
              {lastOutcome === null ? '' : `Badge #${lastOutcome}`}
            </div>

            {/* Swipe/tap hint */}
            <div className="hint" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
              <span className="chev" />
              Tap or swipe up
            </div>
          </div>
        </div>

        <div className="panel" style={{ color: '#fff' }}>
          {/* Share + Streak row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <button className="button" onClick={async () => { await shareApp(); }} style={{ color: '#fff' }}>
              Share
            </button>
            <div className="button" style={{ color: '#fff' }}>
              Streak: <b style={{ marginLeft: 6, color: '#fff' }}>{streak}</b>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <radix-connect-button />
          </div>
          <button className="button" onClick={programmaticConnect} style={{ color: '#fff' }}>
            Connect Radix Wallet
          </button>

          {accountAddress && (
            <div className="grp" style={{ color: '#fff' }}>
              <div className="addr" style={{ color: '#fff' }}>Account: {accountAddress}</div>
              <div className="addr" style={{ color: '#fff' }}>
                XRD Balance:{' '}
                <b style={{ color: '#fff' }}>
                  {xrdBalance === null ? 'Loading…' : xrdBalance.toLocaleString()}
                </b>
              </div>
              {error && <div className="stat" style={{ color: '#fff' }}>{error}</div>}
            </div>
          )}

          {status && <div className="stat" style={{ color: '#fff' }}>{status}</div>}
        </div>
      </div>
    </div>
  );
}
