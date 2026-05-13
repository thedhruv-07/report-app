import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../config/api";
import { UserCircle, Mail, Lock, Save, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const { user, token, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ loading: false, success: "", error: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ ...status, error: "", success: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      return setStatus({ ...status, error: "Passwords do not match" });
    }

    setStatus({ ...status, loading: true, error: "", success: "" });

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
      };
      if (formData.password) payload.password = formData.password;

      const res = await fetch(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local auth context
      setUser({ ...user, ...data.user });
      setStatus({ ...status, loading: false, success: "Profile updated successfully!" });
      setFormData({ ...formData, password: "", confirmPassword: "" });
    } catch (err) {
      setStatus({ ...status, loading: false, error: err.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500 mt-2">Manage your personal information and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-blue-100">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-sm text-slate-400 mb-6">{user?.email}</p>
            
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl text-left">
                <Shield className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Account Role</p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-blue-500" />
                  Profile Details
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Full Name</label>
                    <div className="relative group">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-700 font-medium"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-700 font-medium"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              {/* Password Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-500" />
                  Security
                </h3>
                <p className="text-sm text-slate-500">Leave these blank if you don't want to change your password.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-700 font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-700 font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {status.error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {status.error}
                </div>
              )}

              {status.success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm animate-in fade-in slide-in-from-top-1">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  {status.success}
                </div>
              )}

              <button
                type="submit"
                disabled={status.loading}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {status.loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {status.loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
