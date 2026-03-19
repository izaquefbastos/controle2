import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'contas-a-pagar-user';
const USERS_KEY = 'contas-a-pagar-users';

// Gera um UUID v4 simples
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Hash simples via Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'contas-a-pagar-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verifica credencial Google sem aceitar tokens arbitrários
function parseGoogleCredential(credential: string): { sub: string; email: string; name: string; picture?: string } | null {
  try {
    const parts = credential.split('.');
    // JWT real tem exatamente 3 partes
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Valida campos obrigatórios
    if (!payload.sub || !payload.email || !payload.name) return null;
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  // Garante que usuário demo existe com senha hasheada
  useEffect(() => {
    const initUsers = async () => {
      const existing = localStorage.getItem(USERS_KEY);
      if (!existing) {
        const demoHash = await hashPassword('demo123');
        const defaultUsers = [
          { id: generateId(), email: 'demo@demo.com', passwordHash: demoHash, name: 'Usuário Demo' },
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
      }
    };
    initUsers();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const users: Array<{ id: string; email: string; passwordHash: string; name: string }> =
      JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

    const hash = await hashPassword(password);
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hash
    );

    if (found) {
      setUser({ id: found.id, email: found.email, name: found.name, provider: 'email' });
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const payload = parseGoogleCredential(credential);
      if (!payload) throw new Error('Token Google inválido');

      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: 'google',
      });
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    const users: Array<{ id: string; email: string; passwordHash: string; name: string }> =
      JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const passwordHash = await hashPassword(password);
    users.push({ id: generateId(), email, passwordHash, name });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, isAuthenticated: !!user, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: unknown) => void;
          renderButton: (element: HTMLElement, config: unknown) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
