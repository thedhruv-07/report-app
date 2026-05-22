import { Outlet } from "react-router-dom";
import Navbar from '../shared/Navbar';
import NotificationPopup from '../shared/NotificationPopup';

export default function DashboardLayout() {
  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-50 via-white to-slate-100">
      <NotificationPopup />
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
