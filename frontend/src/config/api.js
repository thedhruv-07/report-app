export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const ENDPOINTS = {
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
  HEALTH: `${API_BASE_URL}/`
};
