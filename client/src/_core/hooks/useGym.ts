import { useAuth } from "./useAuth";

/**
 * Hook to get current gym information from authenticated user
 * Returns null if user is not authenticated or not associated with a gym
 */
export function useGym() {
  const { user } = useAuth();

  if (!user || !user.gymId) {
    return {
      gymSlug: null,
      gymId: null,
      hasGym: false,
    };
  }

  return {
    gymSlug: user.gymSlug || null,
    gymId: user.gymId,
    hasGym: true,
  };
}
