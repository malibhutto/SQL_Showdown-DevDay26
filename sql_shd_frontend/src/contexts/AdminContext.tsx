import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AdminService from '../services/AdminService';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (adminKey: string) => Promise<boolean>;
  logout: () => void;
  statistics: any;
  refreshStatistics: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    // Check if admin key exists and is valid
    const checkAuth = async () => {
      const adminKey = AdminService.getAdminKey();
      if (adminKey) {
        const isValid = await AdminService.verifyAdminAccess();
        setIsAuthenticated(isValid);
        if (isValid) {
          await fetchStatistics();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (adminKey: string): Promise<boolean> => {
    AdminService.setAdminKey(adminKey);
    const isValid = await AdminService.verifyAdminAccess();
    
    if (isValid) {
      setIsAuthenticated(true);
      await fetchStatistics();
      return true;
    } else {
      AdminService.clearAdminKey();
      return false;
    }
  };

  const logout = () => {
    AdminService.clearAdminKey();
    setIsAuthenticated(false);
    setStatistics(null);
  };

  const fetchStatistics = async () => {
    try {
      const stats = await AdminService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const refreshStatistics = async () => {
    await fetchStatistics();
  };

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        statistics,
        refreshStatistics,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
