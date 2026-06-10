import React, { useEffect } from 'react';
import SectionCard from './SectionCard';
import { Plus, X, ExternalLink, Calculator } from 'lucide-react';
import { calculateAQL } from '../../../../utils/aqlCalculator';

export default function NoticeTab({ formData, updateSection, updateRootField, inspectorOptions = [] }) {
  const basicInfo = formData.basicInfo || {};
  const teamAssignment = formData.teamAssignment || { cs: {}, cse: {}, previewManager: {}, scheduler: {}, inspectors: [] };
  const productInfo = formData.productInfo || { products: [] };
  const aql = formData.aql || { inspectionStandard: {}, acceptedQuantity: {} };
  const inspectionReqs = formData.inspectionRequirements || {};
  const specialReqs = formData.specialClientRequirements || {};
  const customerSamples = formData.customerSamples || { samples: [] };
  const inspectionInfo = formData.inspectionInfo || { generalWorkInstructions: [], operationalWorkInstructions: [] };
  const attachments = formData.attachments || { clientFiles: [], supplierFiles: [] };
  const toolsInfo = formData.inspectionTools || { tools: [], equipment: [], trainingMaterials: [] };
  const onSiteTests = formData.onSiteTests || [];
  const defects = formData.defectClassifications || [];
  const supplierInfo = formData.supplierInfo || { statusEntries: [] };
  const factoryInfo = formData.factoryInfo || { abnormalStatusEntries: [] };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  // Reusable component for the table-style layout
  const TableRow = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row border-b border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors group">
      <div className="w-full sm:w-1/3 bg-slate-50 p-4 flex items-center border-r border-slate-200 group-hover:bg-slate-100/50 transition-colors">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className="w-full sm:w-2/3 p-4 flex items-center">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );

  // Auto-calculate Total Quantity whenever products array changes
  useEffect(() => {
    const sum = (formData.productInfo?.products || []).reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    if (sum > 0 && formData.productInfo?.totalQuantity !== sum) {
      updateSection('productInfo', { totalQuantity: sum });
    }
  }, [formData.productInfo?.products]);

  // Auto-calculate AQL Sample Size and Accepted Quantities
  useEffect(() => {
    const totalQty = formData.productInfo?.totalQuantity || 0;
    const level = aql.samplingLevel || 'Level II';
    const standard = aql.inspectionStandard || { critical: 'Not Allowed', major: 2.5, minor: 4.0 };
    
    const result = calculateAQL(totalQty, level, standard);
    if (result) {
      updateSection('aql', { 
        sampledQuantity: result.sampleSize,
        acceptedQuantity: result.acceptedQuantity
      });
    }
  }, [
    formData.productInfo?.totalQuantity, 
    aql.samplingLevel, 
    aql.inspectionStandard?.critical, 
    aql.inspectionStandard?.major, 
    aql.inspectionStandard?.minor
  ]);

  // Helpers to safely update arrays
  const addArrayItem = (section, arrayName, newItem) => {
    const currentArray = formData[section]?.[arrayName] || [];
    updateSection(section, { [arrayName]: [...currentArray, newItem] });
  };
  const removeArrayItem = (section, arrayName, index) => {
    const currentArray = formData[section]?.[arrayName] || [];
    updateSection(section, { [arrayName]: currentArray.filter((_, i) => i !== index) });
  };
  const updateArrayItem = (section, arrayName, index, field, value) => {
    const currentArray = [...(formData[section]?.[arrayName] || [])];
    currentArray[index] = { ...currentArray[index], [field]: value };
    updateSection(section, { [arrayName]: currentArray });
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Basic Information */}
      <SectionCard title="SECTION 1: Basic Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Inspection No.">
            <input 
              className={`${inputClass} bg-slate-100`} 
              readOnly 
              value={formData.noticeId || ''} 
            />
          </TableRow>
          <TableRow label="Customer Name">
            <input className={inputClass} value={basicInfo.customerName || ''} onChange={e => updateSection('basicInfo', { customerName: e.target.value })} />
          </TableRow>
          <TableRow label="Service Type">
            <select 
              className={inputClass} 
              value={basicInfo.serviceType || ''}
              onChange={e => updateSection('basicInfo', { serviceType: e.target.value })}
            >
              <option value="Pre-Shipment Inspection">Pre-Shipment Inspection</option>
              <option value="Container Loading Supervision">Container Loading Supervision</option>
              <option value="Factory Audit">Factory Audit</option>
              <option value="During Production Inspection">During Production Inspection</option>
            </select>
          </TableRow>
          <TableRow label="Product Category">
            <input className={inputClass} value={basicInfo.productCategory || ''} onChange={e => updateSection('basicInfo', { productCategory: e.target.value })} />
          </TableRow>
          <TableRow label="Report Types">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={basicInfo.sameDayReport} onChange={e => updateSection('basicInfo', { sameDayReport: e.target.checked })} className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4" />
                Same-day Report
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={basicInfo.onlineReport} onChange={e => updateSection('basicInfo', { onlineReport: e.target.checked })} className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4" />
                Online Report
              </label>
            </div>
          </TableRow>
          <TableRow label="Special Flags">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={basicInfo.attentiveOrder} onChange={e => updateSection('basicInfo', { attentiveOrder: e.target.checked })} className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4" />
                Attentive Order
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={basicInfo.csSatisfactionBonus} onChange={e => updateSection('basicInfo', { csSatisfactionBonus: e.target.checked })} className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4" />
                CS Satisfaction Bonus
              </label>
            </div>
          </TableRow>
          <TableRow label="Inspection Dates">
            <div className="flex gap-4">
              <div className="flex-1">
                <input type="date" className={inputClass} value={basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : ''} onChange={e => updateSection('basicInfo', { inspectionDateFrom: e.target.value })} />
                <span className="text-[10px] text-slate-400 mt-1 block">From</span>
              </div>
              <div className="flex-1">
                <input type="date" className={inputClass} value={basicInfo.inspectionDateTo ? basicInfo.inspectionDateTo.split('T')[0] : ''} onChange={e => updateSection('basicInfo', { inspectionDateTo: e.target.value })} />
                <span className="text-[10px] text-slate-400 mt-1 block">To</span>
              </div>
            </div>
          </TableRow>
          <TableRow label="Inspection Location">
            <input className={inputClass} value={basicInfo.inspectionLocation || ''} onChange={e => updateSection('basicInfo', { inspectionLocation: e.target.value })} />
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 2: Team Assignment */}
      <SectionCard title="SECTION 2: Team Assignment">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {['cs', 'cse', 'previewManager'].map((roleKey, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-bold text-slate-700 uppercase">{roleKey.replace(/([A-Z])/g, ' $1').trim()}</td>
                  <td className="px-4 py-3"><input className={inputClass} value={teamAssignment[roleKey]?.name || ''} onChange={e => updateSection('teamAssignment', { [roleKey]: { ...teamAssignment[roleKey], name: e.target.value } })} /></td>
                  <td className="px-4 py-3"><input className={inputClass} value={teamAssignment[roleKey]?.phone || ''} onChange={e => updateSection('teamAssignment', { [roleKey]: { ...teamAssignment[roleKey], phone: e.target.value } })} /></td>
                  <td className="px-4 py-3"><input className={inputClass} value={teamAssignment[roleKey]?.mobile || ''} onChange={e => updateSection('teamAssignment', { [roleKey]: { ...teamAssignment[roleKey], mobile: e.target.value } })} /></td>
                </tr>
              ))}
              <tr className="bg-[#F0EBFF]">
                <td className="px-4 py-3 font-bold text-slate-700 uppercase">Scheduler</td>
                <td className="px-4 py-3"><input className={`${inputClass} bg-white`} value={teamAssignment.scheduler?.name || ''} onChange={e => updateSection('teamAssignment', { scheduler: { ...teamAssignment.scheduler, name: e.target.value } })} /></td>
                <td className="px-4 py-3"><input className={`${inputClass} bg-white`} value={teamAssignment.scheduler?.phone || ''} onChange={e => updateSection('teamAssignment', { scheduler: { ...teamAssignment.scheduler, phone: e.target.value } })} /></td>
                <td className="px-4 py-3"><input className={`${inputClass} bg-white`} value={teamAssignment.scheduler?.mobile || ''} onChange={e => updateSection('teamAssignment', { scheduler: { ...teamAssignment.scheduler, mobile: e.target.value } })} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Inspector(s)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Date From</th>
                  <th className="px-4 py-2">Date To</th>
                  <th className="px-4 py-2">Mobile</th>
                  <th className="px-4 py-2">Man-Days</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamAssignment.inspectors.map((ins, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      {inspectorOptions.length > 0 ? (
                        <select
                          className={inputClass}
                          value={ins.inspectorId || ''}
                          onChange={e => {
                            const opt = inspectorOptions.find(o => o._id === e.target.value);
                            const currentArray = [...(formData.teamAssignment?.inspectors || [])];
                            currentArray[idx] = { ...currentArray[idx], inspectorId: e.target.value };
                            if (opt) {
                              currentArray[idx].name = opt.name || opt.email;
                            }
                            updateSection('teamAssignment', { inspectors: currentArray });
                          }}
                        >
                          <option value="">— Select Inspector —</option>
                          {inspectorOptions.map(o => (
                            <option key={o._id} value={o._id}>{o.name || o.email}</option>
                          ))}
                        </select>
                      ) : (
                        <input className={inputClass} value={ins.name || ''} onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'name', e.target.value)} />
                      )}
                    </td>
                    <td className="px-4 py-2"><input type="date" className={inputClass} value={ins.dateFrom ? ins.dateFrom.split('T')[0] : ''} onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'dateFrom', e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="date" className={inputClass} value={ins.dateTo ? ins.dateTo.split('T')[0] : ''} onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'dateTo', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={ins.mobile} onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'mobile', e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="number" className={inputClass} value={ins.manDays || ''} onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'manDays', e.target.value)} /></td>
                    <td className="px-4 py-2">
                      <select className={inputClass} value={ins.role} onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'role', e.target.value)}>
                        <option value="Leader">Leader</option>
                        <option value="Member">Member</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('teamAssignment', 'inspectors', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button 
              onClick={() => addArrayItem('teamAssignment', 'inspectors', { name: '', dateFrom: '', dateTo: '', mobile: '', manDays: 1, role: 'Member' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Inspector
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 3: Product Information */}
      <SectionCard title="SECTION 3: Product Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Order No.</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Item No.</th>
                  <th className="px-4 py-3 w-32">Quantity</th>
                  <th className="px-4 py-3 w-32">Unit</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productInfo.products.map((p, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3"><input className={inputClass} value={p.orderNo || ''} onChange={e => updateArrayItem('productInfo', 'products', idx, 'orderNo', e.target.value)} /></td>
                    <td className="px-4 py-3"><input className={inputClass} value={p.productName || ''} onChange={e => updateArrayItem('productInfo', 'products', idx, 'productName', e.target.value)} /></td>
                    <td className="px-4 py-3"><input className={inputClass} value={p.itemNo || ''} onChange={e => updateArrayItem('productInfo', 'products', idx, 'itemNo', e.target.value)} /></td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min="0"
                        className={inputClass} 
                        value={p.quantity === 0 ? '' : (p.quantity || '')} 
                        onChange={e => {
                          updateArrayItem('productInfo', 'products', idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value));
                        }} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select className={inputClass} value={p.unit || 'pcs'} onChange={e => updateArrayItem('productInfo', 'products', idx, 'unit', e.target.value)}>
                        <option>pcs</option><option>sets</option><option>pairs</option><option>kg</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeArrayItem('productInfo', 'products', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={() => addArrayItem('productInfo', 'products', { orderNo: '', productName: '', itemNo: '', quantity: 0, unit: 'pcs' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
          <TableRow label="Total Quantity">
            <div>
              <input type="number" min="0" className={`${inputClass} font-bold max-w-xs`} value={productInfo.totalQuantity === 0 ? '' : (productInfo.totalQuantity || '')} onChange={e => updateSection('productInfo', { totalQuantity: e.target.value === '' ? 0 : Number(e.target.value) })} />
              <p className="text-xs text-slate-400 mt-1">Sum of product quantities: {productInfo.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0)}</p>
            </div>
          </TableRow>
          <TableRow label="Finished Products (%)">
            <input type="number" min="0" max="100" className={`${inputClass} max-w-xs`} value={productInfo.quantityFinished === 0 ? '' : (productInfo.quantityFinished || '')} onChange={e => updateSection('productInfo', { quantityFinished: e.target.value === '' ? 0 : Number(e.target.value) })} />
          </TableRow>
          <TableRow label="Packed (%)">
            <input type="number" min="0" max="100" className={`${inputClass} max-w-xs`} value={productInfo.quantityPacked === 0 ? '' : (productInfo.quantityPacked || '')} onChange={e => updateSection('productInfo', { quantityPacked: e.target.value === '' ? 0 : Number(e.target.value) })} />
          </TableRow>
          <TableRow label="Order Remarks">
            <textarea className={inputClass} rows={2} value={productInfo.orderRemarks || ''} onChange={e => updateSection('productInfo', { orderRemarks: e.target.value })} />
          </TableRow>
          <TableRow label="Destination">
            <input className={inputClass} value={productInfo.destination || ''} onChange={e => updateSection('productInfo', { destination: e.target.value })} />
          </TableRow>
          <TableRow label="Shipment Date">
            <input type="date" className={`${inputClass} max-w-xs`} value={productInfo.shipmentDate ? productInfo.shipmentDate.split('T')[0] : ''} onChange={e => updateSection('productInfo', { shipmentDate: e.target.value })} />
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 4: AQL */}
      <SectionCard title="SECTION 4: AQL (Acceptance Quality Limit)">
        <div className="mb-4 bg-purple-50 text-purple-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-purple-100">
          <Calculator className="w-4 h-4" />
          <strong>Auto-AQL:</strong> Sample Size and Accepted Quantities are calculated automatically based on ISO 2859-1.
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Sampling Level">
            <select className={`${inputClass} max-w-xs`} value={aql.samplingLevel || 'Level II'} onChange={e => updateSection('aql', { samplingLevel: e.target.value })}>
              <option>Level I</option><option>Level II</option><option>Level III</option>
            </select>
          </TableRow>
          <TableRow label="Sampled Quantity">
            <input type="number" min="0" className={`${inputClass} max-w-xs`} value={aql.sampledQuantity === 0 ? '' : (aql.sampledQuantity || '')} onChange={e => updateSection('aql', { sampledQuantity: e.target.value === '' ? 0 : Number(e.target.value) })} />
          </TableRow>
          <TableRow label="Inspection Standard">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Critical</div>
                <select className={inputClass} value={aql.inspectionStandard?.critical || 'Not Allowed'} onChange={e => updateSection('aql', { inspectionStandard: { ...aql.inspectionStandard, critical: e.target.value } })}>
                  <option>Not Allowed</option><option>0.065</option><option>0.10</option><option>0.15</option><option>0.25</option><option>0.40</option><option>0.65</option><option>1.0</option><option>1.5</option><option>2.5</option><option>4.0</option><option>6.5</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Major</div>
                <input type="number" min="0" step="0.1" className={inputClass} value={aql.inspectionStandard?.major === 0 ? '' : (aql.inspectionStandard?.major ?? '')} onChange={e => updateSection('aql', { inspectionStandard: { ...aql.inspectionStandard, major: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Minor</div>
                <input type="number" min="0" step="0.1" className={inputClass} value={aql.inspectionStandard?.minor === 0 ? '' : (aql.inspectionStandard?.minor ?? '')} onChange={e => updateSection('aql', { inspectionStandard: { ...aql.inspectionStandard, minor: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
            </div>
          </TableRow>
          <TableRow label="Accepted Quantity">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Critical</div>
                <input type="number" min="0" className={inputClass} value={aql.acceptedQuantity?.critical === 0 ? '' : (aql.acceptedQuantity?.critical ?? '')} onChange={e => updateSection('aql', { acceptedQuantity: { ...aql.acceptedQuantity, critical: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Major</div>
                <input type="number" min="0" className={inputClass} value={aql.acceptedQuantity?.major === 0 ? '' : (aql.acceptedQuantity?.major ?? '')} onChange={e => updateSection('aql', { acceptedQuantity: { ...aql.acceptedQuantity, major: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Minor</div>
                <input type="number" min="0" className={inputClass} value={aql.acceptedQuantity?.minor === 0 ? '' : (aql.acceptedQuantity?.minor ?? '')} onChange={e => updateSection('aql', { acceptedQuantity: { ...aql.acceptedQuantity, minor: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
            </div>
          </TableRow>
          <TableRow label="AQL Remarks">
            <textarea className={inputClass} rows={3} value={aql.remarks || ''} onChange={e => updateSection('aql', { remarks: e.target.value })} />
          </TableRow>
        </div>

        <button className="w-full mt-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm">
          View Historical Complaints (25)
        </button>
      </SectionCard>

      {/* SECTION 5: Inspection Requirements */}
      <SectionCard title="SECTION 5: Inspection Requirements">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Customer General Requirement">
            <textarea className={inputClass} rows={4} value={inspectionReqs.customerGeneralRequirement || ''} onChange={e => updateSection('inspectionRequirements', { customerGeneralRequirement: e.target.value })} />
          </TableRow>
          <TableRow label="Technical Manager Remarks">
            <textarea className={inputClass} rows={4} placeholder="Inspector must read the customer requirements form carefully before inspection. Customer requirements are very strict." value={inspectionReqs.technicalManagerRemarks || ''} onChange={e => updateSection('inspectionRequirements', { technicalManagerRemarks: e.target.value })} />
          </TableRow>
          <TableRow label="Customer Service Remarks">
            <textarea className={inputClass} rows={4} placeholder="1. Please take the RAL color book...&#10;2. Spare parts: ensure quantities...&#10;3. Please see attached file reference." value={inspectionReqs.customerServiceRemarks || ''} onChange={e => updateSection('inspectionRequirements', { customerServiceRemarks: e.target.value })} />
          </TableRow>
          <TableRow label="Organizer Remarks">
            <textarea className={inputClass} rows={4} value={inspectionReqs.organizerRemarks || ''} onChange={e => updateSection('inspectionRequirements', { organizerRemarks: e.target.value })} />
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 6: Special Client Requirements */}
      <SectionCard title="SECTION 6: Special Client Requirements">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Customer Special Requirements">
            <textarea className={inputClass} rows={3} value={specialReqs.customerSpecialRequirements || ''} onChange={e => updateSection('specialClientRequirements', { customerSpecialRequirements: e.target.value })} />
          </TableRow>
          <TableRow label="Color / Material / Finish">
            <textarea className={inputClass} rows={2} value={specialReqs.colorMaterialFinish || ''} onChange={e => updateSection('specialClientRequirements', { colorMaterialFinish: e.target.value })} />
          </TableRow>
          <TableRow label="Dimension / Weight">
            <textarea className={inputClass} rows={2} value={specialReqs.dimensionWeight || ''} onChange={e => updateSection('specialClientRequirements', { dimensionWeight: e.target.value })} />
          </TableRow>
          <TableRow label="Logo / Label">
            <textarea className={inputClass} rows={2} value={specialReqs.logoLabel || ''} onChange={e => updateSection('specialClientRequirements', { logoLabel: e.target.value })} />
          </TableRow>
          <TableRow label="Packing Material">
            <textarea className={inputClass} rows={2} value={specialReqs.packingMaterial || ''} onChange={e => updateSection('specialClientRequirements', { packingMaterial: e.target.value })} />
          </TableRow>
          <TableRow label="Shipping Mark">
            <textarea className={inputClass} rows={2} value={specialReqs.shippingMark || ''} onChange={e => updateSection('specialClientRequirements', { shippingMark: e.target.value })} />
          </TableRow>
          <TableRow label="Additional Comments">
            <textarea className={inputClass} rows={2} value={specialReqs.additionalComments || ''} onChange={e => updateSection('specialClientRequirements', { additionalComments: e.target.value })} />
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 7: Customer Samples */}
      <SectionCard title="SECTION 7: Customer Samples">
        <div className="mb-4">
          <label className={labelClass}>Remarks</label>
          <textarea className={inputClass} rows={2} value={customerSamples.remarks || ''} onChange={e => updateSection('customerSamples', { remarks: e.target.value })} />
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Serial No.</th>
                  <th className="px-4 py-3">Item No.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Storage Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerSamples.samples.map((s, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input className={inputClass} value={s.serialNo || ''} onChange={e => updateArrayItem('customerSamples', 'samples', idx, 'serialNo', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={s.itemNo || ''} onChange={e => updateArrayItem('customerSamples', 'samples', idx, 'itemNo', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={s.name || ''} onChange={e => updateArrayItem('customerSamples', 'samples', idx, 'name', e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="number" className={inputClass} value={s.quantity || 0} onChange={e => updateArrayItem('customerSamples', 'samples', idx, 'quantity', Number(e.target.value))} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={s.storageLocation || ''} onChange={e => updateArrayItem('customerSamples', 'samples', idx, 'storageLocation', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={s.status || ''} onChange={e => updateArrayItem('customerSamples', 'samples', idx, 'status', e.target.value)} /></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('customerSamples', 'samples', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={() => addArrayItem('customerSamples', 'samples', { serialNo: '', itemNo: '', name: '', quantity: 1, storageLocation: '', status: 'Available' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Sample
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 8: Inspection Information */}
      <SectionCard title="SECTION 8: Inspection Information" badge={!inspectionInfo.technicalManagerReviewed ? <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">⚠ Not Examined by Technical Manager</span> : null}>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Online WI">
            <div className="flex gap-2">
              <input className={inputClass} value={inspectionInfo.onlineWI || ''} onChange={e => updateSection('inspectionInfo', { onlineWI: e.target.value })} />
              <button className="px-4 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200">Open</button>
            </div>
          </TableRow>
          <TableRow label="Report Template">
            <input className={inputClass} value={inspectionInfo.reportTemplate || ''} onChange={e => updateSection('inspectionInfo', { reportTemplate: e.target.value })} />
          </TableRow>
          <TableRow label="Online Customer Claim Form">
            <div className="flex gap-2">
              <input className={inputClass} value={inspectionInfo.onlineCustomerClaimForm || ''} onChange={e => updateSection('inspectionInfo', { onlineCustomerClaimForm: e.target.value })} />
              <button className="px-4 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200">Open</button>
            </div>
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 9: Attachments */}
      <SectionCard title="SECTION 9: Attachments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Client Files</h4>
            <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              <p>No client files uploaded.</p>
              <button className="mt-3 px-4 py-2 border border-[#6C47FF] text-[#6C47FF] rounded-lg text-xs font-bold hover:bg-purple-50">Upload File</button>
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Supplier Files</h4>
            <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              <p>No supplier files uploaded.</p>
              <button className="mt-3 px-4 py-2 border border-[#6C47FF] text-[#6C47FF] rounded-lg text-xs font-bold hover:bg-purple-50">Upload File</button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 10: Inspection Tools & Equipment */}
      <SectionCard title="SECTION 10: Inspection Tools & Equipment">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Tools">
            <textarea className={inputClass} rows={3} value={toolsInfo.tools.join('\n')} onChange={e => updateSection('inspectionTools', { tools: e.target.value.split('\n') })} placeholder="Enter one tool per line..." />
          </TableRow>
          <TableRow label="Equipment">
            <textarea className={inputClass} rows={3} value={toolsInfo.equipment.join('\n')} onChange={e => updateSection('inspectionTools', { equipment: e.target.value.split('\n') })} placeholder="Enter one equipment per line..." />
          </TableRow>
          <TableRow label="Training Materials">
            <textarea className={inputClass} rows={3} value={toolsInfo.trainingMaterials.map(t => t.courseName).join('\n')} onChange={e => updateSection('inspectionTools', { trainingMaterials: e.target.value.split('\n').map(c => ({ courseName: c })) })} placeholder="Enter one course per line..." />
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 11: On-Site Tests */}
      <SectionCard title="SECTION 11: On-Site Tests">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Include</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Criteria</th>
                  <th className="px-4 py-3">Sample Size</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onSiteTests.map((t, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={t.include || false} onChange={e => updateArrayItem('onSiteTests', '', idx, 'include', e.target.checked)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={t.description || ''} onChange={e => updateArrayItem('onSiteTests', '', idx, 'description', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={t.method || ''} onChange={e => updateArrayItem('onSiteTests', '', idx, 'method', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={t.criteria || ''} onChange={e => updateArrayItem('onSiteTests', '', idx, 'criteria', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={t.sampleSize || ''} onChange={e => updateArrayItem('onSiteTests', '', idx, 'sampleSize', e.target.value)} /></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('onSiteTests', '', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={() => updateRootField('onSiteTests', [...onSiteTests, { include: true, description: '', method: '', criteria: '', sampleSize: '' }])}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Test
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 12: Defect Classification List */}
      <SectionCard title="SECTION 12: Defect Classification List">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Critical</th>
                  <th className="px-4 py-3 text-center">Major</th>
                  <th className="px-4 py-3 text-center">Minor</th>
                  <th className="px-4 py-3 text-center">Photo</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defects.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2"><input className={inputClass} value={d.description || ''} onChange={e => { const nd = [...defects]; nd[idx].description = e.target.value; updateRootField('defectClassifications', nd); }} /></td>
                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={d.critical || false} onChange={e => { const nd = [...defects]; nd[idx].critical = e.target.checked; updateRootField('defectClassifications', nd); }} /></td>
                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={d.major || false} onChange={e => { const nd = [...defects]; nd[idx].major = e.target.checked; updateRootField('defectClassifications', nd); }} /></td>
                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={d.minor || false} onChange={e => { const nd = [...defects]; nd[idx].minor = e.target.checked; updateRootField('defectClassifications', nd); }} /></td>
                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={d.photoRequired || false} onChange={e => { const nd = [...defects]; nd[idx].photoRequired = e.target.checked; updateRootField('defectClassifications', nd); }} /></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => updateRootField('defectClassifications', defects.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button 
              onClick={() => updateRootField('defectClassifications', [...defects, { description: '', critical: false, major: false, minor: false, photoRequired: true }])}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Defect
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 13: Supplier Information */}
      <SectionCard title="SECTION 13: Supplier Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Supplier Name"><input className={inputClass} value={supplierInfo.supplierName || ''} onChange={e => updateSection('supplierInfo', { supplierName: e.target.value })} /></TableRow>
          <TableRow label="English Name"><input className={inputClass} value={supplierInfo.englishName || ''} onChange={e => updateSection('supplierInfo', { englishName: e.target.value })} /></TableRow>
        </div>
      </SectionCard>

      {/* SECTION 14: Factory Information */}
      <SectionCard title="SECTION 14: Factory Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Factory Name"><input className={inputClass} value={factoryInfo.factoryName || ''} onChange={e => updateSection('factoryInfo', { factoryName: e.target.value })} /></TableRow>
          <TableRow label="English Name"><input className={inputClass} value={factoryInfo.englishName || ''} onChange={e => updateSection('factoryInfo', { englishName: e.target.value })} /></TableRow>
          <TableRow label="Address"><input className={inputClass} value={factoryInfo.address || ''} onChange={e => updateSection('factoryInfo', { address: e.target.value })} /></TableRow>
          <TableRow label="Main Contact Person"><input className={inputClass} value={factoryInfo.mainContactPerson || ''} onChange={e => updateSection('factoryInfo', { mainContactPerson: e.target.value })} /></TableRow>
          <TableRow label="Phone"><input className={inputClass} value={factoryInfo.phone || ''} onChange={e => updateSection('factoryInfo', { phone: e.target.value })} /></TableRow>
          <TableRow label="Mobile"><input className={inputClass} value={factoryInfo.mobile || ''} onChange={e => updateSection('factoryInfo', { mobile: e.target.value })} /></TableRow>
          <TableRow label="Fax"><input className={inputClass} value={factoryInfo.fax || ''} onChange={e => updateSection('factoryInfo', { fax: e.target.value })} /></TableRow>
          <TableRow label="Equipment & Instruments"><textarea className={inputClass} rows={2} value={factoryInfo.equipmentInstruments || ''} onChange={e => updateSection('factoryInfo', { equipmentInstruments: e.target.value })} /></TableRow>
          <TableRow label="Inspection Environment"><textarea className={inputClass} rows={2} value={factoryInfo.inspectionEnvironment || ''} onChange={e => updateSection('factoryInfo', { inspectionEnvironment: e.target.value })} /></TableRow>
          <TableRow label="Working Time"><input className={inputClass} value={factoryInfo.workingTime || ''} onChange={e => updateSection('factoryInfo', { workingTime: e.target.value })} /></TableRow>
          <TableRow label="Transportation Route"><input className={inputClass} value={factoryInfo.transportationRoute || ''} onChange={e => updateSection('factoryInfo', { transportationRoute: e.target.value })} /></TableRow>
          <TableRow label="Accommodation Near Factory"><input className={inputClass} value={factoryInfo.accommodationNearFactory || ''} onChange={e => updateSection('factoryInfo', { accommodationNearFactory: e.target.value })} /></TableRow>
          <TableRow label="Notes on Factory Disagreements"><textarea className={inputClass} rows={2} value={factoryInfo.notesOnFactoryDisagreements || ''} onChange={e => updateSection('factoryInfo', { notesOnFactoryDisagreements: e.target.value })} /></TableRow>
          <TableRow label="Inspection Notes"><textarea className={inputClass} rows={2} value={factoryInfo.inspectionNotes || ''} onChange={e => updateSection('factoryInfo', { inspectionNotes: e.target.value })} /></TableRow>
        </div>
      </SectionCard>

      {/* SECTION 15: Recent Inspection Records */}
      <SectionCard title="SECTION 15: Recent Inspection Records">
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
          No recent inspection records available for this factory.
        </div>
      </SectionCard>

      {/* SECTION 16: Instructional Letters Reading Record */}
      <SectionCard title="SECTION 16: Instructional Letters Reading Record">
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
          No reading records logged yet.
        </div>
      </SectionCard>

    </div>
  );
}
