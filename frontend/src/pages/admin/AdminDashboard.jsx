import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { 
  Users, Shield, Eye, UserCheck, BarChart3, FileText, 
  ChevronDown, Search, RefreshCw, AlertTriangle, Trash2
} from "lucide-react";

const ROLE_CONFIG = {
  admin:     { label: "Admin",     bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200", icon: Shield },
  operator:  { label: "Operator",  bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200",   icon: Eye },
  inspector: { label: "Inspector", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: UserCheck },
};

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(ENDPOINTS.ADMIN.USERS, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(ENDPOINTS.ADMIN.STATS, { headers: { "Authorization": `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Admin fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!editingUser || !newRole) return;
    setUpdating(true);
    try {
      const res = await fetch(ENDPOINTS.ADMIN.UPDATE_ROLE, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: editingUser._id, role: newRole }),
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(u => u._id === editingUser._id ? { ...u, role: newRole } : u)
        );
        setEditingUser(null);
        setNewRole("");
      }
    } catch (error) {
      console.error("Role update error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${ENDPOINTS.ADMIN.USERS}/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error("Delete user error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const RoleBadge = ({ role }) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.inspector;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text} ${config.border} border`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Manage users, roles, and system-wide analytics.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Total Users", value: stats.users.total, icon: Users, color: "indigo" },
            { label: "Inspectors", value: stats.users.inspectors, icon: UserCheck, color: "emerald" },
            { label: "Operators", value: stats.users.operators, icon: Eye, color: "blue" },
            { label: "Total Reports", value: stats.reports.total, icon: FileText, color: "amber" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            User Directory
          </h2>
          <div className="flex-1" />
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="inspector">Inspector</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {(u.name || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{u.name || "—"}</p>
                        {u._id === user?.id && (
                          <span className="text-[10px] font-bold text-indigo-500 uppercase">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u._id !== user?.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(u); setNewRole(u.role); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                        >
                          Change Role
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic px-4">Current user</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !updating && setEditingUser(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-8 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-indigo-500" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
              Change Role
            </h3>
            <p className="text-slate-500 text-center text-sm mb-6 leading-relaxed">
              Update role for <strong>{editingUser.name || editingUser.email}</strong>
            </p>

            <div className="space-y-3 mb-8">
              {["admin", "operator", "inspector"].map((role) => {
                const config = ROLE_CONFIG[role];
                const Icon = config.icon;
                return (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                      newRole === role
                        ? "border-indigo-400 bg-indigo-50 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.text}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{config.label}</p>
                      <p className="text-xs text-slate-400">
                        {role === "admin" && "Full system access"}
                        {role === "operator" && "Review & manage reports"}
                        {role === "inspector" && "Create & submit reports"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {newRole !== editingUser.role && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  This will change the user's access level immediately.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRoleChange}
                disabled={updating || newRole === editingUser.role}
                className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {updating ? "Updating..." : "Confirm Change"}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                disabled={updating}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-8 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete User Account?</h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.email}</strong>? 
              This action is permanent and cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
