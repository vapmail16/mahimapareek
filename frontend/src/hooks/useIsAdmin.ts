import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check if current user is an admin
 */
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();
  
  if (!user) {
    return false;
  }

  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
};

