import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        login(data.user, data.token);
        navigate("/dashboard");
      } else {
        setError(data.error || "Signup failed");
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
          <h2 className="text-xl font-bold text-slate-800 mb-1">Create Account</h2>
          <p className="text-sm text-slate-500 mb-6">Join Absolute Veritas Report portal today</p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
