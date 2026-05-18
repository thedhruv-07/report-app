import React, { useState, useEffect } from 'react';
import { ClipboardList, Send, ShieldCheck, AlertTriangle } from 'lucide-react';

const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
};

export default function SummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>
        <div>
          <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.total} /></h3>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Bookings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 animate-pulse">
            <Send className="w-6 h-6" />
          </div>
        </div>
        <div>
          <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.readyToDeliver} /></h3>
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mt-1">Ready for Delivery</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <div>
          <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.underReview} /></h3>
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider mt-1">Under TM Review</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div>
          <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.correction} /></h3>
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mt-1">Correction Required</p>
        </div>
      </div>
    </div>
  );
}
