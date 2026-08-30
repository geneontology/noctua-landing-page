import type React from "react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { useAuthSetup } from "./hooks/useAuthSetup";
import { useAuthUrls } from "./hooks/useAuthUrls";


interface AuthContextType {
  isLoggedIn: boolean;
  isInitialized: boolean;
  loginUrl: string;
  logoutUrl: string;
  noctuaUrl: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isLoggedIn, isInitialized } = useAuthSetup();
  const { loginUrl, logoutUrl, noctuaUrl } = useAuthUrls();

  const value = {
    isLoggedIn,
    isInitialized,
    loginUrl,
    logoutUrl,
    noctuaUrl
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};