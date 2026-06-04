// frontend/src/dashboards/admin/components/NotificationManager.jsx
import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Edit2, Trash2, Users, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { timeAgo } from '../../../utils/timeAgo';

const TYPE_CONFIG = {
  urgent:  { label: "Urgent",  bg: "bg-red-100",    text: "text-red-700" },
  warning: { label: "Warning", bg: "bg-amber-100",  text: "text-amber-700" },
  info:    { label: "Info",    bg: "bg-blue-100",   text: "text-blue-700" },
  success: { label: "Success", bg: "bg-emerald-100",text: "text-emerald-700" },
};

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "info",
  priority: 3,
  targetRoles: [],
  expiresAt: ""
};

export default function NotificationManager() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.NOTIFICATIONS.ALL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (notif) => {
    setForm({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      priority: notif.priority,
      targetRoles: notif.targetRoles || [],
      expiresAt: notif.expiresAt ? new Date(notif.expiresAt).toISOString().slice(0, 10) : ""
    });
    setEditingId(notif._id);
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(ENDPOINTS.NOTIFICATIONS.DELETE(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      alert("Failed to deactivate: " + err.message);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert("Title and message are required");
      return;
    }
    if (form.targetRoles.length === 0) {
      alert("Select at least one target role");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || null
      };
      if (editingId) {
        await fetch(ENDPOINTS.NOTIFICATIONS.UPDATE(editingId), {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(ENDPOINTS.NOTIFICATIONS.CREATE, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  if (loading) return <div className="p-8 text-slate-500">Loading notifications…</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Notification Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage system-wide notifications for all user roles</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Notification
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Target Roles</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Read By</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No notifications yet</td>
                </tr>
              )}
              {notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                return (
                  <tr key={notif._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 max-w-[180px] truncate">{notif.title}</p>
                      <p className="text-xs text-slate-400 max-w-[180px] truncate">{notif.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${notif.priority === 1 ? 'text-red-600' : notif.priority === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {notif.priority === 1 ? 'High' : notif.priority === 2 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(notif.targetRoles || []).map(r => (
                          <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded capitalize">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {notif.readCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {notif.isActive
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle className="w-3 h-3" />Active</span>
                        : <span className="text-xs text-slate-400 font-semibold">Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(notif.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(notif)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === notif._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeactivate(notif._id)}
                                disabled={deleting}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                              >
                                {deleting ? '…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(notif._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingId ? "Edit Notification" : "Create Notification"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  placeholder="Full notification message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value={1}>1 — High</option>
                    <option value={2}>2 — Medium</option>
                    <option value={3}>3 — Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Target Roles *</label>
                <div className="flex gap-3">
                  {["admin", "manager", "inspector"].map(role => (
                    <label key={role} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.targetRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span className="text-sm text-slate-600 capitalize">{role === "manager" ? "Technical Manager" : role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
