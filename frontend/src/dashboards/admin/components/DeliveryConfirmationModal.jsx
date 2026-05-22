import React from 'react';
import { Mail, X, Building, Send } from 'lucide-react';

export default function DeliveryConfirmationModal({
  deliveryModalOpen,
  setDeliveryModalOpen,
  activeBooking,
  handleDeliverReport
}) {
  if (!deliveryModalOpen || !activeBooking) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setDeliveryModalOpen(false)}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
              <Mail className="w-6 h-6" />
            </div>
            <button 
              onClick={() => setDeliveryModalOpen(false)} 
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-black text-slate-800">Deliver Report</h3>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Send the finalized report <strong className="text-slate-700">{activeBooking.reportId}</strong> to the client portal and notify them via email.
          </p>
        </div>

        <div className="p-6 bg-slate-50 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              {activeBooking.clientName}
            </p>
          </div>
          
          <button 
            onClick={handleDeliverReport}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
}
