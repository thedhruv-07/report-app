import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import { colors, buttonStyle } from "../../styles";

export default function Login({ onLogin, onSwitch, onForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error || "Google login failed");
      }
    } catch (err) {
      setError("Network error during Google login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In was unsuccessful. Please try again.");
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to your account to continue">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ 
            padding: "12px", 
            background: "rgba(239, 68, 68, 0.1)", 
            color: colors.danger, 
            borderRadius: "8px", 
            fontSize: "14px", 
            marginBottom: "20px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div style={{ position: "relative" }}>
          <AuthInput
            label={
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>Password</span>
                <button
                  type="button"
                  onClick={onForgot}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: colors.primary,
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "0"
                  }}
                >
                  Forgot?
                </button>
              </div>
            }
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            width: "100%",
            marginTop: "10px",
            height: "48px",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: colors.border }}></div>
          <span style={{ padding: "0 12px", fontSize: "12px", color: colors.textMuted, fontWeight: "600" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: colors.border }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            width="100%"
            theme="outline"
            shape="rectangular"
          />
        </div>

        <p style={{ textAlign: "center", marginTop: "32px", fontSize: "14px", color: colors.textMuted }}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            style={{
              border: "none",
              background: "transparent",
              color: colors.primary,
              fontWeight: "700",
              cursor: "pointer",
              padding: "0"
            }}
          >
            Create Account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
