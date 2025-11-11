// lib/guards.js
import { extractRole } from './auth-utils';

export function routeForRole(role) {
  const r = extractRole({ user_type: role }); // reuse logic
  switch (r) {
    case 'admin':  return '/admin/dashboard';
    case 'agent':  return '/agent/dashboard';
    case 'client': return '/client/dashboard';
    default:       return '/client/dashboard';
  }
}

export function routeForUser(user) {
  return routeForRole(extractRole(user));
}
