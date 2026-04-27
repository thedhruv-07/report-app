import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';

export default function Section({ title, children, break: breakProp, hideHeader = false }) {
  return (
    <View style={{ marginBottom: 20 }} wrap={false} break={breakProp}>
      {!hideHeader && (
        <View style={pdfStyles.sectionTitleBox}>
          <Text style={pdfStyles.sectionTitle}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}
