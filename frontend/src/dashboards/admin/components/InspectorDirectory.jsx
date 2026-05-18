import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

export default function InspectorDirectory({ activeView, MOCK_INSPECTORS }) {
  if (activeView !== 'inspectors') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_INSPECTORS.map(inspector => (
          <div key={inspector.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-xl">
                  {inspector.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{inspector.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{inspector.id}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {inspector.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-[11px]">{inspector.specialization}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{inspector.activeJobs}</p>
              </div>
              <div className="border-l border-r border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Done</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{inspector.completedJobs}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rating</p>
                <p className="text-lg font-black text-amber-500 mt-0.5">★ {inspector.rating}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
