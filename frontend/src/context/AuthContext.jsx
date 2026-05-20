// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENDPOINTS } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("reportUser");
      return saved ? JSON.parse(saved) : null;
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

  // null = still fetching, true = complete, false = incomplete
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  const fetchOnboardingStatus = useCallback(async (currentToken, signal) => {
    if (!currentToken) return;
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.STATUS, {
        headers: { Authorization: `Bearer ${currentToken}` },
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardingCompleted(data.onboarding?.isCompleted ?? false);
      } else {
        setOnboardingCompleted(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') setOnboardingCompleted(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setOnboardingCompleted(null);
      return;
    }
    if (user.role !== 'inspector') {
      // Non-inspectors are always considered "complete" — no gate for them
      setOnboardingCompleted(true);
      return;
    }
    const controller = new AbortController();
    fetchOnboardingStatus(token, controller.signal);
    return () => controller.abort();
  }, [user, token, fetchOnboardingStatus]);

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem("reportUser", JSON.stringify(userData));
    localStorage.setItem("reportToken", tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setOnboardingCompleted(null);
    localStorage.removeItem("reportUser");
    localStorage.removeItem("reportToken");
  };

  const refreshOnboarding = useCallback(() => {
    return fetchOnboardingStatus(token);
  }, [token, fetchOnboardingStatus]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, onboardingCompleted, refreshOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
