import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';

export type AuthState = 
  | 'loading'           // Clerk or Convex is still loading
  | 'unauthenticated'   // User is not signed in with Clerk
  | 'profile-loading'   // Signed in but Convex profile is loading
  | 'profile-missing'   // Signed in but no Convex profile (webhook may be pending)
  | 'authenticated';    // Fully authenticated with profile

export interface AuthGuardResult {
  state: AuthState;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  hasProfile: boolean;
  user: ReturnType<typeof useQuery<typeof api.users.getCurrentUser>> | null;
}

/**
 * Hook to check authentication state and profile existence.
 * Use this to guard routes that require authentication.
 */
export function useAuthGuard(): AuthGuardResult {
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Determine the auth state
  const getState = (): AuthState => {
    // Clerk is still loading
    if (!isLoaded) {
      return 'loading';
    }

    // User is not signed in
    if (!isSignedIn) {
      return 'unauthenticated';
    }

    // User is signed in but Convex query is still loading
    if (currentUser === undefined) {
      return 'profile-loading';
    }

    // User is signed in but no profile exists (webhook pending or error)
    if (currentUser === null) {
      return 'profile-missing';
    }

    // Fully authenticated with profile
    return 'authenticated';
  };

  const state = getState();

  return {
    state,
    isLoaded,
    isSignedIn,
    hasProfile: currentUser !== null && currentUser !== undefined,
    user: currentUser ?? null,
  };
}
