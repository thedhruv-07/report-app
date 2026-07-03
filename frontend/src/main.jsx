import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import './index.css'

// A stale tab can hold references to chunk hashes from a previous deploy.
// When a lazy import 404s because that build no longer exists, reload once
// to pick up the current build instead of leaving the user on a dead page.
window.addEventListener('vite:preloadError', () => {
  const key = 'chunkReloadedAt'
  const last = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(key, String(Date.now()))
    window.location.reload()
  }
})

import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import OnboardingGuard from './components/auth/OnboardingGuard'
import {
  Dashboard,
  InspectorOnboarding,
  TechnicalManagerDashboard,
  AdminDashboard,
  DashboardHome,
  PSIForm,
  ContainerLoading,
  FactoryAudit,
  DuringProductionInspection,
  Settings,
  Notifications,
  Login,
  ForgotPassword,
  ResetPassword,
  RouteFallback,
  InspectionNoticesList,
  InspectionNoticeForm,
  AdminReportQueue,
  SuperAdminDashboard,
} from './routes/appRoutes'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardHome />} />
                
                {/* Role-Protected Dashboard Views */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/dashboard/admin" element={<AdminDashboard />} />
                  <Route path="/admin/inspection-notices" element={<InspectionNoticesList />} />
                  <Route path="/admin/inspection-notices/new" element={<InspectionNoticeForm />} />
                  <Route path="/admin/inspection-notices/:id" element={<InspectionNoticeForm />} />
                  <Route path="/admin/report-queue" element={<AdminReportQueue />} />
                </Route>
                
                <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
                  <Route path="/dashboard/manager" element={<TechnicalManagerDashboard />} />
                </Route>
                
                <Route element={<ProtectedRoute allowedRoles={['inspector', 'admin', 'manager']} />}>
                  {/* Onboarding page — accessible without OnboardingGuard (guard would cause redirect loop) */}
                  <Route path="/dashboard/inspector/onboarding" element={<InspectorOnboarding />} />
                  {/* All other inspector pages gated behind OnboardingGuard */}
                  <Route element={<OnboardingGuard />}>
                    <Route path="/dashboard/inspector" element={<Dashboard />} />
                  </Route>
                </Route>
                
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />

                {/* Inspection Routes — inspectors must complete onboarding first */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'operator', 'inspector', 'user']} />}>
                  <Route element={<OnboardingGuard />}>
                    <Route path="/dashboard/pre-shipment" element={<PSIForm />} />
                    <Route path="/dashboard/container-loading" element={<ContainerLoading />} />
                    <Route path="/dashboard/factory-audit" element={<FactoryAudit />} />
                    <Route path="/dashboard/during-production" element={<DuringProductionInspection />} />
                  </Route>
                </Route>
              </Route>

              {/* Superadmin — standalone page, no shared Navbar */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
