import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../styles';
import { blankIfEmpty, getPassFailColor } from '../../utils/reportUtils';
import { clsSchema } from '../../shared/formSchemas';

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
  // Utility to get photos by group ID
  const getPhotosByGroup = (groupId) => {
    return data?.reportPhotoGroups?.find(g => g.id === groupId)?.photos || [];
  };

  const getContainerPhoto = () => {
    const photos = getPhotosByGroup('containerPhotos');
    return photos[0]?.preview || null;
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

  return (
    <View>
      {/* 1. General Information with side photo */}
      <Section title="I. GENERAL INFORMATION" hideHeader>
        <View style={{ borderWidth: 1, borderColor: pdfColors.border }}>
          <View style={{ padding: 8, borderBottomWidth: 1, borderColor: pdfColors.border, alignItems: 'center', backgroundColor: pdfColors.white }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: pdfColors.primary }}>
              {data.servicePerformed || 'Container Loading Supervision (CLS)'}
            </Text>
          </View>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
              I. GENERAL INFORMATION
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
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
            <View style={{ width: '45%', padding: 0, justifyContent: 'center', alignItems: 'center' }}>
              {containerPhoto ? (
                <Image src={containerPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <View style={{ padding: 10 }}><Text style={{ fontSize: 9, color: 'gray', fontStyle: 'italic' }}>No container photo</Text></View>
              )}
            </View>
          </View>
        </View>
      </Section>

      {/* 2. Inspection Summary */}
      <Section title="II. INSPECTION SUMMARY">
        <View style={pdfStyles.table}>
          {[
            { l: 'Quantity', v: data.quantity },
            { l: 'Loading Process', v: data.loadingProcess },
            { l: 'Client Requirement', v: data.clientRequirement }
          ].map((item, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <View style={[pdfStyles.tableCol, { width: '40%', backgroundColor: pdfColors.lightGray, padding: 5 }]}><Text style={pdfStyles.bold}>{item.l}:</Text></View>
              <View style={[pdfStyles.tableCol, { width: '60%', padding: 5, borderRightWidth: 0 }]}><Text>{blankIfEmpty(item.v)}</Text></View>
            </View>
          ))}
        </View>
      </Section>

      {/* A. QUANTITY */}
      <Section title="A. QUANTITY">
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.mediumGray }]}>
             <View style={[pdfStyles.tableCol, { width: '50%', padding: 5, borderRightWidth: 0 }]}><Text style={[pdfStyles.bold, { color: pdfColors.primary }]}>A. QUANTITY</Text></View>
             <View style={[pdfStyles.tableCol, { width: '50%', padding: 5, borderRightWidth: 0, alignItems: 'flex-end' }]}><Text style={pdfStyles.bold}>Unit: {data.quantityUnit || 'Kg'}</Text></View>
          </View>
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '10%', padding: 5 }]}><Text style={pdfStyles.bold}>P.O.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5 }]}><Text style={pdfStyles.bold}>Item</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Order Quantity</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Loaded Quantity</Text></View>
            <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={pdfStyles.bold}>Cartons Remain</Text></View>
          </View>
          {(data?.quantityTable || []).map((row, i) => (
             <View key={i} style={pdfStyles.tableRow}>
               <View style={[pdfStyles.tableCol, { width: '10%', padding: 5 }]}><Text>{row.po || '/'}</Text></View>
               <View style={[pdfStyles.tableCol, { width: '25%', padding: 5 }]}><Text>{row.item || '/'}</Text></View>
               <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, alignItems: 'center' }]}><Text>{row.orderQtyAmount || '/'} ({row.orderQtyCartons || '/'})</Text></View>
               <View style={[pdfStyles.tableCol, { width: '25%', padding: 5, alignItems: 'center' }]}><Text>{row.loadedQtyAmount || '/'} ({row.loadedQtyCartons || '/'})</Text></View>
               <View style={[pdfStyles.tableCol, { width: '20%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text>{row.cartonsRemain || '00'}</Text></View>
             </View>
          ))}
        </View>
      </Section>

      {/* D. LOADING PROCESS - UNIFIED SECTION */}
      <Section title="D. LOADING PROCESS">
        <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 15 }}>
          {/* Container Details Table */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 3, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Container:</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.white, borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Container Type</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Container No.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Seal No.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>Seal No. (AV){"\n"}If Used</Text></View>
            <View style={[pdfStyles.tableCol, { width: '30%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Item No.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '10%', padding: 3, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Loaded Carton</Text></View>
          </View>
          {/* Data Row */}
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.white, borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{data.containerType || '/'}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{data.containerNo || '/'}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{data.sealNo || '/'}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{data.avSealNo || '/'}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '30%', padding: 5, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, textAlign: 'center' }}>{data.cargoBreakdown || '/'}</Text></View>
            <View style={[pdfStyles.tableCol, { width: '10%', padding: 5, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{data.loadedCarton || '/'}</Text></View>
          </View>

          {/* Loading Condition Table */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 3, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Loading Condition</Text>
          </View>
          {[
            { l: 'Loading Location:', v: data.location },
            { l: 'Weather:', v: data.weather },
            { l: 'Sheltered:', v: data.shelter },
            { l: 'Start Time:', v: data.loadingStartTime },
            { l: 'End Time:', v: data.loadingEndTime }
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === 4 ? 0 : 1, borderColor: '#000' }}>
              <View style={{ width: '20%', backgroundColor: pdfColors.white, padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'flex-end' }}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>{item.l}</Text></View>
              <View style={{ width: '80%', padding: 4 }}><Text style={{ fontSize: 8 }}>{blankIfEmpty(item.v)}</Text></View>
            </View>
          ))}
        </View>

        {/* Photos Header */}
        <View style={{ marginBottom: 5 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Photos:</Text></View>

        {/* Image Grid 2x2 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' }}>
          {(() => {
            const loadingAreaPhotos = getPhotosByGroup('loadingAreaPhotos');
            const warehousePhotos = getPhotosByGroup('warehousePhotos');
            const gridItems = [
              { photo: loadingAreaPhotos[0], caption: 'Loading area' },
              { photo: warehousePhotos[0], caption: 'Warehouse' },
              { photo: warehousePhotos[1], caption: 'Warehouse' },
              { photo: warehousePhotos[2], caption: 'Warehouse' }
            ];
            return gridItems.map((item, i) => (
              <View key={i} style={{ width: '50%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000' }}>
                <View style={{ height: 160, padding: 2 }}>
                  {item.photo ? (
                    <Image src={item.photo.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }} />
                  )}
                </View>
                <View style={{ padding: 2, borderTopWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{item.caption}</Text>
                </View>
              </View>
            ));
          })()}
        </View>

        {/* Container Header */}
        <View style={{ backgroundColor: pdfColors.lightGray, padding: 4, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#000', marginTop: 10 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Container 1 : {data.containerNo || '/'}</Text>
        </View>

        {/* Loaded Goods Position Map */}
        <View style={{ borderWidth: 1, borderColor: '#000', borderTopWidth: 0 }}>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 4, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Loaded Goods Position Map</Text>
          </View>
          <View style={{ height: 180, padding: 10, position: 'relative' }}>
             {/* Map Placeholder Graphic */}
             <View style={{ width: '100%', height: '100%', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', flexDirection: 'column' }}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <View style={{ flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                  <View style={{ flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                  <View style={{ flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                  <View style={{ flex: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <View style={{ flex: 1, borderRightWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                  <View style={{ flex: 1, borderRightWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                  <View style={{ flex: 1, borderRightWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                  <View style={{ flex: 1, borderStyle: 'dashed', borderColor: '#ccc' }} />
                </View>
             </View>
             {/* Labels */}
             <Text style={{ position: 'absolute', top: 5, left: 15, fontSize: 7, color: 'gray' }}>Roof</Text>
             <Text style={{ position: 'absolute', top: 5, left: '25%', fontSize: 7, color: 'gray' }}>3/4</Text>
             <Text style={{ position: 'absolute', top: 5, left: '50%', fontSize: 7, color: 'gray' }}>1/2</Text>
             <Text style={{ position: 'absolute', top: 5, left: '75%', fontSize: 7, color: 'gray' }}>1/4</Text>
             <Text style={{ position: 'absolute', top: 5, right: 15, fontSize: 7, color: 'gray' }}>Roof</Text>
             
             <Text style={{ position: 'absolute', top: '50%', left: 2, fontSize: 7, color: 'gray', transform: 'rotate(-90deg)' }}>Door</Text>
             <Text style={{ position: 'absolute', top: '50%', right: 2, fontSize: 7, color: 'gray', transform: 'rotate(90deg)' }}>End</Text>
             
             <Text style={{ position: 'absolute', bottom: 5, left: 15, fontSize: 7, color: 'gray' }}>Bottom</Text>
             <Text style={{ position: 'absolute', bottom: 5, right: 15, fontSize: 7, color: 'gray' }}>Bottom</Text>

             <View style={{ position: 'absolute', top: 15, left: '15%', width: '100', height: 10 }}>
                <Text style={{ fontSize: 16 }}>➡</Text>
             </View>
          </View>
        </View>

        {/* Empty Container Check */}
        <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#000' }}>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Empty Container Check</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.lightGray, borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={[pdfStyles.tableCol, { width: '5%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>N o.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '80%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Requirement conditions</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Result</Text></View>
          </View>
          {clsSchema.containerCheck.map((item, i) => {
            const check = (data.containerCheck || []).find(c => c.id === item.id) || {};
            return (
              <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === (clsSchema.containerCheck.length - 1) ? 0 : 1, borderColor: '#000' }}>
                <View style={[pdfStyles.tableCol, { width: '5%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{i + 1}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '80%', padding: 3, borderRightWidth: 1, borderColor: '#000' }]}><Text style={{ fontSize: 8 }}>{item.label}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 8, color: check.result === 'Yes' || check.result === 'Passed' ? pdfColors.success : pdfColors.danger }}>{check.result || 'N/A'}</Text></View>
              </View>
            );
          })}
        </View>

        {/* Empty Container Photos */}
        <View style={{ marginTop: 5 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Photos:</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' }}>
          {(() => {
            const photos = getPhotosByGroup('emptyContainerPhotos');
            const gridItems = [
              { photo: photos[0], caption: 'Empty container' },
              { photo: photos[1], caption: 'Container Door No.' },
              { photo: photos[2], caption: 'Inside Container No.' },
              { photo: photos[3], caption: 'Outside Container No.' }
            ];
            return gridItems.map((item, i) => (
              <View key={i} style={{ width: '50%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000' }}>
                <View style={{ height: 160, padding: 2 }}>
                  {item.photo ? (
                    <Image src={item.photo.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }} />
                  )}
                </View>
                <View style={{ padding: 2, borderTopWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{item.caption}</Text>
                </View>
              </View>
            ));
          })()}
        </View>

        {/* Truck Check Photos */}
        <View style={{ marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' }}>
          {(() => {
            const photos = getPhotosByGroup('truckCheckPhotos');
            const gridItems = [
              { photo: photos[0], caption: 'Truck (front)' },
              { photo: photos[1], caption: 'Truck (back)' }
            ];
            return gridItems.map((item, i) => (
              <View key={i} style={{ width: '50%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000' }}>
                <View style={{ height: 160, padding: 2 }}>
                  {item.photo ? (
                    <Image src={item.photo.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }} />
                  )}
                </View>
                <View style={{ padding: 2, borderTopWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{item.caption}</Text>
                </View>
              </View>
            ));
          })()}
        </View>

        {/* Loading Check Table */}
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: '#000' }}>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 4, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Loading Check - 1/4 Full, 1/2 Full, 3/4 Full, Full container</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.lightGray, borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={[pdfStyles.tableCol, { width: '5%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>No.</Text></View>
            <View style={[pdfStyles.tableCol, { width: '55%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Condition</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Result</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 3, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Findings and comments</Text></View>
          </View>
          {clsSchema.loadingCheck.map((item, i) => {
            const check = (data.loadingCheck || []).find(c => c.id === item.id) || {};
            return (
              <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === (clsSchema.loadingCheck.length - 1) ? 0 : 1, borderColor: '#000' }}>
                <View style={[pdfStyles.tableCol, { width: '5%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{i + 1}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '55%', padding: 3, borderRightWidth: 1, borderColor: '#000' }]}><Text style={{ fontSize: 7 }}>{item.label}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, color: check.result === 'Yes' || check.result === 'Passed' ? pdfColors.success : pdfColors.danger }}>{check.result || 'N/A'}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '25%', padding: 3, borderRightWidth: 0 }]}><Text style={{ fontSize: 7 }}>{check.finding || ''}</Text></View>
              </View>
            );
          })}
        </View>

        {/* Loading Photos Grid */}
        <View style={{ marginTop: 5 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Photos:</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' }}>
          {(() => {
            const photos = getPhotosByGroup('loadingPhotos');
            const gridItems = [
              { photo: photos[0], caption: '1/4 loading' },
              { photo: photos[1], caption: '1/2 loading' },
              { photo: photos[2], caption: '3/4 loading' },
              { photo: photos[3], caption: 'Full loading' }
            ];
            return gridItems.map((item, i) => (
              <View key={i} style={{ width: '50%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000' }}>
                <View style={{ height: 160, padding: 2 }}>
                  {item.photo ? (
                    <Image src={item.photo.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }} />
                  )}
                </View>
                <View style={{ padding: 2, borderTopWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{item.caption}</Text>
                </View>
              </View>
            ));
          })()}
        </View>

        {/* Container Closing Section */}
        <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#000' }}>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Container Closing:</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.lightGray, borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={[pdfStyles.tableCol, { width: '5%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>No</Text></View>
            <View style={[pdfStyles.tableCol, { width: '55%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Condition</Text></View>
            <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Result</Text></View>
            <View style={[pdfStyles.tableCol, { width: '25%', padding: 3, borderRightWidth: 0, alignItems: 'center' }]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Findings and comments</Text></View>
          </View>
          {clsSchema.containerClosing.map((item, i) => {
            const check = (data.containerClosing || []).find(c => c.id === item.id) || {};
            return (
              <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === (clsSchema.containerClosing.length - 1) ? 0 : 1, borderColor: '#000' }}>
                <View style={[pdfStyles.tableCol, { width: '5%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8 }}>{i + 1}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '55%', padding: 3, borderRightWidth: 1, borderColor: '#000' }]}><Text style={{ fontSize: 7 }}>{item.label}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '15%', padding: 3, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }]}><Text style={{ fontSize: 8, color: check.result === 'Yes' || check.result === 'Passed' ? pdfColors.success : pdfColors.danger }}>{check.result || 'N/A'}</Text></View>
                <View style={[pdfStyles.tableCol, { width: '25%', padding: 3, borderRightWidth: 0 }]}><Text style={{ fontSize: 7 }}>{check.finding || ''}</Text></View>
              </View>
            );
          })}
        </View>

        {/* Closing Photos Grid */}
        <View style={{ marginTop: 5 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Photos:</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' }}>
          {(() => {
            const photos = getPhotosByGroup('closingPhotos');
            const gridItems = [
              { photo: photos[0], caption: 'Close right door' },
              { photo: photos[1], caption: 'Close both doors' },
              { photo: photos[2], caption: 'Seal No. for Company' },
              { photo: photos[3], caption: 'Seal the door' },
              { photo: photos[4], caption: 'Seal No. BOLTD1715318' },
              { photo: photos[5], caption: 'AV Seal' }
            ];
            return gridItems.map((item, i) => (
              <View key={i} style={{ width: '50%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000' }}>
                <View style={{ height: 160, padding: 2 }}>
                  {item.photo ? (
                    <Image src={item.photo.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }} />
                  )}
                </View>
                <View style={{ padding: 2, borderTopWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{item.caption}</Text>
                </View>
              </View>
            ));
          })()}
        </View>

        {/* Result & Remark for Loading Process */}
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: '#000' }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={{ width: '15%', backgroundColor: pdfColors.lightGray, padding: 4, borderRightWidth: 1, borderColor: '#000' }}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Result:</Text></View>
            <View style={{ width: '85%', padding: 4 }}><Text style={{ fontSize: 8, fontWeight: 'bold', color: pdfColors.success }}>{data.loadingProcessResult || 'Passed'}</Text></View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '15%', backgroundColor: pdfColors.lightGray, padding: 4, borderRightWidth: 1, borderColor: '#000' }}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Remark:</Text></View>
            <View style={{ width: '85%', padding: 4 }}><Text style={{ fontSize: 8 }}>{data.remarks_loading || 'N/A'}</Text></View>
          </View>
        </View>
      </Section>
      <View style={{ height: 15 }} />

      {/* E. CLIENT REQUIREMENT */}
      <Section title="E. CLIENT SPECIAL REQUIREMENT">
        <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 15 }}>
          <View style={{ backgroundColor: '#1F497D', padding: 5, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#fff' }}>E. CLIENT SPECIAL REQUIREMENT</Text>
          </View>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', backgroundColor: pdfColors.lightGray, borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={{ width: '10%', padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>No.</Text>
            </View>
            <View style={{ width: '65%', padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Client Requirements</Text>
            </View>
            <View style={{ width: '25%', padding: 4, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Result</Text>
            </View>
          </View>

          {/* Table Rows */}
          {((data?.clientRequirementTable) || []).length > 0 ? (
            data.clientRequirementTable.map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                <View style={{ width: '10%', padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{i + 1}.</Text>
                </View>
                <View style={{ width: '65%', padding: 4, borderRightWidth: 1, borderColor: '#000' }}>
                  <Text style={{ fontSize: 8 }}>{row.requirement || '/'}</Text>
                </View>
                <View style={{ width: '25%', padding: 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{row.result || 'Actual finding'}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
              <View style={{ width: '10%', padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }}><Text style={{ fontSize: 8 }}>1.</Text></View>
              <View style={{ width: '65%', padding: 4, borderRightWidth: 1, borderColor: '#000' }}><Text style={{ fontSize: 8 }}>/</Text></View>
              <View style={{ width: '25%', padding: 4, alignItems: 'center' }}><Text style={{ fontSize: 8 }}>Actual finding</Text></View>
            </View>
          )}

          {/* Overall Result */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
            <View style={{ width: '20%', backgroundColor: pdfColors.lightGray, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Result:</Text>
            </View>
            <View style={{ width: '80%', padding: 4 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: String(data.client_requirement_result || '').toLowerCase().includes('fail') ? pdfColors.danger : pdfColors.success }}>
                {data.client_requirement_result || 'Passed'}
              </Text>
            </View>
          </View>

          {/* Remark */}
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '20%', backgroundColor: pdfColors.lightGray, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Remark:</Text>
            </View>
            <View style={{ width: '80%', padding: 4 }}>
              <Text style={{ fontSize: 8 }}>{data.client_requirement_remark || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </Section>

      {/* F. PHOTOS */}
      <Section title="F. PHOTOS">
        {/* Photo Summary Table */}
        <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 15 }}>
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>F. PHOTOS</Text>
          </View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: pdfColors.lightGray }}>
            <View style={{ width: '10%', padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>No.</Text>
            </View>
            <View style={{ width: '90%', padding: 4, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Description</Text>
            </View>
          </View>
          
          {((data?.reportPhotoGroups) || []).filter(g => {
            const desc = (g.description || '').toLowerCase();
            return !desc.includes('remark') && !desc.includes('general');
          }).map((group, i, filtered) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderColor: '#000' }}>
              <View style={{ width: '10%', padding: 4, borderRightWidth: 1, borderColor: '#000', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{i + 1}</Text>
              </View>
              <View style={{ width: '90%', padding: 4 }}>
                <Text style={{ fontSize: 8 }}>{group.description || 'Inspection Photos'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actual Photos Grid */}
        {((data?.reportPhotoGroups) || []).filter(g => {
          const desc = (g.description || '').toLowerCase();
          return !desc.includes('remark') && !desc.includes('general');
        }).map((group, groupIdx) => (
          <View key={groupIdx} wrap={false} style={{ marginBottom: 20 }}>
            <View style={{ backgroundColor: pdfColors.lightGray, padding: 5, marginBottom: 10, borderLeftWidth: 3, borderColor: '#1F497D' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{group.description}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' }}>
              {(group.photos || []).map((photo, photoIdx) => (
                <View key={photoIdx} style={{ width: '50%', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#000' }}>
                  <View style={{ height: 200, padding: 2 }}>
                    {photo.preview && <Image src={photo.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </View>
                  <View style={{ padding: 4, borderTopWidth: 1, borderColor: '#000', alignItems: 'center', backgroundColor: pdfColors.lightGray }}>
                    <Text style={{ fontSize: 8 }}>{photo.label || `Photo ${photoIdx + 1}`}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Section>
    </View>
  );
}
