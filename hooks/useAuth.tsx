"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { useStytchUser, useStytch } from "@stytch/nextjs";
import { AuthModal } from "@/components/AuthModal";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any; // Using 'any' here for simplicity, you can type this more specifically
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await stytch.session.revoke();
      // No need for redirection, as this will be handled by your authenticated layout component
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [stytch.session]);

  const value = {
    isAuthenticated: !!user,
    isLoading: !isInitialized,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};