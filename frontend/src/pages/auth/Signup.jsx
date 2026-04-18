import React, { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import { colors, buttonStyle } from "../../styles";

import { ENDPOINTS } from "../../config/api";

export default function Signup({ onSignup, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(ENDPOINTS.AUTH.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onSignup(data.user, data.token);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Veritas Report portal today">
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
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

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
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: "32px", fontSize: "14px", color: colors.textMuted }}>
          Already have an account?{" "}
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
            Log In
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
