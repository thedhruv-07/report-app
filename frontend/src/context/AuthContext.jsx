import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("reportUser");
      const savedToken = localStorage.getItem("reportToken");
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      // Ignore parse errors
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem("reportUser", JSON.stringify(userData));
    localStorage.setItem("reportToken", tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("reportUser");
    localStorage.removeItem("reportToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
