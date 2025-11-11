export async function fetcher(path) {
  const url = path.startsWith('/api') ? path : `/api${path}`;
  try {
    console.log('[SWR] GET', url);
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} @ ${url} — ${text}`);
    }
    return res.json();
  } catch (err) {
    console.error('SWR fetcher failed:', err);
    throw err;
  }
}
