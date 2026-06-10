import { Outlet } from "react-router-dom";
import Navbar from '../shared/Navbar';

export default function DashboardLayout() {
  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-50 via-white to-slate-100">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
