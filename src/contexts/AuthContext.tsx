import { createContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
} from "../types/user";
import type { ReactNode } from "react";
import type { FirebaseError } from "firebase/app";
import getFirebaseErrorMessage from "../components/ui/ErrorMessage";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar como não logado - contexto controla tudo
    setUser(null);
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.login(credentials);
      setUser(user);
      setLoading(false);
      toast.success(`Bem-vindo, ${user.name || user.email}!`, {
        icon: "👋",
      });
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      setError(message);
      setLoading(false);
      setUser(null);
      toast.error(message);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.register(credentials);
      setUser(user);
      setLoading(false);
      toast.success("Conta criada com sucesso! Bem-vindo!", {
        icon: "🎉",
      });
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      setError(message);
      setLoading(false);
      setUser(null);
      toast.error(message);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logOut();
      setUser(null);
      setLoading(false);
      toast.success("Logout realizado com sucesso!", {
        icon: "👋",
      });
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      setError(message);
      setLoading(false);
      toast.error(message);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
