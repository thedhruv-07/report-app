import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Hydrate from localStorage synchronously during initialization to prevent any redirect race conditions on hard refresh
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("reportUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("reportToken") || "";
    } catch {
      return "";
    }
  });

  const [loading, setLoading] = useState(false);

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
