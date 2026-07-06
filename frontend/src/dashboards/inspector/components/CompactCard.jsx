export default function CompactCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
