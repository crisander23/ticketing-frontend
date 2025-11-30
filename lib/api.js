// 1. Get the base URL (defaults to localhost:7230 if env is missing)
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

export async function apiFetch(endpoint, { method = 'GET', body, headers = {} } = {}) {
  if (!BASE_URL) {
    console.error('❌ CRITICAL: NEXT_PUBLIC_API_BASE is missing.');
    throw new Error('System Configuration Error: API Base URL is not set.');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };

  // 2. Attach Token
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('token');
    if (!token) {
        const storage = localStorage.getItem('ticketing_auth');
        if (storage) {
            const parsed = JSON.parse(storage);
            token = parsed.state?.token;
        }
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    if (body instanceof FormData) {
      delete opts.headers['Content-Type'];
      opts.body = body;
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, opts);
    
    // --- 3. HANDLE EXPIRED TOKEN (New Logic) ---
    if (res.status === 401) {
      // 401 means "Unauthorized" or "Token Expired"
      if (typeof window !== 'undefined') {
        // Clear all storage
        localStorage.removeItem('ticketing_auth');
        localStorage.removeItem('token');
        
        // Alert the user so they know why they were logged out
        alert("Your session has expired. Please login again.");
        
        // Force redirect to login
        window.location.href = '/login';
      }
      throw new Error('Session expired. Redirecting to login...');
    }
    // -------------------------------------------

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (text.trim().startsWith('<!DOCTYPE html>')) {
         throw new Error(`Endpoint not found (404). Check backend URL.`);
      }
      try {
        const json = JSON.parse(text);
        if (json && json.message) throw new Error(json.message);
      } catch (e) {}
      throw new Error(`HTTP ${res.status} error: ${text.substring(0, 100)}`);
    }

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : null;

  } catch (err) {
    console.error('apiFetch failed:', err.message);
    throw err;
  }
}