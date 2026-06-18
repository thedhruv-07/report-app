import { lazy } from 'react'

export const Dashboard = lazy(() => import('../dashboards/inspector/InspectorDashboard.jsx'))
export const InspectorOnboarding = lazy(() => import('../dashboards/inspector/onboarding/InspectorOnboarding.jsx'))
export const TechnicalManagerDashboard = lazy(() => import('../dashboards/manager/TechnicalManagerDashboard.jsx'))
export const AdminDashboard = lazy(() => import('../dashboards/admin/AdminDashboard.jsx'))
export const DashboardHome = lazy(() => import('../pages/DashboardHome.jsx'))
export const PSIForm = lazy(() => import('../reports/PSI/PSIForm.jsx'))
export const ContainerLoading = lazy(() => import('../reports/CLS/CLSForm.jsx'))
export const FactoryAudit = lazy(() => import('../reports/FactoryAudit/FactoryAuditForm.jsx'))
export const DuringProductionInspection = lazy(() => import('../reports/DPI/DPIForm.jsx'))
export const Settings = lazy(() => import('../pages/Settings.jsx'))
export const Notifications = lazy(() => import('../pages/Notifications.jsx'))
export const Login = lazy(() => import('../pages/auth/Login.jsx'))
export const Signup = lazy(() => import('../pages/auth/Signup.jsx'))
export const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'))
export const ResetPassword = lazy(() => import('../pages/auth/ResetPassword.jsx'))

// Inspection Notices Feature
export const InspectionNoticesList = lazy(() => import('../dashboards/admin/pages/InspectionNoticesList.jsx'))
export const InspectionNoticeForm = lazy(() => import('../dashboards/admin/pages/InspectionNoticeForm.jsx'))
export const AdminReportQueue = lazy(() => import('../dashboards/admin/pages/AdminReportQueue.jsx'))
export const SuperAdminDashboard = lazy(() => import('../dashboards/superadmin/SuperAdminDashboard.jsx'))

export const RouteFallback = () => (
  <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
    Loading…
  </div>
)
