// lib/auth-utils.js
function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

export function extractRole(user) {
  // try common fields in order
  const candidates = [
    user?.user_type,
    user?.role,
    user?.type,
    user?.role_name,
    user?.user?.user_type,      // nested user
    user?.user_type_id,
    user?.role_id,
    user?.user?.role_id,
  ];

  // normalize string roles
  for (const c of candidates) {
    const s = toStr(c).toLowerCase();
    if (!s) continue;
    if (['admin', 'administrator', 'superadmin'].includes(s)) return 'admin';
    if (['agent', 'support', 'staff'].includes(s)) return 'agent';
    if (['client', 'customer', 'enduser', 'user'].includes(s)) return 'client';
    // if it looks numeric as a string, we handle below
  }

  // numeric role codes (adjust if your API uses another mapping)
  const nums = candidates
    .map((x) => (x === '' || x === null || x === undefined ? NaN : Number(x)))
    .filter((n) => !Number.isNaN(n));

  // default mapping guess: 1=client, 2=agent, 3=admin
  for (const n of nums) {
    if (n === 3) return 'admin';
    if (n === 2) return 'agent';
    if (n === 1 || n === 0) return 'client';
  }

  // last resort: if the API put role inside another nested shape you can add more probes here
  return 'client'; // safe default
}

export function normalizeUser(raw) {
  // flatten common fields so the app can read consistently
  const user = {
    ...raw,
    user_id:
      raw?.user_id ??
      raw?.id ??
      raw?.user?.user_id ??
      raw?.user?.id ??
      null,
    user_type: extractRole(raw),
    first_name:
      raw?.first_name ??
      raw?.user?.first_name ??
      '',
    email:
      raw?.email ??
      raw?.user?.email ??
      '',
  };
  return user;
}
