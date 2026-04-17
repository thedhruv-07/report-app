import React, { useState, useEffect } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import { colors, buttonStyle } from "../../styles";

export default function ResetPassword({ onReset }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Extract token from URL search params
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Invalid or missing reset token.");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onReset(data.user, data.token);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="New Password" subtitle="Pick a strong password to secure your account.">
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
          label="New Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading || !token}
          style={{
            ...buttonStyle,
            width: "100%",
            marginTop: "10px",
            height: "48px",
            opacity: (loading || !token) ? 0.7 : 1,
            cursor: (loading || !token) ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Resetting..." : "Reset & Log In"}
        </button>
      </form>
    </AuthLayout>
  );
}
