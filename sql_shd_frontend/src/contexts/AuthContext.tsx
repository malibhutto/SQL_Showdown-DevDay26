import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '../types';
import { AuthService } from '../services/AuthService';

interface AuthContextType {
  session: Session | null;
  login: (teamName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const existingSession = AuthService.getSession();
    setSession(existingSession);
    setLoading(false);
  }, []);

  const login = async (teamName: string, password: string) => {
    const result = await AuthService.login(teamName, password);
    if (result.success && result.session) {
      setSession(result.session);
    }
    return result;
  };

  const logout = () => {
    AuthService.logout();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isAuthenticated: !!session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
