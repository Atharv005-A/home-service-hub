import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { currentUser, workers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Mock login - in production, this would call your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (role === 'customer') {
      setUser(currentUser);
    } else if (role === 'worker') {
      setUser(workers[0]);
    } else if (role === 'admin') {
      setUser({
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@homefix.com',
        phone: '+1 234 567 8999',
        role: 'admin',
        createdAt: new Date('2022-01-01'),
      });
    }
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'customer') {
      setUser(currentUser);
    } else if (role === 'worker') {
      setUser(workers[0]);
    } else if (role === 'admin') {
      setUser({
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@homefix.com',
        phone: '+1 234 567 8999',
        role: 'admin',
        createdAt: new Date('2022-01-01'),
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
