import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ChevronRight, Save, Send, CheckCircle } from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';
import { ENDPOINTS } from '../../../config/api';

// Import Tab Components
import NoticeTab from '../components/inspection-notice/NoticeTab';
import ExpenseTab from '../components/inspection-notice/ExpenseTab';
import ReportTab from '../components/inspection-notice/ReportTab';

export default function InspectionNoticeForm() {
  const { id } = useParams();
  const isNew = !id;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Notice');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: 'success'|'error', text: string }
  const [inspectorOptions, setInspectorOptions] = useState([]);
  
  // Entire form state matching the Mongoose Model
  const [formData, setFormData] = useState({
    noticeId: `PN${Date.now()}`,
    status: 'draft',
    basicInfo: {
      serviceType: 'Pre-Shipment Inspection',
      sameDayReport: false,
      onlineReport: false,
      inspectionDateFrom: '',
      inspectionDateTo: '',
      inspectionLocation: '',
      customerName: '',
      productCategory: '',
      attentiveOrder: false,
      csSatisfactionBonus: false,
    },
    teamAssignment: {
      cs: { name: '', phone: '', mobile: '' },
      cse: { name: '', phone: '', mobile: '' },
      previewManager: { name: '', phone: '', mobile: '' },
      scheduler: { name: '', phone: '', mobile: '' },
      inspectors: []
    },
    productInfo: {
      products: [],
      totalQuantity: 0,
      quantityFinished: 0,
      quantityPacked: 0,
      orderRemarks: '',
      destination: '',
      shipmentDate: '',
    },
    aql: {
      samplingLevel: 'Level II',
      sampledQuantity: 0,
      inspectionStandard: { critical: 'Not Allowed', major: 0, minor: 0 },
      acceptedQuantity: { critical: 0, major: 0, minor: 0 },
      remarks: ''
    },
    inspectionRequirements: {
      customerGeneralRequirement: '',
      technicalManagerRemarks: '',
      customerServiceRemarks: '',
      organizerRemarks: ''
    },
    specialClientRequirements: {
      customerSpecialRequirements: '',
      colorMaterialFinish: '',
      dimensionWeight: '',
      logoLabel: '',
      packingMaterial: '',
      shippingMark: '',
      additionalComments: ''
    },
    customerSamples: {
      remarks: '',
      samples: []
    },
    inspectionInfo: {
      technicalManagerReviewed: false,
      generalWorkInstructions: [],
      operationalWorkInstructions: [],
      onlineWI: '',
      reportTemplate: '',
      customerClaimForm: '',
      onlineCustomerClaimForm: '',
      clientGeneralMaterials: ''
    },
    attachments: { clientFiles: [], supplierFiles: [] },
    inspectionTools: { tools: [], equipment: [], trainingMaterials: [] },
    onSiteTests: [],
    defectClassifications: [
      { description: 'Sharp edges or points', critical: true, major: false, minor: false, photoRequired: true },
      { description: 'Broken or cracked', critical: true, major: false, minor: false, photoRequired: true },
      { description: 'Glass fragments attached', critical: true, major: false, minor: false, photoRequired: true },
      { description: 'Glass not very clear', critical: false, major: true, minor: false, photoRequired: true },
      { description: 'Dirt stain, color stain, oil stain', critical: false, major: true, minor: true, photoRequired: true },
      { description: 'Finger print', critical: false, major: false, minor: true, photoRequired: true },
      { description: 'Over spraying, under spraying, paint scratch off', critical: false, major: true, minor: true, photoRequired: true },
      { description: 'Over electroplating, under electroplating, electroplating peel off', critical: false, major: true, minor: true, photoRequired: true },
      { description: 'Poor printing of logo', critical: false, major: true, minor: false, photoRequired: true },
      { description: 'Mildew', critical: true, major: false, minor: false, photoRequired: true },
    ],
    supplierInfo: { supplierName: '', englishName: '', statusEntries: [] },
    factoryInfo: {
      factoryName: '',
      englishName: '',
      address: '',
      mainContactPerson: '',
      otherContactPersons: '',
      phone: '',
      mobile: '',
      fax: '',
      equipmentInstruments: '',
      communicationEquipment: '',
      inspectionEnvironment: '',
      workingTime: 'AM: 9:00 - PM: 6:00',
      transportationRoute: '',
      accommodationNearFactory: '',
      notesOnFactoryDisagreements: '',
      inspectionNotes: '',
      abnormalStatusEntries: []
    },
    recentRecords: [],
    readingRecords: [],
    reportExecutionInfo: {
      timeClockRecords: [],
      inspectionDates: [],
      actualInspectedQuantity: 0,
      workmanshipFound: { critical: 0, major: 0, minor: 0 },
      problemRemark: '',
      generalRemark: '',
      overallConclusion: 'Pending',
      sampleSelected: 'No',
      calledCS: 'No',
      csConfirmedCall: false,
      clientRepOnSite: { present: false, details: '' },
      specialAttention: '',
      factoryRepSignedDraft: 'No',
      additionalRemarks: '',
      receivedPhoneCall: { cs: false, tm: false, none: false, na: false },
      workSupervisionRating: {
        materialsGuidance: { rating: 5, remarks: '' },
        csSupportLevel: { rating: 5, remarks: '' },
        tmWorkSatisfaction: { rating: 5, remarks: '' }
      }
    },
    reportUploads: {
      inspectorUploads: [],
      auditorUploads: [],
      inspectorReports: [],
      tmReports: []
    }
  });

  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if(data.notice) {
          // Merge fetched data with default structure to prevent undefined errors
          setFormData(prev => ({ ...prev, ...data.notice }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
    }
  }, [id, isNew, token]);

  // Fetch inspector list for the dropdown in Section 2
  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.ADMIN.INSPECTORS, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setInspectorOptions(d.inspectors || []))
      .catch(() => {});
  }, [token]);

  const handleSave = async (submitStatus = 'draft') => {
    setSaving(true);
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${ENDPOINTS.BASE_URL}/api/inspection-notices` : `${ENDPOINTS.BASE_URL}/api/inspection-notices/${id}`;
    
    const payload = { ...formData, status: submitStatus };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (isNew && data.notice) {
          navigate(`/admin/inspection-notices/${data.notice._id}`);
        } else {
          const prov = data.provisioned;
          const provMsg = prov
            ? ` Created ${prov.bookings?.length || 0} booking(s) and ${prov.tasks?.length || 0} task(s) for inspectors.`
            : '';
          setSaveMsg({ type: 'success', text: `Saved as "${submitStatus}".${provMsg}` });
          setTimeout(() => setSaveMsg(null), 5000);
        }
      } else {
        const err = await res.json();
        setSaveMsg({ type: 'error', text: 'Error saving: ' + (err.error || 'Unknown error') });
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const updateSection = (sectionPath, newValues) => {
    setFormData(prev => ({
      ...prev,
      [sectionPath]: { ...prev[sectionPath], ...newValues }
    }));
  };

  const updateRootField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      <AdminNavbar />

      {/* Top Sticky Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Link to="/admin/inspection-notices" className="hover:text-[#6C47FF] transition-colors">Inspection Notices</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800">{isNew ? 'New Notice' : formData.noticeId}</span>
          
          {!isNew && (
            <span className={`ml-4 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
              formData.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
              formData.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-200' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {formData.status.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="flex gap-3 items-center">
          {saveMsg && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold animate-in fade-in duration-300 ${
              saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {saveMsg.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {saveMsg.text}
            </div>
          )}
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#6C47FF] text-[#6C47FF] hover:bg-purple-50 rounded-lg font-bold text-sm transition-all"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button 
            onClick={() => handleSave(formData.teamAssignment.inspectors.length > 0 ? 'scheduled' : 'draft')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#6C47FF] hover:bg-purple-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Saving…' : 'Submit Notice'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-8 pt-6 bg-white border-b border-slate-200">
        <div className="flex gap-8">
          {['Notice', 'Expense', 'Report (Online)'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab ? 'border-[#6C47FF] text-[#6C47FF]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'Notice' && (
            <NoticeTab
              formData={formData}
              updateSection={updateSection}
              updateRootField={updateRootField}
              inspectorOptions={inspectorOptions}
              token={token}
              recordId={id}
            />
          )}
          {activeTab === 'Expense' && (
            <ExpenseTab />
          )}
          {activeTab === 'Report (Online)' && (
            <ReportTab
              formData={formData}
              updateSection={updateSection}
              token={token}
              recordId={id}
            />
          )}
        </div>
      </main>
    </div>
  );
}
