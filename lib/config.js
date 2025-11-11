// lib/config.js
// Read once at build; ensure no trailing slash; default to local API
const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7230';
export const API_URL = raw.replace(/\/+$/, '');

// Safe join: avoids double slashes no matter what path you pass
export function apiJoin(path = '') {
  const p = String(path || '');
  return p.startsWith('/') ? `${API_URL}${p}` : `${API_URL}/${p}`;
}
