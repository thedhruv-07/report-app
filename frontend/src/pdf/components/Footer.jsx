import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';

export default function Footer({ serviceType }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>
        Absolute Veritas | {serviceType === 'cls' ? "Container Loading Supervision" : "Pre-Shipment Inspection"} Report
      </Text>
      <Text render={({ pageNumber, totalPages }) => (
        `Page ${pageNumber} of ${totalPages}`
      )} />
    </View>
  );
}
