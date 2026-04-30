import { useState } from "react";
import { Link } from "react-router-dom";
import { ENDPOINTS } from "../../config/api";
import { Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
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
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/company-logo.png" 
            alt="Absolute Veritas" 
            className="h-20 w-auto mx-auto object-contain"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Check Your Email</h2>
              <p className="text-sm text-slate-500 mb-6">We've sent a password reset link to your email.</p>
              <Link to="/login"
                className="inline-block w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl text-center shadow-lg shadow-blue-500/20">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Reset Password</h2>
              <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
                  {loading ? "Sending link..." : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-slate-500">
                Suddenly remembered?{" "}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
