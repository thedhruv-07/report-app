// frontend/src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
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

  // loading flag removed (unused)

  // null = still fetching, true = complete, false = incomplete
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  const getOnboardingStatus = useCallback(async (currentToken, signal) => {
    if (!currentToken) return null;
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.STATUS, {
        headers: { Authorization: `Bearer ${currentToken}` },
        signal,
      });
      if (res.ok) {
        const data = await res.json();
        return data.onboarding?.isCompleted ?? false;
      }
      return false;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'inspector') {
      // Non-inspectors are always considered "complete" — no gate for them
      setTimeout(() => setOnboardingCompleted(true), 0);
      return;
    }
    const controller = new AbortController();
    (async () => {
      const val = await getOnboardingStatus(token, controller.signal);
      if (val !== null) setOnboardingCompleted(val);
    })();
    return () => controller.abort();
  }, [user, token, getOnboardingStatus]);

  const login = (userData, tokenStr) => {
    sessionStorage.removeItem("notif_popup_shown");
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
    sessionStorage.removeItem("notif_popup_shown");
  };

  const refreshOnboarding = useCallback(async () => {
    const val = await getOnboardingStatus(token);
    if (val !== null) setOnboardingCompleted(val);
    return val;
  }, [token, getOnboardingStatus]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, onboardingCompleted, refreshOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
