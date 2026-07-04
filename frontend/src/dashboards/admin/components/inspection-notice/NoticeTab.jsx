import React, { useEffect, useState } from 'react';
import SectionCard from './SectionCard';
import { Plus, X, ExternalLink, Calculator, Download, Upload } from 'lucide-react';
import { calculateAQL } from '../../../../utils/aqlCalculator';
import { ENDPOINTS } from '../../../../config/api';

// fetch() has no upload-progress API, so real percentages need XHR. Resolves
// with the parsed JSON body on 2xx, rejects with the server's error message
// otherwise. onProgress is called with 0-100 as bytes are sent.
const uploadFileWithProgress = (url, body, token, onProgress) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable && onProgress) {
      onProgress(Math.round((e.loaded / e.total) * 100));
    }
  };
  xhr.onload = () => {
    let data = {};
    try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }
    if (xhr.status >= 200 && xhr.status < 300) {
      resolve(data);
    } else {
      reject(new Error(data.error || `Upload failed (${xhr.status})`));
    }
  };
  xhr.onerror = () => reject(new Error('Network error while uploading the file.'));
  xhr.send(body);
});

// status is: null (idle) | number 0-99 (uploading) | 'processing' (upload done,
// server still working) | { error } (failed)
const isUploadInFlight = (status) => typeof status === 'number' || status === 'processing';
const uploadStatusLabel = (status, idleLabel) => {
  if (typeof status === 'number') return `Uploading… ${status}%`;
  if (status === 'processing') return 'Processing…';
  return idleLabel;
};

const UploadProgressBar = ({ percent }) => (
  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-[#6C47FF] transition-all duration-150 ease-out"
      style={{ width: `${Math.min(typeof percent === 'number' ? percent : 100, 100)}%` }}
    />
  </div>
);

const AttachmentBox = ({ title, files, type, onUpload, onDelete, onOpen, uploadStatus, disabled, inputId }) => (
  <div className="border border-slate-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
      <div>
        <input id={inputId} type="file" className="hidden" disabled={disabled || isUploadInFlight(uploadStatus)} onChange={e => onUpload(e, type)} />
        <label
          htmlFor={(disabled || isUploadInFlight(uploadStatus)) ? undefined : inputId}
          title={disabled ? 'Save as draft first' : undefined}
          className={`px-4 py-2 border rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
            (disabled || isUploadInFlight(uploadStatus)) ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#6C47FF] text-[#6C47FF] hover:bg-purple-50 cursor-pointer'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> {uploadStatusLabel(uploadStatus, 'Upload File')}
        </label>
      </div>
    </div>
    {isUploadInFlight(uploadStatus) && (
      <div className="mb-3"><UploadProgressBar percent={uploadStatus} /></div>
    )}
    {uploadStatus?.error && (
      <div className="mb-3 text-xs font-semibold text-rose-600">{uploadStatus.error}</div>
    )}
    {files.length === 0 ? (
      <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
        <p>No {title.toLowerCase()} uploaded.</p>
      </div>
    ) : (
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {files.map(f => (
          <div key={f._id} className="flex items-center justify-between px-3 py-2 text-sm gap-2">
            <button onClick={() => onOpen(f.url)} className="text-[#6C47FF] hover:underline truncate text-left">{f.fileName}</button>
            <span className="text-slate-400 text-xs shrink-0">{f.size}</span>
            <button onClick={() => onDelete(f._id, type)} className="text-rose-500 hover:bg-rose-50 p-1 rounded shrink-0"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Auto-fill defaults for Finished Products (%) / Packed (%) per Service Type.
// "Others" has no entry here on purpose — no automation, admin fills manually.
const SERVICE_TYPE_PRODUCT_STATUS_DEFAULTS = {
  'Pre-Shipment Inspection': { quantityFinished: 100, quantityPacked: 80 },
  'Container Loading Supervision': { quantityFinished: 100, quantityPacked: 100 },
  'During Production Inspection': { quantityFinished: 50, quantityPacked: 0 },
  'Factory Audit': { quantityFinished: 0, quantityPacked: 0 },
};

// Default On-Site Tests (Section 11) per Product Category. Extracted/adapted
// from real V-Trust inspection report samples for Household Appliances,
// Consumer Electronics, Furniture, Homeware/Kitchenware, Textline & Garments,
// Bag & Accessories, and Fabrics. Lighting, Building Materials, Automotive
// Parts, Footwear, and Industrial Products had no sample data available, so
// those use reasonable industry-standard defaults instead. "All Products We
// Inspect" is the catch-all for anything that doesn't fit a specific category
// (jewelry, toys, food, sporting goods, etc.) and uses a generic baseline set.
// "Others" has no entry — no automation, admin fills manually.
const onSiteTest = (description, method, criteria, sampleSize) => ({ include: true, description, method, criteria, sampleSize });

const ON_SITE_TESTS_BY_CATEGORY = {
  'Household Appliances': [
    onSiteTest('Function check', 'Use the real goods / actual usage to check the function', 'No malfunction', '80sets'),
    onSiteTest('Accessories check', 'Based on parts list on instruction sheet', 'No missing parts', '80sets'),
    onSiteTest('Compare with approval sample and technical files (spec)', 'Including material/color, accessories, hangtag/labels, packing, logo/markings', 'No different', '315sets'),
    onSiteTest('Wobble test', 'Place samples onto a flat surface', 'No wobble', '80sets'),
    onSiteTest('Stability test', 'Put unit onto a 10 degree incline and rotate 360° slowly (full fill and empty state)', 'No tip over', '2sets per item'),
    onSiteTest('Rub check', 'Rub for 15s by cloth with water', 'No marking/printing/paint fade or comes off', '3sets'),
    onSiteTest('Tape check', 'Use 3M tape to check', 'Marking clear after test, no peel off on plating', '3sets'),
    onSiteTest('Price label peel off test', 'Peel off the price label', 'Should be removed cleanly', '2sets'),
    onSiteTest('Magnetic check', 'By magnet (for stainless steel/magnetic parts)', 'No unexpected magnetism unless specified', '13sets'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) / 24inch(9.5-18.6kg) / 18inch(18.6-27.7kg) / 12inch(27.7-45.3kg) / 8inch(45.3-68kg) on the cement floor', 'No damage, no unit drop out', '1 carton'),
  ],
  'Consumer Electronics': [
    onSiteTest('Function check', 'Use the real goods to check the function', 'No malfunction', '80sets'),
    onSiteTest('Button check', 'Adjust the button, rotate the plug, play well', 'No defect', '80pcs'),
    onSiteTest('Bluetooth/wireless check', 'Check the transmit distance and sound quality during pairing', 'No noise, pairing name correct', '80pcs'),
    onSiteTest('Volume check', 'Check the max/min volume', 'No defect', '80pcs'),
    onSiteTest('Channel check', 'Check the left and right channel', 'No defect', '80pcs'),
    onSiteTest('Fatigue test', 'Cycle each button, plug and switch 20 times', 'No damage or block', '8pcs'),
    onSiteTest('Rub check', 'Rub the marking/rating label by hand for 15 seconds with cotton dripped with water', 'No peel off or lift', '2pcs per item'),
    onSiteTest('Tape check', 'Use 3M tape to test the marking/plating', 'No peel off on plating', '2pcs per item'),
    onSiteTest('Running test', 'Max setting, run for 4 hours', 'No malfunction or safety issue', '3pcs per item'),
    onSiteTest('Internal test', 'Open unit, check the workmanship of internal components', 'No damage to component', '3pcs'),
    onSiteTest('Impedance / frequency response / RMS power / sound level check', 'Use sound analyze system to measure', 'No failure, within spec', '3pcs per item'),
    onSiteTest('Battery capacity & charging/discharging test', 'Measure the full charge/discharge voltage and time', 'No failure', '3pcs per item'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No defect/odor', '80sets'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage, no unit drop out', '1 carton'),
  ],
  Lighting: [
    onSiteTest('Function check (light-up test)', 'Connect to rated power and switch on', 'Lights up correctly, no flicker', '80sets'),
    onSiteTest('Voltage / insulation resistance test', 'Test with appropriate meter per electrical safety standard', 'Within spec, no short circuit', '3sets'),
    onSiteTest('Thermal / burn-in test', 'Run continuously for a set duration at rated voltage', 'No overheating, no malfunction after test', '3sets'),
    onSiteTest('Accessories check', 'Based on parts list on instruction sheet', 'No missing parts', '80sets'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No burning or unusual odor', '80sets'),
    onSiteTest('Tape check', 'Use 3M tape on marking/label', 'No peel off', '2sets'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
  Furniture: [
    onSiteTest('Assembly check', 'Assemble the unit according to the description (ease for assembly)', 'Passed as per instructions', '5pcs'),
    onSiteTest('Humidity check', 'Insert hygrometer pins into wood at least 6mm deep', 'Within 7-14% (suitable for MDF)', '5pcs'),
    onSiteTest('Material check', 'Visual assessment for infestation, clean material free of defects', 'No infestation, clean material', '50pcs'),
    onSiteTest('Pull test for attached part', 'Apply 90N gradually within 5 seconds, maintain 10 seconds', 'No breakage or detachment', '2pcs'),
    onSiteTest('Wobble test', 'Place unit onto a flat surface', 'No wobble', '5pcs'),
    onSiteTest('Fatigue test', 'For all adjustable parts if applicable, cycle 20 times', 'No poor function', '5pcs'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
  'Homeware/Kitchenware': [
    onSiteTest('Sample comparison check', "Check with client's approved sample, including unit packing, color, specification, weight, smell, content, visual/humidity", 'No different', '3 per item'),
    onSiteTest('Function test', 'Use the real goods / simulate actual usage to check the function', 'No malfunction', '80sets'),
    onSiteTest('Drop test', 'One corner, edges/faces per instruction, at appropriate height', 'No damage after drop', '1 carton'),
    onSiteTest('Strength / hardness check', 'Pull by hand with normal force / hardness tester', 'Within spec', '3sets'),
    onSiteTest('Fitting check', 'Check components fit together correctly', 'Good fitting', '80sets'),
    onSiteTest('Thermal shock test', 'Fill unit with 85°C water for 3 minutes', 'No defect or loss of serviceability', '3sets'),
    onSiteTest('Water leakage test', 'Fill the product with water, place onto paper to check for 15 minutes', 'No leakage at all', '80sets'),
    onSiteTest('Capacity check', 'Fill water to the max level marking / by weighing method', 'Within spec', '3sets'),
    onSiteTest('Wobble / stability test', 'Place onto flat surface, or 10 degree incline rotate 360°', 'No wobble, no tip over', '80sets'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No unpleasant odor', '80sets'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
  'Building Materials': [
    onSiteTest('Dimension / size check', 'Use ruler/calipers to measure against spec', 'Within tolerance', '3pcs per item'),
    onSiteTest('Compression / load test', 'Apply rated load per relevant standard', 'No structural failure', '3pcs'),
    onSiteTest('Water absorption test', 'Submerge sample per standard duration', 'Within spec absorption rate', '3pcs'),
    onSiteTest('Compare with approval sample / spec', 'Including material, color, finish', 'No different', '10pcs'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No unusual odor', '10pcs'),
    onSiteTest('Carton/packaging drop test', 'One corner, three edges, six sides, at appropriate height', 'No damage', '1 carton'),
  ],
  'Automotive Parts': [
    onSiteTest('Function / fitting check', 'Fit for actual performance / test-fit on relevant assembly', 'No malfunction, correct fit', '5pcs'),
    onSiteTest('Dimension check', 'Use calipers/gauges to measure against spec', 'Within tolerance', '5pcs'),
    onSiteTest('Material hardness test', 'Hardness tester', 'Within spec', '3pcs'),
    onSiteTest('Load / stress test', 'Apply rated load per client spec', 'No deformation or failure', '3pcs'),
    onSiteTest('Corrosion / rust check', 'Visual inspection, salt-spray if applicable', 'No corrosion beyond spec', '5pcs'),
    onSiteTest('Compare with approval sample', 'Including material/color/finish', 'No different', '10pcs'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at appropriate height', 'No damage', '1 carton'),
  ],
  'Textline & Garments': [
    onSiteTest('Needle detecting check', 'Check appliance sensitivity with φ1.2mm ferrous ball, pass all samples through the needle detector', 'All samples pass', '200pcs'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No unpleasant odor', '200pcs'),
    onSiteTest('Color shading check', 'Compare color shading between units and within one unit', 'Within acceptable grey scale', '200pcs'),
    onSiteTest('Rub check (dry/wet)', 'Rub required position by hand for 15 seconds with white cotton fabric, dry and water-dripped', 'No fading, no color transfer', '2pcs per item'),
    onSiteTest('Seaming strength test', 'Pull the seaming by hand with normal force', 'No breakage or seam slippage', '200pcs'),
    onSiteTest('Zipper check', 'Check lateral strength, puller attachment, top/bottom stop function, lock function', 'Normal function, no breakage', '315pcs'),
    onSiteTest('Fatigue test for zipper/buttons/Velcro', 'Normal use/open and close 20 times', 'No breakage, detachment or damage', '3pcs per item'),
    onSiteTest('Pull test for button/snap', '15lbs, 10 seconds', 'Should not break or detach', '3pcs'),
    onSiteTest('Density of stitches check', 'By ruler, count stitches per inch/cm', "As client's requirement", '2pcs per item'),
    onSiteTest('Elastic check', 'Stretch elastic part with normal strength', 'Recovers normally, stitches not broken', '2pcs per style'),
    onSiteTest('Fitting check on model/doll', 'Wear the unit on model or doll, verify comfort level and adhered force of accessories', 'Passed', '2pcs per style'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
  'Bag & Accessories': [
    onSiteTest('Compare with approval sample and technical files (spec)', 'Including material/color of fabric, hangtag/labels, packing, logo/markings', 'No different', '315pcs'),
    onSiteTest('Seaming strength test', 'Pull the seaming by hand with normal force', 'No breakage when pulled', '315pcs'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No odor', '315pcs'),
    onSiteTest('Rub check (dry/wet)', 'Rub required position by hand for 15 seconds with white cotton fabric', 'No fading, no color transfer', '2pcs per item'),
    onSiteTest('Density of stitches check', 'By ruler, note stitches per inch/cm', "As client's requirement", '2pcs per item'),
    onSiteTest('Static handle strength test', 'Put 6.5kgs loading weight inside the product evenly, hold for at least 30 mins', 'No detachment, tear or seam/structure defect', '5pcs per item'),
    onSiteTest('Dynamic handle strength test', 'Put 5kgs loading weight inside the product, lift and swing at 60 degrees for 20 times', 'No detachment, tear or seam/structure defect', '5pcs per item'),
    onSiteTest('Carton assortment check', "Actual packaging quantity/assortment must conform to printed information / client's requirement / packing list", 'No difference against requirement', '10 cartons'),
    onSiteTest('Loading test', "As per client's spec, place load for 1 hour", 'No damage or failure', '2pcs'),
    onSiteTest('Barcode readability check', 'Scan by barcode scanner, compare against printed number', 'Reads correctly, matches requirement', '5pcs'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
  Footwear: [
    onSiteTest('Flex test', 'Repeatedly flex the sole per relevant standard cycle count', 'No cracking or separation', '3 pairs'),
    onSiteTest('Sole adhesion / peel test', 'Peel test between sole and upper', 'Within required adhesion strength', '3 pairs'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No unpleasant odor', '200pcs'),
    onSiteTest('Color shading check', 'Compare color shading between units and within one unit', 'Within acceptable grey scale', '200pcs'),
    onSiteTest('Rub check (dry/wet)', 'Rub required position by hand for 15 seconds with white cotton fabric', 'No fading, no color transfer', '2pcs per item'),
    onSiteTest('Fitting check', 'Wear/fit-test on last or model', 'Comfortable fit, no defect', '2 pairs per style'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
  Fabrics: [
    onSiteTest('Smelling check', 'Smell by nose within 10cm', 'No unpleasant odor', '1 pc per item'),
    onSiteTest('Fabric weight (gsm) check', 'Weigh a cut swatch per square meter, average across positions', "Within client's tolerance (typically +/-5%)", '1pc per item'),
    onSiteTest('Compare with approval sample / technology (spec)', 'Check color, hand feel, construction etc', 'No different', '1 roll/piece per item'),
    onSiteTest('Color shading check', 'Compare color shading between units and within one unit', 'Within acceptable grey scale', '200pcs'),
    onSiteTest('Rub check (dry/wet)', 'Rub required position by hand for 15 seconds with white cotton fabric', 'No fading, no color transfer', '2pcs per item'),
  ],
  'Industrial Products': [
    onSiteTest('Function check', 'Use the real goods / simulate actual usage to check the function', 'No malfunction', '80sets'),
    onSiteTest('Dimension / size check', 'Use ruler/calipers to measure against spec', 'Within tolerance', '5pcs'),
    onSiteTest('Material / hardness check', 'Hardness tester or visual material assessment', 'Within spec', '3pcs'),
    onSiteTest('Load test', 'Apply rated load per client spec', 'No deformation or failure', '3pcs'),
    onSiteTest('Compare with approval sample / spec', 'Including material/color/finish', 'No different', '10pcs'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at appropriate height', 'No damage', '1 carton'),
  ],
  'All Products We Inspect': [
    onSiteTest('Compare with approval sample (spec)', 'Including material/color, accessories, hangtag/labels, packing, logo/markings', 'No different', '315pcs'),
    onSiteTest('Accessories check', 'Based on parts list on instruction sheet', 'No missing parts', '80sets'),
    onSiteTest('Smell check', 'Smell by nose within 10cm', 'No unpleasant odor', '80sets'),
    onSiteTest('Color comparison check', "Check with client's spec or Pantone", 'No different', '5pcs'),
    onSiteTest('Carton drop test', 'One corner, three edges, six sides, at height of 30inch(<9.5kg) on the cement floor', 'No damage', '1 carton'),
  ],
};

// Default Defect Classification List (Section 12) per Product Category.
// Extracted/adapted from the "Workmanship Defectives" tables of real V-Trust
// inspection reports for Homeware/Kitchenware, Furniture, Textline & Garments,
// Bag & Accessories, and Fabrics. The other categories (Household Appliances,
// Consumer Electronics, Lighting, Building Materials, Automotive Parts,
// Footwear, Industrial Products) had no sample data available, so those use
// reasonable industry-standard defaults instead. "All Products We Inspect" is
// the catch-all (jewelry, plush toys, sporting goods, food, misc hardware,
// etc. from the samples) and uses a generic baseline set. "Others" has no
// entry — no automation, admin fills manually.
const defect = (description, critical, major, minor, photoRequired = true) => ({ description, critical, major, minor, photoRequired });

const DEFECT_CLASSIFICATIONS_BY_CATEGORY = {
  'Household Appliances': [
    defect('Exposed live electrical parts / wiring', true, false, false),
    defect('Sharp edges or points', true, false, false),
    defect('Broken or cracked housing', false, true, false),
    defect('Poor plating / electroplating peel off', false, true, false),
    defect('Loose or missing accessory/part', false, true, false),
    defect('Poor assembly / component not fitted correctly', false, true, false),
    defect('Unusual noise or vibration during operation', false, true, false),
    defect('Scratch on surface', false, false, true),
    defect('Dent on surface', false, false, true),
    defect('Stain / dirt mark on unit', false, false, true),
    defect('Poor label / marking print quality', false, false, true),
  ],
  'Consumer Electronics': [
    defect('Malfunction / does not power on', true, false, false),
    defect('Battery swelling or leakage', true, false, false),
    defect('Deformed part', false, true, false),
    defect('Rust / corrosion point', false, true, false),
    defect('Loose or broken button/switch', false, true, false),
    defect('Screen/display defect (dead pixel, discoloration)', false, true, false),
    defect('Scratch on surface', false, false, true),
    defect('Dent on unit surface', false, false, true),
    defect('Stain mark', false, false, true),
    defect('Poor label / marking print quality', false, false, true),
  ],
  Lighting: [
    defect('Exposed live wiring', true, false, false),
    defect('Cracked housing / lens', false, true, false),
    defect('Flicker or malfunction', false, true, false),
    defect('Poor solder joint', false, true, false),
    defect('Incorrect color temperature / brightness vs spec', false, true, false),
    defect('Loose or missing screw/fitting', false, true, false),
    defect('Scratch / dent on surface', false, false, true),
    defect('Yellowing or discoloration of housing', false, false, true),
    defect('Poor label / marking print quality', false, false, true),
  ],
  Furniture: [
    defect('Crack mark (structural)', false, true, false),
    defect('Poor assembly / loose joint or fitting', false, true, false),
    defect('Slight dent on wooden part', false, false, true),
    defect('Slight nick or scratch on wooden part', false, false, true),
    defect('Rough surface on wooden part', false, false, true),
    defect('Obvious dirt on edge/surface', false, false, true),
  ],
  'Homeware/Kitchenware': [
    defect('Crack mark on unit', false, true, false),
    defect('Impurity in material', false, true, false),
    defect('Air bubble in unit', false, true, false),
    defect('Deformed handle or part', false, true, false),
    defect('Poor assembly / part comes loose', false, true, false),
    defect('Poor molding / molding mark', false, false, true),
    defect('Chip mark or dent mark', false, false, true),
    defect('Poor polishing on wooden handle', false, false, true),
    defect('Scratch mark', false, false, true),
    defect('Stain / dirt mark on surface', false, false, true),
  ],
  'Building Materials': [
    defect('Crack (structural)', true, false, false),
    defect('Warping / deformation', false, true, false),
    defect('Dimensional deviation beyond tolerance', false, true, false),
    defect('Poor bonding / adhesion between layers', false, true, false),
    defect('Foreign matter embedded in material', false, true, false),
    defect('Surface scratch or chip', false, false, true),
    defect('Uneven surface / texture', false, false, true),
    defect('Discoloration / stain', false, false, true),
    defect('Incorrect labeling / marking', false, false, true),
  ],
  'Automotive Parts': [
    defect('Crack / structural defect', true, false, false),
    defect('Poor weld or joint quality', true, false, false),
    defect('Rust / corrosion', false, true, false),
    defect('Poor fitting / misalignment', false, true, false),
    defect('Thread damage on fasteners', false, true, false),
    defect('Missing or incorrect part marking/number', false, true, false),
    defect('Scratch or dent', false, false, true),
    defect('Poor plating', false, false, true),
    defect('Contamination (oil, grease, debris)', false, false, true),
  ],
  'Textline & Garments': [
    defect('Needle or pin left in garment', true, false, false),
    defect('Broken stitch / open seam', false, true, false),
    defect('Crooked hem / uneven stitching', false, true, false),
    defect('Deformation at hem or seam', false, true, false),
    defect('Color shading / dye difference', false, true, false),
    defect('Asymmetric stripes or pattern', false, true, false),
    defect('Stain on fabric', false, true, false),
    defect('Untrimmed thread end', false, false, true),
    defect('Loose or uncut thread', false, false, true),
    defect('Label off-center or missing', false, false, true),
  ],
  'Bag & Accessories': [
    defect('Open seam', false, true, false),
    defect('Sewing line too tight', false, true, false),
    defect('Torn fabric', false, true, false),
    defect('Poor dye effect on surface', false, true, false),
    defect('Buckle / hardware defect (loose or broken)', false, true, false),
    defect('Wheel / screw not secure or hole not through', false, true, false),
    defect('Crooked or twisted hem', false, false, true),
    defect('Dirt mark on surface', false, false, true),
    defect('Untrimmed thread end', false, false, true),
    defect('Rust mark on hardware', false, false, true),
    defect('Scratch mark on logo/printing', false, false, true),
  ],
  Footwear: [
    defect('Sole separation / open seam', true, false, false),
    defect('Poor stitching', false, true, false),
    defect('Poor gluing / open sole edge', false, true, false),
    defect('Color shading mismatch', false, true, false),
    defect('Uneven sole thickness', false, true, false),
    defect('Scuff or scratch on surface', false, false, true),
    defect('Loose eyelet or lace hardware', false, false, true),
    defect('Odor (chemical / unpleasant smell)', false, false, true),
    defect('Size label incorrect or missing', false, false, true),
  ],
  Fabrics: [
    defect('Broken or floating yarn', false, true, false),
    defect('Slub / thick yarn', false, true, false),
    defect('Barre / uneven dyeing', false, true, false),
    defect('Coarse yarn', false, false, true),
    defect('Oil or dirty mark', false, false, true),
    defect('Yarn knot', false, false, true),
    defect('Untrimmed yarn end', false, false, true),
    defect('Missing or torn fabric label', false, false, true),
  ],
  'Industrial Products': [
    defect('Crack / structural failure', true, false, false),
    defect('Sharp edges or burrs', true, false, false),
    defect('Poor weld / joint quality', true, false, false),
    defect('Dimensional deviation', false, true, false),
    defect('Poor assembly / loose fitting', false, true, false),
    defect('Rust / corrosion', false, true, false),
    defect('Surface scratch or dent', false, false, true),
    defect('Contamination or foreign matter', false, false, true),
    defect('Missing or incorrect labeling/marking', false, false, true),
  ],
  'All Products We Inspect': [
    defect('Crack (structural)', true, false, false),
    defect('Poor stitching / embroidery', false, true, false),
    defect('Chip mark', false, true, false),
    defect('Loose or broken part', false, true, false),
    defect('Scratch mark', false, false, true),
    defect('Dent mark', false, false, true),
    defect('Dirty / stain mark', false, false, true),
    defect('Poor polishing / plating', false, false, true),
  ],
};

const openFactoryAddressOnMap = (address) => {
  if (!address) return;
  navigator.clipboard?.writeText(address).catch(() => {});
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

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

export default function NoticeTab({ formData, updateSection, updateRootField, inspectorOptions = [], token, recordId }) {
  const basicInfo = formData.basicInfo || {};
  const attachments = formData.attachments || { clientFiles: [], supplierFiles: [] };
  const teamAssignment = formData.teamAssignment || { cs: {}, cse: {}, previewManager: {}, scheduler: {}, inspectors: [] };
  const productInfo = formData.productInfo || { products: [] };
  const aql = formData.aql || { inspectionStandard: {}, acceptedQuantity: {} };
  const inspectionReqs = formData.inspectionRequirements || {};
  const specialReqs = formData.specialClientRequirements || {};
  const customerSamples = formData.customerSamples || { samples: [] };
  const inspectionInfo = formData.inspectionInfo || { generalWorkInstructions: [], operationalWorkInstructions: [] };
  const toolsInfo = formData.inspectionTools || { tools: [], equipment: [], trainingMaterials: [] };
  const onSiteTests = Array.isArray(formData.onSiteTests) ? formData.onSiteTests : [];
  const defects = Array.isArray(formData.defectClassifications) ? formData.defectClassifications : [];
  const supplierInfo = formData.supplierInfo || { statusEntries: [] };
  const factoryInfo = formData.factoryInfo || { abnormalStatusEntries: [] };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  // Auto-calculate Total Quantity whenever products array changes
  useEffect(() => {
    const sum = (formData.productInfo?.products || []).reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    if (sum > 0 && formData.productInfo?.totalQuantity !== sum) {
      updateSection('productInfo', { totalQuantity: sum });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productInfo?.products, formData.productInfo?.totalQuantity]);

  // Order No. is shared across the whole product table — whatever is typed in
  // the first row is mirrored onto every other row (including newly-added ones,
  // whether via "+ Add Product" or the extracted-upload flow).
  useEffect(() => {
    const products = formData.productInfo?.products || [];
    if (products.length < 2) return;
    const canonicalOrderNo = products[0]?.orderNo || '';
    const needsSync = products.some((p, i) => i > 0 && (p.orderNo || '') !== canonicalOrderNo);
    if (needsSync) {
      updateSection('productInfo', {
        products: products.map((p, i) => i === 0 ? p : { ...p, orderNo: canonicalOrderNo }),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productInfo?.products]);

  // Working Time is automated, not manually picked — default to the standard
  // 09:00-18:00 shift whenever either side is blank (covers brand-new notices
  // and any existing notice saved before this field existed). Still editable
  // for the rare factory with different hours.
  useEffect(() => {
    if (factoryInfo.workingTimeStart && factoryInfo.workingTimeEnd) return;
    updateSection('factoryInfo', {
      workingTimeStart: factoryInfo.workingTimeStart || '09:00',
      workingTimeEnd: factoryInfo.workingTimeEnd || '18:00',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryInfo.workingTimeStart, factoryInfo.workingTimeEnd]);

  // Auto-fill Finished Products (%) / Packed (%) based on the selected Service
  // Type. "Others" has no preset — those fields stay whatever was typed manually.
  useEffect(() => {
    const preset = SERVICE_TYPE_PRODUCT_STATUS_DEFAULTS[basicInfo.serviceType];
    if (!preset) return;
    updateSection('productInfo', { quantityFinished: preset.quantityFinished, quantityPacked: preset.quantityPacked });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicInfo.serviceType]);

  // Auto-fill Section 11 (On-Site Tests) based on the selected Product
  // Category — replaces whatever is there whenever the category changes.
  // "Others" has no preset — the table stays whatever was typed manually.
  useEffect(() => {
    const preset = ON_SITE_TESTS_BY_CATEGORY[basicInfo.productCategory];
    if (!preset) return;
    updateRootField('onSiteTests', preset.map(t => ({ ...t })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicInfo.productCategory]);

  // Auto-fill Section 12 (Defect Classification List) based on the selected
  // Product Category — replaces whatever is there whenever the category
  // changes. "Others" has no preset — the table stays whatever was typed manually.
  useEffect(() => {
    const preset = DEFECT_CLASSIFICATIONS_BY_CATEGORY[basicInfo.productCategory];
    if (!preset) return;
    updateRootField('defectClassifications', preset.map(d => ({ ...d })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicInfo.productCategory]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productInfo?.totalQuantity, aql.samplingLevel, aql.inspectionStandard?.critical, aql.inspectionStandard?.major, aql.inspectionStandard?.minor]);

  // Recent Inspection Records: derived, read-only, fetched fresh whenever the factory name settles
  const [recentFactoryRecords, setRecentFactoryRecords] = useState([]);
  // Rows toggled into "type a name manually" mode — for third-party inspectors
  // who aren't registered platform users and won't appear in the dropdown.
  const [manualInspectorRows, setManualInspectorRows] = useState(() => new Set());
  // null (idle) | number 0-99 (uploading %) | 'processing' (upload done,
  // server still parsing) | { error } (failed)
  const [productExtractStatus, setProductExtractStatus] = useState(null);
  // Same idea, for the Customer Samples upload
  const [sampleExtractStatus, setSampleExtractStatus] = useState(null);
  // Per-field status for the Section 8 document-link uploads (Online WI, Online
  // Customer Claim Form, Report Template): { [field]: number | 'processing' | { error } | undefined }
  const [documentLinkStatus, setDocumentLinkStatus] = useState({});
  // Same shape, keyed by 'client'/'supplier', for the Section 9 attachment uploads
  const [attachmentUploadStatus, setAttachmentUploadStatus] = useState({});
  useEffect(() => {
    if (!recordId || !factoryInfo.factoryName) {
      setRecentFactoryRecords([]);
      return;
    }
    fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/recent-by-factory`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRecentFactoryRecords(data.records || []))
      .catch(() => setRecentFactoryRecords([]));
  }, [recordId, factoryInfo.factoryName, token]);

  // Helpers to safely update arrays.
  // When arrayName is empty, the target is a root-level array (e.g. onSiteTests),
  // so we use updateRootField instead of updateSection to avoid corrupting the array.
  const addArrayItem = (section, arrayName, newItem) => {
    if (!arrayName) {
      const cur = Array.isArray(formData[section]) ? formData[section] : [];
      updateRootField(section, [...cur, newItem]);
    } else {
      const currentArray = formData[section]?.[arrayName] || [];
      updateSection(section, { [arrayName]: [...currentArray, newItem] });
    }
  };
  const removeArrayItem = (section, arrayName, index) => {
    if (!arrayName) {
      const cur = Array.isArray(formData[section]) ? formData[section] : [];
      updateRootField(section, cur.filter((_, i) => i !== index));
    } else {
      const currentArray = formData[section]?.[arrayName] || [];
      updateSection(section, { [arrayName]: currentArray.filter((_, i) => i !== index) });
    }
  };
  const updateArrayItem = (section, arrayName, index, field, value) => {
    if (!arrayName) {
      const cur = [...(Array.isArray(formData[section]) ? formData[section] : [])];
      cur[index] = { ...cur[index], [field]: value };
      updateRootField(section, cur);
    } else {
      const currentArray = [...(formData[section]?.[arrayName] || [])];
      currentArray[index] = { ...currentArray[index], [field]: value };
      updateSection(section, { [arrayName]: currentArray });
    }
  };

  const handleProductSheetUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file later
    if (!file) return;

    setProductExtractStatus(0);
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await uploadFileWithProgress(
        `${ENDPOINTS.BASE_URL}/api/inspection-notices/extract-products`,
        body, token,
        pct => setProductExtractStatus(pct < 100 ? pct : 'processing')
      );
      const existing = formData.productInfo?.products || [];
      updateSection('productInfo', { products: [...existing, ...data.products] });
      setProductExtractStatus(null);
    } catch (err) {
      setProductExtractStatus({ error: err.message || 'Failed to extract products from this file.' });
    }
  };

  const handleSampleSheetUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file later
    if (!file) return;

    setSampleExtractStatus(0);
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await uploadFileWithProgress(
        `${ENDPOINTS.BASE_URL}/api/inspection-notices/extract-samples`,
        body, token,
        pct => setSampleExtractStatus(pct < 100 ? pct : 'processing')
      );
      const existing = formData.customerSamples?.samples || [];
      updateSection('customerSamples', { samples: [...existing, ...data.samples] });
      setSampleExtractStatus(null);
    } catch (err) {
      setSampleExtractStatus({ error: err.message || 'Failed to extract samples from this file.' });
    }
  };

  // Uploads a file for a Section 8 document-link field (Online WI / Online
  // Customer Claim Form) and stores the resulting URL in that field.
  const handleDocumentLinkUpload = async (field, e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file later
    if (!file) return;

    setDocumentLinkStatus(prev => ({ ...prev, [field]: 0 }));
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await uploadFileWithProgress(
        `${ENDPOINTS.BASE_URL}/api/inspection-notices/upload-document`,
        body, token,
        pct => setDocumentLinkStatus(prev => ({ ...prev, [field]: pct < 100 ? pct : 'processing' }))
      );
      updateSection('inspectionInfo', { [field]: { fileName: data.fileName, url: data.url } });
      setDocumentLinkStatus(prev => ({ ...prev, [field]: undefined }));
    } catch (err) {
      setDocumentLinkStatus(prev => ({ ...prev, [field]: { error: err.message || 'Failed to upload the file.' } }));
    }
  };

  // Report Template supports multiple files (one per service type) — each
  // upload is appended to the list rather than replacing a single value.
  const handleReportTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file later
    if (!file) return;

    setDocumentLinkStatus(prev => ({ ...prev, reportTemplate: 0 }));
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await uploadFileWithProgress(
        `${ENDPOINTS.BASE_URL}/api/inspection-notices/upload-document`,
        body, token,
        pct => setDocumentLinkStatus(prev => ({ ...prev, reportTemplate: pct < 100 ? pct : 'processing' }))
      );
      const existing = formData.inspectionInfo?.reportTemplate || [];
      updateSection('inspectionInfo', {
        reportTemplate: [...existing, { fileName: data.fileName, url: data.url, uploadDate: new Date().toISOString() }],
      });
      setDocumentLinkStatus(prev => ({ ...prev, reportTemplate: undefined }));
    } catch (err) {
      setDocumentLinkStatus(prev => ({ ...prev, reportTemplate: { error: err.message || 'Failed to upload the file.' } }));
    }
  };

  const removeReportTemplate = (idx) => {
    const existing = formData.inspectionInfo?.reportTemplate || [];
    updateSection('inspectionInfo', { reportTemplate: existing.filter((_, i) => i !== idx) });
  };

  const removeDocumentLink = (field) => {
    updateSection('inspectionInfo', { [field]: null });
  };

  const openDocumentLink = async (url) => {
    if (!url) return;
    // Open the tab synchronously (within the click gesture) so browsers don't
    // block it as a popup, then point it at the freshly-signed URL once ready.
    // NOTE: no noopener/noreferrer here — those make window.open() return null,
    // which is exactly why this needs a live reference to set .location later.
    const tab = window.open('', '_blank');
    try {
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/resolve-document-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.signedUrl) {
        if (tab) tab.close();
        alert(data.error || 'Failed to open this document.');
        return;
      }
      if (tab) tab.location.href = data.signedUrl;
    } catch {
      if (tab) tab.close();
      alert('Network error while opening this document.');
    }
  };

  const handleAttachmentUpload = async (e, type) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !recordId) return;
    const body = new FormData();
    body.append('file', file);
    body.append('type', type);

    setAttachmentUploadStatus(prev => ({ ...prev, [type]: 0 }));
    try {
      const data = await uploadFileWithProgress(
        `${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/attachments`,
        body, token,
        pct => setAttachmentUploadStatus(prev => ({ ...prev, [type]: pct < 100 ? pct : 'processing' }))
      );
      updateSection('attachments', data.notice.attachments);
      setAttachmentUploadStatus(prev => ({ ...prev, [type]: undefined }));
    } catch (err) {
      setAttachmentUploadStatus(prev => ({ ...prev, [type]: { error: err.message || 'Failed to upload the file.' } }));
    }
  };

  const handleAttachmentDelete = async (fileId, type) => {
    if (!recordId) return;
    try {
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/attachments/${fileId}?type=${type}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        updateSection('attachments', data.notice.attachments);
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const downloadOnSiteTestsCSV = () => {
    const header = ['Description', 'Method', 'Criteria', 'Sample Size', 'Include'];
    const rows = onSiteTests.map(t => [t.description || '', t.method || '', t.criteria || '', t.sampleSize || '', t.include ? 'Yes' : 'No']);
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `on-site-tests-${formData.noticeId || 'notice'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Basic Information */}
      <SectionCard title="SECTION 1: Basic Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Inspection No.">
            <input
              className={inputClass}
              value={formData.noticeId || ''}
              onChange={e => updateRootField('noticeId', e.target.value)}
            />
          </TableRow>
          <TableRow label="Customer Name">
            <input className={inputClass} value={basicInfo.customerName || ''} onChange={e => updateSection('basicInfo', { customerName: e.target.value })} />
          </TableRow>
          <TableRow label="Service Type">
            <div className="flex flex-col gap-2">
              <select
                className={inputClass}
                value={basicInfo.serviceType || ''}
                onChange={e => updateSection('basicInfo', { serviceType: e.target.value })}
              >
                <option value="Pre-Shipment Inspection">Pre-Shipment Inspection</option>
                <option value="Container Loading Supervision">Container Loading Supervision</option>
                <option value="Factory Audit">Factory Audit</option>
                <option value="During Production Inspection">During Production Inspection</option>
                <option value="Others">Others</option>
              </select>
              {basicInfo.serviceType === 'Others' && (
                <input
                  className={inputClass}
                  value={basicInfo.serviceTypeOther || ''}
                  onChange={e => updateSection('basicInfo', { serviceTypeOther: e.target.value })}
                  placeholder="Please specify the service type"
                />
              )}
            </div>
          </TableRow>
          <TableRow label="Product Category">
            <div className="flex flex-col gap-2">
              <select
                className={inputClass}
                value={basicInfo.productCategory || ''}
                onChange={e => updateSection('basicInfo', { productCategory: e.target.value })}
              >
                <option value="">Select a category</option>
                <optgroup label="Electrical & Electronic Products">
                  <option value="Household Appliances">Household Appliances</option>
                  <option value="Consumer Electronics">Consumer Electronics</option>
                  <option value="Lighting">Lighting</option>
                </optgroup>
                <optgroup label="Hardline Products">
                  <option value="Furniture">Furniture</option>
                  <option value="Homeware/Kitchenware">Homeware/Kitchenware</option>
                  <option value="Building Materials">Building Materials</option>
                  <option value="Automotive Parts">Automotive Parts</option>
                </optgroup>
                <optgroup label="Softline Products">
                  <option value="Textline & Garments">Textline & Garments</option>
                  <option value="Bag & Accessories">Bag & Accessories</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Fabrics">Fabrics</option>
                </optgroup>
                <option value="Industrial Products">Industrial Products</option>
                <option value="All Products We Inspect">All Products We Inspect</option>
                <option value="Others">Others</option>
              </select>
              {basicInfo.productCategory === 'Others' && (
                <input
                  className={inputClass}
                  value={basicInfo.productCategoryOther || ''}
                  onChange={e => updateSection('basicInfo', { productCategoryOther: e.target.value })}
                  placeholder="Please specify the product category"
                />
              )}
            </div>
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
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={basicInfo.offlineReport} onChange={e => updateSection('basicInfo', { offlineReport: e.target.checked })} className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4" />
                Offline Report
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
                  <td className="px-4 py-3">
                    <input
                      className={inputClass}
                      value={teamAssignment[roleKey]?.name || ''}
                      onChange={e => updateSection('teamAssignment', {
                        [roleKey]: { ...teamAssignment[roleKey], name: e.target.value },
                        // Scheduler is automated from CS — keep it mirrored live
                        ...(roleKey === 'cs' ? { scheduler: { ...teamAssignment.scheduler, name: e.target.value } } : {}),
                      })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className={inputClass}
                      value={teamAssignment[roleKey]?.phone || ''}
                      onChange={e => updateSection('teamAssignment', {
                        [roleKey]: { ...teamAssignment[roleKey], phone: e.target.value },
                        ...(roleKey === 'cs' ? { scheduler: { ...teamAssignment.scheduler, phone: e.target.value } } : {}),
                      })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className={inputClass}
                      value={teamAssignment[roleKey]?.mobile || ''}
                      onChange={e => updateSection('teamAssignment', {
                        [roleKey]: { ...teamAssignment[roleKey], mobile: e.target.value },
                        ...(roleKey === 'cs' ? { scheduler: { ...teamAssignment.scheduler, mobile: e.target.value } } : {}),
                      })}
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-[#F0EBFF]">
                <td className="px-4 py-3 font-bold text-slate-700 uppercase">Scheduler</td>
                <td className="px-4 py-3"><input className={`${inputClass} bg-slate-100 cursor-not-allowed`} value={teamAssignment.scheduler?.name || ''} readOnly title="Automated from CS" /></td>
                <td className="px-4 py-3"><input className={`${inputClass} bg-slate-100 cursor-not-allowed`} value={teamAssignment.scheduler?.phone || ''} readOnly title="Automated from CS" /></td>
                <td className="px-4 py-3"><input className={`${inputClass} bg-slate-100 cursor-not-allowed`} value={teamAssignment.scheduler?.mobile || ''} readOnly title="Automated from CS" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Inspector(s)</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm table-fixed">
              <colgroup>
                <col className="w-[19%]" />
                <col className="w-[17%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Date From</th>
                  <th className="px-4 py-2">Date To</th>
                  <th className="px-4 py-2">Mobile</th>
                  <th className="px-4 py-2">Man-Days</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamAssignment.inspectors.map((ins, idx) => {
                  const isManual = manualInspectorRows.has(idx);
                  const toggleManual = () => setManualInspectorRows(prev => {
                    const next = new Set(prev);
                    if (next.has(idx)) next.delete(idx); else next.add(idx);
                    return next;
                  });
                  return (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      {inspectorOptions.length > 0 && !isManual ? (
                        <>
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
                          <button type="button" onClick={toggleManual} className="mt-1 block w-full text-left text-[11px] font-semibold text-[#6C47FF] hover:underline whitespace-normal">
                            + Third-party (enter manually)
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            className={inputClass}
                            placeholder="Third-party inspector name"
                            autoComplete="off"
                            value={ins.name || ''}
                            onChange={e => {
                              const currentArray = [...(formData.teamAssignment?.inspectors || [])];
                              currentArray[idx] = { ...currentArray[idx], inspectorId: '', name: e.target.value };
                              updateSection('teamAssignment', { inspectors: currentArray });
                            }}
                          />
                          {inspectorOptions.length > 0 && (
                            <button type="button" onClick={toggleManual} className="mt-1 block w-full text-left text-[11px] font-semibold text-[#6C47FF] hover:underline whitespace-normal">
                              Choose from list instead
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="email"
                        className={inputClass}
                        placeholder="name@example.com"
                        autoComplete="off"
                        value={ins.email || ''}
                        onChange={e => updateArrayItem('teamAssignment', 'inspectors', idx, 'email', e.target.value)}
                      />
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
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={() => addArrayItem('teamAssignment', 'inspectors', {
                name: '', email: '',
                dateFrom: basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : '',
                dateTo: basicInfo.inspectionDateTo ? basicInfo.inspectionDateTo.split('T')[0] : '',
                mobile: '', manDays: 1, role: 'Member'
              })}
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
                    <td className="px-4 py-3">
                      {idx === 0 ? (
                        <input
                          className={inputClass}
                          value={p.orderNo || ''}
                          onChange={e => updateArrayItem('productInfo', 'products', idx, 'orderNo', e.target.value)}
                        />
                      ) : (
                        <input
                          className={`${inputClass} bg-slate-100 cursor-not-allowed`}
                          value={p.orderNo || ''}
                          readOnly
                          title="Set from the first row — same Order No. applies to every product"
                        />
                      )}
                    </td>
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
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => addArrayItem('productInfo', 'products', { orderNo: '', productName: '', itemNo: '', quantity: 0, unit: 'pcs' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>

            <label className={`px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isUploadInFlight(productExtractStatus) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'text-[#6C47FF] hover:bg-purple-50'
            }`}>
              <Upload className="w-4 h-4" />
              {uploadStatusLabel(productExtractStatus, 'Upload Product Sheet')}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploadInFlight(productExtractStatus)}
                onChange={handleProductSheetUpload}
              />
            </label>

            {isUploadInFlight(productExtractStatus) && (
              <div className="w-full basis-full"><UploadProgressBar percent={productExtractStatus} /></div>
            )}
            {productExtractStatus?.error && (
              <span className="text-xs font-semibold text-rose-600">{productExtractStatus.error}</span>
            )}
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
                  <option>Not Allowed</option><option>0.065</option><option>0.10</option><option>0.15</option><option>0.25</option><option>0.40</option><option>0.65</option><option>1.0</option><option>1.5</option><option>2.5</option><option>4.0</option><option>6.5</option><option>10</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Major</div>
                <select className={inputClass} value={aql.inspectionStandard?.major || ''} onChange={e => updateSection('aql', { inspectionStandard: { ...aql.inspectionStandard, major: e.target.value === '' ? 0 : Number(e.target.value) } })}>
                  <option value="">— Select —</option>
                  <option value={0.065}>0.065</option><option value={0.10}>0.10</option><option value={0.15}>0.15</option><option value={0.25}>0.25</option><option value={0.40}>0.40</option><option value={0.65}>0.65</option><option value={1.0}>1.0</option><option value={1.5}>1.5</option><option value={2.5}>2.5</option><option value={4.0}>4.0</option><option value={6.5}>6.5</option><option value={10}>10</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Minor</div>
                <select className={inputClass} value={aql.inspectionStandard?.minor || ''} onChange={e => updateSection('aql', { inspectionStandard: { ...aql.inspectionStandard, minor: e.target.value === '' ? 0 : Number(e.target.value) } })}>
                  <option value="">— Select —</option>
                  <option value={0.065}>0.065</option><option value={0.10}>0.10</option><option value={0.15}>0.15</option><option value={0.25}>0.25</option><option value={0.40}>0.40</option><option value={0.65}>0.65</option><option value={1.0}>1.0</option><option value={1.5}>1.5</option><option value={2.5}>2.5</option><option value={4.0}>4.0</option><option value={6.5}>6.5</option><option value={10}>10</option>
                </select>
              </div>
            </div>
          </TableRow>
          <TableRow label="Accepted Quantity">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Critical</div>
                <input type="number" min="0" className={inputClass} value={aql.acceptedQuantity?.critical ?? ''} onChange={e => updateSection('aql', { acceptedQuantity: { ...aql.acceptedQuantity, critical: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Major</div>
                <input type="number" min="0" className={inputClass} value={aql.acceptedQuantity?.major ?? ''} onChange={e => updateSection('aql', { acceptedQuantity: { ...aql.acceptedQuantity, major: e.target.value === '' ? 0 : Number(e.target.value) } })} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Minor</div>
                <input type="number" min="0" className={inputClass} value={aql.acceptedQuantity?.minor ?? ''} onChange={e => updateSection('aql', { acceptedQuantity: { ...aql.acceptedQuantity, minor: e.target.value === '' ? 0 : Number(e.target.value) } })} />
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
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => addArrayItem('customerSamples', 'samples', { serialNo: '', itemNo: '', name: '', quantity: 1, storageLocation: '', status: 'Available' })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Sample
            </button>

            <label className={`px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isUploadInFlight(sampleExtractStatus) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'text-[#6C47FF] hover:bg-purple-50'
            }`}>
              <Upload className="w-4 h-4" />
              {uploadStatusLabel(sampleExtractStatus, 'Upload Sample Sheet')}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploadInFlight(sampleExtractStatus)}
                onChange={handleSampleSheetUpload}
              />
            </label>

            {isUploadInFlight(sampleExtractStatus) && (
              <div className="w-full basis-full"><UploadProgressBar percent={sampleExtractStatus} /></div>
            )}
            {sampleExtractStatus?.error && (
              <span className="text-xs font-semibold text-rose-600">{sampleExtractStatus.error}</span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* SECTION 8: Inspection Information */}
      <SectionCard title="SECTION 8: Inspection Information" badge={
        <div className="flex items-center gap-2">
          {(inspectionInfo.onlineWI && inspectionInfo.reportTemplate?.length > 0 && inspectionInfo.onlineCustomerClaimForm) && (
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Information Complete</span>
          )}
          {!inspectionInfo.technicalManagerReviewed && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">⚠ Not Examined by Technical Manager</span>
          )}
        </div>
      }>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Online WI">
            <div className="flex flex-col gap-2">
              {inspectionInfo.onlineWI?.url ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <button onClick={() => openDocumentLink(inspectionInfo.onlineWI.url)} className="flex-1 text-sm text-[#6C47FF] hover:underline truncate text-left">
                    {inspectionInfo.onlineWI.fileName || 'Uploaded file'}
                  </button>
                  <button onClick={() => removeDocumentLink('onlineWI')} className="text-rose-500 hover:bg-rose-50 p-1 rounded shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                  <p>No file uploaded.</p>
                </div>
              )}
              <label className={`px-4 py-2 border rounded-lg text-xs font-bold inline-flex items-center gap-1.5 w-max cursor-pointer ${
                isUploadInFlight(documentLinkStatus.onlineWI) ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#6C47FF] text-[#6C47FF] hover:bg-purple-50'
              }`}>
                <Plus className="w-3.5 h-3.5" />
                {uploadStatusLabel(documentLinkStatus.onlineWI, 'Upload File')}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={isUploadInFlight(documentLinkStatus.onlineWI)} onChange={e => handleDocumentLinkUpload('onlineWI', e)} />
              </label>
              {isUploadInFlight(documentLinkStatus.onlineWI) && <UploadProgressBar percent={documentLinkStatus.onlineWI} />}
              {documentLinkStatus.onlineWI?.error && (
                <span className="text-xs font-semibold text-rose-600">{documentLinkStatus.onlineWI.error}</span>
              )}
            </div>
          </TableRow>
          <TableRow label="Report Template">
            <div className="flex flex-col gap-2">
              {(inspectionInfo.reportTemplate || []).length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {inspectionInfo.reportTemplate.map((tpl, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      <span className="flex-1 text-sm text-slate-700 truncate">{tpl.fileName}</span>
                      <button onClick={() => openDocumentLink(tpl.url)} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-200">Open</button>
                      <button onClick={() => removeReportTemplate(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className={`inline-flex items-center gap-1 w-max text-xs font-bold cursor-pointer ${isUploadInFlight(documentLinkStatus.reportTemplate) ? 'text-slate-400 cursor-not-allowed' : 'text-[#6C47FF] hover:underline'}`}>
                <Upload className="w-3.5 h-3.5" />
                {uploadStatusLabel(documentLinkStatus.reportTemplate, 'Upload a template (one per service)')}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={isUploadInFlight(documentLinkStatus.reportTemplate)} onChange={handleReportTemplateUpload} />
              </label>
              {isUploadInFlight(documentLinkStatus.reportTemplate) && <UploadProgressBar percent={documentLinkStatus.reportTemplate} />}
              {documentLinkStatus.reportTemplate?.error && (
                <span className="text-xs font-semibold text-rose-600">{documentLinkStatus.reportTemplate.error}</span>
              )}
            </div>
          </TableRow>
          <TableRow label="Online Customer Claim Form">
            <div className="flex flex-col gap-2">
              {inspectionInfo.onlineCustomerClaimForm?.url ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <button onClick={() => openDocumentLink(inspectionInfo.onlineCustomerClaimForm.url)} className="flex-1 text-sm text-[#6C47FF] hover:underline truncate text-left">
                    {inspectionInfo.onlineCustomerClaimForm.fileName || 'Uploaded file'}
                  </button>
                  <button onClick={() => removeDocumentLink('onlineCustomerClaimForm')} className="text-rose-500 hover:bg-rose-50 p-1 rounded shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                  <p>No file uploaded.</p>
                </div>
              )}
              <label className={`px-4 py-2 border rounded-lg text-xs font-bold inline-flex items-center gap-1.5 w-max cursor-pointer ${
                isUploadInFlight(documentLinkStatus.onlineCustomerClaimForm) ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#6C47FF] text-[#6C47FF] hover:bg-purple-50'
              }`}>
                <Plus className="w-3.5 h-3.5" />
                {uploadStatusLabel(documentLinkStatus.onlineCustomerClaimForm, 'Upload File')}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={isUploadInFlight(documentLinkStatus.onlineCustomerClaimForm)} onChange={e => handleDocumentLinkUpload('onlineCustomerClaimForm', e)} />
              </label>
              {isUploadInFlight(documentLinkStatus.onlineCustomerClaimForm) && <UploadProgressBar percent={documentLinkStatus.onlineCustomerClaimForm} />}
              {documentLinkStatus.onlineCustomerClaimForm?.error && (
                <span className="text-xs font-semibold text-rose-600">{documentLinkStatus.onlineCustomerClaimForm.error}</span>
              )}
            </div>
          </TableRow>
        </div>
      </SectionCard>

      {/* SECTION 9: Attachments */}
      <SectionCard title="SECTION 9: Attachments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AttachmentBox
            title="Client Files"
            files={attachments.clientFiles || []}
            type="client"
            onUpload={handleAttachmentUpload}
            onDelete={handleAttachmentDelete}
            onOpen={openDocumentLink}
            uploadStatus={attachmentUploadStatus.client}
            disabled={!recordId}
            inputId="attachment-upload-client"
          />
          <AttachmentBox
            title="Supplier Files"
            files={attachments.supplierFiles || []}
            type="supplier"
            onUpload={handleAttachmentUpload}
            onDelete={handleAttachmentDelete}
            onOpen={openDocumentLink}
            uploadStatus={attachmentUploadStatus.supplier}
            disabled={!recordId}
            inputId="attachment-upload-supplier"
          />
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
        <div className="flex justify-end mb-3">
          <button
            onClick={downloadOnSiteTestsCSV}
            className="text-slate-600 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
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

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Supplier Status Feedback</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Content</th>
                  <th className="px-4 py-2 w-48">Label</th>
                  <th className="px-4 py-2 w-32">Submit Date</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(supplierInfo.statusEntries || []).map((entry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.content || ''} onChange={e => updateArrayItem('supplierInfo', 'statusEntries', idx, 'content', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.label || ''} onChange={e => updateArrayItem('supplierInfo', 'statusEntries', idx, 'label', e.target.value)} /></td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        className={inputClass}
                        value={entry.submitDate ? entry.submitDate.split('T')[0] : ''}
                        onChange={e => updateArrayItem('supplierInfo', 'statusEntries', idx, 'submitDate', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('supplierInfo', 'statusEntries', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {(supplierInfo.statusEntries || []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={() => addArrayItem('supplierInfo', 'statusEntries', { content: '', label: '', submitDate: new Date().toISOString() })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Fill In Feedback
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 14: Factory Information */}
      <SectionCard title="SECTION 14: Factory Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Factory Name"><input className={inputClass} value={factoryInfo.factoryName || ''} onChange={e => updateSection('factoryInfo', { factoryName: e.target.value })} /></TableRow>
          <TableRow label="English Name"><input className={inputClass} value={factoryInfo.englishName || ''} onChange={e => updateSection('factoryInfo', { englishName: e.target.value })} /></TableRow>
          <TableRow label="Address">
            <div className="flex gap-2">
              <input className={inputClass} value={factoryInfo.address || ''} onChange={e => updateSection('factoryInfo', { address: e.target.value })} />
              <button
                type="button"
                onClick={() => openFactoryAddressOnMap(factoryInfo.address)}
                title="Copy address and open in Google Maps"
                className="px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 shrink-0 flex items-center"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </TableRow>
          <TableRow label="Google Maps Link">
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={factoryInfo.googleMapsLink || ''}
                onChange={e => updateSection('factoryInfo', { googleMapsLink: e.target.value })}
                placeholder="Paste an exact Google Maps share link for the factory"
              />
              <button
                type="button"
                onClick={() => factoryInfo.googleMapsLink && window.open(factoryInfo.googleMapsLink, '_blank', 'noopener,noreferrer')}
                disabled={!factoryInfo.googleMapsLink}
                title="Open in Google Maps"
                className={`px-3 border rounded-lg shrink-0 flex items-center ${factoryInfo.googleMapsLink ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </TableRow>
          <TableRow label="Main Contact Person"><input className={inputClass} value={factoryInfo.mainContactPerson || ''} onChange={e => updateSection('factoryInfo', { mainContactPerson: e.target.value })} /></TableRow>
          <TableRow label="Other Contact Persons"><input className={inputClass} value={factoryInfo.otherContactPersons || ''} onChange={e => updateSection('factoryInfo', { otherContactPersons: e.target.value })} /></TableRow>
          <TableRow label="Phone"><input className={inputClass} value={factoryInfo.phone || ''} onChange={e => updateSection('factoryInfo', { phone: e.target.value })} /></TableRow>
          <TableRow label="Mobile"><input className={inputClass} value={factoryInfo.mobile || ''} onChange={e => updateSection('factoryInfo', { mobile: e.target.value })} /></TableRow>
          <TableRow label="Fax"><input className={inputClass} value={factoryInfo.fax || ''} onChange={e => updateSection('factoryInfo', { fax: e.target.value })} /></TableRow>
          <TableRow label="Equipment & Instruments"><textarea className={inputClass} rows={2} value={factoryInfo.equipmentInstruments || ''} onChange={e => updateSection('factoryInfo', { equipmentInstruments: e.target.value })} /></TableRow>
          <TableRow label="Inspection Environment"><textarea className={inputClass} rows={2} value={factoryInfo.inspectionEnvironment || ''} onChange={e => updateSection('factoryInfo', { inspectionEnvironment: e.target.value })} /></TableRow>
          <TableRow label="Working Time">
            <div className="flex items-center gap-2">
              <input
                type="time"
                className={inputClass}
                value={factoryInfo.workingTimeStart || ''}
                onChange={e => updateSection('factoryInfo', { workingTimeStart: e.target.value })}
              />
              <span className="text-slate-400 text-sm shrink-0">to</span>
              <input
                type="time"
                className={inputClass}
                value={factoryInfo.workingTimeEnd || ''}
                onChange={e => updateSection('factoryInfo', { workingTimeEnd: e.target.value })}
              />
            </div>
          </TableRow>
          <TableRow label="Transportation Route"><input className={inputClass} value={factoryInfo.transportationRoute || ''} onChange={e => updateSection('factoryInfo', { transportationRoute: e.target.value })} /></TableRow>
          <TableRow label="Accommodation Near Factory"><input className={inputClass} value={factoryInfo.accommodationNearFactory || ''} onChange={e => updateSection('factoryInfo', { accommodationNearFactory: e.target.value })} /></TableRow>
          <TableRow label="Notes on Factory Disagreements"><textarea className={inputClass} rows={2} value={factoryInfo.notesOnFactoryDisagreements || ''} onChange={e => updateSection('factoryInfo', { notesOnFactoryDisagreements: e.target.value })} /></TableRow>
          <TableRow label="Inspection Notes"><textarea className={inputClass} rows={2} value={factoryInfo.inspectionNotes || ''} onChange={e => updateSection('factoryInfo', { inspectionNotes: e.target.value })} /></TableRow>
        </div>

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Factory Abnormal Status</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Content</th>
                  <th className="px-4 py-2 w-48">Label</th>
                  <th className="px-4 py-2 w-32">Submit Date</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(factoryInfo.abnormalStatusEntries || []).map((entry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.content || ''} onChange={e => updateArrayItem('factoryInfo', 'abnormalStatusEntries', idx, 'content', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.label || ''} onChange={e => updateArrayItem('factoryInfo', 'abnormalStatusEntries', idx, 'label', e.target.value)} /></td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        className={inputClass}
                        value={entry.submitDate ? entry.submitDate.split('T')[0] : ''}
                        onChange={e => updateArrayItem('factoryInfo', 'abnormalStatusEntries', idx, 'submitDate', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('factoryInfo', 'abnormalStatusEntries', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {(factoryInfo.abnormalStatusEntries || []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={() => addArrayItem('factoryInfo', 'abnormalStatusEntries', { content: '', label: '', submitDate: new Date().toISOString() })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> I Provide Factory Abnormal Status
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 15: Recent Inspection Records */}
      <SectionCard title="SECTION 15: Recent Inspection Records">
        {recentFactoryRecords.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Inspection Date</th>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Notice ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFactoryRecords.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">{r.inspectionDate ? new Date(r.inspectionDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{r.inspectorName}</td>
                    <td className="px-4 py-3 text-slate-500">{r.noticeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
            No recent inspection records available for this factory.
          </div>
        )}
      </SectionCard>

      {/* SECTION 16: Instructional Letters Reading Record */}
      <SectionCard title="SECTION 16: Instructional Letters Reading Record">
        {(formData.submissionRecords || []).length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Submitted By</th>
                  <th className="px-4 py-3">Submit Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.submissionRecords.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">{r.submittedBy || '—'}</td>
                    <td className="px-4 py-3">{r.timeSubmitted ? new Date(r.timeSubmitted).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
            Not yet submitted.
          </div>
        )}
      </SectionCard>

    </div>
  );
}
