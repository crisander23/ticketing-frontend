// lib/guards.js
import { extractRole } from './auth-utils';

export function routeForRole(role) {
  // Reuse extraction logic to ensure case-insensitivity (e.g., 'Admin' -> 'admin')
  const r = extractRole({ user_type: role }); 

  switch (r) {
    case 'superadmin': return '/superadmin/dashboard'; // <--- Added this
    case 'admin':      return '/admin/dashboard';
    case 'agent':      return '/agent/dashboard';
    case 'client':     return '/client/dashboard';
    default:           return '/client/dashboard'; // Fallback
  }
}

export function routeForUser(user) {
  if (!user) return '/login';
  return routeForRole(extractRole(user));
}