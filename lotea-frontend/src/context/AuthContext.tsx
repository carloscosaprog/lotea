import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile } from "../services/authService";

interface User {
  id: number;
  nombre: string;
  email: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, token?: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (userData: User, token?: string) => {
    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));

    if (token) {
      await AsyncStorage.setItem("token", token);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        // SI NO HAY TOKEN → NO ESTÁS LOGUEADO
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // VALIDAMOS TOKEN CON BACKEND
        const profile = await getProfile();

        setUser(profile);
        await AsyncStorage.setItem("user", JSON.stringify(profile));
      } catch (error) {
        // TOKEN INVÁLIDO → LIMPIAR TODO
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
