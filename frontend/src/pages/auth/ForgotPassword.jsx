import React, { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import { colors, buttonStyle } from "../../styles";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send reset link");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent a password reset link to your email.">
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={onBack}
            style={{
              ...buttonStyle,
              width: "100%",
              height: "48px"
            }}
          >
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email and we'll send you a link to reset your password.">
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
          {loading ? "Sending link..." : "Send Reset Link"}
        </button>

        <p style={{ textAlign: "center", marginTop: "32px", fontSize: "14px", color: colors.textMuted }}>
          Suddenly remembered?{" "}
          <button
            type="button"
            onClick={onBack}
            style={{
              border: "none",
              background: "transparent",
              color: colors.primary,
              fontWeight: "700",
              cursor: "pointer",
              padding: "0"
            }}
          >
            Back to Login
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
