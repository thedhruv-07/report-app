import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../../styles';
import { getConclusionColor, blankIfEmpty } from '../../utils/reportUtils';

export default function Header({ data }) {
  const header = data?.reportHeader || {};
  const conclusion = (header.conclusion || "PENDING").toUpperCase();
  const conclusionColor = getConclusionColor(conclusion);
  
  // title not needed here; left intentionally omitted

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Standard Metadata Table (Matches DOCX Header) */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          <View style={[pdfStyles.tableCol, { width: '25%', padding: 10 }]}>
            <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>Absolute Veritas</Text>
          </View>
          <View style={[pdfStyles.column, { width: '45%' }]}>
            <View style={[pdfStyles.tableRow, { borderBottomWidth: 1, borderColor: pdfColors.border }]}>
              <View style={[pdfStyles.tableCol, { width: '40%', borderRightWidth: 0 }]}><Text style={pdfStyles.tableCellHeader}>Client Name:</Text></View>
              <View style={[pdfStyles.tableCol, { width: '60%', borderRightWidth: 0 }]}><Text style={pdfStyles.tableCell}>{blankIfEmpty(header.client)}</Text></View>
            </View>
            <View style={[pdfStyles.tableRow, { borderBottomWidth: 1, borderColor: pdfColors.border }]}>
              <View style={[pdfStyles.tableCol, { width: '40%', borderRightWidth: 0 }]}><Text style={pdfStyles.tableCellHeader}>Inspection No:</Text></View>
              <View style={[pdfStyles.tableCol, { width: '60%', borderRightWidth: 0 }]}><Text style={pdfStyles.tableCell}>{blankIfEmpty(header.inspectionNumber)}</Text></View>
            </View>
            <View style={pdfStyles.tableRow}>
              <View style={[pdfStyles.tableCol, { width: '40%', borderRightWidth: 0, borderBottomWidth: 0 }]}><Text style={pdfStyles.tableCellHeader}>Report Date:</Text></View>
              <View style={[pdfStyles.tableCol, { width: '60%', borderRightWidth: 0, borderBottomWidth: 0 }]}><Text style={pdfStyles.tableCell}>{blankIfEmpty(header.reportDate)}</Text></View>
            </View>
          </View>
          <View style={[pdfStyles.tableCol, { width: '30%', justifyContent: 'center', alignItems: 'center', backgroundColor: pdfColors.white }]}>
            <Text style={[pdfStyles.tableCellHeader, { borderBottomWidth: 0, backgroundColor: 'transparent' }]}>Conclusion</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: conclusionColor, marginTop: 5 }}>
              {conclusion}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
