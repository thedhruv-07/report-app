import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare,
  FileText,
  User,
  Building2,
  Calendar,
  ClipboardCheck,
  Send,
  MapPin
} from "lucide-react";

export default function OperationsReportReview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "Inspection Report";
  const { token } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id, type, token]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.OPERATIONS.DETAILS(id, type), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setComment(data.report.operationComment || "");
      }
    } catch (error) {
      console.error("Fetch report error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (status !== 'approved' && !comment.trim()) {
      alert("Please provide a comment for rejection or revision request.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(ENDPOINTS.OPERATIONS.REVIEW(id), {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, comment, type })
      });

      if (res.ok) {
        alert(`Report ${status} successfully.`);
        navigate("/operations");
      }
    } catch (error) {
      console.error("Review error:", error);
      alert("Failed to update report status.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Report Not Found</h2>
          <button onClick={() => navigate("/operations")} className="text-blue-600 font-bold hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const info = report.generalInfo || report; // Factory Audit has top-level info

  // --- Data Normalization for different report types ---
  const getNormalizedData = () => {
    if (type === "Factory Audit") {
      return {
        remarks: [...(report.generalOverviewRemarks || []), ...(report.clientSpecialRemarks || [])],
        recommendations: (Array.isArray(report.recommendations) && report.recommendations.length > 0)
          ? report.recommendations.map(r => `${r.companyName || 'N/A'}: ${r.details || 'N/A'}`).join("; ")
          : "No recommendations provided.",
        media: [
          ...(report.buildingOfficePhotos || []).map(p => ({ url: p.preview, description: p.label })),
          ...(report.reportPhotoGroups || []).flatMap(g => (g.photos || []).map(p => ({ url: p.preview, description: `${g.description}: ${p.label}` })))
        ]
      };
    }
    
    // Standard PSI/CLS Reports
    return {
      remarks: report.comments?.remarks || [],
      recommendations: report.comments?.recommendations || report.recommendationText || (typeof report.recommendations === 'string' ? report.recommendations : "No recommendations provided."),
      media: report.media || []
    };
  };


  const normalized = getNormalizedData();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8">
        {/* Navigation */}
        <button 
          onClick={() => navigate("/operations")}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Report Header */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                {type}
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">
                {info.productName || info.title || "Inspection Report"}
              </h1>
              <p className="text-slate-400 font-bold mt-1">ID: {report.reportNumber || report._id}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submitted By</p>
                <p className="text-sm font-black text-slate-700">{report.userId?.name}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client / Factory</p>
                <p className="text-sm font-bold text-slate-700">{info.client || "N/A"}</p>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{info.factory || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                <p className="text-sm font-bold text-slate-700">
                  {info.inspectionLocation || info.location || info.factoryAddress || info.actualLocation || "N/A"}
                </p>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                  {info.destinationCountry || info.country ? `To: ${info.destinationCountry || info.country}` : "Site Verified"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inspection Date</p>
                <p className="text-sm font-bold text-slate-700">{info.inspectionDate || info.auditDate || "N/A"}</p>
                <p className="text-xs text-slate-400 font-medium">Verified On-Site</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Result</p>
                <p className="text-sm font-bold text-slate-700">{report.conclusion || report.auditOverview?.grade || "N/A"}</p>
                <p className="text-xs text-slate-400 font-medium">As reported by inspector</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Report Content Preview */}
        <div className="space-y-8">
          <h2 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Report Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Remarks Section */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Inspector Remarks
              </h3>
              <div className="space-y-3">
                {normalized.remarks.length > 0 ? (
                  normalized.remarks.map((r, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 font-medium border border-slate-100 italic">
                      "{r}"
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-sm">No specific remarks provided.</p>
                )}
              </div>
            </div>

            {/* Recommendation Section */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Recommendations
              </h3>
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-sm text-emerald-800 font-bold leading-relaxed">
                  {normalized.recommendations}
                </p>
              </div>
            </div>
          </div>

          {/* Photo Gallery Preview */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Photo Evidence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(() => {
                const validPhotos = normalized.media.filter(m => m.url);
                
                if (validPhotos.length === 0) {
                  return <p className="col-span-full text-slate-400 italic text-sm py-4">No photos uploaded to this report.</p>;
                }

                return validPhotos.slice(0, 12).map((m, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 group relative">
                    <img src={m.url} alt={m.description} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold p-2 text-center">{m.description}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>



        </div>
      </div>

      {/* Review Sidebar */}
      <div className="w-full lg:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl lg:h-screen relative z-10">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Review Action</h2>
          <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Finalize Decision</p>
        </div>

        <div className="p-8 flex-1 flex flex-col space-y-8 overflow-y-auto">
          {/* Status Selection */}
          <div className="space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Decision</p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleReview('approved')}
                disabled={submitting}
                className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold hover:bg-emerald-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Approve Report</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button 
                onClick={() => handleReview('revision_required')}
                disabled={submitting}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-700 font-bold hover:bg-orange-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>Request Revision</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button 
                onClick={() => handleReview('rejected')}
                disabled={submitting}
                className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold hover:bg-rose-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5" />
                  <span>Reject Report</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Comment Area */}
          <div className="space-y-4 flex-1 flex flex-col">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Review Comments</p>
            <textarea 
              className="w-full flex-1 min-h-[200px] p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-slate-700 font-medium text-sm resize-none"
              placeholder="Add internal comments or instructions for the inspector..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
            <Send className="w-3.5 h-3.5" />
            Decision is final once submitted
          </div>
        </div>
      </div>
    </div>
  );
}
