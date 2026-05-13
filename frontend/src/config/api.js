export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  GENERATE: `${API_BASE_URL}/api/generate`,
  REPORTS: `${API_BASE_URL}/api/reports/`,
  STATS: `${API_BASE_URL}/api/reports/stats`,
  SUGGEST: `${API_BASE_URL}/api/suggest`,
  AI_DESCRIBE: `${API_BASE_URL}/api/ai-describe`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    GOOGLE: `${API_BASE_URL}/api/auth/google`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    ME: `${API_BASE_URL}/api/auth/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/auth/update-profile`,
  },
  FILES: {
    UPLOAD: `${API_BASE_URL}/api/files/upload`,
    GET: (key) => `${API_BASE_URL}/api/files/${encodeURIComponent(key)}`,
    UPDATE: `${API_BASE_URL}/api/files/update`,
    DELETE: `${API_BASE_URL}/api/files/delete`,
  },
  HEALTH: `${API_BASE_URL}/`,
  FACTORY_AUDIT: {
    BASE: `${API_BASE_URL}/api/factory-audit`,
    BY_ID: (id) => `${API_BASE_URL}/api/factory-audit/${encodeURIComponent(id)}`,
    GENERATE: (id, format = "docx") => `${API_BASE_URL}/api/factory-audit/${encodeURIComponent(id)}/generate?format=${encodeURIComponent(format)}`,
  },
  OPERATIONS: {
    REPORTS: `${API_BASE_URL}/api/operations/reports`,
    STATS: `${API_BASE_URL}/api/operations/stats`,
    DETAILS: (id, type) => `${API_BASE_URL}/api/operations/reports/${id}?type=${encodeURIComponent(type)}`,
    REVIEW: (id) => `${API_BASE_URL}/api/operations/reports/${id}/review`,
    BULK_DELETE: `${API_BASE_URL}/api/operations/reports/bulk-delete`,
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/api/admin/users`,
    UPDATE_ROLE: `${API_BASE_URL}/api/admin/users/role`,
    STATS: `${API_BASE_URL}/api/admin/stats`,
  }
};
