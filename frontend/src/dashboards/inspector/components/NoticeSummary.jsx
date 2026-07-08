import { useState, useEffect } from "react";
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { ExternalLink, Send } from "lucide-react";
import CompactCard from './CompactCard';

const val = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const yn = (v) => (v ? 'Yes' : 'No');
const dateStr = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const Field = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
    <div className="text-sm text-slate-700 mt-0.5">{value}</div>
  </div>
);

const FieldGrid = ({ fields }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {fields.map(([label, value]) => <Field key={label} label={label} value={value} />)}
  </div>
);

const DocLink = ({ label, doc }) => (
  <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-slate-600">{label}</span>
    {doc?.url ? (
      <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
        {doc.fileName || 'Open'} <ExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="text-slate-400">—</span>
    )}
  </div>
);

export default function NoticeSummary({ taskId }) {
  const { token } = useAuth();
  const [notice, setNotice] = useState(undefined); // undefined = loading, null = no notice
  const [loadError, setLoadError] = useState(false);
  const [queries, setQueries] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  useEffect(() => {
    fetch(ENDPOINTS.INSPECTOR.TASK_NOTICE(taskId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(data => {
        setNotice(data.notice || null);
        setQueries(data.notice?.inspectorQueries || []);
      })
      .catch(() => setLoadError(true));
  }, [taskId, token]);

  const handleSendQuery = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendError(false);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.TASK_NOTICE_QUERY(taskId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setQueries(data.inspectorQueries || []);
      setMessage('');
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  if (notice === undefined && !loadError) return <div className="text-sm text-slate-500">Loading notice…</div>;

  if (loadError) {
    return <div className="text-sm text-red-600">Couldn't load the notice for this task. Try refreshing the page.</div>;
  }

  if (notice === null) {
    return <div className="text-sm text-slate-500">No notice on file for this task.</div>;
  }

  const b = notice.basicInfo || {};
  const t = notice.teamAssignment || {};
  const p = notice.productInfo || {};
  const aql = notice.aql || {};
  const req = notice.inspectionRequirements || {};
  const special = notice.specialClientRequirements || {};
  const samples = notice.customerSamples || {};
  const info = notice.inspectionInfo || {};
  const att = notice.attachments || {};
  const tools = notice.inspectionTools || {};
  const supplier = notice.supplierInfo || {};
  const factory = notice.factoryInfo || {};

  return (
    <div className="space-y-4 max-w-4xl">
      <CompactCard title="Basic Information">
        <FieldGrid fields={[
          ['Service Type', b.serviceType === 'Others' ? b.serviceTypeOther : val(b.serviceType)],
          ['Inspection Date From', dateStr(b.inspectionDateFrom)],
          ['Inspection Date To', dateStr(b.inspectionDateTo)],
          ['Location', val(b.inspectionLocation)],
          ['Customer', val(notice.clientCode)],
          ['Product Category', b.productCategory === 'Others' ? b.productCategoryOther : val(b.productCategory)],
          ['Same Day Report', yn(b.sameDayReport)],
          ['Online Report', yn(b.onlineReport)],
          ['Offline Report', yn(b.offlineReport)],
        ]} />
      </CompactCard>

      <CompactCard title="Team Assignment">
        <FieldGrid fields={[
          ['CS', val(t.cs?.name)],
          ['CSE', val(t.cse?.name)],
          ['Preview Manager', val(t.previewManager?.name)],
          ['Scheduler', val(t.scheduler?.name)],
        ]} />
        {(t.inspectors || []).length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Inspectors</div>
            {t.inspectors.map((i, idx) => (
              <div key={idx} className="text-sm text-slate-700">{i.name} — {i.role || 'Member'}{i.manDays ? ` · ${i.manDays} man-days` : ''}</div>
            ))}
          </div>
        )}
      </CompactCard>

      <CompactCard title="Product Information">
        <FieldGrid fields={[
          ['Total Quantity', val(p.totalQuantity)],
          ['Quantity Finished', val(p.quantityFinished)],
          ['Quantity Packed', val(p.quantityPacked)],
          ['Destination', val(p.destination)],
          ['Shipment Date', dateStr(p.shipmentDate)],
        ]} />
        {(p.products || []).length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Order No.</th><th className="py-1 pr-3">Product</th><th className="py-1 pr-3">Item No.</th><th className="py-1 pr-3">Qty</th><th className="py-1">Unit</th>
                </tr>
              </thead>
              <tbody>
                {p.products.map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.orderNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.productName)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.itemNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.quantity)}</td>
                    <td className="py-1.5 text-slate-700">{val(row.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {p.orderRemarks && <p className="text-sm text-slate-600 mt-2">{p.orderRemarks}</p>}
      </CompactCard>

      <CompactCard title="AQL">
        <FieldGrid fields={[
          ['Sampling Level', val(aql.samplingLevel)],
          ['Sampled Quantity', val(aql.sampledQuantity)],
        ]} />
        <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3 mt-3 border border-slate-200">
          {['critical', 'major', 'minor'].map(key => (
            <div key={key}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{key}</div>
              <div className="text-sm text-slate-700">Std: {val(aql.inspectionStandard?.[key])} / Accepted: {val(aql.acceptedQuantity?.[key])}</div>
            </div>
          ))}
        </div>
        {aql.remarks && <p className="text-sm text-slate-600 mt-2">{aql.remarks}</p>}
      </CompactCard>

      <CompactCard title="Inspection Requirements">
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Customer General Requirement:</span> {val(req.customerGeneralRequirement)}</p>
          <p><span className="font-semibold">Technical Manager Remarks:</span> {val(req.technicalManagerRemarks)}</p>
          <p><span className="font-semibold">Customer Service Remarks:</span> {val(req.customerServiceRemarks)}</p>
          <p><span className="font-semibold">Organizer Remarks:</span> {val(req.organizerRemarks)}</p>
        </div>
      </CompactCard>

      <CompactCard title="Special Client Requirements">
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Special Requirements:</span> {val(special.customerSpecialRequirements)}</p>
          <p><span className="font-semibold">Color/Material/Finish:</span> {val(special.colorMaterialFinish)}</p>
          <p><span className="font-semibold">Dimension/Weight:</span> {val(special.dimensionWeight)}</p>
          <p><span className="font-semibold">Logo/Label:</span> {val(special.logoLabel)}</p>
          <p><span className="font-semibold">Packing Material:</span> {val(special.packingMaterial)}</p>
          <p><span className="font-semibold">Shipping Mark:</span> {val(special.shippingMark)}</p>
          {special.additionalComments && <p><span className="font-semibold">Additional Comments:</span> {special.additionalComments}</p>}
        </div>
      </CompactCard>

      {(samples.samples || []).length > 0 && (
        <CompactCard title="Customer Samples">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Serial No.</th><th className="py-1 pr-3">Item No.</th><th className="py-1 pr-3">Name</th><th className="py-1 pr-3">Qty</th><th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {samples.samples.map((s, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.serialNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.itemNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.name)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.quantity)}</td>
                    <td className="py-1.5 text-slate-700">{val(s.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {samples.remarks && <p className="text-sm text-slate-600 mt-2">{samples.remarks}</p>}
        </CompactCard>
      )}

      <CompactCard title="Inspection Info & Documents">
        <FieldGrid fields={[
          ['TM Reviewed', yn(info.technicalManagerReviewed)],
          ['Customer Claim Form', val(info.customerClaimForm)],
        ]} />
        <div className="mt-3">
          <DocLink label="Online WI" doc={info.onlineWI} />
          <DocLink label="Online Customer Claim Form" doc={info.onlineCustomerClaimForm} />
          {(info.reportTemplate || []).map((doc, idx) => (
            <DocLink key={idx} label={`Report Template ${idx + 1}`} doc={doc} />
          ))}
        </div>
      </CompactCard>

      <CompactCard title="Attachments">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Client Files</div>
          {(att.clientFiles || []).length === 0 ? <p className="text-sm text-slate-400">None</p> : att.clientFiles.map((doc, idx) => <DocLink key={idx} label={doc.fileName} doc={doc} />)}
        </div>
        <div className="mt-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Supplier Files</div>
          {(att.supplierFiles || []).length === 0 ? <p className="text-sm text-slate-400">None</p> : att.supplierFiles.map((doc, idx) => <DocLink key={idx} label={doc.fileName} doc={doc} />)}
        </div>
      </CompactCard>

      <CompactCard title="Inspection Tools & Equipment">
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
          <div><span className="font-semibold">Tools:</span> {(tools.tools || []).join(', ') || '—'}</div>
          <div><span className="font-semibold">Equipment:</span> {(tools.equipment || []).join(', ') || '—'}</div>
        </div>
      </CompactCard>

      {(notice.onSiteTests || []).length > 0 && (
        <CompactCard title="On-Site Tests">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Description</th><th className="py-1 pr-3">Method</th><th className="py-1 pr-3">Criteria</th><th className="py-1">Sample Size</th>
                </tr>
              </thead>
              <tbody>
                {notice.onSiteTests.filter(t => t.include).map((t, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(t.description)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(t.method)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(t.criteria)}</td>
                    <td className="py-1.5 text-slate-700">{val(t.sampleSize)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CompactCard>
      )}

      {(notice.defectClassifications || []).length > 0 && (
        <CompactCard title="Defect Classification List">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Description</th><th className="py-1 pr-3">Critical</th><th className="py-1 pr-3">Major</th><th className="py-1 pr-3">Minor</th><th className="py-1">Photo Req.</th>
                </tr>
              </thead>
              <tbody>
                {notice.defectClassifications.map((d, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(d.description)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{yn(d.critical)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{yn(d.major)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{yn(d.minor)}</td>
                    <td className="py-1.5 text-slate-700">{yn(d.photoRequired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CompactCard>
      )}

      <CompactCard title="Supplier Information">
        <FieldGrid fields={[
          ['Supplier Name', val(supplier.supplierName)],
          ['English Name', val(supplier.englishName)],
        ]} />
      </CompactCard>

      <CompactCard title="Factory Information">
        <FieldGrid fields={[
          ['Factory Name', val(factory.factoryName)],
          ['English Name', val(factory.englishName)],
          ['Address', val(factory.address)],
          ['Landmark', val(factory.landmark)],
          ['Main Contact', val(factory.mainContactPerson)],
          ['Phone', val(factory.phone)],
          ['Mobile', val(factory.mobile)],
          ['Working Time', factory.workingTimeStart ? `${factory.workingTimeStart} – ${factory.workingTimeEnd || '?'}` : '—'],
        ]} />
        {factory.googleMapsLink && (
          <a href={factory.googleMapsLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline mt-2">
            Open in Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {factory.inspectionNotes && <p className="text-sm text-slate-600 mt-2">{factory.inspectionNotes}</p>}
      </CompactCard>

      <CompactCard title="Have a question for CS?">
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Type your query for CS…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            onClick={handleSendQuery}
            disabled={sending || !message.trim()}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> {sending ? 'Sending…' : 'Send'}
          </button>
          {sendError && <p className="text-xs text-red-600">Couldn't send your query. Please try again.</p>}
          {queries.length > 0 && (
            <div className="mt-3 space-y-2">
              {[...queries].reverse().map((q, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-slate-700">{q.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(q.raisedAt).toLocaleString()}</p>
                  {q.reply && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <p className="text-sm text-slate-700">{q.reply}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{q.repliedBy} · {new Date(q.repliedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CompactCard>
    </div>
  );
}
