export async function apiFetch(path, { method='GET', body, headers } = {}) {
  const url = path.startsWith('/api') ? path : `/api${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    credentials: 'include',
  };
  if (body && !(body instanceof FormData)) opts.body = JSON.stringify(body);
  if (body instanceof FormData) { delete opts.headers['Content-Type']; opts.body = body; }

  try {
    console.log('[API]', method, url);
    const res = await fetch(url, opts);
    
    // --- MODIFIED ERROR HANDLING ---
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      
      try {
        // Try to parse it as JSON
        const json = JSON.parse(text);
        // If it has a 'message' field, throw that clean message.
        if (json && json.message) {
          throw new Error(json.message);
        }
      } catch (e) {
        // It wasn't JSON, or parsing failed. Fall through to the original error.
      }
      
      // Fallback: throw the original-style error
      throw new Error(`HTTP ${res.status} @ ${url} — ${text}`);
    }
    // --- END MODIFICATION ---

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : null;
  } catch (err) {
    console.error('apiFetch failed:', err);
    throw err;
  }
}