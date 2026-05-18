import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../../styles';
import { blankIfEmpty } from '../../utils/reportUtils';

export default function Table({ headers = [], data = [], columns = [] }) {
  if (!data || data.length === 0) return null;

  return (
    <View style={pdfStyles.table}>
      {/* Table Header */}
      <View style={pdfStyles.tableRow}>
        {headers.map((header, i) => (
          <View 
            key={i} 
            style={[
              pdfStyles.tableCol, 
              { 
                backgroundColor: pdfColors.lightGray,
                width: columns[i]?.width || `${100 / headers.length}%`,
                ...(i === headers.length - 1 ? { borderRightWidth: 0 } : {})
              }
            ]}
          >
            <Text style={pdfStyles.tableCellHeader}>{header}</Text>
          </View>
        ))}
      </View>
      
      {/* Table Rows */}
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={pdfStyles.tableRow} wrap={false}>
          {columns.map((col, colIndex) => {
            const val = row[col.key];
            return (
              <View 
                key={colIndex} 
                style={[
                  pdfStyles.tableCol, 
                  { 
                    width: col.width || `${100 / headers.length}%`,
                    ...(colIndex === columns.length - 1 ? { borderRightWidth: 0 } : {})
                  }
                ]}
              >
                <Text style={pdfStyles.tableCell}>{blankIfEmpty(val)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
