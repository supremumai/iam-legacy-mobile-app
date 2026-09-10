import { useAuth } from '../contexts/AuthContext';

/**
 * Returns true when the currently authenticated user has is_admin = true in their
 * profile. Reads the profile already loaded by AuthContext — no extra fetch.
 * Returns false when there is no session or the profile has not loaded yet.
 */
export function useIsAdmin(): boolean {
  const { profile } = useAuth();
  return profile?.is_admin ?? false;
}
