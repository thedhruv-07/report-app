import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../../styles';
import { blankIfEmpty, getPassFailColor } from '../../utils/reportUtils';

import Section from '../components/Section';
import Table from '../components/Table';
import PhotoGrid from '../components/PhotoGrid';

export default function PSISections({ data }) {
  const quantityItems = data?.items || [];
  
  return (
    <View>
      {/* 1. General Information */}
      <Section title="I. GENERAL INFORMATION" hideHeader>
        <View style={{ borderWidth: 1, borderColor: pdfColors.border }}>
          {/* Header Title Row */}
          <View style={{ padding: 8, borderBottomWidth: 1, borderColor: pdfColors.border, alignItems: 'center', backgroundColor: pdfColors.white }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: pdfColors.primary }}>
              {data.servicePerformed || 'Pre-Shipment Inspection Report'}
            </Text>
          </View>

          {/* Section Sub-header Row */}
          <View style={{ backgroundColor: pdfColors.lightGray, padding: 6, borderBottomWidth: 1, borderColor: pdfColors.border }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#000000' }}>
              I. GENERAL INFORMATION
            </Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {/* Left Table */}
            <View style={{ width: '55%', borderRightWidth: 1, borderColor: pdfColors.border }}>
              {[
                { label: 'Service Performed', value: data.servicePerformed },
                { label: 'Client', value: data.client },
                { label: 'Supplier', value: data.supplier },
                { label: 'Factory', value: data.factory },
                { label: 'Product Name', value: data.productName },
                { label: 'P.O. No.', value: data.po },
                { label: 'Destination Country', value: data.country },
                { label: 'Inspection Date', value: data.inspectionDate },
                { label: 'Inspection Location', value: data.inspectionLocation }
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', borderBottomWidth: i === 8 ? 0 : 1, borderColor: pdfColors.border }}>
                  <View style={{ width: '40%', backgroundColor: pdfColors.lightGray, padding: 5, borderRightWidth: 1, borderColor: pdfColors.border }}>
                    <Text style={[pdfStyles.bold, { fontSize: 9 }]}>{item.label}:</Text>
                  </View>
                  <View style={{ width: '60%', padding: 5, backgroundColor: pdfColors.white }}>
                    <Text style={{ fontSize: 9 }}>{blankIfEmpty(item.value)}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Right Photo */}
            <View style={{ width: '45%', padding: 0, justifyContent: 'center', alignItems: 'center' }}>
              {data.generalPhoto || (data?.reportPhotoGroups?.[0]?.photos?.[0]?.preview) ? (
                <Image 
                  src={data.generalPhoto || data?.reportPhotoGroups?.[0]?.photos?.[0]?.preview} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <View style={{ padding: 10 }}>
                  <Text style={{ fontSize: 9, color: 'gray', fontStyle: 'italic' }}>No photo uploaded</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Section>

      {/* 2. Inspection Summary */}
      <Section title="II. INSPECTION SUMMARY">
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, { backgroundColor: pdfColors.lightGray }]}>
            <View style={[pdfStyles.tableCol, { width: '60%', padding: 5 }]}><Text style={pdfStyles.bold}>Category</Text></View>
            <View style={[pdfStyles.tableCol, { width: '40%', padding: 5, borderRightWidth: 0 }]}><Text style={pdfStyles.bold}>Result</Text></View>
          </View>
          {[
            { label: 'A. Quantity', value: data.quantity },
            { label: 'B. Workmanship', value: data.workmanship },
            { label: 'C. On-Site Tests', value: data.onSiteTests },
            { label: 'D. Dimensions', value: data.dimensions },
            { label: 'E. Packing', value: data.packingResult },
            { label: 'F. Marking & Labeling', value: data.marking_result_final },
            { label: 'G. Client Special Requirement', value: data.client_requirement_result }
          ].map((item, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <View style={[pdfStyles.tableCol, { width: '60%', padding: 5 }]}><Text>{item.label}</Text></View>
              <View style={[pdfStyles.tableCol, { width: '40%', padding: 5, borderRightWidth: 0 }]}>
                <Text style={{ color: getPassFailColor(item.value), fontWeight: 'bold' }}>{blankIfEmpty(item.value)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      {/* 3. Remarks */}
      <Section title="III. REMARKS">
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Problem Remarks:</Text>
          {(data.remarks || []).map((remark, i) => (
            <View key={i} style={{ marginBottom: 5 }}>
              <Text>{i + 1}. {remark}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* 4. Quantity (Using shared Table) */}
      <Section title="A. QUANTITY">
        <Table 
          headers={['P.O.', 'Item', 'Order Qty', 'Qty / Carton', 'Cartons']}
          data={quantityItems}
          columns={[
            { key: 'po', width: '20%' },
            { key: 'itemName', width: '35%' },
            { key: 'orderQty', width: '15%' },
            { key: 'qtyPerCarton', width: '15%' },
            { key: 'cartons', width: '15%' }
          ]}
        />
      </Section>
      
      {/* 5. Photos */}
      <Section title="PHOTOS">
        {data.reportPhotoGroups && data.reportPhotoGroups.map((group, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 12 }}>{group.description}</Text>
            <PhotoGrid photos={group.photos} />
          </View>
        ))}
      </Section>
    </View>
  );
}
