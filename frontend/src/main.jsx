import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import './index.css'

import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './dashboards/inspector/InspectorDashboard.jsx'
import TechnicalManagerDashboard from './dashboards/manager/TechnicalManagerDashboard.jsx'
import AdminDashboard from './dashboards/admin/AdminDashboard.jsx'
import DashboardHome from './pages/DashboardHome.jsx'
import PSIForm from './reports/PSI/PSIForm.jsx'
import ContainerLoading from './reports/CLS/CLSForm.jsx'
import FactoryAudit from './reports/FactoryAudit/FactoryAuditForm.jsx'
import DuringProductionInspection from './reports/DPI/DPIForm.jsx'
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
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/dashboard/inspector" element={<Dashboard />} />
                <Route path="/dashboard/manager" element={<TechnicalManagerDashboard />} />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Inspection Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'operator', 'inspector', 'user']} />}>
                  <Route path="/dashboard/pre-shipment" element={<PSIForm />} />
                  <Route path="/dashboard/container-loading" element={<ContainerLoading />} />
                  <Route path="/dashboard/factory-audit" element={<FactoryAudit />} />
                  <Route path="/dashboard/during-production" element={<DuringProductionInspection />} />
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
