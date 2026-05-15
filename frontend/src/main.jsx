import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import './index.css'

import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './pages/Dashboard.jsx'
import App from './App.jsx'
import ContainerLoading from './pages/services/ContainerLoading.jsx'
import FactoryAudit from './pages/services/FactoryAudit.jsx'
import OperationsDashboard from './pages/operations/OperationsDashboard.jsx'
import OperationsReportReview from './pages/operations/OperationsReportReview.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import Settings from './pages/Settings.jsx'

import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Inspection Routes (Restricted to Inspector/Admin) */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'inspector', 'user']} />}>
                  <Route path="/dashboard/pre-shipment" element={<App />} />
                  <Route path="/dashboard/container-loading" element={<ContainerLoading />} />
                  <Route path="/dashboard/factory-audit" element={<FactoryAudit />} />
                </Route>
                
                {/* Operations Routes (Restricted to Operator/Admin) */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'operator']} />}>
                  <Route path="/operations" element={<OperationsDashboard />} />
                  <Route path="/operations/review/:id" element={<OperationsReportReview />} />
                </Route>

                {/* Admin Routes (Restricted to Admin only) */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
