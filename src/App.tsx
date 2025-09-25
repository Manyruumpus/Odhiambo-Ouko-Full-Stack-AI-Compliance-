// src/App.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  rdt,
  getSavedDappDefinitionAddress,
  saveDappDefinitionAddress,
  requestAccountsOnce
} from './lib/radix';
import { useIdleDisconnect } from './hooks/useIdleDisconnect';
import './styles/box.css';
import { csprngInt, randomUUID } from './lib/rng';
import { postMint } from './lib/api';
import { updateStreakOnVisit, loadStreak } from './lib/streak';
import { shareApp } from './lib/share';

type Account = { address: string };

// Foundation Stokenet Gateway provider [docs]
const GATEWAY = 'https://stokenet.radixdlt.com';

// Well‑known XRD resource address (Stokenet networkId 2) [docs]
const XRD_STOKENET =
  'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc';

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
  // Tolerate multiple shapes returned by Gateway
  const list =
    resp?.fungible_resources?.items ??
    resp?.items ??
    [];
  const x = list.find((b: any) => {
    const addr = b.resource_address ?? b.address;
    return typeof addr === 'string' && addr === XRD_STOKENET;
  });
  if (!x) return 0;
  const amt = typeof x.amount === 'object' ? x.amount?.value : x.amount;
  return Number(amt ?? 0);
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

  // dApp Definition editor
  const [dappAddr, setDappAddr] = useState<string>('');

  // Throttled debug log
  const lastLogRef = useRef(0);

  // Define √ Connect Button element
  useEffect(() => {
    import('@radixdlt/radix-dapp-toolkit');
  }, []);

  // Init streak + show active dApp definition
  useEffect(() => {
    setStreak(updateStreakOnVisit());
    setDappAddr(getSavedDappDefinitionAddress());
  }, []);

  // Subscribe to wallet state; ensure an account is shared
  useEffect(() => {
    const sub = rdt.walletApi.walletData$.subscribe(async (walletData: any) => {
      const accs = walletData?.accounts ?? [];
      setAccounts(accs);
      // If connected but user hasn't shared an account yet, prompt once
      if (walletData?.connected && accs.length === 0) {
        try { await requestAccountsOnce(); } catch {}
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const accountAddress = useMemo(
    () => (accounts.length ? accounts[0].address : ''),
    [accounts]
  );

  // Idle auto-disconnect when connected
  useIdleDisconnect(!!accountAddress);

  // 5 s polling for XRD; pause when tab hidden
  useEffect(() => {
    if (!accountAddress) return;

    // Ensure Stokenet address prefix (network 2)
    if (!accountAddress.startsWith('account_tdx_2_')) {
      setError('Connected account is not on Stokenet (expected account_tdx_2_)');
      return;
    }

    let active = true;
    let timer: number | undefined;

    async function poll() {
      try {
        const resp = await fetchEntityFungibles(accountAddress);
        if (!active) return;
        const now = Date.now();
        if (now - lastLogRef.current > 60000) {
          console.debug('Gateway fungibles sample:', resp);
          lastLogRef.current = now;
        }
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
    const outcome = csprngInt(5);
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

  // Swipe-up
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

  // Save dApp Definition and reload to re-init RDT
  function saveDapp() {
    if (!dappAddr || !dappAddr.startsWith('account_')) {
      alert('Enter a valid dApp Definition account address');
      return;
    }
    saveDappDefinitionAddress(dappAddr);
    location.reload();
  }

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
          {/* Center label */}
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

          <div className="lid" />

          <div className="body">
            {/* Result pill */}
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

            <div className="hint" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
              <span className="chev" />
              Tap or swipe up
            </div>
          </div>
        </div>

        {/* Share + Streak row */}
        <div className="panel" style={{ color: '#fff' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <button className="button" onClick={async () => { await shareApp(); }} style={{ color: '#fff' }}>
              Share
            </button>
            <div className="button" style={{ color: '#fff' }}>
              Streak: <b style={{ marginLeft: 6, color: '#fff' }}>{streak}</b>
            </div>
          </div>

          {/* dApp Definition editor */}
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 360, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
            <input
              value={dappAddr}
              onChange={(e) => setDappAddr(e.target.value)}
              placeholder="dApp Definition address (account_tdx_...)"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(30,41,59,0.55)',
                color: '#fff'
              }}
            />
            <button className="button" onClick={saveDapp} style={{ color: '#fff', whiteSpace: 'nowrap' }}>
              Save
            </button>
          </div>
          <div className="stat" style={{ color: '#fff' }}>
            Active dApp: <b style={{ color: '#fff' }}>{getSavedDappDefinitionAddress() || 'not set'}</b>
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
