export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  GENERATE: `${API_BASE_URL}/generate`,
  REPORTS: `${API_BASE_URL}/reports`,
  SUGGEST: `${API_BASE_URL}/api/suggest`,
  AI_DESCRIBE: `${API_BASE_URL}/api/ai-describe`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    GOOGLE: `${API_BASE_URL}/api/auth/google`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    ME: `${API_BASE_URL}/api/auth/me`,
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
  }
};
