import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if user is logged in on mount
   * Uses accessToken from localStorage (if available) or tries to refresh
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get stored token from localStorage
        const storedToken = localStorage.getItem('accessToken');
        
        if (storedToken) {
          // Set token in state
          setAccessToken(storedToken);
          
          // Try to get user info
          try {
            const response = await authApi.getMe();
            setUser(response.data);
          } catch (error) {
            // Token might be expired, try to refresh
            try {
              const refreshResponse = await authApi.refreshToken();
              if (refreshResponse.data?.accessToken) {
                const newToken = refreshResponse.data.accessToken;
                setAccessToken(newToken);
                localStorage.setItem('accessToken', newToken);
                
                // Get user info with new token
                const userResponse = await authApi.getMe();
                setUser(userResponse.data);
              } else {
                // Refresh failed, clear everything
                localStorage.removeItem('accessToken');
                setAccessToken(null);
                setUser(null);
              }
            } catch (refreshError) {
              // Refresh failed, clear everything
              localStorage.removeItem('accessToken');
              setAccessToken(null);
              setUser(null);
            }
          }
        } else {
          // No stored token, try to refresh using cookie
          try {
            const refreshResponse = await authApi.refreshToken();
            if (refreshResponse.data?.accessToken) {
              const newToken = refreshResponse.data.accessToken;
              setAccessToken(newToken);
              localStorage.setItem('accessToken', newToken);
              
              // Get user info with new token
              const userResponse = await authApi.getMe();
              setUser(userResponse.data);
            }
          } catch (error) {
            // No valid refresh token, user is not authenticated
            setUser(null);
          }
        }
      } catch (error) {
        // Any error means user is not authenticated
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    // Backend returns { success: true, data: { user, accessToken } }
    setUser(response.data.user);
    setAccessToken(response.data.accessToken);
    localStorage.setItem('accessToken', response.data.accessToken);
  };

  const register = async (email: string, password: string, name?: string) => {
    // Register the user
    await authApi.register({ email, password, name });
    // After registration, auto-login to get accessToken
    const loginResponse = await authApi.login({ email, password });
    setUser(loginResponse.data.user);
    setAccessToken(loginResponse.data.accessToken);
    localStorage.setItem('accessToken', loginResponse.data.accessToken);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!accessToken,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

