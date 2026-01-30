import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../apiInterceptor/apiInterceptor.js";
import { toast } from "react-toastify";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get("/api/user/me");
      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setIsAuth(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function logOutUser() {
    try {
      const { data } = await api.post(`/api/user/logout`);
      toast.success(data.message);
      setUser(null);
      setIsAuth(false);
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AppContext.Provider
      value={{ setIsAuth, isAuth, user, setUser, loading, logOutUser }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppData = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("AppData must be used within an AppProvider");
  }

  return context;
};
