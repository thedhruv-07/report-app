import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../styles';
import { blankIfEmpty, getPassFailColor } from '../../utils/reportUtils';

import Section from '../components/Section';
import Table from '../components/Table';
import PhotoGrid from '../components/PhotoGrid';

// Utility to render flat data as a 2-column table layout
const renderFlatObject = (obj) => {
  if (!obj || typeof obj !== 'object') return <Text style={{ fontStyle: 'italic', color: 'gray' }}>No data</Text>;
  const keys = Object.keys(obj);
  if (keys.length === 0) return <Text style={{ fontStyle: 'italic', color: 'gray' }}>No data</Text>;
  
  return (
    <View style={pdfStyles.table}>
      {keys.map((key, i) => (
        <View key={i} style={pdfStyles.tableRow} wrap={false}>
          <View style={[pdfStyles.tableCol, { width: '40%', backgroundColor: pdfColors.lightGray, padding: 5 }]}><Text style={pdfStyles.bold}>{key}:</Text></View>
          <View style={[pdfStyles.tableCol, { width: '60%', padding: 5, borderRightWidth: 0 }]}>
            <Text>{blankIfEmpty(obj[key])}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function CLSSections({ data }) {
  // Extract first photo from containerPhotos group for the header
  const getContainerPhoto = () => {
    const group = data?.reportPhotoGroups?.find(g => g.id === 'containerPhotos') || data?.reportPhotoGroups?.[0];
    return group?.photos?.[0]?.preview || null;
  };

  const containerPhoto = getContainerPhoto();
  const generalInfoFields = [
    { label: 'Service Performed', value: data?.servicePerformed || 'Container Loading Supervision (CLS)' },
    { label: 'Client', value: data?.client },
    { label: 'Supplier', value: data?.supplier },
    { label: 'Factory', value: data?.factory },
    { label: 'Product Name', value: data?.productName },
    { label: 'P.O. No.', value: data?.po },
    { label: 'Item No.', value: data?.itemNo },
    { label: 'Destination Country', value: data?.destinationCountry },
    { label: 'Inspection Date', value: data?.inspectionDate },
    { label: 'Inspection Location', value: data?.location },
    { label: 'Reference Sample', value: data?.referenceSample || 'None' },
  ];
  const inspectionSummary = {
    'Quantity': data.quantity,
    'Product Conformity': data.productConformity,
    'Packing': data.packing,
    'Loading Process': data.loadingProcess,
    'Client Requirement': data.clientRequirement,
  };

  const loadingProcess = {
    'Container No.': data.containerNo,
    'Seal No.': data.sealNo,
    'Loading Location': data.location,
    'Weather Condition': data.weather,
  };

  const containerCheck = {
    'No holes or cracks': data.noHoles ? 'Yes' : 'No',
    'Doors functioning properly': data.doorsWorking ? 'Yes' : 'No',
    'Clean, dry and odor-free': data.clean ? 'Yes' : 'No',
    'Watertight (light test)': data.watertight ? 'Yes' : 'No',
    'No nails or protrusions': data.noProtrusions ? 'Yes' : 'No',
  };

  const loadingCheck = {
    'Even weight distribution': data.evenWeight ? 'Yes' : 'No',
    'Loading Method': data.loadingMethod,
    'Number of Layers': data.layersCount,
    'Remarks': data.remarks_loading, // Note: using unique key if possible
  };

  const clientReq = {
    'Temperature Check Result': data.temperatureCheck,
    'Special Requirements Remarks': data.remarks_client,
  };
  const quantityItems = data?.quantityTable || [];

  return (
    <View>
      {/* 1. General Information with side photo */}
      <Section title="I. GENERAL INFORMATION" hideHeader>
        <View style={{ borderWidth: 1, borderColor: pdfColors.border }}>
          {/* Header Title Row */}
          <View style={{ padding: 8, borderBottomWidth: 1, borderColor: pdfColors.border, alignItems: 'center', backgroundColor: pdfColors.white }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: pdfColors.primary }}>
              {data.servicePerformed || 'Container Loading Supervision (CLS)'}
            </Text>
          </View>

          {/* Section Sub-header Row */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
              I. GENERAL INFORMATION
            </Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {/* Left Table */}
            <View style={{ width: '55%', borderRightWidth: 1, borderColor: pdfColors.border }}>
              {generalInfoFields.map((field, i) => (
                <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === generalInfoFields.length - 1 ? 0 : 1, borderColor: pdfColors.border }}>
                  <View style={{ width: '40%', backgroundColor: pdfColors.lightGray, padding: 5, borderRightWidth: 1, borderColor: pdfColors.border }}>
                    <Text style={[pdfStyles.bold, { fontSize: 9 }]}>{field.label}:</Text>
                  </View>
                  <View style={{ width: '60%', padding: 5, backgroundColor: pdfColors.white }}>
                    <Text style={{ fontSize: 9 }}>{blankIfEmpty(field.value)}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Right Photo */}
            <View style={{ width: '45%', padding: 0, justifyContent: 'center', alignItems: 'center' }}>
              {containerPhoto ? (
                <Image 
                  src={containerPhoto} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <View style={{ padding: 10 }}>
                  <Text style={{ fontSize: 9, color: 'gray', fontStyle: 'italic' }}>No container photo</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Section>

      {/* 2. Inspection Summary */}
      <Section title="II. INSPECTION SUMMARY">
        {renderFlatObject(inspectionSummary)}
      </Section>

      {/* 3. Remarks */}
      <Section title="III. REMARKS">
        <View style={pdfStyles.table}>
          {/* Problem Remarks */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '100%', padding: 5, borderRightWidth: 0 }]}>
              <Text style={pdfStyles.bold}>Problem Remarks:</Text>
            </View>
          </View>
          {(data?.problemRemarks || ['-']).map((remark, i) => (
            <View key={`prob-${i}`} style={pdfStyles.tableRow}>
              <View style={[pdfStyles.tableCol, { width: '5%', padding: 5, alignItems: 'center' }]}><Text>{i + 1}.</Text></View>
              <View style={[pdfStyles.tableCol, { width: '95%', padding: 5, borderRightWidth: 0 }]}><Text>{remark}</Text></View>
            </View>
          ))}

          {/* General Remarks */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '100%', padding: 5, borderRightWidth: 0 }]}>
              <Text style={pdfStyles.bold}>General Remarks:</Text>
            </View>
          </View>
          {(data?.generalRemarks || ['-']).map((remark, i) => (
            <View key={`gen-${i}`} style={pdfStyles.tableRow}>
              <View style={[pdfStyles.tableCol, { width: '5%', padding: 5, alignItems: 'center' }]}><Text>{i + 1 + (data?.problemRemarks?.length || 1)}.</Text></View>
              <View style={[pdfStyles.tableCol, { width: '95%', padding: 5, borderRightWidth: 0 }]}><Text>{remark}</Text></View>
            </View>
          ))}

          {/* Sample Collection */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '100%', padding: 5, borderRightWidth: 0 }]}>
              <Text style={pdfStyles.bold}>Sample Collection Record:</Text>
            </View>
          </View>
          <View style={pdfStyles.tableRow}>
            <View style={[pdfStyles.tableCol, { width: '5%', padding: 5, alignItems: 'center' }]}>
              <Text>{1 + (data?.problemRemarks?.length || 1) + (data?.generalRemarks?.length || 1)}.</Text>
            </View>
            <View style={[pdfStyles.tableCol, { width: '95%', padding: 5, borderRightWidth: 0 }]}>
              <Text>{data?.sampleCollection || "No Sample-Inspector didn't collected any sample from Factory."}</Text>
            </View>
          </View>

          {/* Photos Header */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '100%', padding: 5, borderRightWidth: 0 }]}>
              <Text style={pdfStyles.bold}>Photos:</Text>
            </View>
          </View>
        </View>

        {/* Remark Photos Grid */}
        {(() => {
          const remarkPhotosGroup = data?.reportPhotoGroups?.find(g => g.id === 'remarkPhotos');
          if (remarkPhotosGroup && remarkPhotosGroup.photos?.length > 0) {
            return (
              <View style={{ marginTop: 10 }}>
                <PhotoGrid photos={remarkPhotosGroup.photos} />
              </View>
            );
          }
          return null;
        })()}
      </Section>

      {/* Conclusion */}
      <Section title="IV. CONCLUSION">
        <View style={{ border: 1, borderColor: pdfColors.border }}>
          <View style={{ padding: 25, alignItems: 'flex-start' }}>
            <Text style={{ 
              fontSize: 60, 
              fontWeight: 'bold', 
              color: (data.reportHeader?.conclusion || '').toUpperCase().includes('PASS') ? pdfColors.success : pdfColors.danger 
            }}>
              {(data.reportHeader?.conclusion || 'FAILED').toUpperCase()}
            </Text>
          </View>
          <View style={{ padding: 10, borderTop: 1, borderColor: pdfColors.border, backgroundColor: '#fcfcfc' }}>
            <View style={{ marginBottom: 3 }}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>PASSED: <Text style={{ fontWeight: 'normal' }}>Conform to Client's Requirement</Text></Text></View>
            <View style={{ marginBottom: 3 }}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>PASSED (Conditional): <Text style={{ fontWeight: 'normal' }}>The Passed results will be valid only after the client notes and accepts the issues in the remarks</Text></Text></View>
            <View style={{ marginBottom: 3 }}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>PENDING: <Text style={{ fontWeight: 'normal' }}>Subject to Client's Evaluation</Text></Text></View>
            <View style={{ marginBottom: 3 }}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>FAILED: <Text style={{ fontWeight: 'normal' }}>Not Conform to Client's Requirement</Text></Text></View>
          </View>
        </View>
      </Section>

      {/* A. QUANTITY (High Fidelity) */}
      <Section title="A. QUANTITY">
        <View style={pdfStyles.table}>
          {/* Header with Unit */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.mediumGray }]}>
             <View style={[pdfStyles.tableCol, { width: '50%', padding: 5, borderRightWidth: 0 }]}><Text style={[pdfStyles.bold, { color: pdfColors.primary }]}>A. QUANTITY</Text></View>
             <View style={[pdfStyles.tableCol, { width: '50%', padding: 5, borderRightWidth: 0, alignItems: 'flex-end' }]}>
               <Text style={pdfStyles.bold}>Unit: {data.quantityUnit || 'Kg'}</Text>
             </View>
          </View>
          
          {/* Complex Headers */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '10%', padding: 5 }]}><Text style={pdfStyles.bold}>P.O.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5 }]}><Text style={pdfStyles.bold}>Item</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Order Quantity</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Loaded Quantity</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Cartons Remain</Text></View>
          </View>
          
          {/* Data Rows */}
          {(data?.quantityTable || []).map((row, i) => (
             <View key={i} style={pdfStyles.tableRow}>
               <View style={[pdfStyles.tableCol, { width: '10%', padding: 5 }]}><Text>{row.po || '/'}</Text></View>
               <View style={[pdfStyles.tableCol, { width: '25%', padding: 5 }]}><Text>{row.item || '/'}</Text></View>
               <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, alignItems: 'center' }]}><Text>{row.orderQtyAmount || '/'} ({row.orderQtyCartons || '/'})</Text></View>
               <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, alignItems: 'center' }]}><Text>{row.loadedQtyAmount || '/'} ({row.loadedQtyCartons || '/'})</Text></View>
               <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text>{row.cartonsRemain || '00'}</Text></View>
             </View>
          ))}

          {/* Totals Row */}
          {(() => {
            const sum = (key) => (data?.quantityTable || []).reduce((acc, r) => acc + (parseFloat(r[key]) || 0), 0);
            const totalOrderAmount = sum('orderQtyAmount');
            const totalOrderCartons = sum('orderQtyCartons');
            const totalLoadedAmount = sum('loadedQtyAmount');
            const totalLoadedCartons = sum('loadedQtyCartons');
            const totalRemain = sum('cartonsRemain');

            return (
              <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
                <View style={[pdfStyles.tableCol, { width: '35%', padding: 5, alignItems: 'flex-end' }]}><Text style={pdfStyles.bold}>Total:</Text></View>
                <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, alignItems: 'center' }]}><Text style={pdfStyles.bold}>{totalOrderAmount || '/'} ({totalOrderCartons || '/'})</Text></View>
                <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, alignItems: 'center' }]}><Text style={pdfStyles.bold}>{totalLoadedAmount || '/'} ({totalLoadedCartons || '/'})</Text></View>
                <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={pdfStyles.bold}>{totalRemain || '00'}</Text></View>
              </View>
            );
          })()}
          
          {/* Metadata */}
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '100%', padding: 5, borderRightWidth: 0 }]}>
              <Text style={pdfStyles.bold}>Packing List Provided by : <Text style={{ fontWeight: 'normal' }}>{data.packingListProvidedBy || 'By Factory'}</Text></Text>
            </View>
          </View>
          <View style={pdfStyles.tableRow}>
             <View style={[pdfStyles.tableCol, { width: '20%', padding: 5 }]}><Text style={pdfStyles.bold}>Result:</Text></View>
             <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 0 }]}><Text style={{ color: (data.quantityResult || 'Passed').toLowerCase().includes('pass') ? pdfColors.success : pdfColors.danger, fontWeight: 'bold' }}>{data.quantityResult || 'Passed'}</Text></View>
          </View>
          <View style={pdfStyles.tableRow}>
             <View style={[pdfStyles.tableCol, { width: '20%', padding: 5 }]}><Text style={pdfStyles.bold}>Remark:</Text></View>
             <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 0 }]}><Text>{data.quantityRemark || 'N/A'}</Text></View>
          </View>
        </View>
      </Section>

      
      {/* B. PRODUCT CONFORMITY */}
      <Section title="B. PRODUCT CONFORMITY" hideHeader>
        <View style={{ borderWidth: 1, borderColor: pdfColors.border }}>
          {/* Section Header */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
              B. PRODUCT CONFORMITY
            </Text>
          </View>

          {/* Selected Cartons Row */}
          <View style={{ padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9 }}><Text style={pdfStyles.bold}>Selected Cartons : </Text>{data.selectedCartons || "(3 carton per model)"}</Text>
          </View>

          {/* Random Info Row */}
          <View style={{ padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, textDecoration: 'underline' }}>{data.randomSelectionInfo || "12 Cartons were selected randomly on site. No carton number in shipping mark."}</Text>
          </View>

          {/* Carton No Info Row */}
          <View style={{ padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9 }}>{data.cartonNoInfo || "Carton No.: NA"}</Text>
          </View>

          {/* Small Grid Row */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}>
               <Text style={{ fontSize: 9 }}>{data.productName || "Frozen Buffalo FQ Rolls"}</Text>
            </View>
            {[...Array(9)].map((_, i) => (
              <View key={i} style={[pdfStyles.tableCol, { width: '8.33%', padding: 5, borderRightWidth: i === 8 ? 0 : 1, alignItems: 'center' }]}>
                <Text style={{ fontSize: 9 }}>/</Text>
              </View>
            ))}
          </View>

          {/* Subheaders */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Check Contents Inside Packaging</Text>
          </View>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>1. Style and Color</Text>
          </View>

          {/* Style and Color Table */}
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.white, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Description</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Result</Text></View>
          </View>
          {[
            data.styleColorDesc1 || " - Conform to product specification (Including color, accessories, hangtag/labels, logo/markings)",
            data.styleColorDesc2 || " - Conform to reference sample",
            data.styleColorDesc3 || " - Conform to product digital photo",
            data.styleColorDesc4 || " - Others"
          ].map((desc, i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
              <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{desc}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{i < 3 ? (data.styleColorResult || "N/A") : ""}</Text></View>
            </View>
          ))}

          {/* 2. Workmanship */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>2. Workmanship & Function Check (2 units per model, but no more than 20 units)</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.white, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Description</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Result</Text></View>
          </View>
          {[
            data.workmanshipDesc1 || " - Obvious visual defects (appearance, artwork, logo)",
            data.workmanshipDesc2 || " - Base function check (no need to use equipment to check)"
          ].map((desc, i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
              <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{desc}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{data.workmanshipResult || "N/A"}</Text></View>
            </View>
          ))}

          {/* Final Rows */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, backgroundColor: pdfColors.lightGray, borderRightWidth: 1 }]}><Text style={pdfStyles.bold}>Result:</Text></View>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9 }}>{data.conformityOverallResult || "N/A"}</Text></View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, backgroundColor: pdfColors.lightGray, borderRightWidth: 1 }]}><Text style={pdfStyles.bold}>Remark:</Text></View>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9 }}>{data.conformityRemark || "N/A"}</Text></View>
          </View>
        </View>
      </Section>

      {/* C. PACKING */}
      <Section title="C. PACKING">
        <View style={{ border: `1px solid ${pdfColors.border}` }}>
          {/* Package Details + Icon */}
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.lightGray, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 1 }]}><Text style={pdfStyles.bold}>Package Details</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 16 }}>📦</Text></View>
          </View>
          
          {/* Sub-headers */}
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.white, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '14%', padding: 5, borderRightWidth: 1, alignItems: 'center', justifyContent: 'center' }]}><Text style={pdfStyles.bold}>Item No.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '22%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Qty / Carton{"\n"}Marking | Actual</Text></View>
            <View style={[pdfStyles.tableCol, { width: '22%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Qty / Inner Box{"\n"}Marking | Actual</Text></View>
            <View style={[pdfStyles.tableCol, { width: '22%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Gross Weight (KG){"\n"}Marking | Actual</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center', justifyContent: 'center' }]}><Text style={pdfStyles.bold}>Carton Size{"\n"}(L x W x H, cm)</Text></View>
          </View>

          {/* Dynamic Packing Items */}
          {(Array.isArray(data.clsPackingItems) ? data.clsPackingItems : []).map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
              <View style={[pdfStyles.tableCol, { width: '14%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{item.itemName || "/"}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '22%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{item.qtyCartonMarking || "/"} | {item.qtyCartonActual || "/"}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '22%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{item.qtyInnerMarking || "/"} | {item.qtyInnerActual || "/"}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '22%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{item.weightMarking || "/"} | {item.weightActual || "/"}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{item.cartonSize || "/"}</Text></View>
            </View>
          ))}

          {/* Condition of Carton */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Condition of Carton</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.white, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '75%', padding: 5, borderRightWidth: 1, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Description</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Result</Text></View>
          </View>
          {(Array.isArray(data.clsCartonConditions) ? data.clsCartonConditions : [{ description: "/", result: "/" }]).map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
              <View style={[pdfStyles.tableCol, { width: '75%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{c.description || "/"}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 9 }}>{c.result || "/"}</Text></View>
            </View>
          ))}

          {/* Export Carton Details */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Export Carton Details</Text>
          </View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>Fastening Metal Staples</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{data.cls_fastening_metal_staples || "/"}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>Nylon Band</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9 }}>{data.cls_nylon_band || "Yes"}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>Material</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{data.cls_material || "/"}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9, fontWeight: 'bold' }}>Corrugated Paper Plies</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9 }}>{data.cls_corrugated_paper_plies || "/"}</Text></View>
          </View>

          {/* Packing Method */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Packing Method</Text>
          </View>
          <View style={{ padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9 }}>{data.cls_packing_method || "/"}</Text>
          </View>

          {/* Assortment Method */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Assortment Method</Text>
          </View>
          <View style={{ padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9 }}>{data.cls_assortment_method || "No assortment packing"}</Text>
          </View>

          {/* Shipping Marks */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Shipping Marks</Text>
          </View>
          {[
            { l: data.cls_shipping_marks_label || "Shipping Marks (on 2 Side )", r: data.cls_shipping_marks_result || "Actual finding" },
            { l: data.cls_side_marks_label || "Side Marks (on 2 Side )", r: data.cls_side_marks_result || "Actual finding" },
            { l: data.cls_inner_box_marks_label || "Inner Box Marks (on /Side )", r: data.cls_inner_box_marks_result || "Actual finding" },
          ].map((mark, i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
              <View style={[pdfStyles.tableCol, { width: '60%', padding: 5, borderRightWidth: 1 }]}><Text style={{ fontSize: 9 }}>{mark.l}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '40%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9 }}>{mark.r}</Text></View>
            </View>
          ))}

          {/* Result & Remark */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, backgroundColor: pdfColors.lightGray, borderRightWidth: 1 }]}><Text style={pdfStyles.bold}>Result:</Text></View>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9, color: getPassFailColor(data.cls_packing_result || "Passed") }}>{data.cls_packing_result || "Passed"}</Text></View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, backgroundColor: pdfColors.lightGray, borderRightWidth: 1 }]}><Text style={pdfStyles.bold}>Remark:</Text></View>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 5, borderRightWidth: 0 }]}><Text style={{ fontSize: 9 }}>{data.cls_packing_remark || ""}</Text></View>
          </View>
        </View>
      </Section>

      {/* 7. Loading Process */}
      <Section title="6. LOADING PROCESS">
        {renderFlatObject(loadingProcess)}
      </Section>
      
      {/* 7. Container Condition */}
      <Section title="7. CONTAINER CONDITION">
        {renderFlatObject(containerCheck)}
      </Section>

      {/* 8. Loading Check */}
      <Section title="8. LOADING CHECK">
        {renderFlatObject(loadingCheck)}
      </Section>

      {/* 9. Client Requirement */}
      <Section title="9. CLIENT REQUIREMENT">
        {renderFlatObject(clientReq)}
      </Section>

      {/* 9. Photos */}
      <Section title="9. PHOTOS">
        {data?.reportPhotoGroups && data.reportPhotoGroups.map((group, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 12 }}>{group.description}</Text>
            <PhotoGrid photos={group.photos} />
          </View>
        ))}
        {(!data?.reportPhotoGroups || data.reportPhotoGroups.length === 0) && (
          <Text style={{ fontStyle: 'italic', color: 'gray' }}>No photos provided.</Text>
        )}
      </Section>
    </View>
  );
}
