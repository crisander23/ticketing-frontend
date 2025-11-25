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

    // --- CRITICAL FIX: Check Super Admin FIRST and separately ---
    if (['superadmin', 'super_admin', 'owner', 'system'].includes(s)) return 'superadmin';

    // Then check regular Admin
    if (['admin', 'administrator'].includes(s)) return 'admin';

    if (['agent', 'support', 'staff'].includes(s)) return 'agent';
    if (['client', 'customer', 'enduser', 'user'].includes(s)) return 'client';
  }

  // numeric role codes (fallback)
  const nums = candidates
    .map((x) => (x === '' || x === null || x === undefined ? NaN : Number(x)))
    .filter((n) => !Number.isNaN(n));

  // default mapping guess: 1=client, 2=agent, 3=admin, 4=superadmin
  for (const n of nums) {
    if (n === 4) return 'superadmin'; // Assuming 4 is superadmin
    if (n === 3) return 'admin';
    if (n === 2) return 'agent';
    if (n === 1 || n === 0) return 'client';
  }

  // last resort
  return 'client'; // safe default
}

export function normalizeUser(raw) {
  // flatten common fields so the app can read consistently
  // We call extractRole here so 'user_type' is definitely correct in the state
  const detectedRole = extractRole(raw);

  const user = {
    ...raw,
    user_id:
      raw?.user_id ??
      raw?.id ??
      raw?.user?.user_id ??
      raw?.user?.id ??
      null,
    
    // Ensure this is set to the detected role ('superadmin', 'admin', etc.)
    user_type: detectedRole, 
    role: detectedRole, // useful to have both

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