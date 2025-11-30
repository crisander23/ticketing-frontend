import { apiFetch } from './api';

// This wrapper ensures SWR uses our smart apiFetch (which attaches the token)
// instead of the plain browser fetch.
export const fetcher = (url) => apiFetch(url);