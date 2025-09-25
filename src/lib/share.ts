// src/lib/share.ts
export async function shareApp() {
  const url = location.href;
  const title = 'Mystery Box';
  const text = 'Open the Mystery Box on Radix Stokenet with me!';
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
    return true;
  } catch {
    return false;
  }
}
