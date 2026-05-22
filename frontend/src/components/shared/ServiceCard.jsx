import { useNavigate } from "react-router-dom";

/**
 * ServiceCard — Reusable card for displaying a service on the Dashboard.
 *
 * Props:
 *   service  — object from services.js  { id, name, slug, description, icon, route }
 */
export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(service.route)}
      className="
        group relative cursor-pointer
        bg-linear-to-br from-white to-slate-50
        border border-slate-200/60
        rounded-3xl p-7
        shadow-sm hover:shadow-2xl hover:shadow-blue-500/10
        transition-all duration-300 ease-out
        hover:-translate-y-2
        hover:border-blue-200/50
        active:scale-[0.98]
        overflow-hidden
      "
    >
      {/* Premium Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%] animate-gradient-x opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon with soft background */}
      <div className="
        w-16 h-16 rounded-2xl
        bg-blue-50/50
        border border-blue-100/50
        flex items-center justify-center
        text-3xl mb-6
        group-hover:rotate-6 group-hover:scale-110
        transition-all duration-300
        shadow-sm group-hover:shadow-md
      ">
        {service.icon}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-slate-800 mb-2.5 group-hover:text-blue-600 transition-colors duration-300">
          {service.name}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
          {service.description}
        </p>

        {/* CTA Button */}
        <button className="
          inline-flex items-center gap-2 rounded-lg 
          bg-blue-600 px-4 py-2 
          text-sm font-medium text-white 
          hover:bg-blue-700 transition-all duration-300
          shadow-sm hover:shadow shadow-blue-500/20
        ">
          Get Started
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
