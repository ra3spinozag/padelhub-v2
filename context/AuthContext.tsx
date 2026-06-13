import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredUser,
  isAuthenticated,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
  type RegisterData,
  type User,
} from "../services/auth.service";
import { getPushToken, registerDeviceToken, unregisterDeviceToken } from "../services/notifications.service";

const USER_KEY = "ph_user";

interface AuthContextType {
  user: User | null;
  isLogged: boolean;
  loading: boolean;
  login: (rut: number, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  editarPerfil: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const authed = await isAuthenticated();
      if (authed) {
        const stored = await getStoredUser();
        setUser(stored);
        if (stored?.rut) {
          getPushToken()
            .then((token) => { if (token) registerDeviceToken(stored.rut!, token); })
            .catch(() => {});
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (rut: number, password: string) => {
    const { user } = await loginUser(rut, password);
    setUser(user);
    if (user.rut) {
      getPushToken()
        .then((token) => { if (token) registerDeviceToken(user.rut!, token); })
        .catch(() => {});
    }
  };

  const register = async (data: RegisterData) => {
    const { user } = await registerUser(data);
    setUser(user);
    if (user.rut) {
      getPushToken()
        .then((token) => { if (token) registerDeviceToken(user.rut!, token); })
        .catch(() => {});
    }
  };

  const logout = async () => {
    if (user?.rut) {
      await unregisterDeviceToken(user.rut).catch(() => {});
    }
    await logoutUser();
    setUser(null);
  };

  const editarPerfil = async (data: Partial<User>) => {
    if (!user) return;
    const snapshot  = user;
    const optimistic = { ...user, ...data };

    // Aplica el cambio inmediatamente en estado y cache local
    setUser(optimistic);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(optimistic));

    try {
      const updated = await updateProfile(user.id, data);
      setUser({ ...snapshot, ...updated });
    } catch (e) {
      // Revierte al estado anterior si la API falla
      setUser(snapshot);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(snapshot));
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLogged: !!user, loading, login, register, logout, editarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
